import { postForm } from './http'
import type { LightingAnalysisResult } from '@/types/lighting'

export const analyzeLighting = (
  sequence: File[],
  whiteRef: File | null,
  darkFrame: File | null,
): Promise<LightingAnalysisResult> => {
  const form = new FormData()
  sequence.forEach(f => form.append('sequence', f))
  if (whiteRef) form.append('white_ref', whiteRef)
  if (darkFrame) form.append('dark_frame', darkFrame)
  return postForm<LightingAnalysisResult>('/lighting/analyze', form)
}
