import { supabaseAdmin } from '../lib/supabase-admin'

async function investigateHacker(email: string) {
  console.log(`\n🔍 Investigating hacker: ${email}\n`)

  // 1. Get user info
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log('👤 User Info:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Total Score: ${user.total_score}`)
  console.log(`   Created: ${user.created_at}`)

  // 2. Get all game sessions
  const { data: sessions } = await supabaseAdmin
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })

  console.log(`\n🎮 All Game Sessions: ${sessions?.length || 0}`)

  // 3. Find suspicious sessions
  const suspicious = sessions?.filter(s =>
    s.suspicion_reason ||
    s.client_score > 200 ||
    (s.validated_score && s.validated_score !== s.client_score)
  ) || []

  console.log(`\n🚨 Suspicious Sessions: ${suspicious.length}`)
  suspicious.forEach((s, i) => {
    console.log(`\n   ${i + 1}. Session: ${s.id}`)
    console.log(`      Client Score: ${s.client_score}`)
    console.log(`      Validated Score: ${s.validated_score}`)
    console.log(`      Status: ${s.status}`)
    console.log(`      Suspicion: ${s.suspicion_reason || 'N/A'}`)
    console.log(`      Played At: ${new Date(s.played_at).toLocaleString('vi-VN')}`)
  })

  // 4. Calculate impact
  const totalClientScore = sessions?.reduce((sum, s) => sum + (s.client_score || 0), 0) || 0
  const totalValidatedScore = sessions?.reduce((sum, s) => sum + (s.validated_score || 0), 0) || 0
  const hackGain = totalClientScore - totalValidatedScore

  console.log(`\n📊 Impact Analysis:`)
  console.log(`   Total Client Score: ${totalClientScore}`)
  console.log(`   Total Validated Score: ${totalValidatedScore}`)
  console.log(`   Hack Gain (blocked): ${hackGain}`)
  console.log(`   User's actual total_score: ${user.total_score}`)

  // 5. Recommendation
  console.log(`\n💡 Recommendation:`)
  if (suspicious.length > 0) {
    console.log(`   ⚠️  Found ${suspicious.length} suspicious sessions!`)
    console.log(`   📍 Go to /admin/suspicious to invalidate them`)
    console.log(`   🔨 Or run: UPDATE game_sessions SET status='invalid' WHERE id IN (...)`)
  }

  if (user.total_score !== totalValidatedScore) {
    console.log(`   ⚠️  User total_score (${user.total_score}) != sum(validated_score) (${totalValidatedScore})`)
    console.log(`   🔨 Fix: UPDATE users SET total_score = ${totalValidatedScore} WHERE id = '${user.id}'`)
  }

  console.log('\n✅ Investigation complete\n')
}

const email = process.argv[2] || 'root@phatphat.com'
investigateHacker(email).catch(console.error)
