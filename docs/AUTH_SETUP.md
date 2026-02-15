# Supabase OAuth Setup

This app supports Google and GitHub OAuth. Follow these steps to enable sign-in.

## 1. Enable Auth Providers in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers**
3. Enable **Google** and/or **GitHub**
4. Add your OAuth credentials (see provider docs below)

## 2. Configure Redirect URLs

1. **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL, e.g.:
   - Local: `http://localhost:5173`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs** (one per line):
   - `http://localhost:5173/**`
   - `https://yourdomain.com/**` (for production)

## 3. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. **Authorized JavaScript origins**: Add `http://localhost:5173` and your production URL
4. **Authorized redirect URIs**: Add `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Find your project ref in Supabase Dashboard → Settings → General
5. Copy Client ID and Client Secret into Supabase → Auth → Providers → Google

## 4. GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps → New
2. **Homepage URL**: `http://localhost:5173` or your production URL
3. **Authorization callback URL**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret into Supabase → Auth → Providers → GitHub

## 5. Apply Database Migration

```bash
supabase db push
```

Or run the migration `005_add_user_auth_rls.sql` from the Supabase SQL Editor.

## 6. Assign Existing Data (optional)

If you had data before enabling auth, assign it to your user:

1. Sign in to the app once to create your account
2. Get your user ID from Supabase Dashboard → Authentication → Users (copy the UUID)
3. Run in SQL Editor:

```sql
UPDATE templates SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;
UPDATE packages SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;
```
