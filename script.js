document.addEventListener("DOMContentLoaded", function () {
  if (typeof netlifyIdentity !== "undefined") {
    netlifyIdentity.on("init", user => {
      const isLoggedIn = !!user;
      const paywallButtons = document.querySelectorAll(
        ".enroll-course-btn, .instant-access-btn, .premium-access-btn, .enroll-now, .bundle-cta"
      );
      paywallButtons.forEach(button => {
        button.addEventListener("click", function (e) {
          if (!isLoggedIn) {
            e.preventDefault();
            // Store the current page URL and any tutorial ID
            const currentPage = window.location.pathname;
            const tutorialId = this.getAttribute('onclick')?.match(/checkPaymentStatus\((\d+)\)/)?.[1] || 'all';
            sessionStorage.setItem('redirectTo', currentPage);
            sessionStorage.setItem('tutorialId', tutorialId);
            window.location.href = `login.html`;
          }
        });
      });
    });
    netlifyIdentity.init();
  }
});


// Tutorial Preview Content
const tutorialPreviews = {
    1: {
        title: "AI-Powered Freelancing",
        content: `Learn how to leverage AI tools to offer high-quality freelancing services. This comprehensive guide will show you how to:

1. Choose your AI-powered service niche
2. Set up your freelancing workspace
3. Create a portfolio that stands out
4. Set competitive pricing
5. Find and retain clients

Recommended AI Tools:
• ChatGPT for content creation
• Midjourney for image generation
• ElevenLabs for voice synthesis
• GitHub Copilot for coding

[Continue reading to learn the complete step-by-step process...]`
    },
    2: {
        title: "Affiliate Marketing with AI",
        content: `Discover how to use AI to create compelling affiliate content and maximize your earnings. This guide covers:

1. Selecting profitable AI tool niches
2. Creating high-converting content
3. Building an email list
4. Optimizing for conversions
5. Scaling your affiliate business

Recommended AI Tools:
• ChatGPT for content creation
• Jasper AI for long-form content
• Canva AI for visuals
• Surfer SEO for optimization

[Continue reading to learn the complete step-by-step process...]`
    },
    3: {
        title: "Content Creation with AI",
        content: `Master the art of creating engaging content using AI tools. Learn how to:

1. Choose your content platform
2. Set up your AI workflow
3. Create viral content
4. Optimize for engagement
5. Monetize your content

Recommended AI Tools:
• ChatGPT for writing
• Pictory AI for video creation
• Midjourney for images
• ElevenLabs for voice

[Continue reading to learn the complete step-by-step process...]`
    },
    4: {
        title: "Selling AI-Based Digital Products",
        content: `Learn how to create and sell digital products using AI tools. This guide will show you:

1. Choose your product type
2. Research your market
3. Create your product
4. Set up your sales platform
5. Market your products

Recommended AI Tools:
• ChatGPT for writing
• Canva AI for designs
• Jasper AI for long-form content
• Gumroad for selling

[Continue reading to learn the complete step-by-step process...]`
    },
    5: {
        title: "AI-Powered Consulting Services",
        content: `Start your AI consulting business and help others leverage artificial intelligence. Learn:

1. Choose your consulting niche
2. Build your expertise
3. Create your service package
4. Find your clients
5. Deliver value

Recommended AI Tools:
• ChatGPT for research
• DataRobot for AI models
• AutoML platforms
• Process mining tools

[Continue reading to learn the complete step-by-step process...]`
    }
};

// PayPal Integration
let paypalButtons = {
    singleTutorial: null,
    allTutorials: null
};

// Modal Functions
let modal = null;
let closeBtn = null;
let currentTutorialId = null;

function initializeModal() {
    modal = document.getElementById('premiumModal');
    closeBtn = document.getElementsByClassName('close')[0];
    
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    // Add window click handler
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}

function showModal(tutorialId) {
    if (!modal) return;
    
    currentTutorialId = tutorialId;
    
    // Update preview content
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    
    if (previewTitle && previewContent && tutorialPreviews[tutorialId]) {
        previewTitle.textContent = tutorialPreviews[tutorialId].title;
        previewContent.innerHTML = tutorialPreviews[tutorialId].content.replace(/\n/g, '<br>');
    }
    
    // Check if on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        showMobileDisclaimer();
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    currentTutorialId = null;
}

