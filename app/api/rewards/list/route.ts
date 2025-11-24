import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: rewards, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true })

    if (error) {
      console.error('Load rewards error:', error)
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ rewards: [] })
    }

    return NextResponse.json({ rewards: rewards || [] })

  } catch (error) {
    console.error('Load rewards error:', error)
    return NextResponse.json({ rewards: [] })
  }
}
