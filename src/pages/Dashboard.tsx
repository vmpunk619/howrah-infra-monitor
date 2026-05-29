import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, List, Users, UserPlus,
  LogOut, RefreshCw, Filter, Bell, ChevronRight,
  AlertTriangle, Clock, Zap, CheckCircle, TrendingUp,
  Inbox, Upload, FileText, Search, X,
  Gift, Plus, Pencil, Trash2, ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Complaint, ComplaintStatus, IssueCategory, Officer, Dak, DakStatus, DakCategory } from '../types'
import { ISSUE_CATEGORIES, STATUS_CONFIG } from '../lib/departments'
import { DAK_STATUS_CONFIG, DAK_PRIORITY_CONFIG, DAK_CATEGORY_CONFIG, DAK_SENDER_TYPE_CONFIG, isOverdue } from '../lib/dak'
import { Scheme, SchemeRow, rowToScheme, CATEGORY_META } from '../lib/schemes'
import ComplaintMap from '../components/ComplaintMap'
import ComplaintCard from '../components/ComplaintCard'
import StatsPanel from '../components/StatsPanel'
import OfficerHierarchy from '../components/OfficerHierarchy'
import AddOfficerModal from '../components/AddOfficerModal'
import UploadDakModal from '../components/UploadDakModal'
import DakDetailModal from '../components/DakDetailModal'
import AddSchemeModal from '../components/AddSchemeModal'
import clsx from 'clsx'
import { format } from 'date-fns'

type View = 'overview' | 'map' | 'list' | 'officers' | 'dak' | 'schemes'

