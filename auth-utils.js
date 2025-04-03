// Auth utilities
window.authUtils = {
    init: function() {
        if (!window.netlifyIdentity) {
            console.error('Netlify Identity not loaded');
            return;
        }

        netlifyIdentity.on('init', user => {
            this.updateLoginUI(user);
            if (user) {
                this.setupSessionRefresh(user);
            }
        });

        netlifyIdentity.on('login', user => {
            this.updateLoginUI(user);
            this.setupSessionRefresh(user);
            this.handleRedirect();
        });

        netlifyIdentity.on('logout', () => {
            this.updateLoginUI(null);
            this.clearSession();
            window.location.href = '/';
        });

        netlifyIdentity.on('error', err => {
            console.error('Auth error:', err);
            this.handleAuthError(err);
        });

        netlifyIdentity.init();
    },

    updateLoginUI: function(user) {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userMenu = document.getElementById('user-menu');
        
        if (loginBtn && logoutBtn) {
            if (user) {
                loginBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-block';
                if (userMenu) {
                    userMenu.textContent = user.email;
                    userMenu.style.display = 'block';
                }
            } else {
                loginBtn.style.display = 'inline-block';
                logoutBtn.style.display = 'none';
                if (userMenu) {
                    userMenu.style.display = 'none';
                }
            }
        }
    },

    handleRedirect: function() {
        const returnTo = sessionStorage.getItem('returnTo');
        const tutorialId = sessionStorage.getItem('tutorialId');
        
        if (returnTo) {
            sessionStorage.removeItem('returnTo');
            sessionStorage.removeItem('tutorialId');
            // Prevent redirect loops
            if (returnTo === window.location.href || returnTo.includes('login.html')) {
                window.location.href = '/';
            } else {
                window.location.href = returnTo;
            }
        }
    },

    setupSessionRefresh: function(user) {
        // Refresh token 5 minutes before expiry
        const refreshToken = async () => {
            try {
                await netlifyIdentity.refresh();
                const token = await user.jwt();
                localStorage.setItem('nf_token', token);
            } catch (error) {
                console.error('Token refresh failed:', error);
                this.handleAuthError(error);
            }
        };

        // Check token every 5 minutes
        setInterval(refreshToken, 5 * 60 * 1000);
    },

    handleAuthError: function(error) {
        console.error('Auth error:', error);
        
        if (error.message?.includes('401') || 
            error.message?.includes('JWT') || 
            error.message?.includes('token')) {
            this.clearSession();
            this.redirectToLogin();
        }
    },

    clearSession: function() {
        localStorage.removeItem('nf_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPurchases');
        sessionStorage.removeItem('returnTo');
        sessionStorage.removeItem('tutorialId');
    },

    redirectToLogin: function() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('login.html')) {
            sessionStorage.setItem('returnTo', currentPath);
            window.location.href = '/login.html';
        }
    },

    isAuthenticated: function() {
        return !!netlifyIdentity.currentUser();
    }
}; 