import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary';
import { setupAssetRecovery } from './utils/assetRecovery';

setupAssetRecovery();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>
);
