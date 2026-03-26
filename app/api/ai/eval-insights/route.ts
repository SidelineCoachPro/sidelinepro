import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildEvalInsightsPrompt } from '@/lib/ai/prompts'
import { trackAIUsage } from '@/lib/ai/usage'

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 })
  }

  try {
    const { playerName, skillScores, isFirstEval, previousScores } = await req.json()

    if (!playerName || !skillScores) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = buildEvalInsightsPrompt(playerName, skillScores, isFirstEval, previousScores)

    const client = getAIClient()
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const raw = textBlock.text.trim()
    const clean = raw.startsWith('{') ? raw : raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const result = JSON.parse(clean)
    await trackAIUsage('eval_insights')
    return NextResponse.json(result)
  } catch (err) {
    console.error('Eval insights API error:', err)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
