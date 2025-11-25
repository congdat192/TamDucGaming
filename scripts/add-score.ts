import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env from .env file manually
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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addScore(email: string, scoreToAdd: number) {
    console.log(`Adding ${scoreToAdd} points to user ${email}...`)

    // 1. Get user
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, total_score')
        .eq('email', email)
        .single()

    if (userError || !user) {
        console.error('User not found:', userError?.message)
        return
    }

    console.log(`Current score: ${user.total_score}`)

    // 2. Insert game_session
    // This is crucial because Leaderboard views aggregate game_sessions
    const { error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
            user_id: user.id,
            score: scoreToAdd,
            played_at: new Date().toISOString() // Counts for Week/Month
        })

    if (sessionError) {
        console.error('Failed to insert session:', sessionError.message)
        return
    }

    // 3. Update user total_score
    const newTotalScore = (user.total_score || 0) + scoreToAdd
    const { error: updateError } = await supabase
        .from('users')
        .update({ total_score: newTotalScore })
        .eq('id', user.id)

    if (updateError) {
        console.error('Failed to update user score:', updateError.message)
        return
    }

    console.log(`Success! New total score: ${newTotalScore}`)
    console.log('Leaderboard should update immediately.')
}

// Get args
const args = process.argv.slice(2)
const email = args[0]
const score = parseInt(args[1])

if (!email || isNaN(score)) {
    console.log('Usage: npx tsx scripts/add-score.ts <email> <score_to_add>')
    console.log('Example: npx tsx scripts/add-score.ts namnguyen1506@gmail.com 3000')
} else {
    addScore(email, score)
}
