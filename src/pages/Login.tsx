import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Shield, Eye, EyeOff, Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Tab = 'password' | 'link'

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab]           = useState<Tab>('password')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  /* ── Password login ── */
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  /* ── Magic-link / OTP login ── */
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setLinkSent(true); setLoading(false) }
  }

  return (
    <div className="min-h-[90vh] relative flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blob blob-1 -top-20 -left-32" />
      <div className="absolute w-[400px] h-[400px] bg-purple-600/20 rounded-full blob blob-2 -bottom-16 -right-24" />
      <div className="absolute w-[300px] h-[300px] bg-indigo-500/15 rounded-full blob blob-3 top-1/2 left-1/2" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="glass rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg glow-blue float-anim">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Howrah Sadar Subdivision — SDO Office</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6 gap-1">
            {([
              { key: 'password', label: 'Password Login' },
              { key: 'link',     label: 'Email Link'     },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); setLinkSent(false) }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── PASSWORD TAB ── */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sdo.gov.in"
                  required
                  autoFocus
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="input-modern pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100 animate-scale-in">
                  {error}
                  {error.toLowerCase().includes('invalid') && (
                    <button
                      type="button"
                      onClick={() => setTab('link')}
                      className="block mt-1.5 text-blue-600 hover:text-blue-800 font-semibold underline text-xs"
                    >
                      Try email link login instead →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 btn-press mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setTab('link'); setError('') }}
                className="w-full text-center text-xs text-gray-400 hover:text-blue-600 transition-colors mt-1"
              >
                First time / forgot password? → Get a login link
              </button>
            </form>
          )}

          {/* ── EMAIL LINK TAB ── */}
          {tab === 'link' && !linkSent && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-gray-500 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 leading-relaxed">
                Enter your admin email. We'll send a one-click login link — no password needed.
                Works even on first login.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vmpunk619@gmail.com"
                    required
                    autoFocus
                    className="input-modern pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100 animate-scale-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 btn-press"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? 'Sending…' : 'Send Login Link'}
              </button>

              <button
                type="button"
                onClick={() => { setTab('password'); setError('') }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to password login
              </button>
            </form>
          )}

          {/* ── LINK SENT SUCCESS ── */}
          {tab === 'link' && linkSent && (
            <div className="text-center py-4 animate-scale-in">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                A login link was sent to <span className="font-semibold text-gray-700">{email}</span>.
                Click it to access the admin dashboard.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Link expires in 1 hour. Check spam if not found.
              </p>
              <button
                onClick={() => { setLinkSent(false); setError('') }}
                className="mt-5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Resend or use different email
              </button>
            </div>
          )}

          {/* Footer */}
          {!(tab === 'link' && linkSent) && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link
                to="/officer-login"
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Are you a field officer? → Officer OTP Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
