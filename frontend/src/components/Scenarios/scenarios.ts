/**
 * Guided vision problems ("bài toán"). Each scenario picks a subset of the
 * knowledge-base parameters, gives them sensible defaults, and adds pass/fail
 * checks and suggestions on top of the backend calculation result.
 *
 * Field ids must exist in backend `knowledge/parameters.py`.
 */
import type { SvgIconComponent } from '@mui/icons-material'
import {
  CameraAlt as CameraIcon,
  CenterFocusWeak as LensIcon,
  Category as ObjectIcon,
  DirectionsRun as MotionIcon,
  Highlight as LightIcon,
  PhotoCamera as StaticIcon,
  Speed as DynamicIcon,
  ViewWeek as LineIcon,
  Straighten as MeasureIcon,
  QrCode2 as CodeIcon,
  Rule as AccuracyIcon,
} from '@mui/icons-material'
import { ACCENT } from '@/theme/theme'
import { formatNumber as f } from '@/utils/format'

export type Values = Record<string, number>
export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface CheckResult {
  status: CheckStatus
  detail: string
}

export interface ScenarioCheck {
  label: string
  /** Returns null while the values needed for the check are not available. */
  evaluate: (v: Values) => CheckResult | null
}

export interface ScenarioField {
  id: string
  hint?: string
  /** Visible only in these modes (all modes when omitted). */
  modes?: string[]
}

export interface ScenarioSection {
  title: string
  Icon: SvgIconComponent
  /** Show a sensor picker that fills resolution / pixel size. */
  sensorPicker?: 'area' | 'line'
  fields: ScenarioField[]
}

export interface ScenarioMode {
  id: string
  label: string
  hint: string
}

