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
        if (!this.supabase || !netlifyUser) return null;

        try {
            // Check if user exists in Supabase users table
            const { data: existingUser, error: userError } = await this.supabase
                .from('users')
                .select('id')
                .eq('id', netlifyUser.id)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error('Error checking user:', userError);
                return null;
            }

            if (!existingUser) {
                // Create user in Supabase users table
                const { error: createError } = await this.supabase
                    .from('users')
                    .insert({
                        id: netlifyUser.id,
                        email: netlifyUser.email
                    });

                if (createError) {
                    console.error('Error creating user:', createError);
                    return null;
                }
            }

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
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('purchases')
                .select('*');

            if (error) {
                console.error('Error fetching purchases:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getUserPurchases:', error);
            return [];
        }
    }

    async addPurchase(purchaseData) {
        if (!this.supabase) return false;

        try {
            const { error } = await this.supabase
                .from('purchases')
                .upsert(purchaseData, { 
                    onConflict: 'user_id,tutorial_id,all_access',
                    ignoreDuplicates: false 
                });

            if (error) {
                console.error('Error adding purchase:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in addPurchase:', error);
            return false;
        }
    }

    async checkCourseAccess(userId, courseId) {
        if (!this.supabase) return false;

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
