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
/* ══════════════════════════════════════════════════════════════
   CLASS 1 MATHS — INTERACTIVE SIMS
   ══════════════════════════════════════════════════════════════ */

/* ── COUNTING WITH OBJECTS ── */
SIM_REGISTRY['count-objects'] = function(c) {
  var count = 0, maxN = 20, objIdx = 0, items = [];
  var rounds = 0, score = 0, phase = 'place';
  var quizTarget = 0, quizOptions = [], quizAnswered = false;
  var objects = ['🍎','🌟','🔵','🍌','🐝','🌸','🎈','🐸'];

  function rnd(n) { return Math.floor(Math.random()*n); }
  function shuffle(a){ for(var i=a.length-1;i>0;i--){var j=rnd(i+1);var t=a[i];a[i]=a[j];a[j]=t;} return a; }

  function startQuiz() {
    phase = 'quiz';
    /* Count only items matching the currently selected emoji */
    var selectedEmoji = objects[objIdx];
    quizTarget = items.filter(function(it){ return it.e === selectedEmoji; }).length;
    quizAnswered = false;
    var opts = [quizTarget];
    while(opts.length < 4) {
      var v = Math.max(0, quizTarget + rnd(6) - 3);
      if(opts.indexOf(v) < 0) opts.push(v);
    }
    quizOptions = shuffle(opts);
    render();
  }

  function render() {
    c.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;width:100%';

    var topRow = document.createElement('div');
    topRow.style.cssText = 'display:flex;justify-content:space-between';
    topRow.innerHTML = '<span style="font-size:11px;color:var(--muted);font-weight:800">Round '+(rounds+1)+' of 5</span>'+
      '<span style="font-size:11px;color:var(--math);font-weight:800">Score: '+score+'/'+rounds+'</span>';
    wrap.appendChild(topRow);

    /* Object picker */
    var picker = document.createElement('div');
    picker.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap';
    objects.forEach(function(obj,i) {
      var btn = document.createElement('button');
      btn.textContent = obj;
      btn.style.cssText = 'font-size:20px;border-radius:8px;padding:3px 7px;cursor:pointer;border:2px solid '+(i===objIdx?'var(--math)':'transparent')+';background:'+(i===objIdx?'var(--math-dim)':'var(--surface2)');
      btn.onclick = function(){ objIdx=i; render(); };
      picker.appendChild(btn);
    });
    wrap.appendChild(picker);

    /* Canvas */
    var cv = document.createElement('canvas');
    cv.width = 300; cv.height = 170;
    cv.style.cssText = 'width:100%;max-width:300px;height:170px;display:block;border-radius:12px;background:var(--surface2);border:2px dashed var(--border);cursor:pointer;margin:0 auto';
    wrap.appendChild(cv);
    var ctx = cv.getContext('2d');

    function draw() {
      ctx.clearRect(0,0,300,170);
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      items.forEach(function(it){ ctx.fillText(it.e, it.x, it.y); });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 12px Nunito,sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Count: '+count, 6, 4);
    }
    draw();

    cv.addEventListener('click', function(e) {
      if(phase !== 'place' || count >= maxN) return;
      var r2 = cv.getBoundingClientRect();
      var x = (e.clientX-r2.left)*(300/r2.width), y = (e.clientY-r2.top)*(170/r2.height);
      items.push({x:x,y:y,e:objects[objIdx]}); count++;
      draw(); numDisp.textContent = count;
    });
    cv.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      if(phase !== 'place' || count===0) return;
      items.pop(); count--; draw(); numDisp.textContent = count;
    });

    /* Number display + +/- */
    var numRow = document.createElement('div');
    numRow.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:center';
    var numDisp = document.createElement('div');
    numDisp.style.cssText = 'font-size:52px;font-weight:900;color:var(--math);min-width:64px;text-align:center;line-height:1';
    numDisp.textContent = count;
    numRow.appendChild(numDisp);
    var minusBtn = document.createElement('button');
    minusBtn.className = 'cbtn'; minusBtn.textContent = '−'; minusBtn.style.cssText = 'font-size:20px;padding:4px 14px';
    minusBtn.onclick = function(){ if(count>0){items.pop();count--;draw();numDisp.textContent=count;} };
    var plusBtn = document.createElement('button');
    plusBtn.className = 'cbtn'; plusBtn.textContent = '+'; plusBtn.style.cssText = 'font-size:20px;padding:4px 14px';
    plusBtn.onclick = function(){ if(count<maxN){items.push({x:20+rnd(260),y:15+rnd(140),e:objects[objIdx]});count++;draw();numDisp.textContent=count;} };
    numRow.appendChild(minusBtn); numRow.appendChild(plusBtn);
    wrap.appendChild(numRow);

    /* Action row */
    var act = document.createElement('div');
    act.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap';

    if(phase === 'place' && count > 0) {
      var qBtn = document.createElement('button');
      qBtn.className = 'cbtn evs'; qBtn.textContent = 'Quiz me! ✏️';
      qBtn.onclick = startQuiz;
      act.appendChild(qBtn);
    }

    if(phase === 'quiz') {
      var qLabel = document.createElement('div');
      qLabel.style.cssText = 'width:100%;text-align:center;font-size:13px;font-weight:800;color:var(--text)';
      /* Show all placed emojis on canvas so student can count the specific one */
      var selectedEmoji = objects[objIdx];
      qLabel.textContent = 'How many '+selectedEmoji+' did you place?';
      act.appendChild(qLabel);
      quizOptions.forEach(function(opt) {
        var ob = document.createElement('button');
        ob.className = 'cbtn'; ob.textContent = opt;
        ob.style.cssText = 'font-size:20px;font-weight:900;padding:6px 18px';
        ob.onclick = function() {
          if(quizAnswered) return;
          quizAnswered = true;
          if(opt===quizTarget) score++;
          rounds++;
          ob.style.background = opt===quizTarget ? '#22c55e' : '#ef4444';
          ob.style.color = 'white';
          var fb = document.createElement('div');
          fb.style.cssText = 'width:100%;text-align:center;font-weight:800;font-size:13px;color:'+(opt===quizTarget?'#22c55e':'#f59e0b');
          var sel = objects[objIdx];
          fb.textContent = opt===quizTarget ? 'Correct! '+quizTarget+' '+sel+'!' : 'There were '+quizTarget+' '+sel+'!';
          act.appendChild(fb);
          if(rounds < 5) {
            var nx = document.createElement('button');
            nx.className = 'cbtn evs'; nx.textContent = 'Next →'; nx.style.marginTop='4px';
            nx.onclick = function(){ count=0;items=[];phase='place';render(); };
            act.appendChild(nx);
          } else {
            fb.textContent += ' Final: '+score+'/5 ⭐';
          }
        };
        act.appendChild(ob);
      });
    }

    var clrBtn = document.createElement('button');
    clrBtn.className = 'cbtn'; clrBtn.textContent = '↺ Clear';
    clrBtn.onclick = function(){ count=0;items=[];phase='place';render(); };
    act.appendChild(clrBtn);
    wrap.appendChild(act);

    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:var(--muted);text-align:center';
    hint.textContent = phase==='place' ? '👆 Tap box to drop objects · Right-click removes' : 'Count the objects and pick the number!';
    wrap.appendChild(hint);
    c.appendChild(wrap);
  }
  render();
};

/* ── SHAPES HUNT ── */
SIM_REGISTRY['shapes-hunt'] = function(c) {
  var shapeData = [
    {name:'Circle',    corners:0, sides:0,  col:'#ef4444', fact:'No corners, no sides — perfectly round! Found in: wheels, coins, sun.',
     draw:function(ctx,cx,cy){ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fill();ctx.stroke();}},
    {name:'Square',    corners:4, sides:4,  col:'#6366f1', fact:'4 equal sides and 4 equal corners! Found in: tiles, chess board, window panes.',
     draw:function(ctx,cx,cy){ctx.beginPath();ctx.rect(cx-50,cy-50,100,100);ctx.fill();ctx.stroke();}},
    {name:'Triangle',  corners:3, sides:3,  col:'#f59e0b', fact:'3 sides, 3 corners — fewest sides a shape can have! Found in: pyramids, road signs, pizza slices.',
     draw:function(ctx,cx,cy){ctx.beginPath();ctx.moveTo(cx,cy-58);ctx.lineTo(cx+52,cy+40);ctx.lineTo(cx-52,cy+40);ctx.closePath();ctx.fill();ctx.stroke();}},
    {name:'Rectangle', corners:4, sides:4,  col:'#22c55e', fact:'4 sides — but opposite sides are equal (not all 4)! Found in: doors, books, phones, bricks.',
     draw:function(ctx,cx,cy){ctx.beginPath();ctx.rect(cx-65,cy-38,130,76);ctx.fill();ctx.stroke();}},
    {name:'Oval',      corners:0, sides:0,  col:'#ec4899', fact:'Like a stretched circle — an ellipse! Found in: eggs, mirrors, rugby balls.',
     draw:function(ctx,cx,cy){ctx.beginPath();ctx.ellipse(cx,cy,65,42,0,0,Math.PI*2);ctx.fill();ctx.stroke();}},
    {name:'Pentagon',  corners:5, sides:5,  col:'#8b5cf6', fact:'5 sides, 5 corners! Found in: the Pentagon building, some flowers, soccer ball patches.',
     draw:function(ctx,cx,cy){
       ctx.beginPath();
       for(var i=0;i<5;i++){var a=-Math.PI/2+i/5*Math.PI*2;i===0?ctx.moveTo(cx+58*Math.cos(a),cy+58*Math.sin(a)):ctx.lineTo(cx+58*Math.cos(a),cy+58*Math.sin(a));}
       ctx.closePath();ctx.fill();ctx.stroke();}},
  ];

  /* Shuffle once — cycle through all 6 without repeating */
  function makeDeck() {
    var d=shapeData.slice();
    for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=d[i];d[i]=d[j];d[j]=t;}
    return d;
  }

  var deck=makeDeck(), deckIdx=0;
  var round=0, score=0, answered=false;
  var totalRounds=shapeData.length; /* 6 rounds, one per shape */

  function getQuestion() { return deck[deckIdx]; }

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    /* Header */
    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Shape '+(round+1)+' of '+totalRounds+'</span>'+
      '<span style="font-size:11px;color:var(--math);font-weight:800">Score: '+score+'/'+round+'</span>';
    wrap.appendChild(top);

    if(round >= totalRounds) {
      /* Final screen */
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:20px;display:flex;flex-direction:column;gap:12px;align-items:center';
      fin.innerHTML='<div style="font-size:48px">🎉</div>'+
        '<div style="font-size:18px;font-weight:900;color:var(--math)">All shapes done!</div>'+
        '<div style="font-size:14px;color:var(--muted)">Score: <b style="color:var(--text)">'+score+'/'+totalRounds+'</b></div>';
      var rb=document.createElement('button');
      rb.className='cbtn evs'; rb.textContent='↺ Play again';
      rb.onclick=function(){deck=makeDeck();deckIdx=0;round=0;score=0;answered=false;render();};
      fin.appendChild(rb); wrap.appendChild(fin); c.appendChild(wrap); return;
    }

    var sh=getQuestion();

    /* Canvas — draw the shape */
    var cv=document.createElement('canvas');
    cv.width=200; cv.height=160;
    cv.style.cssText='width:200px;height:160px;display:block;border-radius:12px;background:var(--surface2)';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');
    ctx.fillStyle=sh.col+'44'; ctx.strokeStyle=sh.col; ctx.lineWidth=3;
    sh.draw(ctx,100,78);

    /* Corner dots */
    ctx.fillStyle=sh.col;
    if(sh.name==='Square'){[[50,28],[150,28],[150,128],[50,128]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fill();});}
    if(sh.name==='Triangle'){[[100,20],[152,118],[48,118]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fill();});}
    if(sh.name==='Rectangle'){[[35,40],[165,40],[165,116],[35,116]].forEach(function(p){ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fill();});}
    if(sh.name==='Pentagon'){for(var pi=0;pi<5;pi++){var pa=-Math.PI/2+pi/5*Math.PI*2;ctx.beginPath();ctx.arc(100+58*Math.cos(pa),78+58*Math.sin(pa),5,0,Math.PI*2);ctx.fill();}}

    /* Properties label */
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(sh.corners===0?'No corners':'Corners: '+sh.corners+'   Sides: '+sh.sides, 100, 152);

    /* Question */
    var q=document.createElement('div');
    q.style.cssText='font-size:14px;font-weight:800;color:var(--text);text-align:center';
    q.textContent='What shape is this?';
    wrap.appendChild(q);

    /* Answer options — all 6 shapes as buttons */
    var opts=document.createElement('div');
    opts.style.cssText='display:flex;flex-wrap:wrap;gap:7px;justify-content:center';
    shapeData.forEach(function(sd) {
      var btn=document.createElement('button');
      btn.className='cbtn';
      btn.style.cssText='font-size:12px;padding:7px 13px;min-width:90px';
      btn.textContent=sd.name;
      if(answered) {
        btn.disabled=true;
        if(sd.name===sh.name) {btn.style.background='#22c55e';btn.style.color='white';}
      }
      btn.onclick=function(){
        if(answered) return;
        answered=true;
        var correct=sd.name===sh.name;
        if(correct) score++;
        round++;
        btn.style.background=correct?'#22c55e':'#ef4444';
        btn.style.color='white';
        /* Mark correct answer green */
        opts.querySelectorAll('button').forEach(function(b){
          b.disabled=true;
          if(b.textContent===sh.name&&!correct) {b.style.background='#22c55e';b.style.color='white';}
        });
        var fb=document.createElement('div');
        fb.style.cssText='width:100%;text-align:center;font-size:11px;font-weight:700;padding:7px 10px;background:var(--surface2);border-radius:8px;color:var(--text);line-height:1.5';
        fb.textContent=(correct?'✅ ':'')+sh.name+'! '+sh.fact;
        wrap.appendChild(fb);
        var nx=document.createElement('button');
        nx.className='cbtn evs'; nx.textContent=round<totalRounds?'Next shape →':'See results!';
        nx.style.marginTop='4px';
        nx.onclick=function(){deckIdx++;answered=false;render();};
        wrap.appendChild(nx);
      };
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    c.appendChild(wrap);
  }
  render();
};

