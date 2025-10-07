import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { AuthenticationError, RateLimitError, handleAPIError } from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * Feature 32: Analytics Dashboard
 * Comprehensive insights and statistics about research activity
 */

interface SourceRecord {
  id: string
  source_type: string
  tags: string[]
  created_at: string
}

interface PublishedOutput {
  output_type: string
  status: string
  created_at: string
}

interface TagFrequency {
  tag: string
  count: number
}

interface DateCount {
  date: string
  count: number
}

interface AnalyticsOverview {
  totalSources: number
  totalCollections: number
  totalSynthesisReports: number
  totalPublishedOutputs: number
  productivityScore: number
}

interface AnalyticsBreakdown {
  bySourceType: Record<string, number>
  aiFeatureUsage: {
    connectionsDiscovered: number
    conceptsExtracted: number
    contradictionsFound: number
  }
  publishing: {
    byType: Record<string, number>
    byStatus: Record<string, number>
    total: number
  }
  collaboration: {
    sharesCreated: number
    following: number
    followers: number
  }
}

interface AnalyticsTrends {
  sourcesOverTime: DateCount[]
}

interface AnalyticsTopItems {
  tags: TagFrequency[]
}

interface AnalyticsResponse {
  period: string
  generatedAt: string
  overview: AnalyticsOverview
  breakdown: AnalyticsBreakdown
  trends: AnalyticsTrends
  topItems: AnalyticsTopItems
  insights: string[]
}

/**
 * GET /api/analytics/dashboard - Get comprehensive analytics
 * Query params:
 *   - period: '7days' | '30days' | '90days' | 'year' | 'all' (default: '30days')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view analytics')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
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

    // Initialize analytics response
    const analytics: AnalyticsResponse = {
      period,
      generatedAt: now.toISOString(),
      overview: {
        totalSources: 0,
        totalCollections: 0,
        totalSynthesisReports: 0,
        totalPublishedOutputs: 0,
        productivityScore: 0
      },
      breakdown: {
        bySourceType: {},
        aiFeatureUsage: {
          connectionsDiscovered: 0,
          conceptsExtracted: 0,
          contradictionsFound: 0
        },
        publishing: {
          byType: {},
          byStatus: {},
          total: 0
        },
        collaboration: {
          sharesCreated: 0,
          following: 0,
          followers: 0
        }
      },
      trends: {
        sourcesOverTime: []
      },
      topItems: {
        tags: []
      },
      insights: []
    }

    // OVERVIEW STATISTICS
    let sourceQuery = supabase
      .from('sources')
      .select('id, source_type, tags, created_at')
      .eq('user_id', user.id)

    if (startDate) {
      sourceQuery = sourceQuery.gte('created_at', startDate.toISOString())
    }

    const { data: sources, count: totalSources } = await sourceQuery

    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: synthesisCount } = await supabase
      .from('synthesis_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: publishedOutputsCount } = await supabase
      .from('published_outputs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    analytics.overview = {
      totalSources: totalSources || 0,
      totalCollections: collectionsCount || 0,
      totalSynthesisReports: synthesisCount || 0,
      totalPublishedOutputs: publishedOutputsCount || 0,
      productivityScore: 0
    }

    // BREAKDOWN BY SOURCE TYPE
    const typedSources = (sources || []) as SourceRecord[]
    const sourceTypeBreakdown = typedSources.reduce<Record<string, number>>((acc, s) => {
      const type = s.source_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    analytics.breakdown.bySourceType = sourceTypeBreakdown

    // TAG ANALYSIS
    const allTags = typedSources.flatMap((s) => s.tags || [])
    const tagFrequency = allTags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})

    const topTags: TagFrequency[] = Object.entries(tagFrequency)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count: count as number }))

    analytics.topItems.tags = topTags

    // ACTIVITY TRENDS (sources added over time)
    const sourcesGrouped = typedSources.reduce<Record<string, number>>((acc, s) => {
      const date = new Date(s.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    analytics.trends.sourcesOverTime = Object.entries(sourcesGrouped)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // AI FEATURE USAGE
    const { count: connectionsCount } = await supabase
      .from('source_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: conceptsCount } = await supabase
      .from('concepts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: contradictionsCount } = await supabase
      .from('contradictions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    analytics.breakdown.aiFeatureUsage = {
      connectionsDiscovered: connectionsCount || 0,
      conceptsExtracted: conceptsCount || 0,
      contradictionsFound: contradictionsCount || 0,
    }

    // PUBLISHING ANALYTICS
    const { data: outputs } = await supabase
      .from('published_outputs')
      .select('output_type, status, created_at')
      .eq('user_id', user.id)

    const typedOutputs = (outputs || []) as PublishedOutput[]
    const outputTypeBreakdown = typedOutputs.reduce<Record<string, number>>((acc, o) => {
      acc[o.output_type] = (acc[o.output_type] || 0) + 1
      return acc
    }, {})

    const outputStatusBreakdown = typedOutputs.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})

    analytics.breakdown.publishing = {
      byType: outputTypeBreakdown,
      byStatus: outputStatusBreakdown,
      total: typedOutputs.length
    }

    // COLLABORATION STATS
    const { count: sharesCount } = await supabase
      .from('source_shares')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    const { count: followersCount } = await supabase
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
    return handleAPIError(error)
  }
}
