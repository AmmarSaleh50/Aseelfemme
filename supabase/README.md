# Supabase Migrations

This folder contains SQL migrations for the AseelFemme Supabase database.

## How to Run

Run these migrations **in order** in your Supabase SQL Editor:

1. **001_initial_schema.sql** - Creates all tables, enums, triggers, and indexes
2. **002_row_level_security.sql** - Sets up RLS policies for public/admin access
3. **003_storage_bucket.sql** - Creates the uploads storage bucket
4. **004_seed_data.sql** - (Optional) Seeds initial categories and highlights

## After Migrations

1. Go to **Authentication** → **Users** → **Add User**
2. Create your admin account with email and password
3. Use these credentials to log in at `/admin/login`

## Adding New Migrations

When adding new migrations, use the naming convention:
```
005_description_of_change.sql
006_another_change.sql
```

Always run migrations in order since they may depend on previous migrations.
