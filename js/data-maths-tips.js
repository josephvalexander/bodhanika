/* data-maths-tips.js — Maths Tips & Tricks
   Each tip: id, title, classes, icon, shortTrick, whyItWorks, simId, buddy
   subject is always 'Maths', type is always 'tip'
*/
window.MATHS_TIPS = [

  /* ── CLASSES 1–3 ── */
  {id:'tip-9x',     title:'Multiply by 9 — Finger Trick',
   classes:['3','4','5'], icon:'🖐️',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'Hold up 10 fingers. Fold down finger #N. Left fingers = tens digit, right fingers = units digit. Done!',
   whyItWorks:'9×N = 10N − N. Folding finger N leaves (N−1) fingers on the left and (10−N) on the right. Together they spell the answer.',
   example:'9 × 7: fold finger 7 → 6 fingers left, 3 right = 63 ✓',
   challenge:['9 × 4','9 × 8','9 × 6','9 × 3'],
   simId:'tip-9x',
   buddy:'The finger trick works because our hands have exactly 10 fingers — and our number system is base 10. Pure coincidence? Not quite — base 10 likely came from counting on fingers!'},

  {id:'tip-add9',   title:'Add 9 in Your Head',
   classes:['2','3','4'], icon:'➕',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To add 9: add 10, then subtract 1. Faster than counting on!',
   whyItWorks:'9 = 10 − 1. Adding 10 is trivial (just increase tens digit). Subtracting 1 is trivial. Two easy steps beat one hard step.',
   example:'47 + 9 = 47 + 10 − 1 = 57 − 1 = 56 ✓',
   challenge:['34 + 9','58 + 9','72 + 9','99 + 9'],
   simId:'tip-add9',
   buddy:'This is called "compensation" — mathematicians adjust numbers to make calculations easier, then compensate at the end. All mental maths uses this idea.'},

  {id:'tip-11x',    title:'Multiply by 11 — Split and Add',
   classes:['4','5','6'], icon:'✌️',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'For 11 × any 2-digit number AB: write A, write (A+B) in the middle, write B. That\'s your answer!',
   whyItWorks:'11 × AB = 10×AB + AB. The middle digit is always the sum of tens and units. If A+B ≥ 10, carry the 1 to A.',
   example:'11 × 36: write 3, (3+6)=9, 6 → 396 ✓  |  11 × 47: 4, (4+7)=11, carry: 517 ✓',
   challenge:['11 × 23','11 × 54','11 × 72','11 × 85'],
   simId:'tip-11x',
   buddy:'11 × 11 = 121, 11 × 111 = 1221, 11 × 1111 = 12321 — see the pattern? It\'s Pascal\'s triangle hidden inside multiplication!'},

  {id:'tip-div3',   title:'Divisibility by 3 — Add the Digits',
   classes:['4','5','6'], icon:'÷',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'Add all the digits of a number. If the sum is divisible by 3, so is the number. Works for 9 too!',
   whyItWorks:'Every power of 10 leaves remainder 1 when divided by 3 (10=9+1, 100=99+1…). So a number\'s remainder mod 3 equals the sum of its digits mod 3.',
   example:'Is 4,317 divisible by 3? → 4+3+1+7 = 15 → 1+5 = 6 → yes! ✓',
   challenge:['Is 2,541 divisible by 3?','Is 7,823 divisible by 3?','Is 99,999 divisible by 9?','Is 1,234,567 divisible by 3?'],
   simId:'tip-div3',
   buddy:'This trick was known to ancient Indian mathematicians. Aryabhata\'s number system, written in 499 CE, used place value and these remainders to simplify calculations without a calculator.'},

  {id:'tip-pct10',  title:'Percentages — The 10% Anchor',
   classes:['5','6','7'], icon:'%',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'10% = move decimal one place left. Build any % from there: 20% = 2×10%. 15% = 10% + 5% (half of 10%). 25% = 10%+10%+5%.',
   whyItWorks:'Percentages are fractions of 100. Dividing by 10 is trivial. Any percentage is a combination of 10%, 5%, and 1% — all computable from 10%.',
   example:'17% of 350 = 10%(35) + 5%(17.5) + 2%(7) = 35+17.5+7 = 59.5 ✓',
   challenge:['15% of 200','35% of 80','12% of 500','22% of 150'],
   simId:'tip-pct10',
   buddy:'GST calculations use exactly this! 18% GST = 10% + 8% = 10% + 5% + 3%. Every time you check a restaurant bill, you\'re doing mental percentage arithmetic.'},

];

/* Build lookup map */
window.TIPS_MAP = {};
window.MATHS_TIPS.forEach(function(t) { window.TIPS_MAP[t.id] = t; });
