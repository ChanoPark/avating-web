import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SignupForm } from '@features/auth/ui/SignupForm';
import { AuthLayout, type AuthAsideItem } from '@features/auth/ui/AuthLayout';
import { clearDraft } from '@features/persona-survey/lib/draftStorage';
import { clearOnboardingProgress } from '@entities/onboarding';
import { useAuthStore } from '@entities/auth/store';

const ASIDE_ITEMS: readonly AuthAsideItem[] = [
  // 총 문항 수는 서버 시딩(지표 7종 × questionCount)에 따라 달라진다 — 문구에 숫자를 박지 않는다.
  { title: '아바타 생성', description: '성향 설문 또는 Bot 연동' },
  { title: '시뮬레이션 관전', description: '아바타끼리 대화, 훈수로 개입' },
  { title: '에프터 연결', description: '호감도 75 이상이면 실제 채팅' },
];

export function SignupPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);

  // 로그인한 채로 가입 화면에 들어오면(뒤로가기 등) 빈 폼이 보여 로그아웃된 것처럼 읽힌다.
  useEffect(() => {
    if (status === 'authenticated') {
      void navigate('/onboarding', { replace: true });
    }
  }, [status, navigate]);

  return (
    <AuthLayout
      headingId="signup-heading"
      title="계정 만들기"
      subtitle="2분이면 아바타를 만들고 첫 매칭을 시작할 수 있어요."
      asideItems={ASIDE_ITEMS}
      asideNote="가입 시 본인 인증은 받지 않습니다 — 실제 연결 시점에만 1회 진행."
      footnote="가입하면 아바타 생성 온보딩으로 바로 이동합니다."
    >
      <SignupForm
        onSuccess={() => {
          // 온보딩 로컬 상태는 브라우저 단위로 남으므로, 새 계정이 앞사람 진행도를 물려받지 않도록 여기서 지운다.
          clearOnboardingProgress();
          clearDraft();
          void navigate('/onboarding');
        }}
      />
    </AuthLayout>
  );
}
