/* Round 4 (#1417) Tracking: draws the small line pictures for the By subject rows, as SVG strings. Same language as the
   overview chart: 2px-ish monotone lines, no point dots, an end dot with a white casing, a soft area under the lead. */
(function () {
  const T = window.RA4T; const { curve } = T.motion;
  const XS = T.knots.map((k) => k.f), END = T.MEAS_F;

  function path(f, x0, x1, X, Y, n = 60) { let d = ''; for (let k = 0; k <= n; k++) { const ff = x0 + (x1 - x0) * k / n; d += `${k ? 'L' : 'M'}${X(ff).toFixed(1)},${Y(f(ff)).toFixed(1)}`; } return d; }

  /** One subject's answers over the weeks: in full (lead, with area) and in part, on that subject's own question count. */
  function answers(weekly, top, w = 168, h = 36) {
    const X = (f) => 2 + (f / END) * (w - 8), Y = (v) => 3 + (1 - v / top) * (h - 6);
    const full = curve(XS, weekly.map((p) => p.full)), part = curve(XS, weekly.map((p) => p.part));
    const C = T.Chart.C, dF = path(full, 0, END, X, Y), dP = path(part, 0, END, X, Y);
    const xr = X(T.K.LAST);
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="t4-spark" aria-hidden="true">
      <rect x="2" y="1" width="${(xr - 2).toFixed(1)}" height="${h - 2}" fill="#F7F8FA"/>
      <line x1="2" x2="${w - 6}" y1="${Y(0)}" y2="${Y(0)}" stroke="#EEF0F3"/>
      <path d="${dF}L${X(END)},${Y(0)}L2,${Y(0)}Z" fill="${C.full}" opacity=".1"/>
      <path d="${dP}" fill="none" stroke="${C.part}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${dF}" fill="none" stroke="#fff" stroke-width="4.5"/><path d="${dF}" fill="none" stroke="${C.full}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${X(END)}" cy="${Y(part(END))}" r="3" fill="${C.part}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="${X(END)}" cy="${Y(full(END))}" r="3.4" fill="${C.full}" stroke="#fff" stroke-width="1.5"/></svg>`;
  }

  /** A page's or subject's times seen in Google per week, in the practice's own violet. */
  function google(arr, w = 120, h = 28) {
    const max = Math.max(1, ...arr), n = arr.length - 1;
    const X = (i) => 2 + (i / n) * (w - 6), Y = (v) => 2 + (1 - v / max) * (h - 4);
    const f = curve(arr.map((_, i) => i), arr), d = path(f, 0, n, X, Y, 80);
    const c = T.Chart.C.imp;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="t4-spark" aria-hidden="true">
      <line x1="2" x2="${w - 4}" y1="${Y(0)}" y2="${Y(0)}" stroke="#EEF0F3"/>
      <path d="${d}L${X(n)},${Y(0)}L2,${Y(0)}Z" fill="${c}" opacity=".09"/><path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="${X(n)}" cy="${Y(arr[n])}" r="2.8" fill="${c}" stroke="#fff" stroke-width="1.4"/></svg>`;
  }

  T.Spark = { answers, google };
})();
