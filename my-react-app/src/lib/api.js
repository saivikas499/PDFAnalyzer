import { supabase } from './supabaseClient'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'x-user-id': session?.user?.id
  }
}

export async function uploadPDFWithProgress(file, onProgress, jobId) {
  const headers = await getAuthHeader()
  const id = jobId || `job_${Date.now()}_${Math.random().toString(36).slice(2)}`

  // Open SSE for this specific job
  const eventSource = new EventSource(`/api/upload/progress/${id}`)

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (onProgress) onProgress(data)
    if (data.done || data.error) eventSource.close()
  }

  eventSource.onerror = () => eventSource.close()

  const formData = new FormData()
  formData.append('pdf', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { ...headers, 'x-job-id': id },
    body: formData
  })

  return res.json()
}

export async function askQuestion(question, documentId) {
  const headers = await getAuthHeader()
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, documentId })
  })
  return res.json()
}