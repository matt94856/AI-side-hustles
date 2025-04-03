// Supabase configuration
const SUPABASE_URL = 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// Utility functions for purchase tracking
const supabaseUtils = {
    // Setup authentication handlers
    setupAuthHandlers: function() {
        // Update Supabase auth headers when Netlify Identity token refreshes
        netlifyIdentity.on('login', user => {
            if (user) {
                console.log('Setting Supabase session with Netlify token');
                user.jwt().then(token => {
                    supabase.auth.setSession(token)
                        .then(response => {
                            console.log('Supabase session set successfully:', response);
                        })
                        .catch(error => {
                            console.error('Error setting Supabase session:', error);
                        });
                });
            }
        });

        // Handle token refresh
        netlifyIdentity.on('refresh', user => {
            if (user) {
                console.log('Refreshing Supabase session');
                user.jwt().then(token => {
                    supabase.auth.setSession(token)
                        .then(response => {
                            console.log('Supabase session refreshed successfully:', response);
                        })
                        .catch(error => {
                            console.error('Error refreshing Supabase session:', error);
                        });
                });
            }
        });

        // Handle logout
        netlifyIdentity.on('logout', () => {
            console.log('Clearing Supabase session');
            supabase.auth.signOut()
                .then(() => {
                    console.log('Supabase session cleared successfully');
                })
                .catch(error => {
                    console.error('Error clearing Supabase session:', error);
                });
        });
    },

    // Record a purchase
    recordPurchase: async function(userId, tutorialId) {
        try {
            const { data, error } = await supabase
                .from('user_purchases')
                .insert([
                    { 
                        user_id: userId,
                        tutorial_id: tutorialId,
                        purchase_date: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Error recording purchase:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in recordPurchase:', error);
            throw error;
        }
    },

    // Get user purchases
    getUserPurchases: async function(userId) {
        try {
            const { data, error } = await supabase
                .from('user_purchases')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching purchases:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in getUserPurchases:', error);
            throw error;
        }
    },

    // Sync purchases with local storage
    syncUserPurchases: async function() {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) return;

            const purchases = await this.getUserPurchases(user.id);
            if (purchases) {
                localStorage.setItem('userPurchases', JSON.stringify(purchases));
            }
        } catch (error) {
            console.error('Error syncing purchases:', error);
        }
    }
};

// Export the utilities
window.supabaseUtils = supabaseUtils; 