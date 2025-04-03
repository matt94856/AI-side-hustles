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
                this.handleUserLogin(user);
            }
        });

        netlifyIdentity.on('login', user => {
            this.updateLoginUI(user);
            this.setupSessionRefresh(user);
            this.handleUserLogin(user);
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

    handleUserLogin: async function(user) {
        try {
            // Get the user's Netlify ID
            const netlifyId = user.id;
            
            // Check if user exists in Supabase
            const { data: existingUser, error: checkError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('netlify_id', netlifyId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (!existingUser) {
                // Create new user in Supabase
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([{
                        netlify_id: netlifyId,
                        email: user.email,
                        created_at: new Date().toISOString()
                    }]);

                if (insertError) throw insertError;
            }

            // Store user info in localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                email: user.email,
                lastLogin: new Date().toISOString()
            }));

            // Sync purchases
            await window.supabaseUtils.syncUserPurchases();
        } catch (error) {
            console.error('Error in handleUserLogin:', error);
            this.handleAuthError(error);
        }
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
        
        // Clear sensitive data
        this.clearSession();
        
        if (error.message?.includes('401') || 
            error.message?.includes('JWT') || 
            error.message?.includes('token')) {
            this.redirectToLogin();
        }
    },

    clearSession: function() {
        localStorage.removeItem('nf_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPurchases');
        sessionStorage.removeItem('returnTo');
        sessionStorage.removeItem('tutorialId');
        // Clear individual tutorial access flags
        for (let i = 1; i <= 5; i++) {
            localStorage.removeItem(`tutorial${i}_access`);
        }
    },

    redirectToLogin: function(returnUrl = window.location.pathname) {
        if (!window.location.pathname.includes('login.html')) {
            sessionStorage.setItem('returnTo', returnUrl);
            window.location.href = '/login.html';
        }
    },

    isAuthenticated: function() {
        const user = netlifyIdentity.currentUser();
        if (!user) return false;

        // Check if session is still valid
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return storedUser.id === user.id;
    },

    getCurrentUser: function() {
        const user = netlifyIdentity.currentUser();
        if (!user) return null;

        // Verify stored user matches current user
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (storedUser.id !== user.id) {
            this.handleUserLogin(user);
        }

        return user;
    },

    checkSession: async function() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        try {
            const user = this.getCurrentUser();
            if (!user) return false;

            // Verify token is still valid
            const token = await user.jwt();
            if (!token) {
                this.handleAuthError(new Error('Invalid token'));
                return false;
            }

            return true;
        } catch (error) {
            this.handleAuthError(error);
            return false;
        }
    }
}; 