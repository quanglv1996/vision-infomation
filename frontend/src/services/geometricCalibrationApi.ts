import axios from 'axios'
import type { CalibrationParams, GeometricCalibrationResult } from '@/types/geometricCalibration'

const client = axios.create({ baseURL: '/api' })

export const calibrateGeometric = (
  images: File[],
  params: CalibrationParams,
): Promise<GeometricCalibrationResult> => {
  const form = new FormData()
  images.forEach(f => form.append('images', f))
  form.append('pattern_type', params.patternType)
  form.append('board_cols', String(params.boardCols))
  form.append('board_rows', String(params.boardRows))
  form.append('square_size_mm', String(params.squareSizeMm))
  if (params.sensorWidthMm)     form.append('sensor_width_mm',      String(params.sensorWidthMm))
  if (params.workingDistanceMm) form.append('working_distance_mm',  String(params.workingDistanceMm))
  return client
    .post<GeometricCalibrationResult>('/calibration/geometric', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
