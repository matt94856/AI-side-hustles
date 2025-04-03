// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Please check environment variables.');
}

// Initialize Supabase client with retry mechanism
function initSupabase(retries = 3) {
    try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'X-Client-Info': 'ai-hustle-hub'
                }
            }
        });

        // Test connection
        supabase.from('user_purchases').select('count').limit(1)
            .then(() => console.log('✅ Supabase connected'))
            .catch(err => console.error('❌ Supabase connection error:', err));

        return supabase;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Supabase initialization failed, retrying... (${retries} attempts left)`);
            return new Promise(resolve => setTimeout(() => resolve(initSupabase(retries - 1)), 1000));
        }
        throw error;
    }
}

// Initialize Supabase
const supabase = initSupabase();

// Create supabaseUtils object
window.supabaseUtils = {
    setupAuthHandlers: async function() {
        try {
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
                    window.authUtils.handleAuthError(error);
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
                        window.authUtils.handleAuthError(error);
                    }
                }
            }, 5 * 60 * 1000);
        } catch (error) {
            console.error('Error in setupAuthHandlers:', error);
            window.authUtils.handleAuthError(error);
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