// services/mockPayment.js
// Mock payment service for testing without real payment processor credentials
// Simulates Flutterwave API responses for development and testing

const { v4: uuidv4 } = require('uuid');

// Simulate payment delay
const PAYMENT_DELAY = 2000; // 2 seconds

/**
 * Create a mock subaccount for an artist.
 * Simulates Flutterwave subaccount creation.
 */
async function createSubaccount({ displayName, email, phone, provider }) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const subaccountId = `mock_sub_${uuidv4()}`;
  
  return { 
    subaccountId,
    message: 'Mock subaccount created successfully'
  };
}

/**
 * Create a mock payment charge.
 * Simulates Flutterwave payment creation with automatic success for testing.
 */
async function createMobileMoneyCharge({
  txRef,
  amount,
  currency = 'RWF',
  email,
  phone,
  subaccountId,
  artworkTitle,
  redirectUrl,
}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, PAYMENT_DELAY));

  const mockTransactionId = `mock_tx_${uuidv4()}`;
  const mockPaymentLink = `${redirectUrl}${txRef}`;

  // Simulate successful payment response
  return {
    status: 'success',
    message: 'Mock payment initiated successfully',
    data: {
      id: mockTransactionId,
      tx_ref: txRef,
      amount: Number(amount),
      currency: currency,
      status: 'pending', // Will be completed via verification
      payment_link: mockPaymentLink,
      link: mockPaymentLink,
      customer: {
        email,
        phonenumber: phone,
      },
      meta: {
        tx_ref: txRef,
        mode: 'mock',
      },
    },
  };
}

/**
 * Verify a mock transaction.
 * Simulates Flutterwave transaction verification.
 * For testing, this will randomly return successful or failed status.
 */
async function verifyTransaction(transactionId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For testing, we'll make it successful 90% of the time
  const isSuccess = Math.random() > 0.1;

  return {
    status: 'success',
    message: 'Transaction verified',
    data: {
      id: transactionId,
      status: isSuccess ? 'successful' : 'failed',
      amount: 0, // Would be actual amount in real implementation
      currency: 'RWF',
      processor_response: isSuccess ? 'Transaction successful' : 'Transaction failed',
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Verify mock webhook signature.
 * Always returns true for mock mode.
 */
function verifyWebhookSignature(headerHash) {
  return true; // Mock mode always accepts webhooks
}

// Provider codes for Rwanda mobile money (matching Flutterwave)
const RW_PROVIDER_BANK = { MMT: 'MPS', AIR: 'AIR' };

module.exports = {
  createSubaccount,
  createMobileMoneyCharge,
  verifyTransaction,
  verifyWebhookSignature,
  RW_PROVIDER_BANK,
};
