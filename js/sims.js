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

/* ══════════ SCIENCE SIMULATIONS ══════════ */

/* Sink or Float */
SIM_REGISTRY['sink-float'] = function(c) {
  var items = [
    {name:'🍃 Leaf', floats:true}, {name:'🪙 Coin', floats:false},
    {name:'🧴 Cap', floats:true},  {name:'🪨 Stone', floats:false},
    {name:'🧽 Sponge', floats:true},{name:'✏️ Pencil', floats:true},
  ];
  var results = {};
  c.innerHTML = label('Drop items into the water') +
    row(items.map(function(it){
      return '<button class="cbtn" onclick="sfTest(\'' + it.name + '\',' + it.floats + ')">' + it.name + '</button>';
    }).join('')) +
    '<div id="sfPool" style="width:240px;height:100px;background:rgba(77,150,255,.15);border:2px solid var(--life);border-radius:10px;border-top:none;display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:8px;flex-wrap:wrap;font-size:20px;margin-top:8px"></div>' +
    '<div id="sfMsg" style="font-size:12px;color:var(--muted);margin-top:6px;min-height:20px"></div>';
  window.sfTest = function(name, floats) {
    var pool = document.getElementById('sfPool');
    var msg = document.getElementById('sfMsg');
    var span = document.createElement('span');
    span.title = floats ? 'Floats!' : 'Sinks!';
    span.textContent = name.split(' ')[0];
    span.style.cssText = floats
      ? 'transform:translateY(-30px);transition:transform .4s'
      : 'transform:translateY(0);opacity:.5;transition:transform .4s';
    pool.appendChild(span);
    msg.textContent = name + (floats ? ' floats — less dense than water!' : ' sinks — denser than water!');
  };
};

/* Colour Mixing */
SIM_REGISTRY['colour-mixing'] = function(c) {
  var mixes = {
    'Red+Blue':'#9B59B6 (Purple)', 'Blue+Yellow':'#27AE60 (Green)',
    'Red+Yellow':'#E67E22 (Orange)', 'All three':'#6B4226 (Brown)'
  };
  var resultStr = Object.keys(mixes).map(function(k) {
    return '<button class="cbtn" onclick="cmMix(\'' + k + '\')">' + k + '</button>';
  }).join('');
  c.innerHTML = label('Mix primary colours') + row(resultStr) +
    '<div id="cmRes" style="width:100px;height:100px;border-radius:50%;background:var(--surface2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted);text-align:center;padding:8px;margin-top:8px;transition:background .4s">Pick a mix</div>';
  window.cmMix = function(k) {
    var hex = mixes[k].split(' ')[0];
    var name = mixes[k].split(' ').slice(1).join(' ');
    var el = document.getElementById('cmRes');
    el.style.background = hex;
    el.style.color = '#fff';
    el.textContent = name;
  };
};

/* Shadow Play */
SIM_REGISTRY['shadow-play'] = function(c) {
  var dist = 50;
  c.innerHTML = label('Move the object — watch shadow size change') +
    '<div style="position:relative;width:280px;height:130px;background:rgba(0,0,0,.3);border-radius:10px;overflow:hidden;margin:4px 0" id="shadowStage">' +
    '<div id="torchIcon" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:24px">🔦</div>' +
    '<div id="shadowObj" style="position:absolute;font-size:28px;top:50%;transform:translateY(-50%);transition:left .2s">✋</div>' +
    '<div id="shadowCast" style="position:absolute;right:0;top:0;height:100%;background:rgba(0,0,0,.5);transition:width .2s"></div>' +
    '</div>' +
    row('<span style="font-size:12px;color:var(--muted)">Distance from light:</span>' +
        '<input type="range" class="slide" min="20" max="80" value="50" oninput="spUpdate(this.value)" style="width:120px">') +
    '<div id="spInfo" style="font-size:12px;color:var(--muted);margin-top:4px">Shadow is medium-sized</div>';
  window.spUpdate = function(v) {
    dist = parseInt(v);
    var pct = (80 - dist) / 60;
    document.getElementById('shadowObj').style.left = (10 + dist * 2.5) + 'px';
    var sw = Math.max(10, 100 - dist * 1.2);
    document.getElementById('shadowCast').style.width = sw + 'px';
    document.getElementById('spInfo').textContent = dist < 35
      ? 'Object close to light → BIG shadow!'
      : dist > 65 ? 'Object far from light → small shadow' : 'Shadow is medium-sized';
  };
};

