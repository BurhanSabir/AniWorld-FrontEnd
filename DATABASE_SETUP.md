# Database Setup for AniWorld

This document provides instructions for setting up the required database tables for the AniWorld application.

## Required Tables

The application requires two main tables:

1. `watchlist` - Stores user watchlist entries
2. `ratings` - Stores user ratings for anime and manga

## Setup Instructions

### Option 1: Using the SQL Migration File

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of `supabase/migrations/create_tables.sql`
4. Paste into the SQL Editor and run the query

### Option 2: Manual Setup

If you prefer to set up the tables manually, run the following SQL commands:

\`\`\`sql
-- Create the watchlist table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

-- Create the ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

-- Add appropriate indexes for performance
CREATE INDEX watchlist_user_id_idx ON public.watchlist (user_id);
CREATE INDEX watchlist_media_idx ON public.watchlist (media_id, media_type);
CREATE INDEX ratings_user_id_idx ON public.ratings (user_id);
CREATE INDEX ratings_media_idx ON public.ratings (media_id, media_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policy for watchlist: users can only see and modify their own entries
CREATE POLICY watchlist_user_policy ON public.watchlist
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for ratings: users can only see and modify their own entries
CREATE POLICY ratings_user_policy ON public.ratings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
\`\`\`

## Verifying Setup

After setting up the tables, you can verify they were created correctly by:

1. Going to the "Table Editor" in your Supabase dashboard
2. Checking that both `watchlist` and `ratings` tables appear in the list
3. Verifying the column structure matches the expected schema

## Troubleshooting

If you encounter errors related to missing tables or columns:

1. Check the browser console for specific error messages
2. Verify that the table names match exactly (`watchlist` and `ratings`)
3. Ensure all required columns are present with the correct data types
4. Confirm that RLS policies are properly configured

For additional help, please refer to the Supabase documentation or contact support.
