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

export type RuntimeVersionInfo = {
  node: string
  npm: string
  python: string
  git: string
}

export type RuntimeServiceStatus = {
  name: string
  status: string
  detail: string
}

export type EnvironmentStatus = {
  platform: string
  workspace: string
  branch: string
  commit: string
  versions: RuntimeVersionInfo
  services: RuntimeServiceStatus[]
}

export type CodeStatus = {
  branch: string
  commit: string
  dirty: boolean
  changedFiles: number
  untrackedFiles: number
  clientPages: number
  clientComponents: number
  serverRoutes: number
  serverTests: number
}

export type StatusSummary = {
  environment: EnvironmentStatus
  code: CodeStatus
  modelProviders: ModelProvider[]
  knowledgeAssets: Array<{ category: string; count: number; description: string }>
}

export type ScreenshotResult = {
  filePath: string
  width: number
  height: number
  capturedAt: string
}