/* States of Matter */
SIM_REGISTRY['states-matter'] = function(c) {
  var states = {
    'Solid ❄️': {desc:'Molecules packed tight, barely moving.', color:'var(--life)'},
    'Liquid 💧': {desc:'Molecules move freely, flow together.', color:'var(--sci)'},
    'Gas 💨': {desc:'Molecules spread far apart, move rapidly.', color:'var(--acc)'},
  };
  c.innerHTML = label('Tap a state to see molecular behaviour') +
    row(Object.keys(states).map(function(s){
      return '<button class="cbtn" onclick="smShow(\'' + s + '\')">' + s + '</button>';
    }).join('')) +
    '<canvas id="smCanvas" width="220" height="120" style="border-radius:10px;background:var(--surface);margin-top:8px"></canvas>' +
    '<div id="smDesc" style="font-size:12px;color:var(--muted);margin-top:6px;text-align:center">Choose a state</div>';
  var anim; window.simCleanup = function(){ clearInterval(anim); };
  window.smShow = function(s) {
    clearInterval(anim);
    var info = states[s]; document.getElementById('smDesc').textContent = info.desc;
    var cv = document.getElementById('smCanvas'), ctx = cv.getContext('2d');
    var count = s.includes('Solid') ? 20 : s.includes('Liquid') ? 20 : 15;
    var spread = s.includes('Solid') ? 0.3 : s.includes('Liquid') ? 1.2 : 3;
    var particles = Array.from({length:count}, function(_,i){
      return { x: 30 + (i%5)*35, y: 25 + Math.floor(i/5)*25,
               vx:(Math.random()-.5)*spread, vy:(Math.random()-.5)*spread };
    });
    anim = setInterval(function(){
      ctx.clearRect(0,0,220,120);
      particles.forEach(function(p){
        p.x += p.vx; p.y += p.vy;
        if(p.x<6||p.x>214) p.vx*=-1;
        if(p.y<6||p.y>114) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2);
        ctx.fillStyle = info.color; ctx.fill();
      });
    }, 40);
  };
};

/* Magnet */
SIM_REGISTRY['magnet-sim'] = function(c) {
  var items = [
    {n:'📎 Clip', m:true},{n:'🪙 Coin', m:true},{n:'🔑 Key', m:true},
    {n:'📏 Ruler', m:false},{n:'✏️ Pencil', m:false},{n:'🧴 Bottle', m:false},
  ];
  c.innerHTML = label('Test each item with the magnet') +
    row(items.map(function(it){
      return '<button class="cbtn" onclick="magTest(\'' + it.n + '\',' + it.m + ')">' + it.n + '</button>';
    }).join('')) +
    '<div id="magRes" style="font-size:13px;min-height:40px;margin-top:8px;text-align:center;color:var(--muted)">Pick an object</div>';
  window.magTest = function(n, m) {
    document.getElementById('magRes').innerHTML =
      '<span style="font-size:24px">' + (m ? '🧲✅' : '🧲❌') + '</span><br>' +
      n + (m ? ' is <b>magnetic</b> — contains iron or steel!' : ' is <b>not magnetic</b>.');
  };
};

/* Germination */
SIM_REGISTRY['germination'] = function(c) {
  var days = 0, interval;
  var conditions = {Normal:{sprout:4,color:'var(--evs)'}, 'No Water':{sprout:99,color:'var(--muted)'},
                    Dark:{sprout:6,color:'var(--math)'}, Cold:{sprout:12,color:'var(--life)'}};
  c.innerHTML = label('Click ▶ to watch seeds over 14 days') +
    '<div id="germGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%;margin:8px 0"></div>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
    '<button class="cbtn evs" onclick="germPlay()">▶ Start</button>' +
    '<span id="germDay" style="font-size:12px;color:var(--muted)">Day 0</span></div>';
  function render(){
    var html = '';
    Object.keys(conditions).forEach(function(k){
      var c2 = conditions[k];
      var sprouted = days >= c2.sprout;
      var h = sprouted ? 30 + Math.min(days - c2.sprout, 8)*4 : 0;
      html += '<div style="background:var(--surface2);border-radius:8px;padding:8px;text-align:center">' +
              '<div style="font-size:10px;color:var(--muted);margin-bottom:4px">' + k + '</div>' +
              '<div style="height:50px;display:flex;align-items:flex-end;justify-content:center">' +
              (sprouted ? '<div style="width:8px;height:' + h + 'px;background:' + c2.color + ';border-radius:4px 4px 0 0;transition:height .3s"></div>' : '<div style="font-size:20px">🌰</div>') +
              '</div></div>';
    });
    document.getElementById('germGrid').innerHTML = html;
    document.getElementById('germDay').textContent = 'Day ' + days;
  }
  render();
  window.germPlay = function(){
    clearInterval(interval); days = 0;
    interval = setInterval(function(){
      days++; render(); if(days >= 14){ clearInterval(interval); }
    }, 400);
  };
  window.simCleanup = function(){ clearInterval(interval); };
};

