import { useEffect, useMemo, useState } from 'react'
import {
  X, Upload, AlertCircle, CheckCircle, Loader2, FileText, ChevronDown,
  Phone, Mail, MapPin, Tag, Users, FilePlus, Paperclip, Search, Hash,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Dak, DakMode, DakPriority, DakSenderType, DakCategory, Officer } from '../types'
import {
  DAK_MODE_CONFIG, DAK_SENDER_TYPE_CONFIG, DAK_CATEGORY_CONFIG, DAK_STATUS_CONFIG,
  defaultDueDate, generateDakNumber, uploadDakFile,
} from '../lib/dak'

interface Props {
  onClose: () => void
  onCreated: (dak: Dak) => void
  officers: Officer[]
}

type Mode = 'new' | 'attach'

export default function UploadDakModal({ onClose, onCreated, officers }: Props) {
  const [mode, setMode] = useState<Mode>('new')

  /* ── Attach-to-existing state ─────────────────────────── */
  const [searchQ, setSearchQ]           = useState('')
  const [searchResults, setSearchResults] = useState<Dak[]>([])
  const [selectedDak, setSelectedDak]   = useState<Dak | null>(null)
  const [attachDesc, setAttachDesc]     = useState('')

  /* ── Create-new-Dak state ─────────────────────────────── */
  const [form, setForm] = useState({
    // Classification
    category:    'other' as DakCategory,
    priority:    'normal' as DakPriority,

    // Reference
    memo_number: '',

    // Subject
    subject:     '',
    description: '',

    // Sender
    sender_type:        'citizen' as DakSenderType,
    sender_name:        '',
    sender_designation: '',
    sender_organization: '',
    sender_phone:       '',
    sender_email:       '',
    sender_address:     '',

    // Receipt
    received_mode: 'physical' as DakMode,
    received_date: new Date().toISOString().slice(0, 10),

    // Routing
    current_officer_id: '' as string | '',
    due_date: defaultDueDate('normal'),
  })
  const [file, setFile]       = useState<File | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState<Dak | null>(null)
  const [attachSuccess, setAttachSuccess] = useState<{ dak: Dak; attachment_file: string } | null>(null)

  /* Live search when user types in the attach mode search box */
  useEffect(() => {
    if (mode !== 'attach') return
    const q = searchQ.trim()
    if (q.length < 2) { setSearchResults([]); return }
    const ctl = new AbortController()
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('dak')
        .select('*')
        .or(`memo_number.ilike.%${q}%,dak_number.ilike.%${q}%,subject.ilike.%${q}%,sender_name.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(8)
        .abortSignal(ctl.signal)
      setSearchResults((data as Dak[]) ?? [])
    }, 250)
    return () => { clearTimeout(timer); ctl.abort() }
  }, [mode, searchQ])

  const officerOptions = useMemo(() =>
    officers.filter(o => o.is_active).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
  , [officers])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'priority') next.due_date = defaultDueDate(value as DakPriority)
      return next
    })
  }

  /* ── Attach a file to an existing Dak ─────────────── */
  async function handleAttach(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDak || !file) {
      setError('Pick an existing Dak and attach a file.')
      return
    }
    setSaving(true); setError('')

    try {
      const file_url = await uploadDakFile(file, selectedDak.dak_number + '_attach')
      if (!file_url) { setError('File upload failed.'); setSaving(false); return }

      const { data: userResult } = await supabase.auth.getUser()
      const uploaded_by = userResult.user?.id ?? null

      const { error: dbErr } = await supabase.from('dak_attachments').insert({
        dak_id:      selectedDak.id,
        file_url,
        file_name:   file.name,
        description: attachDesc.trim(),
        uploaded_by,
      })

      if (dbErr) {
        setError(/relation "dak_attachments" does not exist/i.test(dbErr.message)
          ? 'Run migration 009_dak_memo_attachments.sql in Supabase SQL Editor.'
          : dbErr.message)
        setSaving(false)
        return
      }

      // Also record a movement entry so the timeline shows the new attachment
      await supabase.from('dak_movements').insert({
        dak_id:               selectedDak.id,
        from_officer_id:      selectedDak.current_officer_id,
        to_officer_id:        selectedDak.current_officer_id,
        action_type:          'reply_received',
        remarks:              `Additional correspondence attached: ${file.name}${attachDesc.trim() ? ` — ${attachDesc.trim()}` : ''}`,
        performed_by_user_id: uploaded_by,
      })

      setAttachSuccess({ dak: selectedDak, attachment_file: file.name })
      setSaving(false)
      setTimeout(() => { onCreated(selectedDak); onClose() }, 1100)
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || !form.sender_name.trim()) return
    setSaving(true); setError('')

    try {
      const dakNumber = await generateDakNumber()

      // Upload file if provided
      let file_url: string | null = null
      if (file) {
        file_url = await uploadDakFile(file, dakNumber)
        if (!file_url) setError('File upload failed. Saving Dak without attachment.')
      }

      const status = form.current_officer_id ? 'assigned' : 'pending'

      const { data: userResult } = await supabase.auth.getUser()
      const created_by = userResult.user?.id ?? null

      const { data, error: dbError } = await supabase
        .from('dak')
        .insert({
          dak_number:          dakNumber,
          memo_number:         form.memo_number.trim() || null,
          subject:             form.subject.trim(),
          description:         form.description.trim(),
          category:            form.category,
          sender_type:         form.sender_type,
          sender_name:         form.sender_name.trim(),
          sender_designation:  form.sender_designation.trim() || null,
          sender_organization: form.sender_organization.trim() || null,
          sender_phone:        form.sender_phone.trim() || null,
          sender_email:        form.sender_email.trim().toLowerCase() || null,
          sender_address:      form.sender_address.trim() || null,
          received_mode:       form.received_mode,
          received_date:       form.received_date,
          priority:            form.priority,
          file_url,
          current_officer_id:  form.current_officer_id || null,
          status,
          due_date:            form.due_date || null,
          created_by,
        })
        .select()
        .single()

      if (dbError) {
        console.error('[UploadDakModal] insert failed:', dbError)
        const msg = /relation "dak" does not exist/i.test(dbError.message)
          ? 'Run migration 006_dak.sql in Supabase SQL Editor.'
          : /column.*(sender_type|category|sender_phone|sender_email|sender_address)/i.test(dbError.message)
            ? 'Run migration 007_dak_classification.sql in Supabase SQL Editor.'
            : /column.*memo_number/i.test(dbError.message)
              ? 'Run migration 009_dak_memo_attachments.sql in Supabase SQL Editor.'
              : `${dbError.message}`
        setError(msg)
        setSaving(false)
        return
      }

      // Record the initial movement
      await supabase.from('dak_movements').insert({
        dak_id: data.id,
        from_officer_id: null,
        to_officer_id: form.current_officer_id || null,
        action_type: form.current_officer_id ? 'assigned' : 'received',
        remarks: form.current_officer_id ? 'Received and assigned' : 'Received at SDO office',
        performed_by_user_id: created_by,
      })

      setSuccess(data as Dak)
      setSaving(false)
      setTimeout(() => { onCreated(data as Dak); onClose() }, 900)
    } catch (err) {
      console.error(err)
      setError((err as Error).message || 'Unexpected error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-gold/15 animate-scale-in overflow-hidden max-h-[92vh] flex flex-col">

        <div className="flex h-[3px] shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white dark:bg-cream/20" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-saffron/20 to-gold/20 border border-saffron/30 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-saffron-dark dark:text-gold" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-navy-900 dark:text-cream text-lg leading-tight">
                {mode === 'new' ? 'Receive New Dak' : 'Attach to Existing Dak'}
              </h2>
              <p className="text-xs text-navy-700/60 dark:text-cream/45 mt-0.5">
                {mode === 'new'
                  ? 'Log a new incoming letter / correspondence'
                  : 'Add a follow-up correspondence to an existing file'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 rounded-lg hover:bg-navy-900/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors btn-press disabled:opacity-50">
            <X className="w-4 h-4 text-navy-700 dark:text-cream/60" />
          </button>
        </div>

        {/* Mode toggle */}
        {!success && !attachSuccess && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1">
              <button
                type="button"
                onClick={() => { setMode('new'); setError('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'new'
                    ? 'bg-white dark:bg-navy-700 text-saffron-dark dark:text-gold shadow-sm'
                    : 'text-slate-500 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream'
                }`}
              >
                <FilePlus className="w-3.5 h-3.5" /> Create New File
              </button>
              <button
                type="button"
                onClick={() => { setMode('attach'); setError('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'attach'
                    ? 'bg-white dark:bg-navy-700 text-saffron-dark dark:text-gold shadow-sm'
                    : 'text-slate-500 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" /> Attach to Existing
              </button>
            </div>
          </div>
        )}

        {/* Attach success */}
        {attachSuccess && (
          <div className="px-6 py-10 text-center animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-cream text-lg">Attachment Added</h3>
            <p className="text-sm text-navy-700/60 dark:text-cream/50 mt-1">
              <span className="font-mono font-semibold text-saffron-dark dark:text-gold">{attachSuccess.dak.dak_number}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">{attachSuccess.attachment_file}</p>
          </div>
        )}

        {/* ────────── ATTACH-TO-EXISTING FORM ────────── */}
        {!success && !attachSuccess && mode === 'attach' && (
          <form onSubmit={handleAttach} className="px-6 py-5 space-y-4 overflow-y-auto">
            {!selectedDak ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 dark:text-cream/60 uppercase tracking-wider mb-1.5">
                    Find Existing Dak
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="Search by memo no., Dak no., subject, or sender"
                      autoFocus
                      className="dak-input pl-10"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-cream/40 mt-1.5">
                    Type at least 2 characters. Memo number is the most reliable.
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {searchQ.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-6">
                      No matching daks found.
                    </div>
                  )}
                  {searchResults.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDak(d)}
                      className="w-full text-left bg-slate-50 dark:bg-white/5 hover:bg-saffron/10 dark:hover:bg-gold/10 border border-slate-200 dark:border-white/10 hover:border-saffron dark:hover:border-gold rounded-xl p-3 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-saffron-dark dark:text-gold">{d.dak_number}</span>
                        {d.memo_number && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            <Hash className="w-2.5 h-2.5" /> {d.memo_number}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${DAK_STATUS_CONFIG[d.status].color}`}>
                          {DAK_STATUS_CONFIG[d.status].label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-navy-900 dark:text-cream truncate">{d.subject}</div>
                      <div className="text-xs text-slate-500 dark:text-cream/45 mt-0.5">
                        From: {d.sender_name}
                        {d.sender_organization && <> · {d.sender_organization}</>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Selected dak summary */}
                <div className="bg-saffron/5 dark:bg-gold/10 border-2 border-saffron dark:border-gold/40 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-saffron-dark dark:text-gold">{selectedDak.dak_number}</span>
                      {selectedDak.memo_number && (
                        <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                          Memo: {selectedDak.memo_number}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-navy-900 dark:text-cream">{selectedDak.subject}</div>
                    <div className="text-xs text-slate-500 dark:text-cream/45 mt-0.5">From: {selectedDak.sender_name}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedDak(null); setFile(null); setAttachDesc('') }} className="text-xs text-saffron-dark dark:text-gold hover:underline font-semibold shrink-0">
                    Change
                  </button>
                </div>

                {/* Attachment description */}
                <Field label="What is this correspondence?" hint="optional — shown in timeline">
                  <textarea
                    value={attachDesc}
                    onChange={e => setAttachDesc(e.target.value)}
                    placeholder="e.g. Reply from BL&LRO dated 25 May, additional documents from petitioner"
                    rows={2}
                    className="dak-input resize-none"
                  />
                </Field>

                {/* File upload */}
                <Field label="File to Attach" required hint="PDF or image">
                  <label className="block">
                    <div className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all
                      ${file
                        ? 'border-saffron bg-saffron/5 dark:bg-gold/10'
                        : 'border-slate-300 dark:border-white/15 hover:border-saffron dark:hover:border-gold hover:bg-saffron/5 dark:hover:bg-gold/5'
                      }`}>
                      {file ? (
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <FileText className="w-5 h-5 text-saffron-dark dark:text-gold" />
                          <span className="font-semibold text-navy-900 dark:text-cream">{file.name}</span>
                          <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-cream/50">
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          Click to upload scan / PDF
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                </Field>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40 animate-scale-in">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-navy-900/15 dark:border-white/15 rounded-xl text-sm font-semibold text-navy-700 dark:text-cream/70 hover:bg-navy-900/5 dark:hover:bg-white/5 transition-colors btn-press disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !file} className="flex-1 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold disabled:opacity-50 btn-press flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Attaching…</> : <><Paperclip className="w-4 h-4" /> Attach File</>}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Success state */}
        {success && (
          <div className="px-6 py-10 text-center animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-navy-900 dark:text-cream text-lg">Dak Logged</h3>
            <p className="text-sm text-navy-700/60 dark:text-cream/50 mt-1">
              <span className="font-mono font-semibold text-saffron-dark dark:text-gold">{success.dak_number}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">{success.subject}</p>
          </div>
        )}

        {/* Form — Create New */}
        {!success && !attachSuccess && mode === 'new' && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6 overflow-y-auto">

            {/* ════════ 1. Classification ════════ */}
            <Section icon={Tag} title="Classification & Reference">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Subject Category" required hint="nature of the correspondence">
                  <div className="relative">
                    <select value={form.category} onChange={e => set('category', e.target.value as DakCategory)} className="dak-input appearance-none pr-9">
                      {Object.entries(DAK_CATEGORY_CONFIG).map(([v, { label, icon }]) => (
                        <option key={v} value={v}>{icon} {label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </Field>
                <Field label="Priority" required>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['normal', 'urgent', 'immediate'] as DakPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set('priority', p)}
                        className={`px-2 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${
                          form.priority === p
                            ? p === 'immediate' ? 'bg-red-500 text-white border-red-500'
                            : p === 'urgent'    ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-saffron text-white border-saffron'
                            : 'bg-white dark:bg-white/5 text-slate-600 dark:text-cream/60 border-slate-200 dark:border-white/10 hover:border-saffron'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field
                label="Physical File / Memo Number"
                icon={Hash}
                hint="reference printed on the hardcopy — used to search later"
              >
                <input
                  type="text"
                  value={form.memo_number}
                  onChange={e => set('memo_number', e.target.value)}
                  placeholder="e.g. SDO/HOW/2026/123 or office memo no."
                  className="dak-input font-mono"
                />
              </Field>
            </Section>

            {/* ════════ 2. Subject ════════ */}
            <Section icon={FileText} title="Subject & Brief">
              <Field label="Subject" required>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  placeholder="e.g. Request for permission to hold cultural event on..."
                  required
                  autoFocus
                  className="dak-input"
                />
              </Field>
              <Field label="Description / Brief">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What the letter is about, what action is required"
                  rows={2}
                  className="dak-input resize-none"
                />
              </Field>
            </Section>

            {/* ════════ 3. Sender ════════ */}
            <Section icon={Users} title="Sender Details">
              {/* Sender type chips */}
              <div>
                <label className="block text-xs font-semibold text-navy-700 dark:text-cream/60 uppercase tracking-wider mb-1.5">
                  Sender Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                  {Object.entries(DAK_SENDER_TYPE_CONFIG).map(([v, cfg]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('sender_type', v as DakSenderType)}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all border ${
                        form.sender_type === v
                          ? 'bg-saffron/10 text-saffron-dark border-saffron shadow-sm dark:bg-gold/15 dark:text-gold dark:border-gold'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-cream/60 border-slate-200 dark:border-white/10 hover:border-saffron/50'
                      }`}
                    >
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-center leading-tight">{cfg.short}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Designation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Sender Name" required>
                  <input
                    type="text"
                    value={form.sender_name}
                    onChange={e => set('sender_name', e.target.value)}
                    placeholder={form.sender_type === 'citizen' ? 'Full name' : 'Officer / Authority name'}
                    required
                    className="dak-input"
                  />
                </Field>
                <Field label="Designation / Position">
                  <input
                    type="text"
                    value={form.sender_designation}
                    onChange={e => set('sender_designation', e.target.value)}
                    placeholder={
                      form.sender_type === 'district' ? 'e.g. ADM, DM, etc.' :
                      form.sender_type === 'block'    ? 'e.g. BDO' :
                      form.sender_type === 'citizen'  ? 'e.g. Resident, Farmer' :
                      'e.g. Secretary'
                    }
                    className="dak-input"
                  />
                </Field>
              </div>

              <Field label="Organization / Office">
                <input
                  type="text"
                  value={form.sender_organization}
                  onChange={e => set('sender_organization', e.target.value)}
                  placeholder={
                    form.sender_type === 'district'    ? 'e.g. DM Office, Howrah' :
                    form.sender_type === 'block'       ? 'e.g. Sankrail BDO Office' :
                    form.sender_type === 'line_dept'   ? 'e.g. PWD Roads Division' :
                    form.sender_type === 'panchayat'   ? 'e.g. Domjur Gram Panchayat' :
                    'Name of organization (optional)'
                  }
                  className="dak-input"
                />
              </Field>

              {/* Contact details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Phone" icon={Phone}>
                  <input
                    type="tel"
                    value={form.sender_phone}
                    onChange={e => set('sender_phone', e.target.value)}
                    placeholder="10-digit mobile / landline"
                    className="dak-input"
                  />
                </Field>
                <Field label="Email" icon={Mail}>
                  <input
                    type="email"
                    value={form.sender_email}
                    onChange={e => set('sender_email', e.target.value)}
                    placeholder="sender@example.com"
                    className="dak-input"
                  />
                </Field>
              </div>

              <Field label="Address" icon={MapPin}>
                <textarea
                  value={form.sender_address}
                  onChange={e => set('sender_address', e.target.value)}
                  placeholder="Full postal address (optional)"
                  rows={2}
                  className="dak-input resize-none"
                />
              </Field>
            </Section>

            {/* ════════ 4. Receipt & Routing ════════ */}
            <Section icon={Upload} title="Receipt & Routing">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Received Via">
                  <div className="relative">
                    <select value={form.received_mode} onChange={e => set('received_mode', e.target.value as DakMode)} className="dak-input appearance-none pr-9">
                      {Object.entries(DAK_MODE_CONFIG).map(([v, { label, icon }]) => (
                        <option key={v} value={v}>{icon} {label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </Field>
                <Field label="Received On">
                  <input type="date" value={form.received_date} onChange={e => set('received_date', e.target.value)} className="dak-input" />
                </Field>
                <Field label="Due Date" hint="auto-set from priority">
                  <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="dak-input" />
                </Field>
              </div>

              <Field label="Assign To" hint="leave blank to keep as pending at SDO office">
                <div className="relative">
                  <select value={form.current_officer_id} onChange={e => set('current_officer_id', e.target.value)} className="dak-input appearance-none pr-9">
                    <option value="">— Unassigned (pending) —</option>
                    {officerOptions.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} · {o.designation}
                        {o.portfolio ? ` (${o.portfolio})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              {/* File upload */}
              <Field label="Scanned Copy" hint="PDF or image, optional">
                <label className="block">
                  <div className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all
                    ${file
                      ? 'border-saffron bg-saffron/5 dark:bg-gold/10'
                      : 'border-slate-300 dark:border-white/15 hover:border-saffron dark:hover:border-gold hover:bg-saffron/5 dark:hover:bg-gold/5'
                    }`}>
                    {file ? (
                      <div className="flex items-center justify-center gap-3 text-sm">
                        <FileText className="w-5 h-5 text-saffron-dark dark:text-gold" />
                        <span className="font-semibold text-navy-900 dark:text-cream">{file.name}</span>
                        <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-cream/50">
                        <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        Click to upload scan / PDF
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </Field>
            </Section>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40 animate-scale-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1 sticky bottom-0 bg-white dark:bg-navy-800 -mx-6 px-6 py-3 -mb-5 border-t border-slate-200 dark:border-gold/10">
              <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-navy-900/15 dark:border-white/15 rounded-xl text-sm font-semibold text-navy-700 dark:text-cream/70 hover:bg-navy-900/5 dark:hover:bg-white/5 transition-colors btn-press disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-xl text-sm font-bold hover:from-saffron-dark hover:to-saffron transition-all shadow-lg shadow-saffron/25 disabled:opacity-50 btn-press flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging Dak…</> : 'Log Dak'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .dak-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(13, 27, 42, 0.12);
          background: rgba(255, 255, 255, 0.9);
          color: #0d1b2a;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .dak-input:focus {
          outline: none;
          border-color: #e07818;
          box-shadow: 0 0 0 3px rgba(224, 120, 24, 0.15);
        }
        html.dark .dak-input {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(245, 237, 216, 0.15);
          color: #f5edd8;
        }
        html.dark .dak-input::placeholder { color: rgba(245, 237, 216, 0.3); }
      `}</style>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gold/15">
        <div className="w-7 h-7 rounded-lg bg-saffron/10 dark:bg-gold/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-saffron-dark dark:text-gold" />
        </div>
        <div className="text-xs font-bold text-navy-900 dark:text-cream uppercase tracking-wider">{title}</div>
      </div>
      {children}
    </div>
  )
}

function Field({
  label, required, hint, icon: Icon, children,
}: { label: string; required?: boolean; hint?: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy-700 dark:text-cream/60 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3 text-saffron-dark dark:text-gold/60" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="ml-2 text-[10px] text-saffron-dark/70 dark:text-gold/70 font-normal normal-case tracking-normal">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
