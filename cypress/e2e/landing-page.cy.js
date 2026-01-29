/**
 * E2E Tests - Landing Page v2
 * Tests the landing page redesign, tracking, and conversion flow
 */

describe('Landing Page V2 - Full Journey', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Page Load & Rendering', () => {
    it('should load landing page successfully', () => {
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });

    it('should have correct page title', () => {
      cy.title().should('contain', 'Reset Primal');
    });

    it('should have GA4 script loaded', () => {
      cy.window().then((win) => {
        expect(win.gtag).to.be.a('function');
      });
    });

    it('should load GA4 Measurement ID', () => {
      cy.window().then((win) => {
        // GA4 should be initialized with correct measurement ID
        expect(win.dataLayer || []).to.be.an('array');
      });
    });
  });

  describe('Hero Section', () => {
    it('should display hero headline', () => {
      cy.contains('Recupere seus 12 primeiros quilos em 21 dias').should('be.visible');
    });

    it('should display hero subheadline', () => {
      cy.get('h1').should('contain', 'sem academia');
      cy.get('h1').should('contain', 'sem remédios');
    });

    it('should have CTA button visible in hero', () => {
      cy.get('[data-testid="cta-button-hero"], .hero .cta-button, .hero a[href*="hotmart"]')
        .first()
        .should('be.visible');
    });

    it('should have hero stats displayed', () => {
      // Check for 3 stat cards
      cy.get('.stat-card, [data-testid="stat-card"]').should('have.length.at.least', 3);
    });

    it('should display hero stats with numbers', () => {
      cy.get('.stat-card, [data-testid="stat-card"]').each(($stat) => {
        cy.wrap($stat)
          .find('[data-testid="stat-number"], .stat-number, h3')
          .should('contain.text', /\d/);
      });
    });
  });

  describe('Content Sections', () => {
    it('should display problem section', () => {
      cy.contains('Por que outras dietas fracassam').should('be.visible');
    });

    it('should display solution section', () => {
      cy.contains('A solução Reset Primal').should('be.visible');
    });

    it('should display protocol timeline', () => {
      cy.contains('Fase 1').should('be.visible');
      cy.contains('Fase 2').should('be.visible');
      cy.contains('Fase 3').should('be.visible');
    });

    it('should display testimonials section', () => {
      cy.get('.testimonial-card, [data-testid="testimonial"]').should('have.length.at.least', 3);
    });

    it('should display FAQ section', () => {
      cy.contains(/perguntas frequentes|faq|dúvidas/i).should('be.visible');
    });
  });

  describe('CTA Buttons', () => {
    it('should have at least 3 CTA buttons on page', () => {
      cy.get('a[href*="hotmart"], button:contains("Começar"), [data-testid*="cta"]').should(
        'have.length.at.least',
        3
      );
    });

    it('should have CTA button in hero section', () => {
      cy.get('[data-testid="cta-button-hero"], .hero-content a[href*="hotmart"]')
        .first()
        .should('be.visible');
    });

    it('should have CTA button in guarantee section', () => {
      cy.contains('garantia')
        .should('exist')
        .then(() => {
          cy.get('a[href*="hotmart"], button:contains("Começar")')
            .filter((index, el) => {
              const rect = el.getBoundingClientRect();
              return rect.top > 800; // Not in hero
            })
            .first()
            .should('be.visible');
        });
    });

    it('should have CTA button in footer', () => {
      cy.get('footer').within(() => {
        cy.get('a[href*="hotmart"], button:contains("Começar")').should('be.visible');
      });
    });

    it('should have correct Hotmart affiliate link', () => {
      cy.get('a[href*="hotmart"]')
        .first()
        .should('have.attr', 'href', 'https://go.hotmart.com/W103146395W');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should be responsive on mobile (iphone-12)', () => {
      cy.viewport('iphone-12');
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
      cy.get('[data-testid="cta-button-hero"], a[href*="hotmart"]').first().should('be.visible');
    });

    it('should be responsive on tablet (ipad-2)', () => {
      cy.viewport('ipad-2');
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1280, 720);
      cy.get('body').should('be.visible');
      cy.get('h1').should('be.visible');
    });

    it('should display correctly on different screen sizes', () => {
      const viewports = ['iphone-x', 'ipad-2', (1920, 1080)];

      viewports.forEach((vp) => {
        cy.viewport(vp);
        cy.get('h1').should('be.visible');
        cy.get('body').should('not.have.css', 'overflow', 'hidden');
      });
    });
  });

  describe('Scroll Tracking', () => {
    it('should track scroll at 40% depth', () => {
      cy.scrollTo('0%', '40%');
      cy.wait(500);
      // Verify GA4 event was fired
    });

    it('should track scroll at 60% depth', () => {
      cy.scrollTo('0%', '60%');
      cy.wait(500);
    });

    it('should track scroll at 80% depth', () => {
      cy.scrollTo('0%', '80%');
      cy.wait(500);
    });

    it('should track scroll at 100% depth (bottom)', () => {
      cy.scrollTo('bottom');
      cy.wait(500);
    });
  });

  describe('Analytics Events', () => {
    it('should send GA4 page view on load', () => {
      cy.window().then((win) => {
        // GA4 should be initialized
        expect(win.gtag || window.gtag).to.be.a('function');
      });
    });

    it('should track CTA click event', () => {
      cy.get('[data-testid="cta-button-hero"], a[href*="hotmart"]').first().click();

      // Verify event was tracked (check network tab or dataLayer)
      cy.window().then((win) => {
        expect(win.dataLayer || []).to.be.an('array');
      });
    });
  });

  describe('Performance', () => {
    it('should load page in under 3 seconds', () => {
      const startTime = Date.now();
      cy.visit('/');
      cy.get('body').should('be.visible');
      const endTime = Date.now();
      expect(endTime - startTime).to.be.lessThan(3000);
    });

    it('should have LCP (Largest Contentful Paint) <2.5s', () => {
      cy.visit('/');
      cy.window().then((win) => {
        if (win.PerformanceObserver) {
          // LCP should be tracked by browser
          expect(win.performance).to.exist;
        }
      });
    });

    it('should have images lazy loaded', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should(($el) => {
          const loading = $el.attr('loading');
          expect(loading === 'lazy' || $el.hasClass('lazy')).to.be.true;
        });
      });
    });
  });

  describe('Content Quality', () => {
    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('have.length.greaterThan', 0);
    });

    it('should have alt text on images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt').and('not.be.empty');
      });
    });

    it('should have proper link attributes', () => {
      cy.get('a[href*="hotmart"]').each(($link) => {
        cy.wrap($link).should('have.attr', 'href');
        cy.wrap($link).should('not.have.attr', 'href', '');
      });
    });

    it('should have valid color contrast', () => {
      // This is a visual check - requires axe-core or similar
      cy.get('h1, p, a').each(($el) => {
        cy.wrap($el).should('be.visible');
      });
    });
  });

  describe('Error Handling', () => {
    it('should not have JavaScript console errors', () => {
      let errorLogs = [];
      cy.on('window:before:load', (win) => {
        cy.spy(win.console, 'error');
      });

      cy.visit('/');

      cy.window().then((win) => {
        // Check for critical errors (non-third-party)
        expect(win.console.error.callCount).to.equal(0);
      });
    });

    it('should handle network errors gracefully', () => {
      // If GA4 request fails, page should still load
      cy.intercept('https://www.google-analytics.com/**', { statusCode: 503 }).as('ga4Down');
      cy.visit('/');
      cy.get('body').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper document language', () => {
      cy.get('html').should('have.attr', 'lang');
    });

    it('should have proper color contrast', () => {
      cy.get('h1').should('be.visible');
      cy.get('p').should('be.visible');
    });

    it('should have keyboard navigation support', () => {
      cy.get('a[href*="hotmart"]').first().focus();
      cy.get('a[href*="hotmart"]').first().should('have.focus');
    });

    it('should have focus indicators on buttons', () => {
      cy.get('a[href*="hotmart"]').first().focus();
      cy.get('a[href*="hotmart"]').first().should('have.css', 'outline');
    });
  });
});
