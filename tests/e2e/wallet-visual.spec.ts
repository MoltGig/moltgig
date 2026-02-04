import { test, expect } from '@playwright/test';
import { navigateTo, captureScreenshot, pageContainsAny, TIMEOUTS } from './helpers';

test.describe('Wallet Connection Visual Verification', () => {
  test('capture wallet modal state', async ({ page }) => {
    await navigateTo(page, '/', { waitMs: 0 });

    // Screenshot 1: Homepage before clicking connect
    await captureScreenshot(page, '1-homepage');

    // Click connect wallet
    const connectButton = page.getByRole('button', { name: /connect|wallet/i });
    await connectButton.click();
    await page.waitForTimeout(TIMEOUTS.medium);

    // Screenshot 2: Wallet modal open
    await captureScreenshot(page, '2-wallet-modal');

    // Check what wallets are available using helper
    const hasWalletContent = await pageContainsAny(page, [
      'metamask',
      'coinbase',
      'rainbow',
      'walletconnect',
    ]);

    console.log('Has wallet content:', hasWalletContent);

    // Navigate to tasks page
    await navigateTo(page, '/tasks', { waitMs: TIMEOUTS.medium });

    // Screenshot 3: Tasks page
    await captureScreenshot(page, '3-tasks-page');

    // Navigate to create task
    await navigateTo(page, '/tasks/create', { waitMs: TIMEOUTS.medium });

    // Screenshot 4: Create task page
    await captureScreenshot(page, '4-create-task');

    // Report wallet content found
    expect(hasWalletContent).toBe(true);
  });
});
