import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    const { data: profiles, error } = await query

    if (error) throw error

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Get profiles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
