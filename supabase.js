// Supabase configuration
const SUPABASE_URL = 'https://tdxpostwbmpnsikjftvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDk5MzAsImV4cCI6MjA1ODc4NTkzMH0.-_azSsbF2xre1qQr7vppVoKzHAJRuzIgHzlutAMtmW0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
});

// Authentication handlers
function setupAuthHandlers() {
    // Update Supabase auth headers when Netlify Identity token refreshes
    netlifyIdentity.on('login', user => {
        if (supabase && user) {
            console.log('Setting Supabase session with Netlify token');
            user.jwt().then(token => {
                supabase.auth.setSession(token)
                    .then(response => {
                        console.log('Supabase session set successfully:', response);
                        syncUserPurchases(user.id);
                    })
                    .catch(error => {
                        console.error('Error setting Supabase session:', error);
                    });
            });
        }
    });

    // Handle token refresh
    netlifyIdentity.on('refresh', user => {
        if (supabase && user) {
            console.log('Refreshing Supabase session');
            user.jwt().then(token => {
                supabase.auth.setSession(token)
                    .then(response => {
                        console.log('Supabase session refreshed successfully:', response);
                        syncUserPurchases(user.id);
                    })
                    .catch(error => {
                        console.error('Error refreshing Supabase session:', error);
                    });
            });
        }
    });

    // Handle logout
    netlifyIdentity.on('logout', () => {
        if (supabase) {
            console.log('Clearing Supabase session');
            supabase.auth.signOut()
                .then(() => {
                    console.log('Supabase session cleared successfully');
                    // Clear local purchase data
                    Object.keys(localStorage).forEach(key => {
                        if (key.includes('tutorial') && key.includes('Progress')) {
                            localStorage.removeItem(key);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error clearing Supabase session:', error);
                });
        }
    });
}

// Purchase synchronization
async function syncUserPurchases(userId) {
    try {
        // Fetch user's purchases from Supabase
        const { data: purchases, error } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching purchases:', error);
            return;
        }

        // Update local storage with purchase data
        if (purchases && purchases.length > 0) {
            purchases.forEach(purchase => {
                if (purchase.all_access) {
                    // Grant access to all tutorials
                    for (let i = 1; i <= 5; i++) {
                        localStorage.setItem(`tutorial${i}_access`, 'true');
                    }
                } else if (purchase.tutorial_id) {
                    // Grant access to specific tutorial
                    localStorage.setItem(`tutorial${purchase.tutorial_id}_access`, 'true');
                }
            });
        }
    } catch (error) {
        console.error('Error syncing purchases:', error);
    }
}

// Save purchase to database
async function savePurchaseToDatabase(userId, tutorialId, type, transactionDetails) {
    try {
        // Check if user already has access
        const { data: existingPurchase, error: checkError } = await supabase
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
            const { error: updateError } = await supabase
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
            const { error: insertError } = await supabase
                .from('user_purchases')
                .insert([{
                    user_id: userId,
                    tutorial_id: tutorialId,
                    purchase_date: new Date().toISOString(),
                    transaction_details: transactionDetails,
                    status: 'completed',
                    all_access: type === 'all_access'
                }]);

            if (insertError) throw insertError;
        }

        // Update local storage
        if (type === 'all_access') {
            for (let i = 1; i <= 5; i++) {
                localStorage.setItem(`tutorial${i}_access`, 'true');
            }
        } else {
            localStorage.setItem(`tutorial${tutorialId}_access`, 'true');
        }

        return true;
    } catch (error) {
        console.error('Error saving purchase:', error);
        return false;
    }
}

// Export functions
window.supabaseUtils = {
    setupAuthHandlers,
    syncUserPurchases,
    savePurchaseToDatabase,
    supabase
}; 