import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { CATEGORY_META, Scheme, SchemeCategory } from '../lib/schemes'

interface Props {
  existing?: Scheme | null
  onClose: () => void
  onSaved: () => void
}

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as SchemeCategory[]

const ACCENTS = ['amber', 'orange', 'green', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'rose', 'pink', 'fuchsia', 'lime', 'red', 'slate']

const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)

function parseWebsites(s: string): { label: string; url: string }[] {
  return lines(s).map(line => {
    const [a, b] = line.split('|').map(x => x.trim())
    return b ? { label: a, url: b } : { label: 'Official Site', url: a }
  }).filter(w => w.url)
}

export default function AddSchemeModal({ existing, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    short: existing?.short ?? '',
    category: existing?.category ?? 'state' as SchemeCategory,
    icon: existing?.icon ?? '📋',
    accent: existing?.accent ?? 'amber',
    objective: existing?.objective ?? '',
    benefits: (existing?.benefits ?? []).join('\n'),
    eligibility: (existing?.eligibility ?? []).join('\n'),
    documents: (existing?.documents ?? []).join('\n'),
    whereToApply: (existing?.whereToApply ?? []).join('\n'),
    websites: (existing?.websites ?? []).map(w => `${w.label} | ${w.url}`).join('\n'),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.objective.trim()) return
    setSaving(true)
    setError(null)

    const row = {
      name: form.name.trim(),
      short: form.short.trim() || null,
      category: form.category,
      icon: form.icon.trim() || '📋',
      accent: form.accent,
      objective: form.objective.trim(),
      benefits: lines(form.benefits),
      eligibility: lines(form.eligibility),
      documents: lines(form.documents),
      where_to_apply: lines(form.whereToApply),
      websites: parseWebsites(form.websites),
    }

    const { error: dbErr } = existing
      ? await supabase.from('schemes').update(row).eq('id', existing.id)
      : await supabase.from('schemes').insert(row)

    setSaving(false)
    if (dbErr) {
      setError(
        dbErr.code === '42P01' || /relation "schemes" does not exist/.test(dbErr.message)
          ? 'The schemes table does not exist yet. Run migration 010_schemes.sql in the Supabase SQL editor first.'
          : dbErr.code === '42501' || /row-level security/i.test(dbErr.message)
            ? 'Permission denied by RLS. Make sure you are logged in and migration 010 has been applied.'
            : `${dbErr.message} (code: ${dbErr.code ?? '—'})`
      )
      return
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-gold/15 animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex h-[3px] shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white dark:bg-cream/20" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/15 shrink-0">
          <div>
            <h2 className="font-serif font-bold text-navy-900 dark:text-cream text-lg leading-tight">
              {existing ? 'Edit Scheme' : 'Add New Scheme'}
            </h2>
            <p className="text-xs text-navy-700/60 dark:text-cream/45 mt-0.5">
              Appears on the public Govt Services page
            </p>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 rounded-lg hover:bg-navy-900/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors btn-press disabled:opacity-50">
            <X className="w-4 h-4 text-navy-700 dark:text-cream/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Name + short + icon */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <Field label="Scheme Name" required>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lakshmir Bhandar" required autoFocus />
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Short / Acronym">
                <input className="form-input" value={form.short} onChange={e => set('short', e.target.value)} placeholder="e.g. LB" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Icon">
                <input className="form-input text-center text-lg" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="📋" />
              </Field>
            </div>
          </div>

          {/* Category chips */}
          <Field label="Category" required>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('category', key)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    form.category === key
                      ? 'border-gold bg-gold/10 text-navy-900 dark:text-cream shadow-sm'
                      : 'border-navy-900/10 dark:border-white/10 text-navy-700/70 dark:text-cream/50 hover:border-gold/40'
                  }`}
                >
                  <div className="text-base leading-none mb-1">{CATEGORY_META[key].icon}</div>
                  <div className="font-semibold text-[11px] leading-tight">{CATEGORY_META[key].label}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Accent colour */}
          <Field label="Accent Colour" hint="card highlight">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('accent', c)}
                  title={c}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.accent === c ? 'scale-110 border-navy-900 dark:border-cream' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: ACCENT_HEX[c] }}
                />
              ))}
            </div>
          </Field>

          <Field label="Objective" required>
            <textarea rows={2} className="form-input" value={form.objective} onChange={e => set('objective', e.target.value)} placeholder="One-line summary of what the scheme does" required />
          </Field>

          <Field label="Key Benefits" hint="one per line">
            <textarea rows={3} className="form-input" value={form.benefits} onChange={e => set('benefits', e.target.value)} placeholder={'₹1,000 per month\nDirect bank transfer'} />
          </Field>

          <Field label="Eligibility" hint="one per line">
            <textarea rows={3} className="form-input" value={form.eligibility} onChange={e => set('eligibility', e.target.value)} placeholder={'Resident of West Bengal\nAge 25 – 60'} />
          </Field>

          <Field label="Documents Required" hint="one per line">
            <textarea rows={3} className="form-input" value={form.documents} onChange={e => set('documents', e.target.value)} placeholder={'Aadhaar card\nBank passbook'} />
          </Field>

          <Field label="Where to Apply" hint="one per line">
            <textarea rows={2} className="form-input" value={form.whereToApply} onChange={e => set('whereToApply', e.target.value)} placeholder={'Duare Sarkar camps\nSDO Office, Howrah Sadar'} />
          </Field>

          <Field label="Official Websites" hint="format: Label | https://url  (one per line)">
            <textarea rows={2} className="form-input" value={form.websites} onChange={e => set('websites', e.target.value)} placeholder={'Social Security Portal | https://socialsecurity.wb.gov.in'} />
          </Field>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-navy-900/15 dark:border-white/15 rounded-xl text-sm font-semibold text-navy-700 dark:text-cream/70 hover:bg-navy-900/5 dark:hover:bg-white/5 transition-colors btn-press disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold hover:from-saffron-dark hover:to-saffron transition-all shadow-lg shadow-saffron/25 disabled:opacity-50 btn-press flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : existing ? 'Save Changes' : 'Add Scheme'}
            </button>
          </div>
        </form>
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

const ACCENT_HEX: Record<string, string> = {
  amber: '#f59e0b', orange: '#f97316', green: '#22c55e', emerald: '#10b981',
  teal: '#14b8a6', cyan: '#06b6d4', blue: '#3b82f6', indigo: '#6366f1',
  violet: '#8b5cf6', rose: '#f43f5e', pink: '#ec4899', fuchsia: '#d946ef',
  lime: '#84cc16', red: '#ef4444', slate: '#64748b',
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
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
