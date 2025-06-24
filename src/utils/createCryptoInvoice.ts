export async function createCryptoInvoice(productId: string, userId: string) {
  try {
    const response = await fetch('/api/create-crypto-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, userId }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Failed to create crypto invoice');
    }

    const data = await response.json();
    return data.invoiceUrl; // This is the hosted Helio checkout link
  } catch (error) {
    console.error('Crypto Invoice Creation Error:', error);
    throw error;
  }
}
