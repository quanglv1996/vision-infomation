import { postForm } from './http'
import type { ImageQualityResult } from '@/types/imageQuality'

export const analyzeQuality = (images: File[]): Promise<ImageQualityResult> => {
  const form = new FormData()
  images.forEach(f => form.append('images', f))
  return postForm<ImageQualityResult>('/quality/analyze', form)
}
