import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildWeeklyArcPrompt } from '@/lib/ai/prompts'
import { trackAIUsage } from '@/lib/ai/usage'

function parseJSON(text: string): unknown {
  const raw = text.trim()
  const clean = raw.startsWith('{') ? raw : raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean)
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const {
      totalWeeks,
      phases,
      teamWeaknesses,
      seasonType,
      ageGroup,
      skillLevel,
      characterThemes,
    } = await req.json()

    if (!totalWeeks || !phases) {
      return NextResponse.json({ error: 'totalWeeks and phases are required' }, { status: 400 })
    }

    const prompt = buildWeeklyArcPrompt(
      totalWeeks,
      phases,
      teamWeaknesses || [],
      seasonType || 'rec',
      ageGroup || 'Youth',
      skillLevel || 'Mixed',
      characterThemes || [],
    )

    type ParsedArc = { weeks: unknown[]; summary: string }
    const client = getAIClient()
    let parsed: ParsedArc | null = null

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') continue

      try {
        const result = parseJSON(textBlock.text) as ParsedArc
        if (result?.weeks && Array.isArray(result.weeks) && result.weeks.length === totalWeeks) {
          parsed = result
          break
        }
      } catch {
        if (attempt === 1) throw new Error('Invalid JSON from AI')
      }
    }

    if (!parsed) throw new Error('Failed to generate valid weekly arc')

    await trackAIUsage('weekly_arc')
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Weekly arc API error:', err)
    return NextResponse.json({ error: 'Failed to generate weekly arc' }, { status: 500 })
  }
}
