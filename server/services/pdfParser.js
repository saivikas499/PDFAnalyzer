import { PdfReader } from 'pdfreader'

function fixSpacedText(text) {
  return text
    .replace(/(?<=[A-Za-z]) (?=[A-Za-z])/g, '')
    .replace(/\u0000/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim()
}

function cleanText(text) {
  return text
    // Remove standalone page numbers like "1 5 3", "155", "1 6 6" etc
    .replace(/^[\d\s]{1,8}$/gm, '')
    // Remove patterns like "1 5 3 1 5 4" (spaced page numbers)
    .replace(/(\d\s){2,}\d/g, '')
    // Remove chapter headers like "CHAPTER 4. SUBROUTINES"
    .replace(/CHAPTER\s+\d+\.\s+[A-Z\s]+/g, '')
    // Remove section headers like "4.7. THETRUTHABOUTDECLARATIONS"
    .replace(/\d+\.\d+\.\s+[A-Z]+/g, '')
    // Remove "Exercises" standalone lines
    .replace(/^Exercises\s*$/gm, '')
    // Remove lines that are just numbers and spaces
    .replace(/^[\s\d]+$/gm, '')
    // Remove multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove lines shorter than 20 chars (likely noise/headers)
    .split('\n')
    .filter(line => line.trim().length > 20 || line.trim() === '')
    .join('\n')
    // Clean up extra whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export async function extractText(buffer) {
  return new Promise((resolve, reject) => {
    const rows = {}

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) { reject(err); return }

      if (!item) {
        const sortedRows = Object.keys(rows)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .map(y => rows[y].join(' '))

        let text = sortedRows.join('\n')
        text = fixSpacedText(text)
        text = cleanText(text)

        console.log(`   Full extracted text length: ${text.length} characters`)
        console.log(`   Preview: "${text.substring(0, 300)}"`)

        if (!text || text.length < 50) {
          reject(new Error('Could not extract enough text from this PDF.'))
          return
        }
        resolve(text)
        return
      }

      if (item.text) {
        const y = item.y
        if (!rows[y]) rows[y] = []
        rows[y].push(item.text)
      }
    })
  })
}

export function chunkText(text, overlap = 20) {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  // Larger docs get bigger chunks to reduce total chunk count
  const chunkSize = words.length > 5000 ? 200
    : words.length > 2000 ? 150
    : 100
  console.log(`   Using chunk size: ${chunkSize} for ${words.length} words`)
  // Split by sentences for more meaningful chunks
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 15)

  console.log(`   Total sentences found: ${sentences.length}`)

  const chunks = []
  let current = []
  let wordCount = 0

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/)
    current.push(sentence)
    wordCount += words.length

    if (wordCount >= chunkSize) {
      chunks.push(current.join(' '))
      // Keep last few sentences for overlap
      current = current.slice(-3)
      wordCount = current.join(' ').split(/\s+/).length
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '))
  }

  console.log(`   Created ${chunks.length} chunks`)
  return chunks
}