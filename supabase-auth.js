// Supabase client configuration for frontend
class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Import Supabase client dynamically
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            
            this.supabase = createClient(
                'https://tdxpostwbmpnsikjftvy.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0',
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage
                    }
                }
            );

            this.isInitialized = true;
            console.log('Supabase client initialized');
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
        }
    }

    async syncNetlifyIdentityWithSupabase(netlifyUser) {
        // Ensure Supabase client is ready (safe no-op if already initialized)
        await this.init();

        if (!this.supabase || !netlifyUser) return null;

        try {
            // Use Netlify function to create/sync user (uses service role key)
            const response = await fetch('/.netlify/functions/supabaseHandler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'internal', // Use internal action to trigger service role client
                    user: { 
                        id: netlifyUser.id, 
                        email: netlifyUser.email 
                    }
                })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                console.error('Failed to sync Netlify user with Supabase:', result.error);
                return null;
            }

            console.log('Netlify user synced with Supabase users table');

            // Return the user data for RLS context
            return {
                id: netlifyUser.id,
                email: netlifyUser.email
            };
        } catch (error) {
            console.error('Error syncing Netlify Identity with Supabase:', error);
            return null;
        }
    }

    async getUserPurchases(userId) {
        // Ensure Supabase client is initialized before making any related calls
        await this.init();

        try {
            if (!window.apiClient || typeof window.apiClient.getPurchases !== 'function') {
                throw new Error('API client not available');
            }

            const purchases = await window.apiClient.getPurchases(userId);
            return purchases || [];
        } catch (error) {
            console.error('Error fetching user purchases via API client:', error);
            return [];
        }
    }

    async addPurchase(purchaseData) {
        await this.init();

        try {
            if (!window.apiClient || typeof window.apiClient.addPurchase !== 'function') {
                throw new Error('API client not available');
            }

            return await window.apiClient.addPurchase(purchaseData);
        } catch (error) {
            console.error('Error adding purchase via API client:', error);
            return false;
        }
    }

    async checkCourseAccess(userId, courseId) {
        await this.init();

        try {
            // Check for all access first
            const { data: allAccessData } = await this.supabase
                .from('purchases')
                .select('*')
                .eq('all_access', true)
                .single();

            if (allAccessData) {
                return { hasAccess: true, accessType: 'all_access' };
            }

            // Check for specific course access
            const { data: courseAccessData } = await this.supabase
                .from('purchases')
                .select('*')
                .eq('tutorial_id', courseId)
                .single();

            return { 
                hasAccess: !!courseAccessData, 
                accessType: courseAccessData ? 'course_access' : 'no_access' 
            };
        } catch (error) {
            console.error('Error checking course access:', error);
            return { hasAccess: false, accessType: 'error' };
        }
    }
}

// Global instance
window.supabaseAuth = new SupabaseAuth();
