# Expense Automation Scheduler

This Node.js application automates recurring expenses by connecting to Supabase and running scheduled tasks every 5 minutes.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the project root with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

## Features

- ✅ Automatic recurring expense processing
- ✅ Supabase database integration
- ✅ Scheduled execution every 5 minutes
- ✅ Connection testing and error handling
- ✅ Graceful shutdown on Ctrl+C

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `node-cron` - Task scheduling
- `dotenv` - Environment variable management

## Database Requirements

The application expects a Supabase database with:
- A `recurring_expenses` table
- A `manual_trigger_recurring_expenses` RPC function

## Troubleshooting

If you encounter issues:
1. Ensure your `.env` file is properly configured
2. Check that your Supabase project is accessible
3. Verify the database schema matches expectations
