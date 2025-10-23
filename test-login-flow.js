// Comprehensive Login Flow Test
// This script tests the complete authentication and course loading flow

console.log('🧪 STARTING LOGIN FLOW TEST');
console.log('================================');

// Test 1: Check if Netlify Identity is loaded
function testNetlifyIdentity() {
    console.log('\n1️⃣ Testing Netlify Identity...');
    
    if (typeof netlifyIdentity !== 'undefined') {
        console.log('✅ Netlify Identity is loaded');
        console.log('   - Current user:', netlifyIdentity.currentUser());
        return true;
    } else {
        console.log('❌ Netlify Identity is not loaded');
        return false;
    }
}

// Test 2: Check if Supabase Auth is initialized
function testSupabaseAuth() {
    console.log('\n2️⃣ Testing Supabase Auth...');
    
    if (typeof window.supabaseAuth !== 'undefined') {
        console.log('✅ Supabase Auth is loaded');
        console.log('   - Initialized:', window.supabaseAuth.isInitialized);
        return true;
    } else {
        console.log('❌ Supabase Auth is not loaded');
        return false;
    }
}

// Test 3: Check Netlify Function endpoints
async function testNetlifyFunctions() {
    console.log('\n3️⃣ Testing Netlify Functions...');
    
    try {
        // Test supabaseHandler
        const response = await fetch('/.netlify/functions/supabaseHandler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'internal',
                user: { id: 'test-user', email: 'test@example.com' }
            })
        });
        
        if (response.ok) {
            console.log('✅ supabaseHandler is accessible');
            const result = await response.json();
            console.log('   - Response:', result);
            return true;
        } else {
            console.log('❌ supabaseHandler returned error:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ supabaseHandler test failed:', error.message);
        return false;
    }
}

// Test 4: Check authentication buttons
function testAuthButtons() {
    console.log('\n4️⃣ Testing Authentication Buttons...');
    
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const heroSignupBtn = document.getElementById('heroSignupBtn');
    const finalSignupBtn = document.getElementById('finalSignupBtn');
    
    const buttons = [
        { name: 'Signup Button', element: signupBtn },
        { name: 'Login Button', element: loginBtn },
        { name: 'Hero Signup Button', element: heroSignupBtn },
        { name: 'Final Signup Button', element: finalSignupBtn }
    ];
    
    let allFound = true;
    buttons.forEach(btn => {
        if (btn.element) {
            console.log(`✅ ${btn.name} found`);
        } else {
            console.log(`❌ ${btn.name} not found`);
            allFound = false;
        }
    });
    
    return allFound;
}

// Test 5: Check for JavaScript errors
function testJavaScriptErrors() {
    console.log('\n5️⃣ Testing for JavaScript Errors...');
    
    // Check if there are any elements with href="#"
    const problematicLinks = document.querySelectorAll('a[href="#"]');
    if (problematicLinks.length > 0) {
        console.log(`❌ Found ${problematicLinks.length} links with href="#" that could cause querySelector errors`);
        problematicLinks.forEach((link, index) => {
            console.log(`   - Link ${index + 1}:`, link.textContent || link.id || 'unnamed');
        });
        return false;
    } else {
        console.log('✅ No problematic href="#" links found');
        return true;
    }
}

// Test 6: Check dashboard page exists
function testDashboardPage() {
    console.log('\n6️⃣ Testing Dashboard Page...');
    
    // Check if dashboard.html exists by trying to fetch it
    fetch('dashboard.html')
        .then(response => {
            if (response.ok) {
                console.log('✅ dashboard.html is accessible');
                return true;
            } else {
                console.log('❌ dashboard.html returned error:', response.status);
                return false;
            }
        })
        .catch(error => {
            console.log('❌ dashboard.html test failed:', error.message);
            return false;
        });
}

// Test 7: Simulate login flow
async function testLoginFlow() {
    console.log('\n7️⃣ Testing Login Flow Simulation...');
    
    if (typeof netlifyIdentity === 'undefined') {
        console.log('❌ Cannot test login flow - Netlify Identity not loaded');
        return false;
    }
    
    // Check if user is already logged in
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
        console.log('✅ User is already logged in:', currentUser.email);
        
        // Test course loading
        try {
            const purchases = await window.supabaseAuth.getUserPurchases(currentUser.id);
            console.log('✅ User purchases loaded:', purchases.length, 'courses');
            return true;
        } catch (error) {
            console.log('❌ Failed to load user purchases:', error.message);
            return false;
        }
    } else {
        console.log('ℹ️ No user logged in - login flow ready to test');
        return true;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running comprehensive login flow tests...\n');
    
    const results = {
        netlifyIdentity: testNetlifyIdentity(),
        supabaseAuth: testSupabaseAuth(),
        netlifyFunctions: await testNetlifyFunctions(),
        authButtons: testAuthButtons(),
        javascriptErrors: testJavaScriptErrors(),
        dashboardPage: testDashboardPage(),
        loginFlow: await testLoginFlow()
    };
    
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test}`);
    });
    
    console.log(`\n🎯 OVERALL RESULT: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! Login flow should work perfectly.');
    } else {
        console.log('⚠️ Some tests failed. Check the issues above.');
    }
    
    return results;
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for manual testing
window.testLoginFlow = runAllTests;
