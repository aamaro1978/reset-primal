const logger = require('../utils/logger');

class TrackingService {
  /**
   * Track purchase event in Google Analytics 4
   * @param {Object} params - Tracking parameters
   * @param {string} params.userId - User ID for GA4
   * @param {number} params.purchaseValue - Purchase amount in BRL
   * @param {string} params.transactionId - Transaction ID
   * @param {string} params.productName - Product name
   * @returns {Promise<void>}
   */
  async trackGA4Purchase({ userId, purchaseValue, transactionId, productName }) {
    if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
      logger.debug('[TRACKING] GA4 not configured, skipping');
      return;
    }

    try {
      const response = await fetch('https://www.google-analytics.com/mp/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          measurement_id: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
          api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET,
          client_id: userId.substring(0, 32),
          events: [
            {
              name: 'purchase',
              params: {
                value: purchaseValue,
                currency: 'BRL',
                transaction_id: transactionId,
                items: [
                  {
                    item_name: productName,
                    price: purchaseValue,
                    currency: 'BRL'
                  }
                ]
              }
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`GA4 API returned ${response.status}`);
      }

      logger.debug('[TRACKING] GA4 purchase tracked', {
        transactionId,
        value: purchaseValue
      });
    } catch (error) {
      logger.warn('[TRACKING] Failed to track GA4 purchase', error);
      // Don't throw - tracking failures shouldn't break the purchase flow
    }
  }

  /**
   * Track purchase event in Facebook Pixel
   * @param {Object} params - Tracking parameters
   * @param {string} params.userEmail - Customer email
   * @param {number} params.purchaseValue - Purchase amount in BRL
   * @param {string} params.transactionId - Transaction ID
   * @param {string} params.productName - Product name
   * @returns {Promise<void>}
   */
  async trackFacebookPixel({ userEmail, purchaseValue, transactionId, productName }) {
    if (!process.env.FACEBOOK_PIXEL_ID) {
      logger.debug('[TRACKING] Facebook Pixel not configured, skipping');
      return;
    }

    try {
      const response = await fetch('https://graph.facebook.com/v18.0/pixel/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: transactionId,
              user_data: {
                em: this._hashEmail(userEmail),
                external_id: transactionId
              },
              custom_data: {
                value: purchaseValue,
                currency: 'BRL',
                content_name: productName,
                content_type: 'product',
                content_id: productName
              }
            }
          ],
          access_token: process.env.FACEBOOK_PIXEL_TOKEN
        })
      });

      if (!response.ok) {
        throw new Error(`Facebook Pixel API returned ${response.status}`);
      }

      logger.debug('[TRACKING] Facebook Pixel purchase tracked', {
        transactionId,
        value: purchaseValue
      });
    } catch (error) {
      logger.warn('[TRACKING] Failed to track Facebook Pixel purchase', error);
      // Don't throw - tracking failures shouldn't break the purchase flow
    }
  }

  /**
   * Hash email for Facebook Pixel (SHA-256)
   * @param {string} email - Email to hash
   * @returns {string} - Hashed email
   * @private
   */
  _hashEmail(email) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(email.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Track page view in Google Analytics 4
   * @param {Object} params - Tracking parameters
   * @param {string} params.userId - User ID for GA4
   * @param {string} params.pageTitle - Page title
   * @param {string} params.pagePath - Page path
   * @returns {Promise<void>}
   */
  async trackGA4PageView({ userId, pageTitle, pagePath }) {
    if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
      return;
    }

    try {
      await fetch('https://www.google-analytics.com/mp/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          measurement_id: process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
          api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET,
          client_id: userId.substring(0, 32),
          events: [
            {
              name: 'page_view',
              params: {
                page_title: pageTitle,
                page_path: pagePath
              }
            }
          ]
        })
      });

      logger.debug('[TRACKING] GA4 page view tracked', { pagePath });
    } catch (error) {
      logger.warn('[TRACKING] Failed to track GA4 page view', error);
    }
  }
}

module.exports = new TrackingService();
