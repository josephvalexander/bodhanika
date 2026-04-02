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
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
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
    'width:100%;height:auto;border-radius:12px;display:block;cursor:grab;touch-action:none;';
  container.appendChild(renderer.domElement);
  return { renderer: renderer, w: w, h: h };
}

/* ── Shared: simple orbit drag (no OrbitControls needed) ── */
function addDrag(el, onDrag) {
  var down = false, lastX = 0, lastY = 0;
  el.addEventListener('mousedown',  function(e){ down=true; lastX=e.clientX; lastY=e.clientY; el.style.cursor='grabbing'; });
  el.addEventListener('mousemove',  function(e){ if(!down) return; onDrag(e.clientX-lastX, e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; });
  el.addEventListener('mouseup',    function(){ down=false; el.style.cursor='grab'; });
  el.addEventListener('mouseleave', function(){ down=false; el.style.cursor='grab'; });
  el.addEventListener('touchstart', function(e){ down=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }, {passive:true});
  el.addEventListener('touchmove',  function(e){ if(!down) return; e.preventDefault(); onDrag(e.touches[0].clientX-lastX, e.touches[0].clientY-lastY); lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }, {passive:false});
  el.addEventListener('touchend',   function(){ down=false; });
}

/* ════════════════════════════════════════════════════
   1. DNA DOUBLE HELIX 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['dna-helix-3d'] = function(container) {
  /* UI shell */
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">DNA Double Helix — drag to rotate</div>' +
    '<div id="dna3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:linear-gradient(160deg,#0d1b2a,#0a2a1a)"></div>' +
    '<div style="display:flex;gap:8px;margin-top:10px;justify-content:center;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="dna3dSpin()" id="dna3dSpinBtn">⏸ Pause</button>' +
      '<button class="cbtn" onclick="dna3dLabel()" id="dna3dLblBtn">🏷 Show Labels</button>' +
      '<button class="cbtn" onclick="dna3dReset()">↺ Reset View</button>' +
    '</div>' +
    '<div style="display:flex;gap:12px;margin-top:10px;justify-content:center;flex-wrap:wrap;font-size:11px;font-weight:700">' +
      '<span style="color:#f87171">■ Adenine (A)</span>' +
      '<span style="color:#60a5fa">■ Thymine (T)</span>' +
      '<span style="color:#34d399">■ Guanine (G)</span>' +
      '<span style="color:#fbbf24">■ Cytosine (C)</span>' +
    '</div>' +
    '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--muted);line-height:1.7;border:1px solid var(--border)">' +
      '<b style="color:var(--text)">Base pairing rule:</b> A always pairs with T · G always pairs with C' +
    '</div>';

  withThree(function() {
    var mount = document.getElementById('dna3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x000000);
    var renderer = rr.renderer;
    renderer.setClearColor(0x000000, 0);

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
  });
};

/* ════════════════════════════════════════════════════
   2. ATOMIC STRUCTURE 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['atom-3d'] = function(container) {

  var ELEMENTS = [
    { name:'Hydrogen',  sym:'H',  Z:1,  N:0,  shells:[1],         color:0x60a5fa },
    { name:'Helium',    sym:'He', Z:2,  N:2,  shells:[2],         color:0xfbbf24 },
    { name:'Lithium',   sym:'Li', Z:3,  N:4,  shells:[2,1],       color:0xf87171 },
    { name:'Carbon',    sym:'C',  Z:6,  N:6,  shells:[2,4],       color:0x9ca3af },
    { name:'Nitrogen',  sym:'N',  Z:7,  N:7,  shells:[2,5],       color:0x818cf8 },
    { name:'Oxygen',    sym:'O',  Z:8,  N:8,  shells:[2,6],       color:0x34d399 },
    { name:'Sodium',    sym:'Na', Z:11, N:12, shells:[2,8,1],     color:0xfb923c },
    { name:'Magnesium', sym:'Mg', Z:12, N:12, shells:[2,8,2],     color:0xa3e635 },
    { name:'Chlorine',  sym:'Cl', Z:17, N:18, shells:[2,8,7],     color:0x4ade80 },
    { name:'Calcium',   sym:'Ca', Z:20, N:20, shells:[2,8,8,2],   color:0xe879f9 },
  ];

  var currentEl = 5; /* Oxygen default */

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Atomic Structure — Bohr Model 3D</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">' +
    ELEMENTS.map(function(el, i) {
      return '<button class="cbtn atom3d-btn" data-i="' + i + '" onclick="atom3dSelect(' + i + ')" style="min-width:44px;' + (i===currentEl?'background:var(--acc);color:white;':'')+'">' + el.sym + '</button>';
    }).join('') +
    '</div>' +
    '<div id="atom3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at center,#0f1f35,#050c14)"></div>' +
    '<div id="atom3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.8;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('atom3dMount');
    if (!mount) return;

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
  });
};

