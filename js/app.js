/* app.js — filter state, grid rendering, navigation */
(function () {

  /* ── Persistent state ── */
  var STORAGE_KEY = 'bodhanika_state';

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        return {
          cls:      s.cls      || 'All',
          sub:      s.sub      || 'All',
          q:        '',                    /* never restore search text */
          scroll:   s.scroll   || 0,
          lastExp:  s.lastExp  || null,    /* last opened experiment id */
          theme:    null         /* handled by bodhanika-theme key */
        };
      }
    } catch(e) {}
    return { cls: 'All', sub: 'All', q: '', scroll: 0, lastExp: null, theme: null };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cls:     state.cls,
        sub:     state.sub,
        scroll:  window.scrollY,
        lastExp: state.lastExp,
      }));  /* theme saved separately via bodhanika-theme key */
    } catch(e) {}
  }

  var state = loadState();

  /* ── Filter & render ── */
  function applyAll() {
    state.q = (document.getElementById('searchBox').value || '').toLowerCase().trim();
    /* Only operate on cards inside #grid — drawer cards have no filter data */
    var cards = document.querySelectorAll('#grid > .exp-card');
    var shown = 0;
    cards.forEach(function (card) {
      var ok = true;
      if (state.cls !== 'All' && (card.dataset.classes || '').indexOf(state.cls) === -1) ok = false;
      if (state.sub !== 'All' && (card.dataset.s || '') !== state.sub) ok = false;
      if (state.q && (card.dataset.search || '').indexOf(state.q) === -1) ok = false;
      card.classList.toggle('hidden', !ok);
      if (ok) shown++;
    });
    var empty = document.getElementById('emptyState');
    if (empty) empty.classList.toggle('hidden', shown > 0);
    saveState();
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

  /* ── Track last opened experiment ── */
  var _origOpenModal = window.openModal;
  window.openModal = function(id) {
    state.lastExp = id;
    saveState();
    if (_origOpenModal) _origOpenModal(id);
  };

  /* ── Save scroll position on scroll (throttled) ── */
  var scrollTimer;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(saveState, 300);
  }, { passive: true });

  /* ── Restore active tab UI from saved state ── */
  function restoreTabs() {
    /* Class tab */
    var cls = state.cls;
    document.querySelectorAll('.ctab').forEach(function(t) {
      t.classList.remove('active');
      /* match by onclick text content */
      var match = cls === 'All'
        ? t.textContent.trim() === 'All Classes'
        : t.getAttribute('onclick') && t.getAttribute('onclick').indexOf("'" + cls + "'") !== -1;
      if (match) t.classList.add('active');
    });

    /* Subject tab */
    var sub = state.sub;
    document.querySelectorAll('.stab').forEach(function(t) {
      t.classList.remove('active');
      var ds = t.dataset.s || '';
      if (ds === sub) t.classList.add('active');
    });

    /* Theme is handled by the inline <script> block — no action needed here */
  }

  /* ── Build all cards ── */
  function buildGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var html = '';

    window.EXPERIMENTS.forEach(function (e, i) {
      var tagCls = window.subjectTagClass(e.subject);
      var clsList = e.classes.join(',');
      var searchStr = (e.title + ' ' + e.subject + ' ' + e.desc).toLowerCase();
      var delay = Math.min(i * 20, 500);

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
              '</div></div>';
    });

    html += '<div class="empty-state hidden" id="emptyState">' +
            '<div class="big">🔭</div>' +
            '<div>No experiments match your search.</div>' +
            '</div>';

    grid.innerHTML = html;

    /* Restore state after grid is built */
    restoreTabs();
    applyAll();

    /* Restore scroll position (after a paint so layout is complete) */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (state.scroll > 0) window.scrollTo({ top: state.scroll, behavior: 'instant' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', buildGrid);
})();
