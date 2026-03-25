 import Groq from 'groq-sdk'

export async function askClaude(question, contextChunks) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const MAX_CONTEXT_LENGTH = 2000
  const context = contextChunks.slice(0, 4).join('\n\n---\n\n')
  if (context.length > MAX_CONTEXT_LENGTH) {
  context = context.slice(0, MAX_CONTEXT_LENGTH)
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // ✅ more stable than 70b
      messages: [
        {
          role: 'system',
          content: `You are an intelligent document assistant. Answer clearly using the provided context.`
        },
        {
          role: 'user',
          content: `Document excerpts:\n\n${context}\n\n---\n\nQuestion: ${question}`
        }
      ],
      max_tokens: 1024,
      temperature: 0.3
    })

    const result = response.choices?.[0]?.message?.content

    // ✅ prevent empty response
    if (!result || result.trim() === "") {
      console.error("Empty response from Groq")
      return "AI could not generate a response"
    }

    return result

  } catch (err) {
    console.error("Groq error:", err)

    let message = "AI error occurred"

    // ✅ Rate limit
    if (err.status === 429 || err.message?.toLowerCase().includes("rate limit")) {
      message = "Rate limit exceeded. Please wait a few seconds and try again."
    }

    // ✅ Token limit
    else if (err.message?.toLowerCase().includes("token")) {
      message = "Request too large (token limit exceeded). Try asking a shorter question."
    }

    // ✅ API key issues
    else if (err.message?.toLowerCase().includes("api key")) {
      message = "Invalid or missing API key configuration."
    }

    // ✅ Network / server issues
    else if (err.message?.toLowerCase().includes("fetch")) {
      message = "Network error while contacting AI service."
    }

    // ✅ fallback
    else if (err.message) {
      message = err.message
    }

    return message
  }
}