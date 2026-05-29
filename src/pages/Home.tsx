import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ChevronDown, Lock, MapPin, Sparkles,
  Landmark, Train, Phone, HeartHandshake, Compass,
  Plus, Minus, Calendar, Sun, Camera,
} from 'lucide-react'
import WaveDivider from '../components/WaveDivider'
import { useReveal } from '../hooks/useScrollReveal'
import { PLACES, HERO_SLIDES, FEATURED_NAMES, CATEGORY_STYLE, Place } from '../lib/tourism'

/* ─── Howrah Bridge silhouette SVG ─────────────────────────── */
function BridgeSilhouette() {
  const hangers = [618, 648, 678, 710, 740, 770, 800, 830]
  return (
    <svg viewBox="0 0 1440 210" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none" aria-hidden="true">
      <g stroke="#f5edd8" fill="none" strokeLinecap="square">
        <rect x="0" y="188" width="1440" height="5" fill="#f5edd8" opacity="0.22" stroke="none"/>
        <rect x="55" y="198" width="1330" height="2.5" fill="#f5edd8" opacity="0.1" stroke="none"/>
        <rect x="430" y="28" width="16" height="162" fill="#f5edd8" opacity="0.2" stroke="none"/>
        <rect x="470" y="28" width="16" height="162" fill="#f5edd8" opacity="0.2" stroke="none"/>
        <rect x="422" y="20" width="72" height="13" fill="#f5edd8" opacity="0.26" stroke="none"/>
        {[62, 102, 142].map(y => (<rect key={y} x="430" y={y} width="56" height="5" fill="#f5edd8" opacity="0.18" stroke="none"/>))}
        <line x1="430" y1="28"  x2="486" y2="62"  strokeWidth="2.5" opacity="0.2"/>
        <line x1="486" y1="28"  x2="430" y2="62"  strokeWidth="2.5" opacity="0.2"/>
        <line x1="430" y1="62"  x2="486" y2="102" strokeWidth="2.5" opacity="0.2"/>
        <line x1="486" y1="62"  x2="430" y2="102" strokeWidth="2.5" opacity="0.2"/>
        <line x1="430" y1="102" x2="486" y2="142" strokeWidth="2.5" opacity="0.2"/>
        <line x1="486" y1="102" x2="430" y2="142" strokeWidth="2.5" opacity="0.2"/>
        <rect x="954" y="28" width="16" height="162" fill="#f5edd8" opacity="0.2" stroke="none"/>
        <rect x="994" y="28" width="16" height="162" fill="#f5edd8" opacity="0.2" stroke="none"/>
        <rect x="946" y="20" width="72" height="13" fill="#f5edd8" opacity="0.26" stroke="none"/>
        {[62, 102, 142].map(y => (<rect key={y} x="954" y={y} width="56" height="5" fill="#f5edd8" opacity="0.18" stroke="none"/>))}
        <line x1="954"  y1="28"  x2="1010" y2="62"  strokeWidth="2.5" opacity="0.2"/>
        <line x1="1010" y1="28"  x2="954"  y2="62"  strokeWidth="2.5" opacity="0.2"/>
        <line x1="954"  y1="62"  x2="1010" y2="102" strokeWidth="2.5" opacity="0.2"/>
        <line x1="1010" y1="62"  x2="954"  y2="102" strokeWidth="2.5" opacity="0.2"/>
        <line x1="954"  y1="102" x2="1010" y2="142" strokeWidth="2.5" opacity="0.2"/>
        <line x1="1010" y1="102" x2="954"  y2="142" strokeWidth="2.5" opacity="0.2"/>
        <line x1="438" y1="188" x2="55"  y2="198" strokeWidth="3.5" opacity="0.26"/>
        <line x1="438" y1="145" x2="200" y2="188" strokeWidth="2"   opacity="0.2"/>
        <line x1="438" y1="102" x2="315" y2="188" strokeWidth="1.5" opacity="0.16"/>
        <line x1="478" y1="145" x2="615" y2="188" strokeWidth="2"   opacity="0.2"/>
        <line x1="478" y1="102" x2="695" y2="188" strokeWidth="1.5" opacity="0.16"/>
        <line x1="1002" y1="188" x2="1385" y2="198" strokeWidth="3.5" opacity="0.26"/>
        <line x1="1002" y1="145" x2="1240" y2="188" strokeWidth="2"   opacity="0.2"/>
        <line x1="1002" y1="102" x2="1125" y2="188" strokeWidth="1.5" opacity="0.16"/>
        <line x1="962" y1="145" x2="825"  y2="188" strokeWidth="2"   opacity="0.2"/>
        <line x1="962" y1="102" x2="745"  y2="188" strokeWidth="1.5" opacity="0.16"/>
        <line x1="615" y1="168" x2="825" y2="168" strokeWidth="2" opacity="0.18"/>
        {hangers.map(x => (<line key={x} x1={x} y1="168" x2={x} y2="188" strokeWidth="1.5" opacity="0.18"/>))}
      </g>
    </svg>
  )
}

