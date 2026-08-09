import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './pwa/install'; // must load early to catch the one-shot beforeinstallprompt event

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
