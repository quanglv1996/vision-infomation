import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Box, Typography } from '@mui/material'
import { useCalcStore } from '@/stores/calculationStore'
import { STATUS_COLORS } from '@/theme/theme'
import { useQuery } from '@tanstack/react-query'
import { runAnalyze } from '@/services/api'

// ── Custom node ───────────────────────────────────────────────────────────────

interface NodeData {
  label: string
  unit: string
  category: string
  status: keyof typeof STATUS_COLORS
  value?: number
}

const ParameterNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const color = STATUS_COLORS[data.status] ?? STATUS_COLORS.unknown
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        border: `1.5px solid ${color}66`,
        borderRadius: 1.5,
        px: 1.5,
        py: 0.75,
        minWidth: 110,
        maxWidth: 160,
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, lineHeight: 1.2 }}>
        {data.label}
      </Typography>
      {data.unit && (
        <Typography sx={{ fontSize: '0.62rem', color: '#64748B', mt: 0.3 }}>
          [{data.unit}]
        </Typography>
      )}
      {data.value !== undefined && (
        <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#E2E8F0', mt: 0.2 }}>
          {fmtShort(data.value)}
        </Typography>
      )}
      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 7, height: 7 }} />
    </Box>
  )
}

const nodeTypes = { parameterNode: ParameterNode }

// ── Auto-layout helper (simple column layout by category) ─────────────────────

const CATEGORIES = ['Camera', 'Lens', 'Object', 'Motion', 'Imaging', 'Optics', 'Lighting', 'Inspection']
const COL_X: Record<string, number> = {
  Camera: 0, Lens: 180, Object: 360, Motion: 540,
  Imaging: 720, Optics: 900, Lighting: 1080, Inspection: 1260,
}

const DependencyGraph: React.FC = () => {
  const { params, parameterGroups } = useCalcStore()

  const knownValues = useMemo(() => {
    const kv: Record<string, number> = {}
    for (const [id, p] of Object.entries(params)) {
      if (p.value !== null) kv[id] = p.value!
    }
    return kv
  }, [params])

  const { data: analysisData } = useQuery({
    queryKey: ['analyze', knownValues],
    queryFn: () => runAnalyze({ known_values: knownValues, targets: [] }),
    enabled: true,
  })

  const nodes: Node[] = useMemo(() => {
    const catCounts: Record<string, number> = {}
    return parameterGroups.flatMap(group =>
      group.parameters.map(param => {
        const cat = group.category
        const idx = catCounts[cat] ?? 0
        catCounts[cat] = idx + 1

        const state = params[param.id]
        const status = state?.status ?? 'unknown'

        // Override status from analysis data
        const apiNode = analysisData?.graph_nodes?.find(n => n.id === param.id)
        const displayStatus = apiNode?.data?.status ?? status

        return {
          id: param.id,
          type: 'parameterNode',
          position: { x: (COL_X[cat] ?? 0) + (idx % 2) * 10, y: Math.floor(idx / 1) * 70 },
          data: {
            label: param.name,
            unit: param.unit,
            category: cat,
            status: displayStatus,
            value: state?.value ?? undefined,
          } as NodeData,
        }
      })
    )
  }, [parameterGroups, params, analysisData])

  const edges: Edge[] = useMemo(() => {
    if (!analysisData?.graph_edges) return []
    return analysisData.graph_edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: params[e.target]?.status === 'calculated',
      style: { stroke: '#475569', strokeWidth: 1.5 },
      labelStyle: { fontSize: 9, fill: '#64748B' },
      labelBgStyle: { fill: '#1A1D27' },
    }))
  }, [analysisData, params])

  const [rfNodes, , onNodesChange] = useNodesState(nodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(edges)

  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: '#0A0D15' }}>
      <ReactFlow
        nodes={rfNodes.length ? rfNodes : nodes}
        edges={rfEdges.length ? rfEdges : edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1E2535" gap={20} size={1} />
        <Controls style={{ background: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)' }} />
        <MiniMap
          style={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)' }}
          nodeColor={node => STATUS_COLORS[(node.data as NodeData).status] ?? '#475569'}
        />
      </ReactFlow>

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          bgcolor: 'rgba(15,17,23,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        {(Object.entries(STATUS_COLORS) as [string, string][]).map(([s, c]) => (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
            <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>{s}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function fmtShort(v: number): string {
  if (Math.abs(v) >= 10000) return v.toExponential(2)
  return parseFloat(v.toPrecision(3)).toString()
}

export default DependencyGraph
