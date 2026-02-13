# IRA Account Support - Implementation Summary

## Overview
Added comprehensive IRA account support to the W9 Form Widget, following the specifications from the IRA Accounts document. The widget now supports both individual and IRA account flows with custodian selection and auto-fill functionality.

## New Features

### 1. Account Type Selection (Step 0)
- **Component**: `StepAccountType.tsx`
- **Options**:
  - Individual Account (personal investment)
  - IRA Account (Individual Retirement Account)
  - Trust (trust or estate account)
  - LLC (Limited Liability Company)
  - Corporation (C Corp or S Corp)
  - 401(k) Plan (employer-sponsored retirement)
- **UI**: Card-based selection with descriptions
- **Validation**: Account type is required before proceeding

### 2. IRA Custodian Selection (Step 1)
- **Component**: `StepCustodian.tsx`
- **Only shown for IRA accounts**
- **Pre-configured Custodians**:
  - Equity Trust Company (Westlake, OH)
  - IRA Innovations (Durham, NC)
  - IRA Financial Trust Company (Miami Beach, FL)
  - Other (custom custodian with manual entry)
- **Auto-fill**: When a pre-configured custodian is selected, automatically fills:
  - Custodian name
  - Address (street, city, state, ZIP)
- **Custom Custodian**: Fields for manual entry:
  - Custodian name
  - Address
  - City, State, ZIP
- **IRA Account Number**: Required field for the account number with the custodian
- **Validation**: All custodian fields validated for IRA accounts

### 3. Updated Form Flow
**For Individual Accounts** (5 steps total):
1. Account Type
2. Identity
3. Tax Classification
4. Address & TIN
5. Signature

**For IRA Accounts** (6 steps total):
1. Account Type
2. Custodian Information (includes IRA account number)
3. Identity (investor name)
4. Tax Classification (auto-locked to "Other - IRA")
5. Address & TIN (shows IRA EIN instead of SSN/EIN)
6. Signature

### 4. IRA-Specific Behaviors

#### PDF Auto-Fill Logic
When account type is IRA:
- **Line 1**: Custodian name (not investor name)
- **Line 2**: "FBO [Investor Name]" (For Benefit Of)
- **Line 5-6**: Custodian address (not personal address)
- **Line 7**: IRA account number
- **Tax Classification**: Locked to "Other" with description "IRA"
- **TIN Section**: Uses IRA EIN (XX-XXXXXXX format)
  - NOT the investor's personal SSN
  - NOT the custodian's general EIN
  - This is the IRA-specific EIN

#### Tax Classification Step
- For IRA accounts: Automatically set to "Other - IRA"
- Radio buttons disabled for IRA accounts
- Info message displayed: "Tax classification is automatically set to 'Other - IRA' for IRA accounts"
- Description field is read-only and pre-filled with "IRA"

#### Address & TIN Step
- For IRA accounts: Shows IRA EIN field instead of SSN/EIN toggle
- Help text clarifies: "For IRA accounts, enter the IRA-specific EIN (not your personal SSN or the custodian's general EIN)"
- Format: XX-XXXXXXX (same as EIN format)
- Validation ensures correct format

### 5. Updated Data Model

#### New Types
```typescript
type AccountType = 'individual' | 'ira' | 'trust' | 'llc' | 'corporation' | '401k';
type Custodian = 'equity-trust' | 'ira-innovations' | 'ira-financial' | 'other';
```

#### New Fields in W9FormData
- `accountType`: Selected account type
- `custodian`: Selected IRA custodian
- `custodianName`: Custodian name (for "other")
- `custodianAddress`: Custodian street address
- `custodianCity`: Custodian city
- `custodianState`: Custodian state
- `custodianZip`: Custodian ZIP code
- `iraAccountNumber`: IRA account number with custodian
- `iraEin`: IRA-specific EIN

#### Custodian Database
Pre-configured data for known custodians:
```typescript
export const custodianData = {
  'equity-trust': {
    name: 'Equity Trust Company',
    address: '1 Equity Way',
    city: 'Westlake',
    state: 'OH',
    zip: '44145'
  },
  'ira-innovations': { ... },
  'ira-financial': { ... }
};
```

### 6. Validation Updates

#### Step 0: Account Type
- Account type selection is required

#### Step 1: Custodian (IRA only)
- Custodian selection required
- If "other" custodian:
  - Custodian name required
  - Full address required (street, city, state, ZIP)
- IRA account number required
- Format validation for all fields

#### Step 4: Address & TIN
- Different validation for IRA vs non-IRA:
  - **IRA**: Validates IRA EIN (XX-XXXXXXX)
  - **Individual**: Validates SSN or EIN based on selection

### 7. Test Data
Updated the "Fill Test Data" button to include IRA account scenario:
- Account Type: IRA
- Custodian: Equity Trust Company
- IRA Account Number: IRA123456789
- IRA EIN: 12-3456789
- Investor Name: John A. Doe
- Tax Classification: Other - IRA

### 8. Styling
Added new CSS for:
- Account type selection cards (grid layout with hover effects)
- Info boxes for custodian address display
- Section descriptions and help text
- Form groups and validation states
- Responsive design for mobile devices

## Files Modified

### New Components
1. `src/components/StepAccountType.tsx` - Account type selection
2. `src/components/StepCustodian.tsx` - Custodian selection and IRA account info

### Updated Components
1. `src/components/FormWizard.tsx`
   - Added account type and custodian steps
   - Dynamic step visibility based on account type
   - Auto-set tax classification for IRA accounts
   - Updated test data

2. `src/components/StepTaxClassification.tsx`
   - Disabled editing for IRA accounts
   - Added info message for IRA
   - Read-only description field for IRA

