
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        envVars[match[1]] = match[2].replace(/^"(.*)"$/, '$1')
    }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
    console.log('Checking admins table schema...')
    // We can't directly query schema easily with JS client without specific SQL permissions or using rpc
    // But we can try to select a non-existent column to see error, or just select * and see keys
    const { data, error } = await supabase.from('admins').select('*').limit(1)

    if (error) {
        console.error('Error fetching admins:', error)
    } else {
        console.log('Admins sample:', data)
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]))
        } else {
            console.log('Table is empty, cannot infer columns from data.')
        }
    }
}

checkSchema()
