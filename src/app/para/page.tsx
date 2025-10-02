import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import PARAClient from '@/components/para/PARAClient'

export const dynamic = 'force-dynamic'

export default async function PARAPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch projects with source counts
  const { data: projects } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      sources:project_sources(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const projectsWithCount = projects?.map((p: any) => ({
    ...p,
    source_count: p.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch areas with source counts
  const { data: areas } = await (supabase as any)
    .from('areas')
    .select(`
      *,
      sources:area_sources(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const areasWithCount = areas?.map((a: any) => ({
    ...a,
    source_count: a.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch resources with source counts
  const { data: resources } = await (supabase as any)
    .from('resources')
    .select(`
      *,
      sources:resource_sources(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const resourcesWithCount = resources?.map((r: any) => ({
    ...r,
    source_count: r.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch PARA stats
  const { data: statsData } = await (supabase as any)
    .rpc('get_para_stats', { p_user_id: user.id })
    .single()

  const stats = {
    total_sources: Number(statsData?.total_sources) || 0,
    archived_sources: Number(statsData?.archived_sources) || 0,
    unassigned_sources: Number(statsData?.unassigned_sources) || 0,
    project_count: Number(statsData?.project_count) || 0,
    area_count: Number(statsData?.area_count) || 0,
    resource_count: Number(statsData?.resource_count) || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">PARA</h1>
          <p className="text-lg text-gray-600">
            Projects, Areas, Resources & Archive — Organize your knowledge with purpose
          </p>
        </div>

        {/* Main Content */}
        <PARAClient
          initialProjects={projectsWithCount}
          initialAreas={areasWithCount}
          initialResources={resourcesWithCount}
          stats={stats}
        />
      </div>
    </div>
  )
}
