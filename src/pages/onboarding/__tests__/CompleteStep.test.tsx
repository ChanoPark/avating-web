import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import {
  generatedAvatarHandlers,
  completeOnboardingHandlers,
  mockCompleteOnboardingResponse,
  mockGeneratedAvatar,
} from '@shared/mocks/handlers/onboarding';
import { CompleteStep } from '@features/onboarding-complete/ui/CompleteStep';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('CompleteStep (Avatar Confirm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('avating:onboarding:progress', 'complete');
    server.use(generatedAvatarHandlers.success, completeOnboardingHandlers.success);
  });

  describe('와이어프레임 헤더', () => {
    it('STEP 4 / 4 · 아바타 확인 라벨이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByText(/STEP 4 \/ 4 · 아바타 확인/)).toBeInTheDocument();
      });
    });

    it('"생성된 아바타를 확인하세요" 제목이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /생성된 아바타를 확인하세요/ })
        ).toBeInTheDocument();
      });
    });

    it('초기 튜닝 카운터 "0/3" 이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByText('0/3')).toBeInTheDocument();
      });
    });
  });

  describe('아바타 데이터 렌더링', () => {
    it('API 응답 후 아바타 이름이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByText(mockGeneratedAvatar.data.name)).toBeInTheDocument();
      });
    });

    it('6개의 클릭 가능한 스탯 버튼이 렌더된다 (공감·적극성·유머·감성·경청·표현력)', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /적극성 스탯/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /유머 스탯/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /감성 스탯/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /경청 스탯/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /표현력 스탯/ })).toBeInTheDocument();
      });
    });

    it('HexRadar(role=img) 가 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /아바타 스탯 레이더/ })).toBeInTheDocument();
      });
    });

    it('태그 목록이 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        for (const tag of mockGeneratedAvatar.data.tags) {
          expect(screen.getByText(tag)).toBeInTheDocument();
        }
      });
    });

    it('태그 개수가 최대 6개 이하이다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const tagElements = screen.getAllByTestId('avatar-tag');
        expect(tagElements.length).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('인터랙티브 스탯 튜닝', () => {
    it('스탯 클릭 시 미니 설문 다이얼로그가 열린다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /공감 스탯/ }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/상대방 감정에 얼마나 잘 공감하나요/)).toBeInTheDocument();
    });

    it('미니 설문 답변 선택 시 다이얼로그가 닫히고 카운터가 1 증가한다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /공감 스탯/ }));
      await user.click(screen.getByRole('button', { name: /매우 잘 공감/ }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('Escape 키로 다이얼로그를 닫으면 트리거 버튼으로 포커스가 복원된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
      });

      const triggerBtn = screen.getByRole('button', { name: /공감 스탯/ });
      await user.click(triggerBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // requestAnimationFrame 으로 포커스 복원되므로 다음 paint 대기
      await waitFor(() => {
        expect(triggerBtn).toHaveFocus();
      });
    });

    it('X 버튼 클릭 시 다이얼로그가 닫힌다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /공감 스탯/ }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /다이얼로그 닫기/ }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('3회 튜닝 후 추가 클릭 시 토스트가 노출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /공감 스탯/ })).toBeInTheDocument();
      });

      // 3번 튜닝
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /공감 스탯/ }));
        await user.click(screen.getByRole('button', { name: /매우 잘 공감/ }));
      }

      expect(screen.getByText('3/3')).toBeInTheDocument();

      // 4번째 시도
      await user.click(screen.getByRole('button', { name: /공감 스탯/ }));

      await waitFor(() => {
        expect(screen.getByText(/더 이상 조정할 수 없습니다/)).toBeInTheDocument();
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('대시보드 이동', () => {
    it('"시작하기" 클릭 시 POST /api/onboarding/complete 가 호출된다', async () => {
      const user = userEvent.setup();
      let completeCallCount = 0;

      server.use(
        generatedAvatarHandlers.success,
        http.post(`${BASE_URL}/api/onboarding/complete`, () => {
          completeCallCount++;
          return HttpResponse.json(mockCompleteOnboardingResponse);
        })
      );

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '시작하기' }));

      await waitFor(() => {
        expect(completeCallCount).toBe(1);
      });
    });

    it('"시작하기" 성공 시 /dashboard 로 navigate 가 호출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '시작하기' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('409 응답 시 토스트가 노출되고 navigate 는 호출되지 않는다', async () => {
      const user = userEvent.setup();
      server.use(generatedAvatarHandlers.success, completeOnboardingHandlers.conflict);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '시작하기' }));

      await waitFor(() => {
        expect(screen.getByText(/이미 온보딩이 완료되었습니다/)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });

    it('서버 응답에 message 가 없으면 "오류가 발생했습니다." fallback 토스트가 노출된다', async () => {
      const user = userEvent.setup();
      server.use(
        generatedAvatarHandlers.success,
        http.post(`${BASE_URL}/api/onboarding/complete`, () => {
          return HttpResponse.json({ message: '' }, { status: 500 });
        })
      );

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '시작하기' }));

      await waitFor(() => {
        expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('데이터 fetch 실패', () => {
    it('서버 500 응답 시 ErrorBoundary fallback 이 노출된다', async () => {
      server.use(generatedAvatarHandlers.serverError, completeOnboardingHandlers.success);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const errorEl = screen.queryByRole('alert') ?? screen.queryByText(/오류|에러|실패|다시/i);
        expect(errorEl).toBeInTheDocument();
      });
    });

    it('404 응답 시 ErrorBoundary fallback 이 노출된다', async () => {
      server.use(generatedAvatarHandlers.notFound, completeOnboardingHandlers.success);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        const errorEl = screen.queryByRole('alert') ?? screen.queryByText(/오류|에러|실패|다시/i);
        expect(errorEl).toBeInTheDocument();
      });
    });
  });
});