// Payment Status Functions
function checkPaymentStatus() {
    const paymentData = JSON.parse(localStorage.getItem('paymentData'));
    if (!paymentData) return false;
    return true; // Always return true if payment data exists (lifetime access)
}

function enableAccessToTutorial(tutorialId) {
    const paymentData = JSON.parse(localStorage.getItem('paymentData'));
    if (paymentData && paymentData.type === 'single' && paymentData.tutorialId === tutorialId) {
        document.body.classList.add('premium-access');
    }
}

function enableAccessToAllTutorials() {
    const paymentData = JSON.parse(localStorage.getItem('paymentData'));
    if (paymentData && paymentData.type === 'all') {
        document.body.classList.add('premium-access');
    }
}

// Message Display Function
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Intersection Observer for Animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.tutorial-card, .testimonial-card, .faq-item').forEach((el) => observer.observe(el));

// Move closeBtn.onclick and window.onclick inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modal first
    initializeModal();
    
    // Check if we need to show the paywall modal
    const showPaywallFor = sessionStorage.getItem('showPaywallFor');
    if (showPaywallFor) {
        sessionStorage.removeItem('showPaywallFor');
        showModal(parseInt(showPaywallFor));
    }
    
    const isPremiumPage = window.location.pathname.includes('tutorial');
    if (isPremiumPage) {
        const tutorialId = parseInt(window.location.pathname.match(/tutorial(\d+)\.html/)[1]);
        const paymentData = JSON.parse(localStorage.getItem('paymentData'));
        
        if (!paymentData) {
            showModal(tutorialId);
        } else if (paymentData.type === 'single' && paymentData.tutorialId !== tutorialId) {
            showModal(tutorialId);
        }
    }

    // Initialize quizzes first
    console.log('Starting quiz initialization...');
    initializeQuizzes();
    
    // Then initialize other functionality
    initializePayPal();
    loadProgress();
    initializeLessons();
    initializeAssignments();
    initializeMobileMenu();
    initializeSmoothScrolling();
    updateProgressBar();
});

// Function to enable access to premium content
function enableAccess(tutorialId) {
    const tutorialPages = {
        1: 'tutorial1.html',
        2: 'tutorial2.html',
        3: 'tutorial3.html',
        4: 'tutorial4.html',
        5: 'tutorial5.html'
    };

    const tutorialPage = tutorialPages[tutorialId];
    if (tutorialPage) {
        window.location.href = tutorialPage;
    } else {
        showMessage('Invalid tutorial selection', 'error');
    }
}

// Function to check payment status and enable access
function checkPaymentStatus(tutorialId) {
    const paymentStatus = localStorage.getItem('paymentStatus');
    const purchasedTutorials = JSON.parse(localStorage.getItem('purchasedTutorials') || '[]');
    const allAccess = localStorage.getItem('allAccess') === 'true';
    
    // Check if on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (allAccess || purchasedTutorials.includes(tutorialId)) {
        enableAccess(tutorialId);
    } else {
        showMessage('Please purchase access to view this tutorial', 'info');
        
        // Show mobile disclaimer if on mobile
        if (isMobile) {
            showMobileDisclaimer();
        }
        
        showModal(tutorialId);
    }
}

