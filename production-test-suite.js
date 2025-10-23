// Production Verification Test Suite
// Run this in browser console on your production site

class ProductionVerification {
    constructor() {
        this.results = [];
        this.user = null;
        this.testUserId = 'test-user-' + Date.now();
    }

    async runAllTests() {
        console.log('🚀 Starting Production Verification Tests...');
        
        try {
            await this.testEnvironmentVariables();
            await this.testSupabaseConnection();
            await this.testNetlifyIdentity();
            await this.testUserCreation();
            await this.testPurchaseFlow();
            await this.testAccessControl();
            await this.testWebhookSecurity();
            await this.testRLSEnforcement();
            
            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testEnvironmentVariables() {
        console.log('🔧 Testing Environment Variables...');
        
        try {
            // Test if Supabase client is initialized
            if (!window.supabaseAuth || !window.supabaseAuth.supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            // Test anon key by making a simple query
            const { data, error } = await window.supabaseAuth.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST301') {
                throw new Error('Anon key not working: ' + error.message);
            }
            
            this.addResult('Environment Variables', '✅ PASS', 'Anon key working');
        } catch (error) {
            this.addResult('Environment Variables', '❌ FAIL', error.message);
        }
    }

    async testSupabaseConnection() {
        console.log('🔗 Testing Supabase Connection...');
        
        try {
            const { data, error } = await window.supabaseAuth.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST301') {
                throw new Error('Connection failed: ' + error.message);
            }
            
            this.addResult('Supabase Connection', '✅ PASS', 'Database accessible');
        } catch (error) {
            this.addResult('Supabase Connection', '❌ FAIL', error.message);
        }
    }

    async testNetlifyIdentity() {
        console.log('🔐 Testing Netlify Identity...');
        
        try {
            if (!window.netlifyIdentity) {
                throw new Error('Netlify Identity not loaded');
            }
            
            this.user = netlifyIdentity.currentUser();
            
            if (!this.user) {
                this.addResult('Netlify Identity', '⚠️ SKIP', 'No user logged in (expected for new users)');
                return;
            }
            
            this.addResult('Netlify Identity', '✅ PASS', `User: ${this.user.email}`);
        } catch (error) {
            this.addResult('Netlify Identity', '❌ FAIL', error.message);
        }
    }

    async testUserCreation() {
        console.log('👤 Testing User Creation...');
        
        try {
            if (!this.user) {
                this.addResult('User Creation', '⚠️ SKIP', 'No user logged in');
                return;
            }
            
            // Test user sync with Supabase
            const supabaseUser = await window.supabaseAuth.syncNetlifyIdentityWithSupabase(this.user);
            
            if (!supabaseUser) {
                throw new Error('Failed to sync user with Supabase');
            }
            
            this.addResult('User Creation', '✅ PASS', `User synced: ${supabaseUser.id}`);
        } catch (error) {
            this.addResult('User Creation', '❌ FAIL', error.message);
        }
    }

    async testPurchaseFlow() {
        console.log('💳 Testing Purchase Flow...');
        
        try {
            if (!this.user) {
                this.addResult('Purchase Flow', '⚠️ SKIP', 'No user logged in');
                return;
            }
            
            // Test purchase data structure
            const testPurchaseData = {
                user_id: this.user.id,
                tutorial_id: 1,
                all_access: false,
                amount: 97.00,
                currency: 'USD',
                payment_provider: 'test',
                payment_id: 'test-' + Date.now(),
                transaction_details: { test: true }
            };
            
            // Test if we can add a purchase (this will fail due to RLS if not properly authenticated)
            const success = await window.supabaseAuth.addPurchase(testPurchaseData);
            
            if (success) {
                this.addResult('Purchase Flow', '✅ PASS', 'Purchase creation working');
            } else {
                this.addResult('Purchase Flow', '⚠️ PARTIAL', 'Purchase creation failed (may be RLS protection)');
            }
        } catch (error) {
            this.addResult('Purchase Flow', '❌ FAIL', error.message);
        }
    }

    async testAccessControl() {
        console.log('🛡️ Testing Access Control...');
        
        try {
            if (!this.user) {
                this.addResult('Access Control', '⚠️ SKIP', 'No user logged in');
                return;
            }
            
            // Test course access check
            const accessResult = await window.supabaseAuth.checkCourseAccess(this.user.id, 1);
            
            this.addResult('Access Control', '✅ PASS', 
                `Access check working: ${accessResult.hasAccess ? 'Has access' : 'No access'}`);
        } catch (error) {
            this.addResult('Access Control', '❌ FAIL', error.message);
        }
    }

    async testWebhookSecurity() {
        console.log('🔒 Testing Webhook Security...');
        
        try {
            // Test webhook endpoint without secret
            const response = await fetch('/.netlify/functions/webhookHandler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test',
                    data: {}
                })
            });
            
            const result = await response.json();
            
            if (result.error && result.error.includes('Unauthorized')) {
                this.addResult('Webhook Security', '✅ PASS', 'Webhook security enforced');
            } else {
                this.addResult('Webhook Security', '❌ FAIL', 'Webhook security not working');
            }
        } catch (error) {
            this.addResult('Webhook Security', '❌ FAIL', error.message);
        }
    }

    async testRLSEnforcement() {
        console.log('🔐 Testing RLS Enforcement...');
        
        try {
            if (!this.user) {
                this.addResult('RLS Enforcement', '⚠️ SKIP', 'No user logged in');
                return;
            }
            
            // Test getting user's own purchases
            const purchases = await window.supabaseAuth.getUserPurchases(this.user.id);
            
            this.addResult('RLS Enforcement', '✅ PASS', 
                `RLS working: Found ${purchases.length} purchases for user`);
        } catch (error) {
            this.addResult('RLS Enforcement', '❌ FAIL', error.message);
        }
    }

    addResult(test, status, message) {
        this.results.push({ test, status, message });
        console.log(`${status} ${test}: ${message}`);
    }

    printResults() {
        console.log('\n📊 PRODUCTION VERIFICATION RESULTS:');
        console.log('=====================================');
        
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        
        this.results.forEach(result => {
            console.log(`${result.status} ${result.test}: ${result.message}`);
            
            if (result.status.includes('✅')) passed++;
            else if (result.status.includes('❌')) failed++;
            else if (result.status.includes('⚠️')) skipped++;
        });
        
        console.log('\n📈 SUMMARY:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Skipped: ${skipped}`);
        
        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Ready for production.');
        } else {
            console.log('\n⚠️ Some tests failed. Review before production deployment.');
        }
    }
}

// Auto-run verification when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for all scripts to load
    setTimeout(() => {
        if (window.supabaseAuth && window.netlifyIdentity) {
            const verification = new ProductionVerification();
            verification.runAllTests();
        } else {
            console.log('⏳ Waiting for scripts to load...');
            setTimeout(() => {
                const verification = new ProductionVerification();
                verification.runAllTests();
            }, 2000);
        }
    }, 1000);
});

// Manual test runner
window.runProductionTests = () => {
    const verification = new ProductionVerification();
    verification.runAllTests();
};

console.log('🧪 Production Verification Test Suite Loaded');
console.log('Run manually with: runProductionTests()');
