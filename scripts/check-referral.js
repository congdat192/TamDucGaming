const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReferral() {
    console.log('🔍 Checking referral for testref@gmail.com...\n');

    // 1. Get testref user
    const { data: testUser, error: testUserError } = await supabase
        .from('users')
        .select('id, email, phone, bonus_plays')
        .eq('email', 'testref@gmail.com')
        .single();

    if (testUserError) {
        console.error('❌ Test user not found:', testUserError.message);
        return;
    }

    console.log('👤 Test User (Referee):');
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Phone: ${testUser.phone || 'NULL'}`);
    console.log(`   Bonus Plays: ${testUser.bonus_plays}`);

    // 2. Check referral record
    const { data: referral, error: refError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', testUser.id)
        .single();

    if (refError) {
        console.error('\n❌ Referral record not found:', refError.message);
        return;
    }

    console.log('\n📋 Referral Record:');
    console.log(`   ID: ${referral.id}`);
    console.log(`   Referrer ID: ${referral.referrer_id}`);
    console.log(`   Referred ID: ${referral.referred_id}`);
    console.log(`   Reward Given: ${referral.reward_given}`);
    console.log(`   Created At: ${referral.created_at}`);

    // 3. Get referrer info
    const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, email, bonus_plays')
        .eq('id', referral.referrer_id)
        .single();

    if (referrerError) {
        console.error('\n❌ Referrer not found:', referrerError.message);
        return;
    }

    console.log('\n👤 Referrer:');
    console.log(`   ID: ${referrer.id}`);
    console.log(`   Email: ${referrer.email}`);
    console.log(`   Bonus Plays: ${referrer.bonus_plays}`);

    // 4. Check play_logs for referral bonus
    const { data: logs, error: logsError } = await supabase
        .from('play_logs')
        .select('*')
        .eq('user_id', referrer.id)
        .eq('reason', 'referral_bonus')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n📝 Recent Referral Bonus Logs:');
    if (logsError) {
        console.error('   ❌ Error:', logsError.message);
    } else if (logs.length === 0) {
        console.log('   ⚠️ No referral bonus logs found!');
    } else {
        logs.forEach(log => {
            console.log(`   - ${log.created_at}: +${log.amount} plays (Related: ${log.related_user_id})`);
        });
    }

    // 5. Diagnosis
    console.log('\n🔬 Diagnosis:');
    if (!testUser.phone) {
        console.log('   ❌ ISSUE: Test user has NO PHONE NUMBER');
        console.log('   → The add-phone-bonus API was never called!');
    } else if (!referral.reward_given) {
        console.log('   ❌ ISSUE: reward_given is FALSE');
        console.log('   → The referral bonus logic did not execute or failed');
        console.log('   → Check server logs when testref@gmail.com added phone');
    } else {
        console.log('   ✅ Referral appears to be processed correctly');
    }
}

checkReferral();
