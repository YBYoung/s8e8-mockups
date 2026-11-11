/* Question bank mockups (#1842): the review list after a build. Five kinds: the biggest search groups, unplaced
   searches, junk with a dental word, emergency groups, suspected duplicates. Each item has its evidence and one or two
   plain actions. In light mode the same list reads as pending suggestions. */
(function () {
  const QB = window.QB; const { esc, fmt, n } = QB; const D = QB.D;
  const S = QB.reviewState = { done: {}, kind: null };
  const KINDS = [
    { k: 'big', label: 'Biggest search groups', why: `Groups of real searches above 1 in 100 of the practice's times seen. One wrong label here moves more demand than the rest of the list together.`, light: 'The automatic labels on the practice\'s biggest search groups. Each one is held as a suggestion to confirm.' },
    { k: 'unplaced', label: 'Unplaced searches', why: 'Real demand the practice was seen for that fits no service it offers. Reported, never filed in a catch-all.', light: 'Searches that fit no service the practice offers.' },
    { k: 'junk', label: 'Junk with a dental word', why: 'Groups the labeller called junk although the wording mentions teeth, gauze, the mouth or a treatment. Usually a real need, cut short.', light: 'Groups called junk although they mention a dental word.' },
    { k: 'emergency', label: 'Emergency groups', why: 'Emergency searches are easy to mislabel: an emergency root canal belongs to Root Canal Therapy, an emergency with no treatment to Emergency dental care.', light: 'Emergency groups and the subject each was given.' },
    { k: 'dup', label: 'Suspected duplicates', why: 'New questions from the refill that look like a question already in the bank. Merging keeps the wording as a match phrase.', light: 'Questions that may duplicate one already in the bank.' },
  ];
  QB.REVIEW_KINDS = KINDS;
  QB.reviewOpen = () => D.review.filter((_, i) => !S.done[i]).length;

  const lead = (r) => {
    if (r.kind === 'dup') return `${esc(r.leader)} <span class="n">looks like</span> ${esc(r.of)}`;
    return `"${esc(r.leader)}" <span class="n">· seen ${fmt(r.impressions)} times${r.wordings ? `, ${n(r.wordings, 'wording', 'wordings')}` : ''}</span>`;
  };
  const detail = (r) => {
    const parts = [];
    if (r.kind === 'big' || r.kind === 'emergency') parts.push(`Labelled <b>${esc(r.subject)}</b> · <b>${esc(QB.SIT_WORD[r.situation] || r.situation)}</b>${r.reason ? ` <span class="faint">(${esc(r.reason)})</span>` : ''}${r.question ? `. Feeds the question <span class="ex">"${esc(r.question)}"</span>.` : '. No question carries it yet.'}`);
    if (r.kind === 'unplaced') parts.push(`<span class="lbl bad">Not offered</span> ${esc(r.reason)}.${r.examples?.length ? ` Searches: <span class="ex">${r.examples.map(esc).join(' · ')}</span>` : ''}`);
    if (r.kind === 'junk') parts.push(`Labeller said: <span class="ex">${esc(r.reason)}</span>.${r.question ? ` By hand it belongs to <span class="ex">"${esc(r.question)}"</span>.` : ''}`);
    if (r.kind === 'dup') parts.push(`<b>${esc(r.subject)}</b> · ${esc(QB.SIT_WORD[r.situation] || r.situation)} · seen ${fmt(r.agImp)} times across ${n(r.agClients, 'client', 'clients')}, ${fmt(r.ownImp)} by the practice. Searches: <span class="ex">${(r.examples || []).map(esc).join(' · ')}</span>`);
    return parts.join('');
  };
  const acts = (r, i, light) => {
    const mk = (label, out, cls) => `<button class="btn ${cls || 'btn-line'} sm" data-do="${i}" data-out="${esc(out)}">${label}</button>`;
    if (r.kind === 'big' || r.kind === 'emergency') return mk(light ? 'Confirm' : 'Label is right', 'Confirmed', 'btn-go') + `<button class="btn btn-line sm" data-relabel="${i}">Relabel</button>` + mk('Junk', 'Marked junk; its searches no longer count');
    if (r.kind === 'unplaced') return mk('Dismiss', 'Dismissed; stays in the coverage report as unplaced', 'btn-go') + mk('Add anyway', 'Added, kept by the SEO and flagged off strategy');
    if (r.kind === 'junk') return mk('Junk, leave it out', 'Left out', 'btn-go') + `<button class="btn btn-line sm" data-relabel="${i}">Not junk, place it</button>`;
    return mk('Merge into it', `Merged; "${r.leader}" is now a match phrase`, 'btn-go') + mk('Keep both', 'Kept as its own question');
  };

  QB.renderReview = function (root, opts) {
    opts = opts || {}; const light = !!opts.light;
    const counts = Object.fromEntries(KINDS.map((k) => [k.k, D.review.filter((r, i) => r.kind === k.k && !S.done[i]).length]));
    const open = QB.reviewOpen();
    const shown = D.review.map((r, i) => ({ r, i })).filter(({ r }) => !S.kind || r.kind === S.kind);
    root.innerHTML = `<div class="rv-kinds">${KINDS.map((k) => `<button class="rv-kind ${S.kind === k.k ? 'on' : ''} ${counts[k.k] ? '' : 'done'}" data-kind="${k.k}"><b>${counts[k.k]}</b><span>${esc(k.label)}</span></button>`).join('')}</div>
      ${KINDS.filter((k) => !S.kind || S.kind === k.k).map((k) => { const items = shown.filter(({ r }) => r.kind === k.k); if (!items.length) return ''; return `<div class="rv-h"><h3>${esc(k.label)}</h3><span class="why">${esc(light ? k.light : k.why)}</span></div>` + items.map(({ r, i }) => `<div class="rv ${S.done[i] ? 'done' : ''}" data-i="${i}"><div><div class="lead">${lead(r)}</div><div class="det">${detail(r)}</div></div><div class="acts">${S.done[i] ? '' : acts(r, i, light)}</div>${S.done[i] ? `<div class="out">${esc(S.done[i])} · ${QB.me}, ${QB.today} <button class="lnk" data-undo="${i}">Undo</button></div>` : ''}</div>`).join(''); }).join('')}
      ${open ? '' : `<div class="card" style="text-align:center;color:var(--muted)">Every item is answered. ${light ? 'Each answer is already a marker on the history.' : 'The bank is ready to freeze.'}</div>`}`;
    root.querySelectorAll('[data-kind]').forEach((b) => b.onclick = () => { S.kind = S.kind === b.dataset.kind ? null : b.dataset.kind; QB.renderReview(root, opts); opts.onChange && opts.onChange(); });
    root.querySelectorAll('[data-do]').forEach((b) => b.onclick = () => { S.done[b.dataset.do] = b.dataset.out; QB.renderReview(root, opts); opts.onChange && opts.onChange(); });
    root.querySelectorAll('[data-undo]').forEach((b) => b.onclick = () => { delete S.done[b.dataset.undo]; QB.renderReview(root, opts); opts.onChange && opts.onChange(); });
    root.querySelectorAll('[data-relabel]').forEach((b) => b.onclick = (e) => {
      const i = b.dataset.relabel; const subjects = QB.sortSubjects(D.subjects);
      QB.menu(e.currentTarget, [{ k: 'Subject' }, ...subjects.slice(0, 12).map((s) => ({ label: s.name, on: () => QB.menu(e.currentTarget, [{ k: 'Situation' }, ...QB.SITUATIONS.map((sit) => ({ label: QB.SIT_WORD[sit], on: () => { S.done[i] = `Relabelled ${s.name} · ${QB.SIT_WORD[sit]}`; QB.renderReview(root, opts); opts.onChange && opts.onChange(); } }))]) })), 'sep', { label: 'Unplaced: the practice does not offer it', on: () => { S.done[i] = 'Marked unplaced'; QB.renderReview(root, opts); opts.onChange && opts.onChange(); } }]);
    });
  };
})();
