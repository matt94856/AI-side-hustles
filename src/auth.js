import { createClient } from '@supabase/supabase-js';
import { showMessage } from './utils.js';

// Initialize Supabase client
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Netlify Identity
export function initializeAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                window.netlifyIdentity.on('login', () => {
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin');
                        checkPaymentStatus(redirectUrl);
                    } else {
                        document.location.href = '/';
                    }
                });
            }
        });

        window.netlifyIdentity.on('logout', () => {
            document.location.href = '/';
        });
    }
}

// Check if user has access to a tutorial
export async function checkPaymentStatus(tutorialId) {
    try {
        // Check if user is logged in
        const user = window.netlifyIdentity?.currentUser();
        
        if (!user) {
            // Store the current state before redirecting
            localStorage.setItem('redirectAfterLogin', tutorialId);
            window.location.href = '/login.html';
            return;
        }

        // Check if user has access to this tutorial in Supabase
        const { data: purchases, error } = await supabase
            .from('purchases')
            .select('*')
            .eq('user_id', user.id)
            .or(`tutorial_id.eq.${tutorialId},tutorial_id.eq.all`);

        if (error) {
            console.error('Error checking purchases:', error);
            showMessage('Error checking access. Please try again.', 'error');
            return;
        }

        if (purchases && purchases.length > 0) {
            // User has access, redirect to tutorial
            window.location.href = `/tutorials/${tutorialId}.html`;
            return;
        }

        // Show payment modal if no access
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.style.display = 'block';
            // Initialize PayPal buttons
            if (window.initializePayPal) {
                window.initializePayPal(tutorialId);
            }
        }
    } catch (error) {
        console.error('Error checking payment status:', error);
        showMessage('Error checking payment status. Please try again.', 'error');
    }
}

// Save purchase to Supabase
export async function savePurchase(userId, tutorialId, amount) {
    try {
        const { data, error } = await supabase
            .from('purchases')
            .insert([
                {
                    user_id: userId,
                    tutorial_id: tutorialId,
                    amount: amount,
                    purchase_date: new Date().toISOString()
                }
            ]);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error saving purchase:', error);
        throw error;
    }
}

// Make functions available globally
window.checkPaymentStatus = checkPaymentStatus;
window.initializeAuth = initializeAuth;
window.savePurchase = savePurchase; 