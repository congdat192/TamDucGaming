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

async function checkUserScore(email: string) {
    console.log(`Checking score for ${email}...`)

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, total_score, bonus_plays')
        .eq('email', email)
        .single()

    if (error) {
        console.error('Error:', error.message)
    } else {
        console.log('User Data:', user)
    }
}

const email = process.argv[2] || 'namnguyen1506@gmail.com'
checkUserScore(email)
