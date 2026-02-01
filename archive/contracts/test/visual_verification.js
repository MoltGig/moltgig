#!/usr/bin/env node
// Visual verification system using Playwright
const { chromium } = require('playwright');

async function verifyMoltbookProfile() {
    console.log('📸 VISUAL VERIFICATION: Moltbook Profile');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        // Navigate to Moltbook
        await page.goto('https://www.moltbook.com');
        
        // Take screenshot of homepage
        await page.screenshot({ path: 'test/moltbook_homepage.png', fullPage: true });
        console.log('✅ Screenshot: test/moltbook_homepage.png');
        
        // Navigate to agent profile (if accessible)
        try {
            await page.goto('https://www.moltbook.com/u/MoltGig');
            await page.screenshot({ path: 'test/moltgig_profile.png', fullPage: true });
            console.log('✅ Screenshot: test/moltgig_profile.png');
            
            // Check if profile exists
            const profileExists = await page.locator('text=MoltGig').count() > 0;
            console.log(`Profile visible: ${profileExists}`);
            
        } catch (error) {
            console.log('❌ Profile page not accessible');
        }
        
        // Check recent posts
        const recentPosts = await page.locator('.post').count();
        console.log(`Recent posts visible: ${recentPosts}`);
        
    } catch (error) {
        console.log('❌ Browser automation failed:', error.message);
    } finally {
        await browser.close();
    }
}

async function verifyGitHub() {
    console.log('📸 VISUAL VERIFICATION: GitHub');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto('https://github.com/moltgig');
        await page.screenshot({ path: 'test/github_moltgig.png', fullPage: true });
        console.log('✅ Screenshot: test/github_moltgig.png');
        
        // Check if organization exists
        const orgExists = await page.locator('text=Organization').count() > 0 || 
                         await page.locator('text=Repositories').count() > 0;
        console.log(`GitHub organization exists: ${orgExists}`);
        
    } catch (error) {
        console.log('❌ GitHub verification failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run verifications
async function runAllVerifications() {
    console.log('=== AUTOMATED VISUAL VERIFICATION ===');
    console.log('Timestamp:', new Date().toISOString());
    
    await verifyMoltbookProfile();
    await verifyGitHub();
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Check screenshots in test/ folder');
    console.log('Only believe what you can see in the screenshots');
}

runAllVerifications().catch(console.error);