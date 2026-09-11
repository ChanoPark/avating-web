import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { STATUS_PAGE_URL, SUPPORT_EMAIL_HREF } from '@shared/config/constants';

/**
 * — 아이콘·일러스트 없이 타입 중심으로 그리고, 에러 코드·요청 ID 는 사용자에게 보여주지 않는다.
 */
export type ErrorVariant =
  | 'session-expired' // S-11-01 · 401
  | 'forbidden' // S-11-02 · 403
  | 'not-found' // S-11-03 · 404
  | 'server-error' // S-11-04 · 500
  | 'offline' // 정본 외
  | 'maintenance'; // 정본 외

type MaintenanceWindow = {
  startsAt: string;
  endsAt: string;
  durationMin: number;
  brief: string;
};

export type ErrorPageProps = {
  variant: ErrorVariant;
  /** 앱 셸 안에 놓일 때 true. 셸의 `<main>` 과 중복되지 않도록 랜드마크를 새로 만들지 않는다(`session-expired` 는 예외). */
  embedded?: boolean;
  /**
   * 사용자가 "다시 시도" 를 누른 횟수. 에러 경계 안에 두면 `resetErrorBoundary()` 마다
   * 초기화돼 `RETRY_ESCALATION_THRESHOLD` 에 영영 도달하지 못하므로, 상태는 경계 바깥에 둔다.
   */
  retryCount?: number;
  onRetry?: () => void;
  onContact?: () => void;
  canGoBack?: boolean;
  isAuthenticated?: boolean;
  maintenanceWindow?: MaintenanceWindow;
  maintenanceStatusUrl?: string;
};

// 정본 S-11-05 — 3회 연속 실패 기준.
const RETRY_ESCALATION_THRESHOLD = 3;

/** 재시도라는 개념이 성립하는 화면에서만 반복 실패로 승격한다. */
const ESCALATABLE: ReadonlySet<ErrorVariant> = new Set<ErrorVariant>(['server-error', 'offline']);

type Copy = { eyebrow: string; title: string; body: string };

const COPY: Record<ErrorVariant, Copy> = {
  'session-expired': {
    eyebrow: '세션 만료',
    title: '다시 로그인해 주세요.',
    body: '일정 시간 활동이 없어 자동으로 로그아웃됐어요. 다시 로그인하면 보던 화면으로 돌아갑니다.',
  },
  forbidden: {
    eyebrow: '접근 권한 없음',
    title: '이 페이지를 볼 권한이 없어요.',
    body: '다른 사람의 아바타나 대화는 열 수 없어요. 공유받은 링크라면 주소를 다시 확인해 주세요.',
  },
  'not-found': {
    eyebrow: '없는 페이지',
    title: '찾는 페이지가 없어요.',
    body: '주소가 바뀌었거나 삭제된 화면이에요. 대시보드에서 다시 시작해 주세요.',
  },
  'server-error': {
    eyebrow: '일시적인 오류',
    title: '문제가 생겼어요. 다시 시도해 주세요.',
    body: '요청을 처리하지 못했어요. 잠시 후 다시 시도하면 대부분 해결됩니다.',
  },
  // offline · maintenance 는 정본에 대응 화면이 없다 — 기존 판본 문구를 그대로 쓴다.
  offline: {
    eyebrow: '연결 끊김',
    title: '인터넷 연결이 불안정해요.',
    body: '연결 상태를 확인하고 다시 시도해 주세요.',
  },
  maintenance: {
    eyebrow: '점검 중',
    title: '잠깐 점검 중이에요.',
    body: '점검이 끝나면 다시 이용할 수 있어요.',
  },
};

const REPEAT_COPY: Copy = {
  eyebrow: '반복 실패',
  title: '여러 번 시도해도 처리되지 않아요.',
  body: '저희 쪽 문제일 수 있어요. 잠시 후 다시 시도하거나 문의를 남겨 주세요.',
};

