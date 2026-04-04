/* data-6-10-maths.js — Maths experiments, classes 6–10 */
window.EXPERIMENTS_6_10_MATH = [

  // ── CLASS 6 MATHS ──
  {id:'c6-m1',title:'Ratio Cooking',subject:'Maths',classes:['6'],icon:'🍳',bgGrad:'rgba(255,217,61,.18)',
   desc:'Scale a recipe up and down using ratios. Cook something real!',
   ncert:'NCERT Maths Class 6 – Ratio and Proportion',
   why:'Ratio compares two quantities (2:1 flour to water). Proportion means two ratios are equal (2:1 = 6:3). This scales recipes, mixes paint, maps distances, and dilutes chemicals.',
   materials:['A simple 2-serving recipe','Measuring cups'],
   steps:['Write: lemonade for 2 → 2 lemons, 4 tsp sugar, 1 cup water. Ratio 2:4:1.','Scale to 6 servings (multiply all by 3).','Scale to 1 serving (divide all by 2).','Make the drink and taste-test!','Ask: if ratio changes, does it still taste the same?'],
   simId:'ratio-cooking',buddy:'Paint mixers use ratio to match colours — a 3:1:0.5 red:yellow:white mix makes a specific orange. Changing any part changes the colour. Proportional thinking is precision thinking.'},

  {id:'c6-m2',title:'Integers on a Number Line',subject:'Maths',classes:['6'],icon:'↔️',bgGrad:'rgba(255,217,61,.18)',
   desc:'Use altitude and temperature to feel what negative numbers mean.',
   ncert:'NCERT Maths Class 6 – Integers',
   why:'Integers extend whole numbers in both directions. Negative integers model debt, below-sea-level altitude, sub-zero temperatures, and years BCE. Zero is neither positive nor negative.',
   materials:['Paper number line from −10 to +10'],
   steps:['Draw a number line −10 to +10.','Mark: sea level = 0, Dead Sea = −430 m, Mt Everest = +8849 m.','Plot: Shimla winter −5 °C; Chennai summer +40 °C.','What is the temperature difference between them?','If you owe ₹50 and earn ₹30, what is your balance?'],
   simId:'integer-line',buddy:'The Dead Sea is 430 m below sea level. You can float effortlessly there because of extremely high salt concentration — the water is so dense it pushes you up.'},

  {id:'c6-m3',title:'Algebra: Words to Expressions',subject:'Maths',classes:['6'],icon:'🔣',bgGrad:'rgba(255,217,61,.18)',
   desc:'Translate word problems into algebraic expressions. Decode algebra\'s language.',
   ncert:'NCERT Maths Class 6 – Algebra',
   why:'Algebra replaces specific numbers with letters (variables) to express general rules. A rule for any number is far more powerful than a rule for one number.',
   materials:['Pencil and paper'],
   steps:['Riya has x marbles; Priya has 4 more — write Priya\'s count.','A book costs ₹p; 3 books cost?','Write: "5 less than twice a number."','Evaluate 3x + 2 when x = 4; when x = 0.','Solve: x + 7 = 12. (What adds to 7 to give 12?)'],
   simId:'algebra-intro',buddy:'Al-Khwarizmi, a 9th-century mathematician in Baghdad, invented algebra. Both the words "algebra" (from his book title Al-Jabr) and "algorithm" (from his name) come from him.'},

  {id:'c6-m4',title:'Reflections and Rotations on a Grid',subject:'Maths',classes:['6'],icon:'🪞',bgGrad:'rgba(255,217,61,.18)',
   desc:'Reflect, rotate, and translate shapes on graph paper. Notice what changes and what stays the same.',
   ncert:'NCERT Maths Class 6 – Symmetry',
   why:'Transformations move shapes without changing their size or angles. They are fundamental to computer graphics, animation, architecture, and art.',
   materials:['Graph paper','Pencil','Mirror'],
   steps:['Draw a simple L-shape on graph paper.','Reflect it across the y-axis (flip horizontally).','Rotate it 90° clockwise around the origin.','Translate it 3 right and 2 up.','Which transformations preserve shape and size exactly?'],
   simId:'transformations',buddy:'Every frame of animation in a film or game is built from millions of rotations, translations, and scalings — performed in milliseconds on a graphics chip.'},

  {id:'c6-m5',title:'Compass Constructions',subject:'Maths',classes:['6'],icon:'📐',bgGrad:'rgba(255,217,61,.18)',
   desc:'Construct perpendicular bisectors, angle bisectors, and a 60° angle — ruler and compass only.',
   ncert:'NCERT Maths Class 6 – Practical Geometry',
   why:'Construction with compass and straightedge produces perfectly precise geometry without measuring. Ancient Greeks used these tools to prove theorems that stood for 2,000 years.',
   materials:['Compass','Ruler','Sharp pencil'],
   steps:['Construct the perpendicular bisector of a 6 cm line.','Bisect a 60° angle.','Construct a 60° angle using only the compass (equilateral triangle method).','Construct a triangle with sides 3 cm, 4 cm, 5 cm.','Verify with Pythagoras: is it a right triangle?'],
   simId:'geo-constructions',buddy:'The ancient problem of "squaring the circle" — constructing a square with the same area as a circle — was proved impossible in 1882 after 2,000 years of trying. Some problems have no solution.'},

  // ── CLASS 7 MATHS ──
  {id:'c7-m1',title:'Linear Equations in Real Life',subject:'Maths',classes:['7'],icon:'🧮',bgGrad:'rgba(255,217,61,.18)',
   desc:'Write and solve equations hidden in everyday situations.',
   ncert:'NCERT Maths Class 7 – Simple Equations',
   why:'Setting up an equation from a word problem is more powerful than plugging into a formula — it builds mathematical reasoning and works even in unfamiliar situations.',
   materials:['Pencil and paper'],
   steps:['A train travels 300 km in 3 hours. Set up 3x = 300, solve for x (speed).','A rope cut in two: the longer piece is 3× the shorter; total 48 m. Set up and solve.','Ramu has ₹x; spends ₹150 and has ₹200 left. Find x.','4 pencils + 1 pen = ₹30; pen costs ₹10 — find pencil price.','Verify each answer by substituting back.'],
   simId:'linear-equations',buddy:'Every routing algorithm — Google Maps, Ola, Swiggy delivery — solves equations with millions of variables in real time. Algebra is the language of logic.'},

  {id:'c7-m2',title:'Profit, Loss, and Discount',subject:'Maths',classes:['7'],icon:'💹',bgGrad:'rgba(255,217,61,.18)',
   desc:'Calculate profit %, loss %, and discount on realistic market scenarios.',
   ncert:'NCERT Maths Class 7 – Comparing Quantities',
   why:'Profit% = (Profit ÷ CP) × 100. Discount is always calculated on the Marked Price, not the cost price. Understanding this prevents being misled in markets.',
   materials:['Price lists from memory or a local shop'],
   steps:['Shopkeeper buys a phone for ₹8,000; sells for ₹10,000. Find Profit%.','Vegetable seller buys 10 kg at ₹20/kg; 2 kg spoils; sells rest at ₹25/kg. Profit or loss?','Shirt MRP ₹500 with 20% discount — sale price?','A book sold at 15% profit for ₹115 — what was the cost price?','Calculate your family\'s grocery budget vs. actual spending.'],
   simId:'profit-loss',buddy:'Cardamom prices swung from ₹800 to ₹3,000/kg in recent years. A farmer who sells at the wrong time makes a loss even on a bumper crop. Timing and maths both matter.'},

  {id:'c7-m3',title:'Data: Mean, Median, Mode',subject:'Maths',classes:['7'],icon:'📈',bgGrad:'rgba(255,217,61,.18)',
   desc:'Collect heights (or shoe sizes) from 10 people. Calculate all three averages.',
   ncert:'NCERT Maths Class 7 – Data Handling',
   why:'Mean, median, and mode tell different stories. Median is better for skewed data (incomes). Mode is best for categories (most popular colour). Choosing the wrong average misleads.',
   materials:['Data from 10 people','Pencil and paper'],
   steps:['Collect 10 heights in cm.','Mean: sum all ÷ 10.','Median: arrange in order; take the middle value (average of 5th and 6th).','Mode: most frequent value.','Range: max − min.','Which average best represents the group?'],
   simId:'data-averages',buddy:'When news reports "average Indian income," they use mean — but a few billionaires pull it up enormously. Median income is much lower and more representative. Always ask: which average?'},

  {id:'c7-m4',title:'Pythagoras Theorem Proof',subject:'Maths',classes:['10'],icon:'📐',bgGrad:'rgba(255,217,61,.18)',
   desc:'Cut paper squares on each side of a right triangle. Show the areas add up.',
   ncert:'NCERT Maths Class 7 – The Triangle and its Properties',
   why:'In any right triangle, a² + b² = c². This ancient result (known to Babylonians 4,000 years ago) underpins construction, navigation, computer graphics, and signal processing.',
   materials:['Graph paper','Ruler','Scissors','Pencil'],
   steps:['Draw a right triangle with legs 3 cm and 4 cm on graph paper.','Draw a square on each of the three sides.','Count area of 3 cm square (9) and 4 cm square (16). Sum = 25.','Count area of the hypotenuse square — should be 25.','Measure hypotenuse: √25 = 5 cm. Verify!'],
   simId:'pythagoras',buddy:'Egyptian rope-stretchers used a rope with 12 knots to make a 3-4-5 triangle — giving a perfect 90° angle for pyramid construction. Pythagoras as a building tool, 4,500 years ago.'},

  {id:'c7-m5',title:'Congruence: SSS, SAS, ASA',subject:'Maths',classes:['7'],icon:'🔺',bgGrad:'rgba(255,217,61,.18)',
   desc:'Construct triangles from given conditions. Test which sets guarantee congruence.',
   ncert:'NCERT Maths Class 7 – Congruence of Triangles',
   why:'Two triangles are congruent if they are identical in size and shape. Only certain combinations of sides and angles guarantee this: SSS, SAS, ASA, RHS. AAA does not — it gives similar triangles.',
   materials:['Ruler','Protractor','Compass','Pencil'],
   steps:['Draw a triangle with sides 4, 5, 6 cm (SSS).','Ask a friend to draw a triangle with the same three sides.','Overlay the two triangles — do they match perfectly?','Now draw a triangle with two sides and the included angle (SAS).','Try three angles only (AAA) — do the triangles match? (No — different sizes!)'],
   simId:'congruence',buddy:'Manufacturing relies on congruence: every bolt must be identical to its specification. A 0.1 mm error in an aircraft component can cause failure. Precision starts with geometry.'},

  // ── CLASS 8 MATHS ──
  {id:'c8-m1',title:'Graphing Two Linear Equations',subject:'Maths',classes:['9'],icon:'📊',bgGrad:'rgba(255,217,61,.18)',
   desc:'Plot two lines on graph paper. Find their intersection point algebraically and visually.',
   ncert:'NCERT Maths Class 8 – Linear Equations in Two Variables',
   why:'Two equations with two unknowns can be solved graphically (intersection point) or algebraically. This underlies every real-world optimisation — pricing, logistics, scheduling.',
   materials:['Graph paper','Pencil','Ruler'],
   steps:['Plot y = 2x + 1: find three points and draw the line.','Plot y = −x + 4 on the same graph.','Mark where lines cross — read the coordinates.','Verify: substitute x into both equations — do they give the same y?','Create a real situation this pair of equations could model.'],
   simId:'linear-graph',buddy:'When Ola sets a fare (base + per km) and compares to Uber, two linear equations cross at a break-even distance — graphing finds exactly where one app becomes cheaper.'},

  {id:'c8-m2',title:'Factorisation with Algebra Tiles',subject:'Maths',classes:['8'],icon:'🧩',bgGrad:'rgba(255,217,61,.18)',
   desc:'Arrange tile pieces (x², x, 1) into rectangles. Read off the factors.',
   ncert:'NCERT Maths Class 8 – Factorisation',
   why:'Factorisation reverses expansion. x² + 5x + 6 = (x + 2)(x + 3) because a rectangle of area x² + 5x + 6 has dimensions (x + 2) and (x + 3). Tiles make this visual.',
   materials:['Cardboard cut into: large squares (x²), strips (x), small squares (1)'],
   steps:['Represent x² + 4x + 4 with tiles.','Arrange into a square — what are its side lengths?','(x + 2)(x + 2) = (x + 2)²','Try x² + 5x + 6 — arrange into a rectangle.','Expand your answer to verify.'],
   simId:'factorisation',buddy:'"Factor" comes from Latin "facere" (to make). You\'re finding what makes up an expression. Babylonians used the same idea to divide land in 1800 BC — earliest recorded algebra.'},

  {id:'c8-m3',title:'Derive Pi by Measuring Circles',subject:'Maths',classes:['7','8'],icon:'🥧',bgGrad:'rgba(255,217,61,.18)',
   desc:'Measure circumference and diameter of 6 different circles. Calculate C ÷ D each time.',
   ncert:'NCERT Maths Class 8 – Mensuration',
   why:'π is the ratio of circumference to diameter for ANY circle. By measuring many different circles, you always get approximately 3.14159… This empirical discovery preceded the proof by millennia.',
   materials:['6 circular objects (cup, plate, coin, tin, lid, saucer)','String','Ruler'],
   steps:['Wrap string around each circle; straighten and measure (circumference).','Measure the diameter (widest point) with a ruler.','Calculate C ÷ D for each.','Average all six results.','Compare to π = 3.14159. How close did you get?'],
   simId:'pi-measure',buddy:'Aryabhata estimated π = 3.1416 in 499 AD — accurate to 4 decimal places. Mathematicians have now computed π to over 100 trillion digits. Yet 39 digits suffice to calculate the circumference of the observable universe.'},

  {id:'c8-m4',title:'Compound Interest vs Simple Interest',subject:'Maths',classes:['8'],icon:'📈',bgGrad:'rgba(255,217,61,.18)',
   desc:'Compare SI and CI on ₹10,000 at 10% over 5, 20, and 40 years.',
   ncert:'NCERT Maths Class 8 – Comparing Quantities',
   why:'Compound interest earns interest on previous interest — it grows exponentially. Einstein reportedly called it "the eighth wonder of the world." The longer the time, the more dramatic the difference.',
   materials:['Calculator','Paper'],
   steps:['SI for 5 years: P × R × T ÷ 100 = 10,000 × 10 × 5 ÷ 100.','CI for 5 years: A = P(1 + R/100)^T. Calculate and compare.','Repeat for 20 and 40 years.','Plot SI and CI amounts on the same graph.','At which year does CI pull dramatically ahead?'],
   simId:'compound-interest',buddy:'₹10,000 at 12%/year compound: ₹93,050 in 20 years, ₹2.9 lakh in 30 years, ₹9.3 lakh in 40 years. Time is the most powerful ingredient — starting early beats investing more later.'},

  {id:'c8-m5',title:'Experimental Probability',subject:'Maths',classes:['8'],icon:'🎲',bgGrad:'rgba(255,217,61,.18)',
   desc:'Toss a coin 20, 50, and 100 times. Track how experimental probability converges on 0.5.',
   ncert:'NCERT Maths Class 8 – Introduction to Probability',
   why:'Theoretical probability predicts what should happen; experimental probability records what actually happens. With more trials, they converge — this is the Law of Large Numbers.',
   materials:['A coin','Tally sheet','Graph paper'],
   steps:['Toss 20 times; count heads. Record heads/20.','Toss another 30 (total 50). Record heads/50.','Toss another 50 (total 100). Record heads/100.','Plot running probability after each toss on a graph.','What shape does the curve make as trials increase?'],
   simId:'probability-exp',buddy:'A casino wins every month not because it wins every game — but because with thousands of games, experimental probability converges on theoretical probability, which is designed in their favour.'},

  // ── CLASS 9 MATHS ──
  {id:'c9-m1',title:'Polynomials with Algebra Tiles',subject:'Maths',classes:['9'],icon:'🔣',bgGrad:'rgba(255,217,61,.18)',
   desc:'Expand (x+3)² using a physical square. Verify algebraic identities visually.',
   ncert:'NCERT Maths Class 9 – Polynomials',
   why:'Algebraic identities like (a+b)² = a²+2ab+b² are not rules to memorise but geometric truths. A square of side (a+b) has area a²+2ab+b². Tiles make this undeniable.',
   materials:['Algebra tile set or graph paper squares','Pencil'],
   steps:['Build a square of side (x+3) using tiles.','Count regions: x², 3x, 3x, 9. Total = x²+6x+9.','Verify: expand (x+3)² algebraically. Match?','Factor x²+6x+9 back to (x+3)².','Try (a−b)² — remove tiles. What remains?'],
   simId:'polynomial-tiles',buddy:'RSA encryption — protecting every HTTPS website — relies on the difficulty of factoring very large numbers. The polynomials you\'re studying are the foundation of internet security.'},

  {id:'c9-m2',title:'Coordinate Geometry: Distance Formula',subject:'Maths',classes:['9'],icon:'🗺️',bgGrad:'rgba(255,217,61,.18)',
   desc:'Plot points, calculate distances, and create a mini treasure hunt using coordinates.',
   ncert:'NCERT Maths Class 9 – Coordinate Geometry',
   why:'The distance formula d = √((x₂−x₁)²+(y₂−y₁)²) is Pythagoras applied to a coordinate plane. GPS latitude and longitude work on the same principle.',
   materials:['Graph paper','Pencil','Ruler'],
   steps:['Plot five points from given coordinates.','Calculate the distance between two points using the formula.','Find the midpoint of each side of a triangle you draw.','Create a "treasure map": write clues as coordinates.','What shape do the three midpoints of a triangle form?'],
   simId:'coord-distance',buddy:'Google Maps calculates distances between your GPS coordinate and millions of restaurant/shop coordinates simultaneously — every search uses the distance formula at planetary scale.'},

  {id:'c9-m3',title:'Prove Triangle Angle Sum = 180°',subject:'Maths',classes:['9'],icon:'📐',bgGrad:'rgba(255,217,61,.18)',
   desc:'Tear triangle corners and fit them on a straight line. Then prove it formally with parallel lines.',
   ncert:'NCERT Maths Class 9 – Lines and Angles',
   why:'Mathematical proof is certainty by logic, not experiment. The triangle angle-sum theorem is proved using the property of alternate interior angles formed by a transversal cutting parallel lines.',
   materials:['Paper','Scissors','Ruler','Pencil'],
   steps:['Draw any triangle; tear off all three corners.','Place corners side-by-side, angles touching — they form a straight line (180°). Experimental proof.','Now prove it: draw a line through the apex parallel to the base.','Label alternate interior angles as equal.','The three angles = angles on a straight line = 180°. Q.E.D.'],
   simId:'angle-sum',buddy:'Euclid\'s "Elements" (300 BC) proved 465 propositions from just 5 axioms. It was the standard maths textbook for 2,000 years. Proof is mathematics\' superpower.'},

  {id:'c9-m4',title:'Surface Area by Unrolling Solids',subject:'Maths',classes:['9'],icon:'🥫',bgGrad:'rgba(255,217,61,.18)',
   desc:'Wrap a tin can in paper, cut it open, and measure to derive the cylinder formula.',
   ncert:'NCERT Maths Class 9 – Surface Areas and Volumes',
   why:'Unrolling a cylinder reveals 2 circles (top+bottom) and a rectangle (side, width = 2πr). Total surface area = 2πr² + 2πrh. Derived from first principles — no formula needed.',
   materials:['Empty tin can','Ruler','String','Paper to wrap','Scissors'],
   steps:['Measure radius (r) and height (h).','Wrap paper around the curved surface; mark and cut to fit.','Flatten the paper — it\'s a rectangle. Measure width = circumference = 2πr?','Trace both circular ends.','Total area = rectangle + 2 circles. Calculate. Compare with formula.'],
   simId:'cylinder-area',buddy:'Packaging designers minimise surface area (cost) for a given volume. The optimal cylindrical can has height = diameter. Look at a Pringles tube vs a standard can — different volume-to-surface optimisations.'},

  {id:'c9-m5',title:'Mean from Grouped Frequency Data',subject:'Maths',classes:['9'],icon:'📊',bgGrad:'rgba(255,217,61,.18)',
   desc:'Collect heights of 20 people. Group into class intervals. Calculate mean using midpoints.',
   ncert:'NCERT Maths Class 9 – Statistics',
   why:'When raw data is grouped in class intervals, use midpoints to estimate the mean: Mean = Σ(f × x) ÷ Σf. This is how census statisticians, economists, and health departments analyse large datasets.',
   materials:['Heights of 20 people (cm)','Pencil and paper'],
   steps:['Group into intervals: 140–149, 150–159, 160–169, 170–179.','Count frequency (f) in each class.','Find midpoint (x) of each class.','Calculate f × x for each class.','Mean = Σ(fx) ÷ Σf.'],
   simId:'grouped-mean',buddy:'India\'s 2011 census used grouped frequency statistics to draw conclusions about 1.2 billion people from sampled data. The same technique you just used — at national scale.'},

  // ── CLASS 10 MATHS ──
  {id:'c10-m1',title:'Quadratic Equations in Context',subject:'Maths',classes:['10'],icon:'🚀',bgGrad:'rgba(255,217,61,.18)',
   desc:'Solve quadratic equations from area, projectile, and profit optimisation problems.',
   ncert:'NCERT Maths Class 10 – Quadratic Equations',
   why:'ax²+bx+c=0 models any squared relationship — area, projectile paths, brake distances, profit curves. Solve by factorisation or the quadratic formula x = (−b ± √(b²−4ac)) ÷ 2a.',
   materials:['Pencil','Calculator'],
   steps:['Ball thrown up: h = 20t − 5t². When does it land? (Set h = 0, solve for t.)','Garden: length = width + 3; area = 40 m². Find dimensions.','Profit = −x² + 100x − 1,500. Find units that maximise profit.','Solve each using factoring or quadratic formula.','Verify by substituting your answer back into the equation.'],
   simId:'quadratic-real',buddy:'Every time a cricket ball is thrown, a quadratic equation describes its path. Fielders\' brains solve these in milliseconds — they run to where the ball WILL be, not where it is now.'},

  {id:'c10-m2',title:'Trigonometry: Find Heights Without Climbing',subject:'Maths',classes:['10'],icon:'🏔️',bgGrad:'rgba(255,217,61,.18)',
   desc:'Use a homemade clinometer to measure angles and calculate heights of trees and buildings.',
   ncert:'NCERT Maths Class 10 – Introduction to Trigonometry',
   why:'tan(angle of elevation) = opposite ÷ adjacent = height ÷ horizontal distance. Measure one angle and one distance; calculate the unknown height. This works for any inaccessible height.',
   materials:['Protractor','Straw (sighting tube)','String with small weight (plumb line)','Ruler','Calculator'],
   steps:['Attach plumb line to flat edge of protractor; tape straw along straight edge.','Sight top of a tree through the straw.','Read angle between plumb line and 90° mark — that\'s the angle of elevation.','Measure horizontal distance to tree.','Height = your eye height + (tan(angle) × distance). Calculate.'],
   simId:'trig-heights',buddy:'Thales of Miletus measured the Great Pyramid\'s height using shadow ratios in 600 BC — the same idea as trigonometry, without the formal functions. Ancient ingenuity, modern notation.'},

  {id:'c10-m3',title:'Arithmetic Progressions in Finance',subject:'Maths',classes:['10'],icon:'📈',bgGrad:'rgba(255,217,61,.18)',
   desc:'Model salary increments and stepped savings plans using AP formulas.',
   ncert:'NCERT Maths Class 10 – Arithmetic Progressions',
   why:'An AP has a constant difference (d) between terms. nth term = a + (n−1)d. Sum of n terms = n/2 × (2a + (n−1)d). This models linear growth in salaries, simple interest, and stepped plans.',
   materials:['Calculator','Paper'],
   steps:['Salary ₹20,000/month, increasing ₹1,500 each year. Find year-10 salary.','Sum: total salary earned in 10 years.','Cinema hall: row 1 has 15 seats, each row has 2 more. How many in row 20?','Total seats in 20 rows?','Design your own stepped savings plan using AP.'],
   simId:'ap-finance',buddy:'SIP investments that increase monthly by a fixed amount form an arithmetic progression. Knowing the sum formula tells you exactly how much you\'ll accumulate — this maths grows your wealth.'},

  {id:'c10-m4',title:'Circle Theorems Verified',subject:'Maths',classes:['10'],icon:'⭕',bgGrad:'rgba(255,217,61,.18)',
   desc:'Construct circles and verify: tangent ⊥ radius, equal tangents from an external point, angle in semicircle = 90°.',
   ncert:'NCERT Maths Class 10 – Circles',
   why:'Circle theorems are elegant geometric truths with practical applications in optics, architecture, and engineering design. Verifying them builds geometric intuition that supports all higher mathematics.',
   materials:['Compass','Ruler','Protractor','Pencil'],
   steps:['Draw a circle; mark external point P.','Draw two tangents from P. Measure both — are they equal?','Measure angle between tangent and radius at contact — is it 90°?','Draw a diameter; mark any point on the circumference; form triangle. Measure the angle at the point.','Is it 90°? (Angle in semicircle theorem.)'],
   simId:'circle-theorems',buddy:'Satellite orbits, gear teeth, camera apertures, roundabouts — everything circular is designed using circle theorems. The GPS signal that guides your car travels in an orbit computed with these.'},

  {id:'c10-m5',title:'Probability — Complementary and Compound Events',subject:'Maths',classes:['10'],icon:'🎲',bgGrad:'rgba(255,217,61,.18)',
   desc:'Work through a medical testing scenario. Discover why a positive test is not what it seems.',
   ncert:'NCERT Maths Class 10 – Ch 15: Probability',
   why:'P(A|B) = P(A∩B)/P(B). Bayes\' theorem lets you update a probability given new information. It powers spam filters, medical diagnosis, weather forecasting, and AI classification.',
   materials:['Calculator','Pencil and paper'],
   steps:['A disease affects 1% of the population. Test is 99% accurate.','100,000 people tested: 1,000 have disease; 99,000 don\'t.','True positives: 1,000 × 0.99 = 990. False positives: 99,000 × 0.01 = 990.','If you test positive, P(you have disease) = 990 ÷ (990+990) = 50%!','How does this change if disease affects 10% of the population?'],
   simId:'bayes-prob',buddy:'Medical tests are rarely as reliable as they seem. A 99% accurate test for a rare disease still gives a 50% false-positive rate. Understanding Bayes\' theorem literally helps you make life-saving decisions.'},

  /* ── 3D SIM ── */
  ,{id:'c9-m6',title:'3D Shapes Explorer',subject:'Maths',classes:['9','10'],icon:'🔷',bgGrad:'linear-gradient(135deg,rgba(255,217,61,.25),rgba(251,146,60,.2))',
   desc:'Rotate and explore 3D geometric solids — cube, cuboid, sphere, cone, cylinder, tetrahedron. Watch surface area and volume update live as you resize.',
   ncert:'NCERT Maths Class 9 – Surface Areas and Volumes',
   why:'3D solids have surface area (sum of all face areas) and volume (space enclosed). Key formulas: Cube SA=6a², V=a³. Cylinder SA=2πr(r+h), V=πr²h. Cone SA=πr(r+l), V=⅓πr²h. Sphere SA=4πr², V=⁴⁄₃πr³. Visualising these in 3D makes the formulas intuitive.',
   materials:['Cardboard','Scissors','Ruler','Tape'],
   steps:['Cut out nets (flat patterns) of a cube and cuboid from cardboard.','Fold and tape to make the 3D shape.','Count the faces, edges, and vertices. Verify Euler\'s formula: F+V−E=2.','Measure edges and calculate surface area. Compare with the formula.','Fill with water or sand to measure volume experimentally.'],
   simId:'shapes-3d',buddy:'Archimedes discovered the volume of a sphere by thinking about it as slices. He was so excited he ran through the streets. His insight: a sphere\'s volume is exactly ⅔ of the cylinder that contains it.'}


  /* ── NEW 3D MATHS SIMS ── */

  /* Class 8 — Visualising Solid Shapes 3D */
  ,{id:'c8-m6-3d',title:'Visualising Solid Shapes 3D',subject:'Maths',classes:['8'],icon:'🔷',
   bgGrad:'linear-gradient(135deg,rgba(255,217,61,.25),rgba(251,146,60,.2))',
   desc:'See 3D solid shapes unfolded into their nets, then fold back up. Visualise faces, edges, and vertices of cubes, pyramids, prisms, and cones.',
   ncert:'NCERT Maths Class 8 – Visualising Solid Shapes',
   why:'Every 3D solid has a flat net — a 2D pattern that folds into the shape. Euler\'s formula F+V-E=2 holds for all convex polyhedra. Views from front, side, and top are called orthographic projections — used by engineers and architects.',
   materials:['Graph paper','Scissors','Ruler','Tape'],
   steps:['Draw a net for a cube on graph paper (cross of 6 squares).','Cut out and fold — does it make a perfect cube?','Try a net for a triangular pyramid (equilateral triangle + 3 side triangles).','For each shape count faces (F), vertices (V), edges (E).','Check: F + V - E = 2 every time?'],
   simId:'solid-shapes-3d',buddy:'Engineers use 3D nets every day — car body panels, aircraft fuselage sections, and packaging boxes are all designed as flat nets first, then folded into shape. Origami is the art form of the same principle.'}

  /* Class 9 — 3D Coordinate Geometry */
  ,{id:'c9-m6-3d',title:'3D Coordinate Geometry',subject:'Maths',classes:['9'],icon:'📍',
   bgGrad:'linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.2))',
   desc:'Plot points in XYZ 3D space, calculate distances between points, and explore the three coordinate planes. Extend what you know from 2D to 3D.',
   ncert:'NCERT Maths Class 9 – Coordinate Geometry',
   why:'In 3D, every point needs three coordinates (x,y,z). Distance = sqrt((x2-x1)^2+(y2-y1)^2+(z2-z1)^2). The three planes (xy, yz, xz) divide space into 8 octants. This extends your Class 9 coordinate geometry into full three-dimensional space.',
   materials:['Cardboard box corner','Ruler','Marker','String'],
   steps:['Use a box corner as origin — three edges are x, y, z axes.','Mark units along each edge with a marker.','Place a small ball at point (3,4,0) — distance from origin = 5 (Pythagoras).','Now lift it to (3,4,5) — distance = sqrt(50) = 7.07.','Plot 4 points and connect — what 3D shape do you get?'],
   simId:'coord-3d',buddy:'GPS satellites calculate your exact position using 3D coordinates. Four satellites measure distances to your phone; the intersection of four spheres in 3D space gives your precise location on Earth.'}

  /* Class 10 — Trigonometry Heights and Distances 3D */
  ,{id:'c10-m6-3d',title:'Heights and Distances 3D',subject:'Maths',classes:['10'],icon:'🏔️',
   bgGrad:'linear-gradient(135deg,rgba(34,211,238,.22),rgba(6,182,212,.18))',
   desc:'Solve heights and distances problems in a 3D scene — measure a tower, a cliff, a flying kite using angles of elevation and depression.',
   ncert:'NCERT Maths Class 10 – Ch 9: Some Applications of Trigonometry (3D visualisation)',
   why:'tan(angle) = opposite/adjacent lets you find unknown heights from measured horizontal distance and angle of elevation. Angle of depression works the same way from above. Surveyors, pilots, and architects use this every day. Two observations from different distances let you find height without going near the object.',
   materials:['Protractor','Straw','String with weight (plumb line)','Ruler'],
   steps:['Make a clinometer: tape a straw to a protractor, hang a plumb line from centre.','Stand 10 m from a tree/building.','Look through the straw at the top — read the angle.','Height = distance x tan(angle) + your eye height.','Move 5 m closer and measure again — do both give the same height?'],
   simId:'heights-3d',buddy:'The height of Mount Everest was first calculated by the Great Trigonometrical Survey of India in 1852 — from 160 km away using exactly this method. Radhanath Sikdar, a Bengali mathematician, did the calculation that proved it was the world\'s highest peak.'}

  /* Class 10 — Circles and Tangents 3D */
  ,{id:'c10-m7-3d',title:'Circles and Tangents 3D',subject:'Maths',classes:['10'],icon:'⭕',
   bgGrad:'linear-gradient(135deg,rgba(251,191,36,.22),rgba(245,158,11,.18))',
   desc:'Explore circle theorems in 3D — tangents from external point, angle in semicircle, alternate segment theorem. Rotate the 3D model to see proofs from any angle.',
   ncert:'NCERT Maths Class 10 – Ch 10: Circles (tangent theorems, 3D proof)',
   why:'Key theorems: tangent is perpendicular to radius at point of contact; tangents from external point are equal; angle in semicircle is 90 degrees; angles in same segment are equal. These properties are used in gear design, optical lenses, and road curve engineering.',
   materials:['Compass','Ruler','Pencil','Protractor'],
   steps:['Draw a circle with centre O.','Mark external point P and draw two tangents PA and PB.','Measure PA and PB — are they equal?','Draw diameter AB. Mark point C on circle. Measure angle ACB.','Is it always 90 degrees? Try 5 different positions for C.'],
   simId:'circles-tangents-3d',buddy:'Every roundabout on Indian highways is designed using circle geometry — the entry and exit roads are tangents to the circular path. The radius determines the safe speed of the vehicle going around it.'}



  /* Moved: correct NCERT class */
  ,{id:'c5-m3',title:'Percentages and Discounts',subject:'Maths',classes:['7'],icon:'🏷️',bgGrad:'rgba(255,217,61,.18)',desc:'Calculate sale prices. Understand what 10%, 25%, 50% off really means.',ncert:'NCERT Maths Class 5 – Percentages',why:'Percentage means "per hundred." 25% off ₹200 = 25/100 × 200 = ₹50 off → ₹150. Understanding this protects you from misleading sales.',materials:['Newspaper ads or make price tags','Calculator optional'],steps:['Find an item priced ₹500 with 20% off.','Calculate: 20/100 × 500 = ₹100 off. New price = ₹400.','Find 3 items in a newspaper sale.','Calculate actual sale price for each.','Which deal gives the biggest saving in rupees?'],simId:'percentage-sim',buddy:'Shops show "50% off" but on what original price? A trick: inflate the original price then "discount" it. Always calculate the actual price you pay, not the % shown!'}


  /* Moved: correct NCERT class */
  ,{id:'c5-m5',title:'Average and Mean',subject:'Maths',classes:['6'],icon:'📊',bgGrad:'rgba(255,217,61,.18)',desc:'Calculate average rainfall, temperature, or scores from real data.',ncert:'NCERT Maths Class 5 – Statistics',why:'The mean (average) gives a single number representing a dataset. Add all values and divide by count. Used in weather forecasting, school grades, cricket batting averages.',materials:['Weather data from a newspaper or memory','Pencil and paper'],steps:['Record last 7 days\' temperature.','Add all 7 temperatures.','Divide by 7 — that\'s the weekly mean.','If one day was unusually hot, how does it affect the average?','Find your maths test average over last 3 tests.'],simId:'mean-sim',buddy:"Virat Kohli's batting average of ~50 means on average he scores 50 runs per innings. But he's sometimes out for 0 and sometimes scores 200. The average hides the variation!"}
];