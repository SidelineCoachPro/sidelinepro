// data/drills_expanded.ts
// Additional drills to merge with data/drills.ts
// Original content — all categories, beginner through advanced
// 80+ new drills across all skill areas

import type { Drill } from './drills';

export const DRILLS_EXPANDED: Drill[] = [

  // ════════════════════════════════════════════
  // BALL HANDLING — BEGINNER
  // ════════════════════════════════════════════

  {
    id: 'bh-fingertip-taps',
    name: 'Fingertip Taps',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 5,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'The very first ball-handling drill for brand new players. Tapping the ball between fingertips builds hand strength and touch before any dribbling begins. Perfect for U8 and first-year players.',
    setup: 'Each player holds a ball at chest height.',
    instructions: 'Players tap the ball rapidly between their two hands using only fingertips — no palms. Progress: (1) chest height, (2) above head, (3) below knees, (4) around the waist. 30 seconds each position. Fingers should feel tired at the end.',
    cues: [
      'Fingertips only — pretend the ball is too hot to hold',
      'Keep your eyes up — not on the ball',
      'Tap faster — like you\'re playing a drum',
      'Spread your fingers wide on every tap',
    ],
    progression: 'Add movement — walk forward while tapping. Toss the ball up and catch with fingertips only.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+fingertip+taps+drill+youth',
    tags: ['Ball Handling', 'Beginner', 'Individual', 'U8', 'First Year'],
  },

  {
    id: 'bh-ball-slaps',
    name: 'Ball Slaps',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 4,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players slap the ball hard between hands to develop grip strength, hand toughness, and comfort with the ball. Simple but essential for players who are tentative with the basketball.',
    setup: 'Each player with a ball, standing in athletic stance.',
    instructions: 'Slap the ball hard from hand to hand at different heights: (1) waist, (2) chest, (3) overhead, (4) knee height. 10 slaps each height. The slap should make a loud noise — that\'s the goal.',
    cues: [
      'Slap hard — be aggressive with the ball',
      'The louder the better — you want to hear it',
      'Grip the ball firmly after each slap',
      'Don\'t be afraid of the ball',
    ],
    progression: 'Increase speed. Add a ball wrap: slap, then wrap the ball around your waist, slap again.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+ball+slaps+youth+drill',
    tags: ['Ball Handling', 'Beginner', 'Individual', 'U8'],
  },

  {
    id: 'bh-pound-dribble',
    name: 'Power Pound Dribbling',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 6,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Stationary power dribbling that teaches players to dribble with authority and control. Many young players pat the ball gently — this drill fixes that habit.',
    setup: 'Each player with a ball, spread out across the gym.',
    instructions: 'Players dribble as hard as they can with one hand — the ball should bounce above the waist. 30 seconds each hand. Then alternate every 5 dribbles. The goal is maximum force combined with control.',
    cues: [
      'Pound the floor — not a pat, a pound',
      'Push through the ball on the way down',
      'Soft hands on the catch — absorb it',
      'Knees bent, athletic stance throughout',
    ],
    progression: 'Add a forward/backward walk while pounding. Count consecutive dribbles without a mistake.',
    videoUrl: 'https://www.youtube.com/results?search_query=youth+basketball+power+dribble+drill',
    tags: ['Ball Handling', 'Beginner', 'Individual'],
  },

  {
    id: 'bh-around-the-world-body',
    name: 'Around the World (Body)',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 6,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players pass the ball around different body parts — waist, head, knees — building coordination, ambidexterity, and comfort with the ball. A classic youth drill that never gets old.',
    setup: 'Each player with a ball, feet shoulder-width apart.',
    instructions: 'Circle the ball around the waist 10 times each direction. Then knees 10 each direction. Then head 10 each direction. Then a figure-8 through the legs. No dropping — if you drop, pick it up and keep going.',
    cues: [
      'Eyes up — feel where the ball is, don\'t look at it',
      'Keep the ball moving — no pauses',
      'Switch directions smoothly',
      'This is about touch, not speed — control first',
    ],
    progression: 'Time it — how fast can you complete all four circuits? Reverse direction mid-circuit on coach\'s signal.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+around+the+world+body+drill+youth',
    tags: ['Ball Handling', 'Beginner', 'Individual', 'U8', 'U10'],
  },

  {
    id: 'bh-drop-catch',
    name: 'Drop and Catch',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 5,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players drop the ball between their legs and catch it before it bounces twice. Builds quick hands, coordination, and spatial awareness — great for younger players who struggle with ball control.',
    setup: 'Each player with a ball, feet wide apart.',
    instructions: 'Hold the ball with right hand in front, left hand behind — between the legs. Simultaneously switch hands (right goes behind, left goes to front) and catch before the ball hits the ground. Start slow, build speed.',
    cues: [
      'React fast — your hands must move before the ball drops far',
      'Keep feet wide — gives you more space',
      'Anticipate the drop — don\'t wait to react',
      'Quick hands, quick catch',
    ],
    progression: 'Catch after one bounce. Catch after zero bounces. Eyes closed after mastered.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+drop+catch+between+legs+drill',
    tags: ['Ball Handling', 'Beginner', 'Individual', 'U8', 'U10'],
  },

  // ════════════════════════════════════════════
  // BALL HANDLING — INTERMEDIATE
  // ════════════════════════════════════════════

  {
    id: 'bh-crossover-series',
    name: 'Crossover Series',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description: 'A systematic progression through all the primary crossover moves in basketball. Players learn each move in isolation before combining them — the foundation of game-level ball handling.',
    setup: 'Players spread across the gym, each with a ball.',
    instructions: 'Execute 10 of each move stationary: (1) Basic crossover, (2) Between the legs, (3) Behind the back, (4) In-and-out fake, (5) Hesitation. Then combine: crossover into between-legs, hesitation into behind-back. 2 minutes free movement using any combination.',
    cues: [
      'Low dribble on every crossover — below the knee',
      'Sell the fake first — your body must go one way before the ball goes the other',
      'Explosive push off the outside foot after the move',
      'Eyes up — see the floor, not the ball',
      'Quick hands through the move — don\'t telegraph it',
    ],
    progression: 'Add a cone at the move point — execute the move at the cone, not before or after it. Add a light defender who reacts but doesn\'t steal.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+crossover+series+drill+intermediate',
    tags: ['Ball Handling', 'Intermediate', 'Individual'],
  },

  {
    id: 'bh-chair-dribbling',
    name: 'Chair Dribbling Series',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description: 'Players dribble around a chair set up as a stationary defender, practicing game-specific moves at game-like angles. The chair simulates a standing defender without the live pressure.',
    setup: 'One chair per player (or 6 chairs for a drill rotation). Each player with a ball.',
    instructions: 'At each chair: (1) Crossover and attack the right side, (2) Between legs and attack the left side, (3) Behind back and drive middle, (4) Step-back pull-up from the chair. 3 sets each move, finish with a layup or pull-up.',
    cues: [
      'Attack the chair\'s hip — not straight at it',
      'Get your shoulder past the defender (chair) before going up',
      'Change of speed: slow into the move, explosive out',
      'The chair is just a reference point — read it like a defender',
    ],
    progression: 'Replace chair with a standing cone, then a standing teammate, then a live passive defender.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+chair+dribbling+drill',
    tags: ['Ball Handling', 'Intermediate', 'Individual'],
  },

  {
    id: 'bh-full-court-combo',
    name: 'Full Court Combo Dribble',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 12,
    playersNeeded: '2 lines',
    level: 'Intermediate',
    description: 'Players execute a different dribble move at each designated point up the full court, combining speed dribbling with ball control moves in a game-like sequence.',
    setup: '5 cones placed at regular intervals from baseline to baseline. Players in two lines.',
    instructions: 'Speed dribble to cone 1: crossover. Speed to cone 2: between legs. Speed to cone 3: behind back. Speed to cone 4: hesitation step. Speed to cone 5: spin move. Finish with a layup. Return with weak hand dominant.',
    cues: [
      'Speed between cones — this simulates game pace',
      'Execute the move AT the cone, not 5 feet before it',
      'Head up to see the basket the entire length',
      'The layup finish must be clean — no sloppy finishes',
    ],
    progression: 'Coach calls the move at each cone instead of pre-set moves. Add a chase defender who starts 3 steps behind.',
    videoUrl: 'https://www.youtube.com/results?search_query=full+court+combo+dribble+basketball+drill',
    tags: ['Ball Handling', 'Intermediate', 'Full Team'],
  },

  // ════════════════════════════════════════════
  // BALL HANDLING — ADVANCED
  // ════════════════════════════════════════════

  {
    id: 'bh-1v1-iso',
    name: '1-on-1 Isolation Series',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 15,
    playersNeeded: 'Pairs',
    level: 'Advanced',
    description: 'Live 1-on-1 ball handling against active defense in isolation situations. The ultimate test of whether your ball handling transfers to game situations. For competitive players who need to create their own shot.',
    setup: 'Pairs. Ball handler starts at the wing with the ball. Defender in on-ball defensive stance.',
    instructions: 'Ball handler has 5 seconds to score. No help defense. Must use at least 2 dribble moves before shooting or driving. Rotate after each possession. Track makes. Loser runs a sprint. 4 sets each position.',
    cues: [
      'Read the defender\'s weight — attack where they lean away from',
      'Use your eyes as a weapon — look one way, go the other',
      'Change of pace is more important than change of direction',
      'Get to your spot — create separation for your shot',
      'One explosive dribble to the basket beats ten fancy moves',
    ],
    progression: 'Shrink the area (wing only, no middle). Add a shot clock (4 seconds). Full court 1-on-1.',
    videoUrl: 'https://www.youtube.com/results?search_query=1v1+isolation+basketball+drill+advanced',
    tags: ['Ball Handling', 'Advanced', 'Pairs', 'Competitive'],
  },

  {
    id: 'bh-blindfold-dribble',
    name: 'Eyes Closed Dribbling',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Advanced',
    description: 'Forces players to develop true feel for the ball by removing visual feedback entirely. Advanced players who have solid fundamentals use this drill to take their touch to the elite level.',
    setup: 'Each player with a ball in open space, well separated from others.',
    instructions: 'Close eyes completely. (1) Stationary pound dribble right hand 30 sec. (2) Left hand 30 sec. (3) Alternating 30 sec. (4) Figure-8 through legs 20 reps. Open eyes, check position — you may have drifted. Eyes closed again: crossover series 30 sec.',
    cues: [
      'Feel the ball — every finger, every bounce',
      'Trust your hands — they know what to do',
      'Consistent dribble height helps you track the ball mentally',
      'If you lose it, stop, find it, reset — don\'t panic',
    ],
    progression: 'Walk forward with eyes closed while dribbling. Partner calls out when to crossover.',
    videoUrl: 'https://www.youtube.com/results?search_query=eyes+closed+basketball+dribbling+drill',
    tags: ['Ball Handling', 'Advanced', 'Individual'],
  },

  {
    id: 'bh-machine-gun',
    name: 'Machine Gun Dribbling',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Advanced',
    description: 'Rapid-fire alternating dribbles at maximum speed that develops lightning-quick hand transitions. Used by elite guards to improve their handle under extreme fatigue.',
    setup: 'Each player with a ball, in athletic stance.',
    instructions: 'Dribble both hands alternately as fast as humanly possible — the ball barely leaves the floor (2-3 inches). 30 seconds on, 15 seconds rest, 5 rounds. Maintain control throughout — speed without control is meaningless.',
    cues: [
      'Barely leave the floor — the faster the transition, the lower the dribble',
      'Wrist snap on every touch — not just arm movement',
      'Stay in athletic stance — don\'t stand up as you tire',
      'The 5th round should be as fast as the 1st',
    ],
    progression: 'Add lateral movement while machine-gunning. 1-on-1 while machine-gunning (must maintain pace).',
    videoUrl: 'https://www.youtube.com/results?search_query=machine+gun+dribbling+basketball',
    tags: ['Ball Handling', 'Advanced', 'Individual'],
  },

  // ════════════════════════════════════════════
  // SHOOTING — BEGINNER
  // ════════════════════════════════════════════

  {
    id: 'sh-wall-shooting',
    name: 'Wall Form Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players shoot against a wall with one hand to isolate and perfect shooting mechanics before introducing the backboard or basket. The best drill for fixing form issues from the ground up.',
    setup: 'Players stand 3 feet from a flat wall, each with a ball.',
    instructions: 'Shooting hand only. Set the ball on the shooting hand in correct BEEF position. Push toward the wall — the ball should hit the wall at eye level and come back. Focus on wrist snap and follow-through. 20 reps each hand. Add the guide hand for the last 10.',
    cues: [
      'One hand only — this isolates the shooting motion',
      'Follow through completely — reach into the cookie jar and hold it',
      'The ball should roll back to you off good backspin',
      'Elbow under the ball — pointing at your target on the wall',
    ],
    progression: 'Move back to 5 feet. Add a step into the shot. Transition directly to form shooting at the basket.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+wall+shooting+form+drill+youth',
    tags: ['Shooting', 'Beginner', 'Individual', 'U8', 'U10'],
  },

  {
    id: 'sh-layup-lines',
    name: 'Layup Lines (Both Hands)',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'The most fundamental drill in all of basketball. Two lines — one shooting, one rebounding. Every player must master the layup before anything else matters.',
    setup: 'Two lines: one at the right elbow (shooters), one under the basket (rebounders). Ball starts with the shooter line.',
    instructions: 'Shooter dribbles in and finishes the right-hand layup off the backboard. Rebounder catches the ball — made or missed — and passes to the next shooter. Rotate: shooter goes to rebound line, rebounder goes to shooter line. Run 5 minutes right hand, 5 minutes left hand. Count team makes.',
    cues: [
      'Two-step footwork: right foot, left foot, right hand layup',
      'Aim for the top corner of the box on the backboard',
      'Soft touch — bank it gently, don\'t throw it at the board',
      'Left-hand layup: left foot, right foot, left hand',
      'Eyes on the target, not the ball',
    ],
    progression: 'Speed it up — next player goes as soon as the previous one shoots. Add a passer who feeds from the elbow.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+layup+lines+drill+youth+beginners',
    tags: ['Shooting', 'Beginner', 'Full Team', 'U8', 'U10'],
  },

  {
    id: 'sh-around-world-shooting',
    name: 'Around the World Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Groups of 2-4',
    level: 'Beginner',
    description: 'The classic progressive shooting drill. Players advance around 7 spots only when they make a shot. Teaches consistency, composure, and competitive shooting in a fun format.',
    setup: 'Mark 7 spots in an arc: right baseline, right block, right wing, top of key, left wing, left block, left baseline. Players rotate through spots.',
    instructions: 'Shoot from spot 1. Make it: move to spot 2. Miss: stay or take a chance shot. Miss the chance shot: go back to spot 1. First player to complete all 7 spots and return wins. No more than 3 players per basket.',
    cues: [
      'Maintain your form even when the spots get uncomfortable',
      'The chance shot decision is a real one — make it strategically',
      'Never change your routine between spots — same setup every time',
      'Miss or make, reset your feet before the next attempt',
    ],
    progression: 'Require a catch-and-shoot (passer feeds you at each spot). Add a time limit for the whole circuit.',
    videoUrl: 'https://www.youtube.com/results?search_query=around+the+world+shooting+basketball+drill',
    tags: ['Shooting', 'Beginner', 'Groups', 'Competitive'],
  },

  {
    id: 'sh-superman-shooting',
    name: 'Superman Form Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 8,
    playersNeeded: 'Individual / pairs',
    level: 'Beginner',
    description: 'Players lie on their back and shoot the ball straight up, developing the feel of a correct release and follow-through without the distraction of aiming at a basket. Perfect for correcting arm mechanics.',
    setup: 'Players lie flat on their back, ball in shooting hand.',
    instructions: 'Lying on back, set ball in shooting hand with elbow at 90 degrees pointing at the ceiling. Shooting guide hand on the side. Push the ball straight up and catch it coming back down. Focus on the backspin — correct release = straight backspin. 15 reps.',
    cues: [
      'The ball should come straight back down — no side spin',
      'Wrist must snap all the way over on the follow-through',
      'Catch the ball softly — same fingers that shot it',
      'If it spins sideways, your elbow is out of line',
    ],
    progression: 'Sit up and repeat. Stand and shoot 3 feet from the basket. Progress to normal form shooting.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+superman+shooting+drill+youth',
    tags: ['Shooting', 'Beginner', 'Individual', 'U8', 'U10'],
  },

  // ════════════════════════════════════════════
  // SHOOTING — INTERMEDIATE
  // ════════════════════════════════════════════

  {
    id: 'sh-catch-shoot-series',
    name: 'Catch and Shoot Series',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Groups of 3',
    level: 'Intermediate',
    description: 'Systematic catch-and-shoot training from all five spots around the arc. Develops footwork on the catch, quick release, and consistency from game-speed passes.',
    setup: 'Shooter at the wing. Passer at the top of the key. Rebounder under the basket.',
    instructions: 'Shooter sprints to each of 5 spots, receives a pass, and shoots immediately. 2 shots per spot. After 10 shots, rotate positions. Track makes per rotation. Target: 7 of 10 at each position.',
    cues: [
      'Sprint to the spot — not jog, sprint',
      'Feet ready before the ball arrives — catch balanced',
      'Hands ready (target hand up) as you\'re running, not after',
      'Same routine every shot: catch, load, shoot — no extra dribbles',
      'The passer controls the tempo — shooter must adjust',
    ],
    progression: 'Add a defender who closes out — shooter must shoot over the contest. Time pressure: 8 shots in 45 seconds.',
    videoUrl: 'https://www.youtube.com/results?search_query=catch+and+shoot+series+basketball+drill',
    tags: ['Shooting', 'Intermediate', 'Groups'],
  },

  {
    id: 'sh-shot-fake-drive',
    name: 'Shot Fake and Drive Series',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Pairs',
    level: 'Intermediate',
    description: 'Players learn to use the shot fake to create driving lanes and finish at the rim. The shot fake is one of the most underused skills at the youth level — this drill makes it automatic.',
    setup: 'Ball handler at the wing. Passive defender in closeout position.',
    instructions: 'Ball handler receives a pass. Defender closes out hard. Ball handler executes a convincing shot fake — wait for the defender to jump — then drives by them for a layup or pull-up. 3 options: (1) fake and drive right, (2) fake and drive left, (3) read the defender.',
    cues: [
      'The fake must be convincing — bring the ball up as if you\'re shooting',
      'Feet stay on the floor on the fake — if you jump, you can\'t drive',
      'Wait for the defender to leave the floor before you go',
      'One hard dribble after the fake — attack immediately',
      'Keep your pivot foot planted until you\'ve beaten the defender',
    ],
    progression: 'Live defender who doesn\'t tell you when they\'re going to close out. Add a second defender in the lane.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+shot+fake+drive+drill',
    tags: ['Shooting', 'Intermediate', 'Pairs'],
  },

  {
    id: 'sh-off-screen-shooting',
    name: 'Coming Off Screens',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 15,
    playersNeeded: 'Groups of 3',
    level: 'Intermediate',
    description: 'Players practice catching and shooting off various screen types — curl, fade, pop — developing the footwork and quick release needed to be a weapon off the ball.',
    setup: 'Screener at the elbow. Cutter starting at the block. Passer at the top of the key.',
    instructions: 'Three actions: (1) Curl — cutter uses the screen and curls to the basket for a mid-range jumper. (2) Pop — cutter reads the screen and pops to the three-point line. (3) Fade — cutter fades away from the screen for a corner three. 5 reps each action, rotate every 15 reps.',
    cues: [
      'Read the defender before you cut — that tells you which action to use',
      'Set up the cut: go hard toward the screen before coming off it',
      'Stay tight to the screener — daylight between you and the screen is a lost advantage',
      'Hands ready early — the catch and shoot must be one motion',
    ],
    progression: 'Add a live defender on the shooter. Add a help defender. Run it in the context of a half-court play.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+coming+off+screens+shooting+drill',
    tags: ['Shooting', 'Intermediate', 'Groups'],
  },

  // ════════════════════════════════════════════
  // SHOOTING — ADVANCED
  // ════════════════════════════════════════════

  {
    id: 'sh-game-speed-shooting',
    name: 'Game Speed Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 15,
    playersNeeded: 'Groups of 3',
    level: 'Advanced',
    description: 'Every aspect of shooting at actual game speed — full sprint to spots, off live passes, with a live closing defender. If you can make shots in this drill, you can make them in games.',
    setup: 'Shooter, passer, and active defender. Full half court.',
    instructions: 'Shooter sprints from baseline to a designated spot. Passer fires a crisp pass. Defender closes out hard at full speed. Shooter must catch and shoot or make a read (shoot, drive, pump-fake). Track makes. 12 reps each spot. No standing around — constant movement.',
    cues: [
      'Game speed means everything is fast — your feet, your catch, your release',
      'See the defense before you receive the pass — make your read early',
      'Miss or make, sprint back to baseline and go again — no standing',
      'The tired shot counts the same as the fresh shot',
    ],
    progression: 'Two defenders. Shot clock (3 seconds after catch). Shooter must receive pass after a ball screen.',
    videoUrl: 'https://www.youtube.com/results?search_query=game+speed+shooting+basketball+drill+advanced',
    tags: ['Shooting', 'Advanced', 'Groups', 'Competitive'],
  },

  {
    id: 'sh-timed-shooting-circuit',
    name: 'Timed Shooting Circuit',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Individual',
    level: 'Advanced',
    description: 'A personal performance tracking drill where players shoot from 8 specific spots in 60 seconds. The score is recorded each session — competition against yourself drives improvement.',
    setup: '8 spots marked around the court: 4 mid-range spots, 4 three-point spots. Timer ready.',
    instructions: '60 seconds. Start at spot 1. Shoot, rebound your own miss, sprint to spot 2. Continue through all 8 spots and cycle back. Count makes only. Record score after every session. Personal best is the target.',
    cues: [
      'Sprint between spots — walking kills your score',
      'Quick release — don\'t take time to settle',
      'Rebound aggressively — lost balls kill your time',
      'Know your score as you go — this is self-competition',
    ],
    progression: 'Use a rebounder to eliminate self-rebounding time. Add a third-quarter tired challenge (run a sprint before starting).',
    videoUrl: 'https://www.youtube.com/results?search_query=timed+shooting+circuit+basketball+drill',
    tags: ['Shooting', 'Advanced', 'Individual', 'Competitive'],
  },

  // ════════════════════════════════════════════
  // PASSING — BEGINNER
  // ════════════════════════════════════════════

  {
    id: 'pa-stationary-pairs',
    name: 'Stationary Partner Passing',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 8,
    playersNeeded: 'Pairs',
    level: 'Beginner',
    description: 'The foundation of all passing. Partners work through chest, bounce, and overhead passes with proper mechanics before adding movement. Essential for first-year players.',
    setup: 'Partners 10 feet apart across the gym.',
    instructions: '10 chest passes each — step into it, extend, thumbs rotate down. 10 bounce passes — aim 2/3 of the distance to your partner. 10 overhead passes — both hands above the forehead, release out front, not behind the head. Focus on form, not speed.',
    cues: [
      'Step toward your target — every single pass',
      'Chest pass: thumbs rotate down on the follow-through',
      'Bounce pass: crisp and firm — aim for the receiving hand height',
      'Overhead: never bring the ball behind your head',
      'The receiver calls for the ball with a target hand',
    ],
    progression: 'Move partners further apart (15 feet, then 20 feet). Add movement: both partners shuffle while passing.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+passing+fundamentals+youth+beginners',
    tags: ['Passing', 'Beginner', 'Pairs', 'U8', 'U10'],
  },

  {
    id: 'pa-monkey-in-middle',
    name: 'Monkey in the Middle',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 8,
    playersNeeded: 'Groups of 3',
    level: 'Beginner',
    description: 'Two passers try to complete passes while one defender in the middle attempts deflections. Teaches pass fakes, quick release, and reading the defense — all in a fun competitive format.',
    setup: 'Three players in a line. Middle player is the "monkey" (defender).',
    instructions: 'Outside players pass back and forth. Middle defender tries to deflect or steal. Passers cannot hold the ball for more than 3 seconds. Rotate after 5 deflections or 1 minute. Count successful passes between deflections.',
    cues: [
      'Use pass fakes — make the defender move before you pass',
      'Quick release: catch and pass in one motion when open',
      'Look at the defender, not just your partner',
      'Bounce passes are harder to deflect — use them',
    ],
    progression: 'Reduce the passing distance. Middle defender can use their hands actively. Add a fourth player.',
    videoUrl: 'https://www.youtube.com/results?search_query=monkey+in+the+middle+basketball+passing+drill',
    tags: ['Passing', 'Beginner', 'Groups', 'U8', 'U10', 'Competitive'],
  },

  // ════════════════════════════════════════════
  // PASSING — INTERMEDIATE
  // ════════════════════════════════════════════

  {
    id: 'pa-star-passing',
    name: 'Star Passing Drill',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 10,
    playersNeeded: 'Groups of 5',
    level: 'Intermediate',
    description: 'Five players in a star pattern pass in a specific sequence that forces every player to pass across the star — not to the person next to them. Develops vision, timing, and awareness of the whole court.',
    setup: 'Five players at equal intervals around a circle (like a star shape), about 15 feet apart.',
    instructions: 'Player 1 passes to player 3 (skipping player 2). Player 3 passes to player 5. Player 5 to player 2. Player 2 to player 4. Player 4 back to player 1. Continuous. After 2 minutes, reverse the direction. Add a second ball.',
    cues: [
      'Anticipate your next pass before you receive the ball',
      'Be ready: hands up, feet ready to catch',
      'Don\'t watch the ball — watch your target',
      'Crisp passes — never lob it',
      'Two-ball variation: keep your head up to track both balls',
    ],
    progression: 'Add a defender in the middle. Move while passing (circle moves clockwise while players face center). Two balls.',
    videoUrl: 'https://www.youtube.com/results?search_query=star+passing+drill+basketball',
    tags: ['Passing', 'Intermediate', 'Groups'],
  },

  {
    id: 'pa-outlet-pass',
    name: 'Outlet Pass and Fill',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 10,
    playersNeeded: 'Groups of 4',
    level: 'Intermediate',
    description: 'Teaches the critical outlet pass after a defensive rebound — the first action that starts a fast break. Many young teams turn defense into offense slowly because the outlet pass is never practiced.',
    setup: 'Rebounder under the basket. Two wing players at the sidelines at half court. Point guard at center court.',
    instructions: 'Coach shoots. Rebounder grabs the ball and immediately outlets to the wing. Wing passes to the point guard who has sprinted to the outlet spot. Point guard pushes to the other end. Fast break finish. Rotate positions.',
    cues: [
      'Rebounder: chin the ball (tuck it high), pivot to the outside, outlet immediately',
      'Don\'t dribble before the outlet — the pass is faster',
      'Wing: be a target — call for the ball, give a target hand',
      'Point guard: sprint to get open for the outlet — don\'t stand',
      'Push pace after the outlet — attack before the defense sets',
    ],
    progression: 'Add a defender who tries to deny the outlet. 5-on-5 transition: defense rebounds and outlets into a live fast break.',
    videoUrl: 'https://www.youtube.com/results?search_query=outlet+pass+basketball+drill+fast+break',
    tags: ['Passing', 'Intermediate', 'Groups'],
  },

  {
    id: 'pa-skip-pass',
    name: 'Skip Pass and Relocate',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 10,
    playersNeeded: 'Groups of 4',
    level: 'Intermediate',
    description: 'Players practice the skip pass — a long diagonal pass across the court — and the shooter\'s relocation movement to get open for the catch-and-shoot opportunity.',
    setup: 'Four players at: left wing, right wing, left corner, right corner. One ball.',
    instructions: 'Left wing skip-passes to right corner. Right corner catch-and-shoot (or pass). Right wing skip-passes to left corner. Rotate. Each skip pass is preceded by a jab step fake to freeze the defense. Focus on the passer\'s accuracy and the receiver\'s movement.',
    cues: [
      'Skip pass: step into it, use your whole body — it\'s a long pass',
      'Throw it to where your teammate is going, not where they are',
      'Receiver: move your feet to get open before the pass arrives',
      'Catch balanced — the skip pass often arrives at speed',
      'Read the help defense — a skip pass means their help rotated',
    ],
    progression: 'Add help defenders who rotate on the skip. Full 4-on-4 with a skip-pass rule (must attempt at least one per possession).',
    videoUrl: 'https://www.youtube.com/results?search_query=skip+pass+basketball+drill',
    tags: ['Passing', 'Intermediate', 'Groups'],
  },

  // ════════════════════════════════════════════
  // PASSING — ADVANCED
  // ════════════════════════════════════════════

  {
    id: 'pa-no-look-series',
    name: 'No-Look Pass Series',
    category: 'passing',
    categoryColor: '#8B5CF6',
    durationMins: 12,
    playersNeeded: 'Groups of 3',
    level: 'Advanced',
    description: 'Develops the ability to pass without telegraphing the target — a crucial skill for guards and playmakers who face tight defensive pressure. Only for players who already have solid fundamental passing.',
    setup: 'Three players in a triangle formation, 12 feet apart.',
    instructions: 'Passer looks directly at player A while passing to player B. Four variations: (1) Head fake right, pass left. (2) Look high, bounce-pass low. (3) Full spin, pass behind back. (4) Drive and kick without looking at target. 5 reps each variation.',
    cues: [
      'Commit to the fake — look convincingly at the wrong target',
      'Your body should sell the fake, not just your head',
      'The no-look pass requires knowing where your teammate is before you receive',
      'Only use this when you have a clear read — a forced no-look is a turnover',
    ],
    progression: 'Add a defender on the passer. Live 3-on-2 with no-look pass requirement.',
    videoUrl: 'https://www.youtube.com/results?search_query=no+look+pass+basketball+drill+advanced',
    tags: ['Passing', 'Advanced', 'Groups'],
  },

  // ════════════════════════════════════════════
  // DEFENSE — BEGINNER
  // ════════════════════════════════════════════

  {
    id: 'df-stance-check',
    name: 'Defensive Stance Check',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 6,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players learn and hold the correct defensive stance — the single most important skill in all of individual defense. Without a proper stance, every other defensive concept is compromised.',
    setup: 'Players spread across the gym.',
    instructions: 'Coach calls "stance" and players freeze in their best defensive position. Coach walks around and physically adjusts: feet wider than shoulders, weight on the balls of feet, knees bent so you can\'t see your toes, back flat, arms out. Hold 30 seconds. Rest. Repeat 5 times.',
    cues: [
      'Feet wider than your shoulders — if you can see your feet, you\'re too narrow',
      'Sit in the chair — butt down, knees bent, like you\'re about to sit',
      'Back flat — not hunched, not upright',
      'Arms out wide, palms up — ready to deflect',
      'Weight on the BALLS of your feet — heels just barely off the ground',
    ],
    progression: 'Partner checks their teammate\'s stance. Stance hold under fatigue — hold after 5 sprints.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+defensive+stance+fundamentals+youth',
    tags: ['Defense', 'Beginner', 'Individual', 'U8', 'U10'],
  },

  {
    id: 'df-mirror-drill',
    name: 'Mirror Drill',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 8,
    playersNeeded: 'Pairs',
    level: 'Beginner',
    description: 'Pairs face each other. One player moves laterally, the other mirrors them. No ball needed. Develops defensive footwork, lateral speed, and hip positioning in a controlled environment.',
    setup: 'Partners facing each other, 3 feet apart, in a 10-foot wide lane.',
    instructions: 'Partner A is the offensive player — moves laterally within the lane. Partner B mirrors exactly — defensive slides, maintaining 3-foot distance and staying in front. 30 seconds on, switch roles. Key: B must stay in front of A at all times.',
    cues: [
      'Lead foot in the direction you\'re sliding — never cross your feet',
      'Stay low throughout — when you stand up, you lose',
      'React to hips, not shoulders — shoulders can fake, hips can\'t',
      'Never let your feet come together — keep them wide',
      'Quick shuffles, short steps — not long strides',
    ],
    progression: 'Partner A can change speeds — walking, jogging, sprinting. Add a jab step: partner must react without losing balance.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+mirror+drill+defense+youth',
    tags: ['Defense', 'Beginner', 'Pairs', 'U10'],
  },

  // ════════════════════════════════════════════
  // DEFENSE — INTERMEDIATE
  // ════════════════════════════════════════════

  {
    id: 'df-deny-drill',
    name: 'Deny Defense Drill',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 10,
    playersNeeded: 'Groups of 3',
    level: 'Intermediate',
    description: 'Teaches players to deny the ball to a player one pass away — one of the hardest defensive skills to develop at the youth level. Proper denial defense is what separates good defensive teams from great ones.',
    setup: 'Ball handler at the top of the key. Offensive player on the wing. Defender between the ball and the wing player.',
    instructions: 'Offensive wing tries to receive the ball. Defender denies: arm in the passing lane, ball-side foot forward, sees both ball and offensive player. Ball handler passes, drives, or holds for 10 seconds — defender must maintain denial position throughout. Switch roles every 2 minutes.',
    cues: [
      'Arm in the passing lane — the ball cannot fly through you',
      'See both ball and man: split-vision is a skill, practice it',
      'Ball-side foot and hand forward — parallel to the passing lane',
      'Move when the ball moves — your position must update on every dribble',
      'Don\'t watch only your man — watching only the ball is equally wrong',
    ],
    progression: 'Add movement: offensive player cuts along the arc while defender denies throughout. Live 1-on-1 with denial start.',
    videoUrl: 'https://www.youtube.com/results?search_query=basketball+deny+defense+drill+intermediate',
    tags: ['Defense', 'Intermediate', 'Groups'],
  },

  {
    id: 'df-1on1-competitive',
    name: '1-on-1 Competitive Defense',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 15,
    playersNeeded: 'Pairs',
    level: 'Intermediate',
    description: 'Live 1-on-1 where the defender earns points for stops and the offense earns points for scores. Competitive scoring changes the mindset — defense becomes something worth winning, not just something to survive.',
    setup: 'Pairs at each basket. Ball starts with the offense at the three-point line.',
    instructions: 'Offense has 5 seconds to score. Defender scores 1 point for each stop (forced miss + rebound, or turnover). Offense scores 1 point for each basket. Game to 5 points. Loser runs a sprint. Switch roles. Track who won each matchup.',
    cues: [
      'Defender: every stop is a point — compete for it',
      'Stay between the ball and the basket at all times',
      'Contest every shot — a defended miss is your win',
      'Force the ball handler to use their weak hand',
      'No reaching — contain with your feet, steal with positioning',
    ],
    progression: 'Start in help position (not on ball) — defender must close out before play begins. Full court 1-on-1.',
    videoUrl: 'https://www.youtube.com/results?search_query=1v1+competitive+defense+basketball+drill',
    tags: ['Defense', 'Intermediate', 'Pairs', 'Competitive'],
  },

  {
    id: 'df-2on2-rotation',
    name: '2-on-2 Defensive Rotation',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 12,
    playersNeeded: 'Groups of 4',
    level: 'Intermediate',
    description: 'Two defenders learn to communicate and rotate on penetration — the most important defensive concept beyond individual on-ball defense. Every team defense breaks down here first.',
    setup: 'Two offensive players at the wing and corner. Two defenders in correct positions on half court.',
    instructions: 'Wing drives hard into the lane. On-ball defender contains. Help defender must rotate to stop the drive. Wing dumps to corner — corner defender must close out hard. Play it live for 10 seconds. Track stops vs. baskets.',
    cues: [
      'Help defender: call "help!" before you rotate',
      'Rotate on the drive, not on the pass — be early',
      'On-ball defender: after the help comes, recover to your man',
      'Communication: "ball!" "help!" "I\'ve got you!" always talking',
      'Corner defender: sprint the closeout — jog is a made shot',
    ],
    progression: '3-on-3 with the same rotation principles. Add a third defensive concept (weak-side help).',
    videoUrl: 'https://www.youtube.com/results?search_query=2v2+defensive+rotation+basketball+drill',
    tags: ['Defense', 'Intermediate', 'Groups'],
  },

  // ════════════════════════════════════════════
  // DEFENSE — ADVANCED
  // ════════════════════════════════════════════

  {
    id: 'df-charge-drill',
    name: 'Taking a Charge',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 10,
    playersNeeded: 'Pairs',
    level: 'Advanced',
    description: 'One of the most impactful defensive plays a team can make — taking a charge. This drill teaches the proper technique for getting into position, absorbing contact, and selling the call safely.',
    setup: 'Defender starts under the basket. Offensive player at the free throw line with a ball.',
    instructions: 'Defender sprints to establish legal guarding position (both feet set, outside the restricted area). Offensive player drives hard. Defender holds position, absorbs contact, and falls backward safely — controlled fall to the side, never backward onto your spine. Must be set BEFORE the offensive player leaves the ground. 10 reps each role.',
    cues: [
      'Get your feet set before the offensive player leaves the floor — that is the rule',
      'Stay outside the restricted area under the basket',
      'Absorb the contact — don\'t lean in, let them come to you',
      'Fall backward and to the side — protect your head',
      'Hold the ball up after falling — show the official you didn\'t reach',
    ],
    progression: 'Start from help position — defender must rotate and set in time. Add a second offensive player as a screener.',
    videoUrl: 'https://www.youtube.com/results?search_query=taking+a+charge+basketball+drill+technique',
    tags: ['Defense', 'Advanced', 'Pairs'],
  },

  {
    id: 'df-scramble-drill',
    name: 'Scramble Defense',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 12,
    playersNeeded: 'Groups of 6',
    level: 'Advanced',
    description: 'Defensive players start in scrambled positions (wrong matchups, out of position) and must communicate and sort out coverage in live play. Simulates broken defensive situations that happen constantly in games.',
    setup: '3 offense vs 3 defense. Defense starts in random positions — each defender is guarding the wrong player.',
    instructions: 'Coach yells "GO" — offense attacks immediately. Defense must communicate and sort out coverage in real time while preventing a basket. No stopping the drill to organize. Track stops vs. baskets.',
    cues: [
      'Call out who you\'re guarding immediately — "I\'ve got 3!"',
      'Stop the ball first — figure out matchups after',
      'In chaos, take the closest threat',
      'Never argue about matchups during the possession — settle after',
      'This will be messy — embrace it, it\'s the whole point',
    ],
    progression: '4-on-4 scramble. Offense can substitute players mid-possession. Start with defense outnumbered.',
    videoUrl: 'https://www.youtube.com/results?search_query=scramble+defense+basketball+drill',
    tags: ['Defense', 'Advanced', 'Groups', 'Competitive'],
  },

  // ════════════════════════════════════════════
  // CONDITIONING — VARIETY
  // ════════════════════════════════════════════

  {
    id: 'co-17s',
    name: '17s (Court Sprints)',
    category: 'conditioning',
    categoryColor: '#F5B731',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description: 'The classic basketball conditioning test. Players run sideline to sideline 17 times in under 60 seconds. Tests pure basketball conditioning and mental toughness.',
    setup: 'Full team on the baseline. Timer ready.',
    instructions: 'Players sprint from sideline to sideline. Count each sideline touch as one rep. Complete 17 reps in under 60 seconds (adjust time based on age group — use 75 seconds for younger players). Rest 90 seconds. Repeat 3 times. Track completion times.',
    cues: [
      'Touch the line — every single time',
      'Maintain pace — don\'t sprint the first 5 and walk the last 5',
      'Breathe — don\'t hold your breath on the turns',
      'Drive off the outside foot on each turn',
      'The last 3 reps separate the mentally tough from everyone else',
    ],
    progression: 'Reduce the time limit by 2 seconds each week. Hold a ball while running. Run against a partner.',
    videoUrl: 'https://www.youtube.com/results?search_query=17s+basketball+conditioning+drill',
    tags: ['Conditioning', 'Intermediate', 'Full Team', 'Competitive'],
  },

  {
    id: 'co-full-court-layups',
    name: 'Full Court Continuous Layups',
    category: 'conditioning',
    categoryColor: '#F5B731',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description: 'Players run full court, make a layup, sprint back, make a layup from the other side — continuously for a set time. Combines conditioning with finishing under fatigue.',
    setup: 'Players split evenly at each end of the court.',
    instructions: 'Player 1 sprints from baseline to baseline and makes a right-hand layup. Immediately sprints back and makes a left-hand layup. Continuous for 3 minutes. Count makes. Rest 1 minute. Repeat. Goal: 15 made layups in 3 minutes.',
    cues: [
      'Sprint the full length — not just jog',
      'The tired layup is the one that matters — make it',
      'Don\'t slow down approaching the basket',
      'Alternate hands — right going up the right side, left going up the left',
    ],
    progression: 'Add a passer who feeds from the three-point line. Catch in stride and finish. Team goal: 60 combined makes in 3 minutes.',
    videoUrl: 'https://www.youtube.com/results?search_query=full+court+continuous+layups+basketball+conditioning',
    tags: ['Conditioning', 'Beginner', 'Full Team'],
  },

  {
    id: 'co-defensive-slides-length',
    name: 'Defensive Slides Full Court',
    category: 'conditioning',
    categoryColor: '#F5B731',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description: 'Full court defensive slides in all directions. The best conditioning drill for building both lateral quickness and the cardiovascular endurance needed to defend for a full game.',
    setup: 'Players on the baseline in defensive stance.',
    instructions: 'Slide right to the sideline — stay low. Sprint to the far free throw line. Slide left to the other sideline. Sprint to the far baseline. Slide back right. Sprint back. One full circuit is one rep. 5 reps. Rest 1 minute. Repeat.',
    cues: [
      'Stay in defensive stance throughout the slides — don\'t stand up',
      'Quick shuffle steps — not long strides',
      'Sprint is a full sprint — don\'t coast',
      'Every sprint is game speed — you defend like you practice',
    ],
    progression: 'Add a ball that you must pass and receive during the sprints. Add a coach with a ball who signals direction changes during slides.',
    videoUrl: 'https://www.youtube.com/results?search_query=defensive+slides+full+court+basketball+conditioning',
    tags: ['Conditioning', 'Intermediate', 'Full Team'],
  },

  {
    id: 'co-two-ball-layups',
    name: 'Two-Ball Continuous Finishing',
    category: 'conditioning',
    categoryColor: '#F5B731',
    durationMins: 10,
    playersNeeded: 'Groups of 3',
    level: 'Advanced',
    description: 'Two passers keep a player moving and finishing continuously — no rest between shots. Builds finishing under extreme fatigue while developing touch on the move.',
    setup: 'One finisher. Two passers — one on each wing with a ball.',
    instructions: 'Finisher starts under the basket. Passer 1 feeds from the right wing — finisher catches and lays up. Before the ball goes through the net, passer 2 feeds from the left wing. Finisher sprints to catch the next pass and finishes. Continuous for 45 seconds. Rest 30 seconds. 4 rounds.',
    cues: [
      'Sprint to every ball — no walking between finishes',
      'Make the shot count: lay it in, don\'t just throw it at the rim',
      'Switch hands correctly: right side = right hand, left side = left hand',
      'This will burn — lean into the fatigue',
    ],
    progression: 'Add a third ball from the top of the key (pull-up). Replace easy layups with euro-steps or floaters.',
    videoUrl: 'https://www.youtube.com/results?search_query=two+ball+continuous+finishing+basketball+drill',
    tags: ['Conditioning', 'Advanced', 'Groups'],
  },

  {
    id: 'co-reaction-sprints',
    name: 'Reaction Sprint Drill',
    category: 'conditioning',
    categoryColor: '#F5B731',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description: 'Players react to visual or audio signals and sprint in the called direction. Develops first-step quickness, reaction time, and the mental edge needed to beat opponents off the dribble.',
    setup: 'Players in pairs, facing each other across a line. Coach with a signal (clap, color call, directional gesture).',
    instructions: 'On the signal: sprint in the called direction (left, right, backward, forward) for 5 yards. Players race to see who reacts first. Rest 15 seconds between signals. 10 signals per pair. Track wins.',
    cues: [
      'Stay in athletic stance — flat-footed players react a half-second slower',
      'Eyes on the signal source — don\'t anticipate',
      'First step is everything — explosive push off the back foot',
      'Stay low in the first two steps — upright = slow',
    ],
    progression: 'Longer sprints (10 yards). Add a ball to dribble during the sprint. Three-direction choices instead of two.',
    videoUrl: 'https://www.youtube.com/results?search_query=reaction+sprint+drill+basketball+agility',
    tags: ['Conditioning', 'Intermediate', 'Full Team', 'Competitive'],
  },

  // ════════════════════════════════════════════
  // TEAM PLAY — SCRIMMAGE FORMATS
  // ════════════════════════════════════════════

  {
    id: 'tp-no-dribble-scrimmage',
    name: 'No-Dribble Scrimmage',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 15,
    playersNeeded: '6-10 players',
    level: 'Intermediate',
    description: 'Full scrimmage with no dribbling allowed. Forces every player to move without the ball, pass quickly, and find open teammates. The most effective drill for developing team offense and off-ball movement.',
    setup: 'Full 5-on-5 half court. Standard rules except no dribbling.',
    instructions: 'Play live 5-on-5. No dribbles allowed — catch and immediately pass or shoot. Any dribble turns over the ball. Defense plays live. Play to 7 baskets or 8 minutes.',
    cues: [
      'You MUST move before you receive — no standing still waiting for the ball',
      'Every catch is immediately a decision: shoot or pass',
      'Screen for teammates — creates open catches',
      'Spacing is everything — don\'t bunch up',
      'Basketball is meant to be played this way — passing and moving',
    ],
    progression: 'One dribble allowed (drives must be set up). Two-dribble max. Full court no-dribble.',
    videoUrl: 'https://www.youtube.com/results?search_query=no+dribble+scrimmage+basketball+drill',
    tags: ['Team Play', 'Intermediate', 'Full Team', 'Scrimmage'],
  },

  {
    id: 'tp-make-it-take-it',
    name: 'Make It Take It',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 20,
    playersNeeded: '6-10 players',
    level: 'Intermediate',
    description: 'The team that scores keeps the ball. Rewards offensive execution and urgency while creating pressure situations that simulate real game conditions.',
    setup: '5-on-5 or 4-on-4. Half court. Standard rules.',
    instructions: 'Score = keep the ball. Miss or turnover = defense gets possession and attacks the other way (if full court) or clears past the three-point line (half court). Play for 15 minutes continuous. Track team wins.',
    cues: [
      'Offense: share the ball — selfish offense loses possession',
      'Defense: a stop IS an offensive possession — defend with urgency',
      'Transition quickly: offense to defense instantly on a miss',
      'Consecutive scores build momentum — stay sharp after making one',
    ],
    progression: 'Must score on two consecutive possessions to keep it. Add a shot clock.',
    videoUrl: 'https://www.youtube.com/results?search_query=make+it+take+it+basketball+scrimmage',
    tags: ['Team Play', 'Intermediate', 'Full Team', 'Scrimmage', 'Competitive'],
  },

  {
    id: 'tp-4on4-no-middle',
    name: '4-on-4 No Middle',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 15,
    playersNeeded: '8 players',
    level: 'Intermediate',
    description: 'Defensive constraint scrimmage where the defense must force all penetration to the sideline — never allowing a drive through the lane. Teaches specific defensive principles while keeping play competitive.',
    setup: '4-on-4 half court. Defense must force baseline on ball-side.',
    instructions: 'Defense plays with a rule: any drive through the lane earns the offense 2 points automatically. Defense must force ball handlers to the sideline. Offense plays normal. First to 10 points wins.',
    cues: [
      'Defense: cut off the middle every single time',
      'On-ball defender: shade toward the middle to force baseline',
      'Help defender: anticipate the baseline drive and be ready',
      'Offense: attack the middle immediately — exploit any lapse',
      'Communication: "force right!" "force left!" before every catch',
    ],
    progression: 'Flip it: force middle (more advanced). Add a post player. 5-on-5 full court with the same constraint.',
    videoUrl: 'https://www.youtube.com/results?search_query=4v4+no+middle+basketball+drill',
    tags: ['Team Play', 'Intermediate', 'Groups', 'Scrimmage'],
  },

  {
    id: 'tp-5on5-live',
    name: '5-on-5 Live with Constraints',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 20,
    playersNeeded: '10 players',
    level: 'Advanced',
    description: 'Full 5-on-5 scrimmage with rotating offensive and defensive constraints that force players to execute specific skills in live conditions. Better than free scrimmage because every possession has a teaching purpose.',
    setup: 'Full 5-on-5 half court or full court.',
    instructions: 'Coach announces a constraint at the start of each 4-minute segment. Examples: (1) Offense must make 3 passes before shooting. (2) Must score off a ball screen. (3) All scores must be assisted. (4) Defense plays zone only. (5) First team to score wins the possession (both teams attack opposite ends simultaneously). Track wins per constraint.',
    cues: [
      'The constraint forces you to do what you avoid — that\'s the point',
      'Execute within the constraint AND play to win',
      'Coaches: point out when players ignore the constraint',
      'Reward teams who execute the constraint correctly even if they don\'t score',
    ],
    progression: 'Players call their own constraints. Two constraints simultaneously. Live game with no constraints — apply all habits naturally.',
    videoUrl: 'https://www.youtube.com/results?search_query=constrained+scrimmage+basketball+coaching',
    tags: ['Team Play', 'Advanced', 'Full Team', 'Scrimmage'],
  },

  {
    id: 'tp-transition-3s',
    name: 'Transition 3-on-3',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 15,
    playersNeeded: '6-9 players',
    level: 'Intermediate',
    description: 'Fast-paced 3-on-3 that emphasizes transition — both attacking and getting back on defense. Develops quick decision-making, spacing in small-sided play, and defensive transition effort.',
    setup: 'Three teams of three. Two teams play, one waits on the sideline.',
    instructions: 'Two teams play 3-on-3 to 5 points. Losing team goes to the sideline, winning team stays, waiting team enters as defense. Points scored from beyond the three-point arc count as 2. Points inside count as 1. Each game is played on a shot clock (10 seconds after crossing half court).',
    cues: [
      'Attack fast: 3-on-3 favors the offense when you push pace',
      'Defense: sprint back — one missed transition means an easy basket',
      'Space the floor: don\'t bunch, give each other room to operate',
      'Make the right play: skip the fancy when the simple is open',
    ],
    progression: 'Reduce to 2-on-2. Add a rule: the passer from the previous possession must sprint to half court before the new team crosses it.',
    videoUrl: 'https://www.youtube.com/results?search_query=transition+3v3+basketball+drill',
    tags: ['Team Play', 'Intermediate', 'Groups', 'Competitive'],
  },

  {
    id: 'tp-cutthroat',
    name: 'Cutthroat (3-Team)',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 20,
    playersNeeded: '9-12 players',
    level: 'Intermediate',
    description: 'Three teams rotating: winning team stays, scoring team attacks the waiting team, losing team waits. Continuous action that rewards good execution and punishes mistakes with extended rest.',
    setup: 'Three teams of 3 or 4 players. Half court.',
    instructions: 'Team A vs Team B. Team C waits at half court. If A scores, A stays and plays C. B rests. If B scores, B stays and plays C. A rests. If C scores on the first possession after rotation, C stays. First team to win 5 consecutive possession wins the round.',
    cues: [
      'The team on the sideline is always recovering — use the time well',
      'When you enter fresh against a tired team — attack immediately',
      'Winning team: stay sharp — the new team is hungry',
      'Every possession matters — fatigue is a choice',
    ],
    progression: 'Full court. Four teams. Time limit per possession (8 seconds).',
    videoUrl: 'https://www.youtube.com/results?search_query=cutthroat+basketball+drill+3+teams',
    tags: ['Team Play', 'Intermediate', 'Full Team', 'Competitive'],
  },

];

