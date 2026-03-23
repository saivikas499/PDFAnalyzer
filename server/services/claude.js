import Groq from 'groq-sdk'

export async function askClaude(question, contextChunks) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const context = contextChunks.join('\n\n')

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions based only on the provided context. If the answer is not in the context, say "I could not find the answer in this document."'
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ],
    max_tokens: 1024
  })

  return response.choices[0].message.content
}
