import { jsPDF } from 'jspdf'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
} from 'docx'
import { parseResume } from './resumeParser'
import { renderResumeText } from './resumeRewriter'

function addPdfSection(doc, title, lines, y, margin, width) {
  let cursor = y
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, margin, cursor)
  cursor += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line.replace(/^•\s*/, '• '), width)
    if (cursor + wrapped.length * 12 > 750) {
      doc.addPage()
      cursor = margin
    }
    doc.text(wrapped, margin, cursor)
    cursor += wrapped.length * 12 + 4
  }
  return cursor + 6
}

export function exportToPdf(resumeText) {
  const parsed = parseResume(resumeText)
  const sections = parsed.sections
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 54
  const width = 504
  let y = margin

  if (sections.contact?.name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(sections.contact.name, width / 2 + margin, y, { align: 'center' })
    y += 20
  }

  const contactLine = ['email', 'phone', 'linkedin', 'website']
    .filter((k) => sections.contact?.[k])
    .map((k) => sections.contact[k])
    .join(' | ')
  if (contactLine) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(contactLine, width / 2 + margin, y, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 24
  }

  if (sections.summary) y = addPdfSection(doc, 'PROFESSIONAL SUMMARY', [sections.summary], y, margin, width)
  if (sections.skills?.length) y = addPdfSection(doc, 'SKILLS', [sections.skills.join(', ')], y, margin, width)

  if (sections.experience?.length) {
    const lines = []
    for (const exp of sections.experience) {
      if (exp.title) lines.push(`${exp.title}${exp.dates ? ` | ${exp.dates}` : ''}`)
      for (const b of exp.bullets || []) lines.push(`• ${b}`)
    }
    y = addPdfSection(doc, 'PROFESSIONAL EXPERIENCE', lines, y, margin, width)
  }

  if (sections.projects?.length) {
    const lines = []
    for (const p of sections.projects) {
      if (p.name) lines.push(p.name)
      if (p.description) lines.push(`• ${p.description}`)
    }
    y = addPdfSection(doc, 'PROJECTS', lines, y, margin, width)
  }

  if (sections.education?.length) {
    const lines = []
    for (const edu of sections.education) {
      if (edu.institution) lines.push(edu.institution)
      if (edu.degree) lines.push(edu.degree)
    }
    y = addPdfSection(doc, 'EDUCATION', lines, y, margin, width)
  }

  return doc.output('blob')
}

function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    spacing: { before: 200, after: 100 },
  })
}

function body(text, bullet = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    bullet: bullet ? { level: 0 } : undefined,
    spacing: { after: 80 },
  })
}

export async function exportToDocx(resumeText) {
  const parsed = parseResume(resumeText)
  const sections = parsed.sections
  const children = []

  if (sections.contact?.name) {
    children.push(new Paragraph({
      children: [new TextRun({ text: sections.contact.name, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
    }))
  }

  const contactLine = ['email', 'phone', 'linkedin', 'website']
    .filter((k) => sections.contact?.[k])
    .map((k) => sections.contact[k])
    .join(' | ')
  if (contactLine) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactLine, size: 18, color: '505050' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }))
  }

  if (sections.summary) {
    children.push(heading('PROFESSIONAL SUMMARY'), body(sections.summary))
  }
  if (sections.skills?.length) {
    children.push(heading('SKILLS'), body(sections.skills.join(', ')))
  }
  if (sections.experience?.length) {
    children.push(heading('PROFESSIONAL EXPERIENCE'))
    for (const exp of sections.experience) {
      if (exp.title) children.push(body(`${exp.title}${exp.dates ? ` | ${exp.dates}` : ''}`))
      for (const b of exp.bullets || []) children.push(body(b, true))
    }
  }
  if (sections.projects?.length) {
    children.push(heading('PROJECTS'))
    for (const p of sections.projects) {
      if (p.name) children.push(body(p.name))
      if (p.description) children.push(body(p.description, true))
    }
  }
  if (sections.education?.length) {
    children.push(heading('EDUCATION'))
    for (const edu of sections.education) {
      if (edu.institution) children.push(body(edu.institution))
      if (edu.degree) children.push(body(edu.degree))
    }
  }

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}

export function exportPlainText(resumeText) {
  const parsed = parseResume(resumeText)
  return renderResumeText(parsed.sections)
}