// ════════════════════════════════════════════
// PRACTICE GAMES — EXPANDED
// ════════════════════════════════════════════

export interface PracticeGame {
  id: string;
  name: string;
  category: 'ballhandling' | 'shooting' | 'competitive' | 'warmup' | 'team' | 'defense';
  categoryColor: string;
  durationMins: number;
  playersMin: number;
  playersMax: number;
  energyLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  skillFocus: string[];
  description: string;
  setup: string;
  howToPlay: string;
  coachingTips: string[];
  variations?: string[];
  ageMin?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
}

export const PRACTICE_GAMES_EXPANDED: PracticeGame[] = [

  {
    id: 'pg-dribble-knockout',
    name: 'Dribble Knockout',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 10,
    playersMin: 6,
    playersMax: 20,
    energyLevel: 'Very High',
    skillFocus: ['Ball Handling', 'Ball Protection', 'Awareness'],
    description: 'All players dribble simultaneously in a designated area and try to knock others\' balls out while protecting their own. Last player dribbling wins. Teaches ball protection and spatial awareness in a highly competitive format.',
    setup: 'Define the playing area — usually within the three-point arc for 8-12 players, or the key area for fewer. All players have a ball.',
    howToPlay: 'On the coach\'s signal, all players try to knock others\' balls out of the area while keeping their own dribble alive. If your ball is knocked out or you step out of bounds, you\'re eliminated. Eliminated players stand on the sideline. Last dribbler standing wins.',
    coachingTips: [
      'Shrink the area as players are eliminated — keeps intensity high',
      'Require weak-hand dribbling for advanced players',
      'Defenders must stay low — no reaching from a standing position',
      'Have eliminated players count the remaining players aloud — keeps them engaged',
    ],
    variations: [
      'Two-ball knockout: every player dribbles two balls — knocked out if either ball leaves the area',
      'Zombie knockout: eliminated players re-enter after 10 seconds with only their weak hand',
    ],
    level: 'All levels',
  },

  {
    id: 'pg-dribble-freeze-tag',
    name: 'Dribble Freeze Tag',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersMin: 8,
    playersMax: 20,
    energyLevel: 'Very High',
    skillFocus: ['Ball Handling', 'Movement', 'Awareness'],
    description: 'A basketball twist on the classic freeze tag. Players dribble continuously — if tagged, they freeze. Teammates unfreeze them by dribbling through their legs. Great high-energy warmup that kids love.',
    setup: 'Half court or full court. 2-3 players are "it" and do not have basketballs.',
    howToPlay: 'All players except the taggers dribble continuously. Taggers chase dribblers. If tagged, the player freezes in place holding their ball overhead. A teammate unfreezes them by passing the ball through their legs. If all players are frozen, taggers win. Swap taggers every 2 minutes.',
    coachingTips: [
      'Players cannot stop dribbling even while being chased',
      'Reinforce that unfreezing a teammate is the selfless play',
      'Taggers must stay low and move athletically — makes them work too',
    ],
    variations: [
      'Tag only with weak hand (forces defensive movement with non-dominant hand)',
    ],
    level: 'Beginner',
    ageMin: 6,
  },

  {
    id: 'pg-red-light-green-light',
    name: 'Red Light Green Light (Dribbling)',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersMin: 6,
    playersMax: 20,
    energyLevel: 'Medium',
    skillFocus: ['Ball Control', 'Stopping', 'Starting'],
    description: 'The classic childhood game adapted for basketball. Teaches players to start and stop on command while maintaining a dribble — a fundamental skill for young players.',
    setup: 'Players in a line at the baseline, each with a ball. Coach at the far baseline.',
    howToPlay: 'Green light: players dribble forward. Red light: players must stop immediately and hold their dribble (keep dribbling in place). Yellow light: slow dribble forward. Any player who moves on red light goes back to the baseline. First to reach the far baseline wins.',
    coachingTips: [
      'Call colors quickly to keep players on their toes',
      'Check that players are actually stopping — don\'t let them drift forward',
      'Great for teaching controlled starts and stops',
    ],
    level: 'Beginner',
    ageMin: 6,
  },

  {
    id: 'pg-bull-in-ring',
    name: 'Bull in the Ring',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 10,
    playersMin: 6,
    playersMax: 12,
    energyLevel: 'High',
    skillFocus: ['Defense', 'Ball Pressure', '1-on-1'],
    description: 'One defensive player in the middle of a circle of offensive players. The offensive players pass the ball around — the defender tries to deflect or steal. Teaches active on-ball defense and helps players get comfortable with pressure.',
    setup: 'Offensive players form a circle 10-12 feet in diameter. One defender in the middle.',
    howToPlay: 'Offensive players pass around the circle (chest, bounce, skip passes). The defender tries to deflect or intercept. Each deflection/steal earns the defender a point. After 60 seconds or 3 steals, rotate the defender. The defender with the most points wins.',
    coachingTips: [
      'Defender must stay active — arms out, moving continuously',
      'Offensive players: use fakes before passing',
      'Don\'t make it too easy — the game teaches both offense and defense',
      'Celebrate deflections loudly — changes how players view defense',
    ],
    variations: [
      'Two bulls: makes offense and defense both harder',
      'No bounce passes allowed — forces overhead and chest passes only',
    ],
    level: 'All levels',
  },

  {
    id: 'pg-21-cones',
    name: '21 (No Cones Version)',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersMin: 2,
    playersMax: 6,
    energyLevel: 'Medium',
    skillFocus: ['Shooting', 'Free Throws', 'Strategy'],
    description: 'Classic shooting game where players shoot a long shot and a free throw per turn. Score adds up — must reach exactly 21 to win. Going over resets you. Teaches strategic shot selection and free throw pressure.',
    setup: 'One ball per basket. Players in a line.',
    howToPlay: 'Each player shoots from a designated long-shot spot (3-point line or mid-range). If made (2 pts), immediately shoot a free throw (1 pt). If long shot missed, no free throw. Keep running score. First to reach exactly 21 wins. Going over 21 resets to 11.',
    coachingTips: [
      'Near 21, players choose low-value shots to avoid busting — teach strategy',
      'The pressure of needing an exact number teaches composure',
      'Use as a fun way to practice free throw routine under pressure',
    ],
    variations: [
      '3-point version: long shot = 3 pts, free throw = 1 pt',
      'Team 21: partners combine scores to reach 21',
    ],
    level: 'Intermediate',
  },

  {
    id: 'pg-world-war-3',
    name: 'World War 3 (Rebound War)',
    category: 'competitive',
    categoryColor: '#8B5CF6',
    durationMins: 12,
    playersMin: 4,
    playersMax: 12,
    energyLevel: 'Very High',
    skillFocus: ['Rebounding', 'Toughness', 'Post Play'],
    description: 'All players battle for rebounds simultaneously. No team, no sides — every player for themselves. Teaches rebounding position, physicality, and the relentlessness required to be a good rebounder.',
    setup: 'All players around the paint. Coach with the ball at the free throw line.',
    howToPlay: 'Coach shoots (intentional miss). All players battle for the rebound. Player who gets the rebound scores 1 point and immediately puts it up. If made, they get the ball back for one free shot. Miss or turnover — throw it back to coach, battle again. First to 5 points wins.',
    coachingTips: [
      'Teach box-out position before starting — otherwise it becomes pure chaos',
      'Physicality is expected — players must learn to play through contact',
      'The player who goes hardest for the ball usually gets it — reinforce effort',
      'Post players should dominate this — gives them confidence',
    ],
    variations: [
      '2-on-2 Rebound War: teams of 2 battle each other for the rebound',
    ],
    level: 'Intermediate',
  },

  {
    id: 'pg-horse',
    name: 'H-O-R-S-E',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 15,
    playersMin: 2,
    playersMax: 5,
    energyLevel: 'Low',
    skillFocus: ['Shooting', 'Creativity', 'Pressure'],
    description: 'The classic creative shooting game. Make a shot, your opponent must match it or get a letter. Teaches shooting from unusual spots and develops imagination in attacking the basket.',
    setup: 'One ball per basket. Players decide shooting order.',
    howToPlay: 'Player 1 makes any shot from anywhere on the court. Player 2 must match it exactly (same spot, same style). Fail to match = earn a letter (H-O-R-S-E). If player 1 misses their own attempt, it\'s player 2\'s turn to set a shot. First player to spell H-O-R-S-E is out.',
    coachingTips: [
      'Encourage creative shots — banks, floaters, reverse layups',
      'Young players love choosing weird spots — let them, it builds confidence',
      'Use to cool down after hard practice — low energy, fun, still shooting',
    ],
    variations: [
      'P-I-G: shorter game for time constraints',
      'Rules HORSE: every shot must be a game-realistic shot from a normal spot',
    ],
    level: 'All levels',
  },

  {
    id: 'pg-two-ball-rebounding',
    name: 'Two-Ball Rebounding Race',
    category: 'competitive',
    categoryColor: '#8B5CF6',
    durationMins: 8,
    playersMin: 4,
    playersMax: 10,
    energyLevel: 'High',
    skillFocus: ['Rebounding', 'Conditioning', 'Finishing'],
    description: 'Two balls on the floor under the basket. Two players race to get a ball, finish a layup, and race back. Develops rebounding aggression, finishing under pressure, and conditioning.',
    setup: 'Two balls placed on the floor at the block positions. Players in pairs, starting at the three-point line.',
    howToPlay: 'On coach\'s signal, both players sprint to a ball, grab it, and finish a layup. After making the layup (must make it — keep shooting until made), sprint back to the start. First back wins. Losers do 5 push-ups. Switch partners every 3 rounds.',
    coachingTips: [
      'Must make the layup — don\'t allow players to give up on it',
      'Teach proper pivot footwork when picking up a live ball',
      'Race element creates real game-like urgency',
    ],
    level: 'Intermediate',
  },

  {
    id: 'pg-simon-says-defense',
    name: 'Simon Says Defense',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 8,
    playersMin: 6,
    playersMax: 20,
    energyLevel: 'Medium',
    skillFocus: ['Defensive Stance', 'Reaction', 'Focus'],
    description: 'Simon Says but with defensive movements. Makes learning proper defensive footwork fun and competitive for younger players who don\'t yet have the attention span for pure instruction.',
    setup: 'Players spread in the gym, each in defensive stance.',
    howToPlay: 'Coach is Simon. "Simon says slide left" — players slide left. "Simon says close out" — players sprint and close out. Commands without "Simon says" — players who move are out. Last player standing wins.',
    coachingTips: [
      'Use all defensive movements: slides, closeouts, drop steps, sprint back',
      'Speed up the commands as the group gets smaller',
      'Great for U8-U10 — they love the game format',
    ],
    level: 'Beginner',
    ageMin: 6,
  },

  {
    id: 'pg-attack-the-rim',
    name: 'Attack the Rim (Finishing Contest)',
    category: 'competitive',
    categoryColor: '#8B5CF6',
    durationMins: 12,
    playersMin: 4,
    playersMax: 12,
    energyLevel: 'High',
    skillFocus: ['Finishing', 'Contact', 'Toughness'],
    description: 'Players drive to the basket from various spots and finish through or around a pad-holding defender. Makes contact finishing fun and builds the toughness needed to score in traffic.',
    setup: 'Coach or designated player holds a large pad at the basket. Players in a line at the elbow.',
    howToPlay: 'Player drives hard from the elbow to the basket. Pad holder bumps them on the way up (not a foul, just contact). Player must finish the shot. Miss = back of the line. Make = 1 point. First to 5 points wins the round. Rotate who holds the pad.',
    coachingTips: [
      'The contact is simulated game contact — not trying to hurt anyone',
      'Celebrate finishes through contact — that\'s the whole point',
      'Teach players to keep their eyes on the target, not the defender',
      'Work both hands equally',
    ],
    variations: [
      'Floater contest: must finish with a floater, no full layups allowed',
      'Euro-step contest: must use a euro-step to avoid the pad',
    ],
    level: 'Intermediate',
  },

  {
    id: 'pg-pass-to-score',
    name: 'Pass to Score',
    category: 'team',
    categoryColor: '#FB923C',
    durationMins: 15,
    playersMin: 6,
    playersMax: 12,
    energyLevel: 'High',
    skillFocus: ['Passing', 'Team Offense', 'Movement'],
    description: 'Every basket must be assisted — no unassisted scores count. Forces players to share the ball and builds team chemistry. One of the best team-building games in all of basketball.',
    setup: '3-on-3 or 4-on-4 half court. Standard rules except all baskets must be assisted.',
    howToPlay: 'Play live basketball. Any score that is not immediately preceded by a pass is worth 0 points. Only assisted baskets count (1 point each). Teams keep track of their own score. First to 7 assisted baskets wins.',
    coachingTips: [
      'Players will try to dribble-drive and score alone — it won\'t count',
      'Passing becomes the most important skill immediately',
      'Watch how quickly team movement and cutting improves',
      'Celebrate assists as loudly as makes',
    ],
    level: 'Intermediate',
  },

];

