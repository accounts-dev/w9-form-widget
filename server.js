// API Server for W9 Form Widget
// - POST /api/generate-link  → returns investor-specific form link
// - POST /api/send-w9-email  → sends completed W9 PDF via email
//
// Run: node server.js
// Or:  npm run server
//
// Required env vars for email:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

const BASE_FORM_URL = process.env.FORM_BASE_URL || 'https://accounts-dev.github.io/w9-form-widget/';

app.use(cors({
  origin: [
    'https://accounts-dev.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
}));
app.use(express.json({ limit: '10mb' })); // larger limit for PDF base64

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SMTP transporter (lazy-init) ───
let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.error('[Email] Missing SMTP config. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

// POST /api/generate-link
// Body: { email: string, name: string }
// Returns: { formLink: string, investor: { email, name } }
app.post('/api/generate-link', (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Both "email" and "name" are required.',
    });
  }

  const params = new URLSearchParams({ email, name });
  const formLink = `${BASE_FORM_URL}?${params.toString()}`;

  return res.json({
    formLink,
    investor: { email, name },
  });
});

// POST /api/send-w9-email
// Body: { submitterName, formData, pdf: { base64, filename } }
// Sends the completed W9 PDF to pedro@infinitecashflow.com
app.post('/api/send-w9-email', async (req, res) => {
  const { submitterName, formData, pdf } = req.body;

  if (!pdf?.base64 || !pdf?.filename) {
    return res.status(400).json({
      error: 'Missing PDF data',
      message: '"pdf.base64" and "pdf.filename" are required.',
    });
  }

  const mail = getTransporter();
  if (!mail) {
    return res.status(500).json({
      error: 'Email not configured',
      message: 'SMTP credentials are not set on the server.',
    });
  }

  const recipientEmail = process.env.W9_RECIPIENT_EMAIL || 'pedro@infinitecashflow.com';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await mail.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: `W9 Form Submitted – ${submitterName || 'Anonymous'}`,
      html: `
        <h2>New W9 Form Submission</h2>
        <p><strong>Submitted by:</strong> ${submitterName || 'Anonymous'}</p>
        ${formData ? `
        <h3>Form Details</h3>
        <ul>
          ${formData.accountType ? `<li><strong>Account Type:</strong> ${formData.accountType}</li>` : ''}
          ${formData.name ? `<li><strong>Name:</strong> ${formData.name}</li>` : ''}
          ${formData.businessName ? `<li><strong>Business:</strong> ${formData.businessName}</li>` : ''}
          ${formData.address ? `<li><strong>Address:</strong> ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}</li>` : ''}
          ${formData.tinType ? `<li><strong>TIN Type:</strong> ${formData.tinType === 'ssn' ? 'SSN' : 'EIN'}</li>` : ''}
        </ul>` : ''}
        <p>The completed W9 PDF is attached.</p>
      `,
      attachments: [
        {
          filename: pdf.filename,
          content: pdf.base64,
          encoding: 'base64',
        },
      ],
    });

    console.log(`[Email] W9 sent to ${recipientEmail} for ${submitterName}`);
    return res.json({ success: true, message: `Email sent to ${recipientEmail}` });
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return res.status(500).json({ error: 'Failed to send email', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`W9 API server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/generate-link`);
  console.log(`POST http://localhost:${PORT}/api/send-w9-email`);
});
