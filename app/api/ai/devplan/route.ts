import { NextRequest, NextResponse } from 'next/server'
import { type DevPlanDrill } from '@/hooks/useDevPlans'

const SKILL_DRILLS: Record<string, DevPlanDrill[]> = {
  ball_handling: [
    { id: '1', name: 'Two-Ball Dribbling', duration_mins: 5, instructions: 'Dribble two basketballs simultaneously at hip height. Focus on keeping your eyes up and maintaining equal pressure with both hands. Start stationary, then advance to walking forward.', focus: 'ball_handling' },
    { id: '2', name: 'Figure-8 Dribble', duration_mins: 4, instructions: 'Stand with feet shoulder-width apart. Dribble the ball in a figure-8 pattern between and around your legs. Keep the ball low and use your fingertips, not your palm.', focus: 'ball_handling' },
    { id: '3', name: 'Crossover Speed Drill', duration_mins: 5, instructions: 'Start at half court. Perform a crossover dribble every 3 steps as you advance to the basket. Work both directions. Focus on keeping the ball below knee height on the crossover.', focus: 'ball_handling' },
    { id: '4', name: 'Stationary Ball Slaps', duration_mins: 3, instructions: 'Hold the ball at chest height and slap it firmly from hand to hand. Increase speed gradually. This builds finger strength and hand quickness for tight dribble situations.', focus: 'ball_handling' },
  ],
  shooting: [
    { id: '1', name: 'Form Shooting (5 spots)', duration_mins: 6, instructions: 'Stand 3 feet from the basket at 5 spots: left block, left elbow, top of key, right elbow, right block. Take 10 shots from each spot. Focus on BEEF: Balance, Eyes, Elbow, Follow-through.', focus: 'shooting' },
    { id: '2', name: 'Catch-and-Shoot Corner 3s', duration_mins: 5, instructions: 'Have a partner feed you the ball at both corners. Catch in your shooting pocket with feet already set, rise straight up, and release at the peak of your jump. Take 20 reps each side.', focus: 'shooting' },
    { id: '3', name: 'Free Throw Routine', duration_mins: 4, instructions: 'Take 25 free throws with a consistent pre-shot routine: 2 dribbles, spin the ball, deep breath, bend knees slightly, eyes on back of rim. Aim for 70%+ to build game confidence.', focus: 'shooting' },
    { id: '4', name: 'Pull-Up Mid-Range', duration_mins: 5, instructions: 'Start at the top of the key, dribble to each elbow, and take a pull-up jumper off 2 dribbles. Work both sides. The key is to gather your feet before shooting rather than fading away.', focus: 'shooting' },
  ],
  passing: [
    { id: '1', name: 'Wall Passing Series', duration_mins: 5, instructions: 'Stand 8 feet from a wall. Perform 20 chest passes, 20 bounce passes, and 20 overhead passes. Focus on stepping into each pass and following through with your thumbs pointing down.', focus: 'passing' },
    { id: '2', name: 'No-Look Pass Drill', duration_mins: 4, instructions: 'With a partner, practice looking left while passing right and vice versa. Start slow and build speed. This trains you to use peripheral vision and deceive defenders.', focus: 'passing' },
    { id: '3', name: 'Full-Court Outlet Passing', duration_mins: 5, instructions: 'Simulate a rebounding situation. Catch the ball strong, pivot to the outside, and throw a crisp 2-hand chest or overhead outlet pass to a teammate at the wing. Focus on accuracy over speed.', focus: 'passing' },
    { id: '4', name: 'Driving Lane Skip Pass', duration_mins: 4, instructions: 'Drive into the lane with 2 dribbles, draw the defense, then skip pass to the weak-side corner. The key is a quick release off the drive to beat the defense rotating. Take 15 reps each side.', focus: 'passing' },
  ],
  defense: [
    { id: '1', name: 'Defensive Slide Ladder', duration_mins: 5, instructions: 'Set up 4 cones in a zigzag pattern 5 feet apart. Slide defensively between each cone, staying low with your weight on the balls of your feet. Never cross your feet. Focus on staying wide.', focus: 'defense' },
    { id: '2', name: 'Ball Pressure Stance', duration_mins: 4, instructions: 'In a low defensive stance, apply pressure on a ball handler for 30-second bursts. Keep one hand in the passing lane and one hand low to deflect dribbles. Use your feet to cut off drives.', focus: 'defense' },
    { id: '3', name: 'Close-Out Drill', duration_mins: 5, instructions: 'Start under the basket. A coach passes to a shooter on the wing. Sprint out with high hands, then chop your steps in the final 5 feet to control your momentum and avoid a foul. 15 reps each side.', focus: 'defense' },
    { id: '4', name: 'Drop Step Shell Drill', duration_mins: 4, instructions: 'Practice help-and-recover from help defense position. When the ball is passed away from you, drop step and find your new assignment. This trains rotational awareness and communication habits.', focus: 'defense' },
  ],
  athleticism: [
    { id: '1', name: 'Box Jumps', duration_mins: 5, instructions: 'Use a sturdy box or bench 12–18 inches high. Jump onto the box with both feet, absorb the landing with bent knees, step back down. Do 4 sets of 8 reps. Focus on explosive takeoff and soft landing.', focus: 'athleticism' },
    { id: '2', name: 'Lateral Bound Circuit', duration_mins: 4, instructions: 'Jump laterally from one foot to the other over a line on the court. Push off the outside edge of each foot. Do 3 sets of 30-second bursts. This builds the explosive lateral quickness needed for cuts and slides.', focus: 'athleticism' },
    { id: '3', name: 'Sprint-and-Shuffle Intervals', duration_mins: 5, instructions: 'Sprint from baseline to half court, defensive shuffle from half court to far baseline, backpedal from far baseline to mid-court, sprint in. Rest 30 seconds. Repeat 6 times. Tracks real game movement patterns.', focus: 'athleticism' },
    { id: '4', name: 'Core Stability Plank Series', duration_mins: 4, instructions: 'Perform: front plank 45s, left side plank 30s, right side plank 30s, plank with alternating leg raises 30s. Strong core improves balance, explosion, and injury prevention on the court.', focus: 'athleticism' },
  ],
  coachability: [
    { id: '1', name: 'Film Session Review', duration_mins: 6, instructions: 'Watch 10 minutes of game or practice film together. Pause at 3–5 moments and ask the player: "What would you do differently here?" Practice active listening and responding with "I understand" before reacting.', focus: 'coachability' },
    { id: '2', name: 'Correction Response Drill', duration_mins: 5, instructions: 'Run a basic drill and deliberately correct the player\'s technique 5 times. Their job: respond with "Yes coach," adjust immediately, and hold the correction for the next 5 reps without being reminded. This builds responsive habits.', focus: 'coachability' },
    { id: '3', name: 'Communication Role Play', duration_mins: 4, instructions: 'Roleplay timeout scenarios where the coach draws up a play. The player must listen, repeat back the assignment, ask one clarifying question if needed, then execute. Builds active listening under pressure.', focus: 'coachability' },
    { id: '4', name: 'Self-Assessment Journaling', duration_mins: 3, instructions: 'After practice, the player writes 3 sentences: (1) one thing I did well, (2) one thing I was coached on, (3) how I will fix it next practice. Review together at the start of the next session.', focus: 'coachability' },
  ],
}

