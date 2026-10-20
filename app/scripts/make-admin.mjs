// Grants the admin role to an existing Supabase Auth user.
// Usage: npm run make-admin -- you@example.com
// Writes auth.users.raw_app_meta_data directly (via DATABASE_URL), since app_metadata
// can't be edited from the browser. The user must sign out and back in afterwards.
import { PrismaClient } from '@prisma/client'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run make-admin -- you@example.com')
  process.exit(1)
}

const prisma = new PrismaClient()
try {
  const updated = await prisma.$executeRaw`
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    where lower(email) = lower(${email})`
  if (updated) {
    console.log(`${email} is now an admin. Sign out and back in for it to take effect.`)
  } else {
    console.error(`No Supabase user with email ${email}. Create one first under Authentication -> Users -> Add user.`)
    process.exitCode = 1
  }
} finally {
  await prisma.$disconnect()
}
