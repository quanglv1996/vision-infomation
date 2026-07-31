import axios from 'axios'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

const client = axios.create({ baseURL: '/api' })

export const analyzeColor = (
  image: File,
  imageType: string,
): Promise<ColorCalibrationResult> => {
  const form = new FormData()
  form.append('image', image)
  form.append('image_type', imageType)
  return client
    .post<ColorCalibrationResult>('/color/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
