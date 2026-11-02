/* Round 4 (#1417) Insights: remembers which findings were sent or made in this mockup session.
   One record per piece of work (RA4.items key); every place that shows the work listens and redraws. */
(function () {
  const R = window.RA4;
  const I = window.RA4I = window.RA4I || {};
  const done = {};            // item key -> 'sent' | 'task'
  const listeners = [];
  const itemOf = {};          // question id -> the piece of work that carries it
  R.items.forEach(g => g.questions.forEach(q => { itemOf[q.id] = g; }));
  const byKey = Object.fromEntries(R.items.map(g => [g.key, g]));
  I.state = {
    get: (key) => done[key] || null,
    set(key, v) { done[key] = v; listeners.forEach(f => f(key)); },
    clear(key) { delete done[key]; listeners.forEach(f => f(key)); },
    on: (f) => listeners.push(f),
  };
  I.itemOf = (qid) => itemOf[qid] || null;
  I.item = (key) => byKey[key] || null;
})();
