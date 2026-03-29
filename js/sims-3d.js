/* sims-3d.js — Three.js powered 3D simulations
Loads Three.js from CDN on first use, then registers sims.
Three.js r128 — matches the version available on cdnjs
*/

/* ── Lazy-load Three.js once ── */
var _threeLoaded = false;
var _threeCallbacks = [];

function withThree(fn) {
if (window.THREE) { fn(); return; }
_threeCallbacks.push(fn);
if (_threeLoaded) return;
_threeLoaded = true;
var s = document.createElement(‘script’);
s.src = ‘https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js’;
s.onload = function() {
_threeCallbacks.forEach(function(cb) { cb(); });
_threeCallbacks = [];
};
document.head.appendChild(s);
}

/* ── Shared: make a Three.js renderer fit its container ── */
function makeRenderer(container, bgColor) {
var w = container.clientWidth  || 340;
var h = Math.round(w * 0.65);
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(w, h);
renderer.setClearColor(bgColor !== undefined ? bgColor : 0x0d1b2a, bgColor !== undefined ? 1 : 0);
renderer.domElement.style.cssText =
‘width:100%;height:auto;border-radius:12px;display:block;cursor:grab;touch-action:none;’;
container.appendChild(renderer.domElement);
return { renderer: renderer, w: w, h: h };
}

