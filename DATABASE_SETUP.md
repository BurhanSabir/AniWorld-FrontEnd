# Database Setup Instructions for AniWorld

This document provides instructions for setting up the database for the AniWorld application.

## Automatic Setup

The application will attempt to set up the database automatically when you first use features that require database access. If this fails, you'll need to follow the manual setup instructions below.

## Manual Setup

If automatic setup fails, follow these steps:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL code from the `supabase/migrations/create_tables.sql` file
5. Run the query
6. Refresh the application

## Required Tables

The application requires the following tables:

1. `watchlist` - Stores user watchlist entries
2. `ratings` - Stores user ratings for anime and manga
3. `profiles` - Stores user profile information

## Troubleshooting

If you encounter errors related to missing tables or functions, try the following:

1. Check if the tables exist in your Supabase database
2. Verify that the Row Level Security (RLS) policies are correctly set up
3. Ensure that the authenticated role has the necessary permissions

For more detailed troubleshooting, check the browser console for specific error messages.
\`\`\`

## 5. Let's update the database initializer component to handle the error more gracefully:
