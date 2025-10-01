import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 32: Analytics Dashboard
 * Comprehensive insights and statistics about research activity
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, year, all

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
    }

    const analytics: any = {
      period,
      generatedAt: now.toISOString(),
      overview: {},
      breakdown: {},
      trends: {},
      topItems: {},
      insights: []
    }

    // OVERVIEW STATISTICS
    let sourceQuery = (supabase as any)
      .from('sources')
      .select('id, source_type, tags, created_at')
      .eq('user_id', user.id)

    if (startDate) {
      sourceQuery = sourceQuery.gte('created_at', startDate.toISOString())
    }

    const { data: sources, count: totalSources } = await sourceQuery

    const { count: collectionsCount } = await (supabase as any)
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: synthesisCount } = await (supabase as any)
      .from('synthesis_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: publishedOutputsCount } = await (supabase as any)
      .from('published_outputs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    analytics.overview = {
      totalSources: totalSources || 0,
      totalCollections: collectionsCount || 0,
      totalSynthesisReports: synthesisCount || 0,
      totalPublishedOutputs: publishedOutputsCount || 0,
    }

    // BREAKDOWN BY SOURCE TYPE
    const sourceTypeBreakdown = (sources || []).reduce((acc: any, s: any) => {
      const type = s.source_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    analytics.breakdown.bySourceType = sourceTypeBreakdown

    // TAG ANALYSIS
    const allTags = (sources || []).flatMap((s: any) => s.tags || [])
    const tagFrequency = allTags.reduce((acc: any, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})

    const topTags = Object.entries(tagFrequency)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    analytics.topItems.tags = topTags

    // ACTIVITY TRENDS (sources added over time)
    const sourcesGrouped = (sources || []).reduce((acc: any, s: any) => {
      const date = new Date(s.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    analytics.trends.sourcesOverTime = Object.entries(sourcesGrouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date))

    // AI FEATURE USAGE
    const { count: connectionsCount } = await (supabase as any)
      .from('source_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: conceptsCount } = await (supabase as any)
      .from('concepts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: contradictionsCount } = await (supabase as any)
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    analytics.breakdown.aiFeatureUsage = {
      connectionsDiscovered: connectionsCount || 0,
      conceptsExtracted: conceptsCount || 0,
      contradictionsFound: contradictionsCount || 0,
    }

    // PUBLISHING ANALYTICS
    const { data: outputs } = await (supabase as any)
      .from('published_outputs')
      .select('output_type, status, created_at')
      .eq('user_id', user.id)

    const outputTypeBreakdown = (outputs || []).reduce((acc: any, o: any) => {
      acc[o.output_type] = (acc[o.output_type] || 0) + 1
      return acc
    }, {})

    const outputStatusBreakdown = (outputs || []).reduce((acc: any, o: any) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})

    analytics.breakdown.publishing = {
      byType: outputTypeBreakdown,
      byStatus: outputStatusBreakdown,
      total: outputs?.length || 0
    }

    // COLLABORATION STATS
    const { count: sharesCount } = await (supabase as any)
      .from('source_shares')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    const { count: followingCount } = await (supabase as any)
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    const { count: followersCount } = await (supabase as any)
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id)

    analytics.breakdown.collaboration = {
      sharesCreated: sharesCount || 0,
      following: followingCount || 0,
      followers: followersCount || 0
    }

    // INSIGHTS & RECOMMENDATIONS
    const insights: string[] = []

    if (totalSources && totalSources > 0) {
      const avgSourcesPerDay = totalSources / (period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365)

      if (avgSourcesPerDay > 2) {
        insights.push(`You're highly productive! Adding ${avgSourcesPerDay.toFixed(1)} sources per day on average.`)
      } else if (avgSourcesPerDay < 0.5) {
        insights.push(`Consider adding more sources to enrich your research database.`)
      }
    }

    if (topTags.length > 0) {
      insights.push(`Your most-used tag is "${topTags[0].tag}" with ${topTags[0].count} sources.`)
    }

    if (synthesisCount && totalSources && synthesisCount / totalSources < 0.1) {
      insights.push(`You have ${totalSources} sources but only ${synthesisCount} synthesis reports. Consider creating more syntheses to connect your research.`)
    }

    if (connectionsCount === 0 && totalSources && totalSources > 5) {
      insights.push(`Try discovering connections between your sources to reveal hidden relationships.`)
    }

    if (publishedOutputsCount === 0 && totalSources && totalSources > 10) {
      insights.push(`You have enough sources to create publications! Try generating a blog post, paper, or presentation.`)
    }

    analytics.insights = insights

    // PRODUCTIVITY SCORE (0-100)
    let productivityScore = 0
    if (totalSources) productivityScore += Math.min(totalSources / 10, 30)
    if (synthesisCount) productivityScore += Math.min(synthesisCount / 5, 20)
    if (publishedOutputsCount) productivityScore += Math.min(publishedOutputsCount / 3, 20)
    if (connectionsCount) productivityScore += Math.min(connectionsCount / 10, 15)
    if (collectionsCount) productivityScore += Math.min(collectionsCount / 5, 15)

    analytics.overview.productivityScore = Math.round(Math.min(productivityScore, 100))

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
