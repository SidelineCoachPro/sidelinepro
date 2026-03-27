import { NextRequest, NextResponse } from 'next/server'
import { getAIClient, AI_MODEL } from '@/lib/ai/client'
import { buildDevPlanPrompt, buildDevPlanContentPrompt } from '@/lib/ai/prompts'
import { trackAIUsage } from '@/lib/ai/usage'
import { type DevPlanDrill } from '@/hooks/useDevPlans'

type ParsedPlan = { drills: DevPlanDrill[]; message_text: string }

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
    const format = req.nextUrl.searchParams.get('format')
    const { playerName, focusSkill, skillScores } = await req.json()

    if (!playerName || !focusSkill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = getAIClient()

    // ── V2 format: return structured PlanContent ──────────────────────────
    if (format === 'v2') {
      const prompt = buildDevPlanContentPrompt(playerName, focusSkill, skillScores ?? {})
      let parsedContent: unknown = null

      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await client.messages.create({
          model: AI_MODEL,
          max_tokens: 2500,
          messages: [{ role: 'user', content: prompt }],
        })

        const textBlock = response.content.find(b => b.type === 'text')
        if (!textBlock || textBlock.type !== 'text') continue

        try {
          parsedContent = parseJSON(textBlock.text)
          if (parsedContent && typeof parsedContent === 'object') break
        } catch {
          if (attempt === 1) throw new Error('Invalid JSON from AI')
        }
      }

      if (!parsedContent) throw new Error('No valid response from AI')

      await trackAIUsage('devplan')
      return NextResponse.json({ content: parsedContent })
    }

    // ── Legacy format ─────────────────────────────────────────────────────
    const prompt = buildDevPlanPrompt(playerName, focusSkill, skillScores ?? {})

    let parsed: ParsedPlan | null = null

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.create({
        model: AI_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') continue

      try {
        parsed = parseJSON(textBlock.text) as ParsedPlan
        if (parsed?.drills && Array.isArray(parsed.drills)) break
      } catch {
        if (attempt === 1) throw new Error('Invalid JSON from AI')
      }
    }

    if (!parsed) throw new Error('No valid response from AI')

    const drills: DevPlanDrill[] = parsed.drills.map((d, i) => ({
      id: `${focusSkill}-${i + 1}`,
      name: d.name,
      duration_mins: d.duration_mins,
      instructions: d.instructions,
      focus: focusSkill,
    }))

    const duration_mins = drills.reduce((s, d) => s + d.duration_mins, 0)

    await trackAIUsage('devplan')
    return NextResponse.json({
      drills,
      duration_mins,
      message_text: parsed.message_text,
    })
  } catch (err) {
    console.error('Dev plan API error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
