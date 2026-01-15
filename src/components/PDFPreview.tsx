import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { W9FormData } from '../types';
import { generateFilledW9PDF, downloadPDF } from '../services/pdfService';

// Configure PDF.js worker to use local file
pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';

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
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    generatePreview();
  }, []);

  const generatePreview = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Generating PDF with formData:', formData);
      const bytes = await generateFilledW9PDF(formData);
      console.log('PDF generated, size:', bytes.length, 'bytes');
      setPdfBytes(bytes);
      
      // Convert to data URL for react-pdf
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfDataUrl(reader.result as string);
        console.log('PDF data URL created');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log('PDF loaded successfully, pages:', numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF preview. You can still download the document.');
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
    // Reset form by reloading (or we could pass a reset function)
    window.location.reload();
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
        {pdfDataUrl ? (
          <>
            <Document
              file={pdfDataUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="w9-pdf-document"
            >
              <Page
                pageNumber={pageNumber}
                className="w9-pdf-page"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={650}
              />
            </Document>
            {numPages && numPages > 1 && (
              <div className="w9-pdf-controls">
                <button
                  className="w9-pdf-nav-btn"
                  onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1}
                >
                  ← Previous
                </button>
                <span className="w9-pdf-page-info">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  className="w9-pdf-nav-btn"
                  onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                  disabled={pageNumber >= numPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w9-preview-placeholder">
            <p>Loading preview...</p>
          </div>
        )}
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
