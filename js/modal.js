/* modal.js — modal open/close, mode switching, content rendering */
(function () {
  var currentId = null;
  var currentMode = 'v';

  /* ── Open ── */
  window.openModal = function (id) {
    var e = window.EXP_MAP[id];
    if (!e) return;
    currentId = id;
    currentMode = 'v';
    /* Deep link — update URL hash without triggering hashchange */
    history.replaceState(null, '', '#' + id);

    document.getElementById('mIcon').textContent = e.icon;
    document.getElementById('mTitle').textContent = e.title;

    var tagCls = window.subjectTagClass(e.subject);
    document.getElementById('mTags').innerHTML =
      '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
      e.classes.map(function (c) { return '<span class="tag tag-cls">Class ' + c + '</span>'; }).join('') +
      '<span class="tag tag-mode">Virtual + Home</span>';

    document.getElementById('bVirt').classList.add('active');
    document.getElementById('bHome').classList.remove('active');

    /* Share button */
    var shareBtn = document.getElementById('mShare');
    if (shareBtn) {
      shareBtn.onclick = function() { shareExperiment(id, e.title); };
    }

    renderVirtual(e);
    document.getElementById('overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  /* ── Close ── */
  window.closeModal = function () {
    document.getElementById('overlay').classList.remove('open');
    document.body.style.overflow = '';
    if (window.simCleanup) { window.simCleanup(); window.simCleanup = null; }
    currentId = null;
    history.replaceState(null, '', location.pathname);
  };

  window.closeCheck = function (evt) {
    if (evt.target === document.getElementById('overlay')) window.closeModal();
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeModal();
  });

  /* ── Mode switch ── */
  window.switchMode = function (mode) {
    currentMode = mode;
    document.getElementById('bVirt').classList.toggle('active', mode === 'v');
    document.getElementById('bHome').classList.toggle('active', mode === 'h');
    var e = window.EXP_MAP[currentId];
    if (!e) return;
    if (mode === 'v') renderVirtual(e); else renderHome(e);
  };

  /* ── Virtual mode ── */
  function renderVirtual(e) {
    if (window.simCleanup) { window.simCleanup(); window.simCleanup = null; }
    var modal = document.getElementById('modal');

    /* Tear down any previous desktop split FIRST — it rebuilds modal.innerHTML */
    collapseDesktopLayout(modal);

    /* Get body AFTER collapse — collapse may have recreated the element */
    var body = document.getElementById('modalBody');
    if (!body) return; /* safety guard */

    var simFn = window.SIM_REGISTRY && window.SIM_REGISTRY[e.simId];

    if (simFn) {
      body.innerHTML =
        '<div id="simContainer" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px"></div>' +
        renderBuddy(e);
      simFn(document.getElementById('simContainer'), e);

      /* On desktop, switch to side-by-side layout */
      if (window.innerWidth >= 1024) {
        requestAnimationFrame(function() { buildDesktopLayout(modal, e); });
      }
    } else {
      body.innerHTML = renderRichDefault(e) + renderBuddy(e);
    }
  }

  /* ── Desktop split layout ── */
    /* Sims that use canvas as primary display — eligible for desktop split.
     DOM-based sims (colour-mixing, plant-parts, five-senses etc.) are excluded. */
  var CANVAS_SIMS = {
    'shadow-play':true, 'circuit-sim':true, 'magnet-sim':true,
    'sink-float':true, 'germination':true, 'pendulum':true,
    'ohms-law':true, 'velocity-time':true, 'probability-exp':true,
    'friction-sim':true, 'sound-vibration':true, 'sound-pitch':true,
    'tyndall-effect':true, 'refraction-slab':true, 'magnetic-field-map':true,
    'solar-system':true, 'states-matter':true, 'newtons-laws':true,
    'reflection-sim':true, 'convection-sim':true, 'natural-selection':true,
    'em-induction':true, 'projectile-sim':true, 'atomic-model':true,
    'erosion-sim':true, 'terrarium-cycle':true,
  };

  function buildDesktopLayout(modal, e) {
    var simContainer = document.getElementById('simContainer');
    if (!simContainer) return;

    /* Already split */
    if (modal.classList.contains('has-sim')) return;

    /* Only apply desktop split to canvas-primary sims */
    if (!e || !e.simId || !CANVAS_SIMS[e.simId]) return;

    /* Must have a direct canvas child */
    var canvas = simContainer.querySelector('canvas');
    if (!canvas) return;

    /* Grab the existing structural nodes */
    var hdr    = modal.querySelector('.modal-hdr');
    var toggle = modal.querySelector('.mode-toggle');
    var body   = document.getElementById('modalBody');
    var buddy  = body ? body.querySelector('.buddy') : null;

    /* Build left panel: header + tabs + buddy */
    var left = document.createElement('div');
    left.className = 'modal-left';
    left.appendChild(hdr);
    left.appendChild(toggle);

    /* Move buddy into left panel footer */
    var leftBody = document.createElement('div');
    leftBody.style.cssText = 'flex:1;overflow-y:auto;padding:14px 16px 18px;display:flex;flex-direction:column;gap:12px;';
    if (buddy) leftBody.appendChild(buddy);
    left.appendChild(leftBody);

    /* Build right panel: sim canvas fills remaining space */
    var right = document.createElement('div');
    right.className = 'modal-right';

    /* Only resize the PRIMARY canvas (direct child), not nested ones */
    var primaryCanvas = simContainer.children[0] && simContainer.children[0].tagName === 'CANVAS'
      ? simContainer.children[0]
      : canvas;
    primaryCanvas.style.cssText = 'flex:1;width:100%!important;min-height:320px;border-radius:0!important;display:block;';
    if (primaryCanvas._hiDPIReady !== undefined) primaryCanvas._hiDPIReady = false;

    simContainer.style.cssText = 'flex:1;width:100%;display:flex;flex-direction:column;min-height:0;';
    right.appendChild(simContainer);

    /* Clear modal and rebuild */
    modal.innerHTML = '';
    modal.appendChild(left);
    modal.appendChild(right);
    modal.classList.add('has-sim');

    /* Force canvas redraw after layout settles */
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var cv = simContainer.querySelector('canvas');
        if (cv && cv._hiDPIReady !== undefined) cv._hiDPIReady = false;
      });
    });
  }

  function collapseDesktopLayout(modal) {
    if (!modal.classList.contains('has-sim')) return;
    modal.classList.remove('has-sim');

    /* Restore standard structure from scratch — openModal already fills these */
    modal.innerHTML =
      '<div class="modal-hdr">' +
        '<div class="m-icon" id="mIcon"></div>' +
        '<div class="m-titles"><div class="m-title" id="mTitle"></div><div class="m-tags" id="mTags"></div></div>' +
        '<button id="mShare" class="m-share" title="Share experiment">🔗 Share</button>' +
        '<div class="m-close" onclick="closeModal()">✕</div>' +
      '</div>' +
      '<div class="mode-toggle">' +
        '<button class="mbtn active" id="bVirt" onclick="switchMode(\'v\')">🖥️ Try Virtually</button>' +
        '<button class="mbtn" id="bHome" onclick="switchMode(\'h\')">🏠 Do at Home</button>' +
      '</div>' +
      '<div class="modal-body" id="modalBody"></div>';
  }

  /* ── Subject colour themes ── */
  var THEMES = {
    'Science':     { color:'var(--sci)',  bg:'var(--sci-dim)',  glow:'rgba(255,107,107,.2)'  },
    'Maths':       { color:'var(--math)', bg:'var(--math-dim)', glow:'rgba(255,217,61,.2)'   },
    'EVS':         { color:'var(--evs)',  bg:'var(--evs-dim)',  glow:'rgba(107,203,119,.2)'  },
    'Life Skills': { color:'var(--life)', bg:'var(--life-dim)', glow:'rgba(77,150,255,.2)'   },
  };

  /* ── Extract emojis from a string ── */
  function extractEmojis(str) {
    var re = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    var m = str.match(re);
    return m ? m.slice(0, 3).join(' ') : '';
  }

  /* ── Rich animated virtual experience ── */
  function renderRichDefault(e) {
    var steps  = e.steps || [];
    var theme  = THEMES[e.subject] || THEMES['Science'];
    var total  = steps.length;

    /* Progress bar dots */
    var dots = steps.map(function(_, i) {
      return '<div id="dot' + i + '" onclick="defJump(' + i + ')" style="' +
        'width:' + (i===0?'24px':'10px') + ';height:10px;border-radius:8px;cursor:pointer;' +
        'background:' + (i===0 ? theme.color : 'var(--border)') + ';' +
        'transition:all .35s ease"></div>';
    }).join('');

    /* Step cards */
    var cards = steps.map(function(s, i) {
      var emojis = extractEmojis(s);
      var isFirst = i === 0;
      return '<div id="ds' + i + '" style="' +
        'display:' + (isFirst?'flex':'none') + ';flex-direction:column;' +
        'align-items:center;gap:14px;width:100%;' +
        'animation:fadeUp .35s ease both">' +
        /* Emoji showcase */
        (emojis ? '<div style="font-size:56px;line-height:1;' +
          'filter:drop-shadow(0 0 16px ' + theme.glow + ');' +
          'animation:pulse 2s ease infinite">' + emojis + '</div>' : 
          '<div style="font-size:56px;animation:pulse 2s ease infinite">' + e.icon + '</div>') +
        /* Step pill */
        '<div style="background:' + theme.color + ';color:white;' +
          'font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;' +
          'padding:3px 12px;border-radius:20px">Step ' + (i+1) + ' of ' + total + '</div>' +
        /* Step text card */
        '<div style="background:' + theme.bg + ';border:1.5px solid ' + theme.color + '44;' +
          'border-radius:14px;padding:16px 18px;width:100%;' +
          'font-size:14px;line-height:1.8;font-weight:600;color:var(--text);' +
          'text-align:center">' + s + '</div>' +
        '</div>';
    }).join('');

    /* Completion screen */
    var done = '<div id="ds' + total + '" style="' +
      'display:none;flex-direction:column;align-items:center;gap:14px;' +
      'animation:fadeUp .35s ease both">' +
      '<div style="font-size:72px;animation:pulse 1s ease infinite">🎉</div>' +
      '<div style="font-size:18px;font-weight:900;color:var(--evs)">You did it!</div>' +
      '<div style="font-size:13px;color:var(--muted);text-align:center;' +
        'line-height:1.8;max-width:280px">' +
        'Amazing work! Now switch to <b style="color:var(--text)">Do at Home</b> ' +
        'to try this experiment for real.</div>' +
      '<button onclick="switchMode(\'h\')" style="' +
        'background:var(--evs);color:white;border:none;border-radius:12px;' +
        'padding:12px 24px;font-family:Nunito,sans-serif;font-size:14px;' +
        'font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px">' +
        '🏠 Try at Home</button>' +
      '</div>';

    return '<div class="sim-box" style="gap:16px;padding:20px">' +
      /* Progress dots */
      '<div style="display:flex;gap:6px;justify-content:center;align-items:center">' +
      dots + '</div>' +
      /* Cards area */
      '<div style="width:100%;min-height:180px;display:flex;align-items:center;' +
        'justify-content:center">' +
      cards + done + '</div>' +
      /* Nav buttons */
      '<div style="display:flex;gap:10px;align-items:center;justify-content:center">' +
      '<button id="defPrev" onclick="defNav(-1)" style="' +
        'display:none;padding:10px 20px;border-radius:12px;' +
        'border:1.5px solid var(--border);background:var(--surface);' +
        'color:var(--text);font-family:Nunito,sans-serif;font-size:13px;' +
        'font-weight:800;cursor:pointer;transition:all .18s">← Back</button>' +
      '<button id="defNext" onclick="defNav(1)" style="' +
        'padding:12px 28px;border-radius:12px;' +
        'border:none;background:' + theme.color + ';' +
        'color:white;font-family:Nunito,sans-serif;font-size:14px;' +
        'font-weight:900;cursor:pointer;' +
        'box-shadow:0 4px 20px ' + theme.glow + ';' +
        'transition:all .18s">Let\'s go! 🚀</button>' +
      '</div></div>';
  }

  var defCurrent = 0;

  window.defJump = function(i) { _defGo(i); };
  window.defNav  = function(dir) { _defGo(defCurrent + dir); };

  function _defGo(next) {
    var e = window.EXP_MAP[currentId];
    if (!e) return;
    var total = (e.steps || []).length;

    /* Hide + un-highlight current */
    var prevEl  = document.getElementById('ds'  + defCurrent);
    var prevDot = document.getElementById('dot' + defCurrent);
    if (prevEl)  prevEl.style.display = 'none';
    if (prevDot) { prevDot.style.width = '10px'; prevDot.style.background = 'var(--border)'; }

    defCurrent = Math.max(0, Math.min(total, next));

    /* Show + highlight next */
    var currEl  = document.getElementById('ds'  + defCurrent);
    var currDot = document.getElementById('dot' + defCurrent);
    if (currEl)  currEl.style.display = 'flex';
    if (currDot) {
      var theme = THEMES[e.subject] || THEMES['Science'];
      currDot.style.width      = '24px';
      currDot.style.background = defCurrent >= total ? 'var(--evs)' : theme.color;
    }

    /* Update buttons */
    var prevBtn = document.getElementById('defPrev');
    var nextBtn = document.getElementById('defNext');
    if (prevBtn) prevBtn.style.display = defCurrent === 0 ? 'none' : '';
    if (nextBtn) {
      if (defCurrent >= total) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = '';
        nextBtn.textContent = defCurrent === total - 1 ? 'Finish! ✅' : 'Next →';
      }
    }
  }

  /* ── Home mode ── */
  function renderHome(e) {
    if (window.simCleanup) { window.simCleanup(); window.simCleanup = null; }
    var modal = document.getElementById('modal');
    collapseDesktopLayout(modal);
    var body = document.getElementById('modalBody');
    var mats = (e.materials || []).map(function (m) {
      return '<span class="mat">' + m + '</span>';
    }).join('');
    var steps = (e.steps || []).map(function (s, i) {
      return '<li><span class="snum">' + (i + 1) + '</span><span>' + s + '</span></li>';
    }).join('');
    body.innerHTML =
      '<div class="h-section"><h4>🧰 You\'ll Need</h4><div class="mats">' + mats + '</div></div>' +
      '<div class="h-section"><h4>📋 Steps</h4><ol class="steps-ol">' + steps + '</ol></div>' +
      '<div class="why-box"><h4>🔬 The Science Behind It</h4><p>' + e.why + '</p></div>' +
      renderBuddy(e);
  }

  function renderBuddy(e) {
    return '<div class="buddy">' +
           '<div class="buddy-av">🤖</div>' +
           '<div><div class="buddy-n">Lab Buddy Says</div>' +
           '<div class="buddy-t">' + e.buddy + '</div></div>' +
           '</div>';
  }

  /* ── Share ── */
  window.shareExperiment = function(id, title) {
    var url = location.origin + location.pathname + '#' + id;
    if (navigator.share) {
      navigator.share({ title: title + ' — Bodhanika', url: url })
        .catch(function(){});
    } else {
      navigator.clipboard.writeText(url).then(function() {
        var btn = document.getElementById('mShare');
        if (!btn) return;
        var orig = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.color = '#22c55e';
        setTimeout(function() {
          btn.innerHTML = orig;
          btn.style.color = '';
        }, 2000);
      }).catch(function() {
        /* Fallback for older browsers */
        var ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    }
  };

})();
