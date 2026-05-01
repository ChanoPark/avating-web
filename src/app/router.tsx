import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AuthGuard } from './providers/AuthGuard';
import { SuspenseRoute } from './providers/SuspenseRoute';
import { PageTransition } from './providers/PageTransition';
import { AppShellLayout } from './layouts/AppShellLayout';

const ServiceIntroPage = lazy(() =>
  import('@pages/service-intro').then((m) => ({ default: m.ServiceIntroPage }))
);
const LoginPage = lazy(() => import('@pages/login').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@pages/signup').then((m) => ({ default: m.SignupPage })));
const DashboardPage = lazy(() =>
  import('@pages/dashboard').then((m) => ({ default: m.DashboardPage }))
);
const AvatarDetailPage = lazy(() =>
  import('@pages/avatar-detail').then((m) => ({ default: m.AvatarDetailPage }))
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <SuspenseRoute>
        <PageTransition>
          <ServiceIntroPage />
        </PageTransition>
      </SuspenseRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <SuspenseRoute>
        <PageTransition>
          <LoginPage />
        </PageTransition>
      </SuspenseRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <SuspenseRoute>
        <PageTransition>
          <SignupPage />
        </PageTransition>
      </SuspenseRoute>
    ),
  },
  {
    element: (
      <SuspenseRoute>
        <AuthGuard>
          <AppShellLayout />
        </AuthGuard>
      </SuspenseRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/avatars/:id',
        element: <AvatarDetailPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div>Not Found</div>,
  },
]);
