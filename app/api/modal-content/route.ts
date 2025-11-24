import { NextResponse } from 'next/server'
import { getModalContent } from '@/lib/modalContent'

// Public API to get modal content (no auth required)
export async function GET() {
  try {
    const content = await getModalContent()
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Get modal content error:', error)
    return NextResponse.json({ error: 'Failed to get content' }, { status: 500 })
  }
}
