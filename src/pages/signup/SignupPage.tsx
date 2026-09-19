import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SignupForm } from '@features/auth/ui/SignupForm';
import { AuthLayout } from '@features/auth/ui/AuthLayout';
import { SiteHeader } from '@features/auth/ui/SiteHeader';
import { clearDraft } from '@features/persona-survey/lib/draftStorage';
import { clearOnboardingProgress } from '@entities/onboarding';
import { useAuthStore } from '@entities/auth/store';

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
      header={
        <SiteHeader
          onNavigate={(targetId) => {
            // 내비가 가리키는 밴드는 랜딩에만 있다 — 랜딩이 해시를 보고 스크롤한다.
            void navigate(`/#${targetId}`);
          }}
        />
      }
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
