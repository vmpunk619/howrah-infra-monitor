import { useMemo, useState } from 'react'
import {
  Phone, Mail, Star, Users, ToggleLeft, ToggleRight,
  Search, Trash2, AlertTriangle, Filter, X, Grid2x2, List,
  Building2, Network, ChevronRight, Briefcase,
} from 'lucide-react'
import { Officer } from '../types'
import { directReports } from '../lib/officerChain'
import clsx from 'clsx'

const DEPT_META: Record<string, { icon: string; accent: string; ring: string }> = {
  'PWD Roads Division, Howrah':          { icon: '🚧', accent: 'from-orange-100 to-orange-50',  ring: 'ring-orange-200'  },
  'PHE & Drainage Division':             { icon: '💧', accent: 'from-cyan-100 to-cyan-50',      ring: 'ring-cyan-200'    },
  'Drainage & Flood Control Division':   { icon: '🌊', accent: 'from-blue-100 to-blue-50',      ring: 'ring-blue-200'    },
  'WBSEDCL / Municipal Lighting Cell':   { icon: '💡', accent: 'from-yellow-100 to-yellow-50',  ring: 'ring-yellow-200'  },
  'Solid Waste Management Cell':         { icon: '🗑️', accent: 'from-green-100 to-green-50',    ring: 'ring-green-200'   },
  'Sub-Divisional Office, Howrah Sadar': { icon: '🏛️', accent: 'from-slate-100 to-slate-50',    ring: 'ring-slate-200'   },
}

