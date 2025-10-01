import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_id, format = 'docx' } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    const { data: source } = await (supabase as any)
      .from('sources')
      .select('*, summaries (*)')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const summary = source.summaries?.[0]

    if (format === 'latex') {
      const latex = generateLaTeX(source, summary)
      return NextResponse.json({ content: latex, filename: `${source.title.replace(/[^a-z0-9]/gi, '_')}.tex` })
    } else if (format === 'docx') {
      const docContent = await generateDOCX(source, summary)
      return new NextResponse(docContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${source.title.replace(/[^a-z0-9]/gi, '_')}.docx"`
        }
      })
    } else {
      const markdown = generateMarkdown(source, summary)
      return NextResponse.json({ content: markdown, filename: `${source.title.replace(/[^a-z0-9]/gi, '_')}.md` })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateLaTeX(source: any, summary: any): string {
  return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}

\\title{${source.title}}
\\author{Research Notes}
\\date{${new Date(source.created_at).toLocaleDateString()}}

\\begin{document}

\\maketitle

\\section{Summary}

${summary?.summary_text || 'No summary available'}

${summary?.key_actions && summary.key_actions.length > 0 ? `
\\section{Key Actions}

\\begin{itemize}
${summary.key_actions.map((action: string) => `  \\item ${action}`).join('\n')}
\\end{itemize}
` : ''}

${summary?.key_topics && summary.key_topics.length > 0 ? `
\\section{Key Topics}

${summary.key_topics.map((topic: string) => `\\textbf{${topic}}`).join(', ')}
` : ''}

\\section{Original Content}

${source.original_content}

${source.url ? `
\\section{Source}

\\url{${source.url}}
` : ''}

\\end{document}`
}

async function generateDOCX(source: any, summary: any): Promise<Buffer> {
  const { Packer } = await import('docx')

  const children: any[] = [
    new Paragraph({
      text: source.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Created: ', bold: true }),
        new TextRun(new Date(source.created_at).toLocaleDateString())
      ]
    }),
    new Paragraph({ text: '' })
  ]

  if (summary?.summary_text) {
    children.push(
      new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: summary.summary_text }),
      new Paragraph({ text: '' })
    )
  }

  if (summary?.key_actions && summary.key_actions.length > 0) {
    children.push(
      new Paragraph({ text: 'Key Actions', heading: HeadingLevel.HEADING_1 })
    )
    summary.key_actions.forEach((action: string) => {
      children.push(
        new Paragraph({ text: `• ${action}` })
      )
    })
    children.push(new Paragraph({ text: '' }))
  }

  if (summary?.key_topics && summary.key_topics.length > 0) {
    children.push(
      new Paragraph({ text: 'Key Topics', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: summary.key_topics.join(', ') }),
      new Paragraph({ text: '' })
    )
  }

  children.push(
    new Paragraph({ text: 'Original Content', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: source.original_content })
  )

  if (source.url) {
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({ text: 'Source', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: source.url })
    )
  }

  const doc = new Document({
    sections: [{ children }]
  })

  return await Packer.toBuffer(doc)
}

function generateMarkdown(source: any, summary: any): string {
  let markdown = `# ${source.title}\n\n`
  markdown += `*Created: ${new Date(source.created_at).toLocaleDateString()}*\n\n`

  if (summary?.summary_text) {
    markdown += `## Summary\n\n${summary.summary_text}\n\n`
  }

  if (summary?.key_actions && summary.key_actions.length > 0) {
    markdown += `## Key Actions\n\n`
    summary.key_actions.forEach((action: string) => {
      markdown += `- ${action}\n`
    })
    markdown += `\n`
  }

  if (summary?.key_topics && summary.key_topics.length > 0) {
    markdown += `## Key Topics\n\n`
    markdown += summary.key_topics.map((t: string) => `**${t}**`).join(', ') + '\n\n'
  }

  markdown += `## Original Content\n\n${source.original_content}\n\n`

  if (source.url) {
    markdown += `## Source\n\n[${source.url}](${source.url})\n`
  }

  return markdown
}