/* Pendulum (gravity) */
SIM_REGISTRY['pendulum'] = function(c) {
  var len = 100, angle = 30, running = false, theta = angle*Math.PI/180, omega = 0, raf;
  c.innerHTML = label('Adjust length and watch period change') +
    '<canvas id="pendCanvas" width="220" height="160" style="background:var(--surface2);border-radius:10px"></canvas>' +
    row('<span style="font-size:12px;color:var(--muted)">Length:</span>' +
        '<input type="range" class="slide" min="40" max="140" value="100" oninput="pendLen(this.value)" style="width:100px">') +
    row('<button class="cbtn sci" onclick="pendToggle()">▶ / ⏸</button>') +
    '<div id="pendInfo" style="font-size:12px;color:var(--muted);margin-top:4px">Length: 100 px</div>';
  var cv, ctx;
  function draw(){
    cv = cv || document.getElementById('pendCanvas');
    ctx = ctx || cv.getContext('2d');
    ctx.clearRect(0,0,220,160);
    var px = 110 + Math.sin(theta)*len, py = 20 + Math.cos(theta)*len;
    ctx.strokeStyle = 'var(--muted)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(110,20); ctx.lineTo(px,py); ctx.stroke();
    ctx.beginPath(); ctx.arc(px,py,12,0,Math.PI*2);
    ctx.fillStyle = 'var(--sci)'; ctx.fill();
  }
  function step(){
    if(!running){draw();return;}
    var g = 0.003;
    omega += -g / len * Math.sin(theta);
    theta += omega; omega *= 0.9995;
    draw(); raf = requestAnimationFrame(step);
  }
  draw();
  window.pendToggle = function(){ running = !running; if(running){theta=angle*Math.PI/180;omega=0;step();} else cancelAnimationFrame(raf); };
  window.pendLen    = function(v){ len = parseInt(v); document.getElementById('pendInfo').textContent = 'Length: ' + v + ' px'; theta=angle*Math.PI/180;omega=0;draw(); };
  window.simCleanup = function(){ running=false; cancelAnimationFrame(raf); };
};

/* Food web */
SIM_REGISTRY['food-web'] = function(c) {
  var chain = ['🌿 Grass','🦗 Grasshopper','🐸 Frog','🐍 Snake','🦅 Eagle'];
  var removed = {};
  c.innerHTML = label('Click any organism to remove it — see the effect') +
    '<div id="fwChain" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0"></div>' +
    '<div id="fwMsg" style="font-size:12px;color:var(--muted);text-align:center;min-height:36px;line-height:1.6"></div>' +
    row('<button class="cbtn evs" onclick="fwReset()">Reset</button>');
  var msgs = {
    '🌿 Grass':'No grass → nothing to eat → grasshoppers die → frogs → snakes → eagles. Total collapse!',
    '🦗 Grasshopper':'Frogs starve → snakes starve → eagle population crashes.',
    '🐸 Frog':'Snake population drops. Grasshoppers boom and over-graze the grass.',
    '🐍 Snake':'Eagle struggles for food. Frogs multiply rapidly.',
    '🦅 Eagle':'Snakes multiply unchecked → frogs decline → grasshoppers explode.',
  };
  function render(){
    var html = '';
    chain.forEach(function(org){
      html += '<div onclick="fwRemove(\'' + org + '\')" style="cursor:pointer;padding:6px 10px;border-radius:8px;font-size:13px;' +
              (removed[org] ? 'opacity:.3;text-decoration:line-through;background:var(--surface2)' : 'background:var(--evs-dim);border:1px solid var(--evs)') +
              '">' + org + '</div>';
      if(chain.indexOf(org) < chain.length-1) html += '<div style="color:var(--muted)">→</div>';
    });
    document.getElementById('fwChain').innerHTML = html;
  }
  render();
  window.fwRemove = function(org){ removed[org]=true; render(); document.getElementById('fwMsg').textContent = msgs[org]||''; };
  window.fwReset  = function(){ removed={}; render(); document.getElementById('fwMsg').textContent=''; };
};

/* Circuit */
SIM_REGISTRY['circuit-sim'] = function(c) {
  var closed = true, material = 'wire';
  var conductors = {wire:true, coin:true, nail:true, foil:true, pencil:false, rubber:false, plastic:false};
  c.innerHTML = label('Complete the circuit → bulb lights') +
    '<div id="circDiag" style="text-align:center;font-size:32px;padding:16px;background:var(--surface2);border-radius:10px;margin:6px 0">🔋 — <span id="gapItem">✂️ gap</span> — <span id="bulb">💡</span></div>' +
    row(Object.keys(conductors).map(function(m){
      return '<button class="cbtn" onclick="circTest(\'' + m + '\')">' + m + '</button>';
    }).join('')) +
    '<div id="circMsg" style="font-size:12px;color:var(--muted);margin-top:6px;text-align:center">Place an object in the gap</div>';
  window.circTest = function(m){
    var conducts = conductors[m];
    document.getElementById('gapItem').textContent = m;
    document.getElementById('bulb').textContent = conducts ? '💡✨' : '💡';
    document.getElementById('circMsg').textContent = conducts
      ? m + ' conducts! Bulb lights up — electrons can flow through.'
      : m + ' is an insulator. Bulb stays off — electrons blocked.';
  };
};

