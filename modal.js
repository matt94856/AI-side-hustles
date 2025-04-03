// Modal utilities
window.modalUtils = {
    modal: null,
    closeButton: null,
    focusableElements: null,
    firstFocusableElement: null,
    lastFocusableElement: null,
    previousActiveElement: null,

    init: function() {
        this.modal = document.getElementById('payment-modal');
        if (!this.modal) {
            console.warn('Modal element not found');
            return;
        }

        this.closeButton = this.modal.querySelector('.close-button');
        if (!this.closeButton) {
            console.warn('Modal close button not found');
            return;
        }

        // Get all focusable elements within modal
        this.focusableElements = this.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.firstFocusableElement = this.focusableElements[0];
        this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];

        // Set up event listeners
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        this.modal.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    showModal: function() {
        if (!this.modal) {
            console.error('Cannot show modal: Modal element not found');
            return;
        }

        // Store the currently focused element
        this.previousActiveElement = document.activeElement;

        // Show modal and set focus
        this.modal.style.display = 'block';
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Focus the first focusable element
        if (this.firstFocusableElement) {
            this.firstFocusableElement.focus();
        }

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
    },

    hideModal: function() {
        if (!this.modal) {
            console.error('Cannot hide modal: Modal element not found');
            return;
        }

        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');

        // Restore focus to the previous element
        if (this.previousActiveElement) {
            this.previousActiveElement.focus();
        }

        // Restore background scrolling
        document.body.style.overflow = '';
    },

    handleKeyDown: function(e) {
        if (e.key === 'Escape') {
            this.hideModal();
            return;
        }

        // Handle focus trap
        if (e.key === 'Tab') {
            if (!this.focusableElements.length) {
                e.preventDefault();
                return;
            }

            if (e.shiftKey) {
                if (document.activeElement === this.firstFocusableElement) {
                    e.preventDefault();
                    this.lastFocusableElement.focus();
                }
            } else {
                if (document.activeElement === this.lastFocusableElement) {
                    e.preventDefault();
                    this.firstFocusableElement.focus();
                }
            }
        }
    }
};

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modalUtils.init();
}); 