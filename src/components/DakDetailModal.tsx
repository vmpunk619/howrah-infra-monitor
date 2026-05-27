import { useEffect, useState } from 'react'
import {
  X, Calendar, User, FileText, ExternalLink, Send, CheckCircle2,
  Clock, AlertTriangle, Building2, ChevronDown, Loader2,
  Phone, Mail, MapPin,
} from 'lucide-react'
import { Paperclip, Hash, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Dak, DakActionType, DakAttachment, DakMovement, DakStatus, Officer } from '../types'
import { uploadDakFile } from '../lib/dak'
import {
  DAK_STATUS_CONFIG, DAK_PRIORITY_CONFIG, DAK_MODE_CONFIG,
  DAK_ACTION_CONFIG, DAK_SENDER_TYPE_CONFIG, DAK_CATEGORY_CONFIG,
  isOverdue, daysUntilDue,
} from '../lib/dak'
import { format } from 'date-fns'
import clsx from 'clsx'

interface Props {
  dak: Dak
  officers: Officer[]
  /** Permissions: admin can do everything; officer can only act on daks currently with them or their tree */
  canAct: boolean
  onClose: () => void
  onUpdated: (dak: Dak) => void
}

type ActionMode = null | 'forward' | 'external' | 'status'

export default function DakDetailModal({ dak, officers, canAct, onClose, onUpdated }: Props) {
  const [movements, setMovements]     = useState<DakMovement[]>([])
  const [attachments, setAttachments] = useState<DakAttachment[]>([])
  const [loadingMv, setLoadingMv]     = useState(true)
  const [mode, setMode]               = useState<ActionMode>(null)
  const [saving, setSaving]           = useState(false)
  const [attachFile, setAttachFile]   = useState<File | null>(null)
  const [attachDesc, setAttachDesc]   = useState('')
  const [showAttach, setShowAttach]   = useState(false)

  /* Forward form */
  const [forwardTo, setForwardTo]     = useState('')
  const [forwardRemarks, setFR]       = useState('')

  /* External dispatch */
  const [extName, setExtName] = useState('')
  const [extOrg, setExtOrg]   = useState('')
  const [extRemarks, setExtR] = useState('')

  /* Status change */
  const [newStatus, setNewStatus]     = useState<DakStatus>(dak.status)
  const [statusRemarks, setSR]        = useState('')

  useEffect(() => {
    supabase
      .from('dak_movements')
      .select('*')
      .eq('dak_id', dak.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMovements((data as DakMovement[]) ?? [])
        setLoadingMv(false)
      })

    supabase
      .from('dak_attachments')
      .select('*')
      .eq('dak_id', dak.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setAttachments((data as DakAttachment[]) ?? [])
      })
  }, [dak.id])

  async function doAttach() {
    if (!attachFile) return
    setSaving(true)
    try {
      const file_url = await uploadDakFile(attachFile, dak.dak_number + '_attach')
      if (!file_url) throw new Error('Upload failed')
      const { data: u } = await supabase.auth.getUser()
      const uploaded_by = u.user?.id ?? null
      const { data, error } = await supabase
        .from('dak_attachments')
        .insert({
          dak_id:      dak.id,
          file_url,
          file_name:   attachFile.name,
          description: attachDesc.trim(),
          uploaded_by,
        })
        .select()
        .single()
      if (error) throw error
      if (data) setAttachments(prev => [...prev, data as DakAttachment])
      // Record movement so timeline shows it
      await recordMovement({
        from_officer_id: dak.current_officer_id,
        to_officer_id:   dak.current_officer_id,
        action_type:     'reply_received',
        remarks:         `Attached: ${attachFile.name}${attachDesc.trim() ? ` — ${attachDesc.trim()}` : ''}`,
      })
      setAttachFile(null); setAttachDesc(''); setShowAttach(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const officerById = (id: string | null) => id ? officers.find(o => o.id === id) : null
  const currentOfficer = officerById(dak.current_officer_id)
  const statusCfg = DAK_STATUS_CONFIG[dak.status]
  const priorityCfg = DAK_PRIORITY_CONFIG[dak.priority]
  const overdue = isOverdue(dak)
  const daysDue = daysUntilDue(dak)

  async function recordMovement(payload: Partial<DakMovement>) {
    const { data: u } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('dak_movements')
      .insert({ dak_id: dak.id, performed_by_user_id: u.user?.id ?? null, ...payload })
      .select()
      .single()
    if (error) throw error
    if (data) setMovements(prev => [...prev, data as DakMovement])
    return data as DakMovement
  }

  async function doForward() {
    if (!forwardTo) return
    setSaving(true)
    try {
      await recordMovement({
        from_officer_id: dak.current_officer_id,
        to_officer_id: forwardTo,
        action_type: 'forwarded',
        remarks: forwardRemarks.trim(),
      })
      const { data: updated } = await supabase
        .from('dak')
        .update({ current_officer_id: forwardTo, status: 'forwarded' })
        .eq('id', dak.id).select().single()
      if (updated) onUpdated(updated as Dak)
      setMode(null); setForwardTo(''); setFR('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function doExternalDispatch() {
    if (!extName.trim()) return
    setSaving(true)
    try {
      await recordMovement({
        from_officer_id: dak.current_officer_id,
        to_officer_id: null,
        external_to_name: extName.trim(),
        external_to_org: extOrg.trim() || null,
        action_type: 'external_dispatched',
        remarks: extRemarks.trim(),
      })
      const { data: updated } = await supabase
        .from('dak')
        .update({ status: 'awaiting_reply' })
        .eq('id', dak.id).select().single()
      if (updated) onUpdated(updated as Dak)
      setMode(null); setExtName(''); setExtOrg(''); setExtR('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  async function doStatusChange() {
    setSaving(true)
    try {
      const action_type: DakActionType =
        newStatus === 'disposed'     ? 'disposed' :
        newStatus === 'action_taken' ? 'action_taken' :
        newStatus === 'closed'       ? 'disposed' : 'action_taken'

      await recordMovement({
        from_officer_id: dak.current_officer_id,
        to_officer_id: dak.current_officer_id,
        action_type,
        remarks: statusRemarks.trim(),
      })
      const updates: Partial<Dak> = { status: newStatus }
      if (newStatus === 'disposed' || newStatus === 'closed') {
        updates.disposed_at = new Date().toISOString()
      }
      const { data: updated } = await supabase
        .from('dak').update(updates).eq('id', dak.id).select().single()
      if (updated) onUpdated(updated as Dak)
      setMode(null); setSR('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-gold/15 animate-scale-in overflow-hidden max-h-[92vh] flex flex-col">

        <div className="flex h-[3px] shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white dark:bg-cream/20" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-gold/15 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-xs font-bold text-saffron-dark dark:text-gold bg-saffron/10 dark:bg-gold/10 px-2 py-1 rounded-md border border-saffron/30 dark:border-gold/30">
                  {dak.dak_number}
                </span>
                {dak.memo_number && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800/40">
                    <Hash className="w-3 h-3" /> Memo: {dak.memo_number}
                  </span>
                )}
                {dak.category && DAK_CATEGORY_CONFIG[dak.category] && (
                  <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1', DAK_CATEGORY_CONFIG[dak.category].color)}>
                    <span>{DAK_CATEGORY_CONFIG[dak.category].icon}</span>
                    {DAK_CATEGORY_CONFIG[dak.category].label}
                  </span>
                )}
                <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', statusCfg.color)}>
                  {statusCfg.label}
                </span>
                <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold uppercase', priorityCfg.color)}>
                  {priorityCfg.label}
                </span>
                {overdue && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Overdue {Math.abs(daysDue!)}d
                  </span>
                )}
              </div>
              <h2 className="font-serif font-bold text-navy-900 dark:text-cream text-xl leading-snug">{dak.subject}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-navy-900/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
              <X className="w-4 h-4 text-navy-700 dark:text-cream/60" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-5">
            {/* LEFT: Meta + Description */}
            <div className="space-y-5">
              {dak.description && (
                <InfoBlock title="Description">
                  <p className="text-sm text-slate-700 dark:text-cream/70 leading-relaxed">{dak.description}</p>
                </InfoBlock>
              )}

              <InfoBlock title="Sender">
                <div className="space-y-2 text-sm">
                  {/* Sender type chip */}
                  {dak.sender_type && DAK_SENDER_TYPE_CONFIG[dak.sender_type] && (
                    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase', DAK_SENDER_TYPE_CONFIG[dak.sender_type].color)}>
                      <span>{DAK_SENDER_TYPE_CONFIG[dak.sender_type].icon}</span>
                      {DAK_SENDER_TYPE_CONFIG[dak.sender_type].label}
                    </span>
                  )}
                  {/* Name + designation */}
                  <div className="flex items-start gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-navy-900 dark:text-cream font-semibold">{dak.sender_name}</div>
                      {dak.sender_designation && <div className="text-xs text-slate-500 dark:text-cream/45">{dak.sender_designation}</div>}
                    </div>
                  </div>
                  {dak.sender_organization && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-cream/50 ml-5">
                      <Building2 className="w-3 h-3 shrink-0" /> {dak.sender_organization}
                    </div>
                  )}
                  {/* Contact details */}
                  {(dak.sender_phone || dak.sender_email || dak.sender_address) && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 space-y-1">
                      {dak.sender_phone && (
                        <a href={`tel:${dak.sender_phone}`} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300 hover:underline">
                          <Phone className="w-3 h-3" /> {dak.sender_phone}
                        </a>
                      )}
                      {dak.sender_email && (
                        <a href={`mailto:${dak.sender_email}`} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-300 hover:underline break-all">
                          <Mail className="w-3 h-3 shrink-0" /> {dak.sender_email}
                        </a>
                      )}
                      {dak.sender_address && (
                        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-cream/50">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> <span className="leading-relaxed">{dak.sender_address}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </InfoBlock>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Received" value={format(new Date(dak.received_date), 'dd MMM yyyy')} icon={Calendar} />
                <MiniStat label="Via" value={`${DAK_MODE_CONFIG[dak.received_mode].icon} ${DAK_MODE_CONFIG[dak.received_mode].label}`} />
                {dak.due_date && (
                  <MiniStat
                    label="Due"
                    value={format(new Date(dak.due_date), 'dd MMM yyyy')}
                    icon={Clock}
                    tone={overdue ? 'red' : daysDue !== null && daysDue <= 2 ? 'amber' : undefined}
                  />
                )}
                <MiniStat label="Logged" value={format(new Date(dak.created_at), 'dd MMM, hh:mm a')} />
              </div>

              {/* Files: original scan + additional attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-cream/40 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" /> Files & Correspondence
                    {(dak.file_url ? 1 : 0) + attachments.length > 0 && (
                      <span className="text-[10px] text-slate-400">· {(dak.file_url ? 1 : 0) + attachments.length}</span>
                    )}
                  </div>
                  {canAct && (
                    <button
                      onClick={() => setShowAttach(!showAttach)}
                      className="text-[11px] text-saffron-dark dark:text-gold hover:text-saffron dark:hover:text-gold/80 font-bold inline-flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Add Attachment
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {dak.file_url && (
                    <a href={dak.file_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-900/40 border border-slate-200 dark:border-gold/15 rounded-xl hover:border-saffron dark:hover:border-gold transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-saffron-dark dark:text-gold shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-navy-900 dark:text-cream truncate">Original Scanned Copy</div>
                          <div className="text-xs text-slate-500 dark:text-cream/40">Logged {format(new Date(dak.created_at), 'dd MMM yyyy')}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-saffron-dark dark:group-hover:text-gold shrink-0" />
                    </a>
                  )}

                  {attachments.map(att => (
                    <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-900/40 border border-slate-200 dark:border-gold/15 rounded-xl hover:border-saffron dark:hover:border-gold transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-navy-900 dark:text-cream truncate">{att.file_name}</div>
                          <div className="text-xs text-slate-500 dark:text-cream/40">
                            Added {format(new Date(att.created_at), 'dd MMM yyyy, hh:mm a')}
                            {att.description && <span className="italic"> · "{att.description}"</span>}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-saffron-dark dark:group-hover:text-gold shrink-0" />
                    </a>
                  ))}

                  {!dak.file_url && attachments.length === 0 && !showAttach && (
                    <div className="text-center py-3 text-xs text-slate-400 italic bg-slate-50 dark:bg-navy-900/40 rounded-xl border border-slate-200 dark:border-white/5">
                      No files attached
                    </div>
                  )}

                  {/* Inline upload form */}
                  {showAttach && canAct && (
                    <div className="bg-saffron/5 dark:bg-gold/5 border border-saffron/30 dark:border-gold/30 rounded-xl p-3 space-y-2 animate-scale-in">
                      <label className="block">
                        <div className={`border-2 border-dashed rounded-lg px-3 py-3 text-center cursor-pointer transition-all
                          ${attachFile ? 'border-saffron bg-saffron/10' : 'border-slate-300 dark:border-white/15 hover:border-saffron'}`}>
                          {attachFile ? (
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <FileText className="w-4 h-4 text-saffron-dark dark:text-gold" />
                              <span className="font-semibold text-navy-900 dark:text-cream">{attachFile.name}</span>
                              <span className="text-slate-500">({(attachFile.size / 1024).toFixed(0)} KB)</span>
                              <button type="button" onClick={(e) => { e.preventDefault(); setAttachFile(null) }} className="text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500"><Upload className="w-4 h-4 mx-auto mb-1 opacity-50" />Click to upload</div>
                          )}
                        </div>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setAttachFile(e.target.files?.[0] ?? null)} className="hidden" />
                      </label>
                      <input
                        value={attachDesc}
                        onChange={e => setAttachDesc(e.target.value)}
                        placeholder="Brief description (optional, e.g. 'Reply from BL&LRO')"
                        className="dak-action-input"
                      />
                      <div className="flex gap-2">
                        <button onClick={doAttach} disabled={!attachFile || saving} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-lg text-xs font-bold disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
                          {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</> : <><Paperclip className="w-3 h-3" /> Attach</>}
                        </button>
                        <button onClick={() => { setShowAttach(false); setAttachFile(null); setAttachDesc('') }} className="px-3 py-1.5 border border-slate-300 dark:border-white/15 rounded-lg text-xs text-slate-600 dark:text-cream/60">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <InfoBlock title="Currently With">
                {currentOfficer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-saffron to-saffron-dark text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {currentOfficer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-navy-900 dark:text-cream text-sm">{currentOfficer.name}</div>
                      <div className="text-xs text-slate-500 dark:text-cream/50">
                        {currentOfficer.designation}
                        {currentOfficer.portfolio && <> · {currentOfficer.portfolio}</>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-cream/40 italic">Unassigned — pending at SDO office</div>
                )}
              </InfoBlock>
            </div>

            {/* RIGHT: Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-cream/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Movement Timeline
              </h3>
              {loadingMv ? (
                <div className="text-center py-10 text-slate-400 dark:text-cream/30 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5" /> Loading history…
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-cream/30 text-sm">No movements recorded yet.</div>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-200 dark:border-gold/15 space-y-5">
                  {movements.map((m, i) => (
                    <TimelineNode key={m.id} movement={m} officerById={officerById} isLast={i === movements.length - 1} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ────────── Actions ────────── */}
          {canAct && dak.status !== 'closed' && (
            <div className="border-t border-slate-200 dark:border-gold/15 p-6 bg-slate-50/60 dark:bg-navy-900/40">
              <div className="text-xs font-bold text-slate-500 dark:text-cream/40 uppercase tracking-wider mb-3">Take Action</div>

              {/* Action selector chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                <ActionChip active={mode === 'forward'} onClick={() => setMode(mode === 'forward' ? null : 'forward')} icon={Send}>
                  Forward to officer
                </ActionChip>
                <ActionChip active={mode === 'external'} onClick={() => setMode(mode === 'external' ? null : 'external')} icon={ExternalLink}>
                  Send externally
                </ActionChip>
                <ActionChip active={mode === 'status'} onClick={() => setMode(mode === 'status' ? null : 'status')} icon={CheckCircle2}>
                  Update status / Dispose
                </ActionChip>
              </div>

              {/* Forward */}
              {mode === 'forward' && (
                <div className="space-y-3 animate-scale-in">
                  <div className="relative">
                    <select value={forwardTo} onChange={e => setForwardTo(e.target.value)} className="dak-action-input appearance-none pr-9">
                      <option value="">— Select officer to forward to —</option>
                      {officers
                        .filter(o => o.is_active && o.id !== dak.current_officer_id)
                        .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
                        .map(o => (
                          <option key={o.id} value={o.id}>{o.name} · {o.designation}{o.portfolio ? ` (${o.portfolio})` : ''}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <textarea value={forwardRemarks} onChange={e => setFR(e.target.value)} rows={2} placeholder="Remarks / instructions (optional)" className="dak-action-input resize-none" />
                  <button onClick={doForward} disabled={!forwardTo || saving} className="px-5 py-2 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Forwarding…</> : <><Send className="w-4 h-4" /> Forward</>}
                  </button>
                </div>
              )}

              {/* External */}
              {mode === 'external' && (
                <div className="space-y-3 animate-scale-in">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={extName} onChange={e => setExtName(e.target.value)} placeholder="Recipient name *" className="dak-action-input" />
                    <input value={extOrg} onChange={e => setExtOrg(e.target.value)} placeholder="Organization / Office" className="dak-action-input" />
                  </div>
                  <textarea value={extRemarks} onChange={e => setExtR(e.target.value)} rows={2} placeholder="Dispatch reference / remarks" className="dak-action-input resize-none" />
                  <button onClick={doExternalDispatch} disabled={!extName.trim() || saving} className="px-5 py-2 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching…</> : <><ExternalLink className="w-4 h-4" /> Mark Dispatched</>}
                  </button>
                </div>
              )}

              {/* Status change */}
              {mode === 'status' && (
                <div className="space-y-3 animate-scale-in">
                  <div className="relative">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value as DakStatus)} className="dak-action-input appearance-none pr-9">
                      {Object.entries(DAK_STATUS_CONFIG).map(([s, { label }]) => (
                        <option key={s} value={s}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <textarea value={statusRemarks} onChange={e => setSR(e.target.value)} rows={2} placeholder="What action was taken? (optional but recommended)" className="dak-action-input resize-none" />
                  <button onClick={doStatusChange} disabled={saving} className="px-5 py-2 bg-gradient-to-r from-saffron to-saffron-dark text-white rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Status</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dak-action-input {
          width: 100%;
          padding: 9px 13px;
          font-size: 13px;
          border-radius: 9px;
          border: 1.5px solid rgba(13, 27, 42, 0.12);
          background: #ffffff;
          color: #0d1b2a;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .dak-action-input:focus {
          outline: none;
          border-color: #e07818;
          box-shadow: 0 0 0 3px rgba(224, 120, 24, 0.15);
        }
        html.dark .dak-action-input {
          background: rgba(5, 13, 25, 0.6);
          border-color: rgba(245, 237, 216, 0.15);
          color: #f5edd8;
        }
      `}</style>
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-500 dark:text-cream/40 uppercase tracking-wider mb-2">{title}</div>
      <div className="bg-slate-50 dark:bg-navy-900/40 border border-slate-200 dark:border-gold/10 rounded-xl p-3">
        {children}
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon, tone }: { label: string; value: string; icon?: React.ElementType; tone?: 'red' | 'amber' }) {
  const tones = tone === 'red' ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
              : tone === 'amber' ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
              : 'text-navy-900 dark:text-cream bg-slate-50 dark:bg-navy-900/40 border-slate-200 dark:border-gold/10'
  return (
    <div className={`px-3 py-2 rounded-lg border ${tones}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold flex items-center gap-1">
        {Icon && <Icon className="w-2.5 h-2.5" />} {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  )
}

function ActionChip({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={clsx(
      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
      active
        ? 'bg-saffron text-white shadow-md shadow-saffron/30'
        : 'bg-white dark:bg-white/10 text-navy-700 dark:text-cream/70 border border-slate-300 dark:border-white/15 hover:border-saffron'
    )}>
      <Icon className="w-3.5 h-3.5" /> {children}
    </button>
  )
}

function TimelineNode({ movement, officerById, isLast }: {
  movement: DakMovement
  officerById: (id: string | null) => Officer | null | undefined
  isLast: boolean
}) {
  const cfg = DAK_ACTION_CONFIG[movement.action_type]
  const from = officerById(movement.from_officer_id)
  const to   = officerById(movement.to_officer_id)
  return (
    <div className="relative">
      {/* Dot */}
      <div className={`absolute -left-[22px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-navy-800 shadow ${
        isLast ? 'bg-saffron animate-pulse-dot' : 'bg-slate-300 dark:bg-gold/50'
      }`} />
      <div className="bg-white dark:bg-navy-900/40 border border-slate-200 dark:border-gold/10 rounded-xl p-3 ml-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-base">{cfg.icon}</span>
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-500 dark:text-cream/40 ml-auto">
            {format(new Date(movement.created_at), 'dd MMM, hh:mm a')}
          </span>
        </div>
        <div className="text-xs text-slate-700 dark:text-cream/60">
          {from && <><span className="font-semibold">{from.name}</span> → </>}
          {!from && movement.action_type === 'received' && <span className="italic text-slate-500">From outside → </span>}
          {to ? <span className="font-semibold">{to.name}</span> :
           movement.external_to_name ? <span className="italic">📤 {movement.external_to_name}{movement.external_to_org ? ` · ${movement.external_to_org}` : ''}</span> :
           <span className="italic text-slate-500">internal action</span>}
        </div>
        {movement.remarks && (
          <div className="mt-2 text-xs text-slate-600 dark:text-cream/55 bg-slate-50 dark:bg-white/5 rounded px-2.5 py-1.5 italic leading-relaxed">
            "{movement.remarks}"
          </div>
        )}
      </div>
    </div>
  )
}
