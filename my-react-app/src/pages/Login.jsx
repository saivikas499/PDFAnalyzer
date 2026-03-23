import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-body)',
      background: 'var(--navy-950)'
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column',
        justifyContent: 'center', padding: '60px',
        background: `linear-gradient(135deg, var(--navy-800) 0%, var(--navy-900) 100%)`,
        borderRight: '1px solid rgba(201,168,76,0.1)',
        '@media(min-width:768px)': { display: 'flex' }
      }} className="login-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--gold)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--white)', fontWeight: 600 }}>DocuMind</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--white)', lineHeight: 1.2, marginBottom: 16 }}>
          Intelligence from<br />your documents
        </h2>
        <p style={{ color: 'var(--gray-400)', fontSize: 15, lineHeight: 1.7, maxWidth: 360 }}>
          Upload PDFs and instantly get answers to any question using advanced AI. Save hours of manual reading.
        </p>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 24px'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 28,
              color: 'var(--white)', marginBottom: 8
            }}>
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
              {isSignUp ? 'Start analyzing your documents today' : 'Sign in to your DocuMind account'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {['Email', 'Password'].map((label, i) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-400)', marginBottom: 6, letterSpacing: '0.04em' }}>
                  {label.toUpperCase()}
                </label>
                <input
                  type={i === 1 ? 'password' : 'email'}
                  value={i === 0 ? email : password}
                  onChange={e => i === 0 ? setEmail(e.target.value) : setPassword(e.target.value)}
                  required
                  placeholder={i === 0 ? 'you@company.com' : '••••••••'}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius)', fontSize: 14,
                    color: 'var(--white)', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            ))}

            {error && (
              <div style={{
                padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius)', color: '#fca5a5',
                fontSize: 13, marginBottom: 16
              }}>{error}</div>
            )}
            {message && (
              <div style={{
                padding: '10px 14px', background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 'var(--radius)', color: '#86efac',
                fontSize: 13, marginBottom: 16
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading ? 'rgba(201,168,76,0.5)' : 'var(--gold)',
              color: 'var(--navy-950)', border: 'none',
              borderRadius: 'var(--radius)', fontSize: 15,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8, transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.25)'
            }}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--gray-600)' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 500 }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .login-left { display: flex !important; } }
        input::placeholder { color: var(--gray-600); }
      `}</style>
    </div>
  )
}