// Function to show mobile disclaimer
function showMobileDisclaimer() {
    // Remove any existing disclaimer
    const existingDisclaimer = document.querySelector('.mobile-disclaimer');
    if (existingDisclaimer) {
        existingDisclaimer.remove();
    }
    
    // Create disclaimer element
    const disclaimer = document.createElement('div');
    disclaimer.className = 'mobile-disclaimer';
    disclaimer.innerHTML = `
        <div class="disclaimer-content">
            <i class="fas fa-desktop"></i>
            <p>For the best purchasing experience, we recommend completing your purchase on a desktop computer.</p>
            <button class="disclaimer-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(disclaimer);
    
    // Add close button functionality
    const closeBtn = disclaimer.querySelector('.disclaimer-close');
    closeBtn.addEventListener('click', function() {
        disclaimer.remove();
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (document.body.contains(disclaimer)) {
            disclaimer.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(disclaimer)) {
                    disclaimer.remove();
                }
            }, 1000);
        }
    }, 10000);
}

// Course Progress Tracking
let courseProgress = {
    currentModule: 1,
    completedLessons: new Set(),
    quizScores: {},
    assignments: {}
};

// Load progress from localStorage if available
function loadProgress() {
    const savedProgress = localStorage.getItem('courseProgress');
    if (savedProgress) {
        courseProgress = JSON.parse(savedProgress);
        courseProgress.completedLessons = new Set(courseProgress.completedLessons);
        updateProgressBar();
    }
}

// Save progress to localStorage
function saveProgress() {
    const progressToSave = {
        ...courseProgress,
        completedLessons: Array.from(courseProgress.completedLessons)
    };
    localStorage.setItem('courseProgress', JSON.stringify(progressToSave));
}

// Update progress bar
function updateProgressBar() {
    const lessons = document.querySelectorAll('.lesson').length;
    const quizzes = document.querySelectorAll('.module-quiz').length;
    const assignments = document.querySelectorAll('.module-assignment').length;
    
    const totalItems = lessons + quizzes + assignments;
    const completedLessons = courseProgress.completedLessons.size;
    const completedQuizzes = Object.values(courseProgress.quizScores).filter(q => q.completed).length;
    const completedAssignments = Object.values(courseProgress.assignments).filter(a => a.completed).length;
    
    const totalCompleted = completedLessons + completedQuizzes + completedAssignments;
    const progressPercentage = (totalCompleted / totalItems) * 100;
    
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-section p');
    
    if (progressBar && progressText) {
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${Math.round(progressPercentage)}% Complete (${totalCompleted}/${totalItems} items)`;
    }
}

// Initialize Supabase client
let supabase;
let supabaseInitAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

async function ensureSupabaseInitialized() {
    if (supabase) return true;
    
    if (supabaseInitAttempts >= MAX_INIT_ATTEMPTS) {
        throw new Error('Failed to initialize Supabase after multiple attempts');
    }
    
    supabaseInitAttempts++;
    
    try {
        // Get the current user from Netlify Identity
        const user = netlifyIdentity.currentUser();
        
        // Initialize Supabase with the user's token if available
        supabase = supabase.createClient(
            'https://tdxpostwbmpnsikjftvy.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHBvc3R3Ym1wbnNpa2pmdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NjQ0MDAsImV4cCI6MjAyNTI0MDQwMH0.2XQm5wXqgXj4XQm5wXqgXj4XQm5wXqgXj4XQm5wXqgXj4',
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                },
                global: {
                    headers: user ? {
                        Authorization: `Bearer ${user.token.access_token}`
                    } : {}
                }
            }
        );
        
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// Add event listener for Netlify Identity token refresh
if (typeof netlifyIdentity !== 'undefined') {
    netlifyIdentity.on('tokenRefreshed', user => {
        if (supabase && user) {
            // Update Supabase headers with new token
            supabase.realtime.setAuth(user.token.access_token);
        }
    });
}

async function savePurchaseToDatabase(tutorialId, type, transactionDetails) {
    try {
        // Ensure Supabase is initialized
        await ensureSupabaseInitialized();
        
        if (!supabase) {
            console.error('Supabase client not initialized');
            // Still grant access locally
            grantLocalAccess(type, tutorialId, transactionDetails);
            return true;
        }

        const user = netlifyIdentity.currentUser();
        if (!user) {
            console.log('No user logged in, granting local access only');
            grantLocalAccess(type, tutorialId, transactionDetails);
            return true;
        }

        // Store payment details in Supabase
        const purchaseData = {
            user_id: user.id,
            all_access: type === 'all',
            tutorial_id: type === 'all' ? null : parseInt(tutorialId),
            purchase_date: new Date().toISOString()
        };

        // First try to insert
        const { error: insertError } = await supabase
            .from('user_purchases')
            .insert(purchaseData);

        if (insertError) {
            // If insert fails due to unique constraint, try update
            const { error: updateError } = await supabase
                .from('user_purchases')
                .update(purchaseData)
                .eq('user_id', user.id)
                .eq('tutorial_id', type === 'all' ? null : parseInt(tutorialId));

            if (updateError) {
                console.error('Error saving to database:', updateError);
                grantLocalAccess(type, tutorialId, transactionDetails);
                return true;
            }
        }

        // Update local state
        grantLocalAccess(type, tutorialId, transactionDetails);
        return true;
    } catch (error) {
        console.error('Error in savePurchaseToDatabase:', error);
        // Grant access locally even if there's an error
        grantLocalAccess(type, tutorialId, transactionDetails);
        return true;
    }
}

