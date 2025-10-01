'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Workspace {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
}

interface Member {
  user_id: string
  role: string
  joined_at: string
}

export default function WorkspaceDetailClient({
  workspace,
  members,
  currentUserId
}: {
  workspace: Workspace
  members: Member[]
  currentUserId: string
}) {
  const [addingMember, setAddingMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')

  const isOwner = workspace.owner_id === currentUserId

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingMember(true)
    try {
      // In a real implementation, you'd lookup user by email first
      alert('Member invitation feature coming soon!')
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-gray-600 mt-2">{workspace.description || 'No description'}</p>
            </div>
            {isOwner && (
              <Button variant="secondary" size="sm">
                ⚙️ Settings
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Shared Sources</h2>
            </CardHeader>
            <CardBody>
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">📚</div>
                <p>No sources shared in this workspace yet</p>
                <p className="text-sm mt-2">Sources will appear here when team members share them</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Members ({members.length + 1})</h2>
                {isOwner && (
                  <Button size="sm" onClick={() => setAddingMember(!addingMember)}>
                    + Add
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    👑
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">You</p>
                    <p className="text-xs text-gray-600">Owner</p>
                  </div>
                </div>

                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Team Member</p>
                      <p className="text-xs text-gray-600 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {addingMember && isOwner && (
                <form onSubmit={addMember} className="mt-4 pt-4 border-t border-gray-200">
                  <Input
                    type="email"
                    placeholder="Enter email to invite"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="mb-2"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">
                      Invite
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingMember(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
