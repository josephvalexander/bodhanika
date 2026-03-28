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

    document.getElementById('mIcon').textContent = e.icon;
    document.getElementById('mTitle').textContent = e.title;

    var tagCls = window.subjectTagClass(e.subject);
    document.getElementById('mTags').innerHTML =
      '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
      e.classes.map(function (c) { return '<span class="tag tag-cls">Class ' + c + '</span>'; }).join('') +
      '<span class="tag tag-mode">Virtual + Home</span>';

    document.getElementById('bVirt').classList.add('active');
    document.getElementById('bHome').classList.remove('active');

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
    var body = document.getElementById('modalBody');

    var simFn = window.SIM_REGISTRY && window.SIM_REGISTRY[e.simId];

    if (simFn) {
      body.innerHTML =
        '<div class="sim-box" id="simBox">' +
        '<div class="sim-label">Interactive Simulation</div>' +
        '<div id="simContainer" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px"></div>' +
        '</div>' +
        renderBuddy(e);
      simFn(document.getElementById('simContainer'), e);
    } else {
      /* Rich default — shows quiz-style interaction */
      body.innerHTML = renderRichDefault(e) + renderBuddy(e);
    }
  }

  /* ── Rich default simulation: interactive quiz + visual ── */
  function renderRichDefault(e) {
    var steps = e.steps || [];
    var stepsHtml = steps.map(function(s, i) {
      return '<div class="def-step" id="ds' + i + '" style="display:' + (i===0?'flex':'none') + ';gap:10px;align-items:flex-start;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;animation:fadeUp .3s ease">' +
             '<div style="width:28px;height:28px;border-radius:50%;background:var(--acc);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">' + (i+1) + '</div>' +
             '<div style="flex:1;font-size:13px;line-height:1.7;">' + s + '</div>' +
             '</div>';
    }).join('');

    return '<div class="sim-box">' +
           '<div style="font-size:52px;margin-bottom:4px;">' + e.icon + '</div>' +
           '<div class="sim-label">Step-by-Step Guide</div>' +
           '<div id="defStepsWrap" style="width:100%;text-align:left;">' + stepsHtml + '</div>' +
           '<div class="ctrl-row" style="margin-top:4px;">' +
           '<button class="cbtn" id="defPrev" onclick="defNav(-1)" style="display:none">← Prev</button>' +
           '<span id="defCounter" style="font-size:11px;color:var(--muted);font-weight:700;">Step 1 of ' + steps.length + '</span>' +
           '<button class="cbtn" id="defNext" onclick="defNav(1)">Next →</button>' +
           '</div>' +
           '<div class="why-box" style="margin-top:12px;text-align:left;">' +
           '<h4>🔬 The Science Behind It</h4><p>' + e.why + '</p>' +
           '</div>' +
           '</div>';
  }

  var defCurrent = 0;
  window.defNav = function(dir) {
    var e = window.EXP_MAP[currentId];
    if (!e) return;
    var steps = e.steps || [];
    var prev = document.getElementById('ds' + defCurrent);
    if (prev) prev.style.display = 'none';
    defCurrent = Math.max(0, Math.min(steps.length - 1, defCurrent + dir));
    var curr = document.getElementById('ds' + defCurrent);
    if (curr) curr.style.display = 'flex';
    document.getElementById('defCounter').textContent = 'Step ' + (defCurrent+1) + ' of ' + steps.length;
    document.getElementById('defPrev').style.display = defCurrent === 0 ? 'none' : '';
    document.getElementById('defNext').style.display = defCurrent === steps.length-1 ? 'none' : '';
    if (defCurrent === steps.length-1) {
      document.getElementById('defNext').textContent = '✅ Done!';
    }
  };

  /* ── Home mode ── */
  function renderHome(e) {
    if (window.simCleanup) { window.simCleanup(); window.simCleanup = null; }
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
})();
