// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // on uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Custom viewport sizes for responsive testing
Cypress.Commands.add('setViewport', (size: 'mobile' | 'tablet' | 'desktop') => {
  const sizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
  };
  cy.viewport(sizes[size].width, sizes[size].height);
});

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.window().its('document').its('readyState').should('eq', 'complete');
});

// Custom command to login as different user types
Cypress.Commands.add('loginAs', (userType: 'client' | 'producer' | 'admin') => {
  const users = {
    client: {
      email: 'testclient@mybeatfi.io',
      password: 'TestClient123!'
    },
    producer: {
      email: 'testproducer@mybeatfi.io',
      password: 'TestProducer123!'
    },
    admin: {
      email: 'testadmin@mybeatfi.io',
      password: 'TestAdmin123!'
    }
  };

  const user = users[userType];
  
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(user.email);
  cy.get('[data-cy="password-input"]').type(user.password);
  cy.get('[data-cy="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// Custom command to clear all data
Cypress.Commands.add('clearAllData', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

// Custom command to wait for network requests to complete
Cypress.Commands.add('waitForNetworkIdle', (timeout = 10000) => {
  cy.intercept('**/*').as('allRequests');
  cy.wait('@allRequests', { timeout });
});

// Custom command to check if element is in viewport
Cypress.Commands.add('isInViewport', (selector: string) => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    expect(isInViewport).to.be.true;
  });
});

// Custom command to scroll to element
Cypress.Commands.add('scrollToElement', (selector: string) => {
  cy.get(selector).scrollIntoView();
});

// Custom command to wait for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-cy="loading"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-cy="spinner"]', { timeout: 10000 }).should('not.exist');
});

// Custom command to check for console errors
Cypress.Commands.add('checkForConsoleErrors', () => {
  cy.window().then((win) => {
    const consoleErrors: string[] = [];
    const originalError = win.console.error;
    
    win.console.error = (...args: any[]) => {
      consoleErrors.push(args.join(' '));
      originalError.apply(win.console, args);
    };
    
    cy.wrap(consoleErrors).should('have.length', 0);
  });
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      setViewport(size: 'mobile' | 'tablet' | 'desktop'): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      loginAs(userType: 'client' | 'producer' | 'admin'): Chainable<void>;
      clearAllData(): Chainable<void>;
      waitForNetworkIdle(timeout?: number): Chainable<void>;
      isInViewport(selector: string): Chainable<void>;
      scrollToElement(selector: string): Chainable<void>;
      waitForLoading(): Chainable<void>;
      checkForConsoleErrors(): Chainable<void>;
    }
  }
}