/* ── Shared: simple orbit drag (no OrbitControls needed) ── */
function addDrag(el, onDrag) {
var down = false, lastX = 0, lastY = 0;
el.addEventListener(‘mousedown’,  function(e){ down=true; lastX=e.clientX; lastY=e.clientY; el.style.cursor=‘grabbing’; });
el.addEventListener(‘mousemove’,  function(e){ if(!down) return; onDrag(e.clientX-lastX, e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; });
el.addEventListener(‘mouseup’,    function(){ down=false; el.style.cursor=‘grab’; });
el.addEventListener(‘mouseleave’, function(){ down=false; el.style.cursor=‘grab’; });
el.addEventListener(‘touchstart’, function(e){ down=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }, {passive:true});
el.addEventListener(‘touchmove’,  function(e){ if(!down) return; e.preventDefault(); onDrag(e.touches[0].clientX-lastX, e.touches[0].clientY-lastY); lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }, {passive:false});
el.addEventListener(‘touchend’,   function(){ down=false; });
}

/* ════════════════════════════════════════════════════

1. DNA DOUBLE HELIX 3D
   ════════════════════════════════════════════════════ */
   SIM_REGISTRY[‘dna-helix-3d’] = function(container) {
   /* UI shell */
   container.innerHTML =
   ‘<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">DNA Double Helix — drag to rotate</div>’ +
   ‘<div id="dna3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:linear-gradient(160deg,#0d1b2a,#0a2a1a)"></div>’ +
   ‘<div style="display:flex;gap:8px;margin-top:10px;justify-content:center;flex-wrap:wrap">’ +
   ‘<button class="cbtn" onclick="dna3dSpin()" id="dna3dSpinBtn">⏸ Pause</button>’ +
   ‘<button class="cbtn" onclick="dna3dLabel()" id="dna3dLblBtn">🏷 Show Labels</button>’ +
   ‘<button class="cbtn" onclick="dna3dReset()">↺ Reset View</button>’ +
   ‘</div>’ +
   ‘<div style="display:flex;gap:12px;margin-top:10px;justify-content:center;flex-wrap:wrap;font-size:11px;font-weight:700">’ +
   ‘<span style="color:#f87171">■ Adenine (A)</span>’ +
   ‘<span style="color:#60a5fa">■ Thymine (T)</span>’ +
   ‘<span style="color:#34d399">■ Guanine (G)</span>’ +
   ‘<span style="color:#fbbf24">■ Cytosine (C)</span>’ +
   ‘</div>’ +
   ‘<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--muted);line-height:1.7;border:1px solid var(--border)">’ +
   ‘<b style="color:var(--text)">Base pairing rule:</b> A always pairs with T · G always pairs with C’ +
   ‘</div>’;

withThree(function() {
var mount = document.getElementById(‘dna3dMount’);
if (!mount) return;
var rr = makeRenderer(mount, 0x000000);
var renderer = rr.renderer;
renderer.setClearColor(0x000000, 0);

```
var scene  = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, rr.w / rr.h, 0.1, 100);
camera.position.set(0, 0, 18);

/* Lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
var dirL = new THREE.DirectionalLight(0xffffff, 0.8);
dirL.position.set(5, 10, 7);
scene.add(dirL);
var pointL = new THREE.PointLight(0x34d399, 0.6, 30);
pointL.position.set(-5, 0, 5);
scene.add(pointL);

/* DNA parameters */
var PAIRS      = 20;
var RISE       = 0.68;   /* rise per base pair (Å scale) */
var RADIUS     = 2.2;    /* helix radius */
var TWIST      = (2 * Math.PI) / 10; /* 36° per base pair, 10 pairs per turn */

var COLOURS = {
  A: 0xf87171, T: 0x60a5fa,
  G: 0x34d399, C: 0xfbbf24,
  backbone1: 0x818cf8, backbone2: 0xa78bfa
};

var group = new THREE.Group();
scene.add(group);

var sphereGeo = new THREE.SphereGeometry(0.22, 12, 12);
var cylGeo    = new THREE.CylinderGeometry(0.07, 0.07, 1, 8);

/* Base sequence (20 pairs) */
var SEQ = 'ATGCTAGCATGCTAGCATGC'.split('');
var COMP = {A:'T', T:'A', G:'C', C:'G'};

var backbonePoints1 = [], backbonePoints2 = [];

for (var i = 0; i < PAIRS; i++) {
  var angle = i * TWIST;
  var y     = (i - PAIRS / 2) * RISE;

  /* Strand 1 backbone position */
  var x1 = RADIUS * Math.cos(angle);
  var z1 = RADIUS * Math.sin(angle);
  /* Strand 2 (antiparallel, offset π) */
  var x2 = RADIUS * Math.cos(angle + Math.PI);
  var z2 = RADIUS * Math.sin(angle + Math.PI);

  backbonePoints1.push(new THREE.Vector3(x1, y, z1));
  backbonePoints2.push(new THREE.Vector3(x2, y, z2));

  /* Base spheres */
  var base1 = SEQ[i];
  var base2 = COMP[base1];

  var s1 = new THREE.Mesh(sphereGeo, new THREE.MeshPhongMaterial({ color: COLOURS[base1], shininess: 80 }));
  s1.position.set(x1 * 0.6, y, z1 * 0.6);
  group.add(s1);

  var s2 = new THREE.Mesh(sphereGeo, new THREE.MeshPhongMaterial({ color: COLOURS[base2], shininess: 80 }));
  s2.position.set(x2 * 0.6, y, z2 * 0.6);
  group.add(s2);

  /* H-bond rung (cylinder between the two bases) */
  var mid = new THREE.Vector3((x1 + x2) * 0.6 / 2, y, (z1 + z2) * 0.6 / 2);
  var rungLen = Math.sqrt(Math.pow(x1 * 0.6 - x2 * 0.6, 2) + Math.pow(z1 * 0.6 - z2 * 0.6, 2));
  var rungCyl = new THREE.CylinderGeometry(0.06, 0.06, rungLen, 6);
  var rungMesh = new THREE.Mesh(rungCyl, new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
  rungMesh.position.copy(mid);
  rungMesh.lookAt(new THREE.Vector3(x2 * 0.6, y, z2 * 0.6));
  rungMesh.rotateX(Math.PI / 2);
  group.add(rungMesh);

  /* Backbone phosphate spheres */
  var p1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshPhongMaterial({ color: COLOURS.backbone1, shininess: 60 })
  );
  p1.position.set(x1, y, z1);
  group.add(p1);

  var p2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshPhongMaterial({ color: COLOURS.backbone2, shininess: 60 })
  );
  p2.position.set(x2, y, z2);
  group.add(p2);
}

/* Backbone tubes using TubeGeometry */
function makeTube(points, color) {
  var curve = new THREE.CatmullRomCurve3(points);
  var geo   = new THREE.TubeGeometry(curve, points.length * 4, 0.12, 8, false);
  var mat   = new THREE.MeshPhongMaterial({ color: color, shininess: 50 });
  return new THREE.Mesh(geo, mat);
}
group.add(makeTube(backbonePoints1, COLOURS.backbone1));
group.add(makeTube(backbonePoints2, COLOURS.backbone2));

/* Labels group (hidden by default) */
var labelsOn = false;
var labelSprites = [];

function makeLabel(text, pos) {
  var canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 40;
  var ctx2 = canvas.getContext('2d');
  ctx2.fillStyle = 'rgba(0,0,0,0.75)';
  ctx2.roundRect(2, 2, 124, 36, 6);
  ctx2.fill();
  ctx2.fillStyle = 'white';
  ctx2.font = 'bold 20px sans-serif';
  ctx2.textAlign = 'center';
  ctx2.fillText(text, 64, 26);
  var tex = new THREE.CanvasTexture(canvas);
  var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  var sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 0.4, 1);
  sprite.position.copy(pos);
  sprite.visible = false;
  return sprite;
}

/* Add a few labels at key positions */
var lbl1 = makeLabel('A-T pair', new THREE.Vector3(3.5, -2, 0));
var lbl2 = makeLabel('G-C pair', new THREE.Vector3(3.5,  1, 0));
var lbl3 = makeLabel('Backbone', new THREE.Vector3(-3.2, 3, 0));
[lbl1, lbl2, lbl3].forEach(function(l){ group.add(l); labelSprites.push(l); });

/* Auto-spin */
var spinning = true;
var rotX = 0, rotY = 0;

window.dna3dSpin = function() {
  spinning = !spinning;
  document.getElementById('dna3dSpinBtn').textContent = spinning ? '⏸ Pause' : '▶ Spin';
};
window.dna3dLabel = function() {
  labelsOn = !labelsOn;
  labelSprites.forEach(function(l){ l.visible = labelsOn; });
  document.getElementById('dna3dLblBtn').textContent = labelsOn ? '🏷 Hide Labels' : '🏷 Show Labels';
};
window.dna3dReset = function() { rotX = 0; rotY = 0; group.rotation.set(0, 0, 0); };

addDrag(renderer.domElement, function(dx, dy) {
  rotY += dx * 0.008;
  rotX += dy * 0.008;
});

var raf;
function animate() {
  raf = requestAnimationFrame(animate);
  if (spinning) rotY += 0.008;
  group.rotation.y = rotY;
  group.rotation.x = rotX;
  renderer.render(scene, camera);
}
animate();

window.simCleanup = function() {
  cancelAnimationFrame(raf);
  renderer.dispose();
  delete window.dna3dSpin;
  delete window.dna3dLabel;
  delete window.dna3dReset;
};
```

});
};

