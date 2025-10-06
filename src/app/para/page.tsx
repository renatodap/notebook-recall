import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import PARADashboardRedesign from '@/components/para/PARADashboardRedesign'
import type { DatabaseRecord } from '@/types/api-types'

export const dynamic = 'force-dynamic'

export default async function PARAPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch projects with source counts
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      sources:project_sources(count)
    `)
    .eq('user_id' as never, user.id)
    .order('created_at' as never, { ascending: false })

  const projectsWithCount = (projects as any[])?.map((p: any) => ({
    ...p,
    source_count: p.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch areas with source counts
  const { data: areas } = await supabase
    .from('areas')
    .select(`
      *,
      sources:area_sources(count)
    `)
    .eq('user_id' as never, user.id)
    .order('created_at' as never, { ascending: false })

  const areasWithCount = (areas as any[])?.map((a: any) => ({
    ...a,
    source_count: a.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch resources with source counts
  const { data: resources } = await supabase
    .from('resources')
    .select(`
      *,
      sources:resource_sources(count)
    `)
    .eq('user_id' as never, user.id)
    .order('created_at' as never, { ascending: false })

  const resourcesWithCount = (resources as any[])?.map((r: any) => ({
    ...r,
    source_count: r.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  // Fetch PARA stats
  const { data: statsData } = await supabase
    .rpc('get_para_stats', { p_user_id: user.id } as never)
    .single()

  const stats = {
    total_sources: Number((statsData as any)?.total_sources) || 0,
    archived_sources: Number((statsData as any)?.archived_sources) || 0,
    unassigned_sources: Number((statsData as any)?.unassigned_sources) || 0,
    project_count: Number((statsData as any)?.project_count) || 0,
    area_count: Number((statsData as any)?.area_count) || 0,
    resource_count: Number((statsData as any)?.resource_count) || 0,
  }

  return (
    <PARADashboardRedesign
      initialProjects={projectsWithCount}
      initialAreas={areasWithCount}
      initialResources={resourcesWithCount}
      stats={stats}
    />
  )
}