const NAV_ITEMS: { key: View; icon: React.ElementType; label: string; sub: string }[] = [
  { key: 'overview', icon: LayoutDashboard, label: 'Overview',        sub: 'Stats & activity'    },
  { key: 'map',      icon: MapPin,          label: 'Complaints Map',  sub: 'Geographic view'     },
  { key: 'list',     icon: List,            label: 'Complaints List', sub: 'Manage & filter'     },
  { key: 'dak',      icon: Inbox,           label: 'Dak Tracking',    sub: 'Correspondence flow' },
  { key: 'officers', icon: Users,           label: 'Officers',        sub: 'Hierarchy & teams'   },
  { key: 'schemes',  icon: Gift,            label: 'Govt Schemes',    sub: 'Services page content' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints]     = useState<Complaint[]>([])
  const [officers, setOfficers]         = useState<Officer[]>([])
  const [daks, setDaks]                 = useState<Dak[]>([])
  const [loading, setLoading]           = useState(true)
  const [authChecked, setAuthChecked]   = useState(false)
  const [view, setView]                 = useState<View>('overview')
  const [showAddOfficer, setShowAddOfficer] = useState(false)
  const [showUploadDak, setShowUploadDak]   = useState(false)
  const [openDak, setOpenDak]               = useState<Dak | null>(null)
  const [schemes, setSchemes]               = useState<Scheme[]>([])
  const [showSchemeModal, setShowSchemeModal] = useState(false)
  const [editScheme, setEditScheme]         = useState<Scheme | null>(null)
  const [toast, setToast] = useState<string>('')
  const [filters, setFilters] = useState({
    status:   '' as ComplaintStatus | '',
    category: '' as IssueCategory   | '',
  })

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3200)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login')
      else { setAuthChecked(true); fetchAll() }
    })
  }, [navigate])

  async function fetchAll() {
    setLoading(true)
    const [{ data: c }, { data: o }, { data: d }, { data: s }] = await Promise.all([
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('officers').select('*').order('rank').order('name'),
      supabase.from('dak').select('*').order('created_at', { ascending: false }),
      supabase.from('schemes').select('*').order('created_at', { ascending: true }),
    ])
    if (c) setComplaints(c)
    if (o) setOfficers(o)
    if (d) setDaks(d as Dak[])
    if (s) setSchemes(s.map(r => rowToScheme(r as SchemeRow)))
    setLoading(false)
  }

  async function handleDeleteScheme(id: string) {
    const { error } = await supabase.from('schemes').delete().eq('id', id)
    if (error) { flash(`✗ Failed to delete: ${error.message}`); return }
    setSchemes(prev => prev.filter(s => s.id !== id))
    flash('✓ Scheme removed from Services page')
  }

  async function handleStatusUpdate(id: string, status: ComplaintStatus, notes: string) {
    const c = complaints.find(x => x.id === id)
    if (!c) return
    await supabase.from('complaint_updates').insert({
      complaint_id: id, status_from: c.status, status_to: status, notes,
    })
    const updates: Partial<Complaint> = { status, officer_notes: notes || c.officer_notes }
    if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString()
    await supabase.from('complaints').update(updates).eq('id', id)
    setComplaints(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x))
  }

  async function handleAssignOfficer(complaintId: string, officerId: string) {
    await supabase.from('complaints').update({ officer_id: officerId }).eq('id', complaintId)
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, officer_id: officerId } : c))
  }

  async function handleToggleOfficer(id: string, active: boolean) {
    await supabase.from('officers').update({ is_active: active }).eq('id', id)
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, is_active: active } : o))
  }

  async function handleDeleteOfficer(id: string) {
    const officer = officers.find(o => o.id === id)
    // Detach the officer from any assigned complaints so the FK doesn't block delete
    await supabase.from('complaints').update({ officer_id: null }).eq('officer_id', id)
    const { error } = await supabase.from('officers').delete().eq('id', id)
    if (error) {
      console.error('[Dashboard] delete officer failed:', error)
      flash(`✗ Failed to delete: ${error.message}`)
      return
    }
    setOfficers(prev => prev.filter(o => o.id !== id))
    flash(`✓ Removed ${officer?.name ?? 'officer'} from the directory`)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const filtered = complaints.filter(c => {
    if (filters.status   && c.status   !== filters.status)   return false
    if (filters.category && c.category !== filters.category) return false
    return true
  })

  const pending    = complaints.filter(c => c.status === 'pending').length
  const inProgress = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length
  const resolved   = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Checking authentication…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ══════════════ LEFT SIDEBAR ══════════════ */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 flex flex-col z-40 shadow-2xl">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white text-lg">🏛️</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight group-hover:text-blue-400 transition-colors">
                Admin Panel
              </div>
              <div className="text-gray-500 text-xs">Howrah Sadar</div>
            </div>
          </Link>
        </div>

        {/* Alert badge — shown when complaints need attention */}
        {!loading && pending > 0 && (
          <div className="mx-3 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <Bell className="w-3 h-3" /> Needs Attention
            </div>
            <div className="text-xs text-gray-500">
              {pending} pending · {inProgress} in&nbsp;progress
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ key, icon: Icon, label, sub }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group',
                view === key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight">{label}</div>
                <div className={clsx('text-xs mt-0.5 truncate',
                  view === key ? 'text-blue-200' : 'text-gray-600 group-hover:text-gray-400'
                )}>{sub}</div>
              </div>
            </button>
          ))}

          {/* Divider + Quick actions */}
          <div className="pt-4 mt-2 border-t border-white/10 space-y-1">
            <Link
              to="/report"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-gray-400 hover:bg-saffron/10 hover:text-saffron-light transition-all group"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-saffron" />
              <div>
                <div className="text-sm font-semibold leading-tight">New Complaint</div>
                <div className="text-xs mt-0.5 text-gray-600 group-hover:text-gray-500">Digitise a hardcopy / email</div>
              </div>
            </Link>
            <button
              onClick={() => setShowAddOfficer(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-gray-400 hover:bg-green-500/10 hover:text-green-400 transition-all group"
            >
              <UserPlus className="w-4 h-4 shrink-0 text-green-500" />
              <div>
                <div className="text-sm font-semibold leading-tight">Add Officer</div>
                <div className="text-xs mt-0.5 text-gray-600 group-hover:text-gray-500">Create new record</div>
              </div>
            </button>
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-5 pt-3 border-t border-white/10 space-y-1">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm disabled:opacity-40"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Refresh Data
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">

        {/* Sticky top bar */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-semibold text-gray-800">
              {NAV_ITEMS.find(n => n.key === view)?.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{complaints.length} total reports</span>
            <span className="text-green-600 font-semibold">● Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading data…
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {view === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Quick stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Reports',  value: complaints.length, icon: TrendingUp,  color: 'from-blue-500 to-blue-600',      bg: 'bg-blue-50',    text: 'text-blue-700'    },
                      { label: 'Pending',         value: pending,           icon: Clock,       color: 'from-amber-500 to-orange-500',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
                      { label: 'In Progress',     value: inProgress,        icon: Zap,         color: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50',  text: 'text-violet-700'  },
                      { label: 'Resolved',        value: resolved,          icon: CheckCircle, color: 'from-emerald-500 to-green-600',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    ].map(({ label, value, icon: Icon, color, bg, text }) => (
                      <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-slide-up">
                        <div className={clsx('inline-flex w-10 h-10 rounded-xl bg-gradient-to-br items-center justify-center mb-3', color)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className={clsx('text-3xl font-black', text)}>{value}</div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Map + Recent */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    <div className="lg:col-span-3">
                      <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" /> Live Map
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
                        <ComplaintMap complaints={complaints} height="380px" />
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Reports
                        </span>
                        <button onClick={() => setView('list')} className="text-xs text-blue-600 hover:text-blue-800 font-normal normal-case tracking-normal">
                          View all →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {complaints.slice(0, 8).map((c, i) => (
                          <div
                            key={c.id}
                            className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm animate-slide-up hover:border-blue-200 transition-colors"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <div className="text-lg shrink-0">{ISSUE_CATEGORIES[c.category]?.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-xs text-blue-600 font-bold">{c.complaint_number}</span>
                                <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-semibold', STATUS_CONFIG[c.status].color)}>
                                  {STATUS_CONFIG[c.status].label}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 truncate">{c.description}</div>
                            </div>
                            <div className="text-xs text-gray-400 shrink-0">
                              {format(new Date(c.created_at), 'dd MMM')}
                            </div>
                          </div>
                        ))}
                        {complaints.length === 0 && (
                          <div className="text-center py-10 text-gray-400 text-sm">No complaints yet</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full stats panel */}
                  <div>
                    <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Detailed Statistics</div>
                    <StatsPanel complaints={complaints} />
                  </div>
                </div>
              )}

              {/* ── MAP ── */}
              {view === 'map' && (
                <div className="animate-fade-in">
                  <div className="rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
                    <ComplaintMap complaints={filtered} height="calc(100vh - 140px)" />
                  </div>
                </div>
              )}

              {/* ── LIST ── */}
              {view === 'list' && (
                <div className="animate-fade-in">
                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <select
                      value={filters.status}
                      onChange={e => setFilters(f => ({ ...f, status: e.target.value as ComplaintStatus | '' }))}
                      className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                    >
                      <option value="">All Status</option>
                      {Object.entries(STATUS_CONFIG).map(([s, { label }]) => (
                        <option key={s} value={s}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={filters.category}
                      onChange={e => setFilters(f => ({ ...f, category: e.target.value as IssueCategory | '' }))}
                      className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                    >
                      <option value="">All Categories</option>
                      {Object.entries(ISSUE_CATEGORIES).map(([cat, { label, icon }]) => (
                        <option key={cat} value={cat}>{icon} {label}</option>
                      ))}
                    </select>
                    {(filters.status || filters.category) && (
                      <button
                        onClick={() => setFilters({ status: '', category: '' })}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                    <span className="ml-auto text-xs text-gray-400">
                      {filtered.length} of {complaints.length} complaints
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((c, i) => (
                      <ComplaintCard
                        key={c.id}
                        complaint={c}
                        officers={officers}
                        onStatusUpdate={handleStatusUpdate}
                        onAssignOfficer={handleAssignOfficer}
                        isOfficer
                        index={i}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-3 text-center py-16 text-gray-400 animate-fade-in">
                        No complaints match the current filters
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── OFFICERS ── */}
              {view === 'officers' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Officer Hierarchy</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {officers.filter(o => o.is_active).length} active · {officers.filter(o => !o.is_active).length} inactive
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddOfficer(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25 btn-press"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Officer
                    </button>
                  </div>
                  <OfficerHierarchy
                    officers={officers}
                    isOfficer
                    onToggleActive={handleToggleOfficer}
                    onDelete={handleDeleteOfficer}
                  />
                </div>
              )}

              {/* ── DAK TRACKING ── */}
              {view === 'dak' && (
                <DakDashboardView
                  daks={daks}
                  officers={officers}
                  onUploadClick={() => setShowUploadDak(true)}
                  onOpen={(d: Dak) => setOpenDak(d)}
                />
              )}

              {/* ── SCHEMES ── */}
              {view === 'schemes' && (
                <SchemesView
                  schemes={schemes}
                  onAdd={() => { setEditScheme(null); setShowSchemeModal(true) }}
                  onEdit={(s) => { setEditScheme(s); setShowSchemeModal(true) }}
                  onDelete={handleDeleteScheme}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Officer Modal */}
      {showAddOfficer && (
        <AddOfficerModal
          existingOfficers={officers}
          onClose={() => setShowAddOfficer(false)}
          onAdded={officer => {
            // Optimistic insert + sort by (rank, name) so it lands in the right spot
            setOfficers(prev =>
              [...prev, officer].sort((a, b) =>
                a.rank - b.rank || a.name.localeCompare(b.name)
              )
            )
            // Surface the change to the user — switch to the Officers view
            setView('officers')
            flash(`✓ ${officer.name} added to the directory`)
            // Belt-and-braces: refetch from server so DB & UI can never drift
            fetchAll()
          }}
        />
      )}

      {/* Upload Dak Modal */}
      {showUploadDak && (
        <UploadDakModal
          officers={officers}
          onClose={() => setShowUploadDak(false)}
          onCreated={(dak) => {
            setDaks(prev => [dak, ...prev])
            setView('dak')
            flash(`✓ Dak ${dak.dak_number} logged`)
            fetchAll()
          }}
        />
      )}

      {/* Dak Detail Modal */}
      {openDak && (
        <DakDetailModal
          dak={openDak}
          officers={officers}
          canAct={true}
          onClose={() => setOpenDak(null)}
          onUpdated={(updated) => {
            setDaks(prev => prev.map(d => d.id === updated.id ? updated : d))
            setOpenDak(updated)
          }}
        />
      )}

      {/* Add / Edit Scheme Modal */}
      {showSchemeModal && (
        <AddSchemeModal
          existing={editScheme}
          onClose={() => setShowSchemeModal(false)}
          onSaved={fetchAll}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-cream px-5 py-3 rounded-xl shadow-2xl border border-gold/30 text-sm animate-slide-up flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   DAK DASHBOARD VIEW — stats + filters + list
   ════════════════════════════════════════════════════════════ */
function DakDashboardView({
  daks, officers, onUploadClick, onOpen,
}: {
  daks: Dak[]
  officers: Officer[]
  onUploadClick: () => void
  onOpen: (d: Dak) => void
}) {
  const [query,    setQuery]    = useState('')
  const [statusF,  setStatusF]  = useState<'' | DakStatus | 'overdue'>('')
  const [officerF, setOfficerF] = useState('')
  const [catF,     setCatF]     = useState<'' | DakCategory>('')

  const officerById = useMemo(() => new Map(officers.map(o => [o.id, o])), [officers])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return daks.filter(d => {
      if (statusF === 'overdue') {
        if (!isOverdue(d)) return false
      } else if (statusF && d.status !== statusF) {
        return false
      }
      if (officerF && d.current_officer_id !== officerF) return false
      if (catF && d.category !== catF) return false
      if (!q) return true
      return (
        d.dak_number.toLowerCase().includes(q) ||
        (d.memo_number || '').toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.sender_name.toLowerCase().includes(q) ||
        (d.sender_organization || '').toLowerCase().includes(q) ||
        (d.sender_phone || '').includes(q) ||
        (d.sender_email || '').toLowerCase().includes(q)
      )
    })
  }, [daks, query, statusF, officerF, catF])

  const total      = daks.length
  const pending    = daks.filter(d => d.status === 'pending').length
  const inProgress = daks.filter(d => ['assigned','in_progress','forwarded','awaiting_reply','action_taken'].includes(d.status)).length
  const disposed   = daks.filter(d => d.status === 'disposed' || d.status === 'closed').length
  const overdueCt  = daks.filter(isOverdue).length

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Dak Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Incoming correspondence — current status, who has it, and movement history.
          </p>
        </div>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-saffron/25 transition-all btn-press"
        >
          <Upload className="w-4 h-4" />
          Log New Dak
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <DakStatCard label="Total"      value={total}      icon={Inbox}         tone="blue"    onClick={() => setStatusF('')} active={statusF === ''} />
        <DakStatCard label="Pending"    value={pending}    icon={Clock}         tone="amber"   onClick={() => setStatusF('pending')} active={statusF === 'pending'} />
        <DakStatCard label="In Progress" value={inProgress} icon={Zap}          tone="violet"  onClick={() => setStatusF('in_progress')} active={statusF === 'in_progress'} />
        <DakStatCard label="Disposed"   value={disposed}   icon={CheckCircle}   tone="emerald" onClick={() => setStatusF('disposed')} active={statusF === 'disposed'} />
        <DakStatCard label="Overdue"    value={overdueCt}  icon={AlertTriangle} tone={overdueCt > 0 ? 'red' : 'slate'} onClick={() => setStatusF('overdue')} active={statusF === 'overdue'} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by memo no., Dak no., subject, sender, phone, email…"
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={catF}
          onChange={e => setCatF(e.target.value as DakCategory | '')}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
        >
          <option value="">All categories</option>
          {Object.entries(DAK_CATEGORY_CONFIG).map(([v, { label, icon }]) => (
            <option key={v} value={v}>{icon} {label}</option>
          ))}
        </select>
        <select
          value={officerF}
          onChange={e => setOfficerF(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
        >
          <option value="">All officers</option>
          {officers
            .filter(o => o.is_active)
            .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
            .map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select>
        {(statusF || officerF || catF || query) && (
          <button
            onClick={() => { setStatusF(''); setOfficerF(''); setCatF(''); setQuery('') }}
            className="text-xs text-saffron-dark hover:text-saffron font-semibold"
          >Clear all</button>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} of {daks.length}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <div className="text-sm text-slate-500">
            {daks.length === 0
              ? 'No daks logged yet. Click "Log New Dak" to add your first.'
              : 'No daks match the current filters.'}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Dak #</th>
                <th className="text-left px-4 py-3">Subject / Sender</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Currently With</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Due</th>
                <th className="text-right px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const officer = d.current_officer_id ? officerById.get(d.current_officer_id) : null
                const overdue = isOverdue(d)
                return (
                  <tr
                    key={d.id}
                    onClick={() => onOpen(d)}
                    className={clsx(
                      'border-b border-slate-100 hover:bg-saffron/5 cursor-pointer transition-colors',
                      i % 2 === 1 && 'bg-slate-50/50',
                      overdue && '!bg-red-50/60 hover:!bg-red-50',
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      <div className="font-bold text-saffron-dark">{d.dak_number}</div>
                      {d.memo_number && (
                        <div className="text-[10px] text-blue-700 mt-0.5 font-semibold">
                          Memo: {d.memo_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {d.category && (
                          <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase', DAK_CATEGORY_CONFIG[d.category].color)}>
                            {DAK_CATEGORY_CONFIG[d.category].icon} {DAK_CATEGORY_CONFIG[d.category].label}
                          </span>
                        )}
                        {d.sender_type && (
                          <span className={clsx('text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase', DAK_SENDER_TYPE_CONFIG[d.sender_type].color)}>
                            {DAK_SENDER_TYPE_CONFIG[d.sender_type].short}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-navy-900 text-sm truncate max-w-xs">{d.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        From: {d.sender_name}
                        {d.sender_organization && <> · {d.sender_organization}</>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {officer
                        ? <div>
                            <div className="text-sm font-semibold text-navy-900">{officer.name}</div>
                            <div className="text-[11px] text-slate-500">{officer.designation}</div>
                          </div>
                        : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', DAK_STATUS_CONFIG[d.status].color)}>
                        {DAK_STATUS_CONFIG[d.status].label}
                      </span>
                      {d.priority !== 'normal' && (
                        <div className="mt-1">
                          <span className={clsx('text-[9px] px-1.5 py-0.5 rounded font-bold uppercase', DAK_PRIORITY_CONFIG[d.priority].color)}>
                            {DAK_PRIORITY_CONFIG[d.priority].label}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs">
                      {d.due_date ? (
                        <span className={clsx(overdue ? 'text-red-700 font-semibold' : 'text-slate-600')}>
                          {format(new Date(d.due_date), 'dd MMM')}
                          {overdue && ' ⚠'}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 inline" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DakStatCard({
  label, value, icon: Icon, tone, onClick, active,
}: { label: string; value: number; icon: React.ElementType; tone: 'blue'|'amber'|'violet'|'emerald'|'red'|'slate'; onClick: () => void; active: boolean }) {
  const tones = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500',    ring: 'ring-blue-400'    },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-500',   ring: 'ring-amber-400'   },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'text-violet-500',  ring: 'ring-violet-400'  },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', ring: 'ring-emerald-400' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-500',     ring: 'ring-red-400'     },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   icon: 'text-slate-400',   ring: 'ring-slate-400'   },
  }[tone]
  return (
    <button
      onClick={onClick}
      className={clsx(
        `flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${tones.bg} border border-current/10 hover:shadow-md`,
        active && `ring-2 ${tones.ring} shadow-md`,
      )}
    >
      <Icon className={`w-5 h-5 ${tones.icon}`} />
      <div>
        <div className={`text-xl font-bold leading-none ${tones.text}`}>{value}</div>
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════
   SCHEMES VIEW — manage admin-added Govt Services content
   ════════════════════════════════════════════════════════════ */
function SchemesView({
  schemes, onAdd, onEdit, onDelete,
}: {
  schemes: Scheme[]
  onAdd: () => void
  onEdit: (s: Scheme) => void
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Government Schemes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Schemes added here are published on the public Govt Services page, alongside the built-in list.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-saffron/25 transition-all btn-press"
        >
          <Plus className="w-4 h-4" /> Add Scheme
        </button>
      </div>

      {schemes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <div className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            No custom schemes yet. The Services page still shows the built-in schemes —
            click “Add Scheme” to publish a new one.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schemes.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-2">
                <div className="text-3xl shrink-0">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-900 text-sm leading-snug">{s.name}</div>
                  <div className="text-[11px] font-semibold text-saffron-dark uppercase tracking-wide mt-0.5">
                    {CATEGORY_META[s.category]?.label}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-2">{s.objective}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => onEdit(s)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {confirmId === s.id ? (
                  <>
                    <button onClick={() => { onDelete(s.id); setConfirmId(null) }} className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                      Confirm delete
                    </button>
                    <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmId(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                {s.websites?.[0] && (
                  <a href={s.websites[0].url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gray-400 hover:text-saffron" title="Open official site">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
