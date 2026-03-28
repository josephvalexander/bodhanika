/* modal.js — modal open/close, mode switching, content rendering */
(function () {
  var currentId = null;
  var currentMode = 'v'; // 'v' = virtual, 'h' = home

  /* ── Open ── */
  window.openModal = function (id) {
    var e = window.EXP_MAP[id];
    if (!e) return;
    currentId = id;
    currentMode = 'v';

    /* Header */
    document.getElementById('mIcon').textContent = e.icon;
    document.getElementById('mTitle').textContent = e.title;

    var tagCls = window.subjectTagClass(e.subject);
    document.getElementById('mTags').innerHTML =
      '<span class="tag ' + tagCls + '">' + e.subject + '</span>' +
      e.classes.map(function (c) { return '<span class="tag tag-cls">Class ' + c + '</span>'; }).join('') +
      '<span class="tag tag-mode">Virtual + Home</span>';

    /* Mode buttons */
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
    /* Stop any running simulation */
    if (window.simCleanup) { window.simCleanup(); window.simCleanup = null; }
    currentId = null;
  };

  /* Close on overlay click (not modal click) */
  window.closeCheck = function (evt) {
    if (evt.target === document.getElementById('overlay')) window.closeModal();
  };

  /* Close on Escape */
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
    body.innerHTML =
      '<div class="sim-box" id="simBox">' +
      '<div class="sim-label">Interactive Simulation</div>' +
      '<div id="simContainer" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:10px"></div>' +
      '</div>' +
      renderBuddy(e);
    /* Trigger simulation */
    if (window.SIM_REGISTRY && window.SIM_REGISTRY[e.simId]) {
      window.SIM_REGISTRY[e.simId](document.getElementById('simContainer'), e);
    } else {
      document.getElementById('simContainer').innerHTML = renderDefaultSim(e);
    }
  }

  function renderDefaultSim(e) {
    return '<div style="font-size:56px;margin-bottom:8px">' + e.icon + '</div>' +
           '<div style="font-size:13px;color:var(--muted);text-align:center;max-width:320px;line-height:1.7">' +
           e.why + '</div>';
  }

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