/* ════════════════════════════════════════════════════
2. ATOMIC STRUCTURE 3D
════════════════════════════════════════════════════ */
SIM_REGISTRY[‘atom-3d’] = function(container) {

var ELEMENTS = [
{ name:‘Hydrogen’,  sym:‘H’,  Z:1,  N:0,  shells:[1],         color:0x60a5fa },
{ name:‘Helium’,    sym:‘He’, Z:2,  N:2,  shells:[2],         color:0xfbbf24 },
{ name:‘Lithium’,   sym:‘Li’, Z:3,  N:4,  shells:[2,1],       color:0xf87171 },
{ name:‘Carbon’,    sym:‘C’,  Z:6,  N:6,  shells:[2,4],       color:0x9ca3af },
{ name:‘Nitrogen’,  sym:‘N’,  Z:7,  N:7,  shells:[2,5],       color:0x818cf8 },
{ name:‘Oxygen’,    sym:‘O’,  Z:8,  N:8,  shells:[2,6],       color:0x34d399 },
{ name:‘Sodium’,    sym:‘Na’, Z:11, N:12, shells:[2,8,1],     color:0xfb923c },
{ name:‘Magnesium’, sym:‘Mg’, Z:12, N:12, shells:[2,8,2],     color:0xa3e635 },
{ name:‘Chlorine’,  sym:‘Cl’, Z:17, N:18, shells:[2,8,7],     color:0x4ade80 },
{ name:‘Calcium’,   sym:‘Ca’, Z:20, N:20, shells:[2,8,8,2],   color:0xe879f9 },
];

var currentEl = 5; /* Oxygen default */

container.innerHTML =
‘<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Atomic Structure — Bohr Model 3D</div>’ +
‘<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">’ +
ELEMENTS.map(function(el, i) {
return ‘<button class="cbtn atom3d-btn" data-i="' + i + '" onclick="atom3dSelect(' + i + ')" style="min-width:44px;' + (i===currentEl?'background:var(--acc);color:white;':'')+'">’ + el.sym + ‘</button>’;
}).join(’’) +
‘</div>’ +
‘<div id="atom3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at center,#0f1f35,#050c14)"></div>’ +
‘<div id="atom3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.8;border:1px solid var(--border)"></div>’;

withThree(function() {
var mount = document.getElementById(‘atom3dMount’);
if (!mount) return;

```
var rr = makeRenderer(mount, 0x050c14);
var renderer = rr.renderer;
var scene  = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, rr.w / rr.h, 0.1, 100);
camera.position.set(0, 0, 14);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
var dl = new THREE.DirectionalLight(0xffffff, 0.9);
dl.position.set(5, 8, 5);
scene.add(dl);

var atomGroup = new THREE.Group();
scene.add(atomGroup);

var electronGroups = []; /* [{group, radius, speed, electrons:[]}] */
var rotX = 0, rotY = 0;

function buildAtom(idx) {
  /* Clear old */
  while (atomGroup.children.length) atomGroup.remove(atomGroup.children[0]);
  electronGroups = [];

  var el = ELEMENTS[idx];

  /* Nucleus */
  var nucR = 0.35 + el.Z * 0.022;
  var nucGeo = new THREE.SphereGeometry(nucR, 24, 24);
  var nucMat = new THREE.MeshPhongMaterial({ color: el.color, shininess: 100, emissive: el.color, emissiveIntensity: 0.3 });
  var nucleus = new THREE.Mesh(nucGeo, nucMat);
  atomGroup.add(nucleus);

  /* Nucleus glow ring */
  var glowGeo = new THREE.SphereGeometry(nucR * 1.5, 16, 16);
  var glowMat = new THREE.MeshBasicMaterial({ color: el.color, transparent: true, opacity: 0.1, wireframe: false });
  atomGroup.add(new THREE.Mesh(glowGeo, glowMat));

  /* Electron shells */
  var SHELL_COLORS = [0x60a5fa, 0x34d399, 0xfbbf24, 0xf87171];
  var SHELL_RADII  = [2.2, 3.6, 5.0, 6.4];
  var SHELL_SPEEDS = [1.8, 1.1, 0.7, 0.5];

  el.shells.forEach(function(count, si) {
    var shellR = SHELL_RADII[si];
    var sColor = SHELL_COLORS[si];

    /* Orbital ring */
    var ringGeo = new THREE.TorusGeometry(shellR, 0.04, 8, 64);
    var ringMat = new THREE.MeshBasicMaterial({ color: sColor, transparent: true, opacity: 0.25 });
    var ring    = new THREE.Mesh(ringGeo, ringMat);
    /* Tilt each shell slightly for 3D feel */
    ring.rotation.x = Math.PI / 2 + si * 0.35;
    ring.rotation.z = si * 0.5;
    atomGroup.add(ring);

    /* Electron group rotates */
    var eGroup = new THREE.Group();
    eGroup.rotation.x = ring.rotation.x;
    eGroup.rotation.z = ring.rotation.z;
    atomGroup.add(eGroup);

    var eGeo = new THREE.SphereGeometry(0.18, 10, 10);
    var eMat = new THREE.MeshPhongMaterial({ color: sColor, shininess: 80, emissive: sColor, emissiveIntensity: 0.4 });

    for (var ei = 0; ei < count; ei++) {
      var angle = (ei / count) * Math.PI * 2;
      var em = new THREE.Mesh(eGeo, eMat);
      em.position.set(shellR * Math.cos(angle), 0, shellR * Math.sin(angle));
      eGroup.add(em);
    }

    electronGroups.push({ group: eGroup, speed: SHELL_SPEEDS[si] });
  });

  /* Update info panel */
  var valence = el.shells[el.shells.length - 1];
  var info = document.getElementById('atom3dInfo');
  if (info) info.innerHTML =
    '<b style="color:var(--text);font-size:14px">' + el.name + ' (' + el.sym + ')</b><br>' +
    '⚛️ Atomic number: <b>' + el.Z + '</b> &nbsp;|&nbsp; ' +
    'Neutrons: <b>' + el.N + '</b> &nbsp;|&nbsp; ' +
    'Mass: <b>' + (el.Z + el.N) + '</b><br>' +
    '🔵 Shell config: <b>' + el.shells.join(', ') + '</b> &nbsp;|&nbsp; ' +
    'Valence electrons: <b>' + valence + '</b>';

  /* Update button highlights */
  document.querySelectorAll('.atom3d-btn').forEach(function(btn, bi) {
    btn.style.background = bi === idx ? 'var(--acc)' : '';
    btn.style.color      = bi === idx ? 'white' : '';
  });
}

window.atom3dSelect = function(idx) {
  currentEl = idx;
  buildAtom(idx);
};

buildAtom(currentEl);

addDrag(renderer.domElement, function(dx, dy) {
  rotY += dx * 0.01;
  rotX += dy * 0.01;
});

var raf;
var t = 0;
function animate() {
  raf = requestAnimationFrame(animate);
  t += 0.016;
  electronGroups.forEach(function(eg) {
    eg.group.rotation.y = t * eg.speed;
  });
  atomGroup.rotation.y += 0.004;
  atomGroup.rotation.x = rotX * 0.3;
  renderer.render(scene, camera);
}
animate();

window.simCleanup = function() {
  cancelAnimationFrame(raf);
  renderer.dispose();
  delete window.atom3dSelect;
};
```

});
};

