import { supabase } from './supabase';
import netlifyIdentity from 'netlify-identity-widget';

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
export async function savePurchase(netlifyId, moduleId) {
    try {
        console.log('Saving purchase:', { netlifyId, moduleId });
        
        const { data, error } = await supabase
            .from('purchases')
            .insert([
                {
                    user_id: netlifyId,
                    module_id: moduleId,
                    purchase_date: new Date().toISOString()
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
        localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedModules));
        
        // Update allAccess flag if all modules are purchased
        const allModules = [1, 2, 3, 4, 5];
        const hasAllAccess = allModules.every(moduleId => purchasedModules.includes(moduleId));
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

// Sync purchases from Supabase to local storage
export async function syncPurchasesFromSupabase() {
    const user = netlifyIdentity.currentUser();
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
            const hasAllAccess = data.some(purchase => purchase.tutorial_id === 'all');
            localStorage.setItem('allAccess', hasAllAccess ? 'true' : 'false');
            
            // Update payment status
            localStorage.setItem('paymentStatus', 'active');
            
            // Update payment data with most recent purchase
            const latestPurchase = data.reduce((latest, current) => 
                new Date(current.created_at) > new Date(latest.created_at) ? current : latest
            );
            
            localStorage.setItem('paymentData', JSON.stringify({
                type: latestPurchase.tutorial_id === 'all' ? 'all' : 'single',
                tutorialId: latestPurchase.tutorial_id,
                transactionId: latestPurchase.transaction_id,
                timestamp: new Date(latestPurchase.created_at).getTime()
            }));
            
            localStorage.setItem('paymentDate', new Date(latestPurchase.created_at).getTime().toString());
        }
    } catch (error) {
        console.error('Error syncing purchases:', error);
        showMessage('Error syncing purchase data. Please try refreshing the page.', 'error');
    }
} 