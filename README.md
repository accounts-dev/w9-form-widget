# W9 Form Widget

An embeddable React widget that allows users to fill out W-9 forms and generate completed PDFs.

## Features

- 📝 Multi-step form wizard with validation
- ✅ Conditional logic (LLC classification, etc.)
- ✍️ Dual signature modes: drawn or typed
- 📄 Real-time PDF preview
- ⬇️ One-click download of completed W-9
- 🎨 Customizable styling via CSS variables
- 📱 Fully responsive design

## Quick Start

### Embed on Your Website

Add this to your HTML:

```html
<!-- Container where the widget will render -->
<div id="w9-form"></div>

<!-- Load the widget script (replace with your GitHub Pages URL) -->
<script src="https://YOUR_USERNAME.github.io/w9-form-widget/w9-widget.iife.js"></script>

<!-- Initialize the widget -->
<script>
  W9Widget.init('#w9-form');
</script>
```

### With Custom Configuration

```html
<script>
  W9Widget.init('#w9-form', {
    theme: {
      primaryColor: '#8b5cf6', // Purple theme
      fontFamily: 'Inter, sans-serif'
    }
  });
</script>
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── components/
│   ├── FormWizard.tsx      # Main form wizard container
│   ├── StepIdentity.tsx    # Step 1: Name & Business
│   ├── StepTaxClassification.tsx  # Step 2: Tax type
│   ├── StepAddressTIN.tsx  # Step 3: Address & TIN
│   ├── StepSignature.tsx   # Step 4: Signature
│   └── PDFPreview.tsx      # Preview & download
├── services/
│   └── pdfService.ts       # PDF generation with pdf-lib
├── types.ts                # TypeScript interfaces
├── styles.css              # Widget styles
├── main.tsx                # Dev entry point
└── widget.tsx              # Production widget entry
```

## Customization

### CSS Variables

Override these CSS variables to customize the appearance:

```css
:root {
  --w9-primary-color: #2563eb;
  --w9-primary-hover: #1d4ed8;
  --w9-secondary-color: #64748b;
  --w9-success-color: #10b981;
  --w9-error-color: #ef4444;
  --w9-border-color: #e2e8f0;
  --w9-bg-color: #ffffff;
  --w9-text-color: #1e293b;
  --w9-font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --w9-border-radius: 8px;
}
```

## Deployment

The widget automatically deploys to GitHub Pages when you push to the `main` branch.

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select "GitHub Actions"
4. Your widget will be available at `https://YOUR_USERNAME.github.io/w9-form-widget/`

## License

MIT
