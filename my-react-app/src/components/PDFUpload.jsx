import { useRef, useState } from 'react'
import { uploadPDFWithProgress } from '../lib/api'

const STEPS = [
  'Uploading to storage',
  'Saving document',
  'Extracting text',
  'Splitting into chunks',
  'Creating embeddings',
  'Complete'
]

export default function PDFUpload({ onUploadComplete }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.')
      return
    }
    setError('')
    setUploading(true)
    setProgress({ percent: 0, message: 'Starting...', step: 0 })

    try {
      await uploadPDFWithProgress(file, (data) => {
        if (data.error) {
          setError(data.error)
          setUploading(false)
          return
        }
        setProgress(data)
        if (data.percent === 100 && data.documentId) {
          setTimeout(() => {
            setUploading(false)
            setProgress(null)
            onUploadComplete({ documentId: data.documentId, fileName: data.fileName })
          }, 800)
        }
      })
    } catch (err) {
      setError('Upload failed: ' + err.message)
      setUploading(false)
    }
  }

  return (
    <div>
      {!uploading ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--gold)' : 'rgba(30,64,128,0.25)'}`,
            borderRadius: 'var(--radius-lg)', padding: '40px 24px',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(201,168,76,0.04)' : 'var(--white)',
            transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
          }}
        >
          <input ref={inputRef} type="file" accept=".pdf"
            onChange={e => handleFile(e.target.files[0])}
            style={{ display: 'none' }} />
          <div style={{
            width: 48, height: 48, background: 'rgba(30,64,128,0.08)',
            borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            border: '1px solid rgba(30,64,128,0.12)'
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
            or <span style={{ color: 'var(--navy-600)', fontWeight: 500 }}>browse files</span>
          </p>
          <p style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 8 }}>
            Supports any PDF — research papers, books, contracts
          </p>
          {error && <p style={{ color: 'var(--danger)', marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      ) : (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy-800)' }}>
                {progress?.message || 'Processing...'}
              </span>
              <span style={{ fontSize: 14, color: 'var(--navy-600)', fontWeight: 500 }}>
                {progress?.percent || 0}%
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, var(--navy-700), var(--navy-500))',
                width: `${progress?.percent || 0}%`,
                transition: 'width 0.4s ease'
              }}/>
            </div>
          </div>

          {/* Chunk progress */}
          {progress?.total && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Chunks embedded</span>
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                  {progress.current || 0} / {progress.total}
                </span>
              </div>
              <div style={{ height: 3, background: 'var(--gray-200)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'var(--gold)',
                  width: `${((progress.current || 0) / progress.total) * 100}%`,
                  transition: 'width 0.3s ease'
                }}/>
              </div>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS.map((step, i) => {
              const stepNum = i + 1
              const currentStep = progress?.step || 0
              const isDone = stepNum < currentStep
              const isActive = stepNum === currentStep
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: isDone ? 'var(--success)' : isActive ? 'var(--navy-600)' : 'var(--gray-200)',
                    color: isDone || isActive ? 'white' : 'var(--gray-400)',
                    transition: 'all 0.3s'
                  }}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: isDone ? 'var(--success)' : isActive ? 'var(--navy-800)' : 'var(--gray-400)',
                    fontWeight: isActive ? 500 : 400,
                    transition: 'all 0.3s'
                  }}>{step}</span>
                  {isActive && (
                    <div style={{
                      width: 12, height: 12, border: '2px solid var(--navy-600)',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', marginLeft: 4
                    }}/>
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 16, textAlign: 'center' }}>
            Large PDFs (500+ pages) may take 5-10 minutes. Please keep this tab open.
          </p>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}