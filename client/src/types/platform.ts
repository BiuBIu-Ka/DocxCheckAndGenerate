export type ReviewIssue = {
  id: string
  title: string
  severity: 'high' | 'medium' | 'low'
  rule: string
  suggestion: string
  location: string
  status: 'open' | 'accepted' | 'resolved'
}

export type ReviewResponse = {
  score: number
  issues: ReviewIssue[]
  summary: string
}

export type GeneratedSection = {
  title: string
  body: string
}

export type GenerationResponse = {
  title: string
  documentType: string
  sections: GeneratedSection[]
  review: ReviewResponse
}

export type KnowledgeSummary = {
  assets: Array<{ category: string; count: number; description: string }>
  hotTerms: string[]
}

export type ModelProvider = {
  provider: string
  endpoint: string
  model: string
  status: string
  default: boolean
}

export type ScreenshotResult = {
  filePath: string
  width: number
  height: number
  capturedAt: string
}
