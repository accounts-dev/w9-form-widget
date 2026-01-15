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
  // Field names may vary between PDF versions
  // ============================================

  // Line 1: Name
  if (formData.name) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_1[0]',
      'f1_1',
      'f1_01',
      'Name'
    ], formData.name);
  }

  // Line 2: Business name
  if (formData.businessName) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_2[0]',
      'f1_2',
      'f1_02',
      'BusinessName'
    ], formData.businessName);
  }

  // Line 3: Tax classification checkboxes
  const taxClassificationCheckboxes: Record<string, string[]> = {
    individual: ['topmostSubform[0].Page1[0].c1_1[0]', 'c1_1[0]', 'c1_1', 'Individual'],
    cCorporation: ['topmostSubform[0].Page1[0].c1_1[1]', 'c1_1[1]', 'c1_2', 'CCorporation'],
    sCorporation: ['topmostSubform[0].Page1[0].c1_1[2]', 'c1_1[2]', 'c1_3', 'SCorporation'],
    partnership: ['topmostSubform[0].Page1[0].c1_1[3]', 'c1_1[3]', 'c1_4', 'Partnership'],
    trustEstate: ['topmostSubform[0].Page1[0].c1_1[4]', 'c1_1[4]', 'c1_5', 'TrustEstate'],
    llc: ['topmostSubform[0].Page1[0].c1_1[5]', 'c1_1[5]', 'c1_6', 'LLC'],
    other: ['topmostSubform[0].Page1[0].c1_1[6]', 'c1_1[6]', 'c1_7', 'Other']
  };

  if (formData.taxClassification && taxClassificationCheckboxes[formData.taxClassification]) {
    tryCheckCheckbox(form, taxClassificationCheckboxes[formData.taxClassification]);
  }

  // LLC Classification letter
  if (formData.taxClassification === 'llc' && formData.llcClassification) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_3[0]',
      'f1_3',
      'f1_03',
      'LLCClassification'
    ], formData.llcClassification.toUpperCase());
  }

  // Other description
  if (formData.taxClassification === 'other' && formData.otherDescription) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_4[0]',
      'f1_4',
      'f1_04',
      'OtherDescription'
    ], formData.otherDescription);
  }

  // Exempt payee code
  if (formData.exemptPayeeCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_5[0]',
      'f1_5',
      'f1_05',
      'ExemptPayeeCode'
    ], formData.exemptPayeeCode);
  }

  // FATCA exemption code
  if (formData.fatcaExemptionCode) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_6[0]',
      'f1_6',
      'f1_06',
      'FATCACode'
    ], formData.fatcaExemptionCode);
  }

  // Line 5: Address
  if (formData.address) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_7[0]',
      'f1_7',
      'f1_07',
      'Address'
    ], formData.address);
  }

  // Line 6: City, State, ZIP
  const cityStateZip = [formData.city, formData.state, formData.zipCode].filter(Boolean).join(', ');
  if (cityStateZip) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_8[0]',
      'f1_8',
      'f1_08',
      'CityStateZIP'
    ], cityStateZip);
  }

  // Line 7: Account numbers (optional)
  if (formData.accountNumbers) {
    trySetTextField(form, [
      'topmostSubform[0].Page1[0].f1_9[0]',
      'f1_9',
      'f1_09',
      'AccountNumbers'
    ], formData.accountNumbers);
  }

  // SSN - fill individual digit boxes
  if (formData.tinType === 'ssn' && formData.ssn) {
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    for (let i = 0; i < Math.min(ssnDigits.length, 9); i++) {
      trySetTextField(form, [
        `topmostSubform[0].Page1[0].f1_${10 + i}[0]`,
        `f1_${10 + i}`,
        `SSN${i + 1}`
      ], ssnDigits[i]);
    }
  }

  // EIN - fill individual digit boxes
  if (formData.tinType === 'ein' && formData.ein) {
    const einDigits = formData.ein.replace(/\D/g, '');
    for (let i = 0; i < Math.min(einDigits.length, 9); i++) {
      trySetTextField(form, [
        `topmostSubform[0].Page1[0].f1_${19 + i}[0]`,
        `f1_${19 + i}`,
        `EIN${i + 1}`
      ], einDigits[i]);
    }
  }

  // ============================================
  // SIGNATURE (still needs coordinate-based placement for drawn signatures)
  // ============================================
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height } = firstPage.getSize();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (formData.signature) {
    if (formData.signatureType === 'drawn') {
      try {
        const signatureData = formData.signature.split(',')[1];
        const signatureBytes = Uint8Array.from(atob(signatureData), c => c.charCodeAt(0));
        const signatureImage = await pdfDoc.embedPng(signatureBytes);
        
        const sigWidth = 180;
        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
        
        firstPage.drawImage(signatureImage, {
          x: 75,
          y: height - 740,
          width: sigWidth,
          height: Math.min(sigHeight, 30),
        });
      } catch (error) {
        console.error('Failed to embed signature image:', error);
      }
    } else {
      // Typed signature
      firstPage.drawText(formData.signature, {
        x: 75,
        y: height - 733,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Signature date
  if (formData.signatureDate) {
    const dateStr = new Date(formData.signatureDate).toLocaleDateString('en-US');
    firstPage.drawText(dateStr, {
      x: 470,
      y: height - 733,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
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
