import { IssueCategory, ComplaintStatus, Priority } from '../types'

export const ISSUE_CATEGORIES: Record<
  IssueCategory,
  { label: string; icon: string; color: string; markerColor: string }
> = {
  pothole:      { label: 'Pothole',               icon: '🕳️', color: 'bg-orange-100 text-orange-800', markerColor: '#ea580c' },
  road_damage:  { label: 'Road Damage',            icon: '🚧', color: 'bg-red-100 text-red-800',       markerColor: '#dc2626' },
  streetlight:  { label: 'Broken Streetlight',     icon: '💡', color: 'bg-yellow-100 text-yellow-800', markerColor: '#ca8a04' },
  manhole:      { label: 'Open / Damaged Manhole', icon: '⚠️', color: 'bg-purple-100 text-purple-800', markerColor: '#9333ea' },
  waterlogging: { label: 'Water Logging',           icon: '🌊', color: 'bg-blue-100 text-blue-800',     markerColor: '#2563eb' },
  garbage:      { label: 'Garbage Accumulation',   icon: '🗑️', color: 'bg-green-100 text-green-800',   markerColor: '#16a34a' },
  encroachment: { label: 'Encroachment',            icon: '🏗️', color: 'bg-gray-100 text-gray-800',    markerColor: '#4b5563' },
  other:        { label: 'Other Issue',             icon: '📋', color: 'bg-slate-100 text-slate-800',  markerColor: '#64748b' },
}

export const DEPARTMENT_ROUTING: Record<
  IssueCategory,
  { name: string; email: string; phone: string }
> = {
  pothole:      { name: 'PWD Roads Division, Howrah',          email: 'ee.pwd.howrah@wb.gov.in',         phone: '033-2638-XXXX' },
  road_damage:  { name: 'PWD Roads Division, Howrah',          email: 'ee.pwd.howrah@wb.gov.in',         phone: '033-2638-XXXX' },
  streetlight:  { name: 'WBSEDCL / Municipal Lighting Cell',   email: 'wbsedcl.howrah@wb.gov.in',        phone: '033-2638-XXXX' },
  manhole:      { name: 'PHE & Drainage Division',             email: 'phe.howrahsadar@wb.gov.in',       phone: '033-2638-XXXX' },
  waterlogging: { name: 'Drainage & Flood Control Division',   email: 'drainage.howrahsadar@wb.gov.in',  phone: '033-2638-XXXX' },
  garbage:      { name: 'Solid Waste Management Cell',         email: 'swm.howrahsadar@wb.gov.in',       phone: '033-2638-XXXX' },
  encroachment: { name: 'Sub-Divisional Office, Howrah Sadar', email: 'sdo.howrahsadar@wb.gov.in',       phone: '033-2638-XXXX' },
  other:        { name: 'Sub-Divisional Office, Howrah Sadar', email: 'sdo.howrahsadar@wb.gov.in',       phone: '033-2638-XXXX' },
}

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; color: string; dot: string }
> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500'   },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-800',   dot: 'bg-green-500'  },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-800',     dot: 'bg-gray-400'   },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'bg-gray-100 text-gray-700'   },
  medium:   { label: 'Medium',   color: 'bg-yellow-100 text-yellow-700' },
  high:     { label: 'High',     color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700'     },
}

export const HOWRAH_WARDS = [
  // Howrah Municipal Corporation Wards
  ...Array.from({ length: 50 }, (_, i) => `Ward ${i + 1}`),
  // Outgrowth / sub-divisional areas
  'Shibpur', 'Liluah', 'Bally', 'Belur', 'Ghusuri',
  'Sankrail', 'Domjur', 'Panchla', 'Uluberia', 'Bagnan',
  'Amta', 'Jagatballavpur', 'Shyampur',
]