/* Photosynthesis bubbles */
SIM_REGISTRY['photo-bubbles'] = function(c) {
  var light = 50, raf, bubbles = [];
  c.innerHTML = label('Adjust light → more light = more oxygen bubbles') +
    '<canvas id="pbCanvas" width="220" height="130" style="background:rgba(77,150,255,.08);border-radius:10px;border:1px solid var(--border)"></canvas>' +
    row('<span style="font-size:12px;color:var(--muted)">☀️ Light:</span>' +
        '<input type="range" class="slide" min="0" max="100" value="50" oninput="pbLight(this.value)" style="width:120px">') +
    '<div id="pbRate" style="font-size:12px;color:var(--evs);margin-top:4px">Bubbles/min: ~30</div>';
  var cv, ctx;
  function frame(){
    cv = cv || document.getElementById('pbCanvas');
    if(!cv){cancelAnimationFrame(raf);return;}
    ctx = ctx || cv.getContext('2d');
    ctx.clearRect(0,0,220,130);
    ctx.fillStyle='var(--evs)'; ctx.font='24px serif';
    ctx.fillText('🌿',85,110);
    if(Math.random() < light/800) bubbles.push({x:100+Math.random()*20,y:100,r:2+Math.random()*3});
    bubbles = bubbles.filter(function(b){return b.y>0;});
    bubbles.forEach(function(b){
      b.y -= 1.2; b.x += (Math.random()-.5)*.5;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.stroke();
    });
    raf = requestAnimationFrame(frame);
  }
  frame();
  window.pbLight = function(v){
    light=parseInt(v);
    document.getElementById('pbRate').textContent = 'Bubbles/min: ~' + Math.round(v*.6);
  };
  window.simCleanup = function(){ cancelAnimationFrame(raf); };
};

/* Newton's laws */
SIM_REGISTRY['newtons-laws'] = function(c) {
  c.innerHTML = label('Test each law') +
    row('<button class="cbtn" onclick="nlShow(1)">Law 1: Inertia</button>' +
        '<button class="cbtn" onclick="nlShow(2)">Law 2: F=ma</button>' +
        '<button class="cbtn" onclick="nlShow(3)">Law 3: Action-Reaction</button>') +
    '<div id="nlDisplay" style="background:var(--surface2);border-radius:10px;padding:16px;margin-top:8px;min-height:80px;text-align:center;font-size:13px;line-height:1.7;color:var(--text)">Tap a law to see the demo.</div>';
  var demos = {
    1:'🏀 A rolling ball on a frictionless surface never stops.<br>Friction (a force) is what slows it in real life.<br><b>Objects resist changes to their motion.</b>',
    2:'🚗 Same force on a light car vs. a heavy truck →<br>Car accelerates much more (a = F ÷ m).<br><b>More mass → less acceleration for same force.</b>',
    3:'🎈 Air rushes out of a balloon backward →<br>Balloon flies forward.<br><b>Every action has an equal and opposite reaction.</b>',
  };
  window.nlShow = function(n){ document.getElementById('nlDisplay').innerHTML = demos[n]; };
};

