// Script to investigate user testhack3@matkinhtamduc.com
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateUser() {
    const email = 'testhack3@matkinhtamduc.com'

    console.log('=== INVESTIGATING USER:', email, '===\n')

    // 1. Get user data
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

    if (userError) {
        console.error('Error fetching user:', userError)
        return
    }

    console.log('USER DATA:')
    console.log('- ID:', user.id)
    console.log('- Email:', user.email)
    console.log('- Phone:', user.phone)
    console.log('- plays_today:', user.plays_today)
    console.log('- bonus_plays:', user.bonus_plays)
    console.log('- last_play_date:', user.last_play_date)
    console.log('- created_at:', user.created_at)
    console.log()

    // 2. Get all game sessions
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })

    if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        return
    }

    console.log('GAME SESSIONS (Total:', sessions?.length || 0, ')')
    sessions?.forEach((session, index) => {
        console.log(`\n[${index + 1}] Session ID:`, session.id)
        console.log('  - Status:', session.status)
        console.log('  - Score:', session.score)
        console.log('  - Start time:', session.start_time)
        console.log('  - End time:', session.end_time)
        console.log('  - Game token:', session.game_token?.substring(0, 8) + '...')
    })
    console.log()

    // 3. Get game config
    const { data: config } = await supabase
        .from('game_config')
        .select('*')
        .single()

    console.log('GAME CONFIG:')
    console.log('- maxPlaysPerDay:', config?.max_plays_per_day)
    console.log()

    // 4. Calculate expected vs actual
    const maxPlays = config?.max_plays_per_day || 3
    const expectedRemaining = Math.max(0, maxPlays - user.plays_today) + user.bonus_plays
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0

    console.log('ANALYSIS:')
    console.log('- Expected remaining plays:', expectedRemaining)
    console.log('- Completed sessions count:', completedSessions)
    console.log('- plays_today in DB:', user.plays_today)
    console.log('- MISMATCH:', completedSessions !== user.plays_today ? '⚠️ YES' : '✅ NO')
}

investigateUser().catch(console.error)
