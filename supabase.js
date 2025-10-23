// Supabase configuration
const SUPABASE_URL = 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

let supabaseClient = null;

// Initialize Supabase client with retry mechanism
async function initSupabase(retries = 3) {
    if (supabaseClient) return supabaseClient;

    try {
        if (typeof window.supabase === 'undefined') {
            if (retries > 0) {
                console.warn('Waiting for Supabase client to load...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return initSupabase(retries - 1);
            }
            throw new Error('Supabase client failed to load');
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });

        // Test connection
        await supabaseClient.from('user_purchases').select('count').limit(1);
        console.log('✅ Supabase connected');
        window.supabaseClient = supabaseClient;
        return supabaseClient;
    } catch (error) {
        console.error('Supabase initialization error:', error);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initSupabase(retries - 1);
        }
        throw error;
    }
}

// Create supabaseUtils object
window.supabaseUtils = {
    setupAuthHandlers: async function() {
        try {
            await initSupabase();
            const user = netlifyIdentity.currentUser();
            if (user) {
                await this.syncUserPurchases();
            }

            netlifyIdentity.on('login', async (user) => {
                try {
                    const token = await this.getAuthToken();
                    if (token) {
                        await this.syncUserPurchases();
                    }
                } catch (error) {
                    console.error('Error during login sync:', error);
                    if (window.authUtils) {
                        window.authUtils.handleAuthError(error);
                    }
                }
            });

            netlifyIdentity.on('logout', () => {
                this.clearLocalData();
            });

            // Set up periodic sync
            setInterval(async () => {
                const currentUser = netlifyIdentity.currentUser();
                if (currentUser) {
                    try {
                        await this.syncUserPurchases();
                    } catch (error) {
                        console.error('Error in periodic sync:', error);
                        if (window.authUtils) {
                            window.authUtils.handleAuthError(error);
                        }
                    }
                }
            }, 5 * 60 * 1000);
        } catch (error) {
            console.error('Error in setupAuthHandlers:', error);
            if (window.authUtils) {
                window.authUtils.handleAuthError(error);
            }
        }
    },

    clearLocalData: function() {
        localStorage.removeItem('userPurchases');
        localStorage.removeItem('lastSyncTimestamp');
        localStorage.removeItem('nf_token');
        for (let i = 1; i <= 5; i++) {
            localStorage.removeItem(`tutorial${i}_access`);
        }
    },

    getAuthToken: async function() {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) throw new Error('No user logged in');

            const token = await user.jwt();
            localStorage.setItem('nf_token', token);
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            window.authUtils.handleAuthError(error);
            throw error;
        }
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
            if (!user) {
                console.log('No user logged in, skipping sync');
                return;
            }

            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('No valid token available');
            }
            
            const response = await fetch('/.netlify/functions/sync-purchases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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
            if (error.message.includes('401') || error.message.includes('Invalid token')) {
                await this.handleAuthError(error);
            }
            throw error;
        }
    },

    handleAuthError: async function(error) {
        try {
            if (error.message?.includes('401') || error.message?.includes('JWT') || error.message?.includes('token')) {
                console.log('Attempting to refresh token...');
                await netlifyIdentity.refresh();
                const newToken = await this.getAuthToken();
                if (newToken) {
                    console.log('Token refreshed successfully');
                    return true;
                }
            }
            return false;
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            netlifyIdentity.logout();
            return false;
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
            const { data, error } = await window.supabaseClient
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