import React from 'react'
import {
  Calculate as CalcIcon,
  Tungsten as LightIcon,
  Analytics as QualityIcon,
  CenterFocusStrong as CalibIcon,
  Palette as ColorIcon,
  FactCheck as ValidIcon,
  CompareArrows as CompareIcon,
  MenuBook as DocsIcon,
  Bookmarks as ConfigsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import CalculatorModule from '@/components/CalculatorModule'
import LightingCalibration from '@/components/LightingCalibration'
import ImageQuality from '@/components/ImageQuality'
import GeometricCalibration from '@/components/GeometricCalibration'
import ColorCalibration from '@/components/ColorCalibration'
import ValidationModule from '@/components/ValidationModule'
import ImageComparison from '@/components/ImageComparison'
import DocsModule from '@/components/Docs'
import ConfigsModule from '@/components/Configs'
import AdminModule from '@/components/Admin'
import { ACCENT } from '@/theme/theme'

export interface AppModule {
  id: string
  label: string
  /** One-line English name shown under the label in the navigation rail. */
  caption: string
  group: string
  accent: string
  Icon: SvgIconComponent
  Component: React.ComponentType
  /** Only listed for admins (other modules are open to guests). */
  adminOnly?: boolean
}

/**
 * Navigation entries, in display order and grouped by `group`. To add a
 * module, create its component folder under components/ and append an entry.
 */
export const MODULES: AppModule[] = [
  { id: 'calculator', label: 'Thiết kế hệ vision', caption: 'System calculator',   group: 'Thiết kế',   accent: ACCENT.blue,    Icon: CalcIcon,    Component: CalculatorModule },
  { id: 'configs',    label: 'Cấu hình đã lưu',    caption: 'Saved configs',       group: 'Thiết kế',   accent: ACCENT.emerald, Icon: ConfigsIcon, Component: ConfigsModule },
  { id: 'lighting',   label: 'Chiếu sáng',         caption: 'Lighting calib.',     group: 'Hiệu chuẩn', accent: ACCENT.amber,   Icon: LightIcon,   Component: LightingCalibration },
  { id: 'geocal',     label: 'Hình học',           caption: 'Geometric calib.',    group: 'Hiệu chuẩn', accent: ACCENT.violet,  Icon: CalibIcon,   Component: GeometricCalibration },
  { id: 'color',      label: 'Màu sắc',            caption: 'Color calib.',        group: 'Hiệu chuẩn', accent: ACCENT.pink,    Icon: ColorIcon,   Component: ColorCalibration },
  { id: 'quality',    label: 'Chất lượng ảnh',     caption: 'Image quality',       group: 'Phân tích',  accent: ACCENT.emerald, Icon: QualityIcon, Component: ImageQuality },
  { id: 'comparison', label: 'So sánh ảnh',        caption: 'Image compare',       group: 'Phân tích',  accent: ACCENT.cyan,    Icon: CompareIcon, Component: ImageComparison },
  { id: 'validation', label: 'Kiểm định hệ thống', caption: 'Validation',          group: 'Phân tích',  accent: ACCENT.rose,    Icon: ValidIcon,   Component: ValidationModule },
  { id: 'docs',       label: 'Tài liệu',           caption: 'Docs & hướng dẫn',    group: 'Kiến thức',  accent: ACCENT.indigo,  Icon: DocsIcon,    Component: DocsModule },
  { id: 'admin',      label: 'Quản lý tài khoản',  caption: 'User admin',          group: 'Quản trị',   accent: ACCENT.violet,  Icon: AdminIcon,   Component: AdminModule, adminOnly: true },
]
