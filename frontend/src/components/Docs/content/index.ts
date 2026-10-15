import type { SvgIconComponent } from '@mui/icons-material'
import {
  School as FundamentalsIcon,
  Extension as ScenarioIcon,
  Tune as CalibIcon,
} from '@mui/icons-material'
import { ACCENT } from '@/theme/theme'
import type { DocArticle } from '../types'
import { FUNDAMENTALS } from './fundamentals'
import { SCENARIO_DOCS } from './scenarios'
import { CALIBRATION_DOCS } from './calibration'

export interface DocCategory {
  name: string
  description: string
  accent: string
  Icon: SvgIconComponent
}

export const DOC_CATEGORIES: DocCategory[] = [
  { name: 'Nền tảng',               description: 'Cảm biến, lens, FOV, DOF, chiếu sáng — kiến thức nền để tính toán hệ vision.', accent: ACCENT.blue,    Icon: FundamentalsIcon },
  { name: 'Bài toán vision',        description: 'Hướng dẫn từng bài toán: chụp tĩnh, chụp động, line scan, đo lường, đọc mã.',   accent: ACCENT.amber,   Icon: ScenarioIcon },
  { name: 'Hiệu chuẩn & kiểm định', description: 'Các kỹ thuật hiệu chuẩn và đánh giá được dùng trong ứng dụng.',                 accent: ACCENT.violet,  Icon: CalibIcon },
]

export const ARTICLES: DocArticle[] = [...FUNDAMENTALS, ...SCENARIO_DOCS, ...CALIBRATION_DOCS]

export const ARTICLE_BY_ID: Record<string, DocArticle> = Object.fromEntries(ARTICLES.map(a => [a.id, a]))
