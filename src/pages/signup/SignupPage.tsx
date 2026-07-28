import { useNavigate } from 'react-router';
import { SignupForm } from '@features/auth/ui/SignupForm';
import { AuthLayout, type AuthAsideItem } from '@features/auth/ui/AuthLayout';

// 정본 `ScreenSignup` 의 AuthAside 3항목.
const ASIDE_ITEMS: readonly AuthAsideItem[] = [
  { title: '아바타 생성', description: '설문 6문항 또는 Bot 연동' },
  { title: '시뮬레이션 관전', description: '아바타끼리 대화, 훈수로 개입' },
  { title: '에프터 연결', description: '호감도 75 이상이면 실제 채팅' },
];

export function SignupPage() {
  const navigate = useNavigate();

  // 정본 v2 `ScreenSignup`: 좌 폼 페인 + 우 AuthAside 340 의 2단 구성.
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
          void navigate('/onboarding');
        }}
      />
    </AuthLayout>
  );
}
