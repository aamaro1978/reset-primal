module.exports = {
  e2e: {
    baseUrl: 'http://64.225.44.199',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Hook para capturar Network requests
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
    env: {
      // GA4 test environment
      GA4_MEASUREMENT_ID: 'G-KKTGW6BEJP',
      FACEBOOK_PIXEL_ID: '1164114415287965'
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
};