// Helper function to grant local access
function grantLocalAccess(type, tutorialId, transactionDetails) {
    if (type === 'all') {
        localStorage.setItem('allAccess', 'true');
        localStorage.setItem('paymentDate', new Date().getTime().toString());
        localStorage.setItem('transactionId', transactionDetails.id);
    } else {
        const purchasedTutorials = JSON.parse(localStorage.getItem('purchasedTutorials') || '[]');
        if (!purchasedTutorials.includes(tutorialId)) {
            purchasedTutorials.push(tutorialId);
            localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedTutorials));
            localStorage.setItem('paymentDate', new Date().getTime().toString());
            localStorage.setItem('transactionId', transactionDetails.id);
        }
    }
}

// Update the payment success handler
function handlePaymentSuccess(tutorialId, type, transactionDetails) {
    savePurchaseToDatabase(tutorialId, type, transactionDetails)
        .then(success => {
            if (success) {
                if (type === 'all') {
                    window.location.href = 'index.html#tutorials';
                } else {
                    window.location.href = `tutorial${tutorialId}.html`;
                }
            } else {
                showMessage('There was an error processing your purchase. Please contact support.', 'error');
            }
        })
        .catch(error => {
            console.error('Error in payment processing:', error);
            // Still grant access even if there's an error
            grantLocalAccess(type, tutorialId, transactionDetails);
            if (type === 'all') {
                window.location.href = 'index.html#tutorials';
            } else {
                window.location.href = `tutorial${tutorialId}.html`;
            }
        });
}

// Update the PayPal success handlers
function initializePayPal() {
    const singleTutorialButton = document.querySelector('#singleTutorialButton');
    const allTutorialsButton = document.querySelector('#allTutorialsButton');
    
    if (!singleTutorialButton && !allTutorialsButton) return;

    if (typeof paypal !== 'undefined') {
        // Single Tutorial Button
        if (singleTutorialButton) {
            paypal.Buttons({
                createOrder: function(data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: '7.99',
                                currency_code: 'USD'
                            },
                            description: `Single Tutorial Access: ${tutorialPreviews[currentTutorialId].title}`
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: function(data, actions) {
                    return actions.order.capture().then(function(details) {
                        handlePaymentSuccess(currentTutorialId, 'single', details);
                    });
                },
                onError: function(err) {
                    console.error('Payment error:', err);
                    let errorMessage = 'There was an error processing your payment. ';
                    
                    // Add specific guidance for card errors
                    if (err.message && err.message.includes('card')) {
                        errorMessage += 'Please try a different card or payment method. Some cards may not be supported.';
                    } else {
                        errorMessage += 'Please try again or contact support if the problem persists.';
                    }
                    
                    showMessage(errorMessage, 'error');
                },
                onCancel: function() {
                    showMessage('Payment cancelled. You can try again when you\'re ready.', 'info');
                }
            }).render('#singleTutorialButton');
        }

        // All Tutorials Button
        if (allTutorialsButton) {
            paypal.Buttons({
                createOrder: function(data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: '19.99',
                                currency_code: 'USD'
                            },
                            description: 'Access to All 5 AI Money-Making Tutorials'
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: function(data, actions) {
                    return actions.order.capture().then(function(details) {
                        handlePaymentSuccess(null, 'all', details);
                    });
                },
                onError: function(err) {
                    console.error('Payment error:', err);
                    let errorMessage = 'There was an error processing your payment. ';
                    
                    // Add specific guidance for card errors
                    if (err.message && err.message.includes('card')) {
                        errorMessage += 'Please try a different card or payment method. Some cards may not be supported.';
                    } else {
                        errorMessage += 'Please try again or contact support if the problem persists.';
                    }
                    
                    showMessage(errorMessage, 'error');
                },
                onCancel: function() {
                    showMessage('Payment cancelled. You can try again when you\'re ready.', 'info');
                }
            }).render('#allTutorialsButton');
        }
    }
}

