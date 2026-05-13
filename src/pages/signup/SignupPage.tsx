import { useNavigate } from 'react-router';
import { SignupForm } from '@features/auth/ui/SignupForm';

const BRAND_FEATURES = ['책임 없는 도파민', '답답하면 훈수 한 스푼', '나답게 움직이는 AI 생성'];

export function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-4 py-8">
      <div className="border-border bg-bg-elev-1 grid w-full max-w-[960px] overflow-hidden rounded-xl border md:grid-cols-[1.4fr_1fr]">
        <aside
          aria-label="브랜드 소개"
          className="border-border bg-bg-elev-1 flex flex-col gap-5 border-b p-8 md:border-r md:border-b-0 md:p-10"
        >
          <span className="font-ui text-heading text-brand select-none">Avating</span>

          <div
            aria-hidden="true"
            className="border-border bg-bg h-24 rounded-md border"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <h2 className="font-ui text-title text-text whitespace-pre-line select-none">
            {'귀찮은 밀당은 아바타가,\n결정은 당신이.'}
          </h2>
          <p className="text-body-sm text-text-2 whitespace-pre-line select-none">
            {'AI 아바타를 소개팅에 매칭하고, 관전하고,\n결정적인 순간에만 개입하세요.'}
          </p>

          <ul className="mt-2 flex flex-col gap-2">
            {BRAND_FEATURES.map((feature) => (
              <li key={feature} className="text-body-sm text-text-2 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="bg-brand-soft border-brand-border text-brand flex h-4 w-4 items-center justify-center rounded-[3px] border text-[10px]"
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </aside>

        <section aria-labelledby="signup-heading" className="bg-bg-elev-1 p-8 md:p-10">
          <h1 id="signup-heading" className="font-ui text-heading text-text mb-6">
            계정 만들기
          </h1>
          <SignupForm
            onSuccess={() => {
              void navigate('/onboarding');
            }}
          />
        </section>
      </div>
    </div>
  );
}