/* ════════════════════════════════════════════════════
3. 3D SHAPES EXPLORER
════════════════════════════════════════════════════ */
SIM_REGISTRY[‘shapes-3d’] = function(container) {

var SHAPES = [
{ name:‘Cube’,        icon:‘🟦’, key:‘cube’     },
{ name:‘Cuboid’,      icon:‘🔷’, key:‘cuboid’   },
{ name:‘Sphere’,      icon:‘🔮’, key:‘sphere’   },
{ name:‘Cylinder’,    icon:‘🥫’, key:‘cylinder’ },
{ name:‘Cone’,        icon:‘🍦’, key:‘cone’     },
{ name:‘Tetrahedron’, icon:‘🔺’, key:‘tetra’    },
];

var currentShape = 0;
var wireOn = false;

container.innerHTML =
‘<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">3D Shapes Explorer — drag to rotate</div>’ +
‘<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">’ +
SHAPES.map(function(s, i) {
return ‘<button class="cbtn sh3d-btn" data-i="' + i + '" onclick="sh3dSelect(' + i + ')" style="' + (i===0?'background:var(--acc);color:white;':'') + '">’ + s.icon + ’ ’ + s.name + ‘</button>’;
}).join(’’) +
‘</div>’ +
‘<div id="sh3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at center,#1a1040,#0a0520)"></div>’ +
‘<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">’ +
‘<button class="cbtn" onclick="sh3dWire()" id="sh3dWireBtn">⬡ Wireframe</button>’ +
‘<button class="cbtn" onclick="sh3dSpin()" id="sh3dSpinBtn">⏸ Pause</button>’ +
‘</div>’ +
‘<div id="sh3dInfo" style="background:var(--surface2);border-radius:10px;padding:12px 14px;margin-top:10px;font-size:12px;line-height:2;border:1px solid var(--border)"></div>’;

withThree(function() {
var mount = document.getElementById(‘sh3dMount’);
if (!mount) return;

```
var rr = makeRenderer(mount, 0x0a0520);
var renderer = rr.renderer;
var scene  = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, rr.w / rr.h, 0.1, 100);
camera.position.set(0, 2, 9);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
var dl = new THREE.DirectionalLight(0xffffff, 1.0);
dl.position.set(6, 10, 8);
scene.add(dl);
var pl = new THREE.PointLight(0x818cf8, 0.5, 20);
pl.position.set(-4, 4, 4);
scene.add(pl);

/* Grid floor */
var grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
grid.position.y = -2.2;
scene.add(grid);

var meshGroup  = new THREE.Group();
var wireMesh   = null;
scene.add(meshGroup);

var spinning = true;
var rotX = 0, rotY = 0;

var SHAPE_COLORS = {
  cube: 0x818cf8, cuboid: 0x60a5fa, sphere: 0x34d399,
  cylinder: 0xfbbf24, cone: 0xf87171, tetra: 0xe879f9
};

function makeGeometry(key) {
  switch(key) {
    case 'cube':     return new THREE.BoxGeometry(2.5, 2.5, 2.5);
    case 'cuboid':   return new THREE.BoxGeometry(3.5, 2, 2);
    case 'sphere':   return new THREE.SphereGeometry(1.5, 32, 32);
    case 'cylinder': return new THREE.CylinderGeometry(1.2, 1.2, 2.8, 32);
    case 'cone':     return new THREE.ConeGeometry(1.5, 3, 32);
    case 'tetra':    return new THREE.TetrahedronGeometry(1.8);
  }
}

function getFormulas(key, a) {
  /* a = slider value 1-5 */
  var r = a * 0.4, h = a * 0.56, pi = Math.PI;
  switch(key) {
    case 'cube':
      return { F:6, V:8, E:12,
        SA: (6 * a * a).toFixed(1) + ' a²',
        Vol: (a * a * a).toFixed(1) + ' a³',
        formula: 'SA = 6a²  |  V = a³' };
    case 'cuboid':
      return { F:6, V:8, E:12,
        SA: 'l×b + b×h + h×l (×2)',
        Vol: 'l × b × h',
        formula: 'SA = 2(lb+bh+hl)  |  V = lbh' };
    case 'sphere':
      return { F:1, V:0, E:0,
        SA: (4 * pi * r * r).toFixed(1),
        Vol: ((4/3) * pi * r * r * r).toFixed(1),
        formula: 'SA = 4πr²  |  V = ⁴⁄₃πr³' };
    case 'cylinder':
      return { F:3, V:0, E:2,
        SA: (2 * pi * r * (r + h)).toFixed(1),
        Vol: (pi * r * r * h).toFixed(1),
        formula: 'SA = 2πr(r+h)  |  V = πr²h' };
    case 'cone':
      var l = Math.sqrt(r*r + h*h);
      return { F:2, V:1, E:1,
        SA: (pi * r * (r + l)).toFixed(1),
        Vol: ((1/3) * pi * r * r * h).toFixed(1),
        formula: 'SA = πr(r+l)  |  V = ⅓πr²h' };
    case 'tetra':
      return { F:4, V:4, E:6,
        SA: (Math.sqrt(3) * a * a).toFixed(1) + ' a²',
        Vol: ((a * a * a) / (6 * Math.sqrt(2))).toFixed(2) + ' a³',
        formula: 'SA = √3 a²  |  V = a³/(6√2)' };
  }
}

function buildShape(idx) {
  while (meshGroup.children.length) meshGroup.remove(meshGroup.children[0]);
  wireMesh = null;

  var key   = SHAPES[idx].key;
  var color = SHAPE_COLORS[key];
  var geo   = makeGeometry(key);

  var mat  = new THREE.MeshPhongMaterial({ color: color, shininess: 80, transparent: true, opacity: 0.88 });
  var mesh = new THREE.Mesh(geo, mat);
  meshGroup.add(mesh);

  var wMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 });
  wireMesh = new THREE.Mesh(geo, wMat);
  wireMesh.visible = wireOn;
  meshGroup.add(wireMesh);

  /* Update info */
  var f = getFormulas(key, 3);
  var info = document.getElementById('sh3dInfo');
  if (info) info.innerHTML =
    '<b style="color:var(--text);font-size:13px">' + SHAPES[idx].icon + ' ' + SHAPES[idx].name + '</b><br>' +
    (f.F ? '📐 Faces: <b>' + f.F + '</b> &nbsp;|&nbsp; Vertices: <b>' + f.V + '</b> &nbsp;|&nbsp; Edges: <b>' + f.E + '</b><br>' : '') +
    '📏 <b>' + f.formula + '</b><br>' +
    (f.F && f.F > 0 ? '✅ Euler: F + V − E = ' + f.F + ' + ' + f.V + ' − ' + f.E + ' = <b style="color:var(--evs)">' + (f.F + f.V - f.E) + '</b>' : '');

  /* Highlight active button */
  document.querySelectorAll('.sh3d-btn').forEach(function(btn, bi) {
    btn.style.background = bi === idx ? 'var(--acc)' : '';
    btn.style.color      = bi === idx ? 'white' : '';
  });
}

window.sh3dSelect = function(idx) { currentShape = idx; buildShape(idx); };
window.sh3dWire   = function() {
  wireOn = !wireOn;
  if (wireMesh) wireMesh.visible = wireOn;
  document.getElementById('sh3dWireBtn').textContent = wireOn ? '⬡ Solid' : '⬡ Wireframe';
};
window.sh3dSpin = function() {
  spinning = !spinning;
  document.getElementById('sh3dSpinBtn').textContent = spinning ? '⏸ Pause' : '▶ Spin';
};

buildShape(0);

addDrag(renderer.domElement, function(dx, dy) {
  rotY += dx * 0.01;
  rotX += dy * 0.01;
});

var raf;
function animate() {
  raf = requestAnimationFrame(animate);
  if (spinning) rotY += 0.007;
  meshGroup.rotation.y = rotY;
  meshGroup.rotation.x = rotX;
  renderer.render(scene, camera);
}
animate();

window.simCleanup = function() {
  cancelAnimationFrame(raf);
  renderer.dispose();
  delete window.sh3dSelect;
  delete window.sh3dWire;
  delete window.sh3dSpin;
};
```

});
};