/* Story engine: prompt assembly, state tracking, Mistral API (bring-your-own key) and offline fallback.
   Mirrors the dissertation architecture: prompt engineering + dynamic state tracking + structured parsing. */
(function (global) {
  'use strict';

  const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
  const MISTRAL_MODEL = 'mistral-small-latest';
  const MAX_TURNS = 8;

  const REALMS = {
    high: { name: 'High Fantasy', guide: 'epic quests, ancient prophecies, noble heroes, elves, dragons and grand magic' },
    dark: { name: 'Dark Fantasy', guide: 'grim, atmospheric, morally grey, haunted ruins, costly magic and creeping dread (no graphic gore)' },
    fairy: { name: 'Fairy Tale', guide: 'whimsical, lyrical, talking animals, enchanted woods, riddles and gentle wonder' },
    urban: { name: 'Urban Fantasy', guide: 'hidden magic inside a modern city, secret guilds, spirits in alleyways and neon-lit enchantment' },
    sea: { name: 'Mythic Seas', guide: 'storm-wracked oceans, sunken cities, sea gods, island kingdoms and ship-borne adventure' },
    sword: { name: 'Sword & Sorcery', guide: 'gritty mercenaries, forbidden sorcery, crumbling empires and fast, punchy action' }
  };

  const state = { cfg: null, turn: 0, history: [], summaries: [], world: null, ledger: [], current: null, key: '' };

  function freshWorld() { return { characters: {}, places: [], items: [], quest: '', mood: 'wonder' }; }

  function addUnique(list, v) { v = String(v || '').trim(); if (v && !list.includes(v)) list.push(v); }

  function applyState(update) {
    if (!update) return;
    const w = state.world;
    (update.characters || []).forEach((c) => {
      if (Array.isArray(c)) w.characters[c[0]] = c[1];
      else if (c && c.name) w.characters[c.name] = c.note || w.characters[c.name] || '';
    });
    (update.places || []).forEach((p) => addUnique(w.places, p));
    (update.items || []).forEach((i) => addUnique(w.items, i));
    if (update.quest) w.quest = update.quest;
    if (update.mood) w.mood = update.mood;
  }

  function fill(t) {
    const c = state.cfg;
    const art = /^[aeiou]/i.test(c.role) ? 'an' : 'a';
    return t.replace(/\{hero\}/g, c.name).replace(/\{role\}/g, c.role.toLowerCase()).replace(/\{article\}/g, art);
  }

  function offlineSegment(id, action) {
    const node = global.Tales.nodes[id];
    applyState(node.state);
    let text = fill(node.text);
    if (action && action.kind === 'custom') {
      const lines = global.Tales.improv[node.biome] || global.Tales.improv.forest;
      text = `You decide to ${action.text.replace(/[.!]+$/, '')}. ${lines[state.turn % lines.length]} The world does not stop to explain itself, but it remembers.\n\n${text}`;
    }
    return {
      text, choices: node.choices.map((c) => ({ label: c[0], to: c[1] })),
      biome: node.biome, time: node.time, mood: node.mood, ending: !!node.ending, nodeId: id,
      imagePrompt: `${node.biome} fantasy landscape at ${node.time}, ${node.mood} mood`, source: 'offline'
    };
  }

  function stateBrief() {
    const w = state.world, c = state.cfg;
    return JSON.stringify({
      hero: { name: c.name, role: c.role, trait: c.trait || undefined },
      characters: w.characters, places: w.places.slice(-8), items: w.items.slice(-8), quest: w.quest, mood: w.mood,
      choices_made: state.ledger.slice(-6)
    });
  }

  function systemPrompt(final) {
    const r = REALMS[state.cfg.realm] || REALMS.high;
    return `You are the Loremaster, narrator of a ${r.name} interactive story (${r.guide}). Write in second person, present-leaning, vivid and genre-faithful, with fantasy-specific vocabulary and consistent world rules.
Return ONLY valid JSON with exactly these keys:
{"story": "110-160 words of narration continuing the tale",
 "choices": ${final ? '[]' : '[exactly 3 distinct actions, each at most 12 words, each leading in a different direction]'},
 "biome": "one of forest|mountain|castle|sea|cave|ruins|village|desert|swamp|dragon",
 "time": "one of dawn|day|dusk|night|storm",
 "image_prompt": "one sentence describing the visible scene, no text or names",
 "state_update": {"characters":[{"name":"","note":""}],"places":[],"items":[],"quest":"","mood":""},
 "summary": "one sentence summary of this passage"}
Rules: never contradict the STORY STATE; honour the player's chosen action and any custom action faithfully but within the world's rules; keep content family-friendly. ${final ? 'This is the FINAL passage: bring the tale to a satisfying close and end the story with THE END.' : ''}`;
  }

  function parseJSON(raw) {
    let t = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('No JSON in model output');
    t = t.slice(a, b + 1);
    try { return JSON.parse(t); } catch (e) { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1').replace(/[\u0000-\u001f]+/g, ' ')); }
  }

  async function callMistral(messages) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch(MISTRAL_URL, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.key}` },
        body: JSON.stringify({ model: MISTRAL_MODEL, messages, temperature: 0.85, max_tokens: 900, response_format: { type: 'json_object' } })
      });
      if (res.status === 401) throw new Error('Mistral rejected the API key (401). Check it and try again.');
      if (res.status === 429) throw new Error('Mistral rate limit reached (429). Wait a moment and retry.');
      if (!res.ok) throw new Error(`Mistral error ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } finally { clearTimeout(to); }
  }

  async function liveSegment(action) {
    const final = state.turn >= MAX_TURNS - 1;
    const last = state.history[state.history.length - 1];
    const user = [
      `STORY STATE: ${stateBrief()}`,
      state.summaries.length ? `STORY SO FAR: ${state.summaries.slice(-6).join(' ')}` : 'This is the opening passage of the story.',
      last ? `LAST PASSAGE: ${last.text.slice(0, 900)}` : '',
      action ? `PLAYER ACTION (${action.kind}): ${action.text}` : `OPENING PREMISE: ${state.cfg.seed || 'a hero begins an adventure'}`
    ].filter(Boolean).join('\n\n');
    const messages = [{ role: 'system', content: systemPrompt(final) }, { role: 'user', content: user }];
    let obj, lastErr;
    for (let i = 0; i < 2 && !obj; i++) {
      try { obj = parseJSON(await callMistral(messages)); if (!obj.story) throw new Error('Empty story'); } catch (e) {
        lastErr = e; if (/401|429|rate|rejected/i.test(e.message)) throw e;
      }
    }
    if (!obj) throw lastErr || new Error('Model failed');
    applyState(obj.state_update);
    if (obj.summary) state.summaries.push(obj.summary);
    const det = global.Scenes.detect(obj.story, { biome: obj.biome, time: obj.time });
    const biome = global.Scenes.BIOMES.includes(obj.biome) ? obj.biome : det.biome;
    const time = global.Scenes.TIMES.includes(obj.time) ? obj.time : det.time;
    const choices = final ? [] : (obj.choices || []).slice(0, 3).map((c) => ({ label: typeof c === 'string' ? c : (c.label || c.text || '') })).filter((c) => c.label);
    return {
      text: obj.story, choices, biome, time, mood: state.world.mood, ending: final || !choices.length,
      imagePrompt: obj.image_prompt || `${biome} fantasy scene at ${time}`, source: 'mistral'
    };
  }

  const Engine = {
    REALMS, MAX_TURNS, state,
    hasKey() { return !!state.key; },
    setKey(k) { state.key = (k || '').trim(); },
    reset(cfg) {
      state.cfg = cfg; state.turn = 0; state.history = []; state.summaries = []; state.ledger = [];
      state.world = freshWorld(); state.world.places = [];
      state.current = null;
    },
    async step(action) {
      let seg;
      const cfg = state.cfg;
      Engine.lastError = null;
      if (action) state.ledger.push(`T${state.turn}: ${action.text}`);
      if (cfg.engine === 'mistral' && state.key) {
        try { seg = await liveSegment(action); } catch (e) {
          if (/401|rejected/.test(e.message)) throw e;
          seg = null; Engine.lastError = e.message;
        }
      }
      if (!seg) {
        const id = action && action.to && global.Tales.nodes[action.to] ? action.to : (action ? (state.current && state.current.nodeId) || global.Tales.startId : global.Tales.startId);
        seg = offlineSegment(id, action);
        if (cfg.engine === 'mistral' && Engine.lastError) seg.fallbackReason = Engine.lastError;
      }
      state.current = seg;
      state.history.push(seg);
      state.turn += 1;
      return seg;
    },
    serialize() { return JSON.stringify({ cfg: state.cfg, turn: state.turn, history: state.history, summaries: state.summaries, world: state.world, ledger: state.ledger }); },
    restore(json) {
      const o = JSON.parse(json);
      state.cfg = o.cfg; state.turn = o.turn; state.history = o.history; state.summaries = o.summaries || [];
      state.world = o.world; state.ledger = o.ledger || []; state.current = o.history[o.history.length - 1] || null;
    }
  };

  global.Engine = Engine;
})(window);