/* ════════════════════════════════════════════════════
   3. 3D SHAPES EXPLORER
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['shapes-3d'] = function(container) {

  var SHAPES = [
    { name:'Cube',        icon:'🟦', key:'cube'     },
    { name:'Cuboid',      icon:'🔷', key:'cuboid'   },
    { name:'Sphere',      icon:'🔮', key:'sphere'   },
    { name:'Cylinder',    icon:'🥫', key:'cylinder' },
    { name:'Cone',        icon:'🍦', key:'cone'     },
    { name:'Tetrahedron', icon:'🔺', key:'tetra'    },
  ];

  var currentShape = 0;
  var wireOn = false;

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">3D Shapes Explorer — drag to rotate</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">' +
    SHAPES.map(function(s, i) {
      return '<button class="cbtn sh3d-btn" data-i="' + i + '" onclick="sh3dSelect(' + i + ')" style="' + (i===0?'background:var(--acc);color:white;':'') + '">' + s.icon + ' ' + s.name + '</button>';
    }).join('') +
    '</div>' +
    '<div id="sh3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at center,#1a1040,#0a0520)"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">' +
      '<button class="cbtn" onclick="sh3dWire()" id="sh3dWireBtn">⬡ Wireframe</button>' +
      '<button class="cbtn" onclick="sh3dSpin()" id="sh3dSpinBtn">⏸ Pause</button>' +
    '</div>' +
    '<div id="sh3dInfo" style="background:var(--surface2);border-radius:10px;padding:12px 14px;margin-top:10px;font-size:12px;line-height:2;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('sh3dMount');
    if (!mount) return;

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
        (f.F && f.F > 0 ? '✅ Euler: F + V - E = ' + f.F + ' + ' + f.V + ' - ' + f.E + ' = <b style="color:var(--evs)">' + (f.F + f.V - f.E) + '</b>' : '');

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
  });
};

/* ════════════════════════════════════════════════════
   4. ANIMAL CELL 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['cell-3d'] = function(container) {
  var ORGANELLES = [
    { name:'Cell Membrane', color:0x818cf8, size:3.8, shape:'sphere',  pos:[0,0,0],      info:'Thin flexible boundary — controls what enters and exits the cell.' },
    { name:'Nucleus',       color:0xf87171, size:0.9, shape:'sphere',  pos:[0,0,0],      info:'Control centre — contains DNA with all genetic instructions.' },
    { name:'Mitochondria',  color:0xfbbf24, size:0.4, shape:'ellipse', pos:[1.5,0.8,0.5],info:'Powerhouse — produces ATP energy through cellular respiration.' },
    { name:'Mitochondria',  color:0xfbbf24, size:0.4, shape:'ellipse', pos:[-1.2,-0.9,0.8],info:'Powerhouse — produces ATP energy.' },
    { name:'Golgi Body',    color:0x34d399, size:0.5, shape:'flat',    pos:[-1.0,0.8,-0.5],info:'Packaging unit — modifies and ships proteins to destinations.' },
    { name:'Ribosome',      color:0xe879f9, size:0.18,shape:'sphere',  pos:[0.8,-0.5,1.2],info:'Protein factory — reads mRNA to build proteins.' },
    { name:'Ribosome',      color:0xe879f9, size:0.18,shape:'sphere',  pos:[-0.5,1.2,0.8],info:'Protein factory.' },
    { name:'Lysosome',      color:0xfb923c, size:0.25,shape:'sphere',  pos:[1.2,-1.0,-0.6],info:'Recycler — breaks down waste and worn-out cell parts.' },
  ];

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Animal Cell 3D — drag to rotate · click to identify</div>' +
    '<div id="cell3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#150a2a,#05020f)"></div>' +
    '<div id="cell3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--muted);line-height:1.7;border:1px solid var(--border);min-height:44px">Click an organelle to learn its function.</div>';

  withThree(function() {
    var mount = document.getElementById('cell3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x05020f);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(5,8,5); scene.add(dl);
    var pl = new THREE.PointLight(0x818cf8, 0.5, 20); pl.position.set(-3,3,3); scene.add(pl);

    var group = new THREE.Group();
    scene.add(group);
    var meshes = [];

    /* Cell membrane — transparent sphere */
    var memGeo = new THREE.SphereGeometry(3.8, 32, 32);
    var memMat = new THREE.MeshPhongMaterial({ color:0x818cf8, transparent:true, opacity:0.12, wireframe:false, side:THREE.DoubleSide });
    group.add(new THREE.Mesh(memGeo, memMat));
    var memWire = new THREE.Mesh(new THREE.SphereGeometry(3.82,24,24), new THREE.MeshBasicMaterial({color:0x818cf8,wireframe:true,transparent:true,opacity:0.08}));
    group.add(memWire);

    /* Nucleus */
    var nucGeo = new THREE.SphereGeometry(0.9, 20, 20);
    var nucMesh = new THREE.Mesh(nucGeo, new THREE.MeshPhongMaterial({color:0xf87171, shininess:80, transparent:true, opacity:0.9}));
    group.add(nucMesh);
    meshes.push({ mesh:nucMesh, info:ORGANELLES[1] });

    /* Other organelles */
    ORGANELLES.slice(2).forEach(function(org) {
      var geo, mat = new THREE.MeshPhongMaterial({color:org.color, shininess:70});
      if (org.shape === 'ellipse') {
        geo = new THREE.SphereGeometry(org.size, 12, 12);
      } else if (org.shape === 'flat') {
        geo = new THREE.TorusGeometry(org.size, org.size*0.3, 6, 16);
      } else {
        geo = new THREE.SphereGeometry(org.size, 10, 10);
      }
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(org.pos[0], org.pos[1], org.pos[2]);
      if (org.shape === 'ellipse') mesh.scale.set(1.6, 0.8, 0.9);
      group.add(mesh);
      meshes.push({ mesh:mesh, info:org });
    });

    /* Click to identify */
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('click', function(e) {
      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      var hits = raycaster.intersectObjects(meshes.map(function(m){return m.mesh;}));
      if (hits.length) {
        var found = meshes.find(function(m){ return m.mesh === hits[0].object; });
        if (found) {
          var el = document.getElementById('cell3dInfo');
          if (el) el.innerHTML = '<b style="color:var(--text)">' + found.info.name + '</b> — ' + found.info.info;
        }
      }
    });

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); rotY+=0.005; group.rotation.y=rotY; group.rotation.x=rotX; renderer.render(scene,camera); }
    animate();
    window.simCleanup = function(){ cancelAnimationFrame(raf); renderer.dispose(); };
  });
};

/* ════════════════════════════════════════════════════
   5. ELECTROMAGNETIC INDUCTION 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['em-induction-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Electromagnetic Induction 3D</div>' +
    '<div id="em3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#0d1f35,#050c14)"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="emPush()">➡ Push In (N)</button>' +
      '<button class="cbtn" onclick="emPull()">⬅ Pull Out (N)</button>' +
      '<button class="cbtn" onclick="emFlip()">🔄 Flip Poles</button>' +
    '</div>' +
    '<div id="em3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.7;border:1px solid var(--border);text-align:center">Press Push In to start the demonstration.</div>';

  withThree(function() {
    var mount = document.getElementById('em3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x050c14);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(3, 3, 10);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(5,8,5); scene.add(dl);

    /* Coil — series of torus rings */
    var coilGroup = new THREE.Group();
    var coilMat = new THREE.MeshPhongMaterial({ color:0xd97706, shininess:60 });
    for (var i=0; i<12; i++) {
      var t = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 24), coilMat);
      t.position.x = (i-5.5) * 0.38;
      t.rotation.y = Math.PI/2;
      coilGroup.add(t);
    }
    scene.add(coilGroup);

    /* Magnet */
    var magnetGroup = new THREE.Group();
    var northMat = new THREE.MeshPhongMaterial({color:0xef4444, shininess:80});
    var southMat = new THREE.MeshPhongMaterial({color:0x3b82f6, shininess:80});
    var north = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.5,16), northMat);
    north.rotation.z = Math.PI/2; north.position.x = 0.75;
    var south = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.5,16), southMat);
    south.rotation.z = Math.PI/2; south.position.x = -0.75;
    magnetGroup.add(north); magnetGroup.add(south);
    magnetGroup.position.x = 5;
    scene.add(magnetGroup);

    /* Labels */
    var flipped = false;

    /* Current indicator ring (glows when current flows) */
    var currentRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.12, 8, 24),
      new THREE.MeshBasicMaterial({color:0x34d399, transparent:true, opacity:0})
    );
    currentRing.rotation.y = Math.PI/2;
    currentRing.position.x = 0;
    scene.add(currentRing);

    var targetX = 5, currentOpacity = 0, direction = 0;
    var animating = false;

    function setInfo(text, color) {
      var el = document.getElementById('em3dInfo');
      if (el) el.innerHTML = '<b style="color:' + (color||'var(--text)') + '">' + text + '</b>';
    }

    window.emPush = function() {
      if (animating) return;
      animating = true; targetX = -0.5; direction = 1;
      setInfo(flipped ? 'South pole entering — current flows CLOCKWISE' : 'North pole entering — current flows ANTI-CLOCKWISE', '#34d399');
      setTimeout(function(){ animating=false; }, 1800);
    };
    window.emPull = function() {
      if (animating) return;
      animating = true; targetX = 5; direction = -1;
      setInfo(flipped ? 'South pole leaving — current flows ANTI-CLOCKWISE' : 'North pole leaving — current flows CLOCKWISE', '#60a5fa');
      setTimeout(function(){ animating=false; }, 1800);
    };
    window.emFlip = function() {
      flipped = !flipped;
      north.material = flipped ? southMat : northMat;
      south.material = flipped ? northMat : southMat;
      setInfo('Poles flipped! Now try pushing/pulling again — notice the current reverses.', '#fbbf24');
    };

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });

    var raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      /* Move magnet toward/away from coil */
      magnetGroup.position.x += (targetX - magnetGroup.position.x) * 0.04;
      /* Current glow: stronger when magnet near coil and moving */
      var dist = Math.abs(magnetGroup.position.x);
      var speed = Math.abs(targetX - magnetGroup.position.x);
      currentOpacity = Math.min(0.85, speed * 0.3) * (dist < 2 ? 1 : 0);
      currentRing.material.opacity = currentOpacity;
      currentRing.material.color.setHex(direction > 0 ? 0x34d399 : 0x60a5fa);
      currentRing.rotation.z += direction * 0.05 * currentOpacity;
      /* Scene rotation from drag */
      coilGroup.rotation.y = rotY; magnetGroup.rotation.y = rotY;
      currentRing.rotation.y = Math.PI/2;
      scene.rotation.x = rotX * 0.3;
      renderer.render(scene, camera);
    }
    animate();
    window.simCleanup = function() {
      cancelAnimationFrame(raf); renderer.dispose();
      delete window.emPush; delete window.emPull; delete window.emFlip;
    };
  });
};

