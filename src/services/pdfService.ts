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
  // These coordinates are approximate and may need adjustment
  // based on the actual W9 PDF template layout
  // ============================================

  // Line 1: Name
  if (formData.name) {
    drawText(formData.name, 65, 142);
  }

  // Line 2: Business name
  if (formData.businessName) {
    drawText(formData.businessName, 65, 167);
  }

  // Line 3: Federal Tax Classification checkboxes
  // Approximate checkbox positions (x coordinates for each classification)
  const taxClassificationPositions: Record<string, number> = {
    individual: 65,
    cCorporation: 165,
    sCorporation: 215,
    partnership: 265,
    trustEstate: 331,
    llc: 410,
    other: 530
  };

  if (formData.taxClassification && taxClassificationPositions[formData.taxClassification]) {
    drawCheckmark(taxClassificationPositions[formData.taxClassification], 198);
  }

  // LLC Classification letter
  if (formData.taxClassification === 'llc' && formData.llcClassification) {
    drawText(formData.llcClassification, 445, 198);
  }

  // Other description
  if (formData.taxClassification === 'other' && formData.otherDescription) {
    drawText(formData.otherDescription, 553, 198);
  }

  // Line 4: Exemptions
  if (formData.exemptPayeeCode) {
    drawText(formData.exemptPayeeCode, 505, 215);
  }
  if (formData.fatcaExemptionCode) {
    drawText(formData.fatcaExemptionCode, 505, 230);
  }

  // Line 5: Address
  if (formData.address) {
    drawText(formData.address, 65, 250);
  }

  // Line 6: City, State, ZIP
  const cityStateZip = [formData.city, formData.state, formData.zipCode]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) {
    drawText(cityStateZip, 65, 275);
  }

  // Line 7: Account numbers (if provided)
  if (formData.accountNumbers) {
    drawText(formData.accountNumbers, 65, 300);
  }

  // Part I: TIN - SSN or EIN
  if (formData.tinType === 'ssn' && formData.ssn) {
    // SSN boxes - typically 3 boxes for XXX-XX-XXXX format
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    // Position for SSN (right side of form)
    drawText(ssnDigits.substring(0, 3), 506, 299);
    drawText(ssnDigits.substring(3, 5), 545, 299);
    drawText(ssnDigits.substring(5, 9), 573, 299);
  } else if (formData.tinType === 'ein' && formData.ein) {
    // EIN boxes - typically 2 boxes for XX-XXXXXXX format
    const einDigits = formData.ein.replace(/\D/g, '');
    drawText(einDigits.substring(0, 2), 506, 318);
    drawText(einDigits.substring(2, 9), 538, 318);
  }

  // Part II: Signature
  if (formData.signature) {
    if (formData.signatureType === 'drawn') {
      // Embed signature image
      try {
        // Convert base64 data URL to bytes
        const signatureData = formData.signature.split(',')[1];
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        
        // Embed as PNG
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        // Scale signature to fit
        const sigWidth = 150;
        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
        
        // Draw signature image
        firstPage.drawImage(signatureImage, {
          x: 65,
          y: height - 710 - sigHeight,
          width: sigWidth,
          height: sigHeight,
        });
      } catch (error) {
        console.error('Failed to embed signature image:', error);
        // Fallback: draw signature as text
        drawText('[Signature on file]', 65, 710);
      }
    } else {
      // Typed signature - use cursive-style font
      // Note: StandardFonts doesn't have a true cursive, so we'll use italic or just helvetica
      drawText(formData.signature, 65, 710, { size: 14 });
    }
  }

  // Signature date
  if (formData.signatureDate) {
    const dateStr = new Date(formData.signatureDate).toLocaleDateString('en-US');
    drawText(dateStr, 350, 710);
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
