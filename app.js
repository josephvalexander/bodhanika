/* app.js — filter state, grid rendering, navigation */
(function () {
  /* ── State ── */
  var state = { cls: 'All', sub: 'All', q: '' };

  /* ── Filter & render ── */
  function applyAll() {
    state.q = (document.getElementById('searchBox').value || '').toLowerCase().trim();
    var cards = document.querySelectorAll('.exp-card');
    var shown = 0;
    cards.forEach(function (card) {
      var ok = true;
      if (state.cls !== 'All' && card.dataset.classes.indexOf(state.cls) === -1) ok = false;
      if (state.sub !== 'All' && card.dataset.s !== state.sub) ok = false;
      if (state.q && card.dataset.search.indexOf(state.q) === -1) ok = false;
      card.classList.toggle('hidden', !ok);
      if (ok) shown++;
    });
    document.getElementById('countShown').textContent = shown;
    document.getElementById('labelClass').textContent = state.cls;
    document.getElementById('labelSub').textContent = state.sub;
    var empty = document.getElementById('emptyState');
    if (empty) empty.classList.toggle('hidden', shown > 0);
  }
  window.applyAll = applyAll;

  /* ── Class tab ── */
  window.setClass = function (cls, el) {
    state.cls = cls;
    document.querySelectorAll('.ctab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    applyAll();
  };

  /* ── Subject tab ── */
  window.setSub = function (sub, el) {
    state.sub = sub;
    document.querySelectorAll('.stab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    applyAll();
  };

  /* ── Build all cards ── */
  function buildGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var html = '';
    var total = window.EXPERIMENTS.length;

    window.EXPERIMENTS.forEach(function (e, i) {
      var tagCls = window.subjectTagClass(e.subject);
      var clsList = e.classes.join(',');
      var searchStr = (e.title + ' ' + e.subject + ' ' + e.desc + ' ' + e.ncert).toLowerCase();
      var delay = Math.min(i * 30, 600); // stagger animation, cap at 600ms

      html += '<div class="exp-card" data-id="' + e.id + '" data-s="' + e.subject + '"' +
              ' data-classes="' + clsList + '" data-search="' + searchStr + '"' +
              ' style="animation-delay:' + delay + 'ms"' +
              ' onclick="openModal(\'' + e.id + '\')">' +
              '<div class="card-top" style="background:' + e.bgGrad + '">' + e.icon + '</div>' +
              '<div class="card-body">' +
              '<div class="card-meta">' +
              '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
              e.classes.map(function (c) { return '<span class="tag tag-cls">Cl ' + c + '</span>'; }).join('') +
              '<span class="tag tag-mode" style="margin-left:auto">Virtual + Home</span>' +
              '</div>' +
              '<div class="card-title">' + e.title + '</div>' +
              '<div class="card-desc">' + e.desc + '</div>' +
              '<div class="card-ncert">' + e.ncert + '</div>' +
              '</div></div>';
    });

    /* Empty state */
    html += '<div class="empty-state hidden" id="emptyState">' +
            '<div class="big">🔭</div>' +
            '<div>No experiments match your filters.</div>' +
            '</div>';

    grid.innerHTML = html;
    document.getElementById('countTotal').textContent = total;
    document.getElementById('countShown').textContent = total;
  }

  /* ── Init on DOM ready ── */
  document.addEventListener('DOMContentLoaded', buildGrid);
})();
