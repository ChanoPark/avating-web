import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AuthGuard } from './providers/AuthGuard';
import { SuspenseRoute } from './providers/SuspenseRoute';

const ServiceIntroPage = lazy(() =>
  import('@pages/service-intro').then((m) => ({ default: m.ServiceIntroPage }))
);
const LoginPage = lazy(() => import('@pages/login').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@pages/signup').then((m) => ({ default: m.SignupPage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SuspenseRoute>
        <ServiceIntroPage />
      </SuspenseRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <SuspenseRoute>
        <LoginPage />
      </SuspenseRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <SuspenseRoute>
        <SignupPage />
      </SuspenseRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <SuspenseRoute>
        <AuthGuard>
          <div>Dashboard (placeholder)</div>
        </AuthGuard>
      </SuspenseRoute>
    ),
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
]);
