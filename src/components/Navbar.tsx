import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../lib/theme'

const LINKS = [
  { to: '/',         label: 'Home'          },
  { to: '/services', label: 'Govt Services' },
]

function GovtEmblem() {
  const { theme } = useTheme()
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg viewBox="0 0 44 44" className="w-9 h-9 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20"  stroke="#c9962e" strokeWidth="1.2" opacity="0.75"/>
      <circle cx="22" cy="22" r="13"  stroke="#c9962e" strokeWidth="0.7" opacity="0.45"/>
      {petals.map(deg => {
        const r = (deg * Math.PI) / 180
        return (
          <circle
            key={deg}
            cx={22 + 16.5 * Math.cos(r)}
            cy={22 + 16.5 * Math.sin(r)}
            r="2.2"
            fill="#c9962e"
            opacity="0.7"
          />
        )
      })}
      <circle cx="22" cy="22" r="4"   fill="#c9962e" opacity="0.85"/>
      <circle cx="22" cy="22" r="1.8" fill={theme === 'dark' ? '#0d1b2a' : '#f5edd8'}/>
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Indian tricolor accent stripe */}
      <div className="flex h-[4px]">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Main navbar */}
      <nav className="bg-white/95 backdrop-blur-md dark:bg-navy-900 border-b border-slate-200/80 dark:border-gold/[0.18] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-5 h-[60px] flex items-center justify-between gap-6">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <GovtEmblem />
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-navy-900 dark:text-cream text-[15px] leading-tight tracking-wide group-hover:text-gold transition-colors">
                Howrah Sadar
              </div>
              <div className="text-gold/60 dark:text-gold/55 text-[9px] tracking-[0.18em] uppercase font-sans">
                Infrastructure Monitor
              </div>
            </div>
          </Link>

          {/* Bengali title — desktop only */}
          <div className="hidden lg:block font-bengali text-navy-900/15 dark:text-cream/20 text-sm select-none pointer-events-none">
            হাওড়া সদর মহকুমা
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200',
                  pathname === to
                    ? 'text-gold bg-gold/10 border border-gold/20'
                    : 'text-navy-800 hover:text-navy-950 hover:bg-gold/8 dark:text-cream/65 dark:hover:text-cream dark:hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/officer-login"
              className="ml-3 px-5 py-2 text-[13px] font-semibold border border-gold/40 text-gold-700 dark:text-gold rounded-lg hover:bg-gold/10 hover:border-gold/70 hover:shadow-[0_4px_14px_rgba(201,150,46,0.25)] hover:-translate-y-0.5 transition-all duration-200 shimmer-hover"
            >
              Officer Login
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="ml-2 p-2 rounded-lg text-navy-700 dark:text-cream/50 hover:text-gold dark:hover:text-gold hover:bg-gold/10 dark:hover:bg-gold/10 transition-all"
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden ml-auto flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-1.5 text-navy-700 dark:text-cream/50 hover:text-gold dark:hover:text-gold transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="text-navy-700 dark:text-cream/60 hover:text-navy-950 dark:hover:text-cream p-1.5 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gold/10 px-5 py-4 space-y-1 animate-fade-in bg-white dark:bg-navy-900">
            {LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-4 py-2.5 text-sm rounded-lg transition-colors',
                  pathname === to
                    ? 'text-gold bg-gold/10'
                    : 'text-navy-800 dark:text-cream/60 hover:text-navy-950 dark:hover:text-cream hover:bg-gold/8 dark:hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/officer-login"
              onClick={() => setOpen(false)}
              className="block mt-2 px-4 py-2.5 text-sm text-gold border border-gold/30 rounded-lg text-center hover:bg-gold/10 transition-colors"
            >
              Officer Login
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
