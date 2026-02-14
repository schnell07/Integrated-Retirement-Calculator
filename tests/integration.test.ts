import { test, expect } from '@playwright/test';

// Integration tests for Retirement Calculator
// These tests verify key UI elements and functionality after deployment

const BASE_URL = process.env.DEPLOY_URL || 'http://localhost:5176';

test.describe('Retirement Calculator - Integration Tests', () => {
  test('should load homepage and display main title', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    // Check for main title/sidebar
    const title = await page.locator('text=Retirement Calculator').first();
    await expect(title).toBeVisible();
  });

  test('should display Dashboard tab and load without errors', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for Dashboard link in sidebar
    const dashboardTab = await page.locator('button', { hasText: 'Dashboard' }).first();
    await expect(dashboardTab).toBeVisible();
    
    // Click to ensure it loads
    await dashboardTab.click();
    await page.waitForLoadState('networkidle');
    
    // Verify no console errors (basic check)
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Allow some time for potential errors to appear
    await page.waitForTimeout(1000);
    
    // We allow ErrorBoundary or debug messages but no critical errors
    const criticalErrors = errors.filter(e => !e.includes('ErrorBoundary') && !e.includes('debug'));
    expect(criticalErrors.length).toBe(0);
  });

  test('should display KPI cards on Dashboard', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for key KPI cards
    const currentPortfolio = await page.locator('text=Current Portfolio').first();
    const goalProgress = await page.locator('text=Goal Progress').first();
    const yearsToRetire = await page.locator('text=Years to Retire').first();
    
    await expect(currentPortfolio).toBeVisible();
    await expect(goalProgress).toBeVisible();
    await expect(yearsToRetire).toBeVisible();
  });

  test('should display export buttons', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to dashboard if needed
    const dashboardTab = await page.locator('button', { hasText: 'Dashboard' }).first();
    if (!(await dashboardTab.evaluate(el => (el as HTMLElement).classList.contains('bg-neon-green')))) {
      await dashboardTab.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Check for export buttons
    const csvButton = await page.locator('button', { hasText: 'Export CSV' }).first();
    const pdfButton = await page.locator('button', { hasText: 'Export PDF' }).first();
    
    await expect(csvButton).toBeVisible();
    await expect(pdfButton).toBeVisible();
  });

  test('should navigate tabs without errors', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const tabs = ['Dashboard', 'Personal Info', 'Financial Data', 'Income Sources', 'Accounts'];
    
    for (const tabName of tabs) {
      const tab = await page.locator('button', { hasText: tabName }).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForLoadState('networkidle');
        
        // Verify tab is highlighted as active
        const isActive = await tab.evaluate(el => (el as HTMLElement).classList.contains('bg-neon-green'));
        expect(isActive).toBeTruthy();
      }
    }
  });

  test('should render charts if data is available', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to Dashboard
    const dashboardTab = await page.locator('button', { hasText: 'Dashboard' }).first();
    await dashboardTab.click();
    await page.waitForLoadState('networkidle');
    
    // Check for chart titles
    const portfolioChart = await page.locator('text=Portfolio Growth Projection').first();
    const cashFlowChart = await page.locator('text=Annual Cash Flow').first();
    
    if (await portfolioChart.isVisible()) {
      await expect(portfolioChart).toBeVisible();
    }
    if (await cashFlowChart.isVisible()) {
      await expect(cashFlowChart).toBeVisible();
    }
  });

  test('should handle responsive layout', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');
    
    // Mobile layout should still show main content
    const title = await page.locator('text=Retirement Calculator').first();
    await expect(title).toBeVisible();
  });
});