/* ─── Animated counter ──────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = '', delay = 0 }: { value: number; label: string; suffix?: string; delay?: number }) {
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
      <div className="font-serif text-4xl md:text-5xl font-bold text-saffron dark:text-gold-400">{display}{suffix}</div>
      <div className="text-slate-500 dark:text-cream/40 text-[11px] uppercase tracking-widest mt-1.5 font-sans">{label}</div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   HERO  ·  auto-rotating cinematic landmark slideshow
   ════════════════════════════════════════════════════════ */
function Hero() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % HERO_SLIDES.length), 5500)
    return () => clearInterval(t)
  }, [])
  const slide = HERO_SLIDES[i]
  const goExplore = () => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-navy-950 flex flex-col justify-center">
      {/* Crossfading gradient slides with slow ken-burns zoom */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={s.name}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${idx === i ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={idx !== i}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} ${idx === i ? 'ken-burns' : ''}`} />
          {/* Legibility wash — keeps the hero cinematic-dark in both themes */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/30" />
          {/* Oversized motif watermark */}
          <div className="absolute right-2 sm:right-10 md:right-24 top-1/2 -translate-y-1/2 text-[150px] sm:text-[240px] md:text-[340px] leading-none opacity-20 select-none drift-slow pointer-events-none">
            {s.emoji}
          </div>
        </div>
      ))}

      {/* Alpona texture + drifting blobs */}
      <div className="absolute inset-0 alpona-bg opacity-25 pointer-events-none" />
      <div className="float-blob w-[420px] h-[420px] bg-gold/10 -top-20 -left-20" />
      <div className="float-blob float-blob-2 w-[320px] h-[320px] bg-saffron/10 bottom-32 left-1/4" />

      {/* Content — keyed so it re-animates on every slide change */}
      <div key={i} className="relative z-10 max-w-7xl mx-auto px-6 w-full py-16 md:py-24">
        <div className="inline-flex items-center gap-2.5 border border-gold/25 bg-gold/10 px-4 py-1.5 rounded-full text-[11px] text-gold/80 font-semibold uppercase tracking-widest mb-7 animate-fade-in">
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
          </span>
          Discover Howrah · West Bengal
        </div>

        <div className="font-bengali text-2xl md:text-3xl text-cream/40 mb-2 animate-fade-in" style={{ animationDelay: '120ms' }}>
          {slide.bengali}
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-cream leading-[1.04] mb-5 animate-fade-up" style={{ animationDelay: '180ms' }}>
          {slide.name}
        </h1>

        <p className="text-cream/65 text-base md:text-lg max-w-xl leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '260ms' }}>
          {slide.blurb}
        </p>

        <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '340ms' }}>
          <button onClick={goExplore} className="btn-saffron btn-press shimmer-hover">
            Explore Places to Visit
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/services" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-cream border border-cream/20 font-semibold px-7 py-4 rounded-xl transition-all duration-200">
            Citizen Services
          </Link>
        </div>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {HERO_SLIDES.map((s, idx) => (
          <button
            key={s.name}
            onClick={() => setI(idx)}
            aria-label={`Show ${s.name}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? 'w-8 bg-gold' : 'w-1.5 bg-cream/35 hover:bg-cream/60'}`}
          />
        ))}
      </div>

      <button onClick={goExplore} aria-label="Scroll to explore" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gold/40 hover:text-gold animate-bounce z-20">
        <ChevronDown className="w-6 h-6" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 opacity-80">
        <BridgeSilhouette />
      </div>
    </section>
  )
}

/* ─── Tourism marquee strip ─────────────────────────────────── */
const TICKER_ITEMS = [
  'Belur Math', 'Howrah Bridge', 'The Great Banyan', 'Vidyasagar Setu',
  'Santragachi Jheel', 'Gadiara', 'Garchumuk', 'Botanical Garden',
  'Heritage of Bengal', 'Rivers & Temples',
]

/* ─── Place card ────────────────────────────────────────────── */
function PlaceCard({ p, i }: { p: Place; i: number }) {
  const s = CATEGORY_STYLE[p.category]
  return (
    <div className="dark-card overflow-hidden lift-hover group animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} transition-transform duration-[900ms] ease-out group-hover:scale-110`} />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
          {p.emoji}
        </div>
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.chip}`}>
          {p.category}
        </span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/85 text-navy-800 flex items-center gap-1">
          <MapPin className="w-3 h-3" />{p.distance}
        </span>
      </div>
      <div className="p-5">
        <div className="font-serif text-lg font-bold text-navy-900 dark:text-cream group-hover:text-saffron dark:group-hover:text-gold transition-colors">
          {p.name}
        </div>
        <div className="font-bengali text-sm text-navy-900/35 dark:text-cream/30 mb-2">{p.bengali}</div>
        <p className="text-slate-600 dark:text-cream/45 text-sm leading-relaxed">{p.blurb}</p>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-xs font-semibold text-saffron dark:text-gold">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />{p.highlight}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════════ */
export default function Home() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="bg-white dark:bg-navy-950 transition-colors duration-300">
      <Hero />

      {/* Marquee */}
      <div className="bg-gradient-to-r from-saffron via-saffron-dark to-saffron dark:from-[#060f1d] dark:via-[#060f1d] dark:to-[#060f1d] border-y border-white/10 dark:border-gold/8 py-3 overflow-hidden">
        <div className="ticker-track gap-12 text-[11px] text-white/95 dark:text-gold/35 font-semibold uppercase tracking-[0.18em]">
          {doubled.map((item, i) => (
            <span key={i} className="whitespace-nowrap px-6">❋&nbsp; {item}</span>
          ))}
        </div>
      </div>

      {/* ══ PLACES TO VISIT ══ */}
      <section id="explore" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white dark:from-navy-900 dark:to-navy-900 py-20 md:py-28 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="lotus-divider mb-5 max-w-xs mx-auto"><span>Explore Howrah</span></div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">Places to Visit</h2>
            <p className="text-slate-500 dark:text-cream/35 text-base mt-4 max-w-xl mx-auto leading-relaxed">
              From colonial bridges and sacred riverside temples to ancient banyans and three-river confluences —
              Howrah Sadar is home to some of Bengal’s most loved landmarks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLACES.map((p, i) => <PlaceCard key={p.name} p={p} i={i} />)}
          </div>
        </div>
        <WaveDivider to="white" />
      </section>

      {/* ══ SPOTLIGHT ══ */}
      <Spotlight />

      {/* ══ QUICK FACTS ══ */}
      <section className="bg-white dark:bg-navy-950 py-16 md:py-20 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <AnimatedStat value={8}    label="Landmarks to Explore" delay={0} />
            <AnimatedStat value={1943} label="Howrah Bridge Opened" delay={120} />
            <AnimatedStat value={270}  suffix="+" label="Acres of Gardens" delay={240} />
            <AnimatedStat value={1897} label="Belur Math Founded" delay={360} />
          </div>
        </div>
      </section>

      {/* ══ PUBLIC BENEFITS ══ */}
      <PublicBenefits />

      {/* ══ VISITOR FAQ ══ */}
      <VisitorFAQ />

      {/* ══ FINAL CTA ══ */}
      <FinalCTA />

      {/* ══ OFFICER CTA ══ */}
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

/* ════════════════════════════════════════════════════════════
   SPOTLIGHT  ·  large alternating featured destinations
   ════════════════════════════════════════════════════════ */
function Spotlight() {
  const { ref, cls } = useReveal()
  const featured = FEATURED_NAMES
    .map(n => PLACES.find(p => p.name === n))
    .filter((p): p is Place => Boolean(p))

  return (
    <section className="relative bg-gradient-to-b from-white via-slate-50 to-white dark:from-navy-950 dark:via-navy-950 dark:to-navy-950 py-20 md:py-28 overflow-hidden transition-colors duration-300">
      <div className="float-blob w-[300px] h-[300px] bg-saffron/10 dark:bg-gold/8 top-10 -right-20" />
      <div ref={ref} className={`max-w-6xl mx-auto px-6 space-y-16 md:space-y-24 ${cls}`}>
        {featured.map((p, idx) => {
          const reverse = idx % 2 === 1
          const s = CATEGORY_STYLE[p.category]
          return (
            <div key={p.name} className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
              {/* Media */}
              <div className={`relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl group ${reverse ? 'md:order-2' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} ken-burns`} />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 flex items-center justify-center text-[120px] md:text-[160px] drop-shadow-2xl drift-slow select-none">
                  {p.emoji}
                </div>
              </div>
              {/* Text */}
              <div className={reverse ? 'md:order-1' : ''}>
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 ${s.chip}`}>
                  {p.category}
                </span>
                <h3 className="font-serif text-3xl md:text-4xl font-bold text-navy-900 dark:text-cream mb-1">{p.name}</h3>
                <div className="font-bengali text-lg text-navy-900/30 dark:text-cream/30 mb-4">{p.bengali}</div>
                <p className="text-slate-600 dark:text-cream/50 text-base leading-relaxed mb-5">{p.blurb}</p>
                <div className="flex flex-wrap gap-5 text-sm">
                  <span className="flex items-center gap-2 text-saffron dark:text-gold font-semibold">
                    <Sparkles className="w-4 h-4" />{p.highlight}
                  </span>
                  <span className="flex items-center gap-2 text-slate-500 dark:text-cream/40">
                    <MapPin className="w-4 h-4" />{p.distance} from Howrah Sadar
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   PUBLIC BENEFITS  ·  what the portal offers citizens
   ════════════════════════════════════════════════════════ */
