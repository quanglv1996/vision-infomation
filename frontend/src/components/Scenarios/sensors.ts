/** Common industrial sensors — picking one fills resolution and pixel size. */
export interface SensorPreset {
  id: string
  label: string
  format: string
  resolution_x: number
  resolution_y?: number   // omitted for line-scan sensors
  pixel_size: number
}

export const AREA_SENSORS: SensorPreset[] = [
  { id: 'imx287', label: 'Sony IMX287 · 0.4 MP',     format: '1/2.9"', resolution_x: 720,  resolution_y: 540,  pixel_size: 6.9 },
  { id: 'py1300', label: 'Python 1300 · 1.3 MP',     format: '1/2"',   resolution_x: 1280, resolution_y: 1024, pixel_size: 4.8 },
  { id: 'imx273', label: 'Sony IMX273 · 1.6 MP',     format: '1/2.9"', resolution_x: 1440, resolution_y: 1080, pixel_size: 3.45 },
  { id: 'imx174', label: 'Sony IMX174 · 2.3 MP',     format: '1/1.2"', resolution_x: 1920, resolution_y: 1200, pixel_size: 5.86 },
  { id: 'imx252', label: 'Sony IMX252 · 3.2 MP',     format: '1/1.8"', resolution_x: 2048, resolution_y: 1536, pixel_size: 3.45 },
  { id: 'cmv4000', label: 'CMV4000 · 4 MP',          format: '1"',     resolution_x: 2048, resolution_y: 2048, pixel_size: 5.5 },
  { id: 'imx264', label: 'Sony IMX264/250 · 5 MP',   format: '2/3"',   resolution_x: 2448, resolution_y: 2048, pixel_size: 3.45 },
  { id: 'imx178', label: 'Sony IMX178 · 6.4 MP',     format: '1/1.8"', resolution_x: 3072, resolution_y: 2048, pixel_size: 2.4 },
  { id: 'imx304', label: 'Sony IMX304/253 · 12 MP',  format: '1.1"',   resolution_x: 4096, resolution_y: 3000, pixel_size: 3.45 },
  { id: 'imx226', label: 'Sony IMX226 · 12 MP',      format: '1/1.7"', resolution_x: 4000, resolution_y: 3000, pixel_size: 1.85 },
  { id: 'imx183', label: 'Sony IMX183 · 20 MP',      format: '1"',     resolution_x: 5472, resolution_y: 3648, pixel_size: 2.4 },
  { id: 'imx541', label: 'Sony IMX541 · 20 MP',      format: '1.1"',   resolution_x: 4512, resolution_y: 4512, pixel_size: 2.74 },
  { id: 'imx530', label: 'Sony IMX530 · 24.5 MP',    format: '1.2"',   resolution_x: 5328, resolution_y: 4608, pixel_size: 2.74 },
]

export const LINE_SENSORS: SensorPreset[] = [
  { id: 'l2k14', label: '2k · 14 µm',   format: '28.7 mm', resolution_x: 2048,  pixel_size: 14 },
  { id: 'l2k7',  label: '2k · 7 µm',    format: '14.3 mm', resolution_x: 2048,  pixel_size: 7 },
  { id: 'l4k7',  label: '4k · 7 µm',    format: '28.7 mm', resolution_x: 4096,  pixel_size: 7 },
  { id: 'l4k10', label: '4k · 10 µm',   format: '41 mm',   resolution_x: 4096,  pixel_size: 10 },
  { id: 'l8k5',  label: '8k · 5 µm',    format: '41 mm',   resolution_x: 8192,  pixel_size: 5 },
  { id: 'l8k7',  label: '8k · 7 µm',    format: '57.3 mm', resolution_x: 8192,  pixel_size: 7 },
  { id: 'l16k3', label: '16k · 3.5 µm', format: '57.3 mm', resolution_x: 16384, pixel_size: 3.5 },
]
