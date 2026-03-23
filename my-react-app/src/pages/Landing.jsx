import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)', color: 'var(--white)', fontFamily: 'var(--font-body)' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(5,13,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,168,76,0.15)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--gold)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--white)', fontWeight: 600 }}>DocuMind</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 20px', background: 'transparent',
            color: 'var(--gray-400)', border: '1px solid rgba(154,170,191,0.3)',
            borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s'
          }}>Sign In</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '8px 20px', background: 'var(--gold)',
            color: 'var(--navy-950)', border: 'none',
            borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s'
          }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px',
        background: `radial-gradient(ellipse at 50% 0%, rgba(37,84,168,0.3) 0%, transparent 70%),
                     radial-gradient(ellipse at 80% 80%, rgba(201,168,76,0.08) 0%, transparent 60%)`
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px',
          background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 20, fontSize: 12, fontWeight: 500,
          color: 'var(--gold-light)', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 32
        }}>AI-Powered Document Intelligence</div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 700, lineHeight: 1.1, marginBottom: 24, maxWidth: 800
        }}>
          Your Documents,<br />
          <span style={{ color: 'var(--gold)' }}>Answered Instantly</span>
        </h1>

        <p style={{
          fontSize: 18, color: 'var(--gray-400)', maxWidth: 520,
          lineHeight: 1.7, marginBottom: 48
        }}>
          Upload any PDF and have an intelligent conversation with it.
          Extract insights, find answers, and understand complex documents in seconds.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 36px', background: 'var(--gold)',
            color: 'var(--navy-950)', border: 'none',
            borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600,
            boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
            transition: 'all 0.2s'
          }}>Start for Free</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '14px 36px', background: 'rgba(255,255,255,0.06)',
            color: 'var(--white)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 500,
            transition: 'all 0.2s'
          }}>Sign In</button>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24
        }}>
          {[
            { icon: '↑', title: 'Upload Any PDF', desc: 'Drag and drop any document — reports, contracts, research papers, invoices.' },
            { icon: '?', title: 'Ask Anything', desc: 'Ask questions in plain English. No need to search manually through pages.' },
            { icon: '✓', title: 'Instant Answers', desc: 'Get precise, context-aware answers powered by advanced AI in seconds.' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '32px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              transition: 'all 0.3s'
            }}>
              <div style={{
                width: 44, height: 44, background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: 'var(--gold)', marginBottom: 20, fontWeight: 700
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10, color: 'var(--white)' }}>{f.title}</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 48px', textAlign: 'center',
        color: 'var(--gray-600)', fontSize: 13
      }}>
        © 2025 DocuMind. Built with AI.
      </div>
    </div>
  )
}