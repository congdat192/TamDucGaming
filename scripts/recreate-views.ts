import { Client } from 'pg'
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

// Construct connection string
// Supabase connection string usually available as POSTGRES_URL or DATABASE_URL
// If not, construct from SUPABASE_URL (not possible directly without password)
// Assuming POSTGRES_URL is available or we can use the one from .env
const connectionString = envConfig.POSTGRES_URL || envConfig.DATABASE_URL

if (!connectionString) {
    console.error('Missing POSTGRES_URL or DATABASE_URL in .env')
    process.exit(1)
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
})

async function recreateViews() {
    try {
        await client.connect()
        console.log('Connected to database')

        const sqlPath = path.resolve(process.cwd(), 'recreate-views.sql')
        const sql = fs.readFileSync(sqlPath, 'utf-8')

        console.log('Executing SQL...')
        await client.query(sql)

        console.log('Successfully recreated views!')
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await client.end()
    }
}

recreateViews()
