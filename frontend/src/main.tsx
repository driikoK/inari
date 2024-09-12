import ReactDOM from 'react-dom/client';
import React from 'react';
import { Toaster } from 'react-hot-toast';

import './global.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
    <App />
  </React.StrictMode>
);
