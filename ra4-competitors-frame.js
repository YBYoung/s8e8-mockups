/* Round 4 (#1417) Competitors: builds the one section frame every part of the tab uses (the Insights frame, wider
   figure), plus the quiet Show all fold. Numbered eyebrow, one-sentence headline, short lede, then the figure. */
(function () {
  const C = window.RA4C = window.RA4C || {};
  C.section = (s) => `<section class="c4-sec" id="${s.id}">
    <div class="c4-l"><div class="c4-eye"><span class="no">${s.no}</span>${s.eyebrow}</div>
      <h2>${s.headline}</h2>${s.lede ? `<p class="c4-lede">${s.lede}</p>` : ''}${s.note ? `<p class="c4-note">${s.note}</p>` : ''}${s.left || ''}</div>
    <div class="c4-fig">${s.fig}</div></section>`;
  // first `shown` chunks visible, the rest folded behind "Show all N"
  C.more = (chunks, shown, label) => {
    if (chunks.length <= shown) return chunks.join('');
    return `${chunks.slice(0, shown).join('')}<div class="c4-rest"><div>${chunks.slice(shown).join('')}</div></div>
      <button type="button" class="c4-more" data-more aria-expanded="false" data-label="${label}">${label} ↓</button>`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-more]'); if (!b) return;
    const rest = b.previousElementSibling; const open = !rest.classList.contains('open');
    rest.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    b.textContent = open ? 'Show fewer ↑' : `${b.dataset.label} ↓`;
  });
  // a row that opens and closes its own detail in place
  document.addEventListener('click', (e) => {
    if (e.target.closest('a,button:not([data-fold])')) return;
    const b = e.target.closest('[data-fold]'); if (!b) return;
    const box = b.nextElementSibling; const open = !box.classList.contains('open');
    box.classList.toggle('open', open); b.setAttribute('aria-expanded', open); b.classList.toggle('open', open);
  });
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-fold]')) { e.preventDefault(); e.target.click(); } });
})();