// Quiz Functionality
function initializeQuizzes() {
    console.log('Starting quiz initialization...');
    
    // Get all quiz forms
    const quizForms = document.querySelectorAll('.quiz-form');
    console.log(`Found ${quizForms.length} quiz forms on the page`);
    
    if (quizForms.length === 0) {
        console.log('No quiz forms found. Checking HTML structure...');
        const moduleQuizzes = document.querySelectorAll('.module-quiz');
        console.log(`Found ${moduleQuizzes.length} .module-quiz elements`);
        
        if (moduleQuizzes.length === 0) {
            console.log('No quiz elements found. Skipping quiz initialization.');
            return;
        }
    }
    
    // Initialize each quiz form
    quizForms.forEach((form, index) => {
        try {
            const options = form.querySelectorAll('.quiz-option');
            const feedback = form.querySelector('.quiz-feedback');
            const submitBtn = form.querySelector('.submit-quiz');
            
            if (!options || !feedback || !submitBtn) {
                console.warn(`Quiz form ${index} is missing required elements. Skipping.`);
                return;
            }
            
            options.forEach(option => {
                option.addEventListener('click', function() {
                    options.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
            
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const selected = form.querySelector('.quiz-option.selected');
                
                if (!selected) {
                    feedback.textContent = 'Please select an answer';
                    feedback.className = 'quiz-feedback error';
                    return;
                }
                
                const isCorrect = selected.dataset.correct === 'true';
                feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect. Try again.';
                feedback.className = `quiz-feedback ${isCorrect ? 'success' : 'error'}`;
                
                if (isCorrect) {
                    options.forEach(opt => opt.classList.remove('selected'));
                    submitBtn.disabled = true;
                }
            });
        } catch (error) {
            console.error(`Error initializing quiz form ${index}:`, error);
        }
    });
}

// Lesson Completion Tracking
function initializeLessons() {
    const lessons = document.querySelectorAll('.lesson');
    
    lessons.forEach((lesson, index) => {
        // Add completion checkbox
        const header = lesson.querySelector('h3');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'lesson-checkbox';
        checkbox.checked = courseProgress.completedLessons.has(index);
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                courseProgress.completedLessons.add(index);
            } else {
                courseProgress.completedLessons.delete(index);
            }
            saveProgress();
            updateProgressBar();
        });
        
        header.appendChild(checkbox);
    });
}

