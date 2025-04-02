import { initializeAuth } from './src/auth.js';
import { savePurchase, syncPurchasesFromSupabase } from './src/db.js';
import { showMessage } from './src/utils.js';
import { tutorialPreviews } from './src/tutorials.js';
import { checkPaymentStatus } from './src/auth.js';

// Make tutorial previews available globally
window.tutorialPreviews = tutorialPreviews;

// Global state for PayPal buttons
let paypalButtons = {
    single: null,
    all: null
};

// Check if user is logged in
function checkLoginStatus() {
    const user = window.netlifyIdentity?.currentUser();
    if (!user) {
        // Store current URL and tutorial ID for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        const tutorialId = document.querySelector('.modal')?.dataset?.tutorialId;
        if (tutorialId) {
            sessionStorage.setItem('tutorialId', tutorialId);
        }
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Modal Functions
function initializeModal() {
    const modal = document.getElementById('premiumModal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function closeModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize PayPal buttons
window.initializePayPal = function(tutorialId) {
    const singleTutorialButton = document.getElementById('singleTutorialButton');
    const allTutorialsButton = document.getElementById('allTutorialsButton');
    
    // Clear existing buttons
    if (singleTutorialButton) singleTutorialButton.innerHTML = '';
    if (allTutorialsButton) allTutorialsButton.innerHTML = '';

    // Single tutorial purchase
    if (singleTutorialButton) {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '7.99'
                        }
                    }]
                });
            },
            onApprove: async function(data, actions) {
                try {
                    await actions.order.capture();
                    const user = window.netlifyIdentity.currentUser();
                    await savePurchase(user.id, tutorialId, 7.99);
                    showMessage('Purchase successful! Redirecting to tutorial...', 'success');
                    setTimeout(() => {
                        window.location.href = `/tutorials/${tutorialId}.html`;
                    }, 2000);
                } catch (error) {
                    console.error('Error processing purchase:', error);
                    showMessage('Error processing purchase. Please try again.', 'error');
                }
            }
        }).render('#singleTutorialButton');
    }

    // All tutorials purchase
    if (allTutorialsButton) {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '19.99'
                        }
                    }]
                });
            },
            onApprove: async function(data, actions) {
                try {
                    await actions.order.capture();
                    const user = window.netlifyIdentity.currentUser();
                    await savePurchase(user.id, 'all', 19.99);
                    showMessage('Purchase successful! Redirecting to dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 2000);
                } catch (error) {
                    console.error('Error processing purchase:', error);
                    showMessage('Error processing purchase. Please try again.', 'error');
                }
            }
        }).render('#allTutorialsButton');
    }
};

// Show modal with tutorial preview
window.showModal = function(tutorialId) {
    // First check if user is logged in
    if (!checkLoginStatus()) return;

    const modal = document.getElementById('premiumModal');
    if (!modal) return;
    
    // Set tutorial ID
    modal.dataset.tutorialId = tutorialId;
    
    // Update preview content
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    
    if (previewTitle && previewContent && window.tutorialPreviews[tutorialId]) {
        previewTitle.textContent = window.tutorialPreviews[tutorialId].title;
        previewContent.innerHTML = window.tutorialPreviews[tutorialId].content.replace(/\n/g, '<br>');
    }
    
    // Show modal
    modal.style.display = 'block';
    
    // Re-initialize PayPal buttons
    initializePayPal(tutorialId);
};

// Show mobile disclaimer
window.showMobileDisclaimer = function() {
    const existingDisclaimer = document.querySelector('.mobile-disclaimer');
    if (existingDisclaimer) {
        existingDisclaimer.remove();
    }
    
    const disclaimer = document.createElement('div');
    disclaimer.className = 'mobile-disclaimer';
    disclaimer.innerHTML = `
        <div class="disclaimer-content">
            <i class="fas fa-desktop"></i>
            <p>For the best purchasing experience, we recommend completing your purchase on a desktop computer.</p>
            <button class="disclaimer-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    document.body.appendChild(disclaimer);
    
    const closeBtn = disclaimer.querySelector('.disclaimer-close');
    closeBtn.addEventListener('click', function() {
        disclaimer.remove();
    });
    
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
};

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth
    initializeAuth();

    // Initialize modal
    initializeModal();

    // Sync purchases if user is logged in
    const user = window.netlifyIdentity?.currentUser();
    if (user) {
        syncPurchasesFromSupabase();
    }

    // Handle login events
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (user) {
                // Update UI for logged-in state
                document.getElementById('login-btn')?.style.setProperty('display', 'none');
                document.getElementById('logout-btn')?.style.setProperty('display', 'inline-block');
            } else {
                // Update UI for logged-out state
                document.getElementById('login-btn')?.style.setProperty('display', 'inline-block');
                document.getElementById('logout-btn')?.style.setProperty('display', 'none');
            }
        });

        // Handle login events
        window.netlifyIdentity.on('login', () => {
            document.getElementById('login-btn')?.style.setProperty('display', 'none');
            document.getElementById('logout-btn')?.style.setProperty('display', 'inline-block');
        });

        // Handle logout events
        window.netlifyIdentity.on('logout', () => {
            document.getElementById('login-btn')?.style.setProperty('display', 'inline-block');
            document.getElementById('logout-btn')?.style.setProperty('display', 'none');
        });
    }

    // Add click handlers for tutorial previews
    document.querySelectorAll('.tutorial-card').forEach(card => {
        const tutorialId = card.querySelector('.enroll-now')?.dataset?.tutorialId;
        if (tutorialId) {
            card.querySelector('.enroll-now').addEventListener('click', (e) => {
                e.preventDefault();
                window.showModal(tutorialId);
            });
        }
    });

    setupModal();
    window.checkPaymentStatus = checkPaymentStatus;
});

// Export functions that need to be globally available
window.showMessage = showMessage; 