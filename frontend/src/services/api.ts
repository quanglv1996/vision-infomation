import { getJson, postJson } from './http'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CalculateRequest,
  CalculationResponse,
  Formula,
  ParameterGroup,
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