/* Ohm's Law */
SIM_REGISTRY['ohms-law'] = function(c) {
  var R = 100;
  c.innerHTML = label('Adjust voltage — watch current follow V = IR') +
    row('<span style="font-size:12px;color:var(--muted)">Voltage (V):</span>' +
        '<input type="range" class="slide" min="1" max="12" value="3" oninput="ohmUpdate(this.value)" style="width:120px">') +
    '<div id="ohmDisplay" style="background:var(--surface2);border-radius:10px;padding:12px;margin-top:8px;text-align:center;font-size:14px;line-height:2"></div>' +
    '<canvas id="ohmGraph" width="200" height="80" style="margin-top:8px;border-radius:8px;background:var(--surface2)"></canvas>';
  var points = [];
  window.ohmUpdate = function(v){
    v = parseFloat(v);
    var I = (v/R*1000).toFixed(1);
    document.getElementById('ohmDisplay').innerHTML =
      'V = <b style="color:var(--math)">' + v + ' V</b>&nbsp;&nbsp;' +
      'R = <b style="color:var(--muted)">' + R + ' Ω</b>&nbsp;&nbsp;' +
      'I = <b style="color:var(--sci)">' + I + ' mA</b>';
    points.push({v,i:parseFloat(I)});
    if(points.length>12) points.shift();
    var cv=document.getElementById('ohmGraph'), ctx=cv.getContext('2d');
    ctx.clearRect(0,0,200,80);
    if(points.length<2)return;
    ctx.strokeStyle='var(--acc)'; ctx.lineWidth=2; ctx.beginPath();
    points.forEach(function(p,i){
      var x=15+(i/(points.length-1||1))*170, y=70-p.i/70*60;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
  };
  window.ohmUpdate(3);
};

/* Velocity-time */
SIM_REGISTRY['velocity-time'] = function(c) {
  var raf, t=0, v=0, running=false, accel=2, points=[];
  c.innerHTML = label('Simulate a car accelerating then braking') +
    '<canvas id="vtCanvas" width="240" height="100" style="background:var(--surface2);border-radius:10px;margin:6px 0"></canvas>' +
    row('<button class="cbtn" onclick="vtStart()">▶ Accelerate</button>' +
        '<button class="cbtn" onclick="vtBrake()">⏸ Brake</button>' +
        '<button class="cbtn" onclick="vtReset()">↺ Reset</button>') +
    '<div id="vtInfo" style="font-size:12px;color:var(--muted);margin-top:4px">Press Accelerate to start</div>';
  function draw(){
    var cv=document.getElementById('vtCanvas');if(!cv)return;
    var ctx=cv.getContext('2d');
    ctx.clearRect(0,0,240,100);
    ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.lineWidth=1;
    [25,50,75].forEach(function(y){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(240,y);ctx.stroke();});
    if(points.length<2)return;
    ctx.strokeStyle='var(--sci)'; ctx.lineWidth=2; ctx.beginPath();
    points.forEach(function(p,i){
      var x=p.t/60*230+5, y=90-p.v/30*80;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });ctx.stroke();
  }
  function frame(){
    if(!running)return;
    t++;v=Math.max(0,Math.min(30,v+accel));
    points.push({t,v});if(points.length>60)points.shift();
    draw();
    document.getElementById('vtInfo').textContent='t='+t+'s  v='+v.toFixed(1)+'m/s  a='+accel+'m/s²';
    if(t<60)raf=requestAnimationFrame(frame); else running=false;
  }
  window.vtStart=function(){running=true;accel=0.8;frame();};
  window.vtBrake=function(){accel=-1.5;if(!running){running=true;frame();}};
  window.vtReset=function(){running=false;cancelAnimationFrame(raf);t=0;v=0;points=[];draw();
    document.getElementById('vtInfo').textContent='Press Accelerate to start';};
  window.simCleanup=function(){running=false;cancelAnimationFrame(raf);};
  draw();
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
    var cv=document.getElementById('pyCanvas'), ctx=cv.getContext('2d');
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
SIM_REGISTRY['punnett'] = function(c) {
  c.innerHTML = label('Cross two parents — see offspring probabilities') +
    '<div style="display:flex;gap:12px;margin:8px 0;align-items:center">' +
    '<div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Parent 1</div>' +
    '<select id="p1" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);font-size:13px"><option>Tt</option><option>TT</option><option>tt</option></select></div>' +
    '<div>×</div>' +
    '<div><div style="font-size:11px;color:var(--muted);margin-bottom:4px">Parent 2</div>' +
    '<select id="p2" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);font-size:13px"><option>Tt</option><option>TT</option><option>tt</option></select></div>' +
    '<button class="cbtn sci" onclick="punnettCalc()">Cross!</button></div>' +
    '<div id="punnettGrid" style="display:grid;grid-template-columns:auto 1fr 1fr;gap:4px;font-size:13px;max-width:200px"></div>' +
    '<div id="punnettResult" style="font-size:12px;margin-top:8px;color:var(--muted)"></div>';
  window.punnettCalc = function(){
    var p1=document.getElementById('p1').value, p2=document.getElementById('p2').value;
    var a1=p1[0],a2=p1[1],b1=p2[0],b2=p2[1];
    var off=[[a1+b1,a1+b2],[a2+b1,a2+b2]];
    var tall=0,short=0;
    off.forEach(function(row){row.forEach(function(g){
      if(g.indexOf('T')>=0)tall++;else short++;
    });});
    var html='<div></div><div style="text-align:center;color:var(--muted)">'+b1+'</div><div style="text-align:center;color:var(--muted)">'+b2+'</div>';
    [0,1].forEach(function(r){
      html+='<div style="color:var(--muted)">'+[a1,a2][r]+'</div>';
      [0,1].forEach(function(col){
        var g=off[r][col];
        var isTall=g.indexOf('T')>=0;
        html+='<div style="background:'+(isTall?'var(--evs-dim)':'var(--sci-dim)')+';border-radius:6px;padding:5px;text-align:center;font-weight:800;color:'+(isTall?'var(--evs)':'var(--sci)')+'">'+g+'</div>';
      });
    });
    document.getElementById('punnettGrid').innerHTML=html;
    document.getElementById('punnettResult').innerHTML=
      '<b style="color:var(--evs)">Tall: '+tall+'/4</b> &nbsp; <b style="color:var(--sci)">Short: '+short+'/4</b><br>'+
      (tall===4?'All tall (TT dominant)':short===4?'All short':tall===3?'3 tall : 1 short (classic Mendel ratio!)':'1 tall : 1 short (test cross)');
  };
  window.punnettCalc();
};

/* Probability */
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
    var cv=document.getElementById('probCanvas'),ctx=cv.getContext('2d');
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
    var cv=document.getElementById('ciCanvas'),ctx=cv.getContext('2d');
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
    var cv=document.getElementById('quadCanvas'),ctx=cv.getContext('2d');
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
      var cv=document.getElementById('quadCanvas'),ctx=cv.getContext('2d');
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
    { name:'Mercury', symbol:'☿', color:'#A8A8A8', glow:'rgba(168,168,168,.4)', r:3.5,  orbitR:44,  period:4.1,   angle:0.5,  fact:'Smallest planet. A year lasts just 88 Earth days!', distance:'57.9M km', moons:0 },
    { name:'Venus',   symbol:'♀', color:'#E8C56A', glow:'rgba(232,197,106,.4)', r:6,    orbitR:62,  period:10.5,  angle:2.1,  fact:'Hottest planet at 465°C — hotter than Mercury!', distance:'108M km', moons:0 },
    { name:'Earth',   symbol:'🌍', color:'#4D96FF', glow:'rgba(77,150,255,.4)',  r:6.5,  orbitR:82,  period:16.7,  angle:1.0,  fact:'Only known planet with life. 71% covered by ocean.', distance:'150M km', moons:1 },
    { name:'Mars',    symbol:'♂', color:'#E8634A', glow:'rgba(232,99,74,.4)',   r:4.5,  orbitR:104, period:31.5,  angle:3.8,  fact:'Has Olympus Mons — 3× taller than Mt. Everest!', distance:'228M km', moons:2 },
    { name:'Jupiter', symbol:'♃', color:'#C8945A', glow:'rgba(200,148,90,.4)',  r:13,   orbitR:135, period:197,   angle:2.4,  fact:'King of planets. Its Great Red Spot is a storm older than 350 years!', distance:'778M km', moons:95 },
    { name:'Saturn',  symbol:'♄', color:'#E8D06A', glow:'rgba(232,208,106,.4)', r:11,   orbitR:165, period:490,   angle:5.1,  fact:'So light it could float on water! Rings stretch 282,000 km.', distance:'1.43B km', moons:146 },
    { name:'Uranus',  symbol:'⛢', color:'#6BCBB8', glow:'rgba(107,203,184,.4)', r:8,    orbitR:192, period:1400,  angle:0.8,  fact:'Spins on its side at 98°! Rotates the wrong way.', distance:'2.87B km', moons:28 },
    { name:'Neptune', symbol:'♆', color:'#4D70FF', glow:'rgba(77,112,255,.4)',  r:7.5,  orbitR:215, period:2750,  angle:4.2,  fact:'Farthest planet. Winds reach 2,100 km/h — fastest in the solar system!', distance:'4.5B km', moons:16 },
  ];

  var selected   = null;
  var animating  = true;
  var speed      = 1;
  var startTime  = Date.now();
  var pausedAt   = 0;
  var raf;
  var W = 460, H = 460, CX = 230, CY = 230;
  var starsCache = null;

  /* ── Generate stars once ── */
  function makeStars() {
    if (starsCache) return starsCache;
    var s = '', seed = 99;
    function rand() { seed = (seed*1664525+1013904223)&0xffffffff; return Math.abs(seed)/0xffffffff; }
    for (var i = 0; i < 120; i++) {
      var sx=rand()*W, sy=rand()*H, sr=rand()*1.3+0.2, op=rand()*.7+.15;
      var d=Math.sqrt((sx-CX)*(sx-CX)+(sy-CY)*(sy-CY));
      if (d<32) continue;
      var twinkle = rand()>.7 ? ' opacity="'+op+'"><animate attributeName="opacity" values="'+op+';'+(op*.4)+';'+op+'" dur="'+(rand()*3+2).toFixed(1)+'s" repeatCount="indefinite"/></circle>' : '" opacity="'+op+'"/>';
      s += '<circle cx="'+sx+'" cy="'+sy+'" r="'+sr+'" fill="white'+twinkle;
    }
    starsCache = s;
    return s;
  }

  /* ── Build full SVG ── */
  function buildSVG(t) {
    var orbitLines = planets.map(function(p) {
      var sel = selected !== null && planets[selected] === p;
      return '<circle cx="'+CX+'" cy="'+CY+'" r="'+p.orbitR+'" fill="none" ' +
        'stroke="'+(sel?p.color:'rgba(255,255,255,0.07)')+'" stroke-width="'+(sel?'1.5':'1')+'" ' +
        'stroke-dasharray="'+(sel?'5,3':'3,5')+'"/>';
    }).join('');

    var planetEls = planets.map(function(p, i) {
      var angle = p.angle + (animating ? t * speed / p.period : pausedAt / p.period);
      var px = CX + Math.cos(angle) * p.orbitR;
      var py = CY + Math.sin(angle) * p.orbitR;
      var sel = selected === i;
      var out = '';

      /* Saturn rings — drawn behind planet */
      if (p.name === 'Saturn') {
        out += '<ellipse cx="'+px+'" cy="'+py+'" rx="'+(p.r*2.2)+'" ry="'+(p.r*0.55)+'" ' +
          'fill="none" stroke="'+p.color+'" stroke-width="3" stroke-opacity="0.55" ' +
          'transform="rotate(-25,'+px+','+py+')"/>';
        out += '<ellipse cx="'+px+'" cy="'+py+'" rx="'+(p.r*1.7)+'" ry="'+(p.r*0.4)+'" ' +
          'fill="none" stroke="#B8A050" stroke-width="1.5" stroke-opacity="0.3" ' +
          'transform="rotate(-25,'+px+','+py+')"/>';
      }

      /* Moon for Earth */
      if (p.name === 'Earth') {
        var ma = angle * 10;
        var mx = px + Math.cos(ma)*11, my = py + Math.sin(ma)*11;
        out += '<circle cx="'+mx+'" cy="'+my+'" r="1.8" fill="#C8C8C8" opacity="0.7"/>';
      }

      /* Selection ring */
      if (sel) {
        out += '<circle cx="'+px+'" cy="'+py+'" r="'+(p.r+7)+'" fill="none" ' +
          'stroke="'+p.color+'" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7">' +
          '<animateTransform attributeName="transform" type="rotate" from="0 '+px+' '+py+'" to="360 '+px+' '+py+'" dur="3s" repeatCount="indefinite"/>' +
          '</circle>';
      }

      /* Glow behind planet */
      out += '<circle cx="'+px+'" cy="'+py+'" r="'+(p.r+4)+'" fill="'+p.glow+'"/>';

      /* Planet body with gradient */
      out += '<defs><radialGradient id="pg'+i+'" cx="35%" cy="35%">' +
        '<stop offset="0%" stop-color="white" stop-opacity="0.3"/>' +
        '<stop offset="100%" stop-color="'+p.color+'"/>' +
        '</radialGradient></defs>';

      out += '<circle cx="'+px+'" cy="'+py+'" r="'+(sel?p.r+1.5:p.r)+'" ' +
        'fill="url(#pg'+i+')" style="cursor:pointer" ' +
        'onclick="solarClick('+i+')" data-name="'+p.name+'"/>';

      /* Planet name label */
      if (sel || p.r > 10) {
        var lx = px + (px > CX ? p.r+5 : -(p.r+5));
        var anchor = px > CX ? 'start' : 'end';
        out += '<text x="'+lx+'" y="'+(py+4)+'" fill="'+p.color+'" ' +
          'font-size="9" font-weight="bold" font-family="Nunito,sans-serif" ' +
          'text-anchor="'+anchor+'" style="cursor:pointer" onclick="solarClick('+i+')">'+p.name+'</text>';
      }

      return out;
    }).join('');

    /* Sun with corona */
    var sun = '<defs>' +
      '<radialGradient id="sunG" cx="40%" cy="40%">' +
      '<stop offset="0%" stop-color="#FFF7AA"/>' +
      '<stop offset="60%" stop-color="#FFD93D"/>' +
      '<stop offset="100%" stop-color="#FF8C00"/>' +
      '</radialGradient>' +
      '<filter id="sunGlow"><feGaussianBlur stdDeviation="4" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<circle cx="'+CX+'" cy="'+CY+'" r="32" fill="#FFD93D" opacity="0.08"/>' +
      '<circle cx="'+CX+'" cy="'+CY+'" r="26" fill="#FFD93D" opacity="0.12"/>' +
      '<circle cx="'+CX+'" cy="'+CY+'" r="20" fill="url(#sunG)" filter="url(#sunGlow)" ' +
        'style="cursor:pointer" onclick="solarClick(-1)"/>' +
      (selected===-1?'<circle cx="'+CX+'" cy="'+CY+'" r="27" fill="none" stroke="#FFD93D" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"><animateTransform attributeName="transform" type="rotate" from="0 '+CX+' '+CY+'" to="360 '+CX+' '+CY+'" dur="4s" repeatCount="indefinite"/></circle>':'');

    return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;cursor:default;' +
      'background:radial-gradient(ellipse at 50% 50%,#080820 0%,#020208 70%,#000 100%);' +
      'border-radius:12px">' +
      makeStars() +
      orbitLines + sun + planetEls +
      '</svg>';
  }

  /* ── Info panel ── */
  function renderInfo() {
    var el = document.getElementById('ssInfo');
    if (!el) return;
    if (selected === null) {
      el.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px 0">☝️ Tap any planet or the Sun to explore it</div>';
      return;
    }
    if (selected === -1) {
      el.innerHTML =
        '<div style="display:flex;gap:12px;align-items:center">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFF7AA,#FF8C00);box-shadow:0 0 20px #FFD93D88;flex-shrink:0"></div>' +
        '<div><div style="font-size:15px;font-weight:900;color:#FFD93D">☀️ The Sun</div>' +
        '<div style="font-size:11px;color:var(--muted);line-height:1.7">109× wider than Earth · Surface: 5,500°C · Core: 15 million°C · 8 planets orbit it!</div>' +
        '</div></div>';
      return;
    }
    var p = planets[selected];
    el.innerHTML =
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="width:'+Math.max(28,p.r*3)+'px;height:'+Math.max(28,p.r*3)+'px;border-radius:50%;' +
        'background:radial-gradient(circle at 35% 35%,white,'+p.color+');' +
        'box-shadow:0 0 16px '+p.glow+';flex-shrink:0;margin-top:2px"></div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:16px;font-weight:900;color:'+p.color+'">'+p.symbol+' '+p.name+'</div>' +
      '<div style="display:flex;gap:12px;margin:3px 0 5px;flex-wrap:wrap">' +
      '<span style="font-size:10px;color:var(--muted)">📏 '+p.distance+' from Sun</span>' +
      '<span style="font-size:10px;color:var(--muted)">🌙 '+p.moons+' moon'+(p.moons!==1?'s':'')+'</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text);line-height:1.7">'+p.fact+'</div>' +
      '</div></div>';
  }

  /* ── Initial HTML ── */
  c.innerHTML =
    '<div id="ssSvgWrap" style="width:100%;border-radius:12px;overflow:hidden;' +
      'box-shadow:0 0 60px rgba(255,200,50,.06),0 0 0 1px rgba(255,255,255,.05)"></div>' +
    '<div id="ssInfo" style="margin-top:10px;background:var(--surface2);border-radius:12px;' +
      'padding:11px 14px;min-height:56px;border:1px solid var(--border);transition:all .3s">' +
    '<div style="color:var(--muted);font-size:12px;text-align:center;padding:8px 0">☝️ Tap any planet or the Sun to explore it</div>' +
    '</div>' +
    '<div class="ctrl-row" style="margin-top:10px;gap:8px">' +
    '<button class="cbtn" onclick="solarToggle()" id="solarBtn" style="font-size:12px">⏸ Pause</button>' +
    '<span style="font-size:11px;color:var(--muted)">Speed:</span>' +
    '<input type="range" class="slide" min="1" max="5" value="1" oninput="solarSpeed(this.value)" style="width:80px">' +
    '<button class="cbtn" onclick="solarZoom()" id="solarZoomBtn" style="font-size:12px">🔭 Inner</button>' +
    '</div>';

  /* ── Animation loop ── */
  var zoomed = false;
  function tick() {
    var wrap = document.getElementById('ssSvgWrap');
    if (!wrap) { cancelAnimationFrame(raf); return; }
    var t = (Date.now() - startTime) / 1000;
    wrap.innerHTML = buildSVG(t);
    raf = requestAnimationFrame(tick);
  }
  tick();

  /* ── Controls ── */
  window.solarClick = function(i) {
    selected = selected === i ? null : i;
    renderInfo();
  };

  window.solarToggle = function() {
    animating = !animating;
    if (!animating) pausedAt = (Date.now() - startTime) / 1000 * speed;
    else startTime = Date.now() - pausedAt / speed * 1000;
    document.getElementById('solarBtn').textContent = animating ? '⏸ Pause' : '▶ Resume';
  };

  window.solarSpeed = function(v) { speed = parseFloat(v); };

  window.solarZoom = function() {
    zoomed = !zoomed;
    planets.forEach(function(p, i) {
      p._orig = p._orig || p.orbitR;
      p.orbitR = zoomed ? (i < 4 ? p._orig * 2 : p._orig * 0.3) : p._orig;
    });
    document.getElementById('solarZoomBtn').textContent = zoomed ? '🌌 Full View' : '🔭 Inner';
  };

  window.simCleanup = function() { cancelAnimationFrame(raf); };
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
      '<canvas id="microCanvas" width="240" height="160" style="width:100%;height:100%;' +
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

    var cv = document.getElementById('microCanvas');
    var ctx = cv.getContext('2d');
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
    var cv = document.getElementById('microCanvas');
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
    var cv = document.getElementById('stateCanvas');
    var ctx = cv.getContext('2d');
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
        var ctx = canvas.getContext('2d');
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
        var ctx = canvas.getContext('2d');
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
        var ctx = canvas.getContext('2d');
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
      '<canvas id="newtonCanvas" width="280" height="120" style="border-radius:12px;background:var(--surface2);border:1px solid var(--border);cursor:pointer;display:block;width:100%"></canvas>' +
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

    var canvas = document.getElementById('newtonCanvas');
    l.run(canvas);
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

    var cv = document.getElementById('dnaCanvas');
    var ctx = cv.getContext('2d');
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

