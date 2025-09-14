# Expense Automation Scheduler

This Node.js application automates recurring expenses by connecting to Supabase and running scheduled tasks every 5 minutes.

## Features

- ✅ Automatic recurring expense processing
- ✅ Supabase database integration
- ✅ Scheduled execution every 5 minutes
- ✅ Web interface for monitoring
- ✅ Health check endpoints
- ✅ Manual trigger capability
- ✅ Connection testing and error handling
- ✅ Graceful shutdown on Ctrl+C

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase project

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   The `.env` file is already configured with your Supabase credentials.

3. **Run the application:**
   ```bash
   npm start
   ```

### Available Scripts

- `npm start` - Start the scheduler
- `npm run dev` - Start in development mode
- `npm test` - Run connection tests

## Web Interface

Once running, visit these endpoints:

- **Health Check**: http://localhost:3000/health
- **Status**: http://localhost:3000/status
- **Manual Trigger**: POST http://localhost:3000/trigger

## API Endpoints

### GET /health
Returns service health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-14T13:30:00.000Z",
  "uptime": 3600,
  "service": "Expense Automation Scheduler"
}
```

### GET /status
Returns detailed service status.

**Response:**
```json
{
  "service": "Expense Automation Scheduler",
  "status": "Running",
  "schedule": "Every 5 minutes",
  "timezone": "Asia/Kolkata (IST)",
  "lastCheck": "2025-01-14T13:30:00.000Z",
  "supabaseConnected": true
}
```

### POST /trigger
Manually trigger expense processing.

**Response:**
```json
{
  "success": true,
  "data": {
    "processed_count": 0,
    "message": "No recurring expenses to process"
  }
}
```

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `node-cron` - Task scheduling
- `dotenv` - Environment variable management
- `express` - Web server for monitoring

## Database Requirements

The application expects a Supabase database with:
- A `recurring_expenses` table
- A `manual_trigger_recurring_expenses` RPC function

## Troubleshooting

If you encounter issues:
1. Ensure your `.env` file is properly configured
2. Check that your Supabase project is accessible
3. Verify the database schema matches expectations
4. Check the console logs for detailed error messages

## Deployment

This application can be deployed to:
- Railway
- Render
- Heroku
- Vercel (with modifications)

See the deployment guide for detailed instructions.
