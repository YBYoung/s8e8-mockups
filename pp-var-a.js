/* PROTOTYPE, throwaway (#1570). Variant A, one page two doors: the practice page IS the profile. Opened from the
   strategy, the same page gains a pinned confirm bar and the items that need a look move to the top. */
(function () {
  const PP = window.PP, X = PP.sec, esc = PP.esc;
  const SECTIONS = [
    ['svc', 'Services'], ['main', 'Main services'], ['comp', 'Competitors'], ['goals', 'Goals'], ['ideal', 'Ideal patient'],
    ['ins', 'Insurance and payments'], ['visits', 'Visits and conveniences'], ['docs', 'Doctors'], ['offices', 'Offices'],
    ['facts', 'Other facts'], ['cap', 'Capacity'], ['hist', 'Changes'],
  ];
  PP.variants.A = (root, P) => {
    const st = PP.opt.door === 'station', todo = PP.toConfirm();
    const card = (id, title, lead, body) => `<section class="card" id="a-${id}"><h2>${title}</h2>${lead ? `<div class="lead">${lead}</div>` : ''}${body}</section>`;
    const mains = PP.mains(), offered = PP.offered();
    const bar = st ? `<div style="position:sticky;top:0;z-index:30;background:var(--aTint);border:1px solid #BFE3DC;border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:14px">
        <div style="flex:1"><b style="color:var(--aInk)">SEO Strategy 2027 · Step 1: Practice profile.</b> <span class="small">Gather reads exactly what is confirmed here, and so does every other tool.</span>
        <div class="small muted">${todo.length ? `${PP.n(todo.length, 'service needs', 'services need')} an answer first.` : 'Nothing left to answer.'} ${mains.length} main services, ${PP.state().comps.length} of 3 competitors.</div></div>
        <button class="btn btn-go" data-confirm ${todo.length ? 'disabled' : ''}>${PP.state().confirmed ? 'Confirmed, go to Gather' : 'Confirm profile'}</button></div>` : '';
    const nav = `<nav style="position:sticky;top:${st ? 96 : 16}px;align-self:flex-start;width:190px;flex:0 0 190px;font-size:13px">
      ${SECTIONS.map(([id, w]) => `<a href="#a-${id}" style="display:block;padding:5px 10px;border-radius:6px;color:var(--body);text-decoration:none">${w}${id === 'svc' && todo.length ? ` <span class="flag">${todo.length}</span>` : ''}</a>`).join('')}</nav>`;
    const confirmCard = todo.length ? card('todo', 'Needs an answer', '', X.confirmList(true)) : '';
    const slim = !st && todo.length ? `<div class="card small" style="display:flex;gap:10px;align-items:center;padding:10px 16px"><span class="dot w"></span>${PP.n(todo.length, 'service needs', 'services need')} confirming: the checklist and another source disagree. <a href="#a-todo">Answer</a></div>` : '';
    root.innerHTML = PP.header(null, st ? '' : '<button class="btn btn-line" data-toast="Would open the client\'s other tools with this profile.">Open tools</button>') + bar + slim
      + `<div style="display:flex;gap:22px">${nav}<div style="flex:1;min-width:0">
      ${st ? confirmCard : ''}
      ${card('svc', 'Services', `${esc(P.practice.name)} offers <b>${offered.length}</b> services${(P.services || []).some((s) => s.status === 'not_offered') ? ` and does not offer ${PP.services().filter((s) => s.status === 'not_offered').length}` : ''}. Hover a source to see what it says.`, X.svcGroups(true, { skipConfirm: true }))}
      ${st ? '' : confirmCard}
      ${card('main', 'Main services', 'The services the plan leans on. Prefilled from every priority source; the SEO confirms.', X.mainList(true))}
      ${card('comp', 'Competitors', 'Up to three, per office. Tools read this list and only suggest swaps.', X.comps(true))}
      ${card('goals', 'Goals', '', X.goals(true))}
      ${card('ideal', 'Ideal patient', '', X.ideal())}
      ${card('ins', 'Insurance and payments', '', X.insurance(true))}
      ${card('visits', 'Visits and conveniences', '', X.visits())}
      ${card('docs', 'Doctors', '', X.doctors())}
      ${card('offices', 'Offices', '', X.offices())}
      ${card('facts', 'Other facts', '', X.facts())}
      ${card('cap', 'Capacity', '', X.capacity(true))}
      ${PP.missingCard()}${PP.usesStrip()}<div id="a-hist">${PP.history()}</div></div></div>`;
    X.wire(root);
    root.querySelector('[data-confirm]')?.addEventListener('click', () => PP.state().confirmed ? PP.toast('Would open Gather.') : PP.confirm());
  };
})();
