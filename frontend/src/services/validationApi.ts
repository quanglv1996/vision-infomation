import axios from 'axios'
import type { ValidationRequest, ValidationResult } from '@/types/validation'

const client = axios.create({ baseURL: '/api' })

export const runValidation = (req: ValidationRequest): Promise<ValidationResult> =>
  client.post<ValidationResult>('/validation/analyze', req).then(r => r.data)