/* ════════════════════════════════════════════════════
   6. GRAVITY & ORBITS 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['gravity-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Gravity and Orbits 3D — F = Gm₁m₂/r²</div>' +
    '<div id="grav3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:#000008"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">Distance <input type="range" id="gravDist" min="2" max="6" value="4" step="0.1" oninput="gravUpdate()"></label>' +
      '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">Mass ☀️ <input type="range" id="gravMass" min="1" max="4" value="2" step="0.1" oninput="gravUpdate()"></label>' +
    '</div>' +
    '<div id="grav3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.9;border:1px solid var(--border);font-family:monospace"></div>';

  withThree(function() {
    var mount = document.getElementById('grav3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x000008);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 200);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);

    /* Stars background */
    var starsGeo = new THREE.BufferGeometry();
    var starVerts = [];
    for (var i=0; i<1200; i++) {
      starVerts.push((Math.random()-0.5)*120, (Math.random()-0.5)*120, (Math.random()-0.5)*120);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({color:0xffffff, size:0.15})));

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    var sunLight = new THREE.PointLight(0xfdb813, 2.0, 50);
    sunLight.position.set(0,0,0);
    scene.add(sunLight);

    /* Sun */
    var sun = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 24),
      new THREE.MeshBasicMaterial({color:0xfdb813})
    );
    scene.add(sun);

    /* Orbit ring */
    var orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.03, 8, 80),
      new THREE.MeshBasicMaterial({color:0x334155, transparent:true, opacity:0.5})
    );
    scene.add(orbitRing);

    /* Planet */
    var planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshPhongMaterial({color:0x3b82f6, shininess:60})
    );
    scene.add(planet);

    /* Trail */
    var trailPoints = [];
    var MAX_TRAIL = 80;
    var trailGeo = new THREE.BufferGeometry();
    var trailLine = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({color:0x60a5fa, transparent:true, opacity:0.4}));
    scene.add(trailLine);

    var G = 1, dist = 4, mass = 2, angle = 0;

    function gravUpdate() {
      dist  = parseFloat(document.getElementById('gravDist').value);
      mass  = parseFloat(document.getElementById('gravMass').value);
      var F = G * mass * 0.3 / (dist * dist);
      var v = Math.sqrt(G * mass / dist);
      orbitRing.geometry.dispose();
      orbitRing.geometry = new THREE.TorusGeometry(dist, 0.03, 8, 80);
      sun.scale.setScalar(mass * 0.5);
      trailPoints = [];
      var info = document.getElementById('grav3dInfo');
      if (info) info.innerHTML =
        'F = G×m\u2081m\u2082/r\u00b2 &nbsp;|&nbsp; <b>F = ' + F.toFixed(3) + ' N</b><br>' +
        'Orbital speed: <b>' + v.toFixed(2) + ' km/s</b> &nbsp;|&nbsp; ' +
        'Distance: <b>' + dist.toFixed(1) + ' AU</b>';
    }
    window.gravUpdate = gravUpdate;
    gravUpdate();

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.008; rotX+=dy*0.008; });

    var raf, t=0;
    function animate() {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      var speed = Math.sqrt(G * mass / dist);
      angle += speed * 0.04;
      planet.position.set(dist * Math.cos(angle), 0, dist * Math.sin(angle));
      trailPoints.push(planet.position.clone());
      if (trailPoints.length > MAX_TRAIL) trailPoints.shift();
      trailGeo.setFromPoints(trailPoints);
      scene.rotation.y = rotY;
      scene.rotation.x = rotX * 0.3;
      renderer.render(scene, camera);
    }
    animate();
    window.simCleanup = function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.gravUpdate; };
  });
};

/* ════════════════════════════════════════════════════
   7. MITOSIS 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['mitosis-3d'] = function(container) {
  var PHASES = [
    { name:'Interphase', color:0x818cf8, desc:'Cell grows and DNA replicates. Each chromosome is copied — ready for division.' },
    { name:'Prophase',   color:0xfbbf24, desc:'Chromosomes condense and become visible. The nuclear envelope breaks down. Spindle fibres form.' },
    { name:'Metaphase',  color:0x34d399, desc:'Chromosomes line up at the cell\'s equator (metaphase plate). Spindle fibres attach to each chromatid.' },
    { name:'Anaphase',   color:0xf87171, desc:'Sister chromatids are pulled to opposite poles by spindle fibres. Cell elongates.' },
    { name:'Telophase',  color:0x60a5fa, desc:'Nuclear envelopes reform around each set of chromosomes. Chromosomes begin to uncoil.' },
    { name:'Cytokinesis',color:0xe879f9, desc:'Cytoplasm divides — two identical daughter cells are formed. Mitosis complete!' },
  ];
  var phase = 0;

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Mitosis 3D — drag to rotate</div>' +
    '<div id="mit3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#0f1a0f,#030803)"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">' +
      '<button class="cbtn" id="mitPrevBtn" onclick="mitNav(-1)" style="display:none">← Back</button>' +
      '<button class="cbtn" onclick="mitNav(1)" id="mitNextBtn">Next Phase →</button>' +
    '</div>' +
    '<div id="mit3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.7;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('mit3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x030803);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 2, 10);
    camera.lookAt(0,0,0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(5,8,5); scene.add(dl);

    var cellGroup = new THREE.Group();
    scene.add(cellGroup);

    function buildPhase(p) {
      while (cellGroup.children.length) cellGroup.remove(cellGroup.children[0]);
      var ph = PHASES[p];
      var col = ph.color;

      if (p < 4) {
        /* Single cell */
        var scaleX = p === 3 ? 1.4 : 1;
        var mem = new THREE.Mesh(new THREE.SphereGeometry(2.5,24,24), new THREE.MeshPhongMaterial({color:col,transparent:true,opacity:0.15,side:THREE.DoubleSide}));
        mem.scale.x = scaleX;
        cellGroup.add(mem);
        var memW = new THREE.Mesh(new THREE.SphereGeometry(2.52,18,18), new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:0.1}));
        memW.scale.x = scaleX;
        cellGroup.add(memW);

        /* Chromosomes */
        var chrGeo = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.12,0.6,4,8) : new THREE.CylinderGeometry(0.12,0.12,0.6,8);
        var chrMat = new THREE.MeshPhongMaterial({color:col, shininess:80});
        var positions = p===0 ? [[0,0,0],[0.5,0.3,0.2],[-0.4,0.2,-0.3],[0.2,-0.4,0.3]] :
                        p===1 ? [[0.5,0.5,0],[-0.5,0.5,0],[0.5,-0.5,0],[-0.5,-0.5,0]] :
                        p===2 ? [[0,0.5,0],[0,-0.5,0],[0,0.2,0.4],[0,-0.2,-0.4]] :
                        p===3 ? [[-1.2,0.3,0],[-1.2,-0.3,0],[1.2,0.3,0],[1.2,-0.3,0]] :
                               [[0,0.3,0],[0,-0.3,0]];
        positions.forEach(function(pos) {
          var c = new THREE.Mesh(chrGeo, chrMat);
          c.position.set(pos[0],pos[1],pos[2]);
          c.rotation.z = Math.random()*0.5;
          cellGroup.add(c);
        });

        /* Spindle fibres for metaphase/anaphase */
        if (p === 2 || p === 3) {
          var spindleMat = new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.3});
          [[-2.2,0,0],[2.2,0,0]].forEach(function(pole) {
            positions.forEach(function(chr) {
              var pts = [new THREE.Vector3(pole[0],pole[1],pole[2]), new THREE.Vector3(chr[0],chr[1],chr[2])];
              var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), spindleMat);
              cellGroup.add(line);
            });
          });
        }
      } else {
        /* Two daughter cells */
        [-1.6, 1.6].forEach(function(xOff) {
          var mem = new THREE.Mesh(new THREE.SphereGeometry(1.8,20,20), new THREE.MeshPhongMaterial({color:col,transparent:true,opacity:0.15,side:THREE.DoubleSide}));
          mem.position.x = xOff;
          cellGroup.add(mem);
          var nuc = new THREE.Mesh(new THREE.SphereGeometry(0.6,14,14), new THREE.MeshPhongMaterial({color:col,shininess:60}));
          nuc.position.x = xOff;
          cellGroup.add(nuc);
        });
      }

      /* Info */
      var info = document.getElementById('mit3dInfo');
      if (info) info.innerHTML = '<b style="color:var(--text)">' + ph.name + ' (' + (p+1) + '/6)</b><br>' + ph.desc;
      var prev = document.getElementById('mitPrevBtn');
      var next = document.getElementById('mitNextBtn');
      if (prev) prev.style.display = p===0 ? 'none' : '';
      if (next) next.textContent = p===5 ? '↺ Restart' : 'Next Phase →';
    }

    window.mitNav = function(dir) {
      phase = (phase + dir + PHASES.length) % PHASES.length;
      buildPhase(phase);
    };
    buildPhase(0);

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); rotY+=0.005; cellGroup.rotation.y=rotY; cellGroup.rotation.x=rotX*0.4; renderer.render(scene,camera); }
    animate();
    window.simCleanup = function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.mitNav; };
  });
};