3. `src/components/StepAddressTIN.tsx`
   - Conditional TIN section (IRA EIN vs SSN/EIN)
   - IRA-specific help text
   - Format validation for IRA EIN

### Updated Services
1. `src/services/pdfService.ts`
   - IRA account detection
   - Auto-fill custodian name on Line 1
   - Auto-fill "FBO [name]" on Line 2
   - Auto-fill custodian address
   - Include IRA account number
   - Use IRA EIN for TIN section

### Updated Types
1. `src/types.ts`
   - Added AccountType and Custodian types
   - Extended W9FormData interface
   - Added custodianData database
   - Updated initialFormData
   - Updated formSteps (0-5 instead of 1-4)
   - Enhanced validation for new fields

### Updated Styles
1. `src/styles.css`
   - Account type card styles
   - Info box styles
   - Form section styles
   - Responsive adjustments

## User Experience

### Individual Account Flow
1. Select "Individual Account"
2. Enter name and optional business name
3. Select tax classification
4. Enter address and SSN or EIN
5. Sign the form
6. Preview and download PDF

### IRA Account Flow
1. Select "IRA Account"
2. Select custodian (Equity Trust, IRA Innovations, IRA Financial, or Other)
3. If Other: Enter custodian details manually
4. Enter IRA account number
5. Enter investor name (your name)
6. Tax classification auto-set to "Other - IRA" (locked)
7. Address shown is custodian's (locked)
8. Enter IRA EIN (not personal SSN)
9. Sign the form
10. Preview and download PDF

## Key Implementation Details

### Conditional Step Rendering
The form dynamically shows/hides the custodian step based on account type:
```typescript
const getVisibleSteps = () => {
  const steps = [formSteps[0]]; // Account Type
  if (formData.accountType === 'ira') {
    steps.push(formSteps[1]); // Custodian
  }
  steps.push(formSteps[2], formSteps[3], formSteps[4], formSteps[5]);
  return steps;
};
```

### Auto-Fill on Custodian Selection
When a custodian is selected, the component automatically populates address fields:
```typescript
const handleCustodianChange = (custodian: Custodian) => {
  onChange('custodian', custodian);
  if (custodian !== 'other' && custodianData[custodian]) {
    const data = custodianData[custodian];
    onChange('custodianName', data.name);
    onChange('custodianAddress', data.address);
    onChange('custodianCity', data.city);
    onChange('custodianState', data.state);
    onChange('custodianZip', data.zip);
  }
};
```

### PDF Generation Logic
The PDF service detects IRA accounts and applies special formatting:
```typescript
const isIRA = formData.accountType === 'ira';

// Line 1: Custodian name for IRA, investor name otherwise
if (isIRA && formData.custodian) {
  let custodianName = formData.custodian === 'other' 
    ? formData.custodianName 
    : custodianData[formData.custodian].name;
  trySetTextField(form, ['f1_01[0]'], custodianName);
}

// Line 2: FBO investor name for IRA
if (isIRA && formData.name) {
  trySetTextField(form, ['f1_02[0]'], `FBO ${formData.name}`);
}
```

## Compliance with IRA Specification

✅ Account type selection before form start
✅ Custodian dropdown with pre-configured options
✅ "Other" custodian option with manual entry
✅ Auto-fill custodian name to Line 1
✅ Auto-fill "FBO [Investor Name]" to Line 2
✅ Tax classification locked to "Other → IRA"
✅ Auto-fill custodian address
✅ IRA Account Number field (required)
✅ IRA EIN field (NOT investor SSN)
✅ Never use investor SSN for IRA accounts
✅ Signature & Date collection

## Deployment
- Build successful: 624.67 kB bundle
- Deployed to GitHub Pages: https://accounts-dev.github.io/w9-form-widget/
- GitHub Actions workflow will automatically deploy on push to main

## Testing Recommendations

1. **Individual Account Path**
   - Select Individual → verify 5 steps
   - Complete with SSN → verify PDF shows personal info

2. **IRA Account Path - Equity Trust**
   - Select IRA → verify 6 steps
   - Select Equity Trust → verify auto-fill
   - Complete form → verify PDF shows custodian info on Line 1, FBO on Line 2

3. **IRA Account Path - Other Custodian**
   - Select IRA → Other custodian
   - Enter custom custodian details
   - Complete form → verify PDF shows custom custodian info

4. **Validation Testing**
   - Try to proceed without account type → should block
   - Try to proceed without custodian (IRA) → should block
   - Try to edit tax classification (IRA) → should be disabled
   - Enter invalid IRA EIN format → should show error

5. **PDF Generation**
   - Verify Line 1 shows custodian name (not investor)
   - Verify Line 2 shows "FBO John Doe"
   - Verify address is custodian's address
   - Verify account number includes "IRA: [number]"
   - Verify TIN uses IRA EIN (not SSN)
   - Verify tax classification shows "Other" checkbox with "IRA" description

## Future Enhancements (Optional)

1. **Additional Account Types**
   - Implement Trust, LLC, Corporation, 401(k) flows
   - Each may have specific requirements

2. **Custodian Database**
   - Expand custodian list
   - Add more pre-configured custodians
   - Allow admin panel to manage custodians

3. **IRA EIN Validation**
   - Validate against known IRA EIN patterns
   - Lookup EIN to verify it's an IRA account

4. **Multi-Account Support**
   - Allow users to complete multiple W9s in one session
   - Batch download functionality

5. **Save Progress**
   - LocalStorage or session storage
   - Resume partially completed forms

6. **Email Integration**
   - Email completed PDF to user
   - Email to CS3 Investments for processing
