/* fullscreen.js — fullscreen button for canvas sims, keyboard shortcut */
(function () {

  var FSQ_SELECTOR = '#simContainer canvas, #simContainer [id$="Canvas"]';

  /* ── Fullscreen helpers ── */
  function enterFS(el) {
    if      (el.requestFullscreen)       el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
  }
  function exitFS() {
    if      (document.exitFullscreen)       document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
  }
  function isFS() {
    return !!(document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement);
  }

  /* ── Inject the fullscreen button into simContainer ── */
  function injectFSBtn(container) {
    if (!container || container.querySelector('.fs-btn')) return;

    var btn = document.createElement('button');
    btn.className = 'fs-btn';
    btn.title = 'Fullscreen (F)';
    btn.innerHTML = FSI_EXPAND;
    btn.setAttribute('aria-label', 'Fullscreen');
    btn.onclick = function() {
      if (isFS()) { exitFS(); } else {
        /* Prefer the canvas element itself; fall back to container */
        var cv = container.querySelector('canvas');
        enterFS(cv || container);
      }
    };

    /* Position relative to container */
    container.style.position = 'relative';
    container.appendChild(btn);
  }

  /* ── SVG icons ── */
  var FSI_EXPAND = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  var FSI_SHRINK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>';

  /* ── Update button icon when FS state changes ── */
  function onFSChange() {
    var btn = document.querySelector('.fs-btn');
    if (!btn) return;
    if (isFS()) {
      btn.innerHTML = FSI_SHRINK;
      btn.title = 'Exit Fullscreen (Esc)';
      /* When a canvas goes fullscreen, force it to redraw at new size */
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          document.querySelectorAll('canvas').forEach(function(cv) {
            if (cv._hiDPIReady) {
              cv._hiDPIReady = false;  /* force getCtx to remeasure */
            }
          });
        });
      });
    } else {
      btn.innerHTML = FSI_EXPAND;
      btn.title = 'Fullscreen (F)';
      /* Restore canvas after exiting FS */
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          document.querySelectorAll('canvas').forEach(function(cv) {
            if (cv._hiDPIReady) cv._hiDPIReady = false;
          });
        });
      });
    }
  }

  document.addEventListener('fullscreenchange',       onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);
  document.addEventListener('mozfullscreenchange',    onFSChange);

  /* ── Keyboard shortcut: F to toggle fullscreen when modal is open ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'f' || e.key === 'F') {
      /* Only when modal is open, no input focused */
      var overlay = document.getElementById('overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      if (document.activeElement && document.activeElement.tagName.match(/INPUT|TEXTAREA/)) return;
      e.preventDefault();
      if (isFS()) { exitFS(); } else {
        var cv = document.querySelector('#simContainer canvas');
        var sc = document.getElementById('simContainer');
        if (cv || sc) enterFS(cv || sc);
      }
    }
  });

  /* ── Watch for simContainer to appear (modal open) ── */
  var bodyObs;
  document.addEventListener('DOMContentLoaded', function() {
    var modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    bodyObs = new MutationObserver(function() {
      var sc = document.getElementById('simContainer');
      if (sc && sc.querySelector('canvas')) {
        injectFSBtn(sc);
      }
    });
    bodyObs.observe(modalBody, { childList: true, subtree: true });
  });

  /* ── Also patch renderVirtual so we catch canvas insertion timing ── */
  /* Use a small polling approach after modal open as belt-and-suspenders */
  var _origOpen = window.openModal;
  window.openModal = function(id) {
    if (_origOpen) _origOpen(id);
    /* Poll briefly until simContainer has a canvas */
    var attempts = 0;
    var poll = setInterval(function() {
      var sc = document.getElementById('simContainer');
      if (sc) {
        injectFSBtn(sc);
        clearInterval(poll);
      }
      if (++attempts > 20) clearInterval(poll);
    }, 100);
  };

})();
