/* data.js — assembles all experiment arrays into window.EXPERIMENTS
   Load order in index.html:
     data-1-5.js  →  data-6-10-science.js  →  data-6-10-maths.js
     →  data-6-10-evs-life.js  →  data.js (this file)
*/
(function () {
  var parts = [
    window.EXPERIMENTS_1_5       || [],
    window.EXPERIMENTS_6_10_SCI  || [],
    window.EXPERIMENTS_6_10_MATH || [],
    window.EXPERIMENTS_6_10_EVS  || [],
    window.EXPERIMENTS_6_10_LIFE || [],
  ];
  window.EXPERIMENTS = [].concat.apply([], parts);

  /* Fast lookup by id */
  window.EXP_MAP = {};
  window.EXPERIMENTS.forEach(function (e) { window.EXP_MAP[e.id] = e; });

  /* Subject → CSS tag class */
  window.subjectTagClass = function (sub) {
    return { Science: 'tag-sci', Maths: 'tag-math', EVS: 'tag-evs', 'Life Skills': 'tag-life' }[sub] || 'tag-sci';
  };

  /* Subject → CSS variable name (for inline gradient use) */
  window.subjectColor = function (sub) {
    return { Science: 'var(--sci)', Maths: 'var(--math)', EVS: 'var(--evs)', 'Life Skills': 'var(--life)' }[sub] || 'var(--sci)';
  };
})();
