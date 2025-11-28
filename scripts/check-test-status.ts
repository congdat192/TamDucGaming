
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
        envVars[key] = value
    }
})

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTestStatus() {
    const email = 'game11@gmail.com'

    console.log(`Checking test status for ${email}...`)

    // Get game config
    const { data: configData, error: configError } = await supabase
        .from('game_config')
        .select('config_data')
        .eq('id', 'main')
        .single()

    if (configError) {
        console.error('Error fetching config:', configError)
        return
    }

    const config = configData.config_data
    console.log('Test Emails in DB:', config.testEmails)

    const isTest = config.testEmails?.includes(email)
    console.log(`Is ${email} a test account? ${isTest}`)
}

checkTestStatus()
