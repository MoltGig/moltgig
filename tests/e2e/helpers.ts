/**
 * E2E Test Helpers for MoltGig
 *
 * Centralized utilities for Playwright tests.
 */

import { Page } from '@playwright/test';

/**
 * Known benign errors to ignore in console checks
 */
export const IGNORED_ERRORS = [
  'favicon',
  'Failed to load resource: the server responded with a status of 404',
  'ResizeObserver',
  'Non-Error promise rejection',
  'WalletConnect', // Expected when wallet not connected
  'projectId', // WalletConnect config warnings
];

/**
 * Check if an error should be ignored
 */
export function isIgnoredError(error: string): boolean {
  return IGNORED_ERRORS.some(ignored => error.includes(ignored));
}

/**
 * Filter critical errors from a list
 */
export function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(e => !isIgnoredError(e));
}

/**
 * Console error tracker
 */
export interface ErrorTracker {
  errors: string[];
  pageErrors: string[];
  getCritical: () => string[];
  clear: () => void;
}

/**
 * Set up error capture on a page
 * Returns an error tracker object
 */
export function setupErrorCapture(page: Page): ErrorTracker {
  const tracker: ErrorTracker = {
    errors: [],
    pageErrors: [],
    getCritical: () => filterCriticalErrors([...tracker.errors, ...tracker.pageErrors]),
    clear: () => {
      tracker.errors = [];
      tracker.pageErrors = [];
    },
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      tracker.errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    tracker.pageErrors.push(`Page Error: ${error.message}`);
  });

  return tracker;
}

/**
 * Navigate to a URL and wait for it to fully load
 */
export async function navigateTo(
  page: Page,
  url: string,
  options: { waitMs?: number; waitForNetwork?: boolean } = {}
): Promise<void> {
  const { waitMs = 1000, waitForNetwork = true } = options;

  await page.goto(url);

  if (waitForNetwork) {
    await page.waitForLoadState('networkidle');
  }

  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
}

/**
 * Take a screenshot with standardized naming
 */
export async function captureScreenshot(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<void> {
  const { fullPage = true } = options;

  // Ensure name has no special characters and ends with .png
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
  const filename = safeName.endsWith('.png') ? safeName : `${safeName}.png`;

  await page.screenshot({
    path: `test-results/${filename}`,
    fullPage,
  });
}

/**
 * Check if element is safely visible (with error handling)
 */
export async function isElementVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Get page content and check for keywords
 */
export async function pageContainsAny(
  page: Page,
  keywords: string[],
  options: { caseSensitive?: boolean } = {}
): Promise<boolean> {
  const { caseSensitive = false } = options;
  const content = await page.content();
  const searchContent = caseSensitive ? content : content.toLowerCase();

  return keywords.some(keyword => {
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
    return searchContent.includes(searchKeyword);
  });
}

/**
 * Standard test timeouts
 */
export const TIMEOUTS = {
  short: 1000,
  medium: 2000,
  long: 5000,
  pageLoad: 10000,
};
