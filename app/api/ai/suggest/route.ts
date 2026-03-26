import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildSuggestPrompt } from '@/lib/ai/prompts'
import { trackAIUsage } from '@/lib/ai/usage'
import { drills as staticDrills, CATEGORY_COLORS } from '@/data/drills'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const { focusAreas, currentDrillNames, remainingMins } = await req.json()

    const availableDrills = staticDrills
      .filter(d => !currentDrillNames?.includes(d.name))
      .map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        durationMins: d.durationMins,
        description: d.description.slice(0, 60),
      }))

    const prompt = buildSuggestPrompt(
      focusAreas || [],
      currentDrillNames || [],
      remainingMins || 30,
      availableDrills,
    )

    const client = getAIClient()
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const raw = textBlock.text.trim()
    const jsonStr = raw.startsWith('[') ? raw : raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const suggestions = JSON.parse(jsonStr)

    const enriched = suggestions.map((s: {
      drillId: string; name: string; category: string; durationMins: number; reason: string
    }) => ({
      ...s,
      uid: crypto.randomUUID(),
      categoryColor: CATEGORY_COLORS[s.category] ?? '#6B7280',
    }))

    await trackAIUsage('suggest')
    return NextResponse.json({ suggestions: enriched })
  } catch (err) {
    console.error('Suggest API error:', err)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