/* ════════════════════════════════════════════════════
   8. HUMAN EYE 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['eye-3d'] = function(container) {
  var modes = ['Normal', 'Myopia', 'Hypermetropia'];
  var currentMode = 0;

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Human Eye 3D — Cross Section</div>' +
    '<div id="eye3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#1a0a0a,#080004)"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px;justify-content:center">' +
      modes.map(function(m,i){ return '<button class="cbtn eye3d-btn" onclick="eye3dMode('+i+')" style="'+(i===0?'background:var(--acc);color:white;':'')+'">'+m+'</button>'; }).join('') +
    '</div>' +
    '<div id="eye3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.7;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('eye3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x080004);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(5,8,5); scene.add(dl);

    var eyeGroup = new THREE.Group();
    scene.add(eyeGroup);

    /* Eyeball */
    var eyeball = new THREE.Mesh(new THREE.SphereGeometry(2.5,24,24), new THREE.MeshPhongMaterial({color:0xf5e6d0,transparent:true,opacity:0.35,side:THREE.DoubleSide}));
    eyeGroup.add(eyeball);

    /* Iris + Pupil */
    var iris = new THREE.Mesh(new THREE.TorusGeometry(0.9,0.35,12,32), new THREE.MeshPhongMaterial({color:0x4a7c59,shininess:40}));
    iris.position.z = 2.35; eyeGroup.add(iris);
    var pupil = new THREE.Mesh(new THREE.CircleGeometry(0.5,16), new THREE.MeshBasicMaterial({color:0x000000}));
    pupil.position.z = 2.4; eyeGroup.add(pupil);

    /* Retina */
    var retina = new THREE.Mesh(new THREE.SphereGeometry(2.4,12,12,Math.PI*1.2,Math.PI*0.6,0,Math.PI), new THREE.MeshPhongMaterial({color:0xf87171,side:THREE.BackSide,transparent:true,opacity:0.6}));
    retina.rotation.y = Math.PI; eyeGroup.add(retina);

    /* Lens */
    var lens = new THREE.Mesh(new THREE.SphereGeometry(0.55,12,12), new THREE.MeshPhongMaterial({color:0xbfdbfe,transparent:true,opacity:0.7,shininess:120}));
    lens.scale.z = 0.4; lens.position.z = 1.6;
    eyeGroup.add(lens);

    /* Light ray line */
    var rayMat = new THREE.LineBasicMaterial({color:0xfbbf24,transparent:true,opacity:0.8});
    var rayGroup = new THREE.Group();
    eyeGroup.add(rayGroup);

    /* Focal point indicator */
    var focal = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8), new THREE.MeshBasicMaterial({color:0xfbbf24}));
    eyeGroup.add(focal);

    var INFO = [
      'Normal vision: light focuses exactly on the retina. The lens adjusts shape (accommodation) for near and far objects.',
      'Myopia (Short sight): eyeball too long — light focuses in FRONT of retina. Corrected by concave (diverging) lens.',
      'Hypermetropia (Long sight): eyeball too short — light focuses BEHIND retina. Corrected by convex (converging) lens.',
    ];
    var FOCAL_POS = [-2.0, -3.2, -0.5];

    function eye3dSetMode(m) {
      currentMode = m;
      document.querySelectorAll('.eye3d-btn').forEach(function(btn, bi) {
        btn.style.background = bi===m ? 'var(--acc)' : '';
        btn.style.color = bi===m ? 'white' : '';
      });
      focal.position.z = FOCAL_POS[m];
      focal.material.color.setHex(m===0 ? 0x34d399 : 0xef4444);
      /* Update ray paths */
      while (rayGroup.children.length) rayGroup.remove(rayGroup.children[0]);
      var fz = FOCAL_POS[m];
      [0.4,-0.4].forEach(function(yOff) {
        var pts = [new THREE.Vector3(0,yOff,4), new THREE.Vector3(0,yOff*0.2,1.6), new THREE.Vector3(0,0,fz)];
        rayGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), rayMat));
      });
      var info = document.getElementById('eye3dInfo');
      if (info) info.innerHTML = '<b style="color:' + (m===0?'#34d399':'#ef4444') + '">' + modes[m] + '</b> — ' + INFO[m];
    }
    window.eye3dMode = eye3dSetMode;
    eye3dSetMode(0);

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); eyeGroup.rotation.y=rotY; eyeGroup.rotation.x=rotX*0.4; renderer.render(scene,camera); }
    animate();
    window.simCleanup = function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.eye3dMode; };
  });
};

/* ════════════════════════════════════════════════════
   9. MAGNETIC FIELD LINES 3D
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['magfield-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Magnetic Field Lines 3D — drag to rotate</div>' +
    '<div id="mag3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:#000010"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">' +
      '<button class="cbtn" onclick="magFlip()">🔄 Flip Poles</button>' +
      '<button class="cbtn" onclick="magToggle()" id="magAnimBtn">⏸ Pause</button>' +
    '</div>' +
    '<div style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--muted);line-height:1.7;border:1px solid var(--border)">' +
      'Field lines exit the <b style="color:#ef4444">N pole</b>, curve through space, and re-enter the <b style="color:#3b82f6">S pole</b>. Closer lines = stronger field near the poles.' +
    '</div>';

  withThree(function() {
    var mount = document.getElementById('mag3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x000010);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 4, 12);
    camera.lookAt(0,0,0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(5,8,5); scene.add(dl);

    var group = new THREE.Group();
    scene.add(group);
    var flipped = false, spinning = true;

    /* Magnet body */
    var northMat = new THREE.MeshPhongMaterial({color:0xef4444,shininess:80});
    var southMat = new THREE.MeshPhongMaterial({color:0x3b82f6,shininess:80});
    var north = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,2,16), northMat);
    north.position.y = 1; group.add(north);
    var south = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,2,16), southMat);
    south.position.y = -1; group.add(south);

    /* Field lines — parametric arcs from N to S */
    var fieldLines = [];
    var FIELD_COLOR_N = 0xef4444, FIELD_COLOR_S = 0x3b82f6;
    var numLines = 12;
    for (var li=0; li<numLines; li++) {
      var phi = (li / numLines) * Math.PI * 2;
      var arcPts = [];
      var R = 1.5 + (li % 4) * 0.8;
      for (var step=0; step<=40; step++) {
        var t2 = step / 40;
        var angle2 = t2 * Math.PI;
        var x = R * Math.sin(angle2) * Math.cos(phi);
        var y = 2 - R * (1 - Math.cos(angle2)) * 0.5;
        var z = R * Math.sin(angle2) * Math.sin(phi);
        arcPts.push(new THREE.Vector3(x, y, z));
      }
      var lineMat = new THREE.LineBasicMaterial({color:0xef4444,transparent:true,opacity:0.55});
      var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), lineMat);
      group.add(line);
      fieldLines.push(line);
    }

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });

    window.magFlip = function() {
      flipped = !flipped;
      north.material = flipped ? southMat : northMat;
      south.material = flipped ? northMat : southMat;
      fieldLines.forEach(function(l){ l.material.color.setHex(flipped ? 0x3b82f6 : 0xef4444); });
    };
    window.magToggle = function() {
      spinning = !spinning;
      document.getElementById('magAnimBtn').textContent = spinning ? '⏸ Pause' : '▶ Spin';
    };

    var raf;
    function animate(){ raf=requestAnimationFrame(animate); if(spinning) rotY+=0.006; group.rotation.y=rotY; group.rotation.x=rotX*0.4; renderer.render(scene,camera); }
    animate();
    window.simCleanup = function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.magFlip; delete window.magToggle; };
  });
};

