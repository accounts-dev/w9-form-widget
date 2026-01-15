import React, { useEffect, useState } from 'react';
import { W9FormData } from '../types';
import { generateFilledW9PDF, downloadPDF } from '../services/pdfService';

interface PDFPreviewProps {
  formData: W9FormData;
  onEdit: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  formData,
  onEdit,
  isGenerating,
  setIsGenerating
}) => {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    generatePreview();
    
    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, []);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Generating PDF with formData:', formData);
      const bytes = await generateFilledW9PDF(formData);
      console.log('PDF generated, size:', bytes.length, 'bytes');
      setPdfBytes(bytes);
      
      // Create blob URL for native browser PDF viewer
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      console.log('PDF blob URL created');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBytes) {
      setIsDownloading(true);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `W9_${safeName}_${timestamp}.pdf`;
      
      downloadPDF(pdfBytes, filename);
      
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadComplete(true);
      }, 500);
    }
  };

  const handleStartNew = () => {
    setDownloadComplete(false);
    onEdit();
    window.location.reload();
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  if (isGenerating) {
    return (
      <div className="w9-preview">
        <div className="w9-preview-loading">
          <div className="w9-spinner"></div>
          <p>Generating your W-9 document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w9-preview">
        <div className="w9-preview-error">
          <div className="w9-error-icon">⚠️</div>
          <h3>Error Generating PDF</h3>
          <p>{error}</p>
          <div className="w9-preview-actions">
            <button className="w9-btn w9-btn-secondary" onClick={onEdit}>
              ← Go Back & Edit
            </button>
            <button className="w9-btn w9-btn-primary" onClick={generatePreview}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (downloadComplete) {
    return (
      <div className="w9-preview">
        <div className="w9-preview-success">
          <div className="w9-success-icon">✓</div>
          <h3>Download Complete!</h3>
          <p>Your W-9 form has been downloaded successfully.</p>
          <div className="w9-preview-actions">
            <button className="w9-btn w9-btn-secondary" onClick={handleDownload}>
              Download Again
            </button>
            <button className="w9-btn w9-btn-primary" onClick={handleStartNew}>
              Fill Out Another Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w9-preview">
      <div className="w9-preview-header">
        <h2>Preview Your W-9</h2>
        <p>Please review your completed form before downloading.</p>
      </div>

      <div className="w9-preview-frame-container">
        {pdfBlobUrl ? (
          <embed
            src={pdfBlobUrl}
            type="application/pdf"
            className="w9-preview-frame"
            title="W9 Preview"
          />
        ) : (
          <div className="w9-preview-placeholder">
            <p>Loading preview...</p>
          </div>
        )}
      </div>

      {/* Fallback message */}
      <div className="w9-preview-fallback-message">
        <p>
          Can't see the preview? 
          <button className="w9-link-btn" onClick={handleOpenInNewTab}>
            Open in new tab
          </button>
        </p>
      </div>

      <div className="w9-preview-summary">
        <h3>Form Summary</h3>
        <div className="w9-summary-grid">
          <div className="w9-summary-item">
            <span className="w9-summary-label">Name:</span>
            <span className="w9-summary-value">{formData.name}</span>
          </div>
          {formData.businessName && (
            <div className="w9-summary-item">
              <span className="w9-summary-label">Business:</span>
              <span className="w9-summary-value">{formData.businessName}</span>
            </div>
          )}
          <div className="w9-summary-item">
            <span className="w9-summary-label">Address:</span>
            <span className="w9-summary-value">
              {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
            </span>
          </div>
          <div className="w9-summary-item">
            <span className="w9-summary-label">TIN Type:</span>
            <span className="w9-summary-value">
              {formData.tinType === 'ssn' ? 'Social Security Number' : 'Employer ID Number'}
            </span>
          </div>
        </div>
      </div>

      <div className="w9-preview-actions">
        <button className="w9-btn w9-btn-secondary" onClick={onEdit}>
          ← Go Back & Edit
        </button>
        <button 
          className="w9-btn w9-btn-primary w9-btn-download"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <span className="w9-btn-spinner"></span>
              Downloading...
            </>
          ) : (
            <>
              ⬇️ Confirm & Download
            </>
          )}
        </button>
      </div>
    </div>
  );
};
