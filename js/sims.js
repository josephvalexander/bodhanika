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
