import React, { useState, useEffect } from 'react';
import { 
  W9FormData, 
  initialFormData, 
  formSteps, 
  validateStep,
  ValidationErrors 
} from '../types';
import { StepAccountType } from './StepAccountType';
import { StepCustodian } from './StepCustodian';
import { StepIdentity } from './StepIdentity';
import { StepTaxClassification } from './StepTaxClassification';
import { StepAddressTIN } from './StepAddressTIN';
import { StepSignature } from './StepSignature';
import { PDFPreview } from './PDFPreview';

export const FormWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<W9FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-set tax classification based on account type
  useEffect(() => {
    if (formData.accountType === 'ira') {
      setFormData(prev => ({
        ...prev,
        taxClassification: 'other',
        otherDescription: 'IRA'
      }));
    } else if (formData.accountType === 'individual') {
      setFormData(prev => ({
        ...prev,
        taxClassification: 'individual',
        llcClassification: null,
        otherDescription: ''
      }));
    } else if (formData.accountType === 'trust') {
      setFormData(prev => ({
        ...prev,
        taxClassification: 'trustEstate',
        llcClassification: null,
        otherDescription: ''
      }));
    }
  }, [formData.accountType]);

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

  const onChange = (field: keyof W9FormData, value: any) => {
    updateFormData({ [field]: value });
  };

  // Fill with test data (for development/testing) - Individual account
  const fillTestData = () => {
    setFormData({
      accountType: 'individual',
      custodian: null,
      custodianName: '',
      custodianAddress: '',
      custodianCity: '',
      custodianState: '',
      custodianZip: '',
      iraAccountNumber: '',
      iraEin: '',
      name: 'John A. Doe',
      businessName: '',
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

  // Get the visible steps based on account type
  const getVisibleSteps = () => {
    const steps = [formSteps[0]]; // Account Type is always visible
    
    if (formData.accountType === 'ira') {
      steps.push(formSteps[1]); // Custodian
    }
    
    // Add Identity step
    steps.push(formSteps[2]);
    
    // Skip Tax Classification for IRA, Individual, and Trust (auto-set)
    if (formData.accountType !== 'ira' && formData.accountType !== 'individual' && formData.accountType !== 'trust') {
      steps.push(formSteps[3]); // Tax Classification
    }
    
    // Add Address/TIN and Signature
    steps.push(formSteps[4], formSteps[5]);
    
    return steps;
  };

  // Map current position to actual step ID
  const getStepId = () => {
    const visibleSteps = getVisibleSteps();
    return visibleSteps[currentStep]?.id || 0;
  };

  const handleNext = () => {
    const stepId = getStepId();
    const stepErrors = validateStep(stepId, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    const visibleSteps = getVisibleSteps();
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else {
      // Final step - show preview
      setShowPreview(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleEditFromPreview = () => {
    setShowPreview(false);
  };

  const renderStep = () => {
    const stepId = getStepId();
    
    switch (stepId) {
      case 0:
        return (
          <StepAccountType
            formData={formData}
            errors={errors}
            onChange={onChange}
          />
        );
      case 1:
        return (
          <StepCustodian
            formData={formData}
            errors={errors}
            onChange={onChange}
          />
        );
      case 2:
        return (
          <StepIdentity
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <StepTaxClassification
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <StepAddressTIN
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 5:
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
        {getVisibleSteps().map((step, index) => (
          <div
            key={step.id}
            className={`w9-progress-step ${
              index === currentStep
                ? 'active'
                : index < currentStep
                ? 'completed'
                : ''
            }`}
          >
            <div className="w9-progress-number">
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div className="w9-progress-label">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Step Header */}
      <div className="w9-step-header">
        <h2 className="w9-step-title">
          Step {currentStep + 1}: {getVisibleSteps()[currentStep].title}
        </h2>
        <p className="w9-step-description">
          {getVisibleSteps()[currentStep].description}
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
          disabled={currentStep === 0}
        >
          ← Back
        </button>
        <button
          type="button"
          className="w9-btn w9-btn-primary"
          onClick={handleNext}
        >
          {currentStep === getVisibleSteps().length - 1 ? 'Preview Document →' : 'Next →'}
        </button>
      </div>
    </div>
  );
};
