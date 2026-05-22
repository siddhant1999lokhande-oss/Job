'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Shield, RotateCcw } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devOtp, setDevOtp] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      // No SMS provider — OTP is returned directly in the response
      if (data.otp) {
        setDevOtp(data.otp)
        setOtp(data.otp.split(''))
      }
      setStep('otp')
      setCountdown(60)
      setTimeout(() => otpRefs.current[5]?.focus(), 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid OTP')
      }
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('turfmate_token', data.token)
        if (data.user) {
          localStorage.setItem('turfmate_user', JSON.stringify(data.user))
        }
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.otp) {
        setDevOtp(data.otp)
        setOtp(data.otp.split(''))
      } else {
        setOtp(['', '', '', '', '', ''])
      }
      setCountdown(60)
      otpRefs.current[5]?.focus()
    } catch {
      setError('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-5xl">⚽</span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">
            Turf<span className="text-emerald-400">Mate</span>
          </h1>
          <p className="mt-1 text-gray-500 text-sm">Your football community</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {step === 'phone' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Enter your number</h2>
                  <p className="text-gray-500 text-xs">We&apos;ll send a one-time password</p>
                </div>
              </div>

              <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-emerald-500 transition-colors">
                    <span className="text-gray-400 text-sm font-medium shrink-0">🇮🇳 +91</span>
                    <div className="w-px h-4 bg-gray-700" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 bg-transparent text-white placeholder-gray-600 text-base outline-none tracking-widest"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']) }}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-300" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg">Verify OTP</h2>
                    <p className="text-gray-500 text-xs">Sent to +91 {phone}</p>
                  </div>
                </div>
              </div>

              {devOtp && (
                <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <p className="text-amber-400 text-xs font-medium mb-1">⚡ No SMS connected — your OTP is:</p>
                  <p className="text-amber-300 text-2xl font-bold tracking-[0.3em]">{devOtp}</p>
                  <p className="text-amber-500/70 text-xs mt-1">Already filled in for you</p>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
                <div onPaste={handleOtpPaste} className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-14 bg-gray-900 border border-gray-700 rounded-xl text-white text-xl font-bold text-center outline-none focus:border-emerald-500 transition-colors"
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-gray-500 text-sm">
                      Resend OTP in <span className="text-emerald-400 font-semibold">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="flex items-center gap-1.5 mx-auto text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
