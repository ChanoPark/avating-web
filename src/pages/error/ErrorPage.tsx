import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, Lock, Settings, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@shared/ui';
import { STATUS_PAGE_URL, SUPPORT_EMAIL_HREF } from '@shared/config/constants';

export type ErrorVariant = 'not-found' | 'server-error' | 'forbidden' | 'offline' | 'maintenance';

type ErrorPageProps = {
  variant: ErrorVariant;
  onRetry?: () => void;
  onContact?: () => void;
  /** server-error variant 전용. 디자인 스펙 §3 — 500 화면의 문의 시 식별자. 다른 variant 에서는 무시된다. */
  requestId?: string;
  /**
   * 호출 측에서 명시할 수 있는 "이전 페이지로 돌아가기 가능" 플래그. 미지정 시 `window.history.length > 1` 로 추정.
   * 추정값은 SPA 진입 전 외부 히스토리(다른 사이트 → 직접 진입)도 포함하므로, 정확성이 필요한 화면에서는 명시 권장.
   */
  canGoBack?: boolean;
  /** maintenance variant 전용. */
  maintenanceWindow?: { startsAt: string; endsAt: string; durationMin: number; brief: string };
  /** maintenance variant 의 상태 페이지 링크. 미지정 시 기본 STATUS_PAGE_URL 사용. */
  maintenanceStatusUrl?: string;
};

type VariantSpec = {
  icon: LucideIcon;
  title: string;
  description: string;
  code: number | null;
};

const VARIANTS: Record<ErrorVariant, VariantSpec> = {
  'not-found': {
    icon: AlertTriangle,
    title: '페이지를 찾을 수 없습니다',
    description: '요청한 페이지가 존재하지 않거나 이동되었을 수 있습니다.',
    code: 404,
  },
  'server-error': {
    icon: AlertTriangle,
    title: '일시적인 오류가 발생했습니다',
    description: '잠시 후 다시 시도해주세요. 계속되면 문의해주세요.',
    code: 500,
  },
  forbidden: {
    icon: Lock,
    title: '접근 권한이 없습니다',
    description: '이 페이지를 보려면 로그인이 필요하거나 권한이 필요합니다.',
    code: 403,
  },
  offline: {
    icon: WifiOff,
    title: '인터넷 연결이 끊겼습니다',
    description: '연결 상태를 확인하고 다시 시도해주세요.',
    code: null,
  },
  maintenance: {
    icon: Settings,
    title: '서비스 점검 중입니다',
    description: '점검 종료 후 다시 이용해주세요.',
    code: null,
  },
};

const OFFLINE_MAX_RETRIES = 5;
const OFFLINE_RETRY_INTERVAL_MS = 3000;

function detectHasHistory(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

export function ErrorPage({
  variant,
  onRetry,
  onContact,
  requestId,
  canGoBack,
  maintenanceWindow,
  maintenanceStatusUrl,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const spec = VARIANTS[variant];
  const Icon = spec.icon;

  const hasHistory = canGoBack ?? detectHasHistory();
  const showBack = hasHistory;

  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const isOfflineAutoRetry = variant === 'offline' && typeof onRetry === 'function';
  const offlineRetriesExhausted = isOfflineAutoRetry && autoRetryCount >= OFFLINE_MAX_RETRIES;
  const offlineRetrying =
    isOfflineAutoRetry && autoRetryCount > 0 && autoRetryCount < OFFLINE_MAX_RETRIES;

  // onRetry 를 ref 로 안정화 — 의존성에 넣으면 호출 측의 새 함수 인스턴스 마다 인터벌 재시작 됨.
  const onRetryRef = useRef(onRetry);
  useEffect(() => {
    onRetryRef.current = onRetry;
  }, [onRetry]);

  useEffect(() => {
    if (!isOfflineAutoRetry) return;
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setAutoRetryCount(count);
      onRetryRef.current?.();
      if (count >= OFFLINE_MAX_RETRIES) {
        clearInterval(interval);
      }
    }, OFFLINE_RETRY_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [isOfflineAutoRetry]);

  function handleHome() {
    void navigate('/');
  }

  function handleBack() {
    void navigate(-1);
  }

  function handleLogin() {
    void navigate('/login');
  }

  function handleReload() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  function handleContact() {
    if (onContact) {
      onContact();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = SUPPORT_EMAIL_HREF;
    }
  }

  return (
    <main className="bg-bg text-text flex min-h-screen items-center justify-center px-6 py-12">
      <div role="alert" className="flex max-w-md flex-col items-center text-center">
        <Icon size={24} className="text-text-3" aria-hidden="true" />

        <h1 className="text-heading text-text mt-6">{spec.title}</h1>

        <p className="text-body-sm text-text-3 mt-3">{spec.description}</p>

        {variant === 'maintenance' && maintenanceWindow && (
          <div className="text-mono-meta text-text-3 mt-4 font-mono">
            <div>
              {maintenanceWindow.startsAt} - {maintenanceWindow.endsAt}
            </div>
            <div className="mt-1">약 {maintenanceWindow.durationMin}분 소요 예정</div>
            <div className="text-text-2 mt-2">점검 내용: {maintenanceWindow.brief}</div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {variant === 'not-found' && (
            <>
              {showBack && (
                <Button variant="ghost" onClick={handleBack}>
                  ← 이전
                </Button>
              )}
              <Button variant="secondary" onClick={handleHome}>
                홈으로
              </Button>
            </>
          )}

          {variant === 'server-error' && (
            <>
              <Button onClick={onRetry ?? handleReload}>다시 시도</Button>
              <Button variant="secondary" onClick={handleContact}>
                문의하기
              </Button>
            </>
          )}

          {variant === 'forbidden' && (
            <>
              <Button onClick={handleLogin}>로그인</Button>
              {showBack && (
                <Button variant="secondary" onClick={handleBack}>
                  이전 페이지
                </Button>
              )}
            </>
          )}

          {variant === 'offline' && (
            <>
              {offlineRetrying ? (
                <span className="text-mono-meta text-text-3 font-mono">
                  재연결 시도 중... ({autoRetryCount}/{OFFLINE_MAX_RETRIES})
                </span>
              ) : offlineRetriesExhausted ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-body-sm text-danger">
                    연결 실패. 네트워크 상태를 확인해주세요.
                  </span>
                  <Button onClick={handleReload}>새로고침</Button>
                </div>
              ) : (
                <Button onClick={onRetry ?? handleReload}>다시 시도</Button>
              )}
            </>
          )}

          {variant === 'maintenance' && (
            <a
              href={maintenanceStatusUrl ?? STATUS_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ui text-brand hover:text-brand-hover font-ui underline-offset-2 hover:underline"
            >
              상태 페이지<span aria-hidden="true"> →</span>
            </a>
          )}
        </div>

        {spec.code !== null && (
          <div className="text-mono-meta text-text-3 mt-8 font-mono">
            ERROR_CODE: {spec.code}
            {variant === 'server-error' && requestId ? ` · REQUEST_ID: ${requestId}` : ''}
          </div>
        )}
      </div>
    </main>
  );
}
