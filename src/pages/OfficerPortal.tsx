import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LogOut, RefreshCw, CheckCircle, Clock, Zap,
  MapPin, Calendar, User, Phone, ChevronRight, Shield,
  Briefcase, Mail, Save, UserCog, ListChecks, AlertCircle,
  Sun, Moon, Inbox, AlertTriangle, AtSign, KeyRound, Eye, EyeOff,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Complaint, ComplaintStatus, Officer, Dak } from '../types'
import { STATUS_CONFIG, ISSUE_CATEGORIES } from '../lib/departments'
import { selfAndDescendantIds } from '../lib/officerChain'
import { DAK_STATUS_CONFIG, DAK_PRIORITY_CONFIG, isOverdue } from '../lib/dak'
import DakDetailModal from '../components/DakDetailModal'
import { useTheme } from '../lib/theme'
import { format } from 'date-fns'
import clsx from 'clsx'

const RANK_LABEL: Record<number, string> = {
  1: 'SDO Level',
  2: 'Department Head',
  3: 'Field Officer',
}

const DEPARTMENTS = [
  'PWD Roads Division, Howrah',
  'PHE & Drainage Division',
  'Drainage & Flood Control Division',
  'WBSEDCL / Municipal Lighting Cell',
  'Solid Waste Management Cell',
  'Sub-Divisional Office, Howrah Sadar',
]

type View = 'complaints' | 'dak' | 'profile'

/* ─────────────────────────────────────────────────────────
   Status update form — inline inside each card
   ───────────────────────────────────────────────────────── */
