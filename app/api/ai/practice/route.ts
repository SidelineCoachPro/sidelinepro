import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { drills as staticDrills, CATEGORY_COLORS } from '@/data/drills'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local.' },
      { status: 500 }
    )
  }

  const body = await req.json()
  const { ageGroup, skillLevel, durationMins, focusAreas, characterTheme } = body

  // Build a concise list of available drills for the AI
  const drillList = staticDrills.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    durationMins: d.durationMins,
    level: d.level,
    description: d.description.slice(0, 80) + '...',
  }))

  const prompt = `You are a youth basketball coaching assistant. Create a practice plan as a JSON array.

Settings:
- Age Group: ${ageGroup || 'Youth'}
- Skill Level: ${skillLevel || 'Intermediate'}
- Total Duration: ${durationMins} minutes
- Focus Areas: ${focusAreas?.join(', ') || 'General'}
${characterTheme ? `- Character Theme: ${characterTheme}` : ''}

Available drills (use these exact IDs when possible):
${JSON.stringify(drillList, null, 2)}

Return ONLY a valid JSON array. Each element must have these exact fields:
- drillId: string (use an exact id from the list above, or "break" for water breaks)
- name: string (drill name from the list, or "Water Break" for breaks)
- category: string (one of: ballhandling, shooting, passing, defense, conditioning, team, break)
- durationMins: number (integer, adjust from defaults to fit the total time)
- notes: string (1-sentence coaching focus for this specific team)

Rules:
1. Start with a dynamic warmup (5-8 mins) - use a conditioning or ballhandling drill
2. Build from fundamentals to complex skills
3. Add a water break (drillId: "break", 3-5 mins) at the halfway point
4. Focus 60%+ of time on: ${focusAreas?.join(', ') || 'balanced mix'}
5. End with a 5-min cooldown/team huddle (use a team drill or conditioning)
6. Total durationMins across all drills must sum to approximately ${durationMins} minutes
7. Include 5-8 drills total (not counting water break)
${characterTheme ? `8. One drill's notes should tie in the ${characterTheme} character theme` : ''}

Return ONLY the JSON array. No other text.`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Extract JSON from the response (strip any markdown fences if present)
    const raw = textBlock.text.trim()
    const jsonStr = raw.startsWith('[') ? raw : raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')

    const planItems = JSON.parse(jsonStr)

    // Enrich each item with categoryColor and a unique uid
    const enriched = planItems.map((item: {
      drillId: string
      name: string
      category: string
      durationMins: number
      notes: string
    }) => ({
      uid: crypto.randomUUID(),
      drillId: item.drillId,
      name: item.name,
      category: item.category,
      categoryColor: CATEGORY_COLORS[item.category] ?? '#6B7280',
      durationMins: item.durationMins,
      notes: item.notes,
    }))

    return NextResponse.json({ drills: enriched })
  } catch (err) {
    console.error('AI practice generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate practice plan. Check your API key and try again.' },
      { status: 500 }
    )
  }
}
