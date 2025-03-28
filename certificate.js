// Certificate and completion celebration functionality
const completionCelebration = {
    // Initialize the celebration system
    init: function() {
        this.checkAllTutorials();
        window.addEventListener('storage', () => this.checkAllTutorials());
    },

    // Load the confetti library
    loadConfetti: function(callback) {
        if (window.confetti) {
            callback();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    },

    // Generate confetti celebration
    startConfetti: function() {
        this.loadConfetti(() => {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                
                // Particles from the sides
                confetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: Math.random(), y: Math.random() - 0.2 } 
                }));
                confetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: Math.random(), y: Math.random() - 0.2 } 
                }));
            }, 250);
        });
    },

    // Check if all modules in a tutorial are completed
    isTutorialComplete: function(tutorialNumber) {
        let moduleCount;
        
        // Set the correct module count for each tutorial
        switch(tutorialNumber) {
            case 2:
                moduleCount = 7; // Tutorial 2 has 7 modules
                break;
            case 3:
                moduleCount = 5; // Tutorial 3 has 5 modules
                break;
            case 4:
                moduleCount = 6; // Tutorial 4 has 6 modules
                break;
            case 5:
                moduleCount = 5; // Tutorial 5 has 5 modules
                break;
            default:
                moduleCount = 4; // Tutorial 1 has 4 modules
        }
        
        for (let i = 1; i <= moduleCount; i++) {
            const moduleProgress = JSON.parse(localStorage.getItem(`tutorial${tutorialNumber}_module${i}Progress`)) || [];
            if (moduleProgress.length < 4) { // Each module has 4 lessons
                return false;
            }
        }
        
        return true;
    },

    // Check all tutorials for completion and show celebration
    checkAllTutorials: function() {
        // Get current tutorial number from URL
        const tutorialMatch = window.location.pathname.match(/tutorial(\d+)\.html/);
        if (!tutorialMatch) return;
        
        const tutorialNumber = parseInt(tutorialMatch[1]);
        if (isNaN(tutorialNumber)) return;
        
        // Check if this tutorial is complete
        if (this.isTutorialComplete(tutorialNumber)) {
            this.showCompletionMessage(tutorialNumber);
        }
    },

    // Show completion message and certificate button
    showCompletionMessage: function(tutorialNumber) {
        // Don't show again if already shown
        if (document.querySelector('.completion-banner')) return;
        
        const tutorialTitles = {
            1: "AI-Powered Freelancing",
            2: "Affiliate Marketing with AI",
            3: "Content Creation with AI",
            4: "Selling AI-Based Digital Products",
            5: "AI-Powered Consulting Services"
        };
        
        // Create banner container at the top
        const banner = document.createElement('div');
        banner.className = 'completion-banner';
        banner.id = 'completionBanner';
        banner.innerHTML = `
            <h2><i class="fas fa-trophy"></i> Congratulations!</h2>
            <p>You've completed all modules in the ${tutorialTitles[tutorialNumber]} course!</p>
            <a href="#" class="certificate-button">
                <i class="fas fa-certificate"></i> Generate Certificate
            </a>
        `;
        
        // Add certificate generation functionality
        const certificateButton = banner.querySelector('.certificate-button');
        certificateButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCertificateForm(tutorialNumber, tutorialTitles[tutorialNumber]);
        });
        
        // Add to the top of the body
        const firstChild = document.body.firstChild;
        document.body.insertBefore(banner, firstChild);
        
        // Make the banner visible with animation
        setTimeout(() => {
            banner.classList.add('visible');
        }, 500);
        
        // Hide the old completion message if it exists
        const oldCompletionMessage = document.querySelector('.congratulations-container');
        if (oldCompletionMessage) {
            oldCompletionMessage.style.display = 'none';
        }
        
        // Trigger confetti
        this.startConfetti();
    },

    // Show certificate name form
    showCertificateForm: function(tutorialNumber, tutorialTitle) {
        // Remove any existing form
        const existingForm = document.querySelector('.certificate-form-container');
        if (existingForm) existingForm.remove();
        
        // Create form container
        const formContainer = document.createElement('div');
        formContainer.className = 'certificate-form-container';
        formContainer.innerHTML = `
            <div class="certificate-form">
                <button class="close-form"><i class="fas fa-times"></i></button>
                <h3>Generate Your Certificate</h3>
                <p>Please enter your full name as you'd like it to appear on your certificate:</p>
                <input type="text" id="certificate-name" placeholder="Your Full Name" required>
                <button id="generate-certificate">Download Certificate</button>
            </div>
        `;
        
        // Add close functionality
        const closeButton = formContainer.querySelector('.close-form');
        closeButton.addEventListener('click', () => formContainer.remove());
        
        // Add generate functionality
        const generateButton = formContainer.querySelector('#generate-certificate');
        generateButton.addEventListener('click', () => {
            const nameInput = formContainer.querySelector('#certificate-name');
            const name = nameInput.value.trim();
            
            if (!name) {
                alert('Please enter your name');
                return;
            }
            
            this.generateCertificatePDF(name, tutorialNumber, tutorialTitle);
            formContainer.remove();
        });
        
        // Add to body
        document.body.appendChild(formContainer);
    },

    // Generate and download certificate PDF
    generateCertificatePDF: function(name, tutorialNumber, tutorialTitle) {
        // Load jsPDF library if not already loaded
        if (!window.jspdf) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => this.createPDF(name, tutorialNumber, tutorialTitle);
            document.head.appendChild(script);
        } else {
            this.createPDF(name, tutorialNumber, tutorialTitle);
        }
    },

    // Create the actual PDF certificate
    createPDF: function(name, tutorialNumber, tutorialTitle) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // Set background color - light gradient
        const canvas = document.createElement('canvas');
        canvas.width = 297;
        canvas.height = 210;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 210);
        gradient.addColorStop(0, '#f0f4f8');
        gradient.addColorStop(1, '#e0e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 297, 210);
        doc.addImage(canvas.toDataURL(), 'PNG', 0, 0, 297, 210);
        
        // Add decorative border
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(5);
        doc.roundedRect(10, 10, 277, 190, 5, 5);
        
        // Add subtle inner border
        doc.setDrawColor(140, 180, 230, 0.5);
        doc.setLineWidth(1);
        doc.roundedRect(15, 15, 267, 180, 3, 3);
        
        // Add decorative corner elements
        this.drawCornerDecoration(doc, 10, 10, 30);
        this.drawCornerDecoration(doc, 257, 10, 30, true);
        this.drawCornerDecoration(doc, 10, 170, 30, false, true);
        this.drawCornerDecoration(doc, 257, 170, 30, true, true);
        
        // Add AI Hustle Hub branding at the top
        doc.setFontSize(16);
        doc.setTextColor(74, 144, 226);
        doc.text('AI HUSTLE HUB', 148.5, 25, { align: 'center' });
        
        // Add header
        doc.setFontSize(36);
        doc.setTextColor(26, 26, 26);
        doc.text('Certificate of Completion', 148.5, 50, { align: 'center' });
        
        // Add decorative line
        doc.setDrawColor(74, 144, 226);
        doc.setLineWidth(1);
        doc.line(74, 55, 223, 55);
        
        // Add this is to certify that text
        doc.setFontSize(14);
        doc.setTextColor(80, 80, 80);
        doc.text('This is to certify that', 148.5, 70, { align: 'center' });
        
        // Add recipient name
        doc.setFontSize(28);
        doc.setTextColor(26, 26, 26);
        doc.text(name, 148.5, 85, { align: 'center' });
        
        // Add underline for name
        doc.setDrawColor(74, 144, 226, 0.7);
        doc.setLineWidth(0.5);
        const nameWidth = doc.getTextWidth(name);
        doc.line(148.5 - nameWidth/2, 88, 148.5 + nameWidth/2, 88);
        
        // Add course completion text
        doc.setFontSize(14);
        doc.setTextColor(80, 80, 80);
        doc.text('has successfully completed the course', 148.5, 105, { align: 'center' });
        
        // Add course title
        doc.setFontSize(22);
        doc.setTextColor(74, 144, 226);
        doc.text(tutorialTitle, 148.5, 120, { align: 'center' });
        
        // Add date
        const today = new Date();
        const formattedDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
        
        doc.setFontSize(14);
        doc.setTextColor(80, 80, 80);
        doc.text(`Issued on ${formattedDate}`, 148.5, 135, { align: 'center' });
        
        // Add footer with websites
        doc.setFontSize(12);
        doc.setTextColor(74, 144, 226);
        doc.text('premiumwebcreators.com | aihustlehub', 148.5, 185, { align: 'center' });
        
        // Add instructor signature
        doc.setTextColor(26, 26, 26);
        doc.setFontSize(14);
        doc.text('Matt Fuller', 115, 155, { align: 'center' });
        
        // Add signature line
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(80, 160, 150, 160);
        
        // Add signature text
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text("Instructor Signature", 115, 167, { align: 'center' });
        
        // Add certificate ID
        const certificateId = this.generateCertificateId(name, tutorialNumber);
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(`Certificate ID: ${certificateId}`, 148.5, 175, { align: 'center' });
        
        // Draw robot icon on the top right
        this.drawRobotIcon(doc, 240, 25);
        
        // Save the PDF
        doc.save(`${tutorialTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
    },
    
    // Draw simple AI robot icon
    drawRobotIcon: function(doc, x, y) {
        // Robot head
        doc.setFillColor(74, 144, 226);
        doc.roundedRect(x, y, 15, 12, 2, 2, 'F');
        
        // Robot antenna
        doc.setLineWidth(1);
        doc.setDrawColor(74, 144, 226);
        doc.line(x + 7.5, y, x + 7.5, y - 4);
        doc.circle(x + 7.5, y - 5, 1, 'F');
        
        // Robot eyes
        doc.setFillColor(255, 255, 255);
        doc.circle(x + 5, y + 4, 2, 'F');
        doc.circle(x + 10, y + 4, 2, 'F');
        
        // Robot mouth
        doc.setLineWidth(0.7);
        doc.setDrawColor(255, 255, 255);
        doc.line(x + 4, y + 8, x + 11, y + 8);
    },
    
    // Draw decorative corner elements
    drawCornerDecoration: function(doc, x, y, size, flipX = false, flipY = false) {
        doc.setDrawColor(74, 144, 226, 0.7);
        doc.setLineWidth(1);
        
        const dirX = flipX ? -1 : 1;
        const dirY = flipY ? -1 : 1;
        
        doc.line(x, y + (dirY * size/3), x, y);
        doc.line(x, y, x + (dirX * size/3), y);
    },
    
    // Generate a unique certificate ID
    generateCertificateId: function(name, tutorialNumber) {
        const timestamp = Date.now().toString().slice(-8);
        const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
        return `AIH-${tutorialNumber}${timestamp}-${nameHash}`;
    },
};

// Create a global function to generate a certificate that can be called directly
// This function will be accessible from onclick events in HTML
window.generateCertificate = function(tutorialNumber) {
    const tutorialTitles = {
        1: "AI-Powered Freelancing",
        2: "Affiliate Marketing with AI",
        3: "Content Creation with AI",
        4: "Selling AI-Based Digital Products",
        5: "AI-Powered Consulting Services"
    };
    
    const tutorialTitle = tutorialTitles[tutorialNumber] || "AI Course";
    completionCelebration.showCertificateForm(tutorialNumber, tutorialTitle);
    completionCelebration.startConfetti(); // Start confetti when generating certificate
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    completionCelebration.init();
}); 