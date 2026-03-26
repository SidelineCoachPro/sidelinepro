// ── Practice Plan prompt ──────────────────────────────────────────────────────

export function buildPracticePrompt(
  drillList: Array<{ id: string; name: string; category: string; durationMins: number; level: string; description: string }>,
  ageGroup: string,
  skillLevel: string,
  durationMins: number,
  focusAreas: string[],
  characterTheme?: string,
): string {
  return `You are a youth basketball coaching assistant. Create a practice plan as a JSON array.

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
1. Start with a dynamic warmup (5-8 mins) using a conditioning or ballhandling drill
2. Build from fundamentals to complex skills
3. Add a water break (drillId: "break", 3-5 mins) at the halfway point
4. Focus 60%+ of time on: ${focusAreas?.join(', ') || 'balanced mix'}
5. End with a 5-min cooldown/team huddle using a team drill or conditioning
6. Total durationMins across all drills must sum to approximately ${durationMins} minutes
7. Include 5-8 drills total (not counting water break)
${characterTheme ? `8. One drill's notes should tie in the ${characterTheme} character theme` : ''}

Return ONLY the JSON array. No other text.`
}

// ── Dev Plan prompt ───────────────────────────────────────────────────────────

export function buildDevPlanPrompt(
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

Generate a development plan with exactly 3 drills for the focus skill. Each drill must be specific, actionable, and appropriate for youth basketball.

Return ONLY a valid JSON object with this exact structure:
{
  "drills": [
    {
      "name": "Drill Name",
      "duration_mins": 5,
      "instructions": "Step-by-step instructions 2-3 sentences",
      "focus": "${focusSkill}"
    }
  ],
  "message_text": "A warm, professional 2-3 sentence message to the parent explaining the plan and what to expect"
}

No other text outside the JSON.`
}

// ── Drill Suggestions prompt ──────────────────────────────────────────────────

export function buildSuggestPrompt(
  focusAreas: string[],
  currentDrillNames: string[],
  targetDuration: number,
  availableDrills: Array<{ id: string; name: string; category: string; durationMins: number; description: string }>,
): string {
  return `You are a youth basketball coaching assistant. Suggest 3-4 drills to add to a practice plan.

Current practice focus: ${focusAreas.join(', ')}
Already in plan: ${currentDrillNames.join(', ') || 'none'}
Remaining time: ~${targetDuration} minutes

Available drills to choose from:
${JSON.stringify(availableDrills.slice(0, 30), null, 2)}

Return ONLY a valid JSON array of 3-4 suggestions. Each must have:
- drillId: string (exact id from available list)
- name: string
- category: string
- durationMins: number
- reason: string (1 sentence why this drill fits the plan)

No other text.`
}

// ── Weekly Arc prompt ─────────────────────────────────────────────────────────

export function buildWeeklyArcPrompt(
  totalWeeks: number,
  phases: Array<{ name: string; startWeek: number; endWeek: number; focusAreas: string[]; intensity: number }>,
  teamWeaknesses: string[],
  seasonType: string,
  ageGroup: string,
  skillLevel: string,
  characterThemes: string[],
): string {
  return `You are a youth basketball season planning expert. Create a weekly practice focus arc.

Season info:
- Total weeks: ${totalWeeks}
- Season type: ${seasonType}
- Age group: ${ageGroup}
- Skill level: ${skillLevel}
- Team weaknesses (prioritize): ${teamWeaknesses.join(', ') || 'none identified'}

Season phases:
${JSON.stringify(phases, null, 2)}

Character themes available: ${characterThemes.join(', ')}

Valid focus areas: Ball Handling, Shooting, Passing, Defense, Conditioning, Team Play

Create a week-by-week arc that:
1. Matches intensity to phase (1=low to 5=max)
2. Prioritizes team weaknesses early
3. Rotates focus to avoid monotony
4. Increases team play and conditioning in peak/playoff phases
5. Assigns character themes in sequence across weeks
6. Every 4th week should emphasize Defense

Return ONLY a valid JSON object:
{
  "weeks": [
    {
      "week": 1,
      "primaryFocus": "Ball Handling",
      "secondaryFocus": "Conditioning",
      "characterTheme": "Accountability",
      "intensity": 2
    }
  ],
  "summary": "Brief 1-2 sentence coaching rationale"
}

Include all ${totalWeeks} weeks. No other text.`
}

// ── Mid-Season Assessment prompt ──────────────────────────────────────────────

export function buildAssessmentPrompt(
  seasonName: string,
  currentWeek: number,
  totalWeeks: number,
  currentPhase: string,
  teamAvgScores: Record<string, number>,
  recentFocusAreas: string[],
  practiceCount: number,
): string {
  const skillList = Object.entries(teamAvgScores)
    .map(([k, v]) => `${k.replace('_', ' ')}: ${v.toFixed(1)}/10`)
    .join(', ')

  const progress = Math.round((currentWeek / totalWeeks) * 100)

  return `You are an experienced youth basketball coach reviewing a mid-season assessment.

Season: ${seasonName}
Progress: Week ${currentWeek} of ${totalWeeks} (${progress}% complete)
Current Phase: ${currentPhase}
Practices completed: ${practiceCount}
Recent focus areas: ${recentFocusAreas.join(', ') || 'varied'}

Team average skill scores: ${skillList || 'No evaluations yet'}

Provide a mid-season assessment. Return ONLY this JSON:
{
  "summary": "2-3 sentence overall assessment of where the team is",
  "strengths": ["3 specific team strengths based on the data"],
  "concerns": ["2-3 areas that need attention"],
  "practiceAdjustments": ["3 specific practice adjustments to make now"],
  "phaseRecommendation": "1-2 sentence recommendation for adjusting the remaining season plan"
}

No other text.`
}

// ── Eval Insights prompt ──────────────────────────────────────────────────────

export function buildEvalInsightsPrompt(
  playerName: string,
  skillScores: Record<string, number>,
  isFirstEval: boolean,
  previousScores?: Record<string, number>,
): string {
  const current = Object.entries(skillScores)
    .map(([k, v]) => `${k.replace('_', ' ')}: ${v}/10`)
    .join(', ')

  const changes = previousScores
    ? Object.entries(skillScores)
        .map(([k, v]) => {
          const prev = previousScores[k] ?? v
          const delta = v - prev
          return `${k.replace('_', ' ')}: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
        })
        .join(', ')
    : null

  return `You are a youth basketball coach. Give 3 quick coaching insights for a player evaluation.

Player: ${playerName}
${isFirstEval ? 'This is their first evaluation.' : 'Changes since last eval: ' + changes}
Current scores: ${current}

Return ONLY this JSON:
{
  "insights": [
    "Insight 1 about their strongest skill and how to leverage it",
    "Insight 2 about their biggest growth opportunity with a specific tip",
    "Insight 3 about their overall development trajectory"
  ],
  "topPriority": "One-sentence specific drill or focus recommendation for next practice"
}

Keep each insight under 20 words. No other text.`
}