/* ════════════════════════════════════════════════════
   10. SOLID SHAPES 3D (Class 8 Maths)
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['solid-shapes-3d'] = function(container) {
  var SOLIDS = [
    { name:'Cube',            F:6,  V:8,  E:12, geo:function(){ return new THREE.BoxGeometry(2.2,2.2,2.2); },          color:0x818cf8 },
    { name:'Triangular Prism',F:5,  V:6,  E:9,  geo:function(){ return new THREE.CylinderGeometry(0,1.5,2.5,3); },     color:0x34d399 },
    { name:'Square Pyramid',  F:5,  V:5,  E:8,  geo:function(){ return new THREE.ConeGeometry(1.5,2.5,4); },           color:0xfbbf24 },
    { name:'Cylinder',        F:3,  V:0,  E:2,  geo:function(){ return new THREE.CylinderGeometry(1.1,1.1,2.5,32); },  color:0x60a5fa },
    { name:'Cone',            F:2,  V:1,  E:1,  geo:function(){ return new THREE.ConeGeometry(1.3,2.8,32); },           color:0xf87171 },
    { name:'Tetrahedron',     F:4,  V:4,  E:6,  geo:function(){ return new THREE.TetrahedronGeometry(1.8); },           color:0xe879f9 },
  ];
  var cur = 0, wire = false;

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Visualising Solid Shapes 3D — Class 8</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">' +
      SOLIDS.map(function(s,i){ return '<button class="cbtn ss3d-btn" onclick="ss3dSel('+i+')" style="'+(i===0?'background:var(--acc);color:white;':'')+'">'+s.name+'</button>'; }).join('') +
    '</div>' +
    '<div id="ss3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#1a1040,#0a0520)"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">' +
      '<button class="cbtn" onclick="ss3dWire()" id="ss3dWireBtn">⬡ Wireframe</button>' +
    '</div>' +
    '<div id="ss3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.9;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('ss3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x0a0520);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 2, 9); camera.lookAt(0,0,0);

    scene.add(new THREE.AmbientLight(0xffffff,0.45));
    var dl=new THREE.DirectionalLight(0xffffff,1.0); dl.position.set(6,10,8); scene.add(dl);
    var grid=new THREE.GridHelper(10,10,0x334155,0x1e293b); grid.position.y=-2; scene.add(grid);

    var meshGroup=new THREE.Group(); scene.add(meshGroup);
    var wireMesh=null, rotX=0, rotY=0;

    function buildSolid(i) {
      while(meshGroup.children.length) meshGroup.remove(meshGroup.children[0]);
      wireMesh=null;
      var s=SOLIDS[i];
      var geo=s.geo();
      meshGroup.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({color:s.color,shininess:80,transparent:true,opacity:0.88})));
      wireMesh=new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.18}));
      wireMesh.visible=wire; meshGroup.add(wireMesh);
      document.querySelectorAll('.ss3d-btn').forEach(function(btn,bi){ btn.style.background=bi===i?'var(--acc)':''; btn.style.color=bi===i?'white':''; });
      var info=document.getElementById('ss3dInfo');
      if(info) info.innerHTML='<b style="color:var(--text);font-size:13px">'+s.name+'</b><br>'+
        'Faces: <b>'+s.F+'</b> &nbsp;|&nbsp; Vertices: <b>'+s.V+'</b> &nbsp;|&nbsp; Edges: <b>'+s.E+'</b><br>'+
        'Euler check: F+V\u2212E = '+s.F+'+'+s.V+'\u2212'+s.E+' = <b style="color:var(--evs)">'+(s.F+s.V-s.E)+'</b>';
    }
    window.ss3dSel=function(i){ cur=i; buildSolid(i); };
    window.ss3dWire=function(){ wire=!wire; if(wireMesh) wireMesh.visible=wire; document.getElementById('ss3dWireBtn').textContent=wire?'⬡ Solid':'⬡ Wireframe'; };
    buildSolid(0);
    addDrag(renderer.domElement,function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); rotY+=0.007; meshGroup.rotation.y=rotY; meshGroup.rotation.x=rotX; renderer.render(scene,camera); }
    animate();
    window.simCleanup=function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.ss3dSel; delete window.ss3dWire; };
  });
};

/* ════════════════════════════════════════════════════
   11. 3D COORDINATE GEOMETRY (Class 9 Maths)
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['coord-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">3D Coordinate Geometry — XYZ Space</div>' +
    '<div id="coord3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:#00000f"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="coord3dAdd()">➕ Add Point</button>' +
      '<button class="cbtn" onclick="coord3dClear()">↺ Clear</button>' +
    '</div>' +
    '<div id="coord3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.9;border:1px solid var(--border);font-family:monospace"></div>';

  withThree(function() {
    var mount = document.getElementById('coord3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x00000f);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(7, 6, 10); camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    /* Axes */
    var axLen = 5;
    [[axLen,0,0,0xef4444,'X'],[0,axLen,0,0x34d399,'Y'],[0,0,axLen,0x60a5fa,'Z']].forEach(function(ax) {
      var pts = [new THREE.Vector3(0,0,0), new THREE.Vector3(ax[0],ax[1],ax[2])];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:ax[3]})));
    });
    /* Grid */
    scene.add(new THREE.GridHelper(10,10,0x223344,0x112233));

    var points = [];
    var pointGroup = new THREE.Group(); scene.add(pointGroup);
    var COLOURS_PT = [0xf87171,0x34d399,0xfbbf24,0x60a5fa,0xe879f9,0xfb923c];

    var SAMPLE_POINTS = [[2,3,1],[4,1,3],[1,4,2],[3,2,4],[0,3,3]];
    var ptIdx = 0;

    function addPoint() {
      if (ptIdx >= SAMPLE_POINTS.length) ptIdx = 0;
      var p = SAMPLE_POINTS[ptIdx++];
      var col = COLOURS_PT[points.length % COLOURS_PT.length];
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18,10,10), new THREE.MeshBasicMaterial({color:col}));
      mesh.position.set(p[0],p[1],p[2]);
      pointGroup.add(mesh);
      /* Projection lines to planes */
      var lineMat = new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.3});
      [[p[0],0,p[2]],[p[0],p[1],0],[0,p[1],p[2]]].forEach(function(ep) {
        var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p[0],p[1],p[2]),new THREE.Vector3(ep[0],ep[1],ep[2])]),lineMat);
        pointGroup.add(l);
      });
      points.push({x:p[0],y:p[1],z:p[2],col:col});
      updateInfo();
    }

    function updateInfo() {
      var info = document.getElementById('coord3dInfo');
      if (!info) return;
      if (points.length === 0) { info.innerHTML = 'Press + Add Point to plot points in 3D space.'; return; }
      var last = points[points.length-1];
      var dist = Math.sqrt(last.x*last.x + last.y*last.y + last.z*last.z).toFixed(2);
      var rows = points.map(function(p,i){ return 'P'+(i+1)+'('+p.x+', '+p.y+', '+p.z+')'; }).join(' &nbsp; ');
      info.innerHTML = rows + '<br>Distance of last point from origin = \u221a(' +
        last.x+'\u00b2+'+last.y+'\u00b2+'+last.z+'\u00b2) = <b>'+dist+'</b>';
    }

    window.coord3dAdd = addPoint;
    window.coord3dClear = function() { while(pointGroup.children.length) pointGroup.remove(pointGroup.children[0]); points=[]; ptIdx=0; updateInfo(); };
    updateInfo();

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); scene.rotation.y=rotY; scene.rotation.x=rotX*0.3; renderer.render(scene,camera); }
    animate();
    window.simCleanup=function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.coord3dAdd; delete window.coord3dClear; };
  });
};

