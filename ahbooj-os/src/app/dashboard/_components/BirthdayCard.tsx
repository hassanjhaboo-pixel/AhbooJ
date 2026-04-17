import { Cake } from 'lucide-react'
import Link from 'next/link'

type BirthdayCustomer = {
  id: string
  name: string
  birthday_day: number | null
  birthday_month: number | null
  phone: string | null
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function BirthdayCard({ customers, currentMonth }: { customers: BirthdayCustomer[]; currentMonth: number }) {
  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center gap-2">
        <Cake className="w-4 h-4 text-terracotta" />
        <h3 className="font-display font-semibold text-espresso text-sm">
          Birthdays This Month
        </h3>
        <span className="ml-auto text-xs font-medium bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full">
          {MONTH_NAMES[currentMonth - 1]}
        </span>
      </div>
      {customers.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">No birthdays recorded for this month.</p>
      ) : (
        <div className="p-5 space-y-3">
          {customers.map(c => (
            <div key={c.id} className="flex items-center justify-between">
              <div>
                <Link
                  href={`/crm/${c.id}`}
                  className="text-sm font-medium text-espresso hover:text-terracotta transition-colors"
                >
                  {c.name}
                </Link>
                {c.birthday_day && (
                  <p className="text-xs text-muted">
                    {MONTH_NAMES[(c.birthday_month ?? 1) - 1]} {c.birthday_day}
                  </p>
                )}
              </div>
              {c.phone && (
                <a
                  href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 bg-green-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
