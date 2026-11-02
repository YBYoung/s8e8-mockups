/* Round 4 (#1417) Insights: builds the one frame every section uses (AIV InsightSection), with its quiet Show all toggle.
   Numbered eyebrow, one-sentence headline, short lede and small note on the left, the figure in a 400px column. */
(function () {
  const I = window.RA4I;
  I.section = (s) => `<section class="i4-sec" id="${s.id}" data-section="${s.id}">
    <div class="i4-l"><div class="i4-eye"><span class="no">${s.no}</span>${s.eyebrow}</div>
      <h2>${s.headline}</h2>${s.lede ? `<p class="i4-lede">${s.lede}</p>` : ''}${s.note ? `<p class="i4-note">${s.note}</p>` : ''}${s.left || ''}</div>
    <div class="i4-fig">${s.fig}</div></section>`;
  // first `shown` chunks visible, the rest folded behind "Show all N"
  I.more = (chunks, shown, label) => {
    if (chunks.length <= shown) return chunks.join('');
    return `${chunks.slice(0, shown).join('')}<div class="i4-rest"><div>${chunks.slice(shown).join('')}</div></div>
      <button type="button" class="i4-more" data-more aria-expanded="false" data-label="${label}">${label} ↓</button>`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-more]'); if (!b) return;
    const rest = b.previousElementSibling; const open = !rest.classList.contains('open');
    rest.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    b.textContent = open ? 'Show fewer ↑' : `${b.dataset.label} ↓`;
    if (!open) b.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  // a card that opens and closes its own list in place
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fold]'); if (!b) return;
    const box = b.nextElementSibling; const open = !box.classList.contains('open');
    box.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    b.querySelector('.ar').textContent = open ? '↑' : '↓';
  });
})();
