import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { uploadPDFWithProgress } from '../lib/api'
import AuthGuard from '../components/AuthGuard'

const MAX_PARALLEL = 3

export default function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [uploads, setUploads] = useState([]) // active upload jobs
  const [user, setUser] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)

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

  function updateUpload(id, patch) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
  }

  async function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf')

    if (pdfFiles.length === 0) return

    // Check active upload count
    const activeCount = uploads.filter(u => u.status === 'uploading').length
    const canAdd = MAX_PARALLEL - activeCount

    if (canAdd <= 0) {
      alert(`Maximum ${MAX_PARALLEL} uploads at a time. Please wait for current uploads to finish.`)
      return
    }

    const allowed = pdfFiles.slice(0, canAdd)
    const blocked = pdfFiles.slice(canAdd)

    if (blocked.length > 0) {
      alert(`Only ${canAdd} more upload slot${canAdd !== 1 ? 's' : ''} available. ${blocked.length} file${blocked.length !== 1 ? 's' : ''} skipped.`)
    }

    // Create upload job for each file
    const newJobs = allowed.map(file => ({
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      file,
      status: 'uploading', // uploading | done | error
      percent: 0,
      message: 'Starting...',
      step: 0,
      current: 0,
      total: 0,
      error: null
    }))

    setUploads(prev => [...prev, ...newJobs])

    // Start all uploads in parallel
    newJobs.forEach(job => startUpload(job))
  }

  async function startUpload(job) {
    try {
      await uploadPDFWithProgress(job.file, (data) => {
        if (data.error) {
          updateUpload(job.id, { status: 'error', error: data.error })
          return
        }
        updateUpload(job.id, {
          percent: data.percent || 0,
          message: data.message || '',
          step: data.step || 0,
          current: data.current || 0,
          total: data.total || 0,
          ...(data.percent === 100 ? { status: 'done' } : {})
        })
        if (data.percent === 100) {
          fetchDocuments()
          // Remove from active uploads after 3 seconds
          setTimeout(() => {
            setUploads(prev => prev.filter(u => u.id !== job.id))
          }, 3000)
        }
      }, job.id)
    } catch (err) {
      updateUpload(job.id, { status: 'error', error: err.message })
    }
  }

  function removeUpload(id) {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  async function handleDelete(e, docId) {
    e.stopPropagation()
    if (!window.confirm('Delete this document?')) return
    await supabase.from('chunks').delete().eq('document_id', docId)
    await supabase.from('documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const activeUploads = uploads.filter(u => u.status === 'uploading')
  const slotsAvailable = MAX_PARALLEL - activeUploads.length

  const STEPS = [
    'Uploading to storage',
    'Saving record',
    'Extracting text',
    'Splitting chunks',
    'Creating embeddings',
    'Complete'
  ]

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
              borderRadius: 8, fontSize: 13
            }}>Sign out</button>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--navy-900)', marginBottom: 4 }}>
                My Documents
              </h1>
              <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>
                {documents.length} document{documents.length !== 1 ? 's' : ''}
                {activeUploads.length > 0 && (
                  <span style={{
                    marginLeft: 10, padding: '2px 10px',
                    background: 'rgba(37,84,168,0.1)',
                    color: 'var(--navy-600)', borderRadius: 20,
                    fontSize: 12, fontWeight: 500
                  }}>
                    {activeUploads.length} uploading...
                  </span>
                )}
              </p>
            </div>

            {/* Upload slots indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Upload slots</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: MAX_PARALLEL }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < activeUploads.length ? 'var(--gold)' : 'var(--gray-200)',
                    transition: 'background 0.3s'
                  }}/>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 500 }}>
                {slotsAvailable}/{MAX_PARALLEL} free
              </span>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => slotsAvailable > 0 && inputRef.current.click()}
            style={{
              border: `2px dashed ${dragOver && slotsAvailable > 0 ? 'var(--gold)' : slotsAvailable === 0 ? 'var(--gray-200)' : 'rgba(30,64,128,0.25)'}`,
              borderRadius: 'var(--radius-lg)', padding: '32px 24px',
              textAlign: 'center',
              cursor: slotsAvailable === 0 ? 'not-allowed' : 'pointer',
              background: dragOver && slotsAvailable > 0 ? 'rgba(201,168,76,0.04)' : 'var(--white)',
              marginBottom: 24, transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)',
              opacity: slotsAvailable === 0 ? 0.6 : 1
            }}
          >
            <input
              ref={inputRef} type="file" accept=".pdf" multiple
              onChange={e => handleFiles(e.target.files)}
              style={{ display: 'none' }}
            />
            <div style={{
              width: 44, height: 44, background: slotsAvailable === 0 ? 'var(--gray-200)' : 'rgba(30,64,128,0.08)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 14px',
              border: `1px solid ${slotsAvailable === 0 ? 'var(--gray-200)' : 'rgba(30,64,128,0.12)'}`
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={slotsAvailable === 0 ? 'var(--gray-400)' : 'var(--navy-600)'} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            {slotsAvailable === 0 ? (
              <>
                <p style={{ fontWeight: 500, color: 'var(--gray-400)', fontSize: 14, marginBottom: 4 }}>
                  All upload slots are busy
                </p>
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  Wait for a current upload to finish before adding more
                </p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 500, color: 'var(--navy-800)', fontSize: 14, marginBottom: 4 }}>
                  Drop PDF{slotsAvailable > 1 ? 's' : ''} here
                </p>
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                  or <span style={{ color: 'var(--navy-600)', fontWeight: 500 }}>browse files</span>
                  {' '}· Up to {slotsAvailable} file{slotsAvailable !== 1 ? 's' : ''} at once
                </p>
              </>
            )}
          </div>

          {/* Active upload cards */}
{uploads.length > 0 && (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{
      fontSize: 13, fontWeight: 500, color: 'var(--gray-600)',
      marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em'
    }}>
      Uploads
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {uploads.map(job => (
        <div key={job.id} style={{
          background: 'var(--white)',
          border: `1px solid ${
            job.status === 'done' ? 'rgba(34,197,94,0.3)' :
            job.status === 'error' ? 'rgba(239,68,68,0.3)' :
            'var(--gray-200)'
          }`,
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color 0.3s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Status icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: job.status === 'done' ? 'rgba(34,197,94,0.1)' :
                job.status === 'error' ? 'rgba(239,68,68,0.1)' :
                'rgba(30,64,128,0.08)',
              border: `1px solid ${
                job.status === 'done' ? 'rgba(34,197,94,0.2)' :
                job.status === 'error' ? 'rgba(239,68,68,0.2)' :
                'rgba(30,64,128,0.12)'}`
            }}>
              {job.status === 'done' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : job.status === 'error' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-600)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              )}
            </div>

            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{
                  fontSize: 14, fontWeight: 500, color: 'var(--navy-900)',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: '70%'
                }}>{job.fileName}</p>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: job.status === 'done' ? 'var(--success)' :
                    job.status === 'error' ? 'var(--danger)' :
                    'var(--navy-600)'
                }}>
                  {job.status === 'done' ? 'Complete' :
                   job.status === 'error' ? 'Failed' :
                   `${job.percent}%`}
                </span>
              </div>

              {/* Single progress bar */}
              <div style={{
                height: 6, background: 'var(--gray-200)',
                borderRadius: 3, overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: job.status === 'done' ? 'var(--success)' :
                    job.status === 'error' ? 'var(--danger)' :
                    'linear-gradient(90deg, var(--navy-700), var(--navy-500))',
                  width: job.status === 'error' ? '100%' : `${job.percent}%`,
                  transition: 'width 0.4s ease, background 0.3s'
                }}/>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => removeUpload(job.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gray-400)', fontSize: 18, lineHeight: 1,
                padding: '2px 4px', borderRadius: 4, flexShrink: 0
              }}
              title="Dismiss"
            >×</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          {/* Documents grid */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {documents.length > 0 ? 'Documents' : ''}
            </h3>
            {documents.length === 0 && uploads.length === 0 ? (
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
                      boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
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
                      <button onClick={e => handleDelete(e, doc.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--gray-400)', padding: 4, borderRadius: 4,
                        fontSize: 16, lineHeight: 1, flexShrink: 0
                      }} title="Delete">×</button>
                    </div>
                    <div style={{
                      marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                      color: 'var(--navy-600)', fontSize: 12, fontWeight: 500
                    }}>
                      <span>Open chat</span><span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthGuard>
  )
}