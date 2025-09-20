describe('Authentication', () => {
  beforeEach(() => {
    cy.clearAllData();
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should register a new client account successfully', () => {
      cy.visit('/signup');
      
      // Fill out the registration form
      cy.get('[data-cy="first-name-input"]').type('Test');
      cy.get('[data-cy="last-name-input"]').type('Client');
      cy.get('[data-cy="email-input"]').type('testclient@mybeatfi.io');
      cy.get('[data-cy="password-input"]').type('TestClient123!');
      cy.get('[data-cy="account-type-select"]').select('client');
      
      // Check required checkboxes
      cy.get('[data-cy="age-verification-checkbox"]').check();
      cy.get('[data-cy="terms-checkbox"]').check();
      
      // Submit the form
      cy.get('[data-cy="create-account-button"]').click();
      
      // Verify success
      cy.get('[data-cy="success-message"]').should('contain', 'Account Created');
      cy.url().should('include', '/dashboard');
    });

    it('should register a new producer account with invitation code', () => {
      cy.visit('/signup');
      
      // Fill out the registration form
      cy.get('[data-cy="first-name-input"]').type('Test');
      cy.get('[data-cy="last-name-input"]').type('Producer');
      cy.get('[data-cy="email-input"]').type('testproducer@mybeatfi.io');
      cy.get('[data-cy="password-input"]').type('TestProducer123!');
      cy.get('[data-cy="account-type-select"]').select('producer');
      
      // Fill producer-specific fields
      cy.get('[data-cy="invitation-code-input"]').type('TEST_PRODUCER_001');
      cy.get('[data-cy="ipi-number-input"]').type('123456789');
      cy.get('[data-cy="pro-select"]').select('ASCAP');
      
      // Check required checkboxes
      cy.get('[data-cy="age-verification-checkbox"]').check();
      cy.get('[data-cy="terms-checkbox"]').check();
      
      // Submit the form
      cy.get('[data-cy="create-account-button"]').click();
      
      // Verify success
      cy.get('[data-cy="success-message"]').should('contain', 'Account Created');
      cy.url().should('include', '/producer/dashboard');
    });

    it('should show validation errors for invalid data', () => {
      cy.visit('/signup');
      
      // Try to submit without filling required fields
      cy.get('[data-cy="create-account-button"]').click();
      
      // Verify validation errors
      cy.get('[data-cy="first-name-error"]').should('be.visible');
      cy.get('[data-cy="last-name-error"]').should('be.visible');
      cy.get('[data-cy="email-error"]').should('be.visible');
      cy.get('[data-cy="password-error"]').should('be.visible');
      cy.get('[data-cy="age-verification-error"]').should('be.visible');
      cy.get('[data-cy="terms-error"]').should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/signup');
      
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="email-input"]').blur();
      
      cy.get('[data-cy="email-error"]').should('contain', 'Invalid email format');
    });

    it('should validate password strength', () => {
      cy.visit('/signup');
      
      cy.get('[data-cy="password-input"]').type('weak');
      cy.get('[data-cy="password-input"]').blur();
      
      cy.get('[data-cy="password-error"]').should('contain', 'Password does not meet requirements');
    });

    it('should require terms acceptance', () => {
      cy.visit('/signup');
      
      // Fill out form but don't check terms
      cy.get('[data-cy="first-name-input"]').type('Test');
      cy.get('[data-cy="last-name-input"]').type('Client');
      cy.get('[data-cy="email-input"]').type('test@example.com');
      cy.get('[data-cy="password-input"]').type('TestClient123!');
      cy.get('[data-cy="age-verification-checkbox"]').check();
      
      cy.get('[data-cy="create-account-button"]').click();
      
      cy.get('[data-cy="terms-error"]').should('contain', 'You must accept the Terms and Conditions');
    });
  });

  describe('User Login', () => {
    it('should login with valid client credentials', () => {
      cy.loginAs('client');
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="user-menu"]').should('be.visible');
    });

    it('should login with valid producer credentials', () => {
      cy.loginAs('producer');
      
      cy.url().should('include', '/producer/dashboard');
      cy.get('[data-cy="producer-menu"]').should('be.visible');
    });

    it('should login with valid admin credentials', () => {
      cy.loginAs('admin');
      
      cy.url().should('include', '/admin/dashboard');
      cy.get('[data-cy="admin-menu"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('invalid@example.com');
      cy.get('[data-cy="password-input"]').type('wrongpassword');
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="error-message"]').should('contain', 'Invalid credentials');
    });

    it('should show error for non-existent email', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="password-input"]').type('anypassword');
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="error-message"]').should('contain', 'User not found');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      cy.get('[data-cy="login-button"]').click();
      
      cy.get('[data-cy="email-error"]').should('be.visible');
      cy.get('[data-cy="password-error"]').should('be.visible');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', () => {
      cy.visit('/login');
      cy.get('[data-cy="forgot-password-link"]').click();
      
      cy.get('[data-cy="email-input"]').type('testclient@mybeatfi.io');
      cy.get('[data-cy="send-reset-button"]').click();
      
      cy.get('[data-cy="success-message"]').should('contain', 'Reset email sent');
    });

    it('should show error for non-existent email', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-cy="email-input"]').type('nonexistent@example.com');
      cy.get('[data-cy="send-reset-button"]').click();
      
      cy.get('[data-cy="error-message"]').should('contain', 'Email not found');
    });

    it('should validate email format', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-cy="email-input"]').type('invalid-email');
      cy.get('[data-cy="email-input"]').blur();
      
      cy.get('[data-cy="email-error"]').should('contain', 'Invalid email format');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      cy.loginAs('client');
      
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      
      cy.url().should('include', '/');
      cy.get('[data-cy="login-button"]').should('be.visible');
    });

    it('should clear user data on logout', () => {
      cy.loginAs('client');
      
      // Verify user data exists
      cy.window().its('localStorage').should('not.be.empty');
      
      cy.get('[data-cy="user-menu"]').click();
      cy.get('[data-cy="logout-button"]').click();
      
      // Verify user data is cleared
      cy.window().its('localStorage').should('be.empty');
    });
  });

  describe('Session Management', () => {
    it('should maintain session on page refresh', () => {
      cy.loginAs('client');
      
      cy.reload();
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy="user-menu"]').should('be.visible');
    });

    it('should redirect to login when session expires', () => {
      cy.loginAs('client');
      
      // Simulate session expiration by clearing localStorage
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      cy.visit('/dashboard');
      
      cy.url().should('include', '/login');
    });
  });

  describe('Access Control', () => {
    it('should prevent access to admin dashboard for non-admin users', () => {
      cy.loginAs('client');
      
      cy.visit('/admin/dashboard');
      
      cy.url().should('include', '/unauthorized');
      cy.get('[data-cy="error-message"]').should('contain', 'Access denied');
    });

    it('should prevent access to producer dashboard for non-producer users', () => {
      cy.loginAs('client');
      
      cy.visit('/producer/dashboard');
      
      cy.url().should('include', '/unauthorized');
      cy.get('[data-cy="error-message"]').should('contain', 'Access denied');
    });

    it('should redirect authenticated users away from login page', () => {
      cy.loginAs('client');
      
      cy.visit('/login');
      
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Responsive Design', () => {
    it('should display login form correctly on mobile', () => {
      cy.setViewport('mobile');
      cy.visit('/login');
      
      cy.get('[data-cy="login-form"]').should('be.visible');
      cy.get('[data-cy="email-input"]').should('be.visible');
      cy.get('[data-cy="password-input"]').should('be.visible');
      cy.get('[data-cy="login-button"]').should('be.visible');
    });

    it('should display signup form correctly on tablet', () => {
      cy.setViewport('tablet');
      cy.visit('/signup');
      
      cy.get('[data-cy="signup-form"]').should('be.visible');
      cy.testResponsive('[data-cy="signup-form"]');
    });
  });

  describe('Accessibility', () => {
    it('should meet accessibility standards for login form', () => {
      cy.visit('/login');
      cy.checkAccessibility();
    });

    it('should meet accessibility standards for signup form', () => {
      cy.visit('/signup');
      cy.checkAccessibility();
    });

    it('should support keyboard navigation', () => {
      cy.visit('/login');
      cy.testKeyboardNavigation([
        '[data-cy="email-input"]',
        '[data-cy="password-input"]',
        '[data-cy="login-button"]',
        '[data-cy="forgot-password-link"]'
      ]);
    });
  });
});
