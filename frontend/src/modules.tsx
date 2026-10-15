import React from 'react'
import {
  Calculate as CalcIcon,
  Tungsten as LightIcon,
  Analytics as QualityIcon,
  CenterFocusStrong as CalibIcon,
  Palette as ColorIcon,
  FactCheck as ValidIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import CalculatorModule from '@/components/CalculatorModule'
import LightingCalibration from '@/components/LightingCalibration'
import ImageQuality from '@/components/ImageQuality'
import GeometricCalibration from '@/components/GeometricCalibration'
import ColorCalibration from '@/components/ColorCalibration'
import ValidationModule from '@/components/ValidationModule'
import ImageComparison from '@/components/ImageComparison'

export interface AppModule {
  id: string
  label: string
  Icon: SvgIconComponent
  Component: React.ComponentType
}

/**
 * Top-level tabs, in display order. To add a module, create its component
 * folder under components/ and append an entry here.
 */
export const MODULES: AppModule[] = [
  { id: 'calculator', label: 'Calculator',       Icon: CalcIcon,    Component: CalculatorModule },
  { id: 'lighting',   label: 'Lighting Calib.',  Icon: LightIcon,   Component: LightingCalibration },
  { id: 'quality',    label: 'Image Quality',    Icon: QualityIcon, Component: ImageQuality },
  { id: 'geocal',     label: 'Geometric Calib.', Icon: CalibIcon,   Component: GeometricCalibration },
  { id: 'color',      label: 'Color Calib.',     Icon: ColorIcon,   Component: ColorCalibration },
  { id: 'validation', label: 'Validation',       Icon: ValidIcon,   Component: ValidationModule },
  { id: 'comparison', label: 'Image Compare',    Icon: CompareIcon, Component: ImageComparison },
]
