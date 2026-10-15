import { postForm } from './http'
import type { ColorCalibrationResult } from '@/types/colorCalibration'

export const analyzeColor = (
  image: File,
  imageType: string,
): Promise<ColorCalibrationResult> => {
  const form = new FormData()
  form.append('image', image)
  form.append('image_type', imageType)
  return postForm<ColorCalibrationResult>('/color/analyze', form)
}
