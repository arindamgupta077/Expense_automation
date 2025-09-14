const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set environment variables:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Express app for health checks and web interface
const app = express();
const PORT = process.env.PORT || 3000;

// Keep-alive variables for Render
let lastActivity = Date.now();
let isHealthy = true;

// Middleware
app.use(express.json());

// Health check endpoint (Render uses this to keep service alive)
app.get('/health', (req, res) => {
  lastActivity = Date.now();
  res.json({ 
    status: isHealthy ? 'OK' : 'ERROR', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Expense Automation Scheduler',
    environment: process.env.NODE_ENV || 'development',
    platform: 'Render'
  });
});

// Root endpoint for Render
app.get('/', (req, res) => {
  lastActivity = Date.now();
  res.json({
    message: 'Expense Automation Scheduler is running!',
    status: 'active',
    endpoints: {
      health: '/health',
      status: '/status',
      trigger: 'POST /trigger'
    },
    schedule: 'Every 5 minutes',
    uptime: process.uptime()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  lastActivity = Date.now();
  res.json({
    service: 'Expense Automation Scheduler',
    status: 'Running',
    schedule: 'Every 5 minutes',
    timezone: 'Asia/Kolkata (IST)',
    lastCheck: new Date().toISOString(),
    supabaseConnected: !!supabaseUrl,
    environment: process.env.NODE_ENV || 'development',
    platform: 'Render',
    lastActivity: new Date(lastActivity).toISOString(),
    memoryUsage: process.memoryUsage()
  });
});

// Function to trigger recurring expenses
async function triggerRecurringExpenses() {
  try {
    lastActivity = Date.now();
    console.log(`🕐 [${new Date().toISOString()}] Triggering recurring expenses...`);
    
    const { data, error } = await supabase.rpc('manual_trigger_recurring_expenses');
    
    if (error) {
      console.error('❌ Error triggering recurring expenses:', error);
      isHealthy = false;
      return { success: false, error: error.message };
    }
    
    if (data) {
      console.log('✅ Recurring expenses processed successfully!');
      console.log('📊 Result:', data);
      isHealthy = true;
      return { success: true, data };
    } else {
      console.log('ℹ️ No recurring expenses to process');
      isHealthy = true;
      return { success: true, data: { processed_count: 0, message: 'No expenses to process' }};
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    isHealthy = false;
    return { success: false, error: err.message };
  }
}

// Test connection function
async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
    
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return false;
  }
}

// Manual trigger endpoint
app.post('/trigger', async (req, res) => {
  try {
    lastActivity = Date.now();
    console.log('🔧 Manual trigger requested via API');
    const result = await triggerRecurringExpenses();
    res.json(result);
  } catch (error) {
    isHealthy = false;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keep-alive endpoint for Render
app.get('/ping', (req, res) => {
  lastActivity = Date.now();
  res.json({ 
    pong: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main function
async function main() {
  console.log('🚀 Starting Expense Automation Scheduler...');
  console.log('⏰ Schedule: Every 5 minutes');
  console.log('🌐 Web interface: http://localhost:' + PORT);
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('📅 Started at:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('─'.repeat(60));
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Cannot start scheduler - connection failed');
    isHealthy = false;
    process.exit(1);
  }
  
  // Run once immediately
  console.log('⚡ Running initial check...');
  await triggerRecurringExpenses();
  
  // Schedule every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await triggerRecurringExpenses();
  });
  
  // Keep-alive cron job for Render (every 10 minutes)
  cron.schedule('*/10 * * * *', () => {
    lastActivity = Date.now();
    console.log('💓 Keep-alive ping - Service is active');
  });
  
  console.log('✅ Scheduler started successfully!');
  console.log('💡 Press Ctrl+C to stop');
  console.log('🔧 Render deployment ready!');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping scheduler...');
    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

// Start the web server
app.listen(PORT, () => {
  console.log(`🌐 Web server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Status: http://localhost:${PORT}/status`);
});

// Start the scheduler
main().catch(console.error);
