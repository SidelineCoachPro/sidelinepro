// ── Practice Plan ────────────────────────────────────────────────────────────

export interface AIPracticeDrill {
  drillId: string
  name: string
  category: string
  durationMins: number
  notes: string
}

export interface PracticePlanResponse {
  drills: AIPracticeDrill[]
}

// ── Dev Plan ─────────────────────────────────────────────────────────────────

export interface AIDevDrill {
  name: string
  duration_mins: number
  instructions: string
  focus: string
}

export interface DevPlanResponse {
  drills: AIDevDrill[]
  duration_mins: number
  message_text: string
}

// ── Drill Suggestions ─────────────────────────────────────────────────────────

export interface DrillSuggestion {
  drillId: string
  name: string
  category: string
  durationMins: number
  reason: string
}

export interface SuggestResponse {
  suggestions: DrillSuggestion[]
}

// ── Weekly Arc ────────────────────────────────────────────────────────────────

export interface AIWeeklyFocus {
  week: number
  primaryFocus: string
  secondaryFocus: string
  characterTheme: string
  intensity: number
  reasoning?: string
}

export interface WeeklyArcResponse {
  weeks: AIWeeklyFocus[]
  summary: string
}

// ── Mid-Season Assessment ─────────────────────────────────────────────────────

export interface AssessmentResponse {
  summary: string
  strengths: string[]
  concerns: string[]
  practiceAdjustments: string[]
  phaseRecommendation: string
}

// ── Eval Insights ─────────────────────────────────────────────────────────────

export interface EvalInsightsResponse {
  insights: string[]
  topPriority: string
}
