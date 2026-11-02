/* Round 4 (#1417): the Relevance Analyzer frame shared by Story, Insights and Tracking. OQ light icon rail, the tool's
   frosted top bar (practice, run date, How it works, Share report, Run again), the three result tabs, and one quiet bank
   line under them: the bank lives on the practice's page (owner 11/1); the tool only says how many suggestions wait and
   lets the SEO accept or dismiss them in place. Pages call RA4.mountShell('story' | 'insights' | 'tracking'). */
(function () {
  const K = window.RA3D2; const kit = K.kit; const { D, h, esc, fmtWeek } = K; const R = window.RA4;
  /* Real suggestions for Kari Mann: its top non-branded Search Console searches that no bank question covers (#1415). */
  const SUGG = [
    { id: 's2', text: 'How much does general anesthesia cost for dental work?', src: 'Search Console', detail: 'Seen 3,760 times. The practice offers oral and conscious sedation, not general anesthesia.', topic: null, off: 'A service the practice does not offer.' },
    { id: 's3', text: 'Do I need an orthodontist to fix my bite?', src: 'Search Console', detail: 'Seen 3,153 times across 82 wordings. The site has no orthodontics page.', topic: null, off: 'A service the practice does not offer.' },
    { id: 's4', text: 'Who offers Invisalign near me?', src: 'Search Console', detail: 'Seen 1,423 times. Invisalign appears only in passing on one page.', topic: null, off: 'A service the practice does not offer.' },
    { id: 's5', text: 'How do I choose a dentist in my town?', src: 'Search Console', detail: 'Seen 7,212 times as "dentist" plus the city. Fits Choosing the practice.', topic: 'Choosing the practice' },
  ];
  const TABS = [['story', 'Story', 'ra-4-story.html'], ['insights', 'Insights', 'ra-4-insights.html'], ['competitors', 'Competitors', 'ra-4-competitors.html'], ['tracking', 'Tracking', 'ra-4-tracking.html']];
  const decided = {}; // suggestion id -> 'accepted' | 'dismissed' (mockup session only)

  R.toast = (msg) => { document.querySelectorAll('.toast').forEach(t => t.remove()); const t = h(`<div class="toast">${msg}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 3200); };
  R.SUGG = SUGG;

  function bankLine() {
    const open = SUGG.filter(s => !decided[s.id]).length;
    return `<span class="r4-bank-k">Question bank</span> ${D.counts.questions} questions in ${D.topics.length} subjects · automatic, <span class="r4-flag">not reviewed yet</span>
      ${open ? `· <button class="r4-link" data-sugg-open>${R.n(open, 'suggestion', 'suggestions')} waiting</button>` : '· no suggestions waiting'}
      · <a class="r4-link" href="#" onclick="RA4.toast('Would open the bank on Kari Mann Dental Studio\\'s practice page.');return false">Open the bank on the practice page</a>`;
  }
  function suggPop(anchor) {
    document.querySelectorAll('.r4-pop').forEach(p => p.remove());
    const pop = h(`<div class="r4-pop" role="dialog" aria-label="Suggested questions"><div class="r4-pop-h"><b>Suggested questions</b><button class="x" aria-label="Close">×</button></div>
      <p class="r4-pop-s">Searches the practice was seen for in Google over the last 26 weeks that no bank question covers. Nothing joins the bank until accepted; each choice drops a mark on Tracking.</p><div data-list></div></div>`);
    const draw = () => {
      pop.querySelector('[data-list]').innerHTML = SUGG.map(s => `<div class="r4-sg ${decided[s.id] ? 'done' : ''}"><div class="t">${esc(s.text)}</div>
        <div class="d">${s.topic ? `fits ${esc(s.topic)}` : `<span class="off">${esc(s.off)}</span>`} · ${esc(s.detail)}</div>
        <div class="b">${decided[s.id] ? `<span class="st">${decided[s.id] === 'accepted' ? 'Added to the bank' : 'Dismissed'}</span><button class="r4-link" data-undo="${s.id}">Undo</button>` : `<button class="btn btn-go sm" data-acc="${s.id}">Accept</button><button class="btn btn-line sm" data-dis="${s.id}">Dismiss</button>`}</div></div>`).join('');
      pop.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => { decided[b.dataset.acc] = 'accepted'; draw(); redrawLine(); });
      pop.querySelectorAll('[data-dis]').forEach(b => b.onclick = () => { decided[b.dataset.dis] = 'dismissed'; draw(); redrawLine(); });
      pop.querySelectorAll('[data-undo]').forEach(b => b.onclick = () => { delete decided[b.dataset.undo]; draw(); redrawLine(); });
    };
    draw(); document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect(); pop.style.top = (r.bottom + window.scrollY + 8) + 'px'; pop.style.left = Math.max(70, Math.min(window.innerWidth - 500, r.left - 60)) + 'px';
    pop.querySelector('.x').onclick = () => pop.remove();
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!pop.contains(e.target) && !e.target.closest('[data-sugg-open]')) { pop.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  }
  function redrawLine() { const el = document.querySelector('[data-bankline]'); if (!el) return; el.innerHTML = bankLine(); wireLine(); }
  function wireLine() { document.querySelector('[data-sugg-open]')?.addEventListener('click', (e) => suggPop(e.currentTarget)); }

  R.mountShell = function (cur, opts) {
    opts = opts || {}; document.body.dataset.reader = 'seo';
    document.body.innerHTML = `${kit.RAIL}
      <div class="mockbar r3"><b>Mockup, round 4 · Relevance Analyzer: ${esc(TABS.find(t => t[0] === cur)[1])}</b> · ${esc(opts.pitch || '')} <span class="src">Data: ${esc(D.practice)}, real crawl of ${fmtWeek(D.crawlDate)} (${D.counts.pages} pages, ${D.counts.sections} sections), ${D.counts.questions} questions, verdicts by Haiku 4.5, three competitors crawled, weekly Search Console and GA4 to ${fmtWeek(D.weeks[D.weeks.length - 1])}. Nothing is sent anywhere from this mockup.</span></div>
      <div class="ra-app"><div class="ra-wrap ${opts.wide ? 'r4-wide' : ''}">
        <div class="ra-top"><div class="fl-brand"><span class="fl-mark"><svg viewBox="0 0 24 24"><path d="M3 20 9 9l4 7 3-4 5 8Z"/><circle cx="17" cy="5" r="2"/></svg></span>Relevance Analyzer</div>
          <div class="fl-right"><span class="r4-who"><b>${esc(D.practice)}</b> · Run · ${fmtWeek(D.crawlDate)}</span><button class="method-btn" data-method><span class="dot"></span>How it works</button>
            <button class="btn btn-line" onclick="RA4.toast('Would start a new run on the same bank and competitors (about $0.30).')">Run again</button><button class="btn btn-go" onclick="RA4.toast('Would open the client report: the headline, the orbit and the five-stop tour, in your voice.')">Share report</button></div></div>
        <nav class="tabs r4-tabs">${TABS.map(([k, w, href]) => `<a href="${href}" class="${cur === k ? 'on' : ''}">${w}</a>`).join('')}<span class="sp"></span><span class="r4-bankline" data-bankline>${bankLine()}</span></nav>
        <main class="r4-main" data-main></main></div></div>`;
    wireLine();
    document.querySelector('[data-method]').addEventListener('click', () => K.methodWindow(opts.method || 'Each run reads every page of the site, finds the section closest to each question in the bank, and a reader (Haiku) confirms whether it answers the question in full, in part, or not at all. The same reader checks the three competitor sites. Counts, never percentages.'));
    return document.querySelector('[data-main]');
  };
})();
