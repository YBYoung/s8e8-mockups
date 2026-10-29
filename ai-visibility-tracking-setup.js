/* Tracking setup and change flow for A2 (#1335): which AIs and questions are tracked, live price.
   Real from Kari Mann's Oct 28 Snapshot (run 2): the 30 questions, each AI's cost per answer,
   reading cost per answer, and AI Overviews' shown / named counts per question (5 searches each). */
(function () {
  const T = window.TRK;
  const css = `
.setup { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:40px; padding:40px 0 0; }
.setup h1.big { font-size:40px; }
.card { border:1px solid var(--line); border-radius:12px; padding:6px 18px 10px; margin-bottom:22px; }
.card > h3 { margin:14px 0 2px; font:800 17px Inter; color:var(--ink); } .card > p.small { margin:0 0 8px; }
.ckrow { display:grid; grid-template-columns:22px minmax(0,1fr) auto; gap:12px; align-items:start; padding:11px 0; border-top:1px solid #F2F4F7; font-size:14px; }
.ckrow.q { grid-template-columns:22px minmax(0,1fr) 112px 112px; align-items:center; }
.ck { width:18px; height:18px; border-radius:4px; border:1.5px solid #D0D5DD; background:#fff; display:grid; place-items:center; padding:0; margin-top:1px; }
.ck.on { background:var(--a); border-color:var(--a); } .ck.on::after { content:''; width:9px; height:5px; border:2px solid #fff; border-top:0; border-right:0; transform:rotate(-45deg) translate(1px,-1px); }
.ckrow .nm b { color:var(--ink); } .ckrow .nm .small { display:block; margin-top:2px; }
.ckrow .cost { font-size:13.5px; color:var(--muted); white-space:nowrap; font-variant-numeric:tabular-nums; }
.ckrow.off .nm { color:var(--faint); } .ckrow.off .nm b { color:var(--muted); }
.tag { display:inline-block; font-size:11.5px; font-weight:600; color:var(--muted); background:var(--soft); border-radius:4px; padding:1px 6px; margin-left:6px; vertical-align:1px; }
.tag.new { color:var(--a-ink); background:var(--a-tint); } .tag.stops { color:var(--down); background:var(--down-tint); }
.grp { display:flex; justify-content:space-between; align-items:baseline; margin:16px 0 0; font:700 12px Inter; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
.grp button { background:none; border:0; color:var(--a-ink); font:600 12.5px Inter; letter-spacing:0; text-transform:none; padding:0; }
.aiohead { display:grid; grid-template-columns:22px minmax(0,1fr) 112px 112px; gap:12px; font-size:11.5px; color:var(--faint); padding:10px 0 4px; }
.aiohead span:nth-child(3), .aiohead span:nth-child(4), .aio { text-align:right; }
.aio { font-size:13.5px; color:var(--body); font-variant-numeric:tabular-nums; } .aio.none { color:var(--faint); }
.aio .tipbox { left:auto; right:0; text-align:left; }
.sum { position:sticky; top:118px; align-self:start; border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
.sum .price { font:900 34px/1.1 Inter; letter-spacing:-.02em; color:var(--ink); margin:6px 0 2px; }
.sum .was { font-size:13.5px; color:var(--muted); } .sum .was s { color:var(--faint); }
.sum .ln { display:flex; justify-content:space-between; gap:10px; font-size:13.5px; padding:6px 0; border-top:1px solid #F2F4F7; }
.sum .ln span:last-child { font-variant-numeric:tabular-nums; color:var(--ink); }
.sum .btn.go { width:100%; margin-top:14px; } .sum .btn.go:disabled { background:#D0D5DD; border-color:#D0D5DD; cursor:not-allowed; }
.sum .why { font-size:12.5px; color:var(--down); margin-top:8px; }
.sum .what { margin-top:14px; font-size:13px; color:var(--body); } .sum .what li { margin:4px 0; }
.sum textarea { width:100%; border:1px solid var(--line); border-radius:8px; padding:8px 10px; font:13.5px Inter; resize:vertical; min-height:58px; margin-top:6px; }
.sum textarea:focus, .addq input:focus { outline:none; border-color:var(--a); box-shadow:0 0 0 3px var(--a-tint); }
.addq { display:flex; gap:8px; padding:12px 0 4px; border-top:1px solid #F2F4F7; } .addq input { flex:1; border:1px solid var(--line); border-radius:8px; padding:8px 10px; font:14px Inter; }
.read { font-size:13px; color:var(--muted); background:var(--soft); border-radius:8px; padding:10px 12px; margin:6px 0 4px; } .read b { color:var(--ink); }
@media (max-width:1000px) { .setup { grid-template-columns:1fr; } .sum { position:static; } .ckrow.q, .aiohead { grid-template-columns:22px minmax(0,1fr) 80px 80px; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const ASKS_A_MONTH = 60;        // twice a day, 30 days
  const READ_PER_ANSWER = 0.00053; // Insights reading + Recommended label, per answer (run 2: $0.33 + $0.07 over 750)
  const AIS = [
    { key: 'chatgpt', name: 'ChatGPT', dot: '#10A37F', per: 0.004, skipsNear: true, note: 'Skips the "near me" questions: its search only knows the country, not Cape Coral.' },
    { key: 'gemini', name: 'Gemini', dot: '#3B82F6', per: 0.004, note: 'Asked from Cape Coral.' },
    { key: 'aio', name: 'AI Overviews', dot: '#EA4335', per: 0.0031, note: 'Google shows an Overview on only some searches, and only those count. Each question below shows how often it did.' },
    { key: 'aimode', name: 'AI Mode', dot: '#8B5CF6', per: 0.004, note: 'Asked from Cape Coral.' },
    { key: 'perplexity', name: 'Perplexity', dot: '#64748B', per: 0.00146, note: 'Names fewer dentists than the others for every practice, so its line runs lower. The cheapest to ask.' },
  ];
  // [id, service, kind, text, AI Overviews searches that came back, Overview shown, named when shown]
  const Q = (id, service, kind, text, ok, shown, named) => ({ id, service, kind, text, ok, shown, named });
  const QUESTIONS = [
    Q(40, 'Veneers', 'discovery', 'Who does natural looking veneers in Cape Coral?', 5, 3, 3),
    Q(41, 'Veneers', 'discovery', 'How much do porcelain veneers cost in Cape Coral?', 5, 5, 3),
    Q(42, 'Veneers', 'near', 'Veneers dentist near me', 5, 0, 0),
    Q(37, 'Sedation', 'discovery', 'Sedation dentistry for anxious patients in Cape Coral', 5, 5, 3),
    Q(38, 'Sedation', 'discovery', 'Who offers nitrous oxide at the dentist in Cape Coral?', 5, 2, 1),
    Q(39, 'Sedation', 'near', 'Sedation dentist near me', 5, 1, 0),
    Q(50, 'Frenectomy', 'discovery', 'Who is the best dentist for frenectomy in Cape Coral?', 5, 3, 3),
    Q(51, 'Frenectomy', 'discovery', 'Where can I get frenectomy in Cape Coral?', 4, 3, 1),
    Q(46, 'Implants', 'discovery', 'Who does dental implants well in Cape Coral?', 5, 3, 3),
    Q(47, 'Implants', 'discovery', 'Best place for a single tooth implant in Cape Coral', 5, 2, 2),
    Q(48, 'Implants', 'near', 'Dental implants near me', 5, 3, 3),
    Q(49, 'Implants', 'discovery', 'All-on-x-implants near me?', 5, 2, 0),
    Q(44, 'Whitening', 'discovery', 'Is in-office whitening worth it? Which Cape Coral dentists do it?', 5, 5, 5),
    Q(43, 'Whitening', 'discovery', 'Professional teeth whitening in Cape Coral', 5, 2, 0),
    Q(45, 'Whitening', 'near', 'Teeth whitening near me', 5, 1, 0),
    Q(52, 'Gum disease', 'discovery', 'Who is the best dentist for gum disease treatment in Cape Coral?', 5, 3, 0),
    Q(53, 'Gum disease', 'discovery', 'Where can I get gum disease treatment in Cape Coral?', 5, 4, 1),
    Q(54, 'Gum disease', 'discovery', 'Gum disease treatment in Cape Coral: which dentist should I see?', 5, 1, 0),
    Q(34, 'Cleanings', 'discovery', 'New patient exam and cleaning in Cape Coral', 5, 3, 3),
    Q(35, 'Cleanings', 'discovery', 'Which dentist in Cape Coral is good for regular cleanings?', 5, 2, 2),
    Q(36, 'Cleanings', 'near', 'Dentist near me for a cleaning', 5, 1, 0),
    Q(55, 'Best dentist', 'general', 'Best dentist in Cape Coral', 5, 1, 0),
    Q(56, 'Best dentist', 'general', 'Top rated dentists in Cape Coral', 5, 0, 0),
    Q(57, 'Best dentist', 'general', 'Which dentist in Cape Coral should I choose?', 5, 5, 1),
    Q(31, 'Emergency', 'discovery', 'I cracked a tooth, who can see me fast in Cape Coral?', 5, 4, 0),
    Q(32, 'Emergency', 'discovery', 'Best emergency dentist in Cape Coral', 5, 2, 0),
    Q(33, 'Emergency', 'near', 'Emergency dentist near me', 5, 3, 0),
    Q(58, 'Branded', 'branded', 'Is Kari Mann Dental Studio good?', 5, 5, 5),
    Q(59, 'Branded', 'branded', 'Kari Mann Dental Studio reviews', 5, 5, 5),
    Q(60, 'Branded', 'branded', 'What do people say about Kari Mann Dental Studio?', 5, 5, 5),
    // Sample: the two questions added on Dec 14 (no Snapshot numbers yet).
    Q(901, 'Veneers', 'discovery', 'Veneers before and after: who in Cape Coral does the best work?', 0, 0, 0),
    Q(902, 'Emergency', 'discovery', 'Same day emergency dentist in Cape Coral', 0, 0, 0),
  ];
  const ORIGINAL = QUESTIONS.filter((q) => q.id < 900).map((q) => q.id);
  const byId = (id) => QUESTIONS.find((q) => q.id === id);

  /** Monthly price, split by AI plus reading, for a set of AIs and question ids. */
  function price(ais, qids) {
    const qs = qids.map(byId), lines = [];
    let answers = 0;
    AIS.filter((a) => ais.includes(a.key)).forEach((a) => {
      const n = a.skipsNear ? qs.filter((q) => q.kind !== 'near').length : qs.length;
      answers += n; lines.push({ name: a.name, n, usd: n * ASKS_A_MONTH * a.per });
    });
    const read = answers * ASKS_A_MONTH * READ_PER_ANSWER;
    return { lines, read, answersWeek: answers * 14, total: lines.reduce((t, l) => t + l.usd, 0) + read };
  }
  const usd = (v) => `$${Math.round(v)}`;

  /** "3 of 5" with an In reality hover; "no Overview" when there is nothing to read. */
  function seen(k, n, what, tail = 'Tracking searches 14 times a week, so this range narrows within a few weeks.') {
    if (!n) return `<span class="aio none">${what === 'named' ? 'no Overview' : 'not yet asked'}</span>`;
    const [lo, hi] = T.range((k / n) * 100, n);
    const said = what === 'shown' ? `Google showed an Overview on ${k} of the ${n} searches for this question.` : `Of the ${n} searches that showed an Overview, ${k} named ${T.PRACTICE}.`;
    return `<span class="aio tip">${k} of ${n}<span class="tipbox"><b>We saw ${k} of ${n}</b>${said} In reality, from ${n} searches, it most likely happens somewhere between ${lo} and ${hi} times in every 100. ${tail}</span></span>`;
  }

  /**
   * The chooser. mode 'start' (first setup) or 'change' (8 weeks in: diff against what's tracked now).
   * now = { ais: [...keys], qids: [...ids] }; onSave(result); onCancel().
   */
  function chooser(el, { mode, now, onSave, onCancel }) {
    const sel = { ais: [...now.ais], qids: [...now.qids] };
    let added = 0;
    const stoppedEver = mode === 'change' ? ORIGINAL.filter((id) => !now.qids.includes(id)) : [];
    const list = () => QUESTIONS.filter((q) => q.id < 900 || q.id >= 1000 || (mode === 'change' && (now.qids.includes(q.id) || sel.qids.includes(q.id))));
    const draw = () => {
      const p = price(sel.ais, sel.qids), was = price(now.ais, now.qids);
      const addQ = sel.qids.filter((id) => !now.qids.includes(id)), stopQ = now.qids.filter((id) => !sel.qids.includes(id));
      const addA = sel.ais.filter((k) => !now.ais.includes(k)), stopA = now.ais.filter((k) => !sel.ais.includes(k));
      const changed = addQ.length + stopQ.length + addA.length + stopA.length > 0;
      const blocked = !sel.ais.length ? 'Pick at least one AI.' : !sel.qids.filter((id) => byId(id).kind !== 'branded').length ? 'Pick at least one question without the practice\'s name in it.' : sel.qids.length > 60 ? 'At most 60 questions.' : '';
      const aiName = (k) => AIS.find((a) => a.key === k).name;
      const groups = [...new Set(list().map((q) => q.service))];
      const qrow = (q) => {
        const on = sel.qids.includes(q.id), isNew = mode === 'change' && on && !now.qids.includes(q.id), stops = mode === 'change' && !on && now.qids.includes(q.id);
        const tags = `${q.kind === 'near' ? '<span class="tag">Near me</span>' : ''}${q.kind === 'branded' ? '<span class="tag">Branded</span>' : ''}${isNew ? '<span class="tag new">Starts tomorrow</span>' : ''}${stops ? '<span class="tag stops">Stops tomorrow, history kept</span>' : ''}${mode === 'change' && !on && stoppedEver.includes(q.id) ? '<span class="tag">Stopped Dec 14</span>' : ''}`;
        return `<div class="ckrow q ${on ? '' : 'off'}"><button class="ck ${on ? 'on' : ''}" data-q="${q.id}" aria-label="Track ${q.text}"></button><span class="nm">${q.text}${tags}</span>${seen(q.shown, q.ok, 'shown')}${seen(q.named, q.shown, 'named')}</div>`;
      };
      el.innerHTML = `<div class="setup"><div>
        <div class="eyebrow">${mode === 'start' ? 'Tracking · set up' : 'Tracking · change what we track'}</div>
        <h1 class="big">${mode === 'start' ? `Choose what to track for ${T.PRACTICE}.` : 'Change the AIs or questions from tomorrow.'}</h1>
        <p class="lede">${mode === 'start' ? 'Every ticked question goes to every ticked AI twice a day, morning and evening. The price on the right follows the ticks.' : 'Nothing already asked changes. The change starts with tomorrow morning\'s asks and goes on every chart as a marker.'}</p>
        <div class="card"><h3>AIs</h3><p class="small">Cost per month is for the questions ticked below.</p>
          ${AIS.map((a) => { const on = sel.ais.includes(a.key), l = p.lines.find((x) => x.name === a.name), n = a.skipsNear ? sel.qids.filter((id) => byId(id).kind !== 'near').length : sel.qids.length;
            const tag = mode === 'change' && on && !now.ais.includes(a.key) ? '<span class="tag new">Starts tomorrow</span>' : mode === 'change' && !on && now.ais.includes(a.key) ? '<span class="tag stops">Stops tomorrow, history kept</span>' : '';
            return `<div class="ckrow ${on ? '' : 'off'}"><button class="ck ${on ? 'on' : ''}" data-ai="${a.key}" aria-label="Track ${a.name}"></button><span class="nm"><span class="aidot" style="background:${a.dot}"></span><b>${a.name}</b>${tag}<span class="small">${a.note}</span></span><span class="cost">${on ? `${n} questions · about ${usd(l.usd)}` : `${n} questions · about ${usd(n * ASKS_A_MONTH * a.per)} if ticked`}</span></div>`; }).join('')}
        </div>
        <div class="card"><h3>Questions</h3>
          <p class="small">${sel.qids.length} ticked. Branded questions are tracked but kept out of the headline, since AI names the practice there almost every time.</p>
          <div class="read"><b>The two AI Overviews numbers</b>, from the Oct 28 Snapshot (5 searches per question). <b>Overview shown</b>: how many searches Google answered with an AI Overview at all. <b>Named, when shown</b>: of those, how many named ${T.PRACTICE}. "We saw 3 of 5" is what happened on those searches; hover a number for <b>in reality</b>, the range the true count most likely sits in, out of every 100.</div>
          <div class="aiohead"><span></span><span></span><span>Overview shown</span><span>Named, when shown</span></div>
          ${groups.map((g) => { const qs = list().filter((q) => q.service === g), all = qs.every((q) => sel.qids.includes(q.id));
            return `<div class="grp"><span>${g} · ${qs.filter((q) => sel.qids.includes(q.id)).length} of ${qs.length}</span><button data-grp="${g}">${all ? 'Untick all' : 'Tick all'}</button></div>${qs.map(qrow).join('')}`; }).join('')}
          <div class="addq"><input placeholder="Add a question a patient might ask" aria-label="New question"><button class="btn" data-add>Add</button></div>
        </div></div>
        <aside class="sum"><div class="eyebrow grey">${mode === 'start' ? 'Price' : 'Price from tomorrow'}</div>
          <div class="price">About ${usd(p.total)} a month</div>
          ${mode === 'change' && changed ? `<div class="was">Now <s>about ${usd(was.total)}</s> · ${p.total >= was.total ? '+' : '-'}${usd(Math.abs(p.total - was.total))} a month</div>` : ''}
          <div style="margin-top:12px">${p.lines.map((l) => `<div class="ln"><span>${l.name} · ${l.n} questions</span><span>${usd(l.usd)}</span></div>`).join('')}
            <div class="ln"><span>Reading every answer for Insights</span><span>${usd(p.read)}</span></div>
            <div class="ln"><span>Answers a week</span><span>${p.answersWeek.toLocaleString()}</span></div></div>
          ${mode === 'start'
    ? `<p class="small" style="margin-top:12px">First weekly number 7 days after the first ask. Each question adds about ${usd(price(sel.ais, [40]).total)} a month on the ticked AIs.</p>
             <button class="btn go" data-save ${blocked ? 'disabled' : ''}>Start tracking</button>${blocked ? `<div class="why">${blocked}</div>` : ''}`
    : `${changed ? `<ul class="what">
               ${addQ.length ? `<li><b>${addQ.length} new question${addQ.length > 1 ? 's' : ''}</b> start their own line; first weekly number 7 days after tomorrow.</li>` : ''}
               ${stopQ.length ? `<li><b>${stopQ.length} question${stopQ.length > 1 ? 's' : ''} stop.</b> Their history stays under "No longer tracked" and can be turned back on.</li>` : ''}
               ${addA.length ? `<li><b>${addA.map(aiName).join(' and ')}</b> starts tomorrow; its line begins there.</li>` : ''}
               ${stopA.length ? `<li><b>${stopA.map(aiName).join(' and ')}</b> stops; its line ends tomorrow and its history stays.</li>` : ''}
               <li>Like for like: weeks before and after are compared only on the AIs and questions tracked on both sides.</li></ul>
             <label class="small" style="display:block;margin-top:12px">Why the change (shows on the marker)<textarea data-note placeholder="e.g. client starting a veneers push"></textarea></label>` : '<p class="small" style="margin-top:12px">Tick or untick an AI or a question to see the new price.</p>'}
             <button class="btn go" data-save ${!changed || blocked ? 'disabled' : ''}>Save, starts tomorrow</button>${changed && blocked ? `<div class="why">${blocked}</div>` : ''}
             <p class="small" style="margin-top:10px"><a href="#" data-cancel>Cancel</a></p>`}
        </aside></div>`;
      el.querySelectorAll('[data-ai]').forEach((b) => { b.onclick = () => { const k = b.dataset.ai; sel.ais = sel.ais.includes(k) ? sel.ais.filter((x) => x !== k) : [...sel.ais, k]; draw(); }; });
      el.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { const id = +b.dataset.q; sel.qids = sel.qids.includes(id) ? sel.qids.filter((x) => x !== id) : [...sel.qids, id]; draw(); }; });
      el.querySelectorAll('[data-grp]').forEach((b) => { b.onclick = () => { const ids = list().filter((q) => q.service === b.dataset.grp).map((q) => q.id), all = ids.every((id) => sel.qids.includes(id));
        sel.qids = all ? sel.qids.filter((id) => !ids.includes(id)) : [...new Set([...sel.qids, ...ids])]; draw(); }; });
      el.querySelector('[data-add]').onclick = () => { const v = el.querySelector('.addq input').value.trim(); if (!v) return; added += 1; const id = 1000 + added;
        QUESTIONS.push(Q(id, 'Added', 'discovery', v, 0, 0, 0)); sel.qids.push(id); draw(); };
      const save = el.querySelector('[data-save]');
      if (save) save.onclick = () => onSave({ ais: sel.ais, qids: sel.qids, addQ, stopQ, addA, stopA, note: el.querySelector('[data-note]')?.value.trim() || '', before: was.total, after: p.total });
      const cancel = el.querySelector('[data-cancel]'); if (cancel) cancel.onclick = (e) => { e.preventDefault(); onCancel(); };
    };
    draw();
    window.scrollTo({ top: 0 });
  }

  window.TRK_SETUP = { AIS, QUESTIONS, ORIGINAL, byId, price, usd, seen, chooser };
})();
