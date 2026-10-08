import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

// Export raw neon sql query runner
export const sql = neon(databaseUrl)

// Export Drizzle ORM instance with schema
export const db = drizzle(sql, { schema })
