import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Camera, CheckCircle, ChevronRight, Loader2, LocateFixed, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { IssueCategory, Priority } from '../types'
import {
  DEPARTMENT_ROUTING,
  HOWRAH_WARDS,
  ISSUE_CATEGORIES,
  PRIORITY_CONFIG,
} from '../lib/departments'
import ComplaintMap from '../components/ComplaintMap'
import clsx from 'clsx'

type Step = 'category' | 'location' | 'details' | 'contact'
const STEPS: Step[] = ['category', 'location', 'details', 'contact']
const STEP_LABELS = ['Issue Type', 'Location', 'Details', 'Contact']

interface FormState {
  category: IssueCategory | ''
  priority: Priority
  description: string
  location_lat: number | null
  location_lng: number | null
  address: string
  ward_number: string
  photo: File | null
  reported_by_name: string
  reported_by_phone: string
  reported_by_email: string
}

const INITIAL: FormState = {
  category: '',
  priority: 'medium',
  description: '',
  location_lat: null,
  location_lng: null,
  address: '',
  ward_number: '',
  photo: null,
  reported_by_name: '',
  reported_by_phone: '',
  reported_by_email: '',
}

export default function Report() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [authChecked, setAuthChecked] = useState(false)

  /* Admin-only: redirect to /login if not authenticated */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/login', { replace: true })
      else setAuthChecked(true)
    })
  }, [navigate])
  const [step, setStep]         = useState<Step>('category')
  const [form, setForm]         = useState<FormState>(INITIAL)
  const [previewUrl, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [complaintNumber, setComplaintNumber] = useState('')
  const [done, setDone]         = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError]     = useState('')
  const [flyTo, setFlyTo]           = useState<{ lat: number; lng: number } | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleUseGPS() {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.')
      return
    }
    setGpsLoading(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        set('location_lat', lat)
        set('location_lng', lng)
        setFlyTo({ lat, lng })
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === err.PERMISSION_DENIED)
          setGpsError('Location access denied. Please allow it in your browser settings.')
        else
          setGpsError('Could not fetch location. Try pinning on the map instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const stepIdx = STEPS.indexOf(step)

  function canAdvance() {
    if (step === 'category') return !!form.category
    if (step === 'location') return form.location_lat !== null
    if (step === 'details')  return form.description.trim().length > 10
    return false
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    set('photo', file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!form.category || form.location_lat === null || form.location_lng === null) return
    if (!form.reported_by_name.trim() || form.reported_by_phone.trim().length < 10) return
    setSubmitting(true)

    try {
      let photo_url: string | null = null
      if (form.photo) {
        const ext = form.photo.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { data: up } = await supabase.storage
          .from('complaint-photos')
          .upload(path, form.photo, { cacheControl: '3600' })
        if (up) {
          photo_url = supabase.storage.from('complaint-photos').getPublicUrl(up.path).data.publicUrl
        }
      }

      const d = new Date()
      const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
      const rand = String(Math.floor(Math.random() * 9000) + 1000)
      const num = `HSD-${ym}-${rand}`

      const dept = DEPARTMENT_ROUTING[form.category as IssueCategory]

      const { data, error } = await supabase
        .from('complaints')
        .insert({
          complaint_number:   num,
          category:           form.category,
          priority:           form.priority,
          description:        form.description.trim(),
          location_lat:       form.location_lat,
          location_lng:       form.location_lng,
          address:            form.address.trim(),
          ward_number:        form.ward_number,
          photo_url,
          status:             'pending',
          reported_by_name:   form.reported_by_name.trim(),
          reported_by_phone:  form.reported_by_phone.trim(),
          reported_by_email:  form.reported_by_email.trim() || null,
          assigned_department: dept.name,
        })
        .select()
        .single()

      if (error) throw error

      // Trigger email routing
      await supabase.functions.invoke('route-complaint', { body: { complaint_id: data.id } })

      setComplaintNumber(num)
      setDone(true)
    } catch (err) {
      console.error(err)
      alert('Failed to submit. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Done screen ── */
  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your complaint has been registered and the concerned department has been notified.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="text-xs text-blue-500 font-medium mb-1 uppercase tracking-wide">
            Your Complaint Number
          </div>
          <div className="text-3xl font-mono font-bold text-blue-900">{complaintNumber}</div>
          <div className="text-xs text-gray-500 mt-2">
            Save this number to track your complaint status
          </div>
        </div>

        {form.category && (
          <div className="text-sm text-gray-600 mb-6 bg-gray-50 rounded-lg p-3">
            Routed to:{' '}
            <strong>{DEPARTMENT_ROUTING[form.category as IssueCategory].name}</strong>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/track')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Track This Complaint
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Checking permissions…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header + progress */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          Report Infrastructure Issue
        </h1>

        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={clsx(
                  'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0',
                  i < stepIdx  ? 'bg-green-500 text-white'
                  : i === stepIdx ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                )}
              >
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span
                className={clsx(
                  'hidden sm:block text-xs ml-1 mr-2',
                  i === stepIdx ? 'text-blue-600 font-medium' : 'text-gray-400'
                )}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className="w-5 h-px bg-gray-300 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {/* Step 1: Category */}
        {step === 'category' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">What type of issue?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select the category that best describes the problem
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {Object.entries(ISSUE_CATEGORIES).map(([cat, { label, icon }]) => (
                <button
                  key={cat}
                  onClick={() => set('category', cat as IssueCategory)}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                    form.category === cat
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([p, { label, color }]) => (
                  <button
                    key={p}
                    onClick={() => set('priority', p as Priority)}
                    className={clsx(
                      'px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition-all',
                      form.priority === p
                        ? 'border-blue-500 ' + color
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.category && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                Will be routed to:{' '}
                <strong>{DEPARTMENT_ROUTING[form.category as IssueCategory].name}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 'location' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Where is the issue?</h2>
            <p className="text-sm text-gray-500 mb-3">
              Use GPS or click on the map to pin the exact location
            </p>

            <button
              onClick={handleUseGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-lg border-2 border-blue-500 text-blue-600 font-semibold text-sm hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {gpsLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching your location…</>
                : <><LocateFixed className="w-4 h-4" /> Use My Current GPS Location</>
              }
            </button>

            {gpsError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {gpsError}
              </div>
            )}

            <div className="relative">
              <ComplaintMap
                onLocationPick={(lat, lng) => {
                  set('location_lat', lat)
                  set('location_lng', lng)
                }}
                pickedLocation={
                  form.location_lat !== null
                    ? { lat: form.location_lat, lng: form.location_lng! }
                    : null
                }
                flyTo={flyTo}
                height="300px"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-gray-500 px-2 py-1 rounded shadow pointer-events-none z-[1000]">
                or tap anywhere on the map
              </div>
            </div>

            {form.location_lat !== null ? (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location pinned: {form.location_lat.toFixed(5)},{' '}
                {form.location_lng!.toFixed(5)}
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Click on the map to pin location
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address / Landmark{' '}
                  <span className="text-gray-400 font-normal">(helps officers find it faster)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="e.g. Near Howrah Station Gate 3, GT Road"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ward / Area
                </label>
                <select
                  value={form.ward_number}
                  onChange={(e) => set('ward_number', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select ward / area</option>
                  {HOWRAH_WARDS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Describe the Issue</h2>
            <p className="text-sm text-gray-500 mb-4">
              Clear details help the department act faster
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="e.g. Large pothole (approx 2 ft wide) on the main road near the school gate — very dangerous for two-wheelers especially at night."
                  rows={4}
                  maxLength={500}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {form.description.length}/500
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo{' '}
                  <span className="text-gray-400 font-normal">(strongly recommended)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => { set('photo', null); setPreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-300" />
                    <span className="text-sm text-gray-400">Tap to take / upload photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 'contact' && (
          <div>
            <h2 className="text-lg font-semibold mb-1">Your Contact Details</h2>
            <p className="text-sm text-gray-500 mb-4">
              Required for official records. Never shared publicly.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.reported_by_name}
                  onChange={(e) => set('reported_by_name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <span className="border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 flex-shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={form.reported_by_phone}
                    onChange={(e) => set('reported_by_phone', e.target.value.replace(/\D/, ''))}
                    placeholder="10-digit number"
                    maxLength={10}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email{' '}
                  <span className="text-gray-400 font-normal">(optional — for email updates)</span>
                </label>
                <input
                  type="email"
                  value={form.reported_by_email}
                  onChange={(e) => set('reported_by_email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 border">
                <div className="font-semibold text-gray-700 mb-1.5">Submission summary</div>
                <div>
                  Issue: <strong>{form.category ? ISSUE_CATEGORIES[form.category as IssueCategory].label : '—'}</strong>
                </div>
                <div>Priority: <strong>{PRIORITY_CONFIG[form.priority].label}</strong></div>
                <div>
                  Location:{' '}
                  <strong>
                    {form.address ||
                      (form.location_lat
                        ? `${form.location_lat.toFixed(4)}, ${form.location_lng?.toFixed(4)}`
                        : '—')}
                    {form.ward_number ? `, ${form.ward_number}` : ''}
                  </strong>
                </div>
                <div>
                  Department:{' '}
                  <strong>
                    {form.category ? DEPARTMENT_ROUTING[form.category as IssueCategory].name : '—'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t">
          {stepIdx > 0 ? (
            <button
              onClick={() => setStep(STEPS[stepIdx - 1])}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step === 'contact' ? (
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !form.reported_by_name.trim() ||
                form.reported_by_phone.trim().length < 10
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Complaint'}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1])}
              disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
