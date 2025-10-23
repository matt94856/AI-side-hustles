// Modern AI Business Training Website JavaScript
// Targeting SMBs with professional functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeAuth();
    initializeModals();
    initializeCourseInteractions();
    initializeAnimations();
    initializeMobileMenu();
    
    // Initialize Netlify Identity when it's available
    function initNetlifyIdentity() {
        console.log('🔄 Checking for Netlify Identity...');
        if (typeof netlifyIdentity !== 'undefined') {
            console.log('✅ Netlify Identity found, initializing...');
            netlifyIdentity.init();
            setupAuthHandlers();
            console.log('✅ Netlify Identity initialized successfully');
        } else {
            console.log('⏳ Netlify Identity not ready, retrying...');
            // Retry after a short delay if Netlify Identity isn't loaded yet
            setTimeout(initNetlifyIdentity, 100);
        }
    }
    
    initNetlifyIdentity();
});

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Only process if href is not just '#' and has a valid target
            if (href && href !== '#' && href.length > 1) {
                try {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                } catch (error) {
                    console.warn('Invalid selector:', href);
                }
            }
        });
    });
}

// Authentication functionality
function initializeAuth() {
    console.log('🔧 Initializing authentication...');
    
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    const solutionSignupBtn = document.getElementById('solutionSignupBtn');
    const finalSignupBtn = document.getElementById('finalSignupBtn');
    
    console.log('📋 Found buttons:', {
        signupBtn: !!signupBtn,
        loginBtn: !!loginBtn,
        heroSignupBtn: !!heroSignupBtn,
        solutionSignupBtn: !!solutionSignupBtn,
        finalSignupBtn: !!finalSignupBtn
    });
    
    // Add click handlers for all signup buttons
    [signupBtn, heroSignupBtn, solutionSignupBtn, finalSignupBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚀 Signup button clicked, opening Netlify Identity...');
                if (typeof netlifyIdentity !== 'undefined') {
                    netlifyIdentity.open('signup');
                } else {
                    console.error('❌ Netlify Identity not available');
                }
            });
        }
    });
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔐 Login button clicked, opening Netlify Identity...');
            if (typeof netlifyIdentity !== 'undefined') {
                netlifyIdentity.open('login');
            } else {
                console.error('❌ Netlify Identity not available');
            }
        });
    }
    
    console.log('✅ Authentication initialization complete');
}

function setupAuthHandlers() {
    // Handle login state changes
    netlifyIdentity.on('login', async (user) => {
        console.log('User logged in:', user);
        
        // Update UI
        updateAuthUI(true);
        
        // Sync with Supabase and load user data
        try {
            await syncUserDataAfterLogin(user);
        } catch (error) {
            console.error('Error syncing user data after login:', error);
        }
        
        // Redirect to dashboard or intended page
        const redirectTo = sessionStorage.getItem('redirectTo');
        const tutorialId = sessionStorage.getItem('tutorialId');
        
        if (redirectTo) {
            sessionStorage.removeItem('redirectTo');
            sessionStorage.removeItem('tutorialId');
            window.location.href = redirectTo;
        } else {
            window.location.href = 'dashboard.html';
        }
    });
    
    netlifyIdentity.on('logout', () => {
        console.log('User logged out');
        updateAuthUI(false);
        
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('purchasedCourses');
        localStorage.removeItem('allAccess');
        localStorage.removeItem('courseProgress');
        localStorage.removeItem('enrolledCourses');
        
        // Redirect to homepage
        window.location.href = 'index.html';
    });
    
    // Check initial auth state
    const user = netlifyIdentity.currentUser();
    updateAuthUI(!!user);
    
    // If user is already logged in, sync their data
    if (user) {
        syncUserDataAfterLogin(user);
    }
}

function updateAuthUI(isLoggedIn) {
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    
    if (isLoggedIn) {
        if (signupBtn) {
            signupBtn.textContent = 'Dashboard';
            signupBtn.href = 'dashboard.html';
            signupBtn.onclick = null;
        }
        if (loginBtn) {
            loginBtn.textContent = 'Sign Out';
            loginBtn.onclick = () => netlifyIdentity.logout();
        }
    } else {
        if (signupBtn) {
            signupBtn.textContent = 'Start Learning AI';
            signupBtn.href = 'javascript:void(0)';
            signupBtn.onclick = (e) => {
                e.preventDefault();
                netlifyIdentity.open('signup');
            };
        }
        if (loginBtn) {
            loginBtn.textContent = 'Sign In';
            loginBtn.onclick = (e) => {
                e.preventDefault();
                netlifyIdentity.open('login');
            };
        }
    }
}

