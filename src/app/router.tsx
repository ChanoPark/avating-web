import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
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
const ErrorPage = lazy(() => import('@pages/error').then((m) => ({ default: m.ErrorPage })));
const OnboardingPage = lazy(() =>
  import('@pages/onboarding').then((m) => ({ default: m.OnboardingPage }))
);
const WelcomeStep = lazy(() =>
  import('@pages/onboarding/steps/WelcomeStep').then((m) => ({ default: m.WelcomeStep }))
);
const SurveyStep = lazy(() =>
  import('@pages/onboarding/steps/SurveyStep').then((m) => ({ default: m.SurveyStep }))
);
const ConnectStep = lazy(() =>
  import('@pages/onboarding/steps/ConnectStep').then((m) => ({ default: m.ConnectStep }))
);
const CompleteStep = lazy(() =>
  import('@pages/onboarding/steps/CompleteStep').then((m) => ({ default: m.CompleteStep }))
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
    path: '/onboarding',
    element: (
      <SuspenseRoute>
        <AuthGuard>
          <OnboardingPage />
        </AuthGuard>
      </SuspenseRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/onboarding/welcome" replace /> },
      { path: 'welcome', element: <WelcomeStep /> },
      { path: 'survey', element: <SurveyStep /> },
      { path: 'connect', element: <ConnectStep /> },
      { path: 'complete', element: <CompleteStep /> },
    ],
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
    element: (
      <SuspenseRoute>
        <ErrorPage variant="not-found" />
      </SuspenseRoute>
    ),
  },
]);