function StatusForm({
  complaint,
  onUpdate,
}: {
  complaint: Complaint
  onUpdate: (id: string, status: ComplaintStatus, notes: string) => Promise<void>
}) {
  const [open, setOpen]       = useState(false)
  const [status, setStatus]   = useState(complaint.status)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)

  async function submit() {
    setSaving(true)
    await onUpdate(complaint.id, status, notes)
    setSaving(false)
    setOpen(false)
    setNotes('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-saffron-dark dark:text-gold/70 hover:text-saffron dark:hover:text-gold font-semibold transition-colors"
      >
        Update Status →
      </button>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 animate-scale-in">
      <select
        value={status}
        onChange={e => setStatus(e.target.value as ComplaintStatus)}
        className="w-full text-xs rounded-lg px-3 py-2 bg-white dark:bg-navy-950 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream focus:outline-none focus:border-saffron dark:focus:border-gold/50"
      >
        {(['pending','assigned','in_progress','resolved','closed'] as ComplaintStatus[]).map(s => (
          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
        ))}
      </select>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add a note (optional)…"
        rows={2}
        className="w-full text-xs rounded-lg px-3 py-2 bg-white dark:bg-navy-950 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/25 resize-none focus:outline-none focus:border-saffron dark:focus:border-gold/50"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-saffron to-saffron-dark text-white disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving…' : 'Save Update'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-lg text-slate-600 dark:text-cream/50 hover:text-navy-900 dark:hover:text-cream transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Single complaint card
   ───────────────────────────────────────────────────────── */
function ComplaintRow({
  complaint,
  currentOfficerId,
  assignedOfficer,
  onUpdate,
}: {
  complaint: Complaint
  currentOfficerId: string
  /** The officer the complaint is directly assigned to (may be a subordinate of the viewer). */
  assignedOfficer: Officer | undefined
  onUpdate: (id: string, status: ComplaintStatus, notes: string) => Promise<void>
}) {
  const cat        = ISSUE_CATEGORIES[complaint.category]
  const status     = STATUS_CONFIG[complaint.status]
  const viaSubordinate = !!assignedOfficer && assignedOfficer.id !== currentOfficerId

  return (
    <div className={clsx(
      'bg-white dark:bg-navy-800/60 border border-slate-200 dark:border-gold/10 rounded-2xl p-5 hover:border-saffron/40 dark:hover:border-gold/25 shadow-sm dark:shadow-none hover:shadow-md transition-all animate-slide-up',
      viaSubordinate && 'ring-1 ring-blue-400/40'
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{cat.icon}</div>
          <div>
            <div className="font-semibold text-navy-900 dark:text-cream text-sm">{cat.label}</div>
            <div className="font-mono text-saffron-dark dark:text-gold/60 text-xs">{complaint.complaint_number}</div>
          </div>
        </div>
        <span className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 shrink-0', status.color)}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', status.dot,
            complaint.status === 'pending' ? 'animate-pulse-dot' : ''
          )} />
          {status.label}
        </span>
      </div>

      {viaSubordinate && assignedOfficer && (
        <div className="mb-3 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40 rounded-lg text-[11px] text-blue-700 dark:text-blue-200 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Assigned via <span className="font-semibold text-blue-900 dark:text-blue-100">{assignedOfficer.name}</span>
          <span className="text-blue-500/70 dark:text-blue-300/60">· {assignedOfficer.designation}</span>
        </div>
      )}

      <p className="text-slate-600 dark:text-cream/50 text-sm mb-4 leading-relaxed line-clamp-2">{complaint.description}</p>

      <div className="space-y-1.5 text-xs text-slate-500 dark:text-cream/35 mb-4">
        {complaint.address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {complaint.address}{complaint.ward_number ? `, ${complaint.ward_number}` : ''}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 shrink-0" />
          {format(new Date(complaint.created_at), 'dd MMM yyyy, hh:mm a')}
        </div>
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 shrink-0" />
          {complaint.reported_by_name}
          {complaint.reported_by_phone && (
            <span className="flex items-center gap-1 ml-1">
              <Phone className="w-3 h-3" /> {complaint.reported_by_phone}
            </span>
          )}
        </div>
      </div>

      {complaint.officer_notes && (
        <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
          <span className="font-semibold">Note:</span> {complaint.officer_notes}
        </div>
      )}

      <StatusForm complaint={complaint} onUpdate={onUpdate} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PROFILE EDIT VIEW
   ───────────────────────────────────────────────────────── */
function ProfileView({
  officer,
  onSaved,
}: {
  officer: Officer
  onSaved: (updated: Officer) => void
}) {
  const [form, setForm] = useState({
    name:        officer.name,
    designation: officer.designation,
    phone:       officer.phone ?? '',
    email:       officer.email ?? '',
    username:    officer.username ?? '',
    department:  officer.department ?? '',
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const dirty =
    form.name        !== officer.name        ||
    form.designation !== officer.designation ||
    form.phone       !== (officer.phone ?? '') ||
    form.email       !== (officer.email ?? '') ||
    form.username    !== (officer.username ?? '') ||
    form.department  !== (officer.department ?? '')

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.designation.trim()) return
    setSaving(true); setError(''); setSuccess(false)

    const updates = {
      name:        form.name.trim(),
      designation: form.designation.trim(),
      phone:       form.phone.trim() || null,
      email:       form.email.trim().toLowerCase() || null,
      username:    form.username.trim() || null,
      department:  officer.rank === 1 ? null : (form.department || null),
    }

    const { data, error: dbError } = await supabase
      .from('officers')
      .update(updates)
      .eq('id', officer.id)
      .select()
      .single()

    if (dbError) {
      console.error('[ProfileView] update failed:', dbError)
      const msg = dbError.code === '23505' && /username/i.test(dbError.message)
        ? 'That username is already taken. Pick another.'
        : /column.*username/i.test(dbError.message)
          ? 'Run migration 008_officer_username.sql in Supabase SQL Editor.'
          : `${dbError.message} (code: ${dbError.code})`
      setError(msg)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    if (data) onSaved(data as Officer)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-navy-900 dark:text-cream mb-1">Edit Profile</h1>
        <p className="text-slate-600 dark:text-cream/40 text-sm">
          Keep your contact details up to date so complaints can reach you quickly.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Read-only auth identity */}
        <div className="bg-white dark:bg-navy-800/60 border border-slate-200 dark:border-gold/15 rounded-2xl p-5 shadow-sm dark:shadow-none">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-cream/40 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3 text-saffron-dark dark:text-gold" /> Identity (Read-Only)
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500 dark:text-cream/40 text-xs mb-0.5">Rank</div>
              <div className="text-navy-900 dark:text-cream font-semibold">{RANK_LABEL[officer.rank]}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-cream/40 text-xs mb-0.5">Status</div>
              <div className="flex items-center gap-1.5">
                <span className={clsx('w-1.5 h-1.5 rounded-full', officer.is_active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400 dark:bg-gray-500')} />
                <span className="text-navy-900 dark:text-cream font-semibold">{officer.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-white dark:bg-navy-800/60 border border-slate-200 dark:border-gold/15 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-cream/40 uppercase tracking-widest mb-1 flex items-center gap-2">
            <UserCog className="w-3 h-3 text-saffron-dark dark:text-gold" /> Personal Details
          </div>

          <ProfileField label="Full Name" icon={User} required>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className="profile-input"
            />
          </ProfileField>

          <ProfileField label="Designation" icon={Briefcase} required>
            <input
              type="text"
              value={form.designation}
              onChange={e => set('designation', e.target.value)}
              required
              className="profile-input"
            />
          </ProfileField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="Phone" icon={Phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="10-digit mobile"
                className="profile-input"
              />
            </ProfileField>

            <ProfileField label="Email" icon={Mail}>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="officer@gov.in"
                className="profile-input"
              />
            </ProfileField>
          </div>

          <ProfileField label="Username" icon={AtSign}>
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())}
              placeholder="for login — e.g. tirthankar.c"
              className="profile-input"
            />
            <p className="text-[10px] text-slate-500 dark:text-cream/30 mt-1">
              Optional. If set, you can log in with this username + password (lowercase only, no spaces).
            </p>
          </ProfileField>

          {officer.rank !== 1 && (
            <ProfileField label="Department" icon={Briefcase}>
              <select
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className="profile-input"
              >
                <option value="">— Select department —</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </ProfileField>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 animate-scale-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-3 animate-scale-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Profile updated successfully.
          </div>
        )}

        {/* Save bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 dark:text-cream/30">
            {dirty ? 'You have unsaved changes.' : 'No changes to save.'}
          </p>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-saffron/25 transition-all btn-press"
          >
            {saving
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>

      <style>{`
        .profile-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          border-radius: 10px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0d1b2a;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .profile-input:focus {
          outline: none;
          border-color: #e07818;
          box-shadow: 0 0 0 3px rgba(224, 120, 24, 0.15);
        }
        .profile-input::placeholder { color: #94a3b8; }
        html.dark .profile-input {
          background: rgba(5, 13, 25, 0.6);
          border-color: rgba(201, 150, 46, 0.2);
          color: #f5edd8;
        }
        html.dark .profile-input:focus {
          border-color: rgba(201, 150, 46, 0.6);
          box-shadow: 0 0 0 3px rgba(201, 150, 46, 0.15);
        }
        html.dark .profile-input::placeholder { color: rgba(245, 237, 216, 0.25); }
      `}</style>

      {/* Password change — separate card below the main profile form */}
      <PasswordChangeBlock />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PASSWORD CHANGE BLOCK
   ───────────────────────────────────────────────────────── */
function PasswordChangeBlock() {
  const [newPass, setNewPass]       = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')
  const [ok, setOk]                 = useState(false)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setOk(false)
    if (newPass.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (newPass !== confirm) { setErr('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) { setErr(error.message); setSaving(false); return }
    setOk(true); setNewPass(''); setConfirm(''); setSaving(false)
    setTimeout(() => setOk(false), 4000)
  }

  return (
    <form
      onSubmit={changePassword}
      className="mt-6 bg-white dark:bg-navy-800/60 border border-slate-200 dark:border-gold/15 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-saffron/10 dark:bg-gold/10 rounded-lg flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-saffron-dark dark:text-gold" />
        </div>
        <div>
          <div className="font-bold text-navy-900 dark:text-cream text-sm">Change Password</div>
          <div className="text-[11px] text-slate-500 dark:text-cream/40">
            Update your sign-in password. Min 8 characters.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-1.5 block">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="At least 8 characters"
              className="profile-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-cream"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-1.5 block">Confirm Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter"
            className="profile-input"
          />
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{err}</span>
        </div>
      )}
      {ok && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> Password updated successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !newPass || !confirm}
          className="inline-flex items-center gap-2 px-5 py-2 bg-navy-900 dark:bg-gold text-white dark:text-navy-900 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-all btn-press"
        >
          {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><KeyRound className="w-4 h-4" /> Update Password</>}
        </button>
      </div>
    </form>
  )
}

function ProfileField({
  label, icon: Icon, required, children,
}: { label: string; icon: React.ElementType; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-saffron-dark dark:text-gold/60" />
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   OFFICER PORTAL
   ════════════════════════════════════════════════════════ */
export default function OfficerPortal() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [officer, setOfficer]           = useState<Officer | null>(null)
  const [allOfficers, setAllOfficers]   = useState<Officer[]>([])
  const [complaints, setComplaints]     = useState<Complaint[]>([])
  const [daks, setDaks]                 = useState<Dak[]>([])
  const [openDak, setOpenDak]           = useState<Dak | null>(null)
  const [loading, setLoading]           = useState(true)
  const [view, setView]                 = useState<View>('complaints')
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { navigate('/officer-login', { replace: true }); return }

      /* Find officer by auth_uid (set on first login) */
      let { data: officerData } = await supabase
        .from('officers')
        .select('*')
        .eq('auth_uid', data.user.id)
        .eq('is_active', true)
        .maybeSingle()

      /* First-time login: auth_uid not yet written — match by email */
      if (!officerData && data.user.email) {
        const { data: byEmail } = await supabase
          .from('officers')
          .select('*')
          .eq('email', data.user.email.toLowerCase())
          .eq('is_active', true)
          .maybeSingle()

        if (byEmail) {
          await supabase
            .from('officers')
            .update({ auth_uid: data.user.id })
            .eq('id', byEmail.id)
          officerData = { ...byEmail, auth_uid: data.user.id }
        }
      }

      if (!officerData) {
        await supabase.auth.signOut()
        navigate('/officer-login', { replace: true })
        return
      }

      setOfficer(officerData as Officer)

      // Fetch the full officers directory so we can resolve the descendant chain
      // (used both for visibility and for showing "assigned via SDDMO" labels).
      const { data: everyone } = await supabase.from('officers').select('*')
      const officersList = (everyone as Officer[] | null) ?? []
      setAllOfficers(officersList)

      await Promise.all([
        fetchComplaints(officerData.id, officersList),
        fetchDaks(officerData.id, officersList),
      ])
      setLoading(false)
    })
  }, [navigate])

  async function fetchComplaints(officerId: string, officersList?: Officer[]) {
    const officers = officersList ?? allOfficers
    const visibleIds = selfAndDescendantIds(officerId, officers)
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .in('officer_id', visibleIds)
      .order('created_at', { ascending: false })
    if (data) setComplaints(data)
  }

  async function fetchDaks(officerId: string, officersList?: Officer[]) {
    const officers = officersList ?? allOfficers
    const visibleIds = selfAndDescendantIds(officerId, officers)
    const { data } = await supabase
      .from('dak')
      .select('*')
      .in('current_officer_id', visibleIds)
      .order('created_at', { ascending: false })
    if (data) setDaks(data as Dak[])
  }

  async function handleStatusUpdate(id: string, status: ComplaintStatus, notes: string) {
    const complaint = complaints.find(c => c.id === id)
    if (!complaint) return

    await supabase.from('complaint_updates').insert({
      complaint_id: id,
      status_from:  complaint.status,
      status_to:    status,
      notes,
    })

    const updates: Partial<Complaint> = { status, officer_notes: notes || complaint.officer_notes }
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString()
    }

    await supabase.from('complaints').update(updates).eq('id', id)
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/officer-login')
  }

  const filtered = statusFilter
    ? complaints.filter(c => c.status === statusFilter)
    : complaints

  const pending    = complaints.filter(c => c.status === 'pending').length
  const resolved   = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-navy-950 flex items-center justify-center text-slate-500 dark:text-cream/40">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading your portal…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col">
      {/* Tricolor stripe */}
      <div className="flex h-[4px] shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white dark:bg-cream" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="w-72 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-gold/10 flex flex-col shrink-0 shadow-sm dark:shadow-none">
          {/* Brand + theme toggle */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-gold/10">
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="flex items-center gap-2 text-slate-500 dark:text-cream/30 hover:text-navy-900 dark:hover:text-cream text-xs transition-colors">
                <ChevronRight className="w-3 h-3 rotate-180" /> Howrah Sadar
              </Link>
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                           bg-saffron/10 dark:bg-white/10 border border-saffron/30 dark:border-gold/30
                           text-saffron-dark dark:text-gold
                           hover:bg-saffron/20 dark:hover:bg-white/15 transition-all"
              >
                {theme === 'dark'
                  ? <><Sun  className="w-3 h-3" /> Light</>
                  : <><Moon className="w-3 h-3" /> Dark</>}
              </button>
            </div>
            <div className="font-serif font-bold text-navy-900 dark:text-cream text-base">Officer Portal</div>
            <div className="text-saffron-dark dark:text-gold/50 text-[10px] tracking-widest uppercase mt-0.5 font-semibold">Field Operations</div>
          </div>

          {/* Officer profile card */}
          {officer && (
            <div className="px-6 py-6 border-b border-slate-200 dark:border-gold/10">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron/20 to-gold/20 dark:from-gold/20 dark:to-saffron/20 border border-saffron/30 dark:border-gold/25 flex items-center justify-center mb-4 shadow-sm">
                <span className="font-serif font-bold text-saffron-dark dark:text-gold text-2xl">
                  {officer.name.charAt(0)}
                </span>
              </div>
              <div className="font-bold text-navy-900 dark:text-cream text-base leading-snug">{officer.name}</div>
              <div className="text-slate-600 dark:text-cream/50 text-xs mt-0.5">{officer.designation}</div>
              {officer.department && (
                <div className="mt-2 text-[11px] text-saffron-dark dark:text-gold/60 bg-saffron/10 dark:bg-gold/8 border border-saffron/25 dark:border-gold/15 rounded-lg px-2.5 py-1.5 leading-snug font-semibold">
                  {officer.department}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-saffron dark:text-gold/40" />
                <span className="text-[11px] text-slate-600 dark:text-cream/30">{RANK_LABEL[officer.rank]}</span>
              </div>
              {officer.phone && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400 dark:text-cream/25" />
                  <span className="text-[11px] text-slate-600 dark:text-cream/30">{officer.phone}</span>
                </div>
              )}
              {officer.portfolio && (
                <div className="mt-3 text-[10px] text-saffron-dark dark:text-gold/70 bg-saffron/10 dark:bg-gold/8 border border-saffron/30 dark:border-gold/20 rounded-md px-2 py-1 uppercase tracking-wider font-bold">
                  Portfolio · {officer.portfolio}
                </div>
              )}
              {(() => {
                const reports = allOfficers.filter(o => o.parent_officer_id === officer.id && o.is_active)
                if (reports.length === 0) return null
                return (
                  <div className="mt-3 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-md px-2 py-1.5">
                    <div className="font-semibold uppercase tracking-wider mb-0.5">Direct reports · {reports.length}</div>
                    <div className="text-blue-600/80 dark:text-blue-300/70 leading-tight">
                      Their complaints appear here too.
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* View switcher */}
          <div className="px-3 py-4 border-b border-slate-200 dark:border-gold/10 space-y-1">
            <NavButton
              icon={ListChecks}
              label="My Complaints"
              sub={`${complaints.length} assigned`}
              active={view === 'complaints'}
              onClick={() => setView('complaints')}
            />
            <NavButton
              icon={Inbox}
              label="My Dak"
              sub={`${daks.length} files${daks.filter(isOverdue).length > 0 ? ` · ${daks.filter(isOverdue).length} overdue` : ''}`}
              active={view === 'dak'}
              onClick={() => setView('dak')}
            />
            <NavButton
              icon={UserCog}
              label="Edit Profile"
              sub="Update contact details"
              active={view === 'profile'}
              onClick={() => setView('profile')}
            />
          </div>

          {/* Stats — only on complaints view */}
          {view === 'complaints' && (
            <div className="px-6 py-5 border-b border-slate-200 dark:border-gold/10 space-y-3">
              {[
                { label: 'Assigned', value: complaints.length, icon: Zap,         color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Pending',  value: pending,           icon: Clock,       color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Resolved', value: resolved,          icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-cream/40 text-xs">
                    <Icon className={clsx('w-3.5 h-3.5', color)} />
                    {label}
                  </div>
                  <span className={clsx('font-bold text-sm', color)}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filters — only on complaints view */}
          {view === 'complaints' && (
            <div className="px-6 py-5 flex-1">
              <div className="text-[10px] font-semibold text-slate-500 dark:text-cream/30 uppercase tracking-wider mb-3">Filter by Status</div>
              <div className="space-y-1">
                {([
                  { value: '',            label: 'All Complaints' },
                  { value: 'pending',     label: 'Pending' },
                  { value: 'assigned',    label: 'Assigned' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved',    label: 'Resolved' },
                  { value: 'closed',      label: 'Closed' },
                ] as { value: ComplaintStatus | ''; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                      statusFilter === value
                        ? 'bg-saffron/15 dark:bg-gold/15 text-saffron-dark dark:text-gold border border-saffron/40 dark:border-gold/25'
                        : 'text-slate-600 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream hover:bg-slate-100 dark:hover:bg-white/5'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'profile' && <div className="flex-1" />}

          {/* Logout */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gold/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-600 dark:text-cream/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/15 transition-all text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* Top bar — complaints view only */}
          {view === 'complaints' && (
            <div className="sticky top-0 bg-white/90 dark:bg-navy-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-gold/10 px-8 py-4 flex items-center justify-between z-10">
              <div>
                <h1 className="font-serif text-xl font-bold text-navy-900 dark:text-cream">My Assigned Complaints</h1>
                <p className="text-slate-500 dark:text-cream/30 text-xs mt-0.5">
                  {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
                  {statusFilter ? ` · ${STATUS_CONFIG[statusFilter].label}` : ''}
                </p>
              </div>
              <button
                onClick={() => officer && fetchComplaints(officer.id, allOfficers)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-cream/40 hover:text-saffron-dark dark:hover:text-cream border border-slate-300 dark:border-gold/15 hover:border-saffron dark:hover:border-gold/35 rounded-lg transition-all"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          )}

          <div className="p-8">
            {view === 'complaints' && (
              filtered.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 bg-saffron/10 dark:bg-gold/8 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-saffron/50 dark:text-gold/30" />
                  </div>
                  <div className="font-serif text-xl text-slate-500 dark:text-cream/40">No complaints here</div>
                  <p className="text-slate-400 dark:text-cream/20 text-sm mt-2">
                    {statusFilter
                      ? 'No complaints match this filter.'
                      : 'No complaints have been assigned to you yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(c => (
                    <ComplaintRow
                      key={c.id}
                      complaint={c}
                      currentOfficerId={officer!.id}
                      assignedOfficer={allOfficers.find(o => o.id === c.officer_id)}
                      onUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              )
            )}

            {view === 'dak' && officer && (
              <DakOfficerView
                daks={daks}
                officers={allOfficers}
                currentOfficerId={officer.id}
                onOpen={(d: Dak) => setOpenDak(d)}
              />
            )}

            {view === 'profile' && officer && (
              <ProfileView
                officer={officer}
                onSaved={updated => setOfficer(updated)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dak detail modal — officer can act on it */}
      {openDak && officer && (
        <DakDetailModal
          dak={openDak}
          officers={allOfficers}
          canAct={true}
          onClose={() => setOpenDak(null)}
          onUpdated={(updated) => {
            setDaks(prev => prev.map(d => d.id === updated.id ? updated : d))
            setOpenDak(updated)
            // If the dak was forwarded away from us, re-fetch to drop it from list
            const visibleIds = selfAndDescendantIds(officer.id, allOfficers)
            if (updated.current_officer_id && !visibleIds.includes(updated.current_officer_id)) {
              fetchDaks(officer.id, allOfficers)
              setOpenDak(null)
            }
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   DAK LIST VIEW for officer portal
   ───────────────────────────────────────────────────────── */
function DakOfficerView({
  daks, officers, currentOfficerId, onOpen,
}: {
  daks: Dak[]
  officers: Officer[]
  currentOfficerId: string
  onOpen: (d: Dak) => void
}) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'subordinate' | 'overdue'>('all')
  const officerById = new Map(officers.map(o => [o.id, o]))

  const filtered = daks.filter(d => {
    if (filter === 'mine') return d.current_officer_id === currentOfficerId
    if (filter === 'subordinate') return d.current_officer_id !== currentOfficerId
    if (filter === 'overdue') return isOverdue(d)
    return true
  })

  const mineCt   = daks.filter(d => d.current_officer_id === currentOfficerId).length
  const subCt    = daks.filter(d => d.current_officer_id !== currentOfficerId).length
  const overCt   = daks.filter(isOverdue).length

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy-900 dark:text-cream mb-1">My Dak Files</h1>
        <p className="text-slate-600 dark:text-cream/40 text-sm">
          Incoming correspondence assigned to you or your subordinates.
          Click any file to view history and take action.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip label="All" count={daks.length} active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label="Mine"        count={mineCt}  active={filter === 'mine'}        onClick={() => setFilter('mine')} />
        {subCt > 0 && (
          <FilterChip label="Subordinates'" count={subCt} active={filter === 'subordinate'} onClick={() => setFilter('subordinate')} />
        )}
        {overCt > 0 && (
          <FilterChip label="Overdue" count={overCt} active={filter === 'overdue'} onClick={() => setFilter('overdue')} tone="red" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-white/50 dark:bg-navy-900/40 border border-slate-200 dark:border-gold/15 rounded-2xl">
          <Inbox className="w-12 h-12 text-slate-300 dark:text-cream/20 mx-auto mb-3" />
          <div className="font-serif text-lg text-slate-500 dark:text-cream/40">No Dak files here</div>
          <p className="text-slate-400 dark:text-cream/30 text-sm mt-1">
            Files routed to you by the SDO office will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <DakOfficerRow
              key={d.id}
              dak={d}
              isMine={d.current_officer_id === currentOfficerId}
              handledBy={d.current_officer_id ? officerById.get(d.current_officer_id) : null}
              onClick={() => onOpen(d)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DakOfficerRow({
  dak, isMine, handledBy, onClick,
}: { dak: Dak; isMine: boolean; handledBy?: Officer | null; onClick: () => void }) {
  const overdue = isOverdue(dak)
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left bg-white dark:bg-navy-800/60 border rounded-xl p-4 hover:shadow-md hover:border-saffron dark:hover:border-gold transition-all group',
        overdue
          ? 'border-red-300 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/15'
          : 'border-slate-200 dark:border-gold/15'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-saffron-dark dark:text-gold">{dak.dak_number}</span>
            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', DAK_STATUS_CONFIG[dak.status].color)}>
              {DAK_STATUS_CONFIG[dak.status].label}
            </span>
            {dak.priority !== 'normal' && (
              <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', DAK_PRIORITY_CONFIG[dak.priority].color)}>
                {DAK_PRIORITY_CONFIG[dak.priority].label}
              </span>
            )}
            {overdue && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Overdue
              </span>
            )}
            {!isMine && handledBy && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                With {handledBy.name}
              </span>
            )}
          </div>
          <div className="font-semibold text-navy-900 dark:text-cream text-sm leading-snug group-hover:text-saffron-dark dark:group-hover:text-gold transition-colors">
            {dak.subject}
          </div>
          <div className="text-xs text-slate-500 dark:text-cream/45 mt-1">
            From: <span className="font-semibold">{dak.sender_name}</span>
            {dak.sender_organization && <> · {dak.sender_organization}</>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-saffron-dark dark:group-hover:text-gold transition-colors shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-cream/40 pt-2 border-t border-slate-100 dark:border-white/5">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(dak.received_date), 'dd MMM yyyy')}</span>
        {dak.due_date && (
          <span className={clsx('flex items-center gap-1', overdue && 'text-red-600 dark:text-red-300 font-semibold')}>
            <Clock className="w-3 h-3" /> Due {format(new Date(dak.due_date), 'dd MMM')}
          </span>
        )}
      </div>
    </button>
  )
}

function FilterChip({ label, count, active, onClick, tone }: {
  label: string; count: number; active: boolean; onClick: () => void; tone?: 'red'
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
        active
          ? tone === 'red'
            ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
            : 'bg-saffron text-white shadow-md shadow-saffron/30'
          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-cream/70 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
      )}
    >
      {label}
      <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/25' : 'bg-slate-100 dark:bg-white/10')}>{count}</span>
    </button>
  )
}

function NavButton({
  icon: Icon, label, sub, active, onClick,
}: {
  icon: React.ElementType
  label: string
  sub: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
        active
          ? 'bg-saffron/15 dark:bg-gold/15 text-saffron-dark dark:text-gold border border-saffron/40 dark:border-gold/25 shadow-sm'
          : 'text-slate-600 dark:text-cream/50 hover:text-navy-900 dark:hover:text-cream hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight">{label}</div>
        <div className={clsx('text-[10px] mt-0.5 truncate', active ? 'text-saffron/70 dark:text-gold/60' : 'text-slate-400 dark:text-cream/30')}>{sub}</div>
      </div>
    </button>
  )
}
