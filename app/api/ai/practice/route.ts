import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildPracticePrompt } from '@/lib/ai/prompts'
import { trackAIUsage } from '@/lib/ai/usage'
import { drills as staticDrills, CATEGORY_COLORS } from '@/data/drills'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  const body = await req.json()
  const { ageGroup, skillLevel, durationMins, focusAreas, characterTheme } = body

  if (!durationMins) {
    return NextResponse.json({ error: 'durationMins is required' }, { status: 400 })
  }

  const drillList = staticDrills.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    durationMins: d.durationMins,
    level: d.level,
    description: d.description.slice(0, 80),
  }))

  const prompt = buildPracticePrompt(
    drillList,
    ageGroup || 'Youth',
    skillLevel || 'Intermediate',
    durationMins,
    focusAreas || [],
    characterTheme,
  )

  try {
    const client = getAIClient()

    let jsonStr = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') continue

      const raw = textBlock.text.trim()
      jsonStr = raw.startsWith('[') ? raw : raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')

      try {
        JSON.parse(jsonStr)
        break
      } catch {
        if (attempt === 1) throw new Error('Invalid JSON response from AI')
      }
    }

    const planItems = JSON.parse(jsonStr)

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

    await trackAIUsage('practice')
    return NextResponse.json({ drills: enriched })
  } catch (err) {
    console.error('AI practice generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate practice plan. Check your API key and try again.' },
      { status: 500 }
    )
  }
}
