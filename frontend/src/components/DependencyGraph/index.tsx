import React, { useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { labelOf } from '@/components/Scenarios/StepList'
import { runAnalyze } from '@/services/api'
import { STATUS_COLORS } from '@/theme/theme'
import type { Parameter, ParameterGroup } from '@/types'
import { formatNumber } from '@/utils/format'

type NodeStatus = 'unknown' | 'input' | 'calculated' | 'target'

const STATUS_LABEL: Record<NodeStatus, string> = {
  input: 'Đã nhập',
  calculated: 'Tính được',
  target: 'Mục tiêu (chưa tính được)',
  unknown: 'Chưa biết',
}

interface NodeData {
  label: string
  unit: string
  status: NodeStatus
  value?: number
}

const ParameterNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const color = STATUS_COLORS[data.status]
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${color}22, ${color}0A)`,
        border: `1.5px solid ${color}77`,
        borderRadius: 1.5, px: 1.25, py: 0.6, width: 150, textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 7, height: 7 }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, lineHeight: 1.2 }}>{data.label}</Typography>
      {data.value !== undefined ? (
        <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#E2E8F0', mt: 0.2 }}>
          {formatNumber(data.value, 3)} {data.unit}
        </Typography>
      ) : data.unit ? (
        <Typography sx={{ fontSize: '0.6rem', color: '#64748B', mt: 0.2 }}>[{data.unit}]</Typography>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 7, height: 7 }} />
    </Box>
  )
}

const nodeTypes = { parameterNode: ParameterNode }

const COL_WIDTH = 200
const ROW_HEIGHT = 64

interface DependencyGraphProps {
  groups: ParameterGroup[]
  /** Entered values. */
  values: Record<string, number>
  /** Everything known after calculation (entered + derived). */
  computed: Record<string, number>
  targets: string[]
}

/** Parameter → formula → parameter graph, one column per category, coloured by status. */
const DependencyGraph: React.FC<DependencyGraphProps> = ({ groups, values, computed, targets }) => {
  const { data: analysis } = useQuery({
    queryKey: ['analyze', values, targets],
    queryFn: () => runAnalyze({ known_values: values, targets }),
  })

  const paramById = useMemo(() => {
    const map: Record<string, Parameter> = {}
    for (const g of groups) for (const p of g.parameters) map[p.id] = p
    return map
  }, [groups])

  const statusOf = (id: string): NodeStatus =>
    id in values ? 'input' : id in computed ? 'calculated' : targets.includes(id) ? 'target' : 'unknown'

  const nodes: Node[] = useMemo(() => groups.flatMap((group, col) =>
    group.parameters.map((param, row) => ({
      id: param.id,
      type: 'parameterNode',
      position: { x: col * COL_WIDTH, y: row * ROW_HEIGHT },
      data: {
        label: labelOf(param.id, paramById),
        unit: param.unit,
        status: statusOf(param.id),
        value: computed[param.id],
      } satisfies NodeData,
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [groups, paramById, values, computed, targets])

  const edges: Edge[] = useMemo(() => (analysis?.graph_edges ?? []).map(e => {
    const live = e.source in computed && e.target in computed
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: live && !(e.target in values),
      style: { stroke: live ? '#10B98188' : '#33415588', strokeWidth: live ? 1.6 : 1 },
    }
  }), [analysis, computed, values])

  return (
    <Box sx={{ width: '100%', height: '100%', bgcolor: '#0A0D15', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
      >
        <Background variant={BackgroundVariant.Dots} color="#1E2535" gap={20} size={1} />
        <Controls showInteractive={false} style={{ background: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)' }} />
        <MiniMap
          style={{ background: '#0F1117', border: '1px solid rgba(255,255,255,0.1)' }}
          maskColor="rgba(10,13,21,0.65)"
          nodeColor={node => STATUS_COLORS[(node.data as NodeData).status]}
        />
      </ReactFlow>

      <Box
        sx={{
          position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(15,17,23,0.92)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1.5, px: 1.25, py: 0.75, display: 'flex', gap: 1.5, flexWrap: 'wrap', zIndex: 5,
        }}
      >
        {(Object.keys(STATUS_LABEL) as NodeStatus[]).map(s => (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[s] }} />
            <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>{STATUS_LABEL[s]}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default DependencyGraph
