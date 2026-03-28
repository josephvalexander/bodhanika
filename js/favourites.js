/* favourites.js — heart on cards + My Lab slide-in drawer */
(function () {

  var FAV_KEY = 'bodhanika_favs';

  /* ── Storage ── */
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch(e) { return []; }
  }
  function saveFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch(e) {}
  }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }

  /* ── Toggle a favourite ── */
  window.toggleFav = function(id, btn, evt) {
    if (evt) evt.stopPropagation();
    var favs = getFavs();
    var idx  = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
      setHeart(btn, true);
      btn.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],
                  {duration:300, easing:'ease-out'});
    } else {
      favs.splice(idx, 1);
      setHeart(btn, false);
    }
    saveFavs(favs);
    refreshDrawer();
    updateBadge();
  };

  function setHeart(btn, on) {
    btn.textContent = on ? '♥' : '♡';
    btn.classList.toggle('fav-on', on);
    btn.title = on ? 'Remove from My Lab' : 'Add to My Lab';
  }

  /* ── Header badge ── */
  function updateBadge() {
    var favs  = getFavs();
    var btn   = document.getElementById('myLabToggleBtn');
    var badge = document.getElementById('myLabBadge');
    var hrt   = btn && btn.querySelector('.mylab-hrt');
    if (!badge) return;
    if (favs.length > 0) {
      badge.textContent = favs.length;
      badge.style.display = 'flex';
      if (hrt) hrt.textContent = '♥';
      if (hrt) hrt.style.color = '#f43f5e';
    } else {
      badge.style.display = 'none';
      if (hrt) hrt.textContent = '♡';
      if (hrt) hrt.style.color = '';
    }
  }

  /* ── Drawer open / close ── */
  var drawerOpen = false;
  window.toggleMyLabDrawer = function() {
    drawerOpen = !drawerOpen;
    var drawer   = document.getElementById('myLabDrawer');
    var backdrop = document.getElementById('myLabBackdrop');
    if (!drawer) return;
    drawer.classList.toggle('open', drawerOpen);
    backdrop.classList.toggle('open', drawerOpen);
    document.body.classList.toggle('drawer-open', drawerOpen);
    if (drawerOpen) refreshDrawer();
  };

  /* ── Refresh drawer content ── */
  function refreshDrawer() {
    var favs    = getFavs();
    var grid    = document.getElementById('myLabGrid');
    var empty   = document.getElementById('myLabEmpty');
    if (!grid) return;

    if (favs.length === 0) {
      grid.innerHTML  = '';
      if (empty) empty.style.display = 'block';
      updateBadge();
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = favs.map(function(id) {
      var e = window.EXP_MAP && window.EXP_MAP[id];
      if (!e) return '';
      var tagCls = window.subjectTagClass(e.subject);
      return '<div class="exp-card fav-card" data-id="' + id + '" ' +
             'onclick="window.toggleMyLabDrawer();openModal(\'' + id + '\')">' +
             '<div class="card-top" style="background:' + e.bgGrad + '">' + e.icon + '</div>' +
             '<div class="card-body">' +
             '<div class="card-meta">' +
             '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
             e.classes.map(function(c){ return '<span class="tag tag-cls">Cl '+c+'</span>'; }).join('') +
             '</div>' +
             '<div class="card-title">' + e.title + '</div>' +
             '</div>' +
             '<button class="fav-btn fav-on" title="Remove from My Lab" ' +
             'onclick="toggleFav(\'' + id + '\',this,event)">♥</button>' +
             '</div>';
    }).join('');
    updateBadge();
  }

  /* ── Inject hearts into all grid cards ── */
  function injectHearts() {
    var favs = getFavs();
    document.querySelectorAll('.exp-card[data-id]').forEach(function(card) {
      if (card.querySelector('.fav-btn')) return;
      var id = card.dataset.id;
      var on = favs.indexOf(id) !== -1;
      var btn = document.createElement('button');
      btn.className = 'fav-btn' + (on ? ' fav-on' : '');
      btn.textContent = on ? '♥' : '♡';
      btn.title = on ? 'Remove from My Lab' : 'Add to My Lab';
      btn.setAttribute('aria-label', 'Favourite');
      btn.onclick = function(e) { window.toggleFav(id, btn, e); };
      card.appendChild(btn);
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    updateBadge();
    /* Watch grid for new cards */
    var grid = document.getElementById('grid');
    if (grid) {
      new MutationObserver(function() {
        injectHearts();
      }).observe(grid, { childList: true });
    }
    setTimeout(function() { injectHearts(); }, 120);

    /* Esc closes drawer */
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drawerOpen) window.toggleMyLabDrawer();
    });
  });

  /* Re-sync hearts after modal closes (user may have favourited inside modal title bar — future) */
  var _origClose = window.closeModal;
  window.closeModal = function() {
    if (_origClose) _origClose();
    injectHearts();
  };

})();
