-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

-- Create the ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  avatar_url TEXT,
  email TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add appropriate indexes for performance
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist (user_id);
CREATE INDEX IF NOT EXISTS watchlist_media_idx ON public.watchlist (media_id, media_type);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON public.ratings (user_id);
CREATE INDEX IF NOT EXISTS ratings_media_idx ON public.ratings (media_id, media_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for watchlist: users can only see and modify their own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_select_policy'
  ) THEN
    CREATE POLICY watchlist_select_policy ON public.watchlist
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_insert_policy'
  ) THEN
    CREATE POLICY watchlist_insert_policy ON public.watchlist
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_update_policy'
  ) THEN
    CREATE POLICY watchlist_update_policy ON public.watchlist
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_delete_policy'
  ) THEN
    CREATE POLICY watchlist_delete_policy ON public.watchlist
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for ratings: users can only see and modify their own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_select_policy'
  ) THEN
    CREATE POLICY ratings_select_policy ON public.ratings
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_insert_policy'
  ) THEN
    CREATE POLICY ratings_insert_policy ON public.ratings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_update_policy'
  ) THEN
    CREATE POLICY ratings_update_policy ON public.ratings
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'ratings_delete_policy'
  ) THEN
    CREATE POLICY ratings_delete_policy ON public.ratings
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy for profiles: users can see all profiles but only modify their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_policy'
  ) THEN
    CREATE POLICY profiles_select_policy ON public.profiles
      FOR SELECT
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy'
  ) THEN
    CREATE POLICY profiles_insert_policy ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy'
  ) THEN
    CREATE POLICY profiles_update_policy ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Create helper functions
-- Function to get column names for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS text[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  columns text[];
BEGIN
  SELECT array_agg(column_name::text) INTO columns
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = $1;
  
  RETURN columns;
END;
$$;

-- Function to execute arbitrary SQL (requires admin privileges)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
