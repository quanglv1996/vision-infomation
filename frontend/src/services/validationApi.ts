import { postJson } from './http'
import type { ValidationRequest, ValidationResult } from '@/types/validation'

export const runValidation = (req: ValidationRequest): Promise<ValidationResult> =>
  postJson<ValidationResult>('/validation/analyze', req)
