import { supabase } from './supabaseClient'
const BASE_URL = import.meta.env.VITE_API_URL
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
  const eventSource = new EventSource(`${BASE_URL}/api/upload/progress/${id}`)

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (onProgress) onProgress(data)
    if (data.done || data.error) eventSource.close()
  }

  eventSource.onerror = () => eventSource.close()

  const formData = new FormData()
  formData.append('pdf', file)

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { ...headers, 'x-job-id': id },
    body: formData
  })

  return res.json()
}

export async function askQuestion(question, documentId) {
  const headers = await getAuthHeader()

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documentId })
    })

    // 🔥 Read as text first (important)
    const text = await res.text()

    // 🔥 Handle empty response
    if (!text) {
      console.error("Empty response from server")
      return { error: "Empty response from server" }
    }

    let data

    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error("Invalid JSON:", text)
      return { error: "Invalid response from server" }
    }

    // 🔥 Handle HTTP errors
    if (!res.ok) {
      return { error: data.error || "Request failed" }
    }

    return data

  } catch (err) {
    console.error("Fetch error:", err)
    return { error: err.message }
  }
}