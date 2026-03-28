/* fullscreen.js — full-modal fullscreen with F key shortcut */
(function () {

  var FSI_EXPAND = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  var FSI_SHRINK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>';

  /* ── FS helpers ── */
  function enterFS(el) {
    if      (el.requestFullscreen)       el.requestFullscreen({ navigationUI:'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
  }
  function exitFS() {
    if      (document.exitFullscreen)       document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
  }
  function isFS() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
  }

  /* ── Create FS button and inject into modal header ── */
  function injectFSBtn() {
    if (document.getElementById('fsBtnModal')) return;
    var closeBtn = document.querySelector('.m-close');
    if (!closeBtn) return;

    var btn = document.createElement('button');
    btn.id = 'fsBtnModal';
    btn.className = 'm-close fs-modal-btn';
    btn.title = 'Fullscreen  (F)';
    btn.innerHTML = FSI_EXPAND;
    btn.setAttribute('aria-label', 'Toggle fullscreen');
    btn.onclick = toggleFS;

    /* Insert just before the ✕ close button */
    closeBtn.parentNode.insertBefore(btn, closeBtn);
  }

  function removeFSBtn() {
    var btn = document.getElementById('fsBtnModal');
    if (btn) btn.remove();
  }

  /* ── Toggle fullscreen on the overlay (entire modal experience) ── */
  function toggleFS() {
    var overlay = document.getElementById('overlay');
    if (!overlay) return;
    if (isFS()) {
      exitFS();
    } else {
      enterFS(overlay);
    }
  }

  /* ── Update button icon + redraw canvases on FS change ── */
  function onFSChange() {
    var btn = document.getElementById('fsBtnModal');
    if (!btn) return;
    if (isFS()) {
      btn.innerHTML = FSI_SHRINK;
      btn.title = 'Exit fullscreen  (Esc)';
    } else {
      btn.innerHTML = FSI_EXPAND;
      btn.title = 'Fullscreen  (F)';
    }
    /* Force canvas redraw at new dimensions */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        document.querySelectorAll('canvas').forEach(function(cv) {
          cv._hiDPIReady = false;
        });
      });
    });
  }

  document.addEventListener('fullscreenchange',       onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);
  document.addEventListener('mozfullscreenchange',    onFSChange);

  /* ── Keyboard: F to toggle, only when modal open ── */
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'f' && e.key !== 'F') return;
    var overlay = document.getElementById('overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    toggleFS();
  });

  /* ── Patch openModal to inject button, closeModal to remove + exit FS ── */
  var _origOpen  = window.openModal;
  var _origClose = window.closeModal;

  window.openModal = function(id) {
    if (_origOpen) _origOpen(id);
    /* Wait a frame for modal-hdr to render */
    requestAnimationFrame(injectFSBtn);
  };

  window.closeModal = function() {
    /* Exit FS before closing so overlay doesn't stay full-screen */
    if (isFS()) exitFS();
    if (_origClose) _origClose();
    removeFSBtn();
  };

})();
