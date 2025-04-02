import { supabase, initSupabase } from './supabase.js';
import { showMessage } from './utils.js';
import netlifyIdentity from 'netlify-identity-widget';

// Initialize Supabase
initSupabase().catch(error => {
    console.error('Failed to initialize Supabase:', error);
    showMessage('Failed to connect to the database. Please refresh the page.', 'error');
});

// User data operations
export async function getUserData(netlifyId) {
    try {
        console.log('Fetching user data for:', netlifyId);
        
        // Query user data
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('netlify_id', netlifyId)
            .single();

        if (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }

        // If user doesn't exist, create them
        if (!data) {
            console.log('User not found, creating new user record');
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([
                    {
                        netlify_id: netlifyId,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                throw createError;
            }

            return newUser;
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('netlify_id', netlifyId);

        return data;
    } catch (error) {
        console.error('Error in getUserData:', error);
        throw error;
    }
}

// Purchase operations
export async function savePurchase(purchaseData) {
    try {
        console.log('Saving purchase:', purchaseData);
        
        const { data, error } = await supabase
            .from('purchases')
            .insert([
                {
                    transaction_id: purchaseData.transactionId,
                    amount: purchaseData.amount,
                    purchase_date: purchaseData.timestamp,
                    is_all_access: purchaseData.isAllAccess
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error saving purchase:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in savePurchase:', error);
        throw error;
    }
}

export async function getPurchasedModules(netlifyId) {
    try {
        console.log('Fetching purchased modules for:', netlifyId);
        
        const { data, error } = await supabase
            .from('purchases')
            .select('module_id')
            .eq('user_id', netlifyId);

        if (error) {
            console.error('Error fetching purchased modules:', error);
            throw error;
        }

        // Extract module IDs from the response
        const moduleIds = data.map(purchase => purchase.module_id);
        return moduleIds;
    } catch (error) {
        console.error('Error in getPurchasedModules:', error);
        throw error;
    }
}

// Sync local storage with database
export async function syncPurchases(netlifyId) {
    try {
        console.log('Syncing purchases for:', netlifyId);
        
        // Get purchased modules from database
        const purchasedModules = await getPurchasedModules(netlifyId);
        
        // Update localStorage
        localStorage.setItem('purchasedModules', JSON.stringify(purchasedModules));
        
        // Update allAccess flag if all modules are purchased
        const allModules = [1, 2, 3, 4, 5];
        const hasAllAccess = allModules.every(moduleId => 
            purchasedModules.includes(moduleId.toString()) || purchasedModules.includes(moduleId)
        );
        localStorage.setItem('allAccess', hasAllAccess);
        
        console.log('Purchase sync complete:', {
            purchasedModules,
            hasAllAccess
        });
        
        return purchasedModules;
    } catch (error) {
        console.error('Error in syncPurchases:', error);
        throw error;
    }
}

// Save all-access purchase
export async function saveAllAccessPurchase(netlifyId) {
    try {
        const allModules = [1, 2, 3, 4, 5];
        const purchases = allModules.map(moduleId => ({
            user_id: netlifyId,
            module_id: moduleId,
            purchase_date: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('purchases')
            .insert(purchases)
            .select();

        if (error) {
            console.error('Error saving all-access purchase:', error);
            throw error;
        }

        // Update local storage
        await syncPurchases(netlifyId);

        return data;
    } catch (error) {
        console.error('Error in saveAllAccessPurchase:', error);
        throw error;
    }
}

// Sync purchases from Supabase to local storage
export async function syncPurchasesFromSupabase() {
    const user = window.netlifyIdentity?.currentUser();
    if (!user) return;

    try {
        const { data, error } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;

        // Update local storage with latest purchase data
        if (data && data.length > 0) {
            const purchasedTutorials = data.map(purchase => purchase.tutorial_id);
            localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedTutorials));
            
            // Check if user has all-access
            const hasAllAccess = data.some(purchase => purchase.is_all_access);
            localStorage.setItem('allAccess', hasAllAccess ? 'true' : 'false');
            
            // Update payment status
            localStorage.setItem('paymentStatus', 'active');
            
            // Update payment data with most recent purchase
            const latestPurchase = data.reduce((latest, current) => 
                new Date(current.purchase_date) > new Date(latest.purchase_date) ? current : latest
            );
            
            localStorage.setItem('paymentData', JSON.stringify({
                type: latestPurchase.is_all_access ? 'all' : 'single',
                transactionId: latestPurchase.transaction_id,
                timestamp: new Date(latestPurchase.purchase_date).getTime()
            }));
        }
    } catch (error) {
        console.error('Error syncing purchases:', error);
        showMessage('Error syncing purchase data. Please try refreshing the page.', 'error');
    }
} 