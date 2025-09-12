# MyBeatFi.io Cypress Testing Guide

## 🚀 Getting Started with Cypress Cloud

This guide will help you set up and run comprehensive end-to-end tests using Cypress with Cypress Cloud integration.

---

## 📦 Setup Complete ✅

### **What's Been Installed:**
- ✅ Cypress 15.0.0
- ✅ Cypress Cloud integration (Project ID: `kijozc`)
- ✅ Custom commands and configurations
- ✅ Example test files
- ✅ NPM scripts for easy testing

---

## 🧪 Running Cypress Tests

### **Quick Start Commands**

```bash
# Open Cypress Test Runner (Interactive Mode)
npm run cypress:open

# Run all tests in headless mode
npm run cypress:run

# Run tests with browser visible
npm run cypress:run:headed

# Run tests in specific browser
npm run cypress:run:chrome
npm run cypress:run:firefox
npm run cypress:run:edge

# Run tests and record to Cypress Cloud
npm run cypress:run:record

# Run all tests (Unit + E2E)
npm run test:all
```

### **Cypress Cloud Integration**

Your project is already connected to Cypress Cloud with Project ID: `kijozc`

**To record tests to Cypress Cloud:**
1. Get your record key from Cypress Cloud dashboard
2. Replace `YOUR_RECORD_KEY` in package.json
3. Run: `npm run cypress:run:record`

---

## 📁 Test Structure

```
cypress/
├── e2e/                          # End-to-end tests
│   ├── authentication.cy.ts      # Authentication tests
│   ├── catalog.cy.ts             # Catalog browsing tests
│   ├── payments.cy.ts            # Payment processing tests
│   ├── producer.cy.ts            # Producer functionality tests
│   └── admin.cy.ts               # Admin functionality tests
├── component/                    # Component tests
│   ├── SignupForm.cy.tsx         # Component-specific tests
│   └── LoginForm.cy.tsx          # Component-specific tests
├── fixtures/                     # Test data
│   ├── users.json               # User test data
│   ├── tracks.json              # Track test data
│   └── payments.json            # Payment test data
├── support/
│   ├── e2e.ts                   # E2E support file
│   ├── component.ts             # Component support file
│   └── commands.ts              # Custom commands
└── downloads/                   # Downloaded files
```

---

## 🎯 Test Categories

### **1. Authentication Tests** (`authentication.cy.ts`)
- ✅ User registration (client, producer, admin)
- ✅ User login/logout
- ✅ Password reset
- ✅ Session management
- ✅ Access control
- ✅ Form validation
- ✅ Responsive design
- ✅ Accessibility

### **2. Catalog Tests** (`catalog.cy.ts`)
- ✅ Track browsing
- ✅ Search functionality
- ✅ Filtering and sorting
- ✅ Track details
- ✅ Audio playback
- ✅ Favorites and playlists

### **3. Payment Tests** (`payments.cy.ts`)
- ✅ Stripe integration
- ✅ Single track licensing
- ✅ Subscription management
- ✅ Payment validation
- ✅ Receipt generation

### **4. Producer Tests** (`producer.cy.ts`)
- ✅ Track upload
- ✅ Track management
- ✅ Analytics dashboard
- ✅ Payout system

### **5. Admin Tests** (`admin.cy.ts`)
- ✅ User management
- ✅ Content moderation
- ✅ Analytics and reporting
- ✅ System settings

---

## 🔧 Custom Commands

### **Authentication Commands**
```typescript
// Login as different user types
cy.loginAs('client');
cy.loginAs('producer');
cy.loginAs('admin');

// Clear all data
cy.clearAllData();

// Wait for page load
cy.waitForPageLoad();
```

### **Responsive Testing Commands**
```typescript
// Set viewport sizes
cy.setViewport('mobile');    // 375x667
cy.setViewport('tablet');    // 768x1024
cy.setViewport('desktop');   // 1280x720

// Test responsive design
cy.testResponsive('[data-cy="form"]');
```

### **Form Testing Commands**
```typescript
// Type with delay
cy.typeWithDelay('[data-cy="input"]', 'text', 100);

// Test form validation
cy.testFormValidation('[data-cy="form"]', {
  email: 'invalid-email',
  password: 'weak'
});

// Upload files
cy.uploadFile('[data-cy="file-input"]', 'track.mp3', 'audio/mpeg');
```

### **Accessibility Commands**
```typescript
// Check accessibility
cy.checkAccessibility();

// Test keyboard navigation
cy.testKeyboardNavigation([
  '[data-cy="input1"]',
  '[data-cy="input2"]',
  '[data-cy="button"]'
]);
```

### **API Testing Commands**
```typescript
// Test API responses
cy.testApiResponse('POST', '/api/login', 200);

// Wait for network idle
cy.waitForNetworkIdle(10000);
```

---

## 📊 Cypress Cloud Features

