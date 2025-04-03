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

    // Handle authentication errors
    handleAuthError: function(error) {
        console.error('Authentication error:', error);
        
        // Clear sensitive data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPurchases');
        
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
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return storedUser.id === user.id;
    },

    // Get current user
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

    // Redirect to login
    redirectToLogin: function(returnUrl = window.location.href) {
        // Don't redirect if we're already on the login page
        if (window.location.pathname.includes('login.html')) {
            return;
        }
        const loginUrl = `/login.html?return_to=${encodeURIComponent(returnUrl)}`;
        window.location.href = loginUrl;
    },

    // Handle login redirect
    handleLoginRedirect: function() {
        // Don't handle redirects if we're not on the login page
        if (!window.location.pathname.includes('login.html')) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return_to');
        
        if (returnUrl && this.isAuthenticated()) {
            // Prevent redirect loops
            if (returnUrl === window.location.href || returnUrl.includes('login.html')) {
                window.location.href = '/'; // Redirect to home if return URL would cause a loop
            } else {
                window.location.href = returnUrl;
            }
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