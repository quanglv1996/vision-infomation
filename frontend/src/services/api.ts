import { getJson, http, postJson } from './http'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CalculateRequest,
  CalculationResponse,
  Formula,
  ParameterGroup,
  Project,
  ProjectSummary,
  RecommendRequest,
  SystemRecommendation,
} from '@/types'

// ── Parameters & Formulas ──────────────────────────────────────────────────

export const fetchParameterGroups = (): Promise<ParameterGroup[]> =>
  getJson<ParameterGroup[]>('/parameters')

export const fetchFormulas = (): Promise<Formula[]> =>
  getJson<Formula[]>('/formulas')

// ── Calculation ────────────────────────────────────────────────────────────

export const runCalculation = (body: CalculateRequest): Promise<CalculationResponse> =>
  postJson<CalculationResponse>('/calculate', body)

export const runAnalyze = (body: AnalyzeRequest): Promise<AnalyzeResponse> =>
  postJson<AnalyzeResponse>('/calculate/analyze', body)

// ── Recommendations ────────────────────────────────────────────────────────

export const fetchRecommendations = (body: RecommendRequest): Promise<SystemRecommendation[]> =>
  postJson<SystemRecommendation[]>('/recommend', body)

// ── Projects ───────────────────────────────────────────────────────────────

export const fetchProjects = (): Promise<ProjectSummary[]> =>
  getJson<ProjectSummary[]>('/projects')

export const fetchProject = (id: string): Promise<Project> =>
  getJson<Project>(`/projects/${id}`)

export const saveProject = (body: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> =>
  postJson<Project>('/projects', body)

export const deleteProject = (id: string): Promise<void> =>
  http.delete(`/projects/${id}`).then(() => undefined)
