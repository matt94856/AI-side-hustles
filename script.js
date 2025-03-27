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
    
    if (allAccess || purchasedTutorials.includes(tutorialId)) {
        enableAccess(tutorialId);
    } else {
        showMessage('Please purchase access to view this tutorial', 'info');
        showModal(tutorialId);
    }
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

// Initialize PayPal only if the buttons exist
function initializePayPal() {
    const singleTutorialButton = document.querySelector('#singleTutorialButton');
    const allTutorialsButton = document.querySelector('#allTutorialsButton');
    
    if (!singleTutorialButton && !allTutorialsButton) return; // Skip if no PayPal buttons found

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
                        // Store payment details
                        const paymentData = {
                            type: 'single',
                            tutorialId: currentTutorialId,
                            transactionId: details.id,
                            timestamp: new Date().getTime()
                        };
                        
                        // Store purchased tutorials
                        const purchasedTutorials = JSON.parse(localStorage.getItem('purchasedTutorials') || '[]');
                        if (!purchasedTutorials.includes(currentTutorialId)) {
                            purchasedTutorials.push(currentTutorialId);
                        }
                        
                        // Store all payment data
                        localStorage.setItem('paymentData', JSON.stringify(paymentData));
                        localStorage.setItem('purchasedTutorials', JSON.stringify(purchasedTutorials));
                        localStorage.setItem('paymentDate', new Date().getTime().toString());
                        localStorage.setItem('paymentStatus', 'active');
                        
                        // Enable access to the specific tutorial
                        enableAccess(currentTutorialId);
                        
                        // Show success message
                        showMessage('Payment successful! You now have lifetime access to this tutorial.', 'success');
                        closeModal();
                    });
                },
                onError: function(err) {
                    console.error('Payment error:', err);
                    showMessage('There was an error processing your payment. Please try again.', 'error');
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
                        // Store payment details
                        const paymentData = {
                            type: 'all',
                            transactionId: details.id,
                            timestamp: new Date().getTime()
                        };
                        
                        // Store all payment data
                        localStorage.setItem('paymentData', JSON.stringify(paymentData));
                        localStorage.setItem('allAccess', 'true');
                        localStorage.setItem('paymentDate', new Date().getTime().toString());
                        localStorage.setItem('paymentStatus', 'active');
                        
                        // Enable access to all tutorials
                        enableAccessToAllTutorials();
                        
                        // Show success message
                        showMessage('Payment successful! You now have lifetime access to all tutorials.', 'success');
                        closeModal();
                    });
                },
                onError: function(err) {
                    console.error('Payment error:', err);
                    showMessage('There was an error processing your payment. Please try again.', 'error');
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
    console.log('=== Quiz Initialization Debug ===');
    console.log('Starting quiz initialization...');
    
    // Find all quiz forms
    const quizForms = document.querySelectorAll('.quiz-form');
    console.log(`Found ${quizForms.length} quiz forms on the page`);
    
    if (quizForms.length === 0) {
        console.warn('No quiz forms found. Checking HTML structure...');
        const moduleQuizzes = document.querySelectorAll('.module-quiz');
        console.log(`Found ${moduleQuizzes.length} .module-quiz elements`);
        moduleQuizzes.forEach((quiz, i) => {
            console.log(`Module Quiz ${i + 1} structure:`, quiz.innerHTML);
        });
        return;
    }
    
    quizForms.forEach((form, quizIndex) => {
        console.log(`\nProcessing quiz form ${quizIndex + 1}:`);
        
        // Remove any existing buttons
        const existingButtons = form.querySelectorAll('.quiz-submit, .quiz-retry');
        existingButtons.forEach(button => button.remove());
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'quiz-buttons';
        buttonContainer.style.cssText = 'margin-top: 2rem; width: 100%; display: block !important;';
        
        // Create submit button
        const submitButton = document.createElement('button');
        submitButton.className = 'quiz-submit';
        submitButton.textContent = 'Submit Quiz';
        submitButton.type = 'button';
        submitButton.style.cssText = 'display: block !important; margin-bottom: 1rem; visibility: visible !important; opacity: 1 !important;';
        buttonContainer.appendChild(submitButton);
        console.log('Submit button created');

        // Create retry button
        const retryButton = document.createElement('button');
        retryButton.className = 'quiz-retry';
        retryButton.textContent = 'Try Again';
        retryButton.type = 'button';
        retryButton.style.display = 'none';
        buttonContainer.appendChild(retryButton);
        console.log('Retry button created');

        // Create score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'quiz-score';
        
        // Append elements to form
        form.appendChild(scoreDisplay);
        form.appendChild(buttonContainer);
        console.log('Buttons appended to form');

        // Initialize quiz state
        if (!courseProgress.quizScores) {
            courseProgress.quizScores = {};
        }
        
        if (!courseProgress.quizScores[quizIndex]) {
            courseProgress.quizScores[quizIndex] = {
                answers: {},
                score: 0,
                attempts: 0,
                completed: false
            };
        }

        // Add event listeners
        const questions = form.querySelectorAll('.quiz-question');
        questions.forEach((question, questionIndex) => {
            const options = question.querySelectorAll('label');
            options.forEach(option => {
                const input = option.querySelector('input[type="radio"]');
                if (input) {
                    input.addEventListener('change', () => {
                        options.forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                        courseProgress.quizScores[quizIndex].answers[questionIndex] = option.textContent.trim();
                    });
                }
            });
        });

        // Handle quiz submission
        submitButton.addEventListener('click', () => {
            const allAnswered = Array.from(questions).every((question, index) => 
                courseProgress.quizScores[quizIndex].answers[index]
            );

            if (!allAnswered) {
                alert('Please answer all questions before submitting.');
                return;
            }

            let score = 0;
            questions.forEach((question, index) => {
                const selectedAnswer = courseProgress.quizScores[quizIndex].answers[index];
                const correctAnswer = question.dataset.correct;
                
                if (selectedAnswer === correctAnswer) {
                    score++;
                }
            });

            const totalQuestions = questions.length;
            const scorePercentage = (score / totalQuestions) * 100;
            
            scoreDisplay.textContent = `Score: ${score}/${totalQuestions} (${scorePercentage}%)`;
            scoreDisplay.className = `quiz-score ${scorePercentage >= 70 ? 'passed' : 'failed'}`;

            if (scorePercentage >= 70) {
                submitButton.style.display = 'none';
                retryButton.style.display = 'none';
                courseProgress.quizScores[quizIndex].completed = true;
                alert(`Congratulations! You passed with ${scorePercentage}%`);
            } else {
                submitButton.style.display = 'none';
                retryButton.style.display = 'block';
                alert(`You need 70% to pass. Try again!`);
            }
            
            saveProgress();
            updateProgressBar();
        });

        // Handle retry
        retryButton.addEventListener('click', () => {
            questions.forEach(question => {
                const options = question.querySelectorAll('label');
                options.forEach(option => {
                    option.classList.remove('selected');
                    const input = option.querySelector('input[type="radio"]');
                    if (input) input.checked = false;
                });
            });
            
            courseProgress.quizScores[quizIndex].answers = {};
            submitButton.style.display = 'block';
            retryButton.style.display = 'none';
            scoreDisplay.textContent = '';
        });
    });
    
    console.log('Quiz initialization complete');
    console.log('=== End Quiz Initialization Debug ===');
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