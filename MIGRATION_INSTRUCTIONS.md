# Database Migration Instructions

## Running the Map Feature Migrations

The map integration requires 4 new database tables. Follow these steps to apply the migrations to your Supabase database.

## Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your TMS project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Each Migration in Order**

   **Migration 1: driver_locations**
   ```
   - Copy the contents of: migrations/001_driver_locations.sql
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - You should see: "Success. No rows returned"
   ```

   **Migration 2: load_locations**
   ```
   - Copy the contents of: migrations/002_load_locations.sql
   - Paste into SQL Editor  
   - Click "Run"
   - You should see: "Success. No rows returned"
   ```

   **Migration 3: route_tracking**
   ```
   - Copy the contents of: migrations/003_route_tracking.sql
   - Paste into SQL Editor
   - Click "Run"
   - You should see: "Success. No rows returned"
   ```

   **Migration 4: route_stops**
   ```
   - Copy the contents of: migrations/004_route_stops.sql
   - Paste into SQL Editor
   - Click "Run"
   - You should see: "Success. No rows returned"
   ```

4. **Verify Tables Were Created**
   ```sql
   -- Run this query to check all tables exist:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('driver_locations', 'load_locations', 'route_tracking', 'route_stops');
   ```
   
   You should see all 4 table names in the results.

## Method 2: Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run individual migrations
psql $DATABASE_URL -f migrations/001_driver_locations.sql
psql $DATABASE_URL -f migrations/002_load_locations.sql
psql $DATABASE_URL -f migrations/003_route_tracking.sql
psql $DATABASE_URL -f migrations/004_route_stops.sql
```

## Verification Steps

After running all migrations, verify they worked:

### 1. Check Tables Exist

In SQL Editor, run:
```sql
-- List all new tables with column counts
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('driver_locations', 'load_locations', 'route_tracking', 'route_stops');
```

Expected result:
```
driver_locations    | 8 columns
load_locations      | 8 columns  
route_tracking      | 10 columns
route_stops         | 8 columns
```

### 2. Check Indexes Exist

```sql
-- List indexes for new tables
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('driver_locations', 'load_locations', 'route_tracking', 'route_stops')
ORDER BY tablename, indexname;
```

You should see indexes like:
- `idx_driver_locations_driver_id`
- `idx_driver_locations_timestamp`
- `idx_load_locations_load_id`
- etc.

### 3. Check RLS Policies

```sql
-- List RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('driver_locations', 'load_locations', 'route_tracking', 'route_stops')
ORDER BY tablename;
```

Each table should have at least one policy for SELECT, INSERT, etc.

### 4. Test Insert (Optional)

```sql
-- Test inserting a record (replace with real driver_id from your users table)
INSERT INTO driver_locations (driver_id, latitude, longitude, timestamp)
VALUES (
  (SELECT id FROM users WHERE role = 'driver' LIMIT 1),
  40.7128,
  -74.0060,
  NOW()
);

-- Check if it was inserted
SELECT COUNT(*) FROM driver_locations;

-- Clean up test data
DELETE FROM driver_locations WHERE timestamp > NOW() - INTERVAL '1 minute';
```

## Troubleshooting

### Error: "relation already exists"

**Cause:** Migration was already run

**Solution:** This is fine! The migration includes `IF NOT EXISTS` clauses. The existing tables were not modified.

### Error: "permission denied for schema public"

**Cause:** User doesn't have sufficient permissions

**Solution:** 
1. Ensure you're logged into Supabase Dashboard as the project owner
2. Or use the service_role key (be careful!)
3. Check that your database user has CREATE TABLE permissions

### Error: "column/table does not exist" in later migrations

**Cause:** Earlier migrations weren't run first

**Solution:** Run migrations in order (001, 002, 003, 004)

### Error: "RLS policy already exists"

**Cause:** Policies were created in a previous migration run

**Solution:** 
Either:
1. Ignore the error (policies already exist)
2. Or drop existing policies first:
   ```sql
   DROP POLICY IF EXISTS driver_locations_select_policy ON driver_locations;
   -- etc.
   ```

## Rolling Back (If Needed)

If you need to undo the migrations:

```sql
-- WARNING: This will delete all data in these tables!

DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS route_tracking CASCADE;
DROP TABLE IF EXISTS load_locations CASCADE;
DROP TABLE IF EXISTS driver_locations CASCADE;
```

Then you can re-run the migrations from scratch.

## Next Steps

After successfully running migrations:

1. ✅ Verify all tables exist
2. ✅ Run the seeder script: `npx tsx scripts/seed-map-data.ts`
3. ✅ Test the Smart Dispatch page
4. ✅ Test the Loads page map view

See [MAP_SETUP_GUIDE.md](./MAP_SETUP_GUIDE.md) for complete setup instructions.



