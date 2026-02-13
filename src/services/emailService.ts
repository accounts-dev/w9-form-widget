// Direct Email Service
// For anonymous submissions (no URL params), sends the completed W9 PDF
// directly via the API server — no webhooks involved.

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Send the completed W9 PDF to pedro@infinitecashflow.com via the API server.
 * Used only for anonymous submissions (no URL params).
 */
export async function sendW9Email(
  submitterName: string,
  formData: Record<string, any>,
  pdfBytes: Uint8Array
): Promise<boolean> {
  if (!API_URL) {
    console.warn('[Email] No API URL configured. Set VITE_API_URL in .env');
    return false;
  }

  const base64 = uint8ArrayToBase64(pdfBytes);

  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = submitterName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `W9_${safeName}_${timestamp}.pdf`;

  // Strip sensitive fields
  const safeFormData = { ...formData };
  delete safeFormData.ssn;
  delete safeFormData.ein;
  delete safeFormData.iraEin;
  delete safeFormData.signature;

  try {
    const response = await fetch(`${API_URL}/api/send-w9-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitterName,
        formData: safeFormData,
        pdf: { base64, filename },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[Email] Server responded with error:', err);
      return false;
    }

    console.log(`[Email] W9 sent successfully for ${submitterName}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to reach API server:', err);
    return false;
  }
}