function initials(name: string) {
  return name
    .replace(/Sri |Smt\.?|Sm\.?|Dr\.?|IAS|\,/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface Props {
  officers: Officer[]
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete?:       (id: string) => void
}

type ViewMode = 'grouped' | 'list' | 'chain'

export default function OfficerHierarchy({ officers, isOfficer, onToggleActive, onDelete }: Props) {
  const [query, setQuery]   = useState('')
  const [rankFilter, setRankFilter] = useState<'' | '1' | '2' | '3'>('')
  const [view, setView]     = useState<ViewMode>('grouped')
  const [confirmDelete, setConfirmDelete] = useState<Officer | null>(null)

  /* Detect duplicates — flag if name+designation OR email matches another row */
  const duplicateIds = useMemo(() => {
    const byKey   = new Map<string, string>()
    const byEmail = new Map<string, string>()
    const dupes   = new Set<string>()

    officers.forEach(o => {
      const k = `${o.name.trim().toLowerCase()}|${o.designation.trim().toLowerCase()}`
      if (byKey.has(k))      { dupes.add(o.id); dupes.add(byKey.get(k)!) }
      else                    byKey.set(k, o.id)

      const e = (o.email || '').trim().toLowerCase()
      if (e) {
        if (byEmail.has(e))  { dupes.add(o.id); dupes.add(byEmail.get(e)!) }
        else                   byEmail.set(e, o.id)
      }
    })
    return dupes
  }, [officers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return officers.filter(o => {
      if (rankFilter && String(o.rank) !== rankFilter) return false
      if (!q) return true
      return (
        o.name.toLowerCase().includes(q) ||
        o.designation.toLowerCase().includes(q) ||
        (o.department || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q)
      )
    })
  }, [officers, query, rankFilter])

  const sdos          = filtered.filter(o => o.rank === 1)
  const deptHeads     = filtered.filter(o => o.rank === 2)
  const fieldOfficers = filtered.filter(o => o.rank === 3)
  const departments = [...new Set(
    officers.filter(o => o.rank === 2 || o.rank === 3).map(o => o.department).filter(Boolean) as string[]
  )]

  if (officers.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No officer data found. Run migration 002_officers.sql in Supabase.</p>
      </div>
    )
  }

  return (
    <div>
      {/* ════════ Toolbar ════════ */}
      <div className="sticky top-[60px] z-20 -mx-6 px-6 py-3 mb-6 bg-white/85 backdrop-blur-md border-b border-slate-200 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, designation, department, email, phone…"
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rank filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5" />
          {[
            { v: '',  label: 'All Ranks' },
            { v: '1', label: 'SDO' },
            { v: '2', label: 'Heads' },
            { v: '3', label: 'Field' },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setRankFilter(v as typeof rankFilter)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                rankFilter === v
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >{label}</button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1 ml-auto">
          <button
            onClick={() => setView('grouped')}
            className={clsx('px-2.5 py-1.5 rounded-md transition-all', view === 'grouped' ? 'bg-white shadow text-blue-600' : 'text-slate-500')}
            title="Grouped by department"
          ><Grid2x2 className="w-4 h-4" /></button>
          <button
            onClick={() => setView('chain')}
            className={clsx('px-2.5 py-1.5 rounded-md transition-all', view === 'chain' ? 'bg-white shadow text-blue-600' : 'text-slate-500')}
            title="Reporting chain (tree)"
          ><Network className="w-4 h-4" /></button>
          <button
            onClick={() => setView('list')}
            className={clsx('px-2.5 py-1.5 rounded-md transition-all', view === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500')}
            title="Flat list"
          ><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatChip icon={Users}     label="Total Officers" value={officers.length}                     tone="blue" />
        <StatChip icon={ToggleRight} label="Active"       value={officers.filter(o => o.is_active).length} tone="emerald" />
        <StatChip icon={Building2} label="Departments"    value={departments.length}                  tone="amber" />
        <StatChip icon={AlertTriangle} label="Duplicates" value={duplicateIds.size}                   tone={duplicateIds.size > 0 ? 'red' : 'slate'} />
      </div>

      {/* Duplicate warning banner */}
      {duplicateIds.size > 0 && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-900 text-sm">
              {duplicateIds.size} duplicate officer record{duplicateIds.size > 1 ? 's' : ''} detected
            </div>
            <div className="text-red-700 text-xs mt-0.5">
              Records sharing the same name + designation. Click the red trash icon on a card to remove duplicates.
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (query || rankFilter) && (
        <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No officers match your search.</p>
          <button
            onClick={() => { setQuery(''); setRankFilter('') }}
            className="text-blue-600 text-xs mt-2 hover:text-blue-800 font-semibold"
          >Clear filters</button>
        </div>
      )}

      {/* ════════ GROUPED VIEW ════════ */}
      {view === 'grouped' && filtered.length > 0 && (
        <div className="space-y-8">
          {/* SDO(s) — render all rank-1 officers so duplicates are visible */}
          {sdos.length > 0 && (!rankFilter || rankFilter === '1') && (
            <section>
              <SectionLabel icon={Star} text={sdos.length > 1 ? `Apex Authority (${sdos.length} records — clean up duplicates)` : 'Apex Authority'} />
              <div className="space-y-3">
                {sdos.map(s => (
                  <SDOCard
                    key={s.id}
                    officer={s}
                    isOfficer={isOfficer}
                    onToggleActive={onToggleActive}
                    onDelete={() => setConfirmDelete(s)}
                    duplicate={duplicateIds.has(s.id) || sdos.length > 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Departments */}
          {departments.length > 0 && (rankFilter !== '1') && (
            <section>
              <SectionLabel icon={Building2} text="Department Structure" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {departments.map(dept => {
                  // ALL rank-2 heads in this dept (not just .find — a dept can have multiple)
                  const heads = deptHeads.filter(o => o.department === dept)
                  const field = fieldOfficers.filter(o => o.department === dept)
                  // skip cards that have nothing after filters
                  if (heads.length === 0 && field.length === 0) return null
                  const meta = DEPT_META[dept] ?? { icon: '🏢', accent: 'from-gray-100 to-gray-50', ring: 'ring-gray-200' }
                  return (
                    <DepartmentCard
                      key={dept}
                      department={dept}
                      meta={meta}
                      heads={heads}
                      field={field}
                      isOfficer={isOfficer}
                      onToggleActive={onToggleActive}
                      onDelete={(o) => setConfirmDelete(o)}
                      duplicateIds={duplicateIds}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ════════ CHAIN VIEW ════════ */}
      {view === 'chain' && filtered.length > 0 && (
        <div className="space-y-3">
          <SectionLabel icon={Network} text="Reporting Chain" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {filtered
              .filter(o => !o.parent_officer_id || !filtered.some(p => p.id === o.parent_officer_id))
              .map(root => (
                <ChainNode
                  key={root.id}
                  officer={root}
                  all={filtered}
                  depth={0}
                  isOfficer={isOfficer}
                  onToggleActive={onToggleActive}
                  onDelete={(o) => setConfirmDelete(o)}
                  duplicateIds={duplicateIds}
                />
              ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            Complaints assigned to an officer are visible to everyone above them in this chain.
          </p>
        </div>
      )}

      {/* ════════ LIST VIEW ════════ */}
      {view === 'list' && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Officer</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Department</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Contact</th>
                <th className="text-left px-5 py-3">Rank</th>
                <th className="text-right px-5 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
                .map((o, i) => (
                  <OfficerRow
                    key={o.id}
                    officer={o}
                    isOfficer={isOfficer}
                    onToggleActive={onToggleActive}
                    onDelete={() => setConfirmDelete(o)}
                    duplicate={duplicateIds.has(o.id)}
                    striped={i % 2 === 1}
                  />
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════ DELETE CONFIRMATION ════════ */}
      {confirmDelete && onDelete && (
        <DeleteConfirm
          officer={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            onDelete(confirmDelete.id)
            setConfirmDelete(null)
          }}
        />
      )}

      <div className="text-xs text-slate-400 text-center pt-6">
        Showing {filtered.length} of {officers.length} officer{officers.length !== 1 ? 's' : ''}
        {departments.length > 0 && ` across ${departments.length} departments`}
      </div>
    </div>
  )
}

/* ─── Section label ──────────────────────────────────────── */
function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
      <Icon className="w-3.5 h-3.5" />
      {text}
    </div>
  )
}

/* ─── Small stat chip ─────────────────────────────────────── */
function StatChip({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' }) {
  const tones = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-500' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   icon: 'text-slate-400' },
  }[tone]
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${tones.bg} border border-current/10`}>
      <Icon className={`w-4 h-4 ${tones.icon}`} />
      <div>
        <div className={`text-lg font-bold leading-none ${tones.text}`}>{value}</div>
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  )
}

/* ─── SDO Hero Card ───────────────────────────────────────── */
function SDOCard({ officer, isOfficer, onToggleActive, onDelete, duplicate }: {
  officer: Officer
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete: () => void
  duplicate: boolean
}) {
  return (
    <div className={clsx(
      'relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-lg overflow-hidden',
      !officer.is_active && 'opacity-50 grayscale',
      duplicate && 'ring-2 ring-red-400 ring-offset-2'
    )}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full -ml-24 -mb-24" />
      <div className="relative flex flex-wrap items-center gap-5">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/20">
          🏛️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-blue-200 uppercase tracking-wider mb-0.5 font-semibold">Rank I · Sub-Divisional Officer</div>
          <div className="font-bold text-xl leading-snug">{officer.name}</div>
          <div className="text-blue-100/80 text-sm mt-0.5">{officer.designation}</div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            {officer.phone && <ContactPill icon={Phone} text={officer.phone} />}
            {officer.email && <ContactPill icon={Mail}  text={officer.email} />}
          </div>
        </div>
        {isOfficer && (
          <div className="flex items-center gap-1 shrink-0">
            <ActionBtn variant="toggle" active={officer.is_active} onClick={() => onToggleActive?.(officer.id, !officer.is_active)} />
            <ActionBtn variant="delete" onClick={onDelete} />
          </div>
        )}
      </div>
    </div>
  )
}

function ContactPill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-lg backdrop-blur-sm">
      <Icon className="w-3 h-3" /> {text}
    </span>
  )
}

/* ─── Department Card ─────────────────────────────────────── */
function DepartmentCard({
  department, meta, heads, field, isOfficer, onToggleActive, onDelete, duplicateIds,
}: {
  department: string
  meta: { icon: string; accent: string; ring: string }
  heads: Officer[]
  field: Officer[]
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete: (o: Officer) => void
  duplicateIds: Set<string>
}) {
  const headCount = heads.length
  return (
    <div className={`rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden ring-1 ${meta.ring} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className={`px-5 py-4 bg-gradient-to-r ${meta.accent} border-b border-slate-200/60 flex items-center gap-3`}>
        <span className="text-2xl">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-navy-900 text-sm leading-snug">{department}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            {headCount > 0 ? `${headCount} head${headCount > 1 ? 's' : ''}` : 'No head assigned'} · {field.length} field officer{field.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Heads (can be multiple) */}
      {heads.length > 0 && (
        <div className="divide-y divide-slate-100">
          {heads.map(h => (
            <OfficerInline
              key={h.id}
              officer={h}
              rankBadge="Head"
              rankColor="bg-amber-100 text-amber-800"
              isOfficer={isOfficer}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              duplicate={duplicateIds.has(h.id)}
            />
          ))}
        </div>
      )}

      {/* Field officers */}
      {field.length > 0 && (
        <div className="divide-y divide-slate-100 border-t border-slate-200">
          {field.map(o => (
            <OfficerInline
              key={o.id}
              officer={o}
              rankBadge="Field"
              rankColor="bg-slate-100 text-slate-600"
              isOfficer={isOfficer}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              duplicate={duplicateIds.has(o.id)}
            />
          ))}
        </div>
      )}

      {/* Empty department */}
      {heads.length === 0 && field.length === 0 && (
        <div className="px-5 py-8 text-center text-slate-400 text-xs">
          No officers assigned to this department yet.
        </div>
      )}
    </div>
  )
}

/* ─── Officer Inline Row (used inside Dept cards) ─────────── */
function OfficerInline({
  officer, rankBadge, rankColor, isOfficer, onToggleActive, onDelete, duplicate,
}: {
  officer: Officer
  rankBadge: string
  rankColor: string
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete: (o: Officer) => void
  duplicate: boolean
}) {
  return (
    <div className={clsx(
      'px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group',
      !officer.is_active && 'opacity-50',
      duplicate && 'bg-red-50/50'
    )}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow">
        {initials(officer.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-navy-900 text-sm truncate">{officer.name}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${rankColor}`}>{rankBadge}</span>
          {duplicate && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Duplicate
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 truncate">{officer.designation}</div>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
          {officer.phone && <span className="inline-flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {officer.phone}</span>}
          {officer.email && <span className="inline-flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {officer.email}</span>}
        </div>
      </div>

      {/* Actions */}
      {isOfficer && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn variant="toggle" active={officer.is_active} onClick={() => onToggleActive?.(officer.id, !officer.is_active)} />
          <ActionBtn variant="delete" onClick={() => onDelete(officer)} />
        </div>
      )}
    </div>
  )
}

/* ─── Table Row (List View) ──────────────────────────────── */
function OfficerRow({
  officer, isOfficer, onToggleActive, onDelete, duplicate, striped,
}: {
  officer: Officer
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete: () => void
  duplicate: boolean
  striped: boolean
}) {
  const rankLabel = officer.rank === 1 ? 'SDO' : officer.rank === 2 ? 'Head' : 'Field'
  const rankClr = officer.rank === 1 ? 'bg-blue-100 text-blue-800' : officer.rank === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
  return (
    <tr className={clsx(
      'border-b border-slate-100 hover:bg-blue-50/40 transition-colors',
      striped && 'bg-slate-50/50',
      !officer.is_active && 'opacity-50',
      duplicate && '!bg-red-50/60'
    )}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials(officer.name)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-navy-900 text-sm flex items-center gap-2 truncate">
              {officer.name}
              {duplicate && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
            </div>
            <div className="text-xs text-slate-500 truncate">{officer.designation}</div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-600">{officer.department ?? '—'}</td>
      <td className="px-5 py-3 hidden sm:table-cell text-xs text-slate-600">
        <div>{officer.phone || <span className="text-slate-300">—</span>}</div>
        <div className="text-slate-400">{officer.email || ''}</div>
      </td>
      <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${rankClr}`}>{rankLabel}</span></td>
      <td className="px-5 py-3">
        {isOfficer && (
          <div className="flex justify-end gap-1">
            <ActionBtn variant="toggle" active={officer.is_active} onClick={() => onToggleActive?.(officer.id, !officer.is_active)} />
            <ActionBtn variant="delete" onClick={onDelete} />
          </div>
        )}
      </td>
    </tr>
  )
}

/* ─── Reusable Action Button ─────────────────────────────── */
function ActionBtn({
  variant, active, onClick,
}: { variant: 'toggle' | 'delete'; active?: boolean; onClick: () => void }) {
  if (variant === 'delete') {
    return (
      <button
        onClick={onClick}
        title="Delete officer"
        className="w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      title={active ? 'Deactivate' : 'Activate'}
      className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
        active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'
      )}
    >
      {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
    </button>
  )
}

/* ─── Recursive Chain Node ──────────────────────────────── */
function ChainNode({
  officer, all, depth, isOfficer, onToggleActive, onDelete, duplicateIds,
}: {
  officer: Officer
  all: Officer[]
  depth: number
  isOfficer?: boolean
  onToggleActive?: (id: string, active: boolean) => void
  onDelete: (o: Officer) => void
  duplicateIds: Set<string>
}) {
  const children = directReports(officer.id, all)
  const rankTone =
    officer.rank === 1 ? { ring: 'ring-blue-400',   bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',  badge: 'bg-blue-100 text-blue-800',   label: 'SDO' } :
    officer.rank === 2 ? { ring: 'ring-amber-400',  bg: 'bg-gradient-to-br from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-800', label: 'DMDC' } :
                         { ring: 'ring-slate-300',  bg: 'bg-gradient-to-br from-slate-500 to-slate-700',  badge: 'bg-slate-100 text-slate-600', label: 'OC' }

  return (
    <div className="relative">
      <div className={clsx(
        'flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors group',
        depth > 0 && 'ml-4 border-l-2 border-slate-200 pl-5',
        duplicateIds.has(officer.id) && 'bg-red-50/40 hover:bg-red-50/60',
        !officer.is_active && 'opacity-50',
      )}>
        {/* Connector elbow */}
        {depth > 0 && (
          <div className="absolute -left-px top-7 w-5 h-px bg-slate-200" />
        )}

        {/* Avatar */}
        <div className={`shrink-0 w-10 h-10 rounded-full ${rankTone.bg} text-white text-xs font-bold flex items-center justify-center shadow ring-2 ring-offset-2 ${rankTone.ring}`}>
          {initials(officer.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy-900 text-sm truncate">{officer.name}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${rankTone.badge}`}>{rankTone.label}</span>
            {duplicateIds.has(officer.id) && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Duplicate
              </span>
            )}
            {children.length > 0 && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {children.length} report{children.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">{officer.designation}</div>
          {officer.portfolio && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              <Briefcase className="w-2.5 h-2.5" /> {officer.portfolio}
            </div>
          )}
          {officer.department && (
            <div className="mt-1 text-[11px] text-slate-500">{officer.department}</div>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
            {officer.phone && <span className="inline-flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {officer.phone}</span>}
            {officer.email && <span className="inline-flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {officer.email}</span>}
          </div>
        </div>

        {/* Actions */}
        {isOfficer && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionBtn variant="toggle" active={officer.is_active} onClick={() => onToggleActive?.(officer.id, !officer.is_active)} />
            <ActionBtn variant="delete" onClick={() => onDelete(officer)} />
          </div>
        )}
      </div>

      {/* Recurse for direct reports */}
      {children.length > 0 && (
        <div className="mt-1">
          {children
            .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
            .map(child => (
              <ChainNode
                key={child.id}
                officer={child}
                all={all}
                depth={depth + 1}
                isOfficer={isOfficer}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                duplicateIds={duplicateIds}
              />
            ))}
        </div>
      )}
    </div>
  )
}

/* ─── Delete confirmation modal ─────────────────────────── */
function DeleteConfirm({ officer, onCancel, onConfirm }: {
  officer: Officer
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-center font-bold text-navy-900 text-lg">Delete Officer</h3>
          <p className="text-center text-slate-600 text-sm mt-2">
            Remove <span className="font-semibold">{officer.name}</span> from the directory?
          </p>
          <p className="text-center text-slate-400 text-xs mt-1.5">
            This cannot be undone. Complaints assigned to this officer will remain but become unassigned.
          </p>
        </div>
        <div className="flex border-t border-slate-200">
          <button onClick={onCancel}  className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}
