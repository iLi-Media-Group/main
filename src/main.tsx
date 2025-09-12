import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedAuthProvider } from './contexts/UnifiedAuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UnifiedAuthProvider>
        <App />
      </UnifiedAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
