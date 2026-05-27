import { Dak, DakStatus, DakPriority, DakMode, DakActionType, DakSenderType, DakCategory } from '../types'
import { supabase } from './supabase'

/* ── Status display config ──────────────────────────────── */
export const DAK_STATUS_CONFIG: Record<DakStatus, { label: string; color: string; dot: string }> = {
  pending:        { label: 'Pending',         color: 'bg-amber-100  text-amber-800   dark:bg-amber-900/30  dark:text-amber-300',  dot: 'bg-amber-500'  },
  assigned:       { label: 'Assigned',        color: 'bg-blue-100   text-blue-800    dark:bg-blue-900/30   dark:text-blue-300',   dot: 'bg-blue-500'   },
  in_progress:    { label: 'In Progress',     color: 'bg-violet-100 text-violet-800  dark:bg-violet-900/30 dark:text-violet-300', dot: 'bg-violet-500' },
  forwarded:      { label: 'Forwarded',       color: 'bg-cyan-100   text-cyan-800    dark:bg-cyan-900/30   dark:text-cyan-300',   dot: 'bg-cyan-500'   },
  awaiting_reply: { label: 'Awaiting Reply',  color: 'bg-indigo-100 text-indigo-800  dark:bg-indigo-900/30 dark:text-indigo-300', dot: 'bg-indigo-500' },
  action_taken:   { label: 'Action Taken',    color: 'bg-teal-100   text-teal-800    dark:bg-teal-900/30   dark:text-teal-300',   dot: 'bg-teal-500'   },
  disposed:       { label: 'Disposed',        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
  closed:         { label: 'Closed',          color: 'bg-slate-100  text-slate-700   dark:bg-slate-900/30  dark:text-slate-300',  dot: 'bg-slate-500'  },
}

export const DAK_PRIORITY_CONFIG: Record<DakPriority, { label: string; color: string }> = {
  normal:     { label: 'Normal',     color: 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200' },
  urgent:     { label: 'Urgent',     color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  immediate:  { label: 'Immediate',  color: 'bg-red-100   text-red-800   dark:bg-red-900/40   dark:text-red-200'   },
}

export const DAK_MODE_CONFIG: Record<DakMode, { label: string; icon: string }> = {
  physical:  { label: 'Physical Letter', icon: '📨' },
  email:     { label: 'Email',           icon: '📧' },
  speedpost: { label: 'Speed Post',      icon: '📮' },
  courier:   { label: 'Courier',         icon: '📦' },
  fax:       { label: 'Fax',             icon: '📠' },
  online:    { label: 'Online Portal',   icon: '💻' },
}

export const DAK_SENDER_TYPE_CONFIG: Record<DakSenderType, { label: string; short: string; icon: string; color: string }> = {
  citizen:      { label: 'Individual Citizen',          short: 'Citizen',       icon: '👤', color: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300'   },
  government:   { label: 'Government Department',       short: 'Govt Dept',     icon: '🏛️', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  district:     { label: 'District Magistrate Office',  short: 'DM Office',     icon: '🏢', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
  block:        { label: 'Block Development Office',    short: 'BDO',           icon: '🏘️', color: 'bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-300'   },
  line_dept:    { label: 'Line Department',             short: 'Line Dept',     icon: '🔧', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  panchayat:    { label: 'Panchayat / Municipality',    short: 'GP / Muni',     icon: '🌾', color: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300'  },
  organization: { label: 'NGO / Club / Association',    short: 'Organization',  icon: '🤝', color: 'bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300'   },
  court:        { label: 'Court / Legal Notice',        short: 'Court',         icon: '⚖️', color: 'bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-300'  },
  media:        { label: 'Press / Media / RTI',         short: 'Media / RTI',   icon: '📰', color: 'bg-rose-100   text-rose-800   dark:bg-rose-900/30   dark:text-rose-300'   },
  other:        { label: 'Other',                       short: 'Other',         icon: '📩', color: 'bg-slate-100  text-slate-700  dark:bg-slate-700/40  dark:text-slate-200'  },
}

export const DAK_CATEGORY_CONFIG: Record<DakCategory, { label: string; icon: string; color: string }> = {
  public_grievance: { label: 'Public Grievance',      icon: '⚠️', color: 'bg-red-100     text-red-800     dark:bg-red-900/30     dark:text-red-300'     },
  health:           { label: 'Health',                icon: '🏥', color: 'bg-rose-100    text-rose-800    dark:bg-rose-900/30    dark:text-rose-300'    },
  education:        { label: 'Education',             icon: '🎓', color: 'bg-blue-100    text-blue-800    dark:bg-blue-900/30    dark:text-blue-300'    },
  bcw:              { label: 'Backward Classes Welfare', icon: '🤲', color: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300' },
  land_revenue:     { label: 'Land & Revenue',        icon: '📜', color: 'bg-amber-100   text-amber-800   dark:bg-amber-900/30   dark:text-amber-300'   },
  welfare_scheme:   { label: 'Welfare Schemes',       icon: '💰', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  disaster:         { label: 'Disaster Management',   icon: '🌊', color: 'bg-cyan-100    text-cyan-800    dark:bg-cyan-900/30    dark:text-cyan-300'    },
  law_order:        { label: 'Law & Order',           icon: '🚔', color: 'bg-indigo-100  text-indigo-800  dark:bg-indigo-900/30  dark:text-indigo-300'  },
  infrastructure:   { label: 'Infrastructure / PWD',  icon: '🏗️', color: 'bg-orange-100  text-orange-800  dark:bg-orange-900/30  dark:text-orange-300'  },
  election:         { label: 'Election',              icon: '🗳️', color: 'bg-violet-100  text-violet-800  dark:bg-violet-900/30  dark:text-violet-300'  },
  administrative:   { label: 'Administrative',        icon: '📋', color: 'bg-teal-100    text-teal-800    dark:bg-teal-900/30    dark:text-teal-300'    },
  other:            { label: 'Other',                 icon: '📩', color: 'bg-slate-100   text-slate-700   dark:bg-slate-700/40   dark:text-slate-200'   },
}

export const DAK_ACTION_CONFIG: Record<DakActionType, { label: string; color: string; icon: string }> = {
  received:            { label: 'Received',          color: 'text-blue-600',    icon: '📥' },
  assigned:            { label: 'Assigned',          color: 'text-blue-600',    icon: '➡️' },
  forwarded:           { label: 'Forwarded',         color: 'text-cyan-600',    icon: '↪️' },
  returned:            { label: 'Returned',          color: 'text-amber-600',   icon: '↩️' },
  action_taken:        { label: 'Action Taken',      color: 'text-teal-600',    icon: '✅' },
  external_dispatched: { label: 'Sent Externally',   color: 'text-indigo-600',  icon: '📤' },
  reply_received:      { label: 'Reply Received',    color: 'text-violet-600',  icon: '📨' },
  disposed:            { label: 'Disposed',          color: 'text-emerald-600', icon: '🏁' },
  reopened:            { label: 'Reopened',          color: 'text-orange-600',  icon: '🔄' },
}

/* ── Helpers ────────────────────────────────────────────── */

/** Is this dak past its due date and not yet disposed? */
export function isOverdue(dak: Dak): boolean {
  if (!dak.due_date) return false
  if (dak.status === 'disposed' || dak.status === 'closed') return false
  return new Date(dak.due_date) < new Date(new Date().toDateString())
}

/** Days until due (negative if overdue) */
export function daysUntilDue(dak: Dak): number | null {
  if (!dak.due_date) return null
  const due = new Date(dak.due_date)
  const today = new Date(new Date().toDateString())
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Get the next dak number from the database */
export async function generateDakNumber(): Promise<string> {
  // Format: DAK-YYYYMM-NNNN
  const prefix = `DAK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-`
  const { data } = await supabase
    .from('dak')
    .select('dak_number')
    .like('dak_number', `${prefix}%`)
    .order('dak_number', { ascending: false })
    .limit(1)
  const lastSeq = data?.[0]?.dak_number
    ? parseInt(data[0].dak_number.split('-').pop() || '0', 10)
    : 0
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`
}

/** Upload a file to the dak-files bucket and return the public URL */
export async function uploadDakFile(file: File, dakNumber: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'pdf'
  const path = `${dakNumber}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('dak-files').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) {
    console.error('[dak] upload failed:', error)
    return null
  }
  // Get a public signed URL (1 year) since the bucket is private
  const { data: signed } = await supabase.storage.from('dak-files').createSignedUrl(path, 60 * 60 * 24 * 365)
  return signed?.signedUrl ?? path
}

/** Compute default due date — +7 days normal, +3 urgent, +1 immediate */
export function defaultDueDate(priority: DakPriority): string {
  const days = priority === 'immediate' ? 1 : priority === 'urgent' ? 3 : 7
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
