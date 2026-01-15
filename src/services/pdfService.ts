import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { W9FormData } from '../types';

// Base64 encoded empty W9 PDF will be embedded here during build
// For now, we'll fetch it from the public folder
const W9_PDF_URL = './W9 Form Empty (1).pdf';

export async function generateFilledW9PDF(formData: W9FormData): Promise<Uint8Array> {
  // Fetch the empty W9 PDF template
  const existingPdfBytes = await fetch(W9_PDF_URL).then(res => {
    if (!res.ok) throw new Error('Failed to load W9 PDF template');
    return res.arrayBuffer();
  });

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  // Get page dimensions
  const { height } = firstPage.getSize();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Define text color
  const textColor = rgb(0, 0, 0);
  const fontSize = 10;

  // Helper function to draw text at specific coordinates
  const drawText = (text: string, x: number, y: number, options: { size?: number; font?: typeof helvetica } = {}) => {
    firstPage.drawText(text, {
      x,
      y: height - y, // PDF coordinates start from bottom-left
      size: options.size || fontSize,
      font: options.font || helvetica,
      color: textColor,
    });
  };

  // Helper function to draw a checkmark
  const drawCheckmark = (x: number, y: number) => {
    firstPage.drawText('X', {
      x,
      y: height - y,
      size: 12,
      font: helveticaBold,
      color: textColor,
    });
  };

  // ============================================
  // FILL IN FORM FIELDS
  // Coordinates adjusted for W9 form (March 2024 revision)
  // Y coordinates are from TOP of page
  // ============================================

  // Line 1: Name (field is below the label "Name of entity/individual...")
  if (formData.name) {
    drawText(formData.name, 45, 119);
  }

  // Line 2: Business name/disregarded entity name
  if (formData.businessName) {
    drawText(formData.businessName, 45, 145);
  }

  // Line 3a: Federal Tax Classification checkboxes
  // These are the checkbox positions on the form
  const taxClassificationPositions: Record<string, { x: number; y: number }> = {
    individual: { x: 36, y: 182 },
    cCorporation: { x: 154, y: 182 },
    sCorporation: { x: 229, y: 182 },
    partnership: { x: 304, y: 182 },
    trustEstate: { x: 365, y: 182 },
    llc: { x: 36, y: 197 },
    other: { x: 36, y: 232 }
  };

  if (formData.taxClassification && taxClassificationPositions[formData.taxClassification]) {
    const pos = taxClassificationPositions[formData.taxClassification];
    drawCheckmark(pos.x, pos.y);
  }

  // LLC Classification letter (in the entry space after "Enter the tax classification")
  if (formData.taxClassification === 'llc' && formData.llcClassification) {
    drawText(formData.llcClassification.toUpperCase(), 385, 197);
  }

  // Other description
  if (formData.taxClassification === 'other' && formData.otherDescription) {
    drawText(formData.otherDescription, 115, 232);
  }

  // Line 4: Exemptions (right side of form)
  if (formData.exemptPayeeCode) {
    drawText(formData.exemptPayeeCode, 518, 165);
  }
  if (formData.fatcaExemptionCode) {
    drawText(formData.fatcaExemptionCode, 518, 209);
  }

  // Requester's name and address (optional field on right side)
  // Skip this as it's usually filled by the requester

  // Line 5: Address (number, street, apt/suite)
  if (formData.address) {
    drawText(formData.address, 45, 278);
  }

  // Line 6: City, State, ZIP code
  const cityStateZip = [formData.city, formData.state, formData.zipCode]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) {
    drawText(cityStateZip, 45, 303);
  }

  // Line 7: List account number(s) (optional)
  if (formData.accountNumbers) {
    drawText(formData.accountNumbers, 45, 328);
  }

  // Part I: TIN - Social Security Number (SSN)
  // The SSN boxes are on the right side, format: XXX-XX-XXXX
  if (formData.tinType === 'ssn' && formData.ssn) {
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    if (ssnDigits.length >= 9) {
      // Draw each digit in its box - SSN section
      // First 3 digits
      drawText(ssnDigits[0], 512, 361);
      drawText(ssnDigits[1], 524, 361);
      drawText(ssnDigits[2], 536, 361);
      // Middle 2 digits
      drawText(ssnDigits[3], 555, 361);
      drawText(ssnDigits[4], 567, 361);
      // Last 4 digits
      drawText(ssnDigits[5], 586, 361);
      drawText(ssnDigits[6], 598, 361);
      drawText(ssnDigits[7], 610, 361);
      drawText(ssnDigits[8], 622, 361);
    }
  }
  
  // Part I: TIN - Employer Identification Number (EIN)
  // The EIN boxes are below SSN, format: XX-XXXXXXX
  if (formData.tinType === 'ein' && formData.ein) {
    const einDigits = formData.ein.replace(/\D/g, '');
    if (einDigits.length >= 9) {
      // First 2 digits
      drawText(einDigits[0], 512, 398);
      drawText(einDigits[1], 524, 398);
      // Last 7 digits
      drawText(einDigits[2], 543, 398);
      drawText(einDigits[3], 555, 398);
      drawText(einDigits[4], 567, 398);
      drawText(einDigits[5], 579, 398);
      drawText(einDigits[6], 591, 398);
      drawText(einDigits[7], 603, 398);
      drawText(einDigits[8], 615, 398);
    }
  }

  // Part II: Signature area (at the bottom of the form)
  // "Sign Here" section
  if (formData.signature) {
    if (formData.signatureType === 'drawn') {
      // Embed signature image
      try {
        // Convert base64 data URL to bytes
        const signatureData = formData.signature.split(',')[1];
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        
        // Embed as PNG
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        // Scale signature to fit the signature field
        const sigWidth = 180;
        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
        
        // Draw signature image in the signature field area
        firstPage.drawImage(signatureImage, {
          x: 75,
          y: height - 740,
          width: sigWidth,
          height: Math.min(sigHeight, 30), // Cap height to fit field
        });
      } catch (error) {
        console.error('Failed to embed signature image:', error);
        // Fallback: draw signature as text
        drawText('[Signature on file]', 75, 733);
      }
    } else {
      // Typed signature - use a larger font for visibility
      drawText(formData.signature, 75, 733, { size: 12 });
    }
  }

  // Signature date (right side of signature line)
  if (formData.signatureDate) {
    const dateStr = new Date(formData.signatureDate).toLocaleDateString('en-US');
    drawText(dateStr, 470, 733);
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper function to create a download link
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'W9-Filled.pdf') {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Helper function to create a preview URL
export function createPDFPreviewURL(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
