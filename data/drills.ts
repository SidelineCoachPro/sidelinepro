export interface Drill {
  id: string;
  name: string;
  category: 'ballhandling' | 'shooting' | 'passing' | 'defense' | 'conditioning' | 'team';
  categoryColor: string;
  durationMins: number;
  playersNeeded: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
  description: string;
  setup?: string;
  instructions?: string;
  cues: string[];
  progression?: string;
  videoUrl?: string;
  tags: string[];
  isCustom?: boolean;
}

export const CATEGORY_COLORS: Record<string, string> = {
  ballhandling: '#F7620A',
  shooting: '#38BDF8',
  passing: '#F5B731',
  defense: '#22C55E',
  conditioning: '#E879F9',
  team: '#8B5CF6',
}

export const CATEGORY_LABELS: Record<string, string> = {
  ballhandling: 'Ball Handling',
  shooting: 'Shooting',
  passing: 'Passing',
  defense: 'Defense',
  conditioning: 'Conditioning',
  team: 'Team',
}

import { DRILLS_EXPANDED } from './drills_expanded'

export const drills: Drill[] = [
  // ── BALL HANDLING ────────────────────────────────────────────
  {
    id: 'bh-001',
    name: 'Stationary Dribble Series',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Players work through a progressive series of stationary dribbling moves, building ball control, hand-eye coordination, and dribble confidence without the pressure of movement.',
    setup: 'Players spread out on the court with plenty of space between them, each with a basketball.',
    instructions:
      'Start with right-hand pound dribbles (10 reps), then left hand (10 reps), then alternating. Progress through: low dribbles, high dribbles, between-the-legs single tap, behind-the-back tap, figure-eight. Hold each move for 30 seconds before advancing.',
    cues: [
      'Eyes up — look at the rim, not the ball',
      'Pound the ball hard, don\'t slap it',
      'Use your fingertips, not your palm',
      'Relax your shoulders, stay athletic',
    ],
    progression: 'Add movement (walking, then jogging) while maintaining each dribble pattern.',
    tags: ['dribbling', 'ball control', 'fundamentals', 'youth', 'warm-up', 'individual'],
  },
  {
    id: 'bh-002',
    name: 'Cone Dribble Circuit',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Players weave through a cone course using specific dribble moves at each cone, developing change-of-direction skills and on-the-move ball handling.',
    setup: 'Set up 5–6 cones in a straight line, 3 feet apart. Create multiple lanes if you have enough cones.',
    instructions:
      'Player dribbles through all cones using a crossover at each cone. Return trip: between-the-legs. Third pass: behind-the-back at each cone. Keep head up throughout.',
    cues: [
      'Attack the cone before you make your move — don\'t slow down early',
      'Keep your head up the entire time',
      'Low and quick through each cone',
      'Change direction sharply, not gradually',
    ],
    progression: 'Add combo moves on the return. Time each player and track improvement.',
    tags: ['dribbling', 'cones', 'change of direction', 'fundamentals', 'individual'],
  },
  {
    id: 'bh-003',
    name: 'Two-Ball Dribbling',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description:
      'Players simultaneously dribble two basketballs to force ambidexterity, improve weak-hand dribbling, and build concentration under coordination pressure.',
    setup: 'Each player needs two basketballs. Players in athletic stance with space around them.',
    instructions:
      'Phase 1: Both balls bounce together (30 sec). Phase 2: Alternating — right down as left comes up (30 sec). Phase 3: Staggered rhythm (30 sec). Phase 4: Walk forward while maintaining alternating dribble.',
    cues: [
      'Don\'t let one hand be lazier than the other',
      'Eyes forward — fight the urge to look down',
      'Keep both dribbles at the same height',
      'Relax your hands, soft touch',
    ],
    progression: 'Jog forward, then add crossovers while maintaining two-ball rhythm.',
    tags: ['two-ball', 'ambidexterity', 'weak hand', 'coordination', 'individual'],
  },
  {
    id: 'bh-004',
    name: 'Spider Dribble',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description:
      'A high-repetition finger-speed drill where players tap the ball in a fast alternating pattern around their feet, developing explosive hand speed and wrist flexibility.',
    setup: 'Players stand with feet shoulder-width apart, ball on the floor between their feet.',
    instructions:
      'Tap with right hand in front, left hand in front, right hand behind right leg, left hand behind left leg. That\'s one rep. Start slow to build the pattern, then accelerate. Work up to 30 seconds at max speed.',
    cues: [
      'Light taps — keep the ball close to the floor',
      'Build your rhythm, then push the speed',
      'Stay balanced — don\'t lean forward',
      'Fingers spread wide on every tap',
    ],
    progression: 'Reverse the direction. Eyes closed for advanced players.',
    tags: ['finger speed', 'hand speed', 'coordination', 'ball control', 'individual'],
  },
  {
    id: 'bh-005',
    name: 'Full Court Snake Dribble',
    category: 'ballhandling',
    categoryColor: '#F7620A',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description:
      'Players dribble the full court using sharp crossover moves at designated points, simulating game-speed ball handling in transition.',
    setup: 'Players line up at baseline. Use hash marks, free throw lines, and half court as crossover points.',
    instructions:
      'Dribble full court, execute a crossover at each line. Add a jab-step fake before each crossover. Go up on the right hand leading, return on the left. Body protects the ball through each change of direction.',
    cues: [
      'Make your move decisive — sell the hesitation first',
      'Stay low through the crossover, don\'t stand up',
      'Protect the ball with your body and off-hand',
      'Push it out in front after the crossover — attack',
    ],
    progression: 'Add a defensive shadow (non-contact). Work combo moves: in-and-out into crossover.',
    tags: ['full court', 'transition', 'crossover', 'change of direction', 'game speed'],
  },

  // ── SHOOTING ─────────────────────────────────────────────────
  {
    id: 'sh-001',
    name: 'BEEF Form Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 10,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Teaches the four fundamentals of shooting technique using the BEEF acronym — Balance, Eyes, Elbow, Follow-through. Best used at the start of every practice with young players.',
    setup: 'Players pair up, one ball per pair. Start 3–5 feet from the basket. Progress back to free throw line.',
    instructions:
      'Walk through each letter. B — feet shoulder-width, shooting foot slightly forward. E — eyes lock on the back of the rim before raising the ball. E — shooting elbow under the ball, not flared. F — snap wrist, hold follow-through until the ball lands. Start with one-handed shooting, then add the guide hand.',
    cues: [
      'Balance: wide base, shooting foot slightly staggered',
      'Eyes: find your target before you start your shot',
      'Elbow: point it at the rim, not the side wall',
      'Follow-through: wave goodbye — hold it until the ball lands',
    ],
    progression: 'Move to 5-spot around the paint, then to the free throw line.',
    tags: ['form shooting', 'fundamentals', 'technique', 'beginner', 'BEEF', 'youth'],
  },
  {
    id: 'sh-002',
    name: '5-Spot Shooting',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description:
      'Players shoot from 5 spots around the perimeter, building consistency and shooting rhythm from different angles. Great for tracking makes over time.',
    setup: 'Mark 5 spots: left corner, left wing, top of key, right wing, right corner. 1–2 players per basket.',
    instructions:
      'Player shoots 5 shots from spot 1, records makes, rotates clockwise. All 5 spots = 1 round. Do 2–3 rounds. Challenge: must make 3/5 before moving. Track total makes per round.',
    cues: [
      'Square your feet to the basket before you catch',
      'Your shot should look identical at every spot',
      'Don\'t rush — same shot every single time',
      'Reset your feet on every shot',
    ],
    progression: 'Add a jab step or shot fake before each shot. Work off a dribble from the wing spots.',
    tags: ['shooting spots', 'catch and shoot', 'perimeter', 'consistency', 'competitive'],
  },
  {
    id: 'sh-003',
    name: 'Mikan Drill',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Classic finishing drill where players alternate layups from both sides of the basket in a continuous rhythm, developing soft touch, high release, and ambidextrous finishing.',
    setup: 'Player starts directly under the basket with one ball. No other setup needed.',
    instructions:
      'Shoot a right-hand layup off the backboard, catch the ball before it touches the floor, step-step-shoot a left-hand layup. No dribbling — pure rhythm. Time for 30 seconds, count makes. Rest 30 seconds. Repeat 3 sets.',
    cues: [
      'Use the backboard on every single shot',
      'High release point — reach for the top corner of the box',
      'Catch and immediately pivot to the other side',
      'Soft touch — don\'t power it in',
    ],
    progression: 'Power Mikan (two-foot power stop). Reverse Mikan (reverse layups).',
    tags: ['layups', 'finishing', 'ambidextrous', 'backboard', 'fundamentals', 'youth'],
  },
  {
    id: 'sh-004',
    name: 'Elbow Pull-Up Series',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 10,
    playersNeeded: 'Pairs',
    level: 'Intermediate',
    description:
      'Players develop the mid-range pull-up jumper from the elbows — one of the most important game shots for guards and wings in youth basketball.',
    setup: 'One player at each elbow (free throw line extended). Passer at top of key. Rotate every 5 makes.',
    instructions:
      'Passer throws to the elbow. Player catches in triple threat, jab-steps to create separation, rises for the pull-up. Work 5 makes from right elbow, 5 from left. Next progression: catch, one hard dribble toward the lane, pull-up at the elbow.',
    cues: [
      'Create space with your jab before shooting — don\'t just catch and heave',
      'Jump straight up — no fading away or leaning',
      'Land in the same spot you jumped from',
      'Quick, compact release — the higher the defense, the faster you shoot',
    ],
    progression: 'Add live defense. Work off a drive-and-kick: drive from wing, kick back to partner at elbow.',
    tags: ['mid-range', 'pull-up', 'elbow', 'jab step', 'guard skills', 'game shots'],
  },
  {
    id: 'sh-005',
    name: '3-Man Shooting Circuit',
    category: 'shooting',
    categoryColor: '#38BDF8',
    durationMins: 12,
    playersNeeded: 'Groups of 3',
    level: 'Advanced',
    description:
      'High-repetition shooting drill with continuous movement — shooter, rebounder, and passer rotate roles to maximize shot attempts and simulate game-pace shooting.',
    setup: 'Shooter at wing spot, passer at top of key with ball, rebounder under basket.',
    instructions:
      'Passer leads shooter with a pass, shooter catches and shoots, rebounder outlets to passer, all rotate positions: passer → shooter → rebounder → passer. Goal: 10 makes at the wing before rotating to a new spot.',
    cues: [
      'Shooter: be in your stance and ready before the pass arrives',
      'Passer: lead the shooter — throw a catchable ball',
      'Rebounder: get out of the net fast, outlet immediately',
      'Keep the pace high — this should feel like a game',
    ],
    progression: 'Add a shot fake before every shot. Set a team make goal and track it practice-to-practice.',
    tags: ['shooting circuit', 'game pace', 'high reps', 'movement', 'team drill'],
  },

  // ── PASSING ──────────────────────────────────────────────────
  {
    id: 'pa-001',
    name: 'Chest Pass Lines',
    category: 'passing',
    categoryColor: '#F5B731',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Fundamental passing drill teaching proper chest pass mechanics — grip, footwork, release, and follow-through — in a controlled two-line format.',
    setup: 'Split team into two lines facing each other, 10–12 feet apart. One ball per pair.',
    instructions:
      'Players pass and follow to the back of the opposite line. Focus on: fingers behind and to the sides of the ball, step toward the target, thumbs rotate down on release, arms extend fully. After 3 minutes, switch to bounce pass. Last 2 minutes: overhead pass.',
    cues: [
      'Step toward your target — don\'t just arm-it',
      'Thumbs point down at the finish',
      'Snap your wrists, don\'t push the ball',
      'Make a target — show your teammate where to throw',
    ],
    progression: 'Increase distance to 15 feet. Add a defender standing between the lines.',
    tags: ['chest pass', 'fundamentals', 'passing mechanics', 'beginner', 'pairs', 'youth'],
  },
  {
    id: 'pa-002',
    name: '3-Man Weave',
    category: 'passing',
    categoryColor: '#F5B731',
    durationMins: 10,
    playersNeeded: 'Groups of 3',
    level: 'Intermediate',
    description:
      'Classic full-court passing and movement drill that teaches passing ahead, timing, and communication while building conditioning and coordination.',
    setup: 'Three players at one baseline, spread across the court in three lanes.',
    instructions:
      'Middle player passes to either side, then cuts behind that player to the far lane. Receiving player passes to the third player who fills the middle. Continue — pass and cut behind — all the way down the floor. Finish with a layup.',
    cues: [
      'Pass and immediately cut — no standing and watching',
      'Fill the middle lane quickly after your cut',
      'Call for the ball with your voice, not just your hands',
      'Lay it up clean — the finish is part of the drill',
    ],
    progression: 'Add a 4th player as a trailing defender. Increase speed.',
    tags: ['full court', 'passing and cutting', 'movement', '3-man weave', 'transition'],
  },
  {
    id: 'pa-003',
    name: 'Star Passing Drill',
    category: 'passing',
    categoryColor: '#F5B731',
    durationMins: 10,
    playersNeeded: 'Groups of 5',
    level: 'Intermediate',
    description:
      'Five players form a star/pentagon pattern and pass in a skip sequence, building accurate long passes, hand targets, and catching under movement pressure.',
    setup: 'Five players form a star, each 12–15 feet apart. One ball to start.',
    instructions:
      'Each player passes to the person two spots to their right (skip pass pattern). After passing, follow your pass to that spot. After 3 full rotations, reverse direction. Variation: add a second ball.',
    cues: [
      'Catch with two hands — don\'t let balls pop out',
      'Make a big target — hands up, show the passer where to throw',
      'Quick release — don\'t hold the ball, keep it moving',
      'Eyes ahead: watch the ball and the next player simultaneously',
    ],
    progression: 'Add a second ball. Use only bounce passes for one round.',
    tags: ['star passing', '5-man', 'skip pass', 'catching', 'communication', 'tempo'],
  },

  // ── DEFENSE ──────────────────────────────────────────────────
  {
    id: 'def-001',
    name: 'Defensive Slide Series',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Beginner',
    description:
      'Teaches defensive stance and lateral slide footwork — the foundation of all individual defense. Builds hip strength, balance, and proper defensive habits.',
    setup: 'Players spread across the baseline or mid-court in two lines, facing the coach.',
    instructions:
      'On command: slide right 4 steps (don\'t cross feet), plant and slide left 4 steps. Then: close-out forward (sprint 3 steps, break down), back-pedal. Hold stance throughout. 3 sets of 45 seconds on, 15 seconds rest. Coach changes directions randomly in later reps.',
    cues: [
      'Stay low — if you stand up, you lose',
      'Never cross your feet on a lateral slide',
      'Lead with the foot in the direction you\'re moving',
      'Hands active — one high, one low, always moving',
    ],
    progression: 'React to coach pointing instead of verbal cues. Add an offensive player dribbling to mirror.',
    tags: ['defensive stance', 'lateral slide', 'footwork', 'fundamentals', 'beginner', 'youth'],
  },
  {
    id: 'def-002',
    name: '1-on-1 Deny Defense',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 10,
    playersNeeded: 'Pairs',
    level: 'Intermediate',
    description:
      'Teaches defenders to deny the ball to a wing player, developing off-ball defensive positioning, ball-you-man awareness, and the instinct to stay in front.',
    setup: 'Offensive player on wing. Defender in deny position. Passer at top of key with ball.',
    instructions:
      'Defender takes full deny stance — arm in the passing lane, near-foot forward, vision on both ball and player. Offensive player works 30 seconds to get open. If pass is caught, play 1-on-1 live. Rotate roles every 2 minutes.',
    cues: [
      'Arm in the passing lane at all times — not just when they move',
      'See the ball AND your player — don\'t lose either',
      'Don\'t reach — move your feet to stay in front',
      'When the ball moves, your feet move first',
    ],
    progression: 'Allow the offensive player to cut to the basket. Add a second defender for 2-on-2 deny.',
    tags: ['deny defense', 'off-ball defense', 'wing defense', '1-on-1', 'positioning'],
  },
  {
    id: 'def-003',
    name: 'Shell Drill',
    category: 'defense',
    categoryColor: '#22C55E',
    durationMins: 12,
    playersNeeded: 'Groups of 8',
    level: 'Advanced',
    description:
      'The foundation of team defense. 4-on-4 drill teaching help positioning, communication, ball-you-man principles, and proper rotation on every ball movement.',
    setup: '4 offensive players in 4-out perimeter formation. 4 defenders matched up. No post player initially.',
    instructions:
      'Offense passes around the perimeter — no dribbling. Defense must sprint to correct help positions on each pass. Defenders communicate loudly. Progress to: allow one dribble, then allow drives.',
    cues: [
      'Ball-You-Man triangle — always know where all three are',
      'Talk! One word calls: "Ball!" "Help!" "Switch!" "Deny!"',
      'Help-side foot in the lane when two passes away',
      'Jump to the ball on every single pass',
    ],
    progression: 'Go live — allow full offense to attack. Add a post player. Play to 5 stops before switching.',
    tags: ['team defense', 'shell drill', 'help defense', 'rotation', 'communication', 'advanced'],
  },

  // ── CONDITIONING ─────────────────────────────────────────────
  {
    id: 'con-001',
    name: 'Suicide Sprints',
    category: 'conditioning',
    categoryColor: '#E879F9',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'All levels',
    description:
      'The classic basketball conditioning sprint. Builds cardiovascular endurance, mental toughness, and the ability to perform when fatigued.',
    setup: 'All players lined up on baseline touching the line.',
    instructions:
      'Sprint to near free throw line and back, half court and back, far free throw line and back, far baseline and back. That\'s 1 rep. Rest 30 seconds. Complete 3–5 reps depending on age and fitness. Touch each line with your hand.',
    cues: [
      'Touch the line with your hand — not just your foot',
      'Drive your arms — your legs follow your arms',
      'Push through when it hurts — that\'s when it counts',
      'Finish through the line, don\'t slow down early',
    ],
    progression: 'Decrease rest to 20 seconds. Add a ball — must maintain a dribble throughout.',
    tags: ['conditioning', 'sprints', 'cardio', 'mental toughness', 'fitness', 'suicides'],
  },
  {
    id: 'con-002',
    name: 'Defensive Footwork Ladder',
    category: 'conditioning',
    categoryColor: '#E879F9',
    durationMins: 8,
    playersNeeded: 'Full team',
    level: 'Intermediate',
    description:
      'Agility ladder work focusing on defensive footwork patterns — builds foot speed, coordination, and the quick-twitch movements essential for staying in front of ball handlers.',
    setup: 'Agility ladder laid flat on the court. Players line up at one end.',
    instructions:
      'Work 4 patterns: (1) Lateral shuffle — two feet in each box, stay low. (2) 1-in-1-out lateral. (3) Ickey shuffle forward. (4) Defensive slides — two feet in each box, stay in stance. 2 complete passes each pattern.',
    cues: [
      'Quick feet — stay on the balls of your feet, not your heels',
      'Arms out for balance — keep them active',
      'Don\'t look down at the ladder after the first few steps',
      'Stay in your defensive stance — don\'t stand up between boxes',
    ],
    progression: 'Increase speed each round. Add ball handling during forward patterns.',
    tags: ['agility ladder', 'footwork', 'quickness', 'defensive conditioning', 'foot speed'],
  },

  // ── TEAM ─────────────────────────────────────────────────────
  {
    id: 'tm-001',
    name: '3-on-2 Fast Break',
    category: 'team',
    categoryColor: '#8B5CF6',
    durationMins: 12,
    playersNeeded: 'Groups of 5+',
    level: 'Intermediate',
    description:
      'Continuous fast break drill that teaches players to exploit a numbers advantage, make quick decisions, and convert in transition — while defenders learn to stop the ball.',
    setup: 'Three offensive players at half court, two defenders in the lane. Remaining players wait at half court.',
    instructions:
      'Three offensive players attack two defenders. Ball handler attacks the middle, wings fill the sideline lanes wide. After the play ends, the two defenders become offense, one defender from baseline joins them, and three of the original offense become new defense. Continuous.',
    cues: [
      'Attack the basket — don\'t hesitate when you have the advantage',
      'Wings: fill wide and be ready to shoot the moment you catch',
      'Ball handler: take what the defense gives you',
      'Defense: stop the ball first, then stop the pass',
    ],
    progression: 'Add a trailing defender (becomes 3-on-3). Must pass at least once before shooting.',
    tags: ['fast break', 'transition', '3-on-2', 'decision making', 'numbers advantage'],
  },
  {
    id: 'tm-002',
    name: '5-on-5 Half Court Scrimmage',
    category: 'team',
    categoryColor: '#8B5CF6',
    durationMins: 20,
    playersNeeded: 'Full team',
    level: 'All levels',
    description:
      'Controlled half-court scrimmage with coaching interruptions — the best way to integrate skills and reinforce team concepts in a live competitive environment.',
    setup: 'Full 5-on-5 on one half of the court. Coach on the sideline.',
    instructions:
      'Play live half-court. Coach calls "stop" to correct positioning or celebrate a great play. Award bonus points for: extra pass leading to a basket, defensive stops, offensive rebounds, charges taken. Play to 7 or set a 10-minute timer.',
    cues: [
      'Move the ball — don\'t let it stick, don\'t be a statue',
      'Talk on defense — one word is better than silence',
      'Play hard every possession — the habits matter, not the score',
      'Look at your teammates, not just the ball',
    ],
    progression: 'Add constraints: must make 3 passes before shooting. Full court scrimmage.',
    tags: ['scrimmage', 'half court', 'live play', 'team concepts', 'competitive', '5-on-5'],
  },
  ...DRILLS_EXPANDED,
]
