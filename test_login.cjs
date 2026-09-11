const { createClient } = require('@supabase/supabase-js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://thldkqfacwfievhziepc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobGRrcWZhY3dmaWV2aHppZXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDgwMzEsImV4cCI6MjA4ODM4NDAzMX0.hVFOsOWu9sE6kklXdofDuvgLHAAQtl0r01byhHcthVE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    console.log('Testing login with the old restored database...');
    console.log('Connecting to:', supabaseUrl);
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'philipinem45@gmail.com',
        password: 'wonder123'
    });

    if (error) {
        console.error('\n❌ Login Failed:', error.message);
    } else {
        console.log('\n✅ Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Last Sign In:', data.user.last_sign_in_at);
    }
}

testLogin();
