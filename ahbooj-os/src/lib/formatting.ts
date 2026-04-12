import { format, formatDistanceToNow, parseISO } from 'date-fns'

const ttdFormatter = new Intl.NumberFormat('en-TT', {
  style: 'currency',
  currency: 'TTD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatTTD(amount: number): string {
  // Normalize to always show TT$ prefix
  return ttdFormatter.format(amount).replace(/TTD\s?|TT\$\s?/, 'TT$')
}

export function formatDate(dateString: string, fmt = 'MMM d, yyyy'): string {
  return format(parseISO(dateString), fmt)
}

export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), 'dd/MM/yy')
}

export function formatRelative(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
