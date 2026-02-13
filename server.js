// API Server for W9 Form Widget
// Receives POST { email, name } and returns the investor-specific form link.
//
// Run: node server.js
// Or:  npm run server

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

const BASE_FORM_URL = process.env.FORM_BASE_URL || 'https://accounts-dev.github.io/w9-form-widget/';

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`W9 API server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/generate-link`);
  console.log(`  Body: { "email": "...", "name": "..." }`);
});
