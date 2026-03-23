import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { askQuestion } from '../lib/api'
import AuthGuard from '../components/AuthGuard'

export default function Chat() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docName, setDocName] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.from('documents').select('file_name').eq('id', documentId).single()
      .then(({ data }) => setDocName(data?.file_name || 'Document'))
  }, [documentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const { answer, error } = await askQuestion(question, documentId)
      if (error) throw new Error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong: ' + err.message }])
    }
    setLoading(false)
  }

  return (
    <AuthGuard>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-100)', fontFamily: 'var(--font-body)' }}>

        {/* Header */}
        <div style={{
          background: 'var(--navy-900)', borderBottom: '1px solid rgba(201,168,76,0.15)',
          padding: '0 32px', height: 64, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--gray-400)', borderRadius: 8,
            padding: '6px 12px', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 1 }}>Chatting with</p>
            <p style={{
              fontSize: 14, fontWeight: 500, color: 'var(--white)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{docName}</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}/>
            <span style={{ fontSize: 12, color: '#86efac', fontWeight: 500 }}>AI Ready</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{
                width: 56, height: 56, background: 'var(--navy-800)',
                borderRadius: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
                border: '1px solid rgba(201,168,76,0.2)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--navy-800)', marginBottom: 8 }}>
                Ask anything about this document
              </h3>
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
                Try asking about key topics, summaries, or specific details
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {['Summarize this document', 'What are the key points?', 'Who is the author?'].map(q => (
                  <button key={q} onClick={() => { setInput(q) }} style={{
                    padding: '8px 14px', background: 'var(--white)',
                    border: '1px solid var(--gray-200)', borderRadius: 20,
                    fontSize: 13, color: 'var(--navy-700)', cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 16
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, background: 'var(--navy-800)',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginRight: 10, flexShrink: 0,
                  border: '1px solid rgba(201,168,76,0.2)', alignSelf: 'flex-end'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                  </svg>
                </div>
              )}
              <div style={{
                maxWidth: '75%', padding: '12px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--navy-700)' : 'var(--white)',
                color: msg.role === 'user' ? 'var(--white)' : 'var(--navy-900)',
                fontSize: 14, lineHeight: 1.7,
                boxShadow: 'var(--shadow-sm)',
                border: msg.role === 'assistant' ? '1px solid var(--gray-200)' : 'none',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, background: 'var(--navy-800)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '1px solid rgba(201,168,76,0.2)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </div>
              <div style={{
                padding: '12px 18px', background: 'var(--white)',
                borderRadius: '16px 16px 16px 4px', border: '1px solid var(--gray-200)',
                boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 4, alignItems: 'center'
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--navy-500)',
                    animation: 'bounce 1.2s ease infinite',
                    animationDelay: `${i * 0.2}s`
                  }}/>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          background: 'var(--white)', borderTop: '1px solid var(--gray-200)',
          padding: '16px 24px', flexShrink: 0
        }}>
          <div style={{
            maxWidth: 800, margin: '0 auto',
            display: 'flex', gap: 10, alignItems: 'flex-end'
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask a question about the document..."
              rows={1}
              style={{
                flex: 1, padding: '12px 16px',
                background: 'var(--gray-100)', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)', fontSize: 14,
                color: 'var(--navy-900)', resize: 'none',
                outline: 'none', lineHeight: 1.5,
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--navy-500)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} style={{
              padding: '12px 20px',
              background: loading || !input.trim() ? 'var(--gray-200)' : 'var(--navy-700)',
              color: loading || !input.trim() ? 'var(--gray-400)' : 'var(--white)',
              border: 'none', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 500,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}>
              Send →
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </AuthGuard>
  )
}