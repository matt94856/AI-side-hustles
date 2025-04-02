// Supabase Configuration
let supabase;

async function initSupabase() {
    try {
        // Initialize Supabase client with provided credentials
        const supabaseUrl = 'https://tdxpostwbmpnsikjftvy.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase credentials. Please check your configuration.');
        }

        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Debug logging
        console.log('Supabase client initialized:', {
            url: supabaseUrl,
            hasKey: !!supabaseAnonKey
        });

        return supabase;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        throw error;
    }
}

export { supabase, initSupabase }; 