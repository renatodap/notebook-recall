'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'

interface ResearchQuestion {
  id: string
  question: string
  description: string | null
  status: 'open' | 'partial' | 'answered'
  priority: number
  created_at: string
}

export default function ResearchQuestionsClient({ userId }: { userId: string }) {
  const [questions, setQuestions] = useState<ResearchQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState({ question: '', description: '', priority: 5 })
  const [filter, setFilter] = useState<'all' | 'open' | 'partial' | 'answered'>('all')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/research-questions')
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/research-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      })

      if (res.ok) {
        const data = await res.json()
        setQuestions([...questions, data.question])
        setNewQuestion({ question: '', description: '', priority: 5 })
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create question:', error)
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async (id: string, status: 'open' | 'partial' | 'answered') => {
    try {
      const res = await fetch(`/api/research-questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        setQuestions(questions.map(q => q.id === id ? { ...q, status } : q))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredQuestions = filter === 'all'
    ? questions
    : questions.filter(q => q.status === filter)

  const statusCounts = {
    open: questions.filter(q => q.status === 'open').length,
    partial: questions.filter(q => q.status === 'partial').length,
    answered: questions.filter(q => q.status === 'answered').length
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading questions...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            All ({questions.length})
          </Button>
          <Button
            onClick={() => setFilter('open')}
            variant={filter === 'open' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Open ({statusCounts.open})
          </Button>
          <Button
            onClick={() => setFilter('partial')}
            variant={filter === 'partial' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Partial ({statusCounts.partial})
          </Button>
          <Button
            onClick={() => setFilter('answered')}
            variant={filter === 'answered' ? 'primary' : 'ghost'}
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Answered ({statusCounts.answered})
          </Button>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        >
          + Add Question
        </Button>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card className="text-center py-16">
          <CardBody>
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No research questions yet</h3>
            <p className="text-gray-600 mb-6">Start tracking the questions you&apos;re trying to answer</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Add Your First Question
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {question.question}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      question.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : question.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {question.status === 'answered' ? '✓ Answered' : question.status === 'partial' ? '⚡ Partial' : '❓ Open'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                      P{question.priority}
                    </span>
                  </div>
                </div>

                {question.description && (
                  <p className="text-gray-600 mb-4">{question.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Created {new Date(question.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    {question.status !== 'open' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(question.id, 'open')}
                      >
                        Mark Open
                      </Button>
                    )}
                    {question.status !== 'partial' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(question.id, 'partial')}
                      >
                        Mark Partial
                      </Button>
                    )}
                    {question.status !== 'answered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(question.id, 'answered')}
                      >
                        Mark Answered
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add Research Question</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={createQuestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question *
                    </label>
                    <Input
                      type="text"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      placeholder="What are you trying to answer?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={newQuestion.description}
                      onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                      placeholder="Additional context or details about this question"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority (1-10)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newQuestion.priority}
                      onChange={(e) => setNewQuestion({ ...newQuestion, priority: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={creating} className="flex-1">
                      {creating ? 'Creating...' : 'Add Question'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
