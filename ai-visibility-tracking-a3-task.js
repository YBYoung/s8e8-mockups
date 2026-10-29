/* A3 task preview: the Task Hub's task dialog (components/ww-place/WwPlaceDialog.tsx + client-status/task
   clientTaskStyles.ts), rebuilt static with the exec tokens, so Tracking's tasks look like every other task in the app. */
(function () {
  const css = `
.xa { --card:#FFFFFF; --line:#E6E8EE; --line-soft:#EEF0F4; --ink:#0E1116; --sub:#4A5163; --muted:#8A91A2; --chip:#F2F4F8; --page:#F5F6F8; --blue:#29ABE2; --blue-bg:#E6F6FD; --steady:#256E9C; --tmono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,monospace; }
.xa.ctk-scrim { position:fixed; inset:0; background:rgba(10,12,18,.42); z-index:70; display:flex; align-items:flex-start; justify-content:center; padding:40px 16px 24px; overflow:auto; opacity:0; transition:opacity .2s; }
.xa.ctk-scrim.in { opacity:1; }
.xa .ctk-dlg { width:100%; max-width:960px; background:var(--card); border:1px solid var(--line); border-radius:14px; box-shadow:0 24px 60px rgba(10,12,18,.28); color:var(--ink); transform:translateY(10px) scale(.98); transition:transform .25s cubic-bezier(.4,0,.2,1); }
.xa.in .ctk-dlg { transform:none; }
.xa .ctk-hd { padding:18px 22px 6px; display:flex; align-items:flex-start; gap:12px; }
.xa .ctk-hd .step { font:600 10px var(--tmono); letter-spacing:.09em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; }
.xa .ctk-hd h2 { margin:0; font:700 17px Inter; color:var(--ink); }
.xa .ctk-hd .from { margin-top:4px; font-size:12px; color:var(--muted); line-height:1.45; } .xa .ctk-hd .from b { color:var(--sub); font-weight:600; }
.xa .ctk-x { margin-left:auto; border:0; background:var(--chip); color:var(--sub); width:28px; height:28px; border-radius:8px; font-size:15px; flex:none; }
.xa .ctk-bd { padding:10px 22px 4px; }
.xa .ctk-when { margin:2px 0 10px; padding:9px 12px; border-radius:10px; background:var(--chip); color:var(--sub); font-size:12.5px; line-height:1.5; } .xa .ctk-when b { color:var(--ink); }
.xa .ctk-row { display:grid; grid-template-columns:104px 1fr; gap:12px; align-items:center; padding:7px 0; } .xa .ctk-row.top { align-items:start; }
.xa .ctk-row > .k { font:600 10px var(--tmono); letter-spacing:.09em; text-transform:uppercase; color:var(--muted); }
.xa .ctk-row.top > .k { padding-top:10px; }
.xa .ctk-row .with { display:flex; align-items:center; flex-wrap:wrap; gap:4px; } .xa .hint { font-size:11.5px; color:var(--muted); margin-left:8px; }
.xa .wwp-tog { display:inline-flex; gap:6px; } .xa .wwp-tog > * { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 11px; border-radius:9px; font:600 12.5px Inter; border:1px solid var(--line); background:var(--card); color:var(--sub); }
.xa .wwp-tog .on { background:var(--ink); border-color:var(--ink); color:var(--page); }
.xa .ctk-pick > button { display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 10px; border:1px solid var(--line); background:var(--card); border-radius:9px; font:600 13px Inter; color:var(--ink); }
.xa .ctk-pick svg { width:12px; height:12px; stroke:var(--muted); fill:none; stroke-width:2; }
.xa .ctk-av { width:22px; height:22px; border-radius:50%; background:var(--steady); color:#fff; font:700 9.5px/22px Inter; text-align:center; }
.xa .ctk-in { width:100%; box-sizing:border-box; border:1px solid var(--line); border-radius:9px; padding:9px 11px; font:500 13.5px Inter; color:var(--ink); background:var(--card); }
.xa .ctk-in:focus { outline:none; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-bg); }
.xa .ctk-est { width:120px; } .xa textarea.ctk-in { min-height:64px; resize:vertical; font-size:13px; line-height:1.5; }
.xa .ctk-desc { min-height:120px; overflow:hidden; resize:none; }
.xa .ctk-cols { display:grid; grid-template-columns:minmax(0,450px) minmax(0,1fr); gap:28px; }
.xa .ctk-cols > div { min-width:0; }
.xa .ctk-col .k2 { display:block; font:600 10px var(--tmono); letter-spacing:.09em; text-transform:uppercase; color:var(--muted); margin:7px 0 6px; }
.xa .ctk-row.off .with { opacity:.45; pointer-events:none; } .xa .ctk-row.off .hint.why { opacity:1; }
.xa .wwp-tog > * { white-space:nowrap; } .xa .wwp-tog button { cursor:pointer; } .xa .wwp-tog button:hover { background:var(--chip); }
.xa .at { color:var(--steady); font-weight:600; }
.xa .ctk-ft { padding:12px 22px 18px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; border-top:1px solid var(--line-soft); margin-top:8px; }
.xa .ctk-ft .sum { border:0; background:none; padding:0; box-shadow:none; border-radius:0; font-size:12px; color:var(--sub); margin-right:auto; flex:1 1 200px; line-height:1.45; }
.xa .cs-btn { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:9px; background:var(--card); color:var(--ink); font:600 12.5px/1 Inter; padding:8px 13px; box-shadow:0 1px 2px rgba(17,20,28,.05); }
.xa .cs-btn.pri { background:var(--ink); border-color:var(--ink); color:var(--page); }
@media (max-width:860px) { .xa .ctk-cols { grid-template-columns:1fr; gap:4px; } }
@media (max-width:640px) { .xa .ctk-row { grid-template-columns:1fr; gap:4px; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const CHEV = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>', CAL = '<svg viewBox="0 0 12 12" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:1.6"><rect x="1.5" y="2.5" width="9" height="8" rx="1.5"/><path d="M1.5 5h9M4 1v2.5M8 1v2.5"/></svg>';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /** open({ step, title, from, when, week, assignee, due, section, estimate, description, comment, sum, action }) */
  function open(t) {
    const m = document.createElement('div'); m.className = 'xa ctk-scrim';
    const row = (k, body, top) => `<div class="ctk-row${top ? ' top' : ''}"><span class="k">${k}</span><div class="with">${body}</div></div>`;
    const pick = (v, av) => `<span class="ctk-pick"><button type="button">${av ? `<span class="ctk-av">${av}</span>` : ''}<span class="v">${v}</span>${CHEV}</button></span>`;
    m.innerHTML = `<div class="ctk-dlg" role="dialog" aria-modal="true">
      <div class="ctk-hd"><div><div class="step"></div><h2>${t.title}</h2><div class="from">${t.from}</div></div><button class="ctk-x" aria-label="Close" data-x>×</button></div>
      <div class="ctk-bd"><div class="ctk-when">${t.when}</div><div class="ctk-cols">
        <div>
        ${row('Week', '<span class="wwp-tog" role="group" aria-label="Week"></span>')}
        ${row('Assignee', pick(t.assignee, 'SEO') + '<span class="hint">the client\'s SEO, from Client Status</span>')}
        ${row('Due date', pick(t.due))}
        <div data-ww>${row('Section', pick(t.section) + '<span class="hint">Weekly Workload</span>')}
        ${row('Estimated time', `<input class="ctk-in ctk-est" value="${t.estimate}"><span class="hint">minutes</span>`)}</div>
        </div>
        <div class="ctk-col"><span class="k2">Description</span><textarea class="ctk-in ctk-desc">${esc(t.description)}</textarea>
          <span class="k2">Comment</span><div class="ctk-in" style="font-size:13px;line-height:1.5">${t.comment}</div></div>
      </div>
      </div>
      <div class="ctk-ft"><span class="sum"></span><button class="cs-btn" data-x>Cancel</button><button class="cs-btn pri" data-x>${t.action || 'Save'}</button></div></div>`;
    const close = () => { m.classList.remove('in'); setTimeout(() => m.remove(), 220); };
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-x]')) close(); };
    // Week: off until clicked on (owner 10/29); the Weekly Workload section and estimate only apply on a week.
    const WEEKS = [['none', 'No week'], ['this', 'This week'], ['next', 'Next week']];
    let week = t.week || 'none';
    const tog = m.querySelector('.wwp-tog'), ww = m.querySelector('[data-ww]');
    const paint = () => {
      tog.innerHTML = WEEKS.map(([k, l]) => (k === week ? `<span class="on">${k === 'none' ? '' : CAL}${l}</span>` : `<button type="button" data-w="${k}">${k === 'none' ? l : `+ ${l}`}</button>`)).join('');
      ww.querySelectorAll('.ctk-row').forEach((r) => r.classList.toggle('off', week === 'none'));
      m.querySelector('.step').textContent = week === 'none' ? t.step.replace('Weekly Workload task', 'Asana task') : t.step;
      m.querySelector('.ctk-ft .sum').textContent = week === 'none' ? t.sumNoWeek || 'Creates the task in Asana and posts the comment. Not on a Weekly Workload week.' : t.sum;
    };
    tog.onclick = (e) => { const b = e.target.closest('[data-w]'); if (b) { week = b.dataset.w; paint(); } };
    paint();
    document.body.appendChild(m);
    const ta = m.querySelector('.ctk-desc'), fit = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; };
    ta.addEventListener('input', fit); fit();
    requestAnimationFrame(() => m.classList.add('in'));
  }
  window.A3T = { open };
})();
