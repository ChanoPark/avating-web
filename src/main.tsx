import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { configureHttp } from '@app/configureHttp';
import { bootstrapAuth } from '@app/bootstrapAuth';
import { env } from '@shared/config/env';
import '@app/styles/index.css';

async function bootstrap() {
  configureHttp();

  if (env.VITE_API_MODE === 'mock') {
    const { worker } = await import('@shared/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  // worker.start() 뒤에 부른다 — 먼저 부르면 mock 모드에서 세션 검증 요청이 서비스워커를 우회한다.
  // await 하지 않는다 — 세션이 있으면 서버 확인이 끝날 때까지 restoring 화면이 먼저 렌더된다.
  void bootstrapAuth();

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
