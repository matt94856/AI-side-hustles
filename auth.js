// Auth utilities
const authUtils = {
    // Initialize Netlify Identity
    init: function() {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.on('init', user => {
                if (user) {
                    this.handleUserLogin(user);
                }
            });

            // Handle errors
            window.netlifyIdentity.on('error', error => {
                console.error('Netlify Identity error:', error);
                this.handleAuthError(error);
            });
        }
    },

    // Handle user login
    handleUserLogin: async function(user) {
        try {
            // Check if user exists in Supabase
            const { data: existingUser, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking user:', error);
                return;
            }

            // Create user if doesn't exist
            if (!existingUser) {
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        created_at: new Date().toISOString()
                    }]);

                if (insertError) {
                    console.error('Error creating user:', insertError);
                    return;
                }
            }

            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                email: user.email
            }));

            // Initial sync
            await window.supabaseUtils.syncUserPurchases();
            
            // Start auto-sync
            window.supabaseUtils.startAutoSync();

            // Redirect to home page
            window.location.href = '/';
        } catch (error) {
            console.error('Error in handleUserLogin:', error);
        }
    },

    // Handle user logout
    handleUserLogout: function() {
        // Clear user data
        localStorage.removeItem('user');
        localStorage.removeItem('purchasedTutorials');
        localStorage.removeItem('allAccess');
        
        // Stop auto-sync
        window.supabaseUtils.stopAutoSync();
        
        // Redirect to login page
        window.location.href = '/login.html';
    },

    // Handle authentication errors
    handleAuthError: function(error) {
        console.error('Authentication error:', error);
        
        // Clear sensitive data
        localStorage.removeItem('user');
        localStorage.removeItem('purchasedTutorials');
        localStorage.removeItem('allAccess');
        
        // If token is invalid, redirect to login
        if (error.message.includes('JWT') || error.message.includes('401')) {
            this.redirectToLogin();
        }
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        const user = netlifyIdentity.currentUser();
        if (!user) return false;

        // Check if session is still valid
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        return storedUser.id === user.id;
    },

    // Get current user
    getCurrentUser: function() {
        const user = netlifyIdentity.currentUser();
        if (!user) return null;

        // Verify stored user matches current user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.id !== user.id) {
            this.handleUserLogin(user);
        }

        return user;
    },

    // Redirect to login
    redirectToLogin: function(returnUrl = window.location.href) {
        const loginUrl = `/login.html?return_to=${encodeURIComponent(returnUrl)}`;
        window.location.href = loginUrl;
    },

    // Handle login redirect
    handleLoginRedirect: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return_to');
        
        if (returnUrl && this.isAuthenticated()) {
            window.location.href = returnUrl;
        }
    },

    // Check session validity
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

// Export the utilities
window.authUtils = authUtils; 