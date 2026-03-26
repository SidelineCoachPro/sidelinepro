import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildAssessmentPrompt } from '@/lib/ai/prompts'
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
      seasonName,
      currentWeek,
      totalWeeks,
      currentPhase,
      teamAvgScores,
      recentFocusAreas,
      practiceCount,
    } = await req.json()

    if (!seasonName || !currentWeek || !totalWeeks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = buildAssessmentPrompt(
      seasonName,
      currentWeek,
      totalWeeks,
      currentPhase || 'Unknown',
      teamAvgScores || {},
      recentFocusAreas || [],
      practiceCount || 0,
    )

    const client = getAIClient()
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const result = parseJSON(textBlock.text)
    await trackAIUsage('assessment')
    return NextResponse.json(result)
  } catch (err) {
    console.error('Assessment API error:', err)
    return NextResponse.json({ error: 'Failed to generate assessment' }, { status: 500 })
  }
}
