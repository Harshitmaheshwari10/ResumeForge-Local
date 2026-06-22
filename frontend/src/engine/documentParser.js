import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import { normalizeText } from './textUtils'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

async function extractPdf(buffer) {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const parts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    parts.push(content.items.map((item) => item.str).join(' '))
  }
  const text = parts.join('\n')
  if (!text.trim()) throw new Error('No text could be extracted from the PDF')
  return normalizeText(text)
}

async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  if (!result.value?.trim()) throw new Error('No text could be extracted from the DOCX')
  return normalizeText(result.value)
}

export async function extractTextFromFile(file) {
  if (!file?.name) throw new Error('Filename is required')
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return normalizeText(await file.text())

  const buffer = await file.arrayBuffer()
  if (ext === 'pdf') return extractPdf(buffer)
  if (ext === 'docx') return extractDocx(buffer)
  throw new Error(`Unsupported file type: .${ext}`)
}
