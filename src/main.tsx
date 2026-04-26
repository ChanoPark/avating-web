import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { env } from '@shared/config/env';
import '@app/styles/index.css';

async function bootstrap() {
  if (env.VITE_API_MODE === 'mock') {
    const { worker } = await import('@shared/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container #root not found in index.html');
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