function detectHasHistory(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

function ErrorBody({
  copy,
  actions,
  extra,
  wide = false,
}: {
  copy: Copy;
  actions?: ReactNode;
  extra?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`flex w-full flex-col items-center text-center ${wide ? 'max-w-[520px]' : 'max-w-[470px]'}`}
    >
      <div aria-hidden="true" className="bg-subtle mb-[22px] h-px w-[26px]" />
      <div className="text-label text-secondary uppercase">{copy.eyebrow}</div>
      <h1 className="text-title text-primary mt-3 text-balance">{copy.title}</h1>
      <p className="text-caption text-secondary mt-2.5 text-pretty">{copy.body}</p>
      {actions && <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">{actions}</div>}
      {extra}
    </div>
  );
}

function EscalationCard({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action: ReactNode;
}) {
  return (
    <div className="bg-surface rounded-card flex items-center justify-between gap-3 border border-transparent p-3.5 text-left">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-caption text-primary font-medium">{title}</span>
        <span className="text-meta text-secondary">{hint}</span>
      </div>
      {action}
    </div>
  );
}

export function ErrorPage({
  variant,
  embedded = false,
  retryCount = 0,
  onRetry,
  onContact,
  canGoBack,
  isAuthenticated,
  maintenanceWindow,
  maintenanceStatusUrl,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const escalated = ESCALATABLE.has(variant) && retryCount >= RETRY_ESCALATION_THRESHOLD;
  // 정본 문구를 그대로 쓰면 비인증 사용자에게는 있지도 않은 대시보드 버튼을 가리키게 되므로, 그
  // 문장만 뺀다.
  const loggedOutNotFound = variant === 'not-found' && isAuthenticated === false;
  const copy = escalated
    ? REPEAT_COPY
    : loggedOutNotFound
      ? { ...COPY['not-found'], body: '주소가 바뀌었거나 삭제된 화면이에요.' }
      : COPY[variant];
  const showBack = canGoBack ?? detectHasHistory();

  // 세션이 끊긴 화면은 셸이 존재할 수 없다 — 셸 자체가 인증을 전제한다.
  const flat = variant === 'session-expired' || !embedded;

  function goHome() {
    void navigate('/');
  }
  function goDashboard() {
    void navigate('/dashboard');
  }
  function goLogin() {
    void navigate('/login');
  }
  function goBack() {
    void navigate(-1);
  }
  function reloginWithRedirect() {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    void navigate(`/login?redirect=${redirect}`);
  }
  function handleRetry() {
    if (onRetry) {
      onRetry();
      return;
    }
    if (typeof window !== 'undefined') window.location.reload();
  }

  const secondaryHome = embedded ? (
    <Button variant="ghost" onClick={goDashboard}>
      대시보드로
    </Button>
  ) : (
    <Button variant="ghost" onClick={goHome}>
      서비스 소개로
    </Button>
  );

  let actions: ReactNode = null;
  let extra: ReactNode = null;

  if (escalated) {
    actions = (
      <>
        <Button onClick={handleRetry}>다시 시도</Button>
        {secondaryHome}
      </>
    );
    extra = (
      <div className="mt-7 flex w-full flex-col gap-2.5">
        <EscalationCard
          title="문의 남기기"
          hint="보통 하루 안에 답변해요"
          action={
            // 에러 코드·요청 ID 는 사용자에게 보여주지 않는다 — 지금은 식별자가 없어 링크만 연다.
            onContact ? (
              <Button variant="secondary" size="sm" onClick={onContact}>
                문의하기
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            ) : (
              <a
                href={SUPPORT_EMAIL_HREF}
                className="bg-fill-weak text-primary hover:bg-fill-weak-hover rounded-card text-btn inline-flex h-8 shrink-0 items-center gap-1 px-3 transition-colors"
              >
                문의하기
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </a>
            )
          }
        />
        <EscalationCard
          title="서비스 상태 확인"
          hint="전체 장애 여부를 먼저 확인할 수 있어요"
          action={
            <a
              href={maintenanceStatusUrl ?? STATUS_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:bg-surface hover:text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
            >
              상태 페이지
              <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          }
        />
      </div>
    );
  } else if (variant === 'session-expired') {
    actions = (
      <>
        <Button onClick={reloginWithRedirect}>다시 로그인</Button>
        <Button variant="ghost" onClick={goHome}>
          서비스 소개로
        </Button>
      </>
    );
  } else if (variant === 'forbidden') {
    actions = (
      <>
        <Button onClick={goDashboard}>탐색으로 돌아가기</Button>
        {showBack && (
          <Button variant="ghost" onClick={goBack}>
            이전 페이지
          </Button>
        )}
      </>
    );
  } else if (variant === 'not-found') {
    actions =
      isAuthenticated === false ? (
        <>
          <Button onClick={goHome}>서비스 소개로</Button>
          <Button variant="ghost" onClick={goLogin}>
            로그인
          </Button>
        </>
      ) : (
        // 정본은 버튼을 2개(탐색 둘러보기 포함) 두지만, 탐색 화면 라우트가 아직 없어 하나만 둔다.
        <Button onClick={goDashboard}>대시보드로</Button>
      );
  } else if (variant === 'maintenance') {
    extra = (
      <>
        {maintenanceWindow && (
          <div className="text-meta text-secondary mt-4">
            <div className="tnum">
              {maintenanceWindow.startsAt} - {maintenanceWindow.endsAt}
            </div>
            <div className="tnum mt-1">약 {maintenanceWindow.durationMin}분 소요 예정</div>
            <div className="text-secondary mt-2">점검 내용: {maintenanceWindow.brief}</div>
          </div>
        )}
        <a
          href={maintenanceStatusUrl ?? STATUS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-action hover:text-action-hover mt-6 inline-flex items-center gap-1 rounded-full font-medium"
        >
          상태 페이지
          <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </>
    );
  } else {
    // server-error · offline 는 자동 재시도를 걸지 않는다 — 수동 재시도만 제공한다.
    actions = (
      <>
        <Button onClick={handleRetry}>다시 시도</Button>
        {secondaryHome}
      </>
    );
  }

  const body = <ErrorBody copy={copy} actions={actions} extra={extra} wide={escalated} />;

  if (!flat) {
    // 셸에 이미 <main> 이 있으므로, 여기서는 본문 영역만 교체하고 랜드마크는 새로 만들지 않는다.
    return <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">{body}</div>;
  }

  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      <div className="border-subtle bg-canvas flex h-17 shrink-0 items-center justify-between border-b px-6 md:px-16">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-action rounded-chip h-[19px] w-[19px]" />
          <span className="text-primary text-[14.82px] font-medium tracking-[-0.4px]">Avating</span>
        </div>
        <span className="text-caption text-secondary">
          {variant === 'session-expired' ? '로그인 화면' : '오류'}
        </span>
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-12">{body}</main>
    </div>
  );
}
