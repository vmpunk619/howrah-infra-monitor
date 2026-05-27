import { useEffect, useState } from 'react'
import { Complaint } from '../types'
import { ISSUE_CATEGORIES, STATUS_CONFIG } from '../lib/departments'
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    let current = 0
    const steps = 28
    const increment = value / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.round(current))
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

export default function StatsPanel({ complaints }: { complaints: Complaint[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const total      = complaints.length
  const pending    = complaints.filter(c => c.status === 'pending').length
  const inProgress = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length
  const resolved   = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length

  const topStats = [
    { label: 'Total Reports', value: total,      icon: TrendingUp,  bg: 'bg-blue-50',   text: 'text-blue-600',   delay: 0   },
    { label: 'Pending',        value: pending,    icon: Clock,       bg: 'bg-yellow-50', text: 'text-yellow-600', delay: 60  },
    { label: 'In Progress',    value: inProgress, icon: AlertCircle, bg: 'bg-purple-50', text: 'text-purple-600', delay: 120 },
    { label: 'Resolved',       value: resolved,   icon: CheckCircle, bg: 'bg-green-50',  text: 'text-green-600',  delay: 180 },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topStats.map(({ label, value, icon: Icon, bg, text, delay }) => (
          <div
            key={label}
            className="bg-white rounded-lg p-4 shadow-sm border card-hover animate-slide-up"
            style={{ animationDelay: `${delay}ms` }}
          >
            <div className={`inline-flex p-2 rounded-lg ${bg} ${text} mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              <AnimatedNumber value={value} />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Category</h3>
          <div className="space-y-2.5">
            {Object.entries(ISSUE_CATEGORIES).map(([cat, { label, icon, markerColor }]) => {
              const count = complaints.filter(c => c.category === cat).length
              if (count === 0) return null
              const pct = Math.round((count / total) * 100)
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-base w-5 shrink-0">{icon}</span>
                  <span className="text-xs text-gray-600 w-36 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${pct}%` : '0%',
                        backgroundColor: markerColor,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resolution Rate</h3>
          <div className="space-y-2">
            {Object.entries(STATUS_CONFIG).map(([status, { label, dot }]) => {
              const count = complaints.filter(c => c.status === status).length
              if (count === 0) return null
              return (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${status === 'pending' ? 'animate-pulse-dot' : ''}`} />
                  <span className="text-gray-600 flex-1">{label}</span>
                  <span className="font-semibold text-gray-700">{count}</span>
                  <span className="text-gray-400">({Math.round((count / total) * 100)}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
