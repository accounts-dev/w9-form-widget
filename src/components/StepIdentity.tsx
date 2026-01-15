import React from 'react';
import { W9FormData, ValidationErrors } from '../types';

interface StepIdentityProps {
  formData: W9FormData;
  updateFormData: (updates: Partial<W9FormData>) => void;
  errors: ValidationErrors;
}

export const StepIdentity: React.FC<StepIdentityProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  return (
    <div className="w9-step">
      <div className="w9-form-group">
        <label htmlFor="name" className="w9-label">
          Name <span className="w9-required">*</span>
        </label>
        <p className="w9-help-text">
          Enter your name as shown on your income tax return
        </p>
        <input
          type="text"
          id="name"
          className={`w9-input ${errors.name ? 'w9-input-error' : ''}`}
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="First name, Middle initial, Last name"
        />
        {errors.name && <span className="w9-error-message">{errors.name}</span>}
      </div>

      <div className="w9-form-group">
        <label htmlFor="businessName" className="w9-label">
          Business Name
        </label>
        <p className="w9-help-text">
          If different from above. Disregarded entity name, if applicable.
        </p>
        <input
          type="text"
          id="businessName"
          className="w9-input"
          value={formData.businessName}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          placeholder="Business name or disregarded entity name (optional)"
        />
      </div>
    </div>
  );
};
