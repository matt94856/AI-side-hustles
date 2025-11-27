// Lightweight API client wrapper around Netlify Functions
// Centralizes error handling and response validation.

const APIClient = (() => {
  const BASE_PATH = '/.netlify/functions';

  async function callFunction(name, payload) {
    const response = await fetch(`${BASE_PATH}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Invalid JSON response from ${name}`);
    }

    if (!response.ok || data.error) {
      const message = data.error || `Request to ${name} failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  }

  async function getPurchases(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required for getPurchases');
    }

    const result = await callFunction('supabaseHandler', {
      action: 'getPurchases',
      user: { id: userId },
    });

    return Array.isArray(result.data) ? result.data : [];
  }

  async function addPurchase(purchaseData) {
    if (!purchaseData || typeof purchaseData !== 'object') {
      throw new Error('purchaseData object is required');
    }

    if (!purchaseData.user_id || !purchaseData.tutorial_id) {
      throw new Error('purchaseData.user_id and purchaseData.tutorial_id are required');
    }

    const result = await callFunction('supabaseHandler', {
      action: 'addPurchase',
      user: { id: purchaseData.user_id },
      data: purchaseData,
    });

    return !!result.success;
  }

  async function getStatus() {
    const response = await fetch(`${BASE_PATH}/status`);
    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}`);
    }
    return response.json();
  }

  return {
    getPurchases,
    addPurchase,
    getStatus,
  };
})();

window.apiClient = APIClient;