// Modal functionality
function initializeModals() {
    // Course preview modal only (custom auth modals removed)
    const coursePreviewModal = document.getElementById('coursePreviewModal');
    const closePreviewModal = document.getElementById('closePreviewModal');
    
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', closePreviewModalHandler);
    }
    
    // Close modal when clicking outside
    if (coursePreviewModal) {
        coursePreviewModal.addEventListener('click', (e) => {
            if (e.target === coursePreviewModal) {
                closeModal(coursePreviewModal);
            }
        });
    }
}

// Removed custom modal functions - using Netlify Identity instead

function closePreviewModalHandler() {
    const modal = document.getElementById('coursePreviewModal');
    closeModal(modal);
}

// Removed closeAllModals function - using Netlify Identity instead

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Form handling
// Removed handleSignup and handleLogin functions - using Netlify Identity instead

// Course interactions
function initializeCourseInteractions() {
    // Course enrollment buttons
    const courseBtns = document.querySelectorAll('.course-btn');
    courseBtns.forEach(btn => {
        btn.addEventListener('click', handleCourseEnrollment);
    });
    
    // Pricing buttons
    const pricingBtns = document.querySelectorAll('.pricing-btn');
    pricingBtns.forEach(btn => {
        btn.addEventListener('click', handlePricingSelection);
    });
    
    // Watch demo button
    const watchDemoBtn = document.getElementById('watchDemoBtn');
    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', handleWatchDemo);
    }
}

function handleCourseEnrollment(e) {
    e.preventDefault();
    
    const courseType = e.target.getAttribute('data-course');
        const user = netlifyIdentity.currentUser();
    
        if (!user) {
        // Store course selection and redirect to signup
        sessionStorage.setItem('selectedCourse', courseType);
        openSignupModal();
            return;
        }

    // User is logged in, proceed with enrollment
    enrollInCourse(courseType);
}

function handlePricingSelection(e) {
    e.preventDefault();
    
    const plan = e.target.getAttribute('data-plan');
    const user = netlifyIdentity.currentUser();
    
    if (!user) {
        // Store plan selection and redirect to signup
        sessionStorage.setItem('selectedPlan', plan);
        openSignupModal();
        return;
    }
    
    // User is logged in, proceed with purchase
    initiatePurchase(plan);
}

function handleWatchDemo() {
    // Open course preview modal with demo content
    const demoContent = `
        <div class="demo-content">
            <h3>See AI in Action</h3>
            <p>Watch how our students have transformed their businesses:</p>
            <ul>
                <li>Sarah increased her marketing ROI by 350% in 30 days</li>
                <li>Mike automated 80% of his repetitive tasks</li>
                <li>Emily boosted social media engagement by 400%</li>
            </ul>
            <p>Ready to get these same results for your business?</p>
        </div>
    `;
    
    showCoursePreview('AI Business Demo', demoContent);
}

function enrollInCourse(courseType) {
    // Check if user already has access
    checkCourseAccess(courseType).then(hasAccess => {
        if (hasAccess) {
            // Redirect to course
            window.location.href = `course-${courseType}.html`;
                } else {
            // Show purchase flow
            initiatePurchase(courseType);
            }
        });
}

function initiatePurchase(plan) {
    // Store purchase intent
    sessionStorage.setItem('purchasePlan', plan);
    
    // Redirect to payment page
    window.location.href = `checkout.html?plan=${plan}`;
}

function getCourseId(courseType) {
    const courseIdMap = {
        'marketing': 1,
        'social-media': 2,
        'automation': 3,
        'content-creation': 4,
        'analytics': 5
    };
    return courseIdMap[courseType] || 1;
}

// Initialize Supabase Auth
document.addEventListener('DOMContentLoaded', async () => {
    await window.supabaseAuth.init();
});

