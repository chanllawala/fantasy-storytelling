/* Procedural fantasy scenes: instant, offline SVG art used as a placeholder and as a fallback
   whenever AI image generation is slow or unavailable. */
(function (global) {
  'use strict';

  let uidCounter = 0;
  const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const rng = (seed) => { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };

  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };

  const SKY = {
    dawn: ['#2b1b4a', '#c0507a', '#ffc58a'],
    day: ['#2c6fb0', '#6fb7e8', '#e8f4ff'],
    dusk: ['#1a1038', '#8a3a6a', '#ff8d4d'],
    night: ['#04040f', '#0d1236', '#27346b'],
    storm: ['#15181f', '#2f3641', '#566070']
  };

  const KEYWORDS = {
    dragon: /dragon|wyrm|drake|hoard|scales/i,
    castle: /castle|keep|tower|throne|fortress|palace|battlement|citadel/i,
    cave: /cave|cavern|tunnel|dungeon|crypt|mine|underground|vault/i,
    sea: /\bsea\b|ship|ocean|harbou?r|wave|shore|island|lake|ferry|river/i,
    mountain: /mountain|peak|cliff|crag|snow|summit|pass\b/i,
    ruins: /ruin|temple|shrine|altar|tomb|ancient|rune|obelisk|statue/i,
    village: /village|town|inn\b|tavern|market|street|cottage|hamlet/i,
    desert: /desert|dune|sand|oasis|caravan/i,
    swamp: /swamp|marsh|bog|mire|fen\b/i,
    forest: /forest|wood|tree|grove|glade|thicket|oak|fern/i
  };
  const TIMES = [
    ['storm', /storm|thunder|rain|lightning|tempest/i],
    ['night', /night|moon|midnight|star|darkness|torch/i],
    ['dawn', /dawn|sunrise|morning|first light/i],
    ['dusk', /dusk|sunset|evening|twilight|gloaming/i]
  ];

  function detect(text, fallback) {
    const out = { biome: (fallback && fallback.biome) || 'forest', time: (fallback && fallback.time) || 'dusk' };
    let best = 0;
    for (const k in KEYWORDS) {
      const n = (text.match(new RegExp(KEYWORDS[k].source, 'gi')) || []).length;
      if (n > best) { best = n; out.biome = k; }
    }
    for (const [t, re] of TIMES) if (re.test(text)) { out.time = t; break; }
    return out;
  }

  function ridge(r, y, amp, steps, w) {
    let d = `M0 ${w.h}L0 ${y}`;
    for (let i = 1; i <= steps; i++) d += `L${(w.w / steps) * i} ${(y - r() * amp).toFixed(1)}`;
    return d + `L${w.w} ${w.h}Z`;
  }

  function pine(x, y, h, fill) {
    const w = h * 0.34;
    let d = '';
    for (let i = 0; i < 4; i++) {
      const top = y - h + i * h * 0.22, bw = w * (0.45 + i * 0.28);
      d += `M${x} ${top}L${x - bw} ${top + h * 0.34}L${x + bw} ${top + h * 0.34}Z`;
    }
    return `<path d="${d}" fill="${fill}"/><rect x="${x - 2}" y="${y - 6}" width="4" height="8" fill="${fill}"/>`;
  }

  function glowCircle(cx, cy, r, color, id) {
    return `<circle cx="${cx}" cy="${cy}" r="${r * 3}" fill="url(#${id})"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
  }

  function hero(x, y, role, glow) {
    const body = '#05050a';
    let gear = '';
    switch ((role || '').toLowerCase()) {
      case 'knight': gear = `<rect x="14" y="-34" width="3" height="40" fill="#9aa4b8"/><rect x="9" y="-22" width="13" height="3" fill="#9aa4b8"/><path d="M-22 -34l10 4v14c0 7-5 10-10 12-5-2-10-5-10-12v-14z" fill="#2a3350"/>`; break;
      case 'rogue': gear = `<path d="M13 -18l9 -8-2 12z" fill="#9aa4b8"/>`; break;
      case 'ranger': gear = `<path d="M16 -60q22 30 0 60" fill="none" stroke="#6b4a2b" stroke-width="2.5"/><path d="M16 -60v60" stroke="#c9b38a" stroke-width="1"/>`; break;
      case 'bard': gear = `<ellipse cx="17" cy="-12" rx="8" ry="10" fill="#6b4a2b"/><rect x="16" y="-42" width="2.5" height="26" fill="#6b4a2b"/>`; break;
      case 'druid': gear = `<path d="M15 4V-66M15 -50l-9-12M15 -44l10-12M15 -62l-4-10M15 -62l5-9" stroke="#3b5a3a" stroke-width="2.5" fill="none"/>` + glowCircle(15, -66, 3, glow, 'hglow'); break;
      default: gear = `<rect x="14" y="-64" width="2.6" height="68" fill="#4a3a28"/>` + glowCircle(15, -68, 4.5, glow, 'hglow');
    }
    return `<g transform="translate(${x} ${y})"><path d="M-11 4L-6 -38Q0 -52 6 -38L11 4Z" fill="${body}"/><circle cy="-47" r="7" fill="${body}"/><path d="M-9 -42q9 -12 18 0l-4 -8h-10z" fill="${body}"/>${gear}</g>`;
  }

  function windowsRow(r, x, y, w, h, n, color) {
    let s = '';
    for (let i = 0; i < n; i++) if (r() > 0.35) s += `<rect x="${x + r() * (w - 6)}" y="${y + r() * (h - 14)}" width="4" height="7" fill="${color}"/>`;
    return s;
  }

  function render(biome, time, seedText, role) {
    biome = KEYWORDS[biome] ? biome : 'forest';
    time = SKY[time] ? time : 'dusk';
    const seed = hash(`${seedText || ''}|${biome}|${time}`);
    const r = rng(seed);
    const W = 800, H = 450, w = { w: W, h: H };
    const [s0, s1, s2] = SKY[time];
    const night = time === 'night' || time === 'storm';
    const glow = night ? '#ffcf70' : '#ffe39b';
    const far = mix(s1, '#000000', night ? 0.55 : 0.3);
    const mid = mix(s1, '#000000', night ? 0.72 : 0.5);
    const near = mix(s0, '#000000', 0.82);
    const ground = '#06060c';
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${biome} scene at ${time}">`;
    svg += `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s0}"/><stop offset=".55" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>`
      + `<radialGradient id="hglow"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>`
      + `<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s2}" stop-opacity="0"/><stop offset="1" stop-color="${s2}" stop-opacity=".35"/></linearGradient></defs>`;
    svg += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;

    if (night || time === 'dawn' || time === 'dusk') {
      const n = night ? 90 : 30;
      for (let i = 0; i < n; i++) svg += `<circle class="tw" style="animation-delay:-${(r() * 4).toFixed(1)}s" cx="${(r() * W).toFixed(0)}" cy="${(r() * H * 0.55).toFixed(0)}" r="${(r() * 1.2 + 0.3).toFixed(1)}" fill="#fff" opacity="${(r() * 0.7 + 0.2).toFixed(2)}"/>`;
    }
    const orbX = 120 + r() * 560, orbY = 70 + r() * 70;
    if (time !== 'storm') {
      const orb = night ? '#eef2ff' : (time === 'day' ? '#fff6cf' : '#ffd08a');
      svg += `<circle cx="${orbX}" cy="${orbY}" r="${night ? 90 : 130}" fill="${orb}" opacity=".12"/><circle cx="${orbX}" cy="${orbY}" r="${night ? 26 : 34}" fill="${orb}"/>`;
      if (night) svg += `<circle cx="${orbX + 9}" cy="${orbY - 4}" r="22" fill="${s0}" opacity=".18"/>`;
    }
    const clouds = time === 'storm' ? 7 : 3;
    for (let i = 0; i < clouds; i++) {
      const cx = r() * W, cy = 40 + r() * 140;
      svg += `<g opacity="${time === 'storm' ? 0.55 : 0.22}" fill="${time === 'storm' ? '#0b0e13' : s2}"><ellipse cx="${cx}" cy="${cy}" rx="${80 + r() * 70}" ry="${14 + r() * 10}"/><ellipse cx="${cx + 40}" cy="${cy - 8}" rx="${50 + r() * 40}" ry="${12 + r() * 8}"/></g>`;
    }

    svg += `<path d="${ridge(r, 270, 110, 14, w)}" fill="${far}"/>`;
    svg += `<path d="${ridge(r, 310, 90, 18, w)}" fill="${mid}"/>`;

    switch (biome) {
      case 'mountain': {
        for (let i = 0; i < 4; i++) {
          const x = 80 + i * 200 + r() * 60, h = 150 + r() * 120;
          svg += `<path d="M${x - 170} 360L${x} ${360 - h}L${x + 170} 360Z" fill="${mix(s1, '#000', 0.6)}"/><path d="M${x - 40} ${360 - h * 0.76}L${x} ${360 - h}L${x + 40} ${360 - h * 0.76}L${x + 14} ${360 - h * 0.7}L${x} ${360 - h * 0.78}L${x - 16} ${360 - h * 0.7}Z" fill="${mix(s2, '#fff', 0.35)}" opacity=".85"/>`;
        }
        svg += `<path d="${ridge(r, 380, 50, 22, w)}" fill="${near}"/>`;
        for (let i = 0; i < 9; i++) svg += pine(r() * W, 400 + r() * 20, 40 + r() * 40, ground);
        break;
      }
      case 'castle': {
        const cx = 300 + r() * 200;
        let c = `<rect x="${cx - 120}" y="250" width="240" height="140" fill="${near}"/>`;
        for (let i = 0; i < 12; i++) c += `<rect x="${cx - 120 + i * 20}" y="240" width="12" height="14" fill="${near}"/>`;
        [-100, 0, 100].forEach((o, i) => {
          const th = 90 + (i === 1 ? 60 : 0) + r() * 30;
          c += `<rect x="${cx + o - 22}" y="${390 - th - 140 + 140}" width="44" height="${th}" fill="${near}"/>`
            + `<path d="M${cx + o - 30} ${390 - th} L${cx + o} ${390 - th - 60} L${cx + o + 30} ${390 - th}Z" fill="${near}"/>`
            + `<line x1="${cx + o}" y1="${390 - th - 60}" x2="${cx + o}" y2="${390 - th - 82}" stroke="${near}" stroke-width="2"/><path d="M${cx + o} ${390 - th - 82}l16 5-16 5z" fill="#b5342f"/>`;
        });
        c += windowsRow(r, cx - 110, 262, 220, 120, 16, glow);
        svg += c + `<path d="${ridge(r, 400, 24, 20, w)}" fill="${ground}"/>`;
        for (let i = 0; i < 6; i++) svg += pine(r() * W, 410, 40 + r() * 30, ground);
        break;
      }
      case 'sea': {
        svg += `<rect y="300" width="${W}" height="${H - 300}" fill="${mix(s1, '#000', 0.55)}"/>`;
        for (let i = 0; i < 14; i++) svg += `<path d="M${r() * W} ${310 + i * 10}q20 -8 40 0t40 0" stroke="${mix(s2, '#fff', 0.2)}" stroke-width="1.4" fill="none" opacity=".4"/>`;
        svg += `<rect x="${orbX - 6}" y="300" width="12" height="${H - 300}" fill="${night ? '#eef2ff' : '#ffd08a'}" opacity=".18"/>`;
        const sx = 200 + r() * 400;
        svg += `<g transform="translate(${sx} 335)" fill="${ground}"><path d="M-60 0h120l-18 22h-84z"/><rect x="-2" y="-90" width="4" height="92"/><path d="M4 -86q46 30 40 76h-40z"/><path d="M-4 -80q-38 24 -34 66h34z"/></g>`;
        svg += `<path d="${ridge(r, 410, 30, 12, w)}" fill="${ground}"/>`;
        break;
      }
      case 'cave': {
        svg = svg.replace(/<rect width="800" height="450" fill="url\(#sky\)"\/>[\s\S]*$/, '');
        svg += `<rect width="${W}" height="${H}" fill="${mix(s0, '#000', 0.6)}"/><circle cx="400" cy="250" r="260" fill="${mix(s1, '#000', 0.45)}" opacity=".7"/>`;
        for (let i = 0; i < 14; i++) {
          const x = r() * W, l = 40 + r() * 120;
          svg += `<path d="M${x - 14} 0L${x} ${l}L${x + 14} 0Z" fill="${near}"/>`;
          if (r() > 0.55) svg += `<path d="M${x - 14} ${H}L${x} ${H - l * 0.6}L${x + 14} ${H}Z" fill="${near}"/>`;
        }
        for (let i = 0; i < 9; i++) {
          const x = 120 + r() * 560, y = 280 + r() * 100, h = 20 + r() * 40, c = ['#6fe3ff', '#b78cff', '#7cffc0'][i % 3];
          svg += `<circle cx="${x}" cy="${y}" r="${h * 1.6}" fill="${c}" opacity=".12"/><path d="M${x - 7} ${y + h}L${x} ${y}L${x + 7} ${y + h}Z" fill="${c}" opacity=".9"/>`;
        }
        svg += `<path d="M0 ${H}L0 80Q200 -20 400 40T800 80L800 ${H}L700 ${H}Q680 160 400 150T100 ${H}Z" fill="${near}"/>`;
        svg += `<path d="${ridge(r, 410, 20, 24, w)}" fill="${ground}"/>`;
        break;
      }
      case 'ruins': {
        svg += `<path d="${ridge(r, 380, 30, 18, w)}" fill="${near}"/>`;
        for (let i = 0; i < 7; i++) {
          const x = 90 + i * 100 + r() * 30, h = 70 + r() * 130;
          svg += `<rect x="${x}" y="${390 - h}" width="26" height="${h}" fill="${ground}"/><path d="M${x - 4} ${390 - h}h34l-6 -8 -8 5 -6 -9 -8 8z" fill="${ground}"/>`;
          if (r() > 0.6) svg += `<circle cx="${x + 13}" cy="${390 - h - 26 - r() * 30}" r="5" fill="#8fe3ff" opacity=".85"/><circle cx="${x + 13}" cy="${390 - h - 40}" r="16" fill="#8fe3ff" opacity=".12"/>`;
        }
        svg += `<path d="M300 390V250Q400 160 500 250V390h-24V262Q400 190 324 262V390z" fill="${ground}"/>`;
        svg += `<path d="${ridge(r, 420, 18, 22, w)}" fill="${ground}"/>`;
        break;
      }
      case 'village': {
        svg += `<path d="${ridge(r, 370, 26, 16, w)}" fill="${near}"/>`;
        for (let i = 0; i < 6; i++) {
          const x = 40 + i * 125 + r() * 30, bw = 70 + r() * 30, bh = 50 + r() * 30;
          svg += `<rect x="${x}" y="${390 - bh}" width="${bw}" height="${bh}" fill="${ground}"/><path d="M${x - 8} ${390 - bh}L${x + bw / 2} ${390 - bh - 42}L${x + bw + 8} ${390 - bh}Z" fill="${ground}"/>`
            + `<rect x="${x + 12}" y="${390 - bh + 14}" width="10" height="14" fill="${glow}"/><rect x="${x + bw - 22}" y="${390 - bh + 14}" width="10" height="14" fill="${glow}"/>`
            + `<circle cx="${x + 17}" cy="${390 - bh + 21}" r="26" fill="url(#hglow)"/>`;
          if (r() > 0.5) svg += `<path d="M${x + bw - 14} ${390 - bh - 30}q-8 -22 4 -40t0 -40" stroke="${mix(s2, '#888', 0.5)}" stroke-width="5" fill="none" opacity=".35"/>`;
        }
        svg += `<path d="${ridge(r, 428, 14, 22, w)}" fill="${ground}"/>`;
        break;
      }
      case 'desert': {
        svg += `<path d="${ridge(r, 330, 50, 10, w)}" fill="${mix('#c98a46', '#000', night ? 0.75 : 0.35)}"/>`;
        svg += `<path d="M560 340L640 230L720 340Z" fill="${mix('#b8782f', '#000', night ? 0.8 : 0.45)}"/><path d="M590 340L640 230L690 340Z" fill="${mix('#b8782f', '#000', night ? 0.88 : 0.6)}"/>`;
        svg += `<path d="${ridge(r, 390, 40, 9, w)}" fill="${mix('#8a5a2a', '#000', night ? 0.82 : 0.55)}"/>`;
        svg += `<path d="${ridge(r, 430, 20, 8, w)}" fill="${ground}"/>`;
        const cx = 150 + r() * 300;
        svg += `<g fill="${ground}"><path d="M${cx} 400q10 -30 30 -30h30q8 0 10 12l12 18z"/><rect x="${cx + 20}" y="350" width="4" height="30"/><circle cx="${cx + 56}" cy="366" r="6"/></g>`;
        break;
      }
      case 'swamp': {
        svg += `<rect y="340" width="${W}" height="${H - 340}" fill="${mix(s1, '#000', 0.7)}"/>`;
        for (let i = 0; i < 7; i++) {
          const x = 40 + i * 115 + r() * 40, h = 90 + r() * 110;
          svg += `<path d="M${x} 400L${x + 3} ${400 - h}M${x + 3} ${400 - h * 0.7}l-34 -22M${x + 3} ${400 - h * 0.5}l38 -30M${x + 3} ${400 - h}l-20 -26M${x + 3} ${400 - h}l24 -20" stroke="${ground}" stroke-width="${5 + r() * 3}" fill="none" stroke-linecap="round"/>`;
        }
        for (let i = 0; i < 8; i++) {
          const x = r() * W, y = 300 + r() * 100;
          svg += `<circle cx="${x}" cy="${y}" r="22" fill="#9bff9b" opacity=".12"/><circle cx="${x}" cy="${y}" r="3.5" fill="#c6ffc6"/>`;
        }
        svg += `<path d="${ridge(r, 430, 12, 24, w)}" fill="${ground}"/>`;
        break;
      }
      case 'dragon': {
        for (let i = 0; i < 3; i++) {
          const x = 120 + i * 270 + r() * 60, h = 120 + r() * 80;
          svg += `<path d="M${x - 150} 380L${x} ${380 - h}L${x + 150} 380Z" fill="${near}"/>`;
        }
        const dx = 250 + r() * 220, dy = 120 + r() * 60, sc = 1.2 + r() * 0.5;
        svg += `<circle cx="${dx + 40}" cy="${dy + 20}" r="140" fill="#ff7a2a" opacity=".12"/>`;
        svg += `<g transform="translate(${dx} ${dy}) scale(${sc})" fill="${ground}"><ellipse cx="40" cy="22" rx="42" ry="13"/><path d="M80 18q30 -18 52 -4l10 -6 2 12q-6 8 -18 8l-18 6z"/><path d="M0 20Q-40 40 -70 24Q-50 44 -10 40Z"/>`
          + `<path d="M30 14Q-10 -50 -78 -62Q-48 -34 -40 -6Q-24 -22 -12 -8Q4 -22 14 -2Z"/><path d="M50 14Q90 -52 160 -64Q130 -36 118 -8Q100 -24 88 -8Q70 -22 60 -2Z"/></g>`;
        svg += `<path d="M${dx + 135 * sc} ${dy + 20 * sc}l70 14-70 6z" fill="#ff9a3a" opacity=".85"/>`;
        svg += `<path d="${ridge(r, 410, 26, 20, w)}" fill="${ground}"/>`;
        break;
      }
      default: { // forest
        svg += `<path d="${ridge(r, 350, 40, 20, w)}" fill="${near}"/>`;
        for (let i = 0; i < 12; i++) svg += pine(r() * W, 360 + r() * 30, 70 + r() * 80, mix(near, '#000', 0.2));
        for (let i = 0; i < 9; i++) svg += pine(r() * W, 410 + r() * 30, 130 + r() * 110, ground);
        for (let i = 0; i < 16; i++) {
          const x = r() * W, y = 250 + r() * 160;
          svg += `<g class="tw" style="animation-delay:-${(r() * 4).toFixed(1)}s"><circle cx="${x}" cy="${y}" r="9" fill="#fff6a8" opacity=".14"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fff6a8"/></g>`;
        }
      }
    }

    svg += `<rect y="${H * 0.5}" width="${W}" height="${H * 0.5}" fill="url(#fog)"/>`;
    if (biome !== 'dragon') svg += hero(150 + r() * 120, 430, role, glow);
    else svg += hero(120 + r() * 80, 432, role, glow);
    svg += `<rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
    const uid = ++uidCounter; // gradient ids must be unique per SVG when many scenes share a page
    return svg.replace(/(id="|url\(#)(sky|hglow|vig|fog)/g, `$1$2${uid}`);
  }

  global.Scenes = { render, detect, hash, rng, BIOMES: Object.keys(KEYWORDS), TIMES: Object.keys(SKY) };
})(window);
