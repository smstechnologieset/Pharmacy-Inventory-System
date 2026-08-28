import { getAuthHeaders } from './apiHelper';

const API_URL = import.meta.env.VITE_API_URL || 'https://pharmacy-inventory-system-production-6e12.up.railway.app/api';

/**
 * Initialize payment with Chapa
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @returns {Promise<{checkoutUrl: string, txRef: string}>}
 */
export const initializePayment = async (billingCycle) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/payments/initialize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ billingCycle })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to initialize payment');
    }

    return result;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

/**
 * Verify payment status
 * @param {string} txRef - Transaction reference
 * @returns {Promise<{status: string, amount: number, tier: string, billingCycle: string}>}
 */
export const verifyPaymentStatus = async (txRef) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${API_URL}/payments/verify?tx_ref=${txRef}`,
      { headers }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment');
    }

    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

/**
 * Retry failed payment
 * @param {string} txRef - Previous transaction reference
 * @returns {Promise<{checkoutUrl: string, txRef: string}>}
 */
export const retryPayment = async (txRef) => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/payments/retry`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tx_ref: txRef })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retry payment');
    }

    return result;
  } catch (error) {
    console.error('Payment retry error:', error);
    throw error;
  }
};
