import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

import App from './App';
import { FallbackComponent } from './components';

const Root = () => (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.4,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        },
        success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
        error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
      }}
    />
    <Suspense fallback={<FallbackComponent />}>
      <App />
    </Suspense>
  </>
);

export default Root;
