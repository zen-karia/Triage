'use client'

import { useState, useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!

type OrderStatus = {
  orderID: string
  status: string
  fraudScore?: number
  fraudReasoning?: string
  totalAmount?: number
  createdAt?: string
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Received', icon: '📥' },
  { key: 'PROCESSING', label: 'Processing', icon: '⚙️' },
  { key: 'FRAUD_CHECKING', label: 'AI Fraud Check', icon: '🤖' },
  { key: 'CHECKING_INVENTORY', label: 'Checking Inventory', icon: '📦' },
  { key: 'PROCESSING_PAYMENT', label: 'Processing Payment', icon: '💳' },
  { key: 'COMPLETED', label: 'Completed', icon: '✅' },
]

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  PROCESSING: 1,
  FRAUD_CHECKING: 2,
  FRAUD_CHECKED: 2,
  CHECKING_INVENTORY: 3,
  PROCESSING_PAYMENT: 4,
  COMPLETED: 5,
}

const TERMINAL = new Set(['COMPLETED', 'FRAUD_FLAGGED'])

export default function Home() {
  const [customerId, setCustomerId] = useState('')
  const [email, setEmail] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!order) return
    if (TERMINAL.has(order.status)) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${order.orderID}`, {
          headers: { 'x-api-key': API_KEY }
        })
        const data = await res.json()
        setOrder(data)
        if (TERMINAL.has(data.status)) {
          clearInterval(intervalRef.current!)
        }
      } catch {
        // silently retry
      }
    }, 2000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [order?.orderID, order?.status])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    setOrder(null)

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          customerId,
          email,
          totalAmount: parseFloat(totalAmount),
          items: [{ productId, quantity: parseInt(quantity), price: parseFloat(price) }]
        })
      })

      if (!res.ok) throw new Error('Failed to place order')

      const data = await res.json()
      const orderId = data.message.split('order id: ')[1]
      setOrder({ orderID: orderId, status: 'PENDING' })
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentStep = order ? (STATUS_INDEX[order.status] ?? 0) : -1
  const isFlagged = order?.status === 'FRAUD_FLAGGED'
  const isComplete = order?.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1 text-xs text-zinc-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            Live Demo
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Triage
          </h1>
          <p className="text-zinc-500 text-sm">Event-driven order processing · AI fraud detection · AWS</p>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 space-y-5 border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">Place an Order</h2>
            <span className="text-xs text-zinc-600 font-mono">POST /orders</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Customer ID</label>
              <input
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                placeholder="e.g. customer-42"
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
              <input
                type="email"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                placeholder="e.g. you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Total Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                placeholder="e.g. 199.99"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Product ID</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                  placeholder="prod-7"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                  placeholder="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors placeholder:text-zinc-600"
                  placeholder="99.99"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-zinc-900 font-semibold rounded-xl py-2.5 text-sm hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin inline-block"></span>
                Placing order...
              </span>
            ) : 'Place Order →'}
          </button>
        </form>

        {/* Status tracker */}
        <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-5 min-h-64">
          {!order && (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
              <span className="text-4xl">📋</span>
              <p className="text-zinc-500 text-sm">Order status will appear here</p>
              <p className="text-zinc-700 text-xs">Place an order to see real-time updates</p>
            </div>
          )}
          {order && (<>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">Order Status</h2>
                <p className="text-xs text-zinc-600 mt-0.5 font-mono truncate max-w-xs">{order.orderID}</p>
              </div>
              {!isFlagged && !isComplete && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block"></span>
                  Live
                </span>
              )}
              {isComplete && (
                <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">Complete</span>
              )}
              {isFlagged && (
                <span className="text-xs text-red-400 bg-red-950 border border-red-800 px-3 py-1 rounded-full">Flagged</span>
              )}
            </div>

            {!isFlagged && (
              <div className="space-y-1">
                {STATUS_STEPS.map((step, i) => {
                  const done = i < currentStep
                  const active = i === currentStep
                  const future = i > currentStep
                  return (
                    <div key={step.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-zinc-800' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
                        done ? 'bg-emerald-500/20' :
                        active ? 'bg-white/10' :
                        'bg-zinc-800/50'
                      }`}>
                        {done ? '✓' : step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          done ? 'text-emerald-400' :
                          active ? 'text-white' :
                          'text-zinc-600'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {active && !isComplete && (
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}
                      {done && <span className="text-emerald-500 text-xs">✓</span>}
                      {future && <span className="text-zinc-700 text-xs">—</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {isFlagged && (
              <div className="bg-linear-to-br from-red-950 to-zinc-900 border border-red-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <p className="text-red-400 font-semibold">Flagged for Manual Review</p>
                </div>
                {order.fraudScore !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-yellow-500 to-red-500 rounded-full transition-all"
                        style={{ width: `${(order.fraudScore * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-red-300 font-mono font-bold text-sm w-12 text-right">
                      {(order.fraudScore * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {order.fraudReasoning && (
                  <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">{order.fraudReasoning}</p>
                )}
              </div>
            )}

            {isComplete && (
              <div className="bg-linear-to-br from-emerald-950 to-zinc-900 border border-emerald-800 rounded-xl p-5 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">Order completed successfully</p>
                  <p className="text-xs text-zinc-500 mt-0.5">A confirmation email has been sent.</p>
                </div>
              </div>
            )}
          </>)}
        </div>

        </div>{/* end grid */}

        <p className="text-center text-xs text-zinc-700">
          Built on AWS · Lambda · Step Functions · Bedrock · DynamoDB
        </p>
      </div>
    </div>
  )
}
