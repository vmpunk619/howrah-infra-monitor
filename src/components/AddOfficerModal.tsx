import { useMemo, useState } from 'react'
import { X, UserPlus, AlertCircle, CheckCircle, Loader2, ChevronDown, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Officer } from '../types'
import { ancestorChain } from '../lib/officerChain'

const DEFAULT_DEPARTMENTS = [
  'PWD Roads Division, Howrah',
  'PHE & Drainage Division',
  'Drainage & Flood Control Division',
  'WBSEDCL / Municipal Lighting Cell',
  'Solid Waste Management Cell',
  'Sub-Divisional Office, Howrah Sadar',
]

const RANK_OPTIONS = [
  { value: '1', label: 'SDO',          hint: 'Sub-Divisional Officer (apex)' },
  { value: '2', label: 'DMDC / Head',  hint: 'Dy Magistrate / Dept Head'     },
  { value: '3', label: 'OC / Field',   hint: 'Officer-in-Charge / Field'     },
]

interface Props {
  onClose: () => void
  onAdded: (officer: Officer) => void
  /** Existing officers — used to populate "Reports to" + custom departments */
  existingOfficers: Officer[]
}

export default function AddOfficerModal({ onClose, onAdded, existingOfficers }: Props) {
  const [form, setForm] = useState({
    name:        '',
    designation: '',
    rank:        '3',
    department:  DEFAULT_DEPARTMENTS[0],
    portfolio:   '',
    phone:       '',
    email:       '',
    parent_officer_id: '' as string | '',
  })
  const [customDept,    setCustomDept]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState<Officer | null>(null)

  // Union of default departments + any custom ones already in the DB
  const departmentOptions = useMemo(() => {
    const fromDb = existingOfficers.map(o => o.department).filter(Boolean) as string[]
    return [...new Set([...DEFAULT_DEPARTMENTS, ...fromDb])].sort()
  }, [existingOfficers])

  // Eligible parents — any active officer; sort by rank then name
  const parentOptions = useMemo(() => {
    return existingOfficers
      .filter(o => o.is_active)
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
  }, [existingOfficers])

  // Preview of the chain the new officer will sit in
  const chainPreview = form.parent_officer_id
    ? ancestorChain(form.parent_officer_id, existingOfficers).reverse()
    : []

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.designation.trim()) return
    setSaving(true)
    setError('')

    const payload = {
      name:              form.name.trim(),
      designation:       form.designation.trim(),
      rank:              parseInt(form.rank),
      department:        form.rank === '1' ? null : (form.department.trim() || null),
      portfolio:         form.portfolio.trim() || null,
      phone:             form.phone.trim() || null,
      email:             form.email.trim().toLowerCase() || null,
      parent_officer_id: form.parent_officer_id || null,
      is_active:         true,
    }

    const { data, error: dbError } = await supabase
      .from('officers')
      .insert(payload)
      .select()
      .single()

    if (dbError) {
      console.error('[AddOfficerModal] insert failed:', dbError)
      const msg = dbError.code === '42501' || /row-level security/i.test(dbError.message)
        ? 'Permission denied. Run migration 004_officers_rls_fix.sql in Supabase SQL Editor.'
        : /column.*parent_officer_id|column.*portfolio/i.test(dbError.message)
          ? 'Database missing the new columns. Run migration 005_officer_chain.sql in Supabase SQL Editor.'
          : `${dbError.message} (code: ${dbError.code})`
      setError(msg)
      setSaving(false)
      return
    }

    if (!data) {
      setError('Officer was not returned by the server. Check RLS policies on the officers table.')
      setSaving(false)
      return
    }

    setSuccess(data as Officer)
    setSaving(false)
    setTimeout(() => {
      onAdded(data as Officer)
      onClose()
    }, 700)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-gold/15 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">

        {/* Tricolor accent */}
        <div className="flex h-[3px] shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white dark:bg-cream/20" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-saffron/20 border border-gold/30 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-navy-900 dark:text-cream text-lg leading-tight">Add Officer to Chain</h2>
              <p className="text-xs text-navy-700/60 dark:text-cream/45 mt-0.5">
                Place them in the reporting hierarchy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg hover:bg-navy-900/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors btn-press disabled:opacity-50"
          >
            <X className="w-4 h-4 text-navy-700 dark:text-cream/60" />
          </button>
        </div>

        {/* Success state */}
        {success && (
          <div className="px-6 py-10 text-center animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-cream text-lg">Officer Added</h3>
            <p className="text-sm text-navy-700/60 dark:text-cream/50 mt-1">
              <span className="font-semibold text-gold">{success.name}</span> is now in the directory.
            </p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">

            {/* Name + Designation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Sri Joydeep"
                  required
                  autoFocus
                  className="form-input"
                />
              </Field>
              <Field label="Designation" required>
                <input
                  type="text"
                  value={form.designation}
                  onChange={e => set('designation', e.target.value)}
                  placeholder="e.g. DMDC / SDDMO / OC-in-Charge"
                  required
                  className="form-input"
                />
              </Field>
            </div>

            {/* Rank */}
            <div>
              <label className="block text-xs font-semibold text-navy-700 dark:text-cream/60 uppercase tracking-wider mb-2">
                Rank <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RANK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('rank', opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                      form.rank === opt.value
                        ? 'border-gold bg-gold/10 text-navy-900 dark:text-cream shadow-sm'
                        : 'border-navy-900/10 dark:border-white/10 text-navy-700/70 dark:text-cream/50 hover:border-gold/40'
                    }`}
                  >
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-60 leading-tight">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reports To — chain placement */}
            <Field label="Reports To" hint="who directly supervises this officer">
              <div className="relative">
                <select
                  value={form.parent_officer_id}
                  onChange={e => set('parent_officer_id', e.target.value)}
                  className="form-input appearance-none pr-9"
                >
                  <option value="">— Top of chain (no supervisor) —</option>
                  {parentOptions.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} · {o.designation}
                      {o.portfolio ? ` (${o.portfolio})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
              </div>
              {chainPreview.length > 0 && (
                <div className="mt-2 px-3 py-2 bg-gold/5 dark:bg-gold/10 border border-gold/20 rounded-lg text-xs">
                  <span className="text-navy-700/60 dark:text-cream/50 font-semibold">Chain:</span>{' '}
                  <span className="text-navy-900 dark:text-cream">
                    {chainPreview.map(o => o.name).join(' → ')}
                    {' → '}
                    <span className="font-bold text-gold">{form.name || '(new officer)'}</span>
                  </span>
                </div>
              )}
            </Field>

            {/* Portfolio (esp. for DMDCs) */}
            <Field
              label="Portfolio"
              hint="subject area, e.g. 'Disaster Management', 'Land Revenue'"
            >
              <input
                type="text"
                value={form.portfolio}
                onChange={e => set('portfolio', e.target.value)}
                placeholder="e.g. Disaster Management"
                className="form-input"
              />
            </Field>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="10-digit mobile"
                  className="form-input"
                />
              </Field>
              <Field label="Email" hint="for OTP login">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="officer@gov.in"
                  className="form-input"
                />
              </Field>
            </div>

            {/* Department (hidden for SDO) */}
            {form.rank !== '1' && (
              <Field label="Line Department" required>
                {customDept ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => set('department', e.target.value)}
                      placeholder="e.g. Land Records Division"
                      autoFocus
                      className="form-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => { setCustomDept(false); set('department', DEFAULT_DEPARTMENTS[0]) }}
                      className="px-3 py-2 text-xs font-semibold text-navy-600 dark:text-cream/60 hover:bg-navy-900/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={form.department}
                        onChange={e => set('department', e.target.value)}
                        className="form-input appearance-none pr-9 w-full"
                      >
                        {departmentOptions.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCustomDept(true); set('department', '') }}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-saffron-dark dark:text-gold hover:bg-saffron/10 dark:hover:bg-gold/10 rounded-lg border border-saffron/30 dark:border-gold/30 transition-colors whitespace-nowrap"
                      title="Create a new department"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>
                )}
              </Field>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40 animate-scale-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 border border-navy-900/15 dark:border-white/15 rounded-xl text-sm font-semibold text-navy-700 dark:text-cream/70 hover:bg-navy-900/5 dark:hover:bg-white/5 transition-colors btn-press disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold hover:from-saffron-dark hover:to-saffron transition-all shadow-lg shadow-saffron/25 disabled:opacity-50 btn-press flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add Officer'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(13, 27, 42, 0.12);
          background: rgba(255, 255, 255, 0.9);
          color: #0d1b2a;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .form-input:focus {
          outline: none;
          border-color: #c9962e;
          box-shadow: 0 0 0 3px rgba(201, 150, 46, 0.18);
        }
        html.dark .form-input {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(245, 237, 216, 0.15);
          color: #f5edd8;
        }
        html.dark .form-input::placeholder { color: rgba(245, 237, 216, 0.3); }
      `}</style>
    </div>
  )
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy-700 dark:text-cream/60 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="ml-2 text-[10px] text-gold/70 font-normal normal-case tracking-normal">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
