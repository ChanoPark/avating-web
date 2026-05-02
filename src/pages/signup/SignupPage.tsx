import { useNavigate } from 'react-router';
import { SignupForm } from '@features/auth/ui/SignupForm';

export function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-title text-text mb-8 text-center">회원가입</h1>
        <SignupForm onSuccess={() => void navigate('/onboarding')} />
      </div>
    </div>
  );
}
