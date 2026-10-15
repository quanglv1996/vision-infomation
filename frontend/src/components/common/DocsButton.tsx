import React from 'react'
import { Button } from '@mui/material'
import { MenuBook as DocsIcon } from '@mui/icons-material'
import { useNavStore } from '@/stores/navStore'

/** Header button that opens the matching article in the Docs module. */
const DocsButton: React.FC<{ docId: string }> = ({ docId }) => {
  const openDoc = useNavStore(s => s.openDoc)
  return (
    <Button
      size="small"
      startIcon={<DocsIcon sx={{ fontSize: '16px !important' }} />}
      onClick={() => openDoc(docId)}
      sx={{ fontSize: '0.74rem', mx: 1, flexShrink: 0 }}
    >
      Hướng dẫn
    </Button>
  )
}

export default DocsButton
