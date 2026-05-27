// Supabase Edge Function — routes new complaint to department via email
// Deploy: supabase functions deploy route-complaint
// Env vars needed: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY      = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL          = 'Infrastructure Monitor <noreply@howrahsadar.gov.in>'

const DEPT_EMAILS: Record<string, string> = {
  pothole:      'ee.pwd.howrah@wb.gov.in',
  road_damage:  'ee.pwd.howrah@wb.gov.in',
  streetlight:  'wbsedcl.howrah@wb.gov.in',
  manhole:      'phe.howrahsadar@wb.gov.in',
  waterlogging: 'drainage.howrahsadar@wb.gov.in',
  garbage:      'swm.howrahsadar@wb.gov.in',
  encroachment: 'sdo.howrahsadar@wb.gov.in',
  other:        'sdo.howrahsadar@wb.gov.in',
}

const CATEGORY_LABEL: Record<string, string> = {
  pothole:      'Pothole',
  road_damage:  'Road Damage',
  streetlight:  'Broken Streetlight',
  manhole:      'Open / Damaged Manhole',
  waterlogging: 'Water Logging',
  garbage:      'Garbage Accumulation',
  encroachment: 'Encroachment',
  other:        'Other Issue',
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return // skip if not configured
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
}

serve(async (req) => {
  const { complaint_id } = await req.json()

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: c } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', complaint_id)
    .single()

  if (!c) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const mapsLink    = `https://www.google.com/maps?q=${c.location_lat},${c.location_lng}`
  const catLabel    = CATEGORY_LABEL[c.category] ?? c.category
  const deptEmail   = DEPT_EMAILS[c.category]    ?? DEPT_EMAILS.other
  const priorityBg  = c.priority === 'critical' ? '#fef2f2' : c.priority === 'high' ? '#fff7ed' : '#f0fdf4'
  const priorityClr = c.priority === 'critical' ? '#dc2626' : c.priority === 'high' ? '#ea580c' : '#16a34a'

  // ── Email to department ──────────────────────────────────────
  const deptHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
  <div style="background:#1e3a8a;color:white;padding:20px 24px;">
    <div style="font-size:12px;opacity:0.75;margin-bottom:4px;">GOVERNMENT OF WEST BENGAL</div>
    <div style="font-size:18px;font-weight:bold;">New Infrastructure Complaint</div>
    <div style="font-size:13px;opacity:0.8;margin-top:2px;">Howrah Sadar Subdivision — Infrastructure Monitor</div>
  </div>

  <div style="padding:24px;background:#f8fafc;">
    <div style="background:white;border-radius:8px;padding:16px 20px;border:1px solid #e2e8f0;margin-bottom:16px;text-align:center;">
      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Complaint Number</div>
      <div style="font-size:26px;font-family:monospace;font-weight:bold;color:#1e3a8a;margin-top:4px;">${c.complaint_number}</div>
    </div>

    <div style="background:${priorityBg};border-radius:6px;padding:8px 14px;margin-bottom:16px;color:${priorityClr};font-weight:bold;font-size:13px;text-align:center;">
      Priority: ${c.priority.toUpperCase()}
    </div>

    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:16px;">
      ${[
        ['Category',     catLabel],
        ['Description',  c.description],
        ['Location',     `${c.address || ''}${c.ward_number ? ', ' + c.ward_number : ''}`.trim() || `${c.location_lat}, ${c.location_lng}`],
        ['Reported By',  `${c.reported_by_name} · ${c.reported_by_phone}${c.reported_by_email ? ' · ' + c.reported_by_email : ''}`],
      ].map(([k, v], i) => `
        <tr style="${i % 2 === 0 ? 'background:#f8fafc;' : ''}">
          <td style="padding:10px 14px;font-size:11px;color:#64748b;font-weight:bold;width:32%;text-transform:uppercase;">${k}</td>
          <td style="padding:10px 14px;font-size:13px;color:#1e293b;">${v}</td>
        </tr>
      `).join('')}
    </table>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${mapsLink}" style="background:#1e3a8a;color:white;padding:10px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;display:inline-block;">
        📍 View on Google Maps
      </a>
    </div>

    ${c.photo_url ? `<img src="${c.photo_url}" alt="Issue photo" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;" />` : ''}

    <div style="font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px;">
      Please take necessary action within 48 hours and update the status in the Officer Dashboard.
    </div>
  </div>
</div>`

  await sendEmail(
    deptEmail,
    `[${c.priority.toUpperCase()}] ${catLabel} — ${c.complaint_number}`,
    deptHtml
  )

  // ── Acknowledgement to citizen ───────────────────────────────
  if (c.reported_by_email) {
    const ackHtml = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
  <div style="background:#1e3a8a;color:white;padding:20px 24px;">
    <div style="font-size:18px;font-weight:bold;">Complaint Registered ✓</div>
    <div style="font-size:13px;opacity:0.8;margin-top:2px;">Howrah Sadar Subdivision — Infrastructure Monitor</div>
  </div>
  <div style="padding:24px;">
    <p style="color:#374151;font-size:14px;">Dear <strong>${c.reported_by_name}</strong>,</p>
    <p style="color:#374151;font-size:14px;">Your complaint has been successfully registered and forwarded to the concerned department for action.</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;text-align:center;margin:20px 0;">
      <div style="font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">Your Complaint Number</div>
      <div style="font-size:24px;font-family:monospace;font-weight:bold;color:#1e3a8a;margin-top:4px;">${c.complaint_number}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:6px;">Use this number to track your complaint status anytime</div>
    </div>

    <table style="width:100%;font-size:13px;color:#374151;">
      <tr><td style="padding:4px 0;color:#6b7280;">Issue Type:</td><td><strong>${catLabel}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Department:</td><td><strong>${c.assigned_department}</strong></td></tr>
    </table>

    <p style="color:#374151;font-size:13px;margin-top:20px;">
      Thank you for helping improve infrastructure in Howrah Sadar Subdivision.
    </p>
    <p style="color:#6b7280;font-size:12px;">— Howrah Sadar Subdivision Administration</p>
  </div>
</div>`

    await sendEmail(
      c.reported_by_email,
      `Complaint Registered: ${c.complaint_number} — Howrah Sadar`,
      ackHtml
    )
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
