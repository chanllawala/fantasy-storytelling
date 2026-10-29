/* UI controller for Tales Unwritten. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, area) { try { return (area || localStorage).getItem(k); } catch (e) { return null; } },
    set(k, v, area) { try { (area || localStorage).setItem(k, v); } catch (e) { /* storage unavailable */ } },
    del(k, area) { try { (area || localStorage).removeItem(k); } catch (e) { /* ignore */ } }
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ROLES = ['Knight', 'Mage', 'Rogue', 'Ranger', 'Bard', 'Druid'];
  const REALM_BIOME = { high: ['castle', 'dusk'], dark: ['ruins', 'night'], fairy: ['forest', 'dawn'], urban: ['village', 'night'], sea: ['sea', 'storm'], sword: ['desert', 'dusk'] };
  const GALLERY = [
    { t: 'The Whispering Wood', b: 'forest', tm: 'night', realm: 'fairy', p: 'an enchanted forest at night, glowing fireflies and giant mossy trees', d: 'Where silver lights lead travellers astray.' },
    { t: 'Emberwatch Keep', b: 'castle', tm: 'dusk', realm: 'high', p: 'a black glass castle on a cliff at sunset, banners snapping in the wind', d: 'A fortress that drinks the last light.' },
    { t: 'The Crystal Cavern', b: 'cave', tm: 'night', realm: 'dark', p: 'a vast cavern of glowing blue and violet crystals, a dragon hoard of gold', d: 'Every facet hums a different note.' },
    { t: 'Mirror Lake', b: 'sea', tm: 'dawn', realm: 'sea', p: 'a perfectly still misty lake at dawn with a drowned white city beneath the water', d: 'Where the sky appears twice.' },
    { t: 'Shrine of Pillars', b: 'ruins', tm: 'night', realm: 'dark', p: 'ancient broken stone pillars with glowing blue runes under a starry sky', d: 'The empty cushion waits for a crown.' },
    { t: 'Ashkarel Awakens', b: 'dragon', tm: 'dusk', realm: 'high', p: 'a colossal ember-scaled dragon flying over jagged mountains at sunset', d: 'Keeper of the Hollow Crown.' },
    { t: 'Emberhollow', b: 'village', tm: 'dusk', realm: 'fairy', p: 'a cosy fantasy village at dusk, lantern-lit windows, chimney smoke, cobbled lane', d: 'The Gilded Lantern never closes.' },
    { t: 'The Frostspire Pass', b: 'mountain', tm: 'dawn', realm: 'sword', p: 'towering snow-capped mountains at dawn with a narrow winding pass and an eagle', d: 'The old road to three kingdoms.' },
    { t: 'The Glass Dunes', b: 'desert', tm: 'dusk', realm: 'sword', p: 'a fantasy desert with giant dunes, a lone obelisk and a caravan at sunset', d: 'Sand that remembers every footstep.' },
    { t: 'The Mire of Lanterns', b: 'swamp', tm: 'night', realm: 'dark', p: 'a mystical swamp with twisted dead trees and glowing green wisps over black water', d: 'Do not follow the green lights.' }
  ];
  const TIMELINE = [
    ['Gap', 'The fine-tuned Mistral model could not be deployed; the prototype depended on a GPT-3.5 API key and a slow local model.', 'Delivered', 'The studio runs the Mistral family through a visitor-supplied key (nothing stored in the repo), with a built-in offline tale and no GPT dependency.'],
    ['Gap', 'Local generation took 1 to 2 minutes per segment.', 'Delivered', 'A hosted API replies in seconds, with a loading state, retry, and automatic fallback to the offline tale.'],
    ['Future work', 'Multi-modal storytelling: scene images and text-to-speech.', 'Delivered', 'Every scene is painted by a built-in fantasy scene generator (with endless variations and SVG download). Passages can be narrated through the browser speech engine.'],
    ['Limitation', 'Characters were inconsistent in long stories (3.39 / 5).', 'Delivered', 'The Chronicle tracks characters, places, items and the quest, and is fed back to the model every turn with a rolling summary.'],
    ['Feedback', 'Users wanted free-form actions "like Dungeons & Dragons" and choices with real effect.', 'Delivered', 'A custom action box beside the three choices; a choice ledger is sent to the model so decisions carry forward.'],
    ['Future work', 'Better evaluation: lexical metrics and Fantasy Vocabulary Density (FVD).', 'Delivered', 'The Analytics tab computes word count, sentence length, lexical diversity and FVD for each passage, live.'],
    ['Future work', 'Long-term memory and continuity across sessions.', 'Delivered', 'Tales autosave to the browser and can be continued, exported as Markdown, or revisited chapter by chapter in the Journal.'],
    ['Future work', 'Personalised, adaptive narratives.', 'Partial', 'Hero class, trait, realm and art style personalise the tale. Preference modelling is not implemented.'],
    ['Future work', 'Reinforcement learning for choice optimisation; larger fine-tuning corpus.', 'Open', 'Left as future research. They need training infrastructure and participant data beyond a static website.']
  ];
  const FANTASY = new Set(('dragon wizard sorcerer sorcery spell magic magical enchanted arcane rune runes realm kingdom throne crown sword blade shield armor knight quest prophecy elf elves dwarf goblin orc troll wyrm hoard relic amulet charm potion ancient forest shrine temple ruins mystic mist moonlit spirit spirits fae fairy ember silver glade citadel keep fortress warden guardian cavern crystal hollow oath curse blessing lantern staff sigil temple tome scroll legend myth mythic cloak hearth bard druid ranger rogue herald banner battlement gloaming twilight shadow phantom wraith lich undead phoenix griffin unicorn centaur nymph').split(/\s+/));

  /* ---------- scene art (procedural, generated locally) ---------- */
  const sceneSvg = (seg, role, variant) => Scenes.render(seg.biome, seg.time, seg.text.slice(0, 40) + (variant || ''), role, seg.look);
  function paint(el, svg) { el.innerHTML = svg; }
  function downloadSvg(name, svg) { download(name, svg, 'image/svg+xml'); }

  /* ---------- setup form ---------- */
  function buildSetup() {
    $('roles').innerHTML = ROLES.map((r, i) => `<label class="chip"><input type="radio" name="role" value="${r}" ${i === 1 ? 'checked' : ''}><span>${r}</span></label>`).join('');
    $('realms').innerHTML = Object.entries(Engine.REALMS).map(([k, v], i) => {
      const [b, t] = REALM_BIOME[k];
      return `<label class="realm"><input type="radio" name="realm" value="${k}" ${i === 0 ? 'checked' : ''}><span class="realm-art">${Scenes.render(b, t, k, 'Mage')}</span><b>${v.name}</b></label>`;
    }).join('');
    $('conjureRole').innerHTML = ROLES.map((r) => `<option>${r}</option>`).join('');
    $('keyRow').hidden = false;
    document.querySelectorAll('input[name=engine]').forEach((r) => r.addEventListener('change', () => { $('keyRow').hidden = document.querySelector('input[name=engine]:checked').value !== 'mistral'; }));
    const saved = store.get('tales.key') || store.get('tales.key', sessionStorage);
    if (saved) { $('apiKey').value = saved; $('rememberKey').checked = !!store.get('tales.key'); }
    if (store.get('tales.save')) $('continueBtn').hidden = false;
  }

  /* ---------- play state ---------- */
  let viewIdx = 0, typing = null, busy = false;

  function cfgFromForm() {
    const realm = document.querySelector('input[name=realm]:checked').value;
    return {
      name: $('heroName').value.trim() || 'Elara', trait: $('heroTrait').value.trim(),
      role: document.querySelector('input[name=role]:checked').value, realm,
      seed: $('seedIdea').value.trim(),
      engine: document.querySelector('input[name=engine]:checked').value,
      narrate: $('autoNarrate').checked
    };
  }

  async function begin(cfg) {
    const key = $('apiKey').value.trim();
    Engine.setKey(key);
    const noKey = cfg.engine === 'mistral' && !key;
    if (noKey) cfg.engine = 'offline';
    hideNotice();
    Engine.reset(cfg);
    $('setup').hidden = true; $('play').hidden = false;
    if (noKey) showNotice('No Mistral key entered, so the offline tale is used. Add a key to unlock live generation.');
    $('play').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    await advance(null);
    // remember the key only once the first live call has succeeded
    if (key && Engine.state.history[0] && Engine.state.history[0].source === 'mistral') {
      if ($('rememberKey').checked) { store.set('tales.key', key); store.del('tales.key', sessionStorage); } else { store.set('tales.key', key, sessionStorage); store.del('tales.key'); }
    }
  }

  async function advance(action) {
    if (busy) return;
    busy = true; setLoading(true);
    try {
      const seg = await Engine.step(action);
      if (seg.fallbackReason) showNotice(`Live model unavailable (${seg.fallbackReason}). Continuing with the offline tale.`);
      viewIdx = Engine.state.history.length - 1;
      show(viewIdx, true);
      store.set('tales.save', Engine.serialize());
    } catch (e) {
      if (!Engine.state.history.length) { $('play').hidden = true; $('setup').hidden = false; }
      showNotice(e.message);
    } finally { busy = false; setLoading(false); }
  }

  function setLoading(on) {
    $('loading').hidden = !on;
    document.querySelectorAll('#choices button, #customForm button, #customInput').forEach((b) => { b.disabled = on; });
  }
  function showNotice(m) { const n = $('play').hidden ? $('setupNotice') : $('notice'); n.textContent = m; n.hidden = false; }
  function hideNotice() { $('notice').hidden = true; $('setupNotice').hidden = true; }

  function show(i, animate) {
    const st = Engine.state, seg = st.history[i], latest = i === st.history.length - 1;
    if (!seg) return;
    $('turnBadge').textContent = `Chapter ${i + 1}`;
    $('modeBadge').textContent = seg.source === 'mistral' ? 'Mistral live' : 'Offline tale';
    $('sceneCaption').textContent = `${seg.biome} · ${seg.time} · ${seg.mood || 'wonder'}`;
    paint($('sceneArt'), sceneSvg(seg, st.cfg.role, seg.variant));
    renderPassage(seg.text, animate && !reduceMotion);

    const box = $('choices'); box.innerHTML = '';
    if (!latest) {
      box.innerHTML = '<button class="choice back" type="button">Return to the present chapter</button>';
      box.firstChild.onclick = () => { viewIdx = st.history.length - 1; show(viewIdx); };
    } else if (seg.ending || !seg.choices.length) {
      box.innerHTML = '<div class="the-end">The tale has ended.</div><button class="choice" type="button">Begin a new tale</button>';
      box.querySelector('button').onclick = restart;
    } else {
      seg.choices.forEach((c, n) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'choice'; b.innerHTML = `<i>${'ABC'[n]}</i><span>${esc(c.label)}</span>`;
        b.onclick = () => advance({ kind: 'choice', text: c.label, to: c.to });
        box.appendChild(b);
      });
    }
    $('customForm').hidden = !(latest && !seg.ending && seg.choices.length);
    renderChronicle(); renderJournal(); renderMetrics(seg.text);
    if (st.cfg.narrate && latest) narrate(true);
  }

  function renderPassage(text, animate) {
    clearInterval(typing);
    const el = $('passage');
    const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    if (!animate) { el.innerHTML = paras.map((p) => `<p>${esc(p)}</p>`).join(''); return; }
    const words = text.split(/(\s+)/); let n = 0, out = '';
    const total = words.length;
    typing = setInterval(() => {
      n += 4; out = words.slice(0, n).join('');
      el.innerHTML = out.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('');
      if (n >= total) clearInterval(typing);
    }, 28);
    el.onclick = () => { clearInterval(typing); el.innerHTML = paras.map((p) => `<p>${esc(p)}</p>`).join(''); };
  }

  /* ---------- sidebar ---------- */
  function list(items, empty) { return items.length ? `<ul>${items.join('')}</ul>` : `<p class="muted">${empty}</p>`; }
  function renderChronicle() {
    const st = Engine.state, w = st.world, c = st.cfg;
    $('cardHero').innerHTML = `<p><b>${esc(c.name)}</b>, ${esc(c.role)}</p><p class="muted">${esc(Engine.REALMS[c.realm].name)}${c.trait ? ' · ' + esc(c.trait) : ''}</p><p class="muted">Mood: ${esc(w.mood || 'wonder')}</p>`;
    $('cardChars').innerHTML = list(Object.entries(w.characters).map(([n, d]) => `<li><b>${esc(n)}</b><small>${esc(d)}</small></li>`), 'No one yet.');
    $('cardPlaces').innerHTML = list(w.places.map((p) => `<li>${esc(p)}</li>`), 'Unexplored.');
    $('cardItems').innerHTML = list(w.items.map((p) => `<li>${esc(p)}</li>`), 'Empty-handed.');
    $('cardQuest').innerHTML = w.quest ? `<p>${esc(w.quest)}</p>` : '<p class="muted">Not yet known.</p>';
  }
  function renderJournal() {
    const st = Engine.state;
    $('journalList').innerHTML = st.history.map((s, i) => `<li><button type="button" data-i="${i}" class="${i === viewIdx ? 'on' : ''}"><span class="thumb">${Scenes.render(s.biome, s.time, s.text.slice(0, 40), st.cfg.role)}</span><span><b>Chapter ${i + 1}</b><small>${esc(s.text.slice(0, 70))}&hellip;</small></span></button></li>`).join('');
    $('journalList').querySelectorAll('button').forEach((b) => { b.onclick = () => { viewIdx = +b.dataset.i; show(viewIdx); }; });
  }
  function metricsFor(text) {
    const words = (text.toLowerCase().match(/[a-z']+/g) || []);
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || [text]).length;
    const uniq = new Set(words).size;
    const fant = words.filter((w) => FANTASY.has(w)).length;
    return { words: words.length, sentLen: words.length / sentences, ld: words.length ? uniq / words.length : 0, fvd: words.length ? fant / words.length : 0 };
  }
  function renderMetrics(text) {
    const all = Engine.state.history.map((s) => metricsFor(s.text));
    const m = metricsFor(text), avg = (k) => all.reduce((a, b) => a + b[k], 0) / all.length;
    const row = (l, v, a, f) => `<tr><th>${l}</th><td>${f(v)}</td><td>${f(a)}</td></tr>`;
    $('metrics').innerHTML = `<table class="mt"><thead><tr><th></th><th>This chapter</th><th>Tale average</th></tr></thead><tbody>`
      + row('Words', m.words, avg('words'), (x) => Math.round(x))
      + row('Avg sentence length', m.sentLen, avg('sentLen'), (x) => x.toFixed(1))
      + row('Lexical diversity', m.ld, avg('ld'), (x) => x.toFixed(2))
      + row('Fantasy vocab density', m.fvd, avg('fvd'), (x) => (x * 100).toFixed(1) + '%')
      + `</tbody></table><p class="note">Metrics from the dissertation's evaluation (type-token ratio, sentence length) plus the proposed Fantasy Vocabulary Density (FVD), computed in your browser against a small fantasy lexicon. Short passages score higher on diversity, so compare like with like.</p>`;
  }

  /* ---------- narration, export, ratings ---------- */
  function narrate(auto) {
    if (!('speechSynthesis' in window)) { if (!auto) showNotice('Narration is not supported in this browser.'); return; }
    const syn = window.speechSynthesis;
    if (syn.speaking) { syn.cancel(); if (!auto) return; }
    const seg = Engine.state.history[viewIdx]; if (!seg) return;
    const u = new SpeechSynthesisUtterance(seg.text); u.rate = 0.95; u.pitch = 0.9;
    syn.speak(u);
  }
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportMd() {
    const st = Engine.state, c = st.cfg;
    const md = [`# ${c.name} the ${c.role}: a ${Engine.REALMS[c.realm].name} tale`, '', `*Generated with Tales Unwritten (${st.history[0].source === 'mistral' ? 'Mistral' : 'offline tale'}).*`, '']
      .concat(st.history.map((s, i) => `## Chapter ${i + 1}\n\n${s.text}\n`)).join('\n');
    download('my-tale.md', md, 'text/markdown');
  }
  function restart() {
    window.speechSynthesis && window.speechSynthesis.cancel();
    store.del('tales.save'); $('continueBtn').hidden = true;
    $('play').hidden = true; $('setup').hidden = false; hideNotice();
    $('studio').scrollIntoView({ behavior: 'smooth' });
  }

  const DIMS = [['story_quality', 'Story quality'], ['character_believability', 'Character believability'], ['world_building', 'World-building'], ['choice_quality', 'Choice quality']];
  let ratings = {};
  function buildRating() {
    $('starRows').innerHTML = DIMS.map(([k, l]) => `<div class="starrow" data-k="${k}"><span>${l}</span><span class="stars" role="radiogroup" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" data-n="${n}" aria-label="${n} stars">&#9733;</button>`).join('')}</span></div>`).join('');
    $('starRows').querySelectorAll('.starrow').forEach((row) => row.querySelectorAll('button').forEach((b) => b.onclick = () => {
      ratings[row.dataset.k] = +b.dataset.n;
      row.querySelectorAll('button').forEach((x) => { const on = +x.dataset.n <= +b.dataset.n; x.classList.toggle('on', on); x.setAttribute('aria-checked', +x.dataset.n === +b.dataset.n); });
    }));
    $('rateForm').onsubmit = (e) => {
      e.preventDefault();
      if (DIMS.some(([k]) => !ratings[k])) { $('rateStatus').textContent = 'Please rate all four dimensions.'; return; }
      const all = JSON.parse(store.get('tales.ratings') || '[]');
      all.push(Object.assign({ timestamp: new Date().toISOString(), model: Engine.state.history[0].source === 'mistral' ? 'mistral' : 'offline' }, ratings, { comments: $('rateComment').value.replace(/\s+/g, ' ').trim() }));
      store.set('tales.ratings', JSON.stringify(all));
      $('rateStatus').textContent = `Thank you. ${all.length} rating(s) saved on this device.`;
      ratings = {}; $('rateComment').value = ''; $('starRows').querySelectorAll('button').forEach((x) => x.classList.remove('on'));
    };
    $('btnCsv').onclick = () => {
      const all = JSON.parse(store.get('tales.ratings') || '[]');
      if (!all.length) { $('rateStatus').textContent = 'No ratings yet.'; return; }
      const cols = ['timestamp', 'model'].concat(DIMS.map((d) => d[0]), 'comments');
      download('story_ratings.csv', [cols.join(',')].concat(all.map((r) => cols.map((c) => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(','))).join('\n'), 'text/csv');
    };
  }

  /* ---------- gallery, lightbox, conjure ---------- */
  let lbItem = null;
  function buildGallery() {
    $('galleryGrid').innerHTML = GALLERY.map((g, i) => `<button class="gcard" type="button" data-i="${i}"><div class="gart">${Scenes.render(g.b, g.tm, g.t, ROLES[i % ROLES.length])}</div><span class="gcap"><b>${g.t}</b><small>${g.d}</small></span></button>`).join('');
    $('galleryGrid').querySelectorAll('.gcard').forEach((c) => { c.onclick = () => openLightbox(+c.dataset.i); });
  }
  let lbVariant = '', lbSvg = '';
  function openLightbox(i, reroll) {
    const g = GALLERY[i]; lbItem = i;
    lbVariant = reroll ? String(Math.random()) : '';
    $('lbTitle').textContent = g.t; $('lbText').textContent = g.d;
    lbSvg = Scenes.render(g.b, g.tm, g.t + lbVariant, ROLES[i % ROLES.length]);
    paint($('lbArt'), lbSvg);
    if (!$('lightbox').open) $('lightbox').showModal();
  }
  function buildLightbox() {
    $('lbReroll').onclick = () => openLightbox(lbItem, true);
    $('lbSave').onclick = () => downloadSvg('realm.svg', lbSvg);
    $('lbBegin').onclick = () => {
      const g = GALLERY[lbItem]; $('lightbox').close();
      document.querySelector(`input[name=realm][value=${g.realm}]`).checked = true;
      $('seedIdea').value = g.p; $('play').hidden = true; $('setup').hidden = false;
      $('studio').scrollIntoView({ behavior: 'smooth' });
    };
    $('lightbox').addEventListener('click', (e) => { if (e.target === $('lightbox')) $('lightbox').close(); });
    $('btnFull').onclick = () => {
      const seg = Engine.state.history[viewIdx]; if (!seg) return;
      $('lbTitle').textContent = `Chapter ${viewIdx + 1}`; $('lbText').textContent = seg.imagePrompt; lbItem = null;
      lbSvg = sceneSvg(seg, Engine.state.cfg.role, seg.variant); paint($('lbArt'), lbSvg);
      document.querySelector('.lb-meta .row').hidden = true; $('lightbox').showModal();
      $('lightbox').addEventListener('close', () => { document.querySelector('.lb-meta .row').hidden = false; }, { once: true });
    };
    let conj = 0, conjSvg = '';
    const conjure = () => {
      const p = $('conjurePrompt').value.trim(); if (!p) return;
      const det = Scenes.detect(p), role = $('conjureRole').value, out = $('conjureOut');
      conjSvg = Scenes.render(det.biome, det.time, p + conj, role);
      out.hidden = false;
      out.innerHTML = `<div class="gart big">${conjSvg}</div><div class="row"><span class="badge">${det.biome} &middot; ${det.time}</span><button class="btn small" type="button" id="conjAgain">Another variation</button><button class="btn small" type="button" id="conjSave">Download SVG</button></div>`;
      $('conjAgain').onclick = () => { conj++; conjure(); };
      $('conjSave').onclick = () => downloadSvg('conjured-scene.svg', conjSvg);
    };
    $('conjureForm').onsubmit = (e) => { e.preventDefault(); conj = 0; conjure(); };
    $('btnReroll').onclick = () => {
      const seg = Engine.state.history[viewIdx]; if (!seg) return;
      seg.variant = String(Math.random());
      paint($('sceneArt'), sceneSvg(seg, Engine.state.cfg.role, seg.variant));
    };
  }

  /* ---------- misc UI ---------- */
  function buildTimeline() {
    $('timeline').innerHTML = TIMELINE.map((t) => `<div class="tl"><div class="was"><span class="tag">${t[0]}</span><p>${t[1]}</p></div><div class="now ${t[2].toLowerCase()}"><span class="tag">${t[2]}</span><p>${t[3]}</p></div></div>`).join('');
  }
  function embers() {
    const cv = $('embers'), ctx = cv.getContext('2d'); if (!ctx || reduceMotion) return;
    let w, h, ps = [];
    const size = () => { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; ps = Array.from({ length: Math.min(70, Math.floor(w / 18)) }, () => spawn(true)); };
    const spawn = (init) => ({ x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: Math.random() * 2 + 0.6, v: Math.random() * 0.5 + 0.2, d: Math.random() * Math.PI * 2, c: Math.random() > 0.5 ? '255,176,80' : '170,190,255' });
    size(); addEventListener('resize', size);
    let run = true; document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) loop(); });
    function loop() {
      if (!run) return; ctx.clearRect(0, 0, w, h);
      ps.forEach((p, i) => {
        p.y -= p.v; p.d += 0.02; p.x += Math.sin(p.d) * 0.4;
        if (p.y < -10) ps[i] = spawn();
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(${p.c},.9)`); g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 7); ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    loop();
  }
  function wireTabs() {
    document.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => {
      document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== 'tab-' + b.dataset.tab; });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildSetup(); buildGallery(); buildLightbox(); buildTimeline(); buildRating(); wireTabs(); embers(); Charts.init();
    $('setup').onsubmit = (e) => { e.preventDefault(); begin(cfgFromForm()); };
    $('continueBtn').onclick = () => {
      try {
        Engine.setKey($('apiKey').value.trim()); Engine.restore(store.get('tales.save'));
        $('setup').hidden = true; $('play').hidden = false; viewIdx = Engine.state.history.length - 1; show(viewIdx);
      } catch (err) { showNotice('Could not restore the saved tale.'); store.del('tales.save'); $('continueBtn').hidden = true; }
    };
    $('customForm').onsubmit = (e) => { e.preventDefault(); const t = $('customInput').value.trim(); if (!t) return; $('customInput').value = ''; advance({ kind: 'custom', text: t }); };
    $('btnNarrate').onclick = () => narrate(false);
    $('btnExport').onclick = exportMd;
    $('btnRestart').onclick = () => { if (confirm('Abandon this tale and start a new one?')) restart(); };
    $('navToggle').onclick = () => { const o = $('menu').classList.toggle('open'); $('navToggle').setAttribute('aria-expanded', o); };
    $('menu').addEventListener('click', () => { $('menu').classList.remove('open'); });
    const header = $('nav'); addEventListener('scroll', () => header.classList.toggle('solid', scrollY > 40), { passive: true });
  });
})();
