/* Dependency-free SVG charts built from numbers reported in the dissertation. */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function bars(el, rows, opts) {
    const max = opts.max, fmt = opts.fmt || ((v) => v);
    const colors = opts.colors || ['var(--gold)'];
    const rowH = 38, labelW = opts.labelW || 150, W = 520;
    let s = `<svg viewBox="0 0 ${W} ${rows.length * rowH + 8}" role="img" aria-label="${opts.label}">`;
    rows.forEach((r, i) => {
      const y = i * rowH + 6, w = ((W - labelW - 60) * r.v) / max;
      s += `<text x="0" y="${y + 19}" class="ct-label">${r.l}</text>`
        + `<rect x="${labelW}" y="${y + 4}" width="${W - labelW - 60}" height="16" rx="8" class="ct-track"/>`
        + `<rect x="${labelW}" y="${y + 4}" width="0" height="16" rx="8" fill="${colors[i % colors.length]}" data-w="${w.toFixed(1)}" class="ct-bar"/>`
        + `<text x="${labelW + w + 8}" y="${y + 18}" class="ct-val" data-x="${labelW}">${fmt(r.v)}</text>`;
    });
    el.innerHTML = s + '</svg>';
  }

  function grouped(el, groups, series, opts) {
    const W = 520, H = 230, pad = 34, gw = (W - pad) / groups.length, bw = 44;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label}">`;
    for (let t = 0; t <= opts.max; t++) {
      const y = H - 40 - ((H - 70) * t) / opts.max;
      s += `<line x1="${pad}" x2="${W}" y1="${y}" y2="${y}" class="ct-grid"/><text x="0" y="${y + 4}" class="ct-val">${t}</text>`;
    }
    groups.forEach((g, gi) => {
      series.forEach((sr, si) => {
        const v = sr.values[gi], h = ((H - 70) * v) / opts.max, x = pad + gi * gw + gw / 2 - bw - 3 + si * (bw + 6);
        s += `<rect x="${x}" y="${H - 40 - h}" width="${bw}" height="${h}" rx="6" fill="${sr.color}" class="ct-vbar"/>`
          + `<text x="${x + bw / 2}" y="${H - 46 - h}" text-anchor="middle" class="ct-val">${v}</text>`;
      });
      s += `<text x="${pad + gi * gw + gw / 2}" y="${H - 18}" text-anchor="middle" class="ct-label">${g}</text>`;
    });
    s += series.map((sr, i) => `<rect x="${pad + i * 120}" y="${H - 10}" width="10" height="10" rx="3" fill="${sr.color}"/><text x="${pad + 14 + i * 120}" y="${H - 1}" class="ct-val">${sr.name}</text>`).join('');
    el.innerHTML = s + '</svg>';
  }

  function ranges(el, rows, max) {
    const W = 520, labelW = 210, rowH = 40;
    let s = `<svg viewBox="0 0 ${W} ${rows.length * rowH + 28}" role="img" aria-label="Generation time ranges">`;
    rows.forEach((r, i) => {
      const y = i * rowH + 6, x1 = labelW + ((W - labelW - 20) * r.a) / max, x2 = labelW + ((W - labelW - 20) * r.b) / max;
      s += `<text x="0" y="${y + 19}" class="ct-label">${r.l}</text><rect x="${labelW}" y="${y + 6}" width="${W - labelW - 20}" height="12" rx="6" class="ct-track"/>`
        + `<rect x="${x1}" y="${y + 6}" width="${Math.max(6, x2 - x1)}" height="12" rx="6" fill="${r.c}" class="ct-pop"/><text x="${Math.min(x2 + 8, W - 60)}" y="${y + 36}" class="ct-val">${r.t}</text>`;
    });
    el.innerHTML = s + '</svg>';
  }

  function animate(root) {
    root.querySelectorAll('.ct-bar').forEach((b) => requestAnimationFrame(() => { b.style.transition = 'width 1s cubic-bezier(.2,.8,.2,1)'; b.setAttribute('width', b.dataset.w); }));
  }

  function init() {
    const $ = (id) => document.getElementById(id);
    bars($('chartRatings'), [
      { l: 'World-building', v: 3.87 }, { l: 'Story quality', v: 3.78 }, { l: 'Choice quality', v: 3.52 }, { l: 'Character believability', v: 3.39 }
    ], { max: 5, fmt: (v) => v.toFixed(2), label: 'Average user ratings', labelW: 170, colors: ['var(--gold)', 'var(--ember)', 'var(--moon)', 'var(--rose)'] });
    grouped($('chartPref'), ['Overall', 'World-building'], [
      { name: 'GPT-3.5', color: 'var(--moon)', values: [3.6, 3.3] }, { name: 'Mistral', color: 'var(--gold)', values: [4.2, 4.4] }
    ], { max: 5, label: 'Mistral versus GPT-3.5 user ratings' });
    bars($('chartLex'), [
      { l: 'Base Mistral', v: 0.86 }, { l: 'Fine-tuned Mistral', v: 0.83 }, { l: 'GPT-3.5', v: 0.83 }, { l: 'GenreGPT-2', v: 0.82 }
    ], { max: 1, fmt: (v) => v.toFixed(2), label: 'Lexical diversity', colors: ['var(--gold)', 'var(--ember)', 'var(--moon)', 'var(--rose)'] });
    bars($('chartSent'), [
      { l: 'Base Mistral', v: 9.0 }, { l: 'GPT-3.5', v: 7.5 }, { l: 'Fine-tuned Mistral', v: 7.0 }, { l: 'GenreGPT-2', v: 5.0 }
    ], { max: 10, fmt: (v) => v.toFixed(1), label: 'Average sentence length', colors: ['var(--gold)', 'var(--moon)', 'var(--ember)', 'var(--rose)'] });
    ranges($('chartTime'), [
      { l: 'GPT-3.5 (API)', a: 3, b: 15, t: '3 to 15 s', c: 'var(--moon)' },
      { l: 'Fine-tuned Mistral (Colab GPU)', a: 10, b: 15, t: '10 to 15 s', c: 'var(--ember)' },
      { l: 'Base Mistral (local laptop)', a: 60, b: 120, t: '60 to 120 s', c: 'var(--rose)' }
    ], 120);

    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }), { threshold: 0.3 });
    document.querySelectorAll('.chart').forEach((c) => io.observe(c));
  }

  global.Charts = { init };
})(window);
