import React, { useState } from 'react';
import { 
  W9FormData, 
  initialFormData, 
  formSteps, 
  validateStep,
  ValidationErrors 
} from '../types';
import { StepIdentity } from './StepIdentity';
import { StepTaxClassification } from './StepTaxClassification';
import { StepAddressTIN } from './StepAddressTIN';
import { StepSignature } from './StepSignature';
import { PDFPreview } from './PDFPreview';

export const FormWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<W9FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateFormData = (updates: Partial<W9FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedKeys = Object.keys(updates);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedKeys.forEach(key => delete newErrors[key]);
      return newErrors;
    });
  };

  // Fill with test data (for development/testing)
  const fillTestData = () => {
    setFormData({
      name: 'John A. Doe',
      businessName: 'Acme Corporation',
      taxClassification: 'individual',
      llcClassification: null,
      otherDescription: '',
      exemptPayeeCode: '',
      fatcaExemptionCode: '',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      requesterNameAddress: '',
      accountNumbers: '',
      tinType: 'ssn',
      ssn: '123-45-6789',
      ein: '',
      signature: 'John A. Doe',
      signatureType: 'typed',
      signatureDate: new Date().toLocaleDateString('en-US')
    });
    setErrors({});
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else {
      // Final step - show preview
      setShowPreview(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleEditFromPreview = () => {
    setShowPreview(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepIdentity
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <StepTaxClassification
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <StepAddressTIN
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <StepSignature
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  if (showPreview) {
    return (
      <PDFPreview
        formData={formData}
        onEdit={handleEditFromPreview}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />
    );
  }

  return (
    <div className="w9-wizard">
      {/* Logo */}
      <div className="w9-logo">
        <img 
          src="https://assets.cdn.filesafe.space/hX83Iw1k4t1OkxxBWMGa/media/682cd4db7ae79b622bda02e9.png" 
          alt="CS3 Investments"
        />
      </div>

      {/* Test Data Button */}
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <button
          type="button"
          className="w9-btn-test-data"
          onClick={fillTestData}
          title="Fill form with test data"
        >
          🧪 Fill Test Data
        </button>
      </div>

      {/* Progress Steps */}
      <div className="w9-progress">
        {formSteps.map((step) => (
          <div
            key={step.id}
            className={`w9-progress-step ${
              step.id === currentStep
                ? 'active'
                : step.id < currentStep
                ? 'completed'
                : ''
            }`}
          >
            <div className="w9-progress-number">
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <div className="w9-progress-label">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Step Header */}
      <div className="w9-step-header">
        <h2 className="w9-step-title">
          Step {currentStep}: {formSteps[currentStep - 1].title}
        </h2>
        <p className="w9-step-description">
          {formSteps[currentStep - 1].description}
        </p>
      </div>

      {/* Step Content */}
      <div className="w9-step-content">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="w9-navigation">
        <button
          type="button"
          className="w9-btn w9-btn-secondary"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          ← Back
        </button>
        <button
          type="button"
          className="w9-btn w9-btn-primary"
          onClick={handleNext}
        >
          {currentStep === 4 ? 'Preview Document →' : 'Next →'}
        </button>
      </div>
    </div>
  );
};
