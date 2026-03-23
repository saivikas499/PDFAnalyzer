import { PdfReader } from 'pdfreader'

function fixSpacedText(text) {
  return text
    .replace(/(?<=[A-Za-z]) (?=[A-Za-z])/g, '')
    .replace(/\u0000/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export async function extractText(buffer) {
  return new Promise((resolve, reject) => {
    const rows = {}

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err)
        return
      }

      if (!item) {
        const sortedRows = Object.keys(rows)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .map(y => rows[y].join(' '))

        let text = sortedRows.join('\n')
        text = fixSpacedText(text)

        console.log(`   Full extracted text length: ${text.length} characters`)
        console.log(`   Preview: "${text.substring(0, 300)}"`)
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

export function chunkText(text, chunkSize = 80, overlap = 15) {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  console.log(`   Total words found: ${words.length}`)
  const chunks = []
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ').trim()
    if (chunk.length > 10) {
      chunks.push(chunk)
    }
    if (i + chunkSize >= words.length) break
  }
  console.log(`   Created ${chunks.length} chunks of ~${chunkSize} words each`)
  return chunks
}