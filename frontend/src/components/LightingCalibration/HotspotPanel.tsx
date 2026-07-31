import React from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { HotspotResult } from '@/types/lighting'
import HeatmapCanvas from './HeatmapCanvas'

interface Props { hotspots: HotspotResult }

const typeColor: Record<string, string> = {
  bright: '#F59E0B',
  shadow: '#3B82F6',
  gradient: '#8B5CF6',
}

const HotspotPanel: React.FC<Props> = ({ hotspots }) => {
  const hasBright = hotspots.hotspots.some(h => h.type === 'bright')
  const hasShadow = hotspots.hotspots.some(h => h.type === 'shadow')

  return (
    <Box>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap" alignItems="center">
        <Chip
          label={`${hotspots.hotspots.length} hotspot${hotspots.hotspots.length !== 1 ? 's' : ''} detected`}
          size="small"
          sx={{
            bgcolor: hotspots.hotspots.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: hotspots.hotspots.length > 0 ? '#EF4444' : '#10B981',
            fontWeight: 700,
          }}
        />
        <Chip label={`Severity score: ${hotspots.severity_score}`} size="small" />
        {hasBright && <Chip label="Specular / bright" size="small" sx={{ color: '#F59E0B' }} variant="outlined" />}
        {hasShadow && <Chip label="Shadow area" size="small" sx={{ color: '#3B82F6' }} variant="outlined" />}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} gap={3} alignItems="flex-start">
        {/* Heatmap */}
        <Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Brightness heatmap (red = hotspot)
          </Typography>
          <HeatmapCanvas
            data={hotspots.heatmap_data}
            rows={hotspots.heatmap_rows}
            cols={hotspots.heatmap_cols}
            width={300}
            height={200}
          />
        </Box>

        {/* Hotspot list */}
        <Box flex={1}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            Detected regions
          </Typography>
          {hotspots.hotspots.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#10B981' }}>
              ✓ No hotspots detected — lighting is uniform
            </Typography>
          ) : (
            <Stack gap={1}>
              {hotspots.hotspots.map((h, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderColor: `${typeColor[h.type]}44` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: typeColor[h.type] }}>
                        {h.type.charAt(0).toUpperCase() + h.type.slice(1)} hotspot
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Position: ({h.x}, {h.y})  Size: {h.width}×{h.height} px
                      </Typography>
                    </Box>
                    <Chip
                      label={`Severity: ${(h.severity * 100).toFixed(0)}%`}
                      size="small"
                      sx={{ bgcolor: `${typeColor[h.type]}22`, color: typeColor[h.type] }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  )
}

export default HotspotPanel
