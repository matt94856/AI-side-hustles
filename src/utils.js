// Utility functions for the application

// Show message to user
export function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Format date
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Check if user has access to a tutorial
export function checkTutorialAccess(tutorialId) {
    const user = netlifyIdentity.currentUser();
    if (!user) return false;
    
    const allAccess = localStorage.getItem('allAccess') === 'true';
    if (allAccess) return true;
    
    const purchasedTutorials = JSON.parse(localStorage.getItem('purchasedTutorials') || '[]');
    return purchasedTutorials.includes(tutorialId);
}

// Generate unique ID
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email
export function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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