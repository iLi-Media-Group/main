# MyBeatFi.io Testing Quick Start Guide

## 🚀 Getting Started with Testing

This guide will help you set up and run comprehensive tests for your MyBeatFi.io platform.

---

## 📦 Installation

### **1. Install Testing Dependencies**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom @vitest/ui @vitest/coverage-v8
```

### **2. Verify Installation**
```bash
npm run test -- --version
```

---

## 🧪 Running Tests

### **Quick Test Commands**

```bash
# Run all tests
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests once and exit
npm run test:run
```

### **Test File Structure**
```
src/
├── test/
│   ├── setup.ts                    # Test configuration
│   └── components/
│       ├── SignupForm.test.tsx     # Example test
│       ├── LoginForm.test.tsx      # Add more tests
│       └── ...
├── components/
│   ├── SignupForm.tsx
│   ├── LoginForm.tsx
│   └── ...
```

---

## 📝 Writing Tests

### **Test File Naming Convention**
- Test files should end with `.test.tsx` or `.test.ts`
- Place test files in `src/test/components/` directory
- Name test files to match the component they test

### **Example Test Structure**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { YourComponent } from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<YourComponent />);
    fireEvent.click(screen.getByButtonText('Click Me'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

---

## 🎯 Testing Priorities

### **High Priority (Test First)**
1. **Authentication Components**
   - SignupForm
   - LoginForm
   - PasswordReset

2. **Payment Components**
   - CheckoutForm
   - PaymentProcessing
   - SubscriptionManagement

3. **Critical User Flows**
   - Track upload
   - Track licensing
   - User registration

### **Medium Priority**
1. **Dashboard Components**
   - ClientDashboard
   - ProducerDashboard
   - AdminDashboard

2. **Catalog Components**
   - TrackCard
   - SearchFilters
   - TrackDetails

### **Low Priority**
1. **Utility Components**
   - Navigation
   - Footer
   - Loading states

---

## 🔧 Manual Testing

### **Quick Manual Test Checklist**

**Before Each Deployment:**
- [ ] Test user registration (client, producer, admin)
- [ ] Test login/logout functionality
- [ ] Test payment processing with Stripe test cards
- [ ] Test track upload and licensing
- [ ] Test responsive design on mobile/tablet
- [ ] Test admin functions

**Weekly Testing:**
- [ ] Run full manual testing script
- [ ] Test all user roles and permissions
- [ ] Verify email notifications
- [ ] Check database operations
- [ ] Test file uploads and downloads

---

## 📊 Test Coverage Goals

### **Coverage Targets**
- **Critical Components:** >90% coverage
- **Business Logic:** >80% coverage
- **UI Components:** >70% coverage
- **Overall Project:** >75% coverage

### **Coverage Report**
```bash
npm run test:coverage
```

This will generate a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

---

## 🐛 Debugging Tests

### **Common Issues & Solutions**

**1. Test Setup Issues**
```bash
# Clear test cache
npm run test -- --clearCache

# Run with verbose output
npm run test -- --verbose
```

**2. Mock Issues**
```typescript
// If mocks aren't working, check setup.ts
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signUp: vi.fn() },
    // ... other mocks
  },
}));
```

**3. Async Test Issues**
```typescript
// Use waitFor for async operations
import { waitFor } from '@testing-library/react';

it('handles async operations', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## 🔄 Continuous Testing

### **GitHub Actions Setup**
Create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

### **Pre-commit Hooks**
```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "npm run lint",
      "npm run test:run -- --findRelatedTests"
    ]
  }
}
```

---

## 📈 Testing Metrics

### **Track These Metrics**
- **Test Execution Time:** < 30 seconds for full suite
- **Test Coverage:** > 75% overall
- **Test Reliability:** < 1% flaky tests
- **Bug Detection Rate:** Track bugs found by tests vs. manual testing

### **Reporting**
```bash
# Generate test report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

---

## 🎯 Best Practices

### **Test Writing Guidelines**
1. **Test Behavior, Not Implementation**
   ```typescript
   // Good: Test what user sees
   expect(screen.getByText('Success')).toBeInTheDocument();
   
   // Bad: Test internal state
   expect(component.state.success).toBe(true);
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('displays error message when login fails', () => {});
   
   // Bad
   it('test1', () => {});
   ```

3. **Test User Interactions**
   ```typescript
   // Test user actions, not just rendering
   fireEvent.click(screen.getByButtonText('Submit'));
   fireEvent.change(screen.getByLabelText('Email'), {
     target: { value: 'test@example.com' }
   });
   ```

4. **Keep Tests Independent**
   ```typescript
   // Each test should be able to run alone
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

---

## 🚨 Emergency Testing

### **Quick Smoke Test (5 minutes)**
```bash
# Run only critical tests
npm run test:run -- --grep "critical"

# Test specific component
npm run test:run -- SignupForm

# Test with specific pattern
npm run test:run -- --grep "authentication"
```

### **Production Deployment Checklist**
- [ ] All automated tests pass
- [ ] Manual testing script completed
- [ ] Payment processing verified
- [ ] User registration works
- [ ] Admin functions accessible
- [ ] No console errors in browser
- [ ] Mobile responsiveness checked

---

## 📞 Getting Help

### **Resources**
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### **Common Commands Reference**
```bash
# Run tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:run -- SignupForm.test.tsx

# Run tests matching pattern
npm run test:run -- --grep "login"

# Debug tests
npm run test:run -- --reporter=verbose
```

---

*This testing setup will help ensure your MyBeatFi.io platform is reliable and bug-free!*
