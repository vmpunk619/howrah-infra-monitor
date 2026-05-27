import { useState } from 'react'
import { Search, MapPin, Calendar, Building2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Complaint, ComplaintUpdate } from '../types'
import { ISSUE_CATEGORIES, STATUS_CONFIG } from '../lib/departments'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'] as const
const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock, assigned: AlertCircle, in_progress: AlertCircle, resolved: CheckCircle, closed: XCircle,
}

export default function Track() {
  const [query, setQuery]         = useState('')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [updates, setUpdates]     = useState<ComplaintUpdate[]>([])
  const [loading, setLoading]     = useState(false)
  const [notFound, setNotFound]   = useState(false)

  async function search() {
    const q = query.trim(); if (!q) return
    setLoading(true); setNotFound(false); setComplaint(null); setUpdates([])
    const { data } = await supabase.from('complaints').select('*')
      .or(`complaint_number.ilike.${q},reported_by_phone.eq.${q}`)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data) {
      setComplaint(data)
      const { data: upd } = await supabase.from('complaint_updates').select('*')
        .eq('complaint_id', data.id).order('created_at', { ascending: false })
      setUpdates(upd || [])
    } else { setNotFound(true) }
    setLoading(false)
  }

  const statusCfg  = complaint ? STATUS_CONFIG[complaint.status]   : null
  const categoryCfg = complaint ? ISSUE_CATEGORIES[complaint.category] : null
  const stepIndex  = complaint ? STATUS_STEPS.indexOf(complaint.status as typeof STATUS_STEPS[number]) : -1

  return (
    <div>
      {/* Search hero */}
      <div className="hero-mesh py-14 px-4 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-400/10 rounded-full blob blob-1 -top-20 right-0 pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl mb-4 backdrop-blur-sm">
              <Search className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Track Your Complaint</h1>
            <p className="text-blue-200 text-sm">
              Enter your complaint number (e.g. <span className="font-mono bg-white/15 px-2 py-0.5 rounded">HSD-202501-1234</span>) or mobile number
            </p>
          </div>

          <div className="glass rounded-2xl p-2 flex gap-2 shadow-2xl">
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="HSD-YYYYMM-XXXX  or  10-digit mobile"
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button onClick={search} disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30 btn-press">
              {loading ? '…' : 'Search'}
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {notFound && (
          <div className="text-center py-16 animate-scale-in">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🔍</div>
            <div className="font-bold text-gray-700 text-lg">No complaint found</div>
            <div className="text-sm text-gray-400 mt-1">Double-check your complaint number or mobile and try again</div>
          </div>
        )}

        {complaint && statusCfg && categoryCfg && (
          <div className="animate-scale-in space-y-4">
            {/* Status card */}
            <div className="card-glass rounded-2xl overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Complaint Number</div>
                    <div className="font-mono font-black text-2xl tracking-wider">{complaint.complaint_number}</div>
                  </div>
                  <span className={clsx('px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 glass')}>
                    <span className={clsx('w-2 h-2 rounded-full animate-pulse-dot', statusCfg.dot)} />
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.slice(0, -1).map((s, i) => {
                    const done = i <= stepIndex
                    const Icon = STATUS_ICONS[s]
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={clsx(
                          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                          done ? 'bg-blue-600 text-white shadow-glow-blue' : 'bg-gray-200 text-gray-400'
                        )}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {i < STATUS_STEPS.length - 2 && (
                          <div className={clsx('flex-1 h-1 mx-1 rounded-full transition-all duration-500', done && i < stepIndex ? 'bg-blue-600' : 'bg-gray-200')} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  {STATUS_STEPS.slice(0, -1).map(s => (
                    <div key={s} className="text-[10px] text-gray-400 capitalize">{s.replace('_', ' ')}</div>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                    {categoryCfg.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{categoryCfg.label}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{complaint.description}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: MapPin,    label: 'Location',    value: complaint.address || `${complaint.location_lat.toFixed(4)}, ${complaint.location_lng.toFixed(4)}` },
                    { icon: Calendar,  label: 'Reported On', value: format(new Date(complaint.created_at), 'dd MMM yyyy, hh:mm a') },
                    { icon: Building2, label: 'Department',  value: complaint.assigned_department || 'Processing…' },
                    ...(complaint.resolved_at ? [{ icon: CheckCircle, label: 'Resolved On', value: format(new Date(complaint.resolved_at), 'dd MMM yyyy') }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Icon className="w-3 h-3" />{label}</div>
                      <div className="text-sm font-semibold text-gray-800">{value}</div>
                    </div>
                  ))}
                </div>

                {complaint.photo_url && (
                  <img src={complaint.photo_url} alt="Issue" className="w-full h-44 object-cover rounded-xl border border-gray-100" />
                )}

                {complaint.officer_notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                    <span className="font-semibold">Officer Note:</span> {complaint.officer_notes}
                  </div>
                )}

                {updates.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Activity Timeline</h3>
                    <div className="relative pl-6 space-y-4">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-gray-200 rounded-full" />
                      {updates.map((upd, i) => (
                        <div key={upd.id} className="relative animate-slide-in-left" style={{ animationDelay: `${i * 80}ms` }}>
                          <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                          <div className="card-glass rounded-xl p-3">
                            <div className="flex items-center gap-2 flex-wrap text-sm mb-1">
                              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CONFIG[upd.status_from].color)}>
                                {STATUS_CONFIG[upd.status_from].label}
                              </span>
                              <span className="text-gray-300">→</span>
                              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CONFIG[upd.status_to].color)}>
                                {STATUS_CONFIG[upd.status_to].label}
                              </span>
                            </div>
                            {upd.notes && <div className="text-xs text-gray-600 mt-1">{upd.notes}</div>}
                            <div className="text-xs text-gray-400 mt-1">{format(new Date(upd.created_at), 'dd MMM yyyy, hh:mm a')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
