import { useRef, useState } from 'react'
import { uploadPDF } from '../lib/api'

export default function PDFUpload({ onUploadComplete }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await uploadPDF(file)
      if (result.error) throw new Error(result.error)
      onUploadComplete(result)
    } catch (err) {
      setError('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  function handleChange(e) {
    handleFile(e.target.files[0])
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      style={{
        border: `2px dashed ${dragging ? '#0070f3' : '#ccc'}`,
        borderRadius: 12,
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? '#f0f7ff' : 'transparent',
        transition: 'all 0.2s'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {uploading ? (
        <p style={{ color: '#0070f3', margin: 0 }}>Uploading and processing PDF...</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px', fontWeight: 500 }}>Drag and drop a PDF here</p>
          <p style={{ margin: 0, color: '#888', fontSize: 14 }}>or click to browse</p>
        </>
      )}

      {error && <p style={{ color: 'red', marginTop: 12, fontSize: 14 }}>{error}</p>}
    </div>
  )
}