/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to type with delay (useful for forms)
Cypress.Commands.add('typeWithDelay', (selector: string, text: string, delay = 100) => {
  cy.get(selector).clear();
  text.split('').forEach((char, index) => {
    cy.get(selector).type(char, { delay });
  });
});

// Custom command to upload file
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType: string) => {
  cy.fixture(fileName).then((fileContent) => {
    cy.get(selector).attachFile({
      fileContent,
      fileName,
      mimeType: fileType,
    });
  });
});

// Custom command to check if element exists
Cypress.Commands.add('elementExists', (selector: string) => {
  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      cy.get(selector).should('exist');
    } else {
      cy.log(`Element ${selector} does not exist`);
    }
  });
});

// Custom command to wait for element to be visible
Cypress.Commands.add('waitForElement', (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Custom command to check accessibility
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom command to test responsive design
Cypress.Commands.add('testResponsive', (selector: string) => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' }
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.get(selector).should('be.visible');
    cy.log(`Element visible on ${viewport.name} viewport`);
  });
});

// Custom command to test keyboard navigation
Cypress.Commands.add('testKeyboardNavigation', (selectors: string[]) => {
  cy.get('body').focus();
  
  selectors.forEach((selector, index) => {
    cy.get(selector).focus();
    cy.focused().should('have.attr', 'data-cy', selector.replace('[data-cy="', '').replace('"]', ''));
    
    if (index < selectors.length - 1) {
      cy.get('body').type('{tab}');
    }
  });
});

// Custom command to test form validation
Cypress.Commands.add('testFormValidation', (formSelector: string, invalidData: any) => {
  Object.keys(invalidData).forEach((field) => {
    cy.get(`${formSelector} [data-cy="${field}-input"]`).clear().type(invalidData[field]);
    cy.get(`${formSelector} [data-cy="submit-button"]`).click();
    cy.get(`[data-cy="${field}-error"]`).should('be.visible');
  });
});

// Custom command to test API responses
Cypress.Commands.add('testApiResponse', (method: string, url: string, expectedStatus: number) => {
  cy.intercept(method, url).as('apiCall');
  cy.wait('@apiCall').its('response.statusCode').should('eq', expectedStatus);
});

// Custom command to test error handling
Cypress.Commands.add('testErrorHandling', (action: () => void, expectedError: string) => {
  cy.on('window:alert', (text) => {
    expect(text).to.include(expectedError);
  });
  
  action();
});

// Custom command to test loading states
Cypress.Commands.add('testLoadingStates', (action: () => void) => {
  cy.get('[data-cy="loading"]').should('be.visible');
  action();
  cy.get('[data-cy="loading"]').should('not.exist');
});

// Custom command to test toast notifications
Cypress.Commands.add('testToastNotification', (expectedMessage: string, type: 'success' | 'error' | 'warning' = 'success') => {
  cy.get(`[data-cy="toast-${type}"]`).should('be.visible');
  cy.get(`[data-cy="toast-${type}"]`).should('contain', expectedMessage);
});

// Custom command to test modal functionality
Cypress.Commands.add('testModal', (triggerSelector: string, modalSelector: string) => {
  cy.get(triggerSelector).click();
  cy.get(modalSelector).should('be.visible');
  cy.get('[data-cy="modal-close"]').click();
  cy.get(modalSelector).should('not.exist');
});

// Custom command to test infinite scroll
Cypress.Commands.add('testInfiniteScroll', (containerSelector: string, itemSelector: string) => {
  cy.get(containerSelector).scrollTo('bottom');
  cy.get(itemSelector).should('have.length.greaterThan', 10);
});

// Custom command to test search functionality
Cypress.Commands.add('testSearch', (searchInputSelector: string, searchTerm: string, resultsSelector: string) => {
  cy.get(searchInputSelector).type(searchTerm);
  cy.get(resultsSelector).should('contain', searchTerm);
});

// Custom command to test pagination
Cypress.Commands.add('testPagination', (paginationSelector: string, pageSelector: string) => {
  cy.get(paginationSelector).find(pageSelector).first().click();
  cy.url().should('include', 'page=');
});

// Custom command to test sorting
Cypress.Commands.add('testSorting', (sortSelector: string, columnSelector: string) => {
  cy.get(sortSelector).click();
  cy.get(columnSelector).should('have.class', 'sorted');
});

// Custom command to test filtering
Cypress.Commands.add('testFiltering', (filterSelector: string, filterValue: string, resultsSelector: string) => {
  cy.get(filterSelector).select(filterValue);
  cy.get(resultsSelector).should('contain', filterValue);
});

// Custom command to test drag and drop
Cypress.Commands.add('testDragAndDrop', (dragSelector: string, dropSelector: string) => {
  cy.get(dragSelector).trigger('mousedown', { button: 0 });
  cy.get(dropSelector).trigger('mousemove').trigger('mouseup', { force: true });
});

// Custom command to test file upload progress
Cypress.Commands.add('testFileUploadProgress', (fileInputSelector: string, fileName: string) => {
  cy.get(fileInputSelector).attachFile(fileName);
  cy.get('[data-cy="upload-progress"]').should('be.visible');
  cy.get('[data-cy="upload-complete"]').should('be.visible');
});

// Custom command to test real-time updates
Cypress.Commands.add('testRealTimeUpdates', (updateTrigger: () => void, updateSelector: string) => {
  const initialText = cy.get(updateSelector).invoke('text');
  updateTrigger();
  cy.get(updateSelector).should('not.have.text', initialText);
});

// Type definitions for additional custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      typeWithDelay(selector: string, text: string, delay?: number): Chainable<void>;
      uploadFile(selector: string, fileName: string, fileType: string): Chainable<void>;
      elementExists(selector: string): Chainable<void>;
      waitForElement(selector: string, timeout?: number): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      testResponsive(selector: string): Chainable<void>;
      testKeyboardNavigation(selectors: string[]): Chainable<void>;
      testFormValidation(formSelector: string, invalidData: any): Chainable<void>;
      testApiResponse(method: string, url: string, expectedStatus: number): Chainable<void>;
      testErrorHandling(action: () => void, expectedError: string): Chainable<void>;
      testLoadingStates(action: () => void): Chainable<void>;
      testToastNotification(expectedMessage: string, type?: 'success' | 'error' | 'warning'): Chainable<void>;
      testModal(triggerSelector: string, modalSelector: string): Chainable<void>;
      testInfiniteScroll(containerSelector: string, itemSelector: string): Chainable<void>;
      testSearch(searchInputSelector: string, searchTerm: string, resultsSelector: string): Chainable<void>;
      testPagination(paginationSelector: string, pageSelector: string): Chainable<void>;
      testSorting(sortSelector: string, columnSelector: string): Chainable<void>;
      testFiltering(filterSelector: string, filterValue: string, resultsSelector: string): Chainable<void>;
      testDragAndDrop(dragSelector: string, dropSelector: string): Chainable<void>;
      testFileUploadProgress(fileInputSelector: string, fileName: string): Chainable<void>;
      testRealTimeUpdates(updateTrigger: () => void, updateSelector: string): Chainable<void>;
    }
  }
}