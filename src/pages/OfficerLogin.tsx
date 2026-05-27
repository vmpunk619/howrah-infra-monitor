import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Shield, ArrowRight, RefreshCw, Sun, Moon, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'

/* Six individual OTP digit boxes */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !refs[i].current?.value && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    arr[i] = digit
    const next = arr.join('').padEnd(6, ' ').slice(0, 6)
    onChange(next.trimEnd())
    if (digit && i < 5) refs[i + 1].current?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text) {
      onChange(text)
      refs[Math.min(text.length, 5)].current?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-3 justify-center">
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-300 dark:border-gold/30 bg-white dark:bg-navy-800 text-navy-900 dark:text-cream focus:outline-none focus:border-saffron dark:focus:border-gold focus:ring-4 focus:ring-saffron/20 dark:focus:ring-gold/20 transition-all"
        />
      ))}
    </div>
  )
}

type Mode = 'password' | 'otp' | 'forgot'

export default function OfficerLogin() {
  const navigate  = useNavigate()
  const { theme, toggle } = useTheme()
  const [mode, setMode]           = useState<Mode>('password')
  const [identifier, setIdentifier] = useState('')        // email or username
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [otpStep, setOtpStep]     = useState<'email' | 'otp'>('email')
  const [otp, setOtp]             = useState('')
  const [officerName, setOfficerName] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [info, setInfo]           = useState('')           // for success / reset-link-sent
  const [resendCooldown, setResendCooldown] = useState(0)

  /* Redirect if already logged in (handles magic-link click landing back here) */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      let { data: officer } = await supabase.from('officers').select('id').eq('auth_uid', data.user.id).eq('is_active', true).maybeSingle()
      if (!officer && data.user.email) {
        const { data: byEmail } = await supabase.from('officers').select('id').eq('email', data.user.email.toLowerCase()).eq('is_active', true).maybeSingle()
        if (byEmail) {
          await supabase.from('officers').update({ auth_uid: data.user.id }).eq('id', byEmail.id)
          officer = byEmail
        }
      }
      if (officer) navigate('/officer-portal', { replace: true })
    })
  }, [navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  /** Resolve a username OR email to a real email for Supabase Auth */
  async function resolveEmail(id: string): Promise<string | null> {
    const trimmed = id.trim().toLowerCase()
    if (!trimmed) return null
    if (trimmed.includes('@')) return trimmed
    const { data } = await supabase
      .from('officers')
      .select('email')
      .ilike('username', trimmed)
      .eq('is_active', true)
      .maybeSingle()
    return (data?.email as string) ?? null
  }

  /* ── Password sign-in ─────────────────────────────────── */
  async function handlePasswordLogin() {
    if (!identifier.trim() || !password) {
      setError('Enter your email/username and password.')
      return
    }
    setLoading(true); setError(''); setInfo('')

    const email = await resolveEmail(identifier)
    if (!email) {
      setError('No active officer found with that username/email.')
      setLoading(false)
      return
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      setError(/invalid login/i.test(authErr.message)
        ? 'Wrong password. Try again, or use "Forgot password" below.'
        : authErr.message)
      setLoading(false)
      return
    }
    navigate('/officer-portal', { replace: true })
  }

  /* ── OTP send + verify ────────────────────────────────── */
  async function sendOtp() {
    setLoading(true); setError(''); setInfo('')
    const email = await resolveEmail(identifier)
    if (!email) {
      setError('No active officer found with that username/email.')
      setLoading(false)
      return
    }

    const { data: officer } = await supabase
      .from('officers').select('name').eq('email', email).eq('is_active', true).maybeSingle()
    if (!officer) {
      setError('This email is not registered as an active officer.')
      setLoading(false)
      return
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/officer-portal` },
    })

    if (otpErr) {
      setError(otpErr.message)
    } else {
      setOfficerName(officer.name as string)
      setOtpStep('otp')
      setResendCooldown(30)
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (otp.replace(/\s/g, '').length < 6) { setError('Enter the full 6-digit code.'); return }
    setLoading(true); setError('')
    const email = await resolveEmail(identifier)
    if (!email) { setError('Internal error: email not resolved.'); setLoading(false); return }

    const { data, error: verifyErr } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'email' })
    if (verifyErr) { setError(verifyErr.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('officers').update({ auth_uid: data.user.id })
        .eq('email', email).eq('is_active', true)
    }
    navigate('/officer-portal', { replace: true })
  }

  /* ── Forgot password ─────────────────────────────────── */
  async function sendResetEmail() {
    setLoading(true); setError(''); setInfo('')
    const email = await resolveEmail(identifier)
    if (!email) {
      setError('No active officer found with that username/email.')
      setLoading(false)
      return
    }
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/officer-portal`,
    })
    if (rErr) setError(rErr.message)
    else setInfo(`Password reset link sent to ${email}. Check your inbox.`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/40 to-amber-50/60 dark:from-navy-950 dark:via-navy-950 dark:to-navy-950 dark:alpona-bg flex flex-col relative overflow-hidden">
      <div className="float-blob w-[400px] h-[400px] bg-saffron/15 dark:bg-gold/8 -top-20 -right-20" />
      <div className="float-blob float-blob-2 w-[300px] h-[300px] bg-amber-200/30 dark:bg-saffron/8 bottom-0 -left-10" />

      <div className="flex h-[4px] shrink-0 relative z-10">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white dark:bg-cream" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2 text-navy-700 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/10 border border-saffron/30 dark:border-gold/30 text-saffron-dark dark:text-gold shadow-sm hover:bg-saffron/10 dark:hover:bg-white/15 hover:border-saffron dark:hover:border-gold hover:-translate-y-0.5 transition-all"
          >
            {theme === 'dark' ? <><Sun className="w-3.5 h-3.5" /> Light mode</> : <><Moon className="w-3.5 h-3.5" /> Dark mode</>}
          </button>
          <Link to="/login" className="text-saffron-dark dark:text-gold/60 hover:text-saffron dark:hover:text-gold text-xs font-semibold transition-colors px-2">
            Admin login →
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">

          {/* Emblem */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-saffron/15 to-gold/15 dark:bg-gold/10 border-2 border-saffron/30 dark:border-gold/25 flex items-center justify-center shadow-lg shadow-saffron/15 dark:shadow-none">
                <Shield className="w-9 h-9 text-saffron-dark dark:text-gold" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl">🏛️</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-saffron-dark dark:text-gold/50 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">
              Howrah Sadar Subdivision
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900 dark:text-cream">Officer Portal</h1>
          </div>

          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 mb-5">
              {([
                { key: 'password', label: 'Password', icon: Lock },
                { key: 'otp',      label: 'Email OTP', icon: Mail },
              ] as { key: Mode; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setError(''); setInfo(''); setOtpStep('email'); setOtp('') }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mode === key
                      ? 'bg-white dark:bg-navy-800 text-saffron-dark dark:text-gold shadow-sm'
                      : 'text-slate-500 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Card */}
          <div className="bg-white/95 dark:bg-navy-800/80 backdrop-blur-sm border border-slate-200 dark:border-gold/15 rounded-2xl p-8 shadow-xl dark:shadow-dark-card">

            {/* ────────── PASSWORD MODE ────────── */}
            {mode === 'password' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-2">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="officer@gov.in or your username"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/25 text-sm focus:outline-none focus:border-saffron dark:focus:border-gold/60 focus:ring-4 focus:ring-saffron/15 dark:focus:ring-gold/15 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                      className="w-full px-4 pr-10 py-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/25 text-sm focus:outline-none focus:border-saffron dark:focus:border-gold/60 focus:ring-4 focus:ring-saffron/15 dark:focus:ring-gold/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <button
                  onClick={handlePasswordLogin}
                  disabled={loading}
                  className="w-full btn-saffron justify-center disabled:opacity-50"
                >
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in…</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="flex justify-between text-xs">
                  <button onClick={() => { setMode('forgot'); setError(''); setInfo('') }} className="text-saffron-dark dark:text-gold/70 hover:text-saffron dark:hover:text-gold font-semibold transition-colors inline-flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Forgot password?
                  </button>
                  <button onClick={() => { setMode('otp'); setError(''); setOtpStep('email') }} className="text-slate-500 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream font-semibold transition-colors">
                    First time? Use Email OTP →
                  </button>
                </div>
              </div>
            )}

            {/* ────────── OTP MODE ────────── */}
            {mode === 'otp' && otpStep === 'email' && (
              <div className="space-y-5">
                <p className="text-xs text-slate-600 dark:text-cream/45 leading-relaxed bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/30 rounded-lg px-3 py-2">
                  Enter your email/username — we'll send a 6-digit code to your inbox.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-2">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-saffron dark:text-gold/40" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                      placeholder="officer@gov.in"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/25 text-sm focus:outline-none focus:border-saffron dark:focus:border-gold/60 focus:ring-4 focus:ring-saffron/15 dark:focus:ring-gold/15 transition-all"
                    />
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <button onClick={sendOtp} disabled={loading} className="w-full btn-saffron justify-center disabled:opacity-50">
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}

            {mode === 'otp' && otpStep === 'otp' && (
              <div className="space-y-6">
                <div>
                  <p className="text-slate-700 dark:text-cream/60 text-sm text-center mb-1">
                    Welcome, <span className="text-saffron-dark dark:text-gold font-semibold">{officerName}</span>
                  </p>
                  <p className="text-slate-500 dark:text-cream/35 text-xs text-center mb-5">
                    Enter the 6-digit code from your email
                  </p>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                {error && <ErrorBox text={error} center />}
                <button onClick={verifyOtp} disabled={loading || otp.replace(/\s/g, '').length < 6} className="w-full btn-saffron justify-center disabled:opacity-50">
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify & Login <ArrowRight className="w-4 h-4" /></>}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => { setOtpStep('email'); setOtp(''); setError('') }} className="text-slate-500 dark:text-cream/35 hover:text-navy-900 dark:hover:text-cream transition-colors">
                    ← Change email
                  </button>
                  <button onClick={sendOtp} disabled={resendCooldown > 0 || loading} className="text-saffron-dark dark:text-gold/60 hover:text-saffron dark:hover:text-gold font-semibold transition-colors disabled:opacity-40">
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            {/* ────────── FORGOT MODE ────────── */}
            {mode === 'forgot' && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-cream text-base mb-1">Reset Password</h3>
                  <p className="text-xs text-slate-500 dark:text-cream/40 leading-relaxed">
                    Enter your email or username. We'll send a password reset link.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-cream/50 uppercase tracking-wider mb-2">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendResetEmail()}
                    placeholder="officer@gov.in"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-gold/20 text-navy-900 dark:text-cream placeholder-slate-400 dark:placeholder-cream/25 text-sm focus:outline-none focus:border-saffron dark:focus:border-gold/60 focus:ring-4 focus:ring-saffron/15 dark:focus:ring-gold/15 transition-all"
                  />
                </div>

                {error && <ErrorBox text={error} />}
                {info && (
                  <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{info}</span>
                  </div>
                )}

                <button onClick={sendResetEmail} disabled={loading} className="w-full btn-saffron justify-center disabled:opacity-50">
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</> : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button onClick={() => { setMode('password'); setError(''); setInfo('') }} className="w-full text-xs text-slate-500 dark:text-cream/40 hover:text-navy-900 dark:hover:text-cream font-semibold flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-slate-500 dark:text-cream/20 text-xs mt-6">
            Your account is created by the administrator. Contact the SDO office if you face issues signing in.
          </p>
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ text, center }: { text: string; center?: boolean }) {
  return (
    <div className={`text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 ${center ? 'text-center' : ''}`}>
      {text}
    </div>
  )
}
