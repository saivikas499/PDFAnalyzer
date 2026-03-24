import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { askQuestion } from '../lib/api'
import AuthGuard from '../components/AuthGuard'
import ThemeToggle from '../components/ThemeToggle'
import styles from './Chat.module.css'

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key points?',
  'What is the main conclusion?',
  'List important topics covered'
]

export default function Chat() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [chatMap, setChatMap] = useState({})
  const messages = chatMap[documentId] || []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docName, setDocName] = useState('')
  const [documents, setDocuments] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.from('documents').select('file_name').eq('id', documentId).single()
      .then(({ data }) => setDocName(data?.file_name || 'Document'))

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data } = await supabase.from('documents').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      setDocuments(data || [])
    })
  }, [documentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
  setInput('')
  setLoading(false)
}, [documentId])


useEffect(() => {
  const saved = localStorage.getItem(`chat_${documentId}`)

  setChatMap(prev => ({
    ...prev,
    [documentId]: saved ? JSON.parse(saved) : []
  }))
}, [documentId])

useEffect(() => {
  if (messages.length === 0) {
    localStorage.removeItem(`chat_${documentId}`)
  } else {
    localStorage.setItem(
      `chat_${documentId}`,
      JSON.stringify(messages)
    )
  }
}, [messages, documentId])

function clearChat() {
  const confirmClear = window.confirm('Are you sure you want to clear this chat?')
  if (!confirmClear) return

  localStorage.removeItem(`chat_${documentId}`)
  setChatMap(prev => ({
  ...prev,
  [documentId]: []
}))
}

  async function handleSend(text) {
  const question = (text || input).trim()
  if (!question || loading) return

  setInput('')

  // Add user message
  setChatMap(prev => ({
    ...prev,
    [documentId]: [
      ...(prev[documentId] || []),
      { role: 'user', content: question }
    ]
  }))

  setLoading(true)

  try {
    const { answer, error } = await askQuestion(question, documentId)
    if (error) throw new Error(error)

    setChatMap(prev => ({
      ...prev,
      [documentId]: [
        ...(prev[documentId] || []),
        { role: 'assistant', content: answer }
      ]
    }))

  } catch (err) {
    setChatMap(prev => ({
      ...prev,
      [documentId]: [
        ...(prev[documentId] || []),
        { role: 'assistant', content: 'Error: ' + err.message }
      ]
    }))
  }

  setLoading(false)
}

  return (
    <AuthGuard>
      <div className={styles.page}>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <div className={styles.sidebarLogoIcon}>◈</div>
            <span className={styles.sidebarLogoText}>DocuMind</span>
          </div>

          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← All documents
          </button>

          <p className={styles.sectionLabel}>Documents</p>
          <div className={styles.docList}>
            {documents.map(doc => (
              <div
                key={doc.id}
                className={`${styles.docItem} ${doc.id === documentId ? styles.docItemActive : ''}`}
                onClick={() => navigate(`/chat/${doc.id}`)}
              >
                <span className={`${styles.docIcon} ${doc.id === documentId ? styles.docIconActive : ''}`}>◎</span>
                <span className={`${styles.docName} ${doc.id === documentId ? styles.docNameActive : ''}`}>
                  {doc.file_name.replace('.pdf', '')}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.sidebarBottom}>
            <ThemeToggle />
          </div>
        </aside>

        {/* Chat */}
        <div className={styles.chatArea}>

          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.statusDot} />
              <span className={styles.chatTitle}>{docName.replace('.pdf', '')}</span>
            </div>
            <div className={styles.chatHeaderRight}>
               <button className={styles.clearBtn} onClick={clearChat}>Clear chat</button>
              <span className={styles.aiBadge}>AI Ready</span>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            <div className={styles.messagesInner}>

              {messages.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>◈</div>
                  <h3 className={styles.emptyTitle}>What do you want to know?</h3>
                  <p className={styles.emptySub}>
                    Ask anything about <span className={styles.emptyDocName}>{docName.replace('.pdf', '')}</span>
                  </p>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map(s => (
                      <button key={s} className={styles.suggestionBtn} onClick={() => handleSend(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : styles.messageRowAi}`}
                >
                  {msg.role === 'assistant' && (
                    <div className={styles.aiAvatar}>◈</div>
                  )}
                  <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={styles.typingRow}>
                  <div className={styles.aiAvatar}>◈</div>
                  <div className={styles.typingBubble}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className={styles.typingDot} style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <div className={styles.inputInner}>
              <div className={styles.inputBox}>
                <textarea
                  className={styles.textarea}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Ask anything about this document..."
                  rows={1}
                />
                <button
                  className={styles.sendBtn}
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                >
                  ↑
                </button>
              </div>
              <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}