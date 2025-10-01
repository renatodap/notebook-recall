'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Link from 'next/link'

interface Methodology {
  id: string
  source_id: string
  source_title?: string
  method_type: string | null
  sample_size: number | null
  population: string | null
  variables: any
  measures: any
  analysis_methods: string[]
  limitations: string | null
}

export default function MethodologyComparisonClient() {
  const [methodologies, setMethodologies] = useState<Methodology[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  useEffect(() => {
    fetchMethodologies()
  }, [])

  const fetchMethodologies = async () => {
    try {
      const res = await fetch('/api/methodology/extract')
      if (res.ok) {
        const data = await res.json()
        setMethodologies(data.methodologies || [])
      }
    } catch (error) {
      console.error('Failed to fetch methodologies:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const selectedMethodologies = selectedSources.length > 0
    ? methodologies.filter(m => selectedSources.includes(m.source_id))
    : methodologies

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading methodologies...</p>
      </div>
    )
  }

  if (methodologies.length === 0) {
    return (
      <Card className="text-center py-16">
        <CardBody>
          <div className="text-6xl mb-4">🔬</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No methodologies extracted yet</h3>
          <p className="text-gray-600">Extract methodologies from your sources to compare them</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Sources to Compare</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {methodologies.map(m => (
              <button
                key={m.source_id}
                onClick={() => toggleSource(m.source_id)}
                className={`px-3 sm:px-4 py-2 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  selectedSources.includes(m.source_id)
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                }`}
              >
                <span className="line-clamp-1">{m.source_title || 'Unknown Source'}</span>
              </button>
            ))}
          </div>
          {selectedSources.length > 0 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSources([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Source</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Method Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Sample Size</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Population</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Variables</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {selectedMethodologies.map((methodology, idx) => (
              <tr key={methodology.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                <td className="px-6 py-4">
                  <Link
                    href={`/source/${methodology.source_id}`}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {methodology.source_title || 'Unknown'}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {methodology.method_type || 'Not specified'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {methodology.sample_size ? `n=${methodology.sample_size}` : 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                  {methodology.population || 'Not specified'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {methodology.variables ? (
                    <div className="space-y-1">
                      {methodology.variables.independent?.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-700">IV:</span>
                          <span className="text-gray-600 ml-1">
                            {methodology.variables.independent.join(', ')}
                          </span>
                        </div>
                      )}
                      {methodology.variables.dependent?.length > 0 && (
                        <div>
                          <span className="font-semibold text-gray-700">DV:</span>
                          <span className="text-gray-600 ml-1">
                            {methodology.variables.dependent.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {methodology.analysis_methods?.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700">
                      {methodology.analysis_methods.map((method, i) => (
                        <li key={i}>{method}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">None specified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {selectedMethodologies.map((methodology) => (
          <Card key={methodology.id} className="shadow-lg">
            <CardHeader className="bg-purple-50">
              <Link
                href={`/source/${methodology.source_id}`}
                className="text-lg font-bold text-purple-600 hover:text-purple-700"
              >
                {methodology.source_title || 'Unknown Source'}
              </Link>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Method Type</p>
                <p className="text-sm text-gray-900">{methodology.method_type || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Sample Size</p>
                  <p className="text-sm text-gray-900">{methodology.sample_size ? `n=${methodology.sample_size}` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Population</p>
                  <p className="text-sm text-gray-900 truncate">{methodology.population || 'Not specified'}</p>
                </div>
              </div>
              {methodology.variables && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Variables</p>
                  {methodology.variables.independent?.length > 0 && (
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">IV:</span> {methodology.variables.independent.join(', ')}
                    </p>
                  )}
                  {methodology.variables.dependent?.length > 0 && (
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">DV:</span> {methodology.variables.dependent.join(', ')}
                    </p>
                  )}
                </div>
              )}
              {methodology.analysis_methods?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Analysis Methods</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {methodology.analysis_methods.map((method, i) => (
                      <li key={i}>{method}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {selectedMethodologies.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Summary Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Studies</p>
                <p className="text-3xl font-bold text-purple-600">{selectedMethodologies.length}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Sample Size</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    selectedMethodologies
                      .filter(m => m.sample_size)
                      .reduce((sum, m) => sum + (m.sample_size || 0), 0) /
                    selectedMethodologies.filter(m => m.sample_size).length || 0
                  )}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Method Types</p>
                <p className="text-3xl font-bold text-purple-600">
                  {new Set(selectedMethodologies.map(m => m.method_type).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