/* ════════════════════════════════════════════════════
   12. HEIGHTS AND DISTANCES 3D (Class 10 Maths)
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['heights-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Heights and Distances 3D — tan θ = h/d</div>' +
    '<div id="ht3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:#000a0a"></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">Angle θ° <input type="range" id="htAngle" min="10" max="75" value="45" step="1" oninput="htUpdate()"></label>' +
      '<label style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">Distance <input type="range" id="htDist" min="2" max="8" value="5" step="0.5" oninput="htUpdate()"></label>' +
    '</div>' +
    '<div id="ht3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:13px;line-height:2;border:1px solid var(--border);font-family:monospace"></div>';

  withThree(function() {
    var mount = document.getElementById('ht3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x000a0a);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(5, 4, 12); camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    var dl=new THREE.DirectionalLight(0xffffff,0.9); dl.position.set(5,10,5); scene.add(dl);
    scene.add(new THREE.GridHelper(16,16,0x1a3a3a,0x0d2020));

    var sceneGroup = new THREE.Group(); scene.add(sceneGroup);

    /* Tower */
    var tower = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,1,8), new THREE.MeshPhongMaterial({color:0xf87171,shininess:60}));
    sceneGroup.add(tower);

    /* Observer */
    var observer = new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8), new THREE.MeshPhongMaterial({color:0x34d399}));
    sceneGroup.add(observer);

    /* Lines */
    var horizLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:0x60a5fa,transparent:true,opacity:0.7}));
    var angleLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:0xfbbf24,transparent:true,opacity:0.9}));
    var vertLine  = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:0xf87171,transparent:true,opacity:0.7}));
    sceneGroup.add(horizLine); sceneGroup.add(angleLine); sceneGroup.add(vertLine);

    function htUpdate() {
      var angle = parseFloat(document.getElementById('htAngle').value);
      var dist  = parseFloat(document.getElementById('htDist').value);
      var h = dist * Math.tan(angle * Math.PI / 180);

      tower.scale.y = h;
      tower.position.set(0, h/2, 0);
      observer.position.set(dist, 0, 0);

      horizLine.geometry.setFromPoints([new THREE.Vector3(dist,0,0), new THREE.Vector3(0,0,0)]);
      angleLine.geometry.setFromPoints([new THREE.Vector3(dist,0,0), new THREE.Vector3(0,h,0)]);
      vertLine.geometry.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,h,0)]);

      var info = document.getElementById('ht3dInfo');
      if (info) info.innerHTML =
        '\u03b8 = <b>'+angle+'°</b> &nbsp;|&nbsp; Distance (d) = <b>'+dist+'</b><br>' +
        'Height (h) = d \u00d7 tan\u03b8 = '+dist+' \u00d7 tan('+angle+'°) = <b style="color:#34d399">'+h.toFixed(2)+'</b>';
    }
    window.htUpdate = htUpdate;
    htUpdate();

    var rotX=0, rotY=0;
    addDrag(renderer.domElement, function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); sceneGroup.rotation.y=rotY; sceneGroup.rotation.x=rotX*0.3; renderer.render(scene,camera); }
    animate();
    window.simCleanup=function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.htUpdate; };
  });
};

/* ════════════════════════════════════════════════════
   13. CIRCLES AND TANGENTS 3D (Class 10 Maths)
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['circles-tangents-3d'] = function(container) {
  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Circles and Tangents 3D</div>' +
    '<div id="circ3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse,#0a0a1f,#030310)"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="circ3dThm(0)" id="cirBtn0" style="background:var(--acc);color:white">Tangent ⊥ Radius</button>' +
      '<button class="cbtn" onclick="circ3dThm(1)" id="cirBtn1">Equal Tangents</button>' +
      '<button class="cbtn" onclick="circ3dThm(2)" id="cirBtn2">Angle in Semicircle</button>' +
    '</div>' +
    '<div id="circ3dInfo" style="background:var(--surface2);border-radius:10px;padding:10px 14px;margin-top:10px;font-size:12px;line-height:1.7;border:1px solid var(--border)"></div>';

  withThree(function() {
    var mount = document.getElementById('circ3dMount');
    if (!mount) return;
    var rr = makeRenderer(mount, 0x030310);
    var renderer = rr.renderer, scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, rr.w/rr.h, 0.1, 100);
    camera.position.set(0, 5, 10); camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    var dl=new THREE.DirectionalLight(0xffffff,0.9); dl.position.set(5,8,5); scene.add(dl);

    var group = new THREE.Group(); scene.add(group);
    var R = 2.5;

    var THEOREMS = [
      { label:'Tangent ⊥ Radius',      desc:'The tangent to a circle at any point is perpendicular to the radius at that point. Angle OAP = 90°.' },
      { label:'Equal Tangents',         desc:'Tangents from an external point P to a circle are equal in length: PA = PB. The line OP bisects angle APB.' },
      { label:'Angle in Semicircle',    desc:'The angle subtended by a diameter at any point on the circle is always 90°. This is Thales\' Theorem.' },
    ];

    function buildThm(i) {
      while (group.children.length) group.remove(group.children[0]);
      /* Circle */
      group.add(new THREE.Mesh(new THREE.TorusGeometry(R,0.06,8,64), new THREE.MeshBasicMaterial({color:0x818cf8})));
      /* Centre */
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8), new THREE.MeshBasicMaterial({color:0xffffff})));
      var lineMat = function(c){ return new THREE.LineBasicMaterial({color:c,transparent:true,opacity:0.85}); };
      var dotMat  = function(c){ return new THREE.MeshBasicMaterial({color:c}); };

      if (i===0) {
        /* Tangent point at (R,0,0), tangent vertical, radius horizontal */
        var pt = new THREE.Vector3(R,0,0);
        group.add(new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),dotMat(0xfbbf24))).position.copy(pt);
        var rad = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),pt]),lineMat(0xfbbf24));
        group.add(rad);
        var tang = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(R,-2,0),new THREE.Vector3(R,2,0)]),lineMat(0x34d399));
        group.add(tang);
        /* Right angle marker */
        var sq=[new THREE.Vector3(R-0.25,0,0),new THREE.Vector3(R-0.25,0.25,0),new THREE.Vector3(R,0.25,0)];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(sq),lineMat(0xffffff)));
      } else if (i===1) {
        var ext = new THREE.Vector3(5,0,0);
        group.add(new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),dotMat(0xf87171))).position.copy(ext);
        /* Two tangent points */
        var ang = Math.acos(R/5);
        var tA = new THREE.Vector3(R*Math.cos(ang), R*Math.sin(ang), 0);
        var tB = new THREE.Vector3(R*Math.cos(ang),-R*Math.sin(ang), 0);
        [tA,tB].forEach(function(t){
          group.add(new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),dotMat(0xfbbf24))).position.copy(t);
          group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([ext,t]),lineMat(0x34d399)));
          group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),t]),lineMat(0x60a5fa)));
        });
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),ext]),lineMat(0xffffff)));
      } else {
        /* Diameter + point on circle */
        var dA = new THREE.Vector3(-R,0,0), dB = new THREE.Vector3(R,0,0);
        var dC = new THREE.Vector3(R*Math.cos(1.1),R*Math.sin(1.1),0);
        [dA,dB,dC].forEach(function(p){ group.add(new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),dotMat(0xfbbf24))).position.copy(p); });
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([dA,dB]),lineMat(0x60a5fa)));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([dA,dC]),lineMat(0x34d399)));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([dB,dC]),lineMat(0xf87171)));
      }
      document.querySelectorAll('[id^="cirBtn"]').forEach(function(btn,bi){
        btn.style.background = bi===i ? 'var(--acc)' : '';
        btn.style.color = bi===i ? 'white' : '';
      });
      var info = document.getElementById('circ3dInfo');
      if (info) info.innerHTML = '<b style="color:var(--text)">'+THEOREMS[i].label+'</b><br>'+THEOREMS[i].desc;
    }
    window.circ3dThm = buildThm;
    buildThm(0);

    var rotX=0,rotY=0;
    addDrag(renderer.domElement,function(dx,dy){ rotY+=dx*0.01; rotX+=dy*0.01; });
    var raf;
    function animate(){ raf=requestAnimationFrame(animate); rotY+=0.006; group.rotation.y=rotY; group.rotation.x=rotX*0.3; renderer.render(scene,camera); }
    animate();
    window.simCleanup=function(){ cancelAnimationFrame(raf); renderer.dispose(); delete window.circ3dThm; };
  });
};

