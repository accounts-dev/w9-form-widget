// W9 Form Data Types

export type AccountType = 
  | 'individual'
  | 'ira'
  | 'trust'
  | 'llc'
  | 'corporation'
  | '401k';

export type Custodian =
  | 'equity-trust'
  | 'ira-innovations'
  | 'ira-financial'
  | 'other';

export type TaxClassification = 
  | 'individual'
  | 'cCorporation'
  | 'sCorporation'
  | 'partnership'
  | 'trustEstate'
  | 'llc'
  | 'other';

export type LLCClassification = 'C' | 'S' | 'P';

export type LLCType = 'disregarded' | 'c-corp' | 's-corp' | 'partnership';

export type TINType = 'ssn' | 'ein';

export interface W9FormData {
  // Section 0: Account Type (new for IRA support)
  accountType: AccountType | null;
  
  // IRA-specific fields
  custodian: Custodian | null;
  custodianName: string; // For "other" custodian
  custodianAddress: string;
  custodianCity: string;
  custodianState: string;
  custodianZip: string;
  iraAccountNumber: string;
  iraEin: string;
  
  // LLC-specific fields
  llcType: LLCType | null;
  
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

// Custodian data
export const custodianData: Record<Exclude<Custodian, 'other'>, { name: string; address: string; city: string; state: string; zip: string }> = {
  'equity-trust': {
    name: 'Equity Trust Company',
    address: '1 Equity Way',
    city: 'Westlake',
    state: 'OH',
    zip: '44145'
  },
  'ira-innovations': {
    name: 'IRA Innovations',
    address: '4905 Pine Cone Dr Ste 2',
    city: 'Durham',
    state: 'NC',
    zip: '27707'
  },
  'ira-financial': {
    name: 'IRA Financial Trust Company',
    address: '1691 Michigan Ave Ste 305',
    city: 'Miami Beach',
    state: 'FL',
    zip: '33139'
  }
};

export const initialFormData: W9FormData = {
  // Account Type
  accountType: null,
  
  // IRA fields
  custodian: null,
  custodianName: '',
  custodianAddress: '',
  custodianCity: '',
  custodianState: '',
  custodianZip: '',
  iraAccountNumber: '',
  iraEin: '',
  
  // LLC fields
  llcType: null,
  
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
    id: 0,
    title: 'Account Type',
    description: 'Select your account type'
  },
  {
    id: 1,
    title: 'Custodian',
    description: 'Select your IRA custodian'
  },
  {
    id: 2,
    title: 'Identity',
    description: 'Enter your name and business information'
  },
  {
    id: 3,
    title: 'Tax Classification',
    description: 'Select your federal tax classification'
  },
  {
    id: 4,
    title: 'Address & TIN',
    description: 'Enter your address and taxpayer identification number'
  },
  {
    id: 5,
    title: 'Signature',
    description: 'Sign and certify your information'
  },
  {
    id: 6,
    title: 'LLC Type',
    description: 'Select your LLC classification'
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
    case 0:
      if (!data.accountType) {
        errors.accountType = 'Account type is required';
      }
      break;
      
    case 1:
      if (data.accountType === 'ira') {
        if (!data.custodian) {
          errors.custodian = 'Custodian selection is required';
        }
        if (data.custodian === 'other') {
          if (!data.custodianName.trim()) {
            errors.custodianName = 'Custodian name is required';
          }
          if (!data.custodianAddress.trim()) {
            errors.custodianAddress = 'Address is required';
          }
          if (!data.custodianCity.trim()) {
            errors.custodianCity = 'City is required';
          }
          if (!data.custodianState) {
            errors.custodianState = 'State is required';
          }
          if (!data.custodianZip.trim()) {
            errors.custodianZip = 'ZIP code is required';
          }
        }
        if (!data.iraAccountNumber.trim()) {
          errors.iraAccountNumber = 'IRA account number is required';
        }
      }
      break;
      
    case 2:
      // Trusts and standard LLCs: only businessName required (no personal name)
      // Disregarded LLCs: both personal name and LLC name required
      // Corporations: both personal name and corporation name required
      if (data.accountType === 'trust') {
        if (!data.businessName.trim()) {
          errors.businessName = 'Trust name is required';
        }
      } else if (data.accountType === 'llc') {
        // Disregarded LLCs need personal name, standard LLCs don't
        if (data.llcType === 'disregarded') {
          if (!data.name.trim()) {
            errors.name = 'Name is required';
          }
        }
        if (!data.businessName.trim()) {
          errors.businessName = 'LLC name is required';
        }
      } else if (data.accountType === 'corporation') {
        if (!data.businessName.trim()) {
          errors.businessName = 'Corporation name is required';
        }
      } else if (data.accountType === '401k') {
        if (!data.businessName.trim()) {
          errors.businessName = '401k plan name is required';
        }
      } else {
        if (!data.name.trim()) {
          errors.name = 'Name is required';
        }
      }
      break;
      
    case 3:
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
      
    case 4:
      // For IRA accounts, address comes from custodian data - no validation needed
      // For non-IRA accounts, validate personal address
      if (data.accountType !== 'ira') {
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
      }
      
      // TIN validation - different based on account type
      if (data.accountType === 'ira') {
        // IRA: requires IRA EIN
        if (!data.iraEin.trim()) {
          errors.iraEin = 'IRA EIN is required';
        } else if (!/^\d{2}-?\d{7}$/.test(data.iraEin.replace(/\s/g, ''))) {
          errors.iraEin = 'Invalid EIN format (XX-XXXXXXX)';
        }
      } else if (data.accountType === 'llc' && data.llcType === 'disregarded') {
        // Disregarded LLC: requires both SSN and EIN
        if (!data.ssn.trim()) {
          errors.ssn = 'Social Security Number is required';
        } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(data.ssn.replace(/\s/g, ''))) {
          errors.ssn = 'Invalid SSN format (XXX-XX-XXXX)';
        }
        if (!data.ein.trim()) {
          errors.ein = 'LLC EIN is required';
        } else if (!/^\d{2}-?\d{7}$/.test(data.ein.replace(/\s/g, ''))) {
          errors.ein = 'Invalid EIN format (XX-XXXXXXX)';
        }
      } else if (data.accountType === 'llc' && data.llcType && data.llcType !== 'disregarded') {
        // Standard LLC (C Corp, S Corp, Partnership): requires EIN only
        if (!data.ein.trim()) {
          errors.ein = 'LLC EIN is required';
        } else if (!/^\d{2}-?\d{7}$/.test(data.ein.replace(/\s/g, ''))) {
          errors.ein = 'Invalid EIN format (XX-XXXXXXX)';
        }
      } else if (data.accountType === 'corporation' || data.accountType === '401k') {
        // Corporation / 401k: requires EIN only
        if (!data.ein.trim()) {
          errors.ein = 'Employer Identification Number is required';
        } else if (!/^\d{2}-?\d{7}$/.test(data.ein.replace(/\s/g, ''))) {
          errors.ein = 'Invalid EIN format (XX-XXXXXXX)';
        }
      } else {
        // Other account types: SSN or EIN based on selection
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
      }
      break;
      
    case 5:
      if (!data.signature) {
        errors.signature = 'Signature is required';
      }
      if (!data.signatureDate) {
        errors.signatureDate = 'Date is required';
      }
      break;
      
    case 6:
      // LLC Type selection
      if (data.accountType === 'llc' && !data.llcType) {
        errors.llcType = 'Please select your LLC type';
      }
      break;
  }
  
  return errors;
}
