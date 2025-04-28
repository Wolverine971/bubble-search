// main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { RewindUIProvider } from './contexts/RewindUIProvider';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RewindUIProvider>
      <App />
    </RewindUIProvider>
  </React.StrictMode>,
);