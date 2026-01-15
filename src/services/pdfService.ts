import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { W9FormData } from '../types';

// W9 PDF template URL
const W9_PDF_URL = './W9 Form Empty (1).pdf';

// Debug function to list all form fields in the PDF
export async function listPDFFormFields(): Promise<string[]> {
  const existingPdfBytes = await fetch(W9_PDF_URL).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  const fieldInfo = fields.map(field => {
    const type = field.constructor.name;
    const name = field.getName();
    return `${type}: "${name}"`;
  });
  
  console.log('=== PDF Form Fields ===');
  fieldInfo.forEach(f => console.log(f));
  console.log('======================');
  
  return fieldInfo;
}

// Helper to safely set a text field
function trySetTextField(form: ReturnType<typeof PDFDocument.prototype.getForm>, fieldNames: string[], value: string) {
  for (const fieldName of fieldNames) {
    try {
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(value);
        console.log(`Set field "${fieldName}" to "${value}"`);
        return true;
      }
    } catch {
      // Field not found, try next
    }
  }
  console.log(`Could not find any of these fields: ${fieldNames.join(', ')}`);
  return false;
}

// Helper to safely check a checkbox
function tryCheckCheckbox(form: ReturnType<typeof PDFDocument.prototype.getForm>, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) {
        field.check();
        console.log(`Checked checkbox "${fieldName}"`);
        return true;
      }
    } catch {
      // Field not found, try next
    }
  }
  console.log(`Could not find any checkbox: ${fieldNames.join(', ')}`);
  return false;
}