function PublicBenefits() {
  const { ref, cls } = useReveal()
  const items = [
    { icon: HeartHandshake, color: 'text-emerald-600 dark:text-emerald-400', label: 'Government Schemes', desc: 'Welfare schemes, certificates and entitlements for citizens of Howrah Sadar.', to: '/services' as const },
    { icon: Landmark,       color: 'text-amber-600 dark:text-amber-400',     label: 'Tourism & Heritage', desc: 'Discover the bridges, temples, gardens and rivers that define the subdivision.', to: '#explore' as const },
    { icon: Train,          color: 'text-blue-600 dark:text-blue-400',       label: 'Getting Around',     desc: 'Howrah Station and ferry ghats connect you across Bengal and to Kolkata.', to: '/services' as const },
    { icon: Phone,          color: 'text-saffron dark:text-saffron-light',   label: 'Emergency Helpline', desc: 'Round-the-clock SDO helpline for citizens — call 033-2638-1000.', to: 'tel:03326381000' as const },
  ]
  return (
    <section ref={ref} className={`relative bg-slate-50 dark:bg-navy-900 py-20 md:py-28 transition-colors duration-300 ${cls}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="lotus-divider mb-5 max-w-xs mx-auto"><span>For Citizens</span></div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">Built for the Public</h2>
          <p className="text-slate-500 dark:text-cream/35 text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Beyond tourism, the Howrah Sadar portal is your single window to government services and support.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger reveal-in">
          {items.map(({ icon: Icon, color, label, desc, to }) => {
            const inner = (
              <>
                <div className={`w-12 h-12 rounded-xl bg-current/5 flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-navy-900 dark:text-cream font-bold text-base mb-1.5">{label}</div>
                <div className="text-slate-600 dark:text-cream/45 text-sm leading-relaxed">{desc}</div>
              </>
            )
            const cn = 'dark-card p-6 lift-hover group block'
            if (to.startsWith('#')) {
              return <a key={label} href={to} className={cn}>{inner}</a>
            }
            if (to.startsWith('tel:')) {
              return <a key={label} href={to} className={cn}>{inner}</a>
            }
            return <Link key={label} to={to} className={cn}>{inner}</Link>
          })}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   VISITOR FAQ
   ════════════════════════════════════════════════════════ */
