// services/flutterwave.js
// Thin wrapper around the Flutterwave v3 REST API. All money amounts are
// passed in as Numbers (RWF, integer francs). The wrapper never logs
// secrets or full request bodies - only status codes and tx_refs.

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.FLW_BASE_URL || 'https://api.flutterwave.com/v3';

function client() {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 25000,
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

// Provider codes accepted by Flutterwave for Rwanda mobile money.
// MMT = MTN MoMo Rwanda, AIR = Airtel Money Rwanda.
const RW_PROVIDER_BANK = { MMT: 'MPS', AIR: 'AIR' };

/**
 * Create a Flutterwave subaccount for an artist.
 * Returns { subaccountId } on success or throws an Error with a public message.
 */
async function createSubaccount({ displayName, email, phone, provider }) {
  if (!process.env.FLW_SECRET_KEY) {
    throw new Error('FLW_SECRET_KEY is not configured');
  }
  const accountBank = RW_PROVIDER_BANK[provider];
  if (!accountBank) {
    throw new Error(`unsupported mobile provider: ${provider}`);
  }
  // Normalize phone to digits only
  const accountNumber = String(phone || '').replace(/[^0-9]/g, '');

  const body = {
    account_bank: accountBank,
    account_number: accountNumber,
    business_name: displayName,
    business_email: email,
    business_contact: displayName,
    business_contact_mobile: accountNumber,
    country: 'RW',
    split_type: 'percentage',
    split_value: 5, // platform takes 5%
  };

  try {
    const { data } = await client().post('/subaccounts', body);
    if (data.status !== 'success' || !data.data || !data.data.subaccount_id) {
      const msg = (data && data.message) || 'failed to create subaccount';
      throw new Error(msg);
    }
    return { subaccountId: data.data.subaccount_id };
  } catch (err) {
    const flwMsg = err.response && err.response.data && err.response.data.message;
    throw new Error(flwMsg || err.message || 'flutterwave subaccount error');
  }
}

/**
 * Create a payment charge supporting both international cards and Rwanda mobile money.
 * Returns the full Flutterwave response data.
 * The subaccount_id attached routes 5% to the platform automatically.
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
  if (!process.env.FLW_SECRET_KEY) {
    throw new Error('FLW_SECRET_KEY is not configured');
  }
  const body = {
    tx_ref: txRef,
    amount: Number(amount),
    currency,
    // Support both international cards and Rwanda mobile money
    payment_options: 'card, mobilemoneyrwanda, account',
    redirect_url: redirectUrl,
    customer: {
      email,
      phonenumber: String(phone || '').replace(/[^0-9]/g, ''),
      name: email.split('@')[0],
    },
    customizations: {
      title: 'Kartz Art Purchase',
      description: artworkTitle || 'Artwork purchase',
      logo: 'https://your-logo-url.com/logo.png', // Update with actual logo URL
    },
    meta: {
      tx_ref: txRef,
      mode: 'both', // Allow both card and mobile money
    },
  };
  if (subaccountId) body.subaccount_id = subaccountId;

  try {
    const { data } = await client().post('/payments', body);
    return data;
  } catch (err) {
    const flwMsg = err.response && err.response.data && err.response.data.message;
    const e = new Error(flwMsg || err.message || 'flutterwave charge error');
    e.status = err.response ? err.response.status : 500;
    throw e;
  }
}

/**
 * Verify a Flutterwave transaction by transaction id. Used for the
 * /api/orders/:id/verify endpoint so the frontend can poll the order
 * status after a mobile-money prompt.
 */
async function verifyTransaction(transactionId) {
  if (!transactionId) throw new Error('transaction id required');
  try {
    const { data } = await client().get(`/transactions/${transactionId}/verify`);
    return data;
  } catch (err) {
    const flwMsg = err.response && err.response.data && err.response.data.message;
    throw new Error(flwMsg || err.message || 'flutterwave verify error');
  }
}

/**
 * Verify the signature on a webhook payload. Flutterwave sends
 * `verifi-hash` in the headers; we compare with FLW_SECRET_HASH in
 * constant time. Always return a boolean, never throw.
 */
function verifyWebhookSignature(headerHash) {
  const expected = process.env.FLW_SECRET_HASH;
  if (!expected) return false;
  if (!headerHash || typeof headerHash !== 'string') return false;
  // timingSafeEqual requires equal-length buffers, so we hash both
  const a = crypto.createHash('sha256').update(headerHash).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  createSubaccount,
  createMobileMoneyCharge,
  verifyTransaction,
  verifyWebhookSignature,
  RW_PROVIDER_BANK,
};
