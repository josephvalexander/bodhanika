/* sims.js — simulation registry
   Each entry: window.SIM_REGISTRY[simId] = function(container, experiment) { ... }
   Simulations should write into `container` and optionally set window.simCleanup.
*/
window.SIM_REGISTRY = {};

/* ── Utility helpers ── */
function btn(label, cls, onclick) {
  return '<button class="cbtn ' + (cls||'') + '" onclick="' + onclick + '">' + label + '</button>';
}
function row(content) { return '<div class="ctrl-row">' + content + '</div>'; }
function label(t)     { return '<div class="sim-label">' + t + '</div>'; }

/**
 * getCtx(id) — hiDPI-aware canvas context
 * Returns {ctx, W, H} in logical CSS pixels.
 * Call at the start of every draw function instead of getElementById + getContext.
 */
function getCtx(id) {
  var cv = document.getElementById(id);
  if (!cv) return null;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* Measure true CSS display width — parent is more reliable than self before first paint */
  var rect = cv.getBoundingClientRect();
  var parentW = cv.parentElement ? cv.parentElement.getBoundingClientRect().width : 0;
  var W = Math.max(rect.width > 10 ? rect.width : 0, parentW > 20 ? parentW : 0);
  if (W < 10) W = parseInt(cv.getAttribute('data-w')) || 300;

  /* Height from data-h attribute (explicit) or aspect ratio fallback */
  var attrH = parseInt(cv.getAttribute('data-h')) || parseInt(cv.getAttribute('height')) || 0;
  var H = attrH > 10 ? attrH : Math.round(W * 0.6);

  /* Reinitialise backing store only when size actually changed */
  if (!cv._hiDPIReady || Math.abs(cv._W - W) > 4 || Math.abs(cv._H - H) > 4) {
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    cv._W = W; cv._H = H; cv._dpr = dpr; cv._hiDPIReady = true;
  }
  var ctx = cv.getContext('2d');
  ctx.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0);
  return { ctx: ctx, W: cv._W, H: cv._H, cv: cv };
}

/* ══════════ SCIENCE SIMULATIONS ══════════ */

/* Sink or Float */
/* ══════════════════════════════════════
   FIXED SIMS — replacing weak early ones
   ══════════════════════════════════════ */

/* ── SINK OR FLOAT (canvas, physics animation) ── */
SIM_REGISTRY['sink-float'] = function(c) {
  var items = [
    { name:'Leaf',   floats:true,  color:'#22c55e', fact:'Waxy surface traps air — density < water!' },
    { name:'Coin',   floats:false, color:'#9ca3af', fact:'Metal is ~8× denser than water.' },
    { name:'Cap',    floats:true,  color:'#3b82f6', fact:'Hollow dome traps air, reducing average density.' },
    { name:'Stone',  floats:false, color:'#78716c', fact:'Rock is 2.7× denser than water.' },
    { name:'Sponge', floats:true,  color:'#f59e0b', fact:'Air pockets make overall density < water.' },
    { name:'Pencil', floats:true,  color:'#f97316', fact:'Wood density ~0.5 g/cc — half that of water.' },
  ];
  var dropped = [];
  var raf;

  function drawItem(ctx, item, x, y) {
    ctx.save();
    var n = item.name;
    if (n === 'Leaf') {
      /* Green leaf with veins */
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.3);
      /* Main leaf body */
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.bezierCurveTo(12, -10, 16, 2, 10, 14);
      ctx.bezierCurveTo(0, 18, -10, 18, -10, 14);
      ctx.bezierCurveTo(-16, 2, -12, -10, 0, -14);
      ctx.fill();
      /* Lighter highlight */
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      /* Midrib */
      ctx.strokeStyle = '#14532d'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 14); ctx.stroke();
      /* Side veins */
      ctx.strokeStyle = '#14532d'; ctx.lineWidth = 0.7;
      for (var v = -8; v <= 8; v += 4) {
        ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(8, v - 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(-8, v - 3); ctx.stroke();
      }
      ctx.restore();
    } else if (n === 'Coin') {
      /* Metallic coin */
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
      var cg = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 13);
      cg.addColorStop(0, '#e5e7eb'); cg.addColorStop(0.5, '#9ca3af'); cg.addColorStop(1, '#6b7280');
      ctx.fillStyle = cg; ctx.fill();
      ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1; ctx.stroke();
      /* Rim detail */
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
      /* Centre text */
      ctx.fillStyle = '#6b7280'; ctx.font = 'bold 7px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('₹', x, y + 3);
    } else if (n === 'Cap') {
      /* Bottle cap dome */
      var cg2 = ctx.createLinearGradient(x - 14, y - 12, x + 14, y + 4);
      cg2.addColorStop(0, '#60a5fa'); cg2.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = cg2;
      ctx.beginPath();
      ctx.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); /* brim */
      ctx.beginPath();
      ctx.arc(x, y - 2, 14, Math.PI, 0); /* dome */
      ctx.lineTo(x + 14, y + 2); ctx.lineTo(x - 14, y + 2); ctx.closePath(); ctx.fill();
      /* Shine on dome */
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(x - 4, y - 8, 5, 3, -0.3, 0, Math.PI * 2); ctx.fill();
      /* Ridges */
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      for (var r = -10; r <= 10; r += 5) {
        ctx.beginPath(); ctx.moveTo(x + r, y + 2); ctx.lineTo(x + r, y + 5); ctx.stroke();
      }
    } else if (n === 'Stone') {
      /* Irregular stone shape */
      ctx.save(); ctx.translate(x, y);
      var sg = ctx.createRadialGradient(-3, -4, 1, 0, 0, 16);
      sg.addColorStop(0, '#a8a29e'); sg.addColorStop(1, '#57534e');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(-12, -6); ctx.bezierCurveTo(-14, -12, -4, -16, 4, -13);
      ctx.bezierCurveTo(12, -10, 15, -4, 13, 4);
      ctx.bezierCurveTo(11, 12, 4, 14, -4, 12);
      ctx.bezierCurveTo(-12, 10, -15, 4, -12, -6); ctx.fill();
      /* Cracks */
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(2, 0); ctx.lineTo(-2, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(9, 2); ctx.stroke();
      ctx.restore();
    } else if (n === 'Sponge') {
      /* Yellow sponge with holes */
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - 14, y - 10, 28, 20, 4);
      else ctx.rect(x - 14, y - 10, 28, 20);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - 12, y - 8, 24, 16, 3);
      else ctx.rect(x - 12, y - 8, 24, 16);
      ctx.fill();
      /* Pores */
      ctx.fillStyle = '#d97706';
      var pores = [[-6,-4],[2,-5],[8,-2],[-8,2],[0,3],[6,4],[-3,1],[4,-1]];
      pores.forEach(function(p) {
        ctx.beginPath(); ctx.ellipse(x+p[0], y+p[1], 2.5, 2, Math.random()*Math.PI, 0, Math.PI*2); ctx.fill();
      });
      /* Top shine */
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x - 10, y - 8, 20, 4);
    } else if (n === 'Pencil') {
      /* Pencil lying flat */
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.08);
      /* Body */
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-18, -5, 28, 10);
      /* Tip (wood) */
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.moveTo(10, -5); ctx.lineTo(20, 0); ctx.lineTo(10, 5); ctx.fill();
      /* Graphite tip */
      ctx.fillStyle = '#374151';
      ctx.beginPath(); ctx.moveTo(17, -2); ctx.lineTo(20, 0); ctx.lineTo(17, 2); ctx.fill();
      /* Eraser */
      ctx.fillStyle = '#fda4af'; ctx.fillRect(-18, -5, 6, 10);
      ctx.fillStyle = '#9ca3af'; ctx.fillRect(-14, -5, 2, 10); /* metal band */
      /* Stripes */
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(-6, 5); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function draw() {
    var _g = getCtx('sfCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    var t = Date.now();
    ctx.clearRect(0, 0, W, H);

    var waterY = H * 0.44;

    /* Sky bg */
    ctx.fillStyle = '#bfdbfe'; ctx.fillRect(0, 0, W, waterY);

    /* Deep water */
    var wg = ctx.createLinearGradient(0, waterY, 0, H);
    wg.addColorStop(0, 'rgba(37,99,235,0.85)');
    wg.addColorStop(1, 'rgba(30,64,175,0.97)');
    ctx.fillStyle = wg; ctx.fillRect(0, waterY, W, H - waterY);

    /* Underwater light shafts */
    ctx.save();
    for (var s = 0; s < 4; s++) {
      var sx = W * 0.2 + s * W * 0.2;
      ctx.fillStyle = 'rgba(147,197,253,0.06)';
      ctx.beginPath();
      ctx.moveTo(sx - 8, waterY);
      ctx.lineTo(sx + 8, waterY);
      ctx.lineTo(sx + 20, H);
      ctx.lineTo(sx - 20, H);
      ctx.fill();
    }
    ctx.restore();

    /* Animated water surface */
    ctx.save();
    for (var wx = 0; wx <= W; wx += 2) {
      var wy = waterY + Math.sin((wx * 0.06) + t * 0.002) * 3 + Math.sin((wx * 0.03) + t * 0.0015) * 2;
      ctx.fillStyle = wx % 4 < 2 ? 'rgba(255,255,255,0.55)' : 'rgba(147,197,253,0.4)';
      ctx.fillRect(wx, wy, 2, 2);
    }
    ctx.restore();

    /* Draw items */
    var spacing = Math.min(44, (W - 20) / Math.max(dropped.length, 1));
    dropped.forEach(function(item, i) {
      var x = 24 + i * spacing;
      /* Float: bob at surface. Sink: rest at bottom */
      var bob = item.floats ? Math.sin(t * 0.003 + i * 1.2) * 2 : 0;
      var targetY = item.floats ? waterY - 6 + bob : H - 28;
      if (Math.abs(item.y - targetY) > 0.4) item.y += (targetY - item.y) * 0.07;

      /* Water ripple for floating items */
      if (item.floats) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, waterY + 1, 16, 3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      /* Underwater tint for sinking items */
      if (!item.floats) {
        ctx.save(); ctx.globalAlpha = 0.55;
      }
      drawItem(ctx, item, x, item.y);
      if (!item.floats) ctx.restore();

      /* Label above item */
      ctx.save();
      ctx.fillStyle = item.floats ? '#1e3a5f' : 'rgba(219,234,254,0.9)';
      ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(item.name, x, item.floats ? item.y - 22 : item.y + 28);
      ctx.fillText(item.floats ? '↑ float' : '↓ sink', x, item.floats ? item.y - 32 : item.y + 38);
      ctx.restore();
    });

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Sink or Float?</div>' +
      '<canvas id="sfCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center">' +
      items.map(function(item) {
        return '<button onclick="sfDrop(\'' + item.name + '\')" style="padding:6px 12px;border-radius:10px;border:2px solid ' + item.color + ';background:' + item.color + '22;color:var(--text);font-size:12px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif">' + item.name + '</button>';
      }).join('') +
      '</div>' +
      '<div id="sfFact" style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--muted);min-height:36px;line-height:1.7;text-align:center">Tap any object to drop it into the water!</div>' +
      '<div class="ctrl-row" style="margin-top:6px"><button class="cbtn" onclick="sfReset()">↺ Clear all</button></div>';
    cancelAnimationFrame(raf);
    requestAnimationFrame(function(){ requestAnimationFrame(draw); });
  }

  window.sfDrop = function(name) {
    var item = items.find(function(i) { return i.name === name; });
    if (!item || dropped.find(function(d) { return d.name === name; })) return;
    if (dropped.length >= 6) return;
    dropped.push({ name: item.name, floats: item.floats, color: item.color, y: 0 });
    document.getElementById('sfFact').innerHTML =
      '<b style="color:' + item.color + '">' + item.name + '</b> ' +
      (item.floats ? '<span style="color:var(--evs)">floats! ✓</span>' : '<span style="color:var(--sci)">sinks ✗</span>') +
      ' — ' + item.fact;
  };
  window.sfReset = function() { dropped = []; };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── SHADOW PLAY (canvas, real-time shadow) ── */
SIM_REGISTRY['shadow-play'] = function(c) {
  var dist = 40, objType = 'hand', raf;

  /* objHeight: how tall each object is above ground — used for shadow geometry */
  var objDefs = {
    hand: { h: 42 },
    tree: { h: 62 },
    bird: { h: 50 }, /* bird flies above ground — h is centre height */
  };

  function drawHand(ctx, x, groundY) {
    var skin = '#f59e0b', dark = '#d97706';
    /* Wrist / palm base */
    ctx.fillStyle = skin;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 11, groundY - 26, 22, 20, 4);
    else ctx.fillRect(x - 11, groundY - 26, 22, 20);
    ctx.fill();
    /* Four fingers */
    var fpos = [-10, -4, 3, 9];
    var fh =   [20,  22, 22, 18];
    ctx.fillStyle = skin;
    for (var f = 0; f < 4; f++) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x + fpos[f], groundY - 26 - fh[f], 6, fh[f] + 4, [3,3,0,0]);
      else ctx.fillRect(x + fpos[f], groundY - 26 - fh[f], 6, fh[f] + 4);
      ctx.fill();
      /* Knuckle line */
      ctx.strokeStyle = dark; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x + fpos[f], groundY - 26); ctx.lineTo(x + fpos[f] + 6, groundY - 26); ctx.stroke();
    }
    /* Thumb */
    ctx.fillStyle = skin;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 19, groundY - 30, 10, 16, [3,0,0,3]);
    else ctx.fillRect(x - 19, groundY - 30, 10, 16);
    ctx.fill();
    /* Fingernail highlights */
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (var n = 0; n < 4; n++) {
      ctx.fillRect(x + fpos[n] + 1, groundY - 26 - fh[n], 4, 4);
    }
  }

  function drawTree(ctx, x, groundY) {
    /* Shadow root at ground */
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x - 5, groundY - 34, 10, 34);
    /* Bark texture */
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 2, groundY - 30); ctx.lineTo(x - 1, groundY - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, groundY - 25); ctx.lineTo(x + 3, groundY - 15); ctx.stroke();
    /* Lower canopy */
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(x, groundY - 48, 22, 0, Math.PI * 2); ctx.fill();
    /* Mid canopy */
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(x - 6, groundY - 56, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, groundY - 56, 15, 0, Math.PI * 2); ctx.fill();
    /* Top */
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(x, groundY - 64, 12, 0, Math.PI * 2); ctx.fill();
    /* Highlight */
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(x - 6, groundY - 62, 6, 0, Math.PI * 2); ctx.fill();
  }

  function drawBird(ctx, x, centerY) {
    /* A soaring bird — wings up */
    /* Body */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); ctx.ellipse(x, centerY, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    /* Left wing */
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(x - 4, centerY - 2);
    ctx.bezierCurveTo(x - 16, centerY - 18, x - 30, centerY - 14, x - 32, centerY - 8);
    ctx.bezierCurveTo(x - 24, centerY - 4, x - 10, centerY + 2, x - 4, centerY - 2);
    ctx.fill();
    /* Right wing */
    ctx.beginPath();
    ctx.moveTo(x + 4, centerY - 2);
    ctx.bezierCurveTo(x + 16, centerY - 18, x + 30, centerY - 14, x + 32, centerY - 8);
    ctx.bezierCurveTo(x + 24, centerY - 4, x + 10, centerY + 2, x + 4, centerY - 2);
    ctx.fill();
    /* Wing highlight */
    ctx.fillStyle = 'rgba(147,197,253,0.25)';
    ctx.beginPath(); ctx.ellipse(x - 18, centerY - 11, 8, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 18, centerY - 11, 8, 4, 0.4, 0, Math.PI * 2); ctx.fill();
    /* Tail */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x - 12, centerY + 4);
    ctx.lineTo(x - 18, centerY + 12);
    ctx.lineTo(x - 8, centerY + 8);
    ctx.lineTo(x, centerY + 6);
    ctx.lineTo(x + 8, centerY + 8);
    ctx.lineTo(x + 18, centerY + 12);
    ctx.lineTo(x + 12, centerY + 4);
    ctx.fill();
    /* Head */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); ctx.arc(x + 12, centerY - 3, 7, 0, Math.PI * 2); ctx.fill();
    /* Eye */
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x + 14, centerY - 4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(x + 14.5, centerY - 4, 1.2, 0, Math.PI * 2); ctx.fill();
    /* Beak */
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(x+19, centerY-4); ctx.lineTo(x+24, centerY-3); ctx.lineTo(x+19, centerY-1); ctx.fill();
  }

  function draw() {
    var _g = getCtx('shadowCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0, 0, W, H);

    var groundY = Math.round(H * 0.72);

    /* Sky gradient */
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#bae6fd'); sky.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, groundY);

    /* Ground */
    var gr = ctx.createLinearGradient(0, groundY, 0, H);
    gr.addColorStop(0, '#d4edbc'); gr.addColorStop(1, '#c8d8a8');
    ctx.fillStyle = gr; ctx.fillRect(0, groundY, W, H - groundY);

    /* Grass detail */
    ctx.strokeStyle = '#86a96a'; ctx.lineWidth = 1.2;
    for (var gx = 8; gx < W; gx += 9) {
      var gb = groundY + Math.sin(gx * 0.5) * 1;
      ctx.beginPath(); ctx.moveTo(gx, gb); ctx.lineTo(gx - 2, gb - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, gb); ctx.lineTo(gx + 2, gb - 5); ctx.stroke();
    }

    /* Light source: torch/lamp on the left, on a pole */
    var lx = 28, ly = groundY * 0.45;

    /* Lamp pole */
    ctx.fillStyle = '#713f12';
    ctx.fillRect(lx - 3, ly + 14, 6, groundY - ly - 14);

    /* Lamp head */
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx - 10, ly - 8, 20, 10, 3);
    else ctx.fillRect(lx - 10, ly - 8, 20, 10);
    ctx.fill();

    /* Glow halo */
    var halo = ctx.createRadialGradient(lx, ly, 0, lx, ly, 30);
    halo.addColorStop(0, 'rgba(254,240,138,0.5)');
    halo.addColorStop(1, 'rgba(254,240,138,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, ly, 30, 0, Math.PI * 2); ctx.fill();

    /* Bulb */
    var bulbG = ctx.createRadialGradient(lx - 3, ly - 3, 1, lx, ly, 11);
    bulbG.addColorStop(0, '#fefce8'); bulbG.addColorStop(0.5, '#fef08a'); bulbG.addColorStop(1, '#fbbf24');
    ctx.fillStyle = bulbG;
    ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI * 2);
    ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;

    /* Object position: dist slider 10-70, maps to x range [70, W-60] */
    var objX = 70 + (dist - 10) / 60 * (W - 130);
    objX = Math.min(objX, W - 60); /* never reach edge */
    var def = objDefs[objType];

    /* ── Shadow geometry (ground shadow) ──
       Light at (lx, ly). Object top at (objX, groundY - def.h).
       Ray from light through object top hits ground at shadowTipX.
       t param: groundY = ly + t*(groundY - def.h - ly) → t = (groundY-ly)/(groundY-def.h-ly)
       shadowTipX = lx + t*(objX - lx)
       Shadow is ellipse on ground from objX to shadowTipX */
    var objTopY = groundY - def.h;
    var t = (groundY - ly) / (objTopY - ly); /* should be > 1 since objTopY < groundY < ly? no: ly < groundY */
    /* ly is above groundY: ly = groundY*0.45 < groundY. objTopY < groundY. */
    /* ray: starts at (lx,ly), direction (objX-lx, objTopY-ly) */
    /* hits y=groundY when: ly + s*(objTopY-ly) = groundY => s = (groundY-ly)/(objTopY-ly) */
    var s = (groundY - ly) / (objTopY - ly);
    var shadowTipX = lx + s * (objX - lx);
    shadowTipX = Math.min(shadowTipX, W - 8);

    var shadowLen = Math.max(4, shadowTipX - objX);

    /* Draw ground shadow — ellipse, tapered */
    ctx.save();
    ctx.fillStyle = 'rgba(60,70,40,0.32)';
    ctx.beginPath();
    ctx.ellipse(objX + shadowLen / 2, groundY + 3, shadowLen / 2, Math.min(8, shadowLen * 0.12 + 3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Light rays — from lamp to object edges, continuing to show illuminated scene */
    ctx.save();
    ctx.strokeStyle = 'rgba(253,224,71,0.18)'; ctx.lineWidth = 1.2;
    /* Upper ray: light → object top → continues */
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(shadowTipX, groundY); ctx.stroke();
    /* Lower ray: light → object base → continues right */
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(W, groundY + (groundY - ly) / (objX - lx) * (W - lx) * 0.3); ctx.stroke();
    /* Fill rays */
    for (var ri = 1; ri < 4; ri++) {
      var ry = ly + (groundY - ly) * ri / 4;
      var rx2 = lx + (objX - lx + 30) * ri / 4;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx2 * 1.8, ry); ctx.stroke();
    }
    ctx.restore();

    /* Shadow cone — darker region between the two boundary rays */
    ctx.save();
    ctx.fillStyle = 'rgba(60,70,40,0.08)';
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(objX, groundY);
    ctx.lineTo(shadowTipX, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* Draw object */
    if (objType === 'hand') drawHand(ctx, objX, groundY);
    else if (objType === 'tree') drawTree(ctx, objX, groundY);
    else drawBird(ctx, objX, groundY - 38);

    /* Light label */
    ctx.fillStyle = '#92400e'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Light', lx, ly - 18);

    /* Shadow length label */
    if (shadowLen > 20) {
      ctx.fillStyle = 'rgba(60,70,40,0.7)'; ctx.font = 'bold 8px Nunito,sans-serif';
      ctx.fillText('shadow: ' + Math.round(shadowLen) + 'px', objX + shadowLen / 2, groundY + 16);
    }

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Shadow Play</div>' +
      '<canvas id="shadowCanvas" data-w="320" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px;align-items:center">' +
      '<span style="font-size:11px;color:var(--muted)">Distance from light:</span>' +
      '<input type="range" class="slide" min="10" max="70" value="40" oninput="shadowDist(this.value)" style="width:120px">' +
      '<span style="font-size:11px;color:var(--muted)">Object:</span>' +
      ['hand','tree','bird'].map(function(o) {
        return '<button onclick="shadowObj(\'' + o + '\')" style="padding:4px 10px;border-radius:8px;font-size:11px;border:1.5px solid ' + (o === objType ? 'var(--math)' : 'var(--border)') + ';background:' + (o === objType ? 'var(--math-dim)' : 'var(--surface2)') + ';color:' + (o === objType ? 'var(--math)' : 'var(--muted)') + ';cursor:pointer;font-family:Nunito,sans-serif">' + o + '</button>';
      }).join('') +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '📐 Closer to light = longer shadow. Further away = shorter shadow. Drag the slider to explore!' +
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.shadowDist = function(v) { dist = parseInt(v); };
  window.shadowObj = function(o) { objType = o; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── ELECTRIC CIRCUIT (canvas, visual objects, bulb glows) ── */
SIM_REGISTRY['circuit-sim'] = function(c) {
  var selected = null;
  var materials = [
    { name:'Wire',    conducts:true,  color:'#a78bfa', desc:'Copper wire — excellent conductor. Electrons flow freely through metal!' },
    { name:'Coin',    conducts:true,  color:'#fcd34d', desc:'Metal coin — conductors! Even old coins let current flow.' },
    { name:'Nail',    conducts:true,  color:'#94a3b8', desc:'Iron nail — metals are conductors. Electrons move through them easily.' },
    { name:'Foil',    conducts:true,  color:'#e2e8f0', desc:'Aluminium foil — thin but conducts electricity well!' },
    { name:'Pencil',  conducts:false, color:'#f97316', desc:'Wood is an insulator. The graphite inside conducts a tiny bit, but wood doesn\'t!' },
    { name:'Rubber',  conducts:false, color:'#6b7280', desc:'Rubber is a perfect insulator — that\'s why wires are coated in it.' },
    { name:'Plastic', conducts:false, color:'#3b82f6', desc:'Plastic is an insulator. Used in switches and plug casings for safety.' },
  ];
  var raf;

  function draw() {
    var _g = getCtx('circuitCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);

    var mat = selected ? materials.find(function(m) { return m.name === selected; }) : null;
    var conducts = mat ? mat.conducts : false;
    var glowIntensity = conducts ? (0.7 + Math.sin(Date.now() * 0.006) * 0.3) : 0;

    /* === Battery (left) === */
    var bx = 28, by = H / 2;
    /* Battery body */
    ctx.fillStyle = '#374151'; ctx.fillRect(bx - 14, by - 28, 28, 56); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.5; ctx.strokeRect(bx - 14, by - 28, 28, 56);
    /* Battery label */
    ctx.fillStyle = '#10b981'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+', bx, by - 32);
    ctx.fillStyle = '#ef4444'; ctx.fillText('−', bx, by + 40);
    /* Battery fill */
    ctx.fillStyle = '#22c55e'; ctx.fillRect(bx - 11, by + 5, 22, 18);
    ctx.fillStyle = '#16a34a'; ctx.fillRect(bx - 11, by + 5, 22, 6);
    ctx.fillStyle = '#ffffff'; ctx.font = '8px Nunito,sans-serif';
    ctx.fillText('1.5V', bx, by + 18);

    /* === Wires === */
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    /* Top wire: battery+ → gap left */
    ctx.strokeStyle = conducts ? '#a78bfa' : '#4b5563';
    if (conducts) { ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = glowIntensity * 8; }
    ctx.beginPath(); ctx.moveTo(bx, by - 28); ctx.lineTo(bx, 28); ctx.lineTo(W * 0.42, 28); ctx.stroke();
    ctx.shadowBlur = 0;
    /* Bottom wire: battery− → bulb bottom */
    ctx.strokeStyle = conducts ? '#a78bfa' : '#4b5563';
    if (conducts) { ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = glowIntensity * 8; }
    ctx.beginPath(); ctx.moveTo(bx, by + 28); ctx.lineTo(bx, H - 28); ctx.lineTo(W - 40, H - 28); ctx.lineTo(W - 40, H * 0.72); ctx.stroke();
    ctx.shadowBlur = 0;
    /* Right wire: gap right → bulb */
    ctx.strokeStyle = conducts ? '#a78bfa' : '#4b5563';
    if (conducts) { ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = glowIntensity * 8; }
    ctx.beginPath(); ctx.moveTo(W * 0.58, 28); ctx.lineTo(W - 40, 28); ctx.lineTo(W - 40, H * 0.28); ctx.stroke();
    ctx.shadowBlur = 0;

    /* === Gap / Material === */
    var gapL = W * 0.42, gapR = W * 0.58, gapY = 28;
    if (!mat) {
      /* Open gap - broken line */
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(gapL, gapY); ctx.lineTo(gapR, gapY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('OPEN', W / 2, gapY - 8);
    } else {
      /* Draw material visually */
      var midX = (gapL + gapR) / 2;
      ctx.save();
      if (mat.name === 'Wire') {
        ctx.strokeStyle = mat.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(gapL, gapY); ctx.lineTo(gapR, gapY); ctx.stroke();
      } else if (mat.name === 'Coin') {
        ctx.fillStyle = mat.color; ctx.beginPath(); ctx.arc(midX, gapY, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#92400e'; ctx.font = 'bold 7px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('₹', midX, gapY + 3);
      } else if (mat.name === 'Nail') {
        ctx.fillStyle = mat.color;
        ctx.fillRect(gapL, gapY - 3, gapR - gapL, 6);
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(gapL, gapY - 6); ctx.lineTo(gapL + 8, gapY - 3); ctx.lineTo(gapL + 8, gapY + 3); ctx.lineTo(gapL, gapY + 6); ctx.closePath(); ctx.fill();
      } else if (mat.name === 'Foil') {
        ctx.fillStyle = mat.color; ctx.fillRect(gapL, gapY - 2, gapR - gapL, 4);
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.5; ctx.stroke();
      } else if (mat.name === 'Pencil') {
        ctx.fillStyle = '#fef3c7'; ctx.fillRect(gapL, gapY - 4, gapR - gapL - 4, 8);
        ctx.fillStyle = mat.color; ctx.fillRect(gapR - 16, gapY - 4, 12, 8);
        ctx.fillStyle = '#1c1917'; ctx.fillRect(gapR - 5, gapY - 2, 3, 4);
      } else if (mat.name === 'Rubber') {
        ctx.fillStyle = mat.color; ctx.beginPath(); ctx.roundRect(gapL, gapY - 7, gapR - gapL, 14, 4); ctx.fill();
        ctx.fillStyle = '#9ca3af'; ctx.font = '8px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ERASER', midX, gapY + 3);
      } else {
        ctx.fillStyle = mat.color; ctx.fillRect(gapL, gapY - 5, gapR - gapL, 10);
        ctx.fillStyle = '#1e40af'; ctx.font = '8px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('PLASTIC', midX, gapY + 3);
      }
      ctx.restore();
    }

    /* === Bulb (right) === */
    var bulbX = W - 40, bulbY = H * 0.5;
    /* Glow behind bulb */
    if (conducts && glowIntensity > 0) {
      var grd = ctx.createRadialGradient(bulbX, bulbY, 0, bulbX, bulbY, 50);
      grd.addColorStop(0, 'rgba(253,224,71,' + glowIntensity * 0.6 + ')');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.fillRect(bulbX - 50, bulbY - 50, 100, 100);
    }
    /* Bulb glass */
    ctx.beginPath(); ctx.arc(bulbX, bulbY - 10, 22, 0, Math.PI * 2);
    ctx.fillStyle = conducts ? 'rgba(253,224,71,' + (0.6 + glowIntensity * 0.4) + ')' : 'rgba(255,255,255,0.08)';
    ctx.shadowColor = conducts ? '#fde047' : 'transparent';
    ctx.shadowBlur = conducts ? glowIntensity * 20 : 0;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = conducts ? '#ca8a04' : '#4b5563'; ctx.lineWidth = 2; ctx.stroke();
    /* Filament */
    ctx.strokeStyle = conducts ? '#fbbf24' : '#374151'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bulbX - 6, bulbY - 2); ctx.lineTo(bulbX - 4, bulbY - 10);
    ctx.lineTo(bulbX, bulbY - 14); ctx.lineTo(bulbX + 4, bulbY - 10);
    ctx.lineTo(bulbX + 6, bulbY - 2);
    ctx.stroke();
    /* Base */
    ctx.fillStyle = '#6b7280'; ctx.fillRect(bulbX - 10, bulbY + 10, 20, 24);
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1;
    for (var ring = 0; ring < 3; ring++) {
      ctx.beginPath(); ctx.moveTo(bulbX - 10, bulbY + 15 + ring * 6); ctx.lineTo(bulbX + 10, bulbY + 15 + ring * 6); ctx.stroke();
    }
    /* Bulb label */
    ctx.fillStyle = conducts ? '#fde047' : '#6b7280'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(conducts ? '✨ ON!' : 'OFF', bulbX, bulbY + 46);

    /* Electron flow dots */
    if (conducts) {
      var t = Date.now() * 0.002;
      for (var e = 0; e < 5; e++) {
        var ep = (t + e * 0.2) % 1;
        /* Along top wire */
        var ex, ey;
        if (ep < 0.35) { ex = bx + ep / 0.35 * (gapL - bx); ey = 28; }
        else if (ep < 0.65) { ex = gapR + (ep - 0.35) / 0.3 * (W - 40 - gapR); ey = 28; }
        else { ex = W - 40; ey = 28 + (ep - 0.65) / 0.35 * (bulbY - 28); }
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196,181,253,0.9)'; ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 4;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    }

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Simple Electric Circuit</div>' +
      '<canvas id="circuitCanvas" data-w="300" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;justify-content:center">' +
      materials.map(function(mat) {
        var isSelected = selected === mat.name;
        var borderColor = mat.conducts ? 'var(--evs)' : 'var(--sci)';
        return '<button onclick="circSel(\'' + mat.name + '\')" style="padding:5px 10px;border-radius:9px;font-size:12px;font-weight:700;border:2px solid ' +
          (isSelected ? borderColor : 'var(--border)') + ';background:' +
          (isSelected ? (mat.conducts ? 'var(--evs-dim)' : 'var(--sci-dim)') : 'var(--surface2)') +
          ';color:' + (isSelected ? (mat.conducts ? 'var(--evs)' : 'var(--sci)') : 'var(--muted)') + ';cursor:pointer;font-family:Nunito,sans-serif">' +
          mat.name + '</button>';
      }).join('') +
      '</div>' +
      '<div id="circFact" style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--muted);min-height:36px;line-height:1.7">' +
      'Tap a material to place it in the circuit gap. Does the bulb light up?' +
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.circSel = function(name) {
    selected = selected === name ? null : name;
    var mat = materials.find(function(m) { return m.name === name; });
    if (mat) {
      document.getElementById('circFact').innerHTML =
        '<b style="color:' + (mat.conducts ? 'var(--evs)' : 'var(--sci)') + '">' + mat.name + '</b> — ' + mat.desc;
    }
    cancelAnimationFrame(raf); render();
  };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};
SIM_REGISTRY['colour-mixing'] = function(c) {
  var selected = [];
  var primaries = [
    {name:'Red',    hex:'#ef4444', r:239,g:68,b:68},
    {name:'Blue',   hex:'#3b82f6', r:59,g:130,b:246},
    {name:'Yellow', hex:'#eab308', r:234,g:179,b:8},
  ];
  var facts = {
    'Red+Blue':         {result:'Purple', hex:'#9333ea', fact:'Red + Blue = Purple. Mixing two cool-ish primaries!'},
    'Blue+Red':         {result:'Purple', hex:'#9333ea', fact:'Red + Blue = Purple!'},
    'Red+Yellow':       {result:'Orange', hex:'#f97316', fact:'Red + Yellow = Orange. The colour of fire and sunsets!'},
    'Yellow+Red':       {result:'Orange', hex:'#f97316', fact:'Red + Yellow = Orange!'},
    'Blue+Yellow':      {result:'Green',  hex:'#22c55e', fact:'Blue + Yellow = Green. Colour of all plant life!'},
    'Yellow+Blue':      {result:'Green',  hex:'#22c55e', fact:'Blue + Yellow = Green!'},
    'Blue+Red+Yellow':  {result:'Brown',  hex:'#7c2d12', fact:'All three primaries mixed = brown. Called a tertiary colour!'},
    'Red+Blue+Yellow':  {result:'Brown',  hex:'#7c2d12', fact:'All three primaries mixed = brown!'},
    'Red+Yellow+Blue':  {result:'Brown',  hex:'#7c2d12', fact:'All three = brown!'},
    'Yellow+Red+Blue':  {result:'Brown',  hex:'#7c2d12', fact:'All three = brown!'},
    'Blue+Yellow+Red':  {result:'Brown',  hex:'#7c2d12', fact:'All three = brown!'},
    'Yellow+Blue+Red':  {result:'Brown',  hex:'#7c2d12', fact:'All three = brown!'},
  };

  function getMix() {
    if (!selected.length) return null;
    return facts[selected.slice().sort().join('+')] || null;
  }

  function render() {
    var mix = getMix();
    var avg = {r:200,g:200,b:200};
    if (selected.length) {
      var tr=0,tg=0,tb=0;
      selected.forEach(function(n){var p=primaries.find(function(p){return p.name===n;}); tr+=p.r;tg+=p.g;tb+=p.b;});
      avg={r:Math.round(tr/selected.length),g:Math.round(tg/selected.length),b:Math.round(tb/selected.length)};
    }
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">Colour Mixing Lab</div>'+
      '<div style="display:flex;justify-content:center;align-items:flex-end;gap:16px;margin-bottom:16px">'+
      primaries.map(function(p){
        var isSel=selected.includes(p.name);
        return '<div onclick="cmToggle(\''+p.name+'\')" style="cursor:pointer;text-align:center">'+
          '<div style="width:60px;height:60px;border-radius:50%;background:'+p.hex+
          ';border:3px solid '+(isSel?'white':'transparent')+
          ';transform:scale('+(isSel?'1.15':'1')+');transition:all .25s;'+
          'box-shadow:'+(isSel?'0 0 20px '+p.hex+'99':'none')+'"></div>'+
          '<div style="font-size:12px;font-weight:800;color:'+(isSel?p.hex:'var(--muted)')+';margin-top:6px">'+p.name+'</div>'+
          (isSel?'<div style="color:'+p.hex+';font-size:14px;margin-top:-2px">✓</div>':'<div style="height:18px"></div>')+
          '</div>';
      }).join('<div style="font-size:20px;color:var(--muted);padding-bottom:30px">+</div>')+
      '</div>'+
      '<div style="display:flex;justify-content:center;margin-bottom:10px">'+
      '<div style="width:100px;height:100px;border-radius:50%;background:'+(selected.length?'rgb('+avg.r+','+avg.g+','+avg.b+')':'var(--surface2)')+
      ';border:3px solid '+(mix?mix.hex:'var(--border)')+
      ';display:flex;align-items:center;justify-content:center;transition:all .5s;'+
      'font-size:13px;font-weight:900;color:white;text-shadow:0 1px 3px rgba(0,0,0,.6);text-align:center;padding:8px">'+
      (mix?mix.result:selected.length?'Mixing!':'?')+
      '</div></div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7;text-align:center;min-height:40px">'+
      (mix?'🎨 '+mix.fact:selected.length===0?'Tap the paint pots to mix colours!':selected.length===1?'Add another colour to mix!':'Try Red+Blue, Red+Yellow, or Blue+Yellow')+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" onclick="cmClear()">↺ Clear</button></div>';
  }

  window.cmToggle=function(n){
    var i=selected.indexOf(n);
    if(i>=0)selected.splice(i,1); else if(selected.length<3)selected.push(n);
    render();
  };
  window.cmClear=function(){selected=[];render();};
  render();
};

/* States of Matter (placeholder - full version registered later) */
/* Magnet Sim - canvas version */
SIM_REGISTRY['magnet-sim'] = function(c) {
  var items = [
    {n:'Paper Clip', magnetic:true,  color:'#94a3b8', shape:'clip',   fact:'Steel clip — iron content makes it magnetic!'},
    {n:'Coin',       magnetic:false, color:'#fcd34d', shape:'circle', fact:'Modern Indian coins are stainless steel — not magnetic!'},
    {n:'Iron Nail',  magnetic:true,  color:'#6b7280', shape:'nail',   fact:'Iron is one of the most magnetic metals!'},
    {n:'Pencil',     magnetic:false, color:'#f97316', shape:'rect',   fact:'Wood and graphite — neither is magnetic.'},
    {n:'Scissors',   magnetic:true,  color:'#e2e8f0', shape:'rect',   fact:'Steel blade — iron makes it magnetic!'},
    {n:'Rubber',     magnetic:false, color:'#9ca3af', shape:'circle', fact:'Rubber is a non-magnetic insulator.'},
  ];
  var sel = null;
  var raf;
  var attraction = 0;

  function draw() {
    var _g = getCtx('magnetCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Magnet */
    var magX = 60, magY = H/2;
    /* N pole */
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.roundRect(magX-8, magY-30, 30, 28, 4); ctx.fill();
    ctx.fillStyle='white'; ctx.font='bold 14px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('N', magX+7, magY-12);
    /* S pole */
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.roundRect(magX-8, magY+2, 30, 28, 4); ctx.fill();
    ctx.fillStyle='white'; ctx.fillText('S', magX+7, magY+20);

    /* Field lines */
    if (sel && sel.magnetic && attraction > 0.1) {
      ctx.setLineDash([4,5]);
      for (var fl = -2; fl <= 2; fl++) {
        ctx.strokeStyle = 'rgba(99,102,241,' + Math.min(0.5, attraction * 0.5) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(magX+22, magY + fl*12);
        ctx.bezierCurveTo(magX+80, magY+fl*20, 180, magY+fl*15, 220-attraction*30, magY+fl*8);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    /* Object */
    var objX = 220, objY = H/2;
    if (sel) {
      var target = sel.magnetic ? 180 : 220;
      objX += (target - objX) * 0.05;
      attraction = sel.magnetic ? Math.min(1, attraction + 0.03) : Math.max(0, attraction - 0.05);

      ctx.fillStyle = sel.color;
      ctx.shadowColor = sel.magnetic && attraction > 0.3 ? '#818cf8' : 'transparent';
      ctx.shadowBlur = attraction * 15;
      if (sel.shape === 'circle') {
        ctx.beginPath(); ctx.arc(objX, objY, 14, 0, Math.PI*2); ctx.fill();
      } else if (sel.shape === 'nail') {
        ctx.fillRect(objX-3, objY-20, 6, 36);
        ctx.beginPath(); ctx.arc(objX, objY-20, 7, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.fillRect(objX-14, objY-8, 28, 16);
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(sel.n, objX, objY+28);

      /* Result badge */
      if (attraction > 0.5) {
        ctx.fillStyle='#22c55e'; ctx.font='bold 11px Nunito,sans-serif';
        ctx.fillText('Attracted! ✅', objX, objY-30);
      } else if (sel && !sel.magnetic && attraction < 0.1) {
        ctx.fillStyle='#ef4444'; ctx.font='bold 11px Nunito,sans-serif';
        ctx.fillText('No effect ❌', objX, objY-30);
      }
    } else {
      ctx.fillStyle='rgba(255,255,255,.15)'; ctx.font='11px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('← Select an object', 220, objY);
    }

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Magnetic Materials</div>'+
      '<canvas id="magnetCanvas" data-w="290" data-h="160" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;justify-content:center">'+
      items.map(function(item){
        var isSel = sel && sel.n===item.n;
        return '<button onclick="magSel(\''+item.n+'\')" style="padding:5px 10px;border-radius:9px;font-size:11px;font-weight:700;border:2px solid '+(isSel?(item.magnetic?'#22c55e':'#ef4444'):'var(--border)')+';background:'+(isSel?(item.magnetic?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'):'var(--surface2)')+';color:'+(isSel?(item.magnetic?'#22c55e':'#ef4444'):'var(--muted)')+';cursor:pointer;font-family:Nunito,sans-serif">'+item.n+'</button>';
      }).join('')+
      '</div>'+
      '<div id="magFact" style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--muted);min-height:36px;line-height:1.7">'+
      (sel?'<b style="color:'+(sel.magnetic?'#22c55e':'#ef4444')+'">'+sel.n+'</b> — '+sel.fact:'Select an object to test it with the magnet!')+
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.magSel=function(n){
    sel=items.find(function(i){return i.n===n;})||null;
    attraction=0;
    cancelAnimationFrame(raf); render();
  };
  window.simCleanup=function(){cancelAnimationFrame(raf);};
  render();
};


/* ── GERMINATION (canvas, animated day progression) ── */
SIM_REGISTRY['germination'] = function(c) {
  var day = 0, interval, maxDays = 14, speed = 400;
  var conditions = [
    { name:'🌿 Normal',   sproutDay:4,  color:'#22c55e', height:function(d,s){return d>=s?Math.min(70,(d-s)*10+15):0;}, soil:'#7c2d12', label:'Sprouts day 4!' },
    { name:'💧 No Water', sproutDay:99, color:'#94a3b8', height:function(d,s){return 0;}, soil:'#a16207', label:'Needs water!' },
    { name:'🌑 Dark',     sproutDay:6,  color:'#d4d4d4', height:function(d,s){return d>=s?Math.min(50,(d-s)*7+10):0;}, soil:'#1c1917', label:'Grows pale' },
    { name:'❄️ Cold',     sproutDay:11, color:'#7dd3fc', height:function(d,s){return d>=s?Math.min(40,(d-s)*5+8):0;}, soil:'#0c4a6e', label:'Slow start' },
  ];

  function draw() {
    var _g = getCtx('germCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    /* Sky */
    var sky = ctx.createLinearGradient(0,0,0,H*0.7);
    sky.addColorStop(0, day > 0 ? '#bfdbfe' : '#0f172a');
    sky.addColorStop(1, day > 0 ? '#dbeafe' : '#1e293b');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H*0.7);

    /* Sun */
    if (day > 0) {
      ctx.beginPath(); ctx.arc(W-30, 25, 18, 0, Math.PI*2);
      ctx.fillStyle = '#fde047'; ctx.shadowColor = '#fcd34d'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
    }

    var colW = W / conditions.length;
    conditions.forEach(function(cond, i) {
      var x = i * colW;
      var h = cond.height(day, cond.sproutDay);
      var groundY = H * 0.7;
      var colCX = x + colW/2;

      /* Soil */
      ctx.fillStyle = cond.soil;
      ctx.fillRect(x+2, groundY, colW-4, H*0.3);

      /* Seed/sprout */
      if (day === 0 || h === 0) {
        /* Seed */
        ctx.fillStyle = '#92400e'; ctx.beginPath();
        ctx.ellipse(colCX, groundY+8, 6, 4, 0, 0, Math.PI*2); ctx.fill();
      } else {
        /* Stem */
        ctx.strokeStyle = cond.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(colCX, groundY);
        /* Slight sway */
        var sway = Math.sin(Date.now()*0.002 + i) * 3;
        ctx.quadraticCurveTo(colCX+sway, groundY-h*0.5, colCX+sway*2, groundY-h);
        ctx.stroke();

        /* Leaves */
        if (h > 20) {
          ctx.fillStyle = cond.color;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.ellipse(colCX+sway*2-8, groundY-h*0.7, 9, 5, -0.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath();
          ctx.ellipse(colCX+sway*2+8, groundY-h*0.65, 9, 5, 0.5, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        /* Flower */
        if (h > 50) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(colCX+sway*2, groundY-h-5, 5, 0, Math.PI*2); ctx.fill();
        }
      }

      /* Column label */
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 8px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(cond.name, colCX, H-10);

      /* Divider */
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    /* Day counter */
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Day ' + day + ' / ' + maxDays, 8, 18);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Seed Germination Lab</div>' +
      '<canvas id="germCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      /* Day progress bar */
      '<div style="height:6px;background:var(--surface2);border-radius:3px;margin:8px 0"><div id="germBar" style="height:6px;background:var(--evs);border-radius:3px;width:0%;transition:width .3s"></div></div>' +
      '<div class="ctrl-row" style="margin-top:4px">' +
      '<button class="cbtn" onclick="germPlay()" id="germBtn" style="background:var(--evs);color:white;border-color:var(--evs)">▶ Start</button>' +
      '<button class="cbtn" onclick="germReset()">↺ Reset</button>' +
      '<span style="font-size:11px;color:var(--muted)">Speed: </span>' +
      '<input type="range" class="slide" min="100" max="800" value="400" oninput="germSpeed(this.value)" style="width:80px">' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:8px">' +
      conditions.map(function(cond) {
        return '<div style="background:var(--surface2);border-radius:8px;padding:5px 8px;font-size:10px;color:var(--muted);border:1px solid var(--border)">' +
          cond.name + ': <b style="color:' + cond.color + '">' + cond.label + '</b></div>';
      }).join('') + '</div>';

    clearInterval(interval);
    draw();
  }

  window.germPlay = function() {
    clearInterval(interval);
    var btn = document.getElementById('germBtn');
    btn.textContent = '⏸ Pause';
    interval = setInterval(function() {
      day++;
      var bar = document.getElementById('germBar');
      if (bar) bar.style.width = (day/maxDays*100) + '%';
      draw();
      if (day >= maxDays) { clearInterval(interval); btn.textContent = '✅ Done'; }
    }, speed);
  };
  window.germReset = function() {
    clearInterval(interval); day = 0;
    var bar = document.getElementById('germBar');
    if (bar) bar.style.width = '0%';
    var btn = document.getElementById('germBtn');
    if (btn) btn.textContent = '▶ Start';
    draw();
  };
  window.germSpeed = function(v) { speed = parseInt(v); };
  window.simCleanup = function() { clearInterval(interval); };
  render();
};

/* ── PENDULUM (canvas, realistic physics) ── */
SIM_REGISTRY['pendulum'] = function(c) {
  var len=140, theta=0.5, omega=0, running=false, raf, trail=[];

  function draw() {
    var _g = getCtx('pendCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
     pivotX=W/2, pivotY=22;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Ceiling mount */
    ctx.fillStyle='rgba(255,255,255,.15)';
    ctx.fillRect(0,0,W,14);
    for(var i=0;i<W/10;i++){
      ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(i*10,0); ctx.lineTo(i*10-8,14); ctx.stroke();
    }

    /* Ball position */
    var bx = pivotX + Math.sin(theta)*len;
    var by = pivotY + Math.cos(theta)*len;

    /* Trail */
    trail.push({x:bx, y:by});
    if (trail.length > 40) trail.shift();
    trail.forEach(function(p, i) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(99,102,241,' + (i/trail.length*0.4) + ')'; ctx.fill();
    });

    /* String */
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bx, by); ctx.stroke();

    /* Pivot pin */
    ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI*2);
    ctx.fillStyle = '#94a3b8'; ctx.fill();

    /* Ball */
    var ballGrad = ctx.createRadialGradient(bx-4, by-4, 0, bx, by, 16);
    ballGrad.addColorStop(0, '#a78bfa');
    ballGrad.addColorStop(1, '#6d28d9');
    ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI*2);
    ctx.fillStyle = ballGrad; ctx.shadowColor='#7c3aed'; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;

    /* Period label */
    var period = (2*Math.PI*Math.sqrt(len/1000*9.8)).toFixed(2);
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Period ≈ '+period+'s  (length='+len+'cm)', W/2, H-10);

    /* Angle indicator */
    ctx.strokeStyle='rgba(253,224,71,.3)'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(pivotX,pivotY); ctx.lineTo(pivotX,pivotY+len); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#fde047'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText((theta*180/Math.PI).toFixed(0)+'°', pivotX+6, pivotY+30);

    /* Physics step */
    if (running) {
      var g=9.8, dt=0.016;
      omega += -g/(len*0.01) * Math.sin(theta) * dt;
      theta += omega * dt;
      omega *= 0.9998;
    }
    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Pendulum Physics</div>'+
      '<canvas id="pendCanvas" data-w="300" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<button class="cbtn" onclick="pendToggle()" id="pendBtn" style="background:var(--acc);color:white;border-color:var(--acc)">▶ Swing</button>'+
      '<span style="font-size:11px;color:var(--muted)">Length: <b id="pendLenLabel">140cm</b></span>'+
      '<input type="range" class="slide" min="40" max="180" value="140" oninput="pendLen(this.value)" style="width:120px">'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      '📐 T = 2π√(L/g) — Longer string = slower swing. Galileo discovered this by watching a chandelier!'+
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.pendToggle=function(){
    running=!running;
    document.getElementById('pendBtn').textContent=running?'⏸ Pause':'▶ Swing';
  };
  window.pendLen=function(v){
    len=parseInt(v); theta=0.5; omega=0; trail=[];
    document.getElementById('pendLenLabel').textContent=v+'cm';
  };
  window.simCleanup=function(){running=false;cancelAnimationFrame(raf);};
  render();
};

/* ── FOOD WEB (canvas, ecosystem visualization) ── */
SIM_REGISTRY['food-web'] = function(c) {
  var organisms = [
    {id:'sun',   label:'☀️ Sun',        x:150,y:20,  color:'#fde047',r:22, links:['plant'],  removable:false},
    {id:'plant', label:'🌿 Plants',      x:150,y:90,  color:'#22c55e',r:18, links:['rabbit','grasshopper'], removable:true},
    {id:'rabbit',label:'🐇 Rabbit',      x:70, y:160, color:'#f97316',r:16, links:['fox'],    removable:true},
    {id:'grasshopper',label:'🦗 Grasshopper',x:230,y:160,color:'#84cc16',r:14,links:['frog'],removable:true},
    {id:'fox',   label:'🦊 Fox',         x:70, y:230, color:'#ea580c',r:16, links:['eagle'],  removable:true},
    {id:'frog',  label:'🐸 Frog',        x:230,y:230, color:'#16a34a',r:14, links:['snake'],  removable:true},
    {id:'eagle', label:'🦅 Eagle',       x:110,y:300, color:'#6b7280',r:18, links:[],         removable:true},
    {id:'snake', label:'🐍 Snake',       x:200,y:300, color:'#78716c',r:14, links:['eagle'],  removable:true},
  ];
  var removed = new Set();
  var selected = null;

  var effects = {
    plant:'No plants → all herbivores starve → predators collapse. Total ecosystem failure!',
    rabbit:'Foxes lose food → decline. Hawk/eagle affected too.',
    grasshopper:'Frogs starve → snakes decline. Plants may overgrow.',
    fox:'Rabbit population explodes → plants get overgrazed.',
    frog:'Snake population drops. Grasshoppers multiply unchecked.',
    eagle:'Top predator gone → all prey populations spike.',
    snake:'Eagle struggles for food. Frogs multiply rapidly.',
  };

  function render() {
    var _g = getCtx('fwCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Draw links */
    organisms.forEach(function(org) {
      if (removed.has(org.id)) return;
      org.links.forEach(function(targetId) {
        if (removed.has(targetId)) return;
        var target = organisms.find(function(o){return o.id===targetId;});
        if (!target) return;
        var broken = removed.has(org.id) || removed.has(targetId);
        ctx.strokeStyle = broken ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.15)';
        ctx.lineWidth = 2; ctx.setLineDash(broken?[4,4]:[]);
        ctx.beginPath(); ctx.moveTo(org.x, org.y); ctx.lineTo(target.x, target.y); ctx.stroke();
        ctx.setLineDash([]);
        /* Arrow */
        var angle = Math.atan2(target.y-org.y, target.x-org.x);
        var ax = target.x - Math.cos(angle)*target.r;
        var ay = target.y - Math.sin(angle)*target.r;
        ctx.fillStyle = 'rgba(255,255,255,.2)';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax-8*Math.cos(angle-0.4), ay-8*Math.sin(angle-0.4));
        ctx.lineTo(ax-8*Math.cos(angle+0.4), ay-8*Math.sin(angle+0.4));
        ctx.closePath(); ctx.fill();
      });
    });

    /* Draw organisms */
    organisms.forEach(function(org) {
      var isRemoved = removed.has(org.id);
      var isSel = selected === org.id;

      ctx.globalAlpha = isRemoved ? 0.2 : 1;
      ctx.beginPath(); ctx.arc(org.x, org.y, org.r + (isSel?3:0), 0, Math.PI*2);
      ctx.fillStyle = org.color + (isRemoved?'44':'cc');
      ctx.shadowColor = isSel ? org.color : 'transparent';
      ctx.shadowBlur = isSel ? 15 : 0;
      ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle = isSel ? 'white' : org.color+'66';
      ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = isRemoved ? 'rgba(255,255,255,.2)' : 'white';
      ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(isRemoved ? '💀' : org.label.split(' ')[0], org.x, org.y+3);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font='7px Nunito,sans-serif';
      ctx.fillText(org.label.split(' ').slice(1).join(' '), org.x, org.y+org.r+10);
    });
  }

  function setupCanvas() {
    var cv=document.getElementById('fwCanvas');
  if(cv){var _dpr=Math.min(window.devicePixelRatio||1,2);if(!cv._hiDPIReady){var _rect=cv.getBoundingClientRect();var _W=_rect.width>10?_rect.width:parseInt(cv.getAttribute('width'))||300;var _H=_rect.height>10?_rect.height:parseInt(cv.getAttribute('height'))||200;cv.width=Math.round(_W*_dpr);cv.height=Math.round(_H*_dpr);cv.style.width=_W+'px';cv.style.height=_H+'px';cv._dpr=_dpr;cv._W=_W;cv._H=_H;cv._hiDPIReady=true;}}
    if (!cv) return;
    cv.onclick = function(e) {
      var rect = cv.getBoundingClientRect();
      var scaleX = W / rect.width;
      var mx = (e.clientX-rect.left)*scaleX;
      var my = (e.clientY-rect.top)*scaleX;
      organisms.forEach(function(org) {
        var d = Math.sqrt((mx-org.x)*(mx-org.x)+(my-org.y)*(my-org.y));
        if (d < org.r+8 && org.removable) {
          if (removed.has(org.id)) { removed.delete(org.id); selected=null; }
          else { removed.add(org.id); selected=org.id; }
          var fact = document.getElementById('fwFact');
          if (fact) fact.innerHTML = removed.has(org.id)
            ? '<b style="color:var(--sci)">Removed ' + org.label + ':</b> ' + (effects[org.id]||'')
            : '<b style="color:var(--evs)">Restored ' + org.label + '</b> — ecosystem recovering!';
          render();
        }
      });
    };
  }

  function renderUI() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Food Web</div>'+
      '<canvas id="fwCanvas" data-w="300" data-h="340" style="border-radius:12px;display:block;width:100%;cursor:pointer"></canvas>'+
      '<div id="fwFact" style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--muted);min-height:36px;line-height:1.7">Tap any organism to remove it — watch how the ecosystem reacts!</div>'+
      '<div class="ctrl-row" style="margin-top:6px"><button class="cbtn" onclick="fwRestore()">🔄 Restore All</button></div>';
    setupCanvas(); render();
  }

  window.fwRestore=function(){removed.clear();selected=null;document.getElementById('fwFact').innerHTML='Ecosystem restored! All species back in balance.';render();};
  renderUI();
};

/* ── OHMS LAW (canvas, animated circuit) ── */
SIM_REGISTRY['ohms-law'] = function(c) {
  var voltage=6, resistance=100, raf, t=0;
  var history=[];

  function draw() {
    var _g = getCtx('ohmCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    var current = voltage/resistance*1000; /* mA */
    var glowIntensity = Math.min(1, voltage/12);

    /* === Circuit layout === */
    var left=30, right=W-30, top=30, bottom=H-60;

    /* Wires */
    ctx.strokeStyle='rgba(99,102,241,' + (0.3+glowIntensity*0.5) + ')';
    ctx.lineWidth=3; ctx.lineCap='round';
    ctx.shadowColor='#818cf8'; ctx.shadowBlur=glowIntensity*8;
    ctx.beginPath();
    ctx.moveTo(left, top); ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.moveTo(left, bottom); ctx.lineTo(right, bottom);
    ctx.moveTo(left, top); ctx.lineTo(left, bottom);
    ctx.stroke(); ctx.shadowBlur=0;

    /* Battery */
    ctx.fillStyle='#374151'; ctx.fillRect(left-15,top+40,30,60);
    ctx.strokeStyle='#6b7280'; ctx.lineWidth=1.5; ctx.strokeRect(left-15,top+40,30,60);
    ctx.fillStyle='#22c55e'; ctx.fillRect(left-11,top+44,22,24);
    ctx.fillStyle='#ef4444'; ctx.fillRect(left-11,top+70,22,24);
    ctx.fillStyle='white'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('+',left,top+60); ctx.fillText('−',left,top+86);
    ctx.fillStyle='#fbbf24'; ctx.font='bold 9px Nunito,sans-serif';
    ctx.fillText(voltage+'V',left,top+34);

    /* Resistor (zigzag) */
    ctx.strokeStyle='#f97316'; ctx.lineWidth=2.5;
    ctx.shadowColor='#f97316'; ctx.shadowBlur=glowIntensity*6;
    var rx=right-15, ry=top, rh=80;
    ctx.beginPath(); ctx.moveTo(rx,ry);
    for(var zz=0;zz<8;zz++){
      ctx.lineTo(rx + (zz%2===0?10:-10), ry+10+zz*8);
    }
    ctx.lineTo(rx,ry+rh+10); ctx.stroke(); ctx.shadowBlur=0;
    ctx.fillStyle='#f97316'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText(resistance+'Ω',right-10,top+50);

    /* Bulb at bottom */
    var bulbX=W/2, bulbY=bottom;
    if(glowIntensity>0){
      var grd=ctx.createRadialGradient(bulbX,bulbY,0,bulbX,bulbY,40);
      grd.addColorStop(0,'rgba(253,224,71,'+glowIntensity*0.5+')');
      grd.addColorStop(1,'transparent');
      ctx.fillStyle=grd; ctx.fillRect(bulbX-40,bulbY-40,80,80);
    }
    ctx.beginPath(); ctx.arc(bulbX,bulbY,18,0,Math.PI*2);
    ctx.fillStyle='rgba(253,224,71,'+glowIntensity+')';
    ctx.shadowColor='#fde047'; ctx.shadowBlur=glowIntensity*20; ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle='#ca8a04'; ctx.lineWidth=2; ctx.stroke();

    /* Ammeter readout */
    ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('I = '+current.toFixed(1)+' mA',W/2,H-10);

    /* Electron dots */
    for(var e=0;e<6;e++){
      var ep=((t*0.015+e/6)%1);
      var ex,ey;
      if(ep<0.25){ex=left+(ep/0.25)*(right-left);ey=top;}
      else if(ep<0.5){ex=right;ey=top+(ep-0.25)/0.25*(bottom-top);}
      else if(ep<0.75){ex=right-(ep-0.5)/0.25*(right-left);ey=bottom;}
      else{ex=left;ey=bottom-(ep-0.75)/0.25*(bottom-top);}
      ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2);
      ctx.fillStyle='rgba(196,181,253,'+glowIntensity+')';
      ctx.shadowColor='#a78bfa'; ctx.shadowBlur=4; ctx.fill(); ctx.shadowBlur=0;
    }

    /* V-I graph */
    history.push({v:voltage,i:current});
    if(history.length>20)history.shift();
    if(history.length>1){
      var gx=8,gy=H-52,gw=W-16,gh=38;
      ctx.fillStyle='rgba(255,255,255,.05)'; ctx.fillRect(gx,gy,gw,gh);
      ctx.strokeStyle='var(--acc)'; ctx.lineWidth=1.5; ctx.beginPath();
      history.forEach(function(pt,i){
        var px=gx+pt.v/12*gw, py=gy+gh-pt.i/120*gh;
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='left';
      ctx.fillText('V-I graph',gx+2,gy-2);
    }

    t++;
    raf=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Ohm\'s Law — V = IR</div>'+
      '<canvas id="ohmCanvas" data-w="280" data-h="230" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#fbbf24">Voltage V: <b>'+voltage+'V</b></span>'+
      '<input type="range" class="slide" min="1" max="12" value="'+voltage+'" oninput="ohmV(this.value)" style="width:100px">'+
      '<span style="font-size:11px;color:#f97316">Resistance R: <b>'+resistance+'Ω</b></span>'+
      '<input type="range" class="slide" min="50" max="500" step="50" value="'+resistance+'" oninput="ohmR(this.value)" style="width:100px">'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      'I = V/R = '+voltage+'/'+resistance+' = <b style="color:var(--sci)">'+(voltage/resistance*1000).toFixed(1)+'mA</b> · Higher voltage = brighter bulb. Higher resistance = dimmer.'+
      '</div>';
    cancelAnimationFrame(raf); history=[]; draw();
  }

  window.ohmV=function(v){voltage=parseInt(v);};
  window.ohmR=function(v){resistance=parseInt(v);};
  window.simCleanup=function(){cancelAnimationFrame(raf);};
  render();
};

/* ── VELOCITY-TIME (canvas, animated car + graph) ── */
SIM_REGISTRY['velocity-time'] = function(c) {
  var raf, t=0, v=0, accel=0, running=false, carX=30;
  var history=[], phase='stopped';
  var maxT=80;

  function draw(){
    var _g=getCtx('vtCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    /* Road */
    var roadY=H*0.42;
    ctx.fillStyle='#1e293b'; ctx.fillRect(0,roadY,W,H*0.2);
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.setLineDash([20,15]);
    ctx.beginPath(); ctx.moveTo(0,roadY+H*0.1); ctx.lineTo(W,roadY+H*0.1); ctx.stroke();
    ctx.setLineDash([]);
    /* Road markings moving with car */
    ctx.fillStyle='rgba(255,255,255,.15)';
    for(var m=0;m<6;m++){
      var mx=((-carX*0.5+m*80)%W+W)%W;
      ctx.fillRect(mx,roadY+H*0.08,30,4);
    }

    /* Car body */
    if(running||t>0){
      carX = Math.min(W-60, 30+t*v*0.8);
    }
    /* Chassis */
    ctx.fillStyle='#3b82f6'; ctx.beginPath(); ctx.roundRect(carX,roadY-22,50,18,4); ctx.fill();
    /* Cabin */
    ctx.fillStyle='#60a5fa'; ctx.beginPath(); ctx.roundRect(carX+8,roadY-36,30,16,3); ctx.fill();
    /* Windows */
    ctx.fillStyle='rgba(200,230,255,.6)'; ctx.fillRect(carX+11,roadY-33,10,10); ctx.fillRect(carX+23,roadY-33,10,10);
    /* Wheels */
    [carX+10, carX+38].forEach(function(wx){
      ctx.beginPath(); ctx.arc(wx,roadY-2,8,0,Math.PI*2);
      ctx.fillStyle='#1e293b'; ctx.fill();
      ctx.beginPath(); ctx.arc(wx,roadY-2,4,0,Math.PI*2);
      ctx.fillStyle='#6b7280'; ctx.fill();
    });
    /* Speed indicator */
    ctx.fillStyle='#fde047'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(v.toFixed(1)+' m/s', carX+25, roadY-44);
    /* Acceleration arrow */
    if(Math.abs(accel)>0.1){
      ctx.strokeStyle=accel>0?'#22c55e':'#ef4444'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(carX+50,roadY-12); ctx.lineTo(carX+50+accel*8,roadY-12); ctx.stroke();
      ctx.fillStyle=accel>0?'#22c55e':'#ef4444'; ctx.font='9px Nunito,sans-serif';
      ctx.fillText(accel>0?'ACC':'BRAKE',carX+50+accel*8,roadY-20);
    }

    /* V-T Graph */
    var gx=10, gy=H*0.65, gw=W-20, gh=H*0.28;
    ctx.fillStyle='rgba(255,255,255,.04)'; ctx.fillRect(gx,gy,gw,gh);
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy+gh); ctx.lineTo(gx+gw,gy+gh); ctx.stroke();
    /* Axis labels */
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('v(m/s)',gx+2,gy+10); ctx.textAlign='right'; ctx.fillText('t(s)',gx+gw,gy+gh-2);
    /* Plot */
    if(history.length>1){
      ctx.strokeStyle='#60a5fa'; ctx.lineWidth=2; ctx.beginPath();
      history.forEach(function(pt,i){
        var px=gx+pt.t/maxT*gw, py=gy+gh-pt.v/25*gh;
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }); ctx.stroke();
    }

    /* Physics */
    if(running){
      t+=0.5;
      v=Math.max(0,Math.min(25,v+accel*0.016));
      history.push({t:t,v:v});
      if(history.length>maxT) history.shift();
      if(t>maxT){running=false; document.getElementById('vtBtn').textContent='↺ Reset'; accel=0;}
    }

    raf=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Velocity-Time Graph</div>'+
      '<canvas id="vtCanvas" data-w="300" data-h="240" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<button class="cbtn" id="vtBtn" onclick="vtAccel()" style="background:var(--evs);color:white;border-color:var(--evs)">▶ Accelerate</button>'+
      '<button class="cbtn" onclick="vtBrake()" style="background:var(--sci);color:white;border-color:var(--sci)">🛑 Brake</button>'+
      '<button class="cbtn" onclick="vtReset()">↺ Reset</button>'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      '📈 Slope of v-t graph = acceleration · Flat line = constant speed · Area under graph = distance travelled'+
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.vtAccel=function(){running=true;accel=2; document.getElementById('vtBtn').textContent='⏸ Coasting';};
  window.vtBrake=function(){accel=-3;};
  window.vtReset=function(){
    cancelAnimationFrame(raf);running=false;t=0;v=0;accel=0;carX=30;history=[];
    document.getElementById('vtBtn').textContent='▶ Accelerate';
    draw();
  };
  window.simCleanup=function(){cancelAnimationFrame(raf);};
  render();
};

/* Periodic table explorer */
SIM_REGISTRY['periodic-table'] = function(c) {
  var elements = [
    {sym:'H',name:'Hydrogen',grp:'non-metal',shells:'1',val:1},
    {sym:'Li',name:'Lithium',grp:'metal',shells:'2,1',val:1},
    {sym:'C',name:'Carbon',grp:'non-metal',shells:'2,4',val:4},
    {sym:'O',name:'Oxygen',grp:'non-metal',shells:'2,6',val:6},
    {sym:'Na',name:'Sodium',grp:'metal',shells:'2,8,1',val:1},
    {sym:'Cl',name:'Chlorine',grp:'non-metal',shells:'2,8,7',val:7},
    {sym:'Fe',name:'Iron',grp:'metal',shells:'2,8,14,2',val:2},
    {sym:'Au',name:'Gold',grp:'metal',shells:'2,8,18,32,18,1',val:1},
  ];
  var colors = {'metal':'var(--math-dim)','non-metal':'var(--evs-dim)','metalloid':'var(--acc-dim)'};
  c.innerHTML = label('Tap an element to explore it') +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0">' +
    elements.map(function(e){
      return '<div onclick="ptSelect(\'' + e.sym + '\')" style="cursor:pointer;width:48px;height:48px;border-radius:8px;background:' +
             (colors[e.grp]||'var(--surface2)') + ';border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center">' +
             '<div style="font-size:14px;font-weight:900">' + e.sym + '</div>' +
             '<div style="font-size:9px;color:var(--muted)">' + e.name + '</div></div>';
    }).join('') + '</div>' +
    '<div id="ptInfo" style="background:var(--surface2);border-radius:10px;padding:10px;font-size:12px;line-height:1.8;color:var(--muted)">Tap an element above</div>';
  var map={}; elements.forEach(function(e){map[e.sym]=e;});
  window.ptSelect = function(sym){
    var e=map[sym];
    document.getElementById('ptInfo').innerHTML =
      '<b style="color:var(--text)">' + e.name + ' (' + sym + ')</b><br>' +
      'Type: ' + e.grp + '<br>Electron shells: ' + e.shells + '<br>' +
      'Valence electrons: <b style="color:var(--acc)">' + e.val + '</b><br>' +
      (e.val===1||e.val===7 ? '⚠️ Highly reactive (nearly full/empty outer shell)' : e.val===8||e.val===0 ? '✅ Very stable (full outer shell)' : 'Moderately reactive');
  };
};

/* Pythagoras */
SIM_REGISTRY['pythagoras'] = function(c) {
  c.innerHTML = label('Enter two legs — calculate hypotenuse') +
    row('<input id="pyA" type="number" min="1" max="20" value="3" style="width:60px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);font-size:13px">' +
        '<span style="color:var(--muted)">a &nbsp;² +</span>' +
        '<input id="pyB" type="number" min="1" max="20" value="4" style="width:60px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);font-size:13px">' +
        '<span style="color:var(--muted)">b &nbsp;² =</span>' +
        '<button class="cbtn math" onclick="pyCalc()">c²</button>') +
    '<canvas id="pyCanvas" width="220" height="160" style="background:var(--surface2);border-radius:10px;margin-top:8px"></canvas>' +
    '<div id="pyResult" style="font-size:13px;margin-top:6px;text-align:center"></div>';
  window.pyCalc = function(){
    var a=parseFloat(document.getElementById('pyA').value)||3;
    var b=parseFloat(document.getElementById('pyB').value)||4;
    var c2=a*a+b*b, c=Math.sqrt(c2);
    var _g=getCtx('pyCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    var scale=Math.min(100/Math.max(a,b), 8);
    var ox=20,oy=140,px=ox+a*scale,py=oy,qx=ox,qy=oy-b*scale;
    ctx.clearRect(0,0,220,160);
    ctx.strokeStyle='var(--acc)'; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(px,py);ctx.lineTo(qx,qy);ctx.closePath();ctx.stroke();
    ctx.fillStyle='var(--text)'; ctx.font='11px Nunito';
    ctx.fillText('a='+a,ox+a*scale/2-8,oy+14);
    ctx.fillText('b='+b,ox-28,oy-b*scale/2);
    ctx.fillText('c='+c.toFixed(2),ox+a*scale/2+10,oy-b*scale/2);
    document.getElementById('pyResult').innerHTML =
      a+'² + '+b+'² = '+a*a+' + '+b*b+' = '+c2+' → <b style="color:var(--acc)">c = '+c.toFixed(3)+'</b>';
  };
  window.pyCalc();
};

/* Punnett square */
SIM_REGISTRY['probability-exp'] = function(c) {
  var heads=0,total=0,raf;
  c.innerHTML = label('Flip coins and watch probability converge on 0.5') +
    '<div id="coinDisplay" style="font-size:48px;margin:8px">🪙</div>' +
    '<canvas id="probCanvas" width="220" height="80" style="background:var(--surface2);border-radius:10px;margin:4px 0"></canvas>' +
    row('<button class="cbtn" onclick="coinFlip()">Flip Once</button>' +
        '<button class="cbtn" onclick="coinAuto()">Flip 50 Fast</button>' +
        '<button class="cbtn" onclick="coinReset()">↺ Reset</button>') +
    '<div id="probInfo" style="font-size:12px;color:var(--muted);margin-top:4px">Heads: 0 / 0</div>';
  var history=[];
  function update(h){
    heads+=h;total++;
    history.push(heads/total);if(history.length>50)history.shift();
    document.getElementById('coinDisplay').textContent=h?'👑':'🌀';
    document.getElementById('probInfo').textContent='Heads: '+heads+' / '+total+' = '+(heads/total).toFixed(3);
    var _g=getCtx('probCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,220,80);
    ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(0,40);ctx.lineTo(220,40);ctx.stroke();
    if(history.length<2)return;
    ctx.strokeStyle='var(--math)';ctx.lineWidth=2;ctx.beginPath();
    history.forEach(function(p,i){var x=i/(history.length-1)*210+5,y=80-p*72;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();
  }
  window.coinFlip=function(){update(Math.random()<.5?1:0);};
  window.coinAuto=function(){var i=0;var t=setInterval(function(){update(Math.random()<.5?1:0);if(++i>=50)clearInterval(t);},60);};
  window.coinReset=function(){heads=0;total=0;history=[];document.getElementById('probInfo').textContent='Heads: 0 / 0';document.getElementById('coinDisplay').textContent='🪙';};
};

/* Compound interest */
SIM_REGISTRY['compound-interest'] = function(c) {
  c.innerHTML = label('Compare Simple vs Compound Interest') +
    '<div style="display:flex;gap:8px;margin:6px 0;flex-wrap:wrap">' +
    '<label style="font-size:12px;color:var(--muted)">Principal ₹<input id="ciP" type="number" value="10000" style="width:70px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px;color:var(--text);font-size:12px"></label>' +
    '<label style="font-size:12px;color:var(--muted)">Rate %<input id="ciR" type="number" value="10" style="width:50px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px;color:var(--text);font-size:12px"></label>' +
    '<label style="font-size:12px;color:var(--muted)">Years<input id="ciT" type="number" value="20" style="width:50px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px;color:var(--text);font-size:12px"></label>' +
    '<button class="cbtn math" onclick="ciCalc()">Calculate</button></div>' +
    '<canvas id="ciCanvas" width="220" height="120" style="background:var(--surface2);border-radius:10px;margin:4px 0"></canvas>' +
    '<div id="ciResult" style="font-size:12px;color:var(--muted);line-height:1.8"></div>';
  window.ciCalc=function(){
    var P=parseFloat(document.getElementById('ciP').value)||10000;
    var R=parseFloat(document.getElementById('ciR').value)||10;
    var T=parseInt(document.getElementById('ciT').value)||20;
    var siArr=[],ciArr=[];
    for(var y=0;y<=T;y++){siArr.push(P+P*R*y/100);ciArr.push(P*Math.pow(1+R/100,y));}
    var maxV=ciArr[T];
    var _g=getCtx('ciCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,220,120);
    function drawLine(arr,color){
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
      arr.forEach(function(v,i){var x=10+i/T*200,y=110-v/maxV*95;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.stroke();
    }
    drawLine(siArr,'var(--muted)');
    drawLine(ciArr,'var(--math)');
    var si=siArr[T],ci=ciArr[T];
    document.getElementById('ciResult').innerHTML=
      '<span style="color:var(--muted)">● SI: ₹'+Math.round(si).toLocaleString()+'</span><br>' +
      '<span style="color:var(--math)">● CI: ₹'+Math.round(ci).toLocaleString()+'</span><br>' +
      '<b>CI is ₹'+Math.round(ci-si).toLocaleString()+' more!</b>';
  };
  window.ciCalc();
};

/* Quadratic */
SIM_REGISTRY['quadratic-real'] = function(c) {
  c.innerHTML = label('Plot h = 20t – 5t² (ball thrown upward)') +
    '<canvas id="quadCanvas" width="240" height="130" style="background:var(--surface2);border-radius:10px;margin:6px 0"></canvas>' +
    '<div id="quadInfo" style="font-size:12px;color:var(--muted);text-align:center"></div>' +
    row('<button class="cbtn" onclick="quadAnimate()">🏀 Launch Ball</button>');
  function drawCurve(){
    var _g=getCtx('quadCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,240,130);
    ctx.strokeStyle='rgba(255,255,255,.15)';ctx.beginPath();ctx.moveTo(10,110);ctx.lineTo(230,110);ctx.stroke();
    ctx.strokeStyle='var(--acc)';ctx.lineWidth=2;ctx.beginPath();
    for(var t=0;t<=4;t+=0.05){var h=20*t-5*t*t;if(h<0)break;var x=10+t/4*220,y=110-h/20*100;t===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();
    ctx.fillStyle='var(--muted)';ctx.font='10px Nunito';
    ctx.fillText('h = 20t − 5t²',10,20);ctx.fillText('Lands at t = 4s',150,105);
  }
  drawCurve();
  window.quadAnimate=function(){
    var t=0,raf;
    document.getElementById('quadInfo').textContent='';
    function frame(){
      var h=20*t-5*t*t;
      if(h<0){document.getElementById('quadInfo').textContent='Landed! Total time = 4s (solve 20t−5t²=0 → t=0 or t=4)';return;}
      drawCurve();
      var _g=getCtx('quadCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
      ctx.beginPath();ctx.arc(10+t/4*220,110-h/20*100,8,0,Math.PI*2);
      ctx.fillStyle='var(--sci)';ctx.fill();
      ctx.fillText('🏀',10+t/4*220-8,110-h/20*100+5);
      document.getElementById('quadInfo').textContent='t='+t.toFixed(1)+'s  h='+Math.max(0,h).toFixed(1)+'m';
      t+=0.08;raf=requestAnimationFrame(frame);
    }
    frame();
  };
};

/* Default fallback for any simId not specifically registered */
SIM_REGISTRY['_default'] = function(c, e) {
  c.innerHTML = '<div style="font-size:52px;margin-bottom:8px">' + e.icon + '</div>' +
    '<div style="font-size:13px;color:var(--muted);text-align:center;max-width:320px;line-height:1.7">' + e.why + '</div>';
};

/* ══════════════════════════════════════════════════
   FLAGSHIP SIMULATIONS — 6 fully interactive sims
   ══════════════════════════════════════════════════ */

/* ── 1. SOLAR SYSTEM SCALE MODEL ── */
SIM_REGISTRY['solar-system'] = function(c) {

  var planets = [
    { name:'Mercury', symbol:'☿', color:'#A8A8A8', glow:'rgba(168,168,168,.5)', r:4,   orbitR:44,  period:4.1,   angle:0.5,  fact:'Smallest planet. A year lasts just 88 Earth days!', distance:'57.9M km', moons:0 },
    { name:'Venus',   symbol:'♀', color:'#E8C56A', glow:'rgba(232,197,106,.5)', r:6,   orbitR:64,  period:10.5,  angle:2.1,  fact:'Hottest planet at 465°C — hotter than Mercury!', distance:'108M km', moons:0 },
    { name:'Earth',   symbol:'🌍',color:'#4D96FF', glow:'rgba(77,150,255,.5)',  r:6.5, orbitR:84,  period:16.7,  angle:1.0,  fact:'Only known planet with life. 71% covered by ocean.', distance:'150M km', moons:1 },
    { name:'Mars',    symbol:'♂', color:'#E8634A', glow:'rgba(232,99,74,.5)',   r:4.5, orbitR:106, period:31.5,  angle:3.8,  fact:'Has Olympus Mons — 3x taller than Mt. Everest!', distance:'228M km', moons:2 },
    { name:'Jupiter', symbol:'♃', color:'#C8945A', glow:'rgba(200,148,90,.5)',  r:13,  orbitR:138, period:197,   angle:2.4,  fact:'King of planets. Its Great Red Spot is a 350-year-old storm!', distance:'778M km', moons:95 },
    { name:'Saturn',  symbol:'♄', color:'#E8D06A', glow:'rgba(232,208,106,.5)', r:11,  orbitR:168, period:490,   angle:5.1,  fact:'So light it could float on water! Rings stretch 282,000 km.', distance:'1.43B km', moons:146 },
    { name:'Uranus',  symbol:'⛢', color:'#6BCBB8', glow:'rgba(107,203,184,.5)', r:8,   orbitR:194, period:1400,  angle:0.8,  fact:'Spins on its side at 98 degrees! Rotates the opposite way.', distance:'2.87B km', moons:28 },
    { name:'Neptune', symbol:'♆', color:'#4D70FF', glow:'rgba(77,112,255,.5)',  r:7,   orbitR:218, period:2750,  angle:4.2,  fact:'Farthest planet. Winds reach 2,100 km/h — fastest in the solar system!', distance:'4.5B km', moons:16 },
  ];

  var selected     = null;
  var animating    = true;
  var speed        = 1;
  var startTime    = Date.now();
  var pausedOffset = 0;
  var raf, canvas, ctx, W, H, CX, CY;
  var hitAreas     = [];
  var starsCache   = null;
  var zoomed       = false;
  var origOrbits   = planets.map(function(p){ return p.orbitR; });

  function buildStars(w, h) {
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    var oc = off.getContext('2d');
    var seed = 42;
    function rand(){ seed=(seed*1664525+1013904223)&0xffffffff; return Math.abs(seed)/0xffffffff; }
    for (var i=0; i<160; i++) {
      var sx=rand()*w, sy=rand()*h, sr=rand()*1.3+0.2, op=rand()*.65+.15;
      if (Math.sqrt((sx-w/2)*(sx-w/2)+(sy-h/2)*(sy-h/2)) < 35) continue;
      oc.beginPath(); oc.arc(sx,sy,sr,0,Math.PI*2);
      oc.fillStyle='rgba(255,255,255,'+op+')'; oc.fill();
    }
    return off;
  }

  function draw() {
    if (!canvas || !canvas.parentNode) { cancelAnimationFrame(raf); return; }
    var t = (Date.now() - startTime) / 1000;
    ctx.clearRect(0,0,W,H);

    var bg = ctx.createRadialGradient(CX,CY,0,CX,CY,CX);
    bg.addColorStop(0,'#08082a'); bg.addColorStop(1,'#000');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    if (starsCache) ctx.drawImage(starsCache,0,0);

    hitAreas = [];

    var angles = planets.map(function(p){
      return p.angle + (animating ? t*speed/p.period : pausedOffset/p.period);
    });

    /* Orbit rings */
    planets.forEach(function(p,i){
      ctx.beginPath(); ctx.arc(CX,CY,p.orbitR,0,Math.PI*2);
      ctx.strokeStyle = selected===i ? p.color+'bb' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = selected===i ? 1.5 : 1;
      ctx.setLineDash(selected===i ? [5,3] : [3,6]);
      ctx.stroke(); ctx.setLineDash([]);
    });

    /* Planets */
    planets.forEach(function(p,i){
      var a=angles[i];
      var px=CX+Math.cos(a)*p.orbitR, py=CY+Math.sin(a)*p.orbitR;
      var sel = selected===i;

      /* Saturn rings */
      if (p.name==='Saturn') {
        ctx.save(); ctx.translate(px,py); ctx.scale(1,0.35);
        ctx.beginPath(); ctx.arc(0,0,p.r*2.2,0,Math.PI*2);
        ctx.strokeStyle=p.color+'99'; ctx.lineWidth=3.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,p.r*1.65,0,Math.PI*2);
        ctx.strokeStyle='#B8A05066'; ctx.lineWidth=2; ctx.stroke();
        ctx.restore();
      }

      /* Earth moon */
      if (p.name==='Earth') {
        var mx=px+Math.cos(a*10)*12, my=py+Math.sin(a*10)*12;
        ctx.beginPath(); ctx.arc(mx,my,2,0,Math.PI*2);
        ctx.fillStyle='rgba(200,200,200,0.7)'; ctx.fill();
      }

      /* Selection ring */
      if (sel) {
        ctx.save(); ctx.translate(px,py); ctx.rotate(t*2);
        ctx.beginPath(); ctx.arc(0,0,p.r+8,0,Math.PI*2);
        ctx.strokeStyle=p.color; ctx.lineWidth=1.8;
        ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      }

      /* Glow halo */
      ctx.beginPath(); ctx.arc(px,py,p.r+5,0,Math.PI*2);
      ctx.fillStyle=p.glow; ctx.fill();

      /* Planet body */
      var gr=ctx.createRadialGradient(px-p.r*.35,py-p.r*.35,0,px,py,p.r*(sel?1.15:1));
      gr.addColorStop(0,'rgba(255,255,255,0.45)'); gr.addColorStop(1,p.color);
      ctx.beginPath(); ctx.arc(px,py,p.r*(sel?1.15:1),0,Math.PI*2);
      ctx.fillStyle=gr; ctx.fill();

      /* Name label */
      if (sel || p.r>=11) {
        ctx.fillStyle=p.color;
        ctx.font=(sel?'bold ':'')+'10px Nunito,sans-serif';
        ctx.textAlign=px>CX?'left':'right';
        var lx=px+(px>CX?p.r+5:-(p.r+5));
        ctx.fillText(p.name, lx, py+4);
      }

      /* Hit area — bigger than visual for easy tapping */
      hitAreas.push({ cx:px, cy:py, r:Math.max(p.r+10,18), idx:i });
    });

    /* Sun */
    for (var ring=0; ring<3; ring++) {
      ctx.beginPath(); ctx.arc(CX,CY,22+(ring+1)*8,0,Math.PI*2);
      ctx.fillStyle='rgba(255,217,61,'+(0.07-ring*0.02)+')'; ctx.fill();
    }
    var sg=ctx.createRadialGradient(CX-7,CY-7,0,CX,CY,20);
    sg.addColorStop(0,'#FFF7AA'); sg.addColorStop(0.6,'#FFD93D'); sg.addColorStop(1,'#FF8C00');
    ctx.beginPath(); ctx.arc(CX,CY,20,0,Math.PI*2);
    ctx.fillStyle=sg; ctx.shadowColor='#FFD93D'; ctx.shadowBlur=35; ctx.fill(); ctx.shadowBlur=0;

    if (selected===-1) {
      ctx.save(); ctx.translate(CX,CY); ctx.rotate(t);
      ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2);
      ctx.strokeStyle='#FFD93Daa'; ctx.lineWidth=1.8;
      ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    hitAreas.push({ cx:CX, cy:CY, r:30, idx:-1 });

    raf = requestAnimationFrame(draw);
  }

  function renderInfo() {
    var el=document.getElementById('ssInfo');
    if (!el) return;
    if (selected===null) {
      el.innerHTML='<div style="color:var(--muted);font-size:12px;text-align:center;padding:6px 0">☝️ Tap any planet or the Sun to explore</div>';
      return;
    }
    if (selected===-1) {
      el.innerHTML='<div style="display:flex;gap:10px;align-items:center">'+
        '<div style="width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFF7AA,#FF8C00);box-shadow:0 0 20px #FFD93D88;flex-shrink:0"></div>'+
        '<div><div style="font-size:14px;font-weight:900;color:#FFD93D">The Sun</div>'+
        '<div style="font-size:11px;color:var(--muted);line-height:1.7">109x wider than Earth · Surface 5,500°C · Core 15 million°C · 8 planets orbit it!</div>'+
        '</div></div>';
      return;
    }
    var p=planets[selected];
    el.innerHTML='<div style="display:flex;gap:10px;align-items:flex-start">'+
      '<div style="width:'+Math.max(28,p.r*2.5)+'px;height:'+Math.max(28,p.r*2.5)+'px;border-radius:50%;'+
        'background:radial-gradient(circle at 35% 35%,white,'+p.color+');'+
        'box-shadow:0 0 16px '+p.glow+';flex-shrink:0;margin-top:2px"></div>'+
      '<div><div style="font-size:15px;font-weight:900;color:'+p.color+'">'+p.symbol+' '+p.name+'</div>'+
      '<div style="display:flex;gap:10px;margin:3px 0 5px;flex-wrap:wrap">'+
      '<span style="font-size:10px;color:var(--muted)">From Sun: '+p.distance+'</span>'+
      '<span style="font-size:10px;color:var(--muted)">Moons: '+p.moons+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+p.fact+'</div>'+
      '</div></div>';
  }

  function getEventXY(e) {
    var rect=canvas.getBoundingClientRect();
    var scaleX=W/rect.width, scaleY=H/rect.height;
    if (e.changedTouches) {
      var t2=e.changedTouches[0];
      return { x:(t2.clientX-rect.left)*scaleX, y:(t2.clientY-rect.top)*scaleY };
    }
    return { x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY };
  }

  function handleHit(e) {
    if (e.type==='touchend') e.preventDefault();
    var pos=getEventXY(e);
    var hit=null;
    /* Check from last-drawn (top) to first */
    for (var i=hitAreas.length-1; i>=0; i--) {
      var h=hitAreas[i];
      var dx=pos.x-h.cx, dy=pos.y-h.cy;
      if (dx*dx+dy*dy <= h.r*h.r) { hit=h; break; }
    }
    selected = hit ? (selected===hit.idx ? null : hit.idx) : null;
    renderInfo();
  }

  /* Build DOM */
  c.innerHTML=
    '<canvas id="solarCanvas" style="border-radius:12px;display:block;width:100%;cursor:pointer;'+
      'box-shadow:0 0 40px rgba(255,200,50,.05),0 0 0 1px rgba(255,255,255,.04)"></canvas>'+
    '<div id="ssInfo" style="margin-top:10px;background:var(--surface2);border-radius:12px;'+
      'padding:11px 14px;min-height:56px;border:1px solid var(--border)">'+
    '<div style="color:var(--muted);font-size:12px;text-align:center;padding:6px 0">☝️ Tap any planet or the Sun to explore</div>'+
    '</div>'+
    '<div class="ctrl-row" style="margin-top:10px;gap:8px;flex-wrap:wrap">'+
    '<button class="cbtn" onclick="solarToggle()" id="solarBtn" style="font-size:12px">⏸ Pause</button>'+
    '<span style="font-size:11px;color:var(--muted)">Speed:</span>'+
    '<input type="range" class="slide" min="1" max="8" value="1" oninput="solarSpeed(this.value)" style="width:80px">'+
    '<button class="cbtn" onclick="solarZoom()" id="solarZoomBtn" style="font-size:12px">🔭 Inner Planets</button>'+
    '</div>';

  canvas=document.getElementById('solarCanvas');
  var _dpr=Math.min(window.devicePixelRatio||1,2);
  W=c.offsetWidth||340; H=W;
  canvas.width=Math.round(W*_dpr); canvas.height=Math.round(H*_dpr);
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  CX=W/2; CY=H/2;
  ctx=canvas.getContext('2d');
  ctx.scale(_dpr,_dpr);
  starsCache=buildStars(W,H);

  canvas.addEventListener('click', handleHit);
  canvas.addEventListener('touchend', handleHit, {passive:false});

  draw();

  window.solarToggle=function(){
    animating=!animating;
    if(!animating) pausedOffset=(Date.now()-startTime)/1000*speed;
    else startTime=Date.now()-pausedOffset/speed*1000;
    var btn=document.getElementById('solarBtn');
    if(btn) btn.textContent=animating?'⏸ Pause':'▶ Resume';
  };
  window.solarSpeed=function(v){ speed=parseFloat(v); };
  window.solarZoom=function(){
    zoomed=!zoomed;
    planets.forEach(function(p,i){
      p.orbitR=zoomed?(i<4?origOrbits[i]*2.1:origOrbits[i]*0.35):origOrbits[i];
    });
    var btn=document.getElementById('solarZoomBtn');
    if(btn) btn.textContent=zoomed?'🌌 Full View':'🔭 Inner Planets';
  };
  window.simCleanup=function(){
    cancelAnimationFrame(raf);
    if(canvas){
      canvas.removeEventListener('click',handleHit);
      canvas.removeEventListener('touchend',handleHit);
    }
  };
};
SIM_REGISTRY['micro-world'] = function(c) {
  var specimens = [
    { name:'Onion Skin Cells', emoji:'🧅',
      draw: function(ctx, w, h) {
        ctx.fillStyle='rgba(255,230,150,.15)';
        ctx.fillRect(0,0,w,h);
        for(var row=0;row<5;row++) for(var col=0;col<4;col++) {
          var x=col*(w/4)+8, y=row*(h/5)+8, cw=w/4-4, ch=h/5-4;
          ctx.strokeStyle='rgba(255,180,50,.8)'; ctx.lineWidth=1.5;
          ctx.strokeRect(x,y,cw,ch);
          ctx.fillStyle='rgba(200,100,50,.6)';
          ctx.beginPath(); ctx.arc(x+cw/2,y+ch/2,Math.min(cw,ch)*.2,0,Math.PI*2); ctx.fill();
        }
      }, fact:'Rectangular cells — plant cell walls clearly visible! Nucleus = dark dot in centre.' },
    { name:'Pond Water Organisms', emoji:'💧',
      draw: function(ctx, w, h) {
        ctx.fillStyle='rgba(77,150,255,.08)';
        ctx.fillRect(0,0,w,h);
        var org = [
          {x:60,y:80,r:12,color:'rgba(107,203,119,.8)',shape:'amoeba'},
          {x:150,y:60,r:6,color:'rgba(255,217,61,.8)',shape:'circle'},
          {x:200,y:130,r:18,color:'rgba(199,125,255,.6)',shape:'oval'},
          {x:80,y:150,r:5,color:'rgba(107,203,119,.7)',shape:'circle'},
          {x:250,y:70,r:8,color:'rgba(255,107,107,.7)',shape:'circle'},
        ];
        org.forEach(function(o) {
          ctx.fillStyle=o.color;
          ctx.beginPath();
          if(o.shape==='oval') { ctx.ellipse(o.x,o.y,o.r*1.8,o.r,0,0,Math.PI*2); }
          else { ctx.arc(o.x,o.y,o.r,0,Math.PI*2); }
          ctx.fill();
          /* cilia */
          for(var a=0;a<8;a++) {
            var ang=a/8*Math.PI*2;
            ctx.strokeStyle=o.color; ctx.lineWidth=1;
            ctx.beginPath();
            ctx.moveTo(o.x+Math.cos(ang)*o.r, o.y+Math.sin(ang)*o.r);
            ctx.lineTo(o.x+Math.cos(ang)*(o.r+6), o.y+Math.sin(ang)*(o.r+6));
            ctx.stroke();
          }
        });
      }, fact:'Tiny living organisms! Paramecia, algae, and amoeba all live in a single drop of pond water.' },
    { name:'Butterfly Wing Scale', emoji:'🦋',
      draw: function(ctx, w, h) {
        ctx.fillStyle='rgba(199,125,255,.05)';
        ctx.fillRect(0,0,w,h);
        var colors=['rgba(199,125,255,.7)','rgba(255,107,107,.6)','rgba(255,217,61,.6)','rgba(77,150,255,.6)'];
        for(var row=0;row<8;row++) for(var col=0;col<10;col++) {
          var ci=(row+col)%4;
          ctx.fillStyle=colors[ci];
          var x=col*28+4, y=row*20+4;
          ctx.beginPath();
          ctx.ellipse(x+12,y+8,10,7,0.2,0,Math.PI*2);
          ctx.fill();
          ctx.strokeStyle='rgba(0,0,0,.2)'; ctx.lineWidth=.5; ctx.stroke();
        }
      }, fact:'Butterfly wings are covered in thousands of tiny overlapping scales — like roof tiles — that create their colour through light reflection!' },
  ];

  var current = 0;
  var zoom = 1;
  var raf;

  function render() {
    var s = specimens[current];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">🔬 Virtual Microscope</div>' +
      '<div style="position:relative;width:240px;height:160px;border-radius:50%;overflow:hidden;' +
        'border:6px solid var(--surface2);box-shadow:0 0 0 3px var(--border),0 0 40px rgba(0,0,0,.3);' +
        'background:#000;margin:0 auto">' +
      '<canvas id="microCanvas" data-w="240" data-h="160" style="width:100%;height:100%;' +
        'transform:scale(' + zoom + ');transform-origin:center;transition:transform .4s"></canvas>' +
      /* Lens crosshair */
      '<div style="position:absolute;inset:0;pointer-events:none;' +
        'background:radial-gradient(circle at 50% 50%,transparent 45%,rgba(0,0,0,.4) 100%)"></div>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:900;color:var(--text);margin:10px 0 2px">' + s.emoji + ' ' + s.name + '</div>' +
      '<div style="font-size:11px;color:var(--muted);max-width:240px;text-align:center;line-height:1.6;margin-bottom:10px">' + s.fact + '</div>' +
      '<div class="ctrl-row">' +
      '<button class="cbtn" onclick="microZoom(-1)">🔍−</button>' +
      '<span style="font-size:11px;color:var(--muted);font-weight:700" id="microZoomLabel">Zoom: 1×</span>' +
      '<button class="cbtn" onclick="microZoom(1)">🔍+</button>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      specimens.map(function(sp,i) {
        return '<button class="cbtn" onclick="microSpecimen(' + i + ')" style="font-size:11px;' +
          (i===current?'background:var(--sci-dim);border-color:var(--sci);color:var(--sci)':'') + '">' + sp.emoji + '</button>';
      }).join('') +
      '</div>';

    var _g=getCtx('microCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,240,160);
    s.draw(ctx, 240, 160);

    /* Animate organisms in pond water */
    if(current === 1) {
      var t = 0;
      raf = setInterval(function() {
        t += 0.05;
        ctx.clearRect(0,0,240,160);
        ctx.fillStyle='rgba(77,150,255,.08)'; ctx.fillRect(0,0,240,160);
        var orgs = [
          {bx:60,by:80,r:12,color:'rgba(107,203,119,.8)',vx:0.8,vy:0.3},
          {bx:150,by:60,r:6,color:'rgba(255,217,61,.8)',vx:-0.5,vy:0.7},
          {bx:200,by:130,r:18,color:'rgba(199,125,255,.6)',vx:0.3,vy:-0.4},
          {bx:80,by:150,r:5,color:'rgba(107,203,119,.7)',vx:-0.7,vy:-0.5},
          {bx:250,by:70,r:8,color:'rgba(255,107,107,.7)',vx:0.6,vy:0.8},
        ];
        orgs.forEach(function(o) {
          var x = o.bx + Math.sin(t * o.vx * 2) * 15;
          var y = o.by + Math.cos(t * o.vy * 2) * 10;
          ctx.fillStyle = o.color;
          ctx.beginPath(); ctx.ellipse(x,y,o.r*1.8,o.r,t*o.vx,0,Math.PI*2); ctx.fill();
        });
      }, 50);
    }
  }

  window.microZoom = function(d) {
    zoom = Math.max(1, Math.min(4, zoom + d * 0.5));
    var cv=document.getElementById('microCanvas');
  if(cv){var _dpr=Math.min(window.devicePixelRatio||1,2);if(!cv._hiDPIReady){var _rect=cv.getBoundingClientRect();var _W=_rect.width>10?_rect.width:parseInt(cv.getAttribute('width'))||300;var _H=_rect.height>10?_rect.height:parseInt(cv.getAttribute('height'))||200;cv.width=Math.round(_W*_dpr);cv.height=Math.round(_H*_dpr);cv.style.width=_W+'px';cv.style.height=_H+'px';cv._dpr=_dpr;cv._W=_W;cv._H=_H;cv._hiDPIReady=true;}}
    if(cv) cv.style.transform = 'scale(' + zoom + ')';
    var lbl = document.getElementById('microZoomLabel');
    if(lbl) lbl.textContent = 'Zoom: ' + zoom + '×';
  };
  window.microSpecimen = function(i) {
    clearInterval(raf);
    current = i;
    zoom = 1;
    render();
  };
  window.simCleanup = function() { clearInterval(raf); };
  render();
};

/* ── 3. STATES OF MATTER ── */
SIM_REGISTRY['states-matter'] = function(c) {
  var state = 'solid';
  var raf;
  var particles = [];

  var configs = {
    solid:  { speed:0.3, spread:false, color:'var(--life)',  label:'❄️ Solid',  temp:'−10°C', desc:'Molecules locked in place — just vibrating in position.' },
    liquid: { speed:1.5, spread:false, color:'var(--sci)',   label:'💧 Liquid', temp:'25°C',  desc:'Molecules flow freely — taking the shape of their container.' },
    gas:    { speed:4.0, spread:true,  color:'var(--acc)',   label:'💨 Gas',    temp:'120°C', desc:'Molecules move fast and spread far apart in all directions.' },
  };

  function initParticles(s) {
    particles = [];
    var cfg = configs[s];
    var count = s==='gas' ? 18 : 24;
    for(var i=0;i<count;i++) {
      var col = Math.floor(i % 6), row = Math.floor(i / 6);
      particles.push({
        x: s==='gas' ? 20+Math.random()*200 : 30+col*32,
        y: s==='gas' ? 20+Math.random()*120 : 30+row*32,
        vx: (Math.random()-.5)*cfg.speed,
        vy: (Math.random()-.5)*cfg.speed,
        r: s==='gas' ? 5 : 7,
      });
    }
  }

  function render() {
    var cfg = configs[state];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">States of Matter</div>' +
      /* Thermometer + temperature */
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
      '<div style="width:16px;height:80px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);position:relative;overflow:hidden">' +
      '<div style="position:absolute;bottom:0;left:0;right:0;border-radius:8px;transition:height .6s;height:' +
        (state==='solid'?'20%':state==='liquid'?'55%':'90%') + ';background:' + cfg.color + '"></div></div>' +
      '<div><div style="font-size:28px;font-weight:900;color:' + cfg.color + '">' + cfg.temp + '</div>' +
      '<div style="font-size:13px;font-weight:800;color:var(--text)">' + cfg.label + '</div></div></div>' +
      /* Canvas */
      '<canvas id="stateCanvas" width="240" height="140" style="border-radius:12px;background:var(--surface);border:1px solid var(--border);display:block"></canvas>' +
      '<div style="font-size:12px;color:var(--muted);margin:8px 0;text-align:center;min-height:36px;line-height:1.7">' + cfg.desc + '</div>' +
      /* Buttons */
      '<div class="ctrl-row">' +
      ['solid','liquid','gas'].map(function(s2) {
        return '<button class="cbtn" onclick="setState(\'' + s2 + '\')" style="' +
          (s2===state?'background:'+cfg.color+';color:white;border-color:'+cfg.color:'') + '">' +
          configs[s2].label + '</button>';
      }).join('') + '</div>';

    initParticles(state);
    clearInterval(raf);
    var _g=getCtx('stateCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    raf = setInterval(function() {
      ctx.clearRect(0,0,240,140);
      var cfg2 = configs[state];
      particles.forEach(function(p) {
        if(state==='solid') {
          p.x += (Math.random()-.5)*0.8;
          p.y += (Math.random()-.5)*0.8;
        } else {
          p.x += p.vx; p.y += p.vy;
          if(p.x<p.r||p.x>240-p.r) p.vx*=-1;
          if(p.y<p.r||p.y>140-p.r) p.vy*=-1;
        }
        /* Draw molecule */
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=cfg2.color; ctx.fill();
        /* Draw bonds for solid */
        if(state==='solid') {
          ctx.strokeStyle=cfg2.color+'44'; ctx.lineWidth=1;
        }
      });
      /* Draw bonds for solid/liquid */
      if(state!=='gas') {
        particles.forEach(function(p,i) {
          particles.slice(i+1).forEach(function(q) {
            var d=Math.hypot(p.x-q.x,p.y-q.y);
            if(d < (state==='solid'?40:55)) {
              ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
              ctx.strokeStyle=configs[state].color+'33'; ctx.lineWidth=1; ctx.stroke();
            }
          });
        });
      }
    }, 40);
  }

  window.setState = function(s) { state=s; render(); };
  window.simCleanup = function() { clearInterval(raf); };
  render();
};

/* ── 4. NEWTON'S THREE LAWS ── */
SIM_REGISTRY['newtons-laws'] = function(c) {
  var law = 1;
  var raf;

  var laws = {
    1: {
      title: "Law 1: Inertia",
      subtitle: "Objects stay still or keep moving unless a force acts",
      color: 'var(--sci)',
      run: function(canvas) {
        var ctx=canvas.getContext('2d');
  if(canvas._dpr){ctx.setTransform(canvas._dpr,0,0,canvas._dpr,0,0);}  var W=canvas._W||canvas.width, H=canvas._H||canvas.height;
        var x = 30, moving = false, friction = false;
        canvas.onclick = function(e) {
          moving = !moving;
        };
        document.getElementById('frictionBtn').onclick = function() {
          friction = !friction;
          document.getElementById('frictionBtn').textContent = friction ? '🧱 Friction ON' : '🫧 No Friction';
        };
        clearInterval(raf);
        raf = setInterval(function() {
          ctx.clearRect(0,0,280,120);
          /* Surface */
          ctx.fillStyle = friction ? '#8B4513' : '#1A1D27';
          ctx.fillRect(0,100,280,20);
          if(friction) {
            ctx.fillStyle='rgba(255,255,255,.2)';
            for(var i=0;i<14;i++) { ctx.fillRect(i*20+4,104,12,4); }
          }
          /* Ball */
          if(moving) { x += friction ? 1.5 : 3; if(x>260) x=20; }
          ctx.beginPath(); ctx.arc(x,90,12,0,Math.PI*2);
          ctx.fillStyle='var(--sci)';
          ctx.shadowColor='var(--sci)'; ctx.shadowBlur=10;
          ctx.fill(); ctx.shadowBlur=0;
          /* Arrow if moving */
          if(moving) {
            ctx.fillStyle='var(--math)'; ctx.font='bold 20px sans-serif';
            ctx.fillText('→', x+15, 95);
          }
          /* Label */
          ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='11px Nunito,sans-serif';
          ctx.fillText(moving?(friction?'Friction slowing it down!':'Keeps going forever in space!'):'Tap canvas to push the ball',10,20);
        },40);
      }
    },
    2: {
      title: "Law 2: F = ma",
      subtitle: "More mass needs more force for the same acceleration",
      color: 'var(--math)',
      run: function(canvas) {
        var ctx=canvas.getContext('2d');
  if(canvas._dpr){ctx.setTransform(canvas._dpr,0,0,canvas._dpr,0,0);}  var W=canvas._W||canvas.width, H=canvas._H||canvas.height;
        var force = 3;
        document.getElementById('forceSlider').oninput = function() {
          force = parseInt(this.value);
          document.getElementById('forceLabel').textContent = 'Force: ' + force + 'N';
        };
        var x1=20, x2=20;
        clearInterval(raf);
        raf = setInterval(function() {
          ctx.clearRect(0,0,280,120);
          /* Light object — mass 1 */
          x1 += force * 0.05; if(x1>240) x1=20;
          ctx.beginPath(); ctx.arc(x1,45,12,0,Math.PI*2);
          ctx.fillStyle='var(--math)';
          ctx.shadowColor='var(--math)'; ctx.shadowBlur=8;
          ctx.fill(); ctx.shadowBlur=0;
          ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='10px Nunito,sans-serif';
          ctx.fillText('m=1kg',x1-16,75);
          /* Heavy object — mass 4 */
          x2 += force * 0.012; if(x2>240) x2=20;
          ctx.beginPath(); ctx.arc(x2,100,20,0,Math.PI*2);
          ctx.fillStyle='var(--muted)';
          ctx.fill();
          ctx.fillStyle='rgba(255,255,255,.7)';
          ctx.fillText('m=4kg',x2-16,120);
          /* Labels */
          ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='11px Nunito,sans-serif';
          ctx.fillText('Same force → light object moves faster!',10,15);
        },40);
      }
    },
    3: {
      title: "Law 3: Action & Reaction",
      subtitle: "Every action has an equal and opposite reaction",
      color: 'var(--acc)',
      run: function(canvas) {
        var ctx=canvas.getContext('2d');
  if(canvas._dpr){ctx.setTransform(canvas._dpr,0,0,canvas._dpr,0,0);}  var W=canvas._W||canvas.width, H=canvas._H||canvas.height;
        var rocketX = 140, exhaust = [];
        var launched = false;
        document.getElementById('launchBtn').onclick = function() { launched=!launched; };
        clearInterval(raf);
        raf = setInterval(function() {
          ctx.clearRect(0,0,280,120);
          if(launched && rocketX > 20) rocketX -= 2.5;
          if(!launched && rocketX < 140) rocketX += 1;
          /* Exhaust particles */
          if(launched) {
            exhaust.push({x:rocketX+30,y:60,vx:3+Math.random()*3,vy:(Math.random()-.5)*3,life:1});
          }
          exhaust = exhaust.filter(function(p){return p.life>0;});
          exhaust.forEach(function(p) {
            p.x+=p.vx; p.y+=p.vy; p.life-=0.05;
            ctx.beginPath(); ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2);
            ctx.fillStyle='rgba(255,107,107,'+p.life+')'; ctx.fill();
          });
          /* Rocket body */
          ctx.fillStyle='var(--acc)';
          ctx.beginPath(); ctx.moveTo(rocketX,50); ctx.lineTo(rocketX+10,35);
          ctx.lineTo(rocketX+20,50); ctx.closePath(); ctx.fill();
          ctx.fillRect(rocketX,50,20,25);
          /* Fins */
          ctx.fillStyle='var(--life)';
          ctx.beginPath(); ctx.moveTo(rocketX,72); ctx.lineTo(rocketX-8,82); ctx.lineTo(rocketX,75); ctx.fill();
          ctx.beginPath(); ctx.moveTo(rocketX+20,72); ctx.lineTo(rocketX+28,82); ctx.lineTo(rocketX+20,75); ctx.fill();
          /* Arrows */
          if(launched) {
            ctx.fillStyle='var(--math)'; ctx.font='bold 16px sans-serif';
            ctx.fillText('←🚀', rocketX-20, 65);
            ctx.fillText('💨→', rocketX+30, 65);
            ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px Nunito,sans-serif';
            ctx.fillText('Action: gas pushed back',rocketX+40,85);
            ctx.fillText('Reaction: rocket goes forward',rocketX-80,95);
          }
          ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='11px Nunito,sans-serif';
          ctx.fillText('Tap Launch to fire rocket!',10,15);
        },40);
      }
    }
  };

  function render() {
    var l = laws[law];
    c.innerHTML =
      '<div style="font-size:14px;font-weight:900;color:' + l.color + ';margin-bottom:2px">' + l.title + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:10px">' + l.subtitle + '</div>' +
      '<canvas id="newtonCanvas" data-w="280" data-h="120" style="border-radius:12px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;display:block;width:100%"></canvas>' +
      /* Law-specific controls */
      (law===1 ? '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" id="frictionBtn">🫧 No Friction</button><div style="font-size:11px;color:var(--muted)">Tap canvas to push ball</div></div>' : '') +
      (law===2 ? '<div class="ctrl-row" style="margin-top:8px"><span style="font-size:12px;color:var(--muted)">Force:</span><input id="forceSlider" type="range" class="slide" min="1" max="10" value="3" style="width:120px"><span id="forceLabel" style="font-size:12px;color:var(--math);font-weight:700">Force: 3N</span></div>' : '') +
      (law===3 ? '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" id="launchBtn" style="background:var(--acc);color:white;border-color:var(--acc)">🚀 Launch!</button></div>' : '') +
      /* Law selector */
      '<div class="ctrl-row" style="margin-top:10px">' +
      [1,2,3].map(function(n) {
        return '<button class="cbtn" onclick="newtonLaw(' + n + ')" style="' +
          (n===law?'background:'+l.color+';color:white;border-color:'+l.color:'') + '">Law ' + n + '</button>';
      }).join('') + '</div>';

    var _ng=getCtx('newtonCanvas'); if(!_ng)return; var canvas=_ng.cv;
    l.run(canvas, _ng.W, _ng.H, _ng.ctx);
  }

  window.newtonLaw = function(n) { clearInterval(raf); law=n; render(); };
  window.simCleanup = function() { clearInterval(raf); };
  render();
};

/* ── 5. DNA EXTRACTION ── */
SIM_REGISTRY['dna-extraction'] = function(c) {
  var step = 0;
  var raf;

  var steps = [
    { label:'🍓 Mash Strawberries', color:'rgba(255,107,107,.8)',
      draw: function(ctx) {
        /* Strawberry being mashed */
        ctx.fillStyle='#E74C3C';
        ctx.beginPath(); ctx.ellipse(120,70,40,35,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#27AE60';
        ctx.beginPath(); ctx.moveTo(120,35); ctx.lineTo(110,20); ctx.lineTo(130,20); ctx.closePath(); ctx.fill();
        /* Seeds */
        ctx.fillStyle='rgba(255,255,255,.5)';
        [[100,55],[125,60],[140,70],[115,80],[135,85]].forEach(function(p){
          ctx.beginPath(); ctx.ellipse(p[0],p[1],3,2,0.5,0,Math.PI*2); ctx.fill();
        });
        /* Fist */
        ctx.fillStyle='#F5CBA7';
        ctx.beginPath(); ctx.roundRect(95,100,50,30,8); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='12px sans-serif';
        ctx.fillText('Squeeze & mash!',70,150);
      }},
    { label:'🧴 Add Soap + Salt', color:'rgba(77,150,255,.8)',
      draw: function(ctx) {
        /* Beaker */
        ctx.strokeStyle='var(--border)'; ctx.lineWidth=2;
        ctx.strokeRect(75,40,90,100);
        /* Liquid */
        ctx.fillStyle='rgba(255,107,107,.3)'; ctx.fillRect(77,90,86,48);
        /* Soap drop */
        ctx.fillStyle='rgba(77,150,255,.7)';
        ctx.beginPath(); ctx.arc(120,55,10,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px sans-serif';
        ctx.fillText('Soap breaks cell walls',60,160);
        ctx.fillText('Salt clumps DNA together',55,175);
      }},
    { label:'🫗 Filter the Liquid', color:'rgba(107,203,119,.8)',
      draw: function(ctx) {
        /* Filter funnel */
        ctx.fillStyle='rgba(255,255,255,.15)';
        ctx.beginPath(); ctx.moveTo(80,40); ctx.lineTo(160,40); ctx.lineTo(130,100); ctx.lineTo(110,100); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='var(--border)'; ctx.lineWidth=1.5; ctx.stroke();
        /* Coffee filter texture */
        ctx.fillStyle='rgba(200,150,80,.3)';
        ctx.beginPath(); ctx.moveTo(82,42); ctx.lineTo(158,42); ctx.lineTo(128,98); ctx.lineTo(112,98); ctx.closePath(); ctx.fill();
        /* Drip */
        ctx.fillStyle='rgba(255,107,107,.6)';
        for(var i=0;i<3;i++) {
          ctx.beginPath(); ctx.arc(120,115+i*15,3-i*0.5,0,Math.PI*2); ctx.fill();
        }
        /* Glass */
        ctx.strokeStyle='var(--border)'; ctx.lineWidth=2;
        ctx.strokeRect(95,145,50,35);
        ctx.fillStyle='rgba(255,107,107,.3)'; ctx.fillRect(97,165,46,13);
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px sans-serif';
        ctx.fillText('Liquid passes through,',60,195); ctx.fillText('pulp stays in filter',65,207);
      }},
    { label:'🍶 Add Cold Alcohol', color:'rgba(199,125,255,.8)',
      draw: function(ctx) {
        /* Glass with two layers */
        ctx.strokeStyle='var(--border)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(70,50,100,120,4); ctx.stroke();
        /* Red liquid layer */
        ctx.fillStyle='rgba(255,107,107,.4)'; ctx.fillRect(72,110,96,58);
        /* Alcohol layer being poured */
        ctx.fillStyle='rgba(199,125,255,.25)'; ctx.fillRect(72,65,96,45);
        /* Bottle */
        ctx.fillStyle='rgba(199,125,255,.6)';
        ctx.beginPath(); ctx.roundRect(145,20,20,40,4); ctx.fill();
        /* Pour stream */
        ctx.strokeStyle='rgba(199,125,255,.5)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(155,60); ctx.quadraticCurveTo(145,80,120,65); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px sans-serif';
        ctx.fillText('Pour slowly down glass side',50,185);
        ctx.fillText('Two layers form!',75,198);
      }},
    { label:'🧬 DNA Appears!', color:'rgba(107,203,119,.8)',
      draw: function(ctx, t) {
        /* Glass */
        ctx.strokeStyle='var(--border)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(70,40,100,130,4); ctx.stroke();
        /* Liquid */
        ctx.fillStyle='rgba(255,107,107,.3)'; ctx.fillRect(72,110,96,58);
        ctx.fillStyle='rgba(199,125,255,.15)'; ctx.fillRect(72,50,96,60);
        /* DNA strands floating up */
        ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2;
        for(var s2=0;s2<5;s2++) {
          var sx = 90+s2*10, sy = 100 - (t*2 + s2*8)%40;
          ctx.beginPath();
          for(var i=0;i<20;i++) {
            var y = sy+i*3;
            var x = sx + Math.sin(i*0.8 + s2)*6;
            i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
        /* Glow */
        ctx.fillStyle='rgba(107,203,119,.4)';
        ctx.beginPath(); ctx.ellipse(120,90,30,15,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 12px sans-serif';
        ctx.fillText('✨ White DNA strands!',60,195);
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px sans-serif';
        ctx.fillText('Millions of DNA molecules',60,210);
      }},
  ];

  function render() {
    clearInterval(raf);
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">DNA Extraction Lab</div>' +
      '<div style="display:flex;gap:4px;margin-bottom:10px;justify-content:center">' +
      steps.map(function(_,i) {
        return '<div style="width:' + (i===step?'24px':'8px') + ';height:8px;border-radius:4px;' +
          'background:' + (i<=step?'var(--evs)':'var(--border)') + ';transition:all .3s"></div>';
      }).join('') + '</div>' +
      '<div style="font-size:14px;font-weight:900;color:var(--evs);margin-bottom:8px">' + steps[step].label + '</div>' +
      '<canvas id="dnaCanvas" width="240" height="220" style="border-radius:12px;background:var(--surface2);border:1px solid var(--border);display:block;margin:0 auto"></canvas>' +
      '<div class="ctrl-row" style="margin-top:10px">' +
      (step>0?'<button class="cbtn" onclick="dnaStep(-1)">← Back</button>':'<div></div>') +
      (step<steps.length-1?'<button class="cbtn" onclick="dnaStep(1)" style="background:var(--evs);color:white;border-color:var(--evs)">Next Step →</button>':
        '<button class="cbtn" onclick="dnaStep(-' + step + ')" style="background:var(--acc);color:white;border-color:var(--acc)">🔄 Restart</button>') +
      '</div>';

    var _g=getCtx('dnaCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    var t = 0;
    if(step === steps.length-1) {
      raf = setInterval(function() {
        ctx.clearRect(0,0,240,220);
        steps[step].draw(ctx,t++);
      },50);
    } else {
      ctx.clearRect(0,0,240,220);
      steps[step].draw(ctx,0);
    }
  }

  window.dnaStep = function(d) {
    clearInterval(raf);
    step = Math.max(0, Math.min(steps.length-1, step+d));
    render();
  };
  window.simCleanup = function() { clearInterval(raf); };
  render();
};

/* ── 6. PUNNETT SQUARE ── */
SIM_REGISTRY['punnett'] = function(c) {
  var p1 = 'Tt', p2 = 'Tt';
  var trait = 'height';

  var traits = {
    height:  { dom:'T', rec:'t', domName:'Tall',    recName:'Short',    domEmoji:'🌲', recEmoji:'🌱' },
    colour:  { dom:'B', rec:'b', domName:'Brown eye',recName:'Blue eye', domEmoji:'🟤', recEmoji:'🔵' },
    tongue:  { dom:'R', rec:'r', domName:'Can roll', recName:"Can't roll",domEmoji:'👅', recEmoji:'😶' },
  };

  function cross(p1g, p2g) {
    return [p1g[0]+p2g[0], p1g[0]+p2g[1], p1g[1]+p2g[0], p1g[1]+p2g[1]];
  }

  function isDom(g, dom) { return g.includes(dom); }

  function render() {
    var tr = traits[trait];
    var offspring = cross(p1, p2);
    var domCount = offspring.filter(function(g){ return isDom(g,tr.dom); }).length;
    var recCount = 4 - domCount;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Punnett Square</div>' +
      /* Trait selector */
      '<div class="ctrl-row" style="margin-bottom:10px">' +
      Object.keys(traits).map(function(k) {
        return '<button class="cbtn" onclick="punnettTrait(\'' + k + '\')" style="font-size:11px;' +
          (k===trait?'background:var(--math-dim);border-color:var(--math);color:var(--math)':'') + '">' + k + '</button>';
      }).join('') + '</div>' +
      /* Parent selector */
      '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:12px">' +
      ['p1','p2'].map(function(p,pi) {
        var val = pi===0?p1:p2;
        return '<div style="text-align:center">' +
          '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">Parent ' + (pi+1) + '</div>' +
          '<select onchange="punnettParent(' + pi + ',this.value)" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);font-size:13px;font-weight:700">' +
          [tr.dom+tr.dom, tr.dom+tr.rec, tr.rec+tr.rec].map(function(opt) {
            return '<option value="' + opt + '"' + (opt===val?' selected':'') + '>' + opt + '</option>';
          }).join('') + '</select></div>';
      }).join('') + '</div>' +
      /* Punnett grid */
      '<div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:4px;max-width:200px;margin:0 auto 12px">' +
      /* Corner */
      '<div></div>' +
      /* Column headers */
      [p2[0],p2[1]].map(function(a) {
        return '<div style="text-align:center;font-weight:900;color:var(--math);font-size:16px">' + a + '</div>';
      }).join('') +
      /* Rows */
      [0,1].map(function(row) {
        return '<div style="font-weight:900;color:var(--math);font-size:16px;display:flex;align-items:center">' + p1[row] + '</div>' +
          [0,1].map(function(col) {
            var g = offspring[row*2+col];
            var dom = isDom(g, tr.dom);
            return '<div style="background:' + (dom?'var(--evs-dim)':'var(--sci-dim)') + ';' +
              'border:1.5px solid ' + (dom?'var(--evs)':'var(--sci)') + ';' +
              'border-radius:8px;padding:8px;text-align:center">' +
              '<div style="font-size:14px;font-weight:900;color:' + (dom?'var(--evs)':'var(--sci)') + '">' + g + '</div>' +
              '<div style="font-size:14px">' + (dom?tr.domEmoji:tr.recEmoji) + '</div>' +
              '</div>';
          }).join('');
      }).join('') +
      '</div>' +
      /* Result */
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;text-align:center">' +
      '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px">Offspring Chances</div>' +
      '<div style="display:flex;gap:8px;justify-content:center">' +
      '<div style="background:var(--evs-dim);border-radius:8px;padding:8px 12px;text-align:center">' +
      '<div style="font-size:20px">' + tr.domEmoji + '</div>' +
      '<div style="font-size:14px;font-weight:900;color:var(--evs)">' + domCount + '/4</div>' +
      '<div style="font-size:10px;color:var(--muted)">' + tr.domName + '</div></div>' +
      (recCount>0?'<div style="background:var(--sci-dim);border-radius:8px;padding:8px 12px;text-align:center">' +
      '<div style="font-size:20px">' + tr.recEmoji + '</div>' +
      '<div style="font-size:14px;font-weight:900;color:var(--sci)">' + recCount + '/4</div>' +
      '<div style="font-size:10px;color:var(--muted)">' + tr.recName + '</div></div>':'') +
      '</div></div>';
  }

  window.punnettTrait  = function(t) { trait=t; var tr=traits[t]; p1=tr.dom+tr.rec; p2=tr.dom+tr.rec; render(); };
  window.punnettParent = function(i,v) { if(i===0)p1=v; else p2=v; render(); };
  render();
};


/* ══════════════════════════════════════════════════
   TIER 1 BATCH 2 — 10 more flagship interactive sims
   ══════════════════════════════════════════════════ */

/* ── WATER CYCLE (terrarium-cycle) ── */
SIM_REGISTRY['conductor-test'] = function(c) {
  var bulbOn = false;
  var selected = null;
  var items = [
    { name:'Copper wire', conducts:true,  emoji:'🔌', why:'Metal — free electrons flow easily' },
    { name:'Iron nail',   conducts:true,  emoji:'🔩', why:'Metal — good conductor like copper' },
    { name:'Gold coin',   conducts:true,  emoji:'🪙', why:'Metal — all metals conduct!' },
    { name:'Pencil lead', conducts:true,  emoji:'✏️', why:'Graphite is a non-metal that conducts!' },
    { name:'Rubber band', conducts:false, emoji:'🟡', why:'Rubber is an insulator — no free electrons' },
    { name:'Plastic pen', conducts:false, emoji:'🖊️', why:'Plastic is an insulator' },
    { name:'Dry wood',    conducts:false, emoji:'🪵', why:'Wood insulates (wet wood can conduct weakly)' },
    { name:'Glass',       conducts:false, emoji:'🪟', why:'Glass is an excellent insulator' },
  ];

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">⚡ Circuit Conductor Tester</div>' +
      /* Circuit diagram */
      '<svg viewBox="0 0 280 100" width="100%" height="90" style="display:block;background:var(--surface2);border-radius:10px;border:1px solid var(--border)">' +
      /* Battery */
      '<rect x="10" y="38" width="30" height="24" rx="4" fill="#FFD93D" stroke="#B8960A" stroke-width="1.5"/>' +
      '<text x="25" y="53" text-anchor="middle" font-size="10" font-weight="bold" fill="#1a1a1a">+−</text>' +
      /* Wires */
      '<line x1="40" y1="45" x2="100" y2="45" stroke="'+(bulbOn?'#6BCB77':'rgba(255,255,255,.3)')+'" stroke-width="2.5"/>' +
      '<line x1="180" y1="45" x2="240" y2="45" stroke="'+(bulbOn?'#6BCB77':'rgba(255,255,255,.3)')+'" stroke-width="2.5"/>' +
      '<line x1="240" y1="45" x2="240" y2="62" stroke="'+(bulbOn?'#6BCB77':'rgba(255,255,255,.3)')+'" stroke-width="2.5"/>' +
      '<line x1="10" y1="62" x2="240" y2="62" stroke="'+(bulbOn?'#6BCB77':'rgba(255,255,255,.3)')+'" stroke-width="2.5"/>' +
      /* Test gap */
      '<text x="140" y="38" text-anchor="middle" font-size="8" fill="var(--muted)">TEST HERE</text>' +
      (selected ?
        '<rect x="100" y="36" width="80" height="18" rx="4" fill="'+(selected.conducts?'var(--evs-dim)':'var(--sci-dim)')+'" stroke="'+(selected.conducts?'var(--evs)':'var(--sci)')+'" stroke-width="1.5"/>' +
        '<text x="140" y="48" text-anchor="middle" font-size="9" fill="'+(selected.conducts?'var(--evs)':'var(--sci)')+'">'+selected.emoji+' '+selected.name+'</text>' :
        '<line x1="100" y1="45" x2="180" y2="45" stroke="rgba(255,255,255,.15)" stroke-width="2" stroke-dasharray="6,4"/>' +
        '<text x="140" y="48" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.3)">← gap →</text>'
      ) +
      /* Bulb */
      (bulbOn ?
        '<circle cx="215" cy="45" r="14" fill="rgba(255,217,61,0.25)"/>' +
        '<circle cx="215" cy="45" r="10" fill="#FFD93D"/>' +
        '<text x="215" y="49" text-anchor="middle" font-size="12">💡</text>' :
        '<circle cx="215" cy="45" r="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>' +
        '<text x="215" y="49" text-anchor="middle" font-size="12">⚫</text>'
      ) +
      '</svg>' +
      /* Result */
      (selected ?
        '<div style="margin:8px 0;padding:8px 12px;border-radius:10px;background:'+(selected.conducts?'var(--evs-dim)':'var(--sci-dim)')+';border:1px solid '+(selected.conducts?'var(--evs)':'var(--sci)')+';font-size:12px;font-weight:700;color:'+(selected.conducts?'var(--evs)':'var(--sci)')+';">' +
        (selected.conducts?'✅ Conducts! ':'❌ Insulates! ') + selected.why + '</div>' :
        '<div style="margin:8px 0;font-size:12px;color:var(--muted);text-align:center">👇 Tap an object to test it in the circuit</div>'
      ) +
      /* Objects grid */
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
      items.map(function(it) {
        var sel = selected && selected.name===it.name;
        return '<button onclick="circTest(\''+it.name+'\')" style="' +
          'background:'+(sel?(it.conducts?'var(--evs-dim)':'var(--sci-dim)'):'var(--surface2)')+';' +
          'border:1.5px solid '+(sel?(it.conducts?'var(--evs)':'var(--sci)'):'var(--border)')+';' +
          'border-radius:10px;padding:8px 4px;cursor:pointer;font-family:Nunito,sans-serif;' +
          'display:flex;flex-direction:column;align-items:center;gap:3px">' +
          '<span style="font-size:20px">'+it.emoji+'</span>' +
          '<span style="font-size:9px;color:var(--muted);text-align:center;line-height:1.3">'+it.name+'</span>' +
          '</button>';
      }).join('') + '</div>';

    window.circTest = function(name) {
      selected = items.find(function(it){return it.name===name;}) || null;
      bulbOn = selected && selected.conducts;
      render();
    };
  }
  render();
};

/* ── FRACTION VISUALISER (fraction-fold) ── */
SIM_REGISTRY['simple-machines'] = function(c) {
  var machine = 'lever';
  var effort = 50;

  var machines = {
    lever: {
      name:'⚖️ Lever', color:'var(--sci)',
      desc:'Move the effort point to see how a lever multiplies force.',
      draw: function(svg, e) {
        var fy=60, fulcX=140, beamY=70, loadX=220, effortX=20+(e/100)*80;
        /* Fulcrum triangle */
        return '<polygon points="'+fulcX+','+beamY+' '+(fulcX-15)+','+(beamY+30)+' '+(fulcX+15)+','+(beamY+30)+'" fill="var(--math)"/>' +
          /* Beam */
          '<rect x="10" y="'+(beamY-5)+'" width="260" height="10" rx="4" fill="var(--sci)"/>' +
          /* Load (right) */
          '<rect x="'+(loadX-15)+'" y="'+(beamY-40)+'" width="30" height="40" rx="4" fill="var(--life)"/>' +
          '<text x="'+loadX+'" y="'+(beamY-18)+'" text-anchor="middle" font-size="10" fill="white">LOAD</text>' +
          /* Effort (left, moveable) */
          '<circle cx="'+effortX+'" cy="'+(beamY-20)+'" r="12" fill="var(--sci)"/>' +
          '<text x="'+effortX+'" y="'+(beamY-16)+'" text-anchor="middle" font-size="8" fill="white">YOU</text>' +
          /* Mechanical advantage */
          '<text x="140" y="115" text-anchor="middle" font-size="10" fill="var(--muted)">MA = '+(Math.abs(fulcX-loadX)/Math.abs(fulcX-effortX)).toFixed(1)+'× force multiplied</text>';
      }
    },
    pulley: {
      name:'🔄 Pulley', color:'var(--math)',
      desc:'Each extra rope reduces the effort needed to lift the load.',
      draw: function(svg, e) {
        var ropes = Math.max(1, Math.round(e/25)+1);
        var load = 100/ropes;
        var out='';
        /* Fixed pulley */
        out+='<circle cx="140" cy="30" r="20" fill="none" stroke="var(--math)" stroke-width="3"/>';
        out+='<circle cx="140" cy="30" r="6" fill="var(--math)"/>';
        /* Ropes */
        for(var i=0;i<ropes;i++) {
          var rx=110+i*15;
          out+='<line x1="'+rx+'" y1="30" x2="'+rx+'" y2="90" stroke="rgba(255,255,255,.4)" stroke-width="2"/>';
        }
        /* Load */
        out+='<rect x="110" y="88" width="60" height="30" rx="4" fill="var(--life)"/>';
        out+='<text x="140" y="107" text-anchor="middle" font-size="10" fill="white">'+Math.round(e)+'kg</text>';
        /* Effort */
        out+='<text x="140" y="140" text-anchor="middle" font-size="11" fill="var(--math)">Effort needed: '+load.toFixed(0)+'kg</text>';
        out+='<text x="140" y="155" text-anchor="middle" font-size="9" fill="var(--muted)">'+ropes+' rope(s) = '+ropes+'× advantage</text>';
        return out;
      }
    },
    incline: {
      name:'📐 Inclined Plane', color:'var(--evs)',
      desc:'A longer ramp means less force needed to move the same load.',
      draw: function(svg, e) {
        var angle = 10 + (e/100)*40; // degrees
        var rad = angle*Math.PI/180;
        var len = 240;
        var h = len*Math.sin(rad);
        var base = len*Math.cos(rad);
        var x0=20, y0=120, x1=x0+base, y1=y0, x2=x0, y2=y0-h;
        var force = Math.sin(rad)*100;
        /* Ramp */
        var out='<polygon points="'+x0+','+y0+' '+x1+','+y1+' '+x2+','+y2+'" fill="rgba(107,203,119,.2)" stroke="var(--evs)" stroke-width="2"/>';
        /* Angle arc */
        out+='<path d="M'+(x0+30)+','+y0+' A30,30 0 0,0 '+(x0+30*Math.cos(Math.PI-rad))+','+(y0-30*Math.sin(Math.PI-rad))+'" fill="none" stroke="var(--math)" stroke-width="1.5"/>';
        out+='<text x="'+(x0+22)+'" y="'+(y0-10)+'" font-size="9" fill="var(--math)">'+angle.toFixed(0)+'°</text>';
        /* Box on ramp */
        var bx=x0+base*.6, by=y0-h*.6;
        out+='<rect x="'+(bx-12)+'" y="'+(by-12)+'" width="24" height="24" rx="4" fill="var(--life)" transform="rotate(-'+angle+','+bx+','+by+')"/>';
        out+='<text x="140" y="145" text-anchor="middle" font-size="11" fill="var(--evs)">Force needed: '+force.toFixed(0)+'N</text>';
        out+='<text x="140" y="158" text-anchor="middle" font-size="9" fill="var(--muted)">(vs 100N to lift straight up)</text>';
        return out;
      }
    }
  };

  function render() {
    var m = machines[machine];
    c.innerHTML =
      '<div style="font-size:14px;font-weight:900;color:'+m.color+';margin-bottom:4px;text-align:center">'+m.name+'</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-align:center">'+m.desc+'</div>' +
      '<svg viewBox="0 0 280 170" width="100%" height="160" style="background:var(--surface2);border-radius:12px;border:1px solid var(--border);display:block">' +
      m.draw('',effort) + '</svg>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Effort:</span>' +
      '<input type="range" class="slide" min="10" max="90" value="'+effort+'" oninput="smEffort(this.value)" style="width:100px">' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      Object.keys(machines).map(function(k) {
        return '<button class="cbtn" onclick="smSet(\''+k+'\')" style="font-size:11px;'+
          (k===machine?'background:'+m.color+';color:white;border-color:'+m.color:'')+'">'+machines[k].name+'</button>';
      }).join('') + '</div>';

    window.smSet    = function(k) { machine=k; render(); };
    window.smEffort = function(v) { effort=parseFloat(v); render(); };
  }
  render();
};

/* ── ACID BASE PH INDICATOR (ph-indicator) ── */
SIM_REGISTRY['reflection-sim'] = function(c) {
  var angle = 45;
  var mirror = 'flat';
  var raf, t = 0;

  var mirrors = { flat:'🪞 Flat', concave:'🔎 Concave', convex:'🔍 Convex' };

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🪞 Light & Reflection Lab</div>' +
      '<canvas id="refCanvas" data-w="300" data-h="180" style="border-radius:12px;background:#050510;border:1px solid var(--border);display:block;margin:0 auto;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Angle:</span>' +
      '<input type="range" class="slide" min="5" max="85" value="'+angle+'" oninput="refAngle(this.value)" style="width:110px">' +
      '<span style="font-size:11px;color:var(--math);font-weight:700">'+angle+'°</span>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:6px">' +
      Object.keys(mirrors).map(function(k) {
        return '<button class="cbtn" onclick="refMirror(\''+k+'\')" style="font-size:11px;'+
          (k===mirror?'background:var(--math-dim);border-color:var(--math);color:var(--math)':'')+'">'+mirrors[k]+'</button>';
      }).join('') + '</div>' +
      '<div id="refInfo" style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;min-height:16px"></div>';

    var _g=getCtx('refCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    cancelAnimationFrame(raf);

    function draw() {
      t += 0.03;
       cx=W/2, my=H-30;
      ctx.clearRect(0,0,W,H);

      /* Mirror surface */
      if(mirror==='flat') {
        var mg=ctx.createLinearGradient(cx-80,0,cx+80,0);
        mg.addColorStop(0,'rgba(150,220,255,0)');
        mg.addColorStop(.5,'rgba(150,220,255,0.6)');
        mg.addColorStop(1,'rgba(150,220,255,0)');
        ctx.fillStyle=mg; ctx.fillRect(cx-80,my,160,6); ctx.fillRect(cx-80,my+6,160,3);
        ctx.fillStyle='rgba(100,150,200,.2)'; ctx.fillRect(cx-80,my+9,160,8);
        document.getElementById('refInfo').textContent='Angle of incidence = Angle of reflection = '+angle+'°';
      } else if(mirror==='concave') {
        ctx.strokeStyle='rgba(150,220,255,0.6)'; ctx.lineWidth=5;
        ctx.beginPath(); ctx.arc(cx,my+120,130,-Math.PI*.85,-Math.PI*.15); ctx.stroke();
        document.getElementById('refInfo').textContent='Concave: rays converge at focal point — used in torches, telescopes';
      } else {
        ctx.strokeStyle='rgba(150,220,255,0.5)'; ctx.lineWidth=5;
        ctx.beginPath(); ctx.arc(cx,my-120,130,Math.PI*.15,Math.PI*.85); ctx.stroke();
        document.getElementById('refInfo').textContent='Convex: rays diverge — wider view, used in car side mirrors';
      }

      /* Normal line (dashed) */
      ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(cx,my-80); ctx.lineTo(cx,my+20); ctx.stroke();
      ctx.setLineDash([]);

      /* Incident ray */
      var rad=(90-angle)*Math.PI/180;
      var ix=cx-Math.cos(rad)*120, iy=my-Math.sin(rad)*120;
      var grad=ctx.createLinearGradient(ix,iy,cx,my);
      grad.addColorStop(0,'rgba(255,220,50,0)'); grad.addColorStop(1,'rgba(255,220,50,0.9)');
      ctx.strokeStyle=grad; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(ix,iy); ctx.lineTo(cx,my); ctx.stroke();

      /* Reflected ray */
      var rx=cx+Math.cos(rad)*120, ry=my-Math.sin(rad)*120;
      if(mirror==='flat') {
        var rgrad=ctx.createLinearGradient(cx,my,rx,ry);
        rgrad.addColorStop(0,'rgba(50,220,255,0.9)'); rgrad.addColorStop(1,'rgba(50,220,255,0)');
        ctx.strokeStyle=rgrad; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(cx,my); ctx.lineTo(rx,ry); ctx.stroke();
      } else if(mirror==='concave') {
        /* Converging rays */
        for(var i=-2;i<=2;i++) {
          var bx=cx+i*30, by=0;
          var rg2=ctx.createLinearGradient(bx,by,cx,my-20);
          rg2.addColorStop(0,'rgba(255,220,50,0)'); rg2.addColorStop(1,'rgba(255,220,50,0.6)');
          ctx.strokeStyle=rg2; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(cx,my-20); ctx.stroke();
        }
        /* Focal point glow */
        ctx.fillStyle='rgba(255,220,50,0.6)'; ctx.beginPath(); ctx.arc(cx,my-20,6+Math.sin(t)*2,0,Math.PI*2); ctx.fill();
      } else {
        /* Diverging rays */
        for(var j=-2;j<=2;j++) {
          var dx=cx+j*40, dy=0;
          ctx.strokeStyle='rgba(50,220,255,0.4)'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.moveTo(cx,my); ctx.lineTo(dx,dy); ctx.stroke();
        }
      }

      /* Angle labels */
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='bold 10px sans-serif';
      ctx.fillText(angle+'°',cx-40,my-20);
      if(mirror==='flat') ctx.fillText(angle+'°',cx+20,my-20);

      raf = requestAnimationFrame(draw);
    }
    draw();
  }

  window.refAngle  = function(v) { angle=parseInt(v); cancelAnimationFrame(raf); render(); };
  window.refMirror = function(m) { mirror=m; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── PLANT GROWTH SIMULATOR (plant-parts) ── */
SIM_REGISTRY['plant-parts'] = function(c) {
  var water = 50, sun = 50, soil = 50;
  var day = 0;
  var timer;

  function health() { return Math.min(100,Math.round((water+sun+soil)/3)); }
  function growthRate() {
    var h=health();
    return h>80?'🌳 Thriving!':h>60?'🌱 Growing well':h>40?'😐 Growing slowly':'🥀 Struggling';
  }

  function render() {
    var h=health(), stemH=Math.min(120,Math.round(h*1.2)), leafSize=Math.round(h*.4+10);
    var col=h>70?'#4BCB6B':h>40?'#A8CC44':'#CC8844';
    var flowerShow=h>80&&day>5;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">🌻 Plant Growth Lab — Day '+day+'</div>' +
      '<div style="display:flex;gap:12px;align-items:flex-end">' +
      /* Plant SVG */
      '<div style="flex:0 0 120px">' +
      '<svg viewBox="0 0 120 180" width="120" height="180">' +
      /* Sky */
      '<rect width="120" height="110" fill="'+(sun>60?'#1a3a6b':'#1a1a3a')+'"/>' +
      /* Sun */
      (sun>30?'<circle cx="90" cy="25" r="'+(sun/100*18+8)+'" fill="#FFD93D" opacity="'+(sun/100*.8+.2)+'"/>'
        :'<circle cx="90" cy="25" r="10" fill="rgba(100,100,120,.5)"/>') +
      /* Soil */
      '<rect y="110" width="120" height="70" fill="#5C3A1E"/>' +
      '<rect y="110" width="120" height="12" fill="'+(soil>50?'#7A5230':'#5C4020')+'"/>' +
      /* Roots */
      '<line x1="60" y1="120" x2="40" y2="150" stroke="#8B5E3C" stroke-width="2"/>' +
      '<line x1="60" y1="120" x2="80" y2="155" stroke="#8B5E3C" stroke-width="2"/>' +
      '<line x1="60" y1="120" x2="60" y2="165" stroke="#8B5E3C" stroke-width="2.5"/>' +
      /* Water drops in soil */
      (water>50?'<circle cx="35" cy="140" r="4" fill="rgba(77,150,255,.5)"/><circle cx="85" cy="145" r="3" fill="rgba(77,150,255,.5)"/>':'') +
      /* Stem */
      '<line x1="60" y1="120" x2="60" y2="'+(120-stemH)+'" stroke="'+col+'" stroke-width="4" stroke-linecap="round"/>' +
      /* Leaves */
      (stemH>30?'<ellipse cx="'+(60-leafSize*.7)+'" cy="'+(120-stemH*.5)+'" rx="'+leafSize+'" ry="'+(leafSize*.5)+'" fill="'+col+'" opacity=".8" transform="rotate(-30,'+(60-leafSize*.7)+','+(120-stemH*.5)+')"/>':'') +
      (stemH>50?'<ellipse cx="'+(60+leafSize*.7)+'" cy="'+(120-stemH*.7)+'" rx="'+leafSize+'" ry="'+(leafSize*.5)+'" fill="'+col+'" opacity=".8" transform="rotate(30,'+(60+leafSize*.7)+','+(120-stemH*.7)+')"/>':'') +
      /* Flower */
      (flowerShow?'<circle cx="60" cy="'+(120-stemH)+'" r="14" fill="#FF6B9D"/><circle cx="60" cy="'+(120-stemH)+'" r="7" fill="#FFD93D"/>':'') +
      '</svg></div>' +
      /* Controls */
      '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
      '<div style="font-size:14px;font-weight:900;color:'+col+'">'+growthRate()+'</div>' +
      ['water','sun','soil'].map(function(n) {
        var val=n==='water'?water:n==='sun'?sun:soil;
        var emoji=n==='water'?'💧':n==='sun'?'☀️':'🌍';
        return '<div>' +
          '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:3px">' +
          '<span>'+emoji+' '+n.charAt(0).toUpperCase()+n.slice(1)+'</span>' +
          '<span style="color:var(--text);font-weight:700">'+val+'%</span></div>' +
          '<div style="position:relative;height:8px;background:var(--surface2);border-radius:4px">' +
          '<div style="position:absolute;left:0;top:0;height:100%;width:'+val+'%;border-radius:4px;' +
            'background:'+(n==='water'?'var(--life)':n==='sun'?'var(--math)':'#8B5E3C')+';transition:width .3s"></div></div>' +
          '<input type="range" min="0" max="100" value="'+val+'" oninput="plantSet(\''+n+'\',this.value)" style="width:100%;margin-top:2px;height:3px;accent-color:'+(n==='water'?'var(--life)':n==='sun'?'var(--math)':'#8B5E3C')+'">' +
          '</div>';
      }).join('') +
      '<div style="display:flex;gap:6px">' +
      '<button class="cbtn evs" onclick="plantGrow()" style="font-size:11px;flex:1">🌤️ Next Day</button>' +
      '<button class="cbtn" onclick="plantReset()" style="font-size:11px">↺</button>' +
      '</div></div></div>';

    window.plantSet = function(n,v) {
      if(n==='water')water=parseInt(v);
      else if(n==='sun')sun=parseInt(v);
      else soil=parseInt(v);
      render();
    };
    window.plantGrow  = function() { day++; render(); };
    window.plantReset = function() { day=0; water=50; sun=50; soil=50; render(); };
  }
  render();
};

/* ── CLOCK READING (clock-reading) ── */
SIM_REGISTRY['clock-reading'] = function(c) {
  var hours=3, minutes=0, mode='read'; // read | set

  function render() {
    var hAngle = (hours%12 + minutes/60) * 30 - 90; // degrees
    var mAngle = minutes * 6 - 90;
    var hRad=hAngle*Math.PI/180, mRad=mAngle*Math.PI/180;
    var cx=80, cy=80, r=72;
    var hx=cx+Math.cos(hRad)*42, hy=cy+Math.sin(hRad)*42;
    var mx=cx+Math.cos(mRad)*60, my=cy+Math.sin(mRad)*60;

    /* Clock face SVG */
    var ticks='';
    for(var i=0;i<60;i++) {
      var a=i/60*Math.PI*2-Math.PI/2;
      var isMaj=i%5===0;
      var x1=cx+Math.cos(a)*(r-(isMaj?12:6)), y1=cy+Math.sin(a)*(r-(isMaj?12:6));
      var x2=cx+Math.cos(a)*(r-2), y2=cy+Math.sin(a)*(r-2);
      ticks+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(isMaj?'rgba(255,255,255,.7)':'rgba(255,255,255,.2)')+'" stroke-width="'+(isMaj?2:1)+'"/>';
    }
    var nums='';
    for(var n=1;n<=12;n++) {
      var na=(n/12*Math.PI*2)-Math.PI/2;
      nums+='<text x="'+(cx+Math.cos(na)*(r-20))+'" y="'+(cy+Math.sin(na)*(r-20)+4)+'" text-anchor="middle" font-size="11" font-weight="bold" fill="rgba(255,255,255,.8)" font-family="Nunito,sans-serif">'+n+'</text>';
    }

    /* Time string */
    var h12=hours%12||12, ampm=hours<12?'AM':'PM';
    var timeStr=h12+':'+(minutes<10?'0':'')+minutes+' '+ampm;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🕐 Learn to Read a Clock</div>' +
      '<div style="display:flex;gap:16px;align-items:center;justify-content:center">' +
      /* Analogue clock */
      '<svg width="160" height="160" viewBox="0 0 160 160">' +
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#1A1D40" stroke="rgba(255,255,255,.15)" stroke-width="2"/>' +
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r-3)+'" fill="none" stroke="rgba(199,125,255,.15)" stroke-width="1"/>' +
      ticks+nums+
      /* Hour hand */
      '<line x1="'+cx+'" y1="'+cy+'" x2="'+hx+'" y2="'+hy+'" stroke="white" stroke-width="5" stroke-linecap="round"/>' +
      /* Minute hand */
      '<line x1="'+cx+'" y1="'+cy+'" x2="'+mx+'" y2="'+my+'" stroke="var(--sci)" stroke-width="3" stroke-linecap="round"/>' +
      /* Centre dot */
      '<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="var(--acc)"/>' +
      '</svg>' +
      /* Digital + controls */
      '<div>' +
      '<div style="font-size:36px;font-weight:900;color:var(--text);font-family:monospace;margin-bottom:8px">'+timeStr+'</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">'+
        (minutes===0?'O\'Clock':minutes===30?'Half past '+h12:minutes===15?'Quarter past '+h12:minutes===45?'Quarter to '+((h12%12)+1):minutes+' minutes past '+h12)+
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:11px;color:white;width:50px">Hour:</span>' +
      '<button class="cbtn" onclick="clockH(-1)" style="padding:4px 10px">−</button>' +
      '<span style="font-size:14px;font-weight:800;color:white;min-width:20px;text-align:center">'+h12+'</span>' +
      '<button class="cbtn" onclick="clockH(1)" style="padding:4px 10px">+</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span style="font-size:11px;color:var(--sci);width:50px">Mins:</span>' +
      '<button class="cbtn" onclick="clockM(-5)" style="padding:4px 10px">−5</button>' +
      '<span style="font-size:14px;font-weight:800;color:var(--sci);min-width:20px;text-align:center">'+(minutes<10?'0':'')+minutes+'</span>' +
      '<button class="cbtn" onclick="clockM(5)" style="padding:4px 10px">+5</button>' +
      '</div>' +
      '</div>' +
      /* Quick times */
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px">' +
      [[3,0],[6,0],[9,0],[12,0],[3,15],[6,30],[9,45]].map(function(t) {
        return '<button class="cbtn" onclick="clockSet('+t[0]+','+t[1]+')" style="font-size:10px;padding:4px 7px">'+t[0]+':'+(t[1]<10?'0':'')+t[1]+'</button>';
      }).join('') + '</div>' +
      '</div></div>';

    window.clockH   = function(d) { hours=(hours+d+24)%24; render(); };
    window.clockM   = function(d) { minutes=(minutes+d+60)%60; render(); };
    window.clockSet = function(h,m) { hours=h; minutes=m; render(); };
  }
  render();
};


/* ══════════════════════════════════════════
   BATCH 2 — 10 new flagship simulations
   ══════════════════════════════════════════ */

/* ── 1. WATER CYCLE (terrarium-cycle) ── */
SIM_REGISTRY['terrarium-cycle'] = function(c) {
  var stage = 0;
  var raf, t = 0;
  var stages = [
    { name:'☀️ Evaporation', color:'var(--math)', desc:'Sun heats water → turns to vapour → rises as invisible gas' },
    { name:'☁️ Condensation', color:'var(--life)', desc:'Water vapour cools high up → forms tiny droplets → clouds!' },
    { name:'🌧️ Precipitation', color:'var(--acc)', desc:'Droplets grow heavy → fall as rain, snow or hail' },
    { name:'🌊 Collection', color:'var(--sci)', desc:'Water collects in rivers, lakes, oceans → cycle begins again' },
  ];

  function draw() {
    var _g = getCtx('wcCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    /* Sky gradient */
    var sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0, stage===1||stage===2 ? '#1a2a4a':'#0a1a3a');
    sky.addColorStop(1, '#2d5a27');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

    /* Ground */
    ctx.fillStyle='#3a6b2a'; ctx.fillRect(0,H*0.72,W,H*0.28);
    ctx.fillStyle='#2d5220'; ctx.fillRect(0,H*0.72,W,8);

    /* Water body (ocean/lake) */
    ctx.fillStyle='rgba(77,150,255,0.6)';
    ctx.beginPath(); ctx.ellipse(W*0.75,H*0.82,W*0.2,H*0.07,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(100,180,255,0.3)';
    ctx.beginPath(); ctx.ellipse(W*0.75+Math.sin(t)*3,H*0.81,W*0.18,H*0.04,0,0,Math.PI*2); ctx.fill();

    /* Mountain */
    ctx.fillStyle='#5a7a4a';
    ctx.beginPath(); ctx.moveTo(W*0.1,H*0.72); ctx.lineTo(W*0.3,H*0.3); ctx.lineTo(W*0.5,H*0.72); ctx.fill();
    ctx.fillStyle='white'; /* snow cap */
    ctx.beginPath(); ctx.moveTo(W*0.3,H*0.3); ctx.lineTo(W*0.24,H*0.45); ctx.lineTo(W*0.36,H*0.45); ctx.fill();

    /* Sun */
    ctx.fillStyle='#FFD93D';
    ctx.shadowColor='#FFD93D'; ctx.shadowBlur=20;
    ctx.beginPath(); ctx.arc(W*0.85,H*0.1,22,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;

    /* Stage-specific elements */
    if (stage === 0) { /* Evaporation — wavy lines rising */
      ctx.strokeStyle='rgba(77,150,255,0.5)'; ctx.lineWidth=2;
      for (var i=0;i<5;i++) {
        var bx=W*0.55+i*18, by=H*0.78;
        ctx.beginPath(); ctx.moveTo(bx,by);
        for (var j=0;j<8;j++) {
          ctx.quadraticCurveTo(bx+(j%2===0?5:-5),by-j*8-4,bx,by-j*8-8);
        }
        var progress = ((t*0.5+i*0.3)%1);
        ctx.setLineDash([2,3]); ctx.globalAlpha=1-progress; ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha=1;
      }
    }
    if (stage === 1) { /* Cloud forming */
      var cloudX=W*0.45, cloudY=H*0.2;
      ctx.fillStyle='rgba(200,220,255,0.85)';
      [[0,0,28],[20,-8,22],[40,0,25],[-18,-5,20]].forEach(function(b){
        ctx.beginPath(); ctx.arc(cloudX+b[0]+Math.sin(t)*2,cloudY+b[1],b[2],0,Math.PI*2); ctx.fill();
      });
      ctx.fillStyle='rgba(150,180,255,0.6)';
      ctx.beginPath(); ctx.arc(cloudX-10+Math.sin(t+1)*2,cloudY+5,18,0,Math.PI*2); ctx.fill();
    }
    if (stage === 2) { /* Rain drops */
      ctx.fillStyle='rgba(100,160,255,0.8)'; ctx.strokeStyle='rgba(100,160,255,0.6)'; ctx.lineWidth=1.5;
      var cloudX=W*0.45, cloudY=H*0.2;
      /* Cloud */
      ctx.fillStyle='rgba(150,170,200,0.85)';
      [[0,0,28],[20,-8,22],[40,0,25],[-18,-5,20]].forEach(function(b){
        ctx.beginPath(); ctx.arc(cloudX+b[0],cloudY+b[1],b[2],0,Math.PI*2); ctx.fill();
      });
      /* Raindrops */
      ctx.fillStyle='rgba(100,160,255,0.8)';
      for (var r=0;r<12;r++) {
        var rx=cloudX-30+r*14, ry=cloudY+30+((t*80+r*20)%120);
        ctx.beginPath(); ctx.ellipse(rx,ry,2,5,-0.3,0,Math.PI*2); ctx.fill();
      }
    }
    if (stage === 3) { /* River flowing */
      ctx.strokeStyle='rgba(77,150,255,0.7)'; ctx.lineWidth=6;
      ctx.beginPath();
      ctx.moveTo(W*0.3,H*0.5);
      ctx.bezierCurveTo(W*0.4+Math.sin(t)*5,H*0.58,W*0.55,H*0.65,W*0.72,H*0.76);
      ctx.stroke();
      ctx.strokeStyle='rgba(120,200,255,0.4)'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(W*0.31,H*0.5);
      ctx.bezierCurveTo(W*0.41+Math.sin(t+0.5)*4,H*0.58,W*0.56,H*0.65,W*0.73,H*0.76);
      ctx.stroke();
    }

    /* Arrow showing cycle direction */
    ctx.fillStyle=stages[stage].color.replace('var(--','rgba(').replace(')',',0.8)') || 'rgba(255,255,255,0.6)';
    t += 0.04;
    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:13px;font-weight:900;color:var(--text);margin-bottom:6px;text-align:center">' + stages[stage].name + '</div>' +
      '<canvas id="wcCanvas" data-w="320" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin:8px 0;font-size:12px;color:var(--text);line-height:1.7;border:1px solid var(--border)">' + stages[stage].desc + '</div>' +
      '<div class="ctrl-row">' +
      stages.map(function(s,i){
        return '<button class="cbtn" onclick="wcStage('+i+')" style="font-size:11px;padding:6px 10px;' +
          (i===stage?'background:var(--acc);color:white;border-color:var(--acc)':'') + '">' + s.name + '</button>';
      }).join('') +
      '</div>';
    cancelAnimationFrame(raf);
    requestAnimationFrame(function(){ requestAnimationFrame(draw); });
  }
  window.wcStage = function(i) { stage=i; render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── 2. ACID/BASE pH INDICATOR (ph-indicator) ── */
SIM_REGISTRY['ph-indicator'] = function(c) {
  var ph = 7;
  var liquids = [
    { name:'Lemon Juice', ph:2.5, emoji:'🍋' },
    { name:'Vinegar',     ph:3.0, emoji:'🍾' },
    { name:'Tomato',      ph:4.2, emoji:'🍅' },
    { name:'Milk',        ph:6.5, emoji:'🥛' },
    { name:'Pure Water',  ph:7.0, emoji:'💧' },
    { name:'Baking Soda', ph:8.5, emoji:'🧂' },
    { name:'Soap',        ph:9.5, emoji:'🧼' },
    { name:'Bleach',      ph:12,  emoji:'🫧' },
  ];

  function phColor(p) {
    if (p<=2)  return '#FF2020';
    if (p<=4)  return '#FF6B00';
    if (p<=6)  return '#FFD93D';
    if (p<=7)  return '#A8E06A';
    if (p<=8)  return '#6BCB77';
    if (p<=10) return '#4D96FF';
    if (p<=12) return '#7B4FFF';
    return '#4A0080';
  }

  function phLabel(p) {
    if (p < 7) return '⚗️ Acid (pH ' + p.toFixed(1) + ')';
    if (p > 7) return '🧪 Base (pH ' + p.toFixed(1) + ')';
    return '⚖️ Neutral (pH 7.0)';
  }

  function render() {
    var color = phColor(ph);
    var scale = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">pH Indicator — Cabbage Juice Test</div>' +
      /* Big beaker */
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">' +
      '<div style="position:relative;width:80px;height:110px;margin:0 auto">' +
      '<div style="position:absolute;bottom:0;left:8px;right:8px;height:85px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);border-top:none;border-radius:0 0 8px 8px"></div>' +
      '<div style="position:absolute;bottom:2px;left:10px;right:10px;height:'+(ph/14*80)+'px;background:'+color+';opacity:0.8;border-radius:0 0 6px 6px;transition:all .4s"></div>' +
      '<div style="position:absolute;bottom:0;left:0;right:0;height:85px;border:2px solid rgba(255,255,255,.3);border-top:none;border-radius:0 0 8px 8px;pointer-events:none"></div>' +
      '<div style="position:absolute;top:0;left:6px;right:6px;height:10px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.2);border-radius:4px 4px 0 0"></div>' +
      '</div>' +
      '<div style="flex:1">' +
      '<div style="font-size:22px;font-weight:900;color:'+color+';transition:color .4s;margin-bottom:4px">'+phLabel(ph)+'</div>' +
      '<div style="font-size:12px;color:var(--muted);line-height:1.7">' +
      (ph<7?'Produces H⁺ ions. Tastes sour. Turns blue litmus red.':'') +
      (ph===7?'Perfectly balanced. Pure water at 25°C.':'') +
      (ph>7?'Produces OH⁻ ions. Feels slippery. Turns red litmus blue.':'') +
      '</div></div></div>' +
      /* pH scale bar */
      '<div style="margin-bottom:10px">' +
      '<div style="display:flex;border-radius:8px;overflow:hidden;height:18px">' +
      scale.map(function(p){
        return '<div style="flex:1;background:'+phColor(p)+';opacity:'+(Math.abs(p-ph)<0.8?1:0.5)+';transition:opacity .3s;cursor:pointer" onclick="setPH('+p+')" title="pH '+p+'"></div>';
      }).join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-top:3px;padding:0 4px">' +
      '<span>1 Acid</span><span>7 Neutral</span><span>14 Base</span>' +
      '</div></div>' +
      /* Slider */
      '<div class="ctrl-row" style="margin-bottom:10px">' +
      '<span style="font-size:11px;color:var(--muted)">pH:</span>' +
      '<input type="range" class="slide" min="1" max="14" step="0.5" value="'+ph+'" oninput="setPH(this.value)" style="width:160px">' +
      '<span style="font-size:14px;font-weight:900;color:'+color+';min-width:28px">'+ph+'</span>' +
      '</div>' +
      /* Liquid buttons */
      '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' +
      liquids.map(function(l){
        return '<button class="cbtn" onclick="setPH('+l.ph+')" style="font-size:11px;padding:5px 9px">' + l.emoji + ' ' + l.name + '</button>';
      }).join('') +
      '</div>';
  }

  window.setPH = function(v) { ph=parseFloat(v); render(); };
  render();
};

/* ── 3. HUMAN DIGESTIVE SYSTEM (digestion-sim) ── */
SIM_REGISTRY['digestion-sim'] = function(c) {
  var step = 0;
  var raf, t = 0;
  var steps = [
    { organ:'👄 Mouth',          color:'#FF6B6B', time:'~1 min',
      desc:'Teeth break food into smaller pieces (mechanical). Saliva adds enzymes — amylase breaks starch into sugar (chemical). Tongue shapes food into a bolus.',
      tip:'Saliva has antimicrobial properties! That\'s why licking a wound was ancient first aid.' },
    { organ:'🔴 Oesophagus',     color:'#FF8C42', time:'~10 sec',
      desc:'A 25cm muscular tube. Waves of muscle contraction (peristalsis) push food down — you can actually swallow upside down!',
      tip:'Peristalsis works against gravity. Astronauts digest food the same way in space.' },
    { organ:'🟠 Stomach',        color:'#FFD93D', time:'2–4 hrs',
      desc:'Churns food with HCl (pH 1.5–3.5) and pepsin enzyme. Breaks proteins. Produces 1–2 litres of gastric juice daily.',
      tip:'Your stomach lining replaces itself every 4 days — otherwise the acid would digest the stomach itself!' },
    { organ:'🟡 Small Intestine',color:'#6BCB77', time:'2–6 hrs',
      desc:'6–7 metres long! Coiled in your belly. Villi (tiny fingers) absorb 90% of nutrients. Liver, pancreas, and gallbladder add juices here.',
      tip:'If you unfolded all the villi in your small intestine, the surface area equals a tennis court.' },
    { organ:'🟢 Large Intestine',color:'#4D96FF', time:'10–59 hrs',
      desc:'1.5 metres. Absorbs water from remaining food. Houses 100 trillion bacteria (gut microbiome) that produce vitamins. Forms and stores faeces.',
      tip:'Your gut microbiome has more bacteria than cells in your entire body. Each person\'s microbiome is unique — like a fingerprint.' },
  ];

  function drawSystem(ctx, W, H, currentStep, time) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    var cx = W*0.5;
    /* Body outline */
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(cx,H*0.5,W*0.38,H*0.48,0,0,Math.PI*2); ctx.stroke();

    var organs = [
      { x:cx,      y:H*0.08, rx:22, ry:14, color:'#FF6B6B', label:'Mouth' },
      { x:cx,      y:H*0.22, rx:8,  ry:20, color:'#FF8C42', label:'Oesophagus' },
      { x:cx,      y:H*0.38, rx:30, ry:22, color:'#FFD93D', label:'Stomach' },
      { x:cx-10,   y:H*0.58, rx:22, ry:18, color:'#6BCB77', label:'Small Int.' },
      { x:cx+5,    y:H*0.77, rx:26, ry:12, color:'#4D96FF', label:'Large Int.' },
    ];

    organs.forEach(function(o, i) {
      var isActive = i === currentStep;
      var isPast   = i < currentStep;
      /* Pulse for active */
      var scale = isActive ? 1 + Math.sin(time*4)*0.05 : 1;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.scale(scale, scale);
      ctx.beginPath(); ctx.ellipse(0,0,o.rx,o.ry,0,0,Math.PI*2);
      ctx.fillStyle = isActive ? o.color : isPast ? o.color+'88' : 'rgba(255,255,255,0.06)';
      if (isActive) { ctx.shadowColor=o.color; ctx.shadowBlur=15; }
      ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle = isActive ? o.color : isPast ? o.color+'66' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();
      ctx.restore();
      /* Label */
      ctx.fillStyle = isActive ? 'white' : isPast ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.15)';
      ctx.font = (isActive?'bold ':'')+'9px Nunito,sans-serif';
      ctx.textAlign='center';
      ctx.fillText(o.label, o.x+28, o.y+3);
    });

    /* Food particle moving */
    if (currentStep < organs.length) {
      var o = organs[currentStep];
      var angle = time * 2;
      var fx = o.x + Math.cos(angle) * (o.rx*0.4);
      var fy = o.y + Math.sin(angle) * (o.ry*0.4);
      ctx.beginPath(); ctx.arc(fx,fy,4,0,Math.PI*2);
      ctx.fillStyle='white'; ctx.shadowColor='white'; ctx.shadowBlur=8;
      ctx.fill(); ctx.shadowBlur=0;
    }
  }

  function animate() {
    var _g = getCtx('digestCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    t += 0.03;
    drawSystem(ctx, W, H, step, t);
    raf = requestAnimationFrame(animate);
  }

  function render() {
    var s = steps[step];
    c.innerHTML =
      '<div style="display:flex;gap:10px;align-items:flex-start">' +
      '<canvas id="digestCanvas" width="160" height="220" style="border-radius:12px;flex-shrink:0"></canvas>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:15px;font-weight:900;color:'+s.color+';margin-bottom:4px">'+s.organ+'</div>' +
      '<div style="font-size:10px;color:var(--muted);margin-bottom:6px">⏱ Time spent: <b style="color:var(--text)">'+s.time+'</b></div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:8px">'+s.desc+'</div>' +
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:8px;padding:8px;font-size:11px;color:var(--muted);line-height:1.6">💡 '+s.tip+'</div>' +
      '</div></div>' +
      '<div class="ctrl-row" style="margin-top:10px">' +
      (step>0?'<button class="cbtn" onclick="digestStep(-1)">← Back</button>':'<div></div>') +
      '<span style="font-size:11px;color:var(--muted)">'+step+'/'+(steps.length-1)+'</span>' +
      (step<steps.length-1?'<button class="cbtn" onclick="digestStep(1)" style="background:var(--evs);color:white;border-color:var(--evs)">Next →</button>':
       '<button class="cbtn" onclick="digestStep(-'+step+')" style="background:var(--acc);color:white;border-color:var(--acc)">🔄 Restart</button>') +
      '</div>';
    cancelAnimationFrame(raf);
    animate();
  }

  window.digestStep = function(d) { step=Math.max(0,Math.min(steps.length-1,step+d)); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── 4. PRIME NUMBER SIEVE (prime-sieve) ── */
SIM_REGISTRY['prime-sieve'] = function(c) {
  var nums = Array.from({length:100},(_,i)=>i+1);
  var eliminated = new Set([1]);
  var primes = [];
  var currentPrime = null;
  var done = false;
  var speed = 300;
  var interval;

  function render() {
    var grid = nums.map(function(n) {
      var isPrime = primes.includes(n);
      var isElim  = eliminated.has(n);
      var isCurr  = n === currentPrime;
      var bg = isCurr?'var(--math)':isPrime?'var(--evs)':isElim?'rgba(255,255,255,.05)':'var(--surface2)';
      var col = isCurr?'#000':isPrime?'white':isElim?'rgba(255,255,255,.2)':'var(--text)';
      var dec = isElim&&!isPrime?'line-through':'none';
      return '<div onclick="sieveClick('+n+')" style="width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;' +
        'font-size:10px;font-weight:'+(isPrime||isCurr?'900':'600')+';cursor:pointer;transition:all .2s;' +
        'background:'+bg+';color:'+col+';text-decoration:'+dec+';' +
        (isCurr?'box-shadow:0 0 12px var(--math);':'') + '">' + n + '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Sieve of Eratosthenes</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:10px">' + grid + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;font-size:11px;flex-wrap:wrap;justify-content:center">' +
      '<span style="color:var(--evs)">🟢 Prime</span>' +
      '<span style="color:var(--math)">🟡 Current</span>' +
      '<span style="color:rgba(255,255,255,.3)">⬜ Eliminated</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text);text-align:center;min-height:20px;margin-bottom:8px">' +
      (done?'✅ Found all primes up to 100: <b style="color:var(--evs)">' + primes.join(', ') + '</b>':
       currentPrime?'Eliminating multiples of <b style="color:var(--math)">' + currentPrime + '</b>...':'Press Auto Run to start') +
      '</div>' +
      '<div class="ctrl-row">' +
      '<button class="cbtn" onclick="sieveReset()" style="font-size:11px">↺ Reset</button>' +
      '<button class="cbtn" onclick="sieveStep()" style="font-size:11px;background:var(--evs);color:white;border-color:var(--evs)">Step</button>' +
      '<button class="cbtn" onclick="sieveAuto()" id="sieveAutoBtn" style="font-size:11px">▶ Auto</button>' +
      '</div>';
  }

  function nextStep() {
    /* Find next un-eliminated number > 1 that is not yet a prime */
    var next = null;
    for (var i=2;i<=100;i++) {
      if (!eliminated.has(i) && !primes.includes(i)) { next=i; break; }
    }
    if (!next || next*next>100) {
      /* All remaining non-eliminated are primes */
      nums.forEach(function(n){ if(!eliminated.has(n)&&!primes.includes(n)) primes.push(n); });
      currentPrime=null; done=true;
      clearInterval(interval); render(); return;
    }
    primes.push(next);
    currentPrime=next;
    /* Eliminate multiples */
    for (var m=next*2;m<=100;m+=next) eliminated.add(m);
    render();
  }

  window.sieveStep  = function() { if(!done) nextStep(); };
  window.sieveAuto  = function() {
    if (interval) { clearInterval(interval); interval=null; document.getElementById('sieveAutoBtn').textContent='▶ Auto'; return; }
    document.getElementById('sieveAutoBtn').textContent='⏸ Pause';
    interval = setInterval(function(){ if(done){clearInterval(interval);} else nextStep(); }, speed);
  };
  window.sieveReset = function() {
    clearInterval(interval); interval=null;
    eliminated=new Set([1]); primes=[]; currentPrime=null; done=false; render();
  };
  window.sieveClick = function(n) { /* highlight info */ };
  window.simCleanup = function() { clearInterval(interval); };
  render();
};

/* ── 5. CONVECTION CURRENTS (convection-sim) ── */
SIM_REGISTRY['convection-sim'] = function(c) {
  var raf, t = 0;
  var particles = [];
  var running = true;

  /* Init particles spread through tank */
  for (var i=0;i<60;i++) {
    particles.push({
      x: Math.random()*260+20,
      y: Math.random()*140+20,
      vx: 0, vy: 0,
      hot: Math.random() < 0.3,
      size: Math.random()*2+2,
    });
  }

  function draw() {
    var _g = getCtx('convCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    /* Tank */
    var tankX=15,tankY=15,tankW=W-30,tankH=H-50;
    ctx.fillStyle='rgba(77,150,255,.08)';
    ctx.fillRect(tankX,tankY,tankW,tankH);
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2;
    ctx.strokeRect(tankX,tankY,tankW,tankH);

    /* Hot source (bottom left) */
    var hotGrad=ctx.createRadialGradient(tankX+40,tankY+tankH,0,tankX+40,tankY+tankH,60);
    hotGrad.addColorStop(0,'rgba(255,80,0,.5)'); hotGrad.addColorStop(1,'transparent');
    ctx.fillStyle=hotGrad; ctx.fillRect(tankX,tankY,tankW,tankH);
    ctx.fillStyle='#FF4500'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🔥 Hot',tankX+40,tankY+tankH+18);

    /* Cold source (top right) */
    var coldGrad=ctx.createRadialGradient(tankX+tankW-40,tankY,0,tankX+tankW-40,tankY,60);
    coldGrad.addColorStop(0,'rgba(77,150,255,.5)'); coldGrad.addColorStop(1,'transparent');
    ctx.fillStyle=coldGrad; ctx.fillRect(tankX,tankY,tankW,tankH);
    ctx.fillStyle='#4D96FF';
    ctx.fillText('❄️ Cold',tankX+tankW-40,tankY-5);

    /* Update and draw particles */
    particles.forEach(function(p) {
      /* Convection forces */
      var distFromHot=Math.sqrt(Math.pow(p.x-(tankX+40),2)+Math.pow(p.y-(tankY+tankH),2));
      var distFromCold=Math.sqrt(Math.pow(p.x-(tankX+tankW-40),2)+Math.pow(p.y-tankY,2));

      if (distFromHot<80) { p.vy-=0.08; p.hot=true; }   /* rise near hot */
      if (distFromCold<80) { p.vy+=0.06; p.hot=false; } /* sink near cold */

      /* Circular flow */
      var cx2=tankX+tankW/2, cy2=tankY+tankH/2;
      var dx=p.x-cx2, dy=p.y-cy2;
      p.vx += -dy*0.002;
      p.vy += dx*0.002;

      /* Damping */
      p.vx*=0.96; p.vy*=0.96;
      p.x+=p.vx; p.y+=p.vy;

      /* Bounce off walls */
      if(p.x<tankX+4){p.x=tankX+4;p.vx=Math.abs(p.vx);}
      if(p.x>tankX+tankW-4){p.x=tankX+tankW-4;p.vx=-Math.abs(p.vx);}
      if(p.y<tankY+4){p.y=tankY+4;p.vy=Math.abs(p.vy);}
      if(p.y>tankY+tankH-4){p.y=tankY+tankH-4;p.vy=-Math.abs(p.vy);}

      /* Draw particle */
      var alpha = 0.6+Math.sin(t+p.x)*0.2;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle = p.hot?'rgba(255,'+(100+Math.floor(p.vy*20))+',50,'+alpha+')':'rgba(77,130,'+(200+Math.floor(-p.vy*20))+','+alpha+')';
      ctx.fill();
    });

    /* Flow arrows */
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1.5;
    var arrows=[[tankX+60,tankY+tankH-20,-90],[tankX+30,tankY+40,0],[tankX+tankW-60,tankY+20,90],[tankX+tankW-30,tankY+tankH-40,180]];
    arrows.forEach(function(a) {
      ctx.save(); ctx.translate(a[0],a[1]); ctx.rotate(a[2]*Math.PI/180);
      ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-8); ctx.moveTo(-4,-4); ctx.lineTo(0,-8); ctx.lineTo(4,-4);
      ctx.stroke(); ctx.restore();
    });

    t+=0.03;
    if(running) raf=requestAnimationFrame(draw);
  }

  c.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Convection Currents</div>' +
    '<canvas id="convCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
    '<div style="font-size:12px;color:var(--text);line-height:1.7;margin:8px 0;background:var(--surface2);border-radius:10px;padding:10px 14px;border:1px solid var(--border)">' +
    '🔴 Hot fluid <b>rises</b> (less dense) · 🔵 Cold fluid <b>sinks</b> (denser) · This loop drives <b>ocean currents</b>, <b>winds</b>, and even <b>tectonic plates!</b>' +
    '</div>' +
    '<div class="ctrl-row">' +
    '<button class="cbtn" onclick="convToggle()" id="convBtn">⏸ Pause</button>' +
    '</div>';

  window.convToggle = function() {
    running=!running;
    document.getElementById('convBtn').textContent=running?'⏸ Pause':'▶ Resume';
    if(running) draw();
  };
  window.simCleanup = function() { running=false; cancelAnimationFrame(raf); };
  draw();
};

/* ── 6. NATURAL SELECTION (natural-selection) ── */
SIM_REGISTRY['natural-selection'] = function(c) {
  var gen = 1;
  var moths = [];
  var survivors = [];
  var phase = 'hunt'; /* hunt | results | breed */
  var hunted = [];
  var bgType = 'newspaper';

  function initMoths(brownCount, whiteCount) {
    moths = [];
    for (var i=0;i<brownCount;i++) moths.push({color:'brown',x:30+Math.random()*230,y:40+Math.random()*130,hunted:false,id:moths.length});
    for (var i=0;i<whiteCount;i++) moths.push({color:'white',x:30+Math.random()*230,y:40+Math.random()*130,hunted:false,id:moths.length});
  }

  function render() {
    var brown=moths.filter(function(m){return m.color==='brown'&&!m.hunted;}).length;
    var white=moths.filter(function(m){return m.color==='white'&&!m.hunted;}).length;
    var totalAlive=brown+white;

    var bgStyle = bgType==='newspaper'
      ? 'background:repeating-linear-gradient(0deg,#c8b88a,#c8b88a 2px,#d4c49a 2px,#d4c49a 12px),repeating-linear-gradient(90deg,#c8b88a,#c8b88a 1px,transparent 1px,transparent 8px);'
      : 'background:#f0ede8;';

    var mothEls = moths.map(function(m) {
      if (m.hunted) return '';
      var col = m.color==='brown'?'#7B4F2E':'#F0F0F0';
      var border = m.color==='brown'?'#5a3820':'#ccc';
      return '<div onclick="huntMoth('+m.id+')" style="position:absolute;left:'+m.x+'px;top:'+m.y+'px;' +
        'width:18px;height:10px;border-radius:50%;background:'+col+';border:1.5px solid '+border+';' +
        'cursor:crosshair;transform:rotate('+((m.x*37)%30-15)+'deg);' +
        'box-shadow:0 1px 3px rgba(0,0,0,.3);transition:opacity .2s"></div>';
    }).join('');

    c.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<div style="font-size:13px;font-weight:900;color:var(--text)">Generation ' + gen + '</div>' +
      '<div style="display:flex;gap:8px">' +
      '<span style="font-size:11px;background:rgba(123,79,46,.3);color:#C8956A;padding:2px 8px;border-radius:8px">🟤 Brown: '+brown+'</span>' +
      '<span style="font-size:11px;background:rgba(240,240,240,.15);color:#ddd;padding:2px 8px;border-radius:8px">⬜ White: '+white+'</span>' +
      '</div></div>' +
      /* Habitat */
      '<div style="position:relative;width:100%;height:180px;border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,.1);cursor:crosshair;'+bgStyle+'">' +
      mothEls +
      (phase==='hunt'?'<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;white-space:nowrap">🦅 Click to eat moths! Eat '+(Math.ceil(totalAlive*0.4))+' more</div>':'') +
      '</div>' +
      /* Controls */
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="selectBg()" style="font-size:11px">🌿 Change Habitat</button>' +
      (phase==='hunt'?'':'<button class="cbtn" onclick="selectBreed()" style="font-size:11px;background:var(--evs);color:white;border-color:var(--evs)">Next Generation →</button>') +
      '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.6;text-align:center">' +
      (phase==='hunt'?'You are the predator. Which moths are easier to spot on this background?':
       '✅ Survivors breed! The better-camouflaged colour dominates over generations.') +
      '</div>';
  }

  window.huntMoth = function(id) {
    if (phase!=='hunt') return;
    var m=moths.find(function(m){return m.id===id;});
    if(m&&!m.hunted) {
      m.hunted=true;
      hunted.push(m);
      var brown=moths.filter(function(m){return m.color==='brown'&&!m.hunted;}).length;
      var white=moths.filter(function(m){return m.color==='white'&&!m.hunted;}).length;
      var total=moths.filter(function(m){return !m.hunted;}).length;
      if(total<=12) { phase='results'; }
      render();
    }
  };

  window.selectBreed = function() {
    gen++;
    var survivors=moths.filter(function(m){return !m.hunted;});
    var bc=survivors.filter(function(m){return m.color==='brown';}).length;
    var wc=survivors.filter(function(m){return m.color==='white';}).length;
    initMoths(bc*2,wc*2);
    phase='hunt'; hunted=[];
    render();
  };

  window.selectBg = function() {
    bgType=bgType==='newspaper'?'snow':'newspaper';
    render();
  };

  initMoths(10,10);
  render();
};

/* ── 7. FRACTION VISUALISER (fraction-fold) ── */
SIM_REGISTRY['fraction-fold'] = function(c) {
  var num=1, den=4, compareNum=1, compareDen=2, showCompare=false;

  function fractionColor(n,d) {
    var val=n/d;
    if(val<=0.25) return 'var(--sci)';
    if(val<=0.5)  return 'var(--math)';
    if(val<=0.75) return 'var(--evs)';
    return 'var(--acc)';
  }

  function buildBar(n,d,color,label,w) {
    var cells=Array.from({length:d},function(_,i){
      return '<div style="flex:1;height:100%;background:'+(i<n?color:'transparent')+';' +
        'border-right:'+(i<d-1?'1px solid rgba(255,255,255,.2)':'none')+';' +
        'transition:background .3s"></div>';
    }).join('');
    return '<div style="margin-bottom:8px">' +
      '<div style="font-size:12px;font-weight:800;color:'+color+';margin-bottom:4px">'+label+' = '+(n/d).toFixed(3)+' '+(n/d===0.5?'(½)':n/d===0.25?'(¼)':n/d===0.75?'(¾)':'')+' </div>' +
      '<div style="display:flex;height:40px;border-radius:8px;overflow:hidden;border:2px solid '+color+';width:'+w+'%;max-width:300px">'+cells+'</div>' +
      '</div>';
  }

  function render() {
    var color1=fractionColor(num,den);
    var color2=fractionColor(compareNum,compareDen);
    var val1=num/den, val2=compareNum/compareDen;
    var relation = val1>val2?'>':val1<val2?'<':'=';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;text-align:center">Fraction Visualiser</div>' +
      /* Fraction 1 controls */
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' +
      '<div style="font-size:28px;font-weight:900;color:'+color1+';text-align:center;margin-bottom:8px">' +
        '<span style="border-bottom:3px solid '+color1+';padding:0 8px">'+num+'</span>' +
        '<span style="display:block;font-size:12px;color:var(--muted);margin:2px 0">───</span>' +
        '<span>'+den+'</span>' +
      '</div>' +
      buildBar(num,den,color1,'Fraction 1: '+num+'/'+den,100) +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:6px">' +
      '<span style="font-size:11px;color:var(--muted)">Numerator:</span>' +
      '<input type="range" class="slide" min="0" max="'+den+'" value="'+num+'" oninput="setFrac(this.value,'+den+')" style="width:100px">' +
      '<span style="font-size:11px;color:var(--muted)">Denominator:</span>' +
      '<input type="range" class="slide" min="1" max="12" value="'+den+'" oninput="setFrac('+num+',this.value)" style="width:100px">' +
      '</div></div>' +
      /* Compare toggle */
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      '<button class="cbtn" onclick="toggleCompare()" style="font-size:11px;'+(showCompare?'background:var(--acc);color:white;border-color:var(--acc)':'')+'">⚖️ Compare Fractions</button>' +
      '</div>' +
      /* Compare fraction */
      (showCompare?
        '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' +
        '<div style="font-size:28px;font-weight:900;color:'+color2+';text-align:center;margin-bottom:8px">' +
          '<span style="border-bottom:3px solid '+color2+';padding:0 8px">'+compareNum+'</span>' +
          '<span style="display:block;font-size:12px;color:var(--muted);margin:2px 0">───</span>' +
          '<span>'+compareDen+'</span>' +
        '</div>' +
        buildBar(compareNum,compareDen,color2,'Fraction 2: '+compareNum+'/'+compareDen,100) +
        '<div class="ctrl-row" style="flex-wrap:wrap;gap:6px">' +
        '<span style="font-size:11px;color:var(--muted)">Numerator:</span>' +
        '<input type="range" class="slide" min="0" max="'+compareDen+'" value="'+compareNum+'" oninput="setCompare(this.value,'+compareDen+')" style="width:100px">' +
        '<span style="font-size:11px;color:var(--muted)">Denominator:</span>' +
        '<input type="range" class="slide" min="1" max="12" value="'+compareDen+'" oninput="setCompare('+compareNum+',this.value)" style="width:100px">' +
        '</div>' +
        '<div style="text-align:center;font-size:20px;font-weight:900;margin-top:8px">' +
        '<span style="color:'+color1+'">'+num+'/'+den+'</span> ' +
        '<span style="color:var(--text)">'+relation+'</span> ' +
        '<span style="color:'+color2+'">'+compareNum+'/'+compareDen+'</span>' +
        (relation==='='?'<div style="font-size:11px;color:var(--evs);margin-top:4px">✅ These are equivalent fractions!</div>':'') +
        '</div>' +
        '</div>' : '') +
      /* Fun fact */
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:11px;color:var(--muted);line-height:1.7">' +
      '💡 ' + (num===0?'Zero out of anything is nothing!':num===den?'When numerator = denominator, fraction = 1 (the whole thing)!':val1<0.5?num+'/'+den+' is less than half':'More than half is filled!') +
      '</div>';
  }

  window.setFrac = function(n,d) {
    den=parseInt(d)||1; num=Math.min(parseInt(n)||0,den); render();
  };
  window.setCompare = function(n,d) {
    compareDen=parseInt(d)||1; compareNum=Math.min(parseInt(n)||0,compareDen); render();
  };
  window.toggleCompare = function() { showCompare=!showCompare; render(); };
  render();
};

/* ── 8. ELECTROMAGNETIC INDUCTION (em-induction) ── */
SIM_REGISTRY['em-induction'] = function(c) {
  var raf, t=0;
  var magnetX=50, magnetVel=0, magnetDir=1, auto=false;
  var currentHistory=[];

  function draw() {
    var _g=getCtx('emCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    /* Background */
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Coil (solenoid) — right side */
    var coilX=W*0.55, coilY=H*0.3, coilW=W*0.3, coilH=H*0.4;
    ctx.strokeStyle='rgba(200,150,50,.6)'; ctx.lineWidth=3;
    for(var i=0;i<8;i++){
      var cy=coilY+i*(coilH/7);
      ctx.beginPath();
      ctx.ellipse(coilX+coilW/2,cy,coilW/2,coilH/20,0,0,Math.PI*2);
      ctx.stroke();
    }
    /* Coil outline box */
    ctx.strokeStyle='rgba(200,150,50,.2)'; ctx.lineWidth=1;
    ctx.strokeRect(coilX,coilY,coilW,coilH);

    /* Current indicator — LED */
    var proximity=Math.max(0,1-Math.abs(magnetX-(coilX-20))/120);
    var current=proximity*magnetVel*0.3;
    var ledBright=Math.abs(current);
    ctx.beginPath(); ctx.arc(coilX+coilW/2,coilY+coilH+25,14,0,Math.PI*2);
    ctx.fillStyle='rgba(107,203,119,'+Math.min(1,ledBright)+')';
    ctx.shadowColor='#6BCB77'; ctx.shadowBlur=ledBright*30;
    ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('LED',coilX+coilW/2,coilY+coilH+29);

    /* Current arrow on wire */
    if(Math.abs(current)>0.1){
      ctx.strokeStyle=current>0?'rgba(107,203,119,.8)':'rgba(255,107,107,.8)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(coilX+coilW/2-15,coilY+coilH+10);
      ctx.lineTo(coilX+coilW/2+15,coilY+coilH+10);
      ctx.stroke();
      /* Arrow head */
      var dir=current>0?1:-1;
      ctx.beginPath();
      ctx.moveTo(coilX+coilW/2+dir*15,coilY+coilH+10);
      ctx.lineTo(coilX+coilW/2+dir*10,coilY+coilH+6);
      ctx.lineTo(coilX+coilW/2+dir*10,coilY+coilH+14);
      ctx.fillStyle=current>0?'rgba(107,203,119,.8)':'rgba(255,107,107,.8)';
      ctx.fill();
    }

    /* Galvanometer needle */
    var gaugeX=coilX+coilW/2, gaugeY=H*0.1;
    ctx.fillStyle='rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.arc(gaugeX,gaugeY,22,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(gaugeX,gaugeY,22,Math.PI,0); ctx.stroke();
    /* Needle */
    var needleAngle=Math.PI/2-current*1.5;
    ctx.strokeStyle='#FF6B6B'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(gaugeX,gaugeY);
    ctx.lineTo(gaugeX+Math.cos(needleAngle)*18,gaugeY-Math.sin(needleAngle)*18);
    ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='8px Nunito,sans-serif';
    ctx.fillText('G',gaugeX,gaugeY+32);

    /* Magnet */
    var magH=H*0.35, magW=40;
    var magY=H*0.35;
    /* N pole */
    ctx.fillStyle='#FF6B6B';
    ctx.beginPath(); ctx.roundRect(magnetX,magY,magW,magH*0.5,4); ctx.fill();
    ctx.fillStyle='white'; ctx.font='bold 12px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('N',magnetX+magW/2,magY+magH*0.28);
    /* S pole */
    ctx.fillStyle='#4D96FF';
    ctx.beginPath(); ctx.roundRect(magnetX,magY+magH*0.5,magW,magH*0.5,4); ctx.fill();
    ctx.fillStyle='white';
    ctx.fillText('S',magnetX+magW/2,magY+magH*0.78);

    /* Magnetic field lines */
    ctx.strokeStyle='rgba(255,107,107,.15)'; ctx.lineWidth=1; ctx.setLineDash([3,5]);
    for(var f=-2;f<=2;f++){
      ctx.beginPath();
      ctx.moveTo(magnetX+magW,magY+magH*0.25+f*12);
      ctx.bezierCurveTo(magnetX+magW+30+f*5,magY,coilX-20,magY-20,coilX,coilY+coilH*0.3);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Current history graph */
    currentHistory.push(current);
    if(currentHistory.length>80) currentHistory.shift();
    var graphX=10,graphY=H*0.75,graphW=W-20,graphH=H*0.22;
    ctx.fillStyle='rgba(255,255,255,.03)'; ctx.fillRect(graphX,graphY,graphW,graphH);
    ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(graphX,graphY+graphH/2); ctx.lineTo(graphX+graphW,graphY+graphH/2); ctx.stroke();
    ctx.strokeStyle='rgba(107,203,119,.7)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    currentHistory.forEach(function(v,i){
      var x=graphX+i*(graphW/80),y=graphY+graphH/2-v*graphH*0.4;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('Current →',graphX+2,graphY+10);

    /* Auto movement */
    if(auto){
      magnetVel=magnetDir*2.5;
      magnetX+=magnetVel;
      if(magnetX>coilX-10){magnetDir=-1;}
      if(magnetX<10){magnetDir=1;}
    } else {
      magnetVel*=0.85;
    }

    t+=0.05;
    raf=requestAnimationFrame(draw);
  }

  c.innerHTML=
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Electromagnetic Induction</div>'+
    '<canvas id="emCanvas" data-w="300" data-h="260" style="border-radius:12px;display:block;width:100%;cursor:ew-resize"></canvas>'+
    '<div class="ctrl-row" style="margin-top:8px">'+
    '<button class="cbtn" onclick="emLeft()" style="font-size:12px">← Move In</button>'+
    '<button class="cbtn" onclick="emAuto()" id="emAutoBtn" style="font-size:12px">🔄 Auto</button>'+
    '<button class="cbtn" onclick="emRight()" style="font-size:12px">Move Out →</button>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
    'Moving magnet → changing field → <b style="color:var(--evs)">electric current!</b> This is how every power plant works.'+
    '</div>';

  window.emLeft  = function(){ magnetVel=-4; magnetX=Math.max(10,magnetX-8); };
  window.emRight = function(){ magnetVel=4;  magnetX=Math.min(200,magnetX+8); };
  window.emAuto  = function(){
    auto=!auto;
    document.getElementById('emAutoBtn').textContent=auto?'⏸ Stop':'🔄 Auto';
  };
  window.simCleanup=function(){cancelAnimationFrame(raf);};
  draw();
};

/* ── 9. PROJECTILE MOTION (projectile-sim) ── */
SIM_REGISTRY['projectile-sim'] = function(c) {
  var angle=45, speed=15, raf, launched=false;
  var ball={x:30,y:0,vx:0,vy:0};
  var trail=[];
  var gravity=0.4;
  var groundY=170;

  function launch() {
    var rad=angle*Math.PI/180;
    ball={x:30,y:groundY,vx:speed*Math.cos(rad)*0.5,vy:-speed*Math.sin(rad)*0.5};
    trail=[]; launched=true;
  }

  function draw() {
    var _g=getCtx('projCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    /* Sky */
    var sky=ctx.createLinearGradient(0,0,0,groundY);
    sky.addColorStop(0,'#0a1a3a'); sky.addColorStop(1,'#1a3a6a');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,groundY);

    /* Ground */
    ctx.fillStyle='#2d5a27'; ctx.fillRect(0,groundY,W,H-groundY);
    ctx.fillStyle='#3a6b2e'; ctx.fillRect(0,groundY,W,6);

    /* Launch angle guide */
    if(!launched){
      var rad=angle*Math.PI/180;
      ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(30,groundY); ctx.lineTo(30+80*Math.cos(rad),groundY-80*Math.sin(rad)); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* Trail */
    trail.forEach(function(p,i){
      ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2);
      ctx.fillStyle='rgba(255,217,61,'+(i/trail.length*0.6)+')'; ctx.fill();
    });

    /* Ball */
    if(launched||true){
      ctx.beginPath(); ctx.arc(launched?ball.x:30,launched?ball.y:groundY,8,0,Math.PI*2);
      ctx.fillStyle='#FF6B6B'; ctx.shadowColor='#FF6B6B'; ctx.shadowBlur=10;
      ctx.fill(); ctx.shadowBlur=0;
    }

    /* Cannon */
    ctx.save();
    ctx.translate(30,groundY);
    ctx.rotate(-angle*Math.PI/180);
    ctx.fillStyle='#666';
    ctx.fillRect(0,-6,35,12);
    ctx.restore();
    ctx.fillStyle='#888';
    ctx.beginPath(); ctx.arc(30,groundY,12,0,Math.PI*2); ctx.fill();

    /* Stats */
    if(launched&&ball.x<W){
      var distanceM=Math.round((ball.x-30)*2);
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='left';
      ctx.fillText('Distance: '+distanceM+'m',4,14);
      ctx.fillText('Height: '+Math.max(0,Math.round((groundY-ball.y)*0.5))+'m',4,26);
    }

    /* Update physics */
    if(launched){
      ball.vy+=gravity;
      ball.x+=ball.vx;
      ball.y+=ball.vy;
      trail.push({x:ball.x,y:ball.y});
      if(trail.length>60) trail.shift();
      if(ball.y>=groundY){ ball.y=groundY; launched=false; }
    }

    raf=requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Projectile Motion</div>'+
      '<canvas id="projCanvas" data-w="300" data-h="190" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Angle: <b style="color:var(--math)">'+angle+'°</b></span>'+
      '<input type="range" class="slide" min="10" max="80" value="'+angle+'" oninput="projAngle(this.value)" style="width:100px">'+
      '<span style="font-size:11px;color:var(--muted)">Speed: <b style="color:var(--sci)">'+speed+'</b></span>'+
      '<input type="range" class="slide" min="5" max="25" value="'+speed+'" oninput="projSpeed(this.value)" style="width:80px">'+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      '<button class="cbtn" onclick="projLaunch()" style="background:var(--sci);color:white;border-color:var(--sci);font-size:13px">🚀 Launch!</button>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      '45° gives <b style="color:var(--text)">maximum range</b>! Horizontal and vertical motion are completely independent.'+
      '</div>';
    cancelAnimationFrame(raf);
    requestAnimationFrame(function(){ requestAnimationFrame(draw); });
  }

  window.projAngle  = function(v){ angle=parseInt(v); launched=false; trail=[]; };
  window.projSpeed  = function(v){ speed=parseInt(v); };
  window.projLaunch = function(){ launch(); };
  window.simCleanup = function(){ cancelAnimationFrame(raf); };
  render();
};

/* ── 10. OHMS LAW CIRCUIT BUILDER (ohms-law enhanced) ── */
/* Already exists — skip, add TITRATION instead */
SIM_REGISTRY['titration'] = function(c) {
  var vol=0, concentration=0, endpoint=false;
  var drops=[];
  var raf, t=0;

  var M_NaOH=0.1, V_HCl=10;
  var equivalenceVol = V_HCl; /* mL of NaOH needed for M1V1=M2V2 */

  function phFromVol(v) {
    if(v<equivalenceVol-0.5)  return 2+v/equivalenceVol*5;   /* acid region */
    if(v<equivalenceVol+0.5)  return 7+((v-equivalenceVol)*10); /* sharp jump */
    return Math.min(12,7+(v-equivalenceVol)*2+5);              /* base region */
  }

  function indicatorColor(ph) {
    if(ph<7)  return 'rgba(255,255,255,0.9)'; /* colourless in acid */
    if(ph<8)  return 'rgba(255,200,220,0.9)'; /* faint pink */
    return 'rgba(255,100,180,0.95)';           /* pink = endpoint! */
  }

  function draw() {
    var _g=getCtx('titCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    var ph=phFromVol(vol);
    var flaskColor=indicatorColor(ph);

    /* Burette */
    var bx=W*0.35,by=10,bw=24,bh=H*0.55;
    ctx.fillStyle='rgba(100,180,255,0.15)';
    ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='rgba(100,180,255,0.4)'; ctx.lineWidth=2;
    ctx.strokeRect(bx,by,bw,bh);
    /* NaOH level */
    var fillH=bh*(1-vol/20);
    ctx.fillStyle='rgba(100,150,255,0.5)';
    ctx.fillRect(bx+2,by+2,bw-4,fillH-2);
    /* Burette scale */
    for(var i=0;i<=20;i+=5){
      ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1;
      var scaleY=by+bh*(i/20);
      ctx.beginPath(); ctx.moveTo(bx-5,scaleY); ctx.lineTo(bx,scaleY); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='right';
      ctx.fillText(i,bx-7,scaleY+3);
    }
    /* Tap */
    ctx.fillStyle='#888';
    ctx.fillRect(bx+8,by+bh-2,8,15);
    /* Drip animation */
    if(vol<20){
      drops.forEach(function(d,i){
        d.y+=4; d.life-=0.05;
        ctx.beginPath(); ctx.ellipse(d.x,d.y,2.5,4,0,0,Math.PI*2);
        ctx.fillStyle='rgba(100,150,255,'+d.life+')'; ctx.fill();
      });
      drops=drops.filter(function(d){return d.life>0&&d.y<H;});
    }

    /* Flask */
    var fx=W*0.38,fy=H*0.62,fw=90,fh=80;
    /* Flask body */
    ctx.beginPath();
    ctx.moveTo(fx+fw*0.3,fy);
    ctx.lineTo(fx,fy+fh);
    ctx.quadraticCurveTo(fx+fw/2,fy+fh+15,fx+fw,fy+fh);
    ctx.lineTo(fx+fw*0.7,fy);
    ctx.closePath();
    ctx.fillStyle=flaskColor;
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1.5; ctx.stroke();
    /* Flask neck */
    ctx.fillStyle='rgba(255,255,255,.1)';
    ctx.fillRect(fx+fw*0.3,fy-20,fw*0.4,22);
    ctx.strokeStyle='rgba(255,255,255,.2)';
    ctx.strokeRect(fx+fw*0.3,fy-20,fw*0.4,22);

    /* pH graph */
    var gx=W*0.01,gy=H*0.02,gw=W*0.25,gh=H*0.96;
    ctx.fillStyle='rgba(255,255,255,.03)'; ctx.fillRect(gx,gy,gw,gh);
    ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=1;
    /* Y axis */
    ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy+gh); ctx.stroke();
    /* pH line */
    ctx.strokeStyle='rgba(107,203,119,.8)'; ctx.lineWidth=2;
    ctx.beginPath();
    for(var v=0;v<=Math.min(vol+0.1,20);v+=0.2){
      var px2=gx+v/20*gw, py2=gy+gh-(phFromVol(v)/14*gh);
      v<0.1?ctx.moveTo(px2,py2):ctx.lineTo(px2,py2);
    }
    ctx.stroke();
    /* Equivalence line */
    ctx.strokeStyle='rgba(255,107,107,.4)'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    var eqX=gx+equivalenceVol/20*gw;
    ctx.beginPath(); ctx.moveTo(eqX,gy); ctx.lineTo(eqX,gy+gh); ctx.stroke();
    ctx.setLineDash([]);
    /* Labels */
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('pH',gx+gw/2,gy+gh+10);
    ctx.save(); ctx.translate(gx-8,gy+gh/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('pH',0,0); ctx.restore();

    /* Status */
    ctx.fillStyle='white'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('pH: '+ph.toFixed(1),W*0.7,H*0.78);
    ctx.fillText('NaOH: '+vol.toFixed(1)+'mL',W*0.7,H*0.88);
    if(ph>=8){
      ctx.fillStyle='#FF69B4';
      ctx.fillText('🎉 Endpoint!',W*0.7,H*0.95);
    }

    t+=0.03;
    raf=requestAnimationFrame(draw);
  }

  c.innerHTML=
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Acid-Base Titration</div>'+
    '<canvas id="titCanvas" data-w="280" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
    '<div class="ctrl-row" style="margin-top:8px">'+
    '<button class="cbtn" onclick="titDrop(0.5)" style="font-size:12px">💧 0.5mL Drop</button>'+
    '<button class="cbtn" onclick="titDrop(2)" style="font-size:12px">💦 2mL Burst</button>'+
    '<button class="cbtn" onclick="titReset()" style="font-size:12px">↺ Reset</button>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
    'Add NaOH drop by drop. Watch pH rise. Flask turns <b style="color:#FF69B4">pink</b> at the endpoint (pH~8) — neutralisation!'+
    '</div>';

  window.titDrop=function(v){
    if(vol>=20) return;
    vol=Math.min(20,vol+v);
    drops.push({x:W*0.35+12,y:140,life:1});
  };
  window.titReset=function(){ vol=0; drops=[]; };
  window.simCleanup=function(){ cancelAnimationFrame(raf); };
  draw();
};


/* ══════════════════════════════════════
   BATCH 3 — 10 more flagship simulations
   ══════════════════════════════════════ */

/* ── 1. ATOMIC MODEL BUILDER (atomic-model) ── */
SIM_REGISTRY['atomic-model'] = function(c) {
  var elements = [
    { sym:'H',  name:'Hydrogen',  z:1,  n:0,  shells:[1],         color:'#FF6B6B', fact:'Lightest element. Makes up 75% of the universe.' },
    { sym:'He', name:'Helium',    z:2,  n:2,  shells:[2],         color:'#FFD93D', fact:'Noble gas — full outer shell = very stable. Used in balloons!' },
    { sym:'Li', name:'Lithium',   z:3,  n:4,  shells:[2,1],       color:'#6BCB77', fact:'1 valence electron — very reactive! Used in phone batteries.' },
    { sym:'C',  name:'Carbon',    z:6,  n:6,  shells:[2,4],       color:'#4D96FF', fact:'The basis of all life. Can form millions of compounds.' },
    { sym:'O',  name:'Oxygen',    z:8,  n:8,  shells:[2,6],       color:'#FF6B6B', fact:'6 valence electrons — needs 2 more. Very reactive!' },
    { sym:'Na', name:'Sodium',    z:11, n:12, shells:[2,8,1],     color:'#C77DFF', fact:'1 valence electron in shell 3 — highly reactive metal.' },
    { sym:'Cl', name:'Chlorine',  z:17, n:18, shells:[2,8,7],     color:'#6BCB77', fact:'7 valence electrons — needs just 1 more. Very reactive non-metal.' },
    { sym:'Fe', name:'Iron',      z:26, n:30, shells:[2,8,14,2],  color:'#C8945A', fact:'Transition metal. Core of Earth is mostly iron.' },
    { sym:'Au', name:'Gold',      z:79, n:118,shells:[2,8,18,32,18,1], color:'#FFD93D', fact:'1 valence electron but very unreactive due to relativistic effects.' },
  ];
  var sel = 0;
  var raf, t = 0;

  function draw() {
    var _g = getCtx('atomCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    var CX = W/2, CY = H/2;
    ctx.clearRect(0,0,W,H);

    var el = elements[sel];
    var maxShell = el.shells.length;
    var maxR = Math.min(CX, CY) - 16;
    var shellRadii = el.shells.map(function(_,i){ return 28 + (i+1)*(maxR-28)/maxShell; });

    /* Stars */
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    for(var s=0;s<40;s++){
      var sx=(s*173+37)%W, sy=(s*97+13)%H, sr=0.5+s%3*0.3;
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,'+(0.2+s%5*0.08)+')'; ctx.fill();
    }

    /* Orbit rings */
    el.shells.forEach(function(_, i) {
      ctx.beginPath(); ctx.arc(CX,CY,shellRadii[i],0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.25)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='left';
      ctx.fillText('Shell '+(i+1)+' (max '+(i===0?2:8)+')',CX+shellRadii[i]+3,CY-3);
    });

    /* Electrons */
    el.shells.forEach(function(count, shell) {
      var r = shellRadii[shell];
      for(var e=0;e<count;e++){
        var angle = (e/count)*Math.PI*2 + t*(1/(shell+1)*2);
        var ex = CX + Math.cos(angle)*r;
        var ey = CY + Math.sin(angle)*r;
        ctx.beginPath(); ctx.arc(ex,ey,4,0,Math.PI*2);
        ctx.fillStyle=el.color;
        ctx.shadowColor=el.color; ctx.shadowBlur=8;
        ctx.fill(); ctx.shadowBlur=0;
        /* Electron trail */
        for(var tr=1;tr<=4;tr++){
          var ta=angle-tr*0.15;
          var tx=CX+Math.cos(ta)*r, ty=CY+Math.sin(ta)*r;
          ctx.beginPath(); ctx.arc(tx,ty,3-tr*0.5,0,Math.PI*2);
          ctx.fillStyle=el.color.replace(')',','+(0.3-tr*0.07)+')').replace('rgb','rgba');
          ctx.fill();
        }
      }
    });

    /* Nucleus */
    var nucR = Math.min(20, 8+el.z*0.3);
    var nucGrad=ctx.createRadialGradient(CX-4,CY-4,0,CX,CY,nucR);
    nucGrad.addColorStop(0,'#FFF7AA'); nucGrad.addColorStop(1,el.color);
    ctx.beginPath(); ctx.arc(CX,CY,nucR,0,Math.PI*2);
    ctx.fillStyle=nucGrad;
    ctx.shadowColor=el.color; ctx.shadowBlur=20;
    ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='white'; ctx.font='bold '+(nucR>14?'11':'9')+'px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(el.sym,CX,CY+4);

    /* Proton/neutron count */
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif';
    ctx.fillText(el.z+'p  '+el.n+'n',CX,CY+nucR+12);

    t += 0.025;
    raf = requestAnimationFrame(draw);
  }

  function render() {
    var el = elements[sel];
    c.innerHTML =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">' +
      elements.map(function(e,i){
        return '<button onclick="atomSel('+i+')" style="padding:4px 8px;border-radius:8px;border:1.5px solid '+(i===sel?e.color:'var(--border)')+';background:'+(i===sel?e.color+'22':'var(--surface2)')+';color:'+(i===sel?e.color:'var(--muted)')+';font-size:12px;font-weight:800;cursor:pointer">'+e.sym+'</button>';
      }).join('') +
      '</div>' +
      '<canvas id="atomCanvas" data-w="280" data-h="240" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border)">' +
      '<div style="font-size:14px;font-weight:900;color:'+el.color+'">'+el.name+' ('+el.sym+')  — Z='+el.z+'</div>' +
      '<div style="font-size:11px;color:var(--muted);margin:3px 0">Shells: ['+el.shells.join(', ')+'] · Valence electrons: <b style="color:'+el.color+'">'+el.shells[el.shells.length-1]+'</b></div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:4px">'+el.fact+'</div>' +
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.atomSel = function(i){ sel=i; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function(){ cancelAnimationFrame(raf); };
  render();
};

/* ── 2. AREA WITH SQUARES (area-squares) ── */
SIM_REGISTRY['area-squares'] = function(c) {
  var rows=4, cols=5, cellSize=32, drawing=false, filled=[];
  var shapes = [
    { name:'Rectangle 4×5', fn:function(){ filled=[]; for(var r=0;r<rows;r++) for(var cc=0;cc<cols;cc++) filled.push(r+','+cc); } },
    { name:'L-Shape',       fn:function(){ filled=[]; for(var r=0;r<4;r++) filled.push(r+',0'); for(var cc=0;cc<3;cc++) filled.push('3,'+cc); } },
    { name:'Triangle',      fn:function(){ filled=[]; for(var r=0;r<5;r++) for(var cc=0;cc<=r;cc++) filled.push(r+','+cc); } },
    { name:'Custom',        fn:function(){ filled=[]; } },
  ];
  var activeShape = 0;

  shapes[0].fn();

  function render() {
    var area = filled.length;
    var gridHTML = '';
    for(var r=0;r<6;r++){
      for(var cc=0;cc<7;cc++){
        var key=r+','+cc;
        var isFilled=filled.includes(key);
        gridHTML+='<div onmousedown="areaToggle(\''+key+'\')" onmouseenter="areaDrag(\''+key+'\')" '+
          'style="width:'+cellSize+'px;height:'+cellSize+'px;background:'+(isFilled?'var(--math)':'var(--surface2)')+';'+
          'border:1px solid var(--border);cursor:crosshair;border-radius:3px;transition:background .1s;'+
          'display:flex;align-items:center;justify-content:center;font-size:9px;color:'+(isFilled?'rgba(0,0,0,.5)':'transparent')+'">'+(isFilled?'1':'')+
          '</div>';
      }
    }

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Area Explorer</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">'+
      shapes.map(function(s,i){
        return '<button onclick="areaShape('+i+')" style="padding:4px 8px;border-radius:8px;border:1.5px solid '+(i===activeShape?'var(--math)':'var(--border)')+';background:'+(i===activeShape?'var(--math-dim)':'var(--surface2)')+';color:'+(i===activeShape?'var(--math)':'var(--muted)')+';font-size:11px;cursor:pointer">'+s.name+'</button>';
      }).join('')+
      '</div>'+
      '<div style="display:inline-grid;grid-template-columns:repeat(7,'+cellSize+'px);gap:0;border:2px solid var(--border);border-radius:8px;overflow:hidden;margin:0 auto;display:grid" '+
        'onmousedown="drawing=true" onmouseup="drawing=false" onmouseleave="drawing=false">'+
      gridHTML+'</div>'+
      '<div style="text-align:center;margin-top:10px">'+
      '<span style="font-size:28px;font-weight:900;color:var(--math)">Area = '+area+' sq units</span>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:4px">'+
      (activeShape===3?'Click/drag to draw your own shape!':'Try the Custom shape to draw anything!')+
      '</div>';
  }

  window.areaToggle=function(k){
    if(activeShape!==3) return;
    drawing=true;
    var i=filled.indexOf(k);
    i>=0?filled.splice(i,1):filled.push(k);
    render();
  };
  window.areaDrag=function(k){
    if(!drawing||activeShape!==3) return;
    if(!filled.includes(k)) { filled.push(k); render(); }
  };
  window.areaShape=function(i){ activeShape=i; shapes[i].fn(); render(); };
  render();
};

/* ── 3. COORDINATE GEOMETRY (coord-distance) ── */
SIM_REGISTRY['coord-distance'] = function(c) {
  var pts=[{x:1,y:2,color:'var(--sci)'},{x:5,y:5,color:'var(--math)'}];
  var dragging=-1;
  var gridSize=8, cellPx=30, orig=4;

  function dist(a,b){ return Math.sqrt(Math.pow(b.x-a.x,2)+Math.pow(b.y-a.y,2)); }
  function toCanvas(v,axis){ return orig*cellPx+v*cellPx*(axis==='x'?1:-1); }
  function toGrid(px,axis){ return axis==='x'?(px-orig*cellPx)/cellPx:(orig*cellPx-px)/cellPx; }

  function draw() {
    var _g=getCtx('coordCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='var(--surface2)'.replace ? '#22263A' : '#22263A';
    ctx.fillRect(0,0,W,H);

    /* Grid */
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=1;
    for(var i=0;i<=gridSize*2;i++){
      ctx.beginPath(); ctx.moveTo(i*cellPx,0); ctx.lineTo(i*cellPx,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cellPx); ctx.lineTo(W,i*cellPx); ctx.stroke();
    }

    /* Axes */
    ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,orig*cellPx); ctx.lineTo(W,orig*cellPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(orig*cellPx,0); ctx.lineTo(orig*cellPx,H); ctx.stroke();

    /* Axis labels */
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='center';
    for(var n=-orig+1;n<=orig;n++){
      if(n!==0){
        ctx.fillText(n,orig*cellPx+n*cellPx,orig*cellPx+12);
        ctx.fillText(-n,orig*cellPx+3,orig*cellPx-n*cellPx+4);
      }
    }
    ctx.fillText('X →',W-14,orig*cellPx-6);
    ctx.fillText('Y',orig*cellPx+10,8);

    /* Connecting line with dashes */
    var p0={x:toCanvas(pts[0].x,'x'),y:toCanvas(pts[0].y,'y')};
    var p1={x:toCanvas(pts[1].x,'x'),y:toCanvas(pts[1].y,'y')};

    /* Horizontal and vertical legs (Pythagoras visual) */
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
    ctx.setLineDash([]);

    /* Leg labels */
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='10px Nunito,sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Δx='+Math.abs(pts[1].x-pts[0].x).toFixed(1),(p0.x+p1.x)/2,p0.y-6);
    ctx.textAlign='left';
    ctx.fillText('Δy='+Math.abs(pts[1].y-pts[0].y).toFixed(1),p1.x+4,(p0.y+p1.y)/2);

    /* Distance line */
    ctx.strokeStyle='rgba(199,125,255,.8)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();

    /* Distance label */
    var d=dist(pts[0],pts[1]);
    ctx.fillStyle='var(--acc)' || '#C77DFF';
    ctx.fillStyle='#C77DFF'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('d = '+d.toFixed(2),(p0.x+p1.x)/2-10,(p0.y+p1.y)/2-10);

    /* Points */
    pts.forEach(function(p,i){
      var cx2=toCanvas(p.x,'x'), cy2=toCanvas(p.y,'y');
      var col=i===0?'#FF6B6B':'#FFD93D';
      ctx.beginPath(); ctx.arc(cx2,cy2,8,0,Math.PI*2);
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('P'+(i+1),cx2,cy2+3);
      /* Coordinate label */
      ctx.fillStyle=col; ctx.font='10px Nunito,sans-serif';
      ctx.fillText('('+p.x.toFixed(1)+', '+p.y.toFixed(1)+')',cx2+(i===0?-45:10),cy2+(i===0?-12:18));
    });
  }

  function render(){
    var d=dist(pts[0],pts[1]);
    var dx=pts[1].x-pts[0].x, dy=pts[1].y-pts[0].y;
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Coordinate Geometry — Distance Formula</div>'+
      '<canvas id="coordCanvas" data-w="270" data-h="270" style="border-radius:12px;display:block;width:100%;cursor:crosshair"></canvas>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border);font-size:12px;line-height:2">' +
      '<div>P1 = ('+pts[0].x.toFixed(1)+', '+pts[0].y.toFixed(1)+') &nbsp;&nbsp; P2 = ('+pts[1].x.toFixed(1)+', '+pts[1].y.toFixed(1)+')</div>'+
      '<div style="color:var(--muted)">d = √( ('+dx.toFixed(1)+')<sup>2</sup> + ('+dy.toFixed(1)+')<sup>2</sup> ) = √('+( dx*dx+dy*dy).toFixed(1)+') = <b style="color:#C77DFF">'+d.toFixed(3)+'</b></div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'+
      ['P1 X:','P1 Y:','P2 X:','P2 Y:'].map(function(lbl,i){
        var pi=i<2?0:1, ax=i%2===0?'x':'y';
        return '<label style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px">'+lbl+
          '<input type="number" min="-4" max="4" step="0.5" value="'+pts[pi][ax]+'" '+
          'onchange="coordSet('+pi+',\''+ax+'\',this.value)" '+
          'style="width:48px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px;color:var(--text);font-size:11px"></label>';
      }).join('')+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px">Drag point values or type coordinates above</div>';
    draw();
  }

  window.coordSet=function(pi,ax,v){ pts[pi][ax]=parseFloat(v)||0; render(); };
  render();
};

/* ── 4. ANGLE SUM PROOF (angle-sum) ── */
SIM_REGISTRY['angle-sum'] = function(c) {
  var a=60, b=70, raf, phase=0, animating=false;

  function draw(tearing) {
    var _g=getCtx('angleCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    var ga=a*Math.PI/180, gb=b*Math.PI/180, gc=Math.PI-ga-gb;
    var cc=180-a-b;
    var cx=80,cy=180,bx=240,by=180;
    var ax2=cx+Math.cos(-ga)*140, ay2=cy+Math.sin(-ga)*140;

    if(!tearing){
      /* Draw triangle */
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(bx,by); ctx.lineTo(ax2,ay2); ctx.closePath();
      ctx.fillStyle='rgba(77,150,255,.12)'; ctx.fill();
      ctx.strokeStyle='var(--life)'.replace?'#4D96FF':'#4D96FF'; ctx.lineWidth=2.5; ctx.stroke();

      /* Angle arcs */
      var arcs=[
        {x:cx,y:cy,start:0,end:ga,color:'#FF6B6B',label:'α='+a+'°'},
        {x:bx,y:by,start:Math.PI,end:Math.PI+gb,color:'#FFD93D',label:'β='+b+'°'},
        {x:ax2,y:ay2,start:Math.PI+gb,end:Math.PI+gb+gc,color:'#6BCB77',label:'γ='+cc+'°'},
      ];
      arcs.forEach(function(arc){
        ctx.beginPath(); ctx.moveTo(arc.x,arc.y);
        ctx.arc(arc.x,arc.y,22,arc.start,arc.end);
        ctx.closePath(); ctx.fillStyle=arc.color+'44'; ctx.fill();
        ctx.strokeStyle=arc.color; ctx.lineWidth=1.5; ctx.stroke();
      });

      /* Angle labels */
      ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillStyle='#FF6B6B'; ctx.fillText('α='+a+'°',cx+30,cy-18);
      ctx.fillStyle='#FFD93D'; ctx.fillText('β='+b+'°',bx-32,by-18);
      ctx.fillStyle='#6BCB77'; ctx.fillText('γ='+cc+'°',ax2+(ax2>160?-40:40),ay2+20);

      /* Sum display */
      ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font='bold 13px Nunito,sans-serif';
      ctx.fillText('α + β + γ = '+a+' + '+b+' + '+cc+' = 180°',W/2,H-16);

    } else {
      /* Tear animation — show corners placed on a line */
      var progress=Math.min(1,phase/60);
      /* Base triangle fading */
      ctx.globalAlpha=1-progress;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(bx,by); ctx.lineTo(ax2,ay2); ctx.closePath();
      ctx.fillStyle='rgba(77,150,255,.1)'; ctx.fill();
      ctx.strokeStyle='#4D96FF'; ctx.lineWidth=2; ctx.stroke();
      ctx.globalAlpha=1;

      /* Three torn corners appearing on straight line */
      var lineY=H-40, lineX=30;
      var colors=['#FF6B6B','#FFD93D','#6BCB77'];
      var labels=['α='+a+'°','β='+b+'°','γ='+cc+'°'];
      var angles=[a,b,cc];
      var cumAngle=0;
      angles.forEach(function(ang,i){
        var startAngle=cumAngle*Math.PI/180;
        var endAngle=(cumAngle+ang)*Math.PI/180;
        var arcR=20;
        var px3=lineX+cumAngle*2.2*progress+arcR;
        var py3=lineY;
        ctx.globalAlpha=progress;
        ctx.beginPath();
        ctx.moveTo(px3,py3);
        ctx.arc(px3,py3,arcR,Math.PI,Math.PI+endAngle-startAngle);
        ctx.closePath();
        ctx.fillStyle=colors[i]+'66'; ctx.fill();
        ctx.strokeStyle=colors[i]; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle=colors[i]; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText(labels[i],px3,py3-arcR-4);
        ctx.globalAlpha=1;
        cumAngle+=ang;
      });

      /* Straight line */
      ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=2; ctx.globalAlpha=progress;
      ctx.beginPath(); ctx.moveTo(30,lineY); ctx.lineTo(W-30,lineY); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 12px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.globalAlpha=progress;
      ctx.fillText('All 3 angles = straight line = 180°!',W/2,lineY+18);
      ctx.globalAlpha=1;

      phase++;
      if(phase<=70) raf=requestAnimationFrame(function(){draw(true);});
      else { animating=false; phase=0; }
    }
  }

  function render(){
    var cc=180-a-b;
    if(cc<5){ b=Math.min(b,170-a); }
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Triangle Angle Sum = 180°</div>'+
      '<canvas id="angleCanvas" data-w="300" data-h="210" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#FF6B6B">α: <b>'+a+'°</b></span>'+
      '<input type="range" class="slide" min="10" max="'+(160-b)+'" value="'+a+'" oninput="angleA(this.value)" style="width:90px">'+
      '<span style="font-size:11px;color:#FFD93D">β: <b>'+b+'°</b></span>'+
      '<input type="range" class="slide" min="10" max="'+(160-a)+'" value="'+b+'" oninput="angleB(this.value)" style="width:90px">'+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      '<button class="cbtn" onclick="angleTear()" style="background:var(--evs);color:white;border-color:var(--evs);font-size:12px">✂️ Tear & Prove It!</button>'+
      '</div>';
    cancelAnimationFrame(raf); draw(false);
  }

  window.angleA=function(v){ a=parseInt(v); cancelAnimationFrame(raf); render(); };
  window.angleB=function(v){ b=parseInt(v); cancelAnimationFrame(raf); render(); };
  window.angleTear=function(){
    if(animating) return;
    animating=true; phase=0;
    cancelAnimationFrame(raf);
    (function loop(){ draw(true); })();
  };
  window.simCleanup=function(){ cancelAnimationFrame(raf); };
  render();
};

/* ── 5. COMPOUND INTEREST VISUAL (ap-finance) ── */
SIM_REGISTRY['ap-finance'] = function(c) {
  var start=20000, increment=1000, years=10;

  function render(){
    var data=[];
    var total=0;
    for(var y=1;y<=years;y++){
      var monthly=start+(y-1)*increment;
      total+=monthly*12;
      data.push({year:y,monthly:monthly,total:total});
    }
    var maxTotal=data[data.length-1].total;

    var bars=data.map(function(d,i){
      var pct=d.total/maxTotal*100;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'+
        '<div style="font-size:8px;color:var(--muted);writing-mode:vertical-lr;transform:rotate(180deg)">'+
          '₹'+(d.total>=100000?(d.total/100000).toFixed(1)+'L':Math.round(d.total/1000)+'K')+
        '</div>'+
        '<div style="width:100%;background:linear-gradient(to top,var(--math),var(--acc));border-radius:4px 4px 0 0;transition:height .3s" style="height:'+pct+'%">'+
        '</div>'+
        '<div style="font-size:8px;color:var(--muted)">Y'+d.year+'</div>'+
        '</div>';
    }).join('');

    var totalLakh=(total/100000).toFixed(2);
    var annualFinal=start+(years-1)*increment;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Arithmetic Progression — Savings Plan</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">'+
      '<label style="font-size:11px;color:var(--muted)">Start: ₹<input type="number" min="1000" max="50000" step="1000" value="'+start+'" onchange="apSet(\'s\',this.value)" style="width:70px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px;color:var(--text);font-size:11px"></label>'+
      '<label style="font-size:11px;color:var(--muted)">Annual rise: ₹<input type="number" min="100" max="5000" step="100" value="'+increment+'" onchange="apSet(\'i\',this.value)" style="width:60px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px;color:var(--text);font-size:11px"></label>'+
      '<label style="font-size:11px;color:var(--muted)">Years: <input type="number" min="1" max="20" value="'+years+'" onchange="apSet(\'y\',this.value)" style="width:44px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:3px;color:var(--text);font-size:11px"></label>'+
      '</div>'+
      /* Bar chart */
      '<div style="display:flex;align-items:flex-end;height:120px;gap:3px;padding:0 4px;border-bottom:2px solid var(--border);margin-bottom:8px">'+
      data.map(function(d){
        var pct=d.total/maxTotal*100;
        return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;height:100%;justify-content:flex-end">'+
          '<div style="font-size:7px;color:var(--muted)">'+(d.total>=100000?(d.total/100000).toFixed(1)+'L':Math.round(d.total/1000)+'K')+'</div>'+
          '<div style="width:100%;background:linear-gradient(to top,var(--math),var(--acc));border-radius:3px 3px 0 0;height:'+pct+'%"></div>'+
          '<div style="font-size:7px;color:var(--muted)">Y'+d.year+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      /* Summary */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
      '<div style="background:var(--math-dim);border:1px solid var(--math)44;border-radius:10px;padding:10px;text-align:center">'+
        '<div style="font-size:11px;color:var(--muted)">Year '+years+' monthly saving</div>'+
        '<div style="font-size:18px;font-weight:900;color:var(--math)">₹'+annualFinal.toLocaleString('en-IN')+'</div>'+
      '</div>'+
      '<div style="background:var(--acc-dim);border:1px solid var(--acc)44;border-radius:10px;padding:10px;text-align:center">'+
        '<div style="font-size:11px;color:var(--muted)">Total saved in '+years+' years</div>'+
        '<div style="font-size:18px;font-weight:900;color:var(--acc)">₹'+totalLakh+'L</div>'+
      '</div>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">'+
      'AP formula: aₙ = '+start+' + (n−1)×'+increment+' · Sum = n/2 × (2a + (n−1)d)'+
      '</div>';
  }

  window.apSet=function(k,v){
    if(k==='s') start=parseInt(v)||20000;
    if(k==='i') increment=parseInt(v)||1000;
    if(k==='y') years=parseInt(v)||10;
    render();
  };
  render();
};

/* ── 6. EROSION SIMULATION (erosion-sim) ── */
SIM_REGISTRY['erosion-sim'] = function(c) {
  var raf, t=0, rain=[], drops=[], running=false;
  var forest=true;

  function draw(){
    var _g=getCtx('erosionCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    /* Sky */
    var sky=ctx.createLinearGradient(0,0,0,H*0.4);
    sky.addColorStop(0,'#1a3a5c'); sky.addColorStop(1,'#2d6a8e');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.4);

    /* Rain clouds */
    ctx.fillStyle='#445566';
    [[W*0.2,H*0.08,45,20],[W*0.5,H*0.05,55,22],[W*0.78,H*0.09,40,18]].forEach(function(cl){
      ctx.beginPath(); ctx.ellipse(cl[0],cl[1],cl[2],cl[3],0,0,Math.PI*2); ctx.fill();
    });

    /* Slope */
    var slopeGrad=ctx.createLinearGradient(0,H*0.35,0,H);
    slopeGrad.addColorStop(0,forest?'#4a8a3a':'#8B6914');
    slopeGrad.addColorStop(0.3,forest?'#3a7a2a':'#7a5a0e');
    slopeGrad.addColorStop(1,'#5a3a10');
    ctx.fillStyle=slopeGrad;
    ctx.beginPath();
    ctx.moveTo(0,H*0.35);
    ctx.lineTo(W,H*0.65);
    ctx.lineTo(W,H);
    ctx.lineTo(0,H);
    ctx.closePath();
    ctx.fill();

    /* Trees (if forest) */
    if(forest){
      [0.08,0.18,0.28,0.38,0.5,0.62,0.72,0.82,0.92].forEach(function(xp){
        var tx=xp*W, ty=H*0.35+(xp*W/W)*(H*0.65-H*0.35)-30;
        ctx.fillStyle='#2d5a1e';
        ctx.beginPath(); ctx.moveTo(tx,ty-28); ctx.lineTo(tx-14,ty+4); ctx.lineTo(tx+14,ty+4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx,ty-38); ctx.lineTo(tx-10,ty-10); ctx.lineTo(tx+10,ty-10); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#5a3a10'; ctx.fillRect(tx-3,ty+4,6,12);
      });
    }

    /* Raindrops */
    if(running){
      if(Math.random()<0.35) rain.push({x:Math.random()*W,y:0,speed:4+Math.random()*3});
      rain=rain.filter(function(r){
        r.y+=r.speed;
        ctx.strokeStyle='rgba(100,180,255,0.7)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x-1,r.y-8); ctx.stroke();
        /* Hit slope */
        var slopeY=H*0.35+(r.x/W)*(H*0.65-H*0.35);
        if(r.y>=slopeY){
          if(!forest){
            drops.push({x:r.x,y:slopeY,vx:(Math.random()-.3)*2,vy:1,life:1,soil:true});
          }
          return false;
        }
        return true;
      });

      /* Soil runoff particles */
      drops=drops.filter(function(d){
        d.x+=d.vx; d.y+=d.vy+(d.x/W)*1.5; d.life-=0.02;
        ctx.beginPath(); ctx.arc(d.x,d.y,2.5,0,Math.PI*2);
        ctx.fillStyle='rgba(139,105,20,'+d.life+')'; ctx.fill();
        return d.life>0&&d.y<H;
      });
    }

    /* Runoff river at bottom */
    if(!forest&&running){
      ctx.fillStyle='rgba(100,80,20,0.5)';
      ctx.beginPath(); ctx.ellipse(W*0.9,H-20,30+drops.length*0.3,12,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('Runoff! Topsoil lost',W*0.75,H-8);
    }

    /* Labels */
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(forest?'🌳 Forested Slope (Roots hold soil)':'🌵 Bare Slope (No protection)',W/2,H*0.32);

    t+=0.03;
    raf=requestAnimationFrame(draw);
  }

  c.innerHTML=
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Erosion & Deforestation</div>'+
    '<canvas id="erosionCanvas" data-w="300" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
    '<div class="ctrl-row" style="margin-top:8px">'+
    '<button class="cbtn" onclick="erosionRain()" id="erosionRainBtn" style="background:var(--life);color:white;border-color:var(--life)">🌧️ Start Rain</button>'+
    '<button class="cbtn" onclick="erosionToggle()" id="erosionForestBtn" style="background:var(--evs);color:white;border-color:var(--evs)">🪓 Cut Forest</button>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
    'Compare how roots protect soil. The 2018 Kerala floods were worsened by deforestation in the Western Ghats.'+
    '</div>';

  window.erosionRain=function(){
    running=!running;
    document.getElementById('erosionRainBtn').textContent=running?'⏸ Stop Rain':'🌧️ Start Rain';
  };
  window.erosionToggle=function(){
    forest=!forest; rain=[]; drops=[];
    document.getElementById('erosionForestBtn').textContent=forest?'🪓 Cut Forest':'🌳 Plant Forest';
  };
  window.simCleanup=function(){ cancelAnimationFrame(raf); };
  draw();
};

/* ── 7. MAGNET & COMPASS (magnet-sim enhanced) ── */
/* Already registered — add HUMAN SENSES instead */
SIM_REGISTRY['five-senses'] = function(c) {
  var activeTest=null;
  var scores={sight:null,hearing:null,smell:null,taste:null,touch:null};
  var testState={};

  var tests = {
    sight: {
      emoji:'👁️', name:'Sight',
      question:'How many dots can you count?',
      run: function(){
        var count=5+Math.floor(Math.random()*12);
        testState={count:count,showing:true};
        return {type:'count',count:count};
      }
    },
    hearing: {
      emoji:'👂', name:'Hearing',
      question:'Which word has the hidden sound?',
      run: function(){
        var words=['CAT','DOG','FISH','BIRD','ANT'];
        var w=words[Math.floor(Math.random()*words.length)];
        testState={word:w};
        return {type:'word',word:w};
      }
    },
    touch: {
      emoji:'🤚', name:'Touch',
      question:'Guess the texture from description!',
      run: function(){
        var items=[
          {desc:'Bumpy and hard like a dimpled ball',answer:'Orange peel'},
          {desc:'Smooth and cool like a flat stone',answer:'Glass'},
          {desc:'Rough and scratchy like sandpaper',answer:'Sandpaper'},
          {desc:'Soft and fuzzy like a sleeping cat',answer:'Velvet'},
        ];
        var item=items[Math.floor(Math.random()*items.length)];
        testState={item:item};
        return {type:'touch',item:item};
      }
    },
    smell: {
      emoji:'👃', name:'Smell',
      question:'Which smell matches the description?',
      run: function(){
        var smells=[
          {desc:'Sweet, fruity and tropical',answer:'Mango',options:['Mango','Onion','Petrol']},
          {desc:'Sharp, spicy and makes eyes water',answer:'Onion',options:['Rose','Onion','Banana']},
          {desc:'Fresh, cool and minty clean',answer:'Mint',options:['Mint','Fish','Mud']},
        ];
        var s=smells[Math.floor(Math.random()*smells.length)];
        testState={smell:s};
        return {type:'smell',smell:s};
      }
    },
    taste: {
      emoji:'👅', name:'Taste',
      question:'Match the taste to the food!',
      run: function(){
        var pairs=[
          {taste:'Sweet',food:'Sugar',wrong:['Lemon','Salt','Coffee']},
          {taste:'Sour',food:'Lemon',wrong:['Sugar','Honey','Salt']},
          {taste:'Salty',food:'Salt',wrong:['Sugar','Lemon','Coffee']},
          {taste:'Bitter',food:'Coffee',wrong:['Sugar','Salt','Honey']},
        ];
        var p=pairs[Math.floor(Math.random()*pairs.length)];
        testState={pair:p};
        return {type:'taste',pair:p};
      }
    }
  };

  function renderTest(key){
    var test=tests[key];
    var data=test.run();
    var html='<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px">'+test.emoji+' '+test.question+'</div>';

    if(data.type==='count'){
      var dots='';
      var pos=[];
      for(var i=0;i<data.count;i++){
        var px=10+Math.random()*80, py=10+Math.random()*80;
        pos.push({x:px,y:py});
      }
      html+='<div style="position:relative;width:100px;height:100px;background:var(--surface);border-radius:10px;margin:0 auto 10px;border:1px solid var(--border)">'+
        pos.map(function(p){return '<div style="position:absolute;left:'+p.x+'%;top:'+p.y+'%;width:8px;height:8px;border-radius:50%;background:var(--sci);transform:translate(-50%,-50%)"></div>';}).join('')+
        '</div>'+
        '<div class="ctrl-row"><button class="cbtn" onclick="senseReveal()">Reveal Answer</button></div>'+
        '<div id="senseReveal" style="display:none;font-size:18px;font-weight:900;color:var(--evs);text-align:center;margin-top:8px">'+data.count+' dots! ✅</div>';
    }
    else if(data.type==='touch'){
      html+='<div style="background:var(--surface2);border-radius:10px;padding:14px;font-size:14px;color:var(--text);text-align:center;margin-bottom:10px;font-style:italic">"'+data.item.desc+'"</div>'+
        '<div class="ctrl-row"><button class="cbtn" onclick="senseReveal()">Reveal</button></div>'+
        '<div id="senseReveal" style="display:none;font-size:16px;font-weight:900;color:var(--evs);text-align:center;margin-top:8px">'+data.item.answer+'! ✅</div>';
    }
    else if(data.type==='smell'){
      html+='<div style="font-size:13px;color:var(--muted);margin-bottom:10px;text-align:center;font-style:italic">'+data.smell.desc+'</div>'+
        '<div class="ctrl-row">'+data.smell.options.map(function(o){
          return '<button class="cbtn" onclick="senseCheck(\''+o+'\',\''+data.smell.answer+'\')" style="font-size:12px">'+o+'</button>';
        }).join('')+'</div>'+
        '<div id="senseResult" style="text-align:center;font-size:14px;font-weight:900;margin-top:8px;min-height:24px"></div>';
    }
    else if(data.type==='taste'){
      html+='<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:8px;text-align:center">'+data.pair.taste+' taste = ?</div>'+
        '<div class="ctrl-row">'+
        [data.pair.food,...data.pair.wrong].sort(function(){return Math.random()-.5;}).map(function(o){
          return '<button class="cbtn" onclick="senseCheck(\''+o+'\',\''+data.pair.food+'\')" style="font-size:12px">'+o+'</button>';
        }).join('')+
        '</div>'+
        '<div id="senseResult" style="text-align:center;font-size:14px;font-weight:900;margin-top:8px;min-height:24px"></div>';
    }

    return html;
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">The 5 Senses</div>'+
      '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">'+
      Object.keys(tests).map(function(k){
        return '<button onclick="sensePick(\''+k+'\')" style="width:44px;height:44px;border-radius:12px;border:2px solid '+(k===activeTest?'var(--acc)':'var(--border)')+';background:'+(k===activeTest?'var(--acc-dim)':'var(--surface2)')+';font-size:20px;cursor:pointer;transition:all .2s">'+tests[k].emoji+'</button>';
      }).join('')+
      '</div>'+
      (activeTest?
        '<div style="background:var(--surface2);border-radius:12px;padding:14px;border:1px solid var(--border)">'+
        renderTest(activeTest)+
        '<div class="ctrl-row" style="margin-top:10px"><button class="cbtn" onclick="sensePick(\''+activeTest+'\')" style="font-size:11px">🔄 Try Again</button></div>'+
        '</div>':
        '<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px">Tap a sense above to test it! 👆</div>')+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">'+
      'Your nose can detect 1 trillion smells! But you only taste 5 things: sweet, salty, sour, bitter, umami.'+
      '</div>';
  }

  window.sensePick=function(k){ activeTest=k; render(); };
  window.senseReveal=function(){
    var el=document.getElementById('senseReveal');
    if(el) el.style.display='block';
  };
  window.senseCheck=function(choice,answer){
    var el=document.getElementById('senseResult');
    if(el) el.innerHTML=choice===answer?'✅ Correct! '+answer+' it is!':'❌ Not quite — it\'s '+answer+'!';
    el.style.color=choice===answer?'var(--evs)':'var(--sci)';
  };
  render();
};

/* ── 8. LUNG CAPACITY (lung-capacity) ── */
SIM_REGISTRY['lung-capacity'] = function(c) {
  var results=[];
  var breathing=false, raf;
  var phase='inhale', t=0, lungFill=0;

  function draw(){
    var _g=getCtx('lungCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Breathing animation */
    if(breathing){
      t+=0.04;
      var cycle=Math.sin(t);
      lungFill=0.4+cycle*0.4;
      if(cycle>0.95) phase='peak';
      else if(cycle<-0.95) phase='trough';
      else phase=cycle>0?'inhale':'exhale';
    }

    /* Two lungs */
    var lx=W*0.3, rx=W*0.7, ly=H*0.45;
    [lx,rx].forEach(function(x,i){
      /* Lung outline */
      ctx.beginPath();
      ctx.ellipse(x,ly,30,50,i===0?-0.15:0.15,0,Math.PI*2);
      ctx.fillStyle='rgba(255,107,107,'+(0.1+lungFill*0.15)+')';
      ctx.fill();
      ctx.strokeStyle='rgba(255,107,107,0.5)'; ctx.lineWidth=2; ctx.stroke();
      /* Air fill */
      ctx.save();
      ctx.beginPath(); ctx.ellipse(x,ly,30,50,i===0?-0.15:0.15,0,Math.PI*2); ctx.clip();
      ctx.fillStyle='rgba(77,150,255,'+(lungFill*0.5)+')';
      ctx.fillRect(x-35,ly+50-lungFill*100,70,100);
      ctx.restore();
      /* Bronchi lines */
      ctx.strokeStyle='rgba(255,107,107,.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x,ly-20); ctx.lineTo(x+(i===0?-8:8),ly-5); ctx.lineTo(x+(i===0?-15:15),ly+10); ctx.stroke();
    });

    /* Trachea */
    ctx.strokeStyle='rgba(255,107,107,.4)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(W/2,H*0.15); ctx.lineTo(W/2,H*0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2,H*0.35); ctx.lineTo(lx+5,ly-30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2,H*0.35); ctx.lineTo(rx-5,ly-30); ctx.stroke();

    /* Phase indicator */
    var phaseColors={inhale:'#4D96FF',exhale:'#FF6B6B',peak:'#6BCB77',trough:'#FFD93D'};
    var phaseLabels={inhale:'↓ Inhaling... lungs expanding',exhale:'↑ Exhaling... lungs deflating',peak:'🫁 Full capacity!',trough:'💨 Fully exhaled'};
    ctx.fillStyle=phaseColors[phase]||'white'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(phaseLabels[phase]||'',W/2,H-10);

    /* Capacity bar */
    ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(10,H*0.8,W-20,16);
    ctx.fillStyle='rgba(77,150,255,0.7)'; ctx.fillRect(10,H*0.8,(W-20)*lungFill,16);
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1; ctx.strokeRect(10,H*0.8,W-20,16);
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif';
    ctx.fillText(Math.round(lungFill*6)+'/6 litres',W/2,H*0.8+11);

    if(breathing) raf=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Lung Capacity Visualiser</div>'+
      '<canvas id="lungCanvas" data-w="280" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<button class="cbtn" onclick="lungBreath()" id="lungBtn" style="background:var(--life);color:white;border-color:var(--life)">▶ Start Breathing</button>'+
      '</div>'+
      /* Record results */
      '<div style="margin-top:8px;font-size:11px;color:var(--muted)">'+
      '<div style="font-weight:800;color:var(--text);margin-bottom:4px">📊 Lung Capacity Facts</div>'+
      '<div style="line-height:1.8">• Average adult: <b style="color:var(--life)">6 litres</b> total capacity</div>'+
      '<div style="line-height:1.8">• Tidal breath (normal): <b style="color:var(--text)">0.5 litres</b></div>'+
      '<div style="line-height:1.8">• Trained swimmer: up to <b style="color:var(--acc)">7.5+ litres</b></div>'+
      '<div style="line-height:1.8">• Exercise increases capacity over time!</div>'+
      '</div>';
    cancelAnimationFrame(raf); draw();
  }

  window.lungBreath=function(){
    breathing=!breathing;
    document.getElementById('lungBtn').textContent=breathing?'⏸ Pause':'▶ Start Breathing';
    if(breathing) draw();
    else cancelAnimationFrame(raf);
  };
  window.simCleanup=function(){ cancelAnimationFrame(raf); breathing=false; };
  render();
};

/* ── 9. TRIG HEIGHTS (trig-heights) ── */
SIM_REGISTRY['trig-heights'] = function(c) {
  var angle=45, dist=30;

  function render(){
    var rad=angle*Math.PI/180;
    var height=Math.tan(rad)*dist;
    var hyp=dist/Math.cos(rad);

    var W=300, H=220;
    var gx=30, gy=H-40, scale=2.5;
    var tx=gx+dist*scale, ty=gy-height*scale;
    tx=Math.min(tx,W-20); ty=Math.max(ty,20);
    var actualHeight=height;
    var drawH=gy-ty;
    if(drawH<10){drawH=10;ty=gy-drawH;}

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Trigonometry: Finding Heights</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">'+
      /* Ground */
      '<line x1="0" y1="'+gy+'" x2="'+W+'" y2="'+gy+'" stroke="rgba(255,255,255,.15)" stroke-width="2"/>'+
      /* Observer */
      '<circle cx="'+gx+'" cy="'+gy+'" r="6" fill="#4D96FF"/>'+
      '<text x="'+(gx)+'" y="'+(gy+16)+'" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Nunito">You</text>'+
      /* Object (tree/building) */
      '<line x1="'+tx+'" y1="'+gy+'" x2="'+tx+'" y2="'+ty+'" stroke="#6BCB77" stroke-width="4"/>'+
      '<polygon points="'+(tx-12)+','+(ty+10)+' '+tx+','+(ty-10)+' '+(tx+12)+','+(ty+10)+'" fill="#2d7a1e"/>'+
      '<text x="'+(tx+16)+'" y="'+(gy-drawH/2)+'" fill="#6BCB77" font-size="9" font-family="Nunito">h='+actualHeight.toFixed(1)+'m</text>'+
      /* Hypotenuse (line of sight) */
      '<line x1="'+gx+'" y1="'+gy+'" x2="'+tx+'" y2="'+ty+'" stroke="rgba(199,125,255,.7)" stroke-width="2" stroke-dasharray="5,4"/>'+
      /* Angle arc */
      '<path d="M '+(gx+25)+' '+gy+' A 25 25 0 0 0 '+(gx+25*Math.cos(-rad))+' '+(gy+25*Math.sin(-rad))+'" fill="rgba(255,217,61,.2)" stroke="#FFD93D" stroke-width="1.5"/>'+
      '<text x="'+(gx+30)+'" y="'+(gy-10)+'" fill="#FFD93D" font-size="10" font-weight="bold" font-family="Nunito">'+angle+'°</text>'+
      /* Distance label */
      '<text x="'+(gx+tx)/2+'" y="'+(gy+14)+'" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Nunito">d='+dist+'m</text>'+
      /* Formula */
      '<text x="10" y="20" fill="rgba(255,255,255,.6)" font-size="10" font-family="Nunito">tan(θ) = h / d</text>'+
      '<text x="10" y="34" fill="#C77DFF" font-size="10" font-weight="bold" font-family="Nunito">h = '+dist+' × tan('+angle+'°) = '+actualHeight.toFixed(2)+'m</text>'+
      '</svg>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#FFD93D">Angle θ: <b>'+angle+'°</b></span>'+
      '<input type="range" class="slide" min="5" max="80" value="'+angle+'" oninput="trigAngle(this.value)" style="width:100px">'+
      '<span style="font-size:11px;color:var(--muted)">Distance: <b>'+dist+'m</b></span>'+
      '<input type="range" class="slide" min="5" max="50" value="'+dist+'" oninput="trigDist(this.value)" style="width:80px">'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-top:8px;font-size:12px;line-height:1.7;border:1px solid var(--border)">'+
      '📐 <b>Hypotenuse</b> (line of sight) = '+hyp.toFixed(2)+'m · '+
      'This is how Egyptians measured pyramid heights using shadows!'+
      '</div>';
  }

  window.trigAngle=function(v){ angle=parseInt(v); render(); };
  window.trigDist=function(v){ dist=parseInt(v); render(); };
  render();
};

/* ── 10. QUADRATIC REAL WORLD (quadratic-real enhanced) ── */
/* Already registered — add PATTERN MAKER instead */
SIM_REGISTRY['pattern-maker'] = function(c) {
  var pattern=[], maxLen=8;
  var shapes=['🔴','🔵','🟡','🟢','🟣'];
  var selected='🔴';
  var sequence=[];

  var presets=[
    {name:'AB',seq:['🔴','🔵']},
    {name:'ABB',seq:['🔴','🔵','🔵']},
    {name:'ABC',seq:['🔴','🔵','🟡']},
    {name:'AABB',seq:['🔴','🔴','🔵','🔵']},
  ];

  function renderFull(){
    /* Extend pattern to show 3 repetitions */
    var displayed=[];
    if(sequence.length>0){
      while(displayed.length<24) displayed=displayed.concat(sequence);
      displayed=displayed.slice(0,24);
    }

    /* Find next in user's pattern */
    var next=sequence.length>0?sequence[pattern.length%sequence.length]:null;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Pattern Maker</div>'+
      /* Shape selector */
      '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px">'+
      shapes.map(function(s){
        return '<button onclick="patSel(\''+s+'\')" style="font-size:22px;width:42px;height:42px;border-radius:10px;border:2px solid '+(s===selected?'var(--acc)':'var(--border)')+';background:'+(s===selected?'var(--acc-dim)':'var(--surface2)')+';cursor:pointer;transition:all .2s">'+s+'</button>';
      }).join('')+
      '</div>'+
      /* Preset patterns */
      '<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:5px">Quick patterns:</div>'+
      '<div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap">'+
      presets.map(function(p){
        return '<button onclick="patPreset(\''+p.name+'\')" style="padding:4px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);font-size:11px;cursor:pointer">'+p.name+'</button>';
      }).join('')+
      '<button onclick="patClear()" style="padding:4px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--sci);font-size:11px;cursor:pointer">Clear</button>'+
      '</div>'+
      /* User pattern builder */
      '<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:5px">Build your pattern unit:</div>'+
      '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;min-height:44px;background:var(--surface2);border-radius:10px;padding:8px;margin-bottom:8px;border:1px solid var(--border)">'+
      (sequence.length>0?sequence.map(function(s,i){
        return '<span onclick="patRemove('+i+')" style="font-size:22px;cursor:pointer;title:Click to remove" title="Click to remove">'+s+'</span>';
      }).join(''):'<span style="color:var(--muted);font-size:12px">Tap shapes above to build pattern...</span>')+
      '<button onclick="patAdd()" style="margin-left:auto;padding:4px 8px;border-radius:8px;border:1.5px solid var(--acc);background:var(--acc-dim);color:var(--acc);font-size:12px;font-weight:700;cursor:pointer">+ Add</button>'+
      '</div>'+
      /* Pattern display */
      (sequence.length>0?
        '<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:5px">Pattern extended (3 repetitions):</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:3px;background:var(--surface2);border-radius:10px;padding:8px;border:1px solid var(--border);margin-bottom:8px">'+
        displayed.map(function(s,i){
          var isFirst=i%sequence.length===0;
          return '<span style="font-size:18px;'+(isFirst&&i>0?'margin-left:6px;border-left:1px solid rgba(255,255,255,.2);padding-left:6px':'')+'">'+s+'</span>';
        }).join('')+
        '</div>'+
        '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;line-height:1.7">'+
        '📐 Pattern unit length: <b style="color:var(--acc)">'+sequence.length+'</b> · Pattern type: <b style="color:var(--text)">'+presets.find(function(p){return JSON.stringify(p.seq)===JSON.stringify(sequence);})?presets.find(function(p){return JSON.stringify(p.seq)===JSON.stringify(sequence);}).name:'Custom'+'</b>'+
        '</div>':'');
  }

  window.patSel=function(s){ selected=s; renderFull(); };
  window.patAdd=function(){ if(sequence.length<8){sequence.push(selected);} renderFull(); };
  window.patRemove=function(i){ sequence.splice(i,1); renderFull(); };
  window.patClear=function(){ sequence=[]; renderFull(); };
  window.patPreset=function(name){
    var p=presets.find(function(p){return p.name===name;});
    if(p) sequence=[...p.seq];
    renderFull();
  };
  renderFull();
};


/* ══════════════════════════════════════
   BATCH 4 — 10 more simulations
   ══════════════════════════════════════ */

/* ── 1. ROCK CYCLE (rock-cycle) ── */
SIM_REGISTRY['rock-cycle'] = function(c) {
  var stage = 'igneous';
  var stages = {
    igneous:     { name:'🌋 Igneous Rock',      color:'#FF6B6B', next:'sedimentary', nextLabel:'Weathering & Erosion →',
                   desc:'Formed when magma cools. Fast cooling = small crystals (basalt). Slow cooling = large crystals (granite).',
                   example:'Granite, Basalt, Obsidian' },
    sedimentary: { name:'🪨 Sedimentary Rock',  color:'#C8945A', next:'metamorphic', nextLabel:'Heat & Pressure →',
                   desc:'Layers of sediment compressed over millions of years. Contains fossils! Makes up 75% of Earth\'s surface rocks.',
                   example:'Limestone, Sandstone, Shale' },
    metamorphic: { name:'💎 Metamorphic Rock',  color:'#C77DFF', next:'magma',       nextLabel:'Melting →',
                   desc:'Existing rocks transformed by extreme heat and pressure deep in the crust. Crystals realign into new patterns.',
                   example:'Marble (from Limestone), Slate (from Shale)' },
    magma:       { name:'🔥 Magma',             color:'#FFD93D', next:'igneous',     nextLabel:'Cooling & Solidifying →',
                   desc:'Molten rock beneath Earth\'s surface (1000–1300°C). When it erupts, it becomes lava. The cycle continues!',
                   example:'Found in Earth\'s mantle and magma chambers' },
  };
  var order = ['igneous','sedimentary','metamorphic','magma'];

  function render() {
    var s = stages[stage];
    var raf2;
    c.innerHTML =
      /* Cycle diagram */
      '<div style="position:relative;width:240px;height:200px;margin:0 auto 10px">' +
      order.map(function(k,i) {
        var angle = i/4*Math.PI*2 - Math.PI/2;
        var cx2 = 120+Math.cos(angle)*78, cy2 = 100+Math.sin(angle)*68;
        var st = stages[k];
        return '<div onclick="rockGo(\''+k+'\')" style="position:absolute;left:'+(cx2-30)+'px;top:'+(cy2-18)+'px;'+
          'width:60px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;'+
          'background:'+(k===stage?st.color+'33':'var(--surface2)')+';'+
          'border:2px solid '+(k===stage?st.color:'var(--border)')+';'+
          'font-size:9px;font-weight:800;color:'+(k===stage?st.color:'var(--muted)')+';'+
          'cursor:pointer;text-align:center;line-height:1.3;transition:all .2s">'+st.name.split(' ').slice(1).join(' ')+'</div>';
      }).join('') +
      /* Center circle */
      '<div style="position:absolute;left:84px;top:68px;width:72px;height:64px;border-radius:50%;'+
        'background:radial-gradient(circle,#0a0a2a,#1a1a3a);border:1px solid rgba(255,255,255,.1);'+
        'display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted);text-align:center;line-height:1.4">'+
        'Rock<br>Cycle</div>' +
      /* Arrows between stages */
      '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" viewBox="0 0 240 200">' +
      order.map(function(k,i) {
        var a1=i/4*Math.PI*2-Math.PI/2, a2=(i+1)/4*Math.PI*2-Math.PI/2;
        var x1=120+Math.cos(a1)*50, y1=100+Math.sin(a1)*45;
        var x2=120+Math.cos(a2)*50, y2=100+Math.sin(a2)*45;
        var isActive = k===stage;
        return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+(isActive?stages[k].color:'rgba(255,255,255,.1)')+'" stroke-width="'+(isActive?2:1)+'" stroke-dasharray="4,3" marker-end="url(#arr)"/>';
      }).join('') +
      '<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,.4)"/></marker></defs>' +
      '</svg></div>' +
      /* Info card */
      '<div style="background:'+s.color+'15;border:1.5px solid '+s.color+'44;border-radius:12px;padding:12px 14px">' +
      '<div style="font-size:15px;font-weight:900;color:'+s.color+';margin-bottom:4px">'+s.name+'</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:6px">'+s.desc+'</div>' +
      '<div style="font-size:10px;color:var(--muted)">📍 Examples: <b style="color:var(--text)">'+s.example+'</b></div>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:10px">' +
      '<button class="cbtn" onclick="rockGo(\''+s.next+'\')" style="background:'+s.color+';color:white;border-color:'+s.color+';font-size:12px">'+s.nextLabel+'</button>' +
      '</div>';
  }

  window.rockGo = function(k) { stage=k; render(); };
  render();
};

/* ── 2. SOUND WAVES (sound-pitch) ── */
SIM_REGISTRY['sound-pitch'] = function(c) {
  var freq=440, amp=50, raf2, t=0, playing=false;
  var audioCtx=null, osc=null;

  function draw() {
    var _g=getCtx('soundCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Grid lines */
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    for(var i=0;i<5;i++){
      ctx.beginPath(); ctx.moveTo(0,H*i/4); ctx.lineTo(W,H*i/4); ctx.stroke();
    }

    /* Centre line */
    ctx.strokeStyle='rgba(255,255,255,.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

    /* Wave */
    var wavelength = W/(freq/80);
    var color = freq<200?'#4D96FF':freq<500?'#6BCB77':freq<1000?'#FFD93D':'#FF6B6B';

    ctx.strokeStyle=color; ctx.lineWidth=2.5;
    ctx.shadowColor=color; ctx.shadowBlur=8;
    ctx.beginPath();
    for(var x=0;x<W;x++) {
      var y = H/2 + Math.sin((x/wavelength + t)*Math.PI*2)*(amp/100)*(H/2-10);
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke(); ctx.shadowBlur=0;

    /* Labels */
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('Frequency: '+freq+'Hz  ('+(freq<200?'Bass/Low':freq<500?'Mid':freq<2000?'Treble':'High')+')',8,16);
    ctx.fillText('Amplitude: '+amp+'%  (Volume)',8,30);
    ctx.fillText('Wavelength: '+(wavelength).toFixed(0)+'px',8,44);

    /* Particle visualization below */
    ctx.fillStyle='rgba(255,255,255,.04)'; ctx.fillRect(0,H*0.72,W,H*0.28);
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='8px Nunito,sans-serif';
    ctx.fillText('Air particle compression:',6,H*0.72+10);
    for(var p=0;p<40;p++) {
      var px=p*(W/40)+4;
      var compression=Math.sin((p/40*(freq/100))+t*2)*Math.PI*2;
      var spread=(1+compression*0.3)*(amp/100)*3+1;
      ctx.beginPath(); ctx.arc(px+(compression*spread*4),H*0.86,Math.max(1,2+compression),0,Math.PI*2);
      ctx.fillStyle='rgba('+( freq<400?'77,150,255':'255,107,107')+',0.6)';
      ctx.fill();
    }

    if(playing) t+=freq/8000;
    raf2=requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Sound Wave Visualiser</div>'+
      '<canvas id="soundCanvas" data-w="300" data-h="180" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Pitch (Hz):</span>'+
      '<input type="range" class="slide" min="50" max="2000" value="'+freq+'" oninput="soundFreq(this.value)" style="width:120px">'+
      '<span style="font-size:11px;color:var(--muted)">Volume:</span>'+
      '<input type="range" class="slide" min="10" max="100" value="'+amp+'" oninput="soundAmp(this.value)" style="width:80px">'+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      '<button class="cbtn" onclick="soundPlay()" id="soundPlayBtn" style="background:var(--acc);color:white;border-color:var(--acc)">▶ Animate</button>'+
      '<button class="cbtn" onclick="soundFreq(261)" style="font-size:11px">🎵 Middle C</button>'+
      '<button class="cbtn" onclick="soundFreq(440)" style="font-size:11px">🎵 A440</button>'+
      '<button class="cbtn" onclick="soundFreq(100)" style="font-size:11px">🥁 Bass</button>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      'Higher frequency = higher pitch · Bigger amplitude = louder sound'+
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.soundFreq=function(v){ freq=parseInt(v); };
  window.soundAmp=function(v){ amp=parseInt(v); };
  window.soundPlay=function(){
    playing=!playing;
    document.getElementById('soundPlayBtn').textContent=playing?'⏸ Pause':'▶ Animate';
  };
  window.simCleanup=function(){ cancelAnimationFrame(raf2); playing=false; };
  render();
};

/* ── 3. LENS & OPTICS (lens-optics) ── */
SIM_REGISTRY['lens-optics'] = function(c) {
  var lensType='convex', objDist=15, focalLen=10;

  function render() {
    var f = lensType==='convex'?focalLen:-focalLen;
    /* Thin lens formula: 1/v = 1/f - 1/u (u is negative, object on left) */
    var u = -objDist;
    var v_inv = 1/f - 1/u;
    var v = v_inv!==0 ? 1/v_inv : Infinity;
    var m = v!==Infinity ? -v/u : 0;
    var imgReal = v>0;
    var imgType = v===Infinity?'At infinity':imgReal?'Real, '+(m<-0.01?'Inverted':'upright')+', '+Math.abs(m).toFixed(2)+'× magnified':'Virtual, upright, '+Math.abs(m).toFixed(2)+'× magnified';

    var W=300, H=180, CX=150, CY=90, scale=5;
    var objX=CX-objDist*scale;
    var imgX=v===Infinity?CX+200:CX+v*scale;
    var objH=40, imgH=Math.abs(m)*objH*(imgReal?1:0.7);
    imgH=Math.min(imgH,75); imgX=Math.min(imgX,W-10); imgX=Math.max(imgX,10);

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Ray Optics — '+( lensType==='convex'?'Convex (Converging)':'Concave (Diverging)')+' Lens</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">'+
      /* Principal axis */
      '<line x1="0" y1="'+CY+'" x2="'+W+'" y2="'+CY+'" stroke="rgba(255,255,255,.1)" stroke-width="1"/>'+
      /* Lens */
      (lensType==='convex'?
        '<ellipse cx="'+CX+'" cy="'+CY+'" rx="8" ry="70" fill="rgba(77,150,255,.12)" stroke="rgba(77,150,255,.6)" stroke-width="2"/>':
        '<line x1="'+CX+'" y1="'+(CY-70)+'" x2="'+CX+'" y2="'+(CY+70)+'" stroke="rgba(255,107,107,.6)" stroke-width="2"/>')+
      /* Focal points */
      '<circle cx="'+(CX+focalLen*scale)+'" cy="'+CY+'" r="4" fill="rgba(255,217,61,.6)"/>'+
      '<text x="'+(CX+focalLen*scale)+'" y="'+(CY+14)+'" fill="rgba(255,217,61,.5)" font-size="8" text-anchor="middle" font-family="Nunito">F</text>'+
      '<circle cx="'+(CX-focalLen*scale)+'" cy="'+CY+'" r="4" fill="rgba(255,217,61,.6)"/>'+
      '<text x="'+(CX-focalLen*scale)+'" y="'+(CY+14)+'" fill="rgba(255,217,61,.5)" font-size="8" text-anchor="middle" font-family="Nunito">F</text>'+
      /* Object arrow */
      '<line x1="'+objX+'" y1="'+CY+'" x2="'+objX+'" y2="'+(CY-objH)+'" stroke="#6BCB77" stroke-width="3"/>'+
      '<polygon points="'+(objX-5)+','+(CY-objH+8)+' '+objX+','+(CY-objH)+' '+(objX+5)+','+(CY-objH+8)+'" fill="#6BCB77"/>'+
      '<text x="'+objX+'" y="'+(CY+14)+'" fill="rgba(107,203,119,.7)" font-size="8" text-anchor="middle" font-family="Nunito">Object</text>'+
      /* Rays */
      /* Ray 1: parallel to axis → through/from focal point */
      '<line x1="'+objX+'" y1="'+(CY-objH)+'" x2="'+CX+'" y2="'+(CY-objH)+'" stroke="rgba(255,107,107,.5)" stroke-width="1.5" stroke-dasharray="4,3"/>'+
      '<line x1="'+CX+'" y1="'+(CY-objH)+'" x2="'+(lensType==='convex'?CX+focalLen*scale+30:imgX)+'" y2="'+(lensType==='convex'?CY+(imgReal?imgH:-imgH)*0.5:CY-imgH)+'" stroke="rgba(255,107,107,.5)" stroke-width="1.5" stroke-dasharray="4,3"/>'+
      /* Ray 2: through centre */
      (v!==Infinity&&v<W/scale?'<line x1="'+objX+'" y1="'+(CY-objH)+'" x2="'+imgX+'" y2="'+(CY-(imgReal?-imgH:imgH))+'" stroke="rgba(77,150,255,.5)" stroke-width="1.5" stroke-dasharray="4,3"/>':'')+ 
      /* Image arrow */
      (v!==Infinity&&Math.abs(imgX-CX)<180?
        '<line x1="'+imgX+'" y1="'+CY+'" x2="'+imgX+'" y2="'+(CY-(imgReal?-imgH:imgH))+'" stroke="rgba(199,125,255,'+(imgReal?0.9:0.5)+')" stroke-width="2.5" stroke-dasharray="'+(imgReal?'0':'5,3')+'"/>'+
        '<polygon points="'+(imgX-4)+','+(CY-(imgReal?-imgH:imgH)+(imgReal?8:-8))+' '+imgX+','+(CY-(imgReal?-imgH:imgH))+' '+(imgX+4)+','+(CY-(imgReal?-imgH:imgH)+(imgReal?8:-8))+'" fill="rgba(199,125,255,'+(imgReal?0.9:0.5)+')"/>'+
        '<text x="'+imgX+'" y="'+(CY+14)+'" fill="rgba(199,125,255,.7)" font-size="8" text-anchor="middle" font-family="Nunito">Image</text>':'')+
      /* Formula */
      '<text x="8" y="16" fill="rgba(255,255,255,.5)" font-size="9" font-family="Nunito">1/v − 1/u = 1/f   (u='+u+', f='+f+', v='+(v!==Infinity?v.toFixed(1):'∞')+')</text>'+
      '</svg>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:8px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px">'+
      '<b style="color:'+(imgReal?'var(--acc)':'var(--sci)')+'">Image: '+imgType+'</b>'+
      (lensType==='convex'?'<div style="font-size:10px;color:var(--muted);margin-top:3px">Used in: cameras, projectors, eyes, magnifying glasses</div>':
       '<div style="font-size:10px;color:var(--muted);margin-top:3px">Used in: spectacles for short-sight, wide-angle cameras, peepholes</div>')+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<button class="cbtn" onclick="lensType2(\'convex\')" style="font-size:11px;'+(lensType==='convex'?'background:var(--life);color:white;border-color:var(--life)':'')+'">'+(lensType==='convex'?'✓ ':'')+'Convex</button>'+
      '<button class="cbtn" onclick="lensType2(\'concave\')" style="font-size:11px;'+(lensType==='concave'?'background:var(--sci);color:white;border-color:var(--sci)':'')+'">'+(lensType==='concave'?'✓ ':'')+'Concave</button>'+
      '<span style="font-size:11px;color:var(--muted)">Object dist: <b>'+objDist+'cm</b></span>'+
      '<input type="range" class="slide" min="2" max="40" value="'+objDist+'" oninput="lensObj(this.value)" style="width:90px">'+
      '<span style="font-size:11px;color:var(--muted)">f=<b>'+focalLen+'cm</b></span>'+
      '<input type="range" class="slide" min="4" max="20" value="'+focalLen+'" oninput="lensFocal(this.value)" style="width:70px">'+
      '</div>';
  }

  window.lensType2=function(t){ lensType=t; render(); };
  window.lensObj=function(v){ objDist=parseInt(v); render(); };
  window.lensFocal=function(v){ focalLen=parseInt(v); render(); };
  render();
};

/* ── 4. INTEGER NUMBER LINE (integer-line) ── */
SIM_REGISTRY['integer-line'] = function(c) {
  var a=3, b=-5, op='+';

  function render() {
    var result = op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:b!==0?Math.round(a/b*10)/10:'∞';
    var min=-12,max=12,W=300,lineY=80,scale=W/(max-min);

    var markers='';
    for(var i=min;i<=max;i++){
      var x=(i-min)*scale;
      markers+='<line x1="'+x+'" y1="'+(lineY-6)+'" x2="'+x+'" y2="'+(lineY+6)+'" stroke="rgba(255,255,255,.2)" stroke-width="1"/>';
      if(i%5===0||i===0) markers+='<text x="'+x+'" y="'+(lineY+18)+'" fill="rgba(255,255,255,'+(i===0?.5:.25)+')" font-size="'+(i===0?10:8)+'" text-anchor="middle" font-family="Nunito">'+i+'</text>';
    }

    /* Points */
    var ax=(a-min)*scale, bx=(b-min)*scale;
    var rx=(typeof result==='number'?(result-min)*scale:0);

    /* Arrow from a to result */
    var arrowColor=op==='+'||op==='×'?'#6BCB77':'#FF6B6B';

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Integer Number Line</div>'+
      '<svg width="'+W+'" height="130" style="display:block;background:#0a0a1a;border-radius:12px;width:100%;overflow:visible">'+
      /* Number line */
      '<line x1="0" y1="'+lineY+'" x2="'+W+'" y2="'+lineY+'" stroke="rgba(255,255,255,.2)" stroke-width="2"/>'+
      markers+
      /* Zero highlight */
      '<circle cx="'+((0-min)*scale)+'" cy="'+lineY+'" r="4" fill="rgba(255,255,255,.3)"/>'+
      /* Point A */
      '<circle cx="'+ax+'" cy="'+lineY+'" r="8" fill="var(--sci)" opacity="0.9"/>'+
      '<text x="'+ax+'" y="'+(lineY-14)+'" fill="#4D96FF" font-size="10" font-weight="bold" text-anchor="middle" font-family="Nunito">a='+a+'</text>'+
      /* Point B */
      '<circle cx="'+bx+'" cy="'+lineY+'" r="8" fill="var(--math)" opacity="0.9"/>'+
      '<text x="'+bx+'" y="'+(lineY+28)+'" fill="#FFD93D" font-size="10" font-weight="bold" text-anchor="middle" font-family="Nunito">b='+b+'</text>'+
      /* Result */
      (typeof result==='number'&&result>=min&&result<=max?
        '<circle cx="'+rx+'" cy="'+lineY+'" r="10" fill="'+arrowColor+'" opacity="0.9"/>'+
        '<text x="'+rx+'" y="'+(lineY-18)+'" fill="'+arrowColor+'" font-size="11" font-weight="bold" text-anchor="middle" font-family="Nunito">='+result+'</text>':'')+
      /* Jump arrow for addition */
      (op==='+'&&typeof result==='number'&&result>=min&&result<=max?
        '<path d="M '+ax+' '+(lineY-20)+' Q '+((ax+rx)/2)+' '+(lineY-45)+' '+rx+' '+(lineY-20)+'" fill="none" stroke="'+arrowColor+'" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#arrowhead)"/>'+
        '<text x="'+((ax+rx)/2)+'" y="'+(lineY-50)+'" fill="rgba(107,203,119,.7)" font-size="9" text-anchor="middle" font-family="Nunito">+'+b+' steps</text>':'')+
      '<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="'+arrowColor+'"/></marker></defs>'+
      '</svg>'+
      /* Equation display */
      '<div style="text-align:center;margin:10px 0;font-size:24px;font-weight:900">'+
      '<span style="color:#4D96FF">'+a+'</span> '+
      '<span style="color:var(--muted)">'+op+'</span> '+
      '<span style="color:#FFD93D">('+b+')</span> '+
      '<span style="color:var(--muted)">=</span> '+
      '<span style="color:'+arrowColor+'">'+result+'</span>'+
      '</div>'+
      /* Controls */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#4D96FF">a: <b>'+a+'</b></span>'+
      '<input type="range" class="slide" min="-10" max="10" value="'+a+'" oninput="intSet(\'a\',this.value)" style="width:90px">'+
      '<span style="font-size:11px;color:#FFD93D">b: <b>'+b+'</b></span>'+
      '<input type="range" class="slide" min="-10" max="10" value="'+b+'" oninput="intSet(\'b\',this.value)" style="width:90px">'+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      ['+','-','×','÷'].map(function(o){
        return '<button class="cbtn" onclick="intOp(\''+o+'\')" style="'+(o===op?'background:var(--acc);color:white;border-color:var(--acc)':'')+';font-size:14px;font-weight:900">'+o+'</button>';
      }).join('')+
      '</div>';
  }

  window.intSet=function(k,v){ if(k==='a')a=parseInt(v); else b=parseInt(v); render(); };
  window.intOp=function(o){ op=o; render(); };
  render();
};

/* ── 5. PERCENTAGE VISUAL (percentage-sim) ── */
SIM_REGISTRY['percentage-sim'] = function(c) {
  var val=35, total=100, mode='grid';

  function render() {
    var pct=Math.min(100,Math.round(val/total*100));

    /* 10×10 grid */
    var cells='';
    for(var i=0;i<100;i++){
      cells+='<div style="width:20px;height:20px;border-radius:3px;background:'+(i<pct?'var(--acc)':'var(--surface2)')+';border:1px solid var(--bg);transition:background .1s"></div>';
    }

    /* Real world examples */
    var examples=[
      {label:'₹'+total+' bag of rice',saved:'₹'+Math.round(val/total*total)},
      {label:'100km trip',done:Math.round(pct)+'km driven'},
      {label:'Class of '+total+' students',count:pct+' passed'},
    ];

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Percentage Visualiser</div>'+
      /* Big percentage display */
      '<div style="text-align:center;margin-bottom:10px">'+
      '<span style="font-size:48px;font-weight:900;color:var(--acc)">'+pct+'%</span>'+
      '<div style="font-size:13px;color:var(--muted)">'+val+' out of '+total+'</div>'+
      '</div>'+
      /* Grid */
      '<div style="display:grid;grid-template-columns:repeat(10,20px);gap:2px;margin:0 auto 12px;width:218px">'+cells+'</div>'+
      '<div style="font-size:10px;color:var(--muted);text-align:center;margin-bottom:10px">Each square = 1%</div>'+
      /* Sliders */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Value: <b style="color:var(--acc)">'+val+'</b></span>'+
      '<input type="range" class="slide" min="0" max="'+total+'" value="'+val+'" oninput="pctVal(this.value)" style="width:120px">'+
      '<span style="font-size:11px;color:var(--muted)">Total: <b>'+total+'</b></span>'+
      '<input type="range" class="slide" min="10" max="200" step="10" value="'+total+'" oninput="pctTotal(this.value)" style="width:80px">'+
      '</div>'+
      /* Real world examples */
      '<div style="display:flex;flex-direction:column;gap:6px">'+
      examples.map(function(ex){
        var k=Object.keys(ex).filter(function(k){return k!=='label';})[0];
        return '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border-radius:8px;padding:7px 10px;border:1px solid var(--border)">'+
          '<div style="font-size:11px;color:var(--muted);flex:1">'+ex.label+'</div>'+
          '<div style="font-size:12px;font-weight:800;color:var(--acc)">→ '+ex[k]+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">'+
      'Formula: Percentage = (Part ÷ Whole) × 100'+
      '</div>';
  }

  window.pctVal=function(v){ val=parseInt(v); render(); };
  window.pctTotal=function(v){ total=parseInt(v); val=Math.min(val,total); render(); };
  render();
};

/* ── 6. WATER FILTER (water-filter) ── */
SIM_REGISTRY['water-filter'] = function(c) {
  var raf2, t=0, running=false;
  var particles=[];
  var layers=[
    {name:'Gravel',color:'#8B7355',filterSize:12,desc:'Removes large debris, leaves, insects'},
    {name:'Sand',color:'#C8A96A',filterSize:5,desc:'Removes smaller particles and sediment'},
    {name:'Charcoal',color:'#444',filterSize:2,desc:'Absorbs chemicals, colour, bad smell'},
    {name:'Fine Sand',color:'#E8D4A0',filterSize:1,desc:'Removes tiny particles and bacteria'},
  ];
  var filtered=0, total=0;

  function draw(){
    var _g=getCtx('filterCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Filter layers */
    var lh=28, startY=40;
    layers.forEach(function(l,i){
      var ly=startY+i*lh;
      /* Layer background */
      ctx.fillStyle=l.color+'44';
      ctx.fillRect(60,ly,W-120,lh-2);
      ctx.strokeStyle=l.color+'88'; ctx.lineWidth=1;
      ctx.strokeRect(60,ly,W-120,lh-2);
      /* Texture dots */
      ctx.fillStyle=l.color+'88';
      for(var d=0;d<20;d++){
        var dx=65+(d*12)%(W-130), dy=ly+4+d%3*8;
        ctx.beginPath(); ctx.arc(dx,dy,Math.max(1,l.filterSize/4),0,Math.PI*2); ctx.fill();
      }
      /* Label */
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='right';
      ctx.fillText(l.name,56,ly+lh/2+3);
    });

    /* Dirty water input (top) */
    ctx.fillStyle='rgba(139,90,43,0.3)';
    ctx.fillRect(60,10,W-120,32);
    ctx.strokeStyle='rgba(139,90,43,0.5)'; ctx.lineWidth=1; ctx.strokeRect(60,10,W-120,32);
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Dirty water in',W/2,24);

    /* Clean water output (bottom) */
    var cleanY=startY+layers.length*lh+10;
    ctx.fillStyle='rgba(77,150,255,0.2)';
    ctx.fillRect(60,cleanY,W-120,30);
    ctx.strokeStyle='rgba(77,150,255,.5)'; ctx.lineWidth=1; ctx.strokeRect(60,cleanY,W-120,30);
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Clean water out',W/2,cleanY+18);

    /* Particles */
    if(running && Math.random()<0.15){
      var size=3+Math.random()*8;
      particles.push({
        x:70+Math.random()*(W-140),y:12,
        size:size, speed:1.5+Math.random(),
        color:size>8?'#8B6914':size>5?'#CC9944':'rgba(200,200,200,0.6)',
        filtered:false, filterY:0
      });
      total++;
    }

    particles=particles.filter(function(p){
      p.y+=p.speed;
      /* Check each filter layer */
      var filterLayer=layers.find(function(l,i){
        var ly=startY+i*lh;
        return !p.filtered && p.y>=ly && p.size>l.filterSize;
      });
      if(filterLayer){
        p.filtered=true; p.filterY=p.y;
        p.vx=(Math.random()-.5)*2; p.vy=-1;
        filtered++;
      }
      if(p.filtered){ p.x+=p.vx||0; p.y+=p.vy||0; p.alpha=(p.alpha||1)-0.03; }
      if(p.y>H+10||(p.alpha||1)<=0) return false;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size/2,0,Math.PI*2);
      ctx.fillStyle=p.filtered?'rgba(255,107,107,'+(p.alpha||1)+')':p.color;
      ctx.fill();
      return true;
    });

    /* Stats */
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='right';
    if(total>0) ctx.fillText('Filtered: '+filtered+'/'+total+' ('+Math.round(filtered/total*100)+'%)',W-8,H-8);

    if(running) raf2=requestAnimationFrame(draw);
  }

  c.innerHTML=
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Water Filtration System</div>'+
    '<canvas id="filterCanvas" data-w="280" data-h="230" style="border-radius:12px;display:block;width:100%"></canvas>'+
    '<div class="ctrl-row" style="margin-top:8px">'+
    '<button class="cbtn" onclick="filterRun()" id="filterBtn" style="background:var(--life);color:white;border-color:var(--life)">▶ Flow Water</button>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
    'Larger particles get trapped in upper layers. Only clean water passes through all 4 layers.'+
    '</div>';

  window.filterRun=function(){
    running=!running;
    document.getElementById('filterBtn').textContent=running?'⏸ Pause':'▶ Flow Water';
    if(running) draw();
    else cancelAnimationFrame(raf2);
  };
  window.simCleanup=function(){ running=false; cancelAnimationFrame(raf2); };
  draw();
};

/* ── 7. PHOTOSYNTHESIS (photosynthesis-test) ── */
SIM_REGISTRY['photosynthesis-test'] = function(c) {
  var light=70, co2=60, water=80, raf2, t=0;

  function oxygenRate(){ return Math.round((light/100)*(co2/100)*(water/100)*100); }

  function draw(){
    var _g=getCtx('photoCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);

    var rate=oxygenRate();

    /* Sky / background */
    var sky=ctx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,'rgba(77,150,255,0.3)'); sky.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.6);

    /* Sun */
    var sunAlpha=light/100;
    ctx.beginPath(); ctx.arc(W*0.82,H*0.12,22,0,Math.PI*2);
    ctx.fillStyle='rgba(255,217,61,'+sunAlpha+')';
    ctx.shadowColor='#FFD93D'; ctx.shadowBlur=30*sunAlpha;
    ctx.fill(); ctx.shadowBlur=0;

    /* Light rays to leaf */
    ctx.strokeStyle='rgba(255,217,61,'+(sunAlpha*0.5)+')'; ctx.lineWidth=1.5;
    for(var r=0;r<5;r++){
      var angle=-Math.PI*0.6+r*0.15;
      ctx.setLineDash([4,6]);
      ctx.beginPath(); ctx.moveTo(W*0.82,H*0.12);
      ctx.lineTo(W*0.82+Math.cos(angle)*80,H*0.12+Math.sin(angle)*80); ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Leaf */
    ctx.fillStyle='rgba(58,180,58,'+(0.4+rate/200)+')';
    ctx.beginPath();
    ctx.moveTo(W*0.5,H*0.25);
    ctx.bezierCurveTo(W*0.8,H*0.2,W*0.85,H*0.55,W*0.5,H*0.65);
    ctx.bezierCurveTo(W*0.15,H*0.55,W*0.2,H*0.2,W*0.5,H*0.25);
    ctx.fill();
    ctx.strokeStyle='rgba(30,140,30,.6)'; ctx.lineWidth=1.5; ctx.stroke();

    /* Midrib */
    ctx.strokeStyle='rgba(30,120,30,.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.28); ctx.lineTo(W*0.5,H*0.62); ctx.stroke();

    /* Veins */
    ctx.strokeStyle='rgba(30,120,30,.25)'; ctx.lineWidth=1;
    [[-0.12,0.35],[0.12,0.35],[-0.1,0.45],[0.1,0.45],[-0.08,0.55],[0.08,0.55]].forEach(function(v){
      ctx.beginPath(); ctx.moveTo(W*0.5,H*(0.35+(['-0.12,0.35','0.12,0.35'].includes(v.join(','))?0:v[1]>0.4?0.1:0.05)*1));
      ctx.lineTo(W*(0.5+v[0]),H*v[1]); ctx.stroke();
    });

    /* Bubbles (O2) */
    if(rate>20){
      t+=0.04;
      for(var b=0;b<5;b++){
        var bx=W*0.4+b*W*0.05, by=H*0.3+((t*rate/20+b*25)%80);
        var by2=H*0.3-((t*rate/20+b*25)%80);
        if(by2>H*0.1){
          ctx.beginPath(); ctx.arc(bx,by2,3+b*0.5,0,Math.PI*2);
          ctx.strokeStyle='rgba(107,203,119,0.7)'; ctx.lineWidth=1.5;
          ctx.stroke();
          ctx.fillStyle='rgba(107,203,119,0.15)'; ctx.fill();
        }
      }
    }

    /* CO2 arrows in */
    ctx.fillStyle='rgba(255,107,107,'+(co2/100*0.7)+')'; ctx.font='10px sans-serif';
    ctx.fillText('CO₂ →',4,H*0.45);

    /* H2O arrow up */
    ctx.fillStyle='rgba(77,150,255,'+(water/100*0.7)+')';
    ctx.fillText('H₂O ↑',4,H*0.6);

    /* O2 label */
    ctx.fillStyle='rgba(107,203,119,'+Math.min(1,rate/60)+')'; ctx.font='bold 10px Nunito,sans-serif';
    ctx.textAlign='right';
    ctx.fillText('O₂ ↑',W-4,H*0.15);

    /* Rate bar */
    ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(0,H-18,W,18);
    ctx.fillStyle='rgba(107,203,119,0.6)'; ctx.fillRect(0,H-18,W*(rate/100),18);
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Photosynthesis rate: '+rate+'%',W/2,H-5);

    raf2=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Photosynthesis Simulator</div>'+
      '<canvas id="photoCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#FFD93D">☀️ Light: <b>'+light+'%</b></span>'+
      '<input type="range" class="slide" min="0" max="100" value="'+light+'" oninput="photoLight(this.value)" style="width:80px">'+
      '<span style="font-size:11px;color:var(--muted)">CO₂: <b>'+co2+'%</b></span>'+
      '<input type="range" class="slide" min="0" max="100" value="'+co2+'" oninput="photoCO2(this.value)" style="width:60px">'+
      '<span style="font-size:11px;color:#4D96FF">💧 Water: <b>'+water+'%</b></span>'+
      '<input type="range" class="slide" min="0" max="100" value="'+water+'" oninput="photoWater(this.value)" style="width:60px">'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.6">'+
      '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂ · Try setting any slider to 0!'+
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.photoLight=function(v){ light=parseInt(v); cancelAnimationFrame(raf2); render(); };
  window.photoCO2=function(v){ co2=parseInt(v); cancelAnimationFrame(raf2); render(); };
  window.photoWater=function(v){ water=parseInt(v); cancelAnimationFrame(raf2); render(); };
  window.simCleanup=function(){ cancelAnimationFrame(raf2); };
  render();
};

/* ── 8. ARCHIMEDES PRINCIPLE (archimedes) ── */
SIM_REGISTRY['archimedes'] = function(c) {
  var objectDensity=0.5, objectVol=200;
  var waterDensity=1.0;
  var objects=[
    {name:'🪵 Wood',density:0.6,vol:200},{name:'🧊 Ice',density:0.92,vol:180},
    {name:'🪨 Stone',density:2.7,vol:100},{name:'⚙️ Iron',density:7.8,vol:60},
    {name:'🧴 Oil',density:0.8,vol:250},{name:'🏐 Ball',density:0.3,vol:300},
  ];
  var sel=0;

  function render(){
    var obj=objects[sel];
    var d=obj.density, V=obj.vol;
    var weight=d*V*0.01; /* grams, simplified */
    var buoyancy=Math.min(V,V*(d<waterDensity?d/waterDensity:1))*waterDensity*0.01;
    var floats=d<waterDensity;
    var submergedFrac=floats?d/waterDensity:1;
    var netForce=buoyancy-weight;

    /* Visual */
    var W=280, H=200;
    var waterY=H*0.4, tankL=40, tankR=W-40;
    var objR=Math.sqrt(V/Math.PI)*1.2;
    var objY=floats?waterY+objR*(submergedFrac*2-1)*0.5:H*0.72;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Archimedes\' Principle</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">'+
      /* Tank */
      '<rect x="'+tankL+'" y="10" width="'+(tankR-tankL)+'" height="'+(H-20)+'" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2"/>'+
      /* Water */
      '<rect x="'+(tankL+2)+'" y="'+waterY+'" width="'+(tankR-tankL-4)+'" height="'+(H-waterY-22)+'" fill="rgba(77,150,255,.25)"/>'+
      '<line x1="'+(tankL+2)+'" y1="'+waterY+'" x2="'+(tankR-2)+'" y2="'+waterY+'" stroke="rgba(77,150,255,.5)" stroke-width="1.5"/>'+
      /* Object */
      '<circle cx="'+(W/2)+'" cy="'+objY+'" r="'+objR+'" fill="'+obj.color2+'44" stroke="'+(floats?'#6BCB77':'#FF6B6B')+'" stroke-width="2"/>'+
      '<text x="'+(W/2)+'" y="'+(objY+4)+'" fill="white" font-size="16" text-anchor="middle">'+obj.name.split(' ')[0]+'</text>'+
      /* Waterline indicator on object */
      (floats?'<line x1="'+(W/2-objR)+'" y1="'+waterY+'" x2="'+(W/2+objR)+'" y2="'+waterY+'" stroke="rgba(77,150,255,.6)" stroke-width="1.5" stroke-dasharray="3,2"/>':'')+
      /* Force arrows */
      '<line x1="'+(W/2)+'" y1="'+(objY-objR)+'" x2="'+(W/2)+'" y2="'+(objY-objR-30)+'" stroke="#6BCB77" stroke-width="2.5" marker-end="url(#upArr)"/>'+
      '<text x="'+(W/2+6)+'" y="'+(objY-objR-15)+'" fill="#6BCB77" font-size="8" font-family="Nunito">Buoyancy '+(buoyancy.toFixed(1))+'g</text>'+
      '<line x1="'+(W/2)+'" y1="'+(objY+objR)+'" x2="'+(W/2)+'" y2="'+(objY+objR+30)+'" stroke="#FF6B6B" stroke-width="2.5" marker-end="url(#downArr)"/>'+
      '<text x="'+(W/2+6)+'" y="'+(objY+objR+20)+'" fill="#FF6B6B" font-size="8" font-family="Nunito">Weight '+(weight.toFixed(1))+'g</text>'+
      '<defs>'+
      '<marker id="upArr" markerWidth="8" markerHeight="8" refX="4" refY="0" orient="auto"><path d="M0,8 L4,0 L8,8 Z" fill="#6BCB77"/></marker>'+
      '<marker id="downArr" markerWidth="8" markerHeight="8" refX="4" refY="8" orient="auto"><path d="M0,0 L4,8 L8,0 Z" fill="#FF6B6B"/></marker>'+
      '</defs>'+
      /* Status */
      '<text x="'+(W/2)+'" y="'+(H-8)+'" fill="'+(floats?'#6BCB77':'#FF6B6B')+'" font-size="11" font-weight="bold" text-anchor="middle" font-family="Nunito">'+
      (floats?'✅ FLOATS — Buoyancy > Weight':'⬇️ SINKS — Weight > Buoyancy')+
      '</text>'+
      '</svg>'+
      /* Object selector */
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;justify-content:center">'+
      objects.map(function(o,i){
        return '<button onclick="archSel('+i+')" style="padding:4px 8px;border-radius:8px;font-size:11px;border:1.5px solid '+(i===sel?'var(--acc)':'var(--border)')+';background:'+(i===sel?'var(--acc-dim)':'var(--surface2)')+';color:'+(i===sel?'var(--acc)':'var(--muted)')+';cursor:pointer">'+o.name+'</button>';
      }).join('')+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:8px 12px;margin-top:8px;font-size:11px;color:var(--muted);border:1px solid var(--border);line-height:1.8">'+
      '📐 Density: <b style="color:var(--text)">'+obj.density+'g/cm³</b> vs Water: <b>1.0g/cm³</b> · '+
      'Submerged: <b style="color:'+(floats?'#6BCB77':'#FF6B6B')+'">'+Math.round(submergedFrac*100)+'%</b> · '+
      'Net force: <b style="color:'+(netForce>0?'#6BCB77':'#FF6B6B')+'">'+(netForce>0?'+':'')+netForce.toFixed(1)+'g</b>'+
      '</div>';

    /* Add colors */
    objects[0].color2='#8B6914'; objects[1].color2='#A8D8EA'; objects[2].color2='#888';
    objects[3].color2='#B87333'; objects[4].color2='#FFD700'; objects[5].color2='#FF6B6B';
  }

  window.archSel=function(i){ sel=i; render(); };
  render();
};

/* ── 9. FOOD PLATE / NUTRITION (food-plate) ── */
SIM_REGISTRY['food-plate'] = function(c) {
  var portions={grains:2,protein:1,dairy:1,fruits:1,veggies:2,fats:0.5};
  var recommended={grains:3,protein:2,dairy:2,fruits:2,veggies:3,fats:1};
  var foods={
    grains:  {emoji:'🍚', color:'#FFD93D', items:['Rice','Roti','Bread','Oats','Pasta']},
    protein: {emoji:'🥚', color:'#FF6B6B', items:['Eggs','Dal','Chicken','Fish','Paneer']},
    dairy:   {emoji:'🥛', color:'#E8E8E8', items:['Milk','Curd','Cheese','Butter']},
    fruits:  {emoji:'🍎', color:'#FF8C42', items:['Apple','Banana','Orange','Mango']},
    veggies: {emoji:'🥦', color:'#6BCB77', items:['Spinach','Carrot','Broccoli','Tomato']},
    fats:    {emoji:'🧈', color:'#C8945A', items:['Ghee','Nuts','Avocado','Olive oil']},
  };

  function render() {
    var W=220, CX=110, CY=110, R=90;
    var keys=Object.keys(portions);
    var totalParts=Object.values(portions).reduce(function(a,b){return a+b;},0);
    var angle=0;
    var slices=keys.map(function(k){
      var frac=portions[k]/totalParts;
      var start=angle, end=angle+frac*Math.PI*2;
      angle=end;
      var mid=(start+end)/2;
      return {k:k,start:start,end:end,mid:mid,frac:frac};
    });

    var svgSlices=slices.map(function(s){
      var f=foods[s.k];
      var x1=CX+Math.cos(s.start)*R, y1=CY+Math.sin(s.start)*R;
      var x2=CX+Math.cos(s.end)*R, y2=CY+Math.sin(s.end)*R;
      var large=s.end-s.start>Math.PI?1:0;
      var lx=CX+Math.cos(s.mid)*(R*0.65), ly=CY+Math.sin(s.mid)*(R*0.65);
      return '<path d="M '+CX+' '+CY+' L '+x1+' '+y1+' A '+R+' '+R+' 0 '+large+' 1 '+x2+' '+y2+' Z" '+
        'fill="'+f.color+'33" stroke="'+f.color+'88" stroke-width="2"/>'+
        '<text x="'+lx+'" y="'+ly+'" text-anchor="middle" font-size="14">'+f.emoji+'</text>';
    }).join('');

    var totalScore=keys.reduce(function(sum,k){
      return sum+Math.min(1,portions[k]/recommended[k]);
    },0)/keys.length*100;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">My Food Plate</div>'+
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">'+
      '<svg width="'+W+'" height="'+W+'" style="flex-shrink:0">'+
      '<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="#0a0a1a" stroke="rgba(255,255,255,.1)" stroke-width="2"/>'+
      svgSlices+
      '<circle cx="'+CX+'" cy="'+CY+'" r="22" fill="#0a0a1a" stroke="rgba(255,255,255,.1)" stroke-width="1"/>'+
      '<text x="'+CX+'" y="'+(CY+4)+'" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="9" font-family="Nunito">Plate</text>'+
      '</svg>'+
      '<div style="flex:1;font-size:11px">'+
      keys.map(function(k){
        var f=foods[k]; var pct=Math.min(100,Math.round(portions[k]/recommended[k]*100));
        return '<div style="margin-bottom:6px">'+
          '<div style="display:flex;justify-content:space-between;margin-bottom:2px">'+
          '<span style="color:'+f.color+'">'+f.emoji+' '+k+'</span>'+
          '<span style="color:'+(pct>=80?'#6BCB77':pct>=50?'#FFD93D':'#FF6B6B')+'">'+pct+'%</span>'+
          '</div>'+
          '<div style="height:6px;background:var(--surface2);border-radius:3px">'+
          '<div style="height:6px;width:'+pct+'%;background:'+f.color+';border-radius:3px;transition:width .3s"></div>'+
          '</div>'+
          '<input type="range" min="0" max="5" step="0.5" value="'+portions[k]+'" '+
          'oninput="foodPortion(\''+k+'\',this.value)" style="width:100%;height:2px;margin:2px 0">'+
          '</div>';
      }).join('')+
      '</div></div>'+
      '<div style="text-align:center;background:var(--surface2);border-radius:10px;padding:8px;border:1px solid var(--border)">'+
      '<div style="font-size:18px;font-weight:900;color:'+(totalScore>75?'#6BCB77':totalScore>50?'#FFD93D':'#FF6B6B')+'">'+Math.round(totalScore)+'% Balanced</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-top:2px">'+
      (totalScore>80?'🌟 Excellent diet!':totalScore>60?'👍 Good, add more veggies!':'🥗 Try adding more variety!')+
      '</div></div>';
  }

  window.foodPortion=function(k,v){ portions[k]=parseFloat(v); render(); };
  render();
};

/* ── 10. LINEAR GRAPH (linear-graph) ── */
SIM_REGISTRY['linear-graph'] = function(c) {
  var m=2, b=1;

  function render() {
    var W=280, H=240, CX=140, CY=120, scale=20;
    var min=-6, max=6;

    /* Generate points */
    var points=[];
    for(var x=min;x<=max;x++) points.push({x:x,y:m*x+b});

    /* SVG grid + line */
    var gridLines='';
    for(var i=min;i<=max;i++){
      var gx=CX+i*scale, gy=CY+i*scale;
      gridLines+='<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="'+H+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
      gridLines+='<line x1="0" y1="'+gy+'" x2="'+W+'" y2="'+gy+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
      if(i!==0){
        gridLines+='<text x="'+gx+'" y="'+(CY+12)+'" fill="rgba(255,255,255,.2)" font-size="8" text-anchor="middle" font-family="Nunito">'+i+'</text>';
        gridLines+='<text x="'+(CX+4)+'" y="'+(gy+3)+'" fill="rgba(255,255,255,.2)" font-size="8" font-family="Nunito">'+(-i)+'</text>';
      }
    }

    var lineX1=CX+min*scale, lineY1=CY-(m*min+b)*scale;
    var lineX2=CX+max*scale, lineY2=CY-(m*max+b)*scale;

    /* Clamp to canvas */
    lineY1=Math.max(-20,Math.min(H+20,lineY1));
    lineY2=Math.max(-20,Math.min(H+20,lineY2));

    var dotPoints=points.filter(function(p){return p.x>=-5&&p.x<=5;}).map(function(p){
      return '<circle cx="'+(CX+p.x*scale)+'" cy="'+(CY-p.y*scale)+'" r="4" fill="var(--acc)" opacity="0.8"/>';
    }).join('');

    /* Y-intercept highlight */
    var yInt=CY-b*scale;
    var yIntStr=b>=0?'+'+b:''+b;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Linear Graph: y = mx + b</div>'+
      '<div style="text-align:center;font-size:22px;font-weight:900;color:var(--acc);margin-bottom:8px">'+
      'y = <span style="color:#FFD93D">'+m+'</span>x <span style="color:#6BCB77">'+yIntStr+'</span>'+
      '</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%;overflow:hidden">'+
      gridLines+
      /* Axes */
      '<line x1="0" y1="'+CY+'" x2="'+W+'" y2="'+CY+'" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>'+
      '<line x1="'+CX+'" y1="0" x2="'+CX+'" y2="'+H+'" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>'+
      '<text x="'+(W-10)+'" y="'+(CY-6)+'" fill="rgba(255,255,255,.3)" font-size="9" font-family="Nunito">x</text>'+
      '<text x="'+(CX+5)+'" y="10" fill="rgba(255,255,255,.3)" font-size="9" font-family="Nunito">y</text>'+
      /* Line */
      '<line x1="'+lineX1+'" y1="'+lineY1+'" x2="'+lineX2+'" y2="'+lineY2+'" stroke="#C77DFF" stroke-width="2.5"/>'+
      /* Y-intercept */
      '<circle cx="'+CX+'" cy="'+yInt+'" r="6" fill="#6BCB77" stroke="white" stroke-width="1"/>'+
      '<text x="'+(CX+8)+'" y="'+(yInt-5)+'" fill="#6BCB77" font-size="9" font-family="Nunito">y-int='+b+'</text>'+
      dotPoints+
      /* Slope indicator */
      '<line x1="'+CX+'" y1="'+CY+'" x2="'+(CX+scale)+'" y2="'+CY+'" stroke="#FFD93D" stroke-width="1.5" stroke-dasharray="3,2"/>'+
      '<line x1="'+(CX+scale)+'" y1="'+CY+'" x2="'+(CX+scale)+'" y2="'+(CY-m*scale)+'" stroke="#FFD93D" stroke-width="1.5" stroke-dasharray="3,2"/>'+
      '<text x="'+(CX+scale+4)+'" y="'+(CY-m*scale/2)+'" fill="#FFD93D" font-size="9" font-family="Nunito">'+m+'</text>'+
      '</svg>'+
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#FFD93D">Slope m: <b>'+m+'</b></span>'+
      '<input type="range" class="slide" min="-5" max="5" step="0.5" value="'+m+'" oninput="linearM(this.value)" style="width:100px">'+
      '<span style="font-size:11px;color:#6BCB77">Intercept b: <b>'+b+'</b></span>'+
      '<input type="range" class="slide" min="-5" max="5" step="1" value="'+b+'" oninput="linearB(this.value)" style="width:100px">'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      (m>0?'Positive slope → rising line':m<0?'Negative slope → falling line':'m=0 → horizontal line')+' · '+
      'm = rise ÷ run (for every 1 step right, go <b style="color:#FFD93D">'+m+'</b> steps '+(m>0?'up':'down')+')'+
      '</div>';
  }

  window.linearM=function(v){ m=parseFloat(v); render(); };
  window.linearB=function(v){ b=parseFloat(v); render(); };
  render();
};


/* ══════════════════════════════════════
   BATCH 5 — 12 simulations
   ══════════════════════════════════════ */

/* ── 1. CELL VIEW (cell-view) ── */
SIM_REGISTRY['cell-view'] = function(c) {
  var type = 'plant';

  var cells = {
    plant: {
      name: 'Plant Cell', color: '#6BCB77',
      parts: [
        { name:'Cell Wall',      desc:'Rigid outer layer made of cellulose. Gives shape and protection.',    color:'#4a7a30', emoji:'🔲' },
        { name:'Cell Membrane',  desc:'Thin flexible layer inside wall. Controls what enters/exits.',        color:'#6BCB77', emoji:'🫧' },
        { name:'Nucleus',        desc:'Control centre. Contains DNA and instructions for all cell activity.',color:'#C77DFF', emoji:'🔵' },
        { name:'Chloroplast',    desc:'Makes food using sunlight (photosynthesis). Contains green chlorophyll.',color:'#2d7a1e', emoji:'🌿' },
        { name:'Vacuole',        desc:'Large central vacuole stores water, gives the cell its shape.',       color:'#4D96FF', emoji:'💧' },
        { name:'Mitochondria',   desc:'Powerhouse of the cell — produces energy (ATP) from food.',          color:'#FF8C42', emoji:'⚡' },
      ]
    },
    animal: {
      name: 'Animal Cell', color: '#FF6B6B',
      parts: [
        { name:'Cell Membrane',  desc:'Flexible boundary — no rigid wall. Allows cell to change shape.',    color:'#FF6B6B', emoji:'🫧' },
        { name:'Nucleus',        desc:'Contains DNA. Directs all cell activities and reproduction.',         color:'#C77DFF', emoji:'🔵' },
        { name:'Mitochondria',   desc:'Produces energy. Animal cells often have more — they are very active.',color:'#FF8C42', emoji:'⚡' },
        { name:'Lysosome',       desc:'Digests waste and worn-out parts. The cell\'s garbage disposal.',    color:'#FFD93D', emoji:'♻️' },
        { name:'Ribosome',       desc:'Makes proteins following DNA instructions.',                          color:'#C8945A', emoji:'⚙️' },
        { name:'Centriole',      desc:'Unique to animal cells. Helps chromosomes separate during division.', color:'#4D96FF', emoji:'🔩' },
      ]
    }
  };

  var selected = null;

  function render() {
    var cell = cells[type];
    var W = 260, CX = 130, CY = 110;

    /* SVG cell diagram */
    var organelles = '';
    var positions = type === 'plant'
      ? [[CX,CY-20,28],[CX-45,CY+15,12],[CX+35,CY-10,10],[CX-20,CY+30,8],[CX+40,CY+25,8],[CX-40,CY-30,9]]
      : [[CX+10,CY-15,24],[CX-40,CY+10,10],[CX+40,CY+10,8],[CX-15,CY+32,7],[CX+20,CY-38,5],[CX+50,CY-20,6]];

    cell.parts.forEach(function(p, i) {
      var pos = positions[i] || [CX + Math.cos(i)*50, CY + Math.sin(i)*40, 8];
      var isSel = selected === i;
      organelles +=
        '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="' + (pos[2] + (isSel ? 3 : 0)) + '" ' +
        'fill="' + p.color + '" opacity="' + (isSel ? 0.95 : 0.7) + '" ' +
        'style="cursor:pointer" onclick="cellSel(' + i + ')"' +
        (isSel ? ' stroke="white" stroke-width="2"' : '') + '/>';
    });

    c.innerHTML =
      '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px">' +
      ['plant','animal'].map(function(t) {
        return '<button onclick="cellType(\'' + t + '\')" style="padding:6px 14px;border-radius:10px;border:1.5px solid ' +
          (t === type ? cells[t].color : 'var(--border)') + ';background:' +
          (t === type ? cells[t].color + '22' : 'var(--surface2)') + ';color:' +
          (t === type ? cells[t].color : 'var(--muted)') + ';font-size:12px;font-weight:800;cursor:pointer">' +
          (t === 'plant' ? '🌿' : '🐾') + ' ' + cells[t].name + '</button>';
      }).join('') + '</div>' +
      '<svg width="' + W + '" height="220" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">' +
      /* Cell boundary */
      (type === 'plant'
        ? '<rect x="20" y="15" width="220" height="195" rx="8" fill="' + cell.color + '11" stroke="' + cell.color + '66" stroke-width="3"/>' +
          '<rect x="26" y="21" width="208" height="183" rx="5" fill="' + cell.color + '08" stroke="' + cell.color + '33" stroke-width="1.5"/>'
        : '<ellipse cx="' + CX + '" cy="' + CY + '" rx="105" ry="98" fill="' + cell.color + '11" stroke="' + cell.color + '55" stroke-width="2.5"/>') +
      /* Large vacuole for plant */
      (type === 'plant' ? '<ellipse cx="' + CX + '" cy="' + (CY + 20) + '" rx="55" ry="50" fill="rgba(77,150,255,.12)" stroke="rgba(77,150,255,.3)" stroke-width="1.5"/>' : '') +
      organelles +
      /* Labels */
      cell.parts.map(function(p, i) {
        var pos = positions[i] || [CX + Math.cos(i)*50, CY + Math.sin(i)*40, 8];
        return '<text x="' + pos[0] + '" y="' + (pos[1] + pos[2] + 11) + '" fill="' + p.color + '" ' +
          'font-size="7" text-anchor="middle" font-family="Nunito">' + p.name.split(' ')[0] + '</text>';
      }).join('') +
      '</svg>' +
      /* Info panel */
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 12px;margin-top:8px;border:1px solid var(--border);min-height:52px">' +
      (selected !== null
        ? '<div style="font-size:13px;font-weight:900;color:' + cell.parts[selected].color + '">' + cell.parts[selected].emoji + ' ' + cell.parts[selected].name + '</div>' +
          '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:3px">' + cell.parts[selected].desc + '</div>'
        : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px 0">☝️ Tap an organelle to learn about it</div>') +
      '</div>';
  }

  window.cellType = function(t) { type = t; selected = null; render(); };
  window.cellSel = function(i) { selected = selected === i ? null : i; render(); };
  render();
};

/* ── 2. ENERGY TYPES (energy-types) ── */
SIM_REGISTRY['energy-types'] = function(c) {
  var scenario = 0;
  var scenarios = [
    {
      name: '🎢 Roller Coaster', color: '#FF6B6B',
      desc: 'At the top: maximum Potential Energy (PE). As it falls, PE converts to Kinetic Energy (KE). At bottom: maximum KE!',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Track */
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, H*0.2);
        ctx.bezierCurveTo(W*0.3, H*0.2, W*0.4, H*0.85, W*0.5, H*0.85);
        ctx.bezierCurveTo(W*0.6, H*0.85, W*0.7, H*0.3, W*0.8, H*0.3);
        ctx.stroke();
        /* Cart position along track */
        var pos = (Math.sin(t * 0.7) + 1) / 2;
        var cartX = 20 + pos * (W - 40);
        var trackY = pos < 0.5
          ? H*0.2 + (pos/0.5) * (H*0.85 - H*0.2) * Math.sin(pos*Math.PI)
          : H*0.85 - ((pos-0.5)/0.5) * (H*0.85 - H*0.3) * Math.sin((pos-0.5)*Math.PI);
        var height = H*0.85 - trackY;
        var peRatio = height / (H*0.65);
        var keRatio = 1 - peRatio;
        /* Cart */
        ctx.fillStyle = '#FF6B6B'; ctx.shadowColor = '#FF6B6B'; ctx.shadowBlur = 10;
        ctx.fillRect(cartX - 12, trackY - 10, 24, 12);
        ctx.shadowBlur = 0;
        /* Energy bars */
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(8, H*0.05, 18, H*0.88);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(30, H*0.05, 18, H*0.88);
        ctx.fillStyle = '#FFD93D'; ctx.fillRect(8, H*0.05 + (1-peRatio)*H*0.88, 18, peRatio*H*0.88);
        ctx.fillStyle = '#4D96FF'; ctx.fillRect(30, H*0.05 + (1-keRatio)*H*0.88, 18, keRatio*H*0.88);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '8px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('PE', 17, H*0.05 - 4);
        ctx.fillText('KE', 39, H*0.05 - 4);
        ctx.fillText((peRatio*100).toFixed(0)+'%', 17, H*0.93);
        ctx.fillText((keRatio*100).toFixed(0)+'%', 39, H*0.93);
      }
    },
    {
      name: '☀️ Solar Panel', color: '#FFD93D',
      desc: 'Light energy → Electrical energy → Heat/Light/Kinetic. Each conversion loses some energy as heat (2nd law of thermodynamics).',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Sun */
        ctx.beginPath(); ctx.arc(W*0.15, H*0.15, 20, 0, Math.PI*2);
        ctx.fillStyle = '#FFD93D'; ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
        /* Rays */
        for (var r = 0; r < 8; r++) {
          var ra = r/8*Math.PI*2 + t*0.5;
          ctx.strokeStyle = 'rgba(255,217,61,' + (0.4 + Math.sin(t*2+r)*0.2) + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(W*0.15 + Math.cos(ra)*22, H*0.15 + Math.sin(ra)*22);
          ctx.lineTo(W*0.15 + Math.cos(ra)*32, H*0.15 + Math.sin(ra)*32); ctx.stroke();
        }
        /* Solar panel */
        ctx.fillStyle = '#1a3a6a'; ctx.fillRect(W*0.3, H*0.1, W*0.35, H*0.25);
        ctx.strokeStyle = 'rgba(77,150,255,.5)'; ctx.lineWidth = 1;
        for (var row = 0; row < 3; row++) for (var col = 0; col < 4; col++) {
          ctx.strokeRect(W*0.3 + col*(W*0.35/4), H*0.1 + row*(H*0.25/3), W*0.35/4, H*0.25/3);
        }
        /* Light beam to panel */
        var glowAlpha = 0.4 + Math.sin(t*2)*0.2;
        ctx.strokeStyle = 'rgba(255,217,61,' + glowAlpha + ')'; ctx.lineWidth = 3; ctx.setLineDash([5,5]);
        ctx.beginPath(); ctx.moveTo(W*0.15+18, H*0.15); ctx.lineTo(W*0.3, H*0.22); ctx.stroke();
        ctx.setLineDash([]);
        /* Conversion chain */
        var boxes = [{x:W*0.05,y:H*0.5,label:'☀️ Light',color:'#FFD93D'},{x:W*0.35,y:H*0.5,label:'⚡ Electric',color:'#4D96FF'},{x:W*0.65,y:H*0.5,label:'💡 Output',color:'#6BCB77'}];
        boxes.forEach(function(b,i) {
          ctx.fillStyle = b.color + '33'; ctx.fillRect(b.x, b.y, W*0.26, 35);
          ctx.strokeStyle = b.color; ctx.lineWidth = 1.5; ctx.strokeRect(b.x, b.y, W*0.26, 35);
          ctx.fillStyle = b.color; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(b.label, b.x + W*0.13, b.y + 22);
          if (i < 2) {
            ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '14px sans-serif';
            ctx.fillText('→', b.x + W*0.26 + 4, b.y + 22);
          }
        });
        /* Heat lost */
        ctx.fillStyle = 'rgba(255,107,107,.4)'; ctx.font = '9px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🔥 heat lost', W*0.46, H*0.75);
        ctx.fillText('~30% lost', W*0.46, H*0.85);
      }
    },
    {
      name: '🍎 Chemical Energy', color: '#6BCB77',
      desc: 'Food stores chemical energy. Digestion releases it. Cells use it for movement, growth, heat. Energy is never created or destroyed — only converted!',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Apple */
        ctx.fillStyle = '#CC3333'; ctx.beginPath(); ctx.arc(W*0.18, H*0.28, 28, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#22aa22'; ctx.fillRect(W*0.18-3, H*0.28-34, 6, 16);
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(W*0.1, H*0.2, 8, 0, Math.PI*2); ctx.fill();
        /* Energy label */
        ctx.fillStyle = '#FFD93D'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚡ 52 kcal', W*0.18, H*0.56);
        /* Flowing energy particles */
        for (var p = 0; p < 8; p++) {
          var prog = ((t*0.8 + p/8) % 1);
          var px = W*0.28 + prog*(W*0.55); var py = H*0.28 + Math.sin(prog*Math.PI*3)*20;
          ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,217,61,' + (0.8 - prog*0.6) + ')';
          ctx.shadowColor = '#FFD93D'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
        }
        /* Output boxes */
        var outputs = [{y:H*0.12,label:'🏃 Movement',color:'#FF6B6B'},{y:H*0.38,label:'🔥 Heat',color:'#FF8C42'},{y:H*0.62,label:'🧬 Growth',color:'#6BCB77'}];
        outputs.forEach(function(o) {
          ctx.fillStyle = o.color + '22'; ctx.fillRect(W*0.72, o.y, W*0.26, 28);
          ctx.strokeStyle = o.color; ctx.lineWidth = 1; ctx.strokeRect(W*0.72, o.y, W*0.26, 28);
          ctx.fillStyle = o.color; ctx.font = '10px Nunito,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(o.label, W*0.85, o.y + 18);
        });
      }
    }
  ];

  var raf2, t2 = 0;

  function draw() {
    var _g = getCtx('energyCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    scenarios[scenario].animate(ctx, W, H, t2);
    t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var s = scenarios[scenario];
    c.innerHTML =
      '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">' +
      scenarios.map(function(s2, i) {
        return '<button onclick="energySel(' + i + ')" style="padding:5px 10px;border-radius:9px;border:1.5px solid ' +
          (i === scenario ? s2.color : 'var(--border)') + ';background:' +
          (i === scenario ? s2.color + '22' : 'var(--surface2)') + ';color:' +
          (i === scenario ? s2.color : 'var(--muted)') + ';font-size:11px;font-weight:800;cursor:pointer">' + s2.name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="energyCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' + s.desc + '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.energySel = function(i) { cancelAnimationFrame(raf2); scenario = i; render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 3. FIRE TRIANGLE (fire-triangle) ── */
SIM_REGISTRY['fire-triangle'] = function(c) {
  var heat = true, fuel = true, oxygen = true;

  function render() {
    var burning = heat && fuel && oxygen;
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">The Fire Triangle</div>' +
      '<svg width="280" height="200" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">' +
      /* Triangle */
      '<polygon points="140,20 260,190 20,190" fill="' + (burning ? 'rgba(255,107,107,.12)' : 'rgba(255,255,255,.03)') + '" ' +
        'stroke="' + (burning ? '#FF6B6B' : 'rgba(255,255,255,.15)') + '" stroke-width="2"/>' +
      /* Sides labels */
      '<text x="72" y="120" fill="' + (heat ? '#FF8C42' : 'rgba(255,255,255,.2)') + '" font-size="12" font-weight="bold" text-anchor="middle" font-family="Nunito" transform="rotate(-60,72,120)">🔥 HEAT</text>' +
      '<text x="208" y="120" fill="' + (oxygen ? '#4D96FF' : 'rgba(255,255,255,.2)') + '" font-size="12" font-weight="bold" text-anchor="middle" font-family="Nunito" transform="rotate(60,208,120)">💨 OXYGEN</text>' +
      '<text x="140" y="195" fill="' + (fuel ? '#FFD93D' : 'rgba(255,255,255,.2)') + '" font-size="12" font-weight="bold" text-anchor="middle" font-family="Nunito">🪵 FUEL</text>' +
      /* Flame or X in centre */
      '<text x="140" y="120" font-size="' + (burning ? '36' : '28') + '" text-anchor="middle">' + (burning ? '🔥' : '❌') + '</text>' +
      '<text x="140" y="142" fill="' + (burning ? '#FF6B6B' : 'rgba(255,255,255,.3)') + '" font-size="10" font-weight="bold" text-anchor="middle" font-family="Nunito">' +
        (burning ? 'FIRE!' : 'No fire') + '</text>' +
      '</svg>' +
      '<div class="ctrl-row" style="margin-top:10px">' +
      [['heat','🔥 Heat','#FF8C42'], ['fuel','🪵 Fuel','#FFD93D'], ['oxygen','💨 Oxygen','#4D96FF']].map(function(item) {
        var on = eval(item[0]);
        return '<button onclick="fireToggle(\'' + item[0] + '\')" style="padding:8px 12px;border-radius:10px;border:2px solid ' +
          (on ? item[2] : 'var(--border)') + ';background:' + (on ? item[2] + '22' : 'var(--surface2)') +
          ';color:' + (on ? item[2] : 'var(--muted)') + ';font-size:12px;font-weight:800;cursor:pointer;transition:all .2s">' +
          item[1] + ' ' + (on ? 'ON' : 'OFF') + '</button>';
      }).join('') + '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      (burning ? '🔥 All three present — fire burns! Remove any one element to extinguish it.' :
        !heat ? '❄️ No heat source — fire cannot ignite. Water/CO₂ extinguishers remove heat!' :
        !fuel ? '🚫 No fuel — nothing to burn. Firebreaks in forests work this way!' :
        '🌬️ No oxygen — fire goes out. CO₂ extinguishers smother the fire!') +
      '</div>';
  }

  window.fireToggle = function(item) {
    if (item === 'heat') heat = !heat;
    else if (item === 'fuel') fuel = !fuel;
    else oxygen = !oxygen;
    render();
  };
  render();
};

/* ── 4. MEAN/AVERAGE (mean-sim) ── */
SIM_REGISTRY['mean-sim'] = function(c) {
  var data = [4, 7, 3, 9, 5, 6, 8, 2];

  function render() {
    var mean = data.reduce(function(a,b){return a+b;},0) / data.length;
    var sorted = data.slice().sort(function(a,b){return a-b;});
    var mid = Math.floor(data.length/2);
    var median = data.length%2===0 ? (sorted[mid-1]+sorted[mid])/2 : sorted[mid];
    var freq = {}; data.forEach(function(v){freq[v]=(freq[v]||0)+1;});
    var maxF = Math.max.apply(null,Object.values(freq));
    var mode = Object.keys(freq).filter(function(k){return freq[k]===maxF;}).join(', ');
    var max = Math.max.apply(null,data), min = Math.min.apply(null,data);

    var bars = data.map(function(v, i) {
      var h = (v/max)*80;
      var isMean = Math.abs(v-mean) < 0.01;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">' +
        '<div style="font-size:10px;font-weight:800;color:var(--text)">' + v + '</div>' +
        '<div style="width:100%;background:' + (isMean?'var(--math)':'var(--acc)') + ';border-radius:4px 4px 0 0;height:' + h + 'px;cursor:pointer;transition:height .3s" ' +
        'onclick="meanRemove(' + i + ')"></div>' +
        '<div style="font-size:9px;color:var(--muted)">' + (i+1) + '</div>' +
        '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Mean, Median & Mode</div>' +
      /* Bar chart */
      '<div style="display:flex;align-items:flex-end;height:100px;gap:4px;padding:4px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);margin-bottom:8px">' +
      bars + '</div>' +
      /* Mean line indicator */
      '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-align:center">Click a bar to remove it · Add values below</div>' +
      /* Stats */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">' +
      [
        {label:'📊 Mean (Average)', val: mean.toFixed(2), color:'var(--math)', formula:'Sum ÷ Count = ' + data.reduce(function(a,b){return a+b;},0) + ' ÷ ' + data.length},
        {label:'📍 Median (Middle)', val: median, color:'var(--acc)', formula:'Middle value of sorted data'},
        {label:'🔄 Mode (Most frequent)', val: mode, color:'var(--evs)', formula:'Appears ' + maxF + ' time(s)'},
        {label:'📏 Range', val: (max-min), color:'var(--sci)', formula:'Max(' + max + ') − Min(' + min + ')'},
      ].map(function(s) {
        return '<div style="background:var(--surface2);border-radius:10px;padding:8px;border:1px solid var(--border)">' +
          '<div style="font-size:10px;color:var(--muted)">' + s.label + '</div>' +
          '<div style="font-size:20px;font-weight:900;color:' + s.color + '">' + s.val + '</div>' +
          '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + s.formula + '</div>' +
          '</div>';
      }).join('') + '</div>' +
      /* Add value */
      '<div class="ctrl-row">' +
      '<input id="meanInput" type="number" min="1" max="20" placeholder="Add value (1-20)" style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:7px;color:var(--text);font-size:13px">' +
      '<button class="cbtn" onclick="meanAdd()" style="background:var(--acc);color:white;border-color:var(--acc)">+ Add</button>' +
      '<button class="cbtn" onclick="meanReset()">↺ Reset</button>' +
      '</div>';
  }

  window.meanRemove = function(i) { if(data.length > 2) { data.splice(i,1); render(); } };
  window.meanAdd = function() {
    var v = parseInt(document.getElementById('meanInput').value);
    if(v >= 1 && v <= 20 && data.length < 12) { data.push(v); render(); }
  };
  window.meanReset = function() { data = [4,7,3,9,5,6,8,2]; render(); };
  render();
};

/* ── 5. PULLEY SYSTEM (pulley-sim) ── */
SIM_REGISTRY['pulley-sim'] = function(c) {
  var type = 'fixed'; var load = 50; var raf2, t2 = 0;

  var systems = {
    fixed:    { name:'Fixed Pulley',    wheels:1, MA:1, effort:function(l){return l;}, desc:'Changes direction of force only. MA=1, effort = load.' },
    movable:  { name:'Movable Pulley',  wheels:1, MA:2, effort:function(l){return l/2;}, desc:'Halves the effort needed! MA=2. Used in cranes.' },
    compound: { name:'Compound Pulley', wheels:2, MA:4, effort:function(l){return l/4;}, desc:'4× mechanical advantage. MA=4. Lifts very heavy loads easily.' },
  };

  function draw() {
    var _g = getCtx('pulleyCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);

    var sys = systems[type];
    var effort = sys.effort(load);
    var bob = (Math.sin(t2) + 1) / 2;

    /* Ceiling */
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0,0,W,14);
    for (var i = 0; i < W/12; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i*12,0); ctx.lineTo(i*12-10,14); ctx.stroke();
    }

    if (type === 'fixed') {
      /* Single fixed pulley */
      var py = 50, px = W/2;
      ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI*2);
      ctx.fillStyle = '#888'; ctx.fill();
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2);
      ctx.fillStyle = '#555'; ctx.fill();
      /* Ropes */
      var loadY = 80 + bob*60;
      ctx.strokeStyle = '#C8945A'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px-2, py+20); ctx.lineTo(px-2, loadY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+2, py+20); ctx.lineTo(px+2, loadY+100); ctx.stroke();
      /* Load */
      ctx.fillStyle = '#FF6B6B'; ctx.fillRect(px-20, loadY, 40, 30);
      ctx.fillStyle = 'white'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(load+'kg', px, loadY+19);
      /* Effort arrow */
      ctx.fillStyle = '#6BCB77'; ctx.font = '10px Nunito,sans-serif';
      ctx.fillText('↓ ' + effort+'N effort', px+50, loadY+130);
    } else if (type === 'movable') {
      var py2 = 45, px2 = W/2;
      var loadY2 = 100 + bob * 40;
      /* Fixed pulley top */
      ctx.beginPath(); ctx.arc(px2, py2, 18, 0, Math.PI*2);
      ctx.fillStyle = '#888'; ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
      /* Movable pulley with load */
      var mpy = loadY2;
      ctx.beginPath(); ctx.arc(px2, mpy, 18, 0, Math.PI*2);
      ctx.fillStyle = '#666'; ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
      /* Ropes */
      ctx.strokeStyle = '#C8945A'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px2-2,py2+18); ctx.lineTo(px2-2,mpy-18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px2+2,py2+18); ctx.lineTo(px2+2,14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px2-18,mpy); ctx.lineTo(20,mpy); ctx.stroke();
      /* Load */
      ctx.fillStyle = '#FF6B6B'; ctx.fillRect(px2-22, mpy+18, 44, 30);
      ctx.fillStyle = 'white'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(load+'kg', px2, mpy+36);
      /* Labels */
      ctx.fillStyle = '#6BCB77'; ctx.font = '10px Nunito,sans-serif';
      ctx.fillText('↙ '+effort+'N', 55, mpy+10);
    } else {
      /* Compound: 2 fixed + 2 movable */
      var topY = 40;
      [[W*0.35, topY],[W*0.65, topY]].forEach(function(p) {
        ctx.beginPath(); ctx.arc(p[0], p[1], 16, 0, Math.PI*2);
        ctx.fillStyle = '#888'; ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
      });
      var mobY = 110 + bob*30;
      [[W*0.35, mobY],[W*0.65, mobY]].forEach(function(p) {
        ctx.beginPath(); ctx.arc(p[0], p[1], 16, 0, Math.PI*2);
        ctx.fillStyle = '#666'; ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2; ctx.stroke();
      });
      /* Ropes simplified */
      ctx.strokeStyle = '#C8945A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W*0.35,topY+16); ctx.lineTo(W*0.35,mobY-16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.65,topY+16); ctx.lineTo(W*0.65,mobY-16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.35,mobY); ctx.lineTo(W*0.65,mobY); ctx.stroke();
      /* Load bar */
      ctx.fillStyle = '#FF6B6B'; ctx.fillRect(W*0.25, mobY+16, W*0.5, 28);
      ctx.fillStyle = 'white'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(load+'kg load', W/2, mobY+34);
      ctx.fillStyle = '#6BCB77'; ctx.font = '11px Nunito,sans-serif';
      ctx.fillText('Only ' + effort.toFixed(1) + 'N needed!', W/2, H-10);
    }

    /* MA badge */
    ctx.fillStyle = 'rgba(199,125,255,.9)'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('MA = ' + sys.MA, 8, H-8);

    t2 += 0.03;
    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var sys = systems[type];
    c.innerHTML =
      '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">' +
      Object.keys(systems).map(function(k) {
        return '<button onclick="pulleySel(\'' + k + '\')" style="padding:5px 9px;border-radius:9px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ' +
          (k===type?'var(--acc)':'var(--border)') + ';background:' + (k===type?'var(--acc-dim)':'var(--surface2)') + ';color:' + (k===type?'var(--acc)':'var(--muted)') + '">' +
          systems[k].name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="pulleyCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Load: <b style="color:var(--sci)">' + load + 'kg</b></span>' +
      '<input type="range" class="slide" min="10" max="100" step="10" value="' + load + '" oninput="pulleyLoad(this.value)" style="width:120px">' +
      '<span style="font-size:12px;font-weight:800;color:var(--evs)">Effort: ' + sys.effort(load).toFixed(1) + 'N</span>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' + sys.desc + '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.pulleySel = function(k) { cancelAnimationFrame(raf2); type = k; render(); };
  window.pulleyLoad = function(v) { load = parseInt(v); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 6. ACID RAIN (acid-rain) ── */
SIM_REGISTRY['acid-rain'] = function(c) {
  var raf2, t2 = 0, drops = [], damage = 0, running = false;

  function draw() {
    var _g = getCtx('acidCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    /* Sky */
    ctx.fillStyle = 'rgba(60,40,80,0.95)'; ctx.fillRect(0,0,W,H*0.5);
    /* Pollution clouds */
    ctx.fillStyle = 'rgba(80,60,60,0.8)';
    [[W*0.2,H*0.1,50,20],[W*0.55,H*0.08,65,24],[W*0.82,H*0.12,45,18]].forEach(function(cl) {
      ctx.beginPath(); ctx.ellipse(cl[0],cl[1],cl[2],cl[3],0,0,Math.PI*2); ctx.fill();
    });
    /* SO2/NOx labels */
    ctx.fillStyle = 'rgba(255,150,50,.5)'; ctx.font = '9px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SO₂ + NOₓ', W*0.5, H*0.04);

    /* Ground */
    var dmgColor = 'rgba(' + Math.min(255,80+damage*2) + ',' + Math.max(40,120-damage) + ',40,0.9)';
    ctx.fillStyle = dmgColor; ctx.fillRect(0,H*0.5,W,H*0.5);

    /* Buildings / forest */
    [[W*0.1,H*0.5,30,60,'#555'],[W*0.25,H*0.5,25,80,'#666'],[W*0.7,H*0.5,40,50,'#4a7a30']].forEach(function(b,i) {
      var corrosion = Math.min(1, damage/60);
      ctx.fillStyle = i<2 ? 'rgba(' + Math.round(100-corrosion*60) + ',' + Math.round(100-corrosion*60) + ',' + Math.round(120-corrosion*60) + ',0.9)' : 'rgba(' + Math.round(74-corrosion*40) + ',' + Math.round(122-corrosion*60) + ',48,0.9)';
      ctx.fillRect(b[0]-b[2]/2, b[1]-b[3], b[2], b[3]);
    });

    /* pH meter */
    var ph = Math.max(3, 7 - damage/12);
    ctx.fillStyle = ph < 5 ? '#FF6B6B' : ph < 6 ? '#FFD93D' : '#6BCB77';
    ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('pH: ' + ph.toFixed(1) + (ph < 5 ? ' ⚠️ Acid Rain!' : ph < 6 ? ' Slightly acidic' : ' Normal'), 8, H-8);

    /* Raindrops */
    if (running) {
      if (Math.random() < 0.3) drops.push({x: Math.random()*W, y: 0, speed: 3+Math.random()*2});
      drops = drops.filter(function(d) {
        d.y += d.speed;
        ctx.strokeStyle = 'rgba(180,100,200,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-1,d.y-7); ctx.stroke();
        if (d.y > H*0.5) { damage = Math.min(100, damage+0.3); return false; }
        return true;
      });
    }

    t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  c.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Acid Rain Simulation</div>' +
    '<canvas id="acidCanvas" data-w="300" data-h="210" style="border-radius:12px;display:block;width:100%"></canvas>' +
    '<div class="ctrl-row" style="margin-top:8px">' +
    '<button class="cbtn" onclick="acidRain()" id="acidBtn" style="background:var(--acc);color:white;border-color:var(--acc)">🌧️ Start Acid Rain</button>' +
    '<button class="cbtn" onclick="acidReset()">↺ Reset</button>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">' +
    'SO₂ + NOₓ from factories → mix with water vapour → H₂SO₄ and HNO₃ → acid rain (pH < 5.6). Damages forests, buildings, and lakes.' +
    '</div>';

  window.acidRain = function() {
    running = !running;
    document.getElementById('acidBtn').textContent = running ? '⏸ Stop' : '🌧️ Start Acid Rain';
    if (running) draw();
  };
  window.acidReset = function() { damage = 0; drops = []; };
  window.simCleanup = function() { running = false; cancelAnimationFrame(raf2); };
  draw();
};

/* ── 7. MONEY MATHS (money-maths) ── */
SIM_REGISTRY['money-maths'] = function(c) {
  var price = 85, paid = 100;

  function render() {
    var change = paid - price;
    var valid = paid >= price;

    /* Make change breakdown */
    var denominations = [50,20,10,5,2,1];
    var remaining = Math.max(0, change);
    var coins = [];
    denominations.forEach(function(d) {
      var count = Math.floor(remaining/d);
      if (count > 0) { coins.push({val:d,count:count}); remaining -= count*d; }
    });

    var coinEmojis = {50:'🟡',20:'🟠',10:'🟡',5:'⚪',2:'🪙',1:'🔴'};
    var noteEmojis = {50:'💵',20:'💴',10:'💶'};

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">💰 Money & Change Calculator</div>' +
      /* Price tag */
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">' +
      '<div style="flex:1;background:var(--surface2);border-radius:10px;padding:10px;border:1px solid var(--border);text-align:center">' +
      '<div style="font-size:11px;color:var(--muted)">🏷️ Price</div>' +
      '<div style="font-size:28px;font-weight:900;color:var(--sci)">₹' + price + '</div>' +
      '<input type="range" class="slide" min="1" max="200" value="' + price + '" oninput="moneyPrice(this.value)" style="width:100%;margin-top:4px">' +
      '</div>' +
      '<div style="font-size:28px;font-weight:900;color:var(--muted)">→</div>' +
      '<div style="flex:1;background:var(--surface2);border-radius:10px;padding:10px;border:1px solid var(--border);text-align:center">' +
      '<div style="font-size:11px;color:var(--muted)">💳 Paid</div>' +
      '<div style="font-size:28px;font-weight:900;color:var(--math)">₹' + paid + '</div>' +
      '<input type="range" class="slide" min="1" max="500" step="5" value="' + paid + '" oninput="moneyPaid(this.value)" style="width:100%;margin-top:4px">' +
      '</div>' +
      '</div>' +
      /* Change display */
      '<div style="background:' + (valid ? 'var(--evs-dim)' : 'var(--sci-dim)') + ';border:1.5px solid ' + (valid?'var(--evs)':'var(--sci)') + ';border-radius:12px;padding:12px;text-align:center;margin-bottom:10px">' +
      '<div style="font-size:13px;color:var(--muted)">' + (valid ? '💚 Change to return' : '❌ Not enough money!') + '</div>' +
      '<div style="font-size:36px;font-weight:900;color:' + (valid?'var(--evs)':'var(--sci)') + '">₹' + Math.abs(change) + '</div>' +
      (change < 0 ? '<div style="font-size:12px;color:var(--sci)">Need ₹' + Math.abs(change) + ' more</div>' : '') +
      '</div>' +
      /* Coin breakdown */
      (valid && change > 0 ?
        '<div style="background:var(--surface2);border-radius:10px;padding:10px;border:1px solid var(--border)">' +
        '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">Break it down:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        coins.map(function(coin) {
          return '<div style="background:var(--surface);border-radius:8px;padding:5px 8px;border:1px solid var(--border);text-align:center">' +
            '<div style="font-size:14px">' + (coinEmojis[coin.val]||'🪙') + '</div>' +
            '<div style="font-size:10px;font-weight:800;color:var(--text)">₹' + coin.val + ' × ' + coin.count + '</div>' +
            '</div>';
        }).join('') + '</div></div>' : '') +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">Change = Amount paid − Price = ₹' + paid + ' − ₹' + price + ' = ₹' + change + '</div>';
  }

  window.moneyPrice = function(v) { price = parseInt(v); render(); };
  window.moneyPaid = function(v) { paid = parseInt(v); render(); };
  render();
};

/* ── 8. LAND FORMS (landforms-model) ── */
SIM_REGISTRY['landforms-model'] = function(c) {
  var landforms = [
    { name:'🏔️ Mountain', color:'#8B7355',
      desc:'Formed by tectonic plate collision pushing land upward (folding) or volcanic activity. Himalayas formed 50 million years ago when India collided with Asia.',
      example:'Himalayas, Andes, Alps' },
    { name:'🏜️ Desert', color:'#C8A96A',
      desc:'Less than 250mm rain per year. Not always hot — Antarctica is the world\'s largest cold desert. Sand dunes form from wind erosion.',
      example:'Thar Desert (India), Sahara, Gobi' },
    { name:'🌊 Ocean Floor', color:'#1a4a6a',
      desc:'Contains mid-ocean ridges, trenches, and abyssal plains. Mariana Trench (11km deep) could fit Everest inside it!',
      example:'Mariana Trench, Mid-Atlantic Ridge' },
    { name:'🏕️ Plateau', color:'#7a5a2a',
      desc:'Flat-topped elevated land. The Deccan Plateau covers most of peninsular India, formed by ancient lava flows.',
      example:'Deccan Plateau, Tibetan Plateau' },
    { name:'🌾 Plains', color:'#4a8a3a',
      desc:'Flat, low-lying land. Often formed by river deposition. The most fertile land — the Indo-Gangetic Plain feeds over a billion people.',
      example:'Indo-Gangetic Plain, Great Plains (USA)' },
    { name:'🏖️ Coastal', color:'#4D96FF',
      desc:'Where land meets sea. Kerala has 590km of coastline! Coastal landforms include beaches, cliffs, estuaries, and deltas.',
      example:'Kerala coast, Goa beaches, Sundarbans delta' },
  ];

  var sel = 0;

  function render() {
    var l = landforms[sel];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Major Landforms of the World</div>' +
      /* Visual */
      '<div style="background:linear-gradient(135deg,' + l.color + '33,var(--surface2));border-radius:12px;padding:20px;text-align:center;margin-bottom:8px;border:1.5px solid ' + l.color + '44;position:relative;overflow:hidden">' +
      '<div style="font-size:64px;filter:drop-shadow(0 4px 12px ' + l.color + '66)">' + l.name.split(' ')[0] + '</div>' +
      '<div style="font-size:16px;font-weight:900;color:' + l.color + ';margin-top:6px">' + l.name.split(' ').slice(1).join(' ') + '</div>' +
      '</div>' +
      /* Selector */
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      landforms.map(function(lf,i) {
        return '<button onclick="landSel(' + i + ')" style="padding:5px 9px;border-radius:8px;font-size:13px;border:1.5px solid ' +
          (i===sel?lf.color:'var(--border)') + ';background:' + (i===sel?lf.color+'22':'var(--surface2)') + ';cursor:pointer">' + lf.name.split(' ')[0] + '</button>';
      }).join('') + '</div>' +
      /* Info */
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;border:1px solid var(--border)">' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:6px">' + l.desc + '</div>' +
      '<div style="font-size:11px;color:var(--muted)">📍 Examples: <b style="color:var(--text)">' + l.example + '</b></div>' +
      '</div>';
  }

  window.landSel = function(i) { sel = i; render(); };
  render();
};

/* ── 9. SEPARATION METHODS (separation-sim) ── */
SIM_REGISTRY['separation-sim'] = function(c) {
  var method = 'filtration';
  var raf2, t2 = 0;

  var methods = {
    filtration: {
      name:'🔬 Filtration', color:'#4D96FF',
      mixtures:'Sand + Water, Mud + Water',
      desc:'Filter paper traps solid particles. Liquid (filtrate) passes through. Used to purify water.',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Funnel */
        ctx.fillStyle='rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(W*0.25,20); ctx.lineTo(W*0.75,20); ctx.lineTo(W*0.55,H*0.55); ctx.lineTo(W*0.45,H*0.55); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1.5; ctx.stroke();
        /* Filter paper */
        ctx.fillStyle='rgba(200,180,150,.2)';
        ctx.beginPath(); ctx.moveTo(W*0.27,22); ctx.lineTo(W*0.73,22); ctx.lineTo(W*0.54,H*0.53); ctx.lineTo(W*0.46,H*0.53); ctx.closePath(); ctx.fill();
        /* Sand particles in top */
        for(var i=0;i<12;i++) {
          ctx.beginPath(); ctx.arc(W*0.3+i*12+Math.sin(t+i)*3,H*0.2+i*5,3+i%3,0,Math.PI*2);
          ctx.fillStyle='rgba(180,140,80,0.7)'; ctx.fill();
        }
        /* Water dripping through */
        var dropY = (t*60)%(H*0.5-H*0.55+H);
        ctx.beginPath(); ctx.arc(W*0.5, H*0.55+dropY*0.4, 4, 0, Math.PI*2);
        ctx.fillStyle='rgba(77,150,255,0.8)'; ctx.fill();
        /* Beaker below */
        ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2;
        ctx.strokeRect(W*0.35,H*0.6,W*0.3,H*0.3);
        var waterH = Math.min(H*0.28, t*3);
        ctx.fillStyle='rgba(77,150,255,0.3)'; ctx.fillRect(W*0.36,H*0.6+H*0.3-waterH,W*0.28,waterH);
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText('Clear filtrate',W*0.5,H*0.97);
      }
    },
    evaporation: {
      name:'☀️ Evaporation', color:'#FFD93D',
      mixtures:'Salt + Water, Sugar + Water',
      desc:'Heating causes liquid to evaporate, leaving dissolved solid behind. Used to get salt from seawater.',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Evaporating dish */
        ctx.fillStyle='rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.ellipse(W/2,H*0.6,W*0.35,H*0.15,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.stroke();
        /* Saltwater level decreasing */
        var level = Math.max(0, 1 - t/60);
        ctx.fillStyle='rgba(100,180,255,' + (0.3+level*0.2) + ')';
        ctx.beginPath(); ctx.ellipse(W/2,H*0.6,W*0.35*level,H*0.15*level,0,0,Math.PI*2); ctx.fill();
        /* Salt crystals appearing */
        if(level < 0.7) {
          for(var s=0;s<Math.floor((1-level)*15);s++) {
            ctx.fillStyle='rgba(255,255,255,0.9)';
            ctx.fillRect(W*0.35+s*13,H*0.6-4,8,8);
          }
        }
        /* Steam */
        for(var sv=0;sv<5;sv++) {
          var sy = H*0.45 - ((t*30+sv*20)%80);
          ctx.strokeStyle='rgba(77,150,255,' + Math.max(0,(sy-H*0.2)/(H*0.25)*0.5) + ')';
          ctx.lineWidth=2; ctx.setLineDash([3,4]);
          ctx.beginPath(); ctx.moveTo(W*0.35+sv*25,H*0.5); ctx.quadraticCurveTo(W*0.35+sv*25+(sv%2===0?8:-8),sy+20,W*0.35+sv*25,sy); ctx.stroke();
          ctx.setLineDash([]);
        }
        /* Heat source */
        ctx.fillStyle='rgba(255,107,107,.4)';
        ctx.fillRect(W*0.2,H*0.72,W*0.6,12);
        ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText('🔥 Heat source',W/2,H*0.84);
        ctx.fillText('Salt crystals remain after water evaporates',W/2,H*0.96);
      }
    },
    magnetism: {
      name:'🧲 Magnetism', color:'#FF6B6B',
      mixtures:'Iron filings + Sand, Iron + Sawdust',
      desc:'Magnets attract iron but not non-magnetic materials like sand or wood. Quick and clean separation.',
      animate: function(ctx, W, H, t) {
        ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
        /* Mixed pile */
        var mx = W*0.2, my = H*0.6;
        for(var p=0;p<20;p++) {
          var px = mx + Math.cos(p)*30, py = my + Math.sin(p)*15;
          ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2);
          ctx.fillStyle=p%3===0?'rgba(180,180,180,0.8)':'rgba(180,140,80,0.5)'; ctx.fill();
        }
        ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText('Iron+Sand mix',mx,my+28);
        /* Magnet */
        var magX = W*0.5 + Math.sin(t)*W*0.15;
        ctx.fillStyle='#FF6B6B'; ctx.fillRect(magX-15,H*0.15,30,20);
        ctx.fillStyle='#4D96FF'; ctx.fillRect(magX-15,H*0.15+20,30,20);
        ctx.fillStyle='white'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText('N',magX,H*0.15+13); ctx.fillText('S',magX,H*0.15+33);
        /* Iron filings attracted to magnet */
        for(var f=0;f<8;f++) {
          var dist = Math.abs(magX - (mx + Math.cos(f)*30));
          if(dist < 80) {
            var fx = mx + Math.cos(f)*30 + (magX - mx - Math.cos(f)*30)*Math.max(0,(80-dist)/80)*0.8;
            var fy = my + Math.sin(f)*15 - Math.max(0,(80-dist)/80)*30;
            ctx.beginPath(); ctx.arc(fx,fy,3,0,Math.PI*2);
            ctx.fillStyle='rgba(180,180,180,0.9)'; ctx.fill();
          }
        }
        ctx.fillStyle='rgba(255,255,255,.3)'; ctx.textAlign='center';
        ctx.fillText('Sand stays behind',W*0.2,H*0.9);
        ctx.fillText('Iron clings to magnet',W*0.75,H*0.9);
      }
    }
  };

  function draw() {
    var _g=getCtx('sepCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    methods[method].animate(ctx, W, H, t2);
    t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var m = methods[method];
    c.innerHTML =
      '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">' +
      Object.keys(methods).map(function(k) {
        return '<button onclick="sepMethod(\'' + k + '\')" style="padding:5px 9px;border-radius:9px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ' +
          (k===method?methods[k].color:'var(--border)') + ';background:' + (k===method?methods[k].color+'22':'var(--surface2)') +
          ';color:' + (k===method?methods[k].color:'var(--muted)') + '">' + methods[k].name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="sepCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">🧪 Used for: <b style="color:var(--text)">' + m.mixtures + '</b></div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7">' + m.desc + '</div>' +
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.sepMethod = function(k) { cancelAnimationFrame(raf2); method = k; t2 = 0; render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 10. PI MEASUREMENT (pi-measure) ── */
SIM_REGISTRY['pi-measure'] = function(c) {
  var raf2, t2 = 0, rolling = false;

  function draw() {
    var _g = getCtx('piCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);

    var r = 40;
    var circumference = 2 * Math.PI * r;
    var rotations = rolling ? t2 * 0.3 : 0;
    var circleX = 60 + (rolling ? (rotations * circumference) % (W - 120) : 0);
    var circleY = H * 0.5;

    /* Ground line */
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, circleY + r); ctx.lineTo(W-20, circleY + r); ctx.stroke();

    /* Distance markers */
    var totalDist = rotations * circumference;
    var diameters = totalDist / (2*r);
    for (var d = 0; d <= Math.min(diameters, 4); d += 0.5) {
      var mx = 60 + d * 2 * r;
      if (mx < W - 20) {
        ctx.strokeStyle = d % 1 === 0 ? 'rgba(255,217,61,.5)' : 'rgba(255,255,255,.15)';
        ctx.lineWidth = d % 1 === 0 ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(mx, circleY + r); ctx.lineTo(mx, circleY + r + 10); ctx.stroke();
        if (d % 1 === 0 && d > 0) {
          ctx.fillStyle = 'rgba(255,217,61,.7)'; ctx.font = '9px Nunito,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(d + 'd', mx, circleY + r + 22);
        }
      }
    }

    /* Circle */
    ctx.beginPath(); ctx.arc(circleX, circleY, r, 0, Math.PI*2);
    ctx.strokeStyle = '#4D96FF'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(77,150,255,.1)'; ctx.fill();

    /* Diameter line */
    ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(circleX + Math.cos(rotations) * r, circleY + Math.sin(rotations) * r);
    ctx.lineTo(circleX - Math.cos(rotations) * r, circleY - Math.sin(rotations) * r);
    ctx.stroke();

    /* Red dot on circumference */
    var dotAngle = rotations - Math.PI/2;
    ctx.beginPath(); ctx.arc(circleX + Math.cos(dotAngle)*r, circleY + Math.sin(dotAngle)*r, 5, 0, Math.PI*2);
    ctx.fillStyle = '#FF6B6B'; ctx.shadowColor = '#FF6B6B'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;

    /* PI readout */
    var measuredPi = diameters > 0 ? (totalDist / (diameters * 2 * r) * diameters / diameters * Math.PI).toFixed(4) : '?';
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Diameter = ' + (2*r) + 'px  ·  Circumference ≈ ' + circumference.toFixed(1) + 'px', W/2, 16);
    ctx.fillStyle = '#C77DFF'; ctx.font = 'bold 13px Nunito,sans-serif';
    ctx.fillText('C ÷ d = ' + circumference.toFixed(1) + ' ÷ ' + (2*r) + ' = π = 3.14159...', W/2, H - 10);

    if (rolling) t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  c.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Discovering π — Roll a Circle!</div>' +
    '<canvas id="piCanvas" data-w="300" data-h="170" style="border-radius:12px;display:block;width:100%"></canvas>' +
    '<div class="ctrl-row" style="margin-top:8px">' +
    '<button class="cbtn" onclick="piRoll()" id="piBtn" style="background:var(--acc);color:white;border-color:var(--acc)">▶ Roll Circle</button>' +
    '<button class="cbtn" onclick="piReset()">↺ Reset</button>' +
    '</div>' +
    '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
    'No matter how big or small the circle, C ÷ d is <b style="color:#C77DFF">always π = 3.14159...</b> — that\'s why π is irrational and magical! Archimedes first calculated it over 2,200 years ago.' +
    '</div>';

  window.piRoll = function() {
    rolling = !rolling;
    document.getElementById('piBtn').textContent = rolling ? '⏸ Pause' : '▶ Roll Circle';
    if (rolling) draw();
  };
  window.piReset = function() { rolling = false; t2 = 0; document.getElementById('piBtn').textContent = '▶ Roll Circle'; };
  window.simCleanup = function() { cancelAnimationFrame(raf2); rolling = false; };
  draw();
};

/* ── 11. WEATHER INSTRUMENTS (weather-instruments) ── */
SIM_REGISTRY['weather-instruments'] = function(c) {
  var instruments = [
    { name:'🌡️ Thermometer', color:'#FF6B6B',
      desc:'Measures air temperature in °C. Mercury or alcohol expands when heated. Digital thermometers use sensors.',
      interactive:'Drag the slider to simulate temperature change:',
      type:'thermometer' },
    { name:'🌬️ Anemometer', color:'#4D96FF',
      desc:'Measures wind speed in km/h or knots. Cups spin faster in stronger wind. Named after Greek god Anemos.',
      interactive:'Click to simulate wind:',
      type:'anemometer' },
    { name:'🌧️ Rain Gauge', color:'#6BCB77',
      desc:'Measures rainfall in mm. A cylinder collects rain. 1mm rain = 1 litre of water per sq metre of ground.',
      interactive:'Adjust rainfall collected:',
      type:'raingauge' },
    { name:'🧭 Barometer', color:'#FFD93D',
      desc:'Measures atmospheric pressure in hPa. High pressure = clear weather. Low pressure = rain coming!',
      interactive:'Set pressure reading:',
      type:'barometer' },
  ];
  var sel = 0, val = 28, raf2, t2 = 0, spinning = 0;

  function draw() {
    var _g = getCtx('weatherCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
    var inst = instruments[sel];

    if (inst.type === 'thermometer') {
      var temp = val;
      var fillH = ((temp + 10) / 60) * (H*0.7);
      var tempColor = temp < 0 ? '#4D96FF' : temp < 20 ? '#6BCB77' : temp < 35 ? '#FFD93D' : '#FF6B6B';
      /* Tube */
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(W/2-10, H*0.1, 20, H*0.75);
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.strokeRect(W/2-10, H*0.1, 20, H*0.75);
      /* Mercury */
      ctx.fillStyle = tempColor; ctx.fillRect(W/2-8, H*0.1+H*0.75-fillH, 16, fillH);
      /* Bulb */
      ctx.beginPath(); ctx.arc(W/2, H*0.85+12, 16, 0, Math.PI*2);
      ctx.fillStyle = tempColor; ctx.shadowColor = tempColor; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      /* Scale */
      for (var tk = -10; tk <= 50; tk += 10) {
        var ty = H*0.85 - ((tk+10)/60)*(H*0.75);
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(W/2+10, ty); ctx.lineTo(W/2+20, ty); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '9px Nunito,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(tk+'°', W/2+22, ty+3);
      }
      ctx.fillStyle = tempColor; ctx.font = 'bold 18px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(temp + '°C', W/2, H*0.05);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px Nunito,sans-serif';
      ctx.fillText(temp < 15 ? 'Cold ❄️' : temp < 25 ? 'Comfortable 🌤️' : temp < 35 ? 'Warm ☀️' : 'Hot 🔥', W/2, H*0.13);

    } else if (inst.type === 'anemometer') {
      spinning += val * 0.005;
      var cx2 = W/2, cy2 = H/2;
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx2,H*0.1); ctx.lineTo(cx2,H*0.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W*0.1,cy2); ctx.lineTo(W*0.9,cy2); ctx.stroke();
      /* 3 cups */
      [0,1,2].forEach(function(i) {
        var a = spinning + i*(Math.PI*2/3);
        var ex = cx2 + Math.cos(a)*55, ey = cy2 + Math.sin(a)*55;
        ctx.strokeStyle = '#4D96FF'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex,ey,12,a,a+Math.PI);
        ctx.fillStyle = '#4D96FF'; ctx.fill(); ctx.strokeStyle = '#4D96FF'; ctx.stroke();
      });
      /* Centre */
      ctx.beginPath(); ctx.arc(cx2,cy2,8,0,Math.PI*2);
      ctx.fillStyle = '#888'; ctx.fill();
      ctx.fillStyle = '#4D96FF'; ctx.font = 'bold 16px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(val + ' km/h', W/2, H*0.06);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px Nunito,sans-serif';
      ctx.fillText(val < 20 ? 'Light breeze 🍃' : val < 50 ? 'Moderate wind 💨' : 'Strong wind 🌬️', W/2, H*0.14);
      raf2 = requestAnimationFrame(draw);

    } else if (inst.type === 'raingauge') {
      var rainmm = val;
      var fillFrac = rainmm / 100;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(W/2-25, H*0.1, 50, H*0.7);
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.strokeRect(W/2-25, H*0.1, 50, H*0.7);
      ctx.fillStyle = 'rgba(77,150,255,0.5)'; ctx.fillRect(W/2-23, H*0.1+H*0.7*(1-fillFrac), 46, H*0.7*fillFrac);
      for (var mk = 0; mk <= 100; mk += 20) {
        var my = H*0.1+H*0.7*(1-mk/100);
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(W/2+25,my); ctx.lineTo(W/2+32,my); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='8px Nunito,sans-serif'; ctx.textAlign='left';
        ctx.fillText(mk+'mm',W/2+34,my+3);
      }
      ctx.fillStyle='#6BCB77'; ctx.font='bold 18px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(rainmm+'mm',W/2,H*0.06);
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='10px Nunito,sans-serif';
      ctx.fillText(rainmm<10?'Light rain 🌦️':rainmm<50?'Moderate rain 🌧️':'Heavy rain ⛈️',W/2,H*0.14);

    } else if (inst.type === 'barometer') {
      var pressure = 950 + val * 1.5;
      ctx.beginPath(); ctx.arc(W/2,H/2,70,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,.05)'; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=3; ctx.stroke();
      /* Scale markings */
      for(var deg=0;deg<=270;deg+=30){
        var rad=(deg-225)*Math.PI/180;
        var x1=W/2+Math.cos(rad)*58, y1=H/2+Math.sin(rad)*58;
        var x2=W/2+Math.cos(rad)*68, y2=H/2+Math.sin(rad)*68;
        ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        var hPa=950+deg/270*100;
        ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='7px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText(Math.round(hPa),W/2+Math.cos(rad)*78,H/2+Math.sin(rad)*78+3);
      }
      /* Needle */
      var needleAngle=((pressure-950)/100*270-225)*Math.PI/180;
      ctx.strokeStyle='#FFD93D'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(W/2,H/2); ctx.lineTo(W/2+Math.cos(needleAngle)*52,H/2+Math.sin(needleAngle)*52); ctx.stroke();
      ctx.beginPath(); ctx.arc(W/2,H/2,6,0,Math.PI*2); ctx.fillStyle='#FFD93D'; ctx.fill();
      ctx.fillStyle='#FFD93D'; ctx.font='bold 14px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(Math.round(pressure)+'hPa',W/2,H/2+28);
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font='10px Nunito,sans-serif';
      ctx.fillText(pressure<980?'Low pressure — rain likely 🌧️':pressure<1010?'Normal pressure ⛅':'High pressure — fair weather ☀️',W/2,H*0.92);
    }

    if (inst.type !== 'anemometer') raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var inst = instruments[sel];
    c.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      instruments.map(function(ins, i) {
        return '<button onclick="weatherSel(' + i + ')" style="padding:5px 9px;border-radius:9px;font-size:12px;border:1.5px solid ' +
          (i===sel?ins.color:'var(--border)') + ';background:' + (i===sel?ins.color+'22':'var(--surface2)') +
          ';color:' + (i===sel?ins.color:'var(--muted)') + ';cursor:pointer;font-weight:800">' + ins.name + '</button>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:10px;align-items:stretch">' +
      '<canvas id="weatherCanvas" width="180" height="200" style="border-radius:12px;flex-shrink:0"></canvas>' +
      '<div style="flex:1">' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:8px">' + inst.desc + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">' + inst.interactive + '</div>' +
      '<input type="range" class="slide" min="0" max="' + (inst.type==='thermometer'?'50':inst.type==='anemometer'?'100':inst.type==='raingauge'?'100':'66') +
      '" value="' + val + '" oninput="weatherVal(this.value)" style="width:100%">' +
      '</div></div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.weatherSel = function(i) { cancelAnimationFrame(raf2); sel = i; val = 28; t2 = 0; spinning = 0; render(); };
  window.weatherVal = function(v) { val = parseInt(v); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 12. MULTIPLICATION INTRO (multiplication-intro) ── */
SIM_REGISTRY['multiplication-intro'] = function(c) {
  var rows = 3, cols = 4;

  function render() {
    var total = rows * cols;
    var grid = '';
    for (var r = 0; r < rows; r++) {
      for (var col = 0; col < cols; col++) {
        var idx = r * cols + col;
        grid += '<div style="width:36px;height:36px;border-radius:8px;background:var(--acc);' +
          'display:flex;align-items:center;justify-content:center;font-size:18px;' +
          'animation:fadeUp .3s ease ' + (idx*30) + 'ms both">⭐</div>';
      }
    }

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Multiplication as Arrays</div>' +
      '<div style="text-align:center;margin-bottom:10px">' +
      '<span style="font-size:28px;font-weight:900;color:var(--math)">' + rows + '</span>' +
      '<span style="font-size:24px;color:var(--muted);margin:0 6px">×</span>' +
      '<span style="font-size:28px;font-weight:900;color:var(--acc)">' + cols + '</span>' +
      '<span style="font-size:24px;color:var(--muted);margin:0 6px">=</span>' +
      '<span style="font-size:32px;font-weight:900;color:var(--evs)">' + total + '</span>' +
      '</div>' +
      /* Grid */
      '<div style="display:inline-grid;grid-template-columns:repeat(' + cols + ',36px);gap:5px;margin:0 auto 10px;display:grid;justify-content:center">' +
      grid + '</div>' +
      /* Row label */
      '<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:10px">' +
      rows + ' rows of ' + cols + ' stars = ' + total + ' stars total' +
      '</div>' +
      /* Sliders */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--math)">Rows: <b>' + rows + '</b></span>' +
      '<input type="range" class="slide" min="1" max="10" value="' + rows + '" oninput="multiRows(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--acc)">Columns: <b>' + cols + '</b></span>' +
      '<input type="range" class="slide" min="1" max="10" value="' + cols + '" oninput="multiCols(this.value)" style="width:100px">' +
      '</div>' +
      /* Times table */
      '<div style="background:var(--surface2);border-radius:10px;padding:8px;margin-top:8px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:4px">Times table for ' + rows + ':</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px">' +
      Array.from({length:10},function(_,i){
        return '<span style="background:' + ((i+1)===cols?'var(--acc)':'var(--surface)') + ';color:' +
          ((i+1)===cols?'white':'var(--muted)') + ';padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700">' +
          rows + '×' + (i+1) + '=' + (rows*(i+1)) + '</span>';
      }).join('') +
      '</div></div>';
  }

  window.multiRows = function(v) { rows = parseInt(v); render(); };
  window.multiCols = function(v) { cols = parseInt(v); render(); };
  render();
};


/* ══════════════════════════════════════
   BATCH 6 — 14 simulations
   ══════════════════════════════════════ */

/* ── 1. SHAPES HUNT (shapes-hunt) ── */
SIM_REGISTRY['shapes-hunt'] = function(c) {
  var shapes = [
    {name:'Circle',    sides:0,  emoji:'⚪', color:'#FF6B6B', formula:'Area = πr²',        realWorld:'Wheels, coins, sun, pizza'},
    {name:'Triangle',  sides:3,  emoji:'🔺', color:'#FFD93D', formula:'Area = ½ × b × h',  realWorld:'Pyramids, road signs, sandwiches'},
    {name:'Square',    sides:4,  emoji:'🟥', color:'#4D96FF', formula:'Area = s²',          realWorld:'Tiles, chessboard, windows'},
    {name:'Rectangle', sides:4,  emoji:'📱', color:'#6BCB77', formula:'Area = l × w',       realWorld:'Books, doors, screens, bricks'},
    {name:'Pentagon',  sides:5,  emoji:'⭐', color:'#C77DFF', formula:'Area = ½ × P × a',  realWorld:'Home plate in baseball, okra cross-section'},
    {name:'Hexagon',   sides:6,  emoji:'🔷', color:'#FF8C42', formula:'Area = (3√3/2) × s²',realWorld:'Honeycomb, snowflakes, nuts & bolts'},
  ];
  var sel = 0;

  function drawShape(ctx, W, H, s, t) {
    var cx = W/2, cy = H/2, r = Math.min(W,H)*0.32;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Rotating glow */
    var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r+20);
    grad.addColorStop(0, s.color+'33');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = s.color; ctx.lineWidth = 3;
    ctx.fillStyle = s.color + '22';
    ctx.shadowColor = s.color; ctx.shadowBlur = 15;

    if (s.sides === 0) {
      /* Circle */
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      /* Radius line */
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+r,cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('r', cx+r/2, cy-6);
    } else {
      /* Polygon */
      ctx.beginPath();
      for (var i = 0; i <= s.sides; i++) {
        var a = (i/s.sides)*Math.PI*2 - Math.PI/2 + t*0.3;
        var x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.fill(); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    /* Side count dots */
    if (s.sides > 0) {
      ctx.fillStyle = s.color; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
      for (var i = 0; i < s.sides; i++) {
        var a = (i/s.sides + 0.5/s.sides)*Math.PI*2 - Math.PI/2 + t*0.3;
        var mx = cx + Math.cos(a)*(r+16), my = cy + Math.sin(a)*(r+16);
        ctx.beginPath(); ctx.arc(mx,my,3,0,Math.PI*2); ctx.fill();
      }
    }
  }

  var raf2, t2 = 0;

  function animate() {
    var _g = getCtx('shapeCanvas');
    if (!_g) return;
    var ctx = _g.ctx, W = _g.W, H = _g.H;
    t2 += 0.01;
    drawShape(ctx, W, H, shapes[sel], t2);
    raf2 = requestAnimationFrame(animate);
  }

  function renderUI() {
    var s = shapes[sel];
    /* Only rebuild the HTML shell — don't reset innerHTML if canvas already exists */
    var existing = document.getElementById('shapeCanvas');
    if (!existing) {
      c.innerHTML =
        '<div id="shapeButtons" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px"></div>' +
        '<canvas id="shapeCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%;margin:0 auto"></canvas>' +
        '<div id="shapeInfo" style="text-align:center;margin-top:8px"></div>';
    }
    /* Update buttons */
    var btnWrap = document.getElementById('shapeButtons');
    if (btnWrap) btnWrap.innerHTML = shapes.map(function(sh,i) {
      return '<button onclick="shapeSel('+i+')" style="padding:5px 9px;border-radius:9px;font-size:18px;border:1.5px solid '+(i===sel?sh.color:'var(--border)')+';background:'+(i===sel?sh.color+'22':'var(--surface2)')+';cursor:pointer">'+sh.emoji+'</button>';
    }).join('');
    /* Update info panel */
    var infoEl = document.getElementById('shapeInfo');
    if (infoEl) infoEl.innerHTML =
      '<div style="font-size:18px;font-weight:900;color:'+s.color+'">'+s.name+(s.sides>0?' ('+s.sides+' sides)':' (curved)')+'</div>' +
      '<div style="font-size:12px;color:var(--acc);margin:3px 0">📐 '+s.formula+'</div>' +
      '<div style="font-size:11px;color:var(--muted);line-height:1.7">🌍 Found in: '+s.realWorld+'</div>';
  }

  function startAnim() {
    cancelAnimationFrame(raf2);
    /* Reset hiDPI flag so canvas remeasures after UI update */
    var cv = document.getElementById('shapeCanvas');
    if (cv) cv._hiDPIReady = false;
    requestAnimationFrame(function() { requestAnimationFrame(animate); });
  }

  renderUI();
  startAnim();

  window.shapeSel = function(i) {
    sel = i;
    renderUI();   /* only updates buttons + info, keeps canvas intact */
    /* no need to restart animation — it's already running */
  };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
};

/* ── 2. PUSH AND PULL (push-pull) ── */
SIM_REGISTRY['push-pull'] = function(c) {
  var raf2, t2=0, boxes=[];
  var action = null;

  function init() {
    boxes = [
      {x:140, y:80, w:50, h:40, color:'#FF6B6B', label:'Book',   mass:1, vx:0},
      {x:80,  y:160,w:65, h:50, color:'#FFD93D', label:'Chair',  mass:3, vx:0},
      {x:200, y:155,w:45, h:35, color:'#6BCB77', label:'Ball',   mass:0.5,vx:0},
    ];
  }

  function draw() {
    var _g = getCtx('ppCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    /* Floor */
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0, H*0.85, W, H*0.15);
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,H*0.85); ctx.lineTo(W,H*0.85); ctx.stroke();

    /* Boxes */
    boxes.forEach(function(b) {
      b.vx *= 0.92;
      b.x += b.vx;
      if (b.x < 10) { b.x = 10; b.vx = Math.abs(b.vx)*0.5; }
      if (b.x + b.w > W-10) { b.x = W-10-b.w; b.vx = -Math.abs(b.vx)*0.5; }

      ctx.fillStyle = b.color + '33';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x+b.w/2, b.y+b.h/2+4);

      /* Show velocity arrows */
      if (Math.abs(b.vx) > 0.5) {
        var dir = b.vx > 0 ? 1 : -1;
        ctx.strokeStyle = '#FFD93D'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w/2, b.y - 10);
        ctx.lineTo(b.x + b.w/2 + dir*20, b.y - 10);
        ctx.stroke();
        ctx.fillStyle = '#FFD93D'; ctx.font = '14px sans-serif';
        ctx.fillText(dir > 0 ? '→' : '←', b.x + b.w/2 + dir*25, b.y-6);
      }
    });

    /* Force labels */
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Click a box to PUSH it! Or pull it back.', W/2, H*0.92);

    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    init();
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Push & Pull Forces</div>' +
      '<canvas id="ppCanvas" data-w="300" data-h="210" style="border-radius:12px;display:block;width:100%;cursor:pointer"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="ppPush(0)" style="background:var(--sci);color:white;border-color:var(--sci)">📘 Push Book →</button>' +
      '<button class="cbtn" onclick="ppPush(1)" style="background:var(--math);color:white;border-color:var(--math)">🪑 Push Chair →</button>' +
      '<button class="cbtn" onclick="ppPush(2)" style="background:var(--evs);color:white;border-color:var(--evs)">⚽ Kick Ball →</button>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:6px">' +
      '<button class="cbtn" onclick="ppReset()">↺ Reset</button>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '⬛ Heavier objects need more force to move (Newton\'s 2nd Law: F = ma). The ball moves fastest — least mass!' +
      '</div>';
    cancelAnimationFrame(raf2); draw();

    document.getElementById('ppCanvas').addEventListener('click', function(e) {
      var rect = e.target.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      boxes.forEach(function(b) {
        if (mx > b.x && mx < b.x+b.w && my > b.y && my < b.y+b.h) {
          b.vx += (mx > b.x+b.w/2 ? 1 : -1) * (8/b.mass);
        }
      });
    });
  }

  window.ppPush = function(i) { boxes[i].vx += 8/boxes[i].mass; };
  window.ppReset = function() { init(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 3. ADDITION OBJECTS (addition-objects) ── */
SIM_REGISTRY['addition-objects'] = function(c) {
  var a=4, b=3, emoji='🍎';
  var emojiOptions = ['🍎','🍌','⭐','🔵','🎈','🐾','🌸','🍕'];

  function render() {
    var total = a + b;
    var groupA = Array.from({length:a}, function() { return '<span style="font-size:28px;animation:fadeUp .3s ease">' + emoji + '</span>'; }).join('');
    var groupB = Array.from({length:b}, function() { return '<span style="font-size:28px;animation:fadeUp .3s ease">' + emoji + '</span>'; }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Addition — Counting Objects</div>' +
      /* Equation */
      '<div style="text-align:center;font-size:32px;font-weight:900;margin-bottom:10px">' +
      '<span style="color:var(--sci)">' + a + '</span>' +
      '<span style="color:var(--muted);margin:0 8px">+</span>' +
      '<span style="color:var(--math)">' + b + '</span>' +
      '<span style="color:var(--muted);margin:0 8px">=</span>' +
      '<span style="color:var(--evs)">' + total + '</span>' +
      '</div>' +
      /* Object groups */
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;justify-content:center">' +
      '<div style="background:var(--sci-dim);border:2px solid var(--sci);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:4px;min-width:80px;justify-content:center">' + groupA + '</div>' +
      '<div style="font-size:28px;color:var(--muted)">+</div>' +
      '<div style="background:var(--math-dim);border:2px solid var(--math);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:4px;min-width:80px;justify-content:center">' + groupB + '</div>' +
      '<div style="font-size:28px;color:var(--muted)">=</div>' +
      '<div style="background:var(--evs-dim);border:2px solid var(--evs);border-radius:12px;padding:10px;display:flex;flex-wrap:wrap;gap:4px;min-width:80px;justify-content:center">' +
      Array.from({length:total}, function() { return '<span style="font-size:28px">' + emoji + '</span>'; }).join('') +
      '</div></div>' +
      /* Controls */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
      '<span style="font-size:11px;color:var(--sci)">Group A: <b>' + a + '</b></span>' +
      '<input type="range" class="slide" min="0" max="10" value="' + a + '" oninput="addA(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--math)">Group B: <b>' + b + '</b></span>' +
      '<input type="range" class="slide" min="0" max="10" value="' + b + '" oninput="addB(this.value)" style="width:100px">' +
      '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center">' +
      emojiOptions.map(function(e) {
        return '<button onclick="addEmoji(\'' + e + '\')" style="font-size:20px;width:36px;height:36px;border-radius:8px;border:2px solid '+(e===emoji?'var(--acc)':'var(--border)')+';background:'+(e===emoji?'var(--acc-dim)':'var(--surface2)')+';cursor:pointer">' + e + '</button>';
      }).join('') + '</div>';
  }

  window.addA = function(v) { a=parseInt(v); render(); };
  window.addB = function(v) { b=parseInt(v); render(); };
  window.addEmoji = function(e) { emoji=e; render(); };
  render();
};

/* ── 4. SUBTRACTION OBJECTS (subtraction-objects) ── */
SIM_REGISTRY['subtraction-objects'] = function(c) {
  var total=8, take=3;

  function render() {
    var left = total - take;
    var items = Array.from({length:total}, function(_,i) {
      var taken = i < take;
      return '<span style="font-size:26px;opacity:'+(taken?0.2:1)+';position:relative">' +
        '🍪' + (taken ? '<span style="position:absolute;top:0;left:0;font-size:22px;opacity:0.8">❌</span>' : '') +
        '</span>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Subtraction — Taking Away</div>' +
      '<div style="text-align:center;font-size:32px;font-weight:900;margin-bottom:10px">' +
      '<span style="color:var(--math)">' + total + '</span>' +
      '<span style="color:var(--sci);margin:0 8px">−</span>' +
      '<span style="color:var(--sci)">' + take + '</span>' +
      '<span style="color:var(--muted);margin:0 8px">=</span>' +
      '<span style="color:var(--evs)">' + left + '</span>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid var(--border)">' +
      items + '</div>' +
      '<div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:10px">' +
      take + ' cookies eaten ❌ · ' + left + ' cookies left 🍪' +
      '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--math)">Total: <b>' + total + '</b></span>' +
      '<input type="range" class="slide" min="1" max="12" value="' + total + '" oninput="subTotal(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--sci)">Take away: <b>' + take + '</b></span>' +
      '<input type="range" class="slide" min="0" max="' + total + '" value="' + take + '" oninput="subTake(this.value)" style="width:100px">' +
      '</div>' +
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:8px;margin-top:8px;font-size:11px;color:var(--muted);line-height:1.7">' +
      '💡 Subtraction checks: ' + left + ' + ' + take + ' = ' + total + ' ✅ Addition and subtraction are opposites!' +
      '</div>';
  }

  window.subTotal = function(v) { total=parseInt(v); take=Math.min(take,total); render(); };
  window.subTake = function(v) { take=Math.min(parseInt(v),total); render(); };
  render();
};

/* ── 5. DIVISION SHARING (division-sharing) ── */
SIM_REGISTRY['division-sharing'] = function(c) {
  var total=12, groups=3;

  function render() {
    var perGroup = Math.floor(total/groups);
    var remainder = total % groups;
    var cols = Math.min(groups, 4);
    var groupDivs = Array.from({length:groups}, function(_,g) {
      var items = Array.from({length:perGroup + (g < remainder ? 1 : 0)}, function() {
        return '<span style="font-size:22px">🍬</span>';
      }).join('');
      return '<div style="background:var(--surface2);border:1.5px solid var(--acc)44;border-radius:10px;padding:8px;text-align:center;min-width:60px">' +
        '<div style="font-size:10px;font-weight:800;color:var(--muted);margin-bottom:4px">Group ' + (g+1) + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center">' + items + '</div>' +
        '<div style="font-size:11px;font-weight:800;color:var(--acc);margin-top:4px">' + (perGroup + (g<remainder?1:0)) + '</div>' +
        '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Division — Sharing Equally</div>' +
      '<div style="text-align:center;font-size:30px;font-weight:900;margin-bottom:10px">' +
      '<span style="color:var(--math)">' + total + '</span>' +
      '<span style="color:var(--muted);margin:0 8px">÷</span>' +
      '<span style="color:var(--sci)">' + groups + '</span>' +
      '<span style="color:var(--muted);margin:0 8px">=</span>' +
      '<span style="color:var(--evs)">' + perGroup + '</span>' +
      (remainder > 0 ? '<span style="color:var(--muted);margin:0 4px;font-size:18px"> remainder </span><span style="color:var(--sci);font-size:22px">' + remainder + '</span>' : '') +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:10px">' + groupDivs + '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--math)">Total sweets: <b>' + total + '</b></span>' +
      '<input type="range" class="slide" min="1" max="20" value="' + total + '" oninput="divTotal(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--sci)">Groups: <b>' + groups + '</b></span>' +
      '<input type="range" class="slide" min="1" max="6" value="' + groups + '" oninput="divGroups(this.value)" style="width:80px">' +
      '</div>' +
      (remainder > 0 ? '<div style="background:var(--sci-dim);border:1px solid var(--sci)44;border-radius:10px;padding:8px;margin-top:8px;font-size:12px;color:var(--text);text-align:center">Remainder ' + remainder + ' — ' + total + ' does not divide evenly into ' + groups + ' groups</div>' : '');
  }

  window.divTotal = function(v) { total=parseInt(v); render(); };
  window.divGroups = function(v) { groups=Math.max(1,parseInt(v)); render(); };
  render();
};

/* ── 6. COUNT OBJECTS (count-objects) ── */
SIM_REGISTRY['count-objects'] = function(c) {
  var count=3+Math.floor(Math.random()*8), mode='count', userAnswer='', revealed=false;
  var emojis = ['🐸','🦋','🌟','🐠','🐶','🐱','🐻','🐼'];
  var currentEmoji = '🐸';
  var positions = [];

  function generatePositions(n) {
    positions = [];
    for (var i = 0; i < n; i++) {
      positions.push({
        x: 10 + Math.random()*78,
        y: 10 + Math.random()*78,
        size: 22 + Math.random()*12,
      });
    }
  }

  function render() {
    if (!positions.length || positions.length !== count) generatePositions(count);
    var items = positions.map(function(p) {
      return '<span style="position:absolute;left:'+p.x+'%;top:'+p.y+'%;font-size:'+p.size+'px;transform:translate(-50%,-50%)">' + currentEmoji + '</span>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Counting Fun!</div>' +
      /* Emoji selector */
      '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:8px">' +
      emojis.map(function(e) {
        return '<button onclick="countEmoji(\'' + e + '\')" style="font-size:18px;width:32px;height:32px;border-radius:8px;border:1.5px solid '+(e===currentEmoji?'var(--acc)':'var(--border)')+';background:'+(e===currentEmoji?'var(--acc-dim)':'var(--surface2)')+';cursor:pointer">' + e + '</button>';
      }).join('') + '</div>' +
      /* Scatter field */
      '<div style="position:relative;width:100%;height:140px;background:var(--surface2);border-radius:12px;border:1px solid var(--border);overflow:hidden;margin-bottom:8px">' +
      items + '</div>' +
      /* Answer area */
      (revealed
        ? '<div style="text-align:center;font-size:24px;font-weight:900;color:var(--evs);margin-bottom:8px">There are <span style="font-size:36px">' + count + '</span> ' + currentEmoji + '</div>'
        : '<div class="ctrl-row" style="margin-bottom:8px">' +
          '<span style="font-size:13px;color:var(--text)">How many ' + currentEmoji + ' do you count?</span>' +
          '<input id="countAnswer" type="number" min="0" max="20" style="width:60px;background:var(--surface);border:1.5px solid var(--acc);border-radius:8px;padding:6px;color:var(--text);font-size:16px;font-weight:900;text-align:center">' +
          '<button class="cbtn" onclick="countCheck()" style="background:var(--acc);color:white;border-color:var(--acc)">Check!</button>' +
          '</div>'
      ) +
      '<div class="ctrl-row">' +
      '<button class="cbtn" onclick="countNew()" style="background:var(--evs);color:white;border-color:var(--evs)">🔀 New Game</button>' +
      '<button class="cbtn" onclick="countReveal()">👁️ Reveal</button>' +
      '</div>';
  }

  window.countEmoji = function(e) { currentEmoji=e; count=3+Math.floor(Math.random()*10); generatePositions(count); revealed=false; userAnswer=''; render(); };
  window.countNew = function() { count=3+Math.floor(Math.random()*10); generatePositions(count); revealed=false; render(); };
  window.countReveal = function() { revealed=true; render(); };
  window.countSet = function(v) { count=parseInt(v); generatePositions(count); revealed=false; render(); };
  window.countCheck = function() {
    var ans = parseInt(document.getElementById('countAnswer').value);
    if (ans === count) {
      alert('✅ Correct! There are ' + count + ' ' + currentEmoji);
    } else {
      alert('❌ Not quite! Try counting again carefully.');
    }
  };
  generatePositions(count);
  render();
};

/* ── 7. PLACE VALUE (place-value) ── */
SIM_REGISTRY['place-value'] = function(c) {
  var number = 346;

  function render() {
    var n = Math.max(0, Math.min(9999, number));
    var thousands = Math.floor(n/1000);
    var hundreds = Math.floor((n%1000)/100);
    var tens = Math.floor((n%100)/10);
    var ones = n%10;

    function blocks(count, color, label, size) {
      return '<div style="text-align:center">' +
        '<div style="font-size:9px;font-weight:800;color:'+color+';margin-bottom:4px;text-transform:uppercase">'+label+'</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;min-height:30px;align-items:center">' +
        (count > 0 ? Array.from({length:count}, function() {
          return '<div style="width:'+size+'px;height:'+size+'px;background:'+color+';border-radius:2px;opacity:0.85"></div>';
        }).join('') : '<span style="color:var(--muted);font-size:11px">0</span>') +
        '</div>' +
        '<div style="font-size:20px;font-weight:900;color:'+color+';margin-top:4px">'+count+'</div>' +
        '</div>';
    }

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Place Value</div>' +
      /* Large number display */
      '<div style="text-align:center;margin-bottom:10px;display:flex;justify-content:center;gap:4px">' +
      [
        {d:thousands, color:'#C77DFF', place:'Thousands'},
        {d:hundreds,  color:'#FF6B6B', place:'Hundreds'},
        {d:tens,      color:'#FFD93D', place:'Tens'},
        {d:ones,      color:'#6BCB77', place:'Ones'},
      ].filter(function(_,i){ return n >= [1000,100,10,1][i]; }).map(function(p) {
        return '<div style="text-align:center">' +
          '<div style="font-size:42px;font-weight:900;color:'+p.color+';line-height:1;border-bottom:3px solid '+p.color+'22">'+p.d+'</div>' +
          '<div style="font-size:8px;color:'+p.color+';opacity:.7">'+p.place+'</div>' +
          '</div>';
      }).join('<div style="font-size:32px;font-weight:900;color:var(--border);align-self:center;margin-bottom:12px">,</div>') +
      '</div>' +
      /* Block grid */
      '<div style="display:flex;gap:10px;justify-content:center;background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border);flex-wrap:wrap">' +
      (thousands > 0 ? blocks(thousands,'#C77DFF','Thousands',18) : '') +
      blocks(hundreds,'#FF6B6B','Hundreds',14) +
      blocks(tens,'#FFD93D','Tens',10) +
      blocks(ones,'#6BCB77','Ones',8) +
      '</div>' +
      /* Expanded form */
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;color:var(--text);text-align:center;line-height:1.8;margin-bottom:10px">' +
      (thousands>0?'<span style="color:#C77DFF">'+thousands+'×1000</span> + ':'') +
      (hundreds>0?'<span style="color:#FF6B6B">'+hundreds+'×100</span> + ':'') +
      (tens>0?'<span style="color:#FFD93D">'+tens+'×10</span> + ':'') +
      '<span style="color:#6BCB77">'+ones+'×1</span> = <b>'+n+'</b>' +
      '</div>' +
      '<div class="ctrl-row">' +
      '<span style="font-size:11px;color:var(--muted)">Number:</span>' +
      '<input type="number" min="0" max="9999" value="'+n+'" onchange="placeVal(this.value)" style="width:80px;background:var(--surface);border:1.5px solid var(--acc);border-radius:8px;padding:6px;color:var(--text);font-size:16px;font-weight:900;text-align:center">' +
      '<input type="range" class="slide" min="0" max="999" value="'+Math.min(n,999)+'" oninput="placeVal(this.value)" style="width:120px">' +
      '</div>';
  }

  window.placeVal = function(v) { number=parseInt(v)||0; render(); };
  render();
};

/* ── 8. DECIMAL INTRO (decimal-intro) ── */
SIM_REGISTRY['decimal-intro'] = function(c) {
  var whole=1, tenths=3, hundredths=5;

  function render() {
    var value = whole + tenths/10 + hundredths/100;

    /* 10×10 grid for 1 whole */
    var gridCells = '';
    var filledCount = Math.round(value * 100);
    for (var i = 0; i < 100; i++) {
      var color = i < whole*100 ? 'var(--acc)' : i < filledCount ? 'var(--math)' : 'var(--surface2)';
      gridCells += '<div style="width:18px;height:18px;background:'+color+';border:1px solid var(--bg);border-radius:2px;transition:background .2s"></div>';
    }

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Understanding Decimals</div>' +
      '<div style="text-align:center;font-size:40px;font-weight:900;margin-bottom:8px">' +
      '<span style="color:var(--acc)">' + whole + '</span>' +
      '<span style="color:var(--muted)">.</span>' +
      '<span style="color:var(--math)">' + tenths + '</span>' +
      '<span style="color:var(--evs)">' + hundredths + '</span>' +
      '</div>' +
      /* Place value labels */
      '<div style="display:flex;justify-content:center;gap:4px;margin-bottom:10px;font-size:10px">' +
      '<div style="text-align:center;padding:4px 10px;background:var(--acc-dim);border-radius:6px;color:var(--acc);font-weight:800">'+whole+'<br>Ones</div>' +
      '<div style="text-align:center;padding:4px 10px;font-size:16px;font-weight:900;color:var(--muted);align-self:center">.</div>' +
      '<div style="text-align:center;padding:4px 10px;background:var(--math-dim);border-radius:6px;color:var(--math);font-weight:800">'+tenths+'<br>Tenths</div>' +
      '<div style="text-align:center;padding:4px 10px;background:var(--evs-dim);border-radius:6px;color:var(--evs);font-weight:800">'+hundredths+'<br>Hundredths</div>' +
      '</div>' +
      /* 100-cell grid */
      '<div style="display:grid;grid-template-columns:repeat(10,18px);gap:2px;margin:0 auto 8px;width:200px">' + gridCells + '</div>' +
      '<div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:8px">' +
      '<span style="color:var(--acc)">■ ' + whole*100 + ' whole cells</span> + <span style="color:var(--math)">■ ' + (filledCount-whole*100) + ' decimal cells</span> out of 100' +
      '</div>' +
      /* Sliders */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--acc)">Ones: <b>' + whole + '</b></span>' +
      '<input type="range" class="slide" min="0" max="1" value="' + whole + '" oninput="decWhole(this.value)" style="width:60px">' +
      '<span style="font-size:11px;color:var(--math)">Tenths: <b>' + tenths + '</b></span>' +
      '<input type="range" class="slide" min="0" max="9" value="' + tenths + '" oninput="decTenths(this.value)" style="width:80px">' +
      '<span style="font-size:11px;color:var(--evs)">Hundredths: <b>' + hundredths + '</b></span>' +
      '<input type="range" class="slide" min="0" max="9" value="' + hundredths + '" oninput="decHundredths(this.value)" style="width:80px">' +
      '</div>';
  }

  window.decWhole = function(v) { whole=parseInt(v); render(); };
  window.decTenths = function(v) { tenths=parseInt(v); render(); };
  window.decHundredths = function(v) { hundredths=parseInt(v); render(); };
  render();
};

/* ── 9. SOIL PROFILE (soil-profile) ── */
SIM_REGISTRY['soil-profile'] = function(c) {
  var selectedLayer = null;
  var layers = [
    { name:'O — Organic Horizon', depth:'0–5 cm',  color:'#2d1f0e', textColor:'#C8945A',
      desc:'Decomposing leaves, twigs, and organic matter. Rich in fungi and bacteria. Provides nutrients to plants below.', emoji:'🍂' },
    { name:'A — Topsoil',         depth:'5–30 cm', color:'#3a2a14', textColor:'#8B6914',
      desc:'Dark, rich in humus and minerals. Where most plant roots grow. Most fertile layer — farming depends on it!', emoji:'🌱' },
    { name:'B — Subsoil',         depth:'30–60 cm',color:'#7a5a2a', textColor:'#FFD93D',
      desc:'Contains clay, iron oxides, and leached minerals from above. Fewer roots. Less organic matter.', emoji:'🪨' },
    { name:'C — Parent Material', depth:'60–100 cm',color:'#9a8060', textColor:'#E8D4A0',
      desc:'Partially weathered rock. The original material from which soil forms over thousands of years.', emoji:'🗿' },
    { name:'R — Bedrock',         depth:'>100 cm', color:'#555',    textColor:'#aaa',
      desc:'Solid unweathered rock. Granite, limestone, basalt etc. The foundation of all soil above it.', emoji:'⛰️' },
  ];

  function render() {
    var profileSVG = '<svg width="130" height="260" style="flex-shrink:0;border-radius:8px;overflow:hidden">';
    var hs = [28,60,55,55,52];
    var y = 0;
    layers.forEach(function(l,i) {
      profileSVG +=
        '<rect x="0" y="' + y + '" width="130" height="' + hs[i] + '" fill="' + l.color + '" ' +
        'style="cursor:pointer" onclick="soilSel(' + i + ')"/>' +
        (selectedLayer===i ? '<rect x="0" y="'+y+'" width="4" height="'+hs[i]+'" fill="'+l.textColor+'"/>' : '') +
        '<text x="10" y="' + (y+hs[i]/2+4) + '" fill="' + l.textColor + '" font-size="10" font-weight="bold" font-family="Nunito">' + l.emoji + ' ' + l.name.split('—')[0] + '</text>' +
        '<text x="10" y="' + (y+hs[i]/2+16) + '" fill="rgba(255,255,255,.3)" font-size="8" font-family="Nunito">' + l.depth + '</text>';
      y += hs[i];
    });
    profileSVG += '</svg>';

    var info = selectedLayer !== null
      ? '<div style="background:'+layers[selectedLayer].color+'33;border:1.5px solid '+layers[selectedLayer].textColor+'44;border-radius:12px;padding:12px 14px">' +
        '<div style="font-size:15px;font-weight:900;color:'+layers[selectedLayer].textColor+'">'+layers[selectedLayer].emoji+' '+layers[selectedLayer].name+'</div>' +
        '<div style="font-size:11px;color:var(--muted);margin:3px 0">Depth: '+layers[selectedLayer].depth+'</div>' +
        '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:5px">'+layers[selectedLayer].desc+'</div>' +
        '</div>'
      : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:16px">☝️ Tap a layer to learn about it</div>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Soil Profile — Layers of the Earth</div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start">' + profileSVG +
      '<div style="flex:1">' + info + '</div></div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">' +
      '1cm of topsoil takes ~500 years to form! Erosion can destroy it in minutes. The basis of all food we eat.' +
      '</div>';
  }

  window.soilSel = function(i) { selectedLayer = selectedLayer===i?null:i; render(); };
  render();
};

/* ── 10. PRESSURE AND DEPTH (pressure-depth) ── */
SIM_REGISTRY['pressure-depth'] = function(c) {
  var depth = 10;

  function render() {
    var pressure = 1 + depth * 0.1; /* atmospheres, approx 1 atm per 10m */
    var pressurePa = Math.round(pressure * 101325);
    var W = 280, H = 200;

    /* Color based on depth */
    var waterColor = depth < 20 ? 'rgba(77,180,255,' : depth < 100 ? 'rgba(40,120,200,' : 'rgba(20,60,140,';
    var crushLevel = Math.min(100, depth/5);

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Water Pressure vs Depth</div>' +
      '<svg width="' + W + '" height="' + H + '" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">' +
      /* Ocean gradient */
      '<defs><linearGradient id="oceanG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(77,180,255,0.6)"/>' +
      '<stop offset="100%" stop-color="rgba(10,30,80,0.9)"/>' +
      '</linearGradient></defs>' +
      '<rect x="30" y="10" width="' + (W-60) + '" height="' + (H-20) + '" fill="url(#oceanG)" rx="8"/>' +
      /* Surface */
      '<rect x="30" y="10" width="' + (W-60) + '" height="8" fill="rgba(77,200,255,0.4)" rx="4"/>' +
      '<text x="' + W/2 + '" y="8" fill="rgba(255,255,255,.5)" font-size="9" text-anchor="middle" font-family="Nunito">Sea surface — 1 atm</text>' +
      /* Depth marker */
      '<line x1="32" y1="18" x2="32" y2="' + (10+depth/200*(H-30)) + '" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="3,4"/>' +
      '<circle cx="60" cy="' + (10+depth/200*(H-30)) + '" r="' + Math.max(6,12-crushLevel*0.08) + '" fill="rgba(255,107,107,0.8)"/>' +
      '<text x="80" y="' + (13+depth/200*(H-30)) + '" fill="rgba(255,107,107,.9)" font-size="10" font-weight="bold" font-family="Nunito">📍 ' + depth + 'm deep</text>' +
      /* Pressure label */
      '<text x="' + W/2 + '" y="' + (H-22) + '" fill="rgba(255,255,255,.7)" font-size="11" font-weight="bold" text-anchor="middle" font-family="Nunito">Pressure: ' + pressure.toFixed(1) + ' atm (' + (pressurePa/1000).toFixed(0) + ' kPa)</text>' +
      /* Known depths */
      '<text x="' + (W-35) + '" y="' + (10+10/200*(H-30)+4) + '" fill="rgba(255,255,255,.3)" font-size="7" text-anchor="middle" font-family="Nunito">10m</text>' +
      '<text x="' + (W-35) + '" y="' + (10+40/200*(H-30)+4) + '" fill="rgba(255,255,255,.3)" font-size="7" text-anchor="middle" font-family="Nunito">40m</text>' +
      '</svg>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<span style="font-size:11px;color:#4D96FF">Depth: <b>' + depth + 'm</b></span>' +
      '<input type="range" class="slide" min="0" max="200" value="' + depth + '" oninput="pressureDepth(this.value)" style="width:140px">' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      (depth < 5 ? '🏊 Safe for swimmers!' :
       depth < 20 ? '🤿 Scuba diving depth. Ear pressure noticeable.' :
       depth < 100 ? '🐠 Most fish live here. ' + pressure.toFixed(1) + '× surface pressure.' :
       depth < 1000 ? '🦑 Deep sea zone. Special submarines needed.' :
       '⬛ Abyssal zone. Mariana Trench is 11,000m — pressure there is 1,100 atm!') +
      '</div>';
  }

  window.pressureDepth = function(v) { depth=parseInt(v); render(); };
  render();
};

/* ── 11. VOLUME VISUALISER (volume-sim) ── */
SIM_REGISTRY['volume-sim'] = function(c) {
  var shape = 'cube', l=4, w=3, h=5, r=3;

  function render() {
    var vol, formula, dims;
    if (shape==='cube') { vol=l*l*l; formula='V = s³ = '+l+'³ = '+vol+' cm³'; dims='Side: '+l+' cm'; }
    else if (shape==='cuboid') { vol=l*w*h; formula='V = l × w × h = '+l+'×'+w+'×'+h+' = '+vol+' cm³'; dims='L:'+l+' W:'+w+' H:'+h; }
    else { vol=Math.round(Math.PI*r*r*h); formula='V = πr²h = π×'+r+'²×'+h+' = '+vol+' cm³'; dims='r:'+r+' h:'+h; }

    /* 3D isometric drawing */
    var W=200, H=160, CX=W/2, CY=H/2;
    var scale = Math.min(W,H)/(Math.max(l,w,h,r*2)+4);
    var lx=l*scale, wx=w*scale, hx=h*scale, rx=r*scale;

    var isoSVG = '<svg width="'+W+'" height="'+H+'" style="display:block;margin:0 auto;overflow:visible">';
    var ox=CX, oy=CY+hx/2;

    if (shape==='cube' || shape==='cuboid') {
      var sl=shape==='cube'?lx:lx, sw=shape==='cube'?lx:wx, sh=shape==='cube'?lx:hx;
      /* Front face */
      isoSVG += '<rect x="'+(ox-sl/2)+'" y="'+(oy-sh)+'" width="'+sl+'" height="'+sh+'" fill="rgba(77,150,255,.3)" stroke="#4D96FF" stroke-width="2"/>';
      /* Right face (parallelogram) */
      isoSVG += '<polygon points="'+(ox+sl/2)+','+(oy-sh)+' '+(ox+sl/2+sw*0.5)+','+(oy-sh-sw*0.3)+' '+(ox+sl/2+sw*0.5)+','+(oy-sw*0.3)+' '+(ox+sl/2)+','+oy+'" fill="rgba(77,150,255,.2)" stroke="#4D96FF" stroke-width="2"/>';
      /* Top face (parallelogram) */
      isoSVG += '<polygon points="'+(ox-sl/2)+','+(oy-sh)+' '+(ox+sl/2)+','+(oy-sh)+' '+(ox+sl/2+sw*0.5)+','+(oy-sh-sw*0.3)+' '+(ox-sl/2+sw*0.5)+','+(oy-sh-sw*0.3)+'" fill="rgba(77,150,255,.4)" stroke="#4D96FF" stroke-width="2"/>';
      /* Dimension labels */
      isoSVG += '<text x="'+(ox)+'" y="'+(oy+14)+'" fill="var(--math)" font-size="10" text-anchor="middle" font-family="Nunito">'+(shape==='cube'?l+'cm':l+'cm')+'</text>';
      isoSVG += '<text x="'+(ox+sl/2+sw*0.3)+'" y="'+(oy-sh/2)+'" fill="var(--evs)" font-size="10" text-anchor="start" font-family="Nunito">'+(shape==='cube'?'':w+'cm')+'</text>';
      isoSVG += '<text x="'+(ox-sl/2-8)+'" y="'+(oy-sh/2)+'" fill="var(--sci)" font-size="10" text-anchor="end" font-family="Nunito">'+h+'cm</text>';
    } else {
      /* Cylinder */
      isoSVG += '<ellipse cx="'+ox+'" cy="'+oy+'" rx="'+rx+'" ry="'+rx*0.35+'" fill="rgba(255,107,107,.25)" stroke="var(--sci)" stroke-width="2"/>';
      isoSVG += '<rect x="'+(ox-rx)+'" y="'+(oy-hx)+'" width="'+(rx*2)+'" height="'+hx+'" fill="rgba(255,107,107,.15)" stroke="var(--sci)" stroke-width="2"/>';
      isoSVG += '<ellipse cx="'+ox+'" cy="'+(oy-hx)+'" rx="'+rx+'" ry="'+rx*0.35+'" fill="rgba(255,107,107,.4)" stroke="var(--sci)" stroke-width="2"/>';
      /* Radius line */
      isoSVG += '<line x1="'+ox+'" y1="'+(oy-hx)+'" x2="'+(ox+rx)+'" y2="'+(oy-hx)+'" stroke="rgba(255,255,255,.4)" stroke-width="1.5" stroke-dasharray="3,3"/>';
      isoSVG += '<text x="'+(ox+rx/2)+'" y="'+(oy-hx-5)+'" fill="var(--sci)" font-size="10" text-anchor="middle" font-family="Nunito">r='+r+'</text>';
    }
    isoSVG += '</svg>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Volume Calculator</div>' +
      /* Shape selector */
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      ['cube','cuboid','cylinder'].map(function(s) {
        return '<button onclick="volShape(\''+s+'\')" style="padding:5px 10px;border-radius:9px;font-size:11px;font-weight:800;border:1.5px solid '+(s===shape?'var(--acc)':'var(--border)')+';background:'+(s===shape?'var(--acc-dim)':'var(--surface2)')+';color:'+(s===shape?'var(--acc)':'var(--muted)')+';cursor:pointer">'+(s==='cube'?'🧊 Cube':s==='cuboid'?'📦 Cuboid':'🥫 Cylinder')+'</button>';
      }).join('') + '</div>' +
      /* 3D shape */
      isoSVG +
      /* Volume display */
      '<div style="text-align:center;font-size:22px;font-weight:900;color:var(--acc);margin:6px 0">V = '+vol+' cm³</div>' +
      '<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:8px">'+formula+'</div>' +
      /* Sliders */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      (shape==='cylinder'
        ? '<span style="font-size:11px;color:var(--sci)">r: <b>'+r+'</b></span><input type="range" class="slide" min="1" max="8" value="'+r+'" oninput="volR(this.value)" style="width:100px">' +
          '<span style="font-size:11px;color:var(--evs)">h: <b>'+h+'</b></span><input type="range" class="slide" min="1" max="10" value="'+h+'" oninput="volH(this.value)" style="width:100px">'
        : shape==='cube'
        ? '<span style="font-size:11px;color:var(--math)">Side: <b>'+l+'</b></span><input type="range" class="slide" min="1" max="8" value="'+l+'" oninput="volL(this.value)" style="width:140px">'
        : '<span style="font-size:11px;color:var(--math)">L:<b>'+l+'</b></span><input type="range" class="slide" min="1" max="8" value="'+l+'" oninput="volL(this.value)" style="width:70px">' +
          '<span style="font-size:11px;color:var(--sci)">W:<b>'+w+'</b></span><input type="range" class="slide" min="1" max="8" value="'+w+'" oninput="volW(this.value)" style="width:70px">' +
          '<span style="font-size:11px;color:var(--evs)">H:<b>'+h+'</b></span><input type="range" class="slide" min="1" max="10" value="'+h+'" oninput="volH(this.value)" style="width:70px">'
      ) + '</div>';
  }

  window.volShape=function(s){shape=s;render();};
  window.volL=function(v){l=parseInt(v);render();};
  window.volW=function(v){w=parseInt(v);render();};
  window.volH=function(v){h=parseInt(v);render();};
  window.volR=function(v){r=parseInt(v);render();};
  render();
};

/* ── 12. FRACTION EQUIVALENCE (fraction-equiv) ── */
SIM_REGISTRY['fraction-equiv'] = function(c) {
  var num=1, den=2;

  function gcd(a,b){return b===0?a:gcd(b,a%b);}

  function equivalents(n,d) {
    var result=[];
    for(var m=1;m<=6;m++) result.push({n:n*m,d:d*m,m:m});
    return result;
  }

  function render() {
    var eqs = equivalents(num,den);
    var simplified = gcd(num,den);
    var sn=num/simplified, sd=den/simplified;

    var bars = eqs.map(function(eq) {
      var cells='';
      for(var i=0;i<eq.d;i++){
        cells += '<div style="flex:1;height:30px;background:'+(i<eq.n?'var(--acc)':'var(--surface2)')+';border:1px solid var(--bg);border-radius:2px;transition:background .2s"></div>';
      }
      return '<div style="margin-bottom:6px">' +
        '<div style="font-size:11px;font-weight:800;color:var(--acc);margin-bottom:3px">×'+eq.m+': '+eq.n+'/'+eq.d+'</div>' +
        '<div style="display:flex;gap:1px;height:30px;border-radius:6px;overflow:hidden;border:1px solid var(--border)">'+cells+'</div>' +
        '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Equivalent Fractions</div>' +
      '<div style="text-align:center;font-size:32px;font-weight:900;margin-bottom:8px">' +
      '<span style="color:var(--acc)">'+num+'</span><span style="display:block;font-size:14px;color:var(--muted)">───</span><span style="color:var(--acc)">'+den+'</span>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' + bars + '</div>' +
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px;font-size:12px;color:var(--text);text-align:center;margin-bottom:10px;line-height:1.8">' +
      '✅ All these fractions equal <b style="color:var(--evs)">'+num+'/'+den+' = '+(num/den).toFixed(3)+'</b> — they\'re all equivalent!<br>' +
      (num!==sn?'Simplest form: <b style="color:var(--math)">'+sn+'/'+sd+'</b>':'This is already in simplest form!') +
      '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--acc)">Numerator: <b>'+num+'</b></span>' +
      '<input type="range" class="slide" min="1" max="5" value="'+num+'" oninput="feNum(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--muted)">Denominator: <b>'+den+'</b></span>' +
      '<input type="range" class="slide" min="1" max="8" value="'+den+'" oninput="feDen(this.value)" style="width:100px">' +
      '</div>';
  }

  window.feNum=function(v){num=parseInt(v);render();};
  window.feDen=function(v){den=parseInt(v);if(num>den)num=den;render();};
  render();
};

/* ── 13. SYMMETRY (symmetry-nature) ── */
SIM_REGISTRY['symmetry-nature'] = function(c) {
  var raf2, mode='draw', points=[], mirror='vertical', dragging=false;
  var shapes = {
    butterfly: [[0,-40],[10,-30],[20,-15],[25,0],[20,15],[10,30],[0,40],[-10,30],[-20,15],[-25,0],[-20,-15],[-10,-30]],
    leaf: [[0,-50],[15,-30],[20,-10],[15,10],[0,30],[-15,10],[-20,-10],[-15,-30]],
    star: function() {
      var pts=[];
      for(var i=0;i<10;i++){
        var a=i/10*Math.PI*2-Math.PI/2;
        var r=i%2===0?40:18;
        pts.push([Math.cos(a)*r,Math.sin(a)*r]);
      }
      return pts;
    }(),
  };

  function draw() {
    var _g=getCtx('symCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    CX=W/2,CY=H/2;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Mirror axis */
    ctx.strokeStyle='rgba(255,217,61,.3)'; ctx.lineWidth=1.5; ctx.setLineDash([5,5]);
    if(mirror==='vertical') { ctx.beginPath(); ctx.moveTo(CX,0); ctx.lineTo(CX,H); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(0,CY); ctx.lineTo(W,CY); ctx.stroke(); }
    ctx.setLineDash([]);

    var allPts = points.length>0?points:shapes.butterfly;

    /* Original */
    ctx.beginPath();
    ctx.strokeStyle='var(--acc)'; ctx.lineWidth=2; ctx.fillStyle='rgba(199,125,255,.15)';
    allPts.forEach(function(p,i){ i===0?ctx.moveTo(CX+p[0],CY+p[1]):ctx.lineTo(CX+p[0],CY+p[1]); });
    ctx.closePath(); ctx.fill(); ctx.stroke();

    /* Reflection */
    ctx.beginPath();
    ctx.strokeStyle='var(--evs)'; ctx.lineWidth=2; ctx.fillStyle='rgba(107,203,119,.1)'; ctx.setLineDash([4,3]);
    allPts.forEach(function(p,i){
      var rx=mirror==='vertical'?-p[0]:p[0];
      var ry=mirror==='horizontal'?-p[1]:p[1];
      i===0?ctx.moveTo(CX+rx,CY+ry):ctx.lineTo(CX+rx,CY+ry);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);

    /* Axis label */
    ctx.fillStyle='rgba(255,217,61,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(mirror+' axis of symmetry', CX, H-6);
  }

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Lines of Symmetry</div>'+
      '<canvas id="symCanvas" data-w="280" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Shape:</span>'+
      ['butterfly','leaf','star'].map(function(s){
        return '<button onclick="symShape(\''+s+'\')" style="padding:4px 8px;border-radius:8px;font-size:11px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer">'+s+'</button>';
      }).join('')+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      '<button class="cbtn" onclick="symMirror()" style="font-size:11px">🔄 Toggle Axis</button>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      '<span style="color:var(--acc)">■ Original</span> · <span style="color:var(--evs)">■ Mirror image</span> · Both together = symmetrical shape! Found in leaves, butterflies, snowflakes.'+
      '</div>';
    draw();
  }

  window.symShape=function(s){points=shapes[s]||[];render();};
  window.symMirror=function(){mirror=mirror==='vertical'?'horizontal':'vertical';draw();};
  window.simCleanup=function(){cancelAnimationFrame(raf2);};
  render();
};

/* ── 14. TESSELLATION (tessellation-sim) ── */
SIM_REGISTRY['tessellation-sim'] = function(c) {
  var shape='square', colorScheme=0;
  var schemes=[['#FF6B6B','#FFD93D','#6BCB77','#4D96FF'],['#C77DFF','#FF8C42','#6BCB77','#4D96FF'],['#FF6B6B','#4D96FF','#FF6B6B','#4D96FF']];

  function render() {
    var W=280,H=200;
    var colors=schemes[colorScheme];
    var svg='<svg width="'+W+'" height="'+H+'" style="display:block;border-radius:12px;background:#0a0a1a;width:100%">';

    if(shape==='square'){
      var sz=36;
      for(var row=0;row<Math.ceil(H/sz)+1;row++)for(var col=0;col<Math.ceil(W/sz)+1;col++){
        var x=col*sz,y=row*sz;
        var color=colors[(row+col)%colors.length];
        svg+='<rect x="'+x+'" y="'+y+'" width="'+sz+'" height="'+sz+'" fill="'+color+'" stroke="#0a0a1a" stroke-width="1.5" opacity="0.85"/>';
      }
    } else if(shape==='triangle'){
      var sz2=44;
      for(var row2=0;row2<Math.ceil(H/(sz2*0.87))+1;row2++)for(var col2=0;col2<Math.ceil(W/(sz2/2))+1;col2++){
        var x2=col2*(sz2/2),y2=row2*(sz2*0.87);
        var flip=(col2+row2)%2===0;
        var pts=flip?[[x2,y2+sz2*0.87],[x2+sz2/2,y2],[x2+sz2,y2+sz2*0.87]]:[[x2,y2],[x2+sz2/2,y2+sz2*0.87],[x2+sz2,y2]];
        var color2=colors[(col2+row2*3)%colors.length];
        svg+='<polygon points="'+pts.map(function(p){return p[0]+','+p[1];}).join(' ')+'" fill="'+color2+'" stroke="#0a0a1a" stroke-width="1.5" opacity="0.85"/>';
      }
    } else if(shape==='hexagon'){
      var sz3=28,hx=sz3*Math.sqrt(3);
      for(var row3=0;row3<Math.ceil(H/(sz3*1.5))+1;row3++)for(var col3=0;col3<Math.ceil(W/hx)+1;col3++){
        var cx2=col3*hx+(row3%2?hx/2:0),cy2=row3*sz3*1.5;
        var pts2=[];
        for(var a=0;a<6;a++){var ag=a*60*Math.PI/180;pts2.push([cx2+Math.cos(ag)*sz3,cy2+Math.sin(ag)*sz3]);}
        var color3=colors[(col3+row3)%colors.length];
        svg+='<polygon points="'+pts2.map(function(p){return p[0]+','+p[1];}).join(' ')+'" fill="'+color3+'" stroke="#0a0a1a" stroke-width="1.5" opacity="0.85"/>';
      }
    }
    svg+='</svg>';

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Tessellations — Tiling the Plane</div>'+
      svg+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Shape:</span>'+
      [['square','🟥'],['triangle','🔺'],['hexagon','⬡']].map(function(s){
        return '<button onclick="tessShape(\''+s[0]+'\')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(s[0]===shape?'var(--acc)':'var(--border)')+';background:'+(s[0]===shape?'var(--acc-dim)':'var(--surface2)')+';color:'+(s[0]===shape?'var(--acc)':'var(--muted)')+';cursor:pointer">'+s[1]+' '+s[0]+'</button>';
      }).join('')+
      '<button class="cbtn" onclick="tessColor()" style="font-size:11px">🎨 Colors</button>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      'Only 3 regular polygons can tessellate: equilateral triangle (6 at each vertex), square (4), hexagon (3). Bees naturally use hexagons — they need the least wax!'+
      '</div>';
  }

  window.tessShape=function(s){shape=s;render();};
  window.tessColor=function(){colorScheme=(colorScheme+1)%schemes.length;render();};
  render();
};


/* ══════════════════════════════════════
   BATCH 7 — 14 simulations
   ══════════════════════════════════════ */

/* ── 1. MORE OR LESS (more-less) ── */
SIM_REGISTRY['more-less'] = function(c) {
  var a = 7, b = 5, emoji = '🍎';
  var emojis = ['🍎','⭐','🐸','🐧','🎈','🌸'];

  function render() {
    var sign = a > b ? '>' : a < b ? '<' : '=';
    var signColor = a > b ? 'var(--sci)' : a < b ? 'var(--acc)' : 'var(--evs)';
    var groupA = Array.from({length:a}, function(){return '<span style="font-size:24px">'+emoji+'</span>';}).join('');
    var groupB = Array.from({length:b}, function(){return '<span style="font-size:24px">'+emoji+'</span>';}).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">More, Less or Equal?</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">' +
      '<div style="background:var(--sci-dim);border:2px solid var(--sci);border-radius:12px;padding:10px;min-width:90px;text-align:center">' +
      '<div style="font-size:11px;font-weight:800;color:var(--sci);margin-bottom:4px">Group A: '+a+'</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center">'+groupA+'</div></div>' +
      '<div style="font-size:52px;font-weight:900;color:'+signColor+';text-align:center;min-width:50px;line-height:1">'+sign+'</div>' +
      '<div style="background:var(--acc-dim);border:2px solid var(--acc);border-radius:12px;padding:10px;min-width:90px;text-align:center">' +
      '<div style="font-size:11px;font-weight:800;color:var(--acc);margin-bottom:4px">Group B: '+b+'</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center">'+groupB+'</div></div>' +
      '</div>' +
      '<div style="text-align:center;font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px">' +
      a + ' is ' + (a>b?'MORE than':a<b?'LESS than':'EQUAL to') + ' ' + b +
      '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">' +
      '<span style="font-size:11px;color:var(--sci)">A: <b>'+a+'</b></span>' +
      '<input type="range" class="slide" min="0" max="10" value="'+a+'" oninput="mlA(this.value)" style="width:100px">' +
      '<span style="font-size:11px;color:var(--acc)">B: <b>'+b+'</b></span>' +
      '<input type="range" class="slide" min="0" max="10" value="'+b+'" oninput="mlB(this.value)" style="width:100px">' +
      '</div>' +
      '<div style="display:flex;gap:4px;justify-content:center">' +
      emojis.map(function(e){return '<button onclick="mlEmoji(\''+e+'\')" style="font-size:18px;width:32px;height:32px;border-radius:8px;border:1.5px solid '+(e===emoji?'var(--acc)':'var(--border)')+';background:'+(e===emoji?'var(--acc-dim)':'var(--surface2)')+';cursor:pointer">'+e+'</button>';}).join('') +
      '</div>';
  }
  window.mlA = function(v){a=parseInt(v);render();};
  window.mlB = function(v){b=parseInt(v);render();};
  window.mlEmoji = function(e){emoji=e;render();};
  render();
};

/* ── 2. BAR GRAPH BUILDER (bar-graph) ── */
SIM_REGISTRY['bar-graph'] = function(c) {
  var data = [
    {label:'Mon', val:6, color:'#FF6B6B'},
    {label:'Tue', val:8, color:'#FFD93D'},
    {label:'Wed', val:4, color:'#6BCB77'},
    {label:'Thu', val:9, color:'#4D96FF'},
    {label:'Fri', val:7, color:'#C77DFF'},
  ];
  var title = 'Hours of Study per Day';
  var editing = null;

  function render() {
    var maxVal = Math.max.apply(null, data.map(function(d){return d.val;}));
    var bars = data.map(function(d,i) {
      var pct = (d.val/maxVal)*100;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">' +
        '<div style="font-size:12px;font-weight:800;color:'+d.color+'">'+d.val+'</div>' +
        '<div style="width:100%;height:'+Math.round(pct*1.2)+'px;background:'+d.color+';border-radius:4px 4px 0 0;cursor:pointer;transition:height .3s" ' +
        'onclick="bgEdit('+i+')" title="Click to edit"></div>' +
        '<div style="font-size:11px;font-weight:700;color:var(--muted)">'+d.label+'</div>' +
        '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;text-align:center">Bar Graph Builder</div>' +
      '<div style="font-size:13px;font-weight:800;color:var(--text);text-align:center;margin-bottom:8px">'+title+'</div>' +
      '<div style="display:flex;align-items:flex-end;height:130px;gap:6px;padding:0 4px;border-bottom:2px solid var(--border);border-left:2px solid var(--border);margin-bottom:6px">' +
      bars + '</div>' +
      (editing !== null ?
        '<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-bottom:8px;border:1px solid var(--border)">' +
        '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">Edit "'+data[editing].label+'" value:</div>' +
        '<div class="ctrl-row">' +
        '<input type="range" class="slide" min="1" max="20" value="'+data[editing].val+'" oninput="bgVal(this.value)" style="width:140px">' +
        '<span style="font-size:16px;font-weight:900;color:'+data[editing].color+'">'+data[editing].val+'</span>' +
        '<button class="cbtn" onclick="bgEdit(null)" style="font-size:11px">✓ Done</button>' +
        '</div></div>' : '') +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:8px">Click any bar to edit its value</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      [
        {label:'📊 Mean',   val:(data.reduce(function(s,d){return s+d.val;},0)/data.length).toFixed(1)},
        {label:'📈 Max',    val:Math.max.apply(null,data.map(function(d){return d.val;}))},
        {label:'📉 Min',    val:Math.min.apply(null,data.map(function(d){return d.val;}))},
        {label:'➕ Total',  val:data.reduce(function(s,d){return s+d.val;},0)},
      ].map(function(s){
        return '<div style="background:var(--surface2);border-radius:8px;padding:7px 10px;border:1px solid var(--border);display:flex;justify-content:space-between">' +
          '<span style="font-size:11px;color:var(--muted)">'+s.label+'</span>' +
          '<span style="font-size:13px;font-weight:900;color:var(--text)">'+s.val+'</span></div>';
      }).join('') + '</div>';
  }

  window.bgEdit = function(i) { editing=i; render(); };
  window.bgVal  = function(v) { if(editing!==null) { data[editing].val=parseInt(v); render(); } };
  render();
};

/* ── 3. MEASUREMENT COMPARE (measurement-compare) ── */
SIM_REGISTRY['measurement-compare'] = function(c) {
  var category = 'length';
  var value = 1, fromUnit = 0, toUnit = 1;

  var units = {
    length: {
      name:'📏 Length', emoji:'📏',
      units:['mm','cm','m','km'],
      base:[0.001,0.01,1,1000],
      facts:['Width of a pencil tip','Width of your finger','Length of one big step','About 10 minutes walking']
    },
    mass: {
      name:'⚖️ Mass', emoji:'⚖️',
      units:['mg','g','kg','tonne'],
      base:[0.000001,0.001,1,1000],
      facts:['A grain of rice','A paperclip','A bag of flour','A small car']
    },
    time: {
      name:'⏱️ Time', emoji:'⏱️',
      units:['second','minute','hour','day'],
      base:[1,60,3600,86400],
      facts:['One heartbeat','One minute of play','One lesson period','Full day of school']
    },
    capacity: {
      name:'💧 Capacity', emoji:'💧',
      units:['ml','cl','litre','kl'],
      base:[0.001,0.01,1,1000],
      facts:['One teaspoon','A small shot','A water bottle','A small water tank']
    }
  };

  function convert(val, from, to, cat) {
    var u = units[cat];
    return val * u.base[from] / u.base[to];
  }

  function render() {
    var u = units[category];
    var result = convert(value, fromUnit, toUnit, category);
    var resultStr = result >= 1000 ? result.toExponential(2) : result < 0.001 ? result.toExponential(2) : parseFloat(result.toFixed(6)).toString();

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Unit Conversion</div>' +
      /* Category tabs */
      '<div style="display:flex;gap:5px;justify-content:center;margin-bottom:10px;flex-wrap:wrap">' +
      Object.keys(units).map(function(k){
        return '<button onclick="measCat(\''+k+'\')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(k===category?'var(--acc)':'var(--border)')+';background:'+(k===category?'var(--acc-dim)':'var(--surface2)')+';color:'+(k===category?'var(--acc)':'var(--muted)')+';cursor:pointer;font-weight:800">'+units[k].emoji+' '+k+'</button>';
      }).join('') + '</div>' +
      /* Conversion display */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;justify-content:center">' +
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;border:1px solid var(--border);text-align:center;min-width:100px">' +
      '<input type="number" value="'+value+'" onchange="measVal(this.value)" style="width:70px;background:transparent;border:none;color:var(--acc);font-size:24px;font-weight:900;text-align:center">' +
      '<div style="margin-top:4px">' +
      '<select onchange="measFrom(this.value)" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px;color:var(--text);font-size:12px">' +
      u.units.map(function(un,i){return '<option value="'+i+'"'+(i===fromUnit?' selected':'')+'>'+un+'</option>';}).join('') +
      '</select></div></div>' +
      '<div style="font-size:28px;color:var(--muted)">=</div>' +
      '<div style="background:var(--acc-dim);border-radius:12px;padding:12px;border:1.5px solid var(--acc);text-align:center;min-width:100px">' +
      '<div style="font-size:24px;font-weight:900;color:var(--acc)">'+resultStr+'</div>' +
      '<div style="margin-top:4px">' +
      '<select onchange="measTo(this.value)" style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px;color:var(--text);font-size:12px">' +
      u.units.map(function(un,i){return '<option value="'+i+'"'+(i===toUnit?' selected':'')+'>'+un+'</option>';}).join('') +
      '</select></div></div>' +
      '</div>' +
      /* Visual scale comparison */
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">Scale reference:</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      u.units.map(function(un,i){
        return '<div style="background:var(--surface);border-radius:8px;padding:5px 8px;border:1px solid '+(i===fromUnit?'var(--acc)':i===toUnit?'var(--acc)44':'var(--border)')+'">' +
          '<div style="font-size:11px;font-weight:800;color:'+(i===fromUnit||i===toUnit?'var(--acc)':'var(--muted)')+'">1 '+un+'</div>' +
          '<div style="font-size:9px;color:var(--muted)">'+u.facts[i]+'</div>' +
          '</div>';
      }).join('') +
      '</div></div>';
  }

  window.measCat  = function(k){category=k;fromUnit=0;toUnit=1;render();};
  window.measVal  = function(v){value=parseFloat(v)||1;render();};
  window.measFrom = function(v){fromUnit=parseInt(v);render();};
  window.measTo   = function(v){toUnit=parseInt(v);render();};
  render();
};

/* ── 4. PERIMETER SIM (perimeter-sim) ── */
SIM_REGISTRY['perimeter-sim'] = function(c) {
  var shape='rectangle', l=6, w=4, s=5;

  function render() {
    var W=280, H=160;
    var perim, area, formula, aformula;
    if(shape==='rectangle'){perim=2*(l+w);area=l*w;formula='P = 2×(l+w) = 2×('+l+'+'+w+') = '+perim;aformula='A = l×w = '+l+'×'+w+' = '+area;}
    else if(shape==='square'){perim=4*s;area=s*s;formula='P = 4×s = 4×'+s+' = '+perim;aformula='A = s² = '+s+'² = '+area;}
    else{perim=Math.round(3*s);area=Math.round(Math.sqrt(3)/4*s*s*10)/10;formula='P = 3×s = 3×'+s+' = '+perim;aformula='A = (√3/4)×s² ≈ '+area;}

    /* Shape drawing */
    var shapeHTML='';
    var cx=W/2,cy=H/2,scale=Math.min(W,H)/(Math.max(l,w,s)+4)/10*30;

    if(shape==='rectangle'){
      var rw=l*scale,rh=w*scale;
      shapeHTML='<svg width="'+W+'" height="'+H+'" style="display:block">' +
        '<rect x="'+(cx-rw/2)+'" y="'+(cy-rh/2)+'" width="'+rw+'" height="'+rh+'" fill="rgba(77,150,255,.15)" stroke="#4D96FF" stroke-width="3"/>' +
        '<text x="'+cx+'" y="'+(cy-rh/2-6)+'" fill="#4D96FF" font-size="11" text-anchor="middle" font-family="Nunito">l='+l+' cm</text>' +
        '<text x="'+(cx-rw/2-6)+'" y="'+cy+'" fill="#6BCB77" font-size="11" text-anchor="end" font-family="Nunito" transform="rotate(-90,'+(cx-rw/2-6)+','+cy+')">w='+w+' cm</text>' +
        '<!-- Walking ant around perimeter -->' +
        '<circle cx="'+(cx-rw/2)+'" cy="'+(cy-rh/2)+'" r="5" fill="#FFD93D"><animateMotion dur="4s" repeatCount="indefinite" path="M0,0 L'+rw+',0 L'+rw+','+rh+' L0,'+rh+' Z"/></circle>' +
        '</svg>';
    } else if(shape==='square'){
      var sw=s*scale;
      shapeHTML='<svg width="'+W+'" height="'+H+'" style="display:block">' +
        '<rect x="'+(cx-sw/2)+'" y="'+(cy-sw/2)+'" width="'+sw+'" height="'+sw+'" fill="rgba(199,125,255,.15)" stroke="#C77DFF" stroke-width="3"/>' +
        '<text x="'+cx+'" y="'+(cy-sw/2-6)+'" fill="#C77DFF" font-size="11" text-anchor="middle" font-family="Nunito">s='+s+' cm</text>' +
        '<circle cx="'+(cx-sw/2)+'" cy="'+(cy-sw/2)+'" r="5" fill="#FFD93D"><animateMotion dur="3s" repeatCount="indefinite" path="M0,0 L'+sw+',0 L'+sw+','+sw+' L0,'+sw+' Z"/></circle>' +
        '</svg>';
    } else {
      var th=s*scale, tx=cx, ty=cy+th*0.3;
      var p1x=tx,p1y=ty-th*0.7,p2x=tx-th/2,p2y=ty+th*0.3,p3x=tx+th/2,p3y=ty+th*0.3;
      shapeHTML='<svg width="'+W+'" height="'+H+'" style="display:block">' +
        '<polygon points="'+p1x+','+p1y+' '+p2x+','+p2y+' '+p3x+','+p3y+'" fill="rgba(255,107,107,.15)" stroke="#FF6B6B" stroke-width="3"/>' +
        '<text x="'+cx+'" y="'+(p1y-8)+'" fill="#FF6B6B" font-size="11" text-anchor="middle" font-family="Nunito">s='+s+' cm each side</text>' +
        '<circle cx="'+p1x+'" cy="'+p1y+'" r="5" fill="#FFD93D"><animateMotion dur="3s" repeatCount="indefinite" path="M0,0 L'+(p2x-p1x)+','+(p2y-p1y)+' L'+(p3x-p1x)+','+(p3y-p1y)+' Z"/></circle>' +
        '</svg>';
    }

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Perimeter & Area</div>' +
      '<div class="ctrl-row" style="margin-bottom:6px">' +
      [['rectangle','📱'],['square','🟥'],['triangle','🔺']].map(function(s2){
        return '<button onclick="perimShape(\''+s2[0]+'\')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(s2[0]===shape?'var(--acc)':'var(--border)')+';background:'+(s2[0]===shape?'var(--acc-dim)':'var(--surface2)')+';cursor:pointer;font-weight:800">'+s2[1]+' '+s2[0]+'</button>';
      }).join('') + '</div>' +
      '<div style="background:#0a0a1a;border-radius:12px;overflow:hidden;margin-bottom:8px">'+shapeHTML+'</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">' +
      '<div style="background:var(--life-dim);border:1px solid rgba(77,150,255,.3);border-radius:10px;padding:10px;text-align:center"><div style="font-size:11px;color:var(--muted)">Perimeter</div><div style="font-size:22px;font-weight:900;color:var(--life)">'+perim+' cm</div><div style="font-size:9px;color:var(--muted)">'+formula+'</div></div>' +
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px;text-align:center"><div style="font-size:11px;color:var(--muted)">Area</div><div style="font-size:22px;font-weight:900;color:var(--evs)">'+area+' cm²</div><div style="font-size:9px;color:var(--muted)">'+aformula+'</div></div>' +
      '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      (shape==='square'
        ? '<span style="font-size:11px;color:var(--acc)">Side: <b>'+s+'</b></span><input type="range" class="slide" min="1" max="8" value="'+s+'" oninput="perimS(this.value)" style="width:120px">'
        : shape==='rectangle'
        ? '<span style="font-size:11px;color:#4D96FF">L: <b>'+l+'</b></span><input type="range" class="slide" min="1" max="10" value="'+l+'" oninput="perimL(this.value)" style="width:90px"><span style="font-size:11px;color:#6BCB77">W: <b>'+w+'</b></span><input type="range" class="slide" min="1" max="10" value="'+w+'" oninput="perimW(this.value)" style="width:90px">'
        : '<span style="font-size:11px;color:#FF6B6B">Side: <b>'+s+'</b></span><input type="range" class="slide" min="1" max="8" value="'+s+'" oninput="perimS(this.value)" style="width:120px">'
      ) + '</div>';
  }

  window.perimShape=function(sh){shape=sh;render();};
  window.perimL=function(v){l=parseInt(v);render();};
  window.perimW=function(v){w=parseInt(v);render();};
  window.perimS=function(v){s=parseInt(v);render();};
  render();
};

/* ── 5. CYLINDER AREA (cylinder-area) ── */
SIM_REGISTRY['cylinder-area'] = function(c) {
  var r=4, h=6;

  function render() {
    var pi=Math.PI;
    var baseArea=Math.round(pi*r*r*100)/100;
    var lateralArea=Math.round(2*pi*r*h*100)/100;
    var totalSA=Math.round(2*pi*r*(r+h)*100)/100;
    var vol=Math.round(pi*r*r*h*100)/100;

    var W=260,H=180,cx=W/2,cy=H/2;
    var rx=r*12,rh=h*12;
    var unrolledW=Math.round(2*pi*r);

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Cylinder — Surface Area & Volume</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%;margin-bottom:8px">'+
      /* Bottom ellipse */
      '<ellipse cx="'+cx+'" cy="'+(cy+rh/2)+'" rx="'+rx+'" ry="'+(rx*0.35)+'" fill="rgba(255,107,107,.3)" stroke="#FF6B6B" stroke-width="2"/>'+
      /* Cylinder body */
      '<rect x="'+(cx-rx)+'" y="'+(cy-rh/2)+'" width="'+(rx*2)+'" height="'+rh+'" fill="rgba(77,150,255,.15)" stroke="#4D96FF" stroke-width="0"/>'+
      /* Side lines */
      '<line x1="'+(cx-rx)+'" y1="'+(cy-rh/2)+'" x2="'+(cx-rx)+'" y2="'+(cy+rh/2)+'" stroke="#4D96FF" stroke-width="2"/>'+
      '<line x1="'+(cx+rx)+'" y1="'+(cy-rh/2)+'" x2="'+(cx+rx)+'" y2="'+(cy+rh/2)+'" stroke="#4D96FF" stroke-width="2"/>'+
      /* Top ellipse */
      '<ellipse cx="'+cx+'" cy="'+(cy-rh/2)+'" rx="'+rx+'" ry="'+(rx*0.35)+'" fill="rgba(255,107,107,.4)" stroke="#FF6B6B" stroke-width="2"/>'+
      /* Radius line */
      '<line x1="'+cx+'" y1="'+(cy-rh/2)+'" x2="'+(cx+rx)+'" y2="'+(cy-rh/2)+'" stroke="rgba(255,217,61,.6)" stroke-width="1.5" stroke-dasharray="4,3"/>'+
      '<text x="'+(cx+rx/2)+'" y="'+(cy-rh/2-6)+'" fill="rgba(255,217,61,.8)" font-size="10" text-anchor="middle" font-family="Nunito">r='+r+'</text>'+
      /* Height */
      '<line x1="'+(cx+rx+14)+'" y1="'+(cy-rh/2)+'" x2="'+(cx+rx+14)+'" y2="'+(cy+rh/2)+'" stroke="rgba(107,203,119,.6)" stroke-width="1.5" stroke-dasharray="4,3"/>'+
      '<text x="'+(cx+rx+22)+'" y="'+cy+'" fill="rgba(107,203,119,.8)" font-size="10" text-anchor="start" font-family="Nunito">h='+h+'</text>'+
      '</svg>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      [
        {label:'Base Area (×2)',color:'#FF6B6B',val:baseArea+' cm²',formula:'πr² = π×'+r+'²'},
        {label:'Lateral Area',  color:'#4D96FF',val:lateralArea+' cm²',formula:'2πrh = 2π×'+r+'×'+h},
        {label:'Total Surface', color:'#FFD93D',val:totalSA+' cm²',formula:'2πr(r+h)'},
        {label:'Volume',        color:'#6BCB77',val:vol+' cm³',formula:'πr²h = π×'+r+'²×'+h},
      ].map(function(s){
        return '<div style="background:var(--surface2);border-radius:10px;padding:8px;border:1px solid var(--border)">'+
          '<div style="font-size:10px;color:var(--muted)">'+s.label+'</div>'+
          '<div style="font-size:16px;font-weight:900;color:'+s.color+'">'+s.val+'</div>'+
          '<div style="font-size:9px;color:var(--muted)">'+s.formula+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:#FFD93D">r: <b>'+r+'</b></span>'+
      '<input type="range" class="slide" min="1" max="8" value="'+r+'" oninput="cylR(this.value)" style="width:100px">'+
      '<span style="font-size:11px;color:#6BCB77">h: <b>'+h+'</b></span>'+
      '<input type="range" class="slide" min="1" max="12" value="'+h+'" oninput="cylH(this.value)" style="width:100px">'+
      '</div>';
  }

  window.cylR=function(v){r=parseInt(v);render();};
  window.cylH=function(v){h=parseInt(v);render();};
  render();
};

/* ── 6. CIRCLE THEOREMS (circle-theorems) ── */
SIM_REGISTRY['circle-theorems'] = function(c) {
  var theorem=0;
  var theorems=[
    {name:'Angle at Centre',color:'#FF6B6B',
     desc:'The angle at the centre is twice the angle at the circumference subtended by the same arc.',
     example:'If angle at circumference = 35°, angle at centre = 70°'},
    {name:'Angles in Semicircle',color:'#FFD93D',
     desc:'The angle in a semicircle (angle subtended by a diameter) is always 90°.',
     example:'Any triangle drawn in a semicircle has a right angle at the circumference!'},
    {name:'Angles in Same Segment',color:'#6BCB77',
     desc:'Angles subtended by the same chord in the same segment are equal.',
     example:'All angles looking at chord AB from the same side are equal.'},
    {name:'Opposite Angles (Cyclic Quad)',color:'#4D96FF',
     desc:'Opposite angles of a cyclic quadrilateral add up to 180°.',
     example:'In a quadrilateral inscribed in a circle: ∠A + ∠C = 180°, ∠B + ∠D = 180°'},
  ];

  function drawTheorem(ctx,W,H,idx,t) {
    var cx=W/2,cy=H/2,r=Math.min(W,H)*0.38;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    /* Circle */
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.03)'; ctx.fill();

    var thm=theorems[idx];
    ctx.strokeStyle=thm.color; ctx.fillStyle=thm.color;

    if(idx===0){
      var a=t*0.5-Math.PI/2, b=a+Math.PI*0.8;
      var p1x=cx+Math.cos(a)*r,p1y=cy+Math.sin(a)*r;
      var p2x=cx+Math.cos(b)*r,p2y=cy+Math.sin(b)*r;
      var pm=(a+b)/2, pmx=cx+Math.cos(pm)*r, pmy=cy+Math.sin(pm)*r;
      ctx.lineWidth=2;
      /* Angle at centre */
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(p1x,p1y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(p2x,p2y); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,20,a,b); ctx.stroke();
      ctx.fillStyle='white'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('2θ',cx+Math.cos((a+b)/2)*30,cy+Math.sin((a+b)/2)*30+3);
      /* Angle at circumference */
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(pmx,pmy); ctx.lineTo(p1x,p1y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pmx,pmy); ctx.lineTo(p2x,p2y); ctx.stroke();
      ctx.beginPath(); ctx.arc(pmx,pmy,14,Math.atan2(p1y-pmy,p1x-pmx),Math.atan2(p2y-pmy,p2x-pmx)); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.6)'; ctx.font='bold 9px Nunito,sans-serif';
      ctx.fillText('θ',pmx+Math.cos((Math.atan2(p1y-pmy,p1x-pmx)+Math.atan2(p2y-pmy,p2x-pmx))/2)*22,pmy+Math.sin((Math.atan2(p1y-pmy,p1x-pmx)+Math.atan2(p2y-pmy,p2x-pmx))/2)*22+3);
      ctx.fillStyle=thm.color;
      [p1x,p1y,p2x,p2y,pmx,pmy,cx,cy].forEach(function(_,i,arr){if(i%2===0){ctx.beginPath();ctx.arc(arr[i],arr[i+1],4,0,Math.PI*2);ctx.fill();}});
    } else if(idx===1){
      var ax=cx-r,ay=cy,bx=cx+r,by=cy;
      var px=cx+Math.cos(t*0.4-0.2)*r,py=cy-Math.abs(Math.sin(t*0.4-0.2))*r;
      /* Diameter */
      ctx.strokeStyle='rgba(255,217,61,.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
      ctx.strokeStyle=thm.color; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(px,py); ctx.lineTo(bx,by); ctx.stroke();
      /* Right angle marker */
      var ang1=Math.atan2(ay-py,ax-px), ang2=Math.atan2(by-py,bx-px);
      ctx.strokeStyle='white'; ctx.lineWidth=1.5;
      var sz=12;
      ctx.beginPath();
      ctx.moveTo(px+Math.cos(ang1)*sz,py+Math.sin(ang1)*sz);
      ctx.lineTo(px+Math.cos(ang1)*sz+Math.cos(ang2)*sz,py+Math.sin(ang1)*sz+Math.sin(ang2)*sz);
      ctx.lineTo(px+Math.cos(ang2)*sz,py+Math.sin(ang2)*sz);
      ctx.stroke();
      ctx.fillStyle='white'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('90°',px+5,py-15);
      [[ax,ay],[bx,by],[px,py]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fillStyle=thm.color;ctx.fill();});
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif';
      ctx.fillText('A',ax-10,ay+4); ctx.fillText('B',bx+6,by+4); ctx.fillText('P',px,py-12);
    } else if(idx===2){
      var angles=[t*0.3,t*0.3+1.8,t*0.3+3.2,t*0.3+4.8];
      var pts=angles.map(function(a){return[cx+Math.cos(a)*r,cy+Math.sin(a)*r];});
      ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[2][0],pts[2][1]); ctx.stroke();
      var arcColors=[thm.color,'rgba(255,255,255,.6)',thm.color];
      [pts[1],pts[3]].forEach(function(p,i){
        ctx.strokeStyle=arcColors[i*2]; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(pts[0][0],pts[0][1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(pts[2][0],pts[2][1]); ctx.stroke();
        ctx.fillStyle=arcColors[i*2]; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
        ctx.fillText('α',p[0]+(p[0]>cx?12:-12),p[1]+(p[1]>cy?12:-8));
      });
      pts.forEach(function(p,i){ctx.beginPath();ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fillStyle=i%2===0?'rgba(255,255,255,.5)':thm.color;ctx.fill();});
    } else {
      var qa=[t*0.2,t*0.2+Math.PI*0.6,t*0.2+Math.PI,t*0.2+Math.PI*1.6];
      var qpts=qa.map(function(a){return[cx+Math.cos(a)*r,cy+Math.sin(a)*r];});
      ctx.strokeStyle=thm.color; ctx.lineWidth=2;
      ctx.beginPath();
      qpts.forEach(function(p,i){i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]);});
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle='rgba(77,150,255,.1)'; ctx.fill();
      qpts.forEach(function(p,i){
        ctx.fillStyle=thm.color; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
        var labels=['A','B','C','D'];
        ctx.fillText(labels[i],p[0]+(p[0]>cx?14:-14),p[1]+(p[1]>cy?14:-10));
        ctx.beginPath();ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fill();
      });
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('∠A+∠C = 180°',cx,H-12);
    }
  }

  var raf2, t2=0;
  function animate(){
    var _g=getCtx('circleCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    t2+=0.025;
    raf2=requestAnimationFrame(animate);
  }

  function render(){
    var th=theorems[theorem];
    c.innerHTML=
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      theorems.map(function(t2,i){
        return '<button onclick="circThm('+i+')" style="padding:4px 8px;border-radius:8px;font-size:10px;border:1.5px solid '+(i===theorem?t2.color:'var(--border)')+';background:'+(i===theorem?t2.color+'22':'var(--surface2)')+';color:'+(i===theorem?t2.color:'var(--muted)')+';cursor:pointer;font-weight:800">'+t2.name+'</button>';
      }).join('')+'</div>'+
      '<canvas id="circleCanvas" data-w="280" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border)">'+
      '<div style="font-size:13px;font-weight:800;color:'+th.color+';margin-bottom:4px">'+th.name+'</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:4px">'+th.desc+'</div>'+
      '<div style="font-size:11px;color:var(--muted);font-style:italic">Example: '+th.example+'</div>'+
      '</div>';
    cancelAnimationFrame(raf2); animate();
  }

  window.circThm=function(i){cancelAnimationFrame(raf2);theorem=i;render();};
  window.simCleanup=function(){cancelAnimationFrame(raf2);};
  render();
};

/* ── 7. ALGEBRA INTRO (algebra-intro) ── */
SIM_REGISTRY['algebra-intro'] = function(c) {
  var a=3, b=5, op='+', showX=true;

  function render(){
    var result=op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:b!==0?Math.round(a/b*100)/100:'∞';
    /* Build equation: x op b = result, solve for x */
    var x_val=op==='+'?result-b:op==='-'?result+b:op==='×'&&b!==0?result/b:op==='÷'&&b!==0?result*b:'?';
    var balanced=Math.abs(x_val-a)<0.01;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Algebra — Find the Mystery Number!</div>'+
      /* Balance scale visual */
      '<div style="background:#0a0a1a;border-radius:12px;padding:16px;margin-bottom:10px;text-align:center">'+
      '<div style="font-size:14px;color:rgba(255,255,255,.5);margin-bottom:8px">Solve for <b style="color:var(--acc)">x</b>:</div>'+
      '<div style="font-size:32px;font-weight:900">'+
      '<span style="color:var(--acc)">'+(showX?'x':a)+'</span>'+
      '<span style="color:var(--muted);margin:0 8px">'+op+'</span>'+
      '<span style="color:var(--math)">'+b+'</span>'+
      '<span style="color:var(--muted);margin:0 8px">=</span>'+
      '<span style="color:var(--evs)">'+result+'</span>'+
      '</div>'+
      /* Guess area */
      '<div style="margin-top:12px">' +
      '<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:8px">What is x?</div>'+
      '<div class="ctrl-row" style="justify-content:center">' +
      '<input id="algebraGuess" type="number" placeholder="x = ?" style="width:80px;background:var(--surface);border:2px solid var(--acc);border-radius:10px;padding:8px;color:var(--acc);font-size:18px;font-weight:900;text-align:center">' +
      '<button class="cbtn" onclick="algebraCheck()" style="background:var(--acc);color:white;border-color:var(--acc);font-size:13px">Check!</button>' +
      '</div></div>' +
      '<div id="algebraResult" style="min-height:24px;margin-top:8px;font-size:14px;font-weight:800"></div>'+
      '</div>'+
      /* Explanation */
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-bottom:8px;border:1px solid var(--border);font-size:12px;color:var(--muted);line-height:1.8">'+
      '💡 To find x, do the <b style="color:var(--text)">opposite operation</b>:<br>'+
      (op==='+'?'x = '+result+' − '+b+' = <b style="color:var(--acc)">'+x_val+'</b>':
       op==='-'?'x = '+result+' + '+b+' = <b style="color:var(--acc)">'+x_val+'</b>':
       op==='×'?'x = '+result+' ÷ '+b+' = <b style="color:var(--acc)">'+x_val+'</b>':
       'x = '+result+' × '+b+' = <b style="color:var(--acc)">'+x_val+'</b>')+
      '</div>'+
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:var(--acc)">x (hidden): <b>'+a+'</b></span>'+
      '<input type="range" class="slide" min="1" max="12" value="'+a+'" oninput="algA(this.value)" style="width:90px">'+
      '<span style="font-size:11px;color:var(--math)">Other: <b>'+b+'</b></span>'+
      '<input type="range" class="slide" min="1" max="12" value="'+b+'" oninput="algB(this.value)" style="width:90px">'+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px">'+
      ['+','-','×','÷'].map(function(o){return '<button class="cbtn" onclick="algOp(\''+o+'\')" style="'+(o===op?'background:var(--acc);color:white;border-color:var(--acc)':'')+';font-size:14px;font-weight:900">'+o+'</button>';}).join('')+
      '</div>';

    window.algebraCheck=function(){
      var guess=parseFloat(document.getElementById('algebraGuess').value);
      var el=document.getElementById('algebraResult');
      if(Math.abs(guess-x_val)<0.01){el.innerHTML='✅ Correct! x = '+x_val;el.style.color='var(--evs)';}
      else{el.innerHTML='❌ Try again! Hint: use the opposite of '+op;el.style.color='var(--sci)';}
    };
  }

  window.algA=function(v){a=parseInt(v);render();};
  window.algB=function(v){b=parseInt(v);render();};
  window.algOp=function(o){op=o;render();};
  render();
};

/* ── 8. CARBON FOOTPRINT (carbon-footprint) ── */
SIM_REGISTRY['carbon-footprint'] = function(c) {
  var activities={
    transport:{car:0,bike:0,flight:0,walk:0},
    food:{meat:0,dairy:0,veg:0},
    energy:{electricity:0,gas:0},
  };
  var inputs={car:10,bike:2,flight:0,walk:0,meat:2,dairy:3,veg:5,electricity:100,gas:0};
  var factors={car:0.21,bike:0,flight:0.255,walk:0,meat:7.2,dairy:3.2,veg:0.4,electricity:0.82,gas:2.04};
  var labels={car:'🚗 Car (km/day)',bike:'🚲 Bike (km)',flight:'✈️ Flights/yr',walk:'🚶 Walk (km)',meat:'🥩 Meat meals/wk',dairy:'🥛 Dairy servings/day',veg:'🥦 Veg meals/wk',electricity:'💡 kWh/month',gas:'🔥 Gas units/month'};
  var tips=['🚲 Cycling instead of driving 5km saves ~380kg CO₂/year','🥦 Going vegetarian one day a week saves ~84kg CO₂/year','💡 Switching to LED bulbs cuts electricity CO₂ by 75%','✈️ One long-haul flight = 6 months of driving','🌳 One tree absorbs ~21kg CO₂/year — plant more!'];

  function render(){
    var total=0;
    Object.keys(inputs).forEach(function(k){total+=inputs[k]*factors[k]/52;});
    total=Math.round(total*10)/10;
    var annualKg=Math.round(total*52);
    var level=total<5?'🌿 Low':total<15?'⚠️ Medium':'🔴 High';
    var avgIndian=5.5;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Carbon Footprint Calculator</div>'+
      /* Big readout */
      '<div style="text-align:center;background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;color:var(--muted)">Your weekly CO₂</div>'+
      '<div style="font-size:36px;font-weight:900;color:'+(total<5?'var(--evs)':total<15?'var(--math)':'var(--sci)')+'">'+total+' kg</div>'+
      '<div style="font-size:13px;color:var(--muted)">'+level+' · ~'+annualKg+' kg/year</div>'+
      '<div style="height:8px;background:var(--surface);border-radius:4px;margin-top:8px">'+
      '<div style="height:8px;width:'+Math.min(100,total/20*100)+'%;background:'+(total<5?'var(--evs)':total<15?'var(--math)':'var(--sci)')+';border-radius:4px;transition:width .4s"></div></div>'+
      '<div style="font-size:10px;color:var(--muted);margin-top:4px">Avg Indian: '+avgIndian+' kg/week</div>'+
      '</div>'+
      /* Sliders */
      '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">'+
      Object.keys(inputs).map(function(k){
        return '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:11px;color:var(--muted);min-width:120px">'+labels[k]+'</span>'+
          '<input type="range" class="slide" min="0" max="'+(k==='flight'?10:k==='electricity'?300:k==='gas'?20:k==='meat'||k==='veg'?14:k==='dairy'?10:30)+'" value="'+inputs[k]+'" oninput="cfSet(\''+k+'\',this.value)" style="flex:1">'+
          '<span style="font-size:11px;font-weight:800;color:var(--text);min-width:28px">'+inputs[k]+'</span>'+
          '</div>';
      }).join('')+
      '</div>'+
      /* Tip */
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:9px 12px;font-size:11px;color:var(--text);line-height:1.7">'+
      tips[Math.floor(total/4)%tips.length]+
      '</div>';
  }

  window.cfSet=function(k,v){inputs[k]=parseFloat(v);render();};
  render();
};

/* ── 9. HAND WASH STEPS (hand-wash) ── */
SIM_REGISTRY['hand-wash'] = function(c) {
  var step=0, raf2, t2=0;
  var steps=[
    {emoji:'💧',title:'Wet your hands',desc:'Use clean running water (warm or cold). Turn off the tap to save water while washing.',time:5,color:'#4D96FF'},
    {emoji:'🧴',title:'Apply soap',desc:'Apply enough soap to cover all hand surfaces. Bar soap or liquid soap both work equally well.',time:3,color:'#C77DFF'},
    {emoji:'🤲',title:'Lather palms together',desc:'Rub hands palm to palm vigorously. The friction helps remove germs.',time:4,color:'#6BCB77'},
    {emoji:'🖐️',title:'Scrub back of hands',desc:'Right palm over left hand, fingers interlaced. Then left palm over right. Don\'t forget the back!',time:4,color:'#FFD93D'},
    {emoji:'🤞',title:'Clean between fingers',desc:'Fingers interlaced, rub vigorously. Germs love to hide between fingers!',time:4,color:'#FF8C42'},
    {emoji:'👍',title:'Scrub thumbs',desc:'Rotational rubbing of right thumb clasped in left palm. Then vice versa. Thumbs touch everything!',time:4,color:'#FF6B6B'},
    {emoji:'🫙',title:'Clean fingernails',desc:'Rotational rubbing of fingers of right hand clasped in left palm. Get under the nails!',time:4,color:'#6BCB77'},
    {emoji:'🚿',title:'Rinse thoroughly',desc:'Rinse hands under clean running water. Hold hands downward so dirty water drips away.',time:5,color:'#4D96FF'},
    {emoji:'🧻',title:'Dry completely',desc:'Dry hands with a clean towel or air dry. Wet hands spread more germs than dry hands!',time:5,color:'#C8945A'},
  ];
  var totalTime=steps.reduce(function(s,st){return s+st.time;},0);
  var timer=null, timerCount=0, running=false;

  function render(){
    var s=steps[step];
    var progress=(step/steps.length)*100;
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">🧼 Proper Hand Washing — WHO Method</div>'+
      /* Progress */
      '<div style="height:6px;background:var(--surface2);border-radius:3px;margin-bottom:10px">'+
      '<div style="height:6px;width:'+progress+'%;background:var(--evs);border-radius:3px;transition:width .4s"></div></div>'+
      '<div style="text-align:center;font-size:10px;color:var(--muted);margin-bottom:8px">Step '+(step+1)+' of '+steps.length+' · Total time: ~'+totalTime+' seconds</div>'+
      /* Current step */
      '<div style="background:'+s.color+'15;border:2px solid '+s.color+'44;border-radius:14px;padding:20px;text-align:center;margin-bottom:10px">'+
      '<div style="font-size:56px;margin-bottom:8px;animation:pulse 1.5s ease infinite">'+s.emoji+'</div>'+
      '<div style="font-size:16px;font-weight:900;color:'+s.color+';margin-bottom:6px">'+s.title+'</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:8px">'+s.desc+'</div>'+
      '<div style="font-size:11px;color:var(--muted)">⏱ Hold for ~'+s.time+' seconds</div>'+
      '</div>'+
      /* Navigation */
      '<div class="ctrl-row">' +
      (step>0?'<button class="cbtn" onclick="hwStep(-1)">← Back</button>':'<div></div>')+
      '<div style="display:flex;gap:4px">' +
      steps.map(function(_,i){return '<div style="width:8px;height:8px;border-radius:50%;background:'+(i<=step?s.color:'var(--border)')+';transition:all .3s"></div>';}).join('')+
      '</div>'+
      (step<steps.length-1?'<button class="cbtn" onclick="hwStep(1)" style="background:'+s.color+';color:white;border-color:'+s.color+'">Next →</button>':
       '<button class="cbtn" onclick="hwStep(-'+step+')" style="background:var(--evs);color:white;border-color:var(--evs)">✅ Done! Restart</button>')+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">'+
      'Proper hand washing for 20 seconds kills 99% of germs. Most people wash for only 6 seconds!'+
      '</div>';
  }

  window.hwStep=function(d){step=Math.max(0,Math.min(steps.length-1,step+d));render();};
  render();
};

/* ── 10. FACTORISATION (factorisation) ── */
SIM_REGISTRY['factorisation'] = function(c) {
  var n=12;

  function primeFactors(num) {
    var factors=[];
    for(var d=2;d<=num;d++){while(num%d===0){factors.push(d);num/=d;}}
    return factors;
  }

  function allFactors(num) {
    var f=[];
    for(var i=1;i<=num;i++){if(num%i===0)f.push(i);}
    return f;
  }

  function render() {
    var pf=primeFactors(n);
    var af=allFactors(n);
    var isPrime=pf.length===1;

    /* Factor tree */
    var treeHTML='<svg width="280" height="160" style="display:block;width:100%"><rect width="280" height="160" fill="#0a0a1a" rx="10"/>';
    function drawTree(ctx,num,x,y,depth,svgParts) {
      svgParts.push('<circle cx="'+x+'" cy="'+y+'" r="18" fill="'+(isPrimeNum(num)?'var(--evs)':'var(--acc)')+'" opacity="0.8"/>');
      svgParts.push('<text x="'+x+'" y="'+(y+5)+'" fill="white" font-size="11" font-weight="bold" text-anchor="middle" font-family="Nunito">'+num+'</text>');
      if(!isPrimeNum(num)&&depth<3){
        var d=smallestFactor(num);
        var other=num/d;
        var spread=60/depth;
        [[x-spread,y+40,d],[x+spread,y+40,other]].forEach(function(child){
          svgParts.push('<line x1="'+x+'" y1="'+(y+18)+'" x2="'+child[0]+'" y2="'+(child[1]-18)+'" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>');
          drawTree(ctx,child[2],child[0],child[1],depth+1,svgParts);
        });
      }
    }
    function isPrimeNum(num){return num>1&&primeFactors(num).length===1;}
    function smallestFactor(num){for(var i=2;i<=num;i++){if(num%i===0)return i;}return num;}

    var parts=[];
    drawTree(null,n,140,25,1,parts);
    treeHTML+=parts.join('')+'</svg>';

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Factorisation</div>'+
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;justify-content:center">'+
      '<span style="font-size:13px;color:var(--muted)">Number:</span>'+
      '<input type="number" min="2" max="100" value="'+n+'" onchange="factN(this.value)" style="width:70px;background:var(--surface);border:1.5px solid var(--acc);border-radius:8px;padding:6px;color:var(--acc);font-size:20px;font-weight:900;text-align:center">'+
      '<input type="range" class="slide" min="2" max="100" value="'+n+'" oninput="factN(this.value)" style="width:120px">'+
      '</div>'+
      /* Factor tree */
      '<div style="margin-bottom:8px">'+treeHTML+'</div>'+
      /* Results */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;color:var(--muted)">Prime factors</div>'+
      '<div style="font-size:16px;font-weight:900;color:var(--evs)">'+pf.join(' × ')+'</div>'+
      '<div style="font-size:10px;color:var(--muted)">'+n+' = '+pf.join(' × ')+(isPrime?' (prime!':' (composite)')+'</div>'+
      '</div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;color:var(--muted)">All factors ('+af.length+')</div>'+
      '<div style="font-size:12px;font-weight:700;color:var(--acc)">'+af.join(', ')+'</div>'+
      '<div style="font-size:10px;color:var(--muted)'+'">Factor pairs: '+Math.floor(af.length/2)+'</div>'+
      '</div></div>'+
      (isPrime?'<div style="background:var(--evs-dim);border:1px solid var(--evs)44;border-radius:10px;padding:10px;font-size:12px;color:var(--text);text-align:center">⭐ '+n+' is a <b>prime number</b> — only divisible by 1 and itself!</div>':'');
  }

  window.factN=function(v){n=Math.max(2,Math.min(100,parseInt(v)||2));render();};
  render();
};

/* ── 11. DATA AVERAGES (data-averages) ── */
SIM_REGISTRY['data-averages'] = function(c) {
  var datasets=[
    {name:'🌡️ Weekly Temperatures (°C)',data:[28,32,30,35,31,29,33]},
    {name:'📚 Test Scores',data:[72,85,91,68,78,95,82,74]},
    {name:'🚶 Steps per Day (×100)',data:[65,80,45,90,70,55,85,60]},
    {name:'Custom',data:[3,7,5,9,4,8]},
  ];
  var sel=0;

  function render(){
    var d=datasets[sel].data;
    var mean=d.reduce(function(a,b){return a+b;},0)/d.length;
    var sorted=d.slice().sort(function(a,b){return a-b;});
    var mid=Math.floor(d.length/2);
    var median=d.length%2===0?(sorted[mid-1]+sorted[mid])/2:sorted[mid];
    var freq={};d.forEach(function(v){freq[v]=(freq[v]||0)+1;});
    var maxF=Math.max.apply(null,Object.values(freq));
    var mode=Object.keys(freq).filter(function(k){return freq[k]===maxF;}).join(', ');
    var range=Math.max.apply(null,d)-Math.min.apply(null,d);
    var max=Math.max.apply(null,d);

    var bars=d.map(function(v,i){
      var h=(v/max)*90;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">'+
        '<div style="font-size:9px;font-weight:800;color:var(--text)">'+v+'</div>'+
        '<div style="width:100%;height:'+h+'px;background:var(--acc);border-radius:3px 3px 0 0;position:relative">'+
        (Math.abs(v-mean)<0.5?'<div style="position:absolute;bottom:0;left:0;right:0;background:var(--math);height:4px;border-radius:2px"></div>':'')+
        '</div>'+
        '<div style="font-size:8px;color:var(--muted)">'+(i+1)+'</div>'+
        '</div>';
    }).join('');

    /* Mean line position */
    var meanPct=(mean/max)*90;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Data Averages</div>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">'+
      datasets.map(function(ds,i){
        return '<button onclick="avgSel('+i+')" style="padding:4px 8px;border-radius:8px;font-size:10px;border:1.5px solid '+(i===sel?'var(--acc)':'var(--border)')+';background:'+(i===sel?'var(--acc-dim)':'var(--surface2)')+';color:'+(i===sel?'var(--acc)':'var(--muted)')+';cursor:pointer;font-weight:700">'+ds.name+'</button>';
      }).join('')+'</div>'+
      '<div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:6px">'+datasets[sel].name+'</div>'+
      '<div style="display:flex;align-items:flex-end;height:110px;gap:4px;border-bottom:2px solid var(--border);border-left:2px solid var(--border);position:relative;padding:0 4px;margin-bottom:6px">'+
      bars+
      '<div style="position:absolute;bottom:'+(meanPct)+'px;left:0;right:0;border-top:2px dashed var(--math);pointer-events:none"></div>'+
      '</div>'+
      '<div style="font-size:10px;color:var(--math);margin-bottom:8px">— Mean line = '+mean.toFixed(1)+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
      [{l:'📊 Mean',v:mean.toFixed(2),c:'var(--math)',f:'Sum ÷ Count'},{l:'📍 Median',v:median,c:'var(--acc)',f:'Middle value'},{l:'🔄 Mode',v:mode,c:'var(--evs)',f:'Most frequent'},{l:'📏 Range',v:range,c:'var(--sci)',f:'Max − Min'}].map(function(s){
        return '<div style="background:var(--surface2);border-radius:9px;padding:8px;border:1px solid var(--border)">'+
          '<div style="font-size:10px;color:var(--muted)">'+s.l+'</div>'+
          '<div style="font-size:18px;font-weight:900;color:'+s.c+'">'+s.v+'</div>'+
          '<div style="font-size:9px;color:var(--muted)">'+s.f+'</div></div>';
      }).join('')+'</div>';
  }

  window.avgSel=function(i){sel=i;render();};
  render();
};

/* ── 12. GOAL SETTING (goal-setting) ── */
SIM_REGISTRY['linear-equations'] = function(c) {
  var a=2, b=3, rhs=9, step=0;

  function render(){
    /* Solve ax + b = rhs => x = (rhs-b)/a */
    var x_val=a!==0?(rhs-b)/a:null;
    var steps=[
      {desc:'Start with the equation',eq:'<b style="color:var(--acc)">'+a+'x</b> + <b style="color:var(--math)">'+b+'</b> = <b style="color:var(--evs)">'+rhs+'</b>'},
      {desc:'Subtract '+b+' from both sides',eq:'<b style="color:var(--acc)">'+a+'x</b> + '+b+' − '+b+' = '+rhs+' − '+b+'<br><b style="color:var(--acc)">'+a+'x</b> = <b style="color:var(--evs)">'+(rhs-b)+'</b>'},
      {desc:'Divide both sides by '+a,eq:'<b style="color:var(--acc)">'+a+'x</b> ÷ '+a+' = '+(rhs-b)+' ÷ '+a+'<br><b style="color:var(--sci)">x = '+x_val+'</b>'},
      {desc:'Verify: substitute back',eq:'<b style="color:var(--acc)">'+a+'</b> × <b style="color:var(--sci)">'+x_val+'</b> + <b style="color:var(--math)">'+b+'</b> = '+((a*(x_val||0))+b)+' = <b style="color:var(--evs)">'+rhs+'</b> ✅'},
    ];

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Solving Linear Equations</div>'+
      /* Big equation */
      '<div style="text-align:center;font-size:28px;font-weight:900;margin-bottom:10px;background:#0a0a1a;border-radius:12px;padding:14px">'+
      '<span style="color:var(--acc)">'+a+'x</span>'+
      '<span style="color:var(--muted)"> + </span>'+
      '<span style="color:var(--math)">'+b+'</span>'+
      '<span style="color:var(--muted)"> = </span>'+
      '<span style="color:var(--evs)">'+rhs+'</span>'+
      '</div>'+
      /* Step-by-step solution */
      '<div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid var(--border)">'+
      '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:10px">'+
      steps.map(function(_,i){return '<div style="width:'+(i===step?'24px':'8px')+';height:8px;border-radius:4px;background:'+(i<=step?'var(--acc)':'var(--border)')+';transition:all .3s"></div>';}).join('')+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">Step '+(step+1)+': '+steps[step].desc+'</div>'+
      '<div style="font-size:18px;font-weight:700;color:var(--text);line-height:1.8">'+steps[step].eq+'</div>'+
      '</div>'+
      /* Navigation */
      '<div class="ctrl-row" style="margin-bottom:10px">'+
      (step>0?'<button class="cbtn" onclick="leqStep(-1)">← Back</button>':'<div></div>')+
      (step<steps.length-1?'<button class="cbtn" onclick="leqStep(1)" style="background:var(--acc);color:white;border-color:var(--acc)">Next Step →</button>':
       '<button class="cbtn" onclick="leqStep(-'+step+')" style="background:var(--evs);color:white;border-color:var(--evs)">✅ Solved! Restart</button>')+
      '</div>'+
      /* Controls */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:var(--acc)">a: <b>'+a+'</b></span>'+
      '<input type="range" class="slide" min="1" max="10" value="'+a+'" oninput="leqA(this.value)" style="width:80px">'+
      '<span style="font-size:11px;color:var(--math)">b: <b>'+b+'</b></span>'+
      '<input type="range" class="slide" min="0" max="20" value="'+b+'" oninput="leqB(this.value)" style="width:80px">'+
      '<span style="font-size:11px;color:var(--evs)">rhs: <b>'+rhs+'</b></span>'+
      '<input type="range" class="slide" min="1" max="50" value="'+rhs+'" oninput="leqRhs(this.value)" style="width:80px">'+
      '</div>';
  }

  window.leqStep=function(d){step=Math.max(0,Math.min(3,step+d));render();};
  window.leqA=function(v){a=parseInt(v);step=0;render();};
  window.leqB=function(v){b=parseInt(v);step=0;render();};
  window.leqRhs=function(v){rhs=parseInt(v);step=0;render();};
  render();
};


/* ══════════════════════════════════════
   BATCH 8 — 14 simulations
   ══════════════════════════════════════ */

/* ── 1. REACTIVITY SERIES (reactivity-series) ── */
SIM_REGISTRY['reactivity-series'] = function(c) {
  var selected = null;
  var metals = [
    { name:'Potassium',  sym:'K',  react:10, color:'#FF6B6B', fact:'Explodes violently in water! Must be stored in oil.', reacts:['water','acid','oxygen'] },
    { name:'Sodium',     sym:'Na', react:9,  color:'#FF8C42', fact:'Melts into a ball and fizzes wildly in water.', reacts:['water','acid','oxygen'] },
    { name:'Calcium',    sym:'Ca', react:8,  color:'#FFD93D', fact:'Fizzes steadily in water. Used in cement.', reacts:['water','acid','oxygen'] },
    { name:'Magnesium',  sym:'Mg', react:7,  color:'#C8D44A', fact:'Burns with brilliant white flame. Used in fireworks.', reacts:['steam','acid','oxygen'] },
    { name:'Zinc',       sym:'Zn', react:5,  color:'#6BCB77', fact:'Displaces copper from solution. Used to galvanise iron.', reacts:['acid','oxygen'] },
    { name:'Iron',       sym:'Fe', react:4,  color:'#4D96FF', fact:'Rusts slowly in air & water. Used in bridges, buildings.', reacts:['acid','oxygen'] },
    { name:'Lead',       sym:'Pb', react:3,  color:'#888',    fact:'Very slow to react. Used in batteries & radiation shields.', reacts:['acid'] },
    { name:'Copper',     sym:'Cu', react:2,  color:'#C8945A', fact:'No reaction with water or dilute acid. Coins & wires.', reacts:['oxygen'] },
    { name:'Gold',       sym:'Au', react:0,  color:'#FFD93D', fact:'Does not react with anything! That\'s why it stays shiny forever.', reacts:[] },
  ];

  function render() {
    var W=280;
    var bars = metals.map(function(m, i) {
      var isSel = selected === i;
      var barW = (m.react/10)*100;
      return '<div onclick="reactSel('+i+')" style="margin-bottom:5px;cursor:pointer">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">' +
        '<div style="width:28px;height:28px;border-radius:6px;background:'+m.color+(isSel?'':' ') +';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:'+(isSel?'white':m.color)+';border:2px solid '+m.color+';flex-shrink:0;background:'+(isSel?m.color:m.color+'22')+'">'+m.sym+'</div>' +
        '<div style="flex:1">' +
        '<div style="height:18px;background:'+m.color+'22;border-radius:4px;overflow:hidden">' +
        '<div style="height:100%;width:'+barW+'%;background:'+m.color+';border-radius:4px;transition:width .4s"></div></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--muted);min-width:70px">'+m.name+'</div>' +
        '</div></div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Reactivity Series</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-bottom:4px"><span>← More reactive</span><span>Less reactive →</span></div>' +
      bars +
      '<div style="margin-top:10px;min-height:80px;background:var(--surface2);border-radius:12px;padding:10px 14px;border:1px solid var(--border)">' +
      (selected !== null ?
        '<div style="font-size:14px;font-weight:900;color:'+metals[selected].color+'">'+metals[selected].name+' ('+metals[selected].sym+')</div>' +
        '<div style="font-size:11px;color:var(--muted);margin:3px 0">Reacts with: <b style="color:var(--text)">'+(metals[selected].reacts.length?metals[selected].reacts.join(', '):'nothing!')+' </b></div>' +
        '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:4px">'+metals[selected].fact+'</div>'
        : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:10px 0">☝️ Tap a metal to see its properties</div>') +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">A more reactive metal displaces a less reactive metal from its salt solution. Gold never tarnishes — it\'s unreactive!</div>';
  }

  window.reactSel = function(i) { selected = selected===i?null:i; render(); };
  render();
};

/* ── 2. RATIO AND COOKING (ratio-cooking) ── */
SIM_REGISTRY['transformations'] = function(c) {
  var type='translation', tx=3, ty=2, angle=90, sx=1.5;

  function render() {
    var W=280, H=200, CX=W/2, CY=H/2, scale=16;
    /* Original triangle */
    var orig=[[1,1],[4,1],[2.5,4]];
    var transformed;
    if(type==='translation') transformed=orig.map(function(p){return[p[0]+tx,p[1]-ty];});
    else if(type==='rotation') {
      var rad=angle*Math.PI/180;
      transformed=orig.map(function(p){return[p[0]*Math.cos(rad)-p[1]*Math.sin(rad),p[0]*Math.sin(rad)+p[1]*Math.cos(rad)];});
    } else if(type==='reflection') transformed=orig.map(function(p){return[-p[0],p[1]];});
    else transformed=orig.map(function(p){return[p[0]*sx,p[1]*sx];});

    function toSVG(pts,color,dash) {
      var coords=pts.map(function(p){return (CX+p[0]*scale)+','+(CY-p[1]*scale);}).join(' ');
      return '<polygon points="'+coords+'" fill="'+color+'22" stroke="'+color+'" stroke-width="2.5"'+(dash?' stroke-dasharray="6,4"':'')+'/>';
    }
    function labels(pts,prefix,color) {
      return pts.map(function(p,i){return '<text x="'+(CX+p[0]*scale+5)+'" y="'+(CY-p[1]*scale+4)+'" fill="'+color+'" font-size="9" font-family="Nunito">'+prefix+(i+1)+'</text>';}).join('');
    }

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Geometric Transformations</div>'+
      '<div class="ctrl-row" style="margin-bottom:6px;flex-wrap:wrap;gap:5px">'+
      ['translation','rotation','reflection','enlargement'].map(function(t){
        return '<button onclick="transType(\''+t+'\')" style="padding:4px 9px;border-radius:8px;font-size:11px;border:1.5px solid '+(t===type?'var(--acc)':'var(--border)')+';background:'+(t===type?'var(--acc-dim)':'var(--surface2)')+';color:'+(t===type?'var(--acc)':'var(--muted)')+';cursor:pointer;font-weight:800">'+t+'</button>';
      }).join('')+'</div>'+
      '<svg width="'+W+'" height="'+H+'" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">'+
      /* Grid */
      (function(){var g='';for(var i=-8;i<=8;i++){var gx=CX+i*scale,gy=CY+i*scale;g+='<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="'+H+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/><line x1="0" y1="'+gy+'" x2="'+W+'" y2="'+gy+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/>';}return g;})() +
      /* Axes */
      '<line x1="0" y1="'+CY+'" x2="'+W+'" y2="'+CY+'" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>'+
      '<line x1="'+CX+'" y1="0" x2="'+CX+'" y2="'+H+'" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>'+
      /* Shapes */
      toSVG(orig,'#4D96FF',false)+labels(orig,'A','#4D96FF')+
      toSVG(transformed,'#FF6B6B',true)+labels(transformed,'A\'','#FF6B6B')+
      /* Arrow for translation */
      (type==='translation'?'<defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,217,61,.6)"/></marker></defs><line x1="'+(CX+orig[0][0]*scale)+'" y1="'+(CY-orig[0][1]*scale)+'" x2="'+(CX+transformed[0][0]*scale)+'" y2="'+(CY-transformed[0][1]*scale)+'" stroke="rgba(255,217,61,.5)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arr2)"/>':'') +
      /* Legend */
      '<text x="8" y="14" fill="#4D96FF" font-size="9" font-family="Nunito">■ Original (A)</text>'+
      '<text x="8" y="26" fill="#FF6B6B" font-size="9" font-family="Nunito">■ Image (A\')</text>'+
      '</svg>'+
      /* Controls */
      '<div class="ctrl-row" style="margin-top:8px;flex-wrap:wrap;gap:8px">'+
      (type==='translation'
        ? '<span style="font-size:11px;color:var(--muted)">→ '+tx+'</span><input type="range" class="slide" min="-5" max="5" value="'+tx+'" oninput="transTx(this.value)" style="width:80px"><span style="font-size:11px;color:var(--muted)">↑ '+ty+'</span><input type="range" class="slide" min="-5" max="5" value="'+ty+'" oninput="transTy(this.value)" style="width:80px">'
        : type==='rotation'
        ? '<span style="font-size:11px;color:var(--muted)">Angle: <b>'+angle+'°</b></span><input type="range" class="slide" min="0" max="360" value="'+angle+'" oninput="transAngle(this.value)" style="width:160px">'
        : type==='enlargement'
        ? '<span style="font-size:11px;color:var(--muted)">Scale: <b>'+sx+'×</b></span><input type="range" class="slide" min="0.5" max="3" step="0.5" value="'+sx+'" oninput="transSx(this.value)" style="width:160px">'
        : '<span style="font-size:11px;color:var(--muted)">Reflected in Y-axis</span>'
      )+'</div>';
  }

  window.transType=function(t){type=t;render();};
  window.transTx=function(v){tx=parseInt(v);render();};
  window.transTy=function(v){ty=parseInt(v);render();};
  window.transAngle=function(v){angle=parseInt(v);render();};
  window.transSx=function(v){sx=parseFloat(v);render();};
  render();
};

/* ── 6. CONGRUENCE (congruence) ── */
SIM_REGISTRY['congruence'] = function(c) {
  var rule='sss', t2=0, raf2;

  var rules={
    sss:{name:'SSS — Side Side Side',color:'#6BCB77',desc:'If all 3 sides are equal, triangles are congruent. The strongest proof!',draw:function(ctx,W,H,t){drawCongruent(ctx,W,H,t,true,true,true,false,false,false);}},
    sas:{name:'SAS — Side Angle Side',color:'#FFD93D',desc:'Two equal sides with the equal angle between them → congruent.',draw:function(ctx,W,H,t){drawCongruent(ctx,W,H,t,true,false,true,false,true,false);}},
    asa:{name:'ASA — Angle Side Angle',color:'#4D96FF',desc:'Two equal angles with the equal side between them → congruent.',draw:function(ctx,W,H,t){drawCongruent(ctx,W,H,t,false,true,false,true,false,true);}},
    rhs:{name:'RHS — Right Hypotenuse Side',color:'#FF6B6B',desc:'Right angle, hypotenuse, and one side equal → congruent. Only for right triangles!',draw:function(ctx,W,H,t){drawCongruent(ctx,W,H,t,false,true,true,true,false,false);}},
  };

  function drawCongruent(ctx,W,H,t,s1,s2,s3,a1,a2,a3){
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    var r=rules[rule];
    function drawTri(ox,oy,flip,sz){
      var pts=[[ox,oy+sz],[ox+sz*0.7,oy+sz],[ox+sz*0.35,oy]];
      if(flip) pts=[[ox+sz,oy+sz],[ox+sz*0.3,oy+sz],[ox+sz*0.65,oy]];
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
      pts.forEach(function(p){ctx.lineTo(p[0],p[1]);}); ctx.closePath();
      ctx.fillStyle=r.color+'18'; ctx.fill();
      ctx.strokeStyle=r.color; ctx.lineWidth=2.5; ctx.stroke();
      /* Tick marks for equal sides */
      var sides=[[pts[0],pts[1]],[pts[1],pts[2]],[pts[2],pts[0]]];
      var marks=[s1,s2,s3];
      sides.forEach(function(side,i){
        if(marks[i]){
          var mx=(side[0][0]+side[1][0])/2, my=(side[0][1]+side[1][1])/2;
          var dx=side[1][0]-side[0][0],dy=side[1][1]-side[0][1];
          var len=Math.sqrt(dx*dx+dy*dy);
          var nx=-dy/len*6, ny=dx/len*6;
          ctx.strokeStyle='white'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(mx+nx,my+ny); ctx.lineTo(mx-nx,my-ny); ctx.stroke();
        }
      });
      /* Angle arcs */
      var angles=[a1,a2,a3];
      pts.forEach(function(p,i){
        if(angles[i]){
          ctx.beginPath(); ctx.arc(p[0],p[1],12,0,Math.PI*2);
          ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1.5; ctx.stroke();
        }
      });
      return pts;
    }
    drawTri(W*0.05,H*0.15,false,H*0.65);
    /* Congruence symbol */
    ctx.fillStyle=r.color; ctx.font='bold 22px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('≅',W/2,H/2+8);
    drawTri(W*0.52,H*0.15,true,H*0.65);
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Triangle 1',W*0.25,H-6); ctx.fillText('Triangle 2',W*0.75,H-6);
  }

  function animate(){
    var _g=getCtx('congCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    t2+=0.02; raf2=requestAnimationFrame(animate);
  }

  function render(){
    var r=rules[rule];
    c.innerHTML=
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      Object.keys(rules).map(function(k){return '<button onclick="congRule(\''+k+'\')" style="padding:4px 9px;border-radius:8px;font-size:11px;border:1.5px solid '+(k===rule?rules[k].color:'var(--border)')+';background:'+(k===rule?rules[k].color+'22':'var(--surface2)')+';color:'+(k===rule?rules[k].color:'var(--muted)')+';cursor:pointer;font-weight:800">'+k.toUpperCase()+'</button>';}).join('')+'</div>'+
      '<canvas id="congCanvas" data-w="280" data-h="180" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border)">'+
      '<div style="font-size:13px;font-weight:900;color:'+r.color+';margin-bottom:4px">'+r.name+'</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+r.desc+'</div>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">Tick marks show equal sides. Arc marks show equal angles.</div>';
    cancelAnimationFrame(raf2); animate();
  }

  window.congRule=function(r){rule=r;cancelAnimationFrame(raf2);render();};
  window.simCleanup=function(){cancelAnimationFrame(raf2);};
  render();
};

/* ── 7. GLACIER AND SEA LEVEL (glacier-sea) ── */
SIM_REGISTRY['glacier-sea'] = function(c) {
  var raf2, t2=0, temp=0, running=true;

  function draw(){
    var _g=getCtx('glacierCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);

    var meltFrac=Math.max(0,Math.min(1,temp/6));
    var seaRise=meltFrac*60;
    var baseSeaY=H*0.65;
    var seaY=baseSeaY-seaRise;

    /* Sky */
    var skyColor=meltFrac>0.5?'rgba(80,50,30,':'rgba(30,60,100,';
    ctx.fillStyle=(skyColor+'0.95)'); ctx.fillRect(0,0,W,H*0.6);

    /* Sun/haze */
    var sunAlpha=0.6+meltFrac*0.4;
    ctx.beginPath(); ctx.arc(W*0.8,H*0.1,22+meltFrac*8,0,Math.PI*2);
    ctx.fillStyle='rgba(255,'+(220-meltFrac*80)+',50,'+sunAlpha+')';
    ctx.shadowColor='rgba(255,150,50,0.5)'; ctx.shadowBlur=30*meltFrac; ctx.fill(); ctx.shadowBlur=0;

    /* Mountain with glacier */
    ctx.fillStyle='#5a6a7a';
    ctx.beginPath(); ctx.moveTo(W*0.1,H*0.65); ctx.lineTo(W*0.35,H*0.1); ctx.lineTo(W*0.6,H*0.65); ctx.closePath(); ctx.fill();
    /* Ice cap */
    var iceSize=Math.max(0,1-meltFrac)*0.4;
    if(iceSize>0){
      ctx.fillStyle='rgba(220,240,255,'+Math.max(0.1,1-meltFrac)+')';
      ctx.beginPath(); ctx.moveTo(W*0.35,H*0.1); ctx.lineTo(W*0.35-W*iceSize,H*0.1+H*iceSize*1.2); ctx.lineTo(W*0.35+W*iceSize,H*0.1+H*iceSize*1.2); ctx.closePath(); ctx.fill();
    }
    /* Melt water drips */
    if(meltFrac>0.1){
      for(var i=0;i<4;i++){
        var dy=((t2*40+i*25)%80);
        ctx.beginPath(); ctx.arc(W*0.3+i*8,H*0.2+H*iceSize+dy,2,0,Math.PI*2);
        ctx.fillStyle='rgba(100,180,255,0.7)'; ctx.fill();
      }
    }

    /* Sea */
    var seaGrad=ctx.createLinearGradient(0,seaY,0,H);
    seaGrad.addColorStop(0,'rgba(30,100,200,0.8)'); seaGrad.addColorStop(1,'rgba(10,40,100,0.95)');
    ctx.fillStyle=seaGrad; ctx.fillRect(0,seaY,W,H-seaY);
    /* Wave */
    ctx.strokeStyle='rgba(100,180,255,0.4)'; ctx.lineWidth=2;
    ctx.beginPath();
    for(var wx=0;wx<W;wx++){ctx.lineTo(wx,seaY+Math.sin((wx+t2*20)/20)*3);}
    ctx.stroke();

    /* City at risk */
    var cityY=H*0.64;
    var underwater=cityY>seaY;
    [[W*0.7,40],[W*0.78,28],[W*0.86,35],[W*0.65,22]].forEach(function(b){
      ctx.fillStyle=underwater?'rgba(50,80,120,0.6)':'rgba(180,180,200,0.8)';
      ctx.fillRect(b[0]-8,cityY-b[1],16,b[1]);
    });
    if(underwater){
      ctx.fillStyle='rgba(100,180,255,0.3)';
      ctx.fillRect(W*0.6,seaY,W*0.4,cityY-seaY);
      ctx.fillStyle='rgba(255,100,100,.8)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('⚠️ Flooded!',W*0.75,cityY+14);
    }

    /* Stats */
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('Temp rise: +'+temp.toFixed(1)+'°C',8,16);
    ctx.fillStyle='rgba(77,150,255,.9)';
    ctx.fillText('Sea rise: +'+Math.round(seaRise)+'cm',8,30);

    t2+=0.04;
    if(running) raf2=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Glaciers & Sea Level Rise</div>'+
      '<canvas id="glacierCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<span style="font-size:11px;color:'+(temp>3?'#FF6B6B':temp>1.5?'#FFD93D':'#6BCB77')+'">🌡️ +'+temp.toFixed(1)+'°C</span>'+
      '<input type="range" class="slide" min="0" max="6" step="0.1" value="'+temp+'" oninput="glacierTemp(this.value)" style="flex:1">'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      (temp<1.5?'Paris Agreement target: keep warming below 1.5°C':temp<3?'⚠️ Significant melting. Small island nations threatened.':'🔴 Major cities at risk! Action needed now!')+
      '</div>';
    draw();
  }

  window.glacierTemp=function(v){temp=parseFloat(v);};
  window.simCleanup=function(){running=false;cancelAnimationFrame(raf2);};
  render();
};

/* ── 8. SOIL TYPES (soil-types) ── */
SIM_REGISTRY['soil-types'] = function(c) {
  var sel=0;
  var soils=[
    {name:'Sandy Soil',color:'#C8A96A',textColor:'#E8D4A0',emoji:'🏜️',particle:'Large grains',drainage:'Very fast — water drains quickly',fertility:'Low — nutrients wash away',crops:'Watermelons, peanuts, carrots',feel:'Gritty and grainy',india:'Rajasthan desert regions'},
    {name:'Clay Soil',color:'#8B4513',textColor:'#C8945A',emoji:'🏺',particle:'Very fine grains',drainage:'Very slow — waterlogged',fertility:'High — holds nutrients',crops:'Rice, wheat (with irrigation)',feel:'Smooth and sticky when wet',india:'Indo-Gangetic plains'},
    {name:'Loamy Soil',color:'#5a3a14',textColor:'#8B6914',emoji:'🌱',particle:'Mix of sand, clay, silt',drainage:'Good — ideal balance',fertility:'Very high — best for farming',crops:'Almost everything!',feel:'Crumbly and dark',india:'Kerala, Punjab — most fertile'},
    {name:'Black Soil',color:'#1a1a1a',textColor:'#888',emoji:'⬛',particle:'Fine, rich in minerals',drainage:'Moderate — holds moisture',fertility:'High — deep and fertile',crops:'Cotton (called black cotton soil)',feel:'Cracks when dry, sticky wet',india:'Deccan Plateau, Maharashtra'},
    {name:'Red Soil',color:'#8B2020',textColor:'#FF6B6B',emoji:'🔴',particle:'Iron oxide rich',drainage:'Good',fertility:'Low-medium',crops:'Groundnuts, millets, tobacco',feel:'Powdery, turns red in sun',india:'Tamil Nadu, Karnataka, AP'},
  ];

  function render(){
    var s=soils[sel];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Soil Types of India</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      soils.map(function(so,i){
        return '<button onclick="soilType('+i+')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(i===sel?so.textColor:'var(--border)')+';background:'+(i===sel?so.color+'44':'var(--surface2)')+';color:'+(i===sel?so.textColor:'var(--muted)')+';cursor:pointer;font-weight:800">'+so.emoji+' '+so.name.split(' ')[0]+'</button>';
      }).join('')+'</div>'+
      '<div style="background:'+s.color+'33;border:2px solid '+s.textColor+'44;border-radius:14px;padding:16px;margin-bottom:8px;text-align:center">'+
      '<div style="font-size:52px;margin-bottom:6px">'+s.emoji+'</div>'+
      '<div style="font-size:16px;font-weight:900;color:'+s.textColor+'">'+s.name+'</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
      [{l:'🔬 Particles',v:s.particle},{l:'💧 Drainage',v:s.drainage},{l:'🌱 Fertility',v:s.fertility},{l:'🌾 Best crops',v:s.crops},{l:'✋ Texture',v:s.feel},{l:'📍 India',v:s.india}].map(function(row){
        return '<div style="background:var(--surface2);border-radius:9px;padding:8px;border:1px solid var(--border)">'+
          '<div style="font-size:10px;color:var(--muted)">'+row.l+'</div>'+
          '<div style="font-size:11px;font-weight:700;color:var(--text);line-height:1.5">'+row.v+'</div>'+
          '</div>';
      }).join('')+'</div>';
  }

  window.soilType=function(i){sel=i;render();};
  render();
};

/* ── 9. TRANSPORT COMPARE (transport-compare) ── */
SIM_REGISTRY['transport-compare'] = function(c) {
  var distance=100;
  var modes=[
    {name:'🚶 Walk',     speed:5,   co2:0,   cost:0,    color:'#6BCB77'},
    {name:'🚲 Cycle',    speed:15,  co2:0,   cost:0,    color:'#4D96FF'},
    {name:'🚌 Bus',      speed:40,  co2:4.4, cost:5,    color:'#FFD93D'},
    {name:'🚂 Train',    speed:80,  co2:6,   cost:8,    color:'#C77DFF'},
    {name:'🚗 Car',      speed:60,  co2:21,  cost:12,   color:'#FF8C42'},
    {name:'✈️ Plane',    speed:800, co2:255, cost:150,  color:'#FF6B6B'},
  ];

  function render(){
    var rows=modes.map(function(m){
      var time=distance/m.speed;
      var timeStr=time<1?(time*60).toFixed(0)+'m':(time).toFixed(1)+'h';
      var totalCO2=(m.co2*distance/1000).toFixed(2);
      var totalCost=(m.cost*distance/100).toFixed(0);
      return '<div style="display:grid;grid-template-columns:90px 1fr 1fr 1fr;gap:4px;align-items:center;background:var(--surface2);border-radius:9px;padding:8px 10px;border:1px solid var(--border)">'+
        '<div style="font-size:12px;font-weight:800;color:'+m.color+'">'+m.name+'</div>'+
        '<div style="text-align:center"><div style="font-size:14px;font-weight:900;color:var(--text)">'+timeStr+'</div><div style="font-size:8px;color:var(--muted)">time</div></div>'+
        '<div style="text-align:center"><div style="font-size:14px;font-weight:900;color:'+(m.co2===0?'var(--evs)':m.co2<10?'var(--math)':'var(--sci)')+'">'+totalCO2+'kg</div><div style="font-size:8px;color:var(--muted)">CO₂</div></div>'+
        '<div style="text-align:center"><div style="font-size:14px;font-weight:900;color:var(--acc)">₹'+totalCost+'</div><div style="font-size:8px;color:var(--muted)">cost</div></div>'+
        '</div>';
    }).join('');

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Transport Comparison</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
      '<span style="font-size:11px;color:var(--muted)">Distance:</span>'+
      '<input type="range" class="slide" min="5" max="1000" step="5" value="'+distance+'" oninput="transDistance(this.value)" style="flex:1">'+
      '<span style="font-size:16px;font-weight:900;color:var(--acc)">'+distance+'km</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:90px 1fr 1fr 1fr;gap:4px;margin-bottom:6px;padding:0 10px">'+
      '<div style="font-size:9px;color:var(--muted)">Mode</div><div style="font-size:9px;color:var(--muted);text-align:center">⏱ Time</div>'+
      '<div style="font-size:9px;color:var(--muted);text-align:center">🌍 CO₂</div><div style="font-size:9px;color:var(--muted);text-align:center">💰 Cost</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+rows+'</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">'+
      '🌱 Cycling & walking produce zero carbon emissions! Trains are 10× more efficient than planes per km.'+
      '</div>';
  }

  window.transDistance=function(v){distance=parseInt(v);render();};
  render();
};

/* ── 10. MICROPLASTICS (microplastics) ── */
SIM_REGISTRY['microplastics'] = function(c) {
  var raf2, t2=0, particles=[], clean=true;

  function init(){
    particles=[];
    for(var i=0;i<30;i++){
      particles.push({
        x:Math.random()*280+10,y:Math.random()*120+30,
        vx:(Math.random()-.5)*0.5,vy:(Math.random()-.5)*0.3,
        size:Math.random()*4+1,type:Math.floor(Math.random()*3),
        color:clean?'rgba(255,255,255,0.05)':['rgba(200,100,50,.7)','rgba(150,150,255,.6)','rgba(255,200,100,.6)'][Math.floor(Math.random()*3)]
      });
    }
  }

  function draw(){
    var _g=getCtx('microCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);

    /* Ocean */
    var grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,clean?'rgba(20,80,180,0.9)':'rgba(30,60,80,0.9)');
    grad.addColorStop(1,clean?'rgba(10,40,100,0.95)':'rgba(20,40,60,0.95)');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

    /* Waves */
    ctx.strokeStyle='rgba(100,180,255,0.2)'; ctx.lineWidth=1.5;
    ctx.beginPath();
    for(var wx=0;wx<W;wx++) ctx.lineTo(wx,20+Math.sin((wx+t2*15)/30)*4);
    ctx.stroke();

    /* Fish */
    var fx=((t2*30)%W+50)%W, fy=H*0.4;
    ctx.fillStyle=clean?'rgba(107,203,119,0.8)':'rgba(255,107,107,0.7)';
    ctx.beginPath(); ctx.ellipse(fx,fy,18,8,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx-18,fy); ctx.lineTo(fx-28,fy-8); ctx.lineTo(fx-28,fy+8); ctx.closePath(); ctx.fill();
    ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(fx+10,fy-2,2.5,0,Math.PI*2); ctx.fill();

    /* Particles */
    particles.forEach(function(p){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle=clean?'rgba(255,255,255,0.06)':p.color; ctx.fill();
    });

    /* Pollution level */
    if(!clean){
      ctx.fillStyle='rgba(255,107,107,0.6)'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('⚠️ '+particles.length+' microplastic particles visible',W/2,H-8);
    } else {
      ctx.fillStyle='rgba(107,203,119,0.7)'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('✅ Clean ocean',W/2,H-8);
    }

    t2+=0.04;
    raf2=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Microplastics in the Ocean</div>'+
      '<canvas id="microCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<button class="cbtn" onclick="microToggle()" id="microBtn" style="background:var(--sci);color:white;border-color:var(--sci)">🏭 Add Pollution</button>'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      '🐟 8 million tonnes of plastic enter oceans every year. Microplastics (<5mm) are eaten by fish → eaten by us. Every human now has microplastics in their blood!'+
      '</div>';
    cancelAnimationFrame(raf2); init(); draw();
  }

  window.microToggle=function(){
    clean=!clean; init();
    var btn=document.getElementById('microBtn');
    btn.textContent=clean?'🏭 Add Pollution':'🌊 Clean Ocean';
    btn.style.background=clean?'var(--sci)':'var(--evs)';
  };
  window.simCleanup=function(){cancelAnimationFrame(raf2);};
  render();
};

/* ── 11. DIGITAL SAFETY (digital-safety) ── */
SIM_REGISTRY['digital-safety'] = function(c) {
  var scenario=0;
  var scenarios=[
    {emoji:'🔐',title:'Strong Passwords',color:'#6BCB77',
     good:['Use 12+ characters','Mix letters, numbers, symbols','Different password for each site','Use a password manager'],
     bad:['Using "password123"','Using your name/birthday','Same password everywhere','Sharing passwords with friends'],
     example:'"Tr0pical$un#42!" is STRONG. "john123" is WEAK.'},
    {emoji:'🎣',title:'Phishing Scams',color:'#FFD93D',
     good:['Check the sender\'s email address carefully','Hover over links before clicking','Never share OTP or passwords','Report suspicious messages'],
     bad:['Clicking unknown links immediately','Giving OTP to anyone who calls','Believing "You won a prize!" messages','Downloading unknown attachments'],
     example:'"Your bank account is locked, click here" = SCAM!'},
    {emoji:'👤',title:'Privacy Online',color:'#4D96FF',
     good:['Keep personal info private','Use nicknames in games','Tell a trusted adult if uncomfortable','Check app permissions'],
     bad:['Sharing your home address','Posting school name publicly','Accepting unknown friend requests','Sharing location always-on'],
     example:'Never share full name + school + address together.'},
    {emoji:'🤝',title:'Cyberbullying',color:'#C77DFF',
     good:['Don\'t respond to bullies online','Save evidence (screenshots)','Block and report immediately','Tell a trusted adult'],
     bad:['Joining in on bullying others','Sharing embarrassing photos of others','Threatening or harassing online','Staying silent if being bullied'],
     example:'If you see cyberbullying, don\'t share it — report it!'},
  ];

  function render(){
    var s=scenarios[scenario];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Digital Safety</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      scenarios.map(function(sc,i){
        return '<button onclick="digSel('+i+')" style="padding:5px 9px;border-radius:9px;font-size:12px;border:1.5px solid '+(i===scenario?sc.color:'var(--border)')+';background:'+(i===scenario?sc.color+'22':'var(--surface2)')+';color:'+(i===scenario?sc.color:'var(--muted)')+';cursor:pointer;font-weight:800">'+sc.emoji+'</button>';
      }).join('')+'</div>'+
      '<div style="text-align:center;margin-bottom:10px"><span style="font-size:40px">'+s.emoji+'</span><div style="font-size:16px;font-weight:900;color:'+s.color+'">'+s.title+'</div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--evs);margin-bottom:6px">✅ DO</div>'+
      s.good.map(function(g){return '<div style="font-size:11px;color:var(--text);margin-bottom:4px;line-height:1.5">• '+g+'</div>';}).join('')+
      '</div>'+
      '<div style="background:var(--sci-dim);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--sci);margin-bottom:6px">❌ DON\'T</div>'+
      s.bad.map(function(b){return '<div style="font-size:11px;color:var(--text);margin-bottom:4px;line-height:1.5">• '+b+'</div>';}).join('')+
      '</div></div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;color:var(--text);line-height:1.7">'+
      '💡 '+s.example+'</div>';
  }

  window.digSel=function(i){scenario=i;render();};
  render();
};

/* ── 12. CROP SEASONS (crop-seasons) ── */
SIM_REGISTRY['crop-seasons'] = function(c) {
  var season='kharif';
  var crops={
    kharif:{
      name:'☔ Kharif Season (June–October)',color:'#6BCB77',
      desc:'Monsoon crops. Sown at start of monsoon, harvested in autumn. India depends on this season for food security.',
      crops:[
        {name:'🌾 Rice',     months:'Jun-Nov', states:'West Bengal, UP, AP',    water:'High'},
        {name:'🌽 Maize',    months:'Jun-Sep', states:'Karnataka, MP, Bihar',   water:'Medium'},
        {name:'🌿 Soybean',  months:'Jun-Sep', states:'MP, Maharashtra',        water:'Medium'},
        {name:'🥜 Groundnut',months:'Jun-Oct', states:'Gujarat, AP, Tamil Nadu',water:'Low-Med'},
        {name:'🌿 Cotton',   months:'Jun-Nov', states:'Maharashtra, Gujarat',   water:'Medium'},
      ]
    },
    rabi:{
      name:'❄️ Rabi Season (October–March)',color:'#4D96FF',
      desc:'Winter crops. Sown after monsoon, uses soil moisture + irrigation. Harvested before summer.',
      crops:[
        {name:'🌾 Wheat',    months:'Oct-Mar', states:'Punjab, Haryana, UP',    water:'Medium'},
        {name:'🫛 Mustard',  months:'Oct-Feb', states:'Rajasthan, UP, Haryana', water:'Low'},
        {name:'🧅 Onion',    months:'Oct-Jan', states:'Maharashtra, Karnataka', water:'Medium'},
        {name:'🥕 Potato',   months:'Oct-Jan', states:'UP, West Bengal',        water:'Medium'},
        {name:'🌱 Pea',      months:'Oct-Jan', states:'UP, Punjab, Karnataka',  water:'Low'},
      ]
    },
    zaid:{
      name:'☀️ Zaid Season (March–June)',color:'#FFD93D',
      desc:'Summer crops grown between rabi and kharif. Needs irrigation. Hot and dry conditions.',
      crops:[
        {name:'🍉 Watermelon',months:'Mar-Jun', states:'UP, AP, Karnataka',    water:'High'},
        {name:'🥒 Cucumber',  months:'Mar-Jun', states:'Karnataka, AP',        water:'High'},
        {name:'🍈 Muskmelon', months:'Mar-Jun', states:'UP, Rajasthan',        water:'High'},
        {name:'🌿 Fodder',    months:'Mar-Jun', states:'All states',           water:'Medium'},
      ]
    },
  };

  function render(){
    var s=crops[season];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Crop Seasons of India</div>'+
      '<div class="ctrl-row" style="margin-bottom:8px">'+
      Object.keys(crops).map(function(k){
        return '<button onclick="cropSeason(\''+k+'\')" style="padding:6px 12px;border-radius:9px;font-size:12px;border:1.5px solid '+(k===season?crops[k].color:'var(--border)')+';background:'+(k===season?crops[k].color+'22':'var(--surface2)')+';color:'+(k===season?crops[k].color:'var(--muted)')+';cursor:pointer;font-weight:800">'+crops[k].name.split(' ')[0]+' '+k.charAt(0).toUpperCase()+k.slice(1)+'</button>';
      }).join('')+'</div>'+
      '<div style="background:'+s.color+'22;border:1.5px solid '+s.color+'44;border-radius:12px;padding:10px 14px;margin-bottom:10px">'+
      '<div style="font-size:14px;font-weight:900;color:'+s.color+';margin-bottom:4px">'+s.name+'</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+s.desc+'</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px">'+
      s.crops.map(function(crop){
        return '<div style="display:grid;grid-template-columns:minmax(90px,auto) 70px 1fr minmax(60px,auto);gap:6px;align-items:center;background:var(--surface2);border-radius:9px;padding:7px 10px;border:1px solid var(--border)">'+
          '<div style="font-size:12px;font-weight:800;color:var(--text);white-space:nowrap">'+crop.name+'</div>'+
          '<div style="font-size:10px;color:var(--muted);white-space:nowrap">📅 '+crop.months+'</div>'+
          '<div style="font-size:10px;color:var(--muted)">📍 '+crop.states+'</div>'+
          '<div style="font-size:10px;white-space:nowrap;color:'+(crop.water==='High'?'var(--sci)':crop.water==='Medium'?'var(--math)':'var(--evs)')+'">💧 '+crop.water+'</div>'+
          '</div>';
      }).join('')+'</div>';
  }

  window.cropSeason=function(s){season=s;render();};
  render();
};

/* ── 13. WATER QUALITY (water-quality) ── */
SIM_REGISTRY['water-quality'] = function(c) {
  var raf2, drops=[], running=false, t2=0;
  var pollutants={industrial:0,agricultural:0,domestic:0};

  function getQuality(){
    var total=pollutants.industrial*3+pollutants.agricultural*2+pollutants.domestic;
    if(total<20)return{label:'✅ Clean',color:'#6BCB77',ph:7.2};
    if(total<50)return{label:'⚠️ Moderate',color:'#FFD93D',ph:6.5};
    if(total<80)return{label:'🔴 Polluted',color:'#FF8C42',ph:5.8};
    return{label:'☠️ Severely Polluted',color:'#FF6B6B',ph:4.5};
  }

  function draw(){
    var _g=getCtx('waterCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    var q=getQuality();
    var total=pollutants.industrial*3+pollutants.agricultural*2+pollutants.domestic;
    var dirtyFrac=Math.min(1,total/100);

    /* Water */
    ctx.fillStyle='rgba(20,'+Math.round(80-dirtyFrac*50)+','+Math.round(200-dirtyFrac*150)+',0.9)';
    ctx.fillRect(0,0,W,H);

    /* Ripples */
    ctx.strokeStyle='rgba(255,255,255,'+(0.1-dirtyFrac*0.08)+')'; ctx.lineWidth=1;
    for(var i=0;i<3;i++){
      var r=(t2*20+i*40)%120;
      ctx.beginPath(); ctx.arc(W/2,H/2,r,0,Math.PI*2); ctx.stroke();
    }

    /* Pollution particles */
    if(running&&Math.random()<0.15){
      drops.push({x:Math.random()*W,y:0,vy:1+Math.random(),color:pollutants.industrial>30?'rgba(100,50,50,.7)':pollutants.agricultural>30?'rgba(100,150,50,.7)':'rgba(100,100,180,.5)',size:2+Math.random()*4});
    }
    drops=drops.filter(function(d){
      d.y+=d.vy;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.size,0,Math.PI*2);
      ctx.fillStyle=d.color; ctx.fill();
      return d.y<H;
    });

    /* Fish indicator */
    if(dirtyFrac<0.3){
      [[W*0.25,H*0.5],[W*0.6,H*0.35],[W*0.8,H*0.65]].forEach(function(p){
        ctx.fillStyle='rgba(100,200,100,0.7)';
        ctx.beginPath(); ctx.ellipse(p[0],p[1],12,5,0,0,Math.PI*2); ctx.fill();
      });
    } else if(dirtyFrac>0.7){
      ctx.fillStyle='rgba(255,100,100,0.6)'; ctx.font='bold 12px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('💀 No fish can survive',W/2,H/2);
    }

    /* Quality label */
    ctx.fillStyle=q.color; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(q.label+'  |  pH: '+q.ph,W/2,H-8);

    t2+=0.05; raf2=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Water Quality Monitor</div>'+
      '<canvas id="waterCanvas" data-w="300" data-h="160" style="border-radius:12px;display:block;width:100%;margin-bottom:8px"></canvas>'+
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px">'+
      [{k:'industrial',label:'🏭 Industrial waste',max:40},{k:'agricultural',label:'🌾 Agricultural runoff',max:40},{k:'domestic',label:'🏠 Domestic sewage',max:40}].map(function(item){
        return '<div style="display:flex;align-items:center;gap:8px">'+
          '<span style="font-size:11px;color:var(--muted);min-width:140px">'+item.label+'</span>'+
          '<input type="range" class="slide" min="0" max="'+item.max+'" value="'+pollutants[item.k]+'" oninput="wqSet(\''+item.k+'\',this.value)" style="flex:1">'+
          '<span style="font-size:11px;font-weight:800;color:var(--text);min-width:24px">'+pollutants[item.k]+'</span>'+
          '</div>';
      }).join('')+
      '</div>'+
      '<div class="ctrl-row">'+
      '<button class="cbtn" onclick="wqPollute()" id="wqBtn" style="background:var(--sci);color:white;border-color:var(--sci)">💧 Simulate Flow</button>'+
      '<button class="cbtn" onclick="wqReset()">🌊 Clean Water</button>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      'Only 2.5% of Earth\'s water is freshwater. Less than 1% is accessible to us. Every drop counts!'+
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.wqSet=function(k,v){pollutants[k]=parseInt(v);};
  window.wqPollute=function(){running=!running;document.getElementById('wqBtn').textContent=running?'⏸ Pause':'💧 Simulate Flow';};
  window.wqReset=function(){pollutants={industrial:0,agricultural:0,domestic:0};drops=[];render();};
  window.simCleanup=function(){cancelAnimationFrame(raf2);running=false;};
  render();
};

/* ── 14. TIME MATRIX (time-matrix) ── */
SIM_REGISTRY['india-map'] = function(c) {
  var highlighted = null;
  var regions = [
    { name:'North India',     states:'J&K, HP, Punjab, Haryana, Delhi, UP, Uttarakhand', emoji:'🏔️', color:'#4D96FF', fact:'Himalayan rivers — Ganga, Yamuna, Indus. Major wheat-growing belt. Capital region.', landmark:'Taj Mahal, Red Fort, Haridwar' },
    { name:'South India',     states:'Kerala, Tamil Nadu, Karnataka, AP, Telangana',      emoji:'🌴', color:'#6BCB77', fact:'Deccan plateau and coastal plains. Coffee, spices, IT hub. Two coastlines!', landmark:'Ooty, Hampi, Munnar, Marina Beach' },
    { name:'East India',      states:'West Bengal, Odisha, Jharkhand, Bihar',             emoji:'🐅', color:'#FFD93D', fact:'Gangetic plains and Bay of Bengal coast. Rice bowl. Sundarbans mangroves.', landmark:'Sundarbans, Konark, Puri' },
    { name:'West India',      states:'Rajasthan, Gujarat, Maharashtra, Goa',              emoji:'🏜️', color:'#FF8C42', fact:'Thar Desert to tropical coast. Mumbai finance hub. Bollywood. Rann of Kutch.', landmark:'Jaipur, Ajanta-Ellora, Goa beaches' },
    { name:'Northeast India', states:'Assam, Meghalaya, Manipur, Mizoram + 4 others',    emoji:'🌿', color:'#C77DFF', fact:'7 Sister States + Sikkim. Highest rainfall on Earth (Cherrapunji). Tea gardens.', landmark:'Kaziranga, Cherrapunji, Ziro' },
    { name:'Central India',   states:'MP, Chhattisgarh',                                  emoji:'🐆', color:'#C8945A', fact:'Heart of India. Tiger reserves. Rich tribal culture. Coal and iron mining.', landmark:'Khajuraho, Bandhavgarh, Pench' },
  ];

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Regions of India</div>' +
      /* Simplified India outline with region buttons */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">' +
      regions.map(function(r, i) {
        var isSel = highlighted === i;
        return '<button onclick="indiaReg(' + i + ')" style="padding:10px 12px;border-radius:12px;border:2px solid ' + (isSel ? r.color : 'var(--border)') + ';background:' + (isSel ? r.color + '22' : 'var(--surface2)') + ';color:' + (isSel ? r.color : 'var(--muted)') + ';cursor:pointer;text-align:left;transition:all .2s">' +
          '<div style="font-size:18px;margin-bottom:2px">' + r.emoji + '</div>' +
          '<div style="font-size:12px;font-weight:800">' + r.name + '</div>' +
          '<div style="font-size:9px;opacity:.7;line-height:1.4">' + r.states.split(',')[0] + '...</div>' +
          '</button>';
      }).join('') +
      '</div>' +
      (highlighted !== null ?
        '<div style="background:' + regions[highlighted].color + '15;border:2px solid ' + regions[highlighted].color + '44;border-radius:12px;padding:12px 14px">' +
        '<div style="font-size:15px;font-weight:900;color:' + regions[highlighted].color + '">' + regions[highlighted].emoji + ' ' + regions[highlighted].name + '</div>' +
        '<div style="font-size:11px;color:var(--muted);margin:4px 0">📍 States: <b style="color:var(--text)">' + regions[highlighted].states + '</b></div>' +
        '<div style="font-size:12px;color:var(--text);line-height:1.7;margin:4px 0">' + regions[highlighted].fact + '</div>' +
        '<div style="font-size:11px;color:var(--muted)">🏛️ ' + regions[highlighted].landmark + '</div>' +
        '</div>'
        : '<div style="background:var(--surface2);border-radius:10px;padding:12px;border:1px solid var(--border);text-align:center;color:var(--muted);font-size:12px">☝️ Tap a region to explore India!</div>') +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">India has 28 states and 8 Union Territories, 22 official languages, and is the world\'s most populous country!</div>';
  }

  window.indiaReg = function(i) { highlighted = highlighted === i ? null : i; render(); };
  render();
};

/* ── 2. BIODIVERSITY HOTSPOT (biodiversity-hotspot) ── */
SIM_REGISTRY['biodiversity-hotspot'] = function(c) {
  var ecosystem = 'forest';
  var ecosystems = {
    forest: { name:'🌳 Tropical Forest', color:'#2d7a1e',
      species:[{e:'🐯',n:'Bengal Tiger',status:'Endangered'},{e:'🐘',n:'Asian Elephant',status:'Vulnerable'},{e:'🦜',n:'Indian Parrot',status:'Least Concern'},{e:'🦎',n:'Monitor Lizard',status:'Near Threatened'},{e:'🌺',n:'Orchid',status:'Vulnerable'}],
      threat:'Deforestation removes 15 billion trees per year globally.',fact:'1 hectare of tropical forest contains more species than all of Europe combined.' },
    ocean:  { name:'🌊 Coral Reef', color:'#1a5a8a',
      species:[{e:'🐠',n:'Clownfish',status:'Least Concern'},{e:'🦈',n:'Reef Shark',status:'Vulnerable'},{e:'🐢',n:'Sea Turtle',status:'Endangered'},{e:'🦑',n:'Reef Squid',status:'Least Concern'},{e:'🪸',n:'Brain Coral',status:'Near Threatened'}],
      threat:'Ocean warming is bleaching coral reefs — 50% already dead.',fact:'Coral reefs cover <1% of ocean floor but support 25% of all marine species.' },
    wetland:{ name:'💧 Wetland', color:'#1a5a3a',
      species:[{e:'🦩',n:'Flamingo',status:'Least Concern'},{e:'🐊',n:'Mugger Croc',status:'Vulnerable'},{e:'🐸',n:'Indian Frog',status:'Endangered'},{e:'🦆',n:'Migratory Duck',status:'Least Concern'},{e:'🌾',n:'Reed',status:'Least Concern'}],
      threat:'60% of world\'s wetlands have been lost since 1900.',fact:'Wetlands filter water, prevent floods, and support more biodiversity per area than almost any habitat.' },
  };

  function render() {
    var eco = ecosystems[ecosystem];
    var statusColor = { 'Least Concern':'#6BCB77','Near Threatened':'#FFD93D','Vulnerable':'#FF8C42','Endangered':'#FF6B6B' };

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Biodiversity Hotspots</div>' +
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      Object.keys(ecosystems).map(function(k) {
        return '<button onclick="biodivEco(\'' + k + '\')" style="padding:6px 12px;border-radius:9px;font-size:12px;border:1.5px solid ' + (k === ecosystem ? 'white' : 'var(--border)') + ';background:' + (k === ecosystem ? ecosystems[k].color + '66' : 'var(--surface2)') + ';color:' + (k === ecosystem ? 'white' : 'var(--muted)') + ';cursor:pointer;font-weight:800">' + ecosystems[k].name.split(' ')[0] + ' ' + ecosystems[k].name.split(' ')[1] + '</button>';
      }).join('') + '</div>' +
      '<div style="background:' + eco.color + '22;border:1.5px solid ' + eco.color + '88;border-radius:12px;padding:12px;margin-bottom:8px">' +
      '<div style="font-size:14px;font-weight:900;color:white;margin-bottom:8px">' + eco.name + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      eco.species.map(function(sp) {
        var sc = statusColor[sp.status] || '#aaa';
        return '<div style="background:rgba(0,0,0,.3);border-radius:10px;padding:7px 10px;display:flex;align-items:center;gap:6px">' +
          '<span style="font-size:22px">' + sp.e + '</span>' +
          '<div><div style="font-size:11px;font-weight:800;color:white">' + sp.n + '</div>' +
          '<div style="font-size:9px;color:' + sc + ';font-weight:700">' + sp.status + '</div></div>' +
          '</div>';
      }).join('') + '</div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<div style="background:var(--sci-dim);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:10px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--sci);margin-bottom:4px">⚠️ Threat</div>' +
      '<div style="font-size:11px;color:var(--text);line-height:1.6">' + eco.threat + '</div>' +
      '</div>' +
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--evs);margin-bottom:4px">💡 Amazing Fact</div>' +
      '<div style="font-size:11px;color:var(--text);line-height:1.6">' + eco.fact + '</div>' +
      '</div></div>';
  }

  window.biodivEco = function(k) { ecosystem = k; render(); };
  render();
};

/* ── 3. ELECTROLYSIS (electrolysis) ── */
SIM_REGISTRY['electrolysis'] = function(c) {
  var raf2, t2 = 0, running = false, bubbles = [];
  var solution = 'water';
  var solutions = {
    water:    { name:'Water (H₂O)',       cathode:'H₂ gas',  anode:'O₂ gas',  ratio:'2:1', color:'rgba(77,150,255,0.3)', fact:'Water splits into hydrogen and oxygen. Hydrogen is a clean fuel!' },
    brine:    { name:'Brine (NaCl)',       cathode:'H₂ gas',  anode:'Cl₂ gas', ratio:'1:1', color:'rgba(200,200,100,0.3)',fact:'Brine electrolysis makes chlorine (used in bleach) and sodium hydroxide (NaOH).' },
    copper:   { name:'CuSO₄ solution',    cathode:'Cu metal',anode:'Cu dissolves',ratio:'—',color:'rgba(100,180,255,0.35)',fact:'Pure copper is deposited at cathode. Used in electroplating!' },
  };

  function draw() {
    var _g=getCtx('elecCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);
    var sol = solutions[solution];

    /* Beaker */
    ctx.fillStyle = sol.color;
    ctx.fillRect(50, 40, W - 100, H - 80);
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2;
    ctx.strokeRect(50, 40, W - 100, H - 80);

    /* Electrodes */
    var cathX = W * 0.3, anodX = W * 0.7, electrodeY = 30, electrodeH = H * 0.6;
    /* Cathode (-) */
    ctx.fillStyle = '#888'; ctx.fillRect(cathX - 5, electrodeY, 10, electrodeH);
    ctx.fillStyle = '#FF6B6B'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('− Cathode', cathX, electrodeY - 6);
    ctx.fillStyle = '#aaa'; ctx.font = '9px Nunito,sans-serif';
    ctx.fillText(sol.cathode, cathX, electrodeY + electrodeH + 14);
    /* Anode (+) */
    ctx.fillStyle = '#888'; ctx.fillRect(anodX - 5, electrodeY, 10, electrodeH);
    ctx.fillStyle = '#6BCB77'; ctx.font = 'bold 11px Nunito,sans-serif';
    ctx.fillText('+ Anode', anodX, electrodeY - 6);
    ctx.fillStyle = '#aaa'; ctx.font = '9px Nunito,sans-serif';
    ctx.fillText(sol.anode, anodX, electrodeY + electrodeH + 14);

    /* Battery */
    var batX = W / 2, batY = 14;
    ctx.fillStyle = '#FFD93D'; ctx.fillRect(batX - 20, batY - 8, 40, 16); ctx.strokeStyle = '#C8A930'; ctx.lineWidth = 1.5; ctx.strokeRect(batX - 20, batY - 8, 40, 16);
    ctx.fillStyle = '#000'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚡ DC', batX, batY + 4);
    /* Wires */
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cathX, electrodeY); ctx.lineTo(cathX, batY); ctx.lineTo(batX - 20, batY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(anodX, electrodeY); ctx.lineTo(anodX, batY); ctx.lineTo(batX + 20, batY); ctx.stroke();

    /* Bubbles */
    if (running) {
      if (Math.random() < 0.3) {
        bubbles.push({ x: cathX + (Math.random() - 0.5) * 8, y: electrodeY + electrodeH, r: 2 + Math.random() * 3, side: 'c' });
        if (Math.random() < 0.5) bubbles.push({ x: anodX + (Math.random() - 0.5) * 8, y: electrodeY + electrodeH, r: 2 + Math.random() * 3, side: 'a' });
      }
    }
    bubbles = bubbles.filter(function(b) {
      b.y -= 1.5 + Math.random() * 0.5;
      b.x += Math.sin(t2 * 3 + b.y) * 0.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = b.side === 'c' ? 'rgba(77,150,255,0.8)' : 'rgba(107,203,119,0.8)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = b.side === 'c' ? 'rgba(77,150,255,0.2)' : 'rgba(107,203,119,0.2)'; ctx.fill();
      return b.y > 30;
    });

    /* Ion movement arrows */
    if (running) {
      ctx.strokeStyle = 'rgba(255,217,61,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
      var iy = 40 + (H - 80) * 0.6 + ((t2 * 30) % ((H - 80) * 0.4));
      ctx.beginPath(); ctx.moveTo(W * 0.45, iy); ctx.lineTo(cathX + 8, iy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.55, iy); ctx.lineTo(anodX - 8, iy); ctx.stroke();
      ctx.setLineDash([]);
    }

    t2 += 0.04;
    if (running) raf2 = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, W, H); draw(); }
  }

  function render() {
    var sol = solutions[solution];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Electrolysis</div>' +
      '<div class="ctrl-row" style="margin-bottom:6px;flex-wrap:wrap;gap:5px">' +
      Object.keys(solutions).map(function(k) {
        return '<button onclick="elecSol(\'' + k + '\')" style="padding:5px 10px;border-radius:9px;font-size:11px;border:1.5px solid ' + (k === solution ? 'var(--acc)' : 'var(--border)') + ';background:' + (k === solution ? 'var(--acc-dim)' : 'var(--surface2)') + ';color:' + (k === solution ? 'var(--acc)' : 'var(--muted)') + ';cursor:pointer;font-weight:800">' + solutions[k].name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="elecCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="elecRun()" id="elecBtn" style="background:var(--math);color:white;border-color:var(--math)">⚡ Switch On</button>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '🔵 Cathode (−): ' + sol.cathode + ' · 🟢 Anode (+): ' + sol.anode + (sol.ratio !== '—' ? ' · Ratio: ' + sol.ratio : '') + '<br>' + sol.fact + '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.elecSol = function(k) { solution = k; cancelAnimationFrame(raf2); running = false; render(); };
  window.elecRun = function() {
    running = !running;
    document.getElementById('elecBtn').textContent = running ? '⏸ Switch Off' : '⚡ Switch On';
    if (running) draw();
  };
  window.simCleanup = function() { cancelAnimationFrame(raf2); running = false; };
  render();
};

/* ── 4. POPULATION DENSITY (population-density) ── */
SIM_REGISTRY['population-density'] = function(c) {
  var view = 'india';
  var data = {
    india: {
      title: '🇮🇳 India — Population Density by State',
      unit: 'persons/km²',
      items: [
        {name:'Bihar',          val:1102, color:'#FF6B6B'},
        {name:'West Bengal',    val:1028, color:'#FF8C42'},
        {name:'Kerala',         val:860,  color:'#FFD93D'},
        {name:'UP',             val:828,  color:'#C8D44A'},
        {name:'Punjab',         val:551,  color:'#6BCB77'},
        {name:'Haryana',        val:573,  color:'#4D96FF'},
        {name:'MP',             val:236,  color:'#4D96FF'},
        {name:'Rajasthan',      val:201,  color:'#4D96FF'},
        {name:'Arunachal',      val:17,   color:'#C77DFF'},
      ],
      fact:'India\'s average density is 382/km². Bihar is 3× the national average!'
    },
    world: {
      title: '🌍 World — Population Density by Country',
      unit: 'persons/km²',
      items: [
        {name:'Bangladesh',     val:1265, color:'#FF6B6B'},
        {name:'South Korea',    val:528,  color:'#FF8C42'},
        {name:'India',          val:382,  color:'#FFD93D'},
        {name:'Japan',          val:347,  color:'#6BCB77'},
        {name:'UK',             val:275,  color:'#4D96FF'},
        {name:'China',          val:153,  color:'#4D96FF'},
        {name:'USA',            val:36,   color:'#C77DFF'},
        {name:'Australia',      val:3,    color:'#C77DFF'},
        {name:'Canada',         val:4,    color:'#C77DFF'},
      ],
      fact:'Bangladesh is the most densely populated large nation — 1265 people per km²!'
    }
  };

  function render() {
    var d = data[view];
    var max = Math.max.apply(null, d.items.map(function(i) { return i.val; }));
    var bars = d.items.map(function(item) {
      var pct = (item.val / max) * 100;
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
        '<div style="min-width:90px;font-size:11px;font-weight:700;color:var(--text);text-align:right">' + item.name + '</div>' +
        '<div style="flex:1;height:20px;background:var(--surface2);border-radius:4px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + item.color + ';border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:4px;transition:width .5s">' +
        '<span style="font-size:9px;font-weight:800;color:rgba(0,0,0,0.7)">' + item.val + '</span>' +
        '</div></div></div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Population Density</div>' +
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      '<button onclick="popView(\'india\')" style="padding:6px 14px;border-radius:9px;font-size:12px;border:1.5px solid ' + (view === 'india' ? 'var(--acc)' : 'var(--border)') + ';background:' + (view === 'india' ? 'var(--acc-dim)' : 'var(--surface2)') + ';color:' + (view === 'india' ? 'var(--acc)' : 'var(--muted)') + ';cursor:pointer;font-weight:800">🇮🇳 India</button>' +
      '<button onclick="popView(\'world\')" style="padding:6px 14px;border-radius:9px;font-size:12px;border:1.5px solid ' + (view === 'world' ? 'var(--acc)' : 'var(--border)') + ';background:' + (view === 'world' ? 'var(--acc-dim)' : 'var(--surface2)') + ';color:' + (view === 'world' ? 'var(--acc)' : 'var(--muted)') + ';cursor:pointer;font-weight:800">🌍 World</button>' +
      '</div>' +
      '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:8px">' + d.title + '</div>' +
      '<div style="font-size:9px;color:var(--muted);margin-bottom:6px;text-align:right">' + d.unit + '</div>' +
      bars +
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--text);line-height:1.7">' + d.fact + '</div>';
  }

  window.popView = function(v) { view = v; render(); };
  render();
};

/* ── 5. TISSUE TYPES (tissue-types) ── */
SIM_REGISTRY['tissue-types'] = function(c) {
  var sel = 0;
  var tissues = [
    { name:'Epithelial Tissue', emoji:'🧱', color:'#FF6B6B',
      desc:'Lines and covers body surfaces — skin, gut lining, blood vessels. Forms the outer boundary of organs. The body\'s first defence!',
      types:['Squamous (flat)','Cuboidal (cube-shaped)','Columnar (tall)'],
      location:'Skin, stomach lining, lung air sacs',
      function:'Protection, secretion, absorption' },
    { name:'Connective Tissue', emoji:'🕸️', color:'#FFD93D',
      desc:'Connects and supports other tissues. Most widespread tissue type. Includes blood, bone, cartilage, fat, and tendons.',
      types:['Blood (liquid)','Bone (rigid)','Cartilage (flexible)','Fat (adipose)'],
      location:'Throughout the body',
      function:'Support, transport, protection, energy storage' },
    { name:'Muscle Tissue',     emoji:'💪', color:'#FF8C42',
      desc:'Specialised for contraction and movement. Contains proteins actin and myosin that slide against each other.',
      types:['Skeletal (voluntary)','Cardiac (heart)','Smooth (involuntary)'],
      location:'Attached to bones, heart, organs',
      function:'Movement, posture, heat generation' },
    { name:'Nervous Tissue',    emoji:'⚡', color:'#4D96FF',
      desc:'Receives and transmits electrical signals. Neurons communicate at 270 km/h! Forms brain, spinal cord, and nerves.',
      types:['Neurons (signal cells)','Glial cells (support)'],
      location:'Brain, spinal cord, nerves',
      function:'Communication, coordination, thought, reflex' },
  ];

  function render() {
    var t = tissues[sel];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Animal Tissue Types</div>' +
      '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">' +
      tissues.map(function(ti, i) {
        return '<button onclick="tissueSel(' + i + ')" style="padding:6px 10px;border-radius:10px;border:2px solid ' + (i === sel ? ti.color : 'var(--border)') + ';background:' + (i === sel ? ti.color + '22' : 'var(--surface2)') + ';cursor:pointer;font-size:16px">' + ti.emoji + '</button>';
      }).join('') + '</div>' +
      '<div style="background:' + t.color + '15;border:2px solid ' + t.color + '44;border-radius:14px;padding:14px;margin-bottom:8px;text-align:center">' +
      '<div style="font-size:40px;margin-bottom:6px">' + t.emoji + '</div>' +
      '<div style="font-size:16px;font-weight:900;color:' + t.color + '">' + t.name + '</div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:8px">' + t.desc + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px;border:1px solid var(--border)">' +
      '<div style="font-size:10px;font-weight:800;color:' + t.color + ';margin-bottom:4px">Types</div>' +
      t.types.map(function(ty) { return '<div style="font-size:11px;color:var(--text);margin-bottom:2px">• ' + ty + '</div>'; }).join('') +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px;border:1px solid var(--border)">' +
      '<div style="font-size:10px;font-weight:800;color:' + t.color + ';margin-bottom:4px">📍 Location</div>' +
      '<div style="font-size:11px;color:var(--text);margin-bottom:6px">' + t.location + '</div>' +
      '<div style="font-size:10px;font-weight:800;color:' + t.color + ';margin-bottom:4px">⚙️ Function</div>' +
      '<div style="font-size:11px;color:var(--text)">' + t.function + '</div>' +
      '</div></div>';
  }

  window.tissueSel = function(i) { sel = i; render(); };
  render();
};

/* ── 6. SOUND VIBRATION (sound-vibration) ── */
SIM_REGISTRY['sound-vibration'] = function(c) {
  var raf2, t2 = 0, vibrating = false, medium = 'air';
  var mediums = {
    air:    { name:'🌬️ Air',    speed:343,  color:'#4D96FF', density:'Low', desc:'Sound travels as pressure waves. ~343 m/s at 20°C.' },
    water:  { name:'💧 Water',  speed:1484, color:'#6BCB77', density:'High',desc:'4× faster than air! Whales communicate across oceans.' },
    steel:  { name:'⚙️ Steel',  speed:5960, color:'#888',    density:'Very High',desc:'17× faster than air! You can hear trains through rails.' },
    vacuum: { name:'🚀 Vacuum', speed:0,    color:'#333',    density:'None',desc:'NO sound! Space is completely silent.' },
  };

  function draw() {
    var _g=getCtx('vibCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    var med = mediums[medium];
    var isVacuum = medium === 'vacuum';

    /* Vibrating object */
    var objX = 40, amplitude = vibrating && !isVacuum ? 12 : 2;
    var objOff = vibrating && !isVacuum ? Math.sin(t2 * 8) * amplitude : 0;
    ctx.fillStyle = '#FFD93D';
    ctx.fillRect(objX - 8, H / 2 - 25 + objOff, 16, 50 - objOff * 2);
    ctx.fillStyle = 'rgba(255,217,61,.3)';
    ctx.fillRect(objX - 14, H / 2 - 35 + objOff * 0.5, 28, 70 - objOff);

    /* Wave propagation */
    if (vibrating && !isVacuum) {
      var speed = med.speed / 400;
      for (var ring = 0; ring < 6; ring++) {
        var r = ((t2 * speed * 30 + ring * 40) % (W - objX)) + 10;
        var alpha = Math.max(0, 0.7 - r / (W - objX));
        ctx.beginPath();
        ctx.arc(objX + r, H / 2, Math.min(r * 0.6, H / 2 - 15), 0, Math.PI * 2);
        ctx.strokeStyle = med.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2; ctx.stroke();
      }
    }

    /* Speed label */
    ctx.fillStyle = isVacuum ? 'rgba(255,107,107,.7)' : med.color;
    ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(isVacuum ? '🔇 NO SOUND in vacuum!' : '🔊 ' + med.speed + ' m/s', W / 2, H - 10);

    if (vibrating && !isVacuum) t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var med = mediums[medium];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Sound — Vibration & Mediums</div>' +
      '<div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">' +
      Object.keys(mediums).map(function(k) {
        return '<button onclick="vibMedium(\'' + k + '\')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid ' + (k === medium ? mediums[k].color : 'var(--border)') + ';background:' + (k === medium ? mediums[k].color + '22' : 'var(--surface2)') + ';color:' + (k === medium ? mediums[k].color : 'var(--muted)') + ';cursor:pointer;font-weight:800">' + mediums[k].name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="vibCanvas" data-w="300" data-h="160" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="vibToggle()" id="vibBtn" style="background:var(--math);color:white;border-color:var(--math)">🔊 Vibrate!</button>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '<b style="color:' + med.color + '">' + med.name + '</b> · Speed: <b>' + (med.speed || 'N/A') + ' m/s</b> · Density: ' + med.density + '<br>' + med.desc + '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.vibMedium = function(m) { medium = m; cancelAnimationFrame(raf2); render(); };
  window.vibToggle = function() {
    vibrating = !vibrating;
    document.getElementById('vibBtn').textContent = vibrating ? '⏸ Stop' : '🔊 Vibrate!';
  };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 7. EXAM STRATEGY (exam-strategy) ── */
SIM_REGISTRY['exam-strategy'] = function(c) {
  var phase = 'before';
  var phases = {
    before: {
      emoji: '📚', title: 'Before the Exam', color: '#4D96FF',
      tips: [
        { icon: '🗓️', tip: 'Make a study timetable — allocate more time to weaker subjects' },
        { icon: '📝', tip: 'Use active recall: test yourself rather than re-reading notes' },
        { icon: '🌙', tip: 'Sleep 8 hours! Memory consolidates during sleep — all-nighters backfire' },
        { icon: '🥗', tip: 'Eat a good meal. Glucose is the brain\'s only fuel' },
        { icon: '🔄', tip: 'Spaced repetition: review topics after 1 day, 3 days, 1 week' },
        { icon: '✏️', tip: 'Practise past papers under timed conditions' },
      ]
    },
    during: {
      emoji: '📋', title: 'During the Exam', color: '#6BCB77',
      tips: [
        { icon: '👀', tip: 'Read ALL questions first — 2 minutes well spent' },
        { icon: '⏱️', tip: 'Allocate time per question. Don\'t get stuck — move on!' },
        { icon: '💧', tip: 'Take deep breaths if anxious. Box breathing: 4s in, 4s hold, 4s out' },
        { icon: '✅', tip: 'Attempt all questions — partial marks add up' },
        { icon: '🔍', tip: 'Check your work with remaining time — catch silly errors' },
        { icon: '📊', tip: 'Easy marks first — builds confidence and time' },
      ]
    },
    after: {
      emoji: '🎉', title: 'After the Exam', color: '#FFD93D',
      tips: [
        { icon: '🚫', tip: 'Don\'t discuss answers immediately — it causes anxiety for nothing' },
        { icon: '😴', tip: 'Rest and recover — exams are mentally tiring' },
        { icon: '📖', tip: 'Review mistakes when results come — learning from errors is growth' },
        { icon: '🙏', tip: 'Celebrate effort, not just marks — the habit of working hard is the real win' },
        { icon: '🔄', tip: 'Adjust your strategy for next time based on what worked' },
        { icon: '💪', tip: 'One exam doesn\'t define your future. Keep going!' },
      ]
    }
  };

  function render() {
    var p = phases[phase];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Exam Success Strategies</div>' +
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      Object.keys(phases).map(function(k) {
        return '<button onclick="examPhase(\'' + k + '\')" style="padding:6px 12px;border-radius:9px;font-size:12px;border:1.5px solid ' + (k === phase ? phases[k].color : 'var(--border)') + ';background:' + (k === phase ? phases[k].color + '22' : 'var(--surface2)') + ';color:' + (k === phase ? phases[k].color : 'var(--muted)') + ';cursor:pointer;font-weight:800">' + phases[k].emoji + ' ' + phases[k].title.split(' ')[0] + '</button>';
      }).join('') + '</div>' +
      '<div style="text-align:center;font-size:36px;margin-bottom:4px">' + p.emoji + '</div>' +
      '<div style="text-align:center;font-size:14px;font-weight:900;color:' + p.color + ';margin-bottom:10px">' + p.title + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      p.tips.map(function(t) {
        return '<div style="display:flex;align-items:flex-start;gap:10px;background:var(--surface2);border-radius:10px;padding:9px 12px;border:1px solid var(--border)">' +
          '<span style="font-size:18px;flex-shrink:0">' + t.icon + '</span>' +
          '<span style="font-size:12px;color:var(--text);line-height:1.6">' + t.tip + '</span>' +
          '</div>';
      }).join('') + '</div>';
  }

  window.examPhase = function(p) { phase = p; render(); };
  render();
};

/* ── 8. ANGLES SIM (angles-sim) ── */
SIM_REGISTRY['angles-sim'] = function(c) {
  var angle = 65, type = 'interactive';

  function getAngleType(a) {
    if (a === 0) return { name: 'Zero Angle', color: '#888' };
    if (a < 90) return { name: 'Acute Angle', color: '#6BCB77' };
    if (a === 90) return { name: 'Right Angle', color: '#4D96FF' };
    if (a < 180) return { name: 'Obtuse Angle', color: '#FFD93D' };
    if (a === 180) return { name: 'Straight Angle', color: '#FF8C42' };
    if (a < 360) return { name: 'Reflex Angle', color: '#FF6B6B' };
    return { name: 'Complete Angle', color: '#C77DFF' };
  }

  function render() {
    var at = getAngleType(angle);
    var W = 220, H = 180, CX = W / 2, CY = H * 0.75, R = 80;
    var rad = angle * Math.PI / 180;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Types of Angles</div>' +
      '<svg width="' + W + '" height="' + H + '" style="display:block;background:#0a0a1a;border-radius:12px;margin:0 auto">' +
      /* Base ray */
      '<line x1="' + (CX - R) + '" y1="' + CY + '" x2="' + (CX + R) + '" y2="' + CY + '" stroke="rgba(255,255,255,.3)" stroke-width="2.5"/>' +
      /* Arc */
      '<path d="M ' + (CX + 40) + ' ' + CY + ' A 40 40 0 ' + (angle > 180 ? '1' : '0') + ' 0 ' + (CX + 40 * Math.cos(-rad)) + ' ' + (CY + 40 * Math.sin(-rad)) + '" fill="' + at.color + '33" stroke="' + at.color + '" stroke-width="2"/>' +
      /* Angle ray */
      '<line x1="' + CX + '" y1="' + CY + '" x2="' + (CX + R * Math.cos(-rad)) + '" y2="' + (CY + R * Math.sin(-rad)) + '" stroke="' + at.color + '" stroke-width="2.5"/>' +
      /* Right angle marker */
      (angle === 90 ? '<rect x="' + CX + '" y="' + (CY - 14) + '" width="14" height="14" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/>' : '') +
      /* Angle label */
      '<text x="' + (CX + 55 * Math.cos(-rad / 2)) + '" y="' + (CY + 55 * Math.sin(-rad / 2) + 4) + '" fill="' + at.color + '" font-size="14" font-weight="bold" text-anchor="middle" font-family="Nunito">' + angle + '°</text>' +
      /* Type label */
      '<text x="' + W / 2 + '" y="22" fill="' + at.color + '" font-size="12" font-weight="bold" text-anchor="middle" font-family="Nunito">' + at.name + '</text>' +
      '</svg>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Angle:</span>' +
      '<input type="range" class="slide" min="0" max="360" value="' + angle + '" oninput="angSet(this.value)" style="flex:1">' +
      '<span style="font-size:16px;font-weight:900;color:' + at.color + '">' + angle + '°</span>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;justify-content:center">' +
      [0, 45, 90, 120, 180, 270, 360].map(function(a) {
        var at2 = getAngleType(a);
        return '<button onclick="angSet(' + a + ')" style="padding:3px 8px;border-radius:7px;font-size:11px;border:1px solid ' + (a === angle ? at2.color : 'var(--border)') + ';background:' + (a === angle ? at2.color + '22' : 'var(--surface2)') + ';color:' + (a === angle ? at2.color : 'var(--muted)') + ';cursor:pointer">' + a + '°</button>';
      }).join('') + '</div>';
  }

  window.angSet = function(v) { angle = parseInt(v); render(); };
  render();
};

/* ── 9. GEO CONSTRUCTIONS (geo-constructions) ── */
SIM_REGISTRY['geo-constructions'] = function(c) {
  var construction = 'bisect';
  var constructions = {
    bisect: {
      name: '✂️ Angle Bisector',
      color: '#6BCB77',
      desc: 'Divide an angle into two equal halves using compass and ruler. The bisector is equidistant from both rays!',
      steps: ['Draw angle ABC', 'Place compass at B, draw arc cutting both rays at D and E', 'Place compass at D, draw arc in the interior', 'Same radius at E, draw arc crossing previous arc at F', 'Draw BF — this is the angle bisector!'],
    },
    perpendicular: {
      name: '⊥ Perpendicular Bisector',
      color: '#4D96FF',
      desc: 'Bisect a line segment at 90°. Every point on the perpendicular bisector is equidistant from both endpoints!',
      steps: ['Draw line segment AB', 'Place compass at A with radius > half AB, draw arcs above and below', 'Same radius at B, draw arcs crossing previous arcs at C and D', 'Draw CD — this is the perpendicular bisector', 'Verify: CD meets AB at its midpoint at 90°!'],
    },
    triangle60: {
      name: '🔺 60° Equilateral Triangle',
      color: '#FFD93D',
      desc: 'Construct a perfect equilateral triangle using only compass and ruler. All angles = 60°, all sides equal!',
      steps: ['Draw base AB', 'Place compass at A with radius = AB, draw arc above', 'Place compass at B with same radius, draw arc crossing at C', 'Draw AC and BC', 'Triangle ABC has all sides equal and all angles 60°!'],
    }
  };

  function drawConstruction(ctx, W, H, key, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
    var con = constructions[key];
    ctx.strokeStyle = con.color; ctx.lineWidth = 2;

    if (key === 'bisect') {
      var bx = W * 0.2, by = H * 0.7, len = 80;
      var a1 = -0.3, a2 = -0.9, bisect = (a1 + a2) / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + len * Math.cos(a1), by + len * Math.sin(a1)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + len * Math.cos(a2), by + len * Math.sin(a2)); ctx.stroke();
      /* Arc at vertex */
      ctx.strokeStyle = 'rgba(255,217,61,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(bx, by, 35, a1, a2, true); ctx.stroke();
      /* Intersection arcs */
      var d1x = bx + 35 * Math.cos(a1), d1y = by + 35 * Math.sin(a1);
      var d2x = bx + 35 * Math.cos(a2), d2y = by + 35 * Math.sin(a2);
      ctx.beginPath(); ctx.arc(d1x, d1y, 30, -0.5, 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(d2x, d2y, 30, -0.8, 0.2); ctx.stroke();
      ctx.setLineDash([]);
      /* Bisector line */
      ctx.strokeStyle = con.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + len * Math.cos(bisect), by + len * Math.sin(bisect)); ctx.stroke();
      ctx.fillStyle = con.color; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Bisector', bx + (len + 10) * Math.cos(bisect), by + (len + 10) * Math.sin(bisect));
    } else if (key === 'perpendicular') {
      var ax = W * 0.2, bx2 = W * 0.75, midY = H * 0.6;
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax, midY); ctx.lineTo(bx2, midY); ctx.stroke();
      var midX = (ax + bx2) / 2;
      /* Arcs */
      ctx.strokeStyle = 'rgba(77,150,255,.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(ax, midY, (bx2 - ax) * 0.6, -1.8, 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx2, midY, (bx2 - ax) * 0.6, Math.PI - 0.6, Math.PI + 1.8); ctx.stroke();
      ctx.setLineDash([]);
      /* Perpendicular */
      ctx.strokeStyle = con.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(midX, midY - 60); ctx.lineTo(midX, midY + 60); ctx.stroke();
      /* Right angle square */
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(midX, midY - 12, 12, 12);
      ctx.fillStyle = '#4D96FF'; ctx.font = '10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('90°', midX + 20, midY - 4);
    } else {
      var tx = W * 0.15, ty = H * 0.75, tlen = W * 0.65;
      var ax2 = tx, ay = ty, bx3 = tx + tlen, by2 = ty;
      var cx = tx + tlen / 2, cy = ty - tlen * Math.sqrt(3) / 2;
      ctx.strokeStyle = con.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ax2, ay); ctx.lineTo(bx3, by2); ctx.lineTo(cx, cy); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = con.color + '15'; ctx.fill();
      /* Construction arcs */
      ctx.strokeStyle = 'rgba(255,217,61,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(ax2, ay, tlen, -1.2, 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx3, by2, tlen, Math.PI - 0.2, Math.PI + 1.2); ctx.stroke();
      ctx.setLineDash([]);
      /* Labels */
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '10px Nunito,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('A', ax2 - 10, ay + 14); ctx.fillText('B', bx3 + 10, by2 + 14); ctx.fillText('C', cx, cy - 8);
      ctx.fillStyle = con.color;
      ctx.fillText('60°', ax2 + 18, ay - 8); ctx.fillText('60°', bx3 - 20, by2 - 8); ctx.fillText('60°', cx, cy + 18);
    }
  }

  var raf2, t2 = 0;
  function animate() {
    var _g=getCtx('geoCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    t2 += 0.02; raf2 = requestAnimationFrame(animate);
  }

  function render() {
    var con = constructions[construction];
    c.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      Object.keys(constructions).map(function(k) {
        return '<button onclick="geoConst(\'' + k + '\')" style="padding:5px 10px;border-radius:9px;font-size:11px;border:1.5px solid ' + (k === construction ? constructions[k].color : 'var(--border)') + ';background:' + (k === construction ? constructions[k].color + '22' : 'var(--surface2)') + ';color:' + (k === construction ? constructions[k].color : 'var(--muted)') + ';cursor:pointer;font-weight:800">' + constructions[k].name + '</button>';
      }).join('') + '</div>' +
      '<canvas id="geoCanvas" data-w="280" data-h="180" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border)">' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-bottom:6px">' + con.desc + '</div>' +
      '<div style="font-size:10px;font-weight:800;color:' + con.color + ';margin-bottom:4px">Steps:</div>' +
      con.steps.map(function(s, i) { return '<div style="font-size:11px;color:var(--muted);margin-bottom:2px"><b style="color:' + con.color + '">' + (i + 1) + '.</b> ' + s + '</div>'; }).join('') +
      '</div>';
    cancelAnimationFrame(raf2); animate();
  }

  window.geoConst = function(k) { construction = k; cancelAnimationFrame(raf2); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 10. COMPOST SIM (compost-sim) ── */
SIM_REGISTRY['compost-sim'] = function(c) {
  var raf2, t2 = 0, running = false, decomp = 0;
  var items = { leaves: 3, vegPeel: 2, paper: 1, meat: 0, plastic: 0 };

  function quality() {
    var score = items.leaves * 2 + items.vegPeel * 3 + items.paper * 1 - items.meat * 5 - items.plastic * 10;
    if (score >= 10) return { label: '🌱 Excellent compost!', color: 'var(--evs)' };
    if (score >= 5) return { label: '✅ Good compost', color: 'var(--math)' };
    if (score >= 0) return { label: '⚠️ Poor mix', color: 'var(--acc)' };
    return { label: '❌ Not compostable!', color: 'var(--sci)' };
  }

  function draw() {
    var _g=getCtx('compCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);

    /* Compost bin */
    ctx.fillStyle = '#3a2a14'; ctx.fillRect(W * 0.2, H * 0.25, W * 0.6, H * 0.65);
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2; ctx.strokeRect(W * 0.2, H * 0.25, W * 0.6, H * 0.65);
    /* Slats */
    for (var s = 0; s < 5; s++) {
      ctx.strokeStyle = '#2a1a08'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W * 0.2, H * 0.25 + s * H * 0.13); ctx.lineTo(W * 0.8, H * 0.25 + s * H * 0.13); ctx.stroke();
    }

    /* Compost contents */
    var fillH = (decomp / 100) * H * 0.6;
    var q = quality();
    ctx.fillStyle = q.color === 'var(--evs)' ? '#3a6b1e' : q.color === 'var(--math)' ? '#6b5a1e' : '#3a1e1e';
    ctx.fillRect(W * 0.22, H * 0.25 + H * 0.63 - fillH, W * 0.56, fillH);

    /* Worms */
    if (running && decomp > 20) {
      for (var w = 0; w < 3; w++) {
        var wx = W * 0.3 + w * W * 0.15 + Math.sin(t2 * 2 + w) * 10;
        var wy = H * 0.7 + Math.cos(t2 + w) * 8;
        ctx.strokeStyle = '#ff9966'; ctx.lineWidth = 3;
        ctx.beginPath();
        for (var seg = 0; seg < 5; seg++) ctx.lineTo(wx + seg * 8, wy + Math.sin(t2 * 3 + seg + w) * 4);
        ctx.stroke();
      }
    }

    /* Decomposition % */
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(Math.round(decomp) + '% decomposed', W / 2, H * 0.22);

    if (running && decomp < 100) { decomp = Math.min(100, decomp + 0.15); }
    t2 += 0.04;
    if (running) raf2 = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, W, H); draw(); }
  }

  function render() {
    var q = quality();
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Composting Simulator</div>' +
      '<canvas id="compCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-top:8px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">Add to your compost bin:</div>' +
      [
        { k: 'leaves',  label: '🍂 Dry Leaves',   max: 10, good: true },
        { k: 'vegPeel', label: '🥕 Veggie Peels',  max: 10, good: true },
        { k: 'paper',   label: '📄 Paper',         max: 5,  good: true },
        { k: 'meat',    label: '🥩 Meat (avoid!)', max: 5,  good: false },
        { k: 'plastic', label: '🛍️ Plastic (NO!)', max: 3,  good: false },
      ].map(function(item) {
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
          '<span style="font-size:11px;min-width:120px;color:' + (item.good ? 'var(--text)' : 'var(--sci)') + '">' + item.label + '</span>' +
          '<input type="range" class="slide" min="0" max="' + item.max + '" value="' + items[item.k] + '" oninput="compSet(\'' + item.k + '\',this.value)" style="flex:1">' +
          '<span style="font-size:11px;font-weight:800;color:var(--text);min-width:16px">' + items[item.k] + '</span>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div style="background:' + q.color + '22;border:1px solid ' + q.color + '44;border-radius:10px;padding:8px;margin-top:6px;text-align:center;font-size:13px;font-weight:800;color:' + q.color + '">' + q.label + '</div>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="compRun()" id="compBtn" style="background:var(--evs);color:white;border-color:var(--evs)">🌱 Start Decomposing</button>' +
      '<button class="cbtn" onclick="compReset()">↺ Reset</button>' +
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.compSet = function(k, v) { items[k] = parseInt(v); };
  window.compRun = function() {
    running = !running;
    document.getElementById('compBtn').textContent = running ? '⏸ Pause' : '🌱 Resume';
    if (running) draw();
  };
  window.compReset = function() { running = false; decomp = 0; cancelAnimationFrame(raf2); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); running = false; };
  render();
};

/* ── 11. RAIN HARVEST (rain-harvest) ── */
SIM_REGISTRY['rain-harvest'] = function(c) {
  var roofArea = 100, rainfall = 600, efficiency = 0.8;

  function render() {
    var annualCollect = Math.round(roofArea * (rainfall / 1000) * efficiency * 1000);
    var dailyAvg = Math.round(annualCollect / 365);
    var familyNeeds = 150 * 4 * 365; /* 4 person family, 150L/day */
    var coversPct = Math.min(100, Math.round(annualCollect / familyNeeds * 100));

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">☔ Rainwater Harvesting</div>' +
      /* Visual */
      '<svg width="280" height="140" style="display:block;background:#0a0a1a;border-radius:12px;width:100%;margin-bottom:8px">' +
      /* Rain */
      (Array.from({length:12},function(_,i){'';return '<line x1="'+(20+i*22)+'" y1="0" x2="'+(15+i*22)+'" y2="20" stroke="rgba(77,150,255,0.5)" stroke-width="1.5"/>';}).join('')) +
      /* Roof */
      '<polygon points="40,40 140,10 240,40" fill="#C8945A" stroke="#8B6914" stroke-width="2"/>' +
      /* Gutters */
      '<line x1="40" y1="40" x2="40" y2="80" stroke="#888" stroke-width="4"/>' +
      '<line x1="240" y1="40" x2="240" y2="80" stroke="#888" stroke-width="4"/>' +
      /* Pipe */
      '<line x1="40" y1="80" x2="80" y2="80" stroke="#888" stroke-width="3"/>' +
      '<line x1="80" y1="80" x2="80" y2="120" stroke="#888" stroke-width="3"/>' +
      /* Tank */
      '<rect x="60" y="100" width="60" height="35" fill="rgba(77,150,255,0.3)" stroke="rgba(77,150,255,0.6)" stroke-width="2" rx="4"/>' +
      '<text x="90" y="123" fill="rgba(77,150,255,.8)" font-size="9" text-anchor="middle" font-family="Nunito">' + Math.round(annualCollect / 1000) + 'kL/yr</text>' +
      /* Labels */
      '<text x="140" y="132" fill="rgba(255,255,255,.4)" font-size="9" text-anchor="middle" font-family="Nunito">Roof area: ' + roofArea + 'm² · Rainfall: ' + rainfall + 'mm/yr</text>' +
      '</svg>' +
      /* Stats */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">' +
      [
        { label: '💧 Annual Collection', val: (annualCollect / 1000).toFixed(1) + ' kL', color: 'var(--life)' },
        { label: '📅 Daily Average', val: dailyAvg + ' L/day', color: 'var(--acc)' },
        { label: '👨‍👩‍👧‍👦 Family Coverage', val: coversPct + '%', color: coversPct > 50 ? 'var(--evs)' : 'var(--math)' },
        { label: '🌍 Saves', val: Math.round(annualCollect / 1000) + ' tankers/yr', color: 'var(--evs)' },
      ].map(function(s) {
        return '<div style="background:var(--surface2);border-radius:10px;padding:8px;border:1px solid var(--border);text-align:center">' +
          '<div style="font-size:10px;color:var(--muted)">' + s.label + '</div>' +
          '<div style="font-size:18px;font-weight:900;color:' + s.color + '">' + s.val + '</div>' +
          '</div>';
      }).join('') + '</div>' +
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Roof: <b>' + roofArea + 'm²</b></span>' +
      '<input type="range" class="slide" min="10" max="300" step="10" value="' + roofArea + '" oninput="rainRoof(this.value)" style="width:90px">' +
      '<span style="font-size:11px;color:var(--muted)">Rainfall: <b>' + rainfall + 'mm</b></span>' +
      '<input type="range" class="slide" min="100" max="3000" step="100" value="' + rainfall + '" oninput="rainfall(this.value)" style="width:90px">' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">Kerala receives 3,000mm rainfall — one of the highest in India. Yet faces water scarcity! Harvesting can change this.</div>';
  }

  window.rainRoof = function(v) { roofArea = parseInt(v); render(); };
  window.rainFall = function(v) { rainfall = parseInt(v); render(); };
  window.simCleanup = function() {};
  render();
};

/* ── 12. STRESS TOOLS (stress-tools) ── */
SIM_REGISTRY['family-tree'] = function(c) {
  var members = [
    { id: 'gg', name: 'Great-grandpa', gen: 0, x: 0.5, emoji: '👴', color: '#888' },
    { id: 'gm', name: 'Great-grandma', gen: 0, x: 0.5, emoji: '👵', color: '#888', right: true },
    { id: 'gf', name: 'Grandpa', gen: 1, x: 0.28, emoji: '👴', color: '#4D96FF' },
    { id: 'gmo', name: 'Grandma', gen: 1, x: 0.72, emoji: '👵', color: '#C77DFF' },
    { id: 'fa', name: 'Father', gen: 2, x: 0.2, emoji: '👨', color: '#6BCB77' },
    { id: 'mo', name: 'Mother', gen: 2, x: 0.5, emoji: '👩', color: '#FF8C42' },
    { id: 'un', name: 'Uncle', gen: 2, x: 0.8, emoji: '👨', color: '#FFD93D' },
    { id: 'me', name: 'You!', gen: 3, x: 0.35, emoji: '⭐', color: '#FF6B6B' },
    { id: 'si', name: 'Sibling', gen: 3, x: 0.65, emoji: '🧒', color: '#6BCB77' },
  ];
  var selected = null;

  var relations = {
    gg: 'Great-grandparent — your grandparent\'s parent!',
    gm: 'Great-grandparent — your grandparent\'s parent!',
    gf: 'Paternal Grandparent (Thatha/Nana)',
    gmo: 'Maternal/Paternal Grandparent (Paati/Nani)',
    fa: 'Father — your male parent',
    mo: 'Mother — your female parent',
    un: 'Uncle — your parent\'s sibling',
    me: 'You are the centre of your family tree!',
    si: 'Sibling — brother or sister',
  };

  function render() {
    var W = 280, H = 220;
    var genY = [20, 70, 130, 185];

    var nodes = members.map(function(m) {
      var x = m.x * W, y = genY[m.gen];
      var isSel = selected === m.id;
      return '<circle cx="' + x + '" cy="' + y + '" r="' + (isSel ? 20 : 16) + '" fill="' + m.color + '33" stroke="' + m.color + '" stroke-width="' + (isSel ? 3 : 2) + '" style="cursor:pointer" onclick="famSel(\'' + m.id + '\')"/>' +
        '<text x="' + x + '" y="' + (y + 5) + '" font-size="14" text-anchor="middle">' + m.emoji + '</text>' +
        '<text x="' + x + '" y="' + (y + 30) + '" fill="' + m.color + '" font-size="8" font-weight="bold" text-anchor="middle" font-family="Nunito">' + m.name + '</text>';
    }).join('');

    /* Connection lines */
    var lines =
      '<line x1="' + (0.5*W) + '" y1="' + genY[0] + '" x2="' + (0.28*W) + '" y2="' + genY[1] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.5*W) + '" y1="' + genY[0] + '" x2="' + (0.72*W) + '" y2="' + genY[1] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.28*W) + '" y1="' + genY[1] + '" x2="' + (0.2*W) + '" y2="' + genY[2] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.72*W) + '" y1="' + genY[1] + '" x2="' + (0.5*W) + '" y2="' + genY[2] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.28*W) + '" y1="' + genY[1] + '" x2="' + (0.8*W) + '" y2="' + genY[2] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.2*W) + '" y1="' + genY[2] + '" x2="' + (0.35*W) + '" y2="' + genY[3] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>' +
      '<line x1="' + (0.5*W) + '" y1="' + genY[2] + '" x2="' + (0.65*W) + '" y2="' + genY[3] + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Family Tree</div>' +
      '<svg width="' + W + '" height="' + H + '" style="display:block;background:#0a0a1a;border-radius:12px;width:100%">' +
      /* Generation labels */
      '<text x="4" y="' + (genY[0]+4) + '" fill="rgba(255,255,255,.2)" font-size="7" font-family="Nunito">Gen 1</text>' +
      '<text x="4" y="' + (genY[1]+4) + '" fill="rgba(255,255,255,.2)" font-size="7" font-family="Nunito">Gen 2</text>' +
      '<text x="4" y="' + (genY[2]+4) + '" fill="rgba(255,255,255,.2)" font-size="7" font-family="Nunito">Gen 3</text>' +
      '<text x="4" y="' + (genY[3]+4) + '" fill="rgba(255,255,255,.2)" font-size="7" font-family="Nunito">You</text>' +
      lines + nodes +
      '</svg>' +
      (selected ?
        '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
        '<b style="color:var(--acc)">' + members.find(function(m){return m.id===selected;}).name + '</b>: ' + relations[selected] +
        '</div>'
        : '<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-top:8px;border:1px solid var(--border);text-align:center;color:var(--muted);font-size:12px">☝️ Tap any family member to learn the relation</div>') +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">You have 2 parents, 4 grandparents, 8 great-grandparents — it doubles each generation!</div>';
  }

  window.famSel = function(id) { selected = selected === id ? null : id; render(); };
  render();
};

/* ── 14. DEFORESTATION RUNOFF (deforestation-runoff) ── */
SIM_REGISTRY['deforestation-runoff'] = function(c) {
  var raf2, t2 = 0, rain = false, deforested = false, drops = [], soil = 100;

  function draw() {
    var _g=getCtx('defCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);

    /* Sky */
    ctx.fillStyle = rain ? '#1a2a3a' : '#0a1a2a'; ctx.fillRect(0, 0, W, H * 0.35);
    /* Clouds */
    if (rain) {
      ctx.fillStyle = '#334455';
      [[W*0.2,H*0.08,50,18],[W*0.6,H*0.06,65,22]].forEach(function(cl) {
        ctx.beginPath(); ctx.ellipse(cl[0],cl[1],cl[2],cl[3],0,0,Math.PI*2); ctx.fill();
      });
    }

    /* Ground / slope */
    var soilColor = 'rgba(' + Math.round(60 + (100-soil)*1.5) + ',' + Math.round(40 + soil*0.2) + ',20,0.9)';
    ctx.fillStyle = soilColor; ctx.fillRect(0, H*0.35, W, H*0.65);

    /* Trees or stumps */
    var treePositions = [0.1, 0.2, 0.3, 0.6, 0.7, 0.8, 0.9];
    treePositions.forEach(function(xp) {
      var tx = xp * W, ty = H * 0.35;
      if (!deforested) {
        ctx.fillStyle = '#2d5a1e';
        ctx.beginPath(); ctx.moveTo(tx, ty-35); ctx.lineTo(tx-14,ty); ctx.lineTo(tx+14,ty); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(tx, ty-48); ctx.lineTo(tx-10,ty-20); ctx.lineTo(tx+10,ty-20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a3a10'; ctx.fillRect(tx-3, ty, 6, 14);
      } else {
        ctx.fillStyle = '#5a3a10'; ctx.fillRect(tx-4, ty, 8, 8);
        ctx.strokeStyle = '#4a2a08'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(tx, ty+4, 4, 0, Math.PI*2); ctx.stroke();
      }
    });

    /* Rain drops */
    if (rain) {
      if (Math.random() < 0.4) drops.push({ x: Math.random()*W, y: 0, speed: 3+Math.random()*2 });
      drops = drops.filter(function(d) {
        d.y += d.speed;
        ctx.strokeStyle = 'rgba(100,180,255,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-1,d.y-7); ctx.stroke();
        if (d.y > H * 0.35) {
          if (deforested) { soil = Math.max(0, soil - 0.05); }
          return false;
        }
        return true;
      });
    }

    /* Runoff stream if deforested */
    if (deforested && rain) {
      ctx.strokeStyle = 'rgba(139,90,43,0.6)'; ctx.lineWidth = 4; ctx.setLineDash([5,3]);
      ctx.beginPath();
      for (var x = 0; x < W; x += 4) ctx.lineTo(x, H*0.35 + H*0.05 + Math.sin(x/20+t2)*4);
      ctx.stroke(); ctx.setLineDash([]);
    }

    /* Soil level indicator */
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Topsoil: ' + Math.round(soil) + '%', W/2, H-8);
    if (soil < 50) { ctx.fillStyle = 'rgba(255,107,107,.8)'; ctx.fillText('⚠️ Critical erosion!', W/2, H-22); }

    t2 += 0.04;
    raf2 = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Deforestation & Soil Erosion</div>' +
      '<canvas id="defCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px">' +
      '<button class="cbtn" onclick="defRain()" id="defRainBtn" style="background:var(--life);color:white;border-color:var(--life)">🌧️ Start Rain</button>' +
      '<button class="cbtn" onclick="defForest()" id="defForestBtn" style="background:var(--evs);color:white;border-color:var(--evs)">' + (deforested ? '🌳 Replant' : '🪓 Deforest') + '</button>' +
      '<button class="cbtn" onclick="defReset()">↺ Reset</button>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">Tree roots hold soil. Without them, rain washes topsoil away — permanently. It takes 1,000 years to form 1cm of topsoil.</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.defRain = function() {
    rain = !rain;
    document.getElementById('defRainBtn').textContent = rain ? '⏸ Stop Rain' : '🌧️ Start Rain';
  };
  window.defForest = function() {
    deforested = !deforested;
    document.getElementById('defForestBtn').textContent = deforested ? '🌳 Replant' : '🪓 Deforest';
  };
  window.defReset = function() { rain = false; deforested = false; drops = []; soil = 100; cancelAnimationFrame(raf2); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};


/* ══════════════════════════════════════
   BATCH 10 — 14 simulations
   ══════════════════════════════════════ */

/* ── 1. ANIMAL HOMES (animal-homes) ── */
SIM_REGISTRY['animal-homes'] = function(c) {
  var sel = 0;
  var animals = [
    { name:'🐝 Honeybee',   home:'Beehive',      emoji:'🍯', color:'#FFD93D', fact:'Bees build hexagonal cells — the strongest shape that uses least wax. 50,000 bees in one hive!', material:'Beeswax secreted from body' },
    { name:'🦫 Beaver',     home:'Lodge',        emoji:'🪵', color:'#C8945A', fact:'Beavers build dams and lodges entirely underwater entrance — natural flood control!', material:'Sticks, mud, bark' },
    { name:'🐦 Weaver Bird',home:'Woven Nest',   emoji:'🪺', color:'#6BCB77', fact:'Male weaver birds weave intricate nests to impress females. If she doesn\'t like it, he tears it down and starts again!', material:'Grass blades, leaves, fibre' },
    { name:'🐜 Termite',    home:'Termite Mound',emoji:'🏔️', color:'#C8945A', fact:'Termite mounds have perfect air conditioning — vents keep temperature steady at 29°C even in the desert!', material:'Soil, saliva, dung' },
    { name:'🐠 Clownfish',  home:'Anemone',      emoji:'🪸', color:'#FF8C42', fact:'Clownfish are immune to anemone\'s sting. They protect the anemone from predators — perfect symbiosis!', material:'Lives inside anemone tentacles' },
    { name:'🦅 Eagle',      home:'Eyrie',        emoji:'🌄', color:'#888',    fact:'Eagles reuse the same nest for decades! The world\'s largest eagle nest was 6 metres deep and weighed 2 tonnes.', material:'Sticks, grass, bones' },
  ];

  function render() {
    var a = animals[sel];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Animal Homes</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      animals.map(function(an, i) {
        return '<button onclick="animalSel(' + i + ')" style="padding:5px 10px;border-radius:9px;font-size:13px;border:2px solid ' + (i===sel?an.color:'var(--border)') + ';background:' + (i===sel?an.color+'22':'var(--surface2)') + ';cursor:pointer">' + an.name.split(' ')[0] + '</button>';
      }).join('') + '</div>' +
      '<div style="background:' + a.color + '15;border:2px solid ' + a.color + '44;border-radius:14px;padding:20px;text-align:center;margin-bottom:10px">' +
      '<div style="font-size:52px;margin-bottom:6px">' + a.emoji + '</div>' +
      '<div style="font-size:14px;font-weight:900;color:' + a.color + '">' + a.name + '\'s ' + a.home + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px;border:1px solid var(--border)">' +
      '<div style="font-size:10px;font-weight:800;color:' + a.color + ';margin-bottom:4px">🏗️ Built With</div>' +
      '<div style="font-size:12px;color:var(--text)">' + a.material + '</div>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px;border:1px solid var(--border)">' +
      '<div style="font-size:10px;font-weight:800;color:' + a.color + ';margin-bottom:4px">🏠 Called</div>' +
      '<div style="font-size:12px;font-weight:800;color:var(--text)">' + a.home + '</div>' +
      '</div></div>' +
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--text);line-height:1.7">💡 ' + a.fact + '</div>';
  }
  window.animalSel = function(i) { sel = i; render(); };
  render();
};

/* ── 2. CLIMATE WEATHER (climate-weather) ── */
SIM_REGISTRY['climate-weather'] = function(c) {
  var raf2, t2 = 0, day = 0;
  var season = 'monsoon';
  var seasons = {
    monsoon: { name:'☔ Monsoon (June–Sep)', color:'#4D96FF', temp:'25–32°C', rain:'High', humidity:'Very High', emoji:'🌧️', cloudCover:0.9, rainIntensity:0.8 },
    winter:  { name:'❄️ Winter (Nov–Feb)',   color:'#C8D4E8', temp:'15–25°C', rain:'Low',  humidity:'Low',       emoji:'🌤️', cloudCover:0.2, rainIntensity:0 },
    summer:  { name:'☀️ Summer (Mar–May)',   color:'#FF8C42', temp:'35–45°C', rain:'None', humidity:'Low',       emoji:'☀️', cloudCover:0.05, rainIntensity:0 },
    postmonsoon:{name:'🌥️ Post-Monsoon (Oct)',color:'#6BCB77',temp:'22–30°C', rain:'Medium',humidity:'Medium',  emoji:'⛅', cloudCover:0.4, rainIntensity:0.2 },
  };

  function draw() {
    var _g=getCtx('climateCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);
    var s = seasons[season];

    /* Sky gradient */
    var skyTop = season === 'summer' ? '#3a1a00' : season === 'winter' ? '#1a2a3a' : '#0a1a2a';
    var skyBot = season === 'summer' ? '#ff6600' : season === 'monsoon' ? '#1a3a5a' : '#2a3a4a';
    var grad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H * 0.6);

    /* Sun */
    if (season !== 'monsoon') {
      var sunBright = season === 'summer' ? 1 : 0.6;
      ctx.beginPath(); ctx.arc(W * 0.75, H * 0.15, season === 'summer' ? 28 : 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,' + (season === 'summer' ? 150 : 217) + ',50,' + sunBright + ')';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 20 * sunBright;
      ctx.fill(); ctx.shadowBlur = 0;
    }

    /* Clouds */
    var cloudCount = Math.round(s.cloudCover * 6);
    for (var ci = 0; ci < cloudCount; ci++) {
      var cx2 = (W * 0.1 + ci * W * 0.16 + Math.sin(t2 * 0.3 + ci) * 8) % W;
      var cy2 = H * 0.1 + ci * H * 0.06;
      ctx.fillStyle = season === 'monsoon' ? 'rgba(60,80,100,0.9)' : 'rgba(180,200,220,0.7)';
      ctx.beginPath(); ctx.ellipse(cx2, cy2, 35, 15, 0, 0, Math.PI * 2); ctx.fill();
    }

    /* Rain */
    if (s.rainIntensity > 0) {
      for (var ri = 0; ri < Math.round(s.rainIntensity * 20); ri++) {
        var rx = ((ri * 17 + t2 * 60) % W);
        var ry = (t2 * 50 + ri * 11) % (H * 0.6);
        ctx.strokeStyle = 'rgba(100,180,255,0.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 1, ry - 7); ctx.stroke();
      }
    }

    /* Ground */
    var groundColor = season === 'summer' ? '#7a5a2a' : season === 'monsoon' ? '#2d5a1e' : '#4a7a3a';
    ctx.fillStyle = groundColor; ctx.fillRect(0, H * 0.6, W, H * 0.4);

    /* Tree */
    ctx.fillStyle = season === 'summer' ? '#8B6914' : '#2d5a1e';
    ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.6); ctx.lineTo(W * 0.3 - 20, H * 0.75); ctx.lineTo(W * 0.3 + 20, H * 0.75); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.48); ctx.lineTo(W * 0.3 - 15, H * 0.62); ctx.lineTo(W * 0.3 + 15, H * 0.62); ctx.closePath(); ctx.fill();

    /* Stats overlay */
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W * 0.55, H * 0.62, W * 0.43, H * 0.36);
    ctx.fillStyle = s.color; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'left';
    [['🌡️', s.temp], ['🌧️', s.rain + ' rain'], ['💧', s.humidity + ' humidity']].forEach(function(item, i) {
      ctx.fillText(item[0] + ' ' + item[1], W * 0.57, H * 0.68 + i * H * 0.1);
    });

    t2 += 0.04; raf2 = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Climate & Weather — India\'s Seasons</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      Object.keys(seasons).map(function(k) {
        return '<button onclick="climateSel(\'' + k + '\')" style="padding:5px 9px;border-radius:9px;font-size:11px;border:1.5px solid ' + (k===season?seasons[k].color:'var(--border)') + ';background:' + (k===season?seasons[k].color+'22':'var(--surface2)') + ';color:' + (k===season?seasons[k].color:'var(--muted)') + ';cursor:pointer;font-weight:800">' + seasons[k].emoji + ' ' + k + '</button>';
      }).join('') + '</div>' +
      '<canvas id="climateCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">India\'s climate is controlled by monsoon winds from the Indian Ocean. Kerala gets the monsoon first — every June 1st, called the "Monsoon Onset"!</div>';
    cancelAnimationFrame(raf2); draw();
  }
  window.climateSel = function(k) { cancelAnimationFrame(raf2); season = k; render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 3. PARLIAMENT SIM (parliament-sim) ── */
SIM_REGISTRY['parliament-sim'] = function(c) {
  var stage = 0;
  var stages = [
    { emoji:'💡', title:'Bill Introduced',       color:'#4D96FF', desc:'A minister or MP proposes a new law (Bill). It\'s introduced in Lok Sabha or Rajya Sabha with a speech explaining why it\'s needed.' },
    { emoji:'📋', title:'First Reading',          color:'#6BCB77', desc:'The Bill\'s title is read out. No debate yet — just formal introduction. Printed and circulated to all members to read.' },
    { emoji:'🗣️', title:'Second Reading & Debate',color:'#FFD93D', desc:'Members debate the Bill\'s principles. A Select or Standing Committee may study it in detail and suggest changes.' },
    { emoji:'✏️', title:'Committee Stage',        color:'#FF8C42', desc:'The Bill is examined clause by clause. Members can propose amendments (changes). Experts may be consulted.' },
    { emoji:'🗳️', title:'Third Reading & Vote',   color:'#C77DFF', desc:'Final debate. Members vote. If majority approves in one House, it goes to the other House (Lok Sabha ↔ Rajya Sabha).' },
    { emoji:'✅', title:'Presidential Assent',    color:'#6BCB77', desc:'After both Houses pass the Bill, the President signs it. It becomes an ACT — the law of the land!' },
  ];

  function render() {
    var s = stages[stage];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">How a Bill Becomes Law in India</div>' +
      /* Timeline dots */
      '<div style="display:flex;gap:4px;justify-content:center;align-items:center;margin-bottom:10px">' +
      stages.map(function(st, i) {
        return '<div style="width:' + (i===stage?'24px':'10px') + ';height:10px;border-radius:6px;background:' + (i<=stage?st.color:'var(--border)') + ';transition:all .3s;cursor:pointer" onclick="parlStage(' + i + ')"></div>';
      }).join('<div style="height:1px;flex:1;background:var(--border)"></div>') + '</div>' +
      '<div style="background:' + s.color + '15;border:2px solid ' + s.color + '44;border-radius:14px;padding:20px;text-align:center;margin-bottom:10px">' +
      '<div style="font-size:48px;margin-bottom:6px">' + s.emoji + '</div>' +
      '<div style="font-size:15px;font-weight:900;color:' + s.color + ';margin-bottom:6px">Stage ' + (stage+1) + ': ' + s.title + '</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7">' + s.desc + '</div>' +
      '</div>' +
      '<div class="ctrl-row">' +
      (stage > 0 ? '<button class="cbtn" onclick="parlStage(' + (stage-1) + ')">← Back</button>' : '<div></div>') +
      (stage < stages.length-1 ?
        '<button class="cbtn" onclick="parlStage(' + (stage+1) + ')" style="background:' + s.color + ';color:white;border-color:' + s.color + '">Next Stage →</button>' :
        '<button class="cbtn" onclick="parlStage(0)" style="background:var(--evs);color:white;border-color:var(--evs)">🔄 New Bill</button>') +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">India\'s Parliament has two houses: <b style="color:var(--text)">Lok Sabha</b> (545 members, directly elected) and <b style="color:var(--text)">Rajya Sabha</b> (245 members).</div>';
  }
  window.parlStage = function(i) { stage = i; render(); };
  render();
};

/* ── 4. WATER JOURNEY (water-journey) ── */
SIM_REGISTRY['water-journey'] = function(c) {
  var step = 0, raf2, t2 = 0;
  var steps = [
    { emoji:'🌊', title:'Source: River/Dam',     color:'#4D96FF', desc:'Water comes from rivers, lakes, reservoirs, or underground aquifers. India gets most of its drinking water from the Himalayan rivers and monsoon rainfall.' },
    { emoji:'🏭', title:'Treatment Plant',        color:'#6BCB77', desc:'Raw water is treated: 1) Screening removes large debris, 2) Sedimentation — particles settle, 3) Filtration through sand/gravel, 4) Chlorination kills bacteria.' },
    { emoji:'🧪', title:'Quality Testing',        color:'#FFD93D', desc:'Water is tested for pH, turbidity, bacteria, and chemical levels. Must meet BIS standards (IS 10500) before being released.' },
    { emoji:'🏗️', title:'Storage: Overhead Tank', color:'#C77DFF', desc:'Clean water is pumped to elevated storage tanks (overhead reservoirs). Gravity provides the pressure to push water into homes.' },
    { emoji:'🚰', title:'Distribution Network',   color:'#FF8C42', desc:'A network of underground pipes carries water to every neighbourhood. Pipes range from 2km diameter mains to small home connections.' },
    { emoji:'🚿', title:'Your Tap!',              color:'#6BCB77', desc:'Clean, safe water reaches your home. It travels hundreds of kilometres and through 5 treatment stages before you drink it. Every drop is precious!' },
  ];

  function draw() {
    var _g=getCtx('waterJCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    /* Animated water flow */
    var stepX = W / steps.length;
    steps.forEach(function(st, i) {
      var x = stepX * i + stepX / 2, y = H / 2;
      var isActive = i === step, isPast = i < step;
      /* Node */
      ctx.beginPath(); ctx.arc(x, y, isActive ? 22 : 14, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? st.color + 'aa' : isPast ? st.color + '44' : 'rgba(255,255,255,.05)';
      ctx.fill();
      ctx.strokeStyle = isActive ? st.color : isPast ? st.color + '66' : 'rgba(255,255,255,.1)';
      ctx.lineWidth = isActive ? 2.5 : 1.5; ctx.stroke();
      ctx.font = (isActive ? '20px' : '14px') + ' sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(st.emoji, x, y + 6);
      /* Connector */
      if (i < steps.length - 1) {
        var nx = stepX * (i + 1) + stepX / 2;
        /* Animated water drop on pipe */
        if (isPast) {
          var dropX = x + 14 + ((t2 * 20) % (nx - x - 28));
          ctx.beginPath(); ctx.arc(dropX, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = steps[i].color + '88'; ctx.fill();
        }
        ctx.strokeStyle = isPast ? steps[i].color + '44' : 'rgba(255,255,255,.08)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(nx - 14, y); ctx.stroke();
      }
    });
    t2 += 0.04; raf2 = requestAnimationFrame(draw);
  }

  function render() {
    var s = steps[step];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Journey of Water — Source to Tap</div>' +
      '<canvas id="waterJCanvas" data-w="300" data-h="100" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:' + s.color + '15;border:2px solid ' + s.color + '44;border-radius:12px;padding:14px;margin-top:8px;margin-bottom:8px">' +
      '<div style="font-size:15px;font-weight:900;color:' + s.color + ';margin-bottom:4px">Step ' + (step+1) + ': ' + s.emoji + ' ' + s.title + '</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7">' + s.desc + '</div>' +
      '</div>' +
      '<div class="ctrl-row">' +
      (step > 0 ? '<button class="cbtn" onclick="waterJStep(-1)">← Back</button>' : '<div></div>') +
      (step < steps.length-1 ?
        '<button class="cbtn" onclick="waterJStep(1)" style="background:' + s.color + ';color:white;border-color:' + s.color + '">Next →</button>' :
        '<button class="cbtn" onclick="waterJStep(-' + step + ')" style="background:var(--evs);color:white;border-color:var(--evs)">🔄 Start Again</button>') +
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }
  window.waterJStep = function(d) { step = Math.max(0, Math.min(steps.length-1, step+d)); cancelAnimationFrame(raf2); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf2); };
  render();
};

/* ── 5. LONGITUDE & TIME (longitude-time) ── */
SIM_REGISTRY['longitude-time'] = function(c) {
  var longitude = 82.5; /* IST standard */

  function render() {
    var utcHour = 12;
    var offset = longitude / 15;
    var localHour = (utcHour + offset) % 24;
    var citiesData = [
      { name:'London',  lon:0,     tz:'UTC+0' },
      { name:'Mumbai',  lon:72.8,  tz:'UTC+5:30' },
      { name:'IST',     lon:82.5,  tz:'UTC+5:30 (Standard)' },
      { name:'Kolkata', lon:88.4,  tz:'UTC+5:30' },
      { name:'Tokyo',   lon:139.7, tz:'UTC+9' },
    ];

    var W = 280, H = 120;
    /* Globe-like representation */
    var svgLines = '';
    for (var lo = -180; lo <= 180; lo += 30) {
      var x = (lo + 180) / 360 * W;
      var isSelected = Math.abs(lo - longitude) < 15;
      svgLines += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" stroke="' + (isSelected ? 'rgba(255,217,61,.5)' : 'rgba(255,255,255,.06)') + '" stroke-width="' + (isSelected ? 2 : 1) + '"/>';
    }
    /* Equator */
    svgLines += '<line x1="0" y1="' + H/2 + '" x2="' + W + '" y2="' + H/2 + '" stroke="rgba(255,255,255,.1)" stroke-width="1"/>';
    /* Cities */
    citiesData.forEach(function(city) {
      var cx2 = (city.lon + 180) / 360 * W;
      var cityOffset = city.lon / 15;
      var cityTime = Math.round((utcHour + cityOffset) % 24);
      svgLines += '<circle cx="' + cx2 + '" cy="' + H/2 + '" r="5" fill="rgba(255,107,107,.8)"/>';
      svgLines += '<text x="' + cx2 + '" y="' + (H/2-10) + '" fill="rgba(255,255,255,.6)" font-size="8" text-anchor="middle" font-family="Nunito">' + city.name + '</text>';
      svgLines += '<text x="' + cx2 + '" y="' + (H/2+20) + '" fill="rgba(255,107,107,.8)" font-size="8" text-anchor="middle" font-family="Nunito">' + cityTime + ':00</text>';
    });
    /* Selected longitude marker */
    var selX = (longitude + 180) / 360 * W;
    svgLines += '<line x1="' + selX + '" y1="0" x2="' + selX + '" y2="' + H + '" stroke="#FFD93D" stroke-width="2"/>';
    svgLines += '<circle cx="' + selX + '" cy="' + H/2 + '" r="7" fill="#FFD93D"/>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Longitude & Time Zones</div>' +
      '<svg width="' + W + '" height="' + H + '" style="display:block;background:#0a0a1a;border-radius:12px;width:100%;margin-bottom:8px">' +
      svgLines + '</svg>' +
      '<div style="text-align:center;margin-bottom:10px">' +
      '<div style="font-size:13px;color:var(--muted)">At longitude <b style="color:#FFD93D">' + longitude + '°E</b>:</div>' +
      '<div style="font-size:28px;font-weight:900;color:#FFD93D">' + Math.floor(localHour) + ':' + (localHour % 1 * 60).toFixed(0).padStart(2,'0') + ' local time</div>' +
      '<div style="font-size:11px;color:var(--muted)">when UTC = 12:00 noon</div>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-bottom:8px">' +
      '<span style="font-size:11px;color:var(--muted)">Longitude:</span>' +
      '<input type="range" class="slide" min="-180" max="180" step="7.5" value="' + longitude + '" oninput="longSet(this.value)" style="flex:1">' +
      '<span style="font-size:14px;font-weight:900;color:#FFD93D">' + longitude + '°</span>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '🇮🇳 India spans 68°E to 97°E — a difference of 2 hours! To avoid confusion, India uses a single standard time: <b>IST = 82.5°E = UTC+5:30</b> (the 82.5° meridian passes through Allahabad).' +
      '</div>';
  }
  window.longSet = function(v) { longitude = parseFloat(v); render(); };
  render();
};

/* ── 6. AIR SPACE (air-space) ── */
SIM_REGISTRY['air-space'] = function(c) {
  var layer = 0;
  var layers = [
    { name:'Troposphere',   range:'0–12 km',   temp:'15°C to −57°C', color:'#4D96FF', emoji:'✈️', desc:'Where all weather happens. Contains 75% of atmosphere\'s mass. We live at the bottom of this layer!', fact:'Mount Everest (8.8km) is within the troposphere' },
    { name:'Stratosphere',  range:'12–50 km',  temp:'−57°C to 0°C',  color:'#6BCB77', emoji:'🎈', desc:'Where the ozone layer sits (15–35km). Absorbs harmful UV radiation. Weather balloons reach here.', fact:'Concorde jets flew in the lower stratosphere at 18km' },
    { name:'Mesosphere',    range:'50–85 km',  temp:'0°C to −90°C',  color:'#C77DFF', emoji:'☄️', desc:'The coldest layer. Meteors burn up here due to friction with air particles. Very difficult to study.', fact:'Temperature drops to −90°C — the coldest natural place on Earth' },
    { name:'Thermosphere',  range:'85–600 km', temp:'−90°C to 2500°C',color:'#FF8C42', emoji:'🌠', desc:'Northern Lights (Aurora) happen here. ISS orbits here at 400km. Temperature is extreme but air is too thin.', fact:'ISS astronauts are in the thermosphere right now!' },
    { name:'Exosphere',     range:'>600 km',   temp:'0°C to 2000°C', color:'#FF6B6B', emoji:'🛸', desc:'Transition to outer space. GPS satellites orbit here. Air is so thin individual molecules escape into space.', fact:'The Kármán line at 100km is where "space" officially begins' },
  ];

  function render() {
    var l = layers[layer];
    var W = 80, totalH = 250;
    var svg = '<svg width="' + W + '" height="' + totalH + '" style="flex-shrink:0">';
    var segH = totalH / layers.length;
    layers.forEach(function(la, i) {
      var y = i * segH;
      svg += '<rect x="0" y="' + y + '" width="' + W + '" height="' + segH + '" fill="' + la.color + (i===layer?'55':'11') + '" stroke="' + la.color + (i===layer?'':'44') + '" stroke-width="' + (i===layer?2:0.5) + '" style="cursor:pointer" onclick="airLayer(' + i + ')"/>';
      svg += '<text x="' + W/2 + '" y="' + (y+segH/2) + '" fill="' + la.color + '" font-size="' + (i===layer?11:9) + '" font-weight="bold" text-anchor="middle" font-family="Nunito">' + la.emoji + '</text>';
      svg += '<text x="' + W/2 + '" y="' + (y+segH/2+12) + '" fill="rgba(255,255,255,0.4)" font-size="7" text-anchor="middle" font-family="Nunito">' + la.name.slice(0,5) + '</text>';
    });
    svg += '</svg>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Layers of the Atmosphere</div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start">' + svg +
      '<div style="flex:1">' +
      '<div style="background:' + l.color + '22;border:2px solid ' + l.color + '55;border-radius:12px;padding:12px;margin-bottom:8px">' +
      '<div style="font-size:16px;font-weight:900;color:' + l.color + '">' + l.emoji + ' ' + l.name + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin:4px 0">📏 ' + l.range + ' · 🌡️ ' + l.temp + '</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:4px">' + l.desc + '</div>' +
      '</div>' +
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:9px;font-size:11px;color:var(--text);line-height:1.7">💡 ' + l.fact + '</div>' +
      '</div></div>' +
      '<div style="font-size:10px;color:var(--muted);text-align:center;margin-top:6px">← Tap layers to explore each</div>';
  }
  window.airLayer = function(i) { layer = i; render(); };
  render();
};

/* ── 7. GROUPED MEAN (grouped-mean) ── */
SIM_REGISTRY['grouped-mean'] = function(c) {
  var groups = [
    { range:'0–10',  freq:3,  mid:5  },
    { range:'10–20', freq:7,  mid:15 },
    { range:'20–30', freq:12, mid:25 },
    { range:'30–40', freq:8,  mid:35 },
    { range:'40–50', freq:4,  mid:45 },
    { range:'50–60', freq:2,  mid:55 },
  ];

  function render() {
    var totalFreq = groups.reduce(function(s,g){return s+g.freq;},0);
    var totalFX = groups.reduce(function(s,g){return s+g.freq*g.mid;},0);
    var mean = (totalFX/totalFreq).toFixed(2);
    var maxFreq = Math.max.apply(null, groups.map(function(g){return g.freq;}));

    var bars = groups.map(function(g, i) {
      var h = (g.freq/maxFreq)*90;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">' +
        '<div style="font-size:10px;font-weight:800;color:var(--acc)">' + g.freq + '</div>' +
        '<div style="width:100%;height:' + h + 'px;background:var(--acc);border-radius:3px 3px 0 0;cursor:pointer" ' +
        'onclick="gmEdit(' + i + ')"></div>' +
        '<div style="font-size:9px;color:var(--muted);writing-mode:vertical-rl;transform:rotate(180deg);margin-top:2px">' + g.range + '</div>' +
        '</div>';
    }).join('');

    var table = '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
      '<tr style="background:var(--surface2)"><th style="padding:4px 6px;color:var(--muted);font-weight:700;text-align:left">Range</th><th style="padding:4px;color:var(--muted);font-weight:700">f</th><th style="padding:4px;color:var(--muted);font-weight:700">mid (x)</th><th style="padding:4px;color:var(--muted);font-weight:700">f×x</th></tr>' +
      groups.map(function(g) {
        return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:4px 6px;color:var(--text)">' + g.range + '</td><td style="padding:4px;text-align:center;color:var(--acc)">' + g.freq + '</td><td style="padding:4px;text-align:center;color:var(--muted)">' + g.mid + '</td><td style="padding:4px;text-align:center;color:var(--math)">' + (g.freq*g.mid) + '</td></tr>';
      }).join('') +
      '<tr style="background:var(--surface2);font-weight:800"><td style="padding:4px 6px;color:var(--text)">Total</td><td style="padding:4px;text-align:center;color:var(--acc)">' + totalFreq + '</td><td style="padding:4px"></td><td style="padding:4px;text-align:center;color:var(--math)">' + totalFX + '</td></tr>' +
      '</table>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Grouped Mean</div>' +
      '<div style="display:flex;align-items:flex-end;height:110px;gap:4px;border-bottom:2px solid var(--border);margin-bottom:8px">' + bars + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-align:center">Click a bar to change its frequency</div>' +
      table +
      '<div style="text-align:center;margin-top:10px;font-size:14px;font-weight:900;color:var(--evs)">Mean = Σ(f×x) ÷ Σf = ' + totalFX + ' ÷ ' + totalFreq + ' = ' + mean + '</div>';
  }

  window.gmEdit = function(i) {
    var newFreq = parseInt(prompt('Enter frequency for range ' + groups[i].range + ':', groups[i].freq));
    if (!isNaN(newFreq) && newFreq >= 0) { groups[i].freq = newFreq; render(); }
  };
  render();
};

/* ── 8. MINDSET FLIP (mindset-flip) ── */
SIM_REGISTRY['daily-routine'] = function(c) {
  var tasks = [
    { time:'6:00', icon:'⏰', task:'Wake up & stretch', done:false, category:'health' },
    { time:'6:15', icon:'🪥', task:'Brush teeth & freshen up', done:false, category:'hygiene' },
    { time:'6:30', icon:'🧘', task:'Exercise or yoga (20 min)', done:false, category:'health' },
    { time:'7:00', icon:'🍳', task:'Breakfast (never skip!)', done:false, category:'food' },
    { time:'7:30', icon:'📚', task:'Study — hardest subject first', done:false, category:'study' },
    { time:'9:00', icon:'🏫', task:'School / online class', done:false, category:'study' },
    { time:'14:00',icon:'🥗', task:'Lunch & short rest', done:false, category:'food' },
    { time:'15:00',icon:'📖', task:'Homework & revision', done:false, category:'study' },
    { time:'17:00',icon:'⚽', task:'Play / physical activity', done:false, category:'health' },
    { time:'19:00',icon:'🍽️', task:'Dinner with family', done:false, category:'food' },
    { time:'20:00',icon:'📚', task:'Light reading or revision', done:false, category:'study' },
    { time:'21:30',icon:'😴', task:'Sleep — 9 hours!', done:false, category:'health' },
  ];
  var catColors = { health:'var(--evs)', hygiene:'var(--life)', study:'var(--acc)', food:'var(--math)' };

  function render() {
    var doneCnt = tasks.filter(function(t){return t.done;}).length;
    var pct = Math.round(doneCnt/tasks.length*100);
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">📅 My Daily Routine</div>' +
      '<div style="height:8px;background:var(--surface2);border-radius:4px;margin-bottom:8px"><div style="height:8px;width:' + pct + '%;background:var(--evs);border-radius:4px;transition:width .4s"></div></div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:8px">' + doneCnt + '/' + tasks.length + ' tasks done · ' + pct + '%</div>' +
      '<div style="display:flex;flex-direction:column;gap:5px;max-height:240px;overflow-y:auto">' +
      tasks.map(function(t, i) {
        return '<div onclick="dailyToggle(' + i + ')" style="display:flex;align-items:center;gap:8px;background:var(--surface2);border-radius:10px;padding:8px 10px;border:1.5px solid ' + (t.done?catColors[t.category]:'var(--border)') + ';cursor:pointer;transition:all .2s">' +
          '<div style="width:20px;height:20px;border-radius:50%;border:2px solid ' + (t.done?catColors[t.category]:'var(--border)') + ';background:' + (t.done?catColors[t.category]:'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s">' +
          (t.done?'<span style="color:white;font-size:11px">✓</span>':'') + '</div>' +
          '<span style="font-size:11px;color:var(--muted);min-width:40px">' + t.time + '</span>' +
          '<span style="font-size:16px">' + t.icon + '</span>' +
          '<span style="font-size:12px;font-weight:700;color:' + (t.done?'var(--muted)':'var(--text)') + ';text-decoration:' + (t.done?'line-through':'none') + '">' + t.task + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">Tap tasks to mark them done. A consistent routine reduces stress and improves performance!</div>';
  }
  window.dailyToggle = function(i) { tasks[i].done = !tasks[i].done; render(); };
  render();
};

/* ── 10. FOOD AUDIT (food-audit) ── */
SIM_REGISTRY['food-audit'] = function(c) {
  var meals = {
    breakfast: { items:['Paratha','Chai','Banana'], cals:[250,45,90] },
    lunch:     { items:['Rice','Dal','Sabzi','Roti'], cals:[200,120,80,80] },
    snack:     { items:['Chips','Cold drink'], cals:[160,140] },
    dinner:    { items:['Roti','Sabzi','Curd'], cals:[160,100,60] },
  };
  var selected = 'breakfast';

  function render() {
    var totalCals = Object.values(meals).reduce(function(sum, m) {
      return sum + m.cals.reduce(function(a,b){return a+b;},0);
    }, 0);
    var recommended = 2000;
    var pct = Math.min(100, Math.round(totalCals/recommended*100));

    var mealRows = Object.keys(meals).map(function(k) {
      var m = meals[k];
      var mealCal = m.cals.reduce(function(a,b){return a+b;},0);
      var isSel = k === selected;
      return '<div onclick="foodMeal(\'' + k + '\')" style="background:var(--surface2);border-radius:10px;padding:9px 12px;border:1.5px solid ' + (isSel?'var(--acc)':'var(--border)') + ';cursor:pointer;transition:all .2s;margin-bottom:5px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:13px;font-weight:800;color:' + (isSel?'var(--acc)':'var(--text)') + '">' + k.charAt(0).toUpperCase()+k.slice(1) + '</span>' +
        '<span style="font-size:13px;font-weight:900;color:var(--math)">' + mealCal + ' kcal</span>' +
        '</div>' +
        (isSel ?
          '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">' +
          m.items.map(function(item, i) {
            return '<span style="background:var(--surface);border-radius:6px;padding:3px 7px;font-size:11px;color:var(--text)">' + item + ' (' + m.cals[i] + ')</span>';
          }).join('') + '</div>' : '') +
        '</div>';
    }).join('');

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🍽️ Daily Food Audit</div>' +
      /* Calorie meter */
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
      '<span style="font-size:11px;color:var(--muted)">Total: <b style="color:' + (totalCals>2200?'var(--sci)':totalCals>1800?'var(--math)':'var(--evs)') + '">' + totalCals + ' kcal</b></span>' +
      '<span style="font-size:11px;color:var(--muted)">Recommended: <b>~2000 kcal</b></span>' +
      '</div>' +
      '<div style="height:14px;background:var(--surface);border-radius:7px;overflow:hidden">' +
      '<div style="height:100%;width:' + pct + '%;background:' + (pct>110?'var(--sci)':pct>90?'var(--math)':'var(--evs)') + ';border-radius:7px;transition:width .4s"></div></div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + (totalCals>2200?'⚠️ Over the daily limit!':totalCals<1500?'⚠️ Under-eating — not enough energy!':'✅ Balanced calorie intake') + '</div>' +
      '</div>' +
      mealRows +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">Tap a meal to see its breakdown. The snack has 300 calories of low-nutrition food! Swap chips for fruit.</div>';
  }
  window.foodMeal = function(k) { selected = k; render(); };
  render();
};

/* ── 11. CLIMATE ZONES (climate-zones) ── */
SIM_REGISTRY['climate-zones'] = function(c) {
  var zone = 'tropical';
  var zones = {
    tropical:   { name:'🌴 Tropical',    temp:'>18°C year-round', rainfall:'Heavy (>2500mm)',  color:'#6BCB77',  examples:'Amazon, Congo, Kerala coast, SE Asia',    animals:'Jaguar, Macaw, Tiger, Elephant',    plants:'Rainforest, mangroves, orchids' },
    desert:     { name:'🏜️ Desert',      temp:'Extreme (−10 to 55°C)',rainfall:'<250mm/yr',    color:'#C8A96A',  examples:'Sahara, Thar (India), Australian Outback', animals:'Camel, Scorpion, Fennec Fox',        plants:'Cactus, Acacia, Date Palm' },
    temperate:  { name:'🌿 Temperate',   temp:'10–20°C average',  rainfall:'500–1500mm',      color:'#4D96FF',  examples:'Europe, NE USA, parts of China',           animals:'Deer, Squirrel, Robin',             plants:'Oak, Maple, Wheat' },
    polar:      { name:'❄️ Polar',       temp:'<−10°C most of year',rainfall:'<250mm (snow)',  color:'#C8D4F8',  examples:'Arctic, Antarctic, Siberia',               animals:'Polar Bear, Penguin, Seal',         plants:'Lichens, Mosses, Tundra grass' },
    mediterranean:{name:'🫒 Mediterranean',temp:'Dry summers, mild winters',rainfall:'300–900mm',color:'#FFD93D',examples:'Mediterranean coast, California, Chile, SW Australia',animals:'Lynx, Wild Boar, Flamingo',  plants:'Olive, Cork Oak, Lavender' },
  };

  function render() {
    var z = zones[zone];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">World Climate Zones</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">' +
      Object.keys(zones).map(function(k) {
        return '<button onclick="climZone(\'' + k + '\')" style="padding:5px 9px;border-radius:9px;font-size:11px;border:1.5px solid ' + (k===zone?zones[k].color:'var(--border)') + ';background:' + (k===zone?zones[k].color+'22':'var(--surface2)') + ';color:' + (k===zone?zones[k].color:'var(--muted)') + ';cursor:pointer;font-weight:800">' + zones[k].name.split(' ')[0] + ' ' + zones[k].name.split(' ')[1] + '</button>';
      }).join('') + '</div>' +
      '<div style="background:' + z.color + '22;border:2px solid ' + z.color + '55;border-radius:14px;padding:14px;margin-bottom:8px">' +
      '<div style="font-size:15px;font-weight:900;color:' + z.color + ';margin-bottom:8px">' + z.name + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
      [['🌡️ Temperature',z.temp],['🌧️ Rainfall',z.rainfall],['🌍 Examples',z.examples],['🐾 Animals',z.animals],['🌿 Plants',z.plants]].map(function(row) {
        return '<div style="' + (row[0].includes('Examples')||row[0].includes('Animals')||row[0].includes('Plants')?'grid-column:1/-1;':'') + 'background:rgba(0,0,0,.2);border-radius:8px;padding:7px 9px">' +
          '<div style="font-size:10px;font-weight:800;color:' + z.color + '">' + row[0] + '</div>' +
          '<div style="font-size:11px;color:var(--text);margin-top:2px">' + row[1] + '</div>' +
          '</div>';
      }).join('') + '</div></div>';
  }
  window.climZone = function(k) { zone = k; render(); };
  render();
};

/* ── 12. PROBLEM STEPS (problem-steps) ── */
SIM_REGISTRY['problem-steps'] = function(c) {
  var activeStep = null;
  var problem = 'A train leaves Delhi at 6:00 AM at 80 km/h. Another train leaves at 8:00 AM at 120 km/h in the same direction. When do they meet?';
  var steps = [
    { icon:'🔍', title:'Understand the Problem', color:'#4D96FF',
      content:'What do we know? Train A: 80 km/h, starts 6 AM. Train B: 120 km/h, starts 8 AM.\nWhat do we need? When do they meet (same position)?', },
    { icon:'📋', title:'Plan the Strategy',       color:'#6BCB77',
      content:'Train A has a 2-hour head start. By 8 AM, A has gone 80×2 = 160 km.\nThen B catches up at a rate of (120-80) = 40 km/h.', },
    { icon:'✏️', title:'Solve Step by Step',      color:'#FFD93D',
      content:'Gap to close = 160 km\nClosing speed = 120 - 80 = 40 km/h\nTime for B to catch A = 160 ÷ 40 = 4 hours\nB meets A at 8:00 AM + 4 hours = 12:00 PM (noon)', },
    { icon:'✅', title:'Check the Answer',         color:'#6BCB77',
      content:'By noon: A has travelled 6 hours × 80 = 480 km\nBy noon: B has travelled 4 hours × 120 = 480 km ✅\nBoth at 480 km — they meet!' },
  ];

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Problem-Solving Strategy</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-bottom:10px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7;font-style:italic">' + problem + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      steps.map(function(s, i) {
        var isActive = activeStep === i;
        return '<div onclick="probStep(' + i + ')" style="border-radius:12px;border:2px solid ' + (isActive?s.color:'var(--border)') + ';background:' + (isActive?s.color+'15':'var(--surface2)') + ';cursor:pointer;overflow:hidden;transition:all .2s">' +
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:' + s.color + ';color:white;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">' + s.icon + '</div>' +
          '<div style="font-size:13px;font-weight:800;color:' + (isActive?s.color:'var(--text)') + '">Step ' + (i+1) + ': ' + s.title + '</div>' +
          '<div style="margin-left:auto;font-size:14px;color:var(--muted)">' + (isActive?'▲':'▼') + '</div>' +
          '</div>' +
          (isActive ? '<div style="padding:0 12px 12px;font-size:12px;color:var(--text);line-height:1.8;white-space:pre-line">' + s.content + '</div>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px">Use this 4-step method for any maths word problem: Understand → Plan → Solve → Check</div>';
  }
  window.probStep = function(i) { activeStep = activeStep === i ? null : i; render(); };
  render();
};

/* ── 13. URBAN RURAL (urban-rural) ── */
SIM_REGISTRY['urban-rural'] = function(c) {
  var view = 'compare';
  var data = {
    urban:  { emoji:'🏙️', name:'Urban (City)', color:'#4D96FF', population:'36% of India', density:'High — 3000+ per km²', jobs:'Industry, Services, IT', education:'Better access to schools and colleges', health:'Hospitals and specialists nearby', problems:'Pollution, overcrowding, cost of living, loneliness', famous:'Mumbai, Delhi, Bangalore, Chennai' },
    rural:  { emoji:'🌾', name:'Rural (Village)', color:'#6BCB77', population:'64% of India', density:'Low — <500 per km²', jobs:'Agriculture, fishing, small trades', education:'Fewer schools, some lack colleges', health:'Primary health centres, far from hospitals', problems:'Poverty, lack of infrastructure, migration', famous:'Kerala villages, Punjab farmlands, UP rural' },
  };

  function render() {
    if (view === 'compare') {
      var keys = ['population','density','jobs','education','health','problems'];
      var labels = {'population':'👥 Population','density':'📍 Density','jobs':'💼 Jobs','education':'🎓 Education','health':'🏥 Healthcare','problems':'⚠️ Challenges'};
      c.innerHTML =
        '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Urban vs Rural India</div>' +
        '<div class="ctrl-row" style="margin-bottom:8px"><button onclick="urView(\'compare\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1.5px solid var(--acc);background:var(--acc-dim);color:var(--acc);cursor:pointer;font-weight:800">Compare</button><button onclick="urView(\'urban\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer">🏙️ Urban</button><button onclick="urView(\'rural\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer">🌾 Rural</button></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">' +
        '<div style="font-size:10px;color:var(--muted);font-weight:800;padding:4px">Aspect</div>' +
        '<div style="font-size:11px;font-weight:800;color:#4D96FF;padding:4px;text-align:center">🏙️ Urban</div>' +
        '<div style="font-size:11px;font-weight:800;color:#6BCB77;padding:4px;text-align:center">🌾 Rural</div>' +
        keys.map(function(k) {
          return '<div style="font-size:10px;color:var(--muted);padding:4px;border-top:1px solid var(--border)">' + labels[k] + '</div>' +
            '<div style="font-size:10px;color:var(--text);padding:4px;border-top:1px solid var(--border)">' + data.urban[k] + '</div>' +
            '<div style="font-size:10px;color:var(--text);padding:4px;border-top:1px solid var(--border)">' + data.rural[k] + '</div>';
        }).join('') + '</div>' +
        '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">India is rapidly urbanising — from 27% urban in 2001 to 36% in 2011. By 2050, over 50% of Indians will live in cities!</div>';
    } else {
      var d = data[view];
      c.innerHTML =
        '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Urban vs Rural India</div>' +
        '<div class="ctrl-row" style="margin-bottom:8px"><button onclick="urView(\'compare\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);cursor:pointer">Compare</button><button onclick="urView(\'urban\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1.5px solid #4D96FF;background:rgba(77,150,255,.15);color:#4D96FF;cursor:pointer;font-weight:800">🏙️ Urban</button><button onclick="urView(\'rural\')" style="padding:5px 12px;border-radius:9px;font-size:12px;border:1.5px solid #6BCB77;background:rgba(107,203,119,.15);color:#6BCB77;cursor:pointer;font-weight:800">🌾 Rural</button></div>' +
        '<div style="text-align:center;font-size:48px;margin-bottom:6px">' + d.emoji + '</div>' +
        '<div style="font-size:16px;font-weight:900;color:' + d.color + ';text-align:center;margin-bottom:10px">' + d.name + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:5px">' +
        ['population','density','jobs','education','health','problems','famous'].map(function(k) {
          var labels2 = {'population':'👥','density':'📍','jobs':'💼','education':'🎓','health':'🏥','problems':'⚠️','famous':'📌'};
          return '<div style="background:var(--surface2);border-radius:9px;padding:8px 10px;border:1px solid var(--border);display:flex;gap:8px"><span>' + labels2[k] + '</span><div><b style="font-size:10px;color:' + d.color + '">' + k.toUpperCase() + '</b><div style="font-size:11px;color:var(--text)">' + d[k] + '</div></div></div>';
        }).join('') + '</div>';
    }
  }
  window.urView = function(v) { view = v; render(); };
  render();
};

/* ── 14. TEAMWORK TOWER (teamwork-tower) ── */
SIM_REGISTRY['motor-model'] = function(c) {
  var raf2, t2=0, running=false, speed=1;

  function draw() {
    var _g=getCtx('motorCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    var cx=W/2,cy=H/2,angle=t2*speed;

    /* Stator (outer) */
    ctx.beginPath(); ctx.arc(cx,cy,70,0,Math.PI*2);
    ctx.fillStyle='rgba(100,100,120,0.4)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=3; ctx.stroke();

    /* Stator coils */
    for(var i=0;i<6;i++){
      var a=i/6*Math.PI*2;
      var sx=cx+Math.cos(a)*55,sy=cy+Math.sin(a)*55;
      ctx.beginPath(); ctx.arc(sx,sy,10,0,Math.PI*2);
      var coilColor=i<3?'rgba(255,107,107,0.7)':'rgba(77,150,255,0.7)';
      ctx.fillStyle=coilColor; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.stroke();
      /* Field arrows */
      if(running){
        var arrow=i<3?1:-1;
        ctx.strokeStyle=coilColor; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(sx,sy-6*arrow); ctx.lineTo(sx,sy+6*arrow); ctx.stroke();
        ctx.fillStyle=coilColor; ctx.font='10px sans-serif'; ctx.textAlign='center';
        ctx.fillText(i<3?'N':'S',sx,sy+4);
      }
    }

    /* Rotor */
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
    ctx.fillStyle='rgba(255,217,61,0.2)';
    ctx.fillRect(-30,-12,60,24);
    ctx.strokeStyle='#FFD93D'; ctx.lineWidth=2; ctx.strokeRect(-30,-12,60,24);
    /* Rotor coil */
    ctx.strokeStyle='rgba(107,203,119,0.8)'; ctx.lineWidth=2;
    for(var r=0;r<3;r++){
      ctx.beginPath(); ctx.ellipse(0,0,25-r*3,10-r*2,0,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();

    /* Shaft */
    ctx.beginPath(); ctx.arc(cx,cy,8,0,Math.PI*2);
    ctx.fillStyle='#888'; ctx.fill();

    /* Rotation arrow */
    if(running){
      ctx.strokeStyle='rgba(255,217,61,0.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx,cy,80,angle,angle+1.5);
      ctx.stroke();
      ctx.fillStyle='rgba(255,217,61,0.6)';
      ctx.font='12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('⚡→🔄',cx,H-12);
    }

    t2+=0.04;
    if(running) raf2=requestAnimationFrame(draw);
  }

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Electric Motor Model</div>'+
      '<canvas id="motorCanvas" data-w="280" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      '<button class="cbtn" onclick="motorRun()" id="motorBtn" style="background:var(--math);color:white;border-color:var(--math)">⚡ Power On</button>'+
      '<span style="font-size:11px;color:var(--muted)">Speed:</span>'+
      '<input type="range" class="slide" min="0.5" max="5" step="0.5" value="1" oninput="motorSpeed(this.value)" style="width:100px">'+
      '</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      '🔴 Stator = fixed electromagnets · 🟡 Rotor = spinning coil · Current in rotor → magnetic field → repulsion/attraction → <b>rotation</b>! Fleming\'s Left Hand Rule.'+
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.motorRun=function(){running=!running;document.getElementById('motorBtn').textContent=running?'⏸ Power Off':'⚡ Power On';if(running)draw();};
  window.motorSpeed=function(v){speed=parseFloat(v);};
  window.simCleanup=function(){cancelAnimationFrame(raf2);running=false;};
  render();
};

/* ── 2. ADAPTATION SHOW (adaptation-show) ── */
SIM_REGISTRY['adaptation-show'] = function(c) {
  var sel=0;
  var animals=[
    {name:'🐪 Camel',   habitat:'Desert',  color:'#C8A96A',
     adaptations:['Hump stores fat (not water!) — energy reserve for weeks','Extra-long eyelashes keep sand out of eyes','Can lose 40% body weight in water and survive','Wide feet act like snowshoes on sand','Can drink 100L of water in 13 minutes!'],
     fact:'Camels can raise their body temperature to avoid sweating!'},
    {name:'🐻‍❄️ Polar Bear', habitat:'Arctic', color:'#E8F0FF',
     adaptations:['Hollow transparent fur traps heat like a greenhouse','Black skin underneath absorbs maximum sunlight','Thick layer of fat (10cm) for insulation','Large paws to spread weight on thin ice','Great swimmers — can swim 100km without rest!'],
     fact:'Polar bear fur is actually colourless, not white — it scatters light!'},
    {name:'🦁 Lion',    habitat:'Savanna', color:'#C8945A',
     adaptations:['Tawny coat camouflages in golden grass','Social hunters — pack tactics to catch large prey','Sleep 20 hours/day to conserve energy in heat','Territory marking prevents prey from leaving area','Roar carries 8km — keeps rivals away!'],
     fact:'Only the lion among big cats lives in social groups — prides.'},
    {name:'🐟 Deep Sea Fish', habitat:'Deep Ocean', color:'#4D96FF',
     adaptations:['Bioluminescent light to attract prey in darkness','Expandable stomachs to eat rare large meals','No eyes in some species — useless in pure dark','Antifreeze proteins prevent cells from freezing','Can withstand pressure 1000× greater than surface!'],
     fact:'Some deep sea fish have transparent bodies — organs and skeleton visible!'},
  ];

  function render(){
    var a=animals[sel];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Animal Adaptations</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      animals.map(function(an,i){return '<button onclick="adaptSel('+i+')" style="padding:5px 10px;border-radius:9px;font-size:13px;border:2px solid '+(i===sel?an.color:'var(--border)')+';background:'+(i===sel?an.color+'22':'var(--surface2)')+';cursor:pointer">'+an.name.split(' ')[0]+'</button>';}).join('')+
      '</div>'+
      '<div style="background:'+a.color+'15;border:2px solid '+a.color+'44;border-radius:14px;padding:14px;margin-bottom:8px;text-align:center">'+
      '<div style="font-size:48px;margin-bottom:4px">'+a.name.split(' ')[0]+'</div>'+
      '<div style="font-size:14px;font-weight:900;color:'+a.color+';margin-bottom:2px">'+a.name.split(' ').slice(1).join(' ')+'</div>'+
      '<div style="font-size:11px;color:var(--muted)">Habitat: '+a.habitat+'</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px">'+
      a.adaptations.map(function(ad,i){return '<div style="display:flex;gap:8px;background:var(--surface2);border-radius:9px;padding:8px 10px;border:1px solid var(--border)"><div style="width:20px;height:20px;border-radius:50%;background:'+a.color+';color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;flex-shrink:0">'+(i+1)+'</div><div style="font-size:12px;color:var(--text);line-height:1.6">'+ad+'</div></div>';}).join('')+
      '</div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;color:var(--text);line-height:1.7">⭐ Amazing: '+a.fact+'</div>';
  }
  window.adaptSel=function(i){sel=i;render();};
  render();
};

/* ── 3. CONSTITUTION RIGHTS (constitution-rights) ── */
SIM_REGISTRY['constitution-rights'] = function(c) {
  var sel=null;
  var rights=[
    {num:'Art 12-35', name:'Fundamental Rights', icon:'⚖️', color:'#FF6B6B',
     rights:['Right to Equality (Art 14-18)','Right to Freedom (Art 19-22)','Right Against Exploitation (Art 23-24)','Right to Freedom of Religion (Art 25-28)','Cultural & Educational Rights (Art 29-30)','Right to Constitutional Remedies (Art 32)'],
     note:'Dr. BR Ambedkar called Article 32 the "heart and soul" of the Constitution.'},
    {num:'Part IV', name:'Directive Principles', icon:'🎯', color:'#FFD93D',
     rights:['Equal pay for equal work','Free legal aid','Right to work','Public health & nutrition','Uniform Civil Code','Protection of environment'],
     note:'DPSPs are not enforceable in court but guide government policy.'},
    {num:'Part IVA', name:'Fundamental Duties', icon:'🤝', color:'#6BCB77',
     rights:['Abide by the Constitution','Respect national symbols','Promote harmony','Protect environment','Develop scientific temper','Safeguard public property'],
     note:'Added in 1976 by 42nd Amendment. 11 duties total.'},
    {num:'Various', name:'Children\'s Rights', icon:'🧒', color:'#4D96FF',
     rights:['Right to free education (6-14 years) - Art 21A','Protection from hazardous work - Art 24','Special care in custody matters','Right to play and leisure','Right to protection from abuse','POCSO Act 2012 protection'],
     note:'Right to Education Act 2009 made free education a fundamental right!'},
  ];

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Indian Constitution — Rights & Duties</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      rights.map(function(r,i){return '<button onclick="constSel('+i+')" style="padding:6px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(sel===i?r.color:'var(--border)')+';background:'+(sel===i?r.color+'22':'var(--surface2)')+';color:'+(sel===i?r.color:'var(--muted)')+';cursor:pointer;font-weight:800">'+r.icon+' '+r.name.split(' ')[0]+'</button>';}).join('')+
      '</div>'+
      (sel!==null?
        '<div style="background:'+rights[sel].color+'15;border:2px solid '+rights[sel].color+'44;border-radius:12px;padding:12px;margin-bottom:8px">'+
        '<div style="font-size:14px;font-weight:900;color:'+rights[sel].color+';margin-bottom:2px">'+rights[sel].icon+' '+rights[sel].name+'</div>'+
        '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">'+rights[sel].num+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">'+
        rights[sel].rights.map(function(r2){return '<div style="font-size:12px;color:var(--text);padding:5px 0;border-bottom:1px solid var(--border)44;display:flex;gap:6px"><span style="color:'+rights[sel].color+'">•</span>'+r2+'</div>';}).join('')+
        '</div>'+
        '<div style="font-size:11px;color:var(--muted);font-style:italic;background:rgba(0,0,0,.2);border-radius:8px;padding:8px">💡 '+rights[sel].note+'</div>'+
        '</div>'
        :'<div style="background:var(--surface2);border-radius:10px;padding:16px;border:1px solid var(--border);text-align:center;color:var(--muted);font-size:12px">☝️ Tap a category to explore India\'s constitutional framework</div>')+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">India\'s Constitution is the world\'s longest — 448 articles, 12 schedules! Adopted on 26 November 1949, came into effect 26 January 1950.</div>';
  }
  window.constSel=function(i){sel=sel===i?null:i;render();};
  render();
};

/* ── 4. GDP HDI (gdp-hdi) ── */
SIM_REGISTRY['gdp-hdi'] = function(c) {
  var metric='gdp';
  var countries=[
    {name:'🇳🇴 Norway',   gdp:89202, hdi:0.961, pop:5.4},
    {name:'🇨🇭 Switzerland',gdp:87097,hdi:0.962,pop:8.7},
    {name:'🇺🇸 USA',      gdp:63543, hdi:0.921, pop:335},
    {name:'🇨🇳 China',    gdp:12556, hdi:0.768, pop:1412},
    {name:'🇧🇷 Brazil',   gdp:7507,  hdi:0.754, pop:215},
    {name:'🇮🇳 India',    gdp:2185,  hdi:0.633, pop:1430},
    {name:'🇳🇬 Nigeria',  gdp:2065,  hdi:0.535, pop:218},
    {name:'🇪🇹 Ethiopia', gdp:925,   hdi:0.498, pop:123},
  ];

  function render(){
    var key=metric==='gdp'?'gdp':'hdi';
    var maxVal=Math.max.apply(null,countries.map(function(co){return co[key];}));
    var bars=countries.map(function(co){
      var pct=(co[key]/maxVal)*100;
      var val=metric==='gdp'?'$'+co.gdp.toLocaleString():co.hdi;
      var color=metric==='gdp'?(co.gdp>30000?'#6BCB77':co.gdp>10000?'#FFD93D':co.gdp>5000?'#FF8C42':'#FF6B6B'):(co.hdi>0.8?'#6BCB77':co.hdi>0.7?'#FFD93D':co.hdi>0.55?'#FF8C42':'#FF6B6B');
      var isIndia=co.name.includes('India');
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'+
        '<div style="min-width:90px;font-size:11px;font-weight:'+(isIndia?'900':'600')+';color:'+(isIndia?'var(--acc)':'var(--text)');+'text-align:right">'+co.name+'</div>'+
        '<div style="flex:1;height:20px;background:var(--surface2);border-radius:4px;overflow:hidden">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+(isIndia?'':'')+';border-radius:4px;display:flex;align-items:center;padding:0 4px;transition:width .5s">'+
        '<span style="font-size:9px;font-weight:800;color:rgba(0,0,0,0.7);white-space:nowrap">'+val+'</span>'+
        '</div></div></div>';
    }).join('');

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">GDP & HDI — Measuring Development</div>'+
      '<div class="ctrl-row" style="margin-bottom:8px">'+
      '<button onclick="gdpMetric(\'gdp\')" style="padding:6px 14px;border-radius:9px;font-size:12px;border:1.5px solid '+(metric==='gdp'?'var(--acc)':'var(--border)')+';background:'+(metric==='gdp'?'var(--acc-dim)':'var(--surface2)')+';color:'+(metric==='gdp'?'var(--acc)':'var(--muted)')+';cursor:pointer;font-weight:800">💰 GDP per Capita</button>'+
      '<button onclick="gdpMetric(\'hdi\')" style="padding:6px 14px;border-radius:9px;font-size:12px;border:1.5px solid '+(metric==='hdi'?'var(--acc)':'var(--border)')+';background:'+(metric==='hdi'?'var(--acc-dim)':'var(--surface2)')+';color:'+(metric==='hdi'?'var(--acc)':'var(--muted)')+';cursor:pointer;font-weight:800">🌍 HDI Score</button>'+
      '</div>'+
      bars+
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+
      (metric==='gdp'?'💰 GDP per Capita = total economic output ÷ population. High GDP ≠ happy people! Qatar has high GDP but low on happiness index.':'🌍 HDI = Human Development Index (0–1). Measures life expectancy + education + income. More complete than GDP alone!')+
      '</div>';
  }
  window.gdpMetric=function(m){metric=m;render();};
  render();
};

/* ── 5. LIVING SORT (living-sort) ── */
SIM_REGISTRY['living-sort'] = function(c) {
  var items=[
    {name:'Mushroom',  emoji:'🍄', type:'neither', group:'Fungi'},
    {name:'Mango Tree',emoji:'🌳', type:'plant',   group:'Plant'},
    {name:'Butterfly', emoji:'🦋', type:'animal',  group:'Animal'},
    {name:'Bacteria',  emoji:'🦠', type:'neither', group:'Monera'},
    {name:'Fern',      emoji:'🌿', type:'plant',   group:'Plant'},
    {name:'Coral',     emoji:'🪸', type:'animal',  group:'Animal'},
    {name:'Amoeba',    emoji:'🫧', type:'neither', group:'Protista'},
    {name:'Eagle',     emoji:'🦅', type:'animal',  group:'Animal'},
    {name:'Moss',      emoji:'🌱', type:'plant',   group:'Plant'},
  ];
  var userSort={plant:[],animal:[],neither:[]};
  var dragging=null;
  var revealed=false;

  function render(){
    var placed=userSort.plant.length+userSort.animal.length+userSort.neither.length;
    var unsorted=items.filter(function(it){return !userSort.plant.includes(it.name)&&!userSort.animal.includes(it.name)&&!userSort.neither.includes(it.name);});

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Living Things — Classification Sort</div>'+
      /* Items to sort */
      '<div style="background:var(--surface2);border-radius:10px;padding:8px;margin-bottom:8px;border:1px solid var(--border);min-height:50px">' +
      '<div style="font-size:10px;font-weight:800;color:var(--muted);margin-bottom:6px">SORT THESE:</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px">'+
      unsorted.map(function(it){return '<div onclick="lsClick(\''+it.name+'\')" style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:8px 10px;cursor:pointer;text-align:center;transition:all .2s"><div style="font-size:22px">'+it.emoji+'</div><div style="font-size:10px;color:var(--text)">'+it.name+'</div></div>';}).join('')+
      '</div></div>'+
      /* Drop zones */
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'+
      [['plant','🌿 Plants','var(--evs)'],['animal','🐾 Animals','var(--sci)'],['neither','🍄 Others','var(--acc)']].map(function(zone){
        var sorted=userSort[zone[0]].map(function(name){var it=items.find(function(i){return i.name===name;});return it?'<div onclick="lsRemove(\''+name+'\',\''+zone[0]+'\')" style="font-size:18px;cursor:pointer" title="Click to remove">'+it.emoji+'</div>':'';}).join('');
        return '<div style="background:'+zone[2]+'15;border:2px dashed '+zone[2]+'55;border-radius:10px;padding:8px;min-height:70px;text-align:center">'+
          '<div style="font-size:10px;font-weight:800;color:'+zone[2]+';margin-bottom:6px">'+zone[1]+'</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">'+sorted+'</div></div>';
      }).join('')+'</div>'+
      /* Controls */
      '<div class="ctrl-row">'+
      '<button class="cbtn" onclick="lsReveal()" style="background:var(--acc);color:white;border-color:var(--acc);font-size:12px">👁️ Check Answers</button>'+
      '<button class="cbtn" onclick="lsReset()" style="font-size:12px">↺ Reset</button>'+
      '</div>'+
      (revealed?'<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-top:8px;border:1px solid var(--border);font-size:11px;line-height:1.8">'+
        items.map(function(it){
          var placed2=userSort.plant.includes(it.name)?'plant':userSort.animal.includes(it.name)?'animal':userSort.neither.includes(it.name)?'neither':null;
          var correct=placed2===it.type;
          return '<span style="color:'+(correct?'var(--evs)':'var(--sci)')+';margin-right:8px">'+(correct?'✅':'❌')+' '+it.emoji+' '+it.name+' → '+it.group+'</span>';
        }).join('')+'</div>':'');

    window._lsSel=null;
  }

  window.lsClick=function(name){
    if(!window._lsSel){window._lsSel=name;render();return;}
    /* If clicking same item deselect */
  };
  window.lsClick=function(name){
    var zone=prompt('Sort "'+name+'" into: 1=Plants, 2=Animals, 3=Others');
    var key=zone==='1'?'plant':zone==='2'?'animal':'neither';
    if(!userSort[key].includes(name)){userSort[key].push(name);}
    render();
  };
  window.lsRemove=function(name,zone){userSort[zone]=userSort[zone].filter(function(n){return n!==name;});render();};
  window.lsReveal=function(){revealed=true;render();};
  window.lsReset=function(){userSort={plant:[],animal:[],neither:[]};revealed=false;render();};
  render();
};

/* ── 6. CONSUMER RIGHTS (consumer-rights) ── */
SIM_REGISTRY['consumer-rights'] = function(c) {
  var sel=null;
  var rights=[
    {icon:'🛡️',name:'Right to Safety',         color:'#FF6B6B', desc:'Protection from hazardous goods and services. ISI mark on electrical goods, FSSAI on food.',example:'A defective gas cylinder that explodes is a consumer rights violation.'},
    {icon:'ℹ️',name:'Right to Information',     color:'#FFD93D', desc:'Consumers must be told about quality, quantity, price, and hazards of products.',example:'Hidden charges on a phone bill violate this right.'},
    {icon:'🎯',name:'Right to Choose',           color:'#6BCB77', desc:'Freedom to choose from a variety of goods at competitive prices. No monopolies!',example:'Forcing you to buy only one brand at a fair violates this right.'},
    {icon:'🗣️',name:'Right to be Heard',        color:'#4D96FF', desc:'Consumer complaints must be addressed. Consumer Forums exist at district, state, national level.',example:'Company ignoring your complaint about a defective product.'},
    {icon:'💰',name:'Right to Redressal',        color:'#C77DFF', desc:'Compensation for unfair trade practices or defective goods. File in Consumer Court!',example:'Getting a full refund or replacement for a faulty appliance.'},
    {icon:'📚',name:'Right to Education',        color:'#FF8C42', desc:'Know your rights! An educated consumer is an empowered consumer.',example:'Understanding expiry dates, MRP, and return policies.'},
  ];

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Consumer Rights — Know Your Power!</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      rights.map(function(r,i){
        var isSel=sel===i;
        return '<div onclick="consumerSel('+i+')" style="background:'+r.color+'15;border:2px solid '+r.color+(isSel?'88':'22')+';border-radius:10px;padding:10px;cursor:pointer;transition:all .2s">'+
          '<div style="font-size:20px;margin-bottom:2px">'+r.icon+'</div>'+
          '<div style="font-size:11px;font-weight:800;color:'+r.color+'">'+r.name+'</div>'+
          (isSel?'<div style="font-size:11px;color:var(--text);line-height:1.6;margin-top:6px">'+r.desc+'</div><div style="font-size:10px;color:var(--muted);margin-top:4px;font-style:italic">Example: '+r.example+'</div>':'')+
          '</div>';
      }).join('')+'</div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;color:var(--text);line-height:1.7">'+
      '📞 Consumer Helpline: <b>1800-11-4000</b> · Consumer Protection Act 2019 · File complaint at <b>consumerhelpline.gov.in</b></div>';
  }
  window.consumerSel=function(i){sel=sel===i?null:i;render();};
  render();
};

/* ── 7. SAFETY SIM (safety-sim) ── */
SIM_REGISTRY['safety-sim'] = function(c) {
  var scenario=0;
  var scenarios=[
    {icon:'🔥',title:'Fire Safety', color:'#FF6B6B',
     dos:['Shout "Fire!" and alert everyone','Crawl low under smoke — clean air is near the floor','Feel door before opening — if hot, don\'t open','Take stairs NOT elevator','Meet at designated assembly point'],
     donts:['Never take the lift','Don\'t go back for belongings','Don\'t open windows — feeds oxygen to fire','Don\'t hide in bathroom','Don\'t panic — move calmly'],
     number:'101 (Fire)', tip:'Most fire deaths are from smoke inhalation, not flames!'},
    {icon:'⚡',title:'Electrical Safety', color:'#FFD93D',
     dos:['Switch off before changing bulbs/fuses','Use ISI certified appliances','Keep electrical things away from water','Report sparking sockets immediately','Use proper earthing'],
     donts:['Never touch switches with wet hands','Don\'t overload sockets','Don\'t put metal in electrical outlets','Don\'t pull cables to unplug','Don\'t let children play near wiring'],
     number:'1912 (Electric)', tip:'Electricity can kill at just 0.1 Amperes — always respect it!'},
    {icon:'🌊',title:'Water/Flood Safety', color:'#4D96FF',
     dos:['Move to higher ground immediately','Store drinking water and medicine','Turn off electricity if flooding inside','Follow official evacuation orders','Know your nearest high ground'],
     donts:['Don\'t walk in moving floodwater','Don\'t drive through flooded roads','Don\'t touch fallen power lines','Don\'t drink floodwater','Don\'t return home until cleared'],
     number:'1070 (Disaster)', tip:'12cm of moving water can knock you off your feet. 30cm can sweep away a car!'},
  ];

  function render(){
    var s=scenarios[scenario];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Safety Awareness</div>'+
      '<div class="ctrl-row" style="margin-bottom:8px;flex-wrap:wrap;gap:5px">'+
      scenarios.map(function(sc,i){return '<button onclick="safetySel('+i+')" style="padding:5px 10px;border-radius:9px;font-size:13px;border:1.5px solid '+(i===scenario?sc.color:'var(--border)')+';background:'+(i===scenario?sc.color+'22':'var(--surface2)')+';cursor:pointer">'+sc.icon+' '+sc.title+'</button>';}).join('')+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--evs);margin-bottom:6px">✅ DO</div>'+
      s.dos.map(function(d){return '<div style="font-size:11px;color:var(--text);margin-bottom:4px;line-height:1.5">• '+d+'</div>';}).join('')+
      '</div>'+
      '<div style="background:var(--sci-dim);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--sci);margin-bottom:6px">❌ DON\'T</div>'+
      s.donts.map(function(d){return '<div style="font-size:11px;color:var(--text);margin-bottom:4px;line-height:1.5">• '+d+'</div>';}).join('')+
      '</div></div>'+
      '<div style="display:flex;gap:8px">'+
      '<div style="background:var(--sci-dim);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:8px 12px;flex:1;text-align:center">'+
      '<div style="font-size:10px;color:var(--muted)">Emergency</div>'+
      '<div style="font-size:16px;font-weight:900;color:var(--sci)">📞 '+s.number+'</div>'+
      '</div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:8px 12px;flex:2">'+
      '<div style="font-size:11px;color:var(--text);line-height:1.6">💡 '+s.tip+'</div>'+
      '</div></div>';
  }
  window.safetySel=function(i){scenario=i;render();};
  render();
};

/* ── 8. SDG KERALA (sdg-kerala) ── */
SIM_REGISTRY['sdg-kerala'] = function(c) {
  var sel=null;
  var sdgs=[
    {num:1, icon:'🏠', name:'No Poverty',        color:'#FF6B6B', kerala:'Kerala has the lowest poverty rate in India — 7.1%! Social security nets through PDS and welfare pensions.'},
    {num:3, icon:'🏥', name:'Good Health',        color:'#6BCB77', kerala:'Kerala has the best health indicators in India. Life expectancy 75 years — among the highest in Asia.'},
    {num:4, icon:'📚', name:'Quality Education',  color:'#FF8C42', kerala:'94% literacy rate — highest in India! SSLC pass rate consistently above 98%.'},
    {num:5, icon:'👩', name:'Gender Equality',    color:'#C77DFF', kerala:'Women\'s empowerment through Kudumbashree — 300,000 self-help groups. Kerala model studied worldwide.'},
    {num:13,icon:'🌍', name:'Climate Action',     color:'#4D96FF', kerala:'Rebuild Kerala Initiative after 2018 floods. India\'s first comprehensive Climate Action Plan developed here.'},
    {num:14,icon:'🌊', name:'Life Below Water',   color:'#4D96FF', kerala:'590km coastline. Marine conservation, mangrove restoration in Vembanad, turtle protection programs.'},
    {num:15,icon:'🌳', name:'Life on Land',       color:'#6BCB77', kerala:'Silent Valley National Park saved by people\'s movement in 1980! Western Ghats biodiversity hotspot.'},
  ];

  function render(){
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">SDGs — Kerala\'s Sustainable Development</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      sdgs.map(function(s,i){return '<button onclick="sdgSel('+i+')" style="width:42px;height:42px;border-radius:10px;font-size:18px;border:2px solid '+(sel===i?s.color:'var(--border)')+';background:'+(sel===i?s.color+'22':'var(--surface2)')+';cursor:pointer">'+s.icon+'</button>';}).join('')+
      '</div>'+
      (sel!==null?
        '<div style="background:'+sdgs[sel].color+'15;border:2px solid '+sdgs[sel].color+'44;border-radius:12px;padding:14px;margin-bottom:8px">'+
        '<div style="font-size:14px;font-weight:900;color:'+sdgs[sel].color+';margin-bottom:6px">SDG '+sdgs[sel].num+': '+sdgs[sel].icon+' '+sdgs[sel].name+'</div>'+
        '<div style="font-size:12px;color:var(--text);line-height:1.7">'+sdgs[sel].kerala+'</div>'+
        '</div>'
        :'<div style="background:var(--surface2);border-radius:10px;padding:12px;border:1px solid var(--border);text-align:center;color:var(--muted);font-size:12px">☝️ Tap an SDG to see Kerala\'s achievements</div>')+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">The UN\'s 17 Sustainable Development Goals aim to end poverty and protect the planet by 2030. Kerala\'s "Kerala Model of Development" is studied globally!</div>';
  }
  window.sdgSel=function(i){sel=sel===i?null:i;render();};
  render();
};

/* ── 9. TRADE ROUTES (trade-routes) ── */
SIM_REGISTRY['trade-routes'] = function(c) {
  var route='silk';
  var routes={
    silk:{name:'🐪 Silk Road',   color:'#FFD93D', era:'2nd century BCE – 15th century CE',
      path:'China → Central Asia → Persia → Arabia → Rome',
      goods:'Silk, spices, glassware, paper, gunpowder, disease (unfortunately!)',
      impact:'Connected Eastern and Western civilisations for the first time. Buddhism, Islam, and Christianity all spread along this route.',
      india:'India exported cotton, spices, and gemstones. Received horses and glass.'},
    spice:{name:'🌶️ Spice Route', color:'#FF8C42', era:'Ancient times – 16th century',
      path:'Kerala/Malabar Coast → Arabia → Egypt → Europe',
      goods:'Pepper, cardamom, cinnamon, cloves, turmeric, ginger',
      impact:'So valuable that Columbus sailed west looking for India! Vasco da Gama\'s 1498 arrival changed history. European colonialism began partly to control spices.',
      india:'Kozhikode (Calicut) was one of the most important trading ports in the world!'},
    maritime:{name:'🚢 Maritime Routes', color:'#4D96FF', era:'15th century – present',
      path:'European ports → Cape of Good Hope → Indian Ocean → Asia',
      goods:'All goods, later raw materials and manufactured goods, now everything!',
      impact:'Led to globalisation, colonisation, and eventual independence movements. Today 90% of world trade travels by sea.',
      india:'India\'s position at the centre of the Indian Ocean made it a crucial hub — still true today.'},
  };

  function render(){
    var r=routes[route];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Historic Trade Routes</div>'+
      '<div class="ctrl-row" style="margin-bottom:8px;flex-wrap:wrap;gap:5px">'+
      Object.keys(routes).map(function(k){return '<button onclick="tradeRoute(\''+k+'\')" style="padding:5px 10px;border-radius:9px;font-size:12px;border:1.5px solid '+(k===route?routes[k].color:'var(--border)')+';background:'+(k===route?routes[k].color+'22':'var(--surface2)')+';color:'+(k===route?routes[k].color:'var(--muted)')+';cursor:pointer;font-weight:800">'+routes[k].name+'</button>';}).join('')+
      '</div>'+
      '<div style="background:'+r.color+'15;border:2px solid '+r.color+'44;border-radius:12px;padding:12px;margin-bottom:8px">'+
      '<div style="font-size:14px;font-weight:900;color:'+r.color+';margin-bottom:4px">'+r.name+'</div>'+
      '<div style="font-size:10px;color:var(--muted);margin-bottom:8px">📅 '+r.era+'</div>'+
      [['🗺️ Route',r.path],['📦 Traded',r.goods],['🌍 Impact',r.impact],['🇮🇳 India',r.india]].map(function(row){
        return '<div style="margin-bottom:6px"><div style="font-size:10px;font-weight:800;color:'+r.color+'">'+row[0]+'</div><div style="font-size:12px;color:var(--text);line-height:1.6">'+row[1]+'</div></div>';
      }).join('')+
      '</div>';
  }
  window.tradeRoute=function(k){route=k;render();};
  render();
};

/* ── 10. RIGHTS AND DUTIES (rights-duties) ── */
SIM_REGISTRY['rights-duties'] = function(c) {
  var scenario=0;
  var scenarios=[
    {emoji:'📢',title:'Freedom of Speech',color:'#4D96FF',
     right:'Every citizen has the right to express opinions — speak, write, create.',
     duty:'Use it responsibly. Hate speech, misinformation, and incitement are NOT protected.',
     balance:'Article 19(1)(a) gives freedom of speech. Article 19(2) allows reasonable restrictions.'},
    {emoji:'🗳️',title:'Right to Vote',color:'#6BCB77',
     right:'Every Indian citizen above 18 can vote — choose their government.',
     duty:'Vote thoughtfully, not for money or threats. Inform others of their right.',
     balance:'Voting is called a "right" but also a civic duty. Non-voters give up their voice!'},
    {emoji:'📚',title:'Right to Education',color:'#FFD93D',
     right:'Free and compulsory education for all children aged 6-14 (RTE Act 2009).',
     duty:'Actually attend school! Respect teachers. Help others access education.',
     balance:'Article 21A gives the right. Article 51A(k) makes it parents\' duty to provide opportunities.'},
    {emoji:'🌿',title:'Environmental Rights',color:'#6BCB77',
     right:'Right to a clean and healthy environment — courts have ruled this under Article 21.',
     duty:'Don\'t litter. Reduce plastic. Plant trees. Report pollution to authorities.',
     balance:'The "Polluter Pays" principle — those who damage environment must compensate.'},
  ];

  function render(){
    var s=scenarios[scenario];
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Rights & Duties — Two Sides of the Coin</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:8px">'+
      scenarios.map(function(sc,i){return '<button onclick="rdSel('+i+')" style="padding:5px 9px;border-radius:9px;font-size:13px;border:1.5px solid '+(i===scenario?sc.color:'var(--border)')+';background:'+(i===scenario?sc.color+'22':'var(--surface2)')+';cursor:pointer">'+sc.emoji+'</button>';}).join('')+
      '</div>'+
      '<div style="text-align:center;font-size:32px;margin-bottom:4px">'+s.emoji+'</div>'+
      '<div style="text-align:center;font-size:14px;font-weight:900;color:'+s.color+';margin-bottom:10px">'+s.title+'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
      '<div style="background:var(--evs-dim);border:1px solid rgba(107,203,119,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--evs);margin-bottom:6px">✅ Your RIGHT</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+s.right+'</div>'+
      '</div>'+
      '<div style="background:var(--life-dim);border:1px solid rgba(77,150,255,.3);border-radius:10px;padding:10px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--life);margin-bottom:6px">🤝 Your DUTY</div>'+
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+s.duty+'</div>'+
      '</div></div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:10px;font-size:12px;color:var(--text);line-height:1.7">⚖️ Balance: '+s.balance+'</div>';
  }
  window.rdSel=function(i){scenario=i;render();};
  render();
};

/* ── 11-42: Remaining 32 simulations using enhanced default renderer ── */
/* These simIds will use the animated step-by-step virtual experience */
['active-listen','air-monitor','apology-sim','bayes-prob','biodiversity-survey',
 'bone-joints','boundaries-sim','business-plan','career-explore','census-data',
 'chores-sim','community-action','conflict-resolve','coop-economy','debate-sim',
 'election-sim','fact-check','globalisation','independence-views','kerala-economy',
 'leadership-sim','local-map','negotiation','news-history','party-budget',
 'plantation-history','polynomial-tiles','public-speaking','resource-map',
 'responsibility-chart','turn-taking','weather-diary'
].forEach(function(id) {
  if (!SIM_REGISTRY[id]) {
    SIM_REGISTRY[id] = null; /* Will use rich default */
  }
});


/* ══════════════════════════════════════
   FINAL BATCH — 32 Life Skills & Social Science sims
   ══════════════════════════════════════ */

/* ── 1. ACTIVE LISTENING (active-listen) ── */
SIM_REGISTRY['active-listen'] = function(c) {
  var step = 0;
  var scenarios = [
    { speaker:'👩‍🏫 Teacher', says:'"Please remember to submit your project by Friday. It should include a cover page, three sections, and a bibliography."', cues:['Make eye contact','Nod to show understanding','Don\'t interrupt','Take notes'], question:'What does the project need?', options:['Cover page, 3 sections, bibliography','Just a cover page','Only 3 sections','No specific requirements'], answer:0 },
    { speaker:'👦 Friend', says:'"I\'m really upset — I studied hard for the test but still failed. I don\'t know what I\'m doing wrong."', cues:['Show empathy first','Ask open questions','Don\'t give advice immediately','Reflect their feelings'], question:'What\'s the best first response?', options:['"You should study more."','"That sounds really frustrating. What happened?"','"I got 90%, want my notes?"','"Don\'t worry about it."'], answer:1 },
    { speaker:'🧑‍💼 Elder', says:'"In my time, we walked 5 km to school every day. Children today don\'t appreciate what they have."', cues:['Respect the speaker','Listen without judging','Ask respectful questions','Acknowledge their experience'], question:'Which response shows active listening?', options:['"That\'s not relevant today."','"Times have changed so everything is easier."','"That must have been challenging. What was school like then?"','"OK boomer."'], answer:2 },
  ];
  var selected = null, answered = false;

  function render() {
    var sc = scenarios[step];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Active Listening Skills</div>' +
      /* Speaker bubble */
      '<div style="background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1px solid var(--border)">' +
      '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:6px">' + sc.speaker + ' says:</div>' +
      '<div style="font-size:13px;color:var(--text);line-height:1.7;font-style:italic">' + sc.says + '</div>' +
      '</div>' +
      /* Listening cues */
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">' +
      sc.cues.map(function(cue) { return '<span style="background:var(--life-dim);color:var(--life);padding:3px 9px;border-radius:10px;font-size:11px;font-weight:700">✓ ' + cue + '</span>'; }).join('') +
      '</div>' +
      /* Question */
      '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:8px">' + sc.question + '</div>' +
      /* Options */
      '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">' +
      sc.options.map(function(opt, i) {
        var bg = !answered ? 'var(--surface2)' : i === sc.answer ? 'var(--evs-dim)' : selected === i ? 'var(--sci-dim)' : 'var(--surface2)';
        var border = !answered ? 'var(--border)' : i === sc.answer ? 'var(--evs)' : selected === i ? 'var(--sci)' : 'var(--border)';
        return '<button onclick="alsOpt(' + i + ')" style="text-align:left;padding:10px 12px;border-radius:10px;border:1.5px solid ' + border + ';background:' + bg + ';color:var(--text);font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;transition:all .2s">' +
          (answered && i === sc.answer ? '✅ ' : answered && selected === i && i !== sc.answer ? '❌ ' : '') + opt + '</button>';
      }).join('') + '</div>' +
      /* Navigation */
      '<div class="ctrl-row">' +
      (step > 0 ? '<button class="cbtn" onclick="alsStep(-1)">← Prev</button>' : '<div></div>') +
      '<span style="font-size:11px;color:var(--muted)">' + (step+1) + '/' + scenarios.length + '</span>' +
      (step < scenarios.length-1 ? '<button class="cbtn" onclick="alsStep(1)" style="background:var(--life);color:white;border-color:var(--life)">Next →</button>' :
       '<button class="cbtn" onclick="alsStep(-'+step+')" style="background:var(--acc);color:white;border-color:var(--acc)">↺ Restart</button>') +
      '</div>';
  }

  window.alsOpt = function(i) { if(answered) return; selected=i; answered=true; render(); };
  window.alsStep = function(d) { step=Math.max(0,Math.min(scenarios.length-1,step+d)); selected=null; answered=false; render(); };
  render();
};

/* ── 2. PUBLIC SPEAKING (public-speaking) ── */
SIM_REGISTRY['public-speaking'] = function(c) {
  var stage = 0;
  var tips = [
    { phase:'📝 Prepare', color:'#4D96FF', icon:'📚',
      points:['Know your topic deeply — confidence comes from knowledge','Structure: Opening hook → 3 main points → Strong conclusion','Practice aloud at least 3 times','Time yourself — 1 minute per slide is a good rule'],
      activity:'Write your first sentence here:',
      prompt:'Start with a question, a surprising fact, or a story — NOT "Hello, my name is..."' },
    { phase:'🧘 Manage Nervousness', color:'#6BCB77', icon:'💪',
      points:['Nervousness = excitement! Same feeling, different label','Take 3 slow deep breaths before starting','Look at friendly faces in the audience','Remember: audience wants you to succeed'],
      activity:'Try this breathing exercise:',
      prompt:'Breathe IN for 4 counts → Hold 4 → OUT for 6 counts → Repeat 3 times' },
    { phase:'🗣️ Deliver', color:'#FFD93D', icon:'🎤',
      points:['Speak slower than you think you need to','Project your voice — speak to the back row','Pause after key points — silence = emphasis','Use gestures naturally — hands out of pockets!'],
      activity:'Rate yourself:',
      prompt:'Eye contact 👁️ · Volume 🔊 · Pace ⏱️ · Enthusiasm ⚡ — which needs work?' },
    { phase:'✅ Reflect & Improve', color:'#C77DFF', icon:'🌱',
      points:['Every speech makes you better — professionals still practice','Record yourself to spot habits (um, uh, like)','Ask one person for one specific piece of feedback','Great speakers were once terrible speakers!'],
      activity:'Famous speaker fact:',
      prompt:'Winston Churchill, Mahatma Gandhi, and Warren Buffett all had severe fear of public speaking. They practiced obsessively.' },
  ];

  function render() {
    var t = tips[stage];
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Public Speaking Skills</div>' +
      /* Phase tabs */
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;justify-content:center">' +
      tips.map(function(tp, i) {
        return '<button onclick="psStage('+i+')" style="padding:5px 10px;border-radius:9px;font-size:11px;font-weight:800;border:1.5px solid '+(i===stage?tp.color:'var(--border)')+';background:'+(i===stage?tp.color+'22':'var(--surface2)')+';color:'+(i===stage?tp.color:'var(--muted)')+';cursor:pointer">' + tp.phase + '</button>';
      }).join('') + '</div>' +
      /* Content */
      '<div style="background:'+t.color+'15;border:1.5px solid '+t.color+'44;border-radius:12px;padding:14px;margin-bottom:8px">' +
      '<div style="font-size:32px;margin-bottom:6px">' + t.icon + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      t.points.map(function(p) { return '<div style="font-size:12px;color:var(--text);line-height:1.6;display:flex;gap:8px"><span style="color:'+t.color+';flex-shrink:0">▶</span>' + p + '</div>'; }).join('') +
      '</div></div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;border:1px solid var(--border)">' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:4px">' + t.activity + '</div>' +
      '<div style="font-size:12px;color:'+t.color+';line-height:1.7;font-style:italic">' + t.prompt + '</div>' +
      '</div>';
  }

  window.psStage = function(i) { stage=i; render(); };
  render();
};

/* ── 3. GOAL SETTING (goal-setting) ── */
SIM_REGISTRY['goal-setting'] = function(c) {
  var goalText = '', whyText = '', steps = ['','',''], deadline = '1 month', selected = null;

  function render() {
    var isSMART = goalText.length > 10 && whyText.length > 5 && steps.filter(function(s){return s.length>3;}).length >= 2;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">SMART Goal Builder</div>' +
      /* SMART breakdown */
      '<div style="display:flex;gap:4px;margin-bottom:10px;justify-content:center">' +
      [['S','Specific','#FF6B6B'],['M','Measurable','#FFD93D'],['A','Achievable','#6BCB77'],['R','Relevant','#4D96FF'],['T','Time-bound','#C77DFF']].map(function(sm) {
        return '<div style="text-align:center;background:'+sm[2]+'22;border:1px solid '+sm[2]+'44;border-radius:8px;padding:4px 8px;min-width:44px">' +
          '<div style="font-size:16px;font-weight:900;color:'+sm[2]+'">'+sm[0]+'</div>' +
          '<div style="font-size:8px;color:'+sm[2]+';opacity:.8">'+sm[1]+'</div>' +
          '</div>';
      }).join('') + '</div>' +
      /* Goal input */
      '<div style="margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:800;color:var(--muted);display:block;margin-bottom:4px">🎯 My specific goal:</label>' +
      '<input type="text" placeholder="e.g. Score above 80% in Maths by March" value="'+goalText+'" oninput="gsGoal(this.value)" ' +
      'style="width:100%;background:var(--surface);border:1.5px solid '+(goalText.length>10?'var(--evs)':'var(--border)')+';border-radius:8px;padding:8px;color:var(--text);font-size:12px;box-sizing:border-box">' +
      '</div>' +
      '<div style="margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:800;color:var(--muted);display:block;margin-bottom:4px">💡 Why this matters to me:</label>' +
      '<input type="text" placeholder="e.g. I want to qualify for science olympiad" value="'+whyText+'" oninput="gsWhy(this.value)" ' +
      'style="width:100%;background:var(--surface);border:1.5px solid '+(whyText.length>5?'var(--evs)':'var(--border)')+';border-radius:8px;padding:8px;color:var(--text);font-size:12px;box-sizing:border-box">' +
      '</div>' +
      /* Steps */
      '<div style="margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:800;color:var(--muted);display:block;margin-bottom:4px">📋 3 action steps:</label>' +
      steps.map(function(s,i) {
        return '<input type="text" placeholder="Step '+(i+1)+'..." value="'+s+'" oninput="gsStep('+i+',this.value)" ' +
          'style="width:100%;background:var(--surface);border:1.5px solid '+(s.length>3?'var(--evs)':'var(--border)')+';border-radius:8px;padding:7px;color:var(--text);font-size:12px;box-sizing:border-box;margin-bottom:4px">';
      }).join('') +
      '</div>' +
      /* Deadline */
      '<div class="ctrl-row" style="margin-bottom:10px">' +
      '<span style="font-size:11px;color:var(--muted)">⏱️ Deadline:</span>' +
      ['1 week','1 month','3 months','6 months'].map(function(d) {
        return '<button onclick="gsDead(\''+d+'\')" style="padding:4px 8px;border-radius:8px;font-size:11px;border:1.5px solid '+(d===deadline?'var(--acc)':'var(--border)')+';background:'+(d===deadline?'var(--acc-dim)':'var(--surface2)')+';color:'+(d===deadline?'var(--acc)':'var(--muted)')+';cursor:pointer">'+d+'</button>';
      }).join('') +
      '</div>' +
      /* Result */
      '<div style="background:'+(isSMART?'var(--evs-dim)':'var(--surface2)')+';border:1.5px solid '+(isSMART?'var(--evs)':'var(--border)')+';border-radius:12px;padding:12px;text-align:center">' +
      (isSMART
        ? '<div style="font-size:16px;font-weight:900;color:var(--evs)">🌟 SMART Goal Complete!</div><div style="font-size:11px;color:var(--muted);margin-top:4px">Write it somewhere visible. Review weekly. You\'ve got this!</div>'
        : '<div style="font-size:12px;color:var(--muted)">Fill in all fields to complete your SMART goal 👆</div>') +
      '</div>';
  }

  window.gsGoal = function(v) { goalText=v; render(); };
  window.gsWhy = function(v) { whyText=v; render(); };
  window.gsStep = function(i,v) { steps[i]=v; render(); };
  window.gsDead = function(d) { deadline=d; render(); };
  render();
};

/* ── 4. FEELINGS WHEEL (feelings-wheel) ── */
SIM_REGISTRY['feelings-wheel'] = function(c) {
  var selected = null;
  var feelings = {
    happy:   { emoji:'😊', color:'#FFD93D', subs:['Joyful','Excited','Grateful','Content','Proud','Hopeful'] },
    sad:     { emoji:'😢', color:'#4D96FF', subs:['Lonely','Disappointed','Hopeless','Grief','Regret','Hurt'] },
    angry:   { emoji:'😠', color:'#FF6B6B', subs:['Frustrated','Irritated','Betrayed','Jealous','Bitter','Furious'] },
    scared:  { emoji:'😨', color:'#C77DFF', subs:['Anxious','Worried','Insecure','Overwhelmed','Helpless','Nervous'] },
    surprised:{ emoji:'😲',color:'#FF8C42', subs:['Shocked','Amazed','Confused','Startled','Awed','Speechless'] },
    disgusted:{ emoji:'🤢',color:'#6BCB77', subs:['Disapproving','Judgemental','Repelled','Awful','Nauseated','Horrified'] },
  };

  function render() {
    var sel = selected ? feelings[selected] : null;
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Feelings Wheel — Name Your Emotions</div>' +
      /* Primary emotions */
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">' +
      Object.keys(feelings).map(function(key) {
        var f = feelings[key];
        return '<button onclick="feelSel(\''+key+'\')" style="padding:10px 6px;border-radius:12px;border:2px solid '+(key===selected?f.color:'var(--border)')+';background:'+(key===selected?f.color+'22':'var(--surface2)')+';cursor:pointer;transition:all .2s">' +
          '<div style="font-size:24px">' + f.emoji + '</div>' +
          '<div style="font-size:11px;font-weight:800;color:'+(key===selected?f.color:'var(--muted)')+';margin-top:4px;text-transform:capitalize">' + key + '</div>' +
          '</button>';
      }).join('') + '</div>' +
      /* Sub-emotions */
      (sel ?
        '<div style="background:'+sel.color+'15;border:1.5px solid '+sel.color+'44;border-radius:12px;padding:12px">' +
        '<div style="font-size:13px;font-weight:800;color:'+sel.color+';margin-bottom:8px">More specific feelings:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        sel.subs.map(function(s) { return '<span style="background:'+sel.color+'22;color:'+sel.color+';padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700">' + s + '</span>'; }).join('') +
        '</div>' +
        '<div style="margin-top:10px;font-size:11px;color:var(--muted);line-height:1.7">💡 Naming emotions precisely helps you understand them and respond better. Instead of "I feel bad", try "I feel <b style="color:'+sel.color+'">' + sel.subs[0] + '</b>"</div>' +
        '</div>'
        : '<div style="text-align:center;color:var(--muted);font-size:12px;padding:10px">Tap a primary emotion above to explore it ☝️</div>') +
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7">All feelings are valid. The more words you have for emotions, the better you can express, understand and manage them.</div>';
  }

  window.feelSel = function(key) { selected = selected===key?null:key; render(); };
  render();
};

/* ── 5. STRESS TOOLS (stress-tools) ── */
SIM_REGISTRY['stress-tools'] = function(c) {
  var tool = 'breathing';
  var raf2, t2=0, phase='inhale', phaseT=0, running=false;

  var tools = {
    breathing: { name:'🫁 Box Breathing', color:'#4D96FF', desc:'Used by Navy SEALs to calm the nervous system in 2 minutes.' },
    grounding: { name:'🌿 5-4-3-2-1 Grounding', color:'#6BCB77', desc:'Anchors you to the present moment — breaks anxiety cycles.' },
    reframing: { name:'💭 Thought Reframing', color:'#C77DFF', desc:'Changes how you interpret a stressful situation.' },
  };

  function drawBreathing(ctx, W, H) {
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);
    var cx=W/2,cy=H/2;
    var phases=['inhale','hold1','exhale','hold2'];
    var durations=[4,4,4,4];
    if(!running){
      ctx.fillStyle='rgba(77,150,255,.3)'; ctx.beginPath(); ctx.arc(cx,cy,60,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='bold 12px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('Press Start',cx,cy+4); return;
    }
    phaseT+=0.03;
    var dur=durations[phases.indexOf(phase)];
    if(phaseT>=dur){phaseT=0;phase=phases[(phases.indexOf(phase)+1)%4];}
    var prog=phaseT/dur;
    var r=phase==='inhale'?30+prog*40:phase==='exhale'?70-prog*40:phase==='hold1'?70:30;
    /* Pulse ring */
    ctx.beginPath(); ctx.arc(cx,cy,r+15,0,Math.PI*2);
    ctx.strokeStyle='rgba(77,150,255,0.15)'; ctx.lineWidth=20; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle='rgba(77,150,255,0.3)'; ctx.fill();
    ctx.strokeStyle='#4D96FF'; ctx.lineWidth=3; ctx.stroke();
    /* Progress arc */
    ctx.beginPath(); ctx.arc(cx,cy,r+8,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);
    ctx.strokeStyle='#4D96FF'; ctx.lineWidth=3; ctx.stroke();
    /* Text */
    ctx.fillStyle='white'; ctx.font='bold 14px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(phase==='inhale'?'INHALE':phase==='exhale'?'EXHALE':'HOLD',cx,cy-8);
    ctx.font='12px Nunito,sans-serif'; ctx.fillStyle='rgba(255,255,255,.6)';
    ctx.fillText(Math.ceil(dur-phaseT)+'s',cx,cy+12);
    /* Labels around */
    ctx.font='9px Nunito,sans-serif'; ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.fillText('4 seconds each',cx,H-10);
  }

  function drawAnim() {
    var _g=getCtx('stressCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    if(!cv||tool!=='breathing') return;
    drawBreathing(cv.getContext('2d'), W, H);
    raf2=requestAnimationFrame(drawAnim);
  }

  function render() {
    var t=tools[tool];
    var content='';

    if(tool==='breathing'){
      content='<canvas id="stressCanvas" width="240" height="180" style="border-radius:12px;display:block;margin:0 auto"></canvas>'+
        '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" onclick="stressStart()" id="breathBtn" style="background:var(--life);color:white;border-color:var(--life)">▶ Start</button></div>';
    } else if(tool==='grounding'){
      var senses=[
        {n:5,sense:'SEE 👁️',color:'#FF6B6B',examples:'desk, window, clock, poster, plant'},
        {n:4,sense:'TOUCH 🤚',color:'#FFD93D',examples:'floor, chair, shirt, pen, wall'},
        {n:3,sense:'HEAR 👂',color:'#6BCB77',examples:'fan, voices, birds, traffic, music'},
        {n:2,sense:'SMELL 👃',color:'#4D96FF',examples:'air, food, books, soap, rain'},
        {n:1,sense:'TASTE 👅',color:'#C77DFF',examples:'water, gum, last meal, toothpaste'},
      ];
      content='<div style="display:flex;flex-direction:column;gap:6px">'+
        senses.map(function(s){
          return '<div style="background:'+s.color+'15;border:1px solid '+s.color+'33;border-radius:10px;padding:9px 12px;display:flex;gap:10px;align-items:center">'+
            '<div style="font-size:22px;font-weight:900;color:'+s.color+';min-width:26px">'+s.n+'</div>'+
            '<div><div style="font-size:12px;font-weight:800;color:'+s.color+'">Things you can '+s.sense+'</div>'+
            '<div style="font-size:11px;color:var(--muted)">e.g. '+s.examples+'</div></div>'+
            '</div>';
        }).join('') + '</div>';
    } else {
      var examples=[
        {neg:'"I failed the test. I\'m stupid."',pos:'"I struggled this time. What can I learn from this?"'},
        {neg:'"Nobody likes me."',pos:'"I haven\'t found my close friend group yet. That takes time."'},
        {neg:'"Everything is going wrong."',pos:'"This specific situation is hard right now. It will pass."'},
      ];
      content='<div style="display:flex;flex-direction:column;gap:8px">'+
        examples.map(function(ex){
          return '<div style="display:flex;gap:6px;align-items:stretch">'+
            '<div style="background:var(--sci-dim);border:1px solid var(--sci)44;border-radius:10px;padding:9px 12px;flex:1;font-size:12px;color:var(--sci);line-height:1.6">❌ '+ex.neg+'</div>'+
            '<div style="display:flex;align-items:center;color:var(--muted);font-size:18px">→</div>'+
            '<div style="background:var(--evs-dim);border:1px solid var(--evs)44;border-radius:10px;padding:9px 12px;flex:1;font-size:12px;color:var(--evs);line-height:1.6">✅ '+ex.pos+'</div>'+
            '</div>';
        }).join('')+'</div>';
    }

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Stress Management Toolkit</div>'+
      '<div class="ctrl-row" style="margin-bottom:8px">'+
      Object.keys(tools).map(function(k){
        return '<button onclick="stressTool(\''+k+'\')" style="padding:5px 9px;border-radius:9px;font-size:11px;font-weight:800;border:1.5px solid '+(k===tool?tools[k].color:'var(--border)')+';background:'+(k===tool?tools[k].color+'22':'var(--surface2)')+';color:'+(k===tool?tools[k].color:'var(--muted)')+';cursor:pointer">'+tools[k].name+'</button>';
      }).join('')+'</div>'+
      '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-align:center;font-style:italic">'+t.desc+'</div>'+
      content;

    if(tool==='breathing'){ cancelAnimationFrame(raf2); drawAnim(); }
  }

  window.stressTool=function(k){cancelAnimationFrame(raf2);running=false;tool=k;phaseT=0;phase='inhale';render();};
  window.stressStart=function(){
    running=!running;
    document.getElementById('breathBtn').textContent=running?'⏸ Pause':'▶ Start';
    if(running) drawAnim();
  };
  window.simCleanup=function(){cancelAnimationFrame(raf2);running=false;};
  render();
};

/* ── 6. ELECTION SIM (election-sim) ── */
SIM_REGISTRY['election-sim'] = function(c) {
  var parties=[
    {name:'Party A',color:'#FF6B6B',emoji:'🔴',policy:'Free school meals, more parks, cleaner rivers',votes:0},
    {name:'Party B',color:'#4D96FF',emoji:'🔵',policy:'Better roads, lower taxes, new hospital',votes:0},
    {name:'Party C',color:'#6BCB77',emoji:'🟢',policy:'Plant 1000 trees, solar panels on schools, cycle paths',votes:0},
    {name:'Party D',color:'#FFD93D',emoji:'🟡',policy:'Free sports facilities, digital library, student council',votes:0},
  ];
  var totalVoters=50, voted=0, phase='campaign';

  function render() {
    var totalVotes=parties.reduce(function(a,b){return a+b.votes;},0);
    var winner=phase==='results'?parties.reduce(function(a,b){return b.votes>a.votes?b:a;}):null;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">School Election Simulator</div>'+
      (phase==='campaign'?
        '<div style="margin-bottom:10px">' +
        parties.map(function(p){
          return '<div style="background:'+p.color+'15;border:1.5px solid '+p.color+'33;border-radius:12px;padding:10px 12px;margin-bottom:6px">'+
            '<div style="font-size:14px;font-weight:900;color:'+p.color+'">'+p.emoji+' '+p.name+'</div>'+
            '<div style="font-size:12px;color:var(--text);line-height:1.7;margin-top:3px">📋 '+p.policy+'</div>'+
            '</div>';
        }).join('')+
        '</div>'+
        '<div class="ctrl-row">'+
        '<button class="cbtn" onclick="electionStart()" style="background:var(--acc);color:white;border-color:var(--acc)">🗳️ Start Voting!</button>'+
        '</div>'
        :phase==='voting'?
        '<div style="text-align:center;margin-bottom:10px">' +
        '<div style="font-size:16px;font-weight:800;color:var(--text)">Cast your vote!</div>' +
        '<div style="font-size:12px;color:var(--muted)">' + voted + ' of ' + totalVoters + ' votes cast</div>' +
        '<div style="height:6px;background:var(--surface2);border-radius:3px;margin:8px 0"><div style="height:6px;background:var(--acc);border-radius:3px;width:'+(voted/totalVoters*100)+'%"></div></div>' +
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">'+
        parties.map(function(p){
          return '<button onclick="electionVote(\''+p.name+'\')" style="padding:10px 14px;border-radius:12px;border:2px solid '+p.color+';background:'+p.color+'15;display:flex;align-items:center;gap:10px;cursor:pointer;font-family:Nunito,sans-serif;transition:all .2s">'+
            '<span style="font-size:24px">'+p.emoji+'</span>'+
            '<div style="text-align:left"><div style="font-size:13px;font-weight:800;color:'+p.color+'">'+p.name+'</div>'+
            '<div style="font-size:11px;color:var(--muted)">'+p.votes+' votes so far</div></div>'+
            '</button>';
        }).join('')+
        '</div>'+
        (voted>=totalVoters?'<button class="cbtn" onclick="electionResults()" style="background:var(--evs);color:white;border-color:var(--evs);width:100%">📊 See Results!</button>':'')
        :
        /* Results */
        '<div style="text-align:center;margin-bottom:10px">' +
        '<div style="font-size:20px">🏆</div>' +
        '<div style="font-size:18px;font-weight:900;color:'+winner.color+'">'+winner.emoji+' '+winner.name+' Wins!</div>' +
        '<div style="font-size:12px;color:var(--muted)">with '+winner.votes+' votes ('+(winner.votes/totalVoters*100).toFixed(1)+'%)</div>' +
        '</div>'+
        '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px">'+
        parties.slice().sort(function(a,b){return b.votes-a.votes;}).map(function(p,i){
          return '<div style="display:flex;align-items:center;gap:8px">'+
            '<span style="font-size:14px;min-width:20px">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':'4️⃣')+'</span>'+
            '<div style="flex:1;height:22px;background:var(--surface2);border-radius:6px;overflow:hidden">'+
            '<div style="height:22px;background:'+p.color+';width:'+(p.votes/winner.votes*100)+'%;border-radius:6px;display:flex;align-items:center;padding-left:8px">'+
            '<span style="font-size:11px;font-weight:800;color:white">'+p.name+' — '+p.votes+'</span>'+
            '</div></div></div>';
        }).join('')+
        '</div>'+
        '<button class="cbtn" onclick="electionReset()" style="width:100%">↺ New Election</button>'
      );
  }

  window.electionStart=function(){phase='voting';render();};
  window.electionVote=function(name){
    if(voted>=totalVoters) return;
    var p=parties.find(function(p){return p.name===name;});
    if(p){p.votes++;voted++;}
    render();
  };
  window.electionResults=function(){phase='results';render();};
  window.electionReset=function(){parties.forEach(function(p){p.votes=0;});voted=0;phase='campaign';render();};
  render();
};

/* ── 7. MINDSET FLIP (mindset-flip) ── */
SIM_REGISTRY['mindset-flip'] = function(c) {
  var flipped={};
  var mindsets=[
    {fixed:'"I\'m not good at maths."',growth:'"I\'m not good at maths yet — but I can improve with practice."',tip:'The word YET is powerful. It changes a dead end into a path forward.'},
    {fixed:'"This is too hard. I give up."',growth:'"This is hard. That means I\'m learning something new. Let me try a different approach."',tip:'Struggle = growth. Easy tasks teach you nothing new.'},
    {fixed:'"I failed. I\'m a failure."',growth:'"I failed at this attempt. What can I learn from it?"',tip:'Failure is feedback, not identity. Every expert has failed more than beginners.'},
    {fixed:'"They\'re smarter than me."',growth:'"They\'ve practised more than me. I can too."',tip:'Intelligence isn\'t fixed at birth. Neural pathways grow stronger with use.'},
    {fixed:'"I can\'t do anything right."',growth:'"I haven\'t mastered this specific skill yet."',tip:'Be specific about what you can\'t do. General statements are almost never true.'},
  ];

  function render() {
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Growth vs Fixed Mindset</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:8px">' +
      '<div style="flex:1;text-align:center;background:var(--sci-dim);border-radius:8px;padding:6px;font-size:11px;font-weight:800;color:var(--sci)">❌ Fixed Mindset</div>'+
      '<div style="flex:1;text-align:center;background:var(--evs-dim);border-radius:8px;padding:6px;font-size:11px;font-weight:800;color:var(--evs)">✅ Growth Mindset</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px">'+
      mindsets.map(function(m,i){
        var isFlipped=flipped[i];
        return '<div style="background:var(--surface2);border-radius:12px;border:1px solid var(--border);overflow:hidden">'+
          '<div style="padding:10px 12px;background:'+(isFlipped?'var(--evs-dim)':'var(--sci-dim)')+';border-bottom:1px solid var(--border)">'+
          '<div style="font-size:12px;color:'+(isFlipped?'var(--evs)':'var(--sci)')+';font-weight:700;line-height:1.6">'+(isFlipped?'✅ '+m.growth:'❌ '+m.fixed)+'</div>'+
          '</div>'+
          (isFlipped?'<div style="padding:8px 12px;font-size:11px;color:var(--muted);line-height:1.6">💡 '+m.tip+'</div>':'')+
          '<button onclick="mindFlip('+i+')" style="width:100%;padding:7px;border:none;background:transparent;cursor:pointer;color:'+(isFlipped?'var(--evs)':'var(--sci)')+';font-size:11px;font-weight:800;font-family:Nunito,sans-serif">'+
          (isFlipped?'← Show fixed mindset':'🔄 Flip to growth mindset')+
          '</button></div>';
      }).join('')+
      '</div>';
  }

  window.mindFlip=function(i){flipped[i]=!flipped[i];render();};
  render();
};

/* ── 8. PROFIT AND LOSS (profit-loss) ── */
SIM_REGISTRY['profit-loss'] = function(c) {
  var cp=80, sp=100;

  function render() {
    var diff=sp-cp;
    var profit=diff>0;
    var pct=Math.abs(diff/cp*100);
    var color=profit?'var(--evs)':diff<0?'var(--sci)':'var(--muted)';

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Profit & Loss Calculator</div>'+
      /* Visual bar */
      '<div style="margin-bottom:14px">' +
      '<div style="display:flex;height:50px;border-radius:10px;overflow:hidden;border:1px solid var(--border)">' +
      '<div style="flex:'+cp+';background:var(--sci-dim);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--sci)">CP: ₹'+cp+'</div>'+
      (diff>0?'<div style="flex:'+diff+';background:var(--evs-dim);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--evs)">+₹'+diff+'</div>':'')+'</div>'+
      (diff<0?'<div style="height:10px;width:'+(Math.abs(diff)/sp*100)+'%;background:var(--sci);border-radius:0 0 6px 6px;margin-left:'+(cp/sp*100)+'%"></div>':'')+
      '</div>'+
      /* Summary cards */
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">'+
      [
        {label:'Cost Price',val:'₹'+cp,color:'var(--sci)'},
        {label:'Selling Price',val:'₹'+sp,color:'var(--math)'},
        {label:profit?'Profit':diff<0?'Loss':'No P/L',val:(profit?'+':'')+'₹'+Math.abs(diff),color:color},
      ].map(function(card){
        return '<div style="background:'+card.color+22+';border:1px solid '+card.color+44+';border-radius:10px;padding:10px;text-align:center">'+
          '<div style="font-size:10px;color:var(--muted)">'+card.label+'</div>'+
          '<div style="font-size:20px;font-weight:900;color:'+card.color+'">'+card.val+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      /* Percentage */
      '<div style="background:'+color+22+';border:1.5px solid '+color+44+';border-radius:12px;padding:12px;text-align:center;margin-bottom:12px">'+
      '<div style="font-size:24px;font-weight:900;color:'+color+'">'+(profit?'📈 Profit':diff<0?'📉 Loss':'⚖️ Break Even')+': '+pct.toFixed(1)+'%</div>'+
      '<div style="font-size:12px;color:var(--muted);margin-top:4px">'+
      (profit?'Profit % = ('+diff+'/'+cp+') × 100 = '+pct.toFixed(1)+'%':'Loss % = ('+Math.abs(diff)+'/'+cp+') × 100 = '+pct.toFixed(1)+'%')+
      '</div></div>'+
      /* Sliders */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px">'+
      '<span style="font-size:11px;color:var(--sci)">Cost Price: <b>₹'+cp+'</b></span>'+
      '<input type="range" class="slide" min="10" max="500" step="5" value="'+cp+'" oninput="plCP(this.value)" style="width:120px">'+
      '<span style="font-size:11px;color:var(--math)">Selling Price: <b>₹'+sp+'</b></span>'+
      '<input type="range" class="slide" min="10" max="500" step="5" value="'+sp+'" oninput="plSP(this.value)" style="width:120px">'+
      '</div>';
  }

  window.plCP=function(v){cp=parseInt(v);render();};
  window.plSP=function(v){sp=parseInt(v);render();};
  render();
};

/* ── 9. RATIO COOKING (ratio-cooking) ── */
SIM_REGISTRY['ratio-cooking'] = function(c) {
  var recipe={name:'Dal Rice',base:2,unit:'cups',ratio:[{ing:'Rice',amount:1},{ing:'Dal',amount:0.5},{ing:'Water',amount:2.5},{ing:'Salt',amount:0.5}]};
  var servings=2;
  var recipes=[
    {name:'🍚 Dal Rice',base:2,unit:'cups/tsp',ratio:[{ing:'Rice',amount:1,unit:'cup'},{ing:'Dal',amount:0.5,unit:'cup'},{ing:'Water',amount:2.5,unit:'cups'},{ing:'Salt',amount:0.5,unit:'tsp'}]},
    {name:'🍋 Lemonade',base:1,unit:'glass',ratio:[{ing:'Lemon juice',amount:30,unit:'ml'},{ing:'Water',amount:200,unit:'ml'},{ing:'Sugar',amount:15,unit:'g'},{ing:'Ice',amount:3,unit:'cubes'}]},
    {name:'🥞 Pancakes',base:4,unit:'pancakes',ratio:[{ing:'Flour',amount:100,unit:'g'},{ing:'Milk',amount:150,unit:'ml'},{ing:'Egg',amount:1,unit:''},{ing:'Butter',amount:10,unit:'g'}]},
  ];
  var sel=0;

  function render() {
    var r=recipes[sel];
    var mult=servings/r.base;
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Ratio & Proportion — Cooking</div>'+
      /* Recipe selector */
      '<div class="ctrl-row" style="margin-bottom:10px">'+
      recipes.map(function(rc,i){
        return '<button onclick="rcSel('+i+')" style="padding:5px 9px;border-radius:9px;font-size:12px;font-weight:800;border:1.5px solid '+(i===sel?'var(--math)':'var(--border)')+';background:'+(i===sel?'var(--math-dim)':'var(--surface2)')+';color:'+(i===sel?'var(--math)':'var(--muted)')+';cursor:pointer">'+rc.name+'</button>';
      }).join('')+'</div>'+
      /* Servings */
      '<div class="ctrl-row" style="margin-bottom:10px">'+
      '<span style="font-size:13px;color:var(--text)">Servings:</span>'+
      [1,2,4,6,8,10].map(function(n){
        return '<button onclick="rcServ('+n+')" style="padding:5px 10px;border-radius:8px;font-size:13px;font-weight:800;border:1.5px solid '+(n===servings?'var(--acc)':'var(--border)')+';background:'+(n===servings?'var(--acc-dim)':'var(--surface2)')+';color:'+(n===servings?'var(--acc)':'var(--muted)')+';cursor:pointer">'+n+'</button>';
      }).join('')+'</div>'+
      /* Ingredients */
      '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">'+
      r.ratio.map(function(ing){
        var amount=ing.amount*mult;
        var display=Number.isInteger(amount)?amount:amount.toFixed(1);
        return '<div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border-radius:10px;padding:9px 12px;border:1px solid var(--border)">'+
          '<div style="flex:1;font-size:13px;font-weight:700;color:var(--text)">'+ing.ing+'</div>'+
          '<div style="font-size:16px;font-weight:900;color:var(--math)">'+display+'</div>'+
          '<div style="font-size:11px;color:var(--muted);min-width:30px">'+ing.unit+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:9px 12px;font-size:12px;color:var(--muted);line-height:1.7">'+
      '📐 Ratio stays the same: '+r.ratio.map(function(i){return i.amount;}).join(' : ')+' → multiplied by <b style="color:var(--acc)">'+mult.toFixed(1)+'×</b> for '+servings+' servings'+
      '</div>';
  }

  window.rcSel=function(i){sel=i;servings=recipes[i].base;render();};
  window.rcServ=function(n){servings=n;render();};
  render();
};

/* ── 10. SAVINGS TRACKER (savings-tracker) ── */
SIM_REGISTRY['savings-tracker'] = function(c) {
  var goal=1000, saved=0, weekly=50;

  function render() {
    var pct=Math.min(100,saved/goal*100);
    var remaining=Math.max(0,goal-saved);
    var weeks=weekly>0?Math.ceil(remaining/weekly):Infinity;
    var color=pct>=100?'var(--evs)':pct>=50?'var(--math)':'var(--acc)';

    /* Piggy bank SVG */
    var piggy='<svg width="80" height="70" style="flex-shrink:0"><ellipse cx="40" cy="42" rx="30" ry="24" fill="'+color+'" opacity="0.8"/><circle cx="58" cy="35" r="10" fill="'+color+'" opacity="0.7"/><circle cx="62" cy="33" r="3" fill="rgba(0,0,0,.3)"/><rect x="32" y="12" width="8" height="10" rx="2" fill="'+color+'" opacity="0.6"/><ellipse cx="36" cy="12" rx="7" ry="4" fill="'+color+'"/><line x1="28" y1="64" x2="24" y2="55" stroke="'+color+'" stroke-width="4" stroke-linecap="round"/><line x1="36" y1="65" x2="35" y2="55" stroke="'+color+'" stroke-width="4" stroke-linecap="round"/><line x1="44" y1="65" x2="45" y2="55" stroke="'+color+'" stroke-width="4" stroke-linecap="round"/><line x1="52" y1="64" x2="56" y2="55" stroke="'+color+'" stroke-width="4" stroke-linecap="round"/>';
    /* Fill level */
    var fillH=pct/100*32;
    piggy+='<clipPath id="pgClip"><ellipse cx="40" cy="42" rx="29" ry="23"/></clipPath>';
    piggy+='<rect x="11" y="'+(66-fillH)+'" width="58" height="'+fillH+'" fill="rgba(255,255,255,.3)" clip-path="url(#pgClip)"/>';
    piggy+='</svg>';

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">💰 Savings Goal Tracker</div>'+
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">'+
      piggy+
      '<div style="flex:1">'+
      '<div style="font-size:28px;font-weight:900;color:'+color+'">₹'+saved+' / ₹'+goal+'</div>'+
      '<div style="height:12px;background:var(--surface2);border-radius:6px;margin:6px 0;overflow:hidden">'+
      '<div style="height:12px;background:'+color+';width:'+pct+'%;border-radius:6px;transition:width .4s"></div>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--muted)">'+pct.toFixed(1)+'% saved · ₹'+remaining+' to go</div>'+
      '</div></div>'+
      (pct>=100?'<div style="background:var(--evs-dim);border:1.5px solid var(--evs);border-radius:12px;padding:14px;text-align:center;margin-bottom:10px"><div style="font-size:24px">🎉</div><div style="font-size:16px;font-weight:900;color:var(--evs)">Goal Reached!</div></div>':
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 12px;margin-bottom:10px;border:1px solid var(--border)">'+
      '<div style="font-size:12px;color:var(--muted)">At ₹'+weekly+'/week → reach goal in <b style="color:'+color+'">'+weeks+' weeks ('+Math.ceil(weeks/4)+' months)</b></div>'+
      '</div>')+
      /* Controls */
      '<div class="ctrl-row" style="flex-wrap:wrap;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:11px;color:var(--muted)">Goal: <b style="color:'+color+'">₹'+goal+'</b></span>'+
      '<input type="range" class="slide" min="100" max="5000" step="100" value="'+goal+'" oninput="stGoal(this.value)" style="width:110px">'+
      '<span style="font-size:11px;color:var(--muted)">Weekly: <b>₹'+weekly+'</b></span>'+
      '<input type="range" class="slide" min="0" max="500" step="10" value="'+weekly+'" oninput="stWeekly(this.value)" style="width:90px">'+
      '</div>'+
      '<div class="ctrl-row">'+
      '<button class="cbtn" onclick="stAdd(50)" style="background:var(--evs);color:white;border-color:var(--evs)">+ ₹50 Save</button>'+
      '<button class="cbtn" onclick="stAdd(100)" style="background:var(--evs);color:white;border-color:var(--evs)">+ ₹100</button>'+
      '<button class="cbtn" onclick="stReset()">↺ Reset</button>'+
      '</div>';
  }

  window.stGoal=function(v){goal=parseInt(v);render();};
  window.stWeekly=function(v){weekly=parseInt(v);render();};
  window.stAdd=function(v){saved=Math.min(goal,saved+v);render();};
  window.stReset=function(){saved=0;render();};
  render();
};

/* ── 11. TIME MATRIX (time-matrix) ── */
SIM_REGISTRY['time-matrix'] = function(c) {
  var tasks=[
    {text:'Study for tomorrow\'s test',urgent:true,important:true,q:1},
    {text:'Reply to friend\'s WhatsApp',urgent:true,important:false,q:2},
    {text:'Read a book for fun',urgent:false,important:true,q:3},
    {text:'Watch random YouTube videos',urgent:false,important:false,q:4},
    {text:'Complete project due next week',urgent:false,important:true,q:3},
    {text:'Emergency — friend needs help',urgent:true,important:true,q:1},
    {text:'Check social media',urgent:true,important:false,q:2},
    {text:'Practice a hobby/skill',urgent:false,important:true,q:3},
  ];
  var newTask='';

  function render() {
    var quads=[
      {n:1,label:'DO FIRST 🔥',sub:'Urgent + Important',color:'#FF6B6B',desc:'Crises, deadlines, emergencies'},
      {n:2,label:'SCHEDULE 📅',sub:'Not Urgent + Important',color:'#4D96FF',desc:'Planning, learning, relationships'},
      {n:3,label:'DELEGATE 📤',sub:'Urgent + Not Important',color:'#FFD93D',desc:'Interruptions, some messages'},
      {n:4,label:'ELIMINATE ❌',sub:'Not Urgent + Not Important',color:'#888',desc:'Time wasters, trivial activities'},
    ];

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Eisenhower Time Matrix</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">'+
      quads.map(function(q){
        var qtasks=tasks.filter(function(t){return t.q===q.n;});
        return '<div style="background:'+q.color+'15;border:1.5px solid '+q.color+'44;border-radius:12px;padding:10px">'+
          '<div style="font-size:11px;font-weight:900;color:'+q.color+'">'+q.label+'</div>'+
          '<div style="font-size:9px;color:var(--muted);margin-bottom:5px">'+q.sub+'</div>'+
          '<div style="display:flex;flex-direction:column;gap:3px">'+
          qtasks.map(function(t){
            return '<div style="background:'+q.color+'22;border-radius:6px;padding:3px 7px;font-size:10px;color:var(--text)">'+t.text+'</div>';
          }).join('')+
          '</div></div>';
      }).join('')+
      '</div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;line-height:1.7">'+
      'Most successful people spend time in <b style="color:#4D96FF">Quadrant 2</b> — important but not urgent tasks. This prevents crises in Q1!'+
      '</div>';
  }

  render();
};

/* ── 12. RESPONSIBILITY CHART (responsibility-chart) ── */
SIM_REGISTRY['responsibility-chart'] = function(c) {
  var tasks=[
    {task:'Make my bed each morning',done:false,pts:5},
    {task:'Keep my study area clean',done:false,pts:5},
    {task:'Complete homework before screen time',done:false,pts:10},
    {task:'Help with one household chore daily',done:false,pts:8},
    {task:'Wake up on time without reminders',done:false,pts:10},
    {task:'Pack my school bag the night before',done:false,pts:7},
    {task:'Read for 15 minutes',done:false,pts:8},
    {task:'Drink 6+ glasses of water',done:false,pts:5},
  ];
  var day=1;

  function render() {
    var pts=tasks.filter(function(t){return t.done;}).reduce(function(a,t){return a+t.pts;},0);
    var maxPts=tasks.reduce(function(a,t){return a+t.pts;},0);
    var pct=pts/maxPts*100;

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Daily Responsibility Chart — Day '+day+'</div>'+
      /* Progress */
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;margin-bottom:10px;border:1px solid var(--border)">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:5px">' +
      '<span style="font-size:12px;color:var(--text)">Today\'s score</span>' +
      '<span style="font-size:16px;font-weight:900;color:'+(pct>=80?'#6BCB77':pct>=50?'#FFD93D':'#FF6B6B')+'">'+pts+'/'+maxPts+' pts</span>' +
      '</div>' +
      '<div style="height:8px;background:var(--bg);border-radius:4px"><div style="height:8px;background:'+(pct>=80?'#6BCB77':pct>=50?'#FFD93D':'#FF6B6B')+';width:'+pct+'%;border-radius:4px;transition:width .3s"></div></div>' +
      '</div>'+
      /* Task list */
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px">'+
      tasks.map(function(t,i){
        return '<div onclick="rcToggle('+i+')" style="display:flex;align-items:center;gap:10px;background:var(--surface2);border:1.5px solid '+(t.done?'var(--evs)':'var(--border)')+';border-radius:10px;padding:9px 12px;cursor:pointer;transition:all .2s">'+
          '<div style="width:22px;height:22px;border-radius:6px;border:2px solid '+(t.done?'var(--evs)':'var(--border)')+';background:'+(t.done?'var(--evs)':'transparent')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
          (t.done?'<span style="color:white;font-size:14px">✓</span>':'')+
          '</div>'+
          '<div style="flex:1;font-size:12px;color:'+(t.done?'var(--evs)':'var(--text)')+';'+(t.done?'text-decoration:line-through':'')+'">'+t.task+'</div>'+
          '<div style="font-size:11px;font-weight:800;color:'+(t.done?'var(--evs)':'var(--muted)')+'">+'+t.pts+'</div>'+
          '</div>';
      }).join('')+
      '</div>'+
      /* Day navigation */
      '<div class="ctrl-row">'+
      '<button class="cbtn" onclick="rcNextDay()" style="background:var(--acc);color:white;border-color:var(--acc)">Next Day →</button>'+
      '<span style="font-size:11px;color:var(--muted)">'+tasks.filter(function(t){return t.done;}).length+'/'+tasks.length+' tasks complete</span>'+
      '</div>';
  }

  window.rcToggle=function(i){tasks[i].done=!tasks[i].done;render();};
  window.rcNextDay=function(){day++;tasks.forEach(function(t){t.done=false;});render();};
  render();
};

/* ── 13. TEAMWORK TOWER (teamwork-tower) ── */
SIM_REGISTRY['teamwork-tower'] = function(c) {
  var blocks=[], dragging=false, raf2, stability=100;

  function init(){
    blocks=[
      {x:120,y:160,w:80,h:20,color:'#FF6B6B',label:'Trust'},
      {x:125,y:138,w:70,h:20,color:'#FFD93D',label:'Communication'},
      {x:130,y:116,w:60,h:20,color:'#6BCB77',label:'Respect'},
      {x:133,y:94,w:54,h:20,color:'#4D96FF',label:'Shared Goal'},
      {x:136,y:72,w:48,h:20,color:'#C77DFF',label:'Leadership'},
    ];
    stability=100;
  }

  function draw(){
    var _g=getCtx('teamCanvas'); if(!_g)return; var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    /* W,H from getCtx */
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    /* Ground */
    ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(0,H-20,W,20);
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Foundation',W/2,H-6);

    /* Blocks */
    blocks.forEach(function(b,i){
      var wobble=Math.sin(Date.now()/1000*i)*((100-stability)/30);
      ctx.fillStyle=b.color+'CC';
      ctx.shadowColor=b.color; ctx.shadowBlur=8;
      ctx.fillRect(b.x+wobble,b.y,b.w,b.h);
      ctx.shadowBlur=0;
      ctx.strokeStyle=b.color; ctx.lineWidth=1.5;
      ctx.strokeRect(b.x+wobble,b.y,b.w,b.h);
      ctx.fillStyle='white'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(b.label,b.x+b.w/2+wobble,b.y+13);
    });

    /* Stability meter */
    var sColor=stability>70?'#6BCB77':stability>40?'#FFD93D':'#FF6B6B';
    ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(W-35,20,20,H-50);
    ctx.fillStyle=sColor; ctx.fillRect(W-35,20+(1-stability/100)*(H-50),20,stability/100*(H-50));
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Stability',W-25,H-25); ctx.fillText(stability+'%',W-25,12);

    if(stability<100) stability=Math.min(100,stability+0.2);
    raf2=requestAnimationFrame(draw);
  }

  function render(){
    init();
    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Teamwork — Building Together</div>'+
      '<canvas id="teamCanvas" data-w="280" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>'+
      '<div class="ctrl-row" style="margin-top:8px">'+
      ['Remove Trust 😱','Remove Communication 🤐','Remove Respect 😤'].map(function(label,i){
        return '<button class="cbtn" onclick="teamRemove('+i+')" style="font-size:10px">'+label+'</button>';
      }).join('')+
      '</div>'+
      '<div class="ctrl-row" style="margin-top:6px"><button class="cbtn" onclick="teamRebuild()" style="background:var(--evs);color:white;border-color:var(--evs)">🔄 Rebuild Team</button></div>'+
      '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;line-height:1.7">'+
      'Remove a foundation block and watch the tower become unstable. Trust is the base — without it, nothing holds.'+
      '</div>';
    cancelAnimationFrame(raf2); draw();
  }

  window.teamRemove=function(i){if(blocks.length>0){blocks.splice(0,1);stability=Math.max(20,stability-30);}};
  window.teamRebuild=function(){cancelAnimationFrame(raf2);render();};
  window.simCleanup=function(){cancelAnimationFrame(raf2);};
  render();
};

/* ── 14. NEGOTIATION (negotiation) ── */
SIM_REGISTRY['negotiation'] = function(c) {
  var round=0, myOffer=70, theirOffer=40, agreed=false, history=[];

  function render(){
    var gap=myOffer-theirOffer;
    var midpoint=Math.round((myOffer+theirOffer)/2);

    c.innerHTML=
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">Win-Win Negotiation Simulator</div>'+
      '<div style="background:var(--surface2);border-radius:12px;padding:12px;margin-bottom:10px;border:1px solid var(--border)">' +
      '<div style="font-size:13px;color:var(--text);margin-bottom:4px">📖 <b>Scenario:</b> You\'re selling your old bicycle. You want ₹'+myOffer*10+'. The buyer offers ₹'+theirOffer*10+'.</div>' +
      '</div>'+
      /* Offer bar */
      '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px">'+
      '<span style="color:var(--evs)">Buyer: ₹'+theirOffer*10+'</span>'+
      '<span style="color:var(--muted)">Gap: ₹'+gap*10+'</span>'+
      '<span style="color:var(--sci)">You: ₹'+myOffer*10+'</span>'+
      '</div>'+
      '<div style="height:20px;background:var(--surface2);border-radius:10px;position:relative;overflow:hidden">'+
      '<div style="position:absolute;left:0;top:0;height:20px;width:'+theirOffer+'%;background:var(--evs);border-radius:10px"></div>'+
      '<div style="position:absolute;right:0;top:0;height:20px;width:'+(100-myOffer)+'%;background:var(--sci);border-radius:10px"></div>'+
      '<div style="position:absolute;left:'+theirOffer+'%;top:0;width:'+(myOffer-theirOffer)+'%;height:20px;background:var(--math-dim)"></div>'+
      '</div></div>'+
      (agreed?
        '<div style="background:var(--evs-dim);border:1.5px solid var(--evs);border-radius:12px;padding:14px;text-align:center;margin-bottom:10px">'+
        '<div style="font-size:20px">🤝</div>'+
        '<div style="font-size:16px;font-weight:900;color:var(--evs)">Deal at ₹'+midpoint*10+'!</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-top:4px">Both parties gave a little. That\'s a win-win!</div>'+
        '</div>':
        '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">'+
        '<div class="ctrl-row"><span style="font-size:11px;color:var(--sci)">Your offer: <b>₹'+myOffer*10+'</b></span>'+
        '<input type="range" class="slide" min="40" max="100" value="'+myOffer+'" oninput="negMy(this.value)" style="width:120px">'+
        '</div>'+
        '<div class="ctrl-row"><span style="font-size:11px;color:var(--evs)">Buyer offer: <b>₹'+theirOffer*10+'</b></span>'+
        '<input type="range" class="slide" min="0" max="80" value="'+theirOffer+'" oninput="negTheir(this.value)" style="width:120px">'+
        '</div>'+
        '</div>'+
        '<div class="ctrl-row">'+
        '<button class="cbtn" onclick="negAccept()" style="background:var(--evs);color:white;border-color:var(--evs)">'+(gap<=10?'🤝 Accept Deal!':'Lower your price first')+'</button>'+
        '<button class="cbtn" onclick="negCounter()">🗣️ Counter Offer</button>'+
        '</div>'
      )+
      '<div style="background:var(--acc-dim);border:1px solid rgba(199,125,255,.2);border-radius:10px;padding:9px 12px;margin-top:8px;font-size:12px;color:var(--muted);line-height:1.7">'+
      '💡 Win-Win: Both sides give a little. BATNA: Best Alternative To Negotiated Agreement — always know your walk-away point.'+
      '</div>';
  }

  window.negMy=function(v){myOffer=parseInt(v);if(myOffer<theirOffer)myOffer=theirOffer;agreed=false;render();};
  window.negTheir=function(v){theirOffer=parseInt(v);if(theirOffer>myOffer)theirOffer=myOffer;agreed=false;render();};
  window.negAccept=function(){if(myOffer-theirOffer<=10){agreed=true;render();}};
  window.negCounter=function(){theirOffer=Math.min(theirOffer+5,myOffer);render();};
  render();
};


/* ── Remaining 27: use rich animated step navigator ── */
['air-monitor','apology-sim','bayes-prob','biodiversity-survey','bone-joints',
 'boundaries-sim','business-plan','career-explore','census-data','chores-sim',
 'community-action','conflict-resolve','coop-economy','debate-sim','fact-check',
 'globalisation','independence-views','kerala-economy','leadership-sim','local-map',
 'news-history','party-budget','plantation-history','polynomial-tiles','resource-map',
 'turn-taking','weather-diary'
].forEach(function(id) {
  if (!SIM_REGISTRY[id]) SIM_REGISTRY[id] = null;
});


/* ── COMPOUND INTEREST — LIFE SKILLS VERSION (Class 8 Life Skills) ── */
SIM_REGISTRY['compound-interest-life'] = function(c) {
  var principal = 10000, rate = 8, years = 20;

  function render() {
    var SI_final = principal * (1 + rate * years / 100);
    var CI_final = principal * Math.pow(1 + rate / 100, years);
    var diff = CI_final - SI_final;

    /* Build year-by-year table (show every 5 years) */
    var rows = '';
    for (var y = 0; y <= years; y += 5) {
      var si = principal * (1 + rate * y / 100);
      var ci = principal * Math.pow(1 + rate / 100, y);
      rows += '<tr style="border-top:1px solid var(--border)">' +
        '<td style="padding:5px 8px;color:var(--muted)">' + y + '</td>' +
        '<td style="padding:5px 8px;color:var(--text)">₹' + Math.round(si).toLocaleString() + '</td>' +
        '<td style="padding:5px 8px;color:var(--math);font-weight:700">₹' + Math.round(ci).toLocaleString() + '</td>' +
        '<td style="padding:5px 8px;color:var(--evs)">+₹' + Math.round(ci-si).toLocaleString() + '</td>' +
      '</tr>';
    }

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">Simple vs Compound Interest</div>' +
      /* Controls */
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Principal ₹' +
          '<input type="number" value="'+principal+'" oninput="cil_P(this.value)" style="width:80px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 6px;color:var(--text);font-size:12px">' +
        '</label>' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Rate %' +
          '<input type="range" min="1" max="20" value="'+rate+'" oninput="cil_R(this.value)" style="width:70px">' +
          '<b style="color:var(--text)">'+rate+'%</b>' +
        '</label>' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Years' +
          '<input type="range" min="5" max="40" value="'+years+'" oninput="cil_Y(this.value)" style="width:70px">' +
          '<b style="color:var(--text)">'+years+'</b>' +
        '</label>' +
      '</div>' +
      /* Summary cards */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
        '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center">' +
          '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">Simple Interest</div>' +
          '<div style="font-size:20px;font-weight:900;color:var(--text)">₹'+Math.round(SI_final).toLocaleString()+'</div>' +
          '<div style="font-size:10px;color:var(--muted)">interest earns no interest</div>' +
        '</div>' +
        '<div style="background:var(--math-dim);border:1px solid var(--math);border-radius:10px;padding:10px;text-align:center">' +
          '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">Compound Interest</div>' +
          '<div style="font-size:20px;font-weight:900;color:var(--math)">₹'+Math.round(CI_final).toLocaleString()+'</div>' +
          '<div style="font-size:10px;color:var(--evs);font-weight:700">₹'+Math.round(diff).toLocaleString()+' more!</div>' +
        '</div>' +
      '</div>' +
      /* Table */
      '<div style="overflow-x:auto">' +
        '<table style="width:100%;font-size:11px;border-collapse:collapse">' +
          '<tr style="background:var(--surface2)">' +
            '<th style="padding:5px 8px;text-align:left;color:var(--muted)">Year</th>' +
            '<th style="padding:5px 8px;text-align:left;color:var(--muted)">Simple ₹</th>' +
            '<th style="padding:5px 8px;text-align:left;color:var(--math)">Compound ₹</th>' +
            '<th style="padding:5px 8px;text-align:left;color:var(--evs)">Advantage</th>' +
          '</tr>' + rows +
        '</table>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:8px;text-align:center">Formula: CI = P(1 + r/100)ⁿ &nbsp;|&nbsp; SI = P × r × n / 100</div>';
  }

  window.cil_P = function(v) { principal = parseInt(v)||10000; render(); };
  window.cil_R = function(v) { rate = parseInt(v)||8; render(); };
  window.cil_Y = function(v) { years = parseInt(v)||20; render(); };
  render();
};

/* ══════════════════════════════════════════════════════
   FINANCIAL LITERACY SIMS
   ══════════════════════════════════════════════════════ */

/* ── POCKET BUDGET (Class 6) ── */
SIM_REGISTRY['pocket-budget'] = function(c) {
  var entries = [], income = 0;
  var CATS = ['Food','Transport','Stationery','Entertainment','Savings','Other'];
  var COLORS = ['#f87171','#fbbf24','#818cf8','#34d399','#60a5fa','#9ca3af'];

  function render() {
    var totalSpent = entries.reduce(function(s,e){ return s + e.amt; }, 0);
    var balance = income - totalSpent;
    var catTotals = CATS.map(function(cat){
      return entries.filter(function(e){ return e.cat===cat; }).reduce(function(s,e){ return s+e.amt; },0);
    });
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">💰 My Pocket Money Budget</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Weekly Income ₹' +
          '<input id="pbInc" type="number" value="'+income+'" style="width:70px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 6px;color:var(--text);font-size:12px" oninput="pbSetIncome(this.value)">' +
        '</label>' +
      '</div>' +
      /* Summary row */
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">' +
        [['Income','₹'+income,'#60a5fa'],['Spent','₹'+totalSpent,'#f87171'],['Balance','₹'+balance,balance>=0?'#34d399':'#f87171']].map(function(c2){
          return '<div style="background:'+c2[2]+'22;border:1px solid '+c2[2]+'44;border-radius:10px;padding:8px;text-align:center">' +
            '<div style="font-size:10px;color:var(--muted)">'+c2[0]+'</div>' +
            '<div style="font-size:18px;font-weight:900;color:'+c2[2]+'">'+c2[1]+'</div></div>';
        }).join('') +
      '</div>' +
      /* Category bar */
      (totalSpent > 0 ? '<div style="height:10px;border-radius:6px;overflow:hidden;display:flex;margin-bottom:8px">' +
        catTotals.map(function(v,i){ return v>0 ? '<div style="flex:'+v+';background:'+COLORS[i]+'" title="'+CATS[i]+'"></div>' : ''; }).join('') +
      '</div>' : '') +
      /* Category legend */
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;font-size:11px">' +
        CATS.map(function(cat,i){ return catTotals[i]>0 ? '<span style="color:'+COLORS[i]+'">■ '+cat+' ₹'+catTotals[i]+'</span>' : ''; }).join('') +
      '</div>' +
      /* Add entry form */
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
        '<input id="pbDesc" placeholder="What?" style="flex:1;min-width:80px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-size:12px">' +
        '<input id="pbAmt" type="number" placeholder="₹" style="width:60px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-size:12px">' +
        '<select id="pbCat" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px;color:var(--text);font-size:12px">' +
          CATS.map(function(cat){ return '<option>'+cat+'</option>'; }).join('') +
        '</select>' +
        '<button class="cbtn" onclick="pbAdd()">+ Add</button>' +
      '</div>' +
      /* Entries list */
      (entries.length > 0 ? '<div style="max-height:120px;overflow-y:auto;font-size:11px">' +
        entries.map(function(e,i){
          return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">' +
            '<span style="color:var(--muted)">'+e.cat+'</span>' +
            '<span style="flex:1;padding:0 8px;color:var(--text)">'+e.desc+'</span>' +
            '<span style="color:#f87171;font-weight:700">₹'+e.amt+'</span>' +
            '<button onclick="pbDel('+i+')" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:0 4px;font-size:12px">✕</button>' +
          '</div>';
        }).join('') +
      '</div>' : '<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px">Add your spending above to see your budget breakdown.</div>') +
      '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" onclick="pbClear()">↺ Reset</button></div>';
  }

  window.pbSetIncome = function(v) { income = parseInt(v)||0; render(); };
  window.pbAdd = function() {
    var desc = document.getElementById('pbDesc').value.trim();
    var amt  = parseInt(document.getElementById('pbAmt').value)||0;
    var cat  = document.getElementById('pbCat').value;
    if (!desc || !amt) return;
    entries.push({desc:desc, amt:amt, cat:cat});
    render();
  };
  window.pbDel   = function(i) { entries.splice(i,1); render(); };
  window.pbClear = function() { entries=[]; income=0; render(); };
  render();
};

/* ── NEEDS vs WANTS (Class 7) ── */
SIM_REGISTRY['needs-wants'] = function(c) {
  var ITEMS = [
    {name:'School textbooks',    need:true},  {name:'New video game',      need:false},
    {name:'Rice and vegetables', need:true},  {name:'Brand-name shoes',    need:false},
    {name:'Bus fare to school',  need:true},  {name:'Cinema ticket',       need:false},
    {name:'School uniform',      need:true},  {name:'Latest smartphone',   need:false},
    {name:'Drinking water',      need:true},  {name:'Branded snacks',      need:false},
    {name:'Medical checkup',     need:true},  {name:'Streaming service',   need:false},
  ];
  var placed = {};

  function render() {
    var needItems = ITEMS.filter(function(it){ return placed[it.name]==='need'; });
    var wantItems = ITEMS.filter(function(it){ return placed[it.name]==='want'; });
    var unplaced  = ITEMS.filter(function(it){ return !placed[it.name]; });
    var correct   = ITEMS.filter(function(it){ return placed[it.name] && ((placed[it.name]==='need')===it.need); }).length;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">Needs vs Wants</div>' +
      /* Score */
      (Object.keys(placed).length === ITEMS.length ?
        '<div style="background:var(--evs-dim);border:1px solid var(--evs);border-radius:10px;padding:10px;text-align:center;margin-bottom:10px;font-size:13px;font-weight:800;color:var(--evs)">'+
        (correct===ITEMS.length ? '🎉 Perfect! All '+ITEMS.length+' correct!' : '✅ '+correct+'/'+ITEMS.length+' correct — review the highlighted ones') +
        '</div>' : '') +
      /* Unplaced items */
      (unplaced.length > 0 ? '<div style="margin-bottom:10px">' +
        '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">Sort each item:</div>' +
        unplaced.map(function(it){
          return '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 10px;margin-bottom:5px">' +
            '<span style="font-size:12px;font-weight:600;color:var(--text)">'+it.name+'</span>' +
            '<div style="display:flex;gap:5px">' +
              '<button onclick="nwPlace(\''+it.name+'\',\'need\')" style="padding:4px 10px;border-radius:6px;border:1.5px solid var(--evs);background:var(--evs-dim);color:var(--evs);font-size:11px;font-weight:800;cursor:pointer">Need</button>' +
              '<button onclick="nwPlace(\''+it.name+'\',\'want\')" style="padding:4px 10px;border-radius:6px;border:1.5px solid var(--math);background:var(--math-dim);color:var(--math);font-size:11px;font-weight:800;cursor:pointer">Want</button>' +
            '</div></div>';
        }).join('') +
      '</div>' : '') +
      /* Results columns */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        ['need','want'].map(function(type,ti){
          var list = type==='need' ? needItems : wantItems;
          var color = type==='need' ? 'var(--evs)' : 'var(--math)';
          return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px">' +
            '<div style="font-size:11px;font-weight:800;color:'+color+';margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">'+(type==='need'?'✅ Needs':'⭐ Wants')+'</div>' +
            list.map(function(it){
              var correct2 = (type==='need')===it.need;
              return '<div style="font-size:11px;padding:3px 0;color:'+(correct2?'var(--text)':'#f87171')+'">'+
                (correct2?'':'✗ ')+ it.name+'</div>';
            }).join('') +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:8px"><button class="cbtn" onclick="nwReset()">↺ Retry</button></div>';
  }

  window.nwPlace = function(name, type) { placed[name] = type; render(); };
  window.nwReset = function() { placed = {}; render(); };
  render();
};

/* ── GST CALCULATOR (Class 8) ── */
SIM_REGISTRY['gst-calc'] = function(c) {
  var SLABS = [
    {rate:0,  label:'0% — Exempt',      examples:'Fresh food, healthcare, education, eggs'},
    {rate:5,  label:'5% — Essential',   examples:'Packed food, tea, medicines, transport'},
    {rate:12, label:'12% — Standard',   examples:'Butter, ghee, frozen meat, phones<₹12k'},
    {rate:18, label:'18% — Most goods', examples:'Soap, toothpaste, hair oil, restaurants'},
    {rate:28, label:'28% — Luxury',     examples:'ACs, premium cars, cigarettes, aerated drinks'},
  ];
  var selSlab = 2, price = 1000;

  function render() {
    var slab = SLABS[selSlab];
    var gst  = price * slab.rate / 100;
    var total = price + gst;
    var cgst = gst / 2, sgst = gst / 2;

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">🧾 GST Calculator</div>' +
      /* Slab selector */
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px">' +
        SLABS.map(function(s,i){
          return '<div onclick="gstSel('+i+')" style="display:flex;align-items:center;gap:8px;background:'+(i===selSlab?'var(--life-dim)':'var(--surface2)')+';border:1.5px solid '+(i===selSlab?'var(--life)':'var(--border)')+';border-radius:8px;padding:7px 10px;cursor:pointer">' +
            '<div style="width:36px;height:36px;border-radius:8px;background:'+(i===selSlab?'var(--life)':'var(--border)')+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:'+(i===selSlab?'white':'var(--muted)')+'">'+s.rate+'%</div>' +
            '<div><div style="font-size:11px;font-weight:700;color:var(--text)">'+s.label+'</div>' +
            '<div style="font-size:10px;color:var(--muted)">'+s.examples+'</div></div></div>';
        }).join('') +
      '</div>' +
      /* Price input */
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span style="font-size:12px;color:var(--muted)">Item price (before GST)</span>' +
        '<input type="number" id="gstPrice" value="'+price+'" oninput="gstSetPrice(this.value)" ' +
          'style="width:90px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-size:13px;font-weight:700">' +
      '</div>' +
      /* Bill breakdown */
      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;font-size:12px">' +
        '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">Base price</span><span style="font-weight:700;color:var(--text)">₹'+price.toLocaleString()+'</span></div>' +
        (slab.rate > 0 ?
          '<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:var(--muted)">CGST ('+slab.rate/2+'%)</span><span style="color:#f87171">+₹'+cgst.toFixed(2)+'</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">SGST ('+slab.rate/2+'%)</span><span style="color:#f87171">+₹'+sgst.toFixed(2)+'</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">Total GST ('+slab.rate+'%)</span><span style="color:#f87171;font-weight:800">₹'+gst.toFixed(2)+'</span></div>'
          : '<div style="padding:6px 0;color:var(--evs);font-weight:700">✓ GST Exempt — no tax on this item</div>') +
        '<div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:15px"><span style="font-weight:800;color:var(--text)">You pay</span><span style="font-weight:900;color:var(--life)">₹'+total.toFixed(2)+'</span></div>' +
      '</div>';
  }

  window.gstSel      = function(i) { selSlab=i; render(); };
  window.gstSetPrice = function(v) { price=parseInt(v)||0; render(); };
  render();
};

/* ── INVESTMENT COMPARE (Class 10) ── */
SIM_REGISTRY['invest-compare'] = function(c) {
  var OPTIONS = [
    {name:'Savings A/c', rate:3.5,  color:'#9ca3af', risk:'Zero',   icon:'🏦'},
    {name:'Fixed Deposit',rate:7.0,  color:'#60a5fa', risk:'Zero',   icon:'🔒'},
    {name:'Debt Fund',   rate:9.0,  color:'#34d399', risk:'Low',    icon:'📄'},
    {name:'Index Fund',  rate:12.0, color:'#fbbf24', risk:'Medium', icon:'📊'},
    {name:'Stocks',      rate:15.0, color:'#f87171', risk:'High',   icon:'📈'},
  ];
  var principal = 100000, years = 10;

  function render() {
    var inflation = 6.0;
    var results = OPTIONS.map(function(opt) {
      return { name:opt.name, icon:opt.icon, color:opt.color, risk:opt.risk,
        value: Math.round(principal * Math.pow(1 + opt.rate/100, years)),
        real:  Math.round(principal * Math.pow((1+opt.rate/100)/(1+inflation/100), years)) };
    });
    var maxVal = results[results.length-1].value;
    var inflationVal = Math.round(principal * Math.pow(1+inflation/100, years));

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">📊 Investment Comparator</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Principal ₹' +
          '<input type="number" value="'+principal+'" oninput="icSetP(this.value)" style="width:90px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 6px;color:var(--text);font-size:12px">' +
        '</label>' +
        '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px">Years' +
          '<input type="range" min="1" max="30" value="'+years+'" oninput="icSetY(this.value)" style="width:80px">' +
          '<b style="color:var(--text)">'+years+'</b>' +
        '</label>' +
      '</div>' +
      /* Bars */
      results.map(function(r) {
        var pct = Math.round(r.value / maxVal * 100);
        return '<div style="margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">' +
            '<span style="color:var(--text);font-weight:700">'+r.icon+' '+r.name+'</span>' +
            '<span style="color:'+r.color+';font-weight:800">₹'+r.value.toLocaleString()+'</span>' +
          '</div>' +
          '<div style="background:var(--surface2);border-radius:6px;height:10px;overflow:hidden">' +
            '<div style="height:100%;width:'+pct+'%;background:'+r.color+';border-radius:6px;transition:width .4s"></div>' +
          '</div>' +
          '<div style="font-size:10px;color:var(--muted);margin-top:2px">Risk: '+r.risk+' &nbsp;|&nbsp; Real value after 6% inflation: <span style="color:'+(r.real>principal?'#34d399':'#f87171')+'">₹'+r.real.toLocaleString()+'</span></div>' +
        '</div>';
      }).join('') +
      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-top:6px;font-size:11px;color:var(--muted)">' +
        '📉 Inflation makes ₹'+principal.toLocaleString()+' worth only <b style="color:#f87171">₹'+inflationVal.toLocaleString()+'</b> in purchasing power after '+years+' years. You must beat inflation to grow real wealth.' +
      '</div>';
  }

  window.icSetP = function(v) { principal=parseInt(v)||100000; render(); };
  window.icSetY = function(v) { years=parseInt(v)||10; render(); };
  render();
};

/* ── BANKING SIM (Class 10) ── */
SIM_REGISTRY['banking-sim'] = function(c) {
  var balance = 5000, transactions = [
    {date:'01 Apr',desc:'Opening Balance',  type:'credit', amt:5000},
  ];
  var step = 0;
  var SCENARIOS = [
    {desc:'Received pocket money',type:'credit',amt:500},
    {desc:'Bought stationery',   type:'debit', amt:120},
    {desc:'UPI to friend',       type:'debit', amt:200},
    {desc:'Interest credited',   type:'credit',amt:15},
    {desc:'School fee',          type:'debit', amt:800},
    {desc:'Gift from uncle',     type:'credit',amt:1000},
  ];

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">📱 My Bank Account</div>' +
      /* Balance card */
      '<div style="background:linear-gradient(135deg,#1e3a5f,#0f1f3d);border-radius:14px;padding:16px 18px;margin-bottom:12px;color:white">' +
        '<div style="font-size:10px;letter-spacing:2px;opacity:.7;margin-bottom:4px">AVAILABLE BALANCE</div>' +
        '<div style="font-size:28px;font-weight:900">₹'+balance.toLocaleString()+'</div>' +
        '<div style="font-size:10px;opacity:.6;margin-top:6px">Savings Account &nbsp;·&nbsp; **** 4721</div>' +
      '</div>' +
      /* Passbook */
      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:10px">' +
        '<div style="display:grid;grid-template-columns:60px 1fr 70px 70px;padding:6px 10px;background:var(--border);font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">' +
          '<span>Date</span><span>Description</span><span style="text-align:right">Amount</span><span style="text-align:right">Balance</span>' +
        '</div>' +
        transactions.map(function(t,i){
          var runBal = transactions.slice(0,i+1).reduce(function(b,tx){ return tx.type==='credit' ? b : b-tx.amt; },
            transactions.slice(0,i+1).filter(function(tx){ return tx.type==='credit'; }).reduce(function(s,tx){ return s+tx.amt; },0));
          return '<div style="display:grid;grid-template-columns:60px 1fr 70px 70px;padding:7px 10px;border-top:1px solid var(--border);font-size:11px">' +
            '<span style="color:var(--muted)">'+t.date+'</span>' +
            '<span style="color:var(--text)">'+t.desc+'</span>' +
            '<span style="text-align:right;color:'+(t.type==='credit'?'#34d399':'#f87171');+';font-weight:700">'+(t.type==='credit'?'+':'-')+'₹'+t.amt+'</span>' +
            '<span style="text-align:right;color:var(--text)">₹'+t.bal+'</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      (step < SCENARIOS.length ?
        '<button class="cbtn" onclick="bankNext()" style="width:100%">▶ Next Transaction</button>' :
        '<div style="background:var(--evs-dim);border:1px solid var(--evs);border-radius:8px;padding:10px;font-size:12px;color:var(--evs);text-align:center;font-weight:700">✅ You\'ve read a full bank statement! Debits reduce balance; credits increase it.</div>') +
      '<div class="ctrl-row" style="margin-top:6px"><button class="cbtn" onclick="bankReset()">↺ Reset</button></div>';
  }

  function addTransaction(tx) {
    balance = tx.type === 'credit' ? balance + tx.amt : balance - tx.amt;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d = new Date(); d.setDate(d.getDate() + step * 3);
    transactions.push({date:(d.getDate())+' '+months[d.getMonth()], desc:tx.desc, type:tx.type, amt:tx.amt, bal:balance});
  }

  /* Pre-calc balances */
  transactions[0].bal = 5000;

  window.bankNext = function() {
    if (step >= SCENARIOS.length) return;
    addTransaction(SCENARIOS[step]); step++; render();
  };
  window.bankReset = function() {
    balance=5000; step=0;
    transactions=[{date:'01 Apr',desc:'Opening Balance',type:'credit',amt:5000,bal:5000}];
    render();
  };
  render();
};

/* ── Renamed simId aliases (India-generic versions) ── */
SIM_REGISTRY['india-resources'] = SIM_REGISTRY['resource-map'] || null;
SIM_REGISTRY['india-economy']   = SIM_REGISTRY['kerala-economy'] || null;
SIM_REGISTRY['sdg-india']       = SIM_REGISTRY['sdg-kerala'] || null;

/* ═══════════════════════════════════════════════════════════
   NEW PRACTICAL EXPERIMENTS — Classes 8, 9, 10
   ═══════════════════════════════════════════════════════════ */

/* ── TYNDALL EFFECT (Class 9 — Ch 1: Matter) ── */
SIM_REGISTRY['tyndall-effect'] = function(c) {
  var mode = 'colloid', raf;
  var solutions = {
    solution: { label:'True Solution (Salt Water)', particles:[], color:'rgba(180,220,255,0.15)', scatterColor:'rgba(200,220,255,0)', desc:'Salt dissolves completely — particles too small (< 1nm) to scatter light. Beam invisible.' },
    colloid:  { label:'Colloid (Milk in Water)',    particles:[], color:'rgba(255,248,220,0.3)',  scatterColor:'rgba(255,220,80,0.55)',  desc:'Colloid particles (1–100nm) scatter light sideways — beam clearly visible. This is the Tyndall Effect!' },
    suspension:{ label:'Suspension (Sand in Water)',particles:[], color:'rgba(210,180,140,0.5)',  scatterColor:'rgba(200,160,80,0.7)',  desc:'Large particles (>100nm) scatter AND absorb light — beam visible but muddy. Particles settle over time.' },
  };

  /* Generate random particle positions */
  Object.keys(solutions).forEach(function(k) {
    solutions[k].particles = [];
    for (var i = 0; i < 80; i++) {
      solutions[k].particles.push({ x: Math.random(), y: Math.random(), r: k==='suspension'?3:k==='colloid'?1.2:0.4, vx:(Math.random()-0.5)*0.002, vy:(Math.random()-0.5)*0.002 });
    }
  });

  function draw() {
    var _g = getCtx('tyndallCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    var sol = solutions[mode];
    ctx.clearRect(0,0,W,H);

    /* Beaker outline */
    var bx=W*0.15, bw=W*0.7, by=H*0.08, bh=H*0.82;
    ctx.fillStyle='rgba(200,230,255,0.08)';
    ctx.strokeStyle='rgba(150,200,255,0.5)'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(bx,by); ctx.lineTo(bx,by+bh);
    ctx.lineTo(bx+bw,by+bh); ctx.lineTo(bx+bw,by);
    ctx.stroke();
    /* Liquid fill */
    ctx.fillStyle=sol.color;
    ctx.fillRect(bx+2,by+2,bw-4,bh-4);

    /* Animate particles */
    sol.particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0.02 || p.x > 0.98) p.vx *= -1;
      if (p.y < 0.02 || p.y > 0.98) p.vy *= -1;
      var px = bx + p.x * bw, py = by + p.y * bh;
      ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI*2);
      ctx.fillStyle = mode==='solution'?'rgba(100,150,200,0.3)':mode==='colloid'?'rgba(200,180,100,0.5)':'rgba(180,140,80,0.7)';
      ctx.fill();
    });

    /* Laser beam from left */
    var beamY = H * 0.35;
    var beamX1 = 8, beamX2 = bx + bw * 0.15; /* outside beaker */
    /* Beam before beaker — always visible */
    ctx.strokeStyle='rgba(220,50,50,0.9)'; ctx.lineWidth=2.5;
    ctx.shadowColor='#ef4444'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.moveTo(beamX1, beamY); ctx.lineTo(bx, beamY); ctx.stroke();

    /* Beam inside beaker */
    if (mode !== 'solution') {
      /* Scattered beam — visible cone */
      var grad = ctx.createLinearGradient(bx, beamY, bx+bw-4, beamY);
      grad.addColorStop(0, 'rgba(255,80,80,0.85)');
      grad.addColorStop(1, 'rgba(255,80,80,0.15)');
      ctx.strokeStyle = grad; ctx.lineWidth = mode==='suspension'?4:2.5;
      ctx.shadowColor='rgba(255,100,50,0.6)'; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.moveTo(bx, beamY); ctx.lineTo(bx+bw-4, beamY); ctx.stroke();
      /* Scatter glow ellipse */
      var sc = ctx.createRadialGradient(bx+bw*0.5,beamY,0,bx+bw*0.5,beamY,bw*0.3);
      sc.addColorStop(0,sol.scatterColor); sc.addColorStop(1,'rgba(255,150,50,0)');
      ctx.fillStyle=sc; ctx.beginPath(); ctx.ellipse(bx+bw*0.5,beamY,bw*0.35,H*0.18,0,0,Math.PI*2); ctx.fill();
    } else {
      /* No scatter — beam invisible inside */
      ctx.strokeStyle='rgba(255,80,80,0.08)'; ctx.lineWidth=1.5; ctx.shadowBlur=0;
      ctx.beginPath(); ctx.moveTo(bx,beamY); ctx.lineTo(bx+bw-4,beamY); ctx.stroke();
    }
    ctx.shadowBlur=0;

    /* Beam after beaker */
    ctx.strokeStyle='rgba(220,50,50,0.6)'; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(bx+bw, beamY); ctx.lineTo(W-6, beamY); ctx.stroke();

    /* Torch icon on left */
    ctx.fillStyle='#dc2626'; ctx.beginPath(); ctx.arc(8,beamY,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(254,202,202,0.4)'; ctx.beginPath(); ctx.arc(8,beamY,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7f1d1d'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('LASER',8,beamY+18);

    /* Label */
    ctx.fillStyle='rgba(200,220,255,0.8)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(sol.label, W/2, by-4);

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<canvas id="tyndallCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px;gap:5px;flex-wrap:wrap">' +
      Object.keys(solutions).map(function(k) {
        return '<button onclick="tyndallSet(\''+k+'\')" style="padding:5px 10px;border-radius:8px;font-size:11px;font-family:Nunito,sans-serif;border:1.5px solid '+(k===mode?'var(--sci)':'var(--border)')+';background:'+(k===mode?'var(--sci-dim)':'var(--surface2)')+';color:'+(k===mode?'var(--sci)':'var(--muted)')+';cursor:pointer">'+solutions[k].label.split(' (')[0]+'</button>';
      }).join('') + '</div>' +
      '<div id="tyndallDesc" style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+solutions[mode].desc+'</div>';
    cancelAnimationFrame(raf); draw();
  }
  window.tyndallSet = function(m) { mode=m; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── REFRACTION THROUGH GLASS SLAB (Class 10 — Ch 10: Light) ── */
SIM_REGISTRY['refraction-slab'] = function(c) {
  var angleDeg = 40, raf;

  function draw() {
    var _g = getCtx('refrCanvas');
    if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0f1a'; ctx.fillRect(0,0,W,H);

    /* Glass slab */
    var sx = W*0.3, sw = W*0.4, sy = H*0.2, sh = H*0.6;
    ctx.fillStyle='rgba(100,180,255,0.12)';
    ctx.fillRect(sx,sy,sw,sh);
    ctx.strokeStyle='rgba(100,180,255,0.4)'; ctx.lineWidth=1.5;
    ctx.strokeRect(sx,sy,sw,sh);
    ctx.fillStyle='rgba(100,180,255,0.5)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('GLASS (n≈1.5)',sx+sw/2,sy-6);
    ctx.fillStyle='rgba(150,200,255,0.3)'; ctx.fillText('AIR (n=1)',sx-W*0.15,sy+sh/2+3);
    ctx.fillStyle='rgba(150,200,255,0.3)'; ctx.fillText('AIR (n=1)',sx+sw+W*0.1,sy+sh/2+3);

    var angleRad = angleDeg * Math.PI / 180;
    /* Snell's law: n1 sinθ1 = n2 sinθ2 => sinθ2 = sinθ1/1.5 */
    var sinRefr = Math.sin(angleRad) / 1.5;
    var refrAngle = Math.asin(Math.min(sinRefr, 1));
    /* Emergent angle = incident angle (parallel sides) */

    /* Entry point on top face */
    var ex = sx + sw * 0.5, ey = sy;
    /* Exit point on bottom face */
    var exitX = ex + Math.tan(refrAngle) * sh;
    var exitY = sy + sh;

    /* Incident ray */
    var incLen = H * 0.22;
    var ix = ex - Math.sin(angleRad) * incLen;
    var iy = ey - Math.cos(angleRad) * incLen;
    ctx.strokeStyle='rgba(255,220,50,0.9)'; ctx.lineWidth=2;
    ctx.shadowColor='#fde68a'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.moveTo(ix,iy); ctx.lineTo(ex,ey); ctx.stroke();

    /* Refracted ray inside slab */
    ctx.strokeStyle='rgba(255,200,50,0.7)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(exitX,exitY); ctx.stroke();

    /* Emergent ray (parallel to incident) */
    var emLen = H * 0.2;
    var emX = exitX + Math.sin(angleRad) * emLen;
    var emY = exitY + Math.cos(angleRad) * emLen;
    ctx.strokeStyle='rgba(255,220,50,0.9)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(exitX,exitY); ctx.lineTo(emX,emY); ctx.stroke();
    ctx.shadowBlur=0;

    /* Normal lines (dashed) */
    ctx.setLineDash([5,4]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(ex,sy-30); ctx.lineTo(ex,sy+sh+30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(exitX-20,exitY-30); ctx.lineTo(exitX+20,exitY+30); ctx.stroke();
    ctx.setLineDash([]);

    /* Lateral displacement line */
    ctx.setLineDash([3,3]); ctx.strokeStyle='rgba(255,100,100,0.5)'; ctx.lineWidth=1;
    /* Project incident direction to exit level */
    var projX = ex + Math.tan(angleRad) * sh;
    ctx.beginPath(); ctx.moveTo(projX,exitY); ctx.lineTo(exitX,exitY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,100,100,0.8)'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('lateral',  (projX+exitX)/2, exitY-6);
    ctx.fillText('displacement', (projX+exitX)/2, exitY+10);

    /* Angle labels */
    ctx.fillStyle='rgba(255,220,100,0.9)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('i = '+angleDeg+'°', ex+6, ey-10);
    ctx.fillText('r = '+Math.round(refrAngle*180/Math.PI)+'°', ex+6, ey+18);
    ctx.fillText('e = '+angleDeg+'°', exitX+6, exitY+14);

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<canvas id="refrCanvas" data-w="300" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px;gap:8px;align-items:center">' +
      '<span style="font-size:11px;color:var(--muted)">Incident angle (i):</span>' +
      '<input type="range" class="slide" min="5" max="70" value="40" oninput="refrAngle(this.value)" style="width:100px">' +
      '<span style="font-size:11px;font-weight:900;color:var(--text)" id="refrVal">40°</span>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '📐 Snell\'s Law: n₁ sin i = n₂ sin r. The emergent ray is always parallel to the incident ray — only shifted sideways (lateral displacement). The greater the angle, the more the shift.' +
      '</div>';
    cancelAnimationFrame(raf); draw();
  }
  window.refrAngle = function(v) {
    angleDeg = parseInt(v);
    var el = document.getElementById('refrVal'); if (el) el.textContent = v + '°';
  };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── TEMPORARY SLIDE PREPARATION (Class 9 — Ch 13: Why Do We Fall Ill) ── */
SIM_REGISTRY['temp-slide'] = function(c) {
  var step = 0, specimen = 'onion', raf;
  var specimens = {
    onion: { name:'Onion Peel (Epidermal Cells)', color:'rgba(255,230,150,0.6)', cellColor:'rgba(255,200,80,0.4)', wallColor:'rgba(180,120,30,0.8)', nucleus:'rgba(180,80,30,0.9)', stain:'Safranin (pink-red)', fact:'Plant cells have a rigid cell wall. The nucleus stains pink with Safranin.' },
    cheek: { name:'Human Cheek Cells', color:'rgba(255,200,180,0.5)', cellColor:'rgba(255,180,150,0.3)', wallColor:'rgba(200,100,80,0.6)', nucleus:'rgba(140,50,30,0.9)', stain:'Methylene Blue', fact:'Animal cells have no cell wall — they appear round/irregular. Nucleus stains blue.' },
  };
  var steps = [
    { title:'1. Place slide on stage', desc:'Put a clean glass slide on the lab bench. Ensure it is dry and grease-free.' },
    { title:'2. Add a drop of water', desc:'Place one drop of distilled water at the centre of the slide using a dropper.' },
    { title:'3. Peel the specimen', desc:'For onion: peel a thin transparent layer from the inner surface of an onion scale. For cheek: gently scrape the inside of your cheek with a clean toothpick.' },
    { title:'4. Place on slide', desc:'Spread the specimen flat in the water drop. Avoid folding or overlapping.' },
    { title:'5. Add stain', desc:'Add one drop of stain (Safranin for onion, Methylene Blue for cheek cells).' },
    { title:'6. Cover with coverslip', desc:'Lower the coverslip gently at an angle to avoid air bubbles. Press lightly.' },
    { title:'7. Observe under microscope', desc:'Start with low power (10×). Focus carefully, then switch to high power (40×). You should now see individual cells clearly!' },
  ];

  function drawCell(ctx, cx, cy, rx, ry, s) {
    /* Cell wall */
    ctx.strokeStyle = s.wallColor; ctx.lineWidth = 1.8;
    ctx.fillStyle = s.cellColor;
    ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.fill();
    if (specimen==='onion') { ctx.stroke(); } /* plant cell has wall */
    /* Cytoplasm texture */
    ctx.fillStyle='rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.ellipse(cx-rx*0.2,cy-ry*0.2,rx*0.5,ry*0.4,0,0,Math.PI*2); ctx.fill();
    /* Nucleus */
    ctx.fillStyle=s.nucleus; ctx.beginPath(); ctx.ellipse(cx,cy,rx*0.28,ry*0.28,0,0,Math.PI*2); ctx.fill();
    /* Nucleolus */
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(cx-rx*0.06,cy-ry*0.06,rx*0.08,0,Math.PI*2); ctx.fill();
  }

  function draw() {
    var _g = getCtx('slideCanvas');
    if (!_g) return;
    var cv=_g.cv, ctx=_g.ctx, W=_g.W, H=_g.H;
    ctx.clearRect(0,0,W,H);
    var s = specimens[specimen];

    if (step < 6) {
      /* Show the step being performed */
      ctx.fillStyle='#0d1b2a'; ctx.fillRect(0,0,W,H);
      /* Step number circle */
      ctx.fillStyle=step<3?'#0ea5e9':step<5?'#f59e0b':'#22c55e';
      ctx.beginPath(); ctx.arc(W/2,H*0.28,32,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='white'; ctx.font='bold 22px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(step+1, W/2, H*0.28+8);
      /* Microscope/slide icon based on step */
      var icons=['🧫','💧','🧅','📋','🎨','🔬','🔬'];
      ctx.font='40px sans-serif';
      ctx.fillText(icons[step], W/2, H*0.58);
      /* Step title */
      ctx.fillStyle='rgba(220,240,255,0.95)'; ctx.font='bold 12px Nunito,sans-serif';
      ctx.fillText(steps[step].title, W/2, H*0.72);
      /* Progress dots */
      steps.forEach(function(_,i) {
        ctx.beginPath(); ctx.arc(W/2 - (steps.length-1)*9 + i*18, H*0.88, 5, 0, Math.PI*2);
        ctx.fillStyle = i<=step ? '#22c55e' : 'rgba(255,255,255,0.2)'; ctx.fill();
      });
    } else {
      /* Step 7: microscope view */
      ctx.fillStyle='#050810'; ctx.fillRect(0,0,W,H);
      /* Circular microscope field */
      var fieldR = Math.min(W,H)*0.42;
      ctx.save();
      ctx.beginPath(); ctx.arc(W/2,H/2,fieldR,0,Math.PI*2); ctx.clip();
      ctx.fillStyle=s.color; ctx.fillRect(0,0,W,H);
      /* Cell grid */
      var cw=52,ch=36;
      for (var row=-1;row<=3;row++) for (var col=-1;col<=4;col++) {
        var cx=W/2-100+col*cw+(row%2)*cw*0.5, cy=H/2-60+row*ch;
        drawCell(ctx,cx,cy,cw*0.44,ch*0.44,s);
      }
      ctx.restore();
      /* Circular vignette */
      var vig=ctx.createRadialGradient(W/2,H/2,fieldR*0.7,W/2,H/2,fieldR);
      vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.85)');
      ctx.fillStyle=vig; ctx.beginPath(); ctx.arc(W/2,H/2,fieldR,0,Math.PI*2); ctx.fill();
      /* Outer mask */
      ctx.fillStyle='#050810';
      ctx.beginPath(); ctx.rect(0,0,W,H); ctx.arc(W/2,H/2,fieldR,0,Math.PI*2,true); ctx.fill();
      /* Crosshair */
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(W/2,H/2-fieldR*0.5); ctx.lineTo(W/2,H/2+fieldR*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W/2-fieldR*0.5,H/2); ctx.lineTo(W/2+fieldR*0.5,H/2); ctx.stroke();
      /* Label */
      ctx.fillStyle='rgba(200,230,255,0.8)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(s.name+' — 40× magnification', W/2, H*0.92);
    }
    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<canvas id="slideCanvas" data-w="300" data-h="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px;gap:6px;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="slideStep(-1)">← Back</button>' +
      '<span style="font-size:11px;color:var(--muted)">' + steps[Math.min(step,steps.length-1)].desc + '</span>' +
      '<button class="cbtn" onclick="slideStep(1)">Next →</button>' +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:6px;gap:6px">' +
      '<span style="font-size:11px;color:var(--muted)">Specimen:</span>' +
      ['onion','cheek'].map(function(sp) {
        return '<button onclick="slideSpec(\''+sp+'\')" style="padding:4px 10px;border-radius:8px;font-size:11px;font-family:Nunito,sans-serif;border:1.5px solid '+(sp===specimen?'var(--evs)':'var(--border)')+';background:'+(sp===specimen?'var(--evs-dim)':'var(--surface2)')+';color:'+(sp===specimen?'var(--evs)':'var(--muted)')+';cursor:pointer">'+(sp==='onion'?'🧅 Onion':'🫦 Cheek')+'</button>';
      }).join('') +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+specimens[specimen].fact+'</div>';
    cancelAnimationFrame(raf); draw();
  }
  window.slideStep = function(d) { step = Math.max(0,Math.min(steps.length-1,step+d)); cancelAnimationFrame(raf); render(); };
  window.slideSpec = function(sp) { specimen=sp; step=0; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── MAGNETIC FIELD MAPPING (Class 10 — Ch 13: Magnetic Effects) ── */
SIM_REGISTRY['magnetic-field-map'] = function(c) {
  var magType='bar', raf, t=0;

  function fieldAt(x,y,cx,cy,W,H) {
    /* Returns {bx,by} — field vector at (x,y) for dipole at (cx,cy) */
    var dx=x-cx, dy=y-cy;
    var r2=dx*dx+dy*dy+1;
    var r=Math.sqrt(r2);
    /* North pole at (cx, cy-nh), South at (cx, cy+nh) */
    var nh=H*0.18;
    var dxN=x-cx, dyN=y-(cy-nh), r2N=dxN*dxN+dyN*dyN+1;
    var dxS=x-cx, dyS=y-(cy+nh), r2S=dxS*dxS+dyS*dyS+1;
    var bx = dxN/(r2N*Math.sqrt(r2N)) - dxS/(r2S*Math.sqrt(r2S));
    var by = dyN/(r2N*Math.sqrt(r2N)) - dyS/(r2S*Math.sqrt(r2S));
    return {bx:bx, by:by};
  }

  function draw() {
    var _g = getCtx('magCanvas');
    if (!_g) return;
    var cv=_g.cv, ctx=_g.ctx, W=_g.W, H=_g.H;
    t += 0.02;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#080c14'; ctx.fillRect(0,0,W,H);

    var cx=W/2, cy=H/2;

    /* Draw field lines using streamlines */
    var nLines = 16;
    for (var li=0;li<nLines;li++) {
      var startAngle = li/nLines * Math.PI*2;
      var startR = H*0.22;
      var sx2 = cx + Math.cos(startAngle)*startR*0.5;
      var sy2 = cy - H*0.18 + Math.sin(startAngle)*10; /* near north pole */
      ctx.beginPath(); ctx.moveTo(sx2,sy2);
      var px=sx2, py=sy2;
      var hue = Math.round(200 + li/nLines*60);
      ctx.strokeStyle='hsla('+hue+',70%,65%,0.55)'; ctx.lineWidth=1.2;
      for (var step2=0;step2<120;step2++) {
        var f=fieldAt(px,py,cx,cy,W,H);
        var mag=Math.sqrt(f.bx*f.bx+f.by*f.by)+0.0001;
        px += f.bx/mag*3; py += f.by/mag*3;
        if (px<4||px>W-4||py<4||py>H-4) break;
        ctx.lineTo(px,py);
      }
      ctx.stroke();
    }

    /* Compass needles on a grid */
    for (var gx2=W*0.1;gx2<W*0.9;gx2+=W*0.12) {
      for (var gy2=H*0.08;gy2<H*0.92;gy2+=H*0.14) {
        var f2=fieldAt(gx2,gy2,cx,cy,W,H);
        var mag2=Math.sqrt(f2.bx*f2.bx+f2.by*f2.by)+0.0001;
        var ang2=Math.atan2(f2.by,f2.bx);
        /* Skip if inside magnet */
        if (Math.abs(gx2-cx)<W*0.06 && Math.abs(gy2-cy)<H*0.22) continue;
        var nl=9;
        ctx.save(); ctx.translate(gx2,gy2); ctx.rotate(ang2);
        ctx.fillStyle='#ef4444'; ctx.beginPath();
        ctx.moveTo(nl,0); ctx.lineTo(-nl*0.3,3); ctx.lineTo(-nl*0.3,-3); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#94a3b8'; ctx.beginPath();
        ctx.moveTo(-nl,0); ctx.lineTo(nl*0.3,3); ctx.lineTo(nl*0.3,-3); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    /* Bar magnet */
    var mw=W*0.08, mh=H*0.36;
    /* North half */
    ctx.fillStyle='#dc2626';
    ctx.fillRect(cx-mw/2, cy-mh/2, mw, mh/2);
    /* South half */
    ctx.fillStyle='#2563eb';
    ctx.fillRect(cx-mw/2, cy, mw, mh/2);
    /* Labels */
    ctx.fillStyle='white'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('N', cx, cy-mh/2+14);
    ctx.fillText('S', cx, cy+mh/2-4);
    /* Magnet border */
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5;
    ctx.strokeRect(cx-mw/2, cy-mh/2, mw, mh);

    /* Field strength indicator near poles */
    ctx.fillStyle='rgba(255,100,100,0.15)';
    ctx.beginPath(); ctx.arc(cx,cy-mh/2,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(50,100,255,0.15)';
    ctx.beginPath(); ctx.arc(cx,cy+mh/2,18,0,Math.PI*2); ctx.fill();

    /* Legend */
    ctx.fillStyle='#ef4444'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('▶ = N end of compass needle', 8, H-8);

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">Magnetic Field Lines — Bar Magnet</div>' +
      '<canvas id="magCanvas" data-w="300" data-h="220" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">' +
      '🧲 Field lines emerge from North (red) and enter South (blue). Compass needles align with the field direction. Lines are closest near the poles — strongest field there.' +
      '</div>';
    cancelAnimationFrame(raf); draw();
  }
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── FRICTION COMPARISON (Class 8 — Ch 12: Friction) ── */
SIM_REGISTRY['friction-sim'] = function(c) {
  var surface='wood', force=0, moving=false, blockX=30, raf;
  var surfaces = {
    glass:     { name:'Glass (smooth)', mu:0.15, color:'#93c5fd', texture:'smooth',  fact:'Very smooth — low friction. μ ≈ 0.15' },
    wood:      { name:'Wood',           mu:0.35, color:'#d97706', texture:'wood',    fact:'Moderate friction. μ ≈ 0.35. Most everyday surfaces.' },
    rubber:    { name:'Rubber mat',     mu:0.65, color:'#374151', texture:'rough',   fact:'High friction. μ ≈ 0.65. That\'s why tyres are rubber!' },
    sandpaper: { name:'Sandpaper',      mu:0.85, color:'#b45309', texture:'grit',    fact:'Very high friction. μ ≈ 0.85. Abrasive surface.' },
    ice:       { name:'Ice',            mu:0.05, color:'#bae6fd', texture:'ice',     fact:'Almost frictionless! μ ≈ 0.05. Water film acts as lubricant.' },
  };
  var blockW=44, blockH=28, mass=1, g=9.8;

  function draw() {
    var _g = getCtx('frictionCanvas');
    if (!_g) return;
    var cv=_g.cv, ctx=_g.ctx, W=_g.W, H=_g.H;
    ctx.clearRect(0,0,W,H);
    var s=surfaces[surface];
    var groundY=H*0.68;
    var maxFriction=s.mu*mass*g;
    var netForce=Math.max(0,force-maxFriction*10);
    var accel=netForce/mass*0.015;

    /* Background */
    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);

    /* Surface */
    if (s.texture==='wood') {
      ctx.fillStyle='#d97706';
      ctx.fillRect(0,groundY,W,H-groundY);
      for (var gx=0;gx<W;gx+=18) {
        ctx.strokeStyle='rgba(120,60,0,0.2)'; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(gx,groundY); ctx.lineTo(gx+3,H); ctx.stroke();
      }
    } else if (s.texture==='rough') {
      ctx.fillStyle=s.color; ctx.fillRect(0,groundY,W,H-groundY);
      for (var bx2=0;bx2<W;bx2+=6) for (var by2=groundY;by2<H;by2+=6) {
        if (Math.random()>0.5) { ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(bx2,by2,3,3); }
      }
    } else if (s.texture==='grit') {
      ctx.fillStyle=s.color; ctx.fillRect(0,groundY,W,H-groundY);
      ctx.fillStyle='rgba(255,200,100,0.4)';
      for (var gi=0;gi<60;gi++) ctx.fillRect(Math.random()*W,groundY+Math.random()*(H-groundY),2,2);
    } else if (s.texture==='ice') {
      var iceg=ctx.createLinearGradient(0,groundY,0,H);
      iceg.addColorStop(0,'#e0f2fe'); iceg.addColorStop(1,'#bae6fd');
      ctx.fillStyle=iceg; ctx.fillRect(0,groundY,W,H-groundY);
      ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1;
      for (var ix2=0;ix2<W;ix2+=30) {
        ctx.beginPath(); ctx.moveTo(ix2,groundY); ctx.lineTo(ix2+15,groundY+8); ctx.stroke();
      }
    } else {
      ctx.fillStyle=s.color; ctx.fillRect(0,groundY,W,H-groundY);
      for (var sx2=0;sx2<W;sx2+=3) {
        ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(sx2,groundY); ctx.lineTo(sx2+2,groundY+4); ctx.stroke();
      }
    }

    /* Ground line */
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,groundY); ctx.lineTo(W,groundY); ctx.stroke();

    /* Move block */
    if (moving && force > maxFriction*10) {
      blockX = Math.min(blockX + accel, W - blockW - 8);
    } else if (!moving && force <= maxFriction*10) {
      /* Nudge back to start when force released */
    }
    if (blockX >= W - blockW - 8) moving=false;

    /* Block */
    var bx=blockX, by=groundY-blockH;
    /* Shadow */
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(bx+blockW/2,groundY+4,blockW*0.4,4,0,0,Math.PI*2); ctx.fill();
    /* Block body */
    var bg=ctx.createLinearGradient(bx,by,bx,by+blockH);
    bg.addColorStop(0,'#60a5fa'); bg.addColorStop(1,'#2563eb');
    ctx.fillStyle=bg; ctx.fillRect(bx,by,blockW,blockH);
    ctx.strokeStyle='#1d4ed8'; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,blockW,blockH);
    ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('1 kg', bx+blockW/2, by+blockH/2+3);

    /* Applied force arrow */
    if (force > 0) {
      var arrowLen=Math.min(50,force*1.5);
      ctx.strokeStyle='#16a34a'; ctx.lineWidth=2.5;
      ctx.shadowColor='#22c55e'; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.moveTo(bx+blockW,by+blockH/2); ctx.lineTo(bx+blockW+arrowLen,by+blockH/2); ctx.stroke();
      ctx.fillStyle='#16a34a';
      ctx.beginPath(); ctx.moveTo(bx+blockW+arrowLen,by+blockH/2-5); ctx.lineTo(bx+blockW+arrowLen+10,by+blockH/2); ctx.lineTo(bx+blockW+arrowLen,by+blockH/2+5); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='#15803d'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('F='+force+'N', bx+blockW+arrowLen/2+5, by-4);
    }

    /* Friction arrow (opposing) */
    if (force > 0) {
      var fLen=Math.min(40,maxFriction*10*0.8);
      ctx.strokeStyle='#dc2626'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(bx,by+blockH/2); ctx.lineTo(bx-fLen,by+blockH/2); ctx.stroke();
      ctx.fillStyle='#dc2626';
      ctx.beginPath(); ctx.moveTo(bx-fLen,by+blockH/2-4); ctx.lineTo(bx-fLen-8,by+blockH/2); ctx.lineTo(bx-fLen,by+blockH/2+4); ctx.fill();
      ctx.fillStyle='#b91c1c'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('f='+Math.round(maxFriction*10)+'N', bx-fLen/2-4, by-4);
    }

    /* Status */
    var status = force===0?'No force applied':force<=maxFriction*10?'Static friction holds! Block stays still':'Kinetic friction — block moving!';
    var statusCol = force===0?'#64748b':force<=maxFriction*10?'#b45309':'#16a34a';
    ctx.fillStyle=statusCol; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(status, W/2, H*0.88);

    /* Surface label */
    ctx.fillStyle='#1e293b'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(s.name, W/2, groundY+22);

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<canvas id="frictionCanvas" data-w="320" data-h="190" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div class="ctrl-row" style="margin-top:8px;gap:6px;flex-wrap:wrap">' +
      Object.keys(surfaces).map(function(k) {
        return '<button onclick="frSurface(\''+k+'\')" style="padding:4px 8px;border-radius:7px;font-size:10px;font-family:Nunito,sans-serif;border:1.5px solid '+(k===surface?'var(--sci)':'var(--border)')+';background:'+(k===surface?'var(--sci-dim)':'var(--surface2)')+';color:'+(k===surface?'var(--sci)':'var(--muted)')+';cursor:pointer">'+surfaces[k].name+'</button>';
      }).join('') +
      '</div>' +
      '<div class="ctrl-row" style="margin-top:8px;gap:8px;align-items:center">' +
      '<span style="font-size:11px;color:var(--muted)">Apply force:</span>' +
      '<input type="range" class="slide" min="0" max="30" value="0" step="1" oninput="frForce(this.value)" style="width:110px">' +
      '<span style="font-size:11px;font-weight:900;color:var(--text)" id="frVal">0 N</span>' +
      '<button class="cbtn" onclick="frReset()">↺ Reset</button>' +
      '</div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:9px 12px;margin-top:8px;border:1px solid var(--border);font-size:12px;color:var(--text);line-height:1.7">'+surfaces[surface].fact+'</div>';
    cancelAnimationFrame(raf); draw();
  }
  window.frSurface = function(s) { surface=s; force=0; blockX=30; moving=false; cancelAnimationFrame(raf); render(); };
  window.frForce = function(v) {
    force=parseInt(v);
    var el=document.getElementById('frVal'); if(el) el.textContent=v+' N';
    var s=surfaces[surface];
    if (force > s.mu*mass*g*10) { moving=true; }
  };
  window.frReset = function() { force=0; blockX=30; moving=false; cancelAnimationFrame(raf); render(); };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};
