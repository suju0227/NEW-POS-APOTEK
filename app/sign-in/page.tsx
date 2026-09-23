'use client'

import { FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (event.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter === null) return
    setLoading(true)
    setError('')
    const result = await authClient.signIn.email({ email, password })
    if (result.error) setError('Email atau password tidak valid.')
    else window.location.href = '/'
    setLoading(false)
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><span className="eyebrow">Apotek Risyah</span><h1>Masuk ke kasir</h1><p>Gunakan akun kasir untuk membuka workspace penjualan.</p><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p role="alert" className="auth-error">{error}</p>}<button className="button-primary" disabled={loading}>{loading ? 'Memeriksa...' : 'Masuk'}</button></form></main>
}
