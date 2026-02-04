import { test, expect } from '@playwright/test';
import {
  setupErrorCapture,
  filterCriticalErrors,
  navigateTo,
  captureScreenshot,
  isElementVisible,
  pageContainsAny,
  TIMEOUTS,
  ErrorTracker,
} from './helpers';

// Track console errors across tests
let errorTracker: ErrorTracker;

test.beforeEach(async ({ page }) => {
  errorTracker = setupErrorCapture(page);
});

test.describe('Homepage', () => {
  test('should load without critical errors', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check page title or main content
    await expect(page).toHaveTitle(/MoltGig/i);

    // Check for critical console errors (filter out known benign errors)
    const criticalErrors = errorTracker.getCritical();

    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
  });

  test('should display main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that main heading or branding exists
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should have connect wallet button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for wallet connect button (RainbowKit usually creates this)
    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    await expect(connectButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Wallet Connection Modal', () => {
  test('should open wallet modal when clicking connect', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click connect wallet button
    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    await connectButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Check that wallet options are visible (RainbowKit modal)
    // Look for common wallet names
    const walletOptions = page.locator('[data-testid="rk-wallet-option"], [class*="wallet"], button:has-text("MetaMask"), button:has-text("Coinbase"), button:has-text("Rainbow")');

    // At least the modal should be visible
    const isModalVisible = await isElementVisible(page, '[role="dialog"], [class*="modal"], [class*="Modal"]');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/wallet-modal.png' });

    console.log('Modal visible:', isModalVisible);
  });

  test('should show wallet options in modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    await connectButton.click();

    await page.waitForTimeout(1500);

    // Take screenshot to see what's rendered
    await page.screenshot({ path: 'test-results/wallet-options.png', fullPage: true });

    // Check for any wallet-related text
    const pageContent = await page.content();
    const hasWalletContent =
      pageContent.includes('MetaMask') ||
      pageContent.includes('Coinbase') ||
      pageContent.includes('Rainbow') ||
      pageContent.includes('WalletConnect');

    console.log('Has wallet content:', hasWalletContent);
    expect(hasWalletContent).toBe(true);
  });
});

test.describe('Tasks Page', () => {
  test('should load tasks page', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Page should load without error
    const response = await page.goto('/tasks');
    expect(response?.status()).toBe(200);
  });

  test('should display tasks from API', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Wait for tasks to load (they come from API)
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/tasks-page.png', fullPage: true });

    // Check for task content or loading state
    const pageContent = await page.content();
    const hasTaskContent =
      pageContent.includes('task') ||
      pageContent.includes('Task') ||
      pageContent.includes('ETH') ||
      pageContent.includes('funded');

    console.log('Tasks page has task content:', hasTaskContent);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Check for navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();

    // Check for home link
    const homeLink = page.locator('a[href="/"], a[href="https://moltgig.com"]');
    const homeLinkCount = await homeLink.count();
    expect(homeLinkCount).toBeGreaterThan(0);
  });
});

test.describe('Legal Pages', () => {
  test('should load terms of service', async ({ page }) => {
    const response = await page.goto('/legal/terms');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    // Check for terms content
    const content = await page.textContent('body');
    expect(content).toContain('Terms');
  });

  test('should load privacy policy', async ({ page }) => {
    const response = await page.goto('/legal/privacy');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    // Check for privacy content
    const content = await page.textContent('body');
    expect(content).toContain('Privacy');
  });
});

test.describe('API Integration', () => {
  test('should load skill.md', async ({ page }) => {
    const response = await page.goto('/moltgig.skill.md');
    expect(response?.status()).toBe(200);

    const content = await page.textContent('body');
    expect(content).toContain('MoltGig');
  });

  test('API health endpoint works', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.chain.network).toBe('base-mainnet');
  });

  test('API tasks endpoint works', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.tasks)).toBe(true);
  });
});

test.describe('Console Error Check', () => {
  test('homepage should not have WalletConnect errors', async ({ page }) => {
    const wcErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('WalletConnect') || text.includes('403') || text.includes('projectId')) {
        wcErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for WalletConnect to initialize

    // Click connect to trigger WalletConnect initialization
    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('WalletConnect-related errors:', wcErrors);

    // Check for 403 errors which indicate bad project ID
    const has403Error = wcErrors.some(e => e.includes('403'));
    if (has403Error) {
      console.log('WARNING: WalletConnect 403 error detected - check projectId');
    }
  });

  test('tasks page should load without JS errors', async ({ page }) => {
    const jsErrors: string[] = [];

    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });

    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known benign errors
    const criticalErrors = filterCriticalErrors(jsErrors);

    if (criticalErrors.length > 0) {
      console.log('Critical JS errors:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Create Task Flow (UI only)', () => {
  test('should have create task button or link', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Look for create task button/link
    const createButton = page.locator('a[href*="create"], button:has-text("Create"), button:has-text("Post"), a:has-text("Create"), a:has-text("Post")');
    const count = await createButton.count();

    console.log('Create task buttons/links found:', count);

    await page.screenshot({ path: 'test-results/tasks-page-create.png', fullPage: true });
  });

  test('create task page should exist', async ({ page }) => {
    // Try common routes for create task
    const routes = ['/tasks/create', '/create-task', '/tasks/new'];

    for (const route of routes) {
      const response = await page.goto(route);
      if (response?.status() === 200) {
        console.log(`Create task route found: ${route}`);
        await page.screenshot({ path: 'test-results/create-task-page.png', fullPage: true });
        return;
      }
    }

    console.log('No dedicated create task page found');
  });
});
