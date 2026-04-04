/* tips.js — Maths Tips & Tricks mode
   Handles grid rendering, modal, interactive challenge sims
*/
(function() {

/* ══════════════════════════════════════════
   GRID RENDERING
   ══════════════════════════════════════════ */
var mathsMode = 'experiments'; /* 'experiments' | 'tips' */

window.setMathsMode = function(mode) {
  mathsMode = mode;
  document.getElementById('mmtExp').classList.toggle('active', mode === 'experiments');
  document.getElementById('mmtTip').classList.toggle('active', mode === 'tips');
  if (mode === 'tips') {
    var box = document.getElementById('searchBox');
    if (box) box.placeholder = '🔍 Search tips…';
    renderTipsGrid();
  } else {
    /* Remove all tip cards */
    var grid = document.getElementById('grid');
    if (grid) grid.querySelectorAll('.tip-card').forEach(function(c) { c.remove(); });
    /* Restore exp cards — clear both style.display and hidden class */
    document.querySelectorAll('#grid > .exp-card').forEach(function(c) {
      c.style.display = '';
      c.classList.remove('tips-hidden');
    });
    restoreSearchPlaceholder();
    if (_origApplyAll) _origApplyAll();
  }
};

function renderTipsGrid() {
  var cls = (window._appState && window._appState()) || 'All';
  /* Get current class filter from app state */
  var classFilter = 'All';
  document.querySelectorAll('.ctab.active').forEach(function(t) {
    var oc = t.getAttribute('onclick') || '';
    var m = oc.match(/setClass\('([^']+)'/);
    if (m) classFilter = m[1];
  });

  var tips = window.MATHS_TIPS || [];
  if (classFilter !== 'All') {
    tips = tips.filter(function(t) {
      return t.classes.indexOf(classFilter) !== -1;
    });
  }

  var grid = document.getElementById('grid');
  if (!grid) return;

  /* Hide experiment cards using class (style.display harder to undo) */
  grid.querySelectorAll('.exp-card').forEach(function(c) { c.classList.add('tips-hidden'); });
  /* Remove old tip cards */
  grid.querySelectorAll('.tip-card').forEach(function(c) { c.remove(); });

  /* Empty state */
  var empty = document.getElementById('emptyState');
  if (empty) empty.classList.toggle('hidden', tips.length > 0);

  var fragment = document.createDocumentFragment();
  tips.forEach(function(tip) {
    var div = document.createElement('div');
    div.className = 'tip-card';
    div.dataset.tipId = tip.id;
    div.onclick = function() { openTipModal(tip.id); };
    div.innerHTML =
      '<div class="card-top" style="background:' + tip.bgGrad + '">' +
        '<div class="tip-badge">⚡ Tip</div>' +
        '<div style="font-size:48px;line-height:1">' + tip.icon + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-meta">' +
          '<span class="tag tag-math">Maths</span>' +
          tip.classes.map(function(c) { return '<span class="tag tag-cls">Cl ' + c + '</span>'; }).join('') +
          '<span class="tag tag-mode" style="margin-left:auto">⚡ Tips</span>' +
        '</div>' +
        '<div class="card-title">' + tip.title + '</div>' +
        '<div class="card-desc">' + tip.shortTrick + '</div>' +
      '</div>';
    fragment.appendChild(div);
  });
  grid.appendChild(fragment);
  /* Re-inject hearts */
  if (window.injectHearts) setTimeout(window.injectHearts, 50);
}

/* Show/hide toggle when Maths tab selected */
var _origSetSub = window.setSub;
window.setSub = function(sub, el) {
  if (_origSetSub) _origSetSub(sub, el);
  var wrap = document.getElementById('mathsModeWrap');
  if (wrap) wrap.style.display = sub === 'Maths' ? 'flex' : 'none';
  /* Reset to experiments when leaving Maths */
  if (sub !== 'Maths' && mathsMode === 'tips') {
    mathsMode = 'experiments';
    var mmtExp = document.getElementById('mmtExp');
    var mmtTip = document.getElementById('mmtTip');
    if (mmtExp) mmtExp.classList.add('active');
    if (mmtTip) mmtTip.classList.remove('active');
    /* Restore exp cards */
    var grid = document.getElementById('grid');
    if (grid) {
      grid.querySelectorAll('.tip-card').forEach(function(c) { c.remove(); });
      grid.querySelectorAll('.exp-card').forEach(function(c) {
        c.classList.remove('tips-hidden');
        c.style.display = '';
      });
      restoreSearchPlaceholder();
    }
  }
  if (sub === 'Maths' && mathsMode === 'tips') renderTipsGrid();
};

/* When class filter changes while in tips mode, refresh */
var _origSetClass = window.setClass;
window.setClass = function(cls, el) {
  if (_origSetClass) _origSetClass(cls, el);
  if (mathsMode === 'tips') renderTipsGrid();
};

/* Patch applyAll — in tips mode take full control, otherwise delegate */
var _origApplyAll = window.applyAll;

function filterTips() {
  var q = (document.getElementById('searchBox').value || '').toLowerCase().trim();
  var shown = 0;
  document.querySelectorAll('#grid > .tip-card').forEach(function(card) {
    var tipId = card.dataset.tipId;
    var tip = window.TIPS_MAP && window.TIPS_MAP[tipId];
    if (!tip) { card.classList.add('hidden'); return; }
    /* Also respect current class filter */
    var classFilter = 'All';
    document.querySelectorAll('.ctab.active').forEach(function(t) {
      var oc = t.getAttribute('onclick') || '';
      var m = oc.match(/setClass\('([^']+)'/);
      if (m) classFilter = m[1];
    });
    var classOk = classFilter === 'All' || tip.classes.indexOf(classFilter) !== -1;
    var searchStr = (tip.title + ' ' + tip.shortTrick + ' ' + tip.whyItWorks).toLowerCase();
    var searchOk = !q || searchStr.indexOf(q) !== -1;
    var visible = classOk && searchOk;
    card.classList.toggle('hidden', !visible);
    if (visible) shown++;
  });
  /* Update placeholder */
  var empty = document.getElementById('emptyState');
  if (empty) empty.classList.toggle('hidden', shown > 0);
  /* Update search placeholder to hint at tips */
  var box = document.getElementById('searchBox');
  if (box && box.placeholder.indexOf('tip') === -1) {
    box.placeholder = '🔍 Search tips…';
  }
}

function restoreSearchPlaceholder() {
  var box = document.getElementById('searchBox');
  if (box) box.placeholder = '🔍 Search experiments…';
}

window.applyAll = function() {
  if (mathsMode === 'tips') {
    /* In tips mode: keep exp cards hidden, only filter tips */
    document.querySelectorAll('#grid > .exp-card').forEach(function(c) {
      c.classList.add('tips-hidden');
    });
    filterTips();
  } else {
    /* Normal mode: delegate to original */
    if (_origApplyAll) _origApplyAll();
  }
};

/* ══════════════════════════════════════════
   TIP MODAL
   ══════════════════════════════════════════ */
window.TIP_MAP = window.TIPS_MAP; /* alias for deep linking */
window.openTipModal = function(tipId) {
  var tip = window.TIPS_MAP && window.TIPS_MAP[tipId];
  if (!tip) return;

  /* Deep link */
  history.replaceState(null, '', '#' + tipId);

  /* Re-use the existing modal shell */
  var modal  = document.getElementById('modal');
  var overlay = document.getElementById('overlay');

  /* Collapse any desktop split */
  if (modal.classList.contains('has-sim')) modal.classList.remove('has-sim');

  modal.innerHTML =
    '<div class="modal-hdr">' +
      '<div class="m-icon">' + tip.icon + '</div>' +
      '<div class="m-titles">' +
        '<div class="m-title">' + tip.title + '</div>' +
        '<div class="m-tags">' +
          '<span class="tag tag-math">Maths</span>' +
          tip.classes.map(function(c) { return '<span class="tag tag-cls">Class ' + c + '</span>'; }).join('') +
          '<span class="tag tag-mode" style="background:var(--math-dim);color:var(--math);border-color:var(--math)">⚡ Tip</span>' +
        '</div>' +
      '</div>' +
      '<button class="m-share" onclick="shareTip(\''+tipId+'\',\''+tip.title+'\')" title="Share">🔗 Share</button>' +
      '<div class="m-close" onclick="closeTipModal()">✕</div>' +
    '</div>' +
    '<div class="mode-toggle">' +
      '<button class="mbtn active" id="tipBtnTry" onclick="tipTab(\'try\')">⚡ The Trick</button>' +
      '<button class="mbtn" id="tipBtnWhy" onclick="tipTab(\'why\')">🔍 Why It Works</button>' +
    '</div>' +
    '<div class="modal-body" id="tipModalBody"></div>';

  renderTipTry(tip);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeTipModal = function() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
};

window.shareTip = function(id, title) {
  var url = location.origin + location.pathname + '#' + id;
  if (navigator.share) {
    navigator.share({ title: title + ' — Bodhanika Maths Tip', url: url }).catch(function(){});
  } else {
    navigator.clipboard.writeText(url).then(function() {
      var btn = document.querySelector('.m-share');
      if (!btn) return;
      var orig = btn.innerHTML;
      btn.innerHTML = '✅ Copied!';
      btn.style.color = '#22c55e';
      setTimeout(function() { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
    }).catch(function() {
      var ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    });
  }
};

window.tipTab = function(tab) {
  var tipId = document.querySelector('.modal-hdr .m-title')
    ? document.querySelector('.modal-hdr .m-title').textContent : '';
  /* Find tip by title */
  var tip = window.MATHS_TIPS && window.MATHS_TIPS.find(function(t) { return t.title === tipId; });
  if (!tip) return;
  document.getElementById('tipBtnTry').classList.toggle('active', tab === 'try');
  document.getElementById('tipBtnWhy').classList.toggle('active', tab === 'why');
  if (tab === 'try') renderTipTry(tip);
  else renderTipWhy(tip);
};

function renderTipTry(tip) {
  var body = document.getElementById('tipModalBody');
  if (!body) return;

  /* Pick a random challenge */
  var challenges = tip.challenge || [];
  var qi = Math.floor(Math.random() * challenges.length);

  body.innerHTML =
    /* The trick card */
    '<div style="background:var(--math-dim);border:1.5px solid var(--math)44;border-radius:14px;padding:16px 18px;margin-bottom:14px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--math);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">The Trick</div>' +
      '<div style="font-size:14px;color:var(--text);line-height:1.8;font-weight:600">' + tip.shortTrick + '</div>' +
    '</div>' +
    /* Example */
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Example</div>' +
      '<div style="font-size:13px;color:var(--text);line-height:1.9;font-family:monospace">' + tip.example + '</div>' +
    '</div>' +
    /* Interactive challenge */
    '<div id="tipChallenge" style="background:var(--surface2);border:1.5px solid var(--math)55;border-radius:14px;padding:14px 16px">' +
      renderChallenge(tip, qi) +
    '</div>' +
    /* Buddy */
    '<div class="buddy" style="margin-top:14px">' +
      '<div class="buddy-av">🤖</div>' +
      '<div><div class="buddy-n">Lab Buddy Says</div>' +
      '<div class="buddy-t">' + tip.buddy + '</div></div>' +
    '</div>';

  /* Wire up current challenge index for checking */
  window._tipCurrentChallenge = { tip: tip, qi: qi };
}

function renderChallenge(tip, qi) {
  return '<div style="font-size:10px;font-weight:800;color:var(--math);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">⚡ Try It</div>' +
    '<div style="font-size:16px;font-weight:900;color:var(--text);margin-bottom:12px">' + tip.challenge[qi] + ' = ?</div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<input id="tipAnswer" type="number" placeholder="Your answer" ' +
        'style="width:110px;background:var(--surface);border:1.5px solid var(--math);border-radius:10px;' +
        'padding:8px 12px;color:var(--text);font-size:16px;font-weight:900;text-align:center;outline:none" ' +
        'onkeydown="if(event.key===\'Enter\') checkTipAnswer()">' +
      '<button onclick="checkTipAnswer()" ' +
        'style="padding:8px 18px;border-radius:10px;border:none;background:var(--math);color:#1a0a00;' +
        'font-family:Nunito,sans-serif;font-size:13px;font-weight:900;cursor:pointer">Check ✓</button>' +
      '<button onclick="nextTipChallenge()" ' +
        'style="padding:8px 14px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface2);' +
        'color:var(--muted);font-family:Nunito,sans-serif;font-size:12px;font-weight:700;cursor:pointer">Next →</button>' +
    '</div>' +
    '<div id="tipFeedback" style="margin-top:10px;min-height:24px;font-size:13px;font-weight:700"></div>';
}

window.checkTipAnswer = function() {
  if (!window._tipCurrentChallenge) return;
  var tip = window._tipCurrentChallenge.tip;
  var qi  = window._tipCurrentChallenge.qi;
  var input = document.getElementById('tipAnswer');
  var feedback = document.getElementById('tipFeedback');
  if (!input || !feedback) return;

  var userVal = parseInt(input.value);
  /* Compute correct answer by evaluating the challenge expression */
  var expr = tip.challenge[qi].replace('Is ', '').replace(' divisible by 3?','').replace(' divisible by 9?','');
  var correct;
  try {
    /* Safe eval for arithmetic expressions */
    correct = Function('"use strict"; return (' + expr + ')')();
    /* Divisibility questions return boolean */
    if (tip.challenge[qi].indexOf('divisible') !== -1) {
      var num = parseInt(tip.challenge[qi].match(/\d[\d,]*/)[0].replace(/,/g,''));
      var div = tip.challenge[qi].indexOf('by 9') !== -1 ? 9 : 3;
      correct = (num % div === 0) ? 1 : 0;
      userVal = (input.value.toLowerCase() === 'yes') ? 1 : (input.value.toLowerCase() === 'no') ? 0 : parseInt(input.value);
    }
  } catch(e) { return; }

  if (!isNaN(userVal) && Math.round(userVal) === Math.round(correct)) {
    feedback.innerHTML = '<span style="color:#34d399">✅ Correct! ' + expr + ' = ' + Math.round(correct) + '</span>';
    input.style.borderColor = '#34d399';
  } else {
    feedback.innerHTML = '<span style="color:#f87171">❌ Not quite. Hint: apply the trick step by step.</span>';
    input.style.borderColor = '#f87171';
  }
};

window.nextTipChallenge = function() {
  if (!window._tipCurrentChallenge) return;
  var tip = window._tipCurrentChallenge.tip;
  var qi  = (window._tipCurrentChallenge.qi + 1) % tip.challenge.length;
  window._tipCurrentChallenge.qi = qi;
  var container = document.getElementById('tipChallenge');
  if (container) container.innerHTML = renderChallenge(tip, qi);
};

function renderTipWhy(tip) {
  var body = document.getElementById('tipModalBody');
  if (!body) return;
  body.innerHTML =
    '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:14px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">The Maths Behind It</div>' +
      '<div style="font-size:14px;color:var(--text);line-height:1.9">' + tip.whyItWorks + '</div>' +
    '</div>' +
    '<div style="background:var(--math-dim);border:1.5px solid var(--math)44;border-radius:12px;padding:12px 16px;margin-bottom:14px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--math);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Example Verified</div>' +
      '<div style="font-size:13px;color:var(--text);line-height:1.9;font-family:monospace">' + tip.example + '</div>' +
    '</div>' +
    '<div class="buddy">' +
      '<div class="buddy-av">🤖</div>' +
      '<div><div class="buddy-n">Lab Buddy Says</div>' +
      '<div class="buddy-t">' + tip.buddy + '</div></div>' +
    '</div>';
}

/* Escape key closes tip modal */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var overlay = document.getElementById('overlay');
    if (overlay && overlay.classList.contains('open')) window.closeTipModal();
  }
});

})();