// Sync user data after login
async function syncUserDataAfterLogin(user) {
    try {
        // Sync Netlify Identity with Supabase
        const supabaseUser = await window.supabaseAuth.syncNetlifyIdentityWithSupabase(user);
        if (!supabaseUser) {
            console.error('Failed to sync user with Supabase');
            return;
        }

        // Load user purchases from Supabase
        const purchases = await window.supabaseAuth.getUserPurchases(user.id);
        
        // Update local storage with Supabase data
        const purchasedCourses = [];
        let hasAllAccess = false;
        
        purchases.forEach(purchase => {
            if (purchase.all_access) {
                hasAllAccess = true;
                // Add all courses for all-access
                purchasedCourses.push('marketing', 'social-media', 'automation', 'content-creation', 'analytics');
                    } else {
                // Add specific course
                const courseType = getCourseTypeFromTutorialId(purchase.tutorial_id);
                if (courseType && !purchasedCourses.includes(courseType)) {
                    purchasedCourses.push(courseType);
                }
            }
        });

        // Update local storage
        localStorage.setItem('user', JSON.stringify({
            id: user.id,
            email: user.email
        }));
        localStorage.setItem('purchasedCourses', JSON.stringify(purchasedCourses));
        localStorage.setItem('allAccess', hasAllAccess.toString());
        
        // Also update enrolledCourses for dashboard compatibility
        localStorage.setItem('enrolledCourses', JSON.stringify(purchasedCourses));
        
        console.log('User data synced successfully:', {
            purchasedCourses,
            hasAllAccess,
            purchasesCount: purchases.length
        });
        
    } catch (error) {
        console.error('Error syncing user data:', error);
    }
}

function getCourseTypeFromTutorialId(tutorialId) {
    const tutorialIdMap = {
        1: 'marketing',
        2: 'social-media', 
        3: 'automation',
        4: 'content-creation',
        5: 'analytics'
    };
    return tutorialIdMap[tutorialId] || null;
}

function checkCourseAccess(courseType) {
    return new Promise(async (resolve) => {
        const user = netlifyIdentity.currentUser();
        if (!user) {
            resolve(false);
                return;
            }
            
        // Check local storage first (should be synced after login)
        const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
        const hasAllAccess = localStorage.getItem('allAccess') === 'true';

        if (hasAllAccess || purchasedCourses.includes(courseType)) {
            resolve(true);
                return;
            }

        // If not in local storage, try to sync and check again
        try {
            await syncUserDataAfterLogin(user);
            
            // Check again after sync
            const updatedPurchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
            const updatedAllAccess = localStorage.getItem('allAccess') === 'true';
            
            resolve(updatedAllAccess || updatedPurchasedCourses.includes(courseType));
        } catch (error) {
            console.error('Error checking course access:', error);
            resolve(false);
        }
    });
}

function showCoursePreview(title, content) {
    const modal = document.getElementById('coursePreviewModal');
    const titleEl = document.getElementById('previewTitle');
    const contentEl = document.getElementById('previewContent');
    
    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = content;
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Animations and scroll effects
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.course-card, .testimonial-card, .problem-card, .faq-item');
    animateElements.forEach(el => observer.observe(el));
    
    // Counter animation for stats
    const statNumbers = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(stat => statObserver.observe(stat));
}

function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        const suffix = element.textContent.replace(/[\d]/g, '');
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

