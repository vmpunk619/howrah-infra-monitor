import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, ChevronDown, Lock, MapPin,
  CheckCircle, Clock, Zap, TrendingUp,
  ShieldCheck, Eye, MessageCircle, Sparkles, Plus, Minus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Complaint } from '../types'
import { ISSUE_CATEGORIES } from '../lib/departments'
import ComplaintMap from '../components/ComplaintMap'
import WaveDivider from '../components/WaveDivider'
import { useReveal } from '../hooks/useScrollReveal'

/* ─── Howrah Bridge silhouette SVG ─────────────────────────── */
function BridgeSilhouette() {
  const hangers = [618, 648, 678, 710, 740, 770, 800, 830]
  return (
    <svg
      viewBox="0 0 1440 210"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g stroke="#c9962e" fill="none" strokeLinecap="square">
        {/* ── DECK ── */}
        <rect x="0" y="188" width="1440" height="5" fill="#c9962e" opacity="0.22" stroke="none"/>
        <rect x="55" y="198" width="1330" height="2.5" fill="#c9962e" opacity="0.1" stroke="none"/>

        {/* ── LEFT TOWER ── */}
        <rect x="430" y="28" width="16" height="162" fill="#c9962e" opacity="0.2" stroke="none"/>
        <rect x="470" y="28" width="16" height="162" fill="#c9962e" opacity="0.2" stroke="none"/>
        {/* Top cap */}
        <rect x="422" y="20" width="72" height="13" fill="#c9962e" opacity="0.26" stroke="none"/>
        {/* Horizontal braces */}
        {[62, 102, 142].map(y => (
          <rect key={y} x="430" y={y} width="56" height="5" fill="#c9962e" opacity="0.18" stroke="none"/>
        ))}
        {/* X-bracing panels */}
        <line x1="430" y1="28"  x2="486" y2="62"  strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="486" y1="28"  x2="430" y2="62"  strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="430" y1="62"  x2="486" y2="102" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="486" y1="62"  x2="430" y2="102" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="430" y1="102" x2="486" y2="142" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="486" y1="102" x2="430" y2="142" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>

        {/* ── RIGHT TOWER ── */}
        <rect x="954" y="28" width="16" height="162" fill="#c9962e" opacity="0.2" stroke="none"/>
        <rect x="994" y="28" width="16" height="162" fill="#c9962e" opacity="0.2" stroke="none"/>
        <rect x="946" y="20" width="72" height="13" fill="#c9962e" opacity="0.26" stroke="none"/>
        {[62, 102, 142].map(y => (
          <rect key={y} x="954" y={y} width="56" height="5" fill="#c9962e" opacity="0.18" stroke="none"/>
        ))}
        <line x1="954"  y1="28"  x2="1010" y2="62"  strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="1010" y1="28"  x2="954"  y2="62"  strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="954"  y1="62"  x2="1010" y2="102" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="1010" y1="62"  x2="954"  y2="102" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="954"  y1="102" x2="1010" y2="142" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>
        <line x1="1010" y1="102" x2="954"  y2="142" strokeWidth="2.5" stroke="#c9962e" opacity="0.2"/>

        {/* ── LEFT CANTILEVER (outward) ── */}
        <line x1="438" y1="188" x2="55"  y2="198" strokeWidth="3.5" stroke="#c9962e" opacity="0.26"/>
        <line x1="438" y1="145" x2="200" y2="188" strokeWidth="2"   stroke="#c9962e" opacity="0.2"/>
        <line x1="438" y1="102" x2="315" y2="188" strokeWidth="1.5" stroke="#c9962e" opacity="0.16"/>
        <line x1="438" y1="62"  x2="395" y2="188" strokeWidth="1"   stroke="#c9962e" opacity="0.13"/>

        {/* ── LEFT CANTILEVER (inward toward center) ── */}
        <line x1="478" y1="145" x2="615" y2="188" strokeWidth="2"   stroke="#c9962e" opacity="0.2"/>
        <line x1="478" y1="102" x2="695" y2="188" strokeWidth="1.5" stroke="#c9962e" opacity="0.16"/>
        <line x1="478" y1="62"  x2="752" y2="188" strokeWidth="1"   stroke="#c9962e" opacity="0.13"/>

        {/* ── RIGHT CANTILEVER (outward) ── */}
        <line x1="1002" y1="188" x2="1385" y2="198" strokeWidth="3.5" stroke="#c9962e" opacity="0.26"/>
        <line x1="1002" y1="145" x2="1240" y2="188" strokeWidth="2"   stroke="#c9962e" opacity="0.2"/>
        <line x1="1002" y1="102" x2="1125" y2="188" strokeWidth="1.5" stroke="#c9962e" opacity="0.16"/>
        <line x1="1002" y1="62"  x2="1045" y2="188" strokeWidth="1"   stroke="#c9962e" opacity="0.13"/>

        {/* ── RIGHT CANTILEVER (inward toward center) ── */}
        <line x1="962" y1="145" x2="825"  y2="188" strokeWidth="2"   stroke="#c9962e" opacity="0.2"/>
        <line x1="962" y1="102" x2="745"  y2="188" strokeWidth="1.5" stroke="#c9962e" opacity="0.16"/>
        <line x1="962" y1="62"  x2="688"  y2="188" strokeWidth="1"   stroke="#c9962e" opacity="0.13"/>

        {/* ── SUSPENDED SPAN top chord ── */}
        <line x1="615" y1="168" x2="825" y2="168" strokeWidth="2" stroke="#c9962e" opacity="0.18"/>

        {/* ── VERTICAL HANGERS in suspended span ── */}
        {hangers.map(x => (
          <line key={x} x1={x} y1="168" x2={x} y2="188" strokeWidth="1.5" stroke="#c9962e" opacity="0.18"/>
        ))}
      </g>
    </svg>
  )
}

