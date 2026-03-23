import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { uploadPDF } from '../lib/api'
import AuthGuard from '../components/AuthGuard'

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('documents').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return
    setUploading(true)
    await uploadPDF(file)
    await fetchDocuments()
    setUploading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleDelete(e, docId) {
    e.stopPropagation()
    await supabase.from('chunks').delete().eq('document_id', docId)
    await supabase.from('documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--gray-100)', fontFamily: 'var(--font-body)' }}>

        {/* Topbar */}
        <div style={{
          background: 'var(--navy-900)', borderBottom: '1px solid rgba(201,168,76,0.15)',
          padding: '0 40px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, background: 'var(--gold)',
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy-950)" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--white)', fontWeight: 600 }}>DocuMind</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user?.email}</span>
            <button onClick={handleLogout} style={{
              padding: '7px 16px', background: 'transparent',
              color: 'var(--gray-400)', border: '1px solid rgba(154,170,191,0.25)',
              borderRadius: 8, fontSize: 13, fontWeight: 500
            }}>Sign out</button>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--navy-900)', marginBottom: 6 }}>
              My Documents
            </h1>
            <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('file-input').click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--gold)' : 'rgba(30,64,128,0.25)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '40px 24px', textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: dragOver ? 'rgba(201,168,76,0.04)' : 'var(--white)',
              marginBottom: 32, transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}>
            <input id="file-input" type="file" accept=".pdf"
              onChange={e => handleFile(e.target.files[0])}
              style={{ display: 'none' }} />
            {uploading ? (
              <div>
                <div style={{
                  width: 40, height: 40, border: '3px solid var(--gray-200)',
                  borderTopColor: 'var(--navy-600)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
                }}/>
                <p style={{ color: 'var(--navy-700)', fontWeight: 500, fontSize: 14 }}>Processing your PDF...</p>
                <p style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 4 }}>This may take a moment</p>
              </div>
            ) : (
              <div>
                <div style={{
                  width: 48, height: 48, background: 'rgba(30,64,128,0.08)',
                  borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy-600)" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 500, color: 'var(--navy-800)', marginBottom: 4, fontSize: 15 }}>
                  Drop your PDF here
                </p>
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  or <span style={{ color: 'var(--navy-600)', fontWeight: 500 }}>browse files</span> to upload
                </p>
              </div>
            )}
          </div>

          {/* Documents grid */}
          {documents.length === 0 && !uploading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
              <p style={{ fontSize: 15 }}>No documents yet — upload your first PDF above</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {documents.map(doc => (
                <div key={doc.id}
                  onClick={() => navigate(`/chat/${doc.id}`)}
                  style={{
                    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px', cursor: 'pointer',
                    border: '1px solid var(--gray-200)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'rgba(30,64,128,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--gray-200)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 40, height: 48, background: 'rgba(30,64,128,0.08)',
                      borderRadius: 6, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      border: '1px solid rgba(30,64,128,0.12)'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy-600)" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 500, color: 'var(--navy-900)', fontSize: 14,
                        marginBottom: 4, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{doc.file_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={e => handleDelete(e, doc.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--gray-400)', padding: 4, borderRadius: 4,
                        fontSize: 16, lineHeight: 1, flexShrink: 0
                      }}
                      title="Delete"
                    >×</button>
                  </div>
                  <div style={{
                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                    color: 'var(--navy-600)', fontSize: 12, fontWeight: 500
                  }}>
                    <span>Open chat</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthGuard>
  )
}