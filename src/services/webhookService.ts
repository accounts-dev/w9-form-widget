// n8n Webhook Service
// Sends form lifecycle events to n8n webhook triggers
//
// In n8n, create a Webhook node for each event, or a single webhook
// that routes based on the `event` field in the payload.

// ─── Configuration ───
// Set your n8n webhook URL here. In n8n:
// 1. Add a "Webhook" trigger node
// 2. Set method to POST
// 3. Copy the Production or Test URL and paste it below
//
// You can use one webhook URL for all events (recommended)
// and route inside n8n with an IF/Switch node on `body.event`

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export type WebhookEvent = 'form.opened' | 'form.started' | 'form.progress' | 'form.completed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  source: 'tracked' | 'anonymous';  // tracked = URL params, anonymous = direct access
  investor: {
    email: string;
    name: string;
  };
  sendTo?: string;   // email address to send the completed form to (for anonymous submissions)
  formLink: string;  // The unique link for this investor
  progress?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    percentComplete: number;
  };
  formData?: Record<string, any>;
  pdf?: {
    base64: string;       // The filled PDF as base64
    filename: string;
  };
}

/**
 * Build the investor-specific form link from email + name
 */
function buildFormLink(email: string, name: string): string {
  const base = 'https://accounts-dev.github.io/w9-form-widget/';
  const params = new URLSearchParams({ email, name });
  return `${base}?${params.toString()}`;
}

/**
 * Fire a webhook event to n8n.
 * Fails silently (logs to console) so it never blocks the user.
 */
async function fireWebhook(payload: WebhookPayload): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('[Webhook] No n8n webhook URL configured. Set VITE_N8N_WEBHOOK_URL in .env');
    console.log('[Webhook] Payload that would be sent:', JSON.stringify(payload, null, 2));
    return false;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Webhook] n8n responded with ${response.status}: ${response.statusText}`);
      return false;
    }

    console.log(`[Webhook] ${payload.event} sent successfully for investor ${payload.investor.email}`);
    return true;
  } catch (err) {
    console.error('[Webhook] Failed to reach n8n:', err);
    return false;
  }
}

// ─── Public API ───

/**
 * Investor opened the form link for the first time
 */
export function notifyFormOpened(investorEmail: string, investorName: string): void {
  fireWebhook({
    event: 'form.opened',
    timestamp: new Date().toISOString(),
    source: 'tracked',
    investor: { email: investorEmail, name: investorName },
    formLink: buildFormLink(investorEmail, investorName),
  });
}

/**
 * Investor started filling out the form (moved past step 0)
 */
export function notifyFormStarted(investorEmail: string, investorName: string): void {
  fireWebhook({
    event: 'form.started',
    timestamp: new Date().toISOString(),
    source: 'tracked',
    investor: { email: investorEmail, name: investorName },
    formLink: buildFormLink(investorEmail, investorName),
  });
}

/**
 * Investor progressed to a new step
 */
export function notifyFormProgress(
  investorEmail: string,
  investorName: string,
  currentStep: number,
  totalSteps: number,
  stepName: string
): void {
  fireWebhook({
    event: 'form.progress',
    timestamp: new Date().toISOString(),
    source: 'tracked',
    investor: { email: investorEmail, name: investorName },
    formLink: buildFormLink(investorEmail, investorName),
    progress: {
      currentStep,
      totalSteps,
      stepName,
      percentComplete: Math.round((currentStep / totalSteps) * 100),
    },
  });
}

/**
 * Investor completed and downloaded the form.
 * Sends the filled PDF as base64 so n8n can email it.
 */
export async function notifyFormCompleted(
  investorEmail: string,
  investorName: string,
  formData: Record<string, any>,
  pdfBytes: Uint8Array
): Promise<boolean> {
  // Convert PDF bytes to base64
  const base64 = uint8ArrayToBase64(pdfBytes);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = investorName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `W9_${safeName}_${timestamp}.pdf`;

  // Strip sensitive fields before sending
  const safeFormData = { ...formData };
  delete safeFormData.ssn;
  delete safeFormData.ein;
  delete safeFormData.iraEin;
  delete safeFormData.signature;

  // Determine if this is a tracked investor (URL params) or anonymous (direct access)
  const isAnonymous = investorEmail === 'pedro@infinitecashflow.com';

  return fireWebhook({
    event: 'form.completed',
    timestamp: new Date().toISOString(),
    source: isAnonymous ? 'anonymous' : 'tracked',
    investor: { email: investorEmail, name: investorName },
    ...(isAnonymous && { sendTo: 'pedro@infinitecashflow.com' }),
    formLink: isAnonymous ? '' : buildFormLink(investorEmail, investorName),
    formData: safeFormData,
    pdf: { base64, filename },
  });
}

// ─── Helpers ───

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
