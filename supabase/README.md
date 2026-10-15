# Supabase CMS setup

Phase 02 adds a read-only public CMS foundation. Public website pages can read published services, blogs, FAQs, gallery items, offers, and areas from Supabase while preserving the current approved UI.

## Apply the database foundation

Run these files in Supabase SQL Editor, in this order:

1. `migrations/20261013080826_cms_public_content.sql`
2. `migrations/20261013160000_cms_secure_administration.sql`
3. `migrations/20261014110000_contact_enquiries.sql`
4. `seed/legacy-content.sql`

The seed is generated from the approved local content source. Regenerate it after an approved source-content change:

```bash
node scripts/generate-cms-seed.mjs
```

It inserts 9 services, 10 areas, 6 offers, 10 static blog records, 60 FAQ records, 15 gallery records, 237 media records, and one site-settings record. The 10 retired BYD/Lexus advisory questions are retained with `status = 'retired'` and are never public.

## Media migration

The SQL records the image manifest but cannot upload binary files. Upload the files from `public/images` to the `cms-public` bucket before enabling a Storage-backed media delivery change. The bucket allows public reads for approved marketing assets only; there are no browser write policies.

After the SQL seed has run, this local-only command uploads and verifies all 237 approved assets. It requires the server-only service-role key and must never be run in a browser or deployed route:

```bash
node --env-file=.env.local scripts/upload-cms-media.mjs
```

## Security boundary

- RLS is enabled on every CMS table.
- `anon` and `authenticated` may only select published public content.
- No browser role has insert, update, or delete permission.
- Public enquiries are inserted only by the server, then delivered through the configured SMTP transport. CMS staff can view and update them through the protected dashboard.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or client component.

## Resend and six-digit admin OTP

- Public website enquiries use Resend's HTTP API. Keep `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_RECIPIENT_EMAIL`, and `CAAUTOBODY_RATE_LIMIT_SALT` server-only in `.env.local` and Vercel. Do not commit their values.
- Configure Resend SMTP separately in Supabase Auth for passwordless login, recovery, invitation, and other Auth emails. The website's Resend API key does not configure Supabase Auth delivery.
- Configure Supabase Auth's email template to include `{{ .Token }}` so its passwordless login email contains the six-digit code accepted by this website. The application cannot force the hosted Supabase template setting from source code.
- Rotate any Supabase service-role, SMTP, or Resend key that was previously committed or displayed. Put replacements only in `.env.local`, Vercel, and the appropriate provider dashboard.
