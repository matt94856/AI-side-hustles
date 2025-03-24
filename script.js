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

paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '2.99',
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
            showMessage('Payment successful! You now have access to this tutorial for 30 days.', 'success');
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

paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '7.99',
                    currency_code: 'USD'
                },
                description: 'All AI Money-Making Tutorials Access'
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
            localStorage.setItem('paymentDate', new Date().getTime().toString());
            localStorage.setItem('paymentStatus', 'active');
            localStorage.setItem('allAccess', 'true');
            
            // Enable access to all tutorials
            enableAccessToAllTutorials();
            
            // Show success message
            showMessage('Payment successful! You now have access to all tutorials for 30 days.', 'success');
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

// Modal Functions
const modal = document.getElementById('premiumModal');
const closeBtn = document.getElementsByClassName('close')[0];
let currentTutorialId = null;

function showModal(tutorialId) {
    currentTutorialId = tutorialId;
    
    // Update preview content
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    
    if (tutorialPreviews[tutorialId]) {
        previewTitle.textContent = tutorialPreviews[tutorialId].title;
        previewContent.innerHTML = tutorialPreviews[tutorialId].content.replace(/\n/g, '<br>');
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    currentTutorialId = null;
}

closeBtn.onclick = closeModal;

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Payment Status Functions
function checkPaymentStatus() {
    const paymentData = JSON.parse(localStorage.getItem('paymentData'));
    if (!paymentData) return false;

    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const paymentAge = now - paymentData.timestamp;

    if (paymentAge > thirtyDays) {
        localStorage.removeItem('paymentData');
        return false;
    }

    return true;
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

// Protect Premium Content
document.addEventListener('DOMContentLoaded', function() {
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
    const paymentDate = parseInt(localStorage.getItem('paymentDate'));
    const purchasedTutorials = JSON.parse(localStorage.getItem('purchasedTutorials') || '[]');
    const allAccess = localStorage.getItem('allAccess') === 'true';
    
    // Check if payment is still valid (within 30 days)
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const paymentAge = now - paymentDate;
    
    if (paymentAge > thirtyDays) {
        // Payment expired
        localStorage.removeItem('paymentStatus');
        localStorage.removeItem('paymentDate');
        localStorage.removeItem('allAccess');
        localStorage.removeItem('purchasedTutorials');
        showMessage('Your access has expired. Please purchase again to continue.', 'error');
        showModal(tutorialId);
        return;
    }

    if (allAccess || purchasedTutorials.includes(tutorialId)) {
        enableAccess(tutorialId);
    } else {
        showMessage('Please purchase access to view this tutorial', 'error');
        showModal(tutorialId);
    }
} 