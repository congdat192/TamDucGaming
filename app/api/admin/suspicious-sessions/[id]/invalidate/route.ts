import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string }
    return payload.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sessionId } = await params

  try {
    // Get session to find validated_score
    const { data: session, error: fetchError } = await supabaseAdmin
      .from('game_sessions')
      .select('user_id, validated_score, status')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'invalid') {
      return NextResponse.json({ error: 'Session already invalidated' }, { status: 400 })
    }

    // Mark session as invalid
    const { error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({
        status: 'invalid',
        suspicion_reason: (session.suspicion_reason || '') + ' | Admin invalidated'
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    // Subtract validated_score from user's total_score
    if (session.validated_score && session.validated_score > 0) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('total_score')
        .eq('id', session.user_id)
        .single()

      if (user) {
        const newTotalScore = Math.max(0, user.total_score - session.validated_score)
        await supabaseAdmin
          .from('users')
          .update({ total_score: newTotalScore })
          .eq('id', session.user_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