SIM_REGISTRY['measurement-compare'] = function(c) {
  /* Objects with real-world heights in cm */
  var objects = [
    {name:'Eraser',    cm:4,   emoji:'🧹', col:'#ef4444'},
    {name:'Pencil',    cm:19,  emoji:'✏️', col:'#f59e0b'},
    {name:'Shoe',      cm:28,  emoji:'👟', col:'#ec4899'},
    {name:'Bottle',    cm:30,  emoji:'🍶', col:'#22d3ee'},
    {name:'Ruler',     cm:30,  emoji:'📏', col:'#f97316'},
    {name:'Cat',       cm:25,  emoji:'🐱', col:'#a855f7'},
    {name:'Schoolbag', cm:45,  emoji:'🎒', col:'#6366f1'},
    {name:'Chair',     cm:80,  emoji:'🪑', col:'#0ea5e9'},
    {name:'Table',     cm:75,  emoji:'🪑', col:'#d97706'},
    {name:'Door',      cm:200, emoji:'🚪', col:'#78716c'},
    {name:'Tree',      cm:300, emoji:'🌳', col:'#16a34a'},
    {name:'Child',     cm:110, emoji:'🧒', col:'#f43f5e'},
  ];

  var round=0, score=0, maxRounds=10, answered=false;
  var usedPairs=[], iA=0, iB=1;
  var questionType='taller';

  function pickPair() {
    if(round>=maxRounds){render(iA,iB);return;}
    answered=false;
    questionType=round%2===0?'taller':'shorter';
    var tries=0;
    do {
      iA=Math.floor(Math.random()*objects.length);
      iB=Math.floor(Math.random()*objects.length);
      tries++;
    } while((iA===iB||usedPairs.indexOf(Math.min(iA,iB)+'-'+Math.max(iA,iB))>=0)&&tries<50);
    usedPairs.push(Math.min(iA,iB)+'-'+Math.max(iA,iB));
    render(iA,iB);
  }

  function render(idxA, idxB) {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    /* Header */
    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Round '+(round+1)+' of '+maxRounds+'</span>'+
      '<span style="font-size:11px;color:var(--math);font-weight:800">Score: '+score+'/'+round+'</span>';
    wrap.appendChild(top);

    if(round>=maxRounds){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center';
      fin.innerHTML='<div style="font-size:40px">🏆</div><div style="font-size:16px;font-weight:900;color:var(--math)">Done! Score: '+score+'/'+maxRounds+'</div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Play again';
      rb.onclick=function(){round=0;score=0;usedPairs=[];pickPair();};fin.appendChild(rb);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    var a=objects[idxA], b=objects[idxB];
    /* Scale so BOTH objects are visible — shorter gets min 40px, taller gets max 160px */
    var maxCm=Math.max(a.cm, b.cm), minCm=Math.min(a.cm, b.cm);
    var canvasH=220, baseY=canvasH-28;
    /* Min bar height 40px ensures short objects are visible */
    var minBarH=40, maxBarH=160;
    /* Scale: taller object → maxBarH, shorter → proportional but at least minBarH */
    var ratio=minCm/maxCm;
    var tallH=maxBarH;
    var shortH=Math.max(minBarH, Math.round(tallH*ratio));
    var hA=a.cm>=b.cm ? tallH : shortH;
    var hB=b.cm>=a.cm ? tallH : shortH;

    /* Canvas */
    var cv=document.createElement('canvas');
    cv.width=280; cv.height=canvasH;
    cv.style.cssText='width:100%;max-width:280px;height:'+canvasH+'px;display:block;border-radius:12px;background:var(--surface2);margin:0 auto';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');

    /* Sky */
    ctx.fillStyle='#e0f2fe'; ctx.fillRect(0,0,280,baseY);
    /* Ground */
    ctx.fillStyle='#d4edbc'; ctx.fillRect(0,baseY,280,canvasH-baseY);
    ctx.strokeStyle='#86a96a'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,baseY); ctx.lineTo(280,baseY); ctx.stroke();

    /* Dashed height comparison line */
    var shorterH=Math.min(hA,hB);
    ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(148,163,184,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(15,baseY-shorterH); ctx.lineTo(265,baseY-shorterH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(100,100,100,0.5)'; ctx.font='9px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('←same height', 15, baseY-shorterH-3);

    function drawObj(obj, bh, cx) {
      /* Coloured bar */
      ctx.fillStyle=obj.col+'55';
      ctx.fillRect(cx-28, baseY-bh, 56, bh);
      ctx.strokeStyle=obj.col; ctx.lineWidth=2.5;
      ctx.strokeRect(cx-28, baseY-bh, 56, bh);
      /* Emoji inside bar */
      var emojiSize=Math.min(40, bh-8);
      if(emojiSize>=14) {
        ctx.font=emojiSize+'px serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(obj.emoji, cx, baseY-bh/2);
      }
      /* Name below ground */
      ctx.fillStyle=obj.col; ctx.font='bold 10px Nunito,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.fillText(obj.name, cx, baseY+4);
      /* Height label above bar */
      ctx.fillStyle='#1e293b'; ctx.font='bold 10px Nunito,sans-serif';
      ctx.textBaseline='bottom';
      ctx.fillText(obj.cm+'cm', cx, baseY-bh-2);
    }

    drawObj(a, hA, 85);
    drawObj(b, hB, 195);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.font='9px Nunito,sans-serif';
    ctx.textBaseline='top';
    ctx.fillText(a.cm+'cm', 70, baseY+2);

    /* Object B */
    ctx.fillStyle=b.col+'44';
    ctx.fillRect(175, baseY-hB, 60, hB);
    ctx.strokeStyle=b.col;ctx.lineWidth=2;
    ctx.strokeRect(175, baseY-hB, 60, hB);
    ctx.font=Math.min(36, hB-4)+'px serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(hB>20) ctx.fillText(b.emoji, 205, baseY-hB/2);
    ctx.fillStyle=b.col;ctx.font='bold 10px Nunito,sans-serif';
    ctx.textBaseline='bottom';
    ctx.fillText(b.name, 205, baseY-hB-2);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.font='9px Nunito,sans-serif';
    ctx.textBaseline='top';
    ctx.fillText(b.cm+'cm', 205, baseY+2);

    /* Question */
    var q=document.createElement('div');
    q.style.cssText='font-size:15px;font-weight:900;color:var(--text);text-align:center';
    q.innerHTML='Which is <b style="color:'+(questionType==='taller'?'#22c55e':'#f59e0b')+'">'+(questionType==='taller'?'TALLER':'SHORTER')+'</b>?';
    wrap.appendChild(q);

    var info=document.createElement('div');
    info.style.cssText='font-size:11px;color:var(--muted);text-align:center';
    info.textContent=a.name+' = '+a.cm+'cm · '+b.name+' = '+b.cm+'cm in real life';
    wrap.appendChild(info);

    /* Answer buttons */
    var btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;gap:10px;justify-content:center';
    [a,b].forEach(function(obj){
      var btn=document.createElement('button');
      btn.className='cbtn';
      btn.innerHTML=obj.emoji+' '+obj.name;
      btn.style.cssText='font-size:13px;padding:8px 18px';
      btn.onclick=function(){
        if(answered)return; answered=true;
        var correct= questionType==='taller'
          ? obj.name===(a.cm>b.cm?a:b).name
          : obj.name===(a.cm<b.cm?a:b).name;
        var answer=questionType==='taller'?(a.cm>b.cm?a:b):(a.cm<b.cm?a:b);
        if(correct)score++;round++;
        btn.style.background=correct?'#22c55e':'#ef4444';btn.style.color='white';
        var fb=document.createElement('div');
        fb.style.cssText='text-align:center;font-size:12px;font-weight:700;color:'+(correct?'#22c55e':'#f59e0b');
        fb.textContent=correct?'Correct! '+answer.name+' is '+questionType+'! ('+answer.cm+'cm)':'The '+answer.name+' is '+questionType+'! ('+answer.cm+'cm)';
        wrap.appendChild(fb);
        if(round<maxRounds){
          var nx=document.createElement('button');nx.className='cbtn evs';nx.textContent='Next →';nx.style.marginTop='4px';
          nx.onclick=pickPair;wrap.appendChild(nx);
        } else {
          fb.textContent+=' | Final: '+score+'/'+maxRounds+' ⭐';
          var rx=document.createElement('button');rx.className='cbtn';rx.textContent='↺ Again';rx.style.marginTop='4px';
          rx.onclick=function(){round=0;score=0;usedPairs=[];pickPair();};wrap.appendChild(rx);
        }
      };
      btnRow.appendChild(btn);
    });
    wrap.appendChild(btnRow);
    c.appendChild(wrap);
  }
  pickPair();
};

SIM_REGISTRY['more-less'] = function(c) {
  var round=0, score=0, maxRounds=10, answered=false;
  var emojis=['🍎','🐝','⭐','🐸','🌸','🦋','🎈','🍌','🐠','🌶️'];
  var emojiIdx=0;
  var countA=0, countB=0;
  var mode='watch'; /* watch (auto-generated) | build (student adds) */
  var buildA=0, buildB=0; /* student-set counts */

  /* Mix: 60% compare, 20% equal, 20% build-your-own */
  function pick() {
    if(round>=maxRounds){render();return;}
    answered=false;
    emojiIdx=Math.floor(Math.random()*emojis.length);
    var r=Math.random();
    if(r<0.2) {
      /* Equal case */
      countA=2+Math.floor(Math.random()*7);
      countB=countA;
      mode='watch';
    } else if(r<0.35) {
      /* Build mode — student decides */
      mode='build'; buildA=3; buildB=3;
      countA=0; countB=0;
    } else {
      countA=1+Math.floor(Math.random()*9);
      do{countB=1+Math.floor(Math.random()*9);}while(countB===countA);
      mode='watch';
    }
    render();
  }

  function renderGroup(n, label, col, onPlus, onMinus, editable) {
    var div=document.createElement('div');
    div.style.cssText='display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;background:var(--surface2);border-radius:12px;padding:8px;min-width:0';
    var title=document.createElement('div');
    title.style.cssText='font-size:11px;font-weight:800;color:'+col;
    title.textContent=label;
    div.appendChild(title);
    /* Emoji grid */
    var grid=document.createElement('div');
    grid.style.cssText='display:flex;flex-wrap:wrap;gap:2px;justify-content:center;min-height:80px;align-content:flex-start;padding:4px';
    for(var i=0;i<n;i++){
      var em=document.createElement('span');
      em.style.cssText='font-size:22px;line-height:1';
      em.textContent=emojis[emojiIdx];
      grid.appendChild(em);
    }
    div.appendChild(grid);
    /* Number display */
    var numRow=document.createElement('div');
    numRow.style.cssText='display:flex;align-items:center;gap:6px';
    if(editable){
      var mn=document.createElement('button'); mn.className='cbtn'; mn.textContent='−'; mn.style.padding='2px 10px';
      mn.onclick=function(){if(n>0)onMinus();};
      numRow.appendChild(mn);
    }
    var numEl=document.createElement('span');
    numEl.style.cssText='font-size:28px;font-weight:900;color:'+col+';min-width:36px;text-align:center';
    numEl.textContent=n;
    numRow.appendChild(numEl);
    if(editable){
      var pl=document.createElement('button'); pl.className='cbtn'; pl.textContent='+'; pl.style.padding='2px 10px';
      pl.onclick=function(){if(n<10)onPlus();};
      numRow.appendChild(pl);
    }
    div.appendChild(numRow);
    return div;
  }

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Round '+(round+1)+' of '+maxRounds+'</span>'+
      '<span style="font-size:11px;color:var(--math);font-weight:800">Score: '+score+'/'+round+'</span>';
    wrap.appendChild(top);

    if(round>=maxRounds){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center';
      fin.innerHTML='<div style="font-size:40px">🏆</div><div style="font-size:16px;font-weight:900;color:var(--math)">Done! Score: '+score+'/'+maxRounds+'</div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Play again';
      rb.onclick=function(){round=0;score=0;pick();};fin.appendChild(rb);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    if(mode==='build') {
      /* Student builds both groups */
      var instr=document.createElement('div');
      instr.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
      instr.textContent='Make Group A have MORE than Group B!';
      wrap.appendChild(instr);

      var groups=document.createElement('div');
      groups.style.cssText='display:flex;gap:10px;width:100%';

      function rebuildGroups() {
        groups.innerHTML='';
        groups.appendChild(renderGroup(buildA,'Group A','#6366f1',
          function(){buildA++;rebuildGroups();},
          function(){buildA--;rebuildGroups();}, true));
        var croc=document.createElement('div');
        croc.style.cssText='font-size:28px;align-self:center;font-weight:900;color:var(--math)';
        croc.textContent=buildA>buildB?'>':buildA<buildB?'<':'=';
        groups.appendChild(croc);
        groups.appendChild(renderGroup(buildB,'Group B','#ec4899',
          function(){buildB++;rebuildGroups();},
          function(){buildB--;rebuildGroups();}, true));
      }
      rebuildGroups();
      wrap.appendChild(groups);

      var checkBtn=document.createElement('button');
      checkBtn.className='cbtn evs'; checkBtn.textContent='Check! ✅';
      checkBtn.onclick=function(){
        var correct=buildA>buildB;
        score+=correct?1:0; round++;
        var fb=document.createElement('div');
        fb.style.cssText='text-align:center;font-size:13px;font-weight:800;color:'+(correct?'#22c55e':'#f59e0b');
        fb.textContent=correct?'Correct! '+buildA+' > '+buildB+' — Group A has more!':'Not quite! '+buildA+(buildA>buildB?'>':buildA===buildB?'=':'<')+buildB+'. Try making A bigger than B!';
        wrap.appendChild(fb);
        checkBtn.style.display='none';
        if(round<maxRounds){var nx=document.createElement('button');nx.className='cbtn evs';nx.textContent='Next →';nx.style.marginTop='4px';nx.onclick=pick;wrap.appendChild(nx);}
        else{fb.textContent+=' | Final: '+score+'/'+maxRounds+' ⭐';}
      };
      wrap.appendChild(checkBtn);
    } else {
      /* Watch mode — show generated counts */
      var groups2=document.createElement('div');
      groups2.style.cssText='display:flex;gap:10px;width:100%';
      groups2.appendChild(renderGroup(countA,'Group A','#6366f1',null,null,false));
      var croc2=document.createElement('div');
      croc2.style.cssText='font-size:28px;align-self:center;font-weight:900;color:var(--math)';
      croc2.textContent='?';
      groups2.appendChild(croc2);
      groups2.appendChild(renderGroup(countB,'Group B','#ec4899',null,null,false));
      wrap.appendChild(groups2);

      var q=document.createElement('div');
      q.style.cssText='font-size:14px;font-weight:800;color:var(--text);text-align:center';
      q.textContent='Which group has MORE? (or are they equal?)';
      wrap.appendChild(q);

      var btnRow=document.createElement('div');
      btnRow.style.cssText='display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
      var options=[['Group A has more',countA>countB],['They are equal',countA===countB],['Group B has more',countB>countA]];
      options.forEach(function(opt){
        var btn=document.createElement('button');
        btn.className='cbtn'; btn.textContent=opt[0];
        btn.style.cssText='font-size:12px;padding:8px 12px';
        btn.onclick=function(){
          if(answered)return; answered=true;
          if(opt[1]) score++; round++;
          btn.style.background=opt[1]?'#22c55e':'#ef4444'; btn.style.color='white';
          /* Show correct */
          btnRow.querySelectorAll('button').forEach(function(b,bi){
            b.disabled=true;
            if(options[bi][1]) {b.style.background='#22c55e';b.style.color='white';}
          });
          /* Reveal croc */
          croc2.textContent=countA>countB?'>':countA<countB?'<':'=';
          croc2.style.color=countA===countB?'#f59e0b':'#22c55e';
          var fb=document.createElement('div');
          fb.style.cssText='text-align:center;font-size:12px;font-weight:700;color:'+(opt[1]?'#22c55e':'#f59e0b');
          var ans=countA>countB?'Group A ('+countA+') has more':countA===countB?'They are equal (both '+countA+')':'Group B ('+countB+') has more';
          fb.textContent=opt[1]?'Correct! '+ans:ans+'!';
          wrap.appendChild(fb);
          if(round<maxRounds){var nx=document.createElement('button');nx.className='cbtn evs';nx.textContent='Next →';nx.style.marginTop='4px';nx.onclick=pick;wrap.appendChild(nx);}
          else{fb.textContent+=' | Final: '+score+'/'+maxRounds+' ⭐';var rx=document.createElement('button');rx.className='cbtn';rx.textContent='↺ Again';rx.style.marginTop='4px';rx.onclick=function(){round=0;score=0;pick();};wrap.appendChild(rx);}
        };
        btnRow.appendChild(btn);
      });
      wrap.appendChild(btnRow);
    }

    var hint=document.createElement('div');
    hint.style.cssText='font-size:11px;color:var(--muted);text-align:center';
    hint.innerHTML='🐊 The <b>&gt;</b> mouth always faces the bigger number!';
    wrap.appendChild(hint);
    c.appendChild(wrap);
  }
  pick();
};

SIM_REGISTRY['pattern-maker'] = function(c) {
  /* Pattern Train — student taps coloured tiles to continue a repeating pattern */
  var round=0, score=0, maxRounds=8, answered=false;

  var patterns=[
    {seq:['🔴','🔵'],            repeat:2, show:4, need:3, label:'AB pattern'},
    {seq:['🔴','🔴','🔵'],       repeat:3, show:4, need:3, label:'AAB pattern'},
    {seq:['🔴','🔵','🟡'],       repeat:3, show:4, need:3, label:'ABC pattern'},
    {seq:['🟢','🟢','🟣','🟣'],  repeat:4, show:4, need:4, label:'AABB pattern'},
    {seq:['⭐','🌙','⭐','⭐'],   repeat:4, show:4, need:4, label:'ABAA pattern'},
    {seq:['🐱','🐶','🐶'],       repeat:3, show:4, need:3, label:'ABB pattern'},
    {seq:['🔴','🔵','🔴','🟡'], repeat:4, show:4, need:4, label:'ABAC pattern'},
    {seq:['⭐','⭐','⭐','🌙'],   repeat:4, show:4, need:4, label:'AAAB pattern'},
  ];

  var deck=patterns.slice();
  (function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}})(deck);

  var current=null;
  var studentAnswers=[]; /* tiles placed by student */

  function makeAnswers(p) {
    /* Generate the next `need` items by continuing the sequence */
    var ans=[];
    var offset=p.show; /* how many are shown */
    for(var i=0;i<p.need;i++){
      ans.push(p.seq[(offset+i)%p.repeat]);
    }
    return ans;
  }

  function startRound() {
    if(round>=maxRounds){render();return;}
    current=deck[round%deck.length];
    studentAnswers=[];
    answered=false;
    render();
  }

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:12px;align-items:center;width:100%';

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Pattern '+(round+1)+' of '+maxRounds+'</span>'+
      '<span style="font-size:11px;color:var(--math);font-weight:800">Score: '+score+'/'+round+'</span>';
    wrap.appendChild(top);

    if(round>=maxRounds){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:12px;align-items:center';
      fin.innerHTML='<div style="font-size:48px">🎉</div><div style="font-size:18px;font-weight:900;color:var(--math)">Patterns master!</div>'+
        '<div style="color:var(--muted)">Score: <b style="color:var(--text)">'+score+'/'+maxRounds+'</b></div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Play again';
      rb.onclick=function(){round=0;score=0;startRound();};fin.appendChild(rb);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    var p=current;
    var correctAnswers=makeAnswers(p);

    /* Pattern name tag */
    var ptag=document.createElement('div');
    ptag.style.cssText='font-size:11px;font-weight:800;color:var(--muted);text-align:center;letter-spacing:1px;text-transform:uppercase';
    ptag.textContent=p.label;
    wrap.appendChild(ptag);

    /* The Train — shown tiles + blank slots */
    var trainWrap=document.createElement('div');
    trainWrap.style.cssText='display:flex;flex-direction:column;gap:6px;align-items:center;width:100%';

    var trainRow=document.createElement('div');
    trainRow.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:10px;background:var(--surface2);border-radius:12px;width:100%;box-sizing:border-box';

    /* Shown tiles */
    for(var si=0;si<p.show;si++){
      var tile=document.createElement('div');
      tile.style.cssText='font-size:32px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:var(--surface);border-radius:10px;border:2px solid var(--border)';
      tile.textContent=p.seq[si%p.repeat];
      trainRow.appendChild(tile);
    }

    /* Arrow */
    var arrow=document.createElement('div');
    arrow.style.cssText='font-size:20px;align-self:center;color:var(--muted)';
    arrow.textContent='→';
    trainRow.appendChild(arrow);

    /* Answer slots */
    for(var ai=0;ai<p.need;ai++){
      var slot=document.createElement('div');
      var filled=ai<studentAnswers.length;
      var isCorrect=filled&&studentAnswers[ai]===correctAnswers[ai];
      slot.style.cssText='font-size:32px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:2px dashed '+(filled?(isCorrect?'#22c55e':'#ef4444'):'var(--math)')+';background:'+(filled?(isCorrect?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'):'var(--math-dim)');
      slot.textContent=filled?studentAnswers[ai]:'?';
      trainRow.appendChild(slot);
    }
    trainWrap.appendChild(trainRow);
    wrap.appendChild(trainWrap);

    /* Instruction */
    var instr=document.createElement('div');
    instr.style.cssText='font-size:12px;font-weight:700;color:var(--text);text-align:center';
    instr.textContent=answered?'Pattern complete!':
      studentAnswers.length<p.need?'Tap the tiles below to continue the pattern ('+p.need+' more needed):':'Tap Check!';
    wrap.appendChild(instr);

    /* Colour picker — unique symbols from this pattern */
    if(!answered){
      var uniq=[];
      p.seq.forEach(function(s){if(uniq.indexOf(s)<0)uniq.push(s);});
      /* Add 1-2 distractors */
      var allTiles=['🔴','🔵','🟡','🟢','🟣','⭐','🌙','🐱','🐶','🍎','🍌'];
      allTiles.forEach(function(t){if(uniq.indexOf(t)<0&&uniq.length<uniq.length+2)uniq.push(t);});
      /* Limit to pattern symbols + 1 distractor */
      var pickerSyms=p.seq.filter(function(s,i,a){return a.indexOf(s)===i;}).concat(
        allTiles.filter(function(s){return p.seq.indexOf(s)<0;}).slice(0,1)
      );

      var picker=document.createElement('div');
      picker.style.cssText='display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
      pickerSyms.forEach(function(sym){
        var btn=document.createElement('button');
        btn.style.cssText='font-size:32px;width:52px;height:52px;border-radius:12px;background:var(--surface2);border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center';
        btn.textContent=sym;
        btn.onclick=function(){
          if(answered||studentAnswers.length>=p.need) return;
          studentAnswers.push(sym);
          render();
        };
        picker.appendChild(btn);
      });

      /* Backspace */
      if(studentAnswers.length>0){
        var back=document.createElement('button');
        back.style.cssText='font-size:18px;width:52px;height:52px;border-radius:12px;background:var(--surface2);border:2px solid var(--border);cursor:pointer';
        back.textContent='⌫';
        back.onclick=function(){studentAnswers.pop();render();};
        picker.appendChild(back);
      }
      wrap.appendChild(picker);
    }

    /* Check / feedback */
    if(studentAnswers.length>=p.need&&!answered){
      var checkBtn=document.createElement('button');
      checkBtn.className='cbtn evs'; checkBtn.textContent='Check! ✅';
      checkBtn.onclick=function(){
        answered=true;
        var allCorrect=correctAnswers.every(function(ans,i){return studentAnswers[i]===ans;});
        if(allCorrect) score++;
        round++;
        render();
        /* Show feedback after re-render */
        var fb=document.createElement('div');
        fb.style.cssText='text-align:center;font-size:13px;font-weight:800;margin-top:8px;padding:8px;border-radius:8px;background:var(--surface2);color:'+(allCorrect?'#22c55e':'#f59e0b');
        fb.textContent=allCorrect?'🎉 Correct! You spotted the '+p.label+'!':
          '❌ The pattern was: '+correctAnswers.join(' ')+' — '+p.label;
        c.firstChild.appendChild(fb);
        var nx=document.createElement('button');
        nx.className='cbtn evs'; nx.textContent=round<maxRounds?'Next pattern →':'See results!';
        nx.style.cssText='display:block;margin:6px auto 0';
        nx.onclick=startRound;
        c.firstChild.appendChild(nx);
      };
      wrap.appendChild(checkBtn);
    }

    c.appendChild(wrap);
  }
  startRound();
};

/* ══════════════════════════════════════════════════════════════
   CLASS 1 — EVS & LIFE SKILLS INTERACTIVE SIMS
   ══════════════════════════════════════════════════════════════ */

/* ── FAMILY TREE — drag names to tree slots ── */
SIM_REGISTRY['family-tree'] = function(c) {
  var phase='explore'; /* explore | quiz */
  var quizIdx=0, score=0, quizAnswered=false;

  /* Family relationships explained visually */
  var members=[
    {role:'Grandmother', emoji:'👵', relation:'Mother\'s or Father\'s mother', colour:'#ec4899',
     fact:'Your grandmother is your parent\'s mother. She is your mother\'s or father\'s mum!',
     riddle:'I am your father\'s mother. Who am I?', answer:'Grandmother',
     options:['Sister','Grandmother','Aunt','Mother']},
    {role:'Grandfather', emoji:'👴', relation:'Mother\'s or Father\'s father', colour:'#6366f1',
     fact:'Your grandfather is your parent\'s father. You call your mum\'s dad "grandfather" too!',
     riddle:'I am your mother\'s father. Who am I?', answer:'Grandfather',
     options:['Uncle','Brother','Grandfather','Father']},
    {role:'Mother',      emoji:'👩', relation:'She takes care of you at home', colour:'#f43f5e',
     fact:'Your mother gave birth to you. She and your father are your parents.',
     riddle:'She is my parent. I call her...?', answer:'Mother',
     options:['Aunt','Sister','Grandmother','Mother']},
    {role:'Father',      emoji:'👨', relation:'He is your other parent', colour:'#3b82f6',
     fact:'Your father and mother together make your family. He is your parent too!',
     riddle:'He is my parent. I call him...?', answer:'Father',
     options:['Uncle','Father','Brother','Grandfather']},
    {role:'Brother',     emoji:'👦', relation:'A boy born from the same parents', colour:'#f59e0b',
     fact:'Your brother has the same parents as you. A sibling is a brother or sister.',
     riddle:'My parents\' son who is not me is my...?', answer:'Brother',
     options:['Father','Cousin','Friend','Brother']},
    {role:'Sister',      emoji:'👧', relation:'A girl born from the same parents', colour:'#a855f7',
     fact:'Your sister has the same parents as you. Brothers and sisters are called siblings!',
     riddle:'My parents\' daughter who is not me is my...?', answer:'Sister',
     options:['Sister','Aunt','Cousin','Mother']},
    {role:'Uncle',       emoji:'🧔', relation:'Your parent\'s brother', colour:'#0ea5e9',
     fact:'Your uncle is your mother\'s or father\'s brother. His children are your cousins!',
     riddle:'My father\'s brother is my...?', answer:'Uncle',
     options:['Father','Grandfather','Uncle','Brother']},
    {role:'Aunt',        emoji:'👩‍🦰', relation:'Your parent\'s sister', colour:'#10b981',
     fact:'Your aunt is your parent\'s sister. She is like a second mother figure!',
     riddle:'My mother\'s sister is my...?', answer:'Aunt',
     options:['Grandmother','Mother','Sister','Aunt']},
  ];

  function renderExplore() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var title=document.createElement('div');
    title.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
    title.textContent='👨‍👩‍👧‍👦 Who is in my family?';
    wrap.appendChild(title);

    /* Family tree visual on canvas */
    var cv=document.createElement('canvas');
    cv.width=300; cv.height=190;
    cv.style.cssText='width:100%;max-width:300px;height:190px;display:block;border-radius:12px;background:linear-gradient(180deg,#f0fdf4,#dcfce7);margin:0 auto';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');

    /* Draw tree structure */
    ctx.strokeStyle='#92400e'; ctx.lineWidth=2.5; ctx.lineCap='round';
    /* Trunk */
    ctx.beginPath(); ctx.moveTo(150,185); ctx.lineTo(150,155); ctx.stroke();
    /* Parent branches */
    ctx.beginPath(); ctx.moveTo(150,155); ctx.lineTo(80,130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150,155); ctx.lineTo(220,130); ctx.stroke();
    /* Grandparent branches */
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(80,130); ctx.lineTo(45,100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80,130); ctx.lineTo(115,100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220,130); ctx.lineTo(185,100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220,130); ctx.lineTo(255,100); ctx.stroke();
    /* Siblings branch */
    ctx.beginPath(); ctx.moveTo(150,155); ctx.lineTo(150,175); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(115,183); ctx.lineTo(185,183); ctx.stroke();

    /* Person bubbles */
    function bubble(x,y,emoji,label,col){
      ctx.fillStyle=col+'33'; ctx.strokeStyle=col; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(emoji,x,y-1);
      ctx.fillStyle='#1e293b'; ctx.font='bold 8px Nunito,sans-serif'; ctx.textBaseline='top';
      ctx.fillText(label,x,y+20);
    }

    bubble(45,  82, '👴','Grandpa','#6366f1');
    bubble(115, 82, '👵','Grandma','#ec4899');
    bubble(80,  115,'👨','Father', '#3b82f6');
    bubble(185, 82, '👴','Grandpa','#6366f1');
    bubble(255, 82, '👵','Grandma','#ec4899');
    bubble(220, 115,'👩','Mother', '#f43f5e');
    bubble(115, 178,'👦','Brother','#f59e0b');
    bubble(150, 160,'🧒','Me!',    '#22c55e');
    bubble(185, 178,'👧','Sister', '#a855f7');

    /* Family cards — tap to learn */
    var grid=document.createElement('div');
    grid.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center';
    members.forEach(function(mem){
      var card=document.createElement('button');
      card.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 10px;border-radius:10px;cursor:pointer;'+
        'border:2px solid '+mem.colour+'44;background:'+mem.colour+'11;min-width:70px';
      card.innerHTML='<span style="font-size:22px">'+mem.emoji+'</span>'+
        '<span style="font-size:10px;font-weight:800;color:'+mem.colour+'">'+mem.role+'</span>'+
        '<span style="font-size:9px;color:var(--muted);line-height:1.2;text-align:center">'+mem.relation+'</span>';
      card.onclick=function(){ showMember(mem); };
      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    var quizBtn=document.createElement('button');
    quizBtn.className='cbtn evs'; quizBtn.textContent='Take the quiz! ✏️';
    quizBtn.onclick=function(){ phase='quiz'; quizIdx=0; score=0; quizAnswered=false; renderQuiz(); };
    wrap.appendChild(quizBtn);
    c.appendChild(wrap);
  }

  function showMember(mem) {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:12px;align-items:center;width:100%';

    var backBtn=document.createElement('button');
    backBtn.className='cbtn'; backBtn.textContent='← Back to family';
    backBtn.onclick=renderExplore;
    wrap.appendChild(backBtn);

    var panel=document.createElement('div');
    panel.style.cssText='background:'+mem.colour+'11;border:2px solid '+mem.colour+'44;border-radius:14px;padding:16px;width:100%;box-sizing:border-box;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center';

    panel.innerHTML='<div style="font-size:64px;line-height:1">'+mem.emoji+'</div>'+
      '<div style="font-size:20px;font-weight:900;color:'+mem.colour+'">'+mem.role+'</div>'+
      '<div style="font-size:13px;color:var(--muted)">'+mem.relation+'</div>'+
      '<div style="font-size:12px;font-weight:700;color:var(--text);background:rgba(255,255,255,0.6);border-radius:10px;padding:10px;line-height:1.6">'+mem.fact+'</div>';

    /* Riddle */
    var riddle=document.createElement('div');
    riddle.style.cssText='background:'+mem.colour+'22;border-radius:10px;padding:10px;font-size:13px;font-weight:800;color:'+mem.colour+';text-align:center;font-style:italic';
    riddle.textContent='"'+mem.riddle+'"';
    panel.appendChild(riddle);

    wrap.appendChild(panel);
    c.appendChild(wrap);
  }

  function renderQuiz() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Question '+(quizIdx+1)+' of '+members.length+'</span>'+
      '<span style="font-size:11px;color:var(--life);font-weight:800">Score: '+score+'/'+quizIdx+'</span>';
    wrap.appendChild(top);

    if(quizIdx>=members.length){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center';
      fin.innerHTML='<div style="font-size:48px">🎉</div>'+
        '<div style="font-size:16px;font-weight:900;color:var(--evs)">Family Expert! '+score+'/'+members.length+'</div>'+
        '<div style="font-size:12px;color:var(--muted)">You know all your family relationships! Families love and support each other. 💛</div>';
      var rb=document.createElement('button');rb.className='cbtn';rb.textContent='← Explore again';
      rb.onclick=function(){phase='explore';renderExplore();};fin.appendChild(rb);
      var rq=document.createElement('button');rq.className='cbtn evs';rq.textContent='↺ Quiz again';
      rq.onclick=function(){quizIdx=0;score=0;quizAnswered=false;renderQuiz();};fin.appendChild(rq);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    var mem=members[quizIdx];

    /* Big emoji */
    var emojiBox=document.createElement('div');
    emojiBox.style.cssText='text-align:center;font-size:72px;line-height:1;filter:drop-shadow(0 4px 16px rgba(0,0,0,0.15))';
    emojiBox.textContent=mem.emoji;
    wrap.appendChild(emojiBox);

    /* Riddle */
    var riddle=document.createElement('div');
    riddle.style.cssText='background:var(--surface2);border-radius:12px;padding:12px;font-size:14px;font-weight:800;color:var(--text);text-align:center;line-height:1.5;border:1px solid var(--border)';
    riddle.textContent=mem.riddle;
    wrap.appendChild(riddle);

    /* Options */
    var opts=document.createElement('div');
    opts.style.cssText='display:flex;flex-direction:column;gap:6px';
    /* Shuffle options */
    var shuffled=mem.options.slice().sort(function(){return Math.random()-0.5;});
    shuffled.forEach(function(opt){
      var btn=document.createElement('button');
      btn.style.cssText='padding:11px 14px;border-radius:10px;cursor:pointer;font-family:Nunito,sans-serif;font-size:13px;font-weight:700;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);text-align:left;width:100%';
      btn.textContent=opt;
      btn.onclick=function(){
        if(quizAnswered)return; quizAnswered=true;
        var correct=opt===mem.answer;
        if(correct) score++;
        quizIdx++;
        btn.style.background=correct?'#22c55e33':'#ef444433';
        btn.style.borderColor=correct?'#22c55e':'#ef4444';
        opts.querySelectorAll('button').forEach(function(b){
          b.disabled=true;
          if(b.textContent===mem.answer){b.style.background='#22c55e33';b.style.borderColor='#22c55e';}
        });
        var fb=document.createElement('div');
        fb.style.cssText='padding:8px 10px;border-radius:10px;font-size:11px;font-weight:700;color:var(--text);line-height:1.5;background:var(--surface2);border-left:3px solid '+(correct?'#22c55e':'#f59e0b');
        fb.textContent=(correct?'✅ ':'❌ ')+mem.fact;
        wrap.appendChild(fb);
        var nx=document.createElement('button');
        nx.className='cbtn evs';
        nx.textContent=quizIdx<members.length?'Next →':'See results!';
        nx.style.marginTop='4px';
        nx.onclick=function(){quizAnswered=false;renderQuiz();};
        wrap.appendChild(nx);
      };
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    c.appendChild(wrap);
  }

  renderExplore();
};

SIM_REGISTRY['weather-diary'] = function(c) {
  var raf = null;
  var t = 0;

  /* Scene state */
  var state = {
    sun:   true,
    cloud: false,
    rain:  false,
    wind:  false,
    night: false,
  };

  /* Particles: rain drops */
  var drops = [];
  function makeDrops() {
    drops = [];
    for(var i=0;i<40;i++) drops.push({x:Math.random()*300, y:Math.random()*160, speed:4+Math.random()*3});
  }

  /* Leaves for wind */
  var leaves = [];
  function makeLeaves() {
    leaves = [];
    for(var i=0;i<8;i++) leaves.push({x:Math.random()*300, y:60+Math.random()*80, vx:1+Math.random()*2, vy:-0.5+Math.random(), rot:Math.random()*Math.PI*2});
  }

  function weatherLabel() {
    if(state.night && state.rain) return {label:'Rainy Night 🌧🌙', fact:'Rain happens when clouds get too heavy with water droplets!'};
    if(state.night)               return {label:'Clear Night 🌙⭐', fact:'At night the sun is on the other side of Earth. We see stars!'};
    if(state.rain && state.wind)  return {label:'Stormy! ⛈', fact:'Storms have rain, wind, and sometimes thunder and lightning!'};
    if(state.rain)                return {label:'Rainy Day 🌧', fact:'Rain fills rivers, lakes, and helps plants grow!'};
    if(state.wind && state.cloud) return {label:'Windy & Cloudy 🌬☁️', fact:'Wind moves clouds across the sky. Clouds are made of tiny water droplets!'};
    if(state.wind)                return {label:'Windy Day 🌬', fact:'Wind is moving air. It can be gentle or very strong!'};
    if(state.cloud)               return {label:'Cloudy Day ☁️', fact:'Clouds form when warm moist air rises and cools down!'};
    if(state.sun)                 return {label:'Sunny Day ☀️', fact:'The sun gives us light and warmth. It makes plants grow!'};
    return                               {label:'Choose weather below!', fact:''};
  }

  function draw(cv) {
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    t += 0.02;
    ctx.clearRect(0,0,W,H);

    /* Sky */
    var skyTop = state.night ? '#0f172a' : state.cloud ? '#cbd5e1' : '#bae6fd';
    var skyBot = state.night ? '#1e293b' : state.cloud ? '#e2e8f0' : '#e0f2fe';
    var skyG = ctx.createLinearGradient(0,0,0,H*0.65);
    skyG.addColorStop(0, skyTop); skyG.addColorStop(1, skyBot);
    ctx.fillStyle = skyG; ctx.fillRect(0,0,W,H*0.65);

    /* Ground */
    var grassG = ctx.createLinearGradient(0,H*0.65,0,H);
    grassG.addColorStop(0, state.rain ? '#86a96a' : '#a8d8a8');
    grassG.addColorStop(1, '#6b9e5e');
    ctx.fillStyle = grassG; ctx.fillRect(0,H*0.65,W,H*0.35);

    /* Stars at night */
    if(state.night) {
      ctx.fillStyle = 'white';
      [[30,20],[80,15],[140,25],[200,12],[250,20],[60,40],[170,35],[230,45]].forEach(function(p) {
        var twinkle = 0.5 + 0.5*Math.sin(t*3+p[0]);
        ctx.globalAlpha = twinkle;
        ctx.beginPath(); ctx.arc(p[0], p[1], 1.5, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      /* Moon */
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath(); ctx.arc(240, 35, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = skyTop;
      ctx.beginPath(); ctx.arc(250, 30, 15, 0, Math.PI*2); ctx.fill();
    }

    /* Sun */
    if(state.sun && !state.night) {
      var sunX=60, sunY=40, sunR=22;
      /* Rays */
      ctx.strokeStyle='#fcd34d'; ctx.lineWidth=2;
      for(var ri=0;ri<8;ri++){
        var ra=ri/8*Math.PI*2+t*0.5;
        ctx.beginPath();
        ctx.moveTo(sunX+Math.cos(ra)*(sunR+5), sunY+Math.sin(ra)*(sunR+5));
        ctx.lineTo(sunX+Math.cos(ra)*(sunR+12), sunY+Math.sin(ra)*(sunR+12));
        ctx.stroke();
      }
      var sunG=ctx.createRadialGradient(sunX-5,sunY-5,2,sunX,sunY,sunR);
      sunG.addColorStop(0,'#fff7ed'); sunG.addColorStop(0.5,'#fcd34d'); sunG.addColorStop(1,'#f59e0b');
      ctx.fillStyle=sunG; ctx.beginPath(); ctx.arc(sunX,sunY,sunR,0,Math.PI*2); ctx.fill();
    }

    /* Clouds */
    if(state.cloud || state.rain) {
      var cloudX = state.wind ? 80+Math.sin(t)*8 : 100;
      function cloud(cx,cy,sc) {
        ctx.fillStyle = state.rain ? '#94a3b8' : '#e2e8f0';
        [[0,0,22],[20,-8,18],[40,0,20],[-15,5,16],[55,5,16]].forEach(function(p){
          ctx.beginPath(); ctx.arc(cx+p[0]*sc, cy+p[1]*sc, p[2]*sc, 0, Math.PI*2); ctx.fill();
        });
      }
      cloud(cloudX, 35, 1);
      cloud(cloudX+120, 45, 0.8);
      if(state.wind) cloud(cloudX-60+Math.sin(t*0.7)*5, 55, 0.7);
    }

    /* Rain */
    if(state.rain) {
      ctx.strokeStyle = 'rgba(96,165,250,0.6)'; ctx.lineWidth = 1.5;
      var windShift = state.wind ? 2 : 0;
      drops.forEach(function(d){
        d.y += d.speed;
        d.x += windShift;
        if(d.y > H*0.65) { d.y = -10; d.x = Math.random()*W; }
        if(d.x > W) d.x = 0;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x+windShift*2, d.y+8); ctx.stroke();
      });
      /* Puddle splashes on ground */
      ctx.strokeStyle='rgba(96,165,250,0.3)'; ctx.lineWidth=1;
      [50,120,200,260].forEach(function(px){
        var r=3+2*Math.sin(t*4+px);
        ctx.beginPath(); ctx.ellipse(px,H*0.66,r,r*0.4,0,0,Math.PI*2); ctx.stroke();
      });
    }

    /* Wind leaves */
    if(state.wind) {
      ctx.fillStyle='#86efac'; ctx.font='14px serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      leaves.forEach(function(l){
        l.x += l.vx + Math.sin(t*2)*0.5;
        l.y += l.vy + Math.sin(t*3+l.x*0.1)*0.5;
        l.rot += 0.05;
        if(l.x > W+20) { l.x=-10; l.y=60+Math.random()*80; }
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.fillText('🍃',0,0);
        ctx.restore();
      });
      /* Wind lines */
      ctx.strokeStyle='rgba(148,163,184,0.3)'; ctx.lineWidth=1; ctx.setLineDash([5,8]);
      [30,60,90].forEach(function(y,i){
        var ox=Math.sin(t*2+i)*20;
        ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+100,y+5); ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    /* Tree */
    ctx.strokeStyle='#92400e'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(230,H*0.65); ctx.lineTo(230,H*0.45);
    if(state.wind) {
      ctx.bezierCurveTo(230,H*0.4,245+Math.sin(t*2)*5,H*0.35,240+Math.sin(t*2)*8,H*0.3);
    } else {
      ctx.lineTo(230,H*0.3);
    }
    ctx.stroke();
    ctx.fillStyle = state.rain ? '#4d7c0f' : state.night ? '#166534' : '#22c55e';
    ctx.beginPath(); ctx.arc(230+(state.wind?Math.sin(t*2)*6:0), H*0.32, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#16a34a';
    ctx.beginPath(); ctx.arc(218+(state.wind?Math.sin(t*2)*4:0), H*0.37, 16, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(242+(state.wind?Math.sin(t*2)*8:0), H*0.36, 15, 0, Math.PI*2); ctx.fill();

    /* Flower */
    if(state.sun && !state.rain && !state.night) {
      var fx=170, fy=H*0.65-20;
      ctx.fillStyle='#fbbf24'; ctx.font='20px serif'; ctx.textAlign='center';
      ctx.fillText('🌸', fx, fy);
    }
    /* Rainbow after rain + sun */
    if(state.rain && state.sun && !state.night) {
      var cols=['rgba(239,68,68,0.3)','rgba(249,115,22,0.3)','rgba(234,179,8,0.3)','rgba(34,197,94,0.3)','rgba(59,130,246,0.3)','rgba(147,51,234,0.3)'];
      cols.forEach(function(col,i){
        ctx.strokeStyle=col; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(150,H*0.65,60+i*8,Math.PI,0); ctx.stroke();
      });
    }
  }

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var wl=weatherLabel();
    var title=document.createElement('div');
    title.style.cssText='font-size:14px;font-weight:900;color:var(--text);text-align:center';
    title.textContent=wl.label;
    wrap.appendChild(title);

    /* Live canvas */
    var cv=document.createElement('canvas');
    cv.width=300; cv.height=160;
    cv.style.cssText='width:100%;max-width:300px;height:160px;display:block;border-radius:12px;margin:0 auto';
    wrap.appendChild(cv);
    makeDrops(); makeLeaves();
    if(raf) cancelAnimationFrame(raf);
    function loop(){ raf=requestAnimationFrame(loop); draw(cv); }
    loop();

    /* Toggle controls */
    var controls=document.createElement('div');
    controls.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center';
    var toggles=[
      {key:'sun',   label:'☀️ Sun',   on:'#fcd34d', off:'var(--surface2)'},
      {key:'cloud', label:'☁️ Cloud',  on:'#94a3b8', off:'var(--surface2)'},
      {key:'rain',  label:'🌧 Rain',   on:'#60a5fa', off:'var(--surface2)'},
      {key:'wind',  label:'🌬 Wind',   on:'#a5f3fc', off:'var(--surface2)'},
      {key:'night', label:'🌙 Night',  on:'#6366f1', off:'var(--surface2)'},
    ];
    toggles.forEach(function(tg){
      var btn=document.createElement('button');
      var on=state[tg.key];
      btn.style.cssText='padding:7px 13px;border-radius:10px;font-family:Nunito,sans-serif;font-size:12px;font-weight:800;cursor:pointer;border:2px solid '+(on?tg.on:'var(--border)')+';background:'+(on?tg.on+'44':'var(--surface2)')+';transition:all .15s';
      btn.textContent=tg.label+(on?' ✓':'');
      btn.onclick=function(){
        /* Rain needs cloud */
        state[tg.key]=!state[tg.key];
        if(tg.key==='rain'&&state.rain) state.cloud=true;
        if(tg.key==='night'&&state.night) state.sun=false;
        if(tg.key==='sun'&&state.sun) state.night=false;
        render();
      };
      controls.appendChild(btn);
    });
    wrap.appendChild(controls);

    /* Fact */
    if(wl.fact) {
      var fact=document.createElement('div');
      fact.style.cssText='font-size:11px;font-weight:700;color:var(--muted);text-align:center;padding:6px 10px;background:var(--surface2);border-radius:8px;line-height:1.5';
      fact.textContent='💡 '+wl.fact;
      wrap.appendChild(fact);
    }

    /* Combinations prompt */
    var combos=document.createElement('div');
    combos.style.cssText='font-size:10px;color:var(--muted);text-align:center';
    combos.textContent='Try Sun+Rain = 🌈 Rainbow!  Wind+Leaves=🍃  Night+Stars=🌙';
    wrap.appendChild(combos);

    window.simCleanup=function(){ if(raf) cancelAnimationFrame(raf); };
    c.appendChild(wrap);
  }
  render();
};

/* ── MY FAMILY TREE — interactive role-based quiz ── */

SIM_REGISTRY['living-sort'] = function(c) {
  var items = [
    {name:'Dog',      emoji:'🐕', living:true,  reason:'Breathes, eats, grows, has babies'},
    {name:'Rock',     emoji:'🪨', living:false, reason:'Does not breathe, eat, grow, or reproduce'},
    {name:'Tree',     emoji:'🌳', living:true,  reason:'Makes food, grows, reproduces — plants are living!'},
    {name:'Car',      emoji:'🚗', living:false, reason:'Made by humans, does not grow or breathe'},
    {name:'Butterfly',emoji:'🦋', living:true,  reason:'Breathes, eats, grows, lays eggs'},
    {name:'Cloud',    emoji:'☁️', living:false, reason:'Made of water droplets — not alive'},
    {name:'Mushroom', emoji:'🍄', living:true,  reason:'Grows, reproduces — fungi are living things!'},
    {name:'Chair',    emoji:'🪑', living:false, reason:'Made from wood (once living) but the chair itself is not'},
    {name:'Fish',     emoji:'🐟', living:true,  reason:'Breathes through gills, swims, lays eggs'},
    {name:'Candle',   emoji:'🕯️', living:false, reason:'Flame burns but does not grow, breathe or reproduce'},
    {name:'Flower',   emoji:'🌸', living:true,  reason:'Grows toward sunlight, reproduces through seeds'},
    {name:'Water',    emoji:'💧', living:false, reason:'Essential for life but water itself is not alive'},
  ];

  var current = 0, score = 0, answered = false;
  var shuffled = items.slice().sort(function(){return Math.random()-0.5;});

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Item '+(current+1)+' of '+items.length+'</span>'+
      '<span style="font-size:11px;color:var(--sci);font-weight:800">Score: '+score+'/'+current+'</span>';
    wrap.appendChild(top);

    if(current>=items.length){
      wrap.innerHTML+='<div style="text-align:center;padding:16px;font-size:40px">🏆</div>'+
        '<div style="text-align:center;font-weight:900;font-size:16px;color:var(--sci)">All sorted! Score: '+score+'/'+items.length+'</div>'+
        '<div style="font-size:12px;color:var(--muted);text-align:center;padding:0 10px">Living things breathe, eat, grow, respond to surroundings, and can reproduce. Non-living things do not do all of these.</div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Play again';
      rb.onclick=function(){current=0;score=0;answered=false;shuffled=items.slice().sort(function(){return Math.random()-0.5;});render();};
      wrap.appendChild(rb);c.appendChild(wrap);return;
    }

    var item=shuffled[current];

    /* Big emoji display */
    var emoji=document.createElement('div');
    emoji.style.cssText='font-size:80px;text-align:center;line-height:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.2))';
    emoji.textContent=item.emoji;
    wrap.appendChild(emoji);

    var name=document.createElement('div');
    name.style.cssText='font-size:20px;font-weight:900;color:var(--text);text-align:center';
    name.textContent=item.name;
    wrap.appendChild(name);

    /* Sort buttons */
    var q=document.createElement('div');
    q.style.cssText='font-size:13px;font-weight:800;color:var(--muted);text-align:center';
    q.textContent='Is this LIVING or NON-LIVING?';
    wrap.appendChild(q);

    var btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;gap:12px;justify-content:center';
    [{label:'🌱 Living',val:true,col:'#22c55e'},{label:'🪨 Non-Living',val:false,col:'#94a3b8'}].forEach(function(opt){
      var btn=document.createElement('button');
      btn.style.cssText='font-size:14px;font-weight:800;padding:12px 22px;border-radius:12px;border:2px solid '+opt.col+';background:'+opt.col+'22;color:'+opt.col+';cursor:pointer;font-family:Nunito,sans-serif;min-width:130px';
      btn.textContent=opt.label;
      btn.onclick=function(){
        if(answered)return; answered=true;
        var correct=opt.val===item.living;
        if(correct)score++;
        btn.style.background=correct?'#22c55e':'#ef4444';
        btn.style.color='white'; btn.style.borderColor=correct?'#22c55e':'#ef4444';
        /* Show the other button's correct state */
        btnRow.querySelectorAll('button').forEach(function(b,bi){
          if(bi===0&&item.living){b.style.background='#22c55e';b.style.color='white';}
          if(bi===1&&!item.living){b.style.background='#94a3b8';b.style.color='white';}
        });
        var fb=document.createElement('div');
        fb.style.cssText='text-align:center;font-size:12px;font-weight:700;padding:8px;background:var(--surface2);border-radius:10px;color:var(--text);line-height:1.5';
        fb.textContent=(correct?'✅ ':'❌ ')+item.name+' is '+(item.living?'LIVING':'NON-LIVING')+'! '+item.reason;
        wrap.appendChild(fb);
        var nx=document.createElement('button');
        nx.className='cbtn evs';
        nx.textContent=current+1<items.length?'Next →':'See results!';
        nx.style.marginTop='4px';
        nx.onclick=function(){answered=false;current++;render();};
        wrap.appendChild(nx);
      };
      btnRow.appendChild(btn);
    });
    wrap.appendChild(btnRow);

    /* Living things criteria reminder */
    var criteria=document.createElement('div');
    criteria.style.cssText='font-size:10px;color:var(--muted);text-align:center;padding:4px';
    criteria.textContent='Living things: breathe · eat · grow · respond · reproduce';
    wrap.appendChild(criteria);

    c.appendChild(wrap);
  }
  render();
};

/* ── WATER FILTER — interactive filtration sim ── */
SIM_REGISTRY['water-filter'] = function(c) {
  var layers=['Grass/Leaves','Sand','Fine Sand','Gravel','Charcoal'];
  var layerColors=['#86efac','#fde68a','#fef3c7','#d1d5db','#1c1917'];
  var layerEmoji=['🌿','🟡','⬜','⚫','⬛'];
  var added=[]; /* which filter layers have been added */
  var filtered=false;
  var mudLevel=100; /* 0=clean 100=muddy */

  function getCleanness() {
    /* Each layer reduces dirtiness by a different amount */
    var reductions={0:15,1:25,2:20,3:20,4:30};
    var total=0;
    added.forEach(function(i){ total+=reductions[i]||0; });
    return Math.min(100,total);
  }

  function waterColor(cleanPct) {
    /* Interpolate from muddy brown to clear blue */
    var r=Math.round(139+(0-139)*cleanPct/100);
    var g=Math.round(90+(191-90)*cleanPct/100);
    var b=Math.round(43+(255-43)*cleanPct/100);
    return 'rgba('+r+','+g+','+b+',0.7)';
  }

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var title=document.createElement('div');
    title.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
    title.textContent='💧 Water Filtration Lab';
    wrap.appendChild(title);

    /* Canvas — filter diagram */
    var cv=document.createElement('canvas');
    cv.width=280; cv.height=220;
    cv.style.cssText='width:100%;max-width:280px;height:220px;display:block;border-radius:12px;background:#0f172a;margin:0 auto';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');

    var cleanPct=getCleanness();
    /* Muddy water input */
    var mudColor=waterColor(0);
    ctx.fillStyle=mudColor;
    ctx.fillRect(20,10,90,30);
    ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Muddy water',65,30);
    /* Arrow down */
    ctx.fillStyle='#94a3b8'; ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.fillText('↓',65,55);

    /* Filter container */
    ctx.strokeStyle='#475569'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.rect(20,60,90,120); ctx.stroke();
    /* Filter layers */
    var layH=added.length>0?Math.floor(110/Math.max(added.length,1)):0;
    added.forEach(function(li,i){
      ctx.fillStyle=layerColors[li];
      ctx.fillRect(22,62+i*layH,86,layH);
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(layerEmoji[li]+' '+layers[li].split('/')[0],65,62+i*layH+layH/2+4);
    });

    /* Output water */
    ctx.fillStyle=waterColor(cleanPct);
    ctx.fillRect(20,185,90,25);
    ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(cleanPct>80?'Clean! ✅':cleanPct>40?'Better...':'Still dirty',65,202);

    /* Cleanliness meter */
    ctx.fillStyle='#1e293b'; ctx.fillRect(140,60,30,150);
    ctx.fillStyle=waterColor(cleanPct);
    var barH=Math.round(150*cleanPct/100);
    ctx.fillRect(140,60+(150-barH),30,barH);
    ctx.strokeStyle='#475569'; ctx.lineWidth=1; ctx.strokeRect(140,60,30,150);
    ctx.fillStyle='white'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(Math.round(cleanPct)+'%',155,55);
    ctx.fillText('Clean',155,225);

    /* Before/after bottles */
    ctx.font='28px serif'; ctx.textAlign='center';
    ctx.fillText('🧴',225,100); ctx.fillStyle=waterColor(0); ctx.fillRect(213,108,24,30);
    ctx.fillText('🧴',225,170); ctx.fillStyle=waterColor(cleanPct); ctx.fillRect(213,178,24,30);
    ctx.fillStyle='white'; ctx.font='bold 8px Nunito,sans-serif';
    ctx.fillText('Before',225,148); ctx.fillText('After',225,218);

    /* Layer picker */
    var layerLabel=document.createElement('div');
    layerLabel.style.cssText='font-size:12px;font-weight:800;color:var(--muted);text-align:center';
    layerLabel.textContent='Add filter layers (tap to add, tap again to remove):';
    wrap.appendChild(layerLabel);

    var layerRow=document.createElement('div');
    layerRow.style.cssText='display:flex;flex-wrap:wrap;gap:6px;justify-content:center';
    layers.forEach(function(lay,i){
      var isAdded=added.indexOf(i)>=0;
      var btn=document.createElement('button');
      btn.style.cssText='font-size:11px;font-weight:800;padding:6px 10px;border-radius:8px;cursor:pointer;'+
        'border:2px solid '+(isAdded?'var(--sci)':'var(--border)')+
        ';background:'+(isAdded?'var(--sci-dim)':'var(--surface2)')+
        ';color:'+(isAdded?'var(--sci)':'var(--muted)');
      btn.textContent=layerEmoji[i]+' '+lay;
      btn.onclick=function(){
        var idx=added.indexOf(i);
        if(idx>=0) added.splice(idx,1); else added.push(i);
        render();
      };
      layerRow.appendChild(btn);
    });
    wrap.appendChild(layerRow);

    /* Insight */
    var cleanness=getCleanness();
    var msg=cleanness===0?'Add filter layers to clean the water!':
      cleanness<40?'Getting better! Add more layers.':
      cleanness<80?'Good progress! More layers = cleaner water.':
      '✅ Very clean! Real water treatment plants use all these layers!';
    var insight=document.createElement('div');
    insight.style.cssText='font-size:11px;font-weight:700;text-align:center;color:'+(cleanness>=80?'#22c55e':'var(--muted)');
    insight.textContent=msg;
    wrap.appendChild(insight);

    var reset=document.createElement('button');
    reset.className='cbtn';reset.textContent='↺ Reset';
    reset.onclick=function(){added=[];filtered=false;render();};
    wrap.appendChild(reset);
    c.appendChild(wrap);
  }
  render();
};

/* ── SOIL TYPES EXPLORER ── */
SIM_REGISTRY['soil-types'] = function(c) {
  var soils=[
    {name:'Sandy Soil', emoji:'🏖️', colour:'#fde68a', dark:'#d97706',
     texture:'Rough and gritty', water:'Drains fast', plants:'Cactus, carrots',
     feel:'Doesn\'t hold together — falls apart',
     test:{drain:95,hold:10,plants:30}},
    {name:'Clay Soil', emoji:'🏺', colour:'#f87171', dark:'#dc2626',
     texture:'Smooth and sticky', water:'Holds too much', plants:'Rice, lotus',
     feel:'Sticks together — can be moulded',
     test:{drain:10,hold:95,plants:50}},
    {name:'Loamy Soil', emoji:'🌱', colour:'#86efac', dark:'#16a34a',
     texture:'Crumbly and soft', water:'Perfect balance', plants:'Most vegetables',
     feel:'Best mix — sticks a little but crumbles',
     test:{drain:70,hold:75,plants:95}},
    {name:'Rocky Soil', emoji:'🪨', colour:'#d1d5db', dark:'#6b7280',
     texture:'Hard with stones', water:'Drains very fast', plants:'Moss, lichen',
     feel:'Very hard — difficult to dig',
     test:{drain:90,hold:5,plants:15}},
  ];

  var selected=0;

  function render() {
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var title=document.createElement('div');
    title.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
    title.textContent='🌍 Soil Types Lab — Touch and Compare!';
    wrap.appendChild(title);

    /* Soil type selector */
    var selector=document.createElement('div');
    selector.style.cssText='display:flex;gap:6px;justify-content:center;flex-wrap:wrap';
    soils.forEach(function(soil,i){
      var btn=document.createElement('button');
      btn.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border-radius:10px;cursor:pointer;'+
        'border:2px solid '+(i===selected?soil.dark:'var(--border)')+
        ';background:'+(i===selected?soil.colour+'33':'var(--surface2)');
      btn.innerHTML='<span style="font-size:24px">'+soil.emoji+'</span><span style="font-size:10px;font-weight:800;color:'+soil.dark+'">'+soil.name.split(' ')[0]+'</span>';
      btn.onclick=function(){selected=i;render();};
      selector.appendChild(btn);
    });
    wrap.appendChild(selector);

    var soil=soils[selected];

    /* Canvas — soil cross section + water test */
    var cv=document.createElement('canvas');
    cv.width=280; cv.height=160;
    cv.style.cssText='width:100%;max-width:280px;height:160px;display:block;border-radius:12px;background:var(--surface2);margin:0 auto';
    wrap.appendChild(cv);
    var ctx=cv.getContext('2d');

    /* Soil profile */
    ctx.fillStyle=soil.colour; ctx.fillRect(0,40,280,80);
    ctx.fillStyle=soil.dark; ctx.fillRect(0,120,280,40);
    /* Texture particles */
    if(soil.name==='Sandy Soil'){
      for(var i=0;i<60;i++){ctx.fillStyle='rgba(217,119,6,0.5)';ctx.beginPath();ctx.arc(10+Math.random()*260,45+Math.random()*70,2+Math.random()*2,0,Math.PI*2);ctx.fill();}
    } else if(soil.name==='Clay Soil'){
      ctx.fillStyle='rgba(220,38,38,0.2)';
      for(var ci=0;ci<8;ci++){ctx.fillRect(10+ci*32,45,28,70);}
    } else if(soil.name==='Rocky Soil'){
      for(var ri=0;ri<12;ri++){ctx.fillStyle='rgba(107,114,128,0.6)';ctx.beginPath();ctx.arc(20+Math.random()*240,50+Math.random()*60,5+Math.random()*8,0,Math.PI*2);ctx.fill();}
    }
    /* Water droplets draining */
    ctx.fillStyle='rgba(96,165,250,0.7)';
    var drainSpots=Math.round(soil.test.drain/20);
    for(var di=0;di<drainSpots;di++){ctx.fillText('💧',20+di*48,130);}
    ctx.font='12px serif';
    /* Sky/surface */
    ctx.fillStyle='#bae6fd'; ctx.fillRect(0,0,280,40);
    ctx.fillStyle='#1e293b'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(soil.name,140,25);

    /* Stat bars */
    var statsBox=document.createElement('div');
    statsBox.style.cssText='background:var(--surface2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px';
    [
      {label:'💧 Water drainage',val:soil.test.drain,col:'#3b82f6'},
      {label:'🤏 Holds together',val:soil.test.hold,col:'#92400e'},
      {label:'🌱 Plant growth',val:soil.test.plants,col:'#22c55e'},
    ].forEach(function(stat){
      var row=document.createElement('div');
      row.innerHTML='<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;color:var(--muted);margin-bottom:2px">'+
        '<span>'+stat.label+'</span><span>'+stat.val+'%</span></div>'+
        '<div style="height:8px;border-radius:4px;background:var(--border);overflow:hidden">'+
        '<div style="height:100%;width:'+stat.val+'%;background:'+stat.col+';border-radius:4px;transition:width .5s"></div></div>';
      statsBox.appendChild(row);
    });
    wrap.appendChild(statsBox);

    /* Facts */
    var facts=document.createElement('div');
    facts.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px';
    [{label:'Feel',val:soil.feel},{label:'Best for',val:soil.plants},{label:'Texture',val:soil.texture},{label:'Water',val:soil.water}].forEach(function(f){
      var div=document.createElement('div');
      div.style.cssText='background:var(--surface2);border-radius:8px;padding:6px 8px';
      div.innerHTML='<div style="font-size:9px;font-weight:800;color:var(--muted);text-transform:uppercase">'+f.label+'</div>'+
        '<div style="font-size:11px;font-weight:700;color:var(--text)">'+f.val+'</div>';
      facts.appendChild(div);
    });
    wrap.appendChild(facts);
    c.appendChild(wrap);
  }
  render();
};

/* ── DAILY ROUTINE — drag activities to time slots ── */
SIM_REGISTRY['daily-routine'] = function(c) {
  var activities=[
    {name:'Wake up',    emoji:'⏰', time:'6 AM',  slot:0},
    {name:'Brush teeth',emoji:'🪥', time:'6:15',  slot:1},
    {name:'Bath',       emoji:'🛁', time:'6:30',  slot:2},
    {name:'Breakfast',  emoji:'🥣', time:'7 AM',  slot:3},
    {name:'School',     emoji:'🏫', time:'8 AM',  slot:4},
    {name:'Lunch',      emoji:'🍱', time:'1 PM',  slot:5},
    {name:'Homework',   emoji:'📚', time:'4 PM',  slot:6},
    {name:'Play',       emoji:'⚽', time:'5 PM',  slot:7},
    {name:'Dinner',     emoji:'🍛', time:'7 PM',  slot:8},
    {name:'Sleep',      emoji:'😴', time:'9 PM',  slot:9},
  ];

  var slots=['6 AM','6:15','6:30','7 AM','8 AM','1 PM','4 PM','5 PM','7 PM','9 PM'];
  /* Shuffle activities and let student sort them */
  var shuffled=activities.slice().sort(function(){return Math.random()-0.5;});
  var placed={}; /* slotIndex → activityIndex in shuffled */
  var selected=null;
  var checked=false;

  function render(){
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:8px;width:100%';

    var title=document.createElement('div');
    title.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
    title.textContent='⏰ Build the Perfect Daily Routine!';
    wrap.appendChild(title);

    var instr=document.createElement('div');
    instr.style.cssText='font-size:11px;color:var(--muted);text-align:center';
    instr.textContent=selected!==null?'Now tap a time slot to place it!':'Tap an activity, then tap its correct time slot.';
    wrap.appendChild(instr);

    /* Time slots */
    var grid=document.createElement('div');
    grid.style.cssText='display:flex;flex-direction:column;gap:4px';
    slots.forEach(function(time,si){
      var row=document.createElement('div');
      row.style.cssText='display:flex;gap:6px;align-items:center';
      var timeLabel=document.createElement('div');
      timeLabel.style.cssText='font-size:10px;font-weight:800;color:var(--muted);width:36px;text-align:right;flex-shrink:0';
      timeLabel.textContent=time;
      row.appendChild(timeLabel);

      var slot=document.createElement('div');
      var placedIdx=placed[si];
      var act=placedIdx!==undefined?shuffled[placedIdx]:null;
      var isCorrect=act&&act.slot===si;
      slot.style.cssText='flex:1;height:36px;border-radius:8px;display:flex;align-items:center;gap:6px;padding:0 10px;cursor:pointer;'+
        'border:2px solid '+(act?(checked?(isCorrect?'#22c55e':'#ef4444'):'var(--sci)'):'var(--border)')+
        ';background:'+(act?(checked?(isCorrect?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'):'var(--sci-dim)'):'var(--surface2)');
      if(act){
        slot.innerHTML='<span style="font-size:20px">'+act.emoji+'</span><span style="font-size:12px;font-weight:700;color:var(--text)">'+act.name+'</span>';
        if(checked&&!isCorrect){
          /* Show correct */
          var correctAct=activities.find(function(a){return a.slot===si;});
          slot.innerHTML+='<span style="font-size:11px;color:#f59e0b;margin-left:auto">→'+correctAct.emoji+'</span>';
        }
      } else {
        slot.innerHTML='<span style="font-size:11px;color:var(--muted)">tap to place...</span>';
      }
      slot.onclick=function(){
        if(selected!==null){placed[si]=selected;selected=null;render();}
        else if(act){selected=placedIdx;delete placed[si];render();}
      };
      row.appendChild(slot);
      grid.appendChild(row);
    });
    wrap.appendChild(grid);

    /* Activity picker */
    var pickerLabel=document.createElement('div');
    pickerLabel.style.cssText='font-size:11px;font-weight:800;color:var(--muted)';
    pickerLabel.textContent='Tap to pick:';
    wrap.appendChild(pickerLabel);
    var picker=document.createElement('div');
    picker.style.cssText='display:flex;flex-wrap:wrap;gap:5px';
    shuffled.forEach(function(act,i){
      var isPlaced=Object.values(placed).indexOf(i)>=0;
      if(isPlaced) return;
      var btn=document.createElement('button');
      btn.style.cssText='font-size:12px;padding:4px 8px;border-radius:8px;cursor:pointer;'+
        'border:2px solid '+(selected===i?'var(--sci)':'var(--border)')+
        ';background:'+(selected===i?'var(--sci-dim)':'var(--surface2)');
      btn.innerHTML=act.emoji+' '+act.name;
      btn.onclick=function(){selected=(selected===i)?null:i;render();};
      picker.appendChild(btn);
    });
    wrap.appendChild(picker);

    /* Check button */
    var placedCount=Object.keys(placed).length;
    if(placedCount>=10&&!checked){
      var checkBtn=document.createElement('button');
      checkBtn.className='cbtn evs';checkBtn.textContent='Check my routine! ✅';
      checkBtn.onclick=function(){checked=true;render();};
      wrap.appendChild(checkBtn);
    }
    if(checked){
      var correct=Object.keys(placed).filter(function(si){return shuffled[placed[si]].slot===parseInt(si);}).length;
      var fb=document.createElement('div');
      fb.style.cssText='text-align:center;font-size:13px;font-weight:800;color:'+(correct>=8?'#22c55e':'#f59e0b')+';padding:8px;background:var(--surface2);border-radius:10px';
      fb.textContent=correct+'/10 correct! '+(correct>=8?'Great routine! 🌟':'A good routine helps your body and mind stay healthy.');
      wrap.appendChild(fb);
      var reset=document.createElement('button');
      reset.className='cbtn';reset.textContent='↺ Try again';
      reset.onclick=function(){placed={};selected=null;checked=false;shuffled=activities.slice().sort(function(){return Math.random()-0.5;});render();};
      wrap.appendChild(reset);
    }
    c.appendChild(wrap);
  }
  render();
};

/* ── SAYING SORRY RIGHT — scenario-based ── */
SIM_REGISTRY['apology-sim'] = function(c) {
  var scenarios=[
    {
      situation:'You accidentally broke your friend\'s favourite pencil.',
      emoji:'✏️',
      options:[
        {text:'Run away and pretend it didn\'t happen.', correct:false, feedback:'Running away makes things worse. Your friend will feel hurt and confused.'},
        {text:'Say "I\'m sorry I broke your pencil. I didn\'t mean to. Can I buy you a new one?"', correct:true, feedback:'✅ Perfect! A good apology: admits what happened, shows you\'re sorry, and offers to make it right.'},
        {text:'Say "It\'s not my fault, it was old anyway!"', correct:false, feedback:'Making excuses is not an apology. It makes your friend feel their feelings don\'t matter.'},
        {text:'Just say "Sorry" quickly and walk away.', correct:false, feedback:'A quick sorry without meaning it doesn\'t really help. A real apology needs eye contact and means it.'},
      ]
    },
    {
      situation:'You called your sister a bad name when you were angry.',
      emoji:'😤',
      options:[
        {text:'"I was angry but I shouldn\'t have said that. I\'m sorry it hurt your feelings."', correct:true, feedback:'✅ Excellent! You explained why it happened but still took responsibility. That\'s emotional maturity!'},
        {text:'"Sorry... but you made me angry first!"', correct:false, feedback:'Adding "but" cancels the apology. It sounds like you\'re blaming them.'},
        {text:'Give her a hug without saying anything.', correct:false, feedback:'Hugs are nice but words matter too — she needs to know you understand you hurt her.'},
        {text:'"I\'m sorry you felt bad."', correct:false, feedback:'This sounds like you\'re sorry for HER feelings, not for what YOU did. Take responsibility!'},
      ]
    },
    {
      situation:'You forgot to return your friend\'s book for two weeks.',
      emoji:'📚',
      options:[
        {text:'"Here\'s your book. I\'m really sorry I kept it so long — I should have returned it sooner."', correct:true, feedback:'✅ Great! You returned it, apologised, and took responsibility. That\'s all three parts of a good apology!'},
        {text:'Just give the book back without saying anything.', correct:false, feedback:'Giving it back is good but your friend deserves to hear that you know you were wrong.'},
        {text:'"Sorry, I was really busy."', correct:false, feedback:'An excuse weakens an apology. Your friend\'s time matters too.'},
        {text:'Ask another friend to return it for you.', correct:false, feedback:'You should face it yourself. It shows more respect to apologise in person.'},
      ]
    }
  ];

  var round=0, score=0, answered=false;

  function render(){
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Scenario '+(round+1)+' of '+scenarios.length+'</span>'+
      '<span style="font-size:11px;color:var(--life);font-weight:800">Score: '+score+'/'+round+'</span>';
    wrap.appendChild(top);

    if(round>=scenarios.length){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center';
      fin.innerHTML='<div style="font-size:48px">🤝</div>'+
        '<div style="font-size:16px;font-weight:900;color:var(--life)">Apology Champion! '+score+'/'+scenarios.length+'</div>'+
        '<div style="font-size:12px;color:var(--muted);padding:0 10px">A good apology has 3 parts: Say what you did wrong · Show you mean it · Offer to make it better</div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Practice again';
      rb.onclick=function(){round=0;score=0;answered=false;render();};fin.appendChild(rb);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    var sc=scenarios[round];
    var situation=document.createElement('div');
    situation.style.cssText='background:var(--acc-dim);border-radius:12px;padding:12px;border:1px solid var(--border)';
    situation.innerHTML='<div style="font-size:28px;text-align:center;margin-bottom:6px">'+sc.emoji+'</div>'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);text-align:center">'+sc.situation+'</div>';
    wrap.appendChild(situation);

    var q=document.createElement('div');
    q.style.cssText='font-size:12px;font-weight:800;color:var(--muted);text-align:center';
    q.textContent='What is the BEST thing to do?';
    wrap.appendChild(q);

    var opts=document.createElement('div');
    opts.style.cssText='display:flex;flex-direction:column;gap:6px';
    var shuffledOpts=sc.options.slice().sort(function(){return Math.random()-0.5;});
    shuffledOpts.forEach(function(opt){
      var btn=document.createElement('button');
      btn.style.cssText='text-align:left;padding:10px 12px;border-radius:10px;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;font-weight:700;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);line-height:1.5;width:100%';
      btn.textContent=opt.text;
      btn.onclick=function(){
        if(answered)return; answered=true;
        if(opt.correct)score++;  round++;
        btn.style.background=opt.correct?'#22c55e22':'#ef444422';
        btn.style.borderColor=opt.correct?'#22c55e':'#ef4444';
        opts.querySelectorAll('button').forEach(function(b,bi){
          b.disabled=true;
          if(shuffledOpts[bi].correct){b.style.background='#22c55e22';b.style.borderColor='#22c55e';}
        });
        var fb=document.createElement('div');
        fb.style.cssText='padding:10px;background:var(--surface2);border-radius:10px;font-size:12px;font-weight:700;color:var(--text);line-height:1.5;border-left:3px solid '+(opt.correct?'#22c55e':'#f59e0b');
        fb.textContent=opt.feedback;
        wrap.appendChild(fb);
        var nx=document.createElement('button');
        nx.className='cbtn evs'; nx.textContent=round<scenarios.length?'Next scenario →':'See results!';
        nx.style.marginTop='4px';
        nx.onclick=function(){answered=false;render();};
        wrap.appendChild(nx);
      };
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    c.appendChild(wrap);
  }
  render();
};

/* ── HAND WASH — step-by-step animated guide with quiz ── */
SIM_REGISTRY['hand-wash'] = function(c) {
  var steps=[
    {emoji:'💧', title:'Wet your hands', desc:'Turn on the tap. Wet both hands completely with clean water.', time:5},
    {emoji:'🧴', title:'Apply soap',     desc:'Put enough soap to cover all surfaces. About the size of a coin.', time:3},
    {emoji:'🤲', title:'Lather palms',   desc:'Rub palms together vigorously to create foam. 20 seconds!', time:20},
    {emoji:'🙌', title:'Clean the back', desc:'Rub the back of each hand with the other palm. Don\'t miss any spots!', time:10},
    {emoji:'🤞', title:'Between fingers',desc:'Interlace fingers and rub between them. Germs hide here!', time:10},
    {emoji:'👍', title:'Clean thumbs',   desc:'Clasp each thumb and rotate. Thumbs touch everything!', time:5},
    {emoji:'💦', title:'Rinse well',     desc:'Rinse all soap off under clean running water. Point fingers down.', time:10},
    {emoji:'🧻', title:'Dry thoroughly', desc:'Pat dry with a clean towel or paper. Wet hands spread germs more!', time:5},
  ];

  var currentStep=0, mode='learn', quizAnswered=false;
  var timerVal=0, timerRunning=false, timerInterval=null;

  function render(){
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    /* Progress bar */
    var progress=document.createElement('div');
    progress.style.cssText='width:100%;height:6px;border-radius:4px;background:var(--surface2)';
    var fill=document.createElement('div');
    fill.style.cssText='height:100%;border-radius:4px;background:var(--life);transition:width .3s;width:'+
      (mode==='quiz'?100:(currentStep/steps.length*100))+'%';
    progress.appendChild(fill); wrap.appendChild(progress);

    if(mode==='learn'){
      var st=steps[currentStep];

      /* Step dots */
      var dots=document.createElement('div');
      dots.style.cssText='display:flex;gap:5px;justify-content:center';
      steps.forEach(function(s,i){
        var dot=document.createElement('div');
        dot.style.cssText='width:'+(i===currentStep?'20px':'8px')+';height:8px;border-radius:4px;background:'+(i<currentStep?'var(--life)':i===currentStep?'var(--life)':'var(--border)')+';transition:all .3s';
        dots.appendChild(dot);
      });
      wrap.appendChild(dots);

      /* Big emoji */
      var bigEmoji=document.createElement('div');
      bigEmoji.style.cssText='font-size:72px;text-align:center;line-height:1';
      bigEmoji.textContent=st.emoji;
      wrap.appendChild(bigEmoji);

      var stepTitle=document.createElement('div');
      stepTitle.style.cssText='font-size:16px;font-weight:900;color:var(--text);text-align:center';
      stepTitle.textContent='Step '+(currentStep+1)+': '+st.title;
      wrap.appendChild(stepTitle);

      var stepDesc=document.createElement('div');
      stepDesc.style.cssText='font-size:12px;color:var(--muted);text-align:center;padding:8px 12px;background:var(--surface2);border-radius:10px;line-height:1.6';
      stepDesc.textContent=st.desc;
      wrap.appendChild(stepDesc);

      /* Timer */
      var timerRow=document.createElement('div');
      timerRow.style.cssText='display:flex;align-items:center;gap:10px;justify-content:center';
      var timerDisplay=document.createElement('div');
      timerDisplay.style.cssText='font-size:32px;font-weight:900;color:var(--life);min-width:60px;text-align:center';
      timerDisplay.textContent=timerRunning?(timerVal+'s'):(st.time+'s');
      timerRow.appendChild(timerDisplay);
      var timerBtn=document.createElement('button');
      timerBtn.className='cbtn evs'; timerBtn.textContent=timerRunning?'⏸ Pause':'▶ Start timer';
      timerBtn.onclick=function(){
        if(timerRunning){clearInterval(timerInterval);timerRunning=false;timerVal=0;render();}
        else{
          timerRunning=true; timerVal=st.time;
          timerDisplay.textContent=timerVal+'s';
          timerInterval=setInterval(function(){
            timerVal--;
            timerDisplay.textContent=timerVal+'s';
            if(timerVal<=0){clearInterval(timerInterval);timerRunning=false;
              timerDisplay.textContent='✅ Done!';
              timerDisplay.style.color='#22c55e';}
          },1000);
        }
      };
      timerRow.appendChild(timerBtn);
      wrap.appendChild(timerRow);

      /* Navigation */
      var nav=document.createElement('div');
      nav.style.cssText='display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
      if(currentStep>0){
        var prev=document.createElement('button');
        prev.className='cbtn'; prev.textContent='← Back';
        prev.onclick=function(){clearInterval(timerInterval);timerRunning=false;timerVal=0;currentStep--;render();};
        nav.appendChild(prev);
      }
      if(currentStep<steps.length-1){
        var next=document.createElement('button');
        next.className='cbtn evs'; next.textContent='Next step →';
        next.onclick=function(){clearInterval(timerInterval);timerRunning=false;timerVal=0;currentStep++;render();};
        nav.appendChild(next);
      } else {
        var quiz=document.createElement('button');
        quiz.className='cbtn evs'; quiz.textContent='Take the quiz! ✏️';
        quiz.onclick=function(){clearInterval(timerInterval);timerRunning=false;timerVal=0;mode='quiz';currentStep=0;render();};
        nav.appendChild(quiz);
      }
      wrap.appendChild(nav);

    } else {
      /* Quiz mode */
      var questions=[
        {q:'How long should you rub your hands with soap?',opts:['5 seconds','20 seconds','2 minutes','1 second'],ans:1},
        {q:'Which part of the hands hides the most germs?',opts:['The palm','Fingertips','Between the fingers','The wrist'],ans:2},
        {q:'Why do you dry your hands after washing?',opts:['So they look nice','Wet hands spread germs more easily','To use the towel','It feels good'],ans:1},
        {q:'What should you do to your thumbs specially?',opts:['Ignore them','Clasp and rotate each thumb','Only rinse them','Wash them last'],ans:1},
      ];
      var q=questions[currentStep%questions.length];
      var qDisplay=document.createElement('div');
      qDisplay.style.cssText='font-size:14px;font-weight:800;color:var(--text);text-align:center;padding:8px';
      qDisplay.textContent='Quiz '+(currentStep+1)+'/'+questions.length+': '+q.q;
      wrap.appendChild(qDisplay);

      var optDiv=document.createElement('div');
      optDiv.style.cssText='display:flex;flex-direction:column;gap:6px;width:100%';
      q.opts.forEach(function(opt,i){
        var btn=document.createElement('button');
        btn.style.cssText='padding:10px 12px;border-radius:10px;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;font-weight:700;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);text-align:left;width:100%';
        btn.textContent=opt;
        btn.onclick=function(){
          if(quizAnswered)return; quizAnswered=true;
          var correct=i===q.ans;
          btn.style.background=correct?'#22c55e22':'#ef444422';
          btn.style.borderColor=correct?'#22c55e':'#ef4444';
          optDiv.querySelectorAll('button').forEach(function(b,bi){
            b.disabled=true;
            if(bi===q.ans){b.style.background='#22c55e22';b.style.borderColor='#22c55e';}
          });
          var nx=document.createElement('button');
          nx.className='cbtn evs';
          nx.textContent=currentStep+1<questions.length?'Next question →':'Finish! 🎉';
          nx.style.marginTop='6px';
          nx.onclick=function(){
            quizAnswered=false;
            if(currentStep+1<questions.length){currentStep++;render();}
            else{mode='learn';currentStep=0;render();}
          };
          wrap.appendChild(nx);
        };
        optDiv.appendChild(btn);
      });
      wrap.appendChild(optDiv);
    }
    c.appendChild(wrap);
  }
  render();
};

/* ── STRANGER SAFETY — scenario choices ── */
SIM_REGISTRY['safety-sim'] = function(c) {
  var scenarios=[
    {
      emoji:'🚗', bg:'#fef9c3',
      situation:'A stranger in a car stops and says "Your mum asked me to pick you up from school today."',
      options:[
        {text:'Get in the car — maybe mum really sent them.',        correct:false, why:'Never get in a stranger\'s car, even if they mention your family. Real trusted adults will have the SECRET WORD.'},
        {text:'Say "No" firmly. Run to a trusted adult. Tell them.',   correct:true,  why:'✅ Correct! Your body belongs to you. A loud "NO" and running to safety is always right. Tell a trusted adult immediately.'},
        {text:'Walk away slowly without saying anything.',             correct:false, why:'Walking away is okay but speaking firmly and finding a trusted adult is better — tell someone what happened!'},
        {text:'Ask them to prove your mum sent them.',                 correct:false, why:'Don\'t engage or negotiate with strangers. Get away first, ask questions later.'},
      ]
    },
    {
      emoji:'🏠', bg:'#f0fdf4',
      situation:'Someone knocks on the door when you are home alone. They say "I\'m here to fix the tap."',
      options:[
        {text:'Open the door and let them in.',   correct:false, why:'Never open the door to strangers when home alone — even if they have a reason.'},
        {text:'Don\'t open the door. Call a trusted adult immediately.', correct:true, why:'✅ Perfect! Keep the door closed. Call your parent, relative, or neighbour right away.'},
        {text:'Shout through the door that you\'ll call your parents.', correct:true, why:'✅ Good! Talking through a closed door and calling a trusted adult is safe.'},
        {text:'Open the door but block it with your foot.',            correct:false, why:'Even a little opening is unsafe. Keep the door fully closed.'},
      ]
    },
    {
      emoji:'😰', bg:'#fef2f2',
      situation:'An adult you don\'t know well touches you in a way that makes you feel uncomfortable.',
      options:[
        {text:'Stay quiet — you don\'t want to be rude.',   correct:false, why:'Your safety is always more important than politeness. You have the right to say NO to any touch that feels wrong.'},
        {text:'Say "STOP, I don\'t like that" loudly and tell a trusted adult.', correct:true, why:'✅ Brave and correct! Your body belongs to you. Always tell a trusted adult, even if the person says it\'s a secret.'},
        {text:'Tell the person\'s secret to keep everyone happy.',    correct:false, why:'Secrets about body safety should ALWAYS be told to a trusted adult. Keeping unsafe secrets is not your job.'},
        {text:'Run to a trusted adult and tell them what happened.',   correct:true, why:'✅ Yes! Getting to safety and telling a trusted adult is always the right thing to do.'},
      ]
    }
  ];

  var round=0, score=0, answered=false;

  /* Trusted adults reminder */
  var trustedAdults=['Parent','Teacher','Doctor','Police officer','Relative you know well'];

  function render(){
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;width:100%';

    /* Trusted adults badge */
    var badge=document.createElement('div');
    badge.style.cssText='background:rgba(34,197,94,0.1);border:1px solid #86efac;border-radius:10px;padding:6px 10px;text-align:center';
    badge.innerHTML='<span style="font-size:10px;font-weight:800;color:#15803d">YOUR TRUSTED ADULTS: </span>'+
      '<span style="font-size:10px;color:#15803d">'+trustedAdults.join(' · ')+'</span>';
    wrap.appendChild(badge);

    if(round>=scenarios.length){
      var fin=document.createElement('div');
      fin.style.cssText='text-align:center;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center';
      fin.innerHTML='<div style="font-size:48px">🛡️</div>'+
        '<div style="font-size:16px;font-weight:900;color:#15803d">Safety Champion!</div>'+
        '<div style="font-size:12px;color:var(--muted);padding:0 10px;line-height:1.6">Remember: Your body belongs to YOU. Say NO. Get away. Tell a trusted adult. You will NEVER be in trouble for keeping yourself safe.</div>';
      var rb=document.createElement('button');rb.className='cbtn evs';rb.textContent='↺ Practice again';
      rb.onclick=function(){round=0;score=0;answered=false;render();};fin.appendChild(rb);
      wrap.appendChild(fin);c.appendChild(wrap);return;
    }

    var top=document.createElement('div');
    top.style.cssText='display:flex;justify-content:space-between;width:100%';
    top.innerHTML='<span style="font-size:11px;color:var(--muted);font-weight:800">Scenario '+(round+1)+' of '+scenarios.length+'</span>';
    wrap.appendChild(top);

    var sc=scenarios[round];
    var sitBox=document.createElement('div');
    sitBox.style.cssText='background:'+sc.bg+';border-radius:12px;padding:12px;text-align:center;border:1px solid rgba(0,0,0,0.08)';
    sitBox.innerHTML='<div style="font-size:36px;margin-bottom:6px">'+sc.emoji+'</div>'+
      '<div style="font-size:13px;font-weight:700;color:#1e293b;line-height:1.5">'+sc.situation+'</div>';
    wrap.appendChild(sitBox);

    var q=document.createElement('div');
    q.style.cssText='font-size:12px;font-weight:800;color:var(--muted);text-align:center';
    q.textContent='What is the SAFEST thing to do?';
    wrap.appendChild(q);

    var opts=document.createElement('div');
    opts.style.cssText='display:flex;flex-direction:column;gap:6px';
    sc.options.forEach(function(opt){
      var btn=document.createElement('button');
      btn.style.cssText='text-align:left;padding:10px 12px;border-radius:10px;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;font-weight:700;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);line-height:1.4;width:100%';
      btn.textContent=opt.text;
      btn.onclick=function(){
        if(answered)return; answered=true;
        if(opt.correct)score++;
        btn.style.background=opt.correct?'#22c55e22':'#ef444422';
        btn.style.borderColor=opt.correct?'#22c55e':'#ef4444';
        opts.querySelectorAll('button').forEach(function(b,bi){
          b.disabled=true;
          if(sc.options[bi].correct){b.style.background='#22c55e22';b.style.borderColor='#22c55e';}
        });
        var fb=document.createElement('div');
        fb.style.cssText='padding:8px 10px;background:var(--surface2);border-radius:10px;font-size:11px;font-weight:700;color:var(--text);line-height:1.5;border-left:3px solid '+(opt.correct?'#22c55e':'#f59e0b');
        fb.textContent=opt.why;
        wrap.appendChild(fb);
        var nx=document.createElement('button');nx.className='cbtn evs';
        nx.textContent=round<scenarios.length?'Next →':'Finish!';nx.style.marginTop='4px';
        nx.onclick=function(){answered=false;round++;render();};
        wrap.appendChild(nx);
      };
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    c.appendChild(wrap);
  }
  render();
};

/* ── FEELINGS WHEEL — identify & explore emotions ── */
SIM_REGISTRY['feelings-wheel'] = function(c) {
  var feelings=[
    {name:'Happy',    emoji:'😊', colour:'#fbbf24', bg:'#fef3c7',
     desc:'Happy is a warm feeling inside. Your heart feels light.',
     causes:['Getting a gift','Playing with friends','Eating favourite food','Sunny day'],
     body:'You might smile, laugh, or jump around!',
     healthy:'Share your happiness! Tell someone why you\'re happy.',
     scenarios:['You got full marks in a test','Your best friend came to play','You got a new toy']},
    {name:'Sad',      emoji:'😢', colour:'#60a5fa', bg:'#eff6ff',
     desc:'Sadness is when something hurts your heart. It\'s okay to feel sad.',
     causes:['Losing something','Missing someone','Being left out','Something going wrong'],
     body:'You might cry, feel heavy, or want to be alone.',
     healthy:'It\'s okay to cry. Talk to someone you trust. It will get better.',
     scenarios:['Your pet got sick','Your friend moved away','You couldn\'t go to a party']},
    {name:'Angry',    emoji:'😠', colour:'#ef4444', bg:'#fef2f2',
     desc:'Anger is a strong hot feeling. It\'s telling you something feels unfair.',
     causes:['Being treated unfairly','Losing a game','Someone taking your things'],
     body:'Your face goes red, fists clench, heart beats fast.',
     healthy:'Take deep breaths. Count to 10. Walk away to cool down.',
     scenarios:['Someone pushed you','Your turn was skipped','Someone broke your toy']},
    {name:'Scared',   emoji:'😨', colour:'#8b5cf6', bg:'#f5f3ff',
     desc:'Fear keeps you safe — it\'s your body warning you.',
     causes:['Loud noises','Darkness','Something new and unknown','Being in danger'],
     body:'Heart races, tummy has butterflies, you want to hide.',
     healthy:'Tell a trusted adult. Face small fears with support. Brave is not not-scared; it\'s scared but doing it anyway.',
     scenarios:['Thunder outside at night','New school day','A big dog running toward you']},
    {name:'Excited',  emoji:'🤩', colour:'#f97316', bg:'#fff7ed',
     desc:'Excitement is like happiness with energy — you can\'t wait for something!',
     causes:['Birthday coming up','Going on a trip','Watching your favourite show'],
     body:'You talk fast, can\'t sit still, smile a lot.',
     healthy:'Use that energy to help get ready. Share your excitement with others.',
     scenarios:['Your birthday is tomorrow','A school trip was announced','A friend is visiting']},
    {name:'Surprised',emoji:'😲', colour:'#10b981', bg:'#f0fdf4',
     desc:'Surprise can be good or not-so-good depending on what happened.',
     causes:['Unexpected news','Someone shows up you didn\'t expect','Finding something'],
     body:'Wide eyes, open mouth, fast heartbeat for a second.',
     healthy:'Take a breath. Decide if it\'s a good or not-good surprise, then respond.',
     scenarios:['A surprise party for you','Unexpected test at school','Finding money in an old pocket']},
  ];

  var selected=null, scenario=null;

  function render(){
    c.innerHTML='';
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';

    var title=document.createElement('div');
    title.style.cssText='font-size:13px;font-weight:800;color:var(--text);text-align:center';
    title.textContent='🎡 Feelings Wheel — How do you feel?';
    wrap.appendChild(title);

    /* Feelings wheel */
    var wheelRow=document.createElement('div');
    wheelRow.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:center';
    feelings.forEach(function(f,i){
      var btn=document.createElement('button');
      var isSel=selected===i;
      btn.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 12px;border-radius:12px;cursor:pointer;'+
        'border:2px solid '+(isSel?f.colour:'transparent')+
        ';background:'+(isSel?f.bg:'var(--surface2)')+
        ';transition:all .15s;min-width:80px';
      btn.innerHTML='<span style="font-size:32px">'+f.emoji+'</span>'+
        '<span style="font-size:11px;font-weight:800;color:'+(isSel?f.colour:'var(--muted)')+'">'+f.name+'</span>';
      btn.onclick=function(){
        selected=i; scenario=null;
        render();
      };
      wheelRow.appendChild(btn);
    });
    wrap.appendChild(wheelRow);

    if(selected!==null){
      var f=feelings[selected];
      var panel=document.createElement('div');
      panel.style.cssText='background:'+f.bg+';border-radius:14px;padding:12px;border:2px solid '+f.colour+'44;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:8px';

      panel.innerHTML='<div style="font-size:48px;text-align:center">'+f.emoji+'</div>'+
        '<div style="font-size:15px;font-weight:900;color:'+f.colour+';text-align:center">'+f.name+'</div>'+
        '<div style="font-size:12px;color:#1e293b;text-align:center;font-style:italic">'+f.desc+'</div>';

      /* Body sensations */
      var bodyRow=document.createElement('div');
      bodyRow.style.cssText='background:rgba(255,255,255,0.6);border-radius:10px;padding:8px';
      bodyRow.innerHTML='<div style="font-size:10px;font-weight:800;color:'+f.colour+';text-transform:uppercase;margin-bottom:4px">🫀 In your body</div>'+
        '<div style="font-size:12px;color:#1e293b">'+f.body+'</div>';
      panel.appendChild(bodyRow);

      /* What to do */
      var doRow=document.createElement('div');
      doRow.style.cssText='background:rgba(255,255,255,0.6);border-radius:10px;padding:8px';
      doRow.innerHTML='<div style="font-size:10px;font-weight:800;color:'+f.colour+';text-transform:uppercase;margin-bottom:4px">✅ What to do</div>'+
        '<div style="font-size:12px;color:#1e293b">'+f.healthy+'</div>';
      panel.appendChild(doRow);

      /* Scenario quiz */
      var scLabel=document.createElement('div');
      scLabel.style.cssText='font-size:11px;font-weight:800;color:'+f.colour+';text-align:center';
      scLabel.textContent='When would YOU feel '+f.name.toLowerCase()+'?';
      panel.appendChild(scLabel);

      var scRow=document.createElement('div');
      scRow.style.cssText='display:flex;flex-direction:column;gap:4px';
      f.scenarios.forEach(function(sc){
        var btn=document.createElement('button');
        var isSc=scenario===sc;
        btn.style.cssText='padding:7px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;text-align:left;'+
          'border:1.5px solid '+(isSc?f.colour:'var(--border)')+
          ';background:'+(isSc?f.colour+'22':'white')+';color:#1e293b';
        btn.textContent=sc;
        btn.onclick=function(){scenario=sc;render();};
        scRow.appendChild(btn);
      });
      panel.appendChild(scRow);

      if(scenario){
        var validation=document.createElement('div');
        validation.style.cssText='background:'+f.colour+'22;border-radius:8px;padding:8px;text-align:center;font-size:12px;font-weight:800;color:'+f.colour;
        validation.textContent='✅ Yes! "'+scenario+'" is a great reason to feel '+f.name.toLowerCase()+'! All your feelings are valid. 💙';
        panel.appendChild(validation);
      }

      wrap.appendChild(panel);
    }

    var hint=document.createElement('div');
    hint.style.cssText='font-size:11px;color:var(--muted);text-align:center';
    hint.textContent='Tap any feeling to explore it. All feelings are normal and okay!';
    wrap.appendChild(hint);
    c.appendChild(wrap);
  }
  render();
};


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
    hand: { h: 52 },  /* emoji ✋ height ~52px */
    tree: { h: 62 },  /* tree canopy top */
    bird: { h: 54 },  /* bird wing top: centre(38) + wing rise(16) = 54px above ground */
  };

  function drawHand(ctx, x, groundY) {
    /* Use ✋ emoji — crisp, cross-platform, instantly recognisable */
    var fontSize = 52;
    ctx.save();
    ctx.font = fontSize + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('✋', x, groundY + 6);
    ctx.restore();
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
    /* Bird facing LEFT toward the lamp, wings spread upward */
    /* Total width ~56px, centred on x. Head on left (toward lamp). */

    /* Body */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); ctx.ellipse(x, centerY, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill();

    /* Left wing (toward lamp — visually on the LEFT) */
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(x - 2, centerY - 1);
    ctx.bezierCurveTo(x - 14, centerY - 16, x - 26, centerY - 13, x - 28, centerY - 7);
    ctx.bezierCurveTo(x - 20, centerY - 3, x - 8, centerY + 2, x - 2, centerY - 1);
    ctx.fill();

    /* Right wing (away from lamp) */
    ctx.beginPath();
    ctx.moveTo(x + 2, centerY - 1);
    ctx.bezierCurveTo(x + 14, centerY - 16, x + 26, centerY - 13, x + 28, centerY - 7);
    ctx.bezierCurveTo(x + 20, centerY - 3, x + 8, centerY + 2, x + 2, centerY - 1);
    ctx.fill();

    /* Wing sheen */
    ctx.fillStyle = 'rgba(147,197,253,0.22)';
    ctx.beginPath(); ctx.ellipse(x - 16, centerY - 10, 7, 3.5, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 16, centerY - 10, 7, 3.5, 0.35, 0, Math.PI * 2); ctx.fill();

    /* Tail — on the RIGHT (trailing away from lamp) */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(x + 10, centerY + 3);
    ctx.lineTo(x + 20, centerY + 10);
    ctx.lineTo(x + 14, centerY + 7);
    ctx.lineTo(x + 8, centerY + 9);
    ctx.lineTo(x + 3, centerY + 4);
    ctx.fill();

    /* Head — on the LEFT facing the lamp */
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath(); ctx.arc(x - 12, centerY - 2, 7, 0, Math.PI * 2); ctx.fill();

    /* Eye */
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x - 14, centerY - 3, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(x - 14.5, centerY - 3.5, 1.1, 0, Math.PI * 2); ctx.fill();
    /* Eye shine */
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - 15, centerY - 4, 0.6, 0, Math.PI * 2); ctx.fill();

    /* Beak facing LEFT */
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x - 19, centerY - 3);
    ctx.lineTo(x - 24, centerY - 2);
    ctx.lineTo(x - 19, centerY);
    ctx.fill();
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
    /* Object position — dist 10 (close to lamp) → 70 (far from lamp) */
    var objX = 70 + (dist - 10) / 60 * (W - 140);
    /* Clamp depends on object: bird has tail extending 20px right, hand extends 20px wide */
    var rightMargin = objType === 'bird' ? 30 : objType === 'hand' ? 22 : 60;
    objX = Math.max(72, Math.min(objX, W - rightMargin));
    var def = objDefs[objType];

    /* ── Shadow geometry ──
       Point light at (lx, ly). Object top at (objX, objTopY).
       Ray from light THROUGH object top, extended until it hits groundY.
       s = (groundY − ly) / (objTopY − ly) → shadowTipX = lx + s*(objX − lx)
       Shadow on ground: from objX rightward to shadowTipX. */
    var objTopY = groundY - def.h;
    var s = (groundY - ly) / (objTopY - ly);
    var shadowTipX = lx + s * (objX - lx);
    var clipped = shadowTipX > W - 4;
    shadowTipX = Math.min(shadowTipX, W - 4);
    var shadowLen = Math.max(6, shadowTipX - objX);

    /* ── 1. Light rays (draw first, behind everything) ── */
    ctx.save();
    /* Fan of illuminating rays around the object */
    ctx.strokeStyle = 'rgba(253,224,71,0.14)'; ctx.lineWidth = 1;
    /* Rays that miss the object — go into lit zone */
    for (var ri = 0; ri < 5; ri++) {
      var ang = -0.45 + ri * 0.12; /* angles above the object */
      ctx.beginPath(); ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(ang) * W, ly + Math.sin(ang) * W);
      ctx.stroke();
    }
    /* Two boundary rays (top and bottom of object) */
    ctx.strokeStyle = 'rgba(253,224,71,0.35)'; ctx.lineWidth = 1.5;
    /* Top boundary: lamp → object top → ground (shadowTipX) */
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(shadowTipX, groundY); ctx.stroke();
    /* Bottom boundary: lamp → object base → continues */
    var botDirX = objX - lx, botDirY = groundY - ly;
    var botLen = Math.sqrt(botDirX*botDirX + botDirY*botDirY);
    ctx.beginPath(); ctx.moveTo(lx, ly);
    ctx.lineTo(lx + botDirX/botLen*(W*0.9), ly + botDirY/botLen*(W*0.9)); ctx.stroke();
    ctx.restore();

    /* ── 2. Shadow cone (unlit region between boundary rays) ── */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H); /* clip to canvas */
    ctx.clip();
    var shadowGrad = ctx.createLinearGradient(objX, 0, shadowTipX, 0);
    shadowGrad.addColorStop(0,   'rgba(30,50,20,0.28)');
    shadowGrad.addColorStop(0.6, 'rgba(30,50,20,0.14)');
    shadowGrad.addColorStop(1,   'rgba(30,50,20,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(objX, groundY);
    ctx.lineTo(shadowTipX, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* ── 3. Ground shadow (ellipse on ground surface) ── */
    ctx.save();
    var sHalfW = shadowLen / 2;
    var sHalfH = Math.min(9, 4 + shadowLen * 0.06);
    /* Gradient shadow — darker near object, fades toward tip */
    var sGrad = ctx.createLinearGradient(objX, groundY, shadowTipX, groundY);
    sGrad.addColorStop(0,   'rgba(40,55,25,0.45)');
    sGrad.addColorStop(0.5, 'rgba(40,55,25,0.22)');
    sGrad.addColorStop(1,   clipped ? 'rgba(40,55,25,0.15)' : 'rgba(40,55,25,0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.ellipse(objX + sHalfW, groundY + 2, sHalfW, sHalfH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ── 4. Object (drawn on top of shadow) ── */
    if (objType === 'hand') drawHand(ctx, objX, groundY);
    else if (objType === 'tree') drawTree(ctx, objX, groundY);
    else drawBird(ctx, objX, groundY - 38);

    /* ── 5. Labels ── */
    ctx.fillStyle = '#92400e'; ctx.font = 'bold 9px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Light', lx, ly - 20);
    /* Shadow label on ground */
    var labelX = Math.min(objX + sHalfW, W - 40);
    ctx.fillStyle = 'rgba(50,70,30,0.75)'; ctx.font = '8px Nunito,sans-serif';
    ctx.fillText((clipped ? '>' : '') + Math.round(shadowLen) + 'px shadow', labelX, groundY + 18);
    /* Insight */
    var insight = dist < 25 ? 'Very close — long shadow!' : dist < 45 ? 'Medium distance' : 'Far away — shorter shadow';
    ctx.fillStyle = '#4a5240'; ctx.font = 'bold 9px Nunito,sans-serif';
    ctx.fillText(insight, W / 2, H - 6);

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
        cancelAnimationFrame(raf);
    /* Init slider fill */
    requestAnimationFrame(function() {
      draw();
      /* Init slider fill after draw so DOM exists */
      requestAnimationFrame(function() {
        var sl = document.querySelector('input[oninput*="shadowDist"]');
        if (sl) { sl.style.setProperty('--val', ((dist-10)/60*100).toFixed(1)+'%'); }
      });
    });
  }

  window.shadowDist = function(v) {
    dist = parseInt(v);
    var sl = document.querySelector('input[oninput*="shadowDist"]');
    if (sl) { var pct=((dist-10)/60*100).toFixed(1)+'%'; sl.style.setProperty('--val',pct); }
  };
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
  var colourMode = 'pigment';

  var modes = {
    pigment: {
      label: '🎨 Pigment (Paint)',
      desc: 'Mixing paints — Primary colours: Red, Yellow, Blue. Mixing absorbs light (subtractive).',
      primaries: [
        {name:'Red',    hex:'#ef4444', r:239,g:68,b:68},
        {name:'Yellow', hex:'#FFD600', r:255,g:214,b:0},
        {name:'Blue',   hex:'#3b82f6', r:59,g:130,b:246},
      ],
      mixes: {
        'Blue+Red':    {result:'Purple',  hex:'#9333ea', fact:'Red + Blue paint = Purple! Two primaries make a secondary colour.'},
        'Red+Yellow':  {result:'Orange',  hex:'#f97316', fact:'Red + Yellow paint = Orange! Seen in sunsets and fire.'},
        'Blue+Yellow': {result:'Green',   hex:'#22c55e', fact:'Blue + Yellow paint = Green! The colour of all plant life.'},
        'Blue+Red+Yellow': {result:'Brown', hex:'#78350f', fact:'All three paint primaries = Brown (muddy!). Pigments absorb light — more pigments absorb more light.'},
      }
    },
    light: {
      label: '💡 Light (RGB)',
      desc: 'Mixing coloured light — used in screens, LEDs, projectors. Primary colours: Red, Green, Blue. Mixing adds light (additive).',
      primaries: [
        {name:'Red',   hex:'#ef4444', r:255,g:0,b:0},
        {name:'Green', hex:'#22c55e', r:0,g:255,b:0},
        {name:'Blue',  hex:'#3b82f6', r:0,g:0,b:255},
      ],
      mixes: {
        'Green+Red':   {result:'Yellow',  hex:'#FFFF00', fact:'Red + Green light = Yellow! Light mixing is additive — you get brighter colours, not darker.'},
        'Blue+Red':    {result:'Magenta', hex:'#FF00FF', fact:'Red + Blue light = Magenta. Used in colour printing (CMYK) as a primary!'},
        'Blue+Green':  {result:'Cyan',    hex:'#00FFFF', fact:'Green + Blue light = Cyan. Your phone screen mixes RGB to make every colour you see.'},
        'Blue+Green+Red': {result:'White', hex:'#FFFFFF', fact:'All three light primaries = White! Newton proved sunlight contains all colours using a glass prism in 1666.'},
      }
    }
  };

  function getMix() {
    if (!selected.length) return null;
    return modes[colourMode].mixes[selected.slice().sort().join('+')] || null;
  }

  function getMixedColour() {
    var m = modes[colourMode];
    if (!selected.length) return null;
    /* If we have a known result, use its exact hex — much more accurate than RGB math */
    var known = getMix();
    if (known) return known.hex;
    /* Single colour selected — show that primary's colour */
    if (selected.length === 1) {
      var p = m.primaries.find(function(p){ return p.name === selected[0]; });
      return p ? p.hex : null;
    }
    /* Partial unknown mix — blend additively for light, darken for pigment */
    var tr=0,tg=0,tb=0;
    selected.forEach(function(n){
      var p=m.primaries.find(function(p){return p.name===n;});
      tr+=p.r; tg+=p.g; tb+=p.b;
    });
    if (colourMode==='light') {
      return 'rgb('+Math.min(255,tr)+','+Math.min(255,tg)+','+Math.min(255,tb)+')';
    } else {
      var cnt=selected.length, d=cnt>1?0.75:1;
      return 'rgb('+Math.round(tr/cnt*d)+','+Math.round(tg/cnt*d)+','+Math.round(tb/cnt*d)+')';
    }
  }

  function render() {
    var m = modes[colourMode];
    var mix = getMix();
    var mixedCol = getMixedColour();
    var isLight = colourMode === 'light';

    c.innerHTML = '';
    c.style.maxWidth = '400px';
    c.style.margin = '0 auto';

    /* Mode toggle */
    var modeRow = document.createElement('div');
    modeRow.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;background:var(--surface2);border-radius:10px;padding:3px';
    ['pigment','light'].forEach(function(mode) {
      var btn = document.createElement('button');
      btn.textContent = modes[mode].label;
      var active = mode === colourMode;
      btn.style.cssText = 'flex:1;padding:6px;border-radius:8px;border:none;font-family:Nunito,sans-serif;font-size:11px;font-weight:800;cursor:pointer;transition:all .18s;background:'+(active?'var(--acc)':'transparent')+';color:'+(active?'white':'var(--muted)');
      btn.addEventListener('click', function() { colourMode = mode; selected = []; render(); });
      modeRow.appendChild(btn);
    });
    c.appendChild(modeRow);

    /* Canvas mixing bowl */
    var canvas = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    /* Use fixed width — avoids zoom-on-first-render from offsetWidth=0 race */
    var CW = 340, CH = 105;
    canvas.width = CW * dpr; canvas.height = CH * dpr;
    canvas.style.cssText = 'width:100%;max-width:'+CW+'px;height:'+CH+'px;display:block;margin:0 auto 8px;border-radius:12px;background:var(--surface2)';
    var ctx2 = canvas.getContext('2d');
    ctx2.scale(dpr, dpr);
    c.appendChild(canvas);

    /* Draw mixing bowl visual */
    var n = m.primaries.length;
    var slotW = CW / n;

    /* Background */
    ctx2.fillStyle = isLight ? '#0a0a1a' : '#f8f4f0';
    ctx2.beginPath(); if (ctx2.roundRect) ctx2.roundRect(0,0,CW,CH,12); else ctx2.rect(0,0,CW,CH);
    ctx2.fill();

    m.primaries.forEach(function(p, i) {
      var isSel = selected.indexOf(p.name) >= 0;
      var slotCx = slotW * i + slotW / 2;
      var slotCy = 44;

      /* Glow for light mode */
      if (isLight && isSel) {
        var glow = ctx2.createRadialGradient(slotCx, slotCy, 0, slotCx, slotCy, 30);
        glow.addColorStop(0, p.hex + 'aa');
        glow.addColorStop(1, p.hex + '00');
        ctx2.fillStyle = glow;
        ctx2.beginPath(); ctx2.arc(slotCx, slotCy, 32, 0, Math.PI*2); ctx2.fill();
      }

      /* Paint blob / light circle */
      if (isLight) {
        /* Glowing light disc */
        var lg = ctx2.createRadialGradient(slotCx-5, slotCy-5, 2, slotCx, slotCy, 28);
        lg.addColorStop(0, 'white');
        lg.addColorStop(0.3, p.hex);
        lg.addColorStop(1, p.hex + (isSel?'cc':'44'));
        ctx2.fillStyle = lg;
        ctx2.beginPath(); ctx2.arc(slotCx, slotCy, isSel?24:19, 0, Math.PI*2); ctx2.fill();
      } else {
        /* Paint blob — irregular for realism */
        var pg2 = ctx2.createRadialGradient(slotCx-6, slotCy-6, 2, slotCx, slotCy, 26);
        pg2.addColorStop(0, lighten(p.hex));
        pg2.addColorStop(0.6, p.hex);
        pg2.addColorStop(1, darken(p.hex));
        ctx2.fillStyle = pg2;
        ctx2.beginPath();
        ctx2.ellipse(slotCx, slotCy, isSel?23:18, isSel?20:16, -0.2, 0, Math.PI*2);
        ctx2.fill();
        /* Paint texture highlight */
        ctx2.fillStyle = 'rgba(255,255,255,0.2)';
        ctx2.beginPath(); ctx2.ellipse(slotCx-7, slotCy-7, 8, 5, -0.5, 0, Math.PI*2); ctx2.fill();
      }

      /* Selected tick ring */
      if (isSel) {
        ctx2.strokeStyle = 'white'; ctx2.lineWidth = 2.5;
        ctx2.beginPath(); ctx2.arc(slotCx, slotCy, isSel?26:21, 0, Math.PI*2); ctx2.stroke();
        ctx2.fillStyle = 'white'; ctx2.font = 'bold 10px Nunito,sans-serif'; ctx2.textAlign = 'center';
        ctx2.fillText('✓', slotCx, slotCy + (isLight?27:26));
      }

      /* Colour name label */
      ctx2.fillStyle = isSel ? p.hex : (isLight?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.45)');
      ctx2.font = 'bold 11px Nunito,sans-serif'; ctx2.textAlign = 'center';
      ctx2.fillText(p.name, slotCx, CH - 6);

      /* + between colours */
      if (i < n-1) {
        ctx2.fillStyle = isLight?'rgba(255,255,255,0.35)':'rgba(0,0,0,0.25)';
        ctx2.font = 'bold 18px Nunito,sans-serif'; ctx2.textAlign = 'center';
        ctx2.fillText('+', slotW*(i+1), slotCy+6);
      }
    });

    /* fixedSlotCy — slotCy was scoped inside forEach, pull it out */
    var fixedSlotCy = 44;
    if (selected.length) {
      ctx2.fillStyle = isLight?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.3)';
      ctx2.font = 'bold 16px Nunito,sans-serif'; ctx2.textAlign = 'center';
      ctx2.fillText('=', CW/2, fixedSlotCy);
    }

    /* Result row */
    var resultRow = document.createElement('div');
    resultRow.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 10px;background:var(--surface2);border-radius:10px;margin-bottom:6px';

    var resultLabel = document.createElement('div');
    resultLabel.style.cssText = 'font-size:11px;color:var(--muted);font-weight:700;white-space:nowrap';
    resultLabel.textContent = selected.length ? (mix ? 'You made:' : 'Mixing…') : 'Pick colours above';

    var resultSwatch = document.createElement('div');
    var swatchSize = mix ? 44 : 32;
    resultSwatch.style.cssText = 'width:'+swatchSize+'px;height:'+swatchSize+'px;border-radius:50%;transition:all .4s;flex-shrink:0;'
      + 'background:'+(mixedCol || 'var(--border)')+';'
      + 'box-shadow:'+(mixedCol ? '0 0 12px '+(mixedCol)+'88' : 'none')+';'
      + 'border:2px solid '+(mix?mix.hex:'var(--border)');

    var resultName = document.createElement('div');
    resultName.style.cssText = 'font-size:16px;font-weight:900;color:'+(mix?mix.hex:'var(--muted)');
    resultName.textContent = mix ? mix.result : '';

    resultRow.appendChild(resultLabel);
    resultRow.appendChild(resultSwatch);
    if (mix) resultRow.appendChild(resultName);
    c.appendChild(resultRow);

    /* Fact box */
    var fact = document.createElement('div');
    fact.style.cssText = 'background:var(--surface2);border-radius:10px;padding:8px 12px;font-size:12px;color:var(--text);line-height:1.6;border:1px solid var(--border)';
    fact.textContent = mix ? '🎨 '+mix.fact
      : selected.length===0 ? m.desc
      : selected.length===1 ? 'Tap another colour to mix!'
      : 'Try a different combination!';
    c.appendChild(fact);

    /* Clear button */
    var ctrl = document.createElement('div');
    ctrl.className = 'ctrl-row';
    ctrl.style.marginTop = '7px';
    var clearBtn = document.createElement('button');
    clearBtn.className = 'cbtn';
    clearBtn.textContent = '↺ Clear';
    clearBtn.addEventListener('click', function(){ selected=[]; render(); });
    var hint = document.createElement('span');
    hint.style.cssText = 'font-size:10px;color:var(--muted);margin-left:8px';
    hint.textContent = isLight ? 'Additive: light + light = brighter' : 'Subtractive: pigment + pigment = darker';
    ctrl.appendChild(clearBtn); ctrl.appendChild(hint);
    c.appendChild(ctrl);

    /* Make canvas clickable */
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var clickX = (e.clientX - rect.left) * (CW / rect.width);
      var idx2 = Math.floor(clickX / slotW);
      if (idx2 >= 0 && idx2 < m.primaries.length) {
        window.cmToggle(m.primaries[idx2].name);
      }
    });
  }

  function lighten(hex) {
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return 'rgb('+Math.min(255,r+60)+','+Math.min(255,g+60)+','+Math.min(255,b+60)+')';
  }
  function darken(hex) {
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return 'rgb('+Math.max(0,r-40)+','+Math.max(0,g-40)+','+Math.max(0,b-40)+')';
  }

  window.cmMode = function(m) { colourMode = m; selected = []; render(); };
  window.cmToggle = function(n) {
    var i = selected.indexOf(n);
    if (i >= 0) selected.splice(i, 1);
    else if (selected.length < 3) selected.push(n);
    render();
  };
  window.cmClear = function() { selected = []; render(); };
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


/* ══════════════════════════════════════════════════
   NEWLY IMPLEMENTED SIMS — priority science Class 6-10
   ══════════════════════════════════════════════════ */

/* ── FRICTION SIM (Class 8 Ch 12) ── */
SIM_REGISTRY['friction-sim'] = function(c) {
  var surface = 'wood', mass = 3, pushing = false, vel = 0, pos = 60, raf;
  var surfaces = {
    wood:    { label:'🪵 Wood',    mu: 0.4,  col:'#92400e', tex:'rough planks' },
    ice:     { label:'🧊 Ice',     mu: 0.05, col:'#bae6fd', tex:'smooth ice' },
    rubber:  { label:'⚫ Rubber',  mu: 0.7,  col:'#1f2937', tex:'grippy rubber' },
    glass:   { label:'🪟 Glass',   mu: 0.15, col:'#e0f2fe', tex:'polished glass' },
    carpet:  { label:'🟥 Carpet',  mu: 0.55, col:'#b91c1c', tex:'coarse carpet' },
  };

  function friction() { return surfaces[surface].mu * mass * 9.8; }

  function draw() {
    var _g = getCtx('frictionCanvas'); if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);

    var groundY = H * 0.65;
    var sf = surfaces[surface];

    /* Sky */
    ctx.fillStyle = '#f0f9ff'; ctx.fillRect(0,0,W,groundY);
    /* Surface */
    var sg = ctx.createLinearGradient(0,groundY,0,H);
    sg.addColorStop(0, sf.col); sg.addColorStop(1, '#000');
    ctx.fillStyle = sg; ctx.fillRect(0,groundY,W,H-groundY);
    /* Surface texture label */
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(sf.tex, W/2, groundY+16);

    /* Block */
    var bw = 50, bh = 36;
    var bx = Math.max(10, Math.min(pos, W-bw-10));
    var by = groundY - bh;
    var bg = ctx.createLinearGradient(bx,by,bx+bw,by+bh);
    bg.addColorStop(0,'#fbbf24'); bg.addColorStop(1,'#d97706');
    ctx.fillStyle = bg;
    ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,by,bw,bh,4); else ctx.fillRect(bx,by,bw,bh);
    ctx.fill();
    /* Mass label */
    ctx.fillStyle = '#fff'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(mass+'kg', bx+bw/2, by+bh/2+4);

    /* Push arrow */
    if (pushing && vel > 0) {
      ctx.strokeStyle='#6366f1'; ctx.fillStyle='#6366f1'; ctx.lineWidth=2.5;
      var ax = bx+bw, ay = by+bh/2;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+30,ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax+30,ay); ctx.lineTo(ax+22,ay-5); ctx.lineTo(ax+22,ay+5); ctx.fill();
      ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('Push', ax+15, ay-8);
    }
    /* Friction arrow (opposing) */
    if (vel > 0.3) {
      ctx.strokeStyle='#ef4444'; ctx.fillStyle='#ef4444'; ctx.lineWidth=2;
      var fx2 = bx, fy2 = by+bh/2;
      ctx.beginPath(); ctx.moveTo(fx2,fy2); ctx.lineTo(fx2-25,fy2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx2-25,fy2); ctx.lineTo(fx2-17,fy2-4); ctx.lineTo(fx2-17,fy2+4); ctx.fill();
      ctx.fillText('Friction', fx2-12, fy2-8);
    }

    /* Friction force readout */
    ctx.fillStyle='#1e293b'; ctx.font='bold 11px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('Friction force: '+friction().toFixed(1)+'N', 8, 20);
    ctx.fillText('μ = '+sf.mu, 8, 34);
    ctx.fillText('Speed: '+(Math.max(0,vel)).toFixed(1)+' m/s', 8, 48);

    raf = requestAnimationFrame(draw);
  }

  function render() {
    c.innerHTML =
      '<canvas id="frictionCanvas" style="width:100%;height:160px;border-radius:10px;display:block;margin-bottom:10px"></canvas>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+
      Object.keys(surfaces).map(function(k){
        return '<button class="cbtn'+(surface===k?' evs':'')+'" data-sf="'+k+'" onclick="frSurface(this.dataset.sf)" style="font-size:11px">'+surfaces[k].label+'</button>';
      }).join('')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
      '<span style="font-size:11px;color:var(--muted)">Mass:</span>'+
      '<input type="range" class="slide" min="1" max="10" value="'+mass+'" oninput="frMass(this.value)" style="flex:1;--val:'+((mass-1)/9*100)+'%">'+
      '<span style="font-size:11px;font-weight:800;color:var(--text)">'+mass+'kg</span></div>'+
      '<div class="ctrl-row">'+
      '<button class="cbtn evs" onmousedown="frPush(true)" onmouseup="frPush(false)" ontouchstart="frPush(true)" ontouchend="frPush(false)" style="flex:1">👊 Push & Hold</button>'+
      '<button class="cbtn" onclick="frReset()">↺ Reset</button></div>';

    cancelAnimationFrame(raf);
    draw();
  }

  window.frSurface = function(s) { surface=s; render(); };
  window.frMass = function(v) { mass=parseInt(v); document.querySelector('input[oninput*="frMass"]').style.setProperty('--val',((mass-1)/9*100)+'%'); };
  window.frPush = function(on) {
    pushing = on;
    if (!on) return;
    (function loop() {
      if (!pushing) { return; }
      vel = Math.min(vel + 0.5, 8);
      pos += vel * 0.8;
      if (pos > 400) { pos = 60; vel = 0; }
      setTimeout(loop, 40);
    })();
  };
  window.frReset = function() { pos=60; vel=0; pushing=false; };
  window.simCleanup = function() { cancelAnimationFrame(raf); };
  render();
};

/* ── SOUND VIBRATION (Class 8 Ch 13) ── */
SIM_REGISTRY['sound-vibration'] = function(c) {
  var freq = 440, amp = 50, medium = 'air', playing = false, audioCtx = null, osc = null, gain2 = null, raf2;
  var mediums = {
    air:   { label:'🌬️ Air',   speed:343,  col:'#bae6fd', desc:'Sound travels at 343 m/s in air' },
    water: { label:'💧 Water', speed:1480, col:'#3b82f6', desc:'Sound travels 4× faster in water!' },
    metal: { label:'🔩 Metal', speed:5100, col:'#94a3b8', desc:'Sound travels 15× faster in steel!' },
    vacuum:{ label:'🌌 Vacuum',speed:0,    col:'#1e1b4b', desc:'No medium — no sound! Space is silent.' },
  };
  var t = 0;

  function drawWave() {
    var _g = getCtx('soundCanvas'); if (!_g) return;
    var cv = _g.cv, ctx = _g.ctx, W = _g.W, H = _g.H;
    ctx.clearRect(0,0,W,H);
    var m = mediums[medium];
    /* Background */
    ctx.fillStyle = m.col+'44'; ctx.fillRect(0,0,W,H);
    /* Medium label */
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign='right';
    ctx.fillText(m.desc, W-6, 14);

    if (medium === 'vacuum') {
      ctx.fillStyle = '#6366f1'; ctx.font = 'bold 14px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('🔇 No sound in vacuum!', W/2, H/2);
      raf2 = requestAnimationFrame(drawWave); return;
    }

    t += 0.05;
    var waveSpeed = m.speed / 5000;
    /* Draw waveform */
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i=0;i<=W;i++) {
      var y = H/2 + (amp/100)*(H*0.4) * Math.sin(2*Math.PI * (i/(W/3) * freq/440) - t * waveSpeed * 60);
      if (i===0) ctx.moveTo(i,y); else ctx.lineTo(i,y);
    }
    ctx.stroke();
    /* Vibrating object */
    var vib = Math.sin(t*freq/44)*8*(amp/100);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(W/2-6+vib, H/2-20, 12, 40);

    raf2 = requestAnimationFrame(drawWave);
  }

  function render() {
    c.innerHTML =
      '<canvas id="soundCanvas" style="width:100%;height:130px;border-radius:10px;display:block;margin-bottom:8px"></canvas>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">'+
      Object.keys(mediums).map(function(k){
        return '<button class="cbtn'+(medium===k?' evs':'')+'" data-med="'+k+'" onclick="sndMedium(this.dataset.med)" style="font-size:10px">'+mediums[k].label+'</button>';
      }).join('')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
      '<span style="font-size:11px;color:var(--muted);white-space:nowrap">Pitch (Hz):</span>'+
      '<input type="range" class="slide" min="100" max="1000" value="'+freq+'" oninput="sndFreq(this.value)" style="flex:1;--val:'+((freq-100)/900*100).toFixed(1)+'%">'+
      '<span style="font-size:11px;font-weight:800;color:var(--text)">'+freq+'Hz</span></div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<span style="font-size:11px;color:var(--muted);white-space:nowrap">Volume:</span>'+
      '<input type="range" class="slide" min="1" max="100" value="'+amp+'" oninput="sndAmp(this.value)" style="flex:1;--val:'+amp+'%">'+
      '<span style="font-size:11px;font-weight:800;color:var(--text)">'+amp+'%</span></div>'+
      '<div class="ctrl-row">'+
      '<button class="cbtn evs" onclick="sndPlay()" style="flex:1">'+(playing?'⏹ Stop':'▶ Play Sound')+'</button></div>';

    cancelAnimationFrame(raf2);
    drawWave();
  }

  window.sndMedium = function(m) { medium=m; if(playing&&m==='vacuum'){sndPlay();} render(); };
  window.sndFreq = function(v) { freq=parseInt(v); if(osc) osc.frequency.value=freq; };
  window.sndAmp = function(v) { amp=parseInt(v); if(gain2) gain2.gain.value=amp/400; };
  window.sndPlay = function() {
    if (medium==='vacuum') return;
    if (playing) {
      if(osc){osc.stop();osc=null;} playing=false;
    } else {
      try {
        if (!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        osc=audioCtx.createOscillator(); gain2=audioCtx.createGain();
        osc.type='sine'; osc.frequency.value=freq; gain2.gain.value=amp/400;
        osc.connect(gain2); gain2.connect(audioCtx.destination);
        osc.start(); playing=true;
      } catch(e) {}
    }
    render();
  };
  window.simCleanup = function() { cancelAnimationFrame(raf2); if(osc){osc.stop();osc=null;} };
  render();
};

/* ── SOUND PITCH (alias — same sim) ── */
SIM_REGISTRY['sound-pitch'] = SIM_REGISTRY['sound-vibration'];

/* ── SEPARATION TECHNIQUES (Class 6 Ch 5) ── */
SIM_REGISTRY['separation-sim'] = function(c) {
  var method = null;
  var methods = [
    { id:'filtration', icon:'🧪', name:'Filtration', desc:'Separates insoluble solids from liquids using a filter.',
      example:'Sand + Water → Filter paper removes sand, water passes through.',
      mixtures:['Sand & Water','Muddy Water','Chalk & Water'],
      steps:['Fold filter paper into a cone.','Place in a funnel over a beaker.','Pour mixture through slowly.','Solid stays on paper — filtrate is clear.'] },
    { id:'evaporation', icon:'♨️', name:'Evaporation', desc:'Separates dissolved solids from solution by heating.',
      example:'Salt Water → Heat evaporates water, salt crystals remain.',
      mixtures:['Salt Water','Sugar Water','Copper Sulphate Solution'],
      steps:['Pour solution into evaporating dish.','Heat gently over flame.','Water evaporates as steam.','Solid crystals left behind!'] },
    { id:'sieving', icon:'🥣', name:'Sieving', desc:'Separates mixtures by particle size using a sieve.',
      example:'Sand + Gravel → Large particles stay on sieve, small pass through.',
      mixtures:['Sand & Gravel','Flour & Husk','Rice & Stones'],
      steps:['Place sieve over bowl.','Pour mixture in.','Shake gently.','Larger particles remain, smaller fall through.'] },
    { id:'magnetic', icon:'🧲', name:'Magnetic Separation', desc:'Uses a magnet to remove magnetic materials from a mixture.',
      example:'Iron filings + Sand → Magnet attracts iron, leaves sand.',
      mixtures:['Iron Filings & Sand','Iron Nails & Sawdust'],
      steps:['Move magnet over mixture.','Iron filings cling to magnet.','Lift magnet away from the rest.','Shake off iron filings.'] },
    { id:'decantation', icon:'🫗', name:'Decantation', desc:'Pours off liquid from settled sediment without disturbing it.',
      example:'Sand + Water — let settle, then carefully pour water off.',
      mixtures:['Sand & Water (settled)','Oil & Water'],
      steps:['Allow mixture to settle completely.','Tilt container slowly.','Pour off the liquid carefully.','Sediment remains at bottom.'] },
  ];

  function render() {
    c.innerHTML = '';
    var title = document.createElement('div');
    title.style.cssText = 'font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center';
    title.textContent = '🔬 Separation Techniques Lab';
    c.appendChild(title);

    /* Method grid */
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px';
    methods.forEach(function(m) {
      var btn = document.createElement('button');
      var active = method === m.id;
      btn.style.cssText = 'padding:8px 4px;border-radius:10px;border:2px solid '+(active?'var(--sci)':'var(--border)')+';background:'+(active?'rgba(239,68,68,.12)':'var(--surface2)')+';cursor:pointer;font-family:Nunito,sans-serif;transition:all .15s';
      btn.innerHTML = '<div style="font-size:20px">'+m.icon+'</div><div style="font-size:10px;font-weight:800;color:'+(active?'var(--sci)':'var(--muted)')+'">'+m.name+'</div>';
      btn.addEventListener('click', function() { method=m.id; render(); });
      grid.appendChild(btn);
    });
    c.appendChild(grid);

    if (method) {
      var m = methods.find(function(x){ return x.id===method; });
      var panel = document.createElement('div');
      panel.style.cssText = 'background:var(--surface2);border-radius:12px;padding:12px;border:1px solid var(--border)';
      panel.innerHTML =
        '<div style="font-size:13px;font-weight:900;color:var(--sci);margin-bottom:6px">'+m.icon+' '+m.name+'</div>'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">'+m.desc+'</div>'+
        '<div style="background:rgba(239,68,68,.08);border-radius:8px;padding:8px;margin-bottom:8px;font-size:11px;color:var(--text)">'+
        '<b>Example:</b> '+m.example+'</div>'+
        '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">STEPS:</div>'+
        m.steps.map(function(s,i){ return '<div style="display:flex;gap:8px;margin-bottom:4px"><span style="color:var(--sci);font-weight:800;flex-shrink:0">'+(i+1)+'.</span><span style="font-size:11px;color:var(--text)">'+s+'</span></div>'; }).join('');
      c.appendChild(panel);
    } else {
      var prompt = document.createElement('div');
      prompt.style.cssText = 'text-align:center;color:var(--muted);font-size:12px;padding:12px';
      prompt.textContent = '👆 Tap a technique above to explore it!';
      c.appendChild(prompt);
    }
  }
  render();
};

/* ── TYNDALL EFFECT (Class 9 Ch 1) ── */
SIM_REGISTRY['tyndall-effect'] = function(c) {
  var mixture = 'colloid', raf3;
  var types = {
    solution:  { label:'🧂 Solution (Salt Water)',  scatter:0,    col:'#dbeafe', desc:'True solution — particles too tiny to scatter light. Beam invisible.' },
    colloid:   { label:'🥛 Colloid (Milk)',         scatter:0.7,  col:'#fef9c3', desc:'Colloid — medium particles scatter light. Beam visible. Tyndall Effect!' },
    suspension:{ label:'🥤 Suspension (Muddy Water)',scatter:1.0, col:'#d4a96a', desc:'Suspension — large particles scatter strongly. Very visible beam. Settles on standing.' },
  };
  var t3 = 0;

  function drawBeam() {
    var _g = getCtx('tyndallCanvas'); if(!_g) return;
    var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    var m = types[mixture];
    t3 += 0.03;

    /* Beaker */
    ctx.fillStyle = m.col+'cc';
    ctx.beginPath(); ctx.moveTo(W*0.25,20); ctx.lineTo(W*0.15,H-20); ctx.lineTo(W*0.75,H-20); ctx.lineTo(W*0.65,20); ctx.fill();
    ctx.strokeStyle='rgba(100,150,200,0.5)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.25,20); ctx.lineTo(W*0.15,H-20); ctx.lineTo(W*0.75,H-20); ctx.lineTo(W*0.65,20); ctx.stroke();

    /* Torch (left) */
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(W*0.05, H/2, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(251,191,36,0.3)';
    ctx.beginPath(); ctx.arc(W*0.05, H/2, 22, 0, Math.PI*2); ctx.fill();

    /* Light beam through beaker */
    var scatter = m.scatter;
    if (scatter > 0) {
      /* Scattered beam — visible cone */
      var grad = ctx.createLinearGradient(W*0.17,H/2,W*0.73,H/2);
      grad.addColorStop(0,'rgba(255,250,200,'+(scatter*0.6)+')');
      grad.addColorStop(0.5,'rgba(255,250,200,'+(scatter*0.4)+')');
      grad.addColorStop(1,'rgba(255,250,200,'+(scatter*0.2)+')');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(W*0.17, H/2-4);
      ctx.lineTo(W*0.73, H/2 - 6 - scatter*4);
      ctx.lineTo(W*0.73, H/2 + 6 + scatter*4);
      ctx.lineTo(W*0.17, H/2+4);
      ctx.fill();
      /* Scattered particles */
      for(var p=0;p<Math.floor(scatter*15);p++) {
        var px = W*(0.2+Math.random()*0.45), py = H/2 + (Math.random()-0.5)*20;
        ctx.fillStyle='rgba(255,230,100,'+(Math.sin(t3*3+p)*0.3+0.4)+')';
        ctx.beginPath(); ctx.arc(px,py,1.5,0,Math.PI*2); ctx.fill();
      }
    } else {
      /* No scattering — faint invisible beam */
      ctx.strokeStyle='rgba(255,255,200,0.08)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(W*0.17,H/2); ctx.lineTo(W*0.73,H/2); ctx.stroke();
    }

    /* Labels */
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Torch', W*0.05, H/2+24);
    var beamLabel = scatter>0.5?'Beam visible! ✓':scatter>0?'Faint beam':'No beam visible ✗';
    ctx.fillStyle = scatter>0.3?'#16a34a':'#ef4444';
    ctx.fillText(beamLabel, W/2, H-8);

    raf3 = requestAnimationFrame(drawBeam);
  }

  function render() {
    c.innerHTML =
      '<div style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:8px">Shine a torch through each mixture — can you see the beam?</div>'+
      '<canvas id="tyndallCanvas" style="width:100%;height:160px;border-radius:10px;display:block;margin-bottom:10px"></canvas>'+
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px">'+
      Object.keys(types).map(function(k){
        var active=mixture===k;
        return '<button data-mix="'+k+'" onclick="tynMix(this.dataset.mix)" class="cbtn'+(active?' evs':'')+'" style="text-align:left;font-size:11px">'+types[k].label+'</button>';
      }).join('')+'</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:8px;font-size:11px;color:var(--text)">'+types[mixture].desc+'</div>';

    cancelAnimationFrame(raf3);
    drawBeam();
  }
  window.tynMix = function(m){mixture=m; cancelAnimationFrame(raf3); render();};
  window.simCleanup = function(){cancelAnimationFrame(raf3);};
  render();
};

/* ── TEMPORARY SLIDE (Class 9 Ch 5) ── */
SIM_REGISTRY['temp-slide'] = function(c) {
  var step=0, stain=false;
  var steps2 = [
    {icon:'💧',title:'Place a drop of water',desc:'Put one small drop of water on the centre of a clean glass slide.',action:'Add Drop'},
    {icon:'🌿',title:'Add specimen',desc:'Place a thin leaf peel or onion skin on the water drop. It should be almost transparent.',action:'Add Specimen'},
    {icon:'🎨',title:'Add stain (optional)',desc:'Add a drop of safranin (red) or iodine (blue-black) to make cells more visible.',action:'Stain '+(stain?'✓':'')},
    {icon:'🪟',title:'Place cover slip',desc:'Hold the cover slip at 45° and gently lower it to avoid air bubbles.',action:'Add Cover Slip'},
    {icon:'🔬',title:'View under microscope',desc:'Start with low power (4×), find specimen, then switch to 40× for cell detail.',action:'Focus!'},
  ];

  function render() {
    c.innerHTML = '';
    /* Slide SVG visual */
    var slide_svg = '<svg viewBox="0 0 280 80" width="100%" style="border-radius:8px;margin-bottom:10px;background:#1e293b">'+
      '<rect x="10" y="25" width="260" height="30" rx="4" fill="rgba(186,230,253,0.3)" stroke="rgba(147,197,253,0.5)" stroke-width="1.5"/>'+
      (step>=1?'<ellipse cx="140" cy="40" rx="6" ry="4" fill="rgba(56,189,248,0.6)"/>':'')+ /* water */
      (step>=2?'<ellipse cx="140" cy="40" rx="22" ry="12" fill="rgba(134,239,172,0.4)" stroke="rgba(74,222,128,0.6)" stroke-width="1"/>':'')+ /* specimen */
      (step>=3&&stain?'<ellipse cx="140" cy="40" rx="22" ry="12" fill="rgba(239,68,68,0.25)"/>':'')+ /* stain */
      (step>=4?'<rect x="112" y="28" width="56" height="24" rx="2" fill="rgba(186,230,253,0.15)" stroke="rgba(147,197,253,0.4)" stroke-width="1"/>':'')+ /* coverslip */
      (step>=5?'<circle cx="140" cy="40" r="18" fill="none" stroke="rgba(251,191,36,0.6)" stroke-width="2" stroke-dasharray="4,3"/>':'')+ /* microscope ring */
      '<text x="140" y="70" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)" font-family="Nunito,sans-serif">Glass Slide</text>'+
      '</svg>';
    c.innerHTML += slide_svg;

    /* Steps */
    var stepsDiv = document.createElement('div');
    stepsDiv.style.cssText = 'display:flex;flex-direction:column;gap:5px';
    steps2.forEach(function(s,i) {
      var done = i < step, active = i === step;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;background:'+(active?'rgba(99,102,241,.12)':done?'rgba(34,197,94,.08)':'var(--surface2)')+';border:1px solid '+(active?'var(--acc)':done?'rgba(34,197,94,.3)':'var(--border)');
      row.innerHTML =
        '<span style="font-size:18px">'+s.icon+'</span>'+
        '<div style="flex:1"><div style="font-size:11px;font-weight:800;color:'+(done?'#16a34a':active?'var(--acc)':'var(--muted)')+'">'+s.title+'</div>'+
        (active?'<div style="font-size:10px;color:var(--muted);margin-top:2px">'+s.desc+'</div>':'')+
        '</div>'+
        (done?'<span style="color:#22c55e;font-size:14px">✓</span>':'')+
        (active?'<button class="cbtn" onclick="slideStep('+i+')" style="font-size:10px;white-space:nowrap">'+s.action+'</button>':'');
      stepsDiv.appendChild(row);
    });
    c.appendChild(stepsDiv);

    if (step >= steps2.length) {
      var done2 = document.createElement('div');
      done2.style.cssText = 'text-align:center;padding:12px;background:rgba(34,197,94,.1);border-radius:10px;margin-top:8px';
      done2.innerHTML = '<div style="font-size:24px">🔬</div><div style="font-size:12px;font-weight:800;color:#16a34a">Slide ready! You can see plant cells with their cell walls and nucleus.</div>';
      c.appendChild(done2);
    }

    var ctrl = document.createElement('div');
    ctrl.className = 'ctrl-row'; ctrl.style.marginTop='8px';
    var reset = document.createElement('button');
    reset.className='cbtn'; reset.textContent='↺ Start over';
    reset.onclick=function(){step=0;stain=false;render();};
    ctrl.appendChild(reset);
    c.appendChild(ctrl);
  }

  window.slideStep = function(i) {
    if (i===2) stain=!stain;
    step=i+1; render();
  };
  render();
};

/* ── REFRACTION THROUGH GLASS SLAB (Class 10 Ch 10) ── */
SIM_REGISTRY['refraction-slab'] = function(c) {
  var angle=30, n=1.5, raf4;
  var materials = { glass:{n:1.5,col:'rgba(186,230,253,0.35)',label:'Glass (n=1.5)'}, water:{n:1.33,col:'rgba(56,189,248,0.25)',label:'Water (n=1.33)'}, diamond:{n:2.42,col:'rgba(199,125,255,0.25)',label:'Diamond (n=2.42)'} };
  var material='glass';

  function draw4() {
    var _g=getCtx('refrCanvas'); if(!_g)return;
    var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);

    var slabTop=H*0.25, slabBot=H*0.75, slabL=W*0.25, slabR=W*0.75;
    var mat=materials[material];

    /* Slab */
    ctx.fillStyle=mat.col; ctx.fillRect(slabL,slabTop,slabR-slabL,slabBot-slabTop);
    ctx.strokeStyle='rgba(147,197,253,0.4)'; ctx.lineWidth=1.5;
    ctx.strokeRect(slabL,slabTop,slabR-slabL,slabBot-slabTop);
    ctx.fillStyle='rgba(147,197,253,0.5)'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(mat.label, W/2, slabTop+14);

    /* Normal line (dashed) */
    ctx.setLineDash([4,4]); ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.setLineDash([]);

    /* Incoming ray */
    var r1 = angle*Math.PI/180;
    var ix = W/2 - Math.sin(r1)*slabTop, iy = 0;
    var ig = ctx.createLinearGradient(ix,iy,W/2,slabTop);
    ig.addColorStop(0,'rgba(251,191,36,0)'); ig.addColorStop(1,'rgba(251,191,36,0.9)');
    ctx.strokeStyle=ig; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(ix,iy); ctx.lineTo(W/2,slabTop); ctx.stroke();

    /* Refracted ray inside slab — Snell's law */
    var sinR = Math.sin(r1)/mat.n;
    var r2 = Math.asin(Math.min(0.99,sinR));
    var midX = W/2 + Math.sin(r2)*(slabBot-slabTop);
    ctx.strokeStyle='rgba(99,255,99,0.8)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W/2,slabTop); ctx.lineTo(midX,slabBot); ctx.stroke();

    /* Emerging ray — parallel to incoming */
    var ex = midX + Math.sin(r1)*(H-slabBot);
    var eg2=ctx.createLinearGradient(midX,slabBot,ex,H);
    eg2.addColorStop(0,'rgba(251,191,36,0.9)'); eg2.addColorStop(1,'rgba(251,191,36,0)');
    ctx.strokeStyle=eg2; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(midX,slabBot); ctx.lineTo(ex,H); ctx.stroke();

    /* Lateral displacement line */
    ctx.setLineDash([3,4]); ctx.strokeStyle='rgba(239,68,68,0.5)'; ctx.lineWidth=1;
    var projX=W/2+Math.sin(r1)*(slabBot-slabTop);
    ctx.beginPath(); ctx.moveTo(projX,slabBot); ctx.lineTo(midX,slabBot); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#ef4444'; ctx.font='bold 9px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Lateral shift',  (projX+midX)/2, slabBot-6);

    /* Angle labels */
    ctx.fillStyle='rgba(251,191,36,0.8)'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='left';
    ctx.fillText('i='+angle+'°', W/2-46, slabTop+18);
    ctx.fillStyle='rgba(99,255,99,0.8)';
    ctx.fillText('r='+Math.round(r2*180/Math.PI)+'°', W/2+8, slabTop+18);

    raf4=requestAnimationFrame(draw4);
  }

  function render() {
    c.innerHTML =
      '<canvas id="refrCanvas" style="width:100%;height:180px;border-radius:10px;display:block;margin-bottom:8px"></canvas>'+
      '<div style="display:flex;gap:5px;margin-bottom:8px">'+
      Object.keys(materials).map(function(k){
        return '<button class="cbtn'+(material===k?' evs':'')+'" data-mat="'+k+'" onclick="refrMat(this.dataset.mat)" style="font-size:10px">'+materials[k].label+'</button>';
      }).join('')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
      '<span style="font-size:11px;color:var(--muted);white-space:nowrap">Angle (i):</span>'+
      '<input type="range" class="slide" min="5" max="70" value="'+angle+'" oninput="refrAngle(this.value)" style="flex:1;--val:'+((angle-5)/65*100).toFixed(1)+'%">'+
      '<span style="font-size:11px;font-weight:800;min-width:30px">'+angle+'°</span></div>';
    cancelAnimationFrame(raf4); draw4();
  }
  window.refrMat=function(m){material=m;cancelAnimationFrame(raf4);render();};
  window.refrAngle=function(v){angle=parseInt(v);document.querySelector('input[oninput*="refrAngle"]').style.setProperty('--val',((angle-5)/65*100).toFixed(1)+'%');};
  window.simCleanup=function(){cancelAnimationFrame(raf4);};
  render();
};

/* ── MAGNETIC FIELD MAP (Class 10 Ch 13) ── */
SIM_REGISTRY['magnetic-field-map'] = function(c) {
  var magType='bar', showField=true, raf5;
  var t5=0;

  function draw5() {
    var _g=getCtx('magCanvas'); if(!_g) return;
    var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
    t5+=0.02;
    var cx5=W/2, cy5=H/2;

    if(magType==='bar') {
      /* Bar magnet */
      ctx.fillStyle='#ef4444'; ctx.fillRect(cx5-50,cy5-10,50,20); /* N */
      ctx.fillStyle='#3b82f6'; ctx.fillRect(cx5,cy5-10,50,20); /* S */
      ctx.fillStyle='white'; ctx.font='bold 12px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText('N',cx5-25,cy5+5); ctx.fillText('S',cx5+25,cy5+5);

      if(showField) {
        /* Field lines */
        for(var fl=-3;fl<=3;fl++) {
          ctx.strokeStyle='rgba(251,191,36,'+(0.15+Math.abs(fl)*0.08)+')';
          ctx.lineWidth=1.2;
          ctx.beginPath();
          /* Approximate field line as ellipse arc */
          var ry2=30+Math.abs(fl)*22;
          ctx.ellipse(cx5,cy5,55+Math.abs(fl)*18,ry2,0,Math.PI,0);
          ctx.stroke();
          if(fl!==0) { ctx.beginPath(); ctx.ellipse(cx5,cy5,55+Math.abs(fl)*18,ry2,0,0,Math.PI); ctx.stroke(); }
        }
        /* Animated compass needles */
        var needlePts=[[cx5-90,cy5],[cx5-70,cy5-50],[cx5+90,cy5],[cx5+70,cy5-50],[cx5,cy5-70],[cx5-40,cy5+60]];
        needlePts.forEach(function(np,ni) {
          /* Calculate field direction at this point */
          var dx=np[0]-cx5, dy=np[1]-cy5;
          var ang=Math.atan2(dy,dx)+Math.PI+Math.sin(t5+ni)*0.05;
          ctx.save(); ctx.translate(np[0],np[1]); ctx.rotate(ang);
          ctx.fillStyle='#ef4444'; ctx.fillRect(0,-2,8,4);
          ctx.fillStyle='#94a3b8'; ctx.fillRect(-8,-2,8,4);
          ctx.restore();
        });
      }
    } else {
      /* Current-carrying wire (cross section) */
      ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.arc(cx5,cy5,16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#1e293b'; ctx.font='bold 14px Nunito,sans-serif'; ctx.textAlign='center';
      ctx.fillText(magType==='wire-in'?'×':'•', cx5, cy5+5);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='10px Nunito,sans-serif';
      ctx.fillText(magType==='wire-in'?'Current in':'Current out', cx5, cy5+32);
      if(showField) {
        for(var cr=30;cr<=100;cr+=20) {
          var op=0.5-cr/250;
          ctx.strokeStyle='rgba(251,191,36,'+op+')'; ctx.lineWidth=1.5;
          ctx.beginPath(); ctx.arc(cx5,cy5,cr,0,Math.PI*2); ctx.stroke();
          /* Arrow on ring */
          var aang=(magType==='wire-in'?-1:1)*(Math.PI/2)+t5*0.5;
          var ax5=cx5+Math.cos(aang)*cr, ay5=cy5+Math.sin(aang)*cr;
          ctx.save(); ctx.translate(ax5,ay5); ctx.rotate(aang+(magType==='wire-in'?-Math.PI/2:Math.PI/2));
          ctx.fillStyle='rgba(251,191,36,'+op+')';
          ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(4,3); ctx.lineTo(-4,3); ctx.fill();
          ctx.restore();
        }
      }
    }
    raf5=requestAnimationFrame(draw5);
  }

  function render() {
    c.innerHTML =
      '<canvas id="magCanvas" style="width:100%;height:200px;border-radius:10px;display:block;margin-bottom:8px;background:#0f172a"></canvas>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'+
      ['bar','wire-in','wire-out'].map(function(t){
        var labels={bar:'🧲 Bar Magnet','wire-in':'⊗ Wire (in)','wire-out':'⊙ Wire (out)'};
        return '<button class="cbtn'+(magType===t?' evs':'')+'" data-mgt="'+t+'" onclick="magType2(this.dataset.mgt)" style="font-size:11px">'+labels[t]+'</button>';
      }).join('')+'</div>'+
      '<div class="ctrl-row"><button class="cbtn" onclick="magToggleField()" style="flex:1">'+(showField?'Hide':'Show')+' Field Lines</button></div>';
    cancelAnimationFrame(raf5); draw5();
  }
  window.magType2=function(t){magType=t;cancelAnimationFrame(raf5);render();};
  window.magToggleField=function(){showField=!showField;cancelAnimationFrame(raf5);render();};
  window.simCleanup=function(){cancelAnimationFrame(raf5);};
  render();
};

/* ── LUNG CAPACITY (Class 7 Ch 10) ── */
SIM_REGISTRY['lung-capacity'] = function(c) {
  var breathState='rest', raf6, t6=0;
  var stateData={
    rest: {vol:2400,label:'Tidal Volume (rest)',desc:'Normal breathing — ~500mL in, ~500mL out. Total lung volume ~2400mL.'},
    deep: {vol:4800,label:'Vital Capacity (deep)',desc:'Deepest possible breath — 4800mL. Includes tidal + inspiratory + expiratory reserve.'},
    max:  {vol:6000,label:'Total Lung Capacity',desc:'Maximum possible — 6000mL. Includes 1200mL residual volume that never leaves.'},
  };

  function draw6() {
    var _g=getCtx('lungCanvas'); if(!_g)return;
    var cv=_g.cv,ctx=_g.ctx,W=_g.W,H=_g.H;
    ctx.clearRect(0,0,W,H);
    t6+=0.04;
    var sd=stateData[breathState];
    var breathScale=(breathState==='rest'?0.4:breathState==='deep'?0.8:1.0);
    var breathAnim=breathScale+Math.sin(t6)*(breathState==='rest'?0.08:0.15);

    /* Background */
    ctx.fillStyle='#1e0020'; ctx.fillRect(0,0,W,H);

    /* Lungs */
    function drawLung(sx,dir) {
      var lg2=ctx.createRadialGradient(sx,H/2,5,sx,H/2,55*breathAnim);
      lg2.addColorStop(0,'rgba(239,68,68,0.9)');
      lg2.addColorStop(0.6,'rgba(185,28,28,0.8)');
      lg2.addColorStop(1,'rgba(127,29,29,0.4)');
      ctx.fillStyle=lg2;
      ctx.beginPath();
      ctx.ellipse(sx,H/2,38*breathAnim,55*breathAnim,dir*0.15,0,Math.PI*2);
      ctx.fill();
      /* Bronchiole lines */
      ctx.strokeStyle='rgba(255,150,150,0.4)'; ctx.lineWidth=1;
      for(var b=0;b<4;b++) {
        var ba=dir*(b-1.5)*0.3;
        ctx.beginPath(); ctx.moveTo(W/2,H/2-10);
        ctx.lineTo(sx+Math.sin(ba)*20*breathAnim, H/2+Math.cos(ba)*25*breathAnim); ctx.stroke();
      }
    }
    drawLung(W/2-48, -1); drawLung(W/2+48, 1);

    /* Trachea */
    ctx.fillStyle='rgba(239,68,68,0.7)';
    ctx.fillRect(W/2-5, 10, 10, H/2-15);
    /* Diaphragm */
    var diaY=H*0.72-breathAnim*15;
    ctx.strokeStyle='rgba(251,191,36,0.6)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(W*0.1,diaY); ctx.quadraticCurveTo(W/2,diaY+20*breathAnim,W*0.9,diaY); ctx.stroke();

    /* Volume indicator */
    var vol=Math.round(sd.vol*(0.9+Math.sin(t6)*0.1));
    ctx.fillStyle='rgba(251,191,36,0.9)'; ctx.font='bold 13px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText(vol+'mL', W/2, H-12);

    raf6=requestAnimationFrame(draw6);
  }

  function render() {
    c.innerHTML =
      '<canvas id="lungCanvas" style="width:100%;height:180px;border-radius:10px;display:block;margin-bottom:8px"></canvas>'+
      '<div style="display:flex;gap:5px;margin-bottom:8px">'+
      Object.keys(stateData).map(function(k){
        var labels={rest:'😮‍💨 Normal',deep:'🫁 Deep Breath',max:'💨 Maximum'};
        return '<button class="cbtn'+(breathState===k?' evs':'')+'" data-ls="'+k+'" onclick="lungState(this.dataset.ls)" style="font-size:11px">'+labels[k]+'</button>';
      }).join('')+'</div>'+
      '<div style="background:var(--surface2);border-radius:10px;padding:8px;font-size:11px;color:var(--text);line-height:1.6">'+
      '<b style="color:var(--sci)">'+stateData[breathState].label+':</b> '+stateData[breathState].desc+'</div>';
    cancelAnimationFrame(raf6); draw6();
  }
  window.lungState=function(s){breathState=s;cancelAnimationFrame(raf6);render();};
  window.simCleanup=function(){cancelAnimationFrame(raf6);};
  render();
};

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
  var water = 60, sun = 70, soil = 60;
  var day = 0;
  var growthPts = 0; /* accumulated growth — increases each day based on conditions */

  function dailyGrowth() {
    if (water < 15 || soil < 8) return -4;   /* drought / no soil */
    if (water > 97) return -2;                /* overwatered — root rot */
    var h = (water + sun + soil) / 3;
    return Math.max(-2, Math.round((h - 28) / 8));
  }
  function growthWarning() {
    if (water > 97)  return '⚠️ Overwatered! Roots need air too.';
    if (water < 15)  return '🏜️ Too dry! Plant needs water.';
    if (soil < 8)    return '🪨 No nutrients in soil!';
    if (sun < 10)    return '🌑 Too dark — no photosynthesis.';
    return '';
  }

  function status() {
    var g = growthPts;
    if (day === 0)   return { label:'🌱 Ready to grow!', col:'#65a30d' };
    if (g <= 0)      return { label:'🥀 Wilting',        col:'#b45309' };
    if (g < 18)      return { label:'🌱 Sprouting',      col:'#65a30d' };
    if (g < 45)      return { label:'🌿 Growing',        col:'#16a34a' };
    if (g < 78)      return { label:'🌳 Thriving!',      col:'#15803d' };
    return               { label:'🌸 Blooming!',         col:'#db2777' };
  }

  function plantSVG() {
    var g = Math.max(0, growthPts);
    var h = (water + sun + soil) / 3;
    var isNight = sun < 28;
    var skyCol = isNight ? '#0f172a' : sun < 55 ? '#1e3a5f' : '#1a5c8a';
    var sunR = Math.round(sun / 100 * 14 + 7);
    var sunOp = (sun / 100 * 0.65 + 0.25).toFixed(2);
    var stemH = Math.min(88, Math.round(g * 0.88 + 3));
    var leafSc = Math.min(1, g / 58);
    var rootD = Math.min(38, 8 + g * 0.38);
    var stemW = Math.min(5, 2 + g * 0.03);
    var stCol = h > 60 ? '#4ade80' : h > 35 ? '#a3e635' : '#ca8a04';
    var lfCol = h > 60 ? '#22c55e' : h > 35 ? '#84cc16' : '#a16207';
    var lfDk  = h > 60 ? '#16a34a' : h > 35 ? '#4d7c0f' : '#78350f';
    var soilTop = h > 45 ? '#6b3d1a' : '#4a2c0a';
    var gY = 118;
    var stemTop = gY - stemH;
    var s = '';

    /* Sky */
    /* Two-tone sky without defs — avoids gradient ID conflicts on re-render */
    s += '<rect width="120" height="'+(gY/2)+'" fill="'+(isNight?'#020617':'#0c4a6e')+'"/>';
    s += '<rect y="'+(gY/2)+'" width="120" height="'+(gY/2)+'" fill="'+skyCol+'"/>';

    /* Stars */
    if (isNight) {
      [[20,12],[88,18],[44,32],[72,48],[14,58],[104,8],[56,6],[35,45],[95,38]].forEach(function(p) {
        s += '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="0.9" fill="white" opacity="0.8"/>';
      });
      /* Moon */
      s += '<circle cx="88" cy="22" r="9" fill="#e2e8f0" opacity="0.55"/>';
      s += '<circle cx="93" cy="19" r="7" fill="'+skyCol+'"/>';
    } else {
      /* Sun */
      s += '<circle cx="88" cy="22" r="'+sunR+'" fill="#fde68a" opacity="'+sunOp+'"/>';
      s += '<circle cx="88" cy="22" r="'+(sunR-3)+'" fill="#fcd34d" opacity="'+sunOp+'"/>';
      if (sun > 45) {
        for (var ri = 0; ri < 8; ri++) {
          var ra = ri / 8 * Math.PI * 2;
          var r1 = sunR + 4, r2 = sunR + 9;
          s += '<line x1="'+(88+Math.cos(ra)*r1)+'" y1="'+(22+Math.sin(ra)*r1)+'" x2="'+(88+Math.cos(ra)*r2)+'" y2="'+(22+Math.sin(ra)*r2)+'" stroke="#fcd34d" stroke-width="1.4" opacity="0.55"/>';
        }
      }
    }

    /* Clouds when water high */
    if (water > 62) {
      s += '<ellipse cx="28" cy="20" rx="16" ry="7" fill="rgba(255,255,255,0.13)"/>';
      s += '<ellipse cx="40" cy="15" rx="11" ry="6" fill="rgba(255,255,255,0.1)"/>';
    }

    /* Soil */
    s += '<rect y="'+gY+'" width="120" height="'+(180-gY)+'" fill="#2d0e05"/>';
    s += '<rect y="'+gY+'" width="120" height="11" fill="'+soilTop+'"/>';
    [[14,124],[38,131],[68,127],[96,129],[52,141],[82,146],[24,149]].forEach(function(p) {
      s += '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.8" fill="rgba(0,0,0,0.22)"/>';
    });
    /* Water moisture */
    if (water > 42) {
      [[28,134],[84,139],[55,151]].forEach(function(p) {
        s += '<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="4" ry="2" fill="rgba(96,165,250,0.32)"/>';
      });
    }

    /* Roots */
    if (g > 3) {
      var ra2 = Math.min(0.9, g / 22);
      s += '<line x1="60" y1="'+(gY+2)+'" x2="44" y2="'+(gY+rootD*0.7)+'" stroke="#854d0e" stroke-width="1.8" stroke-linecap="round" opacity="'+ra2+'"/>';
      s += '<line x1="60" y1="'+(gY+2)+'" x2="76" y2="'+(gY+rootD*0.72)+'" stroke="#854d0e" stroke-width="1.8" stroke-linecap="round" opacity="'+ra2+'"/>';
      s += '<line x1="60" y1="'+(gY+2)+'" x2="60" y2="'+(gY+rootD)+'" stroke="#854d0e" stroke-width="2.2" stroke-linecap="round" opacity="'+ra2+'"/>';
      if (g > 22) {
        s += '<line x1="44" y1="'+(gY+rootD*0.5)+'" x2="30" y2="'+(gY+rootD*0.88)+'" stroke="#854d0e" stroke-width="1.2" stroke-linecap="round" opacity="'+(ra2*0.65)+'"/>';
        s += '<line x1="76" y1="'+(gY+rootD*0.5)+'" x2="90" y2="'+(gY+rootD*0.82)+'" stroke="#854d0e" stroke-width="1.2" stroke-linecap="round" opacity="'+(ra2*0.65)+'"/>';
      }
    }

    /* Seed */
    if (g < 3) {
      s += '<ellipse cx="60" cy="'+(gY+4)+'" rx="7" ry="5" fill="#78350f"/>';
      s += '<ellipse cx="60" cy="'+(gY+3)+'" rx="5" ry="3" fill="#a16207" opacity="0.8"/>';
    } else {
      /* Stem — gently curved */
      var sw = g > 30 ? 2.5 : 1.5;
      s += '<path d="M60,'+(gY)+' C60,'+(gY-stemH*0.3)+' '+(60+sw)+','+(gY-stemH*0.6)+' 60,'+stemTop+'" stroke="'+stCol+'" stroke-width="'+stemW+'" fill="none" stroke-linecap="round"/>';
      /* Stem highlight */
      s += '<path d="M'+(59)+','+(gY)+' C'+(59)+','+(gY-stemH*0.3)+' '+(59.5+sw)+','+(gY-stemH*0.6)+' '+(59.5)+','+stemTop+'" stroke="rgba(255,255,255,0.18)" stroke-width="1" fill="none"/>';

      /* Leaf helper */
      function leaf(cx2, cy2, size, flip) {
        var dx = flip ? size : -size;
        return '<path d="M60,'+cy2+' Q'+(60+dx)+','+(cy2-size*0.65)+' '+(60+dx*1.45)+','+(cy2+size*0.25)+' Q'+(60+dx*0.75)+','+(cy2+size*0.38)+' 60,'+cy2+'" fill="'+lfCol+'" opacity="0.92"/>'+
               '<line x1="60" y1="'+cy2+'" x2="'+(60+dx*0.85)+'" y2="'+(cy2-size*0.08)+'" stroke="'+lfDk+'" stroke-width="0.9" opacity="0.5"/>';
      }

      /* Pair 1 — low */
      if (g > 4) {
        var l1y = gY - stemH * 0.32, l1s = Math.min(22, leafSc * 25);
        s += leaf(60, l1y, l1s, false);
        s += leaf(60, l1y, l1s, true);
      }
      /* Pair 2 — mid */
      if (g > 26) {
        var l2y = gY - stemH * 0.62, l2s = Math.min(18, leafSc * 21);
        s += leaf(60, l2y, l2s, false);
        s += leaf(60, l2y, l2s, true);
      }
      /* Pair 3 — high */
      if (g > 52) {
        var l3y = gY - stemH * 0.84, l3s = Math.min(14, leafSc * 16);
        s += leaf(60, l3y, l3s, false);
        s += leaf(60, l3y, l3s, true);
      }

      /* Flower */
      if (g > 72) {
        var fy2 = stemTop - 1;
        var pr = Math.min(11, (g - 72) * 0.38);
        for (var pi = 0; pi < 6; pi++) {
          var pa = pi / 6 * Math.PI * 2 - Math.PI / 6;
          var pcx = 60 + Math.cos(pa) * (pr + 2), pcy = fy2 + Math.sin(pa) * (pr + 2);
          s += '<ellipse cx="'+pcx+'" cy="'+pcy+'" rx="'+(pr*0.72)+'" ry="'+(pr*0.48)+'" fill="#fb923c" transform="rotate('+(pa*180/Math.PI+15)+','+pcx+','+pcy+')"/>';
        }
        s += '<circle cx="60" cy="'+fy2+'" r="'+(pr*0.7)+'" fill="#fbbf24"/>';
        s += '<circle cx="60" cy="'+fy2+'" r="'+(pr*0.38)+'" fill="#f59e0b"/>';
      }
    }

    return '<svg viewBox="0 0 120 180" width="120" height="180" style="border-radius:10px;display:block;max-width:100%">'+s+'</svg>';
  }

  function render() {
    var st = status();
    var dg = dailyGrowth();
    c.innerHTML =
      '<div style="font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center">🌻 Plant Growth Lab — Day '+day+'</div>'+
      '<div style="display:flex;gap:14px;align-items:stretch">'+
      '<div style="flex:0 0 auto;width:120px;min-height:180px">'+plantSVG()+'</div>'+
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:9px">'+
      '<div style="font-size:13px;font-weight:900;color:'+st.col+'">'+st.label+'</div>'+
      '<div style="font-size:10px;color:var(--muted)">Growth: <b style="color:var(--text)">'+Math.max(0,Math.round(growthPts))+'pts</b> · Tomorrow: <b style="color:'+(dg>=0?'var(--evs)':'var(--sci)')+'">'+( dg>=0?'+':'')+dg+'</b></div>'+
      (growthWarning()?'<div style="font-size:10px;color:#f59e0b;font-weight:700">'+growthWarning()+'</div>':'')+
      ['water','sun','soil'].map(function(n) {
        var val = n==='water'?water:n==='sun'?sun:soil;
        var emoji = n==='water'?'💧':n==='sun'?'☀️':'🌍';
        var col2 = n==='water'?'var(--life)':n==='sun'?'var(--math)':'#8B5E3C';
        return '<div>'+
          '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:2px">'+
          '<span>'+emoji+' '+n[0].toUpperCase()+n.slice(1)+'</span>'+
          '<span style="color:var(--text);font-weight:700">'+val+'%</span></div>'+
          '<input type="range" class="slide" min="0" max="100" value="'+val+'" data-pname="'+n+'" '+
          'oninput="plantSet(this.dataset.pname,this.value)" style="width:100%;--val:'+val+'%;--acc:'+col2+'">'+
          '</div>';
      }).join('')+
      '<div style="display:flex;gap:6px;margin-top:2px">'+
      '<button class="cbtn" onclick="plantGrow()" style="font-size:11px;flex:1;background:var(--evs);color:white;border-color:var(--evs)">🌤 Next Day</button>'+
      '<button class="cbtn" onclick="plantReset()" style="font-size:11px">↺</button>'+
      '</div></div></div>';
  }

  window.plantSet = function(n,v) {
    v=parseInt(v);
    if(n==='water')water=v; else if(n==='sun')sun=v; else soil=v;
    render();
  };
  window.plantGrow = function() {
    day++;
    growthPts = Math.max(-5, Math.min(100, growthPts + dailyGrowth()));
    render();
  };
  window.plantReset = function() { day=0; water=60; sun=70; soil=60; growthPts=0; render(); };
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
  /* Interactive sense organs lab — each sense gets a dedicated visual experiment */
  var activeSense = null;

  var senses = [
    {
      key:'sight', emoji:'👁️', name:'Sight', organ:'Eyes',
      colour:'#6366f1',
      headline:'Your eyes detect light — but can they be fooled?',
      experiment: function(box) {
        /* Optical illusion — two lines same length but look different */
        box.innerHTML = '';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:10px;text-align:center';
        title.textContent = 'Which horizontal line looks longer?';
        box.appendChild(title);

        var cv = document.createElement('canvas');
        cv.width = 260; cv.height = 110; cv.style.cssText = 'display:block;margin:0 auto;border-radius:8px;background:var(--surface2)';
        box.appendChild(cv);
        var ctx = cv.getContext('2d');

        /* Draw Müller-Lyer illusion */
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        /* Line A — arrows pointing out (looks longer) */
        ctx.beginPath(); ctx.moveTo(40,35); ctx.lineTo(140,35); ctx.stroke();
        ctx.strokeStyle = '#6366f1';
        [[40,35],[140,35]].forEach(function(p){
          ctx.beginPath(); ctx.moveTo(p[0],35); ctx.lineTo(p[0]-12,22); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(p[0],35); ctx.lineTo(p[0]-12,48); ctx.stroke();
        });
        ctx.beginPath(); ctx.moveTo(140,35); ctx.lineTo(152,22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(140,35); ctx.lineTo(152,48); ctx.stroke();

        /* Line B — arrows pointing in (looks shorter) */
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath(); ctx.moveTo(40,78); ctx.lineTo(140,78); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40,78); ctx.lineTo(52,65); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40,78); ctx.lineTo(52,91); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(140,78); ctx.lineTo(128,65); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(140,78); ctx.lineTo(128,91); ctx.stroke();

        /* Labels */
        ctx.fillStyle = '#6366f1'; ctx.font = 'bold 11px Nunito,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('A', 162,39);
        ctx.fillStyle = '#f59e0b'; ctx.fillText('B', 162,82);

        /* Reveal */
        var reveal = document.createElement('div');
        reveal.style.cssText = 'text-align:center;margin-top:10px';
        var btn = document.createElement('button');
        btn.className = 'cbtn'; btn.textContent = 'Reveal the truth!';
        btn.onclick = function() {
          result.style.display = 'block';
          /* Draw measurement brackets */
          ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.moveTo(40,10); ctx.lineTo(140,10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(40,10); ctx.lineTo(40,20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(140,10); ctx.lineTo(140,20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(40,97); ctx.lineTo(140,97); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(40,97); ctx.lineTo(40,87); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(140,97); ctx.lineTo(140,87); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#22c55e'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Same!', 90, 8);
          ctx.fillText('Same!', 90, 108);
        };
        reveal.appendChild(btn);
        box.appendChild(reveal);
        var result = document.createElement('div');
        result.style.cssText = 'display:none;margin-top:8px;font-size:12px;font-weight:800;color:#22c55e;text-align:center';
        result.textContent = '✅ Both lines are EXACTLY the same length! Your eyes were tricked by the arrows. This is an optical illusion — proof that vision can be fooled!';
        box.appendChild(result);
      }
    },
    {
      key:'hearing', emoji:'👂', name:'Hearing', organ:'Ears',
      colour:'#ec4899',
      headline:'Ears detect vibrations — objects vibrate to make sound.',
      experiment: function(box) {
        box.innerHTML = '';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:10px;text-align:center';
        title.textContent = 'Tap the tuning fork to hear the pitch. Fill the bowl — does water level change the sound?';
        box.appendChild(title);

        var waterLevel = 50; /* % full */
        var playing = false;
        var audioCtx = null;

        var cv = document.createElement('canvas');
        cv.width = 260; cv.height = 120; cv.style.cssText = 'display:block;margin:0 auto 8px;border-radius:8px;background:#0f1729;cursor:pointer';
        box.appendChild(cv);

        function drawScene(vibrating) {
          var ctx2 = cv.getContext('2d');
          ctx2.clearRect(0,0,260,120);

          /* Bowl */
          ctx2.strokeStyle = '#94a3b8'; ctx2.lineWidth = 3;
          ctx2.beginPath(); ctx2.moveTo(60,40); ctx2.lineTo(40,100); ctx2.lineTo(220,100); ctx2.lineTo(200,40); ctx2.stroke();
          /* Water */
          var wy = 100 - waterLevel*0.6;
          ctx2.fillStyle = 'rgba(56,189,248,0.6)';
          ctx2.fillRect(41,wy, 178, 100-wy);
          /* Water surface ripple when vibrating */
          if (vibrating) {
            ctx2.strokeStyle = 'rgba(255,255,255,0.5)'; ctx2.lineWidth = 1.5;
            for (var ri=0;ri<3;ri++) {
              ctx2.beginPath();
              ctx2.moveTo(45+ri*15, wy);
              var amp = 2+Math.random()*3;
              for (var rx=45+ri*15;rx<215-ri*15;rx+=8) {
                ctx2.lineTo(rx+4, wy + (Math.random()>0.5?amp:-amp));
              }
              ctx2.stroke();
            }
          }
          /* Tuning fork */
          ctx2.strokeStyle = vibrating?'#fbbf24':'#94a3b8'; ctx2.lineWidth = 3;
          ctx2.beginPath(); ctx2.moveTo(130,30); ctx2.lineTo(130,10); ctx2.stroke();
          ctx2.beginPath(); ctx2.moveTo(123,10); ctx2.lineTo(123,22); ctx2.stroke();
          ctx2.beginPath(); ctx2.moveTo(137,10); ctx2.lineTo(137,22); ctx2.stroke();
          /* Vibration waves */
          if (vibrating) {
            ctx2.strokeStyle = 'rgba(251,191,36,0.4)'; ctx2.lineWidth = 1;
            [12,20,28].forEach(function(r){
              ctx2.beginPath(); ctx2.arc(130,16,r,0,Math.PI*2); ctx2.stroke();
            });
          }
          /* Water level label */
          ctx2.fillStyle = '#94a3b8'; ctx2.font = '10px Nunito,sans-serif'; ctx2.textAlign = 'right';
          ctx2.fillText('Water: '+Math.round(waterLevel)+'%', 255,115);
        }

        drawScene(false);

        /* Tap to play sound */
        cv.onclick = function() {
          try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = audioCtx.createOscillator();
            var gain = audioCtx.createGain();
            /* Higher water = lower pitch (like a glass harmonica) */
            var freq = 800 - waterLevel * 4;
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.8);
          } catch(e) {}
          /* Animate vibration */
          var frames = 0;
          var anim = setInterval(function(){
            drawScene(frames < 12);
            frames++;
            if (frames > 16) clearInterval(anim);
          }, 60);
        };

        /* Water level slider */
        var sliderRow = document.createElement('div');
        sliderRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px';
        var sliderLabel = document.createElement('span');
        sliderLabel.style.cssText = 'font-size:11px;color:var(--muted);white-space:nowrap';
        sliderLabel.textContent = '💧 Water:';
        var slider = document.createElement('input');
        slider.type='range'; slider.min=5; slider.max=90; slider.value=waterLevel;
        slider.className='slide';
        slider.style.cssText='flex:1;--val:'+((waterLevel-5)/85*100).toFixed(1)+'%';
        slider.oninput = function() {
          waterLevel = parseInt(this.value);
          this.style.setProperty('--val', ((waterLevel-5)/85*100).toFixed(1)+'%');
          drawScene(false);
        };
        sliderRow.appendChild(sliderLabel); sliderRow.appendChild(slider);
        box.appendChild(sliderRow);

        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:11px;color:var(--muted);text-align:center;margin-top:6px';
        hint.textContent = '👆 Tap the bowl to hear it! Change water level and tap again.';
        box.appendChild(hint);
      }
    },
    {
      key:'smell', emoji:'👃', name:'Smell', organ:'Nose',
      colour:'#10b981',
      headline:'Smell is the oldest sense — it goes directly to the brain\'s memory centre.',
      experiment: function(box) {
        box.innerHTML = '';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:8px;text-align:center';
        title.textContent = 'Sniff each item — describe what you smell. How many can you identify?';
        box.appendChild(title);

        var items = [
          {emoji:'🍋',name:'Lemon',clues:['Sharp and citrusy','Makes your mouth water','Sour and fresh'],fact:'Lemon smell = limonene molecules reaching your 400 smell receptors'},
          {emoji:'🌹',name:'Rose',clues:['Sweet and floral','Light and gentle','Used in perfumes'],fact:'Roses produce geraniol — flowers smell to attract bees for pollination'},
          {emoji:'🧅',name:'Onion',clues:['Sharp and stinging','Makes eyes water','Strong and pungent'],fact:'Onions release allicin when cut — it\'s a defence chemical against insects'},
          {emoji:'🍫',name:'Chocolate',clues:['Rich and sweet','Warm and comforting','Makes you feel happy'],fact:'Chocolate smell triggers dopamine — that\'s why it feels so good!'},
        ];
        var current = 0;
        var revealed = false;
        var guessInput, resultDiv, hintDiv;

        function showItem() {
          revealed = false;
          itemDiv.innerHTML = '';
          var it = items[current];
          var emojiEl = document.createElement('div');
          emojiEl.style.cssText = 'font-size:48px;text-align:center;margin-bottom:8px;filter:blur(8px);transition:filter .4s';
          emojiEl.textContent = it.emoji;
          emojiEl.id = 'smellEmoji';
          itemDiv.appendChild(emojiEl);

          var clueDiv = document.createElement('div');
          clueDiv.style.cssText = 'background:var(--surface2);border-radius:10px;padding:10px;text-align:center;margin-bottom:8px';
          clueDiv.innerHTML = it.clues.map(function(cl){
            return '<div style="font-size:12px;color:var(--text);padding:2px 0">🌀 '+cl+'</div>';
          }).join('');
          itemDiv.appendChild(clueDiv);

          var row = document.createElement('div');
          row.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap';
          items.forEach(function(opt) {
            var btn = document.createElement('button');
            btn.className = 'cbtn'; btn.textContent = opt.emoji+' '+opt.name;
            btn.onclick = function() {
              if (revealed) return;
              revealed = true;
              document.getElementById('smellEmoji').style.filter = 'none';
              var correct = opt.name === it.name;
              resultDiv.textContent = correct ? '✅ Correct! '+it.fact : '❌ It was '+it.emoji+' '+it.name+'! '+it.fact;
              resultDiv.style.color = correct ? '#22c55e' : '#f59e0b';
              resultDiv.style.display = 'block';
              nextBtn.style.display = 'inline-block';
            };
            row.appendChild(btn);
          });
          itemDiv.appendChild(row);
        }

        var itemDiv = document.createElement('div');
        box.appendChild(itemDiv);

        resultDiv = document.createElement('div');
        resultDiv.style.cssText = 'display:none;font-size:11px;font-weight:700;text-align:center;margin-top:8px;padding:8px;background:var(--surface2);border-radius:8px;line-height:1.5';
        box.appendChild(resultDiv);

        var navRow = document.createElement('div');
        navRow.style.cssText = 'text-align:center;margin-top:6px';
        var nextBtn = document.createElement('button');
        nextBtn.className = 'cbtn evs'; nextBtn.textContent = 'Next smell →'; nextBtn.style.display = 'none';
        nextBtn.onclick = function() {
          current = (current+1) % items.length;
          resultDiv.style.display = 'none';
          nextBtn.style.display = 'none';
          showItem();
        };
        navRow.appendChild(nextBtn);
        box.appendChild(navRow);

        showItem();
      }
    },
    {
      key:'touch', emoji:'🤚', name:'Touch', organ:'Skin',
      colour:'#f59e0b',
      headline:'Skin detects 5 things: touch, pressure, pain, heat and cold.',
      experiment: function(box) {
        box.innerHTML = '';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:8px;text-align:center';
        title.textContent = 'Move your finger across the surface — feel the texture change!';
        box.appendChild(title);

        var cv2 = document.createElement('canvas');
        cv2.width = 260; cv2.height = 120;
        cv2.style.cssText = 'display:block;margin:0 auto 8px;width:100%;max-width:260px;border-radius:10px;cursor:crosshair;touch-action:none';
        box.appendChild(cv2);
        var ctx3 = cv2.getContext('2d');

        var textures = [
          {name:'Smooth glass',draw:function(ctx,x,y,w,h){
            var g=ctx.createLinearGradient(x,y,x,y+h);
            g.addColorStop(0,'#cbd5e1'); g.addColorStop(1,'#94a3b8');
            ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
            ctx.fillStyle='rgba(255,255,255,0.3)';
            ctx.fillRect(x+5,y+5,w*0.3,4);
          }},
          {name:'Rough sandpaper',draw:function(ctx,x,y,w,h){
            ctx.fillStyle='#d97706'; ctx.fillRect(x,y,w,h);
            for(var i=0;i<200;i++){
              ctx.fillStyle='rgba(0,0,0,'+(0.1+Math.random()*0.3)+')';
              ctx.fillRect(x+Math.random()*w, y+Math.random()*h, 2+Math.random()*3, 2+Math.random()*3);
            }
          }},
          {name:'Bumpy bubble wrap',draw:function(ctx,x,y,w,h){
            ctx.fillStyle='#bfdbfe'; ctx.fillRect(x,y,w,h);
            for(var bx=x+10;bx<x+w-10;bx+=18){
              for(var by=y+8;by<y+h-8;by+=18){
                ctx.fillStyle='rgba(219,234,254,0.8)';
                ctx.beginPath(); ctx.arc(bx,by,7,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(147,197,253,0.6)'; ctx.lineWidth=1;
                ctx.beginPath(); ctx.arc(bx,by,7,0,Math.PI*2); ctx.stroke();
                ctx.fillStyle='rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.arc(bx-2,by-2,2.5,0,Math.PI*2); ctx.fill();
              }
            }
          }},
          {name:'Soft velvet',draw:function(ctx,x,y,w,h){
            ctx.fillStyle='#7c3aed'; ctx.fillRect(x,y,w,h);
            ctx.fillStyle='rgba(139,92,246,0.4)';
            for(var fi=0;fi<60;fi++){
              var fx2=x+Math.random()*w, fy2=y+Math.random()*h;
              ctx.fillRect(fx2,fy2,1,3+Math.random()*4);
            }
            ctx.fillStyle='rgba(255,255,255,0.15)';
            ctx.fillRect(x+10,y+10,w*0.25,h*0.3);
          }},
        ];

        var zones = textures.length;
        var zoneW = 260 / zones;
        var currentZone = -1;
        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'text-align:center;font-size:12px;font-weight:800;color:var(--muted);min-height:20px';
        infoDiv.textContent = 'Slide your finger across →';
        box.appendChild(infoDiv);

        /* Draw all textures */
        textures.forEach(function(t,i){ t.draw(ctx3, i*zoneW, 0, zoneW, 120); });
        /* Zone labels */
        textures.forEach(function(t,i){
          ctx3.fillStyle='rgba(0,0,0,0.5)'; ctx3.font='bold 9px Nunito,sans-serif'; ctx3.textAlign='center';
          ctx3.fillText(t.name, i*zoneW+zoneW/2, 113);
        });
        /* Dividers */
        ctx3.strokeStyle='rgba(255,255,255,0.4)'; ctx3.lineWidth=1;
        for(var d=1;d<zones;d++){
          ctx3.beginPath(); ctx3.moveTo(d*zoneW,0); ctx3.lineTo(d*zoneW,120); ctx3.stroke();
        }

        function handleMove(ex) {
          var rect = cv2.getBoundingClientRect();
          var relX = (ex - rect.left) * (260 / rect.width);
          var z = Math.min(zones-1, Math.floor(relX / zoneW));
          if (z !== currentZone) {
            currentZone = z;
            infoDiv.textContent = '🤚 Touching: ' + textures[z].name;
            infoDiv.style.color = 'var(--text)';
            /* Highlight current zone */
            textures.forEach(function(t,i){ t.draw(ctx3, i*zoneW, 0, zoneW, 120); });
            ctx3.fillStyle='rgba(255,255,255,0.2)';
            ctx3.fillRect(z*zoneW,0,zoneW,120);
            textures.forEach(function(t,i){
              ctx3.fillStyle='rgba(0,0,0,0.5)'; ctx3.font='bold 9px Nunito,sans-serif'; ctx3.textAlign='center';
              ctx3.fillText(t.name, i*zoneW+zoneW/2, 113);
            });
            for(var d=1;d<zones;d++){
              ctx3.strokeStyle='rgba(255,255,255,0.4)'; ctx3.lineWidth=1;
              ctx3.beginPath(); ctx3.moveTo(d*zoneW,0); ctx3.lineTo(d*zoneW,120); ctx3.stroke();
            }
          }
        }
        cv2.addEventListener('mousemove', function(e){ handleMove(e.clientX); });
        cv2.addEventListener('touchmove', function(e){ e.preventDefault(); handleMove(e.touches[0].clientX); }, {passive:false});
      }
    },
    {
      key:'taste', emoji:'👅', name:'Taste', organ:'Tongue',
      colour:'#ef4444',
      headline:'Your tongue has ~10,000 taste buds that detect 5 basic tastes.',
      experiment: function(box) {
        box.innerHTML = '';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:8px;text-align:center';
        title.textContent = 'Drag each food to the part of the tongue that tastes it!';
        box.appendChild(title);

        /* Tongue map — simplified */
        var cv3 = document.createElement('canvas');
        cv3.width = 260; cv3.height = 140;
        cv3.style.cssText = 'display:block;margin:0 auto;width:100%;max-width:260px;border-radius:8px;background:#1a0510;cursor:pointer';
        box.appendChild(cv3);
        var ctx4 = cv3.getContext('2d');

        var zones2 = [
          {name:'Sweet',x:130,y:120,r:28,col:'#f472b6',foods:['Sugar','Honey','Candy']},
          {name:'Sour',x:55,y:85,r:22,col:'#facc15',foods:['Lemon','Vinegar','Tamarind']},
          {name:'Sour',x:205,y:85,r:22,col:'#facc15',foods:[]},
          {name:'Salty',x:45,y:50,r:20,col:'#60a5fa',foods:['Salt','Soy sauce']},
          {name:'Salty',x:215,y:50,r:20,col:'#60a5fa',foods:[]},
          {name:'Bitter',x:130,y:18,r:26,col:'#818cf8',foods:['Coffee','Bitter gourd','Dark chocolate']},
          {name:'Umami',x:130,y:70,r:18,col:'#34d399',foods:['Cheese','Mushroom','Tomato']},
        ];

        function drawTongue() {
          ctx4.clearRect(0,0,260,140);
          /* Tongue shape */
          ctx4.fillStyle = '#c2185b';
          ctx4.beginPath();
          ctx4.ellipse(130, 80, 90, 65, 0, 0, Math.PI*2);
          ctx4.fill();
          /* Taste zones */
          zones2.forEach(function(z) {
            ctx4.fillStyle = z.col + '66';
            ctx4.beginPath(); ctx4.arc(z.x, z.y, z.r, 0, Math.PI*2); ctx4.fill();
            ctx4.strokeStyle = z.col; ctx4.lineWidth = 1.5;
            ctx4.beginPath(); ctx4.arc(z.x, z.y, z.r, 0, Math.PI*2); ctx4.stroke();
            ctx4.fillStyle = 'white'; ctx4.font = 'bold 8px Nunito,sans-serif'; ctx4.textAlign = 'center';
            ctx4.fillText(z.name, z.x, z.y + 3);
          });
        }
        drawTongue();

        var foods = [
          {emoji:'🍋',name:'Lemon',taste:'Sour'},
          {emoji:'🍬',name:'Candy',taste:'Sweet'},
          {emoji:'☕',name:'Coffee',taste:'Bitter'},
          {emoji:'🧂',name:'Salt',taste:'Salty'},
          {emoji:'🍄',name:'Mushroom',taste:'Umami'},
        ];
        var score = 0;
        var answered = 0;
        var current2 = 0;

        var foodDiv = document.createElement('div');
        foodDiv.style.cssText = 'display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:8px';

        var resultDiv2 = document.createElement('div');
        resultDiv2.style.cssText = 'text-align:center;font-size:11px;font-weight:700;margin-top:6px;min-height:18px;color:var(--muted)';
        resultDiv2.textContent = 'Click the taste zone on the tongue for each food below!';
        box.appendChild(resultDiv2);
        box.appendChild(foodDiv);

        function showFood() {
          foodDiv.innerHTML = '';
          if (current2 >= foods.length) {
            resultDiv2.textContent = '🎉 Score: '+score+'/'+foods.length+'! Taste buds map different flavours to different tongue regions.';
            resultDiv2.style.color = '#22c55e';
            return;
          }
          var f = foods[current2];
          var badge = document.createElement('div');
          badge.style.cssText = 'font-size:28px;text-align:center;width:100%;padding:4px 0';
          badge.textContent = f.emoji + ' ' + f.name;
          foodDiv.appendChild(badge);
          var prompt2 = document.createElement('div');
          prompt2.style.cssText = 'font-size:11px;color:var(--muted);text-align:center;width:100%';
          prompt2.textContent = 'Where does '+f.name+' taste strongest? Tap the tongue!';
          foodDiv.appendChild(prompt2);
        }

        cv3.addEventListener('click', function(e) {
          if (current2 >= foods.length) return;
          var rect2 = cv3.getBoundingClientRect();
          var cx4 = (e.clientX-rect2.left)*(260/rect2.width);
          var cy4 = (e.clientY-rect2.top)*(140/rect2.height);
          var f = foods[current2];
          var nearest = null, nearestD = 999;
          zones2.forEach(function(z) {
            var d = Math.sqrt((cx4-z.x)**2+(cy4-z.y)**2);
            if (d < z.r + 15 && d < nearestD) { nearest=z; nearestD=d; }
          });
          if (!nearest) return;
          var correct = nearest.name === f.taste;
          if (correct) score++;
          answered++;
          resultDiv2.textContent = correct
            ? '✅ Right! '+f.emoji+' is '+f.taste+'.'
            : '❌ '+f.emoji+' '+f.name+' is '+f.taste+' — detected at the '+(zones2.find(function(z){return z.name===f.taste;})||{name:f.taste}).name+' zone.';
          resultDiv2.style.color = correct?'#22c55e':'#f59e0b';
          current2++;
          setTimeout(showFood, 900);
        });

        showFood();
      }
    }
  ];

  function render() {
    c.innerHTML = '';

    /* Organ selector */
    var title = document.createElement('div');
    title.style.cssText = 'font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;text-align:center';
    title.textContent = '🧠 Sense Organs Lab';
    c.appendChild(title);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px';
    senses.forEach(function(s) {
      var btn = document.createElement('button');
      var isActive = activeSense === s.key;
      btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:10px;border:2px solid '+(isActive?s.colour:'transparent')+';background:'+(isActive?s.colour+'22':'var(--surface2)')+';cursor:pointer;font-family:Nunito,sans-serif;transition:all .15s';
      btn.innerHTML = '<span style="font-size:22px">'+s.emoji+'</span><span style="font-size:10px;font-weight:800;color:'+(isActive?s.colour:'var(--muted)')+'">'+s.name+'</span>';
      btn.addEventListener('click', function() {
        activeSense = s.key;
        render();
      });
      grid.appendChild(btn);
    });
    c.appendChild(grid);

    /* Experiment area */
    if (activeSense) {
      var sense = senses.find(function(s){ return s.key===activeSense; });
      var panel = document.createElement('div');
      panel.style.cssText = 'background:var(--surface2);border-radius:12px;padding:12px;border:1px solid var(--border)';

      var head = document.createElement('div');
      head.style.cssText = 'font-size:12px;color:'+sense.colour+';font-weight:800;margin-bottom:10px;text-align:center';
      head.textContent = sense.headline;
      panel.appendChild(head);

      var expBox = document.createElement('div');
      panel.appendChild(expBox);
      c.appendChild(panel);

      sense.experiment(expBox);
    } else {
      var prompt = document.createElement('div');
      prompt.style.cssText = 'text-align:center;color:var(--muted);font-size:13px;padding:20px';
      prompt.textContent = '👆 Tap a sense organ above to start the experiment!';
      c.appendChild(prompt);
    }
  }

  render();
};

