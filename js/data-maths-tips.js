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

  /* ── CLASSES 2–4 ── */
  ,{id:'tip-double',  title:'Double and Half',
   classes:['2','3','4'], icon:'✌️',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'Multiply by 4 = double twice. Multiply by 8 = double three times. Divide by 4 = halve twice. Numbers that are easy to double/halve make multiplication trivial.',
   whyItWorks:'4 = 2×2, 8 = 2×2×2, 16 = 2×2×2×2. Doubling is the single easiest operation in arithmetic. Chaining doublings replaces hard multiplication with easy steps.',
   example:'24 × 4 = double 24 → 48 → double again → 96 ✓  |  36 × 8 = 72 → 144 → 288 ✓',
   challenge:['14 × 4','18 × 8','32 × 4','13 × 8'],
   simId:'tip-double',
   buddy:'Computers multiply all numbers using just doubling and addition — it\'s called binary multiplication. Your brain and your laptop use the same trick!'},

  /* ── CLASSES 3–5 ── */
  ,{id:'tip-sq5',   title:'Square Numbers Ending in 5',
   classes:['4','5','6'], icon:'5️⃣',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To square any number ending in 5: take the tens digit N, multiply N×(N+1), then stick 25 at the end.',
   whyItWorks:'(10N+5)² = 100N²+100N+25 = 100N(N+1)+25. The last two digits are always 25. The leading digits are always N×(N+1).',
   example:'35² → tens digit = 3 → 3×4 = 12 → answer: 1225 ✓  |  75² → 7×8 = 56 → 5625 ✓',
   challenge:['25 * 25','45 * 45','65 * 65','85 * 85'],
   simId:'tip-sq5',
   buddy:'This pattern was used by Vedic mathematicians thousands of years ago. The Vedic Maths system, compiled from ancient texts, contains over 16 such sutras (rules) for fast calculation.'},

  /* ── CLASSES 4–6 ── */
  ,{id:'tip-div5',  title:'Divide by 5 — Multiply by 2',
   classes:['4','5','6'], icon:'🔢',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To divide any number by 5: multiply by 2, then divide by 10 (just move decimal left once). Much faster than long division!',
   whyItWorks:'Dividing by 5 = dividing by (10÷2) = multiplying by (2÷10). So: N÷5 = (N×2)÷10. Multiplying by 10 and moving a decimal is trivial.',
   example:'340 ÷ 5 → 340 × 2 = 680 → ÷10 = 68 ✓  |  73 ÷ 5 → 146 ÷ 10 = 14.6 ✓',
   challenge:['260 / 5','95 / 5','480 / 5','37 / 5'],
   simId:'tip-div5',
   buddy:'This trick works because 5 = 10÷2, and our number system is base 10. Dividing by 5 rupees? Just double the amount and read it as paise — same principle!'},

  /* ── CLASSES 5–7 ── */
  ,{id:'tip-near100', title:'Multiply Numbers Near 100',
   classes:['6','7','8'], icon:'💯',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'For numbers near 100: find how far each is from 100 (call them a and b). Answer = (100 − a − b) × 100 + a×b. Easier: cross-subtract and multiply the gaps.',
   whyItWorks:'(100−a)(100−b) = 10000 − 100a − 100b + ab = 100(100−a−b) + ab. The algebra shows exactly why the shortcut works.',
   example:'97 × 96: gaps are 3 and 4. Cross: 97−4 = 93. Multiply gaps: 3×4 = 12. Answer: 9312 ✓',
   challenge:['98 * 97','96 * 94','99 * 95','93 * 91'],
   simId:'tip-near100',
   buddy:'This is from Vedic Maths — the "Nikhilam" sutra meaning "all from 9, last from 10". ISRO engineers used mental arithmetic shortcuts like this before calculators became widespread.'},

  /* ── CLASSES 6–8 ── */
  ,{id:'tip-diffsq',  title:'Difference of Squares Shortcut',
   classes:['7','8','9'], icon:'²',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'a² − b² = (a+b)(a−b). Use it to multiply numbers that are equidistant from a round number: 19×21 = (20−1)(20+1) = 20²−1 = 399.',
   whyItWorks:'The identity (a+b)(a−b) = a²−b² is always true. When two numbers are symmetric around a round number, that round number is a and the gap is b — making both factors trivial.',
   example:'47 × 53: symmetric around 50. → 50² − 3² = 2500 − 9 = 2491 ✓  |  18 × 22 = 20²−2² = 396 ✓',
   challenge:['49 * 51','38 * 42','97 * 103','24 * 26'],
   simId:'tip-diffsq',
   buddy:'This identity appears everywhere in physics — the difference between kinetic energies, expanding brackets in circuit theory, and even cryptographic algorithms use (a+b)(a−b).'},

  /* ── CLASSES 7–9 ── */
  ,{id:'tip-sum-n',   title:'Sum of First N Numbers',
   classes:['6','7','8'], icon:'∑',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'1+2+3+…+N = N×(N+1)÷2. To add any consecutive numbers: (first + last) × count ÷ 2.',
   whyItWorks:'Pair up numbers from both ends: 1+N, 2+(N−1), 3+(N−2)… each pair sums to N+1. There are N/2 such pairs. Total = N(N+1)/2. Gauss discovered this at age 7!',
   example:'1+2+…+100 = 100×101÷2 = 5050 ✓  |  5+6+7+8+9+10 = (5+10)×6÷2 = 45 ✓',
   challenge:['1+2+3+...+50','1+2+3+...+20','10+11+12+13+14+15','1+2+3+...+99'],
   simId:'tip-sum-n',
   buddy:'The young Carl Friedrich Gauss solved 1+2+…+100 in seconds when his teacher set it to keep the class busy. He became one of history\'s greatest mathematicians. Every formula has a story.'},

  /* ── CLASSES 7–9 ── */
  ,{id:'tip-cast9',   title:'Check Multiplication with Casting Out 9s',
   classes:['7','8','9'], icon:'✅',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To verify a multiplication: find digit-sum of each factor (keep reducing until 1 digit). Multiply those digit-sums. Their digit-sum should equal the digit-sum of your answer.',
   whyItWorks:'Every number ≡ its digit sum (mod 9). So if A×B = C, then (digit-sum A) × (digit-sum B) ≡ digit-sum C (mod 9). A mismatch means an error. A match means probably correct.',
   example:'142 × 35 = 4970? → 1+4+2=7, 3+5=8, 7×8=56 → 5+6=11 → 1+2=3. Check 4970: 4+9+7+0=20 → 2+0=2. 2≠3 so WRONG! Correct answer 4970 should be 4,970. ✓',
   challenge:['Does 123 * 45 = 5535?','Does 67 * 89 = 5963?','Does 234 * 56 = 13104?','Does 78 * 99 = 7722?'],
   simId:'tip-cast9',
   buddy:'Medieval Arab traders used this method to check calculations on long sea voyages. A single arithmetic error could ruin a trade deal — casting out nines was their calculator\'s spell-check.'},

  /* ── CLASSES 8–10 ── */
  ,{id:'tip-sq-near',  title:'Square Numbers Near Round Numbers',
   classes:['8','9','10'], icon:'🎯',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To square a number near a round base: (base + gap)² = base² + 2×base×gap + gap². Usually gap² is tiny and ignorable for estimates.',
   whyItWorks:'Pure algebra: (a+b)² = a²+2ab+b². When b is small relative to a, b² is negligible. For exact answers keep all three terms. For estimates, use just a²+2ab.',
   example:'103² = 100² + 2×100×3 + 3² = 10000+600+9 = 10609 ✓  |  98² = 100²−2×100×2+4 = 9604 ✓',
   challenge:['102 * 102','97 * 97','105 * 105','995 * 995'],
   simId:'tip-sq-near',
   buddy:'Engineers use this constantly — calculating stress on a beam when dimensions change slightly, or estimating signal strength. The full (a+b)² formula is behind almost every physics approximation.'},

  /* ── CLASSES 8–10 ── */
  ,{id:'tip-hcf-lcm', title:'HCF × LCM = Product of Two Numbers',
   classes:['6','7','8'], icon:'🔗',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'For any two numbers A and B: HCF(A,B) × LCM(A,B) = A × B. Know one, find the other instantly.',
   whyItWorks:'Every number is a product of prime powers. HCF takes the minimum of each prime power; LCM takes the maximum. Their product equals the sum of all prime powers — which is A×B.',
   example:'A=12, B=18. HCF=6. So LCM = (12×18)÷6 = 216÷6 = 36 ✓. Check: 6×36=216=12×18 ✓',
   challenge:['HCF of 8 and 12 is 4. Find LCM','HCF of 15 and 25 is 5. Find LCM','LCM of 6 and 9 is 18. Find HCF','A=20, B=28, HCF=4. Find LCM'],
   simId:'tip-hcf-lcm',
   buddy:'This relationship is used in scheduling problems — if bus A runs every 12 minutes and bus B every 18, they next meet together at LCM(12,18) = 36 minutes. City transport planners use this daily.'},

  /* ── CLASSES 9–10 ── */
  ,{id:'tip-angle-sum', title:'Exterior Angle = Sum of Two Opposite Interior Angles',
   classes:['8','9','10'], icon:'📐',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'In any triangle, the exterior angle at one vertex equals the sum of the two non-adjacent interior angles. No need to find the third interior angle first!',
   whyItWorks:'Exterior angle + interior angle = 180° (straight line). Three interior angles sum to 180°. Therefore exterior angle = 180° − interior angle = sum of the other two.',
   example:'Triangle with angles 55° and 70°. Exterior angle at third vertex = 55+70 = 125° ✓. Check: third interior = 180−55−70=55°, exterior=180−55=125° ✓',
   challenge:['Angles 40 and 65. Find exterior at third vertex','Exterior angle = 110, one interior = 45. Find the other interior','Angles 30 and 80. Find all three exteriors','Exterior = 135, one opposite interior = 60. Find other'],
   simId:'tip-angle-sum',
   buddy:'This theorem is used by architects and surveyors every day. When you can\'t measure an angle directly — say it\'s inside a wall — you measure the exterior and subtract from 180°.'},

  /* ── CLASS 1-2 ── */
  ,{id:'tip-add-order', title:'Add in Any Order — Commutative Law',
   classes:['1','2','3'], icon:'🔄',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'When adding, always start with the biggest number. 3+8 is easier to solve as 8+3. For a long list, spot pairs that make 10 first!',
   whyItWorks:'Addition is commutative: A+B = B+A always. Starting with the largest number means fewer counting steps. Spotting 10-pairs (3+7, 6+4) makes long additions lightning fast.',
   example:'5+7+3+5+2 → spot 7+3=10, 5+5=10 → 10+10+2 = 22 ✓ (instead of adding left to right)',
   challenge:['6+4+8+2+5','3+9+7+1+5','8+2+6+4+3','5+5+7+3+9'],
   simId:'tip-add-order',
   buddy:'This is why shopkeepers add up bills by grouping: ₹35+₹65=₹100, ₹48+₹52=₹100. Finding round-number pairs first is the fastest mental addition technique at any age.'},

  /* ── CLASS 2-3 ── */
  ,{id:'tip-subtract9', title:'Subtract 9 — Remove 10, Add 1',
   classes:['2','3','4'], icon:'➖',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To subtract 9: subtract 10, then add 1 back. Same compensation trick as adding 9, but reversed!',
   whyItWorks:'9 = 10 − 1. So N − 9 = N − 10 + 1. Subtracting 10 is trivial (decrease tens digit). Adding 1 is trivial. Two easy steps replace one hard one.',
   example:'63 − 9 → 63 − 10 = 53 → 53 + 1 = 54 ✓  |  81 − 9 = 81−10+1 = 72 ✓',
   challenge:['45 - 9','73 - 9','102 - 9','56 - 9'],
   simId:'tip-subtract9',
   buddy:'The same compensation idea extends: to subtract 99, subtract 100 and add 1. To subtract 999, subtract 1000 and add 1. One pattern, infinite reach.'},

  /* ── CLASS 3-5 ── */
  ,{id:'tip-times5',  title:'Multiply by 5 — Halve and ×10',
   classes:['3','4','5'], icon:'✋',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To multiply any number by 5: halve it, then multiply by 10 (add a zero or move decimal). 5 = 10÷2, so multiply by 10 and divide by 2.',
   whyItWorks:'N × 5 = N × (10÷2) = (N×10)÷2. Multiplying by 10 is trivial. Halving is easy. Combined, they replace a potentially difficult ×5 table.',
   example:'68 × 5 → 68÷2 = 34 → 34×10 = 340 ✓  |  37 × 5 → 37÷2 = 18.5 → ×10 = 185 ✓',
   challenge:['46 * 5','84 * 5','37 * 5','126 * 5'],
   simId:'tip-times5',
   buddy:'Market vendors multiply by 5 this way constantly — ₹5 per item, 48 items: halve 48 to get 24, add zero to get ₹240. No written calculation needed.'},

  /* ── CLASS 4-6 ── */
  ,{id:'tip-div-even', title:'Divisibility Rules — 2, 4, 8',
   classes:['4','5','6'], icon:'2️⃣',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'Divisible by 2: last digit even. By 4: last 2 digits divisible by 4. By 8: last 3 digits divisible by 8. Only the tail matters!',
   whyItWorks:'1000 is divisible by 8. 100 is divisible by 4. 10 is divisible by 2. So for divisibility by 2/4/8, only the last 1/2/3 digits need checking — the rest cancel out.',
   example:'Is 3,724 ÷ 4? → last 2 digits = 24 → 24÷4=6 → yes ✓  |  Is 5,368 ÷ 8? → 368÷8=46 → yes ✓',
   challenge:['Is 4,316 divisible by 4?','Is 7,248 divisible by 8?','Is 1,936 divisible by 4?','Is 5,120 divisible by 8?'],
   simId:'tip-div-even',
   buddy:'Computer memory is always a power of 2 — 4GB, 8GB, 16GB. Engineers check divisibility by powers of 2 constantly when allocating memory. The same trick applies!'},

  /* ── CLASS 5-7 ── */
  ,{id:'tip-fraction-easy', title:'Fraction Shortcut — Cross Multiply to Compare',
   classes:['5','6','7'], icon:'½',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'To compare two fractions A/B and C/D: cross multiply. If A×D > B×C then A/B is bigger. No need to find a common denominator!',
   whyItWorks:'A/B > C/D iff A×D > B×C (multiplying both sides by B×D, which is positive). Cross multiplication is equivalent to finding the LCD but skips the work.',
   example:'Which is bigger: 3/7 or 4/9? → 3×9=27 vs 4×7=28 → 28>27 → 4/9 is bigger ✓',
   challenge:['Compare 5/8 and 3/5','Compare 7/11 and 4/6','Compare 2/3 and 5/8','Compare 9/13 and 7/10'],
   simId:'tip-fraction-easy',
   buddy:'Doctors compare drug concentrations using fraction comparison — 3mg per 7ml vs 4mg per 9ml. Cross multiplication tells them instantly which is stronger without a calculator.'},

  /* ── CLASS 6-8 ── */
  ,{id:'tip-mental-sq', title:'Squares of Numbers 11–19 Instantly',
   classes:['5','6','7'], icon:'🔢',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'For 11 to 19: square = (number + units digit) × 10 + (units digit)². So 13² → (13+3)×10 + 3² = 160+9 = 169 ✓',
   whyItWorks:'(10+a)² = 100 + 20a + a² = (10+2a)×10 + a² = (10+a+a)×10 + a². Here a is the units digit. The formula decomposes naturally.',
   example:'14² → (14+4)×10 + 4² = 180+16 = 196 ✓  |  17² → (17+7)×10 + 7² = 240+49 = 289 ✓',
   challenge:['12 * 12','15 * 15','18 * 18','16 * 16'],
   simId:'tip-mental-sq',
   buddy:'Memorising all squares from 11–19 takes weeks. Understanding this pattern takes minutes — and you can compute any of them in under 3 seconds forever. Understanding beats memorisation every time.'},

  /* ── CLASS 6-8 ── */
  ,{id:'tip-ap-middle', title:'Average of an AP — Always the Middle Term',
   classes:['7','8','9'], icon:'📊',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'In an arithmetic progression (AP), the average equals the middle term. The sum = average × count = middle term × count. No need to add everything!',
   whyItWorks:'Terms in an AP are symmetric around the middle. Every term below the middle has a mirror term above it. They always average out to the middle term: (a + last)/2 = middle.',
   example:'Sum of 3,7,11,15,19 → middle = 11, count = 5 → sum = 11×5 = 55 ✓  |  Check: 3+7+11+15+19 = 55 ✓',
   challenge:['Sum of 2,5,8,11,14','Sum of 10,20,30,40,50','Sum of 1,3,5,7,9,11,13','Sum of 5,10,15,20,25,30'],
   simId:'tip-ap-mid',
   buddy:'Salary negotiations use this: if you want to know the average salary in a pay scale from ₹30,000 to ₹80,000 with fixed increments — it is always ₹55,000. The middle of any AP.'},

  /* ── CLASS 7-9 ── */
  ,{id:'tip-perc-swap', title:'Percentage Swap Trick',
   classes:['6','7','8'], icon:'🔃',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'A% of B = B% of A. Always. So if A% of B looks hard, flip it — B% of A might be trivial!',
   whyItWorks:'A% of B = (A/100)×B = A×B/100 = (B/100)×A = B% of A. Division and multiplication are commutative. The swap is always valid.',
   example:'4% of 75 is hard. Flip → 75% of 4 = 3. ✓  |  32% of 25 hard? → 25% of 32 = 32/4 = 8. ✓',
   challenge:['6% of 50','48% of 25','4% of 125','12% of 75'],
   simId:'tip-perc-swap',
   buddy:'Bank interest calculations often use this: 3.5% of ₹2,000 sounds hard, but 2,000% of 3.5 = 3.5×20 = ₹70. Bankers flip percentages mentally every day.'},

  /* ── CLASS 8-10 ── */
  ,{id:'tip-pythag-triple', title:'Pythagorean Triples — Spot Them Instantly',
   classes:['8','9','10'], icon:'📐',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'Memorise the key families: (3,4,5), (5,12,13), (8,15,17), (7,24,25). Any multiple works: (6,8,10), (9,12,15). Spot them in exam questions to skip all calculation!',
   whyItWorks:'a²+b²=c² holds for these integer sets. Multiples work because (kA)²+(kB)²=(kC)² → k²(A²+B²)=k²C². Recognising a triple means no square root calculation needed.',
   example:'Triangle with sides 5, 12, x. Is it right-angled? → (5,12,13) triple → x=13, yes! ✓  |  Sides 9,40,x → (9,40,41) triple → x=41 ✓',
   challenge:['Find hyp if legs are 8 and 15','Find hyp if legs are 20 and 21','Is 10,24,26 a right triangle?','Find missing leg: hyp=25, leg=7'],
   simId:'tip-pythag-triple',
   buddy:'Ancient Indian mathematicians listed Pythagorean triples in the Sulba Sutras (800 BCE) — the oldest known geometry text. The (3,4,5) triple was used to lay out perfect right angles for temple construction.'},

  /* ── CLASS 9-10 ── */
  ,{id:'tip-log-rule',  title:'Logarithm Laws — Three Rules to Rule Them All',
   classes:['9','10'], icon:'㏒',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.22),rgba(255,150,0,.12))',
   shortTrick:'log(A×B) = logA + logB. log(A÷B) = logA − logB. log(Aⁿ) = n×logA. Multiplication becomes addition, division becomes subtraction, powers become multiplication.',
   whyItWorks:'Logarithms convert multiplication to addition because they reverse exponentiation. If bˣ=A and bʸ=B then bˣ⁺ʸ=AB, so log(AB) = x+y = logA+logB.',
   example:'log(4×25) = log4+log25 = log4+log25 = log100 = 2 ✓  |  log(1000³) = 3×log1000 = 3×3 = 9 ✓',
   challenge:['log(8 * 125)','log(10000 * 100)','log(2^10)','log(1000000 / 1000)'],
   simId:'tip-log-rule',
   buddy:'Before calculators, scientists used log tables to multiply huge numbers — log tables converted hard multiplication to easy addition. Logarithms helped calculate the orbit of Neptune before it was even discovered.'},

];

/* Build lookup map */
window.TIPS_MAP = {};
window.MATHS_TIPS.forEach(function(t) { window.TIPS_MAP[t.id] = t; });
