'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '../ui/Card'
import Input from '../ui/Input'
import Link from 'next/link'
import FollowButton from './FollowButton'

interface UserProfile {
  user_id: string
  display_name: string | null
  username: string | null
  bio: string | null
  affiliation: string | null
  research_interests: string[]
}

export default function DiscoverClient({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [search])

  const fetchProfiles = async () => {
    try {
      const res = await fetch(`/api/profiles?search=${search}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 max-w-2xl mx-auto">
        <Input
          type="text"
          placeholder="🔍 Search researchers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading researchers...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600">No public profiles found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.user_id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/profile/${profile.user_id}`}>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:scale-105 transition-transform">
                      {profile.display_name?.[0]?.toUpperCase() || '👤'}
                    </div>
                  </Link>
                  <FollowButton userId={profile.user_id} currentUserId={currentUserId} />
                </div>

                <Link href={`/profile/${profile.user_id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 mb-1 cursor-pointer">
                    {profile.display_name || 'Anonymous'}
                  </h3>
                </Link>

                {profile.username && (
                  <p className="text-sm text-gray-600 mb-2">@{profile.username}</p>
                )}

                {profile.affiliation && (
                  <p className="text-sm text-gray-700 mb-3">🏛️ {profile.affiliation}</p>
                )}

                {profile.bio && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{profile.bio}</p>
                )}

                {profile.research_interests && profile.research_interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.research_interests.slice(0, 3).map((interest, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                        {interest}
                      </span>
                    ))}
                    {profile.research_interests.length > 3 && (
                      <span className="text-xs text-gray-500">+{profile.research_interests.length - 3}</span>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
