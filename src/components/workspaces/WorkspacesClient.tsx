'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
}

export default function WorkspacesClient({ userId }: { userId: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace)
      })

      if (res.ok) {
        const data = await res.json()
        setWorkspaces([...workspaces, data.workspace])
        setNewWorkspace({ name: '', description: '' })
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create workspace:', error)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading workspaces...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Create Workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card className="text-center py-16">
          <CardBody>
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-600 mb-6">Create a workspace to collaborate with your team</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Workspace
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Link href={`/workspaces/${workspace.id}`}>
                  <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                    {workspace.name}
                  </h3>
                </Link>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {workspace.description || 'No description'}
                </p>
                <p className="text-xs text-gray-500">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </p>
                <div className="mt-4">
                  <Link href={`/workspaces/${workspace.id}`}>
                    <Button size="sm" variant="secondary" className="w-full">
                      Open Workspace →
                    </Button>
                  </Link>
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
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Workspace</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={createWorkspace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Workspace Name *
                    </label>
                    <Input
                      type="text"
                      value={newWorkspace.name}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                      placeholder="My Research Team"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={newWorkspace.description}
                      onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                      placeholder="What will your team work on?"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={creating} className="flex-1">
                      {creating ? 'Creating...' : 'Create Workspace'}
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
