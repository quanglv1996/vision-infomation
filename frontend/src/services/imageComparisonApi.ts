import { postForm } from './http'
import type { ComparisonResult, ComparisonWeights, ImageItem } from '@/types/imageComparison'

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
  return postForm<ComparisonResult>('/comparison/analyze', form)
}
