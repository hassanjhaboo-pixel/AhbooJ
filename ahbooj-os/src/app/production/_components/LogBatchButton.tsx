'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LogBatchModal } from './LogBatchModal'

interface RecipeOption {
  id: string
  name: string
  base_yield_units: number
  single_batch_cost: number
}

export function LogBatchButton({ recipes }: { recipes: RecipeOption[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />Log Batch
      </Button>
      {open && <LogBatchModal recipes={recipes} onClose={() => setOpen(false)} />}
    </>
  )
}