/* ─── Animated counter ──────────────────────────────────────── */
function AnimatedStat({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(false)

  useEffect(() => {
    if (ref.current || value === 0) return
    ref.current = true
    const duration = 1600
    const start = Date.now() + delay
    const step = () => {
      const elapsed = Date.now() - start
      if (elapsed < 0) { requestAnimationFrame(step); return }
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, delay])

  return (
    <div className="text-center">
      <div className="font-serif text-4xl md:text-5xl font-bold text-saffron dark:text-gold-400">{display}</div>
      <div className="text-slate-500 dark:text-cream/40 text-[11px] uppercase tracking-widest mt-1.5 font-sans">{label}</div>
    </div>
  )
}

/* ─── Category card ─────────────────────────────────────────── */
function CategoryCard({ icon, label, count, delay }: { icon: string; label: string; count: number; delay: number }) {
  return (
    <div className="dark-card p-5 lift-hover animate-fade-up group cursor-pointer" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">{icon}</div>
      <div className="text-navy-900 dark:text-cream/80 font-semibold text-sm leading-snug group-hover:text-saffron dark:group-hover:text-gold transition-colors">{label}</div>
      <div className="text-gold/60 text-xs mt-2 font-mono">{count} report{count !== 1 ? 's' : ''}</div>
    </div>
  )
}

/* ─── Step card ─────────────────────────────────────────────── */
function StepCard({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  return (
    <div
      className="animate-fade-up group cursor-default relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="step-num mb-3 transition-all duration-300 group-hover:[-webkit-text-stroke:1.5px_rgba(224,120,24,0.7)] group-hover:scale-110 origin-left">
        {num}
      </div>
      <div className="w-8 h-px bg-gold/30 mb-4 transition-all duration-300 group-hover:w-16 group-hover:bg-saffron" />
      <div className="text-navy-900 dark:text-cream/90 font-semibold text-base mb-2 transition-colors group-hover:text-saffron dark:group-hover:text-gold">
        {title}
      </div>
      <div className="text-slate-500 dark:text-cream/35 text-sm leading-relaxed">{desc}</div>
    </div>
  )
}

/* ─── Ticker items ──────────────────────────────────────────── */
const TICKER_ITEMS = [
  'Live Monitoring',
  'Howrah Sadar Subdivision',
  'Infrastructure Complaints',
  'Official Government Portal',
  'Real-time Status Tracking',
  'Powered by West Bengal Govt',
  'Civic Grievance Redressal',
  'Potholes · Drainage · Lighting · Waste',
]

/* ════════════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════════ */
export default function Home() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (data) setComplaints(data)
        setLoading(false)
      })
  }, [])

  const total      = complaints.length
  const pending    = complaints.filter(c => c.status === 'pending').length
  const inProgress = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length
  const resolved   = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length

  const categoryCounts = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="bg-white dark:bg-navy-950 transition-colors duration-300">

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-64px)] bg-gradient-to-br from-white via-orange-50/40 to-amber-50/60 dark:from-navy-900 dark:via-navy-900 dark:to-navy-900 gradient-breathe flex flex-col justify-center overflow-hidden">

        {/* Alpona geometric background — subtle in light mode */}
        <div className="absolute inset-0 alpona-bg pointer-events-none opacity-40 dark:opacity-100" />

        {/* Floating decorative blobs */}
        <div className="float-blob w-[420px] h-[420px] bg-saffron/25 dark:bg-gold/10 -top-20 -left-20" />
        <div className="float-blob float-blob-2 w-[340px] h-[340px] bg-amber-300/30 dark:bg-saffron/8 top-1/3 -right-24" />
        <div className="float-blob float-blob-3 w-[280px] h-[280px] bg-rose-200/40 dark:bg-rose-500/8 bottom-32 left-1/3" />

        {/* Radial atmospheric glow — switches palette per theme */}
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{
            background:
              'radial-gradient(ellipse at 80% 30%, rgba(224,120,24,0.10) 0%, transparent 50%), ' +
              'radial-gradient(ellipse at 15% 85%, rgba(20,140,180,0.06) 0%, transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{
            background:
              'radial-gradient(ellipse at 25% 45%, rgba(201,150,46,0.07) 0%, transparent 55%), ' +
              'radial-gradient(ellipse at 75% 65%, rgba(224,120,24,0.05) 0%, transparent 45%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">

          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2.5 border border-saffron/30 dark:border-gold/20 bg-saffron/10 dark:bg-gold/5 px-4 py-1.5 rounded-full text-[11px] text-saffron-dark dark:text-gold/70 font-semibold uppercase tracking-widest mb-8 animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Government of West Bengal · Howrah District
          </div>

          {/* Bengali script */}
          <div
            className="font-bengali text-2xl md:text-3xl text-navy-900/30 dark:text-cream/20 mb-3 animate-fade-in"
            style={{ animationDelay: '180ms' }}
          >
            হাওড়া সদর মহকুমা
          </div>

          {/* Main headline */}
          <h1
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-navy-900 dark:text-cream leading-[1.05] mb-6 animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            Your city, <br/>
            <span className="text-gold-gradient">your voice.</span><br />
            Heard.
          </h1>

          {/* Description */}
          <p
            className="text-slate-600 dark:text-cream/45 text-base md:text-lg max-w-lg leading-relaxed mb-12 animate-fade-up"
            style={{ animationDelay: '320ms' }}
          >
            Report potholes, drainage failures, streetlights, garbage — anything that needs fixing.
            We route it to the right officer and keep you updated until it's done.
          </p>

          {/* Stats row */}
          {!loading && (
            <div
              className="flex flex-wrap gap-8 md:gap-12 mb-14 animate-fade-up"
              style={{ animationDelay: '400ms' }}
            >
              <AnimatedStat value={total}      label="Reports Filed"    delay={400} />
              <AnimatedStat value={pending}    label="Awaiting Action"  delay={520} />
              <AnimatedStat value={inProgress} label="In Progress"      delay={640} />
              <AnimatedStat value={resolved}   label="Issues Resolved"  delay={760} />
            </div>
          )}
          {loading && (
            <div className="flex gap-10 mb-14">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-10 w-16 bg-slate-200 dark:bg-white/5 rounded mb-2"/>
                  <div className="h-3 w-20 bg-slate-200 dark:bg-white/5 rounded"/>
                </div>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div
            className="flex flex-wrap gap-4 animate-fade-up"
            style={{ animationDelay: '480ms' }}
          >
            <Link to="/services" className="btn-saffron btn-press shimmer-hover">
              Browse Govt Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-saffron/50 dark:text-gold/25 animate-bounce z-10">
          <ChevronDown className="w-6 h-6" />
        </div>

        {/* Howrah Bridge silhouette */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 opacity-70 dark:opacity-100">
          <BridgeSilhouette />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY-IT-WORKS TRUST BANNER
          ══════════════════════════════════════════════════ */}
      <WhyBanner />

      {/* ══════════════════════════════════════════════════════
          TICKER
          ══════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-saffron via-saffron-dark to-saffron dark:bg-[#060f1d] dark:from-[#060f1d] dark:via-[#060f1d] dark:to-[#060f1d] border-y border-white/10 dark:border-gold/8 py-3 overflow-hidden">
        <div className="ticker-track gap-12 text-[11px] text-white/95 dark:text-gold/35 font-semibold uppercase tracking-[0.18em]">
          {doubled.map((item, i) => (
            <span key={i} className="whitespace-nowrap px-6">
              ❋&nbsp; {item}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CIVIC ISSUES GRID
          ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-slate-50 to-white dark:bg-navy-900 dark:from-navy-900 dark:to-navy-900 py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="lotus-divider mb-5"><span>What We Monitor</span></div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">
              Civic Infrastructure Issues
            </h2>
            <p className="text-slate-500 dark:text-cream/35 text-base mt-4 max-w-xl mx-auto leading-relaxed">
              Every civic department in Howrah Sadar Subdivision is monitored through this portal.
              File a complaint under the right category for faster resolution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(ISSUE_CATEGORIES).map(([key, { icon, label }], i) => (
              <CategoryCard
                key={key}
                icon={icon}
                label={label}
                count={categoryCounts[key] || 0}
                delay={i * 60}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-500 dark:text-cream/40 text-xs italic">
              Complaints are received directly at the SDO Office — visit in person or send by post / email.
            </p>
          </div>
        </div>

        {/* Wave divider into the next section */}
        <WaveDivider to="white" />
      </section>

      {/* ══════════════════════════════════════════════════════
          LIVE MAP
          ══════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white dark:from-navy-950 dark:via-navy-950 dark:to-navy-950 py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="lotus-divider mb-5"><span>Live Data</span></div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">
              Live Complaint Map
            </h2>
            <p className="text-navy-700/55 dark:text-cream/35 text-base mt-3 max-w-lg mx-auto">
              Real-time view of all reported issues across Howrah Sadar — updated as complaints arrive.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-gold/15 shadow-xl dark:shadow-2xl">
            {loading
              ? <div className="h-[480px] bg-slate-100 dark:bg-navy-900/40 animate-pulse" />
              : <ComplaintMap complaints={complaints} height="480px" />
            }
          </div>
          {!loading && (
            <div className="flex justify-center gap-10 mt-8">
              {[
                { icon: TrendingUp, label: 'Total',       value: total,      color: 'text-navy-800 dark:text-cream'       },
                { icon: Clock,      label: 'Pending',     value: pending,    color: 'text-amber-700 dark:text-amber-400'  },
                { icon: Zap,        label: 'In Progress', value: inProgress, color: 'text-violet-700 dark:text-violet-400'},
                { icon: CheckCircle,label: 'Resolved',    value: resolved,   color: 'text-emerald-700 dark:text-emerald-400'},
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                  <div className={`font-serif text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-slate-500 dark:text-cream/40 text-xs uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-navy-900 py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="lotus-divider mb-5"><span>Process</span></div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                num: '01',
                title: 'File a Report',
                desc: 'Describe the issue, upload a photograph, and drop a pin at the exact location.',
              },
              {
                num: '02',
                title: 'Auto-Routed',
                desc: 'Your complaint is instantly assigned a unique number and routed to the concerned department.',
              },
              {
                num: '03',
                title: 'Officer Assigned',
                desc: 'A field officer is assigned for inspection and action within the stipulated time.',
              },
              {
                num: '04',
                title: 'Issue Resolved',
                desc: 'Track real-time status updates until your complaint is officially acknowledged and closed.',
              },
            ].map(({ num, title, desc }, i) => (
              <StepCard key={num} num={num} title={title} desc={desc} delay={i * 80} />
            ))}
          </div>
        </div>
        <WaveDivider to="slate-50" variant="layered" />
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIAL / IMPACT QUOTE
          ══════════════════════════════════════════════════ */}
      <Testimonial />

      {/* ══════════════════════════════════════════════════════
          FAQ
          ══════════════════════════════════════════════════ */}
      <FAQ />

      {/* ══════════════════════════════════════════════════════
          FINAL CTA — bright wide call to action
          ══════════════════════════════════════════════════ */}
      <FinalCTA />

      {/* ══════════════════════════════════════════════════════
          OFFICER CTA
          ══════════════════════════════════════════════════ */}
      <section className="bg-slate-50 dark:bg-[#060f1d] border-t border-slate-200 dark:border-gold/10 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gold/8 border border-gold/18 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="font-serif font-bold text-navy-900 dark:text-cream text-lg">Officer Portal</div>
                <div className="text-slate-500 dark:text-cream/35 text-sm mt-0.5">
                  Authorised officers — log in to manage complaints, assign tasks, and update statuses.
                </div>
              </div>
            </div>
            <Link to="/officer-login" className="btn-gold-outline btn-press shrink-0">
              Officer Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ════════════════════════════════════════════════════════
   WHY BANNER  ·  4 trust pillars under hero
   ════════════════════════════════════════════════════════ */
function WhyBanner() {
  const { ref, cls } = useReveal()
  const pillars = [
    { icon: ShieldCheck,   color: 'text-emerald-600 dark:text-emerald-400', label: 'Officially Routed',  desc: 'Every report goes to the assigned department head, not a black hole.' },
    { icon: Eye,           color: 'text-blue-600 dark:text-blue-400',       label: 'Live Tracking',      desc: 'See exactly which officer is handling your complaint, in real time.' },
    { icon: MessageCircle, color: 'text-saffron dark:text-saffron-light',   label: 'Direct Updates',     desc: 'Receive status changes the moment they happen — no guesswork.' },
    { icon: Sparkles,      color: 'text-violet-600 dark:text-violet-400',   label: 'Fast Resolution',    desc: 'Verified field officers act on issues within the stipulated SLA.' },
  ]
  return (
    <section ref={ref} className={`relative bg-white dark:bg-navy-950 py-16 md:py-20 ${cls}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger reveal-in">
          {pillars.map(({ icon: Icon, color, label, desc }) => (
            <div
              key={label}
              className="dark-card p-6 lift-hover group"
            >
              <div className={`w-12 h-12 rounded-xl bg-current/5 flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-navy-900 dark:text-cream font-bold text-base mb-1.5">{label}</div>
              <div className="text-slate-600 dark:text-cream/45 text-sm leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════
   TESTIMONIAL  ·  centred quote with photo accent
   ════════════════════════════════════════════════════════ */
function Testimonial() {
  const { ref, cls } = useReveal()
  return (
    <section className="relative bg-gradient-to-br from-saffron/5 via-white to-amber-50/40 dark:from-navy-900 dark:via-navy-900 dark:to-navy-900 py-20 md:py-28 overflow-hidden">
      {/* Decorative blobs */}
      <div className="float-blob w-[280px] h-[280px] bg-saffron/15 dark:bg-gold/8 -top-10 right-10" />
      <div className="float-blob float-blob-2 w-[200px] h-[200px] bg-blue-200/30 dark:bg-blue-400/8 bottom-0 left-10" />

      <div ref={ref} className={`max-w-3xl mx-auto px-6 text-center relative z-10 ${cls}`}>
        <div className="lotus-divider mb-7 max-w-xs mx-auto"><span>Voice of Howrah</span></div>

        <div className="relative inline-block mb-6">
          <span className="absolute -left-6 -top-2 text-7xl font-serif text-saffron/30 dark:text-gold/30 leading-none select-none">"</span>
          <p className="font-serif text-2xl md:text-3xl text-navy-900 dark:text-cream leading-snug italic">
            We reported a broken streetlight at 9 PM on a Tuesday. By Friday morning, it was fixed and the officer messaged us personally. This is what governance should feel like.
          </p>
          <span className="absolute -right-6 -bottom-8 text-7xl font-serif text-saffron/30 dark:text-gold/30 leading-none select-none">"</span>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-saffron to-saffron-dark flex items-center justify-center font-serif font-bold text-white text-xl shadow-lg">
            S
          </div>
          <div className="text-left">
            <div className="font-bold text-navy-900 dark:text-cream">Sourav Bhattacharya</div>
            <div className="text-slate-500 dark:text-cream/40 text-sm">Resident · Ward 28, Howrah</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════
   FAQ  ·  accordion with smooth grid expand
   ════════════════════════════════════════════════════════ */
const FAQS = [
  {
    q: 'How long does it take for my complaint to be addressed?',
    a: 'Most complaints are acknowledged within 24 hours and assigned to a field officer within 48 hours. The actual resolution time depends on the issue — a streetlight fix is usually under a week, while drainage work may take 2–3 weeks.',
  },
  {
    q: 'Do I need to sign up or create an account?',
    a: 'No. Citizens can file complaints anonymously. You only need to provide a mobile number so we can send you status updates and the unique complaint reference number.',
  },
  {
    q: 'Can I track who is handling my complaint?',
    a: 'Yes. Once a field officer is assigned, their name, designation and department appear on your complaint tracking page. The officer is officially accountable for the resolution.',
  },
  {
    q: 'What happens if my complaint is not resolved?',
    a: 'If no action is taken within the stipulated SLA, the complaint is automatically escalated to the department head, and then to the SDO. You can also follow up via the tracking page or call the SDO helpline.',
  },
  {
    q: 'Is this an official government portal?',
    a: 'Yes. This portal is operated by the Sub-Divisional Office, Howrah Sadar, under the Government of West Bengal. All officers are verified government staff.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const { ref, cls } = useReveal()

  return (
    <section className="relative bg-white dark:bg-navy-900 py-20 md:py-28">
      <div ref={ref} className={`max-w-3xl mx-auto px-6 ${cls}`}>
        <div className="text-center mb-14">
          <div className="lotus-divider mb-5 max-w-xs mx-auto"><span>Questions</span></div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">
            Frequently Asked
          </h2>
          <p className="text-slate-600 dark:text-cream/45 text-base mt-4 leading-relaxed">
            Everything you need to know about filing and tracking civic complaints.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="dark-card overflow-hidden lift-hover"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
                >
                  <span className="font-semibold text-navy-900 dark:text-cream text-base group-hover:text-saffron dark:group-hover:text-gold transition-colors">
                    {item.q}
                  </span>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? 'bg-saffron text-white rotate-180'
                      : 'bg-slate-100 dark:bg-white/8 text-navy-700 dark:text-cream/60'
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                  <div>
                    <p className="px-6 pb-5 text-slate-600 dark:text-cream/55 text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════
   FINAL CTA  ·  full-width vibrant call-to-action
   ════════════════════════════════════════════════════════ */
function FinalCTA() {
  const { ref, cls } = useReveal()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-saffron via-saffron-dark to-terracotta dark:from-navy-800 dark:via-navy-900 dark:to-navy-950 py-20 md:py-24 gradient-breathe">
      {/* Decorative shapes */}
      <div className="float-blob w-[400px] h-[400px] bg-white/15 dark:bg-gold/10 -top-20 -right-20" />
      <div className="float-blob float-blob-2 w-[300px] h-[300px] bg-white/10 dark:bg-saffron/8 bottom-0 -left-10" />

      <div ref={ref} className={`relative z-10 max-w-4xl mx-auto px-6 text-center ${cls}`}>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
          Government at your service.<br/>
          <span className="text-amber-100 dark:text-gold">All in one place.</span>
        </h2>
        <p className="text-white/80 dark:text-cream/60 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Browse welfare schemes, check land records, track existing complaints — find what you need from Howrah Sadar SDO.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2.5 bg-white text-saffron-dark dark:bg-saffron dark:text-white font-bold px-8 py-4 rounded-xl shadow-2xl hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-all duration-300 text-base"
          >
            Browse Govt Services
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
