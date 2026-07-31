import axios from 'axios'
import type { ImageQualityResult } from '@/types/imageQuality'

const client = axios.create({ baseURL: '/api' })

export const analyzeQuality = (images: File[]): Promise<ImageQualityResult> => {
  const form = new FormData()
  images.forEach(f => form.append('images', f))
  return client
    .post<ImageQualityResult>('/quality/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
