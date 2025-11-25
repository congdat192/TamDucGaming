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

async function recalculateTotalScore(email?: string) {
    console.log('🔧 Recalculating total_score from game_sessions...\n')

    let query = supabase.from('users').select('id, email, phone, total_score')

    if (email) {
        query = query.eq('email', email)
        console.log(`Target: ${email}\n`)
    } else {
        console.log('Target: ALL USERS\n')
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
        console.error('❌ Error fetching users:', usersError.message)
        return
    }

    if (!users || users.length === 0) {
        console.log('⚠️ No users found')
        return
    }

    console.log(`Found ${users.length} user(s)\n`)
    console.log('─'.repeat(80))

    let fixedCount = 0
    let correctCount = 0

    for (const user of users) {
        // Get all game sessions for this user
        const { data: sessions, error: sessionsError } = await supabase
            .from('game_sessions')
            .select('score')
            .eq('user_id', user.id)

        if (sessionsError) {
            console.error(`❌ Error fetching sessions for ${user.email || user.phone}:`, sessionsError.message)
            continue
        }

        // Calculate correct total
        const correctTotal = sessions?.reduce((sum, s) => sum + s.score, 0) || 0
        const currentTotal = user.total_score || 0
        const gamesPlayed = sessions?.length || 0

        const identifier = user.email || user.phone || user.id

        if (correctTotal !== currentTotal) {
            console.log(`\n🔴 MISMATCH: ${identifier}`)
            console.log(`   Current total_score: ${currentTotal}`)
            console.log(`   Correct total_score: ${correctTotal}`)
            console.log(`   Difference: ${correctTotal - currentTotal}`)
            console.log(`   Games played: ${gamesPlayed}`)

            // Update the user's total_score
            const { error: updateError } = await supabase
                .from('users')
                .update({ total_score: correctTotal })
                .eq('id', user.id)

            if (updateError) {
                console.log(`   ❌ Failed to update: ${updateError.message}`)
            } else {
                console.log(`   ✅ Fixed: ${currentTotal} → ${correctTotal}`)
                fixedCount++
            }
        } else {
            console.log(`✅ ${identifier}: ${currentTotal} (${gamesPlayed} games)`)
            correctCount++
        }
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   Total users checked: ${users.length}`)
    console.log(`   Already correct: ${correctCount}`)
    console.log(`   Fixed: ${fixedCount}`)
    console.log(`   Failed: ${users.length - correctCount - fixedCount}`)
    console.log('\n✅ Done!')
}

// Usage:
// npm run fix-score                           <- Fix all users
// npm run fix-score tiendatabv@gmail.com      <- Fix specific user

const targetEmail = process.argv[2]
recalculateTotalScore(targetEmail)
