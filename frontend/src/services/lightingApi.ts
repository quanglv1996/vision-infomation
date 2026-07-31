import axios from 'axios'
import type { LightingAnalysisResult } from '@/types/lighting'

const client = axios.create({ baseURL: '/api' })

export const analyzeLighting = (
  sequence: File[],
  whiteRef: File | null,
  darkFrame: File | null,
): Promise<LightingAnalysisResult> => {
  const form = new FormData()
  sequence.forEach(f => form.append('sequence', f))
  if (whiteRef) form.append('white_ref', whiteRef)
  if (darkFrame) form.append('dark_frame', darkFrame)

  return client
    .post<LightingAnalysisResult>('/lighting/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
