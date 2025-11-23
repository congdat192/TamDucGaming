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

async function testRPC() {
    console.log('🧪 Testing add_bonus_plays RPC function...\n');

    // Get a test user
    const { data: user } = await supabase
        .from('users')
        .select('id, email, bonus_plays')
        .eq('email', 'tiendatabv@gmail.com')
        .single();

    if (!user) {
        console.error('User not found');
        return;
    }

    console.log(`Testing with user: ${user.email}`);
    console.log(`Current bonus_plays: ${user.bonus_plays}\n`);

    // Try calling RPC
    console.log('Calling add_bonus_plays RPC...');
    const { data, error } = await supabase.rpc('add_bonus_plays', {
        target_user_id: user.id,
        bonus_amount: 1,
        reason_text: 'test_rpc',
        related_id: null
    });

    if (error) {
        console.error('❌ RPC Error:', error);
        console.log('\n🔍 Diagnosis: RPC function does NOT exist or has wrong signature');
    } else {
        console.log('✅ RPC Success:', data);

        // Check if bonus_plays increased
        const { data: updatedUser } = await supabase
            .from('users')
            .select('bonus_plays')
            .eq('id', user.id)
            .single();

        console.log(`New bonus_plays: ${updatedUser.bonus_plays}`);

        if (updatedUser.bonus_plays === user.bonus_plays + 1) {
            console.log('✅ Bonus plays increased correctly!');
        } else {
            console.log('⚠️ Bonus plays did not increase as expected');
        }
    }
}

testRPC();
