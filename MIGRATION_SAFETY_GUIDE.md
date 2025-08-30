# Database Migration Safety Guide

## ⚠️ IMPORTANT: Database Restored - Migration Safety Protocol

Your database has been restored and we **MUST NOT** sync migrations as this would drop all tables. Instead, we will apply only specific, safe migrations.

## 🛡️ Safe Migration Approach

### 1. **NEVER** sync migrations
- ❌ `supabase db reset`
- ❌ `supabase db push`
- ❌ Any command that might drop tables

### 2. **ONLY** apply safe migrations
- ✅ Use `IF NOT EXISTS` clauses
- ✅ Use `ON CONFLICT DO NOTHING`
- ✅ Only add missing structures
- ✅ Never drop existing data

## 📋 Safe Migration Scripts Created

### `apply_critical_migrations_safe.sql`
This script safely applies the most critical recent migrations:

1. **Producer Resources Table** - Creates the `producer_resources` table and storage bucket
2. **Account Type Constraint Fix** - Allows dual role users (`admin,producer`)
3. **Producer Onboarding Feature Flag** - Enables producer applications
4. **Producer Applications Instruments** - Adds instruments column
5. **Default Resources** - Adds sample resources if table is empty

### `apply_producer_resources_migration.sql`
This script only applies the producer resources table and related structures.

## 🚀 How to Apply Safe Migrations

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of `apply_critical_migrations_safe.sql`
4. Execute the script

### Option 2: Using Supabase CLI (Safe)
```bash
# Apply the safe migration script
supabase db reset --linked --db-url "your-database-url" < apply_critical_migrations_safe.sql
```

### Option 3: Direct Database Connection
```bash
# Connect to your database and run the script
psql "your-connection-string" -f apply_critical_migrations_safe.sql
```

## ✅ Verification Steps

After running the migration, verify:

1. **Producer Resources Table Exists**
   ```sql
   SELECT COUNT(*) FROM producer_resources;
   ```

2. **Feature Flag Enabled**
   ```sql
   SELECT * FROM white_label_features WHERE feature_name = 'producer_onboarding';
   ```

3. **Account Types Work**
   ```sql
   SELECT account_type, COUNT(*) FROM profiles GROUP BY account_type;
   ```

## 🔄 Future Migration Strategy

### For New Features:
1. Create new migration files with `IF NOT EXISTS` clauses
2. Test on a development database first
3. Apply manually using safe scripts
4. Never use `supabase db push` on production

### For Bug Fixes:
1. Create targeted fix scripts
2. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
3. Use `CREATE POLICY IF NOT EXISTS`
4. Test thoroughly before applying

## 🚨 Emergency Procedures

If something goes wrong:
1. **DO NOT** run `supabase db reset`
2. **DO NOT** sync migrations
3. Create a targeted fix script
4. Apply only the specific fix needed

## 📞 Support

If you encounter issues:
1. Check the migration logs in Supabase dashboard
2. Verify table structures with `\d table_name`
3. Test queries before applying to production
4. Keep backups before any migration

---

**Remember: Safety First!** 🛡️ 