import React from 'react';
import ReactDOM from 'react-dom/client';
import { FormWizard } from './components';
import './styles.css';

// Main App component
const App: React.FC = () => {
  return (
    <div className="w9-widget">
      <FormWizard />
    </div>
  );
};

// Mount the app for development
ReactDOM.createRoot(document.getElementById('w9-form-widget')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
