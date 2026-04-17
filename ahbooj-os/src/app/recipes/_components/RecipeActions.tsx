'use client'

import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { RowActions } from '@/components/ui/RowActions'

export function RecipeActions({ id }: { id: string }) {
  const router = useRouter()
  return (
    <RowActions
      align="right"
      actions={[
        {
          label: 'Edit',
          icon: Pencil,
          onClick: () => router.push(`/recipes/${id}/edit`),
        },
      ]}
    />
  )
}
