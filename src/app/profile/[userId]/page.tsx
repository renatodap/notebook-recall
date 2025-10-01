import { createServerClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import FollowButton from '@/components/social/FollowButton'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profileRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/profiles/${userId}`, {
    cache: 'no-store'
  })

  if (!profileRes.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">This profile is private or doesn&apos;t exist.</p>
          <Link href="/discover">
            <Button>← Discover Researchers</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { profile, stats } = await profileRes.json()

  const { data: publicSources } = await (supabase as any)
    .from('source_shares')
    .select('*, sources (*)')
    .eq('owner_id', userId)
    .eq('visibility', 'public')
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/discover">
              <Button variant="ghost">← Discover</Button>
            </Link>
            {user && user.id === userId && (
              <Link href="/settings">
                <Button variant="secondary" size="sm">⚙️ Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg">
          <CardBody className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                {profile.display_name?.[0]?.toUpperCase() || '👤'}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.display_name || 'Anonymous Researcher'}
                  </h1>
                  <FollowButton userId={userId} currentUserId={user?.id} />
                </div>

                {profile.username && (
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                )}

                {profile.affiliation && (
                  <p className="text-gray-700 mb-3">🏛️ {profile.affiliation}</p>
                )}

                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {profile.research_interests && profile.research_interests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Research Interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.research_interests.map((interest: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-900">{stats.followers}</span>
                    <span className="text-gray-600 ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{stats.following}</span>
                    <span className="text-gray-600 ml-1">following</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{stats.publicSources}</span>
                    <span className="text-gray-600 ml-1">public sources</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {publicSources && publicSources.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Public Research</h2>
            <div className="space-y-4">
              {publicSources.map((share: any) => (
                <Card key={share.id} className="hover:shadow-lg transition-shadow">
                  <CardBody className="p-6">
                    <Link href={`/public/source/${share.source_id}`}>
                      <h3 className="text-lg font-semibold text-indigo-600 hover:text-indigo-700 mb-2">
                        {share.sources.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600">
                      {new Date(share.sources.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
