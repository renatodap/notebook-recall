'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'

interface FollowButtonProps {
  userId: string
  currentUserId?: string
  initialFollowing?: boolean
}

export default function FollowButton({ userId, currentUserId, initialFollowing = false }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUserId && currentUserId !== userId) {
      checkFollowStatus()
    }
  }, [userId, currentUserId])

  const checkFollowStatus = async () => {
    try {
      const res = await fetch('/api/social/follow?type=following')
      if (res.ok) {
        const data = await res.json()
        const isFollowing = data.following?.some((f: any) => f.following_id === userId)
        setFollowing(isFollowing)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }

  const toggleFollow = async () => {
    setLoading(true)
    try {
      if (following) {
        const res = await fetch(`/api/social/follow?user_id=${userId}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setFollowing(false)
        }
      } else {
        const res = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id_to_follow: userId })
        })
        if (res.ok) {
          setFollowing(true)
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUserId || currentUserId === userId) {
    return null
  }

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      className={following ? '' : 'bg-indigo-600 hover:bg-indigo-700'}
    >
      {loading ? '...' : following ? '✓ Following' : '+ Follow'}
    </Button>
  )
}