// Assignment Submission
function initializeAssignments() {
    const assignments = document.querySelectorAll('.module-assignment');
    
    assignments.forEach((assignment, index) => {
        const assignmentId = `assignment-${index}`;
        
        // Create assignment tracker
        const tracker = document.createElement('div');
        tracker.className = 'assignment-tracker';
        
        // Create task list
        const tasks = assignment.querySelectorAll('li');
        const taskList = document.createElement('div');
        taskList.className = 'assignment-tasks';
        
        tasks.forEach((task, taskIndex) => {
            const taskId = `${assignmentId}-task-${taskIndex}`;
            const taskWrapper = document.createElement('div');
            taskWrapper.className = 'assignment-task';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = taskId;
            checkbox.checked = courseProgress.assignments[assignmentId]?.tasks?.[taskIndex] || false;
            
            const label = document.createElement('label');
            label.htmlFor = taskId;
            label.textContent = task.textContent;
            
            taskWrapper.appendChild(checkbox);
            taskWrapper.appendChild(label);
            taskList.appendChild(taskWrapper);
            
            checkbox.addEventListener('change', () => {
                if (!courseProgress.assignments[assignmentId]) {
                    courseProgress.assignments[assignmentId] = { tasks: {} };
                }
                courseProgress.assignments[assignmentId].tasks[taskIndex] = checkbox.checked;
                
                // Check if all tasks are completed
                const allTasksCompleted = Array.from(taskList.querySelectorAll('input[type="checkbox"]'))
                    .every(cb => cb.checked);
                
                if (allTasksCompleted && !courseProgress.assignments[assignmentId].completed) {
                    courseProgress.assignments[assignmentId].completed = true;
                    courseProgress.completedLessons.add(assignmentId);
                    showMessage('Assignment completed! Great work!', 'success');
                }
                
                saveProgress();
                updateProgressBar();
            });
        });
        
        // Add file upload for deliverables
        const uploadSection = document.createElement('div');
        uploadSection.className = 'assignment-upload';
        uploadSection.innerHTML = `
            <h4>Submit Your Work</h4>
            <input type="file" id="${assignmentId}-file" multiple>
            <button class="upload-btn" disabled>Upload Deliverables</button>
            <div class="upload-status"></div>
        `;
        
        // Add everything to the assignment
        tracker.appendChild(taskList);
        tracker.appendChild(uploadSection);
        assignment.appendChild(tracker);
        
        // Handle file selection
        const fileInput = uploadSection.querySelector('input[type="file"]');
        const uploadButton = uploadSection.querySelector('.upload-btn');
        const uploadStatus = uploadSection.querySelector('.upload-status');
        
        fileInput.addEventListener('change', () => {
            uploadButton.disabled = fileInput.files.length === 0;
        });
        
        uploadButton.addEventListener('click', () => {
            // Simulate file upload
            uploadStatus.textContent = 'Uploading...';
            setTimeout(() => {
                uploadStatus.textContent = 'Files uploaded successfully!';
                if (!courseProgress.assignments[assignmentId]) {
                    courseProgress.assignments[assignmentId] = { tasks: {} };
                }
                courseProgress.assignments[assignmentId].filesUploaded = true;
                saveProgress();
                updateProgressBar();
            }, 1500);
        });
    });
}

// Mobile Menu Toggle
function initializeMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Add styles for new elements
const styles = `
    .lesson-checkbox {
        margin-left: 1rem;
        transform: scale(1.5);
    }
    
    .assignment-submit {
        display: block;
        margin-top: 1rem;
        padding: 0.8rem 1.5rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }
    
    .assignment-submit:hover {
        background: var(--secondary-color);
    }
    
    .assignment-submit:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    
    .nav-links.active {
        display: flex;
    }

    .quiz-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 2rem;
        position: relative;
    }

    .quiz-buttons {
        margin-top: 2rem;
        width: 100%;
    }

    .quiz-submit, .quiz-retry {
        display: block !important;
        width: 100%;
        padding: 1rem 2rem;
        margin-bottom: 1rem;
        background-color: #0984E3;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .quiz-submit:hover {
        background-color: #0773C5;
        transform: translateY(-2px);
    }

    .quiz-retry {
        background-color: #6c757d;
    }

    .quiz-retry:hover {
        background-color: #545b62;
        transform: translateY(-2px);
    }

    .quiz-score {
        margin: 1rem 0;
        font-weight: bold;
        text-align: center;
    }

    .quiz-score.passed {
        color: #28a745;
    }

    .quiz-score.failed {
        color: #dc3545;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Update the checkPurchaseStatus function to work with the new table structure
async function checkPurchaseStatus(userId, tutorialId) {
    try {
        // Ensure Supabase is initialized
        await ensureSupabaseInitialized();
        
        if (!supabase) {
            console.error('Supabase client not initialized');
            return false;
        }

        // Check for all-access first
        const { data: allAccessData, error: allAccessError } = await supabase
            .from('user_purchases')
            .select('all_access')
            .eq('user_id', userId)
            .eq('all_access', true)
            .single();

        if (allAccessError && allAccessError.code !== 'PGRST116') {
            console.error('Error checking all-access:', allAccessError);
            return false;
        }

        if (allAccessData) {
            return true;
        }

        // If no all-access, check specific tutorial
        const { data: tutorialData, error: tutorialError } = await supabase
            .from('user_purchases')
            .select('tutorial_id')
            .eq('user_id', userId)
            .eq('tutorial_id', tutorialId)
            .single();

        if (tutorialError && tutorialError.code !== 'PGRST116') {
            console.error('Error checking tutorial access:', tutorialError);
            return false;
        }

        return !!tutorialData;
    } catch (error) {
        console.error('Error checking purchase status:', error);
        return false;
    }
} 