/* ════════════════════════════════════════════════════
   SOLAR SYSTEM 3D
   Replaces the 2D canvas version — sims-3d.js loads after sims.js
   ════════════════════════════════════════════════════ */
SIM_REGISTRY['solar-system'] = function(container) {

  var PLANETS = [
    { name:'Mercury', r:0.38,  orbitR:5.5,  period:0.24,  color:0xa8a8a8, tilt:0.03,  rings:false, moons:0,   dist:'57.9M km',  dia:'4,879 km',  fact:'Smallest planet. A year lasts just 88 Earth days. Temperatures swing 600°C between day and night.' },
    { name:'Venus',   r:0.95,  orbitR:8.5,  period:0.62,  color:0xe8c56a, tilt:177.4, rings:false, moons:0,   dist:'108M km',   dia:'12,104 km', fact:'Hottest planet at 465°C — hotter than Mercury. Rotates backwards. A day on Venus is longer than its year.' },
    { name:'Earth',   r:1.0,   orbitR:11.5, period:1.0,   color:0x4d96ff, tilt:23.5,  rings:false, moons:1,   dist:'150M km',   dia:'12,742 km', fact:'Only known planet with life. 71% covered by ocean. The Moon stabilises our axial tilt, making climate predictable.' },
    { name:'Mars',    r:0.53,  orbitR:15.0, period:1.88,  color:0xe8634a, tilt:25.2,  rings:false, moons:2,   dist:'228M km',   dia:'6,779 km',  fact:'Has Olympus Mons — 3x taller than Everest. Thin CO₂ atmosphere. India\'s Mangalyaan orbited Mars in 2014.' },
    { name:'Jupiter', r:3.5,   orbitR:22.0, period:11.86, color:0xc8945a, tilt:3.1,   rings:false, moons:95,  dist:'778M km',   dia:'139,820 km',fact:'Largest planet — 1,300 Earths fit inside it. Great Red Spot is a storm lasting 350+ years. Acts as solar system\'s bodyguard, deflecting asteroids.' },
    { name:'Saturn',  r:2.9,   orbitR:30.0, period:29.46, color:0xe8d06a, tilt:26.7,  rings:true,  moons:146, dist:'1.43B km',  dia:'116,460 km',fact:'So low-density it could float on water! Rings are mostly ice and rock, 282,000 km wide but only 100m thick.' },
    { name:'Uranus',  r:1.8,   orbitR:38.0, period:84.01, color:0x7de8e8, tilt:97.8,  rings:false, moons:27,  dist:'2.87B km',  dia:'50,724 km', fact:'Rotates on its side — possibly knocked over by a giant impact. Has faint rings. Its moons are named after Shakespeare characters.' },
    { name:'Neptune', r:1.75,  orbitR:46.0, period:164.8, color:0x4d6ef5, tilt:28.3,  rings:false, moons:16,  dist:'4.5B km',   dia:'49,244 km', fact:'Strongest winds in the solar system at 2,100 km/h. Takes 165 Earth years to orbit the Sun once.' },
  ];

  var SUN = { name:'Sun', r:4.5, color:0xfdb813, fact:'Contains 99.86% of all mass in the solar system. Its core temperature is 15 million°C. Light takes 8 minutes to reach Earth.', dia:'1,392,700 km', dist:'0 km' };

  container.innerHTML =
    '<div style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;text-align:center;margin-bottom:6px">Solar System 3D — drag to rotate · tap a planet</div>' +
    '<div id="ss3dMount" style="width:100%;border-radius:12px;overflow:hidden;background:#000008;position:relative"></div>' +
    '<div style="display:flex;gap:6px;margin-top:8px;justify-content:center;flex-wrap:wrap">' +
      '<button class="cbtn" onclick="ss3dPause()" id="ss3dPauseBtn">⏸ Pause</button>' +
      '<button class="cbtn" onclick="ss3dScale()" id="ss3dScaleBtn">🔭 Real Scale</button>' +
      '<button class="cbtn" onclick="ss3dReset()">↺ Reset View</button>' +
      '<label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)">Speed' +
        '<input type="range" min="1" max="10" value="3" step="1" oninput="ss3dSetSpeed(this.value)" style="width:70px"></label>' +
    '</div>' +
    '<div id="ss3dInfo" style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-top:8px;font-size:12px;line-height:1.8;min-height:52px;transition:all .2s">' +
      '<span style="color:var(--muted)">☝️ Tap any planet or the Sun to explore</span>' +
    '</div>';

  withThree(function() {
    var mount = document.getElementById('ss3dMount');
    if (!mount) return;

    /* ── Renderer ── */
    var W = mount.clientWidth || 340;
    var H = Math.round(W * 0.62);
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000008, 1);
    renderer.domElement.style.cssText = 'width:100%;height:auto;display:block;cursor:grab;touch-action:none;';
    mount.appendChild(renderer.domElement);

    /* ── Scene / Camera ── */
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    camera.position.set(0, 28, 55);
    camera.lookAt(0, 0, 0);

    /* ── Lighting ── */
    var sunLight = new THREE.PointLight(0xffffff, 2.5, 300);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111122, 0.8));

    /* ── Stars ── */
    var starGeo = new THREE.BufferGeometry();
    var starVerts = [];
    for (var si = 0; si < 2000; si++) {
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var rr    = 300 + Math.random() * 200;
      starVerts.push(rr * Math.sin(phi) * Math.cos(theta), rr * Math.sin(phi) * Math.sin(theta), rr * Math.cos(phi));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })));

    /* ── Sun ── */
    var sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN.r, 32, 32),
      new THREE.MeshBasicMaterial({ color: SUN.color })
    );
    scene.add(sunMesh);
    /* Sun glow */
    var sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(SUN.r * 1.35, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.12 })
    );
    scene.add(sunGlow);

    /* ── Planet data ── */
    var planetMeshes = [];
    var orbitLines   = [];
    var orreryOrbits = PLANETS.map(function(p) { return p.orbitR; });
    /* Real scale orbits (logarithmic so all visible) */
    var realOrbits = [5.5, 10.0, 13.5, 18.5, 40.0, 60.0, 78.0, 95.0];
    var realScale  = false;

    PLANETS.forEach(function(p, i) {
      /* Orbit ring */
      var orbitGeo = new THREE.TorusGeometry(p.orbitR, 0.04, 6, 120);
      var orbitMat = new THREE.MeshBasicMaterial({ color: 0x223344, transparent: true, opacity: 0.5 });
      var orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
      orbitMesh.rotation.x = Math.PI / 2;
      scene.add(orbitMesh);
      orbitLines.push(orbitMesh);

      /* Planet sphere */
      var mat = new THREE.MeshPhongMaterial({ color: p.color, shininess: p.name === 'Earth' ? 80 : 30 });

      /* Special texturing via vertex colour hints */
      if (p.name === 'Jupiter') {
        mat.color.setHex(0xc8945a);
      } else if (p.name === 'Earth') {
        mat.emissive.setHex(0x001133);
        mat.emissiveIntensity = 0.2;
      }

      var mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 22, 22), mat);
      mesh.rotation.z = p.tilt * Math.PI / 180;

      /* Saturn's rings */
      if (p.rings) {
        var ringGeo = new THREE.TorusGeometry(p.r * 2.0, p.r * 0.7, 4, 80);
        var ringMat = new THREE.MeshBasicMaterial({ color: 0xe8d09a, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
        var ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        mesh.add(ringMesh);
      }

      /* Moon for Earth */
      if (p.name === 'Earth') {
        var moonMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.27, 10, 10),
          new THREE.MeshPhongMaterial({ color: 0xbbbbbb, shininess: 10 })
        );
        moonMesh.position.set(p.r + 1.4, 0, 0);
        mesh.add(moonMesh);
      }

      /* Jupiter's Great Red Spot hint */
      if (p.name === 'Jupiter') {
        var spotMesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.r * 0.22, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xc84040 })
        );
        spotMesh.position.set(p.r * 0.9, -p.r * 0.2, 0.1);
        mesh.add(spotMesh);
      }

      scene.add(mesh);
      planetMeshes.push({ mesh: mesh, data: p, angle: Math.random() * Math.PI * 2, orbitR: p.orbitR });
    });

    /* ── Asteroid Belt (simple dots) ── */
    var beltGeo = new THREE.BufferGeometry();
    var beltVerts = [];
    for (var bi = 0; bi < 400; bi++) {
      var ba = Math.random() * Math.PI * 2;
      var br = 17.5 + Math.random() * 2;
      var by = (Math.random() - 0.5) * 0.6;
      beltVerts.push(br * Math.cos(ba), by, br * Math.sin(ba));
    }
    beltGeo.setAttribute('position', new THREE.Float32BufferAttribute(beltVerts, 3));
    scene.add(new THREE.Points(beltGeo, new THREE.PointsMaterial({ color: 0x666655, size: 0.18 })));

    /* ── Raycaster for click/tap ── */
    var raycaster = new THREE.Raycaster();
    var mouse     = new THREE.Vector2();

    function onPointerDown(e) {
      var rect = renderer.domElement.getBoundingClientRect();
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var cy = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x =  ((cx - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((cy - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      /* Check sun */
      var sunHit = raycaster.intersectObject(sunMesh);
      if (sunHit.length) { showInfo(SUN); return; }

      /* Check planets */
      var meshList = planetMeshes.map(function(pm) { return pm.mesh; });
      var hits = raycaster.intersectObjects(meshList, true);
      if (hits.length) {
        var hitMesh = hits[0].object;
        /* Walk up to root planet mesh */
        while (hitMesh.parent && !meshList.includes(hitMesh)) hitMesh = hitMesh.parent;
        var pm = planetMeshes.find(function(p) { return p.mesh === hitMesh; });
        if (pm) showInfo(pm.data);
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    function showInfo(p) {
      var el = document.getElementById('ss3dInfo');
      if (!el) return;
      el.innerHTML =
        '<b style="color:var(--text);font-size:13px">' + p.name + '</b>' +
        (p.dist !== '0 km' ? ' <span style="color:var(--muted);font-size:10px">· ' + p.dist + ' from Sun</span>' : '') + '<br>' +
        '<span style="color:var(--muted)">' + (p.dia ? 'Diameter: <b style="color:var(--text)">' + p.dia + '</b>' : '') +
        (p.moons !== undefined ? ' · Moons: <b style="color:var(--text)">' + p.moons + '</b>' : '') + '</span><br>' +
        '<span style="font-size:12px;color:var(--muted)">' + p.fact + '</span>';
    }

    /* ── Drag to orbit ── */
    var rotX = -0.38, rotY = 0;
    var dragging = false, lastX = 0, lastY = 0;
    var pivotGroup = new THREE.Group();
    scene.add(pivotGroup);
    /* Move everything into pivot */
    scene.children.slice().forEach(function(child) {
      if (child !== pivotGroup) { scene.remove(child); pivotGroup.add(child); }
    });

    renderer.domElement.addEventListener('pointerdown', function(e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    });
    renderer.domElement.addEventListener('pointermove', function(e) {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.008;
      rotX += (e.clientY - lastY) * 0.006;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      lastX = e.clientX; lastY = e.clientY;
    });
    renderer.domElement.addEventListener('pointerup',   function() { dragging = false; renderer.domElement.style.cursor = 'grab'; });
    renderer.domElement.addEventListener('pointerleave',function() { dragging = false; });

    /* Touch drag */
    var tLastX = 0, tLastY = 0;
    renderer.domElement.addEventListener('touchstart', function(e) { tLastX = e.touches[0].clientX; tLastY = e.touches[0].clientY; }, { passive: true });
    renderer.domElement.addEventListener('touchmove',  function(e) {
      e.preventDefault();
      rotY += (e.touches[0].clientX - tLastX) * 0.008;
      rotX += (e.touches[0].clientY - tLastY) * 0.006;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      tLastX = e.touches[0].clientX; tLastY = e.touches[0].clientY;
    }, { passive: false });

    /* ── Controls ── */
    var paused = false, speed = 3;

    window.ss3dPause = function() {
      paused = !paused;
      document.getElementById('ss3dPauseBtn').textContent = paused ? '▶ Resume' : '⏸ Pause';
    };

    window.ss3dSetSpeed = function(v) { speed = parseFloat(v); };

    window.ss3dReset = function() {
      rotX = -0.38; rotY = 0;
    };

    window.ss3dScale = function() {
      realScale = !realScale;
      var btn = document.getElementById('ss3dScaleBtn');
      btn.textContent = realScale ? '🪐 Orrery View' : '🔭 Real Scale';
      planetMeshes.forEach(function(pm, i) {
        pm.orbitR = realScale ? realOrbits[i] : orreryOrbits[i];
        /* Rescale orbit ring */
        orbitLines[i].geometry.dispose();
        orbitLines[i].geometry = new THREE.TorusGeometry(pm.orbitR, 0.04, 6, 120);
      });
      /* Show explanation */
      var el = document.getElementById('ss3dInfo');
      if (el) el.innerHTML = realScale
        ? '<b style="color:var(--text)">Real Scale Mode</b> — orbital distances now proportional to reality (logarithmic). Notice how the inner planets cluster near the Sun. In true scale, Earth would be invisible against Neptune\'s orbit.'
        : '<b style="color:var(--text)">Orrery Mode</b> — compressed orbits so all planets are visible at once. Tap any planet to explore.';
    };

    /* ── Animation ── */
    var raf;
    var t = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      if (!paused) {
        t += 0.003 * speed;
        planetMeshes.forEach(function(pm) {
          pm.angle += (0.003 * speed) / pm.data.period;
          pm.mesh.position.set(
            pm.orbitR * Math.cos(pm.angle),
            0,
            pm.orbitR * Math.sin(pm.angle)
          );
          pm.mesh.rotation.y += 0.008;
          /* Moon orbits Earth */
          if (pm.data.name === 'Earth') {
            var moon = pm.mesh.children.find(function(c) { return c.geometry && c.geometry.parameters && c.geometry.parameters.radius < 0.5; });
            if (moon) {
              moon.position.set((pm.data.r + 1.4) * Math.cos(t * 6), 0, (pm.data.r + 1.4) * Math.sin(t * 6));
            }
          }
        });
        sunMesh.rotation.y += 0.002;
        sunGlow.rotation.y -= 0.001;
      }
      pivotGroup.rotation.y = rotY;
      pivotGroup.rotation.x = rotX;
      renderer.render(scene, camera);
    }
    animate();

    window.simCleanup = function() {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      delete window.ss3dPause;
      delete window.ss3dSetSpeed;
      delete window.ss3dReset;
      delete window.ss3dScale;
    };
  });
};
