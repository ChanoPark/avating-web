import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CircleAlert, Lock, Settings, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { STATUS_PAGE_URL, SUPPORT_EMAIL_HREF } from '@shared/config/constants';

export type ErrorVariant = 'not-found' | 'server-error' | 'forbidden' | 'offline' | 'maintenance';

type ErrorPageProps = {
  variant: ErrorVariant;
  onRetry?: () => void;
  onContact?: () => void;
  canGoBack?: boolean;
  maintenanceWindow?: { startsAt: string; endsAt: string; durationMin: number; brief: string };
  maintenanceStatusUrl?: string;
  /**
   * forbidden variant 의 CTA 분기.
   * - true(인증됨): 권한 부족 → "이전 페이지" 단독
   * - false(비인증): 로그인 필요 → "로그인" 단독
   * - undefined(상태 모름): 둘 다 노출
   */
  isAuthenticated?: boolean;
};

// chat3 정본: 에러는 코드/페이지별 제목을 노출하지 않는다. 2종 톤 — generic(danger) / auth(brand) —
// 으로 통일하고 부드러운 "~요" 카피만 보여준다.
type ErrorTone = 'generic' | 'auth';

type VariantSpec = {
  icon: LucideIcon;
  tone: ErrorTone;
  title: string;
  description: string;
};

const VARIANTS: Record<ErrorVariant, VariantSpec> = {
  // 404 만 문구를 분리한다 — 없는 주소인데 "일시적인 문제" 로 안내하면 사용자가
  // 새로고침을 반복하게 된다(실서버 QA S6). 코드·경로는 여전히 노출하지 않는다.
  'not-found': {
    icon: CircleAlert,
    tone: 'generic',
    title: '찾을 수 없는 페이지예요',
    description: '주소가 바뀌었거나 삭제된 페이지일 수 있어요.\n메인 화면으로 돌아가 주세요.',
  },
  'server-error': {
    icon: CircleAlert,
    tone: 'generic',
    title: '일시적인 문제가 발생했어요',
    description:
      '잠깐 문제가 생긴 것 같아요.\n잠시 후 다시 시도해 보거나, 메인 화면으로 돌아가 주세요.',
  },
  forbidden: {
    icon: Lock,
    tone: 'auth',
    title: '로그인이 필요해요',
    description:
      '이 페이지에 접근하려면 로그인이 필요해요.\n다시 로그인하거나 메인 화면으로 돌아가 주세요.',
  },
  offline: {
    icon: WifiOff,
    tone: 'generic',
    title: '인터넷 연결이 불안정해요',
    description: '연결 상태를 확인하고 잠시 후 다시 시도해 주세요.',
  },
  maintenance: {
    icon: Settings,
    tone: 'generic',
    title: '잠깐 점검 중이에요',
    description: '점검이 끝나면 다시 이용할 수 있어요.',
  },
};

// 톤은 테두리와 아이콘 색이 나른다 — 틴트 채움 + 같은 색 테두리는 금지다.
const TONE_ICON_BOX: Record<ErrorTone, string> = {
  generic: 'bg-surface border-danger text-danger',
  auth: 'bg-surface border-primary text-primary',
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
  canGoBack,
  maintenanceWindow,
  maintenanceStatusUrl,
  isAuthenticated,
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

  const year = new Date().getFullYear();

  return (
    <main className="bg-canvas text-ink relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      {/* 브랜드 풀스크린 — 그리드 배경 + 좌상단 로고 + 하단 워드마크 (Avating Error Page 정본) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          // `--border` 는 v2 토큰에 없다 (v1 잔재). 1px 격자선은 `--hairline` 이다.
          backgroundImage:
            'linear-gradient(to right, var(--hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--hairline) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 75%)',
        }}
      />
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <span aria-hidden="true" className="bg-primary h-5 w-5 rounded-md" />
        <span className="text-body-sm text-ink tracking-tight">Avating</span>
      </div>

      <div role="alert" className="relative z-[1] flex max-w-120 flex-col items-center text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl border ${TONE_ICON_BOX[spec.tone]}`}
        >
          <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
        </div>

        {/* 헤드 블록 — 타이틀 t-heading-lg + 서브 t-body-sm t-mute (LAYOUT-NUMBERS § 헤드 블록 공통) */}
        <h1 className="text-heading-lg text-ink mt-6">{spec.title}</h1>

        <p className="text-body-sm text-ink-mute mt-1.5 max-w-80 text-pretty whitespace-pre-line">
          {spec.description}
        </p>

        {variant === 'maintenance' && maintenanceWindow && (
          <div className="text-micro text-ink-mute mt-4">
            <div className="tnum">
              {maintenanceWindow.startsAt} - {maintenanceWindow.endsAt}
            </div>
            <div className="tnum mt-1">약 {maintenanceWindow.durationMin}분 소요 예정</div>
            <div className="text-ink-secondary mt-2">점검 내용: {maintenanceWindow.brief}</div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {variant === 'not-found' && (
            <>
              <Button onClick={handleHome}>메인 화면으로</Button>
              {showBack && (
                <Button variant="secondary" onClick={handleBack}>
                  이전
                </Button>
              )}
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
              {isAuthenticated === true ? (
                showBack ? (
                  <Button onClick={handleBack}>이전 페이지</Button>
                ) : (
                  <Button variant="secondary" onClick={handleHome}>
                    메인 화면으로
                  </Button>
                )
              ) : isAuthenticated === false ? (
                <Button onClick={handleLogin}>로그인</Button>
              ) : (
                <>
                  <Button onClick={handleLogin}>로그인</Button>
                  {showBack && (
                    <Button variant="secondary" onClick={handleBack}>
                      이전 페이지
                    </Button>
                  )}
                </>
              )}
            </>
          )}

          {variant === 'offline' && (
            <>
              {offlineRetrying ? (
                <span className="text-micro text-ink-mute tnum">
                  재연결 시도 중... ({autoRetryCount}/{OFFLINE_MAX_RETRIES})
                </span>
              ) : offlineRetriesExhausted ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-caption text-danger">
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
              className="text-caption text-primary hover:text-primary-hover inline-flex items-center gap-1 font-medium"
            >
              상태 페이지
              <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="text-micro-cap text-ink-mute tnum absolute bottom-6 uppercase">
        AVATING · {year}
      </div>
    </main>
  );
}
