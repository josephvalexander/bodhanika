/* favourites.js — heart button on cards + "My Lab" pinned section */
(function () {

  var FAV_KEY = 'bodhanika_favs';

  /* ── Storage helpers ── */
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch(e) { return []; }
  }
  function saveFavs(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch(e) {}
  }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }

  window.toggleFav = function(id, btn, evt) {
    if (evt) evt.stopPropagation();           /* don't open modal */
    var favs = getFavs();
    var idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
      btn.textContent = '♥';
      btn.classList.add('fav-on');
      btn.title = 'Remove from My Lab';
      /* pop animation */
      btn.animate([{transform:'scale(1)'},{transform:'scale(1.45)'},{transform:'scale(1)'}],
                  {duration:320, easing:'ease-out'});
    } else {
      favs.splice(idx, 1);
      btn.textContent = '♡';
      btn.classList.remove('fav-on');
      btn.title = 'Add to My Lab';
    }
    saveFavs(favs);
    refreshMyLab();
  };

  /* ── Inject heart into every card after grid builds ── */
  function injectHearts() {
    var favs = getFavs();
    document.querySelectorAll('.exp-card[data-id]').forEach(function(card) {
      if (card.querySelector('.fav-btn')) return;   /* already injected */
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

  /* ── My Lab section (pinned above main grid) ── */
  function refreshMyLab() {
    var favs = getFavs();
    var section = document.getElementById('myLabSection');

    if (favs.length === 0) {
      if (section) section.remove();
      return;
    }

    /* Build or clear section */
    if (!section) {
      section = document.createElement('div');
      section.id = 'myLabSection';
      var grid = document.getElementById('grid');
      grid.parentNode.insertBefore(section, grid);
    }

    var cards = favs.map(function(id) {
      var e = window.EXP_MAP && window.EXP_MAP[id];
      if (!e) return '';
      var tagCls = window.subjectTagClass(e.subject);
      return '<div class="exp-card fav-card" data-id="' + id + '" onclick="openModal(\'' + id + '\')">' +
             '<div class="card-top" style="background:' + e.bgGrad + '">' + e.icon + '</div>' +
             '<div class="card-body">' +
             '<div class="card-meta">' +
             '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
             e.classes.map(function(c){ return '<span class="tag tag-cls">Cl ' + c + '</span>'; }).join('') +
             '</div>' +
             '<div class="card-title">' + e.title + '</div>' +
             '</div>' +
             '<button class="fav-btn fav-on" title="Remove from My Lab" ' +
             'onclick="toggleFav(\'' + id + '\',this,event)">♥</button>' +
             '</div>';
    }).join('');

    section.innerHTML =
      '<div class="mylab-header">' +
      '<span class="mylab-title">♥ My Lab</span>' +
      '<span class="mylab-count">' + favs.length + ' saved</span>' +
      '</div>' +
      '<div class="mylab-grid">' + cards + '</div>';
  }

  /* ── Init after grid is ready ── */
  /* Patch buildGrid — wait for DOMContentLoaded then observe grid mutations */
  document.addEventListener('DOMContentLoaded', function() {
    /* MutationObserver picks up when app.js rebuilds the grid */
    var grid = document.getElementById('grid');
    if (grid) {
      var obs = new MutationObserver(function() {
        injectHearts();
        refreshMyLab();
      });
      obs.observe(grid, { childList: true });
    }
    /* Also fire once if grid was already built */
    setTimeout(function() {
      injectHearts();
      refreshMyLab();
    }, 100);
  });

  /* Re-inject when modal closes (state may have changed) */
  var _origClose = window.closeModal;
  window.closeModal = function() {
    if (_origClose) _origClose();
    injectHearts();
  };

})();
