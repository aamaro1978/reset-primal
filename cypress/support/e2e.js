// Cypress E2E Support File
// Utilities and custom commands for E2E tests

// Intercept network requests for validation
beforeEach(() => {
  // Intercept GA4 requests
  cy.intercept('https://www.google-analytics.com/mp/collect*', (req) => {
    req.reply({
      statusCode: 204,
      body: '',
    });
  }).as('ga4Event');

  // Intercept Facebook Pixel
  cy.intercept('https://graph.facebook.com/**', (req) => {
    req.reply({
      statusCode: 200,
      body: { success: true },
    });
  }).as('fbPixel');
});

// Custom Commands

/**
 * Verify GA4 event was sent with correct data
 */
Cypress.Commands.add('verifyGA4Event', (eventName, params) => {
  cy.wait('@ga4Event').then((interception) => {
    expect(interception.request.body).to.include(eventName);
    if (params) {
      Object.keys(params).forEach((key) => {
        expect(interception.request.body).to.include(params[key]);
      });
    }
  });
});

/**
 * Verify scroll depth was tracked
 */
Cypress.Commands.add('verifyScrollTracking', (depth) => {
  cy.scrollTo(`0%, ${depth}%`);
  cy.wait(500); // Wait for tracking event
  cy.get('body').then(() => {
    cy.verifyGA4Event('scroll_depth');
  });
});

/**
 * Verify CTA button click was tracked
 */
Cypress.Commands.add('verifyCTATracking', () => {
  cy.get('[data-testid="cta-button"], .cta-button, a[href*="hotmart"], button:contains("Começar")')
    .first()
    .then(($btn) => {
      cy.wrap($btn).click();
      cy.wait(500);
      cy.verifyGA4Event('click_cta_button');
    });
});

/**
 * Check element visibility on mobile
 */
Cypress.Commands.add('checkMobileVisibility', (selector) => {
  cy.viewport('iphone-12');
  cy.get(selector).should('be.visible');
});

/**
 * Check element visibility on desktop
 */
Cypress.Commands.add('checkDesktopVisibility', (selector) => {
  cy.viewport(1280, 720);
  cy.get(selector).should('be.visible');
});
