# Genre Management Setup

This document explains how to set up and use the new genre management feature in the admin dashboard.

## Overview

The genre management feature allows administrators to:
- Add new music genres
- Add sub-genres to existing genres
- Edit existing genres and sub-genres
- Delete genres and sub-genres
- View all genres and their associated sub-genres

## Setup Instructions

### 1. Database Setup

Run the SQL script `create_genre_tables.sql` in your Supabase SQL editor to create the necessary tables:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_genre_tables.sql`
4. Execute the script

This will create:
- `genres` table - stores main music genres
- `sub_genres` table - stores sub-genres associated with main genres
- Appropriate indexes and security policies
- Default genres and sub-genres

### 2. Component Files

The following files have been created/modified:

- `src/components/GenreManagement.tsx` - Main genre management component
- `src/components/AdminDashboard.tsx` - Updated to include genre management tab
- `supabase/migrations/20250120000000_create_genre_management.sql` - Database migration
- `create_genre_tables.sql` - Standalone SQL script for manual execution

## Usage

### Accessing Genre Management

1. Log in as an admin user
2. Navigate to the Admin Dashboard
3. Click on the "Genres" tab in the navigation

### Adding a New Genre

1. Click the "Add Genre" button
2. Enter the display name (e.g., "Hip Hop")
3. Enter the internal name (e.g., "hip_hop") - this will be converted to lowercase with underscores
4. Click "Create Genre"

### Adding a New Sub-Genre

1. Click the "Add Sub-Genre" button
2. Select the parent genre from the dropdown
3. Enter the display name (e.g., "Trap")
4. Enter the internal name (e.g., "trap")
5. Click "Create Sub-Genre"

### Editing Genres/Sub-Genres

1. Click the edit icon (pencil) next to any genre or sub-genre
2. Modify the display name and/or internal name
3. Click "Update Genre" or "Update Sub-Genre"

### Deleting Genres/Sub-Genres

1. Click the delete icon (trash) next to any genre or sub-genre
2. Confirm the deletion

**Note:** Deleting a genre will also delete all its associated sub-genres.

## Database Schema

### Genres Table
```sql
CREATE TABLE genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,           -- Internal name (e.g., 'hip_hop')
  display_name text NOT NULL,          -- User-friendly name (e.g., 'Hip Hop')
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Sub-Genres Table
```sql
CREATE TABLE sub_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id uuid NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  name text NOT NULL,                  -- Internal name (e.g., 'trap')
  display_name text NOT NULL,          -- User-friendly name (e.g., 'Trap')
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genre_id, name)
);
```

## Security

- Only users with `account_type = 'admin'` can access genre management
- Row Level Security (RLS) is enabled on both tables
- All operations (create, read, update, delete) require admin privileges

## Default Data

The setup script includes default genres and sub-genres:

**Main Genres:**
- Hip Hop
- R&B
- Pop
- Rock
- Electronic
- Jazz
- Classical
- World
- Religious
- Children's
- Country

**Sample Sub-Genres:**
- Hip Hop: Trap, Boom Bap, Lo-Fi, Drill, West Coast, East Coast
- R&B: Soul, Neo Soul, Contemporary, Gospel
- Pop: Indie Pop, Synth Pop, K-Pop, Dance Pop
- And many more...

## Integration with Existing Code

The genre management system is designed to work alongside the existing hardcoded genres in `src/types.ts`. In the future, you may want to:

1. Update the `GENRES` and `SUB_GENRES` constants in `types.ts` to fetch from the database
2. Update track upload forms to use dynamic genres from the database
3. Update search and filter functionality to use the database genres

## Troubleshooting

### Common Issues

1. **"Cannot find project ref" error when running migrations**
   - Use the standalone `create_genre_tables.sql` script instead
   - Run it manually in the Supabase SQL editor

2. **Permission denied errors**
   - Ensure your user account has `account_type = 'admin'` in the profiles table
   - Check that RLS policies are properly created

3. **Component not loading**
   - Check browser console for errors
   - Ensure the `GenreManagement` component is properly imported
   - Verify that the admin dashboard tab is correctly configured

### Support

If you encounter any issues, check:
1. Browser console for JavaScript errors
2. Supabase logs for database errors
3. Network tab for failed API requests
4. Database policies and permissions 