export async function generateFilledW9PDF(formData: W9FormData): Promise<Uint8Array> {
  // Fetch the empty W9 PDF template
  const existingPdfBytes = await fetch(W9_PDF_URL).then(res => {
    if (!res.ok) throw new Error('Failed to load W9 PDF template');
    return res.arrayBuffer();
  });

  // Load the PDF document
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Get the form from the PDF
  const form = pdfDoc.getForm();
  
  // Log available fields for debugging
  const fields = form.getFields();
  console.log('Available form fields:');
  fields.forEach(f => console.log(`  ${f.constructor.name}: "${f.getName()}"`));

  // ============================================
  // FILL FORM FIELDS BY NAME
  // Field names from actual W9 PDF (March 2024 revision)
  // ============================================

  // Line 1: Name
  if (formData.name) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_01[0]'
    ], formData.name);
  }

  // Line 2: Business name
  if (formData.businessName) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_02[0]'
    ], formData.businessName);
  }

  // Line 3: Tax classification checkboxes
  const taxClassificationCheckboxes: Record<string, string[]> = {
    individual: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[0]'],
    cCorporation: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[1]'],
    sCorporation: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[2]'],
    partnership: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[3]'],
    trustEstate: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[4]'],
    llc: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[5]'],
    other: ['topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[6]']
  };

  if (formData.taxClassification && taxClassificationCheckboxes[formData.taxClassification]) {
    tryCheckCheckbox(form, taxClassificationCheckboxes[formData.taxClassification]);
  }

  // LLC Classification letter
  if (formData.taxClassification === 'llc' && formData.llcClassification) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]'
    ], formData.llcClassification.toUpperCase());
  }

  // Other description
  if (formData.taxClassification === 'other' && formData.otherDescription) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_04[0]'
    ], formData.otherDescription);
  }

  // Exempt payee code
  if (formData.exemptPayeeCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_05[0]'
    ], formData.exemptPayeeCode);
  }

  // FATCA exemption code
  if (formData.fatcaExemptionCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_06[0]'
    ], formData.fatcaExemptionCode);
  }

  // Line 5: Address
  if (formData.address) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]'
    ], formData.address);
  }

  // Line 6: City, State, ZIP
  const cityStateZip = [formData.city, formData.state, formData.zipCode].filter(Boolean).join(', ');
  if (cityStateZip) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]'
    ], cityStateZip);
  }

  // Line 7: Account numbers (optional)
  if (formData.accountNumbers) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_09[0]'
    ], formData.accountNumbers);
  }

  // SSN - fill individual digit boxes (f1_10 through f1_15 exist - only 6 digits?)
  // The PDF seems to only have 6 SSN fields, so we'll fill what's available
  if (formData.tinType === 'ssn' && formData.ssn) {
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    const ssnFieldNames = [
      'topmostSubform[0].Page1[0].f1_10[0]',
      'topmostSubform[0].Page1[0].f1_11[0]',
      'topmostSubform[0].Page1[0].f1_12[0]',
      'topmostSubform[0].Page1[0].f1_13[0]',
      'topmostSubform[0].Page1[0].f1_14[0]',
      'topmostSubform[0].Page1[0].f1_15[0]'
    ];
    for (let i = 0; i < Math.min(ssnDigits.length, ssnFieldNames.length); i++) {
      trySetTextField(form, [ssnFieldNames[i]], ssnDigits[i]);
    }
  }

  // EIN - The PDF might not have separate EIN fields, check if c1_2 is for EIN selection
  if (formData.tinType === 'ein' && formData.ein) {
    const einDigits = formData.ein.replace(/\D/g, '');
    // Try using same fields as SSN (user might need to select EIN checkbox separately)
    const einFieldNames = [
      'topmostSubform[0].Page1[0].f1_10[0]',
      'topmostSubform[0].Page1[0].f1_11[0]',
      'topmostSubform[0].Page1[0].f1_12[0]',
      'topmostSubform[0].Page1[0].f1_13[0]',
      'topmostSubform[0].Page1[0].f1_14[0]',
      'topmostSubform[0].Page1[0].f1_15[0]'
    ];
    for (let i = 0; i < Math.min(einDigits.length, einFieldNames.length); i++) {
      trySetTextField(form, [einFieldNames[i]], einDigits[i]);
    }
  }

  // ============================================
  // SIGNATURE & DATE (no form fields - use coordinate placement)
  // The "Sign Here" section is at the bottom of the W9 form
  // W9 PDF is typically 792 points tall (11 inches)
  // Signature line is approximately at Y=55 from bottom
  // ============================================
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  console.log(`PDF dimensions: ${width} x ${height}`);
  
  // Signature area: "Signature of U.S. person" is on the left
  // The signature line starts around x=75 and the date field is on the right around x=465
  const signatureY = 55; // Distance from BOTTOM of page
  const dateY = 55;

  if (formData.signature) {
    if (formData.signatureType === 'drawn') {
      try {
        const signatureData = formData.signature.split(',')[1];
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        // Scale signature to fit nicely above the line
        const sigWidth = 180;
        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
        const cappedHeight = Math.min(sigHeight, 25); // Cap height to fit
        
        firstPage.drawImage(signatureImage, {
          x: 75,
          y: signatureY + 2, // Slightly above the signature line
          width: sigWidth,
          height: cappedHeight,
        });
        console.log(`Drew signature image at x=75, y=${signatureY + 2}`);
      } catch (error) {
        console.error('Failed to embed signature image:', error);
      }
    } else {
      // Typed signature - place text on the signature line
      firstPage.drawText(formData.signature, {
        x: 75,
        y: signatureY + 5,
        size: 11,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      console.log(`Drew typed signature at x=75, y=${signatureY + 5}`);
    }
  }

  // Date field is to the right of the signature
  if (formData.signatureDate) {
    const dateStr = new Date(formData.signatureDate).toLocaleDateString('en-US');
    firstPage.drawText(dateStr, {
      x: 465,
      y: dateY + 5,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    console.log(`Drew date "${dateStr}" at x=465, y=${dateY + 5}`);
  }

  // Optionally flatten the form to prevent further editing
  // form.flatten();

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
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Helper function to create a preview URL
export function createPDFPreviewURL(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
