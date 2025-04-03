// Supabase configuration
const SUPABASE_URL = window.SUPABASE_URL || 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// Create supabaseUtils object
window.supabaseUtils = {
    setupAuthHandlers: function() {
        netlifyIdentity.on('login', async (user) => {
            try {
                await this.syncUserPurchases();
            } catch (error) {
                console.error('Error during login sync:', error);
            }
        });

        netlifyIdentity.on('logout', () => {
            localStorage.removeItem('userPurchases');
            localStorage.removeItem('lastSyncTimestamp');
            // Clear individual tutorial access flags
            for (let i = 1; i <= 5; i++) {
                localStorage.removeItem(`tutorial${i}_access`);
            }
        });

        // Set up periodic sync (every 5 minutes)
        setInterval(() => {
            const user = netlifyIdentity.currentUser();
            if (user) {
                this.syncUserPurchases().catch(console.error);
            }
        }, 5 * 60 * 1000);
    },

    savePurchaseToDatabase: async function(purchaseData) {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) throw new Error('No user logged in');

            const token = await user.jwt();
            
            const response = await fetch('/.netlify/functions/save-purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(purchaseData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save purchase');
            }

            // After successful save, sync purchases
            await this.syncUserPurchases();
            return true;
        } catch (error) {
            console.error('Error saving purchase:', error);
            this.handleAuthError(error);
            return false;
        }
    },

    syncUserPurchases: async function() {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) return;

            const token = await user.jwt();
            
            const response = await fetch('/.netlify/functions/sync-purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to sync purchases');
            }

            const { purchases } = await response.json();
            
            if (purchases) {
                localStorage.setItem('userPurchases', JSON.stringify(purchases));
                purchases.forEach(purchase => {
                    if (purchase.tutorial_id) {
                        localStorage.setItem(`tutorial${purchase.tutorial_id}_access`, 'true');
                    }
                });
                localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
            }
        } catch (error) {
            console.error('Error syncing purchases:', error);
            this.handleAuthError(error);
        }
    },

    handleAuthError: function(error) {
        if (error.message?.includes('JWT expired')) {
            netlifyIdentity.refresh().then(() => {
                // Retry the operation after token refresh
                this.syncUserPurchases();
            }).catch(refreshError => {
                console.error('Token refresh failed:', refreshError);
                netlifyIdentity.logout();
            });
        }
    },

    checkTutorialAccess: function(tutorialId) {
        const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
        return purchases.some(purchase => 
            purchase.tutorial_id === tutorialId || 
            purchase.tutorial_id === 'all'
        );
    },

    // Add test function
    testConnection: async function() {
        try {
            console.log('Testing Supabase connection...');
            
            // Test database connection
            const { data, error } = await supabase
                .from('user_purchases')
                .select('count(*)')
                .limit(1);
            
            if (error) throw error;
            console.log('✅ Database connection successful');
            
            // Test auth
            const user = netlifyIdentity.currentUser();
            if (user) {
                const token = await user.jwt();
                console.log('✅ User authenticated');
                
                // Test Netlify function connection
                const response = await fetch('/.netlify/functions/sync-purchases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Netlify function error');
                console.log('✅ Netlify function connection successful');
            } else {
                console.log('ℹ️ No user logged in');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }
}; 