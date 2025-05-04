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

-- Add appropriate indexes for performance
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON public.watchlist (user_id);
CREATE INDEX IF NOT EXISTS watchlist_media_idx ON public.watchlist (media_id, media_type);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON public.ratings (user_id);
CREATE INDEX IF NOT EXISTS ratings_media_idx ON public.ratings (media_id, media_type);

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
