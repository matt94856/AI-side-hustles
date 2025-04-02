// Utility functions for the application
import { supabase } from './supabase.js';

// Show message to user
export function showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Add to document
    document.body.appendChild(messageDiv);
    
    // Remove after delay
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            messageDiv.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(messageDiv)) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Format date for display
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Check if user has access to a module
export async function checkModuleAccess(moduleId) {
    try {
        const user = window.netlifyIdentity?.currentUser();
        if (!user) return false;
        
        // Check local storage first for performance
        const allAccess = localStorage.getItem('allAccess') === 'true';
        if (allAccess) return true;
        
        const purchasedModules = JSON.parse(localStorage.getItem('purchasedModules') || '[]');
        if (purchasedModules.includes(moduleId)) return true;
        
        // Double check with Supabase if not found in local storage
        const { data, error } = await supabase
            .from('purchases')
            .select('module_id')
            .eq('user_id', user.id)
            .eq('module_id', moduleId)
            .single();
            
        if (error) {
            console.error('Error checking module access:', error);
            return false;
        }
        
        return !!data;
    } catch (error) {
        console.error('Error in checkModuleAccess:', error);
        return false;
    }
}

// Generate a unique ID
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email format
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 