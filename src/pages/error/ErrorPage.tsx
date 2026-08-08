import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { STATUS_PAGE_URL, SUPPORT_EMAIL_HREF } from '@shared/config/constants';

/**
 * 정본: `.claude/design/2026-08-06-wireframe-v2.3/wf/wf-s6-errors.jsx` (S-11-01 ~ S-11-05)
 *
 * 정본이 못박은 원칙 셋 —
 * ① 그래픽 없이 타입 중심. 아이콘 박스·일러스트·격자 배경을 두지 않는다.
 * ② 에러 코드·요청 ID 는 사용자에게 노출하지 않는다.
 * ③ 세션이 끊긴 401 만 셸 없이, 로그인 상태의 403·404·500 은 셸 안에서 본문만 교체한다.
 */
export type ErrorVariant =
  | 'session-expired' // S-11-01 · 401
  | 'forbidden' // S-11-02 · 403
  | 'not-found' // S-11-03 · 404
  | 'server-error' // S-11-04 · 500
  | 'offline' // 정본 외 — 유지 결정 (2026-08-07)
  | 'maintenance'; // 정본 외 — 유지 결정 (2026-08-07)

type MaintenanceWindow = {
  startsAt: string;
  endsAt: string;
  durationMin: number;
  brief: string;
};

export type ErrorPageProps = {
  variant: ErrorVariant;
  /**
   * 앱 셸(AppShellLayout) 안에 놓일 때 true. 셸이 이미 `<main>` 을 갖고 있으므로
   * 랜드마크를 새로 만들지 않는다. `session-expired` 는 셸이 없는 화면이라 무시된다.
   */
  embedded?: boolean;
  /**
   * 사용자가 "다시 시도" 를 누른 횟수. `RETRY_ESCALATION_THRESHOLD` 에 도달하면
   * S-11-05 반복 실패 화면으로 교체한다. 이 카운터는 에러 경계 **바깥**에서 살아야 한다 —
   * `FallbackComponent` 는 `resetErrorBoundary()` 마다 언마운트되기 때문이다.
   */
  retryCount?: number;
  onRetry?: () => void;
  onContact?: () => void;
  canGoBack?: boolean;
  isAuthenticated?: boolean;
  maintenanceWindow?: MaintenanceWindow;
  maintenanceStatusUrl?: string;
};

/** 정본 S-11-05: "재시도 3회 연속 실패하면 S-11-04를 이 화면으로 교체합니다." */
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
  // 아래 둘은 정본에 대응 화면이 없다. S-11 의 ErrBody 골격과 해요체 톤만 따르고
  // 문구는 기존 판본에서 이어받았다 (design-fidelity § 4 — 정본 침묵 시 기본기 적용).
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

/**
 * 정본 `ErrBody` — 26×1px 룰 → eyebrow → 제목 → 본문 → 액션.
 * 폭은 470(반복 실패만 520)이고, 룰 아래 22 / 제목 위 12 / 본문 위 10 / 액션 위 26.
 */
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
      <div aria-hidden="true" className="bg-hairline-input mb-[22px] h-px w-[26px]" />
      <div className="text-micro-cap text-ink-mute uppercase">{copy.eyebrow}</div>
      <h1 className="text-heading-lg text-ink mt-3 text-balance">{copy.title}</h1>
      <p className="text-body-sm text-ink-mute mt-2.5 text-pretty">{copy.body}</p>
      {actions && <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">{actions}</div>}
      {extra}
    </div>
  );
}

