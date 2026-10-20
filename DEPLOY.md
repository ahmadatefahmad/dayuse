# Deploying DayUse Egypt to Vercel

The app lives in `app/`. Everything below is done once; after that, every push to `main` deploys.

## 1. Push the code to GitHub

`app/` is already a git repository (from create-next-app) but nothing has been committed since.

```bash
cd app
git add -A
git commit -m "DayUse Egypt MVP"
# create an empty private repo on github.com, then:
git remote add origin https://github.com/<you>/dayuse.git
git push -u origin main
```

`.env` and `.env.local` are gitignored — secrets never leave your machine this way.

## 2. Import into Vercel

1. vercel.com → **Add New → Project** → pick the repo.
2. **Root Directory: `app`**. Framework: Next.js (auto-detected). Build command/output: defaults.
3. Add the environment variables (next step) **before** the first deploy — the homepage is pre-rendered at build time and needs the database.

## 3. Environment variables (Vercel → Settings → Environment Variables)

Copy every key from `app/.env.example`. Production values that differ from local:

| Variable | Production value |
|---|---|
| `DATABASE_URL` | Supabase **Transaction** pooler: `postgresql://postgres.<ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase **Session** pooler (port 5432) — same as your local `.env` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` (later your domain), no trailing slash |
| `CRON_SECRET` | a new long random string |
| `STRIPE_*` | test keys until you're ready to take real money |
| `EMAIL_FROM` | an address on a domain verified in Resend |

Why two database URLs: serverless functions open many short connections, which the transaction pooler (6543) handles; `prisma migrate` needs a session connection (5432). The direct `db.<ref>.supabase.co` host is IPv6-only — don't use it.

## 4. Database migrations

Migrations are **not** run by Vercel. Run them from your machine whenever `prisma/migrations` changes:

```bash
cd app
npx prisma migrate deploy
```

⚠️ Never pass the production database as `--shadow-database-url`: Prisma wipes the shadow database.

## 5. Stripe webhook

Stripe dashboard → Developers → Webhooks → **Add endpoint**
- URL: `https://<your-domain>/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`, then redeploy.

Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints a `whsec_…` for `.env.local`.

## 6. Supabase Auth settings

Authentication → URL Configuration:
- **Site URL**: your production URL
- **Redirect URLs**: `https://<your-domain>/**` and `http://localhost:3000/**`

Authentication → Emails → **SMTP settings**: connect Resend (host `smtp.resend.com`, port 465, user `resend`, password = Resend API key). Without this, sign-up confirmation and password-reset emails only reach your own team.

## 7. Crons

`app/vercel.json` schedules two daily jobs (07:00 and 08:00 UTC): arrival reminders and review requests. Vercel picks them up automatically and sends `CRON_SECRET`. Check them under Vercel → Settings → Cron Jobs.

## 8. Domain

Vercel → Settings → Domains → add your domain, follow the DNS instructions, then update `NEXT_PUBLIC_APP_URL`, the Supabase Site URL, and the Stripe webhook URL to the domain.

## 9. Smoke test after deploying

- Homepage, search and a property page load with photos.
- Sign in at `/login` → `/admin/dashboard` works for your admin account.
- Book with a Stripe test card `4242 4242 4242 4242` → confirmation page turns "confirmed" within seconds (webhook working) → confirmation email arrives.
- Admin → Notifications shows `sent` (not `failed`) rows.
- `https://<your-domain>/sitemap.xml` and `/robots.txt` load.
