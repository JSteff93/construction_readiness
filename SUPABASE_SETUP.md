# Supabase Setup Guide

This guide will help you set up Supabase for persistent data storage in the Construction Readiness Tracker.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `construction-readiness-tracker` (or any name you prefer)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest region to you
4. Click "Create new project"
5. Wait for the project to be created (this takes a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 3: Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. You should see a success message

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Replace the values with your actual Supabase project URL and anon key from Step 2

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 6: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Create a template or package in the app
3. Check your Supabase dashboard → **Table Editor** to see if data appears in the tables

## How It Works

The app uses a **hybrid approach**:

- **If Supabase is configured**: Data is stored in Supabase database
- **If Supabase is not configured**: Data falls back to localStorage (browser storage)

This means:
- The app works immediately without Supabase setup
- You can set up Supabase later and your data will persist across devices
- If Supabase connection fails, it automatically falls back to localStorage

## Database Schema

The database has the following tables:

- **templates**: Stores template information
- **packages**: Stores package information
- **categories**: Stores category information (linked to templates or packages)
- **tasks**: Stores task information (linked to templates or packages)

## Troubleshooting

### Data not appearing in Supabase

1. Check that your `.env` file has the correct credentials
2. Verify the migration ran successfully in SQL Editor
3. Check the browser console for any error messages
4. Verify Row Level Security (RLS) policies are set correctly (they should allow all operations by default)

### Connection errors

1. Verify your Supabase project is active (not paused)
2. Check that your API keys are correct
3. Ensure your network allows connections to Supabase

### Migration errors

1. If you see "relation already exists" errors, the tables may already be created
2. You can drop existing tables and re-run the migration, or modify the SQL to use `IF NOT EXISTS`

## Security Notes

- The `anon` key is safe to use in client-side code (it's public)
- Row Level Security (RLS) is enabled but currently allows all operations
- For production, consider implementing proper authentication and RLS policies
- Never commit your `.env` file to version control (it's already in `.gitignore`)

## Next Steps

- Consider implementing user authentication for multi-user support
- Set up proper RLS policies based on your security requirements
- Enable database backups in Supabase dashboard
- Set up monitoring and alerts
