const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://vurtgjyhvnaarzfbmznh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cnRnanlodm5hYXJ6ZmJtem5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODc3MTgsImV4cCI6MjA3MTk2MzcxOH0.LzxFQJ7lPtyICPcJstrUSoay7vf1uxsHP5vxx1EfwWI';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create a .env file with:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to install the fixed function in Supabase
async function installFixedFunction() {
  try {
    console.log('🔧 Installing fixed timezone function...');
    
    const fixedFunctionSQL = `
-- Drop the existing function
DROP FUNCTION IF EXISTS manual_trigger_recurring_expenses();

-- Create the fixed function with proper timezone handling
CREATE OR REPLACE FUNCTION manual_trigger_recurring_expenses()
RETURNS TABLE (
    processed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    processed_count INTEGER := 0;
    expense_record RECORD;
    expense_datetime TIMESTAMP WITH TIME ZONE;
    current_datetime TIMESTAMP WITH TIME ZONE;
    current_time_ist TIME;
    scheduled_time TIME;
    time_diff_minutes INTEGER;
BEGIN
    -- Get current datetime in IST (Asia/Kolkata timezone)
    current_datetime := NOW() AT TIME ZONE 'Asia/Kolkata';
    current_time_ist := current_datetime::TIME;
    
    RAISE NOTICE 'Current IST time: %', current_time_ist;
    
    -- Process all active recurring expenses for today
    FOR expense_record IN 
        SELECT * FROM recurring_expenses 
        WHERE is_active = true 
        AND remaining_occurrences > 0
        AND day_of_month = EXTRACT(DAY FROM current_datetime)
        AND (end_date IS NULL OR end_date >= current_datetime::DATE)
        AND start_date <= current_datetime::DATE
    LOOP
        scheduled_time := expense_record.time_of_day;
        
        -- Calculate time difference in minutes
        time_diff_minutes := EXTRACT(EPOCH FROM (current_time_ist - scheduled_time)) / 60;
        
        RAISE NOTICE 'Checking expense: % at % (diff: % minutes)', 
            expense_record.category, scheduled_time, time_diff_minutes;
        
        -- Process if current time is >= scheduled time (with 5-minute tolerance for past)
        -- This allows processing expenses that were scheduled earlier today
        IF time_diff_minutes >= -5 AND time_diff_minutes <= 1440 THEN -- Within 24 hours, 5 min tolerance
            -- Create the expense datetime by combining the current date with the scheduled time
            expense_datetime := (current_datetime::DATE + expense_record.time_of_day)::TIMESTAMP WITH TIME ZONE;
            
            -- Check if expense for this month already exists
            IF NOT EXISTS (
                SELECT 1 FROM recurring_expense_logs rel
                JOIN expenses e ON rel.expense_id = e.id
                WHERE rel.recurring_expense_id = expense_record.id
                AND EXTRACT(YEAR FROM rel.scheduled_date) = EXTRACT(YEAR FROM current_datetime)
                AND EXTRACT(MONTH FROM rel.scheduled_date) = EXTRACT(MONTH FROM current_datetime)
            ) THEN
                -- Create the expense
                DECLARE
                    new_expense_id UUID;
                BEGIN
                    INSERT INTO expenses (user_id, category, amount, description, date)
                    VALUES (
                        expense_record.user_id,
                        expense_record.category,
                        expense_record.amount,
                        COALESCE(expense_record.description, 'Recurring expense - ' || expense_record.category),
                        expense_datetime::DATE
                    )
                    RETURNING id INTO new_expense_id;
                    
                    -- Log the creation
                    INSERT INTO recurring_expense_logs (recurring_expense_id, expense_id, scheduled_date)
                    VALUES (expense_record.id, new_expense_id, expense_datetime::DATE);
                    
                    -- Decrease remaining occurrences
                    UPDATE recurring_expenses 
                    SET remaining_occurrences = remaining_occurrences - 1,
                        updated_at = NOW()
                    WHERE id = expense_record.id;
                    
                    -- If no more occurrences, deactivate
                    IF (SELECT remaining_occurrences FROM recurring_expenses WHERE id = expense_record.id) = 0 THEN
                        UPDATE recurring_expenses 
                        SET is_active = false, updated_at = NOW()
                        WHERE id = expense_record.id;
                    END IF;
                    
                    processed_count := processed_count + 1;
                    RAISE NOTICE 'Processed expense: % at %', expense_record.category, scheduled_time;
                END;
            ELSE
                RAISE NOTICE 'Expense already processed this month: %', expense_record.category;
            END IF;
        ELSE
            RAISE NOTICE 'Skipping expense: % (time not reached or too old)', expense_record.category;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        processed_count,
        CASE 
            WHEN processed_count = 0 THEN 'No recurring expenses to process for the current time'
            WHEN processed_count = 1 THEN '1 recurring expense processed successfully'
            ELSE processed_count::TEXT || ' recurring expenses processed successfully'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION manual_trigger_recurring_expenses() IS 'Fixed function with proper timezone handling and time window tolerance for recurring expenses';
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: fixedFunctionSQL });
    
    if (error) {
      console.error('❌ Error installing fixed function:', error);
      return false;
    }
    
    console.log('✅ Fixed function installed successfully!');
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error installing function:', err);
    return false;
  }
}

// Function to trigger recurring expenses with the fixed function
async function triggerRecurringExpenses() {
  try {
    const currentTime = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log(`🕐 [${currentTime} IST] Triggering recurring expenses...`);
    
    const { data, error } = await supabase.rpc('manual_trigger_recurring_expenses');
    
    if (error) {
      console.error('❌ Error triggering recurring expenses:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const result = data[0];
      console.log('✅ Recurring expenses processed successfully!');
      console.log('�� Result:', result);
      
      // Log detailed information
      if (result.processed_count > 0) {
        console.log(`🎉 ${result.processed_count} expense(s) processed at ${currentTime} IST`);
      } else {
        console.log('ℹ️ No recurring expenses to process for the current time');
      }
    } else {
      console.log('ℹ️ No recurring expenses to process');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Function to check scheduled expenses for today
async function checkScheduledExpenses() {
  try {
    console.log('�� Checking scheduled expenses for today...');
    
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        id,
        category,
        amount,
        day_of_month,
        time_of_day,
        remaining_occurrences,
        is_active
      `)
      .eq('is_active', true)
      .gt('remaining_occurrences', 0);
    
    if (error) {
      console.error('❌ Error fetching scheduled expenses:', error);
      return;
    }
    
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentTimeIST = new Date().toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: false 
    });
    
    console.log(`�� Today is day ${currentDay} of the month`);
    console.log(`🕐 Current IST time: ${currentTimeIST}`);
    console.log('📋 Scheduled expenses for today:');
    
    if (data && data.length > 0) {
      data.forEach(expense => {
        if (expense.day_of_month === currentDay) {
          console.log(`  • ${expense.category}: ₹${expense.amount} at ${expense.time_of_day} (${expense.remaining_occurrences} remaining)`);
        }
      });
    } else {
      console.log('  No active recurring expenses found');
    }
    
  } catch (err) {
    console.error('❌ Error checking scheduled expenses:', err);
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

// Main function
async function main() {
  console.log('🚀 Starting Fixed Expense Automation Scheduler...');
  console.log('⏰ Schedule: Every 5 minutes');
  console.log('🌍 Timezone: Asia/Kolkata (IST)');
  console.log('�� Features: Fixed timezone handling, time window tolerance');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('�� Started at:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('─'.repeat(80));
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Cannot start scheduler - connection failed');
    process.exit(1);
  }
  
  // Check scheduled expenses for today
  await checkScheduledExpenses();
  
  // Run once immediately
  console.log('\n�� Running initial check...');
  await triggerRecurringExpenses();
  
  // Schedule every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await triggerRecurringExpenses();
  });
  
  console.log('\n✅ Fixed scheduler started successfully!');
  console.log('💡 Press Ctrl+C to stop');
  console.log('🔧 The function now properly handles:');
  console.log('   • IST timezone conversion');
  console.log('   • Time window tolerance (5 minutes)');
  console.log('   • Prevents duplicate processing');
  console.log('   • Better logging and debugging');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n�� Stopping scheduler...');
    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

// Start the scheduler
main().catch(console.error);