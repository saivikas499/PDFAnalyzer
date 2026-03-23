import { supabase } from './supabaseClient'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`,
    'x-user-id': session?.user?.id
  }
}

export async function uploadPDF(file) {
  const headers = await getAuthHeader()
  const formData = new FormData()
  formData.append('pdf', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
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