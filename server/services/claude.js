import Groq from 'groq-sdk'

export async function askClaude(question, contextChunks) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const context = contextChunks.join('\n\n---\n\n')

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an intelligent document assistant. You are given excerpts from a document and a user question.

Your job is to:
1. Understand the MEANING and INTENT of the question, not just match keywords
2. Find the most relevant information from the context
3. Give a clear, direct, and helpful answer
4. If the exact answer isn't in the context but related info is, share what you found
5. Only say "I could not find the answer" if the topic is completely absent from the context

Be conversational and helpful. Format your answer clearly.`
      },
      {
        role: 'user',
        content: `Document excerpts:\n\n${context}\n\n---\n\nQuestion: ${question}`
      }
    ],
    max_tokens: 1024,
    temperature: 0.3  // lower temperature = more focused, factual answers
  })

  return response.choices[0].message.content
}