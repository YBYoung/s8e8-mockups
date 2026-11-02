/* Round 4 (#1417) Tracking: lists the moments under the chart, as AIV chart 8 does. The stretch on screen, newest first,
   the latest 3 with "All N moments"; pages first seen in the same week share one line; hovering a line lights its
   marker. "Add work we did" puts a dark dot on the chart, never a day after today. */
(function () {
  const T = window.RA4T; const esc = T.K.esc; const { shapeSvg, line } = T.Moments;
  let seq = 0;

  function attach(c, card) {
    const box = card.querySelector('.t4-notes'), more = card.querySelector('.t4-more'), add = card.querySelector('.t4-add');
    let all = false;
    function rows() {
      const { AX } = c, out = [], byWeek = {};
      c.moments().filter((m) => c.kindOn[m.kind] && m.f >= Math.floor(AX.to0 ?? AX.d0) - 0.01 && m.f <= Math.ceil(AX.to1 ?? AX.d1) + 0.01).forEach((m) => {
        if (m.kind !== 'page') { out.push({ f: m.f, iso: m.iso, kind: m.kind, ids: [m.id], text: line(m), why: m.why, work: m.kind === 'work' ? m.id : null }); return; }
        (byWeek[m.iso] = byWeek[m.iso] || []).push(m);
      });
      Object.values(byWeek).forEach((ms) => {
        const names = ms.map((m) => esc(m.title)).sort();
        const text = ms.length === 1 ? `First seen in Google: ${names[0]}` : `${ms.length} pages first seen in Google: ${ms.length > 2 ? `${names.slice(0, 2).join(', ')} and ${ms.length - 2} more` : `${names[0]} and ${names[1]}`}`;
        out.push({ f: ms[0].f, iso: ms[0].iso, kind: 'page', ids: ms.map((m) => m.id), text });
      });
      return out.sort((a, b) => b.f - a.f || (a.kind === 'page') - (b.kind === 'page'));
    }
    function paint() {
      const list = rows(), shown = all ? list : list.slice(0, 3);
      box.innerHTML = shown.map((r) => `<li data-ids="${r.ids.join(',')}"><span class="d">${T.day(r.iso)}</span>${shapeSvg(r.kind)}<span class="t">${r.text}${r.why ? `<i>Why: ${esc(r.why)}</i>` : ''}</span>
        ${r.work ? `<span class="rm" data-rm="${r.work}"><button class="t4-ghost q" data-ask>Remove</button></span>` : '<span></span>'}</li>`).join('')
        || '<li class="none"><span></span><span></span><span class="t">No moments in this stretch with the kinds switched on.</span><span></span></li>';
      more.style.visibility = list.length > 3 ? 'visible' : 'hidden';
      more.textContent = all ? 'Show the latest 3' : `All ${list.length} moments${c.AX.zoomed ? ' in this stretch' : ''}`;
      box.querySelectorAll('li[data-ids]').forEach((li) => { li.onmouseenter = () => c.light(li.dataset.ids.split(',')); li.onmouseleave = () => c.light(null); });
      box.querySelectorAll('[data-rm]').forEach((s) => {
        s.querySelector('[data-ask]').onclick = () => {
          s.innerHTML = '<span class="ask">Remove from the chart?</span><button class="t4-ghost red" data-yes>Remove</button><button class="t4-ghost q" data-no>Keep</button>';
          s.querySelector('[data-yes]').onclick = () => { T.S.works = T.S.works.filter((w) => w.id !== s.dataset.rm); c.render(); paint(); window.RA4.toast('Removed from the chart. In the real tool it is marked removed, never deleted.'); };
          s.querySelector('[data-no]').onclick = paint;
        };
      });
    }
    more.addEventListener('click', () => { all = !all; paint(); });
    c.paintNotes = (reset) => { if (reset) all = false; paint(); };

    function closedForm() {
      add.innerHTML = `<button class="t4-ghost" data-open>${shapeSvg('work')}Add work we did</button>`;
      add.querySelector('[data-open]').onclick = openForm;
    }
    function openForm() {
      add.innerHTML = `<form class="t4-form">${shapeSvg('work')}
        <label class="sr" for="t4-wd">The day it happened</label><input id="t4-wd" type="date" value="${T.RUN1}" min="${T.D.weeks[0]}" max="${T.RUN1}">
        <label class="sr" for="t4-wt">What was done</label><input id="t4-wt" type="text" maxlength="140" placeholder="What was done, for example: Pediatric dentistry page published">
        <button type="submit" class="t4-dark" disabled>Add to the chart</button><button type="button" class="t4-ghost q" data-cancel>Cancel</button></form>`;
      const f = add.querySelector('form'), d = f.querySelector('#t4-wd'), t = f.querySelector('#t4-wt'), go = f.querySelector('[type=submit]');
      const ready = () => { go.disabled = !(t.value.trim() && d.value && d.value <= T.RUN1 && d.value >= T.D.weeks[0]); };
      t.addEventListener('input', ready); d.addEventListener('input', ready); t.focus();
      f.querySelector('[data-cancel]').onclick = closedForm;
      f.addEventListener('submit', (e) => {
        e.preventDefault(); if (go.disabled) return;
        const m = { id: 'w' + (++seq), kind: 'work', iso: d.value, f: T.fOf(d.value), title: t.value.trim(), op: 0 };
        T.S.works.push(m); c.kindOn.work = true; c.paintKeys && c.paintKeys();
        c.tw.tween(m, 'op', 1, 450); closedForm(); paint();
        if (m.f < c.AX.d0 || m.f > c.AX.d1) c.zoomTo(0, c.endF());
        setTimeout(() => c.light([m.id]), 60); setTimeout(() => c.light(null), 1600);
      });
    }
    closedForm(); paint();
  }

  T.Notes = { attach };
})();
