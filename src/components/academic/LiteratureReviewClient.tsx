'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'

interface Template {
  id: string
  name: string
  description: string
  sections: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 'systematic',
    name: 'Systematic Review',
    description: 'Comprehensive review following PRISMA guidelines',
    sections: ['Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion']
  },
  {
    id: 'narrative',
    name: 'Narrative Review',
    description: 'Traditional narrative synthesis of literature',
    sections: ['Introduction', 'Theoretical Framework', 'Literature Analysis', 'Synthesis', 'Conclusion']
  },
  {
    id: 'meta-analysis',
    name: 'Meta-Analysis',
    description: 'Quantitative synthesis of research findings',
    sections: ['Introduction', 'Methods', 'Statistical Analysis', 'Results', 'Discussion']
  },
  {
    id: 'scoping',
    name: 'Scoping Review',
    description: 'Map key concepts and identify gaps',
    sections: ['Introduction', 'Methods', 'Results', 'Discussion', 'Gaps Identified']
  },
  {
    id: 'integrative',
    name: 'Integrative Review',
    description: 'Combine diverse methodologies',
    sections: ['Introduction', 'Literature Identification', 'Data Evaluation', 'Data Analysis', 'Presentation']
  }
]

export default function LiteratureReviewClient() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatedReview, setGeneratedReview] = useState<string>('')

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources')
      if (res.ok) {
        const data = await res.json()
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    }
  }

  const generateReview = async () => {
    if (!selectedTemplate || selectedSources.length === 0) return

    setGenerating(true)
    try {
      const res = await fetch('/api/literature-review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: selectedSources,
          template_type: selectedTemplate.id
        })
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedReview(data.review || '')
      }
    } catch (error) {
      console.error('Failed to generate review:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {!selectedTemplate ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map(template => (
            <Card
              key={template.id}
              className="hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Sections:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {template.sections.map((section, i) => (
                      <li key={i}>• {section}</li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full mt-4">Select Template</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  Change Template
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.sections.map((section, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {section}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Select Sources ({selectedSources.length})</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sources.map(source => (
                  <label
                    key={source.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSources([...selectedSources, source.id])
                        } else {
                          setSelectedSources(selectedSources.filter(id => id !== source.id))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{source.title}</p>
                      <p className="text-sm text-gray-600 capitalize">{source.content_type}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={generateReview}
              disabled={generating || selectedSources.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {generating ? 'Generating Literature Review...' : `Generate Review (${selectedSources.length} sources)`}
            </Button>
          </div>

          {generatedReview && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Generated Literature Review</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedReview)
                      alert('Copied to clipboard!')
                    }}
                  >
                    📋 Copy
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <Textarea
                  value={generatedReview}
                  readOnly
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
