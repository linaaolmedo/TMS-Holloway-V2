# Admin Portal Database Migrations

## Overview

This document provides instructions for running the database migrations required for the Admin Portal feature. All migrations are **safe for UAT environments** as they only add new tables and optional columns.

## Safety Guarantees

✅ **No breaking changes** - All existing functionality remains intact  
✅ **No data loss** - Only additions, no deletions or modifications  
✅ **Backward compatible** - Existing code continues to work  
✅ **Nullable columns** - All new columns have defaults or allow NULL  
✅ **New tables only** - No modifications to existing table structures  

## Migration Order

Run these migrations in Supabase SQL Editor **in the exact order** listed below:

### 1. Enhanced Audit Logging
**File:** `migrations/006_admin_audit_logs.sql`

**What it does:**
- Adds 3 new optional columns to existing `audit_logs` table:
  - `user_role` (TEXT, nullable)
  - `impersonated_by` (UUID, nullable, references users)
  - `changes_made` (JSONB, nullable)
- Extends entity_type check constraint to include: user, company, load, setting, system
- Extends action check constraint to include: created, updated, login, logout, role_changed, impersonated, bulk_update
- Creates additional indexes for performance

**Safe because:**
- Only adds nullable columns
- Extends (not replaces) check constraints
- Creates new indexes (no impact on existing queries)

---

### 2. Impersonation Tracking
**File:** `migrations/007_impersonation_logs.sql`

**What it does:**
- Creates new `impersonation_logs` table to track admin impersonation sessions
- Columns: admin_user_id, target_user_id, started_at, ended_at, reason, ip_address, user_agent, actions_taken
- Creates indexes for fast lookups

**Safe because:**
- Completely new table
- No foreign key constraints that would lock existing tables
- Not referenced by any existing code

---

### 3. User Session Management
**File:** `migrations/008_user_sessions.sql`

**What it does:**
- Creates new `user_sessions` table for tracking active user sessions
- Columns: id, user_id, session_token, ip_address, user_agent, login_at, last_activity_at, logout_at, forced_logout, forced_by
- Creates indexes for session lookups

**Safe because:**
- Completely new table
- Uses ON DELETE CASCADE (won't prevent user deletion)
- Not used by existing authentication flow

---

### 4. System Settings
**File:** `migrations/009_system_settings.sql`

**What it does:**
- Creates new `system_settings` table for global configuration
- Inserts 10 default settings with sensible defaults
- Columns: setting_key, setting_value (JSONB), setting_type, category, description, is_public, updated_by
- Uses INSERT ... ON CONFLICT DO NOTHING (safe for re-running)

**Safe because:**
- Completely new table
- Default values don't affect existing functionality
- Settings are read-only until admin portal is used

**Default settings created:**
```
- default_customer_payment_terms = "Net 30"
- default_margin_percent = 15
- enable_smart_dispatch = true
- enable_real_time_tracking = true
- notification_email_from = "noreply@bulkflow.com"
- invoice_number_prefix = "INV-"
- load_number_prefix = "LOAD-"
- session_timeout_minutes = 480
- max_login_attempts = 5
- company_name = "BulkFlow TMS"
```

---

### 5. User Activity Tracking
**File:** `migrations/010_user_last_login.sql`

**What it does:**
- Adds 2 new columns to `users` table:
  - `last_login_at` (TIMESTAMPTZ, nullable)
  - `is_active` (BOOLEAN, default TRUE)
- Creates indexes for filtering active users

**Safe because:**
- Both columns are optional
- `is_active` defaults to TRUE (no impact on existing users)
- Nullable column allows existing users without last_login

---

## Running the Migrations

### Step 1: Access Supabase SQL Editor
1. Log into your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run Each Migration
For each migration file (in order):

1. Open the migration file from the `migrations/` directory
2. Copy the entire SQL content
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
5. Verify "Success. No rows returned" message
6. Repeat for next migration

### Step 3: Verify Migrations

After running all migrations, verify they were successful:

```sql
-- Check audit_logs has new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
AND column_name IN ('user_role', 'impersonated_by', 'changes_made');

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('impersonation_logs', 'user_sessions', 'system_settings');

-- Check users table has new columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('last_login_at', 'is_active');

-- Check system settings were created
SELECT COUNT(*) as settings_count
FROM system_settings;
-- Should return 10
```

## Rollback Instructions

If you need to rollback (though shouldn't be necessary):

```sql
-- Remove columns from audit_logs
ALTER TABLE public.audit_logs 
DROP COLUMN IF EXISTS user_role,
DROP COLUMN IF EXISTS impersonated_by,
DROP COLUMN IF EXISTS changes_made;

-- Drop new tables
DROP TABLE IF EXISTS public.impersonation_logs;
DROP TABLE IF EXISTS public.user_sessions;
DROP TABLE IF EXISTS public.system_settings;

-- Remove columns from users
ALTER TABLE public.users
DROP COLUMN IF EXISTS last_login_at,
DROP COLUMN IF EXISTS is_active;
```

**⚠️ Warning:** Rollback will delete all data in the new tables and columns.

## Troubleshooting

### Error: "relation already exists"
**Cause:** Table or column already exists  
**Solution:** Safe to ignore - migration uses `IF NOT EXISTS` clauses

### Error: "constraint already exists"
**Cause:** Index or constraint already exists  
**Solution:** Safe to ignore - migration uses `IF NOT EXISTS` clauses

### Error: "permission denied"
**Cause:** Insufficient database permissions  
**Solution:** Run as database owner or with admin privileges

### Error: "foreign key constraint"
**Cause:** Referenced table doesn't exist  
**Solution:** Verify `users` and `companies` tables exist

## Post-Migration Tasks

### 1. Update Existing Users
All existing users will have `is_active = true` by default. If you need to deactivate any:

```sql
UPDATE users
SET is_active = false
WHERE email = 'user@example.com';
```

### 2. Verify Admin Users
Ensure you have at least one admin or executive user:

```sql
SELECT id, email, name, role
FROM users
WHERE role IN ('admin', 'executive');
```

If none exist, update a user:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-admin@example.com';
```

### 3. Test Admin Portal Access
1. Log in with admin user
2. Navigate to `/admin`
3. Verify you can access the portal
4. Check each section loads correctly

## Migration Status Tracking

Keep track of which migrations have been run:

| Migration | File | Status | Date Run | Notes |
|-----------|------|--------|----------|-------|
| 006 | admin_audit_logs.sql | ⬜ Pending | - | Audit log enhancements |
| 007 | impersonation_logs.sql | ⬜ Pending | - | Impersonation tracking |
| 008 | user_sessions.sql | ⬜ Pending | - | Session management |
| 009 | system_settings.sql | ⬜ Pending | - | System configuration |
| 010 | user_last_login.sql | ⬜ Pending | - | User activity tracking |

**Mark as:** ✅ Complete | ⬜ Pending | ⚠️ Issues

## Support

If you encounter issues during migration:

1. Check the error message carefully
2. Verify you're running migrations in correct order
3. Check database permissions
4. Review the troubleshooting section above
5. Contact development team with error details

---

**Remember:** All migrations are safe for UAT environments and can be rolled back if needed.

**Version:** 1.0  
**Last Updated:** November 2024

