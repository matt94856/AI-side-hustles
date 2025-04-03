// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

// Initialize Supabase client only if it doesn't exist
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    });
}

// Utility functions for purchase tracking
const supabaseUtils = {
    // Setup authentication handlers
    setupAuthHandlers: function() {
        // Update Supabase auth headers when Netlify Identity token refreshes
        netlifyIdentity.on('login', user => {
            if (user) {
                console.log('Setting Supabase session with Netlify token');
                user.jwt().then(token => {
                    window.supabaseClient.auth.setSession(token)
                        .then(response => {
                            console.log('Supabase session set successfully:', response);
                            this.syncUserPurchases();
                            // Start periodic sync
                            this.startPeriodicSync();
                        })
                        .catch(error => {
                            console.error('Error setting Supabase session:', error);
                            this.handleAuthError(error);
                        });
                });
            }
        });

        // Handle token refresh
        netlifyIdentity.on('refresh', user => {
            if (user) {
                console.log('Refreshing Supabase session');
                user.jwt().then(token => {
                    window.supabaseClient.auth.setSession(token)
                        .then(response => {
                            console.log('Supabase session refreshed successfully:', response);
                            this.syncUserPurchases();
                        })
                        .catch(error => {
                            console.error('Error refreshing Supabase session:', error);
                            this.handleAuthError(error);
                        });
                });
            }
        });

        // Handle logout
        netlifyIdentity.on('logout', () => {
            console.log('Clearing Supabase session');
            window.supabaseClient.auth.signOut()
                .then(() => {
                    console.log('Supabase session cleared successfully');
                    // Clear local purchase data
                    localStorage.removeItem('userPurchases');
                    // Stop periodic sync
                    this.stopPeriodicSync();
                })
                .catch(error => {
                    console.error('Error clearing Supabase session:', error);
                });
        });
    },

    // Start periodic sync
    startPeriodicSync: function() {
        // Clear any existing interval
        this.stopPeriodicSync();
        
        // Sync every 5 minutes
        this.syncInterval = setInterval(() => {
            this.syncUserPurchases();
        }, 5 * 60 * 1000);
    },

    // Stop periodic sync
    stopPeriodicSync: function() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // Handle authentication errors
    handleAuthError: function(error) {
        console.error('Authentication error:', error);
        
        // If token is invalid, try to refresh
        if (error.message.includes('JWT')) {
            const user = netlifyIdentity.currentUser();
            if (user) {
                user.jwt(true).then(token => {
                    window.supabaseClient.auth.setSession(token)
                        .then(() => {
                            console.log('Session refreshed after error');
                            this.syncUserPurchases();
                        })
                        .catch(refreshError => {
                            console.error('Error refreshing session:', refreshError);
                            // If refresh fails, redirect to login
                            window.authUtils.redirectToLogin();
                        });
                });
            }
        }
    },

    // Record a purchase
    recordPurchase: async function(userId, tutorialId, transactionDetails = {}) {
        try {
            // First check if the user is authenticated
            const user = netlifyIdentity.currentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if purchase already exists
            const { data: existingPurchase, error: checkError } = await window.supabaseClient
                .from('user_purchases')
                .select('*')
                .eq('user_id', userId)
                .eq('tutorial_id', tutorialId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingPurchase) {
                // Update existing purchase
                const { error: updateError } = await window.supabaseClient
                    .from('user_purchases')
                    .update({
                        purchase_date: new Date().toISOString(),
                        transaction_details: transactionDetails,
                        status: 'completed'
                    })
                    .eq('user_id', userId)
                    .eq('tutorial_id', tutorialId);

                if (updateError) throw updateError;
            } else {
                // Create new purchase
                const { error: insertError } = await window.supabaseClient
                    .from('user_purchases')
                    .insert([{
                        user_id: userId,
                        tutorial_id: tutorialId,
                        purchase_date: new Date().toISOString(),
                        transaction_details: transactionDetails,
                        status: 'completed'
                    }]);

                if (insertError) throw insertError;
            }

            // Update local storage and sync
            await this.syncUserPurchases();
            return true;
        } catch (error) {
            console.error('Error in recordPurchase:', error);
            this.handleAuthError(error);
            throw error;
        }
    },

    // Get user purchases
    getUserPurchases: async function(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('user_purchases')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching purchases:', error);
                this.handleAuthError(error);
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
                // Store raw purchase data
                localStorage.setItem('userPurchases', JSON.stringify(purchases));
                
                // Update tutorial access flags
                purchases.forEach(purchase => {
                    if (purchase.tutorial_id) {
                        localStorage.setItem(`tutorial${purchase.tutorial_id}_access`, 'true');
                    }
                });

                // Store last sync timestamp
                localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
            }
        } catch (error) {
            console.error('Error syncing purchases:', error);
            this.handleAuthError(error);
        }
    },

    // Check if user has access to a tutorial
    hasTutorialAccess: function(tutorialId) {
        try {
            const userPurchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
            return userPurchases.some(purchase => 
                purchase.tutorial_id === tutorialId && 
                purchase.status === 'completed'
            );
        } catch (error) {
            console.error('Error checking tutorial access:', error);
            return false;
        }
    },

    // Get last sync timestamp
    getLastSyncTimestamp: function() {
        return localStorage.getItem('lastSyncTimestamp');
    }
};

// Export the utilities
window.supabaseUtils = supabaseUtils; 
