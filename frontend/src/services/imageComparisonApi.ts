import axios from 'axios'
import type { ComparisonResult, ComparisonWeights, ImageItem } from '@/types/imageComparison'

const client = axios.create({ baseURL: '/api' })

export const analyzeComparison = (
  items: ImageItem[],
  weights: ComparisonWeights,
  grayscale = false,
): Promise<ComparisonResult> => {
  const form = new FormData()
  items.forEach(item => form.append('images', item.file))
  form.append('names', JSON.stringify(items.map(i => i.name)))
  form.append('grayscale', String(grayscale))
  form.append('weights', JSON.stringify(weights))
  return client
    .post<ComparisonResult>('/comparison/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
