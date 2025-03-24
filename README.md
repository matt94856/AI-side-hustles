# AI Money-Making Guide Website

A premium website offering detailed tutorials on making money online using AI tools. The website features a modern, responsive design with PayPal integration for premium content access.

## Features

- Modern, responsive design
- PayPal integration for premium content
- 5 detailed AI money-making tutorials
- Mobile-friendly interface
- Secure payment processing
- Premium content protection

## Prerequisites

- A PayPal Business account
- Basic understanding of HTML, CSS, and JavaScript
- A web hosting service (recommended: Netlify, Vercel, or similar)

## Setup Instructions

1. Clone this repository to your local machine:
```bash
git clone [repository-url]
```

2. Replace the PayPal client ID in `index.html`:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
```
Replace `YOUR_CLIENT_ID` with your actual PayPal client ID.

3. Host the website on your preferred hosting service:
   - For Netlify: Connect your repository and deploy
   - For Vercel: Connect your repository and deploy
   - For traditional hosting: Upload all files to your web server

4. Test the PayPal integration:
   - Use PayPal's sandbox environment for testing
   - Test both successful and failed payment scenarios
   - Verify premium content access after payment

## File Structure

```
├── index.html          # Main landing page
├── tutorial1.html      # AI-Powered Freelancing guide
├── tutorial2.html      # Affiliate Marketing guide
├── tutorial3.html      # Content Creation guide
├── tutorial4.html      # Digital Products guide
├── tutorial5.html      # AI Consulting guide
├── style.css          # Main stylesheet
├── script.js          # JavaScript functionality
└── README.md          # Project documentation
```

## Customization

### Colors
The website uses CSS variables for easy color customization. Edit the variables in `style.css`:
```css
:root {
    --primary-color: #2D3436;
    --secondary-color: #0984E3;
    --accent-color: #FFD700;
    /* ... other variables ... */
}
```

### Content
- Edit the tutorial content in each tutorial HTML file
- Update testimonials in `index.html`
- Modify pricing in `script.js` (PayPal integration)

## Security Considerations

1. The website uses localStorage for payment verification. For production:
   - Implement server-side verification
   - Use secure session management
   - Add additional security measures

2. Protect premium content:
   - Implement proper access control
   - Use secure URLs
   - Consider implementing a backend API

## Browser Support

The website is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@aimoneyguide.com or create an issue in the repository.

## Acknowledgments

- PayPal SDK for payment integration
- Font Awesome for icons
- Unsplash for images 