import { useState, useEffect, useRef } from 'react'
import { askQuestion } from '../lib/api'

export default function ChatWindow({ documentId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
            Ask anything about this PDF...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '10px 16px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? '#0070f3' : '#f0f0f0',
              color: msg.role === 'user' ? '#fff' : '#000',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '12px 12px 12px 2px', background: '#f0f0f0', color: '#888', fontSize: 14 }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the PDF... (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 14,
            resize: 'none',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            background: loading || !input.trim() ? '#ccc' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}