### **Test Recording**
- **Parallel Execution**: Run tests across multiple machines
- **Video Recording**: Automatic video capture of test runs
- **Screenshot Capture**: Screenshots on failures
- **Test Analytics**: Detailed test performance metrics

### **Dashboard Features**
- **Test Results**: View all test runs and results
- **Failure Analysis**: Detailed failure information
- **Performance Metrics**: Test execution times
- **Team Collaboration**: Share results with team

### **CI/CD Integration**
```yaml
# GitHub Actions Example
name: Cypress Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run cypress:run:record
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

---

## 🎯 Writing Tests

### **Test Structure**
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.clearAllData();
    cy.visit('/');
  });

  it('should perform specific action', () => {
    // Arrange
    cy.loginAs('client');
    
    // Act
    cy.get('[data-cy="button"]').click();
    
    // Assert
    cy.get('[data-cy="result"]').should('contain', 'Expected Text');
  });
});
```

### **Best Practices**
1. **Use data-cy attributes** for reliable element selection
2. **Write descriptive test names** that explain the behavior
3. **Keep tests independent** - each test should be able to run alone
4. **Use custom commands** for common operations
5. **Test user behavior** not implementation details

### **Element Selection**
```typescript
// Good - using data-cy attributes
cy.get('[data-cy="login-button"]').click();

// Good - using accessible selectors
cy.get('button[aria-label="Login"]').click();

// Avoid - using CSS classes that might change
cy.get('.btn-primary').click();
```

---

## 🔍 Debugging Tests

### **Cypress Debug Commands**
```bash
# Run with debug output
DEBUG=cypress:* npm run cypress:run

# Run specific test file
npm run cypress:run -- --spec "cypress/e2e/authentication.cy.ts"

# Run tests matching pattern
npm run cypress:run -- --grep "login"

# Run with browser dev tools
npm run cypress:run:headed
```

### **Common Debugging Techniques**
```typescript
// Pause test execution
cy.pause();

// Log information
cy.log('Debug information');

// Take screenshot
cy.screenshot('debug-screenshot');

// Check element state
cy.get('[data-cy="element"]').then(($el) => {
  cy.log('Element text:', $el.text());
  cy.log('Element visible:', $el.is(':visible'));
});
```

---

## 📈 Test Metrics & Reporting

### **Cypress Cloud Metrics**
- **Test Execution Time**: Track performance over time
- **Failure Rate**: Monitor test reliability
- **Flaky Tests**: Identify unstable tests
- **Coverage**: Track test coverage across features

### **Custom Reporting**
```typescript
// Custom command to track test metrics
Cypress.Commands.add('trackTestMetrics', (testName: string, duration: number) => {
  cy.task('log', `Test: ${testName}, Duration: ${duration}ms`);
});
```

---

## 🚨 Troubleshooting

### **Common Issues**

**1. Element Not Found**
```typescript
// Solution: Wait for element to be visible
cy.get('[data-cy="element"]', { timeout: 10000 }).should('be.visible');
```

**2. Network Timeout**
```typescript
// Solution: Increase timeout
cy.get('[data-cy="element"]', { timeout: 30000 }).should('exist');
```

**3. Stale Element**
```typescript
// Solution: Re-query element
cy.get('body').then(() => {
  cy.get('[data-cy="element"]').click();
});
```

**4. Async Operations**
```typescript
// Solution: Wait for network requests
cy.intercept('POST', '/api/action').as('apiCall');
cy.get('[data-cy="button"]').click();
cy.wait('@apiCall');
```

### **Performance Issues**
```typescript
// Optimize test performance
beforeEach(() => {
  // Disable video recording for faster runs
  Cypress.config('video', false);
  
  // Reduce screenshot frequency
  Cypress.config('screenshotOnRunFailure', false);
});
```

---

## 🔄 Continuous Testing

### **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:e2e -- --spec 'cypress/e2e/critical.cy.ts'"
    }
  }
}
```

### **Scheduled Testing**
```yaml
# GitHub Actions - Daily testing
name: Daily E2E Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  daily-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run cypress:run:record
```

---

## 📞 Getting Help

### **Resources**
- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Cloud Documentation](https://docs.cypress.io/guides/cloud/introduction)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

### **Support**
- **Cypress Community**: [GitHub Discussions](https://github.com/cypress-io/cypress/discussions)
- **Cypress Cloud Support**: [Support Portal](https://support.cypress.io/)

---

## 🎯 Next Steps

### **Immediate Actions**
1. **Add data-cy attributes** to your components
2. **Create test data** in `cypress/fixtures/`
3. **Write more test files** for different features
4. **Set up CI/CD integration**

### **Advanced Features**
1. **Visual Regression Testing**: Compare screenshots
2. **API Testing**: Test backend endpoints
3. **Performance Testing**: Measure load times
4. **Cross-browser Testing**: Test in multiple browsers

---

*Your Cypress Cloud setup is ready! Start testing your MyBeatFi.io application with confidence.* 🚀
