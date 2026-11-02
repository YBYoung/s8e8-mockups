/* Round 4 (#1417) Competitors: works out, once, what each competitor site does better than the practice.
   Per site: the questions it answers in full that the practice does not, its strongest subjects and its strongest pages. */
(function () {
  const K = window.RA3D2; const R = window.RA4; const { D, Q } = K;
  const C = window.RA4C = window.RA4C || {};
  const vOf = (q, site) => (q.comps && q.comps[site] ? q.comps[site].verdict : 'gap');
  // a crawled title without the practice-name tail ("Title - Elite Coral Dentistry")
  const cleanTitle = (t) => String(t || '').split(/\s[|–-]\s/)[0].trim() || 'Untitled page';
  const lastHeading = (hd) => { const parts = String(hd || '').split('>').map(s => s.trim()).filter(Boolean); return parts.length ? parts[parts.length - 1] : ''; };
  const snippet = (s, max) => { const t = String(s || '').replace(/#+\s*/g, '').replace(/\s+/g, ' ').trim(); return t.length > max ? t.slice(0, max).replace(/\s\S*$/, '') + '...' : t; };

  function build(site) {
    const full = Q.filter(q => vOf(q, site) === 'covered');
    const wins = full.filter(q => q.verdict !== 'covered').sort((a, b) => b.h.weight - a.h.weight);
    const ahead = Q.filter(q => q.verdict === 'covered' && vOf(q, site) !== 'covered').length;
    const subjects = D.topics.map(t => {
      const qs = Q.filter(q => q.topic === t.name);
      return { name: t.name, n: qs.length, full: qs.filter(q => vOf(q, site) === 'covered').length, own: qs.filter(q => q.verdict === 'covered').length, wins: qs.filter(q => vOf(q, site) === 'covered' && q.verdict !== 'covered').length };
    }).filter(s => s.full > 0).sort((a, b) => b.full - a.full || b.wins - a.wins || a.n - b.n);
    const byUrl = {};
    full.forEach(q => { const c = q.comps[site]; const p = byUrl[c.url] || (byUrl[c.url] = { url: c.url, title: cleanTitle(c.title), qs: [] }); p.qs.push(q); });
    const pages = Object.values(byUrl).sort((a, b) => b.qs.length - a.qs.length || a.title.localeCompare(b.title));
    return { site, full, wins, ahead, subjects, pages };
  }

  // most threatening first: the most questions answered in full that the practice does not
  C.sites = R.SITES.map(build).sort((a, b) => b.wins.length - a.wins.length || b.full.length - a.full.length);
  C.bySite = Object.fromEntries(C.sites.map(s => [s.site, s]));
  Object.assign(C, { vOf, cleanTitle, lastHeading, snippet });
})();
