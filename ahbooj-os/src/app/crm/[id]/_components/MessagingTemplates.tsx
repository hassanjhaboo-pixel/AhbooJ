'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'

type Customer = {
  name: string
  phone: string | null
  last_order_date: string | null
  total_orders: number
  birthday_month: number | null
  birthday_day: number | null
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getTemplates(customer: Customer) {
  const firstName = customer.name.split(' ')[0]
  const birthdayStr = customer.birthday_month
    ? `${MONTH_NAMES[customer.birthday_month - 1]}${customer.birthday_day ? ` ${customer.birthday_day}` : ''}`
    : null

  return [
    {
      label: 'New Customer Welcome',
      emoji: '👋',
      text: `Hi ${firstName}! Welcome to AhbooJ Desserts 🍮\n\nWe're so happy to have you as a customer! We handcraft premium panna cottas, lemon bars, and truffles right here in Trinidad.\n\nFeel free to reach out anytime to place an order or check what's available. We usually update our menu on Fridays!\n\n— Hassan @ AhbooJ`,
    },
    {
      label: 'Order Ready',
      emoji: '✅',
      text: `Hi ${firstName}! Your order is ready 🎉\n\nEverything is freshly made and packed. Please let me know when you're coming to collect, or we can arrange delivery.\n\nThank you for your support!\n— AhbooJ Desserts`,
    },
    {
      label: 'Follow-up (Re-engage)',
      emoji: '💌',
      text: `Hi ${firstName}! It's been a while — we miss you! 😊\n\nWe have some exciting new flavours on the menu this week. Would love to see you back at AhbooJ.\n\nLet me know if you'd like to place an order!\n— Hassan`,
    },
    {
      label: 'Friday Menu Drop',
      emoji: '🍮',
      text: `Hey ${firstName}! This Friday's menu is live ✨\n\nHere's what's available from AhbooJ Desserts this week:\n• [PRODUCT LIST]\n\nLimited quantities — first come, first served!\nReply here or WhatsApp to order.\n\n— AhbooJ`,
    },
    ...(birthdayStr ? [{
      label: 'Birthday Message',
      emoji: '🎂',
      text: `Happy Birthday ${firstName}! 🎂🎉\n\nWishing you a wonderful ${birthdayStr}! As a thank you for being such a loyal customer, enjoy a little something sweet from us at AhbooJ Desserts.\n\nSend us a message and we'll sort out a special treat for you 🍮\n\n— Hassan & the AhbooJ team`,
    }] : []),
    {
      label: 'Thank You',
      emoji: '🙏',
      text: `Thank you so much ${firstName}! 🙏\n\nYour support means everything to us at AhbooJ Desserts. Every order helps us grow and do what we love.\n\nHope to see you again soon!\n— Hassan`,
    },
  ]
}

export function MessagingTemplates({ customer }: { customer: Customer }) {
  const [copied, setCopied] = useState<string | null>(null)
  const templates = getTemplates(customer)

  async function copyTemplate(label: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const waLink = customer.phone
    ? `https://wa.me/${customer.phone.replace(/\D/g, '')}`
    : null

  return (
    <div className="bg-cream rounded-card shadow-card border border-cream/60">
      <div className="px-5 py-4 border-b border-espresso/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-terracotta" />
          <h3 className="font-display font-semibold text-espresso text-sm">Message Templates</h3>
        </div>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 bg-green-50 px-2.5 py-1 rounded-lg transition-colors"
          >
            Open WhatsApp
          </a>
        )}
      </div>
      <div className="p-5 space-y-3">
        {templates.map(tmpl => (
          <div key={tmpl.label} className="border border-espresso/10 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-espresso/[0.03] flex items-center justify-between">
              <span className="text-xs font-medium text-espresso">
                {tmpl.emoji} {tmpl.label}
              </span>
              <button
                onClick={() => copyTemplate(tmpl.label, tmpl.text)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-terracotta transition-colors"
              >
                {copied === tmpl.label
                  ? <><Check className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Copied!</span></>
                  : <><Copy className="w-3.5 h-3.5" />Copy</>}
              </button>
            </div>
            <pre className="px-4 py-3 text-xs text-muted whitespace-pre-wrap font-sans leading-relaxed">
              {tmpl.text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
