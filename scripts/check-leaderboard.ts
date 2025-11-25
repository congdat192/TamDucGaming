import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envConfig = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
        acc[key.trim()] = value.trim()
    }
    return acc
}, {} as Record<string, string>)

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log(`Service Key Length: ${supabaseServiceKey.length}`)

async function checkLeaderboard() {
    console.log('Checking Leaderboard Data (Ground Truth)...')

    // Check All Time
    const { data: allTime, error: allTimeError } = await supabase
        .from('leaderboard_all_time')
        .select('*')
        .limit(5)

    if (allTimeError) console.error('Error fetching all_time:', allTimeError)
    else {
        console.log('\n--- TOP 5 ALL TIME ---')
        allTime.forEach((r, i) => console.log(`${i + 1}. ${r.email || r.phone}: ${r.total_score} pts (${r.games_played} games)`))
    }

    // Check Weekly
    const { data: weekly, error: weeklyError } = await supabase
        .from('leaderboard_weekly')
        .select('*')
        .limit(5)

    if (weeklyError) console.error('Error fetching weekly:', weeklyError)
    else {
        console.log('\n--- TOP 5 WEEKLY ---')
        weekly.forEach((r, i) => console.log(`${i + 1}. ${r.email || r.phone}: ${r.weekly_score} pts`))
    }
}

checkLeaderboard()