// ════════════════════════════════════════════
// PLAYS — EXPANDED
// ════════════════════════════════════════════

export interface PlayExpanded {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  difficulty: 'beg' | 'int' | 'adv';
  type: string;
  description: string;
  teachingKeys: string[];
  steps: { order: number; description: string }[];
  suggestedDurationMins: number;
  videoUrl?: string;
}

export const PLAYS_EXPANDED: PlayExpanded[] = [

  {
    id: 'pl-dho-action',
    name: 'Dribble Hand-Off (DHO)',
    category: 'halfcourt',
    categoryColor: '#3A86FF',
    difficulty: 'beg',
    type: 'Basic Action',
    suggestedDurationMins: 12,
    description: 'The dribble hand-off is one of the most versatile and teachable actions in basketball. A ballhandler dribbles toward a teammate and hands them the ball — the receiver can shoot, drive, or read further. Great for young teams because it\'s simple but effective.',
    teachingKeys: [
      'The dribbler must come toward the receiver — not wait for them to come to you.',
      'Hand off at chest height with a firm grip — don\'t drop it or float it.',
      'Receiver reads the defender: if the defender goes over, shoot. If they go under, drive.',
      'After the hand-off, the original dribbler screens the receiver\'s defender — set a legal screen.',
      'This action creates a natural ball screen situation — read it the same way.',
    ],
    steps: [
      { order: 1, description: '1 dribbles toward 2 on the wing with pace.' },
      { order: 2, description: '2 comes toward 1 to receive the hand-off at the elbow.' },
      { order: 3, description: '1 hands the ball to 2 and immediately sets a screen on 2\'s defender.' },
      { order: 4, description: '2 reads the screen: shoot off the hand-off if the defender goes under.' },
      { order: 5, description: 'Or 2 drives off 1\'s screen if the defender fights over it.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=dribble+hand+off+basketball+youth+coaching',
  },

  {
    id: 'pl-elbow-series',
    name: 'Elbow Series (Read & React)',
    category: 'halfcourt',
    categoryColor: '#3A86FF',
    difficulty: 'int',
    type: 'Read and React',
    suggestedDurationMins: 15,
    description: 'The ball is entered to the elbow. The post player at the elbow reads three options: score, pass to cutter, or kick to shooter. This teaches players the basic read-and-react principles used at every level of the game.',
    teachingKeys: [
      'The elbow player must face up immediately on the catch — shoulders square to the basket.',
      'Read 1: can I score? Quick pull-up jumper from the elbow.',
      'Read 2: did my cutter get open? Feed the cutter on a diagonal cut.',
      'Read 3: is the corner open? Skip to the corner shooter.',
      'Never force a read — take what\'s given.',
    ],
    steps: [
      { order: 1, description: '1 passes to 4 at the elbow area. 4 catches facing the basket.' },
      { order: 2, description: '2 cuts hard to the basket from the weak-side wing.' },
      { order: 3, description: '4 reads: if 2 is open, feed the cutter for a layup.' },
      { order: 4, description: 'If 2 is not open, 4 reads the pull-up opportunity.' },
      { order: 5, description: 'If neither is available, 4 kicks to 3 in the corner for an open three.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=elbow+series+basketball+read+react',
  },

  {
    id: 'pl-elevator-screen',
    name: 'Elevator Screen',
    category: 'halfcourt',
    categoryColor: '#3A86FF',
    difficulty: 'adv',
    type: 'Off-Ball Action',
    suggestedDurationMins: 15,
    description: 'Two players set staggered screens that close ("elevate") around a cutting shooter, trapping the defender inside and creating a wide-open three-point shot. Used extensively in the modern NBA and effective at all competitive levels.',
    teachingKeys: [
      'The two screeners must time their screens to close simultaneously — like elevator doors closing.',
      'The shooter must make their cut read the defender\'s position before using the screens.',
      'Timing is everything: the shooter walks in, then cuts at full speed when the doors are about to close.',
      'Passer must be patient — hold the ball until the shooter clears the screens completely.',
      'If the defense switches, the shooter must recognize it and counter with a quick shot or drive.',
    ],
    steps: [
      { order: 1, description: '4 and 5 set up on opposite sides of the lane, inside the paint.' },
      { order: 2, description: '2 starts on the weak-side wing and times their cut toward the paint.' },
      { order: 3, description: '2 walks their defender into the lane — getting them to follow.' },
      { order: 4, description: '4 and 5 close together simultaneously like elevator doors, trapping the defender inside.' },
      { order: 5, description: '2 cuts out to the three-point line. 1 hits 2 for an open three-pointer.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=elevator+screen+basketball+play',
  },

  {
    id: 'pl-secondary-break',
    name: 'Secondary Break',
    category: 'transition',
    categoryColor: '#F7620A',
    difficulty: 'int',
    type: 'Transition Offense',
    suggestedDurationMins: 15,
    description: 'When the primary fast break doesn\'t produce a basket, the secondary break is the offense that attacks before the defense fully sets. Attacks the moments right after the initial transition — most teams are vulnerable during this window.',
    teachingKeys: [
      'The secondary break happens in the 3-5 seconds after the primary fast break is stopped.',
      'The trailer (5) fills the high post — this is the key position.',
      'Wings must space to the corners immediately — don\'t stop in the paint.',
      'If 5 catches at the high post, they have four options: score, drive, kick to corner, or reset.',
      'Attack with purpose: the defense is still disorganized, don\'t let them set.',
    ],
    steps: [
      { order: 1, description: 'Primary break stops — 1 pulls up at the three-point line, no layup available.' },
      { order: 2, description: '2 and 3 have filled the wings. 4 and 5 trail and fill the high post and corner.' },
      { order: 3, description: '1 passes to 5 at the high post — 5 faces up quickly.' },
      { order: 4, description: '4 dives to the opposite block. 2 and 3 space to the corners.' },
      { order: 5, description: '5 makes the read: drive, kick to corner, or feed 4 on the block.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=secondary+break+basketball+offense',
  },

  {
    id: 'pl-transition-defense',
    name: 'Transition Defense (Get Back)',
    category: 'defense',
    categoryColor: '#22C55E',
    difficulty: 'beg',
    type: 'Defensive Concept',
    suggestedDurationMins: 12,
    description: 'The principles of getting back on defense after a shot is taken. Most easy baskets come from transition — teaching your team to get back immediately transforms your defense more than any set scheme.',
    teachingKeys: [
      'On every shot, two players must sprint back immediately before the shot goes through the net.',
      'The two guards sprint to the free throw line extended on their respective sides.',
      'Sprint back straight, not diagonally — protect the paint first.',
      'Never watch your own shot — if you can shoot it, you can sprint back.',
      'A team that consistently gets back will give up dramatically fewer easy baskets.',
    ],
    steps: [
      { order: 1, description: '1 or 2 takes a shot or the team turns it over.' },
      { order: 2, description: 'Two designated players (usually guards) sprint to the defensive free throw line immediately.' },
      { order: 3, description: 'They position at each elbow, ready to stop any fast break.' },
      { order: 4, description: 'The three remaining players follow at pace — not sprinting, but not walking.' },
      { order: 5, description: 'Defense is fully set within 3 seconds of the shot — no transition basket allowed.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=transition+defense+basketball+get+back',
  },

  {
    id: 'pl-early-offense',
    name: 'Early Offense (Push)',
    category: 'transition',
    categoryColor: '#F7620A',
    difficulty: 'int',
    type: 'Transition System',
    suggestedDurationMins: 15,
    description: 'A systematic approach to attacking before the defense sets by pushing pace off makes and misses. Teams that run early offense consistently create more easy baskets than any half-court system can generate.',
    teachingKeys: [
      'Push on every made basket — inbound immediately, don\'t hold the ball.',
      'The inbounder goes long — after inbounding, sprint to the rim for the layup or kick-out.',
      'The point guard catches the inbound pass already moving forward — don\'t receive it standing.',
      'Wings fill the outside lanes immediately — run ahead of the ball.',
      'If the defense is set by half court, pull up and run your half-court offense — don\'t force.',
    ],
    steps: [
      { order: 1, description: 'Opponent scores. 5 takes the ball out of the net immediately.' },
      { order: 2, description: '1 sprints to receive the inbound pass near half court, already moving.' },
      { order: 3, description: '2 and 3 fill the outside lanes at full sprint — ahead of the ball.' },
      { order: 4, description: '5 inbounds and immediately sprints up the middle for the trailer lane.' },
      { order: 5, description: '1 pushes pace and makes the read: layup if open, kick to wing, or pull up at three-point line.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=early+offense+basketball+transition+push',
  },

  {
    id: 'pl-last-second-two',
    name: 'Last Second — Need 2',
    category: 'special',
    categoryColor: '#F5B731',
    difficulty: 'adv',
    type: 'End of Game',
    suggestedDurationMins: 12,
    description: 'Down 1, under 5 seconds, need a quick 2-point score. A simple but reliable action that gets your best scorer a clean look from mid-range using a back screen and a smart inbound.',
    teachingKeys: [
      'Simplicity wins in tight situations — your team must execute automatically.',
      'Best scorer starts at the opposite elbow from the inbounder.',
      'The back screen must be set quickly — no standing around.',
      'Inbounder takes all 5 seconds if needed — use the time.',
      'If the play breaks down, call timeout immediately if you have one.',
    ],
    steps: [
      { order: 1, description: 'Down 1, under 5 seconds. Best scorer (2) at the opposite elbow from inbounder (1).' },
      { order: 2, description: '4 sprints to set a back screen on 2\'s defender near the free throw line.' },
      { order: 3, description: '2 uses the screen and cuts to the elbow — receives the inbound pass.' },
      { order: 4, description: '2 catches balanced at the elbow with time for a pull-up jumper.' },
      { order: 5, description: '2 rises for the game-winning mid-range shot.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=last+second+play+basketball+need+two+points',
  },

  {
    id: 'pl-blob-34',
    name: 'Baseline Inbound: 3-4',
    category: 'inbounds',
    categoryColor: '#8B5CF6',
    difficulty: 'int',
    type: 'Baseline Inbound',
    suggestedDurationMins: 12,
    description: 'A simple but effective baseline inbound with a double screen for your best shooter. The 3-4 alignment (two screeners stacked) is one of the most efficient inbound sets in youth basketball.',
    teachingKeys: [
      'The two screeners stack tightly — touching distance.',
      'The shooter must set up their cut: take two steps the wrong way before using the screen.',
      'The passer must signal the shooter with their eyes or a head nod.',
      'If the primary option is denied, 5 steps to the ball as the safety valve.',
      'Inbounder counts to three before looking at the shooter — gives the action time to develop.',
    ],
    steps: [
      { order: 1, description: '1 inbounds from the baseline. 3 and 4 set a stacked double screen at the lane line.' },
      { order: 2, description: '2 (best shooter) takes two steps toward the inbounder to set up their defender.' },
      { order: 3, description: '2 cuts hard off the double screen — defender gets caught on the screens.' },
      { order: 4, description: '1 delivers to 2 coming off the screens for a catch-and-shoot three or mid-range.' },
      { order: 5, description: 'If 2 is covered: 5 flashes to the ball for an easy catch and quick score.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=baseline+inbound+play+basketball+double+screen',
  },

  {
    id: 'pl-zone-short-corner',
    name: 'Zone Attack: Short Corner',
    category: 'halfcourt',
    categoryColor: '#3A86FF',
    difficulty: 'int',
    type: 'Zone Offense',
    suggestedDurationMins: 15,
    description: 'The short corner (the area below the block, outside the lane) is the most consistently open spot against a 2-3 zone. This play systematically exploits it with ball movement and a specific cut to the short corner area.',
    teachingKeys: [
      'The short corner is open because the bottom zone defenders cannot cover the corner AND the short corner simultaneously.',
      'Enter the ball to the wing first — this moves the bottom zone defender and opens the short corner.',
      'The short corner player must catch ready to score: don\'t catch and then decide.',
      'From the short corner: score, drive baseline, or kick to the cutting big at the high post.',
      'Patience: the zone opens after two or three passes, not immediately.',
    ],
    steps: [
      { order: 1, description: '1 passes to 2 on the right wing. Zone shifts right.' },
      { order: 2, description: '5 cuts from the high post to the right short corner as the zone shifts.' },
      { order: 3, description: '2 feeds 5 in the short corner — zone bottom defender is caught between covering corner and short corner.' },
      { order: 4, description: '5 catches in the short corner facing the basket — quick mid-range shot opportunity.' },
      { order: 5, description: 'Or 5 kicks back to 4 who has cut to the high post gap while the defense collapses.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=zone+offense+short+corner+basketball',
  },

  {
    id: 'pl-press-break-middle',
    name: 'Press Break: Attack the Middle',
    category: 'transition',
    categoryColor: '#F7620A',
    difficulty: 'int',
    type: 'Press Break',
    suggestedDurationMins: 12,
    description: 'A systematic press break that always looks for the middle of the court first. The middle beats every press — this system ensures your team finds it every time rather than getting trapped on the sideline.',
    teachingKeys: [
      'Against any press, the middle is always your friend — the sideline is the press\'s ally.',
      'The middle player (usually 4 or 5) must be active — don\'t let them stand still.',
      'After breaking the press with a middle catch, immediately push pace — you have numbers.',
      'If the middle is not open, reverse the ball and look for the middle on the other side.',
      'Never hold the ball against a press — catch and immediately look to pass or dribble.',
    ],
    steps: [
      { order: 1, description: '1 inbounds to 2 after an opponent basket. Press applies.' },
      { order: 2, description: '4 flashes to the middle of the court at the free throw line extended area.' },
      { order: 3, description: '2 passes to 4 in the middle — this beats the trap before it can form.' },
      { order: 4, description: '4 catches in the middle and immediately pushes forward — press is beaten.' },
      { order: 5, description: 'Fast break: 1 and 3 have filled the wings, 5 is the trailer, 2 is safety.' },
    ],
    videoUrl: 'https://www.youtube.com/results?search_query=press+break+basketball+attack+middle',
  },

];
