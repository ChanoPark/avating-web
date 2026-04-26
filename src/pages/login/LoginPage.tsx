import { LoginForm } from '@features/auth/ui/LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-title text-text mb-8 text-center">로그인</h1>
        <LoginForm />
      </div>
    </div>
  );
}
