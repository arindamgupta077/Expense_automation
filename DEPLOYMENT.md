# 🚀 Render Deployment Guide

This guide will help you deploy your Expense Automation Scheduler to Render.

## 📋 Prerequisites

- GitHub account
- Render account (free at [render.com](https://render.com))
- Your Supabase project credentials

## 🔧 Render-Specific Optimizations

Your application has been optimized for Render with:

- ✅ **Keep-alive endpoints** to prevent sleep mode
- ✅ **Health check monitoring** for service status
- ✅ **Memory usage tracking** for performance monitoring
- ✅ **Environment variable handling** for production
- ✅ **Error handling** with health status tracking
- ✅ **Automatic restart** on failures

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add Render deployment configuration"

# Push to GitHub
git push origin main
```

### Step 2: Deploy on Render

1. **Go to Render.com**
   - Visit [render.com](https://render.com)
   - Sign up/Login with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `Expense_automation` repository

3. **Configure Service Settings**
   - **Name**: `expense-automation-scheduler`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Add Environment Variables**
   In the "Environment" section, add:
   ```
   NODE_ENV=production
   SUPABASE_URL=https://vurtgjyhvnaarzfbmznh.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cnRnanlodm5hYXJ6ZmJtem5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODc3MTgsImV4cCI6MjA3MTk2MzcxOH0.LzxFQJ7lPtyICPcJstrUSoay7vf1uxsHP5vxx1EfwWI
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy

## 🌐 Available Endpoints

Once deployed, your service will be available at:
`https://your-service-name.onrender.com`

### Endpoints:
- **Root**: `/` - Service information
- **Health**: `/health` - Health check (used by Render)
- **Status**: `/status` - Detailed service status
- **Ping**: `/ping` - Keep-alive endpoint
- **Trigger**: `POST /trigger` - Manual expense processing

## 📊 Monitoring

### Render Dashboard
- View logs in real-time
- Monitor service health
- Check deployment status
- View metrics and performance

### Health Monitoring
Your service includes:
- Automatic health status tracking
- Memory usage monitoring
- Last activity timestamps
- Error state management

## ⚠️ Free Tier Considerations

### Sleep Mode
- **Issue**: Free tier services sleep after 15 minutes of inactivity
- **Solution**: Your app includes keep-alive mechanisms:
  - Health check endpoint (`/health`)
  - Ping endpoint (`/ping`)
  - Automatic keep-alive cron job (every 10 minutes)

### Cold Starts
- **Issue**: Takes ~30 seconds to wake up from sleep
- **Solution**: The scheduler will catch up on missed runs when it wakes up

### Monthly Hours
- **Limit**: 750 hours/month
- **Usage**: Usually sufficient for 24/7 operation

## 🔧 Troubleshooting

### Common Issues:

1. **Service Won't Start**
   - Check environment variables are set correctly
   - Verify Supabase credentials
   - Check build logs for errors

2. **Service Goes to Sleep**
   - Use external monitoring service to ping `/health`
   - Set up Uptime Robot to ping every 10 minutes

3. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check Supabase project is active
   - Ensure database schema exists

### Logs
- View real-time logs in Render dashboard
- Check for error messages
- Monitor memory usage

## 🎯 Alternative: External Cron Service

If you prefer to avoid sleep mode issues:

1. **Deploy as API-only service**
2. **Use external cron services**:
   - **Uptime Robot** (Free) - Ping every 10 minutes
   - **Cron-job.org** (Free) - Schedule API calls
   - **GitHub Actions** (Free) - Custom cron workflows

## 📈 Performance Tips

1. **Monitor Memory Usage**
   - Check `/status` endpoint for memory stats
   - Optimize if memory usage is high

2. **Error Handling**
   - Service automatically tracks health status
   - Failed operations are logged and reported

3. **Keep-Alive Strategy**
   - Multiple endpoints for different monitoring services
   - Automatic internal keep-alive mechanism

## 🎉 Success!

Once deployed, your expense automation scheduler will:
- ✅ Run every 5 minutes automatically
- ✅ Stay awake with keep-alive mechanisms
- ✅ Provide monitoring endpoints
- ✅ Handle errors gracefully
- ✅ Scale with your needs

Your service URL will be: `https://your-service-name.onrender.com`
