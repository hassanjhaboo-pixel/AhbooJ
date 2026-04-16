'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  task_text: string
  task_type: string
  is_done: boolean
}

const TYPE_COLORS: Record<string, string> = {
  task:       'bg-espresso/10 text-espresso',
  production: 'bg-terracotta/10 text-terracotta',
  admin:      'bg-gold/20 text-espresso',
  delivery:   'bg-green-100 text-green-700',
  marketing:  'bg-purple-100 text-purple-700',
}

export function TodayCard({ tasks, weekOf, dayOfWeek }: { tasks: Task[]; weekOf: string; dayOfWeek: number }) {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<Task[]>(tasks)
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('task')
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()

  const doneCount = items.filter(t => t.is_done).length

  async function toggle(task: Task) {
    const updated = !task.is_done
    setItems(prev => prev.map(t => t.id === task.id ? { ...t, is_done: updated } : t))
    await supabase
      .from('weekly_schedule')
      .update({ is_done: updated, done_at: updated ? new Date().toISOString() : null })
      .eq('id', task.id)
    startTransition(() => router.refresh())
  }

  async function addTask() {
    if (!newText.trim()) return
    const payload = {
      week_of: weekOf,
      day_of_week: dayOfWeek,
      task_text: newText.trim(),
      task_type: newType,
      is_done: false,
      sort_order: items.length,
    }
    const { data, error } = await supabase
      .from('weekly_schedule')
      .insert(payload)
      .select('id, task_text, task_type, is_done')
      .single()
    if (!error && data) {
      setItems(prev => [...prev, data as Task])
      setNewText('')
      setAdding(false)
      startTransition(() => router.refresh())
    }
  }

  async function removeTask(id: string) {
    setItems(prev => prev.filter(t => t.id !== id))
    await supabase.from('weekly_schedule').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-terracotta" />
          <h3 className="font-display font-semibold text-espresso text-sm">Today's Tasks</h3>
        </div>
        <span className="text-xs text-muted">{doneCount}/{items.length} done</span>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-5 pt-3">
          <div className="h-1.5 bg-espresso/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-500"
              style={{ width: `${items.length ? (doneCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="p-5 space-y-2">
        {items.map(task => (
          <div
            key={task.id}
            className={cn(
              'flex items-center gap-3 group rounded-lg px-3 py-2 transition-colors',
              task.is_done ? 'opacity-50' : 'hover:bg-espresso/5'
            )}
          >
            <button onClick={() => toggle(task)} className="flex-shrink-0">
              {task.is_done
                ? <CheckCircle2 className="w-4.5 h-4.5 text-terracotta" />
                : <Circle className="w-4.5 h-4.5 text-muted/50" />}
            </button>
            <span className={cn('flex-1 text-sm', task.is_done && 'line-through text-muted')}>
              {task.task_text}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
              TYPE_COLORS[task.task_type] ?? TYPE_COLORS.task)}>
              {task.task_type}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-red-500 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {items.length === 0 && !adding && (
          <p className="text-sm text-muted text-center py-3">No tasks for today yet.</p>
        )}

        {adding ? (
          <div className="flex items-center gap-2 pt-1">
            <input
              autoFocus
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="New task…"
              className="flex-1 border border-espresso/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="border border-espresso/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="task">task</option>
              <option value="production">production</option>
              <option value="admin">admin</option>
              <option value="delivery">delivery</option>
              <option value="marketing">marketing</option>
            </select>
            <button
              onClick={addTask}
              className="px-3 py-1.5 bg-terracotta text-white rounded-lg text-xs font-medium hover:bg-terracotta/90"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-muted text-xs hover:text-espresso"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm text-muted hover:text-terracotta transition-colors w-full pt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
