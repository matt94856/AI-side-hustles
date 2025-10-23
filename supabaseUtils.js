// Supabase utilities
const supabaseUtils = {
    // Sync user purchases from server
    syncUserPurchases: async function() {
        // Prevent multiple simultaneous syncs
        if (isSyncing) {
            console.log('Sync already in progress, skipping...');
            return;
        }

        try {
            isSyncing = true;
            const user = netlifyIdentity.currentUser();
            if (!user) {
                console.error('No user logged in');
                return;
            }

            // Check if token is expired or about to expire
            const tokenExpiry = new Date(user.token.expires_at);
            const now = new Date();
            if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) { // 5 minutes
                console.log('Token about to expire, refreshing...');
                await netlifyIdentity.refresh();
                user = netlifyIdentity.currentUser();
            }

            const response = await fetch('/.netlify/functions/supabaseHandler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token.access_token}`
                },
                body: JSON.stringify({
                    action: 'getPurchases',
                    user: {
                        id: user.id,
                        token: user.token.access_token
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            // Update local storage
            const purchasedTutorials = result.purchases.map(p => p.tutorial_id);
            localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedTutorials));
            
            console.log('Successfully synced purchases:', purchasedTutorials);
        } catch (error) {
            console.error('Error syncing purchases:', error);
            // Retry after 30 seconds if error occurs
            setTimeout(() => {
                supabaseUtils.syncUserPurchases();
            }, 30000);
        } finally {
            isSyncing = false;
        }
    },

    // Check purchase status
    checkPurchaseStatus: async function(tutorialId) {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) return false;

            // Call our Netlify Function to verify purchase
            const response = await fetch('/.netlify/functions/supabaseHandler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: {
                        id: user.id,
                        token: user.token.access_token
                    },
                    action: 'verifyPurchase',
                    table: 'user_purchases',
                    data: { tutorial_id: tutorialId }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.length > 0;
        } catch (error) {
            console.error('Error checking purchase status:', error);
            return false;
        }
    },

    // Start auto-sync when user logs in
    startAutoSync: function() {
        if (autoSyncInterval) {
            clearInterval(autoSyncInterval);
        }
        // Sync every 5 minutes
        autoSyncInterval = setInterval(supabaseUtils.syncUserPurchases, 5 * 60 * 1000);
    },

    // Stop auto-sync when user logs out
    stopAutoSync: function() {
        if (autoSyncInterval) {
            clearInterval(autoSyncInterval);
            autoSyncInterval = null;
        }
    }
};

// Add sync lock to prevent multiple simultaneous syncs
let isSyncing = false;

// Add auto-sync interval
let autoSyncInterval = null;

// Export the utilities
window.supabaseUtils = supabaseUtils; 