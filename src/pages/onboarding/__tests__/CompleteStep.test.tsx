import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@shared/mocks/server';
import { CompleteStep } from '@features/onboarding-complete/ui/CompleteStep';
import type { AvatarSummary } from '@entities/avatar';
import { PERSONA_STAT_KEYS } from '@entities/avatar';
import { primaryAvatarHandlers } from '@shared/mocks/handlers/primaryAvatar';
import { queryClientWithPrimaryAvatar, SAMPLE_PRIMARY_AVATAR } from '@/test/onboardingCompletion';

// 완료 화면은 별도 조회 API 없이 useSurveySubmit 이 심어 둔 대표 아바타 캐시를 그대로 쓴다 —
// 테스트도 같은 방식으로 캐시를 미리 채워 생성 직후 상태를 재현한다.
function renderComplete(primary: AvatarSummary | null = SAMPLE_PRIMARY_AVATAR) {
  return renderWithProviders(<CompleteStep />, {
    initialRoute: '/onboarding/complete',
    queryClient: queryClientWithPrimaryAvatar(primary),
  });
}

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('CompleteStep (Avatar Confirm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('avating:onboarding:progress', 'complete');
  });

  // 확인 화면에 있을 자격은 "대표 아바타를 갖고 있는가" 로만 정한다.
  describe('진입 가드', () => {
    it('대표 아바타가 없으면 이어서 진행할 화면으로 되돌린다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'creating');
      localStorage.setItem('avating:onboarding:method', 'survey');
      renderComplete(null);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/survey', { replace: true });
      });
    });

    it('대표 아바타가 있으면 진행 기록과 무관하게 확인 화면에 머문다', async () => {
      localStorage.setItem('avating:onboarding:progress', 'welcome');
      renderComplete();

      await waitFor(() => {
        expect(screen.getByText(/생성 완료/)).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // 조회 실패까지 미완료로 취급하면, 서버가 흔들릴 때마다 완료한 사용자가 온보딩과 이 화면을 왕복하게 된다.
    it('보유 여부를 확인하지 못하면 화면을 옮기지 않고 오류 상태를 보여준다', async () => {
      server.use(primaryAvatarHandlers.serverError);
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('와이어프레임 헤더 (읽기 전용 확인)', () => {
    it('"생성 완료" 배지가 렌더되고 STEP 라벨은 없다 (진행 표시는 레일 담당)', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByText(/생성 완료/)).toBeInTheDocument();
      });
      expect(screen.queryByText(/STEP 4 \/ 4/)).not.toBeInTheDocument();
    });

    it('"이렇게 생성됐어요" 제목과 서브 카피가 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /이렇게 생성됐어요/ })
        ).toBeInTheDocument();
      });
      expect(screen.getByText('내용을 확인한 뒤 완료를 눌러 주세요.')).toBeInTheDocument();
    });
  });

  describe('아바타 데이터 렌더링 (생성 응답 재사용)', () => {
    it('캐시에 심긴 생성 응답의 이름이 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRIMARY_AVATAR.name)).toBeInTheDocument();
      });
    });

    it('한 줄 소개(description)가 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRIMARY_AVATAR.description)).toBeInTheDocument();
      });
    });

    it('description 이 빈 문자열이면 소개 줄을 렌더하지 않는다', async () => {
      renderComplete({ ...SAMPLE_PRIMARY_AVATAR, description: '' });

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRIMARY_AVATAR.name)).toBeInTheDocument();
      });
      expect(screen.queryByText(SAMPLE_PRIMARY_AVATAR.description)).not.toBeInTheDocument();
    });

    // 서버가 아직 아바타 이미지를 지원하지 않아 빈 placeholder 로 자리만 잡는다.
    it('이니셜 대신 빈 이미지 placeholder 가 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByTestId('avatar-image-placeholder')).toBeInTheDocument();
      });
    });

    it('서버 7지표(PersonaStatType) 스탯 바가 모두 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByTestId('stat-bar-fill-OPENNESS')).toBeInTheDocument();
      });
      for (const key of PERSONA_STAT_KEYS) {
        expect(screen.getByTestId(`stat-bar-fill-${key}`)).toBeInTheDocument();
      }
    });

    it('소수 스탯 값은 반올림해 표시한다', async () => {
      renderComplete();

      // SAMPLE 의 OPENNESS 는 72.5 — 표시는 73.
      await waitFor(() => {
        expect(screen.getByText('73')).toBeInTheDocument();
      });
      expect(screen.queryByText('72.5')).not.toBeInTheDocument();
    });

    it('stats 에 없는 지표 키는 행을 그리지 않는다', async () => {
      const { OPENNESS: _omitted, ...restStats } = SAMPLE_PRIMARY_AVATAR.stats;
      renderComplete({ ...SAMPLE_PRIMARY_AVATAR, stats: restStats });

      await waitFor(() => {
        expect(screen.getByTestId('stat-bar-fill-EMPATHY')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('stat-bar-fill-OPENNESS')).not.toBeInTheDocument();
    });

    it('태그 목록이 렌더된다', async () => {
      renderComplete();

      await waitFor(() => {
        for (const tag of SAMPLE_PRIMARY_AVATAR.tags) {
          expect(screen.getByText(tag)).toBeInTheDocument();
        }
      });
    });

    it('태그가 비어 있으면 태그 영역을 렌더하지 않는다', async () => {
      renderComplete({ ...SAMPLE_PRIMARY_AVATAR, tags: [] });

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRIMARY_AVATAR.name)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('avatar-tag')).not.toBeInTheDocument();
    });

    // 스탯 다듬기(6축 튜닝)는 서버 7지표 전환으로 제거됐다 — 디자인 확정 후 재도입 여부 결정.
    it('스탯 다듬기 버튼이 없다', async () => {
      renderComplete();

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRIMARY_AVATAR.name)).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /스탯 다듬기/ })).not.toBeInTheDocument();
    });
  });

  // 완료는 API 호출 없이 대시보드로 직행한다 (2026-08-30 사용자 결정) —
  // POST /api/onboarding/complete 를 호출하면 MSW unhandled throw 로 이 테스트가 깨진다.
  describe('대시보드 이동', () => {
    it('"완료" 클릭 시 API 호출 없이 /dashboard 로 navigate 된다', async () => {
      const user = userEvent.setup();
      renderComplete();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '완료' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('"완료" 클릭 시 온보딩 진행 기록이 초기화된다', async () => {
      const user = userEvent.setup();
      renderComplete();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(localStorage.getItem('avating:onboarding:progress')).toBeNull();
    });
  });

  // 캐시가 비어 있으면(새로고침 등) GET /api/avatars/primary 재조회가 화면 데이터를 채운다.
  describe('캐시 미보유 시 재조회', () => {
    it('primary 200 응답으로 카드가 렌더된다', async () => {
      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByText('루시')).toBeInTheDocument();
      });
      expect(screen.getByTestId('stat-bar-fill-OPENNESS')).toBeInTheDocument();
    });

    it('primary 500 응답 시 오류 fallback 이 노출된다', async () => {
      server.use(primaryAvatarHandlers.serverError);

      renderWithProviders(<CompleteStep />, { initialRoute: '/onboarding/complete' });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByText(/오류가 발생했습니다. 다시 시도해주세요./)).toBeInTheDocument();
    });
  });
});
