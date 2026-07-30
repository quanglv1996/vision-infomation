import axios from 'axios'
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

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Parameters & Formulas ──────────────────────────────────────────────────

export const fetchParameterGroups = (): Promise<ParameterGroup[]> =>
  client.get<ParameterGroup[]>('/parameters').then(r => r.data)

export const fetchFormulas = (): Promise<Formula[]> =>
  client.get<Formula[]>('/formulas').then(r => r.data)

// ── Calculation ────────────────────────────────────────────────────────────

export const runCalculation = (body: CalculateRequest): Promise<CalculationResponse> =>
  client.post<CalculationResponse>('/calculate', body).then(r => r.data)

export const runAnalyze = (body: AnalyzeRequest): Promise<AnalyzeResponse> =>
  client.post<AnalyzeResponse>('/calculate/analyze', body).then(r => r.data)

// ── Recommendations ────────────────────────────────────────────────────────

export const fetchRecommendations = (body: RecommendRequest): Promise<SystemRecommendation[]> =>
  client.post<SystemRecommendation[]>('/recommend', body).then(r => r.data)

// ── Projects ───────────────────────────────────────────────────────────────

export const fetchProjects = (): Promise<ProjectSummary[]> =>
  client.get<ProjectSummary[]>('/projects').then(r => r.data)

export const fetchProject = (id: string): Promise<Project> =>
  client.get<Project>(`/projects/${id}`).then(r => r.data)

export const saveProject = (body: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> =>
  client.post<Project>('/projects', body).then(r => r.data)

export const deleteProject = (id: string): Promise<void> =>
  client.delete(`/projects/${id}`).then(() => undefined)
