import { Client } from 'pg'
import { scryptSync } from 'crypto'

async function setupAdmin(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is missing')
    process.exit(1)
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🚀 Connected to database')

    // Manual scrypt hash create (same as AdonisJS)
    const hashedPassword: string = createScryptHash('12345678')
    
    const result = await client.query(`
      INSERT INTO admin_users (
        email, password, full_name, user_type, is_admin, is_active, 
        is_email_verified, is_mobile_verified, mobile, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        updated_at = NOW()
      RETURNING id
    `, [
      'super@admin.com',
      hashedPassword,
      'Super Admin',
      'super_admin',
      true,
      true,
      true,
      true,
      '12345678'
    ])

    console.log('✅ Admin user created/updated with ID:', result.rows[0]?.id)
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Manual scrypt hash function with proper types
function createScryptHash(password: string): string {
  const salt: Buffer = Buffer.from('2uDVLWILI1qtQTRSNBwaeQ', 'base64')
  const derivedKey: Buffer = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 33554432
  })
  return `$scrypt$n=16384,r=8,p=1$${salt.toString('base64')}$${derivedKey.toString('base64')}`
}

// Run the setup
setupAdmin().catch(console.error)