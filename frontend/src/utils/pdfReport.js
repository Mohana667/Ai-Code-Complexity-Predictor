function cleanText(value) {
  if (value === null || value === undefined) return ''

  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapText(text, maxChars = 88) {
  const lines = []

  String(text || '')
    .split(/\r?\n/)
    .forEach((originalLine) => {
      if (!originalLine.trim()) {
        lines.push('')
        return
      }

      let line = originalLine

      while (line.length > maxChars) {
        let cut = line.lastIndexOf(' ', maxChars)

        if (cut <= 0) {
          cut = maxChars
        }

        lines.push(line.slice(0, cut))
        line = line.slice(cut).trimStart()
      }

      lines.push(line)
    })

  return lines
}

function createPdf(lines) {
  const pageWidth = 595
  const pageHeight = 842
  const margin = 42
  const lineHeight = 13
  const linesPerPage = 58

  const pages = []

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage))
  }

  if (pages.length === 0) {
    pages.push([])
  }

  const objects = []

  // Catalog
  objects.push(
    '<< /Type /Catalog /Pages 2 0 R >>'
  )

  // Page references
  const pageObjectNumbers = pages.map(
    (_, index) => 3 + index * 2
  )

  // Pages
  objects.push(
    `<< /Type /Pages /Kids [${pageObjectNumbers
      .map((number) => `${number} 0 R`)
      .join(' ')}] /Count ${pages.length} >>`
  )

  // Pages + content streams
  pages.forEach((pageLines, pageIndex) => {
    const pageObjectNumber = 3 + pageIndex * 2
    const contentObjectNumber =
      pageObjectNumber + 1

    const commands = [
      'BT',
      '/F1 9 Tf',
      `${margin} ${pageHeight - margin} Td`,
    ]

    pageLines.forEach((line, index) => {
      if (index > 0) {
        commands.push(`0 -${lineHeight} Td`)
      }

      commands.push(`(${cleanText(line)}) Tj`)
    })

    commands.push('ET')

    const stream = commands.join('\n')

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    )

    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    )
  })

  // Helvetica font
  objects.push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  )

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length

    pdf += `${index + 1} 0 obj\n`
    pdf += `${object}\n`
    pdf += 'endobj\n'
  })

  const xrefOffset = pdf.length

  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(
      10,
      '0'
    )} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\n`

  pdf += `startxref\n${xrefOffset}\n`
  pdf += '%%EOF'

  return pdf
}

export function downloadAnalysisPdf(analysis) {
  const estimate = analysis?.estimate || {}
  const metrics = analysis?.metrics || {}

  const filename =
    analysis?.filename ||
    `${analysis?.language || 'code'}-analysis`

  const confidence =
    estimate.confidence !== undefined
      ? `${Math.round(
          Number(estimate.confidence) * 100
        )}%`
      : 'N/A'

  const lines = [
    'AI CODE COMPLEXITY PREDICTOR',
    '==============================================',
    '',
    'ANALYSIS REPORT',
    '----------------------------------------------',
    `Language: ${analysis?.language || 'Unknown'}`,
    `File: ${filename}`,
    `Date: ${
      analysis?.created_at
        ? new Date(
            analysis.created_at
          ).toLocaleString()
        : new Date().toLocaleString()
    }`,
    `AI Enhanced: ${
      analysis?.ai_enhanced ? 'Yes' : 'No'
    }`,
    '',
    'COMPLEXITY RESULT',
    '----------------------------------------------',
    `Time Complexity: ${
      estimate.time_complexity || 'N/A'
    }`,
    `Space Complexity: ${
      estimate.space_complexity || 'N/A'
    }`,
    `Risk Level: ${
      estimate.risk_level || 'N/A'
    }`,
    `Risk Score: ${
      estimate.risk_score ?? 'N/A'
    }/100`,
    `Confidence: ${confidence}`,
    '',
    'STRUCTURAL METRICS',
    '----------------------------------------------',
    `Lines of Code: ${
      metrics.lines_of_code ?? 'N/A'
    }`,
    `Maximum Nesting Depth: ${
      metrics.max_nesting_depth ?? 'N/A'
    }`,
    `Loop Count: ${
      metrics.loop_count ?? 'N/A'
    }`,
    `Nested Loop Depth: ${
      metrics.nested_loop_depth ?? 'N/A'
    }`,
    `Function Count: ${
      metrics.function_count ?? 'N/A'
    }`,
    `Conditional Count: ${
      metrics.conditional_count ?? 'N/A'
    }`,
    `Dependency Count: ${
      metrics.dependency_count ?? 'N/A'
    }`,
    `Cyclomatic Complexity: ${
      metrics.cyclomatic_complexity ?? 'N/A'
    }`,
    `Recursive Functions: ${
      metrics.recursive_functions?.length
        ? metrics.recursive_functions.join(', ')
        : 'None'
    }`,
    '',
    'COMPLEXITY EXPLANATION',
    '----------------------------------------------',
    ...wrapText(
      estimate.complexity_reason ||
        estimate.explanation ||
        'No explanation available.'
    ),
    '',
    'PERFORMANCE ANALYSIS',
    '----------------------------------------------',
    ...wrapText(
      estimate.performance_analysis ||
        'No performance analysis available.'
    ),
    '',
    'PERFORMANCE RISKS',
    '----------------------------------------------',
    ...(estimate.performance_risks?.length
      ? estimate.performance_risks.flatMap(
          (item) =>
            wrapText(`• ${item}`)
        )
      : ['No performance risks identified.']),
    '',
    'HOTSPOTS',
    '----------------------------------------------',
    ...(estimate.hotspots?.length
      ? estimate.hotspots.flatMap(
          (item) =>
            wrapText(`• ${item}`)
        )
      : ['No hotspots identified.']),
    '',
    'OPTIMIZATION SUGGESTIONS',
    '----------------------------------------------',
    ...(estimate.optimization_suggestions
      ?.length
      ? estimate.optimization_suggestions.flatMap(
          (item) =>
            wrapText(`• ${item}`)
        )
      : [
          'No optimization suggestions available.',
        ]),
    '',
    'BETTER APPROACH',
    '----------------------------------------------',
    ...wrapText(
      estimate.better_approach ||
        'No alternative approach available.'
    ),
    '',
    'SOURCE CODE',
    '----------------------------------------------',
    ...wrapText(
      analysis?.code ||
        'Source code was not stored for this analysis.'
    ),
    '',
    'Generated by AI Code Complexity Predictor',
  ]

  const pdf = createPdf(lines)

  const blob = new Blob([pdf], {
    type: 'application/pdf',
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = `${filename.replace(
    /[^a-z0-9_-]/gi,
    '_'
  )}-complexity-report.pdf`

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}