const FAQS = [
  { icon: Train, q: 'How do I reach Howrah?', a: 'Howrah Station — one of India’s largest railway terminals — connects directly to most major cities. From Kolkata, the Howrah Bridge, Vidyasagar Setu and regular ferries across the Hooghly bring you into the subdivision within minutes.' },
  { icon: Calendar, q: 'When is the best time to visit?', a: 'October to March is ideal — pleasant weather, the migratory birds at Santragachi Jheel, and the grandeur of Durga Puja and Kali Puja lighting up the riverside. Belur Math is especially serene around the winter festivals.' },
  { icon: Camera, q: 'Which spots are best for a day trip?', a: 'For a relaxed day out, Garchumuk and Gadiara offer riverside picnics and confluence views. Within the city, pair Belur Math with the Indian Botanic Garden and the Great Banyan for an easy half-day of heritage and greenery.' },
  { icon: Sun, q: 'Is there an entry fee for the gardens and temples?', a: 'The Indian Botanic Garden charges a small entry ticket. Belur Math is free to enter, with modest timings around morning and evening aarti. Always check current local timings before you travel.' },
  { icon: Compass, q: 'Is this an official government portal?', a: 'Yes. This portal is operated by the Sub-Divisional Office, Howrah Sadar, under the Government of West Bengal — combining visitor information with citizen services and grievance redressal.' },
]

function VisitorFAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const { ref, cls } = useReveal()
  return (
    <section className="relative bg-white dark:bg-navy-950 py-20 md:py-28 transition-colors duration-300">
      <div ref={ref} className={`max-w-3xl mx-auto px-6 ${cls}`}>
        <div className="text-center mb-14">
          <div className="lotus-divider mb-5 max-w-xs mx-auto"><span>Plan Your Visit</span></div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy-900 dark:text-cream">Visitor Information</h2>
          <p className="text-slate-600 dark:text-cream/45 text-base mt-4 leading-relaxed">
            Everything you need to know before exploring Howrah Sadar.
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            const Icon = item.icon
            return (
              <div key={i} className="dark-card overflow-hidden lift-hover">
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group">
                  <span className="flex items-center gap-3 font-semibold text-navy-900 dark:text-cream text-base group-hover:text-saffron dark:group-hover:text-gold transition-colors">
                    <Icon className="w-4 h-4 text-saffron dark:text-gold shrink-0" />
                    {item.q}
                  </span>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-saffron text-white rotate-180' : 'bg-slate-100 dark:bg-white/8 text-navy-700 dark:text-cream/60'}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                  <div><p className="px-6 pb-5 text-slate-600 dark:text-cream/55 text-sm leading-relaxed">{item.a}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   FINAL CTA
   ════════════════════════════════════════════════════════ */
function FinalCTA() {
  const { ref, cls } = useReveal()
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-saffron via-saffron-dark to-terracotta dark:from-navy-800 dark:via-navy-900 dark:to-navy-950 py-20 md:py-24 gradient-breathe">
      <div className="float-blob w-[400px] h-[400px] bg-white/15 dark:bg-gold/10 -top-20 -right-20" />
      <div className="float-blob float-blob-2 w-[300px] h-[300px] bg-white/10 dark:bg-saffron/8 bottom-0 -left-10" />
      <div ref={ref} className={`relative z-10 max-w-4xl mx-auto px-6 text-center ${cls}`}>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
          Heritage, rivers & service.<br />
          <span className="text-amber-100 dark:text-gold">All of Howrah, in one place.</span>
        </h2>
        <p className="text-white/80 dark:text-cream/60 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Explore the landmarks of the subdivision, then browse the welfare schemes and citizen services offered by Howrah Sadar SDO.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#explore" className="inline-flex items-center gap-2.5 bg-white text-saffron-dark dark:bg-saffron dark:text-white font-bold px-8 py-4 rounded-xl shadow-2xl hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-all duration-300 text-base">
            Explore Places <Compass className="w-5 h-5" />
          </a>
          <Link to="/services" className="inline-flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border border-white/30 font-bold px-8 py-4 rounded-xl transition-all duration-300 text-base">
            Browse Govt Services <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
