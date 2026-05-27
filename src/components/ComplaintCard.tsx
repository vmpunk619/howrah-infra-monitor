import { useState } from 'react'
import { Complaint, Officer } from '../types'
import { ISSUE_CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from '../lib/departments'
import { Calendar, MapPin, Phone, User, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const CATEGORY_ACCENT: Record<string, string> = {
  pothole:      '#ea580c',
  road_damage:  '#dc2626',
  streetlight:  '#ca8a04',
  manhole:      '#9333ea',
  waterlogging: '#2563eb',
  garbage:      '#16a34a',
  encroachment: '#4b5563',
  other:        '#64748b',
}

interface Props {
  complaint: Complaint
  officers?: Officer[]
  onStatusUpdate?: (id: string, status: Complaint['status'], notes: string) => void
  onAssignOfficer?: (id: string, officerId: string) => void
  isOfficer?: boolean
  index?: number
}

export default function ComplaintCard({ complaint, officers = [], onStatusUpdate, onAssignOfficer, isOfficer, index = 0 }: Props) {
  const cat      = ISSUE_CATEGORIES[complaint.category]
  const status   = STATUS_CONFIG[complaint.status]
  const priority = PRIORITY_CONFIG[complaint.priority]
  const accent   = CATEGORY_ACCENT[complaint.category] ?? '#64748b'
  const assignedOfficer = officers.find(o => o.id === complaint.officer_id)

  return (
    <div
      className="card-glass rounded-2xl overflow-hidden animate-slide-up group"
      style={{ animationDelay: `${index * 55}ms`, borderTop: `3px solid ${accent}` }}
    >
      {complaint.photo_url && (
        <div className="relative overflow-hidden h-40">
          <img src={complaint.photo_url} alt="Issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${accent}18` }}>
              {cat.icon}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">{cat.label}</div>
              <div className="text-xs font-mono text-blue-600 font-semibold">{complaint.complaint_number}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5', status.color)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', status.dot, complaint.status === 'pending' ? 'animate-pulse-dot' : '')} />
              {status.label}
            </span>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', priority.color)}>
              {priority.label}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{complaint.description}</p>

        <div className="space-y-1.5 text-xs text-gray-500">
          {complaint.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
              <span>{complaint.address}{complaint.ward_number ? `, ${complaint.ward_number}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0 text-gray-400" />
            <span>{format(new Date(complaint.created_at), 'dd MMM yyyy, hh:mm a')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 shrink-0 text-gray-400" />
            <span>{complaint.reported_by_name}</span>
            {complaint.reported_by_phone && (
              <><Phone className="w-3 h-3 ml-1 shrink-0 text-gray-400" /><span>{complaint.reported_by_phone}</span></>
            )}
          </div>
        </div>

        {complaint.assigned_department && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            {complaint.assigned_department}
          </div>
        )}

        {assignedOfficer && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
            <UserCheck className="w-3 h-3 shrink-0" />
            <span><span className="font-semibold">{assignedOfficer.name}</span><span className="text-blue-400 ml-1">· {assignedOfficer.designation}</span></span>
          </div>
        )}

        {complaint.officer_notes && (
          <div className="mt-2 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
            <span className="font-semibold">Note:</span> {complaint.officer_notes}
          </div>
        )}

        {isOfficer && onStatusUpdate && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <StatusUpdateForm complaint={complaint} officers={officers} onUpdate={onStatusUpdate} onAssignOfficer={onAssignOfficer} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatusUpdateForm({ complaint, officers, onUpdate, onAssignOfficer }: {
  complaint: Complaint; officers?: Officer[]
  onUpdate: (id: string, status: Complaint['status'], notes: string) => void
  onAssignOfficer?: (id: string, officerId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [newStatus, setNewStatus] = useState(complaint.status)
  const [notes, setNotes] = useState('')
  const [officerId, setOfficerId] = useState(complaint.officer_id ?? '')

  const all = (officers ?? []).filter(o => o.is_active)

  // Group active officers by rank so the admin can pick HOD / DMDC / OC / Field
  const grouped: { label: string; officers: Officer[] }[] = [
    { label: 'Department Heads (DMDC)', officers: all.filter(o => o.rank === 2) },
    { label: 'OC / Field Officers',     officers: all.filter(o => o.rank === 3) },
    { label: 'SDO',                     officers: all.filter(o => o.rank === 1) },
  ].filter(g => g.officers.length > 0)

  function describe(o: Officer) {
    const bits = [o.designation]
    if (o.portfolio)  bits.push(`portfolio: ${o.portfolio}`)
    if (o.department) bits.push(o.department)
    return bits.join(' · ')
  }

  function submit() {
    onUpdate(complaint.id, newStatus, notes)
    if (officerId && officerId !== complaint.officer_id && onAssignOfficer) onAssignOfficer(complaint.id, officerId)
    setExpanded(false); setNotes('')
  }

  if (!expanded) return (
    <button onClick={() => setExpanded(true)}
      className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors btn-press">
      Update Status →
    </button>
  )

  return (
    <div className="space-y-2 animate-scale-in">
      <select value={newStatus} onChange={e => setNewStatus(e.target.value as Complaint['status'])}
        className="w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400">
        <option value="pending">Pending</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      {grouped.length > 0 && (
        <select value={officerId} onChange={e => setOfficerId(e.target.value)}
          className="w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400">
          <option value="">— Assign to officer —</option>
          {grouped.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.officers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} · {describe(o)}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      )}
      <p className="text-[10px] text-slate-400 leading-snug">
        Tip: assigning to an OC also makes the complaint visible to their DMDC and the SDO.
      </p>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Add officer note (optional)..." rows={2}
        className="w-full text-xs border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400" />
      <div className="flex gap-2">
        <button onClick={submit}
          className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition-all btn-press shadow-sm">
          Save Update
        </button>
        <button onClick={() => setExpanded(false)}
          className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors btn-press">
          Cancel
        </button>
      </div>
    </div>
  )
}
