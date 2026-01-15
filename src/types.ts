// W9 Form Data Types

export type TaxClassification = 
  | 'individual'
  | 'cCorporation'
  | 'sCorporation'
  | 'partnership'
  | 'trustEstate'
  | 'llc'
  | 'other';

export type LLCClassification = 'C' | 'S' | 'P';

export type TINType = 'ssn' | 'ein';

export interface W9FormData {
  // Section 1: Identity
  name: string;
  businessName: string;
  
  // Section 2: Tax Classification
  taxClassification: TaxClassification | null;
  llcClassification: LLCClassification | null;
  otherDescription: string;
  
  // Section 3: Exemptions
  exemptPayeeCode: string;
  fatcaExemptionCode: string;
  
  // Section 4: Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Section 5: Optional
  requesterNameAddress: string;
  accountNumbers: string;
  
  // Section 6: TIN
  tinType: TINType;
  ssn: string;
  ein: string;
  
  // Section 7: Certification
  signature: string; // Base64 image data or typed text
  signatureType: 'drawn' | 'typed';
  signatureDate: string;
}

export const initialFormData: W9FormData = {
  name: '',
  businessName: '',
  taxClassification: null,
  llcClassification: null,
  otherDescription: '',
  exemptPayeeCode: '',
  fatcaExemptionCode: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  requesterNameAddress: '',
  accountNumbers: '',
  tinType: 'ssn',
  ssn: '',
  ein: '',
  signature: '',
  signatureType: 'drawn',
  signatureDate: new Date().toLocaleDateString('en-US')
};

// Form step configuration
export interface FormStep {
  id: number;
  title: string;
  description: string;
}

export const formSteps: FormStep[] = [
  {
    id: 1,
    title: 'Identity',
    description: 'Enter your name and business information'
  },
  {
    id: 2,
    title: 'Tax Classification',
    description: 'Select your federal tax classification'
  },
  {
    id: 3,
    title: 'Address & TIN',
    description: 'Enter your address and taxpayer identification number'
  },
  {
    id: 4,
    title: 'Signature',
    description: 'Sign and certify your information'
  }
];

// Tax classification options for display
export const taxClassificationOptions: { value: TaxClassification; label: string }[] = [
  { value: 'individual', label: 'Individual/sole proprietor or single-member LLC' },
  { value: 'cCorporation', label: 'C Corporation' },
  { value: 'sCorporation', label: 'S Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'trustEstate', label: 'Trust/estate' },
  { value: 'llc', label: 'Limited liability company (LLC)' },
  { value: 'other', label: 'Other' }
];

// US States for dropdown
export const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

// Validation helpers
export interface ValidationErrors {
  [key: string]: string;
}

export function validateStep(step: number, data: W9FormData): ValidationErrors {
  const errors: ValidationErrors = {};
  
  switch (step) {
    case 1:
      if (!data.name.trim()) {
        errors.name = 'Name is required';
      }
      break;
      
    case 2:
      if (!data.taxClassification) {
        errors.taxClassification = 'Tax classification is required';
      }
      if (data.taxClassification === 'llc' && !data.llcClassification) {
        errors.llcClassification = 'LLC tax classification is required';
      }
      if (data.taxClassification === 'other' && !data.otherDescription.trim()) {
        errors.otherDescription = 'Please describe your entity type';
      }
      break;
      
    case 3:
      if (!data.address.trim()) {
        errors.address = 'Address is required';
      }
      if (!data.city.trim()) {
        errors.city = 'City is required';
      }
      if (!data.state) {
        errors.state = 'State is required';
      }
      if (!data.zipCode.trim()) {
        errors.zipCode = 'ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
        errors.zipCode = 'Invalid ZIP code format';
      }
      
      if (data.tinType === 'ssn') {
        if (!data.ssn.trim()) {
          errors.ssn = 'Social Security Number is required';
        } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(data.ssn.replace(/\s/g, ''))) {
          errors.ssn = 'Invalid SSN format (XXX-XX-XXXX)';
        }
      } else {
        if (!data.ein.trim()) {
          errors.ein = 'Employer Identification Number is required';
        } else if (!/^\d{2}-?\d{7}$/.test(data.ein.replace(/\s/g, ''))) {
          errors.ein = 'Invalid EIN format (XX-XXXXXXX)';
        }
      }
      break;
      
    case 4:
      if (!data.signature) {
        errors.signature = 'Signature is required';
      }
      if (!data.signatureDate) {
        errors.signatureDate = 'Date is required';
      }
      break;
  }
  
  return errors;
}
