/* Round 4 (#1417) Insights: renders the small shared pieces every section is built from.
   A square is one bank question coloured by its verdict; an action is the one next step for a piece of work. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const I = window.RA4I;
  const { esc, COLORS } = K; const C = COLORS.light;
  const WORD = { covered: 'Answered in full', thin: 'Answered in part', gap: 'Not answered' };
  const SHORT = { covered: 'in full', thin: 'in part', gap: 'not answered' };
  const COMP = { covered: C.comp, thin: '#C4B5FD', gap: C.gap };
  const ORDER = { covered: 0, thin: 1, gap: 2 };
  const INTENT = { do: 'ready to act', visit: 'looking nearby', know: 'wants to understand' };

  // a question's square: hover says what it is, a click opens it in the reader
  function sq(q, opts) {
    opts = opts || {};
    const tip = `${WORD[q.verdict]} on the site.${q.comp && q.comp.verdict === 'covered' && q.verdict !== 'covered' ? ` ${q.comp.site} answers it in full.` : ''} Click to read it.`;
    return `<i class="i4-sq${opts.ring ? ' ring' : ''}" style="background:${C[q.verdict]}" data-q="${q.id}" data-tip-h="${esc(q.text)}" data-tip="${esc(tip)}" tabindex="0" role="button" aria-label="${esc(q.text)}"></i>`;
  }
  // the competitor's mark beside the practice's
  function csq(q) {
    const c = q.comp;
    return `<i class="i4-sq" style="background:${COMP[c.verdict]}" data-q="${q.id}" data-tip-h="${esc(c.site)}" data-tip="${esc(`${WORD[c.verdict]} on ${c.site}. ${c.note}`)}"></i>`;
  }
  const key = (word, color) => `<span class="i4-key"><i style="background:${color}"></i>${word}</span>`;
  const byVerdict = (qs) => qs.slice().sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || b.h.weight - a.h.weight);
  // a question as one line: its square, its words
  const qline = (q, extra) => `<div class="i4-ql" data-q="${q.id}">${sq(q)}<span class="t">${esc(q.text)}${extra ? `<span class="m">${extra}</span>` : ''}</span></div>`;

  // the action, or its finished state with Undo; redrawn in place whenever the state changes
  function actInner(g, style) {
    const st = I.state.get(g.key);
    if (st) return `<span class="i4-done"><svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>${st === 'sent' ? 'Sent to the calendar' : 'Task made'}</span><button type="button" class="r4-link" data-undo="${esc(g.key)}">Undo</button>`;
    const label = style === 'verb' ? g.verb : R.KIND[g.kind].destWord;
    return `<button type="button" class="${style ? 'r4-link i4-golink' : 'i4-btn'}" data-go="${esc(g.key)}">${label}${style ? ' ›' : ''}</button>`;
  }
  const act = (g, style) => g ? `<span class="i4-act" data-act="${esc(g.key)}" data-style="${style || ''}">${actInner(g, style)}</span>` : '';
  I.state.on((k) => document.querySelectorAll('.i4-act').forEach(el => { if (el.dataset.act === k) el.innerHTML = actInner(I.item(k), el.dataset.style); }));

  // section text from crawled pages: drop markdown marks, keep it short
  const clean = (s, max) => { const t = String(s || '').replace(/#+\s*/g, '').replace(/\s+/g, ' ').trim(); return max && t.length > max ? t.slice(0, max).replace(/\s\S*$/, '') + '...' : t; };

  Object.assign(I, { WORD, SHORT, COMP, INTENT, sq, csq, key, byVerdict, qline, act, clean });
})();