const SKILL_MESSAGES: Record<string, string> = {
  ball_handling: "Hi [Parent Name], I wanted to share a quick development plan for [Player Name] focused on ball handling. We've been working on this in practice and I've put together a 20-minute home workout to help accelerate their progress. Consistency is key — even 3 sessions per week will make a noticeable difference by our next game.",
  shooting: "Hi [Parent Name], great news for [Player Name]! I've put together a personalized shooting development plan based on our recent practice sessions. These drills are designed to build the muscle memory and confidence needed to become a reliable scorer. Try to get these reps in before our next practice!",
  passing: "Hi [Parent Name], [Player Name] has been working hard on their court vision and passing. I've created a short development plan to sharpen these skills at home. Great passing is what separates good players from great ones — it's a skill that will serve them for years!",
  defense: "Hi [Parent Name], defense wins championships! I've put together a focused development plan for [Player Name] to improve their defensive fundamentals. These drills build the habits that make a player a defensive anchor. Even 15–20 minutes a few times a week will show real results.",
  athleticism: "Hi [Parent Name], I've designed an athleticism development plan for [Player Name] to help them move faster and jump higher. These basketball-specific workouts complement what we do in practice. Please make sure they have proper footwear and warm up before starting!",
  coachability: "Hi [Parent Name], I wanted to share some thoughts on [Player Name]'s development. I've created a short plan focused on communication and responding to coaching cues — skills that make everything else easier to learn. Some of these activities involve both of you, which I think you'll enjoy!",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildDevPlanPrompt(
  playerName: string,
  focusSkill: string,
  skillScores: Record<string, number>,
): string {
  const skillList = Object.entries(skillScores)
    .map(([k, v]) => `${k.replace('_', ' ')}: ${v}/10`)
    .join(', ')

  return `You are an expert youth basketball coach creating a personalized development plan.

Player: ${playerName}
Focus skill: ${focusSkill.replace('_', ' ')}
Current skill scores: ${skillList}

Generate a development plan with exactly 3 drills for the focus skill. Each drill must be specific, actionable, and appropriate for youth basketball. Format your response as a JSON object with this exact structure:
{
  "drills": [
    {
      "name": "Drill Name",
      "duration_mins": 5,
      "instructions": "Step-by-step instructions 2-3 sentences",
      "focus": "${focusSkill}"
    }
  ],
  "message_text": "A warm, professional 2-3 sentence message to the parent explaining the plan"
}`
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { playerName, focusSkill, skillScores: _skillScores } = await req.json()

    if (!playerName || !focusSkill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const skill = focusSkill as keyof typeof SKILL_DRILLS
    const drills = SKILL_DRILLS[skill] ?? SKILL_DRILLS.ball_handling
    const selectedDrills = drills.slice(0, 3).map((d, i) => ({
      ...d,
      id: `${skill}-${i + 1}`,
    }))

    const totalMins = selectedDrills.reduce((sum, d) => sum + d.duration_mins, 0)
    const messageText = SKILL_MESSAGES[skill] ?? SKILL_MESSAGES.ball_handling

    // TODO: Uncomment when Anthropic API credits are available
    // const apiKey = process.env.ANTHROPIC_API_KEY
    // if (apiKey) {
    //   const Anthropic = (await import('@anthropic-ai/sdk')).default
    //   const client = new Anthropic({ apiKey })
    //   const prompt = buildDevPlanPrompt(playerName, focusSkill, skillScores ?? {})
    //   const response = await client.messages.create({
    //     model: 'claude-opus-4-6',
    //     max_tokens: 1024,
    //     thinking: { type: 'adaptive' },
    //     messages: [{ role: 'user', content: prompt }],
    //   })
    //   const text = response.content.find(b => b.type === 'text')?.text ?? ''
    //   const parsed = JSON.parse(text)
    //   return NextResponse.json({
    //     drills: parsed.drills,
    //     duration_mins: parsed.drills.reduce((s: number, d: DevPlanDrill) => s + d.duration_mins, 0),
    //     message_text: parsed.message_text,
    //   })
    // }

    return NextResponse.json({
      drills: selectedDrills,
      duration_mins: totalMins,
      message_text: messageText,
    })
  } catch (err) {
    console.error('Dev plan API error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
