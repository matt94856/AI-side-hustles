// Supabase utilities
const supabaseUtils = {
    // Sync user purchases from server
    syncUserPurchases: async function() {
        try {
            const user = netlifyIdentity.currentUser();
            if (!user) return;

            // Call our Netlify Function to get purchases
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
                    action: 'getPurchases',
                    table: 'user_purchases'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const purchases = await response.json();
            
            // Update local storage with server data
            const allAccess = purchases.some(p => p.all_access);
            if (allAccess) {
                localStorage.setItem('allAccess', 'true');
            } else {
                const purchasedTutorials = purchases
                    .filter(p => p.tutorial_id)
                    .map(p => p.tutorial_id);
                localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedTutorials));
            }

            console.log('Purchases synced successfully');
            return true;
        } catch (error) {
            console.error('Error syncing purchases:', error);
            return false;
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
    }
};

// Export the utilities
window.supabaseUtils = supabaseUtils; 