/** S-11-05 의 문의 · 상태 페이지 카드. `.av-card--soft` = canvas-soft + 투명 테두리. */
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
    <div className="bg-canvas-soft flex items-center justify-between gap-3 rounded-md border border-transparent p-3.5 text-left">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-caption text-ink font-medium">{title}</span>
        <span className="text-micro text-ink-mute">{hint}</span>
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
  const copy = escalated ? REPEAT_COPY : COPY[variant];
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

  // 화면·밴드마다 채워진 파란 CTA 는 정확히 1개 (v2 절대 규칙 ①).
  // 부가 액션의 목적지는 셸 안이면 대시보드, 밖이면 랜딩이다.
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
            // 정본은 에러 코드·요청 ID 를 문의 링크에 "내부적으로만" 붙이라고 한다.
            // 지금은 붙일 식별자 자체가 없어 링크만 연다.
            onContact ? (
              <Button variant="secondary" size="sm" onClick={onContact}>
                문의하기
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            ) : (
              <a
                href={SUPPORT_EMAIL_HREF}
                className="border-primary bg-surface text-primary rounded-pill hover:bg-primary-wash focus-visible:shadow-focus inline-flex shrink-0 items-center gap-1 border px-3 py-1.5 text-[13px] font-medium transition-colors"
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
              className="text-ink-secondary hover:bg-canvas-soft hover:text-ink rounded-pill focus-visible:shadow-focus inline-flex shrink-0 items-center gap-1 px-3 py-1.5 text-[13px] font-medium transition-colors"
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
    // 정본 note: "비로그인 상태에서 같은 주소로 들어오면 셸 없이 S-11-01과 같은 플랫
    // 레이아웃을 쓰고, 액션만 '서비스 소개로 · 로그인'으로 교체합니다."
    actions =
      isAuthenticated === false ? (
        <>
          <Button onClick={goHome}>서비스 소개로</Button>
          <Button variant="ghost" onClick={goLogin}>
            로그인
          </Button>
        </>
      ) : (
        // 정본의 부가 액션 "탐색 둘러보기" 는 S-03-02 탐색 화면을 가리키는데 이 앱에는
        // 아직 그 라우트가 없다(사이드바 '탐색' 도 /dashboard 를 가리킨다). 같은 곳으로
        // 가는 버튼을 둘 두지 않고 주 액션만 남긴다.
        <Button onClick={goDashboard}>대시보드로</Button>
      );
  } else if (variant === 'maintenance') {
    extra = (
      <>
        {maintenanceWindow && (
          <div className="text-micro text-ink-mute mt-4">
            <div className="tnum">
              {maintenanceWindow.startsAt} - {maintenanceWindow.endsAt}
            </div>
            <div className="tnum mt-1">약 {maintenanceWindow.durationMin}분 소요 예정</div>
            <div className="text-ink-secondary mt-2">점검 내용: {maintenanceWindow.brief}</div>
          </div>
        )}
        <a
          href={maintenanceStatusUrl ?? STATUS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-primary hover:text-primary-hover focus-visible:shadow-focus rounded-pill mt-6 inline-flex items-center gap-1 font-medium"
        >
          상태 페이지
          <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </>
    );
  } else {
    // server-error · offline — 수동 재시도만. 정본: "자동 재시도는 하지 않습니다."
    actions = (
      <>
        <Button onClick={handleRetry}>다시 시도</Button>
        {secondaryHome}
      </>
    );
  }

  const body = <ErrorBody copy={copy} actions={actions} extra={extra} wide={escalated} />;

  if (!flat) {
    // 셸 안 — 본문 영역만 교체한다. 랜드마크는 셸이 이미 갖고 있다.
    return <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">{body}</div>;
  }

  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      {/* 정본 S-11-01 의 상단바 — height 68, 좌우 64, 하단 hairline, 흰 서피스. */}
      <div className="border-hairline bg-surface flex h-17 shrink-0 items-center justify-between border-b px-6 md:px-16">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-primary h-[19px] w-[19px] rounded-[5.32px]" />
          <span className="text-ink text-[14.82px] font-medium tracking-[-0.4px]">Avating</span>
        </div>
        <span className="text-caption text-ink-mute">
          {variant === 'session-expired' ? '로그인 화면' : '오류'}
        </span>
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-12">{body}</main>
    </div>
  );
}
