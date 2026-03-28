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
  W=c.offsetWidth||340; H=W;
  canvas.width=W; canvas.height=H;
  CX=W/2; CY=H/2;
  ctx=canvas.getContext('2d');
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


/* ══════════════════════════════════════════════════
   TIER 1 BATCH 2 — 10 more flagship interactive sims
   ══════════════════════════════════════════════════ */

/* ── WATER CYCLE (terrarium-cycle) ── */
SIM_REGISTRY['terrarium-cycle'] = function(c) {
  var raf, t = 0;
  var stage = 'day'; // day | rain | night
  var drops = [], clouds = [], vapour = [];

  c.innerHTML =
    '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;text-align:center">🌊 The Water Cycle</div>' +
    '<canvas id="wcCanvas" width="320" height="200" style="border-radius:12px;display:block;margin:0 auto;width:100%"></canvas>' +
    '<div id="wcStage" style="font-size:12px;color:var(--evs);font-weight:700;text-align:center;margin:8px 0;min-height:20px"></div>' +
    '<div class="ctrl-row">' +
    '<button class="cbtn evs" onclick="wcSet(\'day\')">☀️ Heat</button>' +
    '<button class="cbtn" onclick="wcSet(\'rain\')">🌧️ Rain</button>' +
    '<button class="cbtn" onclick="wcSet(\'night\')">🌙 Cool</button>' +
    '</div>';

  var stages = {
    day:   { label:'☀️ Evaporation — Sun heats water → rises as vapour', sky1:'#1a3a6b', sky2:'#2d5a8e' },
    rain:  { label:'🌧️ Precipitation — Clouds cool → water falls as rain', sky1:'#1a1a2e', sky2:'#2a2a4e' },
    night: { label:'🌙 Condensation — Cool air → water vapour forms clouds', sky1:'#0a0a1a', sky2:'#0f0f2a' },
  };

  var cv, ctx;
  function frame() {
    cv = cv || document.getElementById('wcCanvas');
    if (!cv) { cancelAnimationFrame(raf); return; }
    ctx = ctx || cv.getContext('2d');
    var W = cv.width, H = cv.height;
    t += 0.02;

    /* Sky gradient */
    var sg = ctx.createLinearGradient(0,0,0,H*.6);
    sg.addColorStop(0, stages[stage].sky1);
    sg.addColorStop(1, stages[stage].sky2);
    ctx.fillStyle = sg; ctx.fillRect(0,0,W,H*.65);

    /* Ground */
    var gg = ctx.createLinearGradient(0,H*.62,0,H);
    gg.addColorStop(0,'#2d5a1b'); gg.addColorStop(1,'#1a3a0a');
    ctx.fillStyle = gg; ctx.fillRect(0,H*.62,W,H*.38);

    /* Water body */
    ctx.fillStyle='rgba(77,150,255,0.6)';
    ctx.beginPath(); ctx.ellipse(W*.75,H*.7,W*.2,H*.08,0,0,Math.PI*2); ctx.fill();
    /* Water ripple */
    ctx.strokeStyle='rgba(77,150,255,0.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(W*.75,H*.7,W*.22+Math.sin(t)*3,H*.09,0,0,Math.PI*2); ctx.stroke();

    /* Sun or moon */
    if (stage==='day') {
      var glow = ctx.createRadialGradient(W*.2,H*.15,5,W*.2,H*.15,30);
      glow.addColorStop(0,'rgba(255,220,50,0.4)'); glow.addColorStop(1,'transparent');
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(W*.2,H*.15,30,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFD93D'; ctx.beginPath(); ctx.arc(W*.2,H*.15,18,0,Math.PI*2); ctx.fill();
      /* Sun rays */
      for(var r=0;r<8;r++) {
        var ra=r/8*Math.PI*2+t*.5;
        ctx.strokeStyle='rgba(255,217,61,0.4)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(W*.2+Math.cos(ra)*20,H*.15+Math.sin(ra)*20);
        ctx.lineTo(W*.2+Math.cos(ra)*28,H*.15+Math.sin(ra)*28); ctx.stroke();
      }
    } else {
      ctx.fillStyle='rgba(220,220,255,0.9)'; ctx.beginPath(); ctx.arc(W*.2,H*.15,12,0,Math.PI*2); ctx.fill();
    }

    /* Vapour arrows (evaporation) */
    if (stage==='day') {
      if (Math.random()<.08) vapour.push({x:W*.65+Math.random()*W*.2,y:H*.68,op:0.8,dy:-0.8});
      vapour.forEach(function(v) { v.y+=v.dy; v.op-=0.01; v.x+=Math.sin(t+v.y)*0.3; });
      vapour = vapour.filter(function(v){return v.op>0;});
      vapour.forEach(function(v) {
        ctx.fillStyle='rgba(180,220,255,'+v.op+')';
        ctx.beginPath(); ctx.arc(v.x,v.y,3,0,Math.PI*2); ctx.fill();
      });
      /* Arrow up */
      ctx.fillStyle='rgba(107,203,119,0.7)'; ctx.font='bold 16px sans-serif';
      ctx.fillText('↑↑↑',W*.68,H*.55+Math.sin(t)*3);
      document.getElementById('wcStage').textContent = stages[stage].label;
    }

    /* Clouds */
    if (!clouds.length) clouds = [{x:W*.5,y:H*.2,w:60},{x:W*.3,y:H*.25,w:45}];
    if (stage==='rain') clouds.forEach(function(cl){cl.x -= 0.2; if(cl.x<-60)cl.x=W+60;});
    clouds.forEach(function(cl) {
      ctx.fillStyle='rgba(180,180,200,0.85)';
      [[0,0,cl.w*.5],[cl.w*.25,-12,cl.w*.4],[cl.w*.55,-8,cl.w*.38],[cl.w,0,cl.w*.45]].forEach(function(p) {
        ctx.beginPath(); ctx.arc(cl.x+p[0],cl.y+p[1],p[2],0,Math.PI*2); ctx.fill();
      });
    });

    /* Rain drops */
    if (stage==='rain') {
      if (Math.random()<.15) drops.push({x:Math.random()*W,y:0,speed:4+Math.random()*3});
      drops.forEach(function(d) { d.y+=d.speed; });
      drops = drops.filter(function(d){return d.y<H;});
      drops.forEach(function(d) {
        ctx.strokeStyle='rgba(77,150,255,0.6)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-1,d.y+8); ctx.stroke();
      });
      document.getElementById('wcStage').textContent = stages[stage].label;
    }

    /* Labels */
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='9px Nunito,sans-serif';
    ctx.fillText('🌊 Ocean',W*.65,H*.85);
    ctx.fillText('🌿 Land',W*.15,H*.85);

    raf = requestAnimationFrame(frame);
  }

  window.wcSet = function(s) { stage=s; drops=[]; vapour=[]; };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  frame();
};

/* ── HUMAN DIGESTIVE SYSTEM (digestion-sim) ── */
SIM_REGISTRY['digestion-sim'] = function(c) {
  var step = -1; // -1 = overview
  var organs = [
    { name:'👄 Mouth',          color:'#FF6B6B', x:.45, y:.08, r:18, desc:'Teeth chew food into smaller pieces. Saliva contains enzymes that start breaking down starch. Food becomes a soft ball called a bolus.' },
    { name:'🫁 Oesophagus',     color:'#FFD93D', x:.45, y:.22, r:10, desc:'A muscular tube 25cm long. Wave-like contractions called peristalsis push food down to the stomach in about 8 seconds.' },
    { name:'💛 Stomach',        color:'#FF8C00', x:.4,  y:.38, r:22, desc:'Churns food for 2–4 hours. Produces hydrochloric acid (pH 1.5–3) to kill bacteria and break down proteins. Food becomes liquid chyme.' },
    { name:'🟢 Small Intestine',color:'#6BCB77', x:.5,  y:.56, r:16, desc:'6–7 metres long, coiled up! Absorbs 90% of nutrients into the blood. Finger-like villi increase surface area to the size of a tennis court.' },
    { name:'🔵 Large Intestine',color:'#4D96FF', x:.38, y:.72, r:14, desc:'1.5 metres long. Absorbs water from waste. Converts remaining material into faeces over 12–48 hours.' },
  ];

  function render() {
    c.innerHTML =
      '<div style="display:flex;gap:8px;width:100%">' +
      /* Body diagram */
      '<div style="flex:0 0 140px;position:relative;height:260px">' +
      /* Body outline SVG */
      '<svg viewBox="0 0 100 260" width="140" height="260" style="position:absolute;left:0;top:0">' +
      /* Body silhouette */
      '<ellipse cx="50" cy="20" rx="22" ry="18" fill="#2a2a4a" stroke="rgba(255,255,255,.1)" stroke-width="1"/>' +
      '<rect x="28" y="38" width="44" height="80" rx="8" fill="#2a2a4a" stroke="rgba(255,255,255,.1)" stroke-width="1"/>' +
      '<rect x="22" y="118" width="56" height="80" rx="6" fill="#2a2a4a" stroke="rgba(255,255,255,.1)" stroke-width="1"/>' +
      /* Organ circles */
      organs.map(function(o, i) {
        var sel = step === i;
        return '<circle cx="'+(o.x*100)+'" cy="'+(o.y*260)+'" r="'+(sel?o.r+3:o.r)+'" ' +
          'fill="'+o.color+'" opacity="'+(step===-1?0.85:sel?1:0.3)+'" ' +
          'style="cursor:pointer;transition:all .3s" onclick="digestClick('+i+')"/>';
      }).join('') +
      /* Food particle animation */
      (step>=0?'<circle r="5" fill="rgba(255,220,100,0.9)">' +
        '<animateMotion dur="3s" repeatCount="indefinite" path="M45,20 L45,58 Q40,80 38,100 Q50,130 50,148 Q42,180 38,190"/>' +
        '</circle>':'') +
      '</svg></div>' +
      /* Info panel */
      '<div style="flex:1;display:flex;flex-direction:column;gap:8px">' +
      (step===-1 ?
        '<div style="font-size:13px;font-weight:900;color:var(--text);margin-bottom:4px">Digestive System</div>' +
        '<div style="font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:8px">Food takes 24–72 hours to travel through the full digestive system. Tap each organ to explore!</div>' +
        organs.map(function(o,i) {
          return '<button onclick="digestClick('+i+')" style="text-align:left;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer;width:100%;font-family:Nunito,sans-serif;font-size:12px;color:var(--text)">' + o.name + '</button>';
        }).join('') :
        '<div style="font-size:15px;font-weight:900;color:'+organs[step].color+';margin-bottom:6px">'+organs[step].name+'</div>' +
        '<div style="font-size:12px;color:var(--text);line-height:1.75;flex:1">'+organs[step].desc+'</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px">' +
        (step>0?'<button class="cbtn" onclick="digestClick('+(step-1)+')">← Prev</button>':'') +
        '<button class="cbtn" onclick="digestClick(-1)" style="font-size:11px">Overview</button>' +
        (step<organs.length-1?'<button class="cbtn evs" onclick="digestClick('+(step+1)+')">Next →</button>':'') +
        '</div>'
      ) +
      '</div></div>';
  }

  window.digestClick = function(i) { step = i; render(); };
  render();
};

/* ── ELECTRICITY CIRCUIT BUILDER (conductor-test) ── */
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
SIM_REGISTRY['fraction-fold'] = function(c) {
  var num = 1, den = 2;

  function render() {
    var frac = num/den;
    var cells = [];
    for(var i=0;i<den;i++) cells.push(i<num);

    /* Pie chart SVG */
    function pie(n, d, size) {
      if(d===0) return '';
      var cx=size/2, cy=size/2, r=size/2-4;
      var slices = '';
      var angle = -Math.PI/2;
      var step = (Math.PI*2)/d;
      for(var i=0;i<d;i++) {
        var a1=angle, a2=angle+step;
        var x1=cx+Math.cos(a1)*r, y1=cy+Math.sin(a1)*r;
        var x2=cx+Math.cos(a2)*r, y2=cy+Math.sin(a2)*r;
        var large=step>Math.PI?1:0;
        var filled=i<n;
        slices+='<path d="M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+large+',1 '+x2+','+y2+' Z" ' +
          'fill="'+(filled?'var(--sci)':'var(--surface2)')+'" stroke="var(--border)" stroke-width="1.5"/>';
        angle+=step;
      }
      return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="var(--surface2)" stroke="var(--border)" stroke-width="1.5"/>'+
        slices+'</svg>';
    }

    /* Number line */
    var nlW=240, marks='';
    for(var i=0;i<=den;i++) {
      var x=10+(i/den)*(nlW-20);
      marks+='<line x1="'+x+'" y1="18" x2="'+x+'" y2="30" stroke="var(--muted)" stroke-width="1.5"/>';
      marks+='<text x="'+x+'" y="14" text-anchor="middle" font-size="9" fill="var(--muted)">'+i+'/'+den+'</text>';
    }
    var markerX=10+(frac)*(nlW-20);
    marks+='<rect x="10" y="20" width="'+(markerX-10)+'" height="10" rx="3" fill="var(--sci)" opacity="0.7"/>';
    marks+='<circle cx="'+markerX+'" cy="25" r="5" fill="var(--sci)"/>';

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center">🍕 Fraction Explorer</div>' +
      /* Big fraction display */
      '<div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:12px">' +
      pie(num,den,110) +
      '<div style="text-align:center">' +
      '<div style="font-size:48px;font-weight:900;color:var(--sci);line-height:1;border-bottom:4px solid var(--sci);padding-bottom:4px">'+num+'</div>' +
      '<div style="font-size:48px;font-weight:900;color:var(--text);line-height:1">'+den+'</div>' +
      '<div style="font-size:13px;color:var(--muted);margin-top:6px">'+(frac*100).toFixed(1)+'%</div>' +
      '<div style="font-size:12px;color:var(--muted)">'+(frac).toFixed(3)+'</div>' +
      '</div></div>' +
      /* Number line */
      '<svg width="'+nlW+'" height="36" viewBox="0 0 '+nlW+' 36" style="display:block;margin:0 auto 12px">' +
      '<line x1="10" y1="25" x2="'+(nlW-10)+'" y2="25" stroke="var(--border)" stroke-width="2"/>' +
      marks + '</svg>' +
      /* Controls */
      '<div style="display:flex;gap:16px;justify-content:center;align-items:center;flex-wrap:wrap">' +
      '<div style="text-align:center">' +
      '<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Numerator</div>' +
      '<div style="display:flex;gap:6px;align-items:center">' +
      '<button class="cbtn" onclick="fracNum(-1)" style="width:30px;padding:4px">−</button>' +
      '<span style="font-size:20px;font-weight:900;color:var(--sci);min-width:24px;text-align:center">'+num+'</span>' +
      '<button class="cbtn" onclick="fracNum(1)" style="width:30px;padding:4px">+</button>' +
      '</div></div>' +
      '<div style="text-align:center">' +
      '<div style="font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Denominator</div>' +
      '<div style="display:flex;gap:6px;align-items:center">' +
      '<button class="cbtn" onclick="fracDen(-1)" style="width:30px;padding:4px">−</button>' +
      '<span style="font-size:20px;font-weight:900;color:var(--text);min-width:24px;text-align:center">'+den+'</span>' +
      '<button class="cbtn" onclick="fracDen(1)" style="width:30px;padding:4px">+</button>' +
      '</div></div></div>' +
      /* Quick fractions */
      '<div class="ctrl-row" style="margin-top:10px">' +
      [[1,2],[1,3],[2,3],[1,4],[3,4],[1,8]].map(function(f) {
        return '<button class="cbtn" onclick="fracSet('+f[0]+','+f[1]+')" style="font-size:11px">'+f[0]+'/'+f[1]+'</button>';
      }).join('') + '</div>';

    window.fracNum = function(d) { num=Math.max(0,Math.min(den,num+d)); render(); };
    window.fracDen = function(d) { den=Math.max(1,Math.min(12,den+d)); num=Math.min(num,den); render(); };
    window.fracSet = function(n,d) { num=n; den=d; render(); };
  }
  render();
};

/* ── SIMPLE MACHINES (simple-machines) ── */
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
SIM_REGISTRY['ph-indicator'] = function(c) {
  var ph = 7;
  var substances = [
    { name:'Lemon juice',    ph:2.0, emoji:'🍋' },
    { name:'Vinegar',        ph:2.9, emoji:'🫙' },
    { name:'Coffee',         ph:5.0, emoji:'☕' },
    { name:'Rain water',     ph:5.6, emoji:'🌧️' },
    { name:'Pure water',     ph:7.0, emoji:'💧' },
    { name:'Blood',          ph:7.4, emoji:'🩸' },
    { name:'Baking soda',    ph:8.3, emoji:'🥄' },
    { name:'Soap',           ph:9.5, emoji:'🧼' },
    { name:'Bleach',         ph:12.5,emoji:'🫧' },
  ];

  function phColor(p) {
    if(p<=3)  return '#FF3333';
    if(p<=5)  return '#FF8833';
    if(p<=6)  return '#FFCC33';
    if(p<=7)  return '#88CC44';
    if(p<=8)  return '#44CC88';
    if(p<=10) return '#4488FF';
    return '#8844FF';
  }

  function phLabel(p) {
    if(p<=3)  return 'Strong Acid 🔴';
    if(p<=6)  return 'Weak Acid 🟠';
    if(p<=7.5)return 'Neutral 🟢';
    if(p<=10) return 'Weak Base 🔵';
    return 'Strong Base 🟣';
  }

  function render() {
    var col = phColor(ph);
    /* pH bar gradient */
    var barGrad = 'linear-gradient(to right,#FF3333 0%,#FF8833 25%,#FFCC33 40%,#88CC44 50%,#44CC88 60%,#4488FF 75%,#8844FF 100%)';
    var markerPct = ((ph-1)/13*100).toFixed(1);

    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🧪 pH Indicator Lab</div>' +
      /* Big beaker with colour */
      '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:12px">' +
      '<svg viewBox="0 0 80 100" width="80" height="100">' +
      '<polygon points="10,10 70,10 80,100 0,100" fill="'+col+'33" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>' +
      '<rect x="1" y="'+(100-(ph/14*90))+'" width="78" height="'+(ph/14*90)+'" fill="'+col+'" opacity="0.35"/>' +
      '<polygon points="10,10 70,10 80,100 0,100" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2"/>' +
      /* Cabbage indicator drop */
      '<circle cx="40" cy="50" r="12" fill="'+col+'" opacity="0.8"/>' +
      '<text x="40" y="54" text-anchor="middle" font-size="10" fill="white">'+ph.toFixed(1)+'</text>' +
      '</svg>' +
      '<div>' +
      '<div style="font-size:36px;font-weight:900;color:'+col+'">'+ph.toFixed(1)+'</div>' +
      '<div style="font-size:13px;font-weight:700;color:'+col+'">'+phLabel(ph)+'</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:4px">'+(ph<7?'H⁺ ions > OH⁻':ph===7?'H⁺ = OH⁻':'OH⁻ ions > H⁺')+'</div>' +
      '</div></div>' +
      /* pH bar */
      '<div style="position:relative;height:20px;border-radius:10px;background:'+barGrad+';margin-bottom:16px;border:1px solid rgba(255,255,255,.1)">' +
      '<div style="position:absolute;top:-6px;left:calc('+markerPct+'% - 8px);width:16px;height:32px;' +
        'background:white;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>' +
      '<div style="position:absolute;top:22px;left:0;font-size:8px;color:var(--muted)">1</div>' +
      '<div style="position:absolute;top:22px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--muted)">7</div>' +
      '<div style="position:absolute;top:22px;right:0;font-size:8px;color:var(--muted)">14</div>' +
      '</div>' +
      /* Slider */
      '<div class="ctrl-row" style="margin:4px 0 12px">' +
      '<span style="font-size:11px;color:var(--muted)">pH:</span>' +
      '<input type="range" class="slide" min="1" max="14" step="0.1" value="'+ph+'" oninput="phSet(this.value)" style="width:160px">' +
      '</div>' +
      /* Substances */
      '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center">' +
      substances.map(function(s) {
        var active = Math.abs(s.ph-ph)<0.3;
        return '<button onclick="phSet('+s.ph+')" style="' +
          'background:'+(active?phColor(s.ph)+'33':'var(--surface2)')+';' +
          'border:1.5px solid '+(active?phColor(s.ph):'var(--border)')+';' +
          'border-radius:8px;padding:5px 8px;cursor:pointer;font-family:Nunito,sans-serif;' +
          'font-size:11px;color:var(--text)">'+s.emoji+' '+s.name+'</button>';
      }).join('') + '</div>';

    window.phSet = function(v) { ph=parseFloat(v); render(); };
  }
  render();
};

/* ── LIGHT REFLECTION (reflection-sim) ── */
SIM_REGISTRY['reflection-sim'] = function(c) {
  var angle = 45;
  var mirror = 'flat';
  var raf, t = 0;

  var mirrors = { flat:'🪞 Flat', concave:'🔎 Concave', convex:'🔍 Convex' };

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🪞 Light & Reflection Lab</div>' +
      '<canvas id="refCanvas" width="300" height="180" style="border-radius:12px;background:#050510;border:1px solid var(--border);display:block;margin:0 auto;width:100%"></canvas>' +
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

    var cv = document.getElementById('refCanvas');
    var ctx = cv.getContext('2d');
    cancelAnimationFrame(raf);

    function draw() {
      t += 0.03;
      var W=cv.width, H=cv.height, cx=W/2, my=H-30;
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
    var cv = document.getElementById('wcCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
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
      '<canvas id="wcCanvas" width="320" height="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin:8px 0;font-size:12px;color:var(--text);line-height:1.7;border:1px solid var(--border)">' + stages[stage].desc + '</div>' +
      '<div class="ctrl-row">' +
      stages.map(function(s,i){
        return '<button class="cbtn" onclick="wcStage('+i+')" style="font-size:11px;padding:6px 10px;' +
          (i===stage?'background:var(--acc);color:white;border-color:var(--acc)':'') + '">' + s.name + '</button>';
      }).join('') +
      '</div>';
    cancelAnimationFrame(raf);
    draw();
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
    var cv = document.getElementById('digestCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    t += 0.03;
    drawSystem(ctx, cv.width, cv.height, step, t);
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
    var cv = document.getElementById('convCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W=cv.width, H=cv.height;
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
    '<canvas id="convCanvas" width="300" height="200" style="border-radius:12px;display:block;width:100%"></canvas>' +
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
    var cv=document.getElementById('emCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
    '<canvas id="emCanvas" width="300" height="260" style="border-radius:12px;display:block;width:100%;cursor:ew-resize"></canvas>'+
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
    var cv=document.getElementById('projCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
      '<canvas id="projCanvas" width="300" height="190" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    draw();
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
    var cv=document.getElementById('titCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
    '<canvas id="titCanvas" width="280" height="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv = document.getElementById('atomCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
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
      '<canvas id="atomCanvas" width="280" height="240" style="border-radius:12px;display:block;width:100%"></canvas>' +
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
    var cv=document.getElementById('coordCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width, H=cv.height;
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
      '<canvas id="coordCanvas" width="270" height="270" style="border-radius:12px;display:block;width:100%;cursor:crosshair"></canvas>'+
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
    var cv=document.getElementById('angleCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width, H=cv.height;
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
      '<canvas id="angleCanvas" width="300" height="210" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv=document.getElementById('erosionCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width, H=cv.height;
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
    '<canvas id="erosionCanvas" width="300" height="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv=document.getElementById('lungCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width, H=cv.height;
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
      '<canvas id="lungCanvas" width="280" height="220" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv=document.getElementById('soundCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
      '<canvas id="soundCanvas" width="300" height="180" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv=document.getElementById('filterCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
    '<canvas id="filterCanvas" width="280" height="230" style="border-radius:12px;display:block;width:100%"></canvas>'+
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
    var cv=document.getElementById('photoCanvas');
    if(!cv) return;
    var ctx=cv.getContext('2d');
    var W=cv.width,H=cv.height;
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
      '<canvas id="photoCanvas" width="280" height="200" style="border-radius:12px;display:block;width:100%"></canvas>'+
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

