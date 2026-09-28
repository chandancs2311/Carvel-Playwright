require('dotenv').config();

/**
 * Central Test Data Configuration
 * Strictly references environment variables to avoid exposing sensitive test data.
 */
const rawCard = (process.env.PAYMENT_CARD_NUMBER || '').replace(/\s+/g, '');
const last4 = rawCard.length >= 4 ? rawCard.slice(-4) : '1111';

const testData = {
  baseUrl: process.env.BASE_URL || '',

  // User credentials
  user: {
    email: process.env.USER_EMAIL || '',
    password: process.env.USER_PASSWORD || '',
  },

  // Store location selection
  location: {
    searchAddress: process.env.TEST_ADDRESS || '26 Broadway, New York, NY 10004',
    selectedAddressResult:
      process.env.TEST_ADDRESS_RESULT || '26 Broadway, New York, NY 10004, USA',
  },

  // Smoke test product configuration
  order: {
    category: 'Ice Cream',
    product: 'Scooped Ice Cream',
    modifier: 'Medium Cup',
    expectedItemCount: 1,
  },

  // Payment details & saved card verification
  payment: {
    cardNumber: process.env.PAYMENT_CARD_NUMBER || '',
    expirationDate: process.env.PAYMENT_EXP_DATE || '',
    securityCode: process.env.PAYMENT_CVV || '',
    postalCode: process.env.PAYMENT_POSTAL_CODE || '',
    savedCard: {
      expectedLast4: last4,
      expectedExp: process.env.PAYMENT_EXP_DATE || '12/35',
    },
  },

  // Backward-compatibility direct reference
  address: process.env.TEST_ADDRESS || '',
};

module.exports = testData;
