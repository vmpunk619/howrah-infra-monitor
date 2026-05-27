import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, X, ExternalLink, ChevronDown, CheckCircle2, FileText,
  MapPin, Sparkles, ArrowRight, Building2, Info, Phone,
} from 'lucide-react'
import { SCHEMES, SCHEME_STATS, CATEGORY_META, type Scheme, type SchemeCategory } from '../lib/schemes'
import { useReveal } from '../hooks/useScrollReveal'
import clsx from 'clsx'

type Filter = '' | SchemeCategory

export default function Services() {
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState<Filter>('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SCHEMES.filter(s => {
      if (filter && s.category !== filter) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.short || '').toLowerCase().includes(q) ||
        s.objective.toLowerCase().includes(q) ||
        s.benefits?.some(b => b.toLowerCase().includes(q))
      )
    })
  }, [query, filter])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white dark:bg-navy-950 transition-colors duration-300">

      {/* ════════════ HERO ════════════ */}
      <Hero />

      {/* ════════════ SEARCH + FILTERS ════════════ */}
      <section className="sticky top-[64px] z-30 bg-white/95 dark:bg-navy-950/90 backdrop-blur-md border-b border-slate-200 dark:border-gold/10 py-3">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search schemes by name, benefit, keyword…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-gold/20 bg-white dark:bg-navy-900 text-sm text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterPill label="All Schemes" active={filter === ''} onClick={() => setFilter('')} count={SCHEMES.length} />
            <FilterPill label="🇮🇳 Central" active={filter === 'central'} onClick={() => setFilter('central')} count={SCHEME_STATS.central} />
            <FilterPill label="🌾 West Bengal" active={filter === 'state'} onClick={() => setFilter('state')} count={SCHEME_STATS.state} />
            <FilterPill label="📜 Land" active={filter === 'land'} onClick={() => setFilter('land')} count={SCHEME_STATS.land} />
          </div>
        </div>
      </section>

      {/* ════════════ SCHEMES GRID ════════════ */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No schemes match your search.</p>
              <button onClick={() => { setQuery(''); setFilter('') }} className="mt-3 text-saffron-dark hover:text-saffron font-semibold text-xs">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {(['central', 'state', 'land'] as SchemeCategory[]).map(cat => {
                if (filter && filter !== cat) return null
                const inCat = filtered.filter(s => s.category === cat)
                if (inCat.length === 0) return null
                const meta = CATEGORY_META[cat]
                return (
                  <CategorySection key={cat} title={meta.label} icon={meta.icon}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {inCat.map(s => (
                        <SchemeCard
                          key={s.id}
                          scheme={s}
                          expanded={expanded.has(s.id)}
                          onToggle={() => toggle(s.id)}
                        />
                      ))}
                    </div>
                  </CategorySection>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════ CONTACT BANNER ════════════ */}
      <ContactBanner />

      {/* ════════════ DISCLAIMER ════════════ */}
      <section className="py-10 bg-slate-50 dark:bg-navy-900/60 border-t border-slate-200 dark:border-gold/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-cream/40 leading-relaxed">
            Information is compiled from official government portals and updated periodically.
            Eligibility criteria, document requirements and benefit amounts may change — always
            verify with the linked official website or the concerned office before applying.
            For doubts, visit the <Link to="/" className="text-saffron-dark dark:text-gold font-semibold hover:underline">SDO Office, Howrah Sadar</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-white via-orange-50/40 to-amber-50/60 dark:from-navy-900 dark:via-navy-900 dark:to-navy-900 py-20 md:py-28 overflow-hidden">
      <div className="float-blob w-[400px] h-[400px] bg-saffron/15 dark:bg-gold/10 -top-20 -right-20" />
      <div className="float-blob float-blob-2 w-[300px] h-[300px] bg-blue-200/30 dark:bg-blue-400/8 -bottom-10 -left-10" />
      <div className="absolute inset-0 alpona-bg pointer-events-none opacity-30 dark:opacity-100" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2.5 border border-saffron/30 dark:border-gold/20 bg-saffron/10 dark:bg-gold/5 px-4 py-1.5 rounded-full text-[11px] text-saffron-dark dark:text-gold/70 font-semibold uppercase tracking-widest mb-6 animate-fade-in">
          <Sparkles className="w-3 h-3" />
          {SCHEME_STATS.total}+ Government Schemes & Services
        </div>

        <div className="font-bengali text-2xl md:text-3xl text-navy-900/30 dark:text-cream/20 mb-3 animate-fade-in">
          সরকারি প্রকল্প ও পরিষেবা
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy-900 dark:text-cream leading-[1.1] mb-5 animate-fade-up">
          Government Schemes <br/>
          <span className="text-gold-gradient">& Citizen Services</span>
        </h1>

        <p className="text-slate-600 dark:text-cream/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-up">
          Welfare, housing, livelihood, healthcare, land records — everything a citizen of Howrah
          Sadar can avail from the Central and West Bengal governments, with eligibility, documents
          and where-to-apply clearly listed.
        </p>

        <div className="flex flex-wrap justify-center gap-3 text-xs animate-fade-up">
          <StatBadge value={SCHEME_STATS.central} label="Central Schemes"  tone="orange" />
          <StatBadge value={SCHEME_STATS.state}   label="State Schemes"    tone="emerald" />
          <StatBadge value={SCHEME_STATS.land}    label="Land Services"    tone="amber" />
        </div>
      </div>
    </section>
  )
}

function StatBadge({ value, label, tone }: { value: number; label: string; tone: 'orange' | 'emerald' | 'amber' }) {
  const tones = {
    orange:  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30',
    amber:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${tones} font-semibold`}>
      <span className="text-base font-bold">{value}</span> {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   CATEGORY SECTION (wrapper with scroll reveal)
   ═══════════════════════════════════════════════════════════ */
function CategorySection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const { ref, cls } = useReveal()
  return (
    <section ref={ref} className={cls}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{icon}</span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy-900 dark:text-cream">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gold/40 to-transparent ml-3" />
      </div>
      {children}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SCHEME CARD
   ═══════════════════════════════════════════════════════════ */
function SchemeCard({ scheme, expanded, onToggle }: { scheme: Scheme; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={clsx(
      'dark-card overflow-hidden transition-all duration-300',
      expanded && 'ring-2 ring-saffron/30 shadow-lg'
    )}>
      {/* Summary header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 hover:bg-saffron/5 dark:hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl shrink-0">{scheme.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-bold text-navy-900 dark:text-cream text-base leading-snug">{scheme.name}</div>
              <ChevronDown className={clsx(
                'w-5 h-5 shrink-0 text-slate-400 transition-transform duration-300',
                expanded && 'rotate-180 text-saffron'
              )} />
            </div>
            {scheme.short && (
              <div className="text-[11px] font-mono font-semibold text-saffron-dark dark:text-gold/70 mb-2 uppercase tracking-wide">
                {scheme.short}
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-cream/55 leading-relaxed">
              {scheme.objective}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <div className={clsx('accordion-content', expanded && 'open')}>
        <div>
          <div className="border-t border-slate-200 dark:border-gold/10 p-5 space-y-5 bg-slate-50/50 dark:bg-navy-900/40">

            {/* Benefits */}
            {scheme.benefits && scheme.benefits.length > 0 && (
              <DetailBlock icon={Sparkles} title="Key Benefits" tone="emerald">
                <ul className="space-y-1.5">
                  {scheme.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </DetailBlock>
            )}

            {/* Eligibility */}
            <DetailBlock icon={CheckCircle2} title="Who Can Apply (Eligibility)" tone="blue">
              <ul className="space-y-1.5">
                {scheme.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-cream/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                    <span className="leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            </DetailBlock>

            {/* Documents */}
            <DetailBlock icon={FileText} title="Documents Required" tone="amber">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                {scheme.documents.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-cream/70">
                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{d}</span>
                  </div>
                ))}
              </div>
            </DetailBlock>

            {/* Where to apply */}
            <DetailBlock icon={MapPin} title="Where to Apply" tone="rose">
              <div className="space-y-1.5">
                {scheme.whereToApply.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-navy-800 dark:text-cream/70">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            </DetailBlock>

            {/* Websites */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-gold/10">
              {scheme.websites.map((w, i) => (
                <a
                  key={i}
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-saffron to-saffron-dark text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-saffron/25 hover:-translate-y-0.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Visit {w.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   DETAIL BLOCK (for benefits/eligibility/docs/where)
   ═══════════════════════════════════════════════════════════ */
function DetailBlock({
  icon: Icon, title, tone, children,
}: { icon: React.ElementType; title: string; tone: 'emerald' | 'blue' | 'amber' | 'rose'; children: React.ReactNode }) {
  const tones = {
    emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/15 border-emerald-200/60 dark:border-emerald-800/30',
    blue:    'text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/15 border-blue-200/60 dark:border-blue-800/30',
    amber:   'text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-900/15 border-amber-200/60 dark:border-amber-800/30',
    rose:    'text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-900/15 border-rose-200/60 dark:border-rose-800/30',
  }[tone]
  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider mb-2.5 ${tones}`}>
        <Icon className="w-3 h-3" />
        {title}
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FILTER PILL
   ═══════════════════════════════════════════════════════════ */
function FilterPill({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
        active
          ? 'bg-saffron text-white shadow-md shadow-saffron/30'
          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-cream/70 hover:bg-slate-200 dark:hover:bg-white/10'
      )}
    >
      {label}
      <span className={clsx(
        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
        active ? 'bg-white/25' : 'bg-slate-200 dark:bg-white/10'
      )}>{count}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════
   CONTACT BANNER
   ═══════════════════════════════════════════════════════════ */
function ContactBanner() {
  const { ref, cls } = useReveal()
  return (
    <section ref={ref} className={`relative overflow-hidden bg-gradient-to-br from-saffron via-saffron-dark to-terracotta dark:from-navy-800 dark:via-navy-900 dark:to-navy-950 py-16 md:py-20 gradient-breathe ${cls}`}>
      <div className="float-blob w-[400px] h-[400px] bg-white/15 dark:bg-gold/10 -top-20 -right-20" />
      <div className="float-blob float-blob-2 w-[300px] h-[300px] bg-white/10 dark:bg-saffron/8 -bottom-10 -left-10" />

      <div className="relative max-w-4xl mx-auto px-6 text-center text-white">
        <Building2 className="w-10 h-10 mx-auto mb-4 opacity-90" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3">
          Need help with an application?
        </h2>
        <p className="text-white/85 dark:text-cream/60 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          Visit the SDO Office, Howrah Sadar — our staff will guide you through eligibility,
          fill out forms, and verify your documents. Free of cost.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="tel:03326381000"
            className="inline-flex items-center gap-2.5 bg-white text-saffron-dark dark:bg-saffron dark:text-white font-bold px-7 py-3.5 rounded-xl shadow-2xl hover:scale-105 transition-all"
          >
            <Phone className="w-4 h-4" /> Call SDO Office · 033-2638-1000
          </a>
          <a
            href="mailto:sdo.howrah@gov.in"
            className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/20 hover:border-white transition-all"
          >
            Email SDO Office <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