export interface Scenario {
  id: string
  title: string
  subtitle: string
  description: string
  accent: string
  Icon: SvgIconComponent
  docId: string
  guide: string[]
  modes: ScenarioMode[]
  sections: ScenarioSection[]
  defaults: Values
  /** Key results shown as tiles, in order (inputs of the current mode are skipped). */
  outputs: string[]
  checks: ScenarioCheck[]
  suggest?: (v: Values, mode: string) => string[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

const has = (v: Values, ...ids: string[]) => ids.every(id => typeof v[id] === 'number' && isFinite(v[id]))

const STANDARD_FOCALS = [4, 6, 8, 12, 16, 25, 35, 50, 75, 100]

// ── reusable modes ───────────────────────────────────────────────────────────

const OPTICS_MODES: ScenarioMode[] = [
  { id: 'wd',     label: 'Biết WD → tính tiêu cự',  hint: 'Bạn biết khoảng cách lắp camera; ứng dụng tính tiêu cự lens cần dùng.' },
  { id: 'focal',  label: 'Biết lens → tính WD',      hint: 'Bạn đã có lens; ứng dụng tính khoảng cách lắp camera để phủ đủ vật.' },
  { id: 'verify', label: 'Kiểm tra cấu hình có sẵn', hint: 'Bạn đã có cả lens và WD; ứng dụng kiểm tra FOV, độ phân giải, DOF.' },
]

// ── reusable sections ────────────────────────────────────────────────────────

const areaCameraSection: ScenarioSection = {
  title: 'Camera',
  Icon: CameraIcon,
  sensorPicker: 'area',
  fields: [
    { id: 'resolution_x', hint: 'Số pixel theo chiều ngang của cảm biến.' },
    { id: 'resolution_y', hint: 'Số pixel theo chiều dọc của cảm biến.' },
    { id: 'pixel_size', hint: 'Xem datasheet cảm biến (Sony IMX…). Pixel lớn → nhạy sáng hơn.' },
  ],
}

const objectSection = (withFeature = true, featureHint?: string): ScenarioSection => ({
  title: 'Vật cần chụp',
  Icon: ObjectIcon,
  fields: [
    { id: 'object_width', hint: 'Kích thước vật theo chiều ngang ảnh (X).' },
    { id: 'object_height', hint: 'Kích thước vật theo chiều dọc ảnh (Y).' },
    { id: 'fov_margin', modes: ['wd', 'focal'], hint: 'Biên dư để vật lệch vị trí vẫn nằm trong ảnh. Vật có đồ gá: 10 %, thả tự do: 30–50 %.' },
    { id: 'object_thickness', hint: 'Chênh lệch chiều cao (Z) cần nét cùng lúc — dùng để kiểm tra DOF.' },
    ...(withFeature ? [{ id: 'smallest_feature', hint: featureHint ?? 'Chi tiết/khuyết tật nhỏ nhất cần phát hiện.' }] : []),
  ],
})

const lensSection: ScenarioSection = {
  title: 'Lens & khoảng cách',
  Icon: LensIcon,
  fields: [
    { id: 'working_distance', modes: ['wd', 'verify'], hint: 'Khoảng cách từ mặt trước lens đến bề mặt vật.' },
    { id: 'focal_length', modes: ['focal', 'verify'], hint: 'Tiêu cự lens FA tiêu chuẩn: 8, 12, 16, 25, 35, 50 mm.' },
    { id: 'f_number', hint: 'F lớn (đóng khẩu) → DOF sâu hơn nhưng ảnh tối hơn và nhiễu xạ tăng. F4–F8 là phổ biến.' },
  ],
}

const lightSection: ScenarioSection = {
  title: 'Chiếu sáng',
  Icon: LightIcon,
  fields: [
    { id: 'wavelength', hint: 'Bước sóng đèn. Ánh sáng xanh dương (470 nm) cho độ nét cao nhất; đỏ/IR xuyên qua lớp màu tốt hơn.' },
  ],
}

// ── reusable checks ──────────────────────────────────────────────────────────

const featureCheck = (minPx: number, what = 'chi tiết nhỏ nhất'): ScenarioCheck => ({
  label: `Đủ pixel cho ${what} (≥ ${minPx} px)`,
  evaluate: v => {
    if (!has(v, 'pixels_per_feature', 'smallest_feature')) return null
    const p = v.pixels_per_feature
    const status: CheckStatus = p >= minPx ? 'pass' : p >= minPx * 0.7 ? 'warn' : 'fail'
    const fix = status === 'pass' ? '' : ` — cần ≤ ${f(v.smallest_feature / minPx)} mm/pixel: tăng độ phân giải hoặc thu nhỏ FOV`
    return { status, detail: `${f(p, 3)} px cho chi tiết ${f(v.smallest_feature)} mm${fix}` }
  },
})

const fovCheck: ScenarioCheck = {
  label: 'FOV phủ hết vật',
  evaluate: v => {
    if (!has(v, 'fov_x', 'object_width')) return null
    const okX = v.fov_x >= v.object_width
    const checkY = has(v, 'fov_y', 'object_height')
    const okY = !checkY || v.fov_y >= v.object_height
    const size = checkY ? `${f(v.fov_x)} × ${f(v.fov_y)}` : f(v.fov_x)
    const obj = checkY ? `${f(v.object_width)} × ${f(v.object_height)}` : f(v.object_width)
    let fix = ''
    if (!okX) fix = ' — FOV ngang thiếu: tăng WD hoặc dùng lens tiêu cự ngắn hơn'
    else if (!okY) fix = ' — FOV dọc thiếu: xoay camera 90°, tăng biên dư hoặc giảm độ phóng đại'
    return { status: okX && okY ? 'pass' : 'fail', detail: `FOV ${size} mm cho vật ${obj} mm${fix}` }
  },
}

const dofCheck: ScenarioCheck = {
  label: 'DOF đủ cho độ dày vật',
  evaluate: v => {
    if (!has(v, 'dof', 'object_thickness') || v.object_thickness <= 0) return null
    const r = v.dof / v.object_thickness
    const status: CheckStatus = r >= 1 ? 'pass' : r >= 0.7 ? 'warn' : 'fail'
    const fix = status === 'pass' ? '' : ' — tăng F-number (đóng khẩu), giảm độ phóng đại hoặc dùng lens telecentric'
    return { status, detail: `DOF ${f(v.dof, 3)} mm so với yêu cầu ${f(v.object_thickness)} mm${fix}` }
  },
}

const diffractionCheck: ScenarioCheck = {
  label: 'Nhiễu xạ không làm mờ pixel',
  evaluate: v => {
    if (!has(v, 'airy_disk', 'pixel_size')) return null
    const r = v.airy_disk / v.pixel_size
    const status: CheckStatus = r <= 2 ? 'pass' : r <= 3 ? 'warn' : 'fail'
    const nMax = has(v, 'wavelength') ? (2 * v.pixel_size) / (2.44 * v.wavelength / 1000) : null
    const fix = status === 'pass' || nMax === null ? '' : ` — nên dùng F ≤ ${f(nMax, 2)} hoặc ánh sáng bước sóng ngắn hơn`
    return { status, detail: `Đĩa Airy ${f(v.airy_disk, 3)} µm ≈ ${f(r, 2)} pixel${fix}` }
  },
}

const blurCheck: ScenarioCheck = {
  label: 'Nhòe chuyển động trong giới hạn',
  evaluate: v => {
    if (!has(v, 'blur_pixels')) return null
    const lim = has(v, 'max_blur_allowed') ? v.max_blur_allowed : 1
    const b = v.blur_pixels
    const status: CheckStatus = b <= lim ? 'pass' : b <= lim * 1.5 ? 'warn' : 'fail'
    const fix = status !== 'pass' && has(v, 'max_exposure_time')
      ? ` — giảm phơi sáng xuống ≤ ${f(v.max_exposure_time, 3)} µs`
      : ''
    return { status, detail: `Nhòe ${f(b, 3)} px (cho phép ${f(lim)} px)${fix}` }
  },
}

const fpsCheck: ScenarioCheck = {
  label: 'Camera đủ nhanh, không bỏ sót vùng',
  evaluate: v => {
    if (!has(v, 'required_fps', 'fps')) return null
    const ok = v.fps >= v.required_fps
    return {
      status: ok ? 'pass' : 'fail',
      detail: `Cần ${f(v.required_fps, 3)} fps, camera đạt ${f(v.fps)} fps${ok ? '' : ' — chọn camera nhanh hơn, giảm ROI theo Y hoặc giảm chồng lấn'}`,
    }
  },
}

const lightBudgetCheck: ScenarioCheck = {
  label: 'Ánh sáng đủ cho phơi sáng ngắn',
  evaluate: v => {
    if (!has(v, 'max_exposure_time')) return null
    const t = v.max_exposure_time
    if (t >= 200) return { status: 'pass', detail: `Phơi sáng tối đa ${f(t, 3)} µs — đèn liên tục thông thường là đủ` }
    if (t >= 30) return { status: 'warn', detail: `Phơi sáng tối đa ${f(t, 3)} µs — nên dùng đèn công suất cao hoặc chế độ strobe` }
    return { status: 'fail', detail: `Phơi sáng tối đa chỉ ${f(t, 3)} µs — bắt buộc strobe overdrive, tăng gain hoặc mở khẩu` }
  },
}

// ── suggestions ──────────────────────────────────────────────────────────────

function lensSuggestions(v: Values, mode: string): string[] {
  const out: string[] = []
  if (mode === 'wd' && has(v, 'focal_length', 'magnification', 'working_distance', 'sensor_width')) {
    const f0 = v.focal_length
    const lower = [...STANDARD_FOCALS].reverse().find(x => x <= f0)
    const upper = STANDARD_FOCALS.find(x => x > f0)
    for (const fc of [lower, upper]) {
      if (!fc || fc >= v.working_distance) continue
      const m = fc / (v.working_distance - fc)
      const fov = v.sensor_width / m
      const wdKeep = fc * (1 + 1 / v.magnification)
      out.push(`Lens chuẩn ${fc} mm: giữ WD ${f(v.working_distance)} mm → FOV ngang ${f(fov)} mm; hoặc giữ FOV → đặt WD ≈ ${f(wdKeep)} mm.`)
    }
  }
  if (mode === 'focal' && has(v, 'working_distance')) {
    out.push(`Lắp camera cách vật ≈ ${f(v.working_distance)} mm. Nếu nhỏ hơn khoảng lấy nét tối thiểu (MOD) của lens, dùng extension tube hoặc lens macro.`)
  }
  if (has(v, 'sensor_diagonal')) {
    out.push(`Chọn lens có vòng ảnh (image circle) ≥ ${f(v.sensor_diagonal, 3)} mm để không bị tối góc.`)
  }
  return out
}

// ── scenarios ────────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  {
    id: 'static',
    title: 'Chụp ảnh tĩnh',
    subtitle: 'Vật đứng yên — kiểm tra ngoại quan, phát hiện lỗi',
    description: 'Vật được dừng lại (hoặc đặt trên đồ gá) khi chụp. Bài toán chính là chọn camera + lens sao cho FOV phủ hết vật, đủ pixel cho chi tiết nhỏ nhất và đủ độ sâu trường ảnh.',
    accent: ACCENT.blue,
    Icon: StaticIcon,
    docId: 'scenario-static',
    guide: [
      'Chọn cảm biến camera (hoặc nhập độ phân giải & kích thước pixel).',
      'Nhập kích thước vật, biên dư FOV và chi tiết nhỏ nhất cần thấy.',
      'Chọn chế độ: biết WD hay đã có lens, rồi nhập giá trị tương ứng.',
      'Đọc bảng kiểm tra bên phải; chỉnh thông số cho tới khi tất cả đạt.',
    ],
    modes: OPTICS_MODES,
    sections: [areaCameraSection, objectSection(), lensSection, lightSection],
    defaults: {
      resolution_x: 2448, resolution_y: 2048, pixel_size: 3.45,
      object_width: 80, object_height: 60, fov_margin: 20, object_thickness: 5, smallest_feature: 0.2,
      working_distance: 300, focal_length: 25, f_number: 5.6, wavelength: 525,
    },
    outputs: ['focal_length', 'working_distance', 'fov_x', 'fov_y', 'mm_per_pixel', 'pixels_per_feature',
              'magnification', 'dof', 'airy_disk', 'sensor_diagonal', 'fov_margin', 'detectable_feature'],
    checks: [fovCheck, featureCheck(3), dofCheck, diffractionCheck],
    suggest: lensSuggestions,
  },
  {
    id: 'dynamic',
    title: 'Chụp ảnh động',
    subtitle: 'Vật chạy trên băng tải — camera area scan',
    description: 'Vật di chuyển trong lúc chụp. Ngoài FOV và độ phân giải, cần giới hạn thời gian phơi sáng để ảnh không bị nhòe và đảm bảo tốc độ khung hình đủ để không bỏ sót vật.',
    accent: ACCENT.amber,
    Icon: DynamicIcon,
    docId: 'scenario-dynamic',
    guide: [
      'Chọn camera và nhập FPS tối đa của camera.',
      'Nhập kích thước vật và thông số lens như bài toán chụp tĩnh.',
      'Nhập tốc độ vật, thời gian phơi sáng dự kiến và mức nhòe cho phép.',
      'Ứng dụng tính phơi sáng tối đa, độ nhòe thực tế và FPS cần thiết (giả sử vật chạy theo trục Y của ảnh).',
    ],
    modes: OPTICS_MODES,
    sections: [
      { ...areaCameraSection, fields: [...areaCameraSection.fields, { id: 'fps', hint: 'FPS tối đa của camera ở độ phân giải đầy đủ (datasheet).' }] },
      objectSection(),
      lensSection,
      {
        title: 'Chuyển động',
        Icon: MotionIcon,
        fields: [
          { id: 'speed', hint: 'Tốc độ vật so với camera. 1 m/phút = 16.67 mm/s.' },
          { id: 'exposure_time', hint: 'Thời gian phơi sáng dự kiến đặt trên camera.' },
          { id: 'max_blur_allowed', hint: 'Đo lường: ≤ 0.5 px. Phát hiện lỗi: ≤ 1 px. Kiểm tra có/không: ≤ 2 px.' },
          { id: 'frame_overlap', hint: 'Chụp liên tục (không trigger theo vật): 2 ảnh liên tiếp chồng lên nhau bao nhiêu %.' },
        ],
      },
      lightSection,
    ],
    defaults: {
      resolution_x: 2448, resolution_y: 2048, pixel_size: 3.45, fps: 30,
      object_width: 80, object_height: 60, fov_margin: 20, object_thickness: 5, smallest_feature: 0.2,
      working_distance: 300, focal_length: 25, f_number: 4, wavelength: 525,
      speed: 500, exposure_time: 100, max_blur_allowed: 1, frame_overlap: 20,
    },
    outputs: ['max_exposure_time', 'blur_pixels', 'motion_blur', 'required_fps', 'conveyor_speed',
              'focal_length', 'working_distance', 'fov_x', 'fov_y', 'mm_per_pixel', 'pixels_per_feature', 'dof'],
    checks: [blurCheck, fpsCheck, lightBudgetCheck, fovCheck, featureCheck(3), dofCheck],
    suggest: (v, mode) => {
      const out = lensSuggestions(v, mode)
      if (has(v, 'fov_y', 'frame_overlap')) {
        out.unshift(`Khi trigger theo vật (cảm biến quang/encoder): khoảng cách tối đa giữa 2 lần chụp = ${f(v.fov_y * (1 - v.frame_overlap / 100))} mm.`)
      }
      if (has(v, 'max_exposure_time')) {
        out.unshift(`Đặt exposure ≤ ${f(v.max_exposure_time, 3)} µs; bù sáng bằng đèn strobe hoặc tăng gain (chấp nhận nhiễu).`)
      }
      out.push('Dùng camera global shutter — rolling shutter làm méo vật chuyển động.')
      return out
    },
  },
  {
    id: 'linescan',
    title: 'Quét dòng (Line scan)',
    subtitle: 'Vật liệu cuộn, băng liên tục, vật trụ xoay',
    description: 'Camera line scan chụp từng dòng 1 pixel khi vật chạy qua. Cần đồng bộ tần số quét dòng với tốc độ vật (thường bằng encoder) để pixel vuông và ảnh không bị co/giãn.',
    accent: ACCENT.violet,
    Icon: LineIcon,
    docId: 'scenario-linescan',
    guide: [
      'Chọn cảm biến line scan (số pixel × kích thước pixel).',
      'Nhập bề rộng vật liệu (web width) và biên dư.',
      'Nhập tốc độ vật, độ phân giải encoder và line rate tối đa của camera.',
      'Kiểm tra line rate, chu kỳ dòng so với thời gian phơi sáng và bộ chia encoder.',
    ],
    modes: OPTICS_MODES,
    sections: [
      {
        title: 'Camera line scan',
        Icon: CameraIcon,
        sensorPicker: 'line',
        fields: [
          { id: 'resolution_x', hint: 'Số pixel trên một dòng: 2k, 4k, 8k, 16k.' },
          { id: 'pixel_size', hint: 'Kích thước pixel của cảm biến line.' },
          { id: 'max_line_rate', hint: 'Line rate tối đa trong datasheet (kHz).' },
        ],
      },
      {
        title: 'Vật liệu',
        Icon: ObjectIcon,
        fields: [
          { id: 'object_width', hint: 'Bề rộng vật liệu / vùng cần quét theo phương ngang.' },
          { id: 'fov_margin', modes: ['wd', 'focal'], hint: 'Biên dư cho vật liệu chạy lệch mép.' },
          { id: 'object_thickness', hint: 'Dao động chiều cao (Z) của bề mặt khi chạy.' },
          { id: 'smallest_feature', hint: 'Khuyết tật nhỏ nhất cần phát hiện.' },
        ],
      },
      lensSection,
      {
        title: 'Chuyển động & encoder',
        Icon: MotionIcon,
        fields: [
          { id: 'speed', hint: 'Tốc độ vật liệu chạy qua camera.' },
          { id: 'encoder_resolution', hint: 'Số xung/mm của encoder gắn trên con lăn (sau nhân 4 nếu dùng A/B quadrature).' },
          { id: 'exposure_time', hint: 'Thời gian tích phân mỗi dòng.' },
        ],
      },
      lightSection,
    ],
    defaults: {
      resolution_x: 4096, pixel_size: 7, max_line_rate: 40,
      object_width: 500, fov_margin: 10, object_thickness: 2, smallest_feature: 0.5,
      working_distance: 600, focal_length: 35, f_number: 4, wavelength: 525,
      speed: 1000, encoder_resolution: 20, exposure_time: 50,
    },
    outputs: ['line_rate', 'line_period', 'encoder_pulses_per_line', 'mm_per_pixel', 'fov_x',
              'focal_length', 'working_distance', 'magnification', 'pixels_per_feature', 'dof', 'conveyor_speed'],
    checks: [
      {
        label: 'Line rate trong khả năng camera',
        evaluate: v => {
          if (!has(v, 'line_rate', 'max_line_rate')) return null
          const r = v.line_rate / v.max_line_rate
          const status: CheckStatus = r <= 0.9 ? 'pass' : r <= 1 ? 'warn' : 'fail'
          const fix = status === 'fail' ? ' — giảm tốc độ, tăng mm/pixel hoặc chọn camera nhanh hơn' : status === 'warn' ? ' — sát giới hạn, nên dự phòng ≥ 10 %' : ''
          return { status, detail: `Cần ${f(v.line_rate, 3)} kHz, camera tối đa ${f(v.max_line_rate)} kHz${fix}` }
        },
      },
      {
        label: 'Phơi sáng ≤ chu kỳ dòng',
        evaluate: v => {
          if (!has(v, 'exposure_time', 'line_period')) return null
          const ok = v.exposure_time <= v.line_period
          return {
            status: ok ? 'pass' : 'fail',
            detail: `Exposure ${f(v.exposure_time)} µs, chu kỳ dòng ${f(v.line_period, 3)} µs${ok ? '' : ' — giảm exposure và tăng cường độ đèn line'}`,
          }
        },
      },
      {
        label: 'Encoder đủ mịn để trigger từng dòng',
        evaluate: v => {
          if (!has(v, 'encoder_pulses_per_line', 'encoder_resolution', 'mm_per_pixel')) return null
          const x = v.encoder_pulses_per_line
          if (x < 1) {
            return { status: 'fail', detail: `Chỉ ${f(x, 3)} xung/dòng — cần encoder ≥ ${f(1 / v.mm_per_pixel, 3)} xung/mm hoặc dùng bộ nhân xung` }
          }
          const div = Math.round(x)
          const along = div / v.encoder_resolution
          const err = Math.abs(along - v.mm_per_pixel) / v.mm_per_pixel
          return {
            status: err <= 0.1 ? 'pass' : 'warn',
            detail: `Bộ chia ${div} xung/dòng → pixel dọc ${f(along)} mm, ngang ${f(v.mm_per_pixel)} mm (lệch ${f(err * 100, 2)} %)`,
          }
        },
      },
      fovCheck,
      featureCheck(3, 'khuyết tật nhỏ nhất'),
      dofCheck,
    ],
    suggest: (v, mode) => {
      const out: string[] = []
      if (has(v, 'line_period')) out.push(`Exposure tối đa bằng chu kỳ dòng ${f(v.line_period, 3)} µs — đèn line LED công suất cao, hội tụ thành vạch hẹp.`)
      if (has(v, 'line_rate')) out.push(`Một ảnh 1000 dòng tương ứng ${f(1000 * (v.mm_per_pixel ?? 0))} mm chiều dài vật liệu, mất ${f(1000 / v.line_rate)} ms.`)
      return [...out, ...lensSuggestions(v, mode)]
    },
  },
  {
    id: 'measurement',
    title: 'Đo kích thước chính xác',
    subtitle: 'Gauging — đo đường kính, khoảng cách, vị trí',
    description: 'Đo kích thước bằng camera cần độ phân giải đủ nhỏ so với dung sai (quy tắc 10:1), tránh sai số phối cảnh và méo lens. Ứng dụng tính mm/pixel tối đa và độ phân giải tối thiểu cần thiết.',
    accent: ACCENT.emerald,
    Icon: MeasureIcon,
    docId: 'scenario-measurement',
    guide: [
      'Nhập dải dung sai của kích thước cần đo (USL − LSL).',
      'Ứng dụng áp dụng quy tắc 10:1 → độ chính xác cần đạt → mm/pixel tối đa (sub-pixel 1/3 px).',
      'Chọn camera và lens; kiểm tra sai số ước tính và sai số phối cảnh.',
      'Sau khi lắp đặt: hiệu chuẩn hình học (module Hình học) và đánh giá GR&R (module Kiểm định).',
    ],
    modes: OPTICS_MODES,
    sections: [
      areaCameraSection,
      {
        title: 'Vật & yêu cầu đo',
        Icon: AccuracyIcon,
        fields: [
          { id: 'object_width', hint: 'Kích thước vùng cần đo theo X.' },
          { id: 'object_height', hint: 'Kích thước vùng cần đo theo Y.' },
          { id: 'fov_margin', modes: ['wd', 'focal'], hint: 'Đo lường thường dùng đồ gá tốt → biên dư nhỏ (5–10 %).' },
          { id: 'object_thickness', hint: 'Chênh lệch Z giữa các cạnh đo hoặc dao động vị trí theo Z.' },
          { id: 'tolerance', hint: 'Ví dụ kích thước 10 ± 0.025 mm → dải dung sai 0.05 mm.' },
        ],
      },
      lensSection,
      lightSection,
    ],
    defaults: {
      resolution_x: 4096, resolution_y: 3000, pixel_size: 3.45,
      object_width: 40, object_height: 30, fov_margin: 10, object_thickness: 2, tolerance: 0.05,
      working_distance: 200, focal_length: 50, f_number: 8, wavelength: 470,
    },
    outputs: ['required_accuracy', 'max_mm_per_pixel', 'min_resolution_x', 'mm_per_pixel', 'measurement_error',
              'repeatability', 'focal_length', 'working_distance', 'fov_x', 'fov_y', 'dof', 'airy_disk'],
    checks: [
      {
        label: 'Sai số đo ≤ độ chính xác yêu cầu',
        evaluate: v => {
          if (!has(v, 'measurement_error', 'required_accuracy')) return null
          const ok = v.measurement_error <= v.required_accuracy
          return {
            status: ok ? 'pass' : 'fail',
            detail: `Sai số ước tính ${f(v.measurement_error)} mm, yêu cầu ${f(v.required_accuracy)} mm${ok ? '' : ' — tăng độ phân giải hoặc thu nhỏ FOV'}`,
          }
        },
      },
      {
        label: 'Độ phân giải camera đủ',
        evaluate: v => {
          if (!has(v, 'resolution_x', 'min_resolution_x')) return null
          const ok = v.resolution_x >= v.min_resolution_x
          return {
            status: ok ? 'pass' : 'fail',
            detail: `Camera ${f(v.resolution_x)} px, cần tối thiểu ${f(Math.ceil(v.min_resolution_x))} px theo chiều ngang`,
          }
        },
      },
      {
        label: 'Sai số phối cảnh (lens thường)',
        evaluate: v => {
          if (!has(v, 'object_width', 'object_thickness', 'working_distance', 'required_accuracy') || v.object_thickness <= 0) return null
          const err = (v.object_width * v.object_thickness) / v.working_distance
          const ok = err <= v.required_accuracy
          return {
            status: ok ? 'pass' : 'warn',
            detail: `Lệch Z ${f(v.object_thickness)} mm làm kích thước ${f(v.object_width)} mm sai ≈ ${f(err)} mm${ok ? '' : ' — dùng lens telecentric hoặc cố định chính xác độ cao vật'}`,
          }
        },
      },
      dofCheck,
      diffractionCheck,
      fovCheck,
    ],
    suggest: (v, mode) => {
      const out: string[] = []
      if (has(v, 'repeatability')) out.push(`Độ lặp lại kỳ vọng ≈ ±${f(v.repeatability)} mm (thuật toán sub-pixel ~1/10 px) nếu chiếu sáng và cơ khí ổn định.`)
      out.push('Đo lường nên dùng đèn backlight (đo biên dạng) hoặc đèn đồng trục, ánh sáng xanh dương để biên sắc nét.')
      out.push('Hiệu chuẩn méo lens + mm/pixel bằng bàn cờ ở module Hình học trước khi đo.')
      return [...out, ...lensSuggestions(v, mode)]
    },
  },
  {
    id: 'code',
    title: 'Đọc mã / OCR',
    subtitle: 'Barcode 1D, QR, DataMatrix, ký tự in',
    description: 'Đọc mã cần đủ pixel trên mỗi module (ô) của mã: 1D ≥ 2 px/vạch hẹp, 2D (QR/DataMatrix) ≥ 4 px/module, OCR ≥ 3 px nét chữ và chiều cao ký tự 20–30 px.',
    accent: ACCENT.pink,
    Icon: CodeIcon,
    docId: 'scenario-code',
    guide: [
      'Nhập vùng có thể xuất hiện mã (kích thước nhãn + dung sai vị trí).',
      'Nhập kích thước module (ô nhỏ nhất) của mã vào “Chi tiết nhỏ nhất”.',
      'Chọn camera và lens; mục tiêu ≥ 4 px/module cho mã 2D.',
      'Nếu mã in trên bề mặt bóng, dùng đèn dome hoặc chiếu xiên để tránh lóa.',
    ],
    modes: OPTICS_MODES,
    sections: [
      areaCameraSection,
      objectSection(true, 'Kích thước module (ô) của mã — ví dụ DataMatrix 0.25 mm, vạch hẹp barcode 0.33 mm.'),
      lensSection,
      lightSection,
    ],
    defaults: {
      resolution_x: 1440, resolution_y: 1080, pixel_size: 3.45,
      object_width: 30, object_height: 20, fov_margin: 30, object_thickness: 3, smallest_feature: 0.25,
      working_distance: 150, focal_length: 16, f_number: 4, wavelength: 625,
    },
    outputs: ['pixels_per_feature', 'mm_per_pixel', 'fov_x', 'fov_y', 'focal_length', 'working_distance', 'dof', 'magnification'],
    checks: [featureCheck(4, 'module mã 2D'), fovCheck, dofCheck, diffractionCheck],
    suggest: (v, mode) => {
      const out: string[] = []
      if (has(v, 'mm_per_pixel')) {
        out.push(`Barcode 1D: vạch hẹp nên ≥ ${f(2 * v.mm_per_pixel)} mm (2 px). OCR: chiều cao ký tự ≥ ${f(25 * v.mm_per_pixel)} mm (25 px).`)
      }
      return [...out, ...lensSuggestions(v, mode)]
    },
  },
]
