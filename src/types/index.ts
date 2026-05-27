export type IssueCategory =
  | 'pothole'
  | 'road_damage'
  | 'streetlight'
  | 'manhole'
  | 'waterlogging'
  | 'garbage'
  | 'encroachment'
  | 'other'

export type ComplaintStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Complaint {
  id: string
  complaint_number: string
  category: IssueCategory
  description: string
  location_lat: number
  location_lng: number
  address: string
  ward_number: string
  photo_url: string | null
  status: ComplaintStatus
  priority: Priority
  reported_by_name: string
  reported_by_phone: string
  reported_by_email: string | null
  assigned_department: string | null
  officer_notes: string | null
  officer_id: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface Officer {
  id: string
  name: string
  designation: string
  rank: 1 | 2 | 3
  department: string | null
  phone: string | null
  email: string | null
  username: string | null            // optional, case-insensitive unique
  auth_uid: string | null
  is_active: boolean
  created_at: string
  /** Direct supervisor — id of the officer this person reports to */
  parent_officer_id: string | null
  /** Subject area (e.g. "Disaster Management", "Land Revenue") */
  portfolio: string | null
}

export interface ComplaintUpdate {
  id: string
  complaint_id: string
  status_from: ComplaintStatus
  status_to: ComplaintStatus
  notes: string
  created_at: string
}

/* ─── Dak (correspondence tracking) ────────────────────── */
export type DakStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'forwarded'
  | 'awaiting_reply'
  | 'action_taken'
  | 'disposed'
  | 'closed'

export type DakPriority = 'normal' | 'urgent' | 'immediate'
export type DakMode     = 'physical' | 'email' | 'speedpost' | 'courier' | 'fax' | 'online'

export type DakSenderType =
  | 'citizen'        // Individual citizen
  | 'government'     // General government dept
  | 'district'       // District Magistrate / Collectorate
  | 'block'          // Block Development Office
  | 'line_dept'      // PWD, PHE, etc.
  | 'panchayat'      // Gram Panchayat / Municipality
  | 'organization'   // NGO, club, association
  | 'court'          // Court / legal notice
  | 'media'          // Press / RTI
  | 'other'

export type DakCategory =
  | 'public_grievance'
  | 'health'
  | 'education'
  | 'bcw'              // Backward Classes Welfare
  | 'land_revenue'
  | 'welfare_scheme'
  | 'disaster'
  | 'law_order'
  | 'infrastructure'
  | 'election'
  | 'administrative'
  | 'other'

export type DakActionType =
  | 'received'
  | 'assigned'
  | 'forwarded'
  | 'returned'
  | 'action_taken'
  | 'external_dispatched'
  | 'reply_received'
  | 'disposed'
  | 'reopened'

export interface DakAttachment {
  id: string
  dak_id: string
  file_url: string
  file_name: string
  description: string
  uploaded_by: string | null
  created_at: string
}

export interface Dak {
  id: string
  dak_number: string
  memo_number: string | null            // physical hardcopy reference
  subject: string
  description: string
  category: DakCategory                       // subject classification
  sender_name: string
  sender_designation: string | null
  sender_organization: string | null
  sender_type: DakSenderType                  // who sent it
  sender_phone: string | null
  sender_email: string | null
  sender_address: string | null
  received_mode: DakMode
  received_date: string             // ISO date
  priority: DakPriority
  file_url: string | null           // Supabase Storage path
  current_officer_id: string | null
  status: DakStatus
  due_date: string | null           // ISO date
  created_by: string | null
  created_at: string
  updated_at: string
  disposed_at: string | null
}

export interface DakMovement {
  id: string
  dak_id: string
  from_officer_id: string | null
  to_officer_id: string | null
  external_to_name: string | null
  external_to_org: string | null
  action_type: DakActionType
  remarks: string
  performed_by_user_id: string | null
  created_at: string
}