function debounce(func, wait) {
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

// Course data for previews
const coursePreviews = {
    'marketing': {
        title: 'AI in Marketing',
        content: `
            <h3>Transform Your Marketing with AI</h3>
            <p>Learn how to use AI to create personalized marketing campaigns that convert 300% better than traditional methods.</p>
            
            <h4>What You'll Learn:</h4>
            <ul>
                <li>Automated lead generation and qualification</li>
                <li>AI-powered email marketing campaigns</li>
                <li>Personalized content creation at scale</li>
                <li>Predictive analytics for customer behavior</li>
                <li>ROI optimization with AI insights</li>
            </ul>
            
            <h4>Tools You'll Master:</h4>
            <ul>
                <li>HubSpot AI</li>
                <li>Mailchimp AI</li>
                <li>Google Analytics AI</li>
                <li>ChatGPT for marketing</li>
                <li>Canva AI</li>
            </ul>
            
            <p><strong>Result:</strong> Most students see 300% increase in marketing ROI within 30 days.</p>
        `
    },
    'social-media': {
        title: 'AI for Social Media',
        content: `
            <h3>Master Social Media with AI</h3>
            <p>Create viral content and manage multiple platforms with AI tools that save 10 hours per week.</p>
            
            <h4>What You'll Learn:</h4>
            <ul>
                <li>AI-powered content creation</li>
                <li>Multi-platform posting automation</li>
                <li>Engagement optimization strategies</li>
                <li>Social listening and sentiment analysis</li>
                <li>Influencer identification and outreach</li>
            </ul>
            
            <h4>Tools You'll Master:</h4>
            <ul>
                <li>Hootsuite AI</li>
                <li>Buffer AI</li>
                <li>Canva AI</li>
                <li>ChatGPT for social content</li>
                <li>Midjourney for visuals</li>
            </ul>
            
            <p><strong>Result:</strong> Average 400% increase in social media engagement.</p>
        `
    },
    'automation': {
        title: 'AI Automation',
        content: `
            <h3>Automate Your Business Operations</h3>
            <p>Save 20+ hours per week by automating repetitive tasks and workflows with AI.</p>
            
            <h4>What You'll Learn:</h4>
            <ul>
                <li>Workflow automation with Zapier</li>
                <li>AI-powered customer service</li>
                <li>Automated data entry and processing</li>
                <li>Smart scheduling and calendar management</li>
                <li>Process optimization strategies</li>
            </ul>
            
            <h4>Tools You'll Master:</h4>
            <ul>
                <li>Zapier AI</li>
                <li>Microsoft Power Automate</li>
                <li>ChatGPT API</li>
                <li>Calendly AI</li>
                <li>Notion AI</li>
            </ul>
            
            <p><strong>Result:</strong> Save 20+ hours per week on repetitive tasks.</p>
        `
    },
    'content-creation': {
        title: 'AI Content Creation',
        content: `
            <h3>Create Content 10x Faster with AI</h3>
            <p>Generate high-quality blogs, emails, and marketing materials with AI tools.</p>
            
            <h4>What You'll Learn:</h4>
            <ul>
                <li>AI blog post generation</li>
                <li>Email marketing automation</li>
                <li>SEO-optimized content creation</li>
                <li>Video script writing with AI</li>
                <li>Content calendar automation</li>
            </ul>
            
            <h4>Tools You'll Master:</h4>
            <ul>
                <li>ChatGPT for writing</li>
                <li>Jasper AI</li>
                <li>Copy.ai</li>
                <li>Grammarly AI</li>
                <li>Surfer SEO</li>
            </ul>
            
            <p><strong>Result:</strong> Create 10x more content in the same time.</p>
        `
    },
    'analytics': {
        title: 'AI Analytics & Insights',
        content: `
            <h3>Make Data-Driven Decisions with AI</h3>
            <p>Use AI-powered analytics to predict trends and optimize performance.</p>
            
            <h4>What You'll Learn:</h4>
            <ul>
                <li>Predictive analytics and forecasting</li>
                <li>Customer behavior analysis</li>
                <li>Performance tracking automation</li>
                <li>Trend identification and analysis</li>
                <li>ROI measurement and optimization</li>
            </ul>
            
            <h4>Tools You'll Master:</h4>
            <ul>
                <li>Google Analytics AI</li>
                <li>Tableau AI</li>
                <li>Power BI AI</li>
                <li>ChatGPT for data analysis</li>
                <li>Microsoft Copilot</li>
            </ul>
            
            <p><strong>Result:</strong> Make faster, more accurate business decisions.</p>
        `
    },
    'bundle': {
        title: 'Complete AI Business Bundle',
        content: `
            <h3>Everything You Need to Transform Your Business</h3>
            <p>Get all 5 courses plus exclusive bonuses for the ultimate AI business transformation.</p>
            
            <h4>What's Included:</h4>
            <ul>
                <li>All 5 AI courses (Marketing, Social Media, Automation, Content, Analytics)</li>
                <li>Exclusive AI tools and templates</li>
                <li>Private community access</li>
                <li>Lifetime updates and support</li>
                <li>1-on-1 consultation call</li>
                <li>Certificate of completion</li>
            </ul>
            
            <h4>Bonus Materials:</h4>
            <ul>
                <li>AI Tool Comparison Guide</li>
                <li>Business Process Templates</li>
                <li>ROI Tracking Spreadsheet</li>
                <li>Monthly AI Updates</li>
            </ul>
            
            <p><strong>Value:</strong> $497 worth of training for just $297. Save $200!</p>
        `
    }
};

// Add course preview functionality
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('course-btn')) {
        const courseType = e.target.getAttribute('data-course');
        const preview = coursePreviews[courseType];
        
        if (preview) {
            showCoursePreview(preview.title, preview.content);
        }
    }
});

// Export functions for global access
window.AIBusinessTraining = {
    openSignupModal,
    openLoginModal,
    enrollInCourse,
    checkCourseAccess,
    showMessage
};