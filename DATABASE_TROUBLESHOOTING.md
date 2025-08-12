# Database Troubleshooting Guide

This guide helps you fix database errors when saving new users in the Polaris Interview Agent project.

## Quick Fix Steps

### 1. Check Environment Variables

First, ensure your environment variables are properly set:

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Restart your development server

### 2. Run Database Setup

Copy the contents of `database-setup.sql` and run it in your Supabase SQL editor to ensure all tables and policies are properly configured.

### 3. Use Debug Tools

Visit `/debug` in your application to run diagnostic tests and identify specific issues.

## Common Error Scenarios

### Error: "Missing environment variables"

**Symptoms:**
- Application fails to connect to Supabase
- Console shows "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solution:**
1. Check that `.env.local` exists in your project root
2. Verify the environment variables are correctly named
3. Restart your development server
4. Clear browser cache and reload

### Error: "Database connection failed"

**Symptoms:**
- Debug page shows connection errors
- Console shows network or authentication errors

**Solution:**
1. Verify your Supabase project is active
2. Check that your anon key is correct
3. Ensure your IP is not blocked by Supabase
4. Try accessing your Supabase dashboard to confirm project status

### Error: "Profile creation failed"

**Symptoms:**
- User signs up successfully but profile creation fails
- Console shows database constraint or permission errors

**Solution:**
1. Run the `database-setup.sql` script in Supabase SQL editor
2. Check that RLS policies are properly configured
3. Verify the `user_profiles` table exists with correct schema
4. Check that the trigger for automatic profile creation is working

### Error: "RLS policy violation"

**Symptoms:**
- Database operations fail with permission errors
- Console shows "new row violates row-level security policy"

**Solution:**
1. Ensure RLS policies are correctly set up
2. Check that the user is properly authenticated
3. Verify the policy conditions match your use case
4. Run the database setup script to recreate policies

## Database Schema Verification

Your database should have these tables with the correct structure:

### user_profiles table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(200),
    organization_id UUID,
    account_type VARCHAR(20) CHECK (account_type IN ('hiring_manager', 'interviewee')) DEFAULT 'interviewee',
    resume_url TEXT,
    resume_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### organization_details table
```sql
CREATE TABLE organization_details (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name TEXT NOT NULL,
    org_website TEXT,
    org_phone TEXT,
    org_description TEXT,
    org_domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

## Required RLS Policies

### user_profiles policies
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
```

### organization_details policies
```sql
-- Allow authenticated users to view organizations
CREATE POLICY "Allow authenticated users to view organizations" ON organization_details
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to create organizations
CREATE POLICY "Allow authenticated users to create organizations" ON organization_details
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Testing Your Setup

1. **Visit the debug page**: Navigate to `/debug` in your application
2. **Test connection**: Click "Test Database Connection"
3. **Test profile creation**: Log in and click "Test Profile Creation"
4. **Check results**: Review the debug output for any errors

## Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Review the debug page output
3. Verify your Supabase project settings
4. Check the Supabase logs in your dashboard
5. Ensure all database migrations have been applied

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | No |

## File Locations

- **Database setup**: `database-setup.sql`
- **Debug tools**: `src/lib/supabase-debug.ts`
- **Debug page**: `src/app/debug/page.tsx`
- **Profile client**: `src/lib/profile-client.ts`
- **Supabase config**: `src/lib/supabase.ts` and `src/lib/supabase-server.ts`

