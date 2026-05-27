import { Outlet, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { Phone, MapPin, Shield } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 font-sans transition-colors duration-300">
      <Navbar />
      {/* pt-[64px] offsets the fixed navbar (4px stripe + 60px bar) */}
      <main className="pt-[64px]">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-gold/10 transition-colors duration-300">
        {/* Tricolor stripe */}
        <div className="flex h-[3px]">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-navy-900/20 dark:bg-white/40" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto px-5 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="font-serif font-bold text-navy-900 dark:text-cream text-sm">Howrah Sadar</div>
                  <div className="text-gold/60 dark:text-gold/50 text-[10px] tracking-widest uppercase">Infrastructure Monitor</div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-cream/30 text-xs leading-relaxed max-w-xs">
                An official civic grievance portal under the Sub-Divisional Office, Howrah Sadar, Government of West Bengal.
              </p>
              <div className="mt-5 font-bengali text-navy-900/20 dark:text-cream/15 text-base">
                সরকারি পরিষেবায় স্বাগতম
              </div>
            </div>

            {/* Quick links */}
            <div>
              <div className="lotus-divider mb-5 text-[10px]"><span>Quick Access</span></div>
              <ul className="space-y-2.5">
                {[
                  { to: '/',         label: 'Home' },
                  { to: '/services', label: 'Govt Schemes & Services' },
                  { to: '/login',    label: 'Admin / Officer Login' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-slate-600 dark:text-cream/40 hover:text-gold text-xs transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="lotus-divider mb-5 text-[10px]"><span>Contact</span></div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-gold/60 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-700 dark:text-cream/60 text-xs font-semibold">Emergency Helpline</div>
                    <div className="text-gold text-base font-serif font-bold mt-0.5">033-2638-1000</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gold/60 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-700 dark:text-cream/60 text-xs font-semibold">Sub-Divisional Office</div>
                    <div className="text-slate-500 dark:text-cream/35 text-xs mt-0.5 leading-relaxed">
                      Howrah Sadar, West Bengal<br/>Government of India
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-navy-900/10 dark:border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-navy-900/30 dark:text-cream/20 text-[11px]">
              © 2025 Howrah Sadar Sub-Divisional Office · Government of West Bengal
            </div>
            <div className="text-navy-900/20 dark:text-cream/15 text-[11px] font-bengali">
              পশ্চিমবঙ্গ সরকার
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
