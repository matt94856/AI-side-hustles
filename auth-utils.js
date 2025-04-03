// Auth utilities
window.authUtils = {
    init: function() {
        if (!window.netlifyIdentity) {
            console.error('Netlify Identity not loaded');
            return;
        }

        // Initialize Netlify Identity
        netlifyIdentity.on('init', user => {
            this.updateLoginUI(user);
        });

        netlifyIdentity.on('login', user => {
            this.updateLoginUI(user);
            this.handleRedirect();
        });

        netlifyIdentity.on('logout', () => {
            this.updateLoginUI(null);
            window.location.href = '/';
        });

        netlifyIdentity.init();
    },

    updateLoginUI: function(user) {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn && logoutBtn) {
            if (user) {
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-block';
            } else {
                loginBtn.style.display = 'inline-block';
                logoutBtn.style.display = 'none';
            }
        }
    },

    handleRedirect: function() {
        const returnTo = sessionStorage.getItem('returnTo');
        const tutorialId = sessionStorage.getItem('tutorialId');
        
        if (returnTo) {
            sessionStorage.removeItem('returnTo');
            sessionStorage.removeItem('tutorialId');
            window.location.href = returnTo;
        }
    },

    isAuthenticated: function() {
        return !!netlifyIdentity.currentUser();
    }
}; 