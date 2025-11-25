
import { Client } from 'pg'
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

// Construct connection string from env vars if DATABASE_URL is not present
// Usually Supabase provides DATABASE_URL
const connectionString = envVars.DATABASE_URL || envVars.POSTGRES_URL

console.log('Available env keys:', Object.keys(envVars))

if (!connectionString) {
    console.error('Missing DATABASE_URL in .env')
    process.exit(1)
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
})

async function runMigration() {
    try {
        await client.connect()
        console.log('Connected to database')

        const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/20241125_admin_email_auth.sql')
        const sql = fs.readFileSync(sqlPath, 'utf-8')

        console.log('Running migration...')
        await client.query(sql)
        console.log('Migration completed successfully')

    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await client.end()
    }
}

runMigration()
