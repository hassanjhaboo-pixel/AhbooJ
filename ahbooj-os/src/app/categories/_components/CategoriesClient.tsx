'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  slug: string
  applies_to: string[]
  sort_order: number
  notes: string | null
}

const APPLIES_OPTIONS = ['products', 'recipes', 'ingredients']

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function CategoryModal({
  cat,
  onClose,
}: {
  cat: Category | null
  onClose: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState(cat?.name ?? '')
  const [appliesTo, setAppliesTo] = useState<string[]>(cat?.applies_to ?? ['products', 'recipes', 'ingredients'])
  const [notes, setNotes] = useState(cat?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function toggleApplies(opt: string) {
    setAppliesTo(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    )
  }

  async function save() {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    const payload = { name: name.trim(), slug: slugify(name.trim()), applies_to: appliesTo, notes: notes.trim() || null }
    const { error } = cat
      ? await supabase.from('categories').update(payload).eq('id', cat.id)
      : await supabase.from('categories').insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm">
      <div className="bg-warm-white rounded-card shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-espresso/10 flex items-center justify-between">
          <h2 className="font-display font-semibold text-espresso text-lg">
            {cat ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-espresso text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Panna Cotta"
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-espresso mb-2">Applies to</label>
            <div className="flex gap-2 flex-wrap">
              {APPLIES_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleApplies(opt)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    appliesTo.includes(opt)
                      ? 'bg-terracotta text-white border-terracotta'
                      : 'bg-white text-muted border-espresso/20 hover:border-terracotta/50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-espresso mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-espresso/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
            />
          </div>
          {err && <p className="text-red-600 text-xs">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-espresso/10 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CategoriesClient({ initial }: { initial: Category[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? It will not remove existing records using it.')) return
    setDeleting(id)
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'} defined
        </p>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Category
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="bg-cream rounded-card border border-cream/60 shadow-card px-5 py-4 flex items-center gap-4"
          >
            <GripVertical className="w-4 h-4 text-muted/40 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-espresso text-sm">{cat.name}</span>
                <span className="text-xs text-muted font-mono">{cat.slug}</span>
              </div>
              {cat.applies_to?.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {cat.applies_to.map(a => (
                    <Badge key={a} variant="gold" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
              {cat.notes && <p className="text-xs text-muted mt-1">{cat.notes}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setEditing(cat)}
                className="p-1.5 rounded-lg text-muted hover:text-terracotta hover:bg-terracotta/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No categories yet.</p>
            <p className="text-xs mt-1">Create your first category to organise products, recipes, and ingredients.</p>
          </div>
        )}
      </div>

      {editing !== null && (
        <CategoryModal
          cat={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
