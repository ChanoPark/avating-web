import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@shared/mocks/server';
import {
  mockCreatedInvitation,
  setMatchRequestScenario,
  resetMatchRequestScenario,
} from '@shared/mocks/handlers/matchRequest';
import { mockOwnedAvatars, ownedAvatarsHandlers } from '@shared/mocks/handlers/ownedAvatars';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MatchRequestModal } from '../ui/MatchRequestModal';
import type { PartnerAvatarSummary } from '../ui/PartnerAvatarCard';

const partner: PartnerAvatarSummary = {
  name: 'Moonlit Narrator',
  hashtag: 'M00N7K',
  description: '심야의 책방을 좋아하는 낭만가.',
  color: '67C4F2',
};

function defaultProps(overrides: Partial<Parameters<typeof MatchRequestModal>[0]> = {}) {
  return {
    open: true,
    partnerAvatarId: 'avatar-1',
    partner,
    onClose: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  resetMatchRequestScenario();
});

afterEach(() => {
  resetMatchRequestScenario();
});

describe('MatchRequestModal', () => {
  describe('렌더링', () => {
    it('open=true 일 때 dialog 가 렌더된다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /이 아바타에게 소개팅을 요청할까요\?/ })
      ).toBeInTheDocument();
      expect(screen.queryByText('MATCH REQUEST')).not.toBeInTheDocument();
    });

    it('제목 아래 안내문·"1개 선택"·만료 각주는 두지 않는다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByRole('radiogroup');

      expect(within(dialog).queryByText(/수락하면 두 아바타가 대화를 시작해요/)).toBeNull();
      expect(within(dialog).queryByText('1개 선택')).toBeNull();
      expect(within(dialog).queryByText(/24시간 안에 응답이 없으면/)).toBeNull();
      expect(dialog).not.toHaveAttribute('aria-describedby');
    });

    it('open=false 일 때 dialog 가 렌더되지 않는다', () => {
      renderWithProviders(<MatchRequestModal {...defaultProps({ open: false })} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('상대 아바타 카드가 표시된다 (identity 타일·이름·해시태그·소개)', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Moonlit Narrator')).toBeInTheDocument();
      expect(within(dialog).getByText('#M00N7K')).toBeInTheDocument();
      expect(within(dialog).getByText('심야의 책방을 좋아하는 낭만가.')).toBeInTheDocument();
      expect(within(dialog).getByText('M')).toHaveClass('bg-id-sky');
      // 서버 상세 응답에 없는 인증·온라인 상태는 그리지 않는다.
      expect(within(dialog).queryByText('인증')).not.toBeInTheDocument();
      expect(within(dialog).queryByText('온라인')).not.toBeInTheDocument();
    });

    it('Sheet 규격(560 · radius 16 · hairline)이 적용된다 — 640 아래에선 화면 전체', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-140');
      expect(dialog).toHaveClass('sm:rounded-[16px]');
      expect(dialog).toHaveClass('border-subtle');
    });

    it('내 아바타 라디오 그룹이 로드되고 첫 항목이 기본 선택된다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup', {
        name: /요청에 사용할 내 아바타/,
      });
      expect(radioGroup).toBeInTheDocument();

      await waitFor(() => {
        expect(within(radioGroup).getByText('hyunwoo')).toBeInTheDocument();
      });
      const hyunwooRadio = within(radioGroup).getByRole('radio', { name: /hyunwoo/ });
      await waitFor(() => {
        expect(hyunwooRadio).toBeChecked();
      });
    });

    it('내 아바타 행에 identity 타일과 한 줄 소개가 보이고, 소개가 비면 줄을 그리지 않는다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');
      expect(
        within(radioGroup).getByText('조용한 카페에서 책 읽는 걸 좋아해요')
      ).toBeInTheDocument();
      expect(within(radioGroup).getByText('h', { selector: '.bg-id-sky' })).toBeInTheDocument();

      const softRow = within(radioGroup)
        .getByRole('radio', { name: /hyunsoft/ })
        .closest('label');
      expect(softRow).toHaveTextContent(/^hhyunsoft#HS3M9P$/);
    });

    it('이름 옆에 해시태그를, 행 오른쪽 끝에 "대표"·"매칭 중" 태그를 둔다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');

      const primaryRow = within(radioGroup)
        .getByRole('radio', { name: /hyunwoo/ })
        .closest('label');
      const nameLine = within(primaryRow!).getByText('hyunwoo').parentElement;
      expect(nameLine).toHaveTextContent(/^hyunwoo#HW4K7Z$/);
      expect(primaryRow?.lastElementChild).toHaveTextContent(/^대표$/);

      const busyRow = within(radioGroup)
        .getByRole('radio', { name: /hyun_night/ })
        .closest('label');
      expect(busyRow?.lastElementChild).toHaveTextContent(/^매칭 중$/);
    });

    it('시뮬레이션에 참가할 수 없는 아바타(canJoinSimulation=false)는 "매칭 중" 으로 disabled 된다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const busyRadio = screen.getByRole('radio', { name: /hyun_night/ });
      expect(busyRadio).toBeDisabled();
      expect(busyRadio.closest('label')).toHaveTextContent('매칭 중');
    });
  });

  describe('포커스 라이프사이클', () => {
    it('모달 오픈 시 첫 번째 비-busy 라디오로 포커스가 이동한다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');
      const firstRadio = within(radioGroup).getByRole('radio', { name: /hyunwoo/ });
      await waitFor(() => {
        expect(document.activeElement).toBe(firstRadio);
      });
    });

    it('모달이 닫히면 (Esc) 트리거 요소로 포커스가 복귀한다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      function Harness({ open }: { open: boolean }) {
        return (
          <>
            <button type="button" data-testid="trigger">
              매칭 요청 열기
            </button>
            <MatchRequestModal {...defaultProps({ open, onClose })} />
          </>
        );
      }
      const { rerender } = renderWithProviders(<Harness open={false} />);
      const trigger = screen.getByTestId('trigger');
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      rerender(<Harness open={true} />);
      await screen.findByRole('radiogroup');
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();

      rerender(<Harness open={false} />);
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    });
  });

  describe('닫기 인터랙션', () => {
    it('Esc 키 입력 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('dialog');
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('백드롭 클릭 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('dialog');
      const backdrop = screen.getByLabelText('모달 닫기');
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('"취소" 버튼 클릭 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('우측 상단 닫기(X 아이콘) 버튼 클릭 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('제출 중(isPending) 에 ESC 키를 눌러도 onClose 가 호출되지 않는다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async () => {
          await delay('infinite');
          return HttpResponse.json({});
        })
      );
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      void user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /요청 보내는 중/ })).toBeDisabled();
      });
      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('제출 중(isPending) 에 백드롭을 눌러도 onClose 가 호출되지 않는다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async () => {
          await delay('infinite');
          return HttpResponse.json({});
        })
      );
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      void user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /요청 보내는 중/ })).toBeDisabled();
      });
      await user.click(screen.getByLabelText('모달 닫기'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('greeting 검증', () => {
    it('100자 이하 인사말은 정상 입력된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, '안녕하세요!');
      expect(textarea).toHaveValue('안녕하세요!');
      expect(screen.getByText(/6 \/ 100/)).toBeInTheDocument();
    });

    it('빈 인사말로도 요청을 보낼 수 있다 (greeting 은 optional)', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('첫 인사가 비었거나 공백뿐이면 requestMessage 를 빈 문자열로 보낸다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      let capturedBody: Record<string, unknown> | null = null;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockCreatedInvitation, { status: 201 });
        })
      );
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, '   ');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });
      expect(capturedBody).toHaveProperty('requestMessage', '');
    });

    it('100자 초과 시 검증 에러가 표시된다 (Zod max)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await waitFor(() => {
        expect(screen.getByText(/100자 이내로 작성해주세요/)).toBeInTheDocument();
      });
    });
  });

  describe('greeting 유효성 UX (에러 상태 스타일·트리거 타이밍)', () => {
    it('100자 초과 후 blur 시 textarea 에 위험색 1px 안쪽 선이 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await user.tab();
      await waitFor(() => {
        expect(textarea.className).toContain('shadow-[inset_0_0_0_1px_var(--danger-text)]');
      });
    });

    it('100자 초과 후 blur 시 aria-invalid="true" 가 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await user.tab();
      await waitFor(() => {
        expect(textarea.getAttribute('aria-invalid')).toBe('true');
      });
    });

    it('100자 초과 시 카운터가 빨강이고 제출 버튼이 비활성화된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await waitFor(() => {
        expect(screen.getByText(/101 \/ 100/).className).toMatch(/text-danger/);
      });
      expect(screen.getByRole('button', { name: /요청 보내기/ })).toBeDisabled();
    });

    it('blur 후 재입력 시 onChange 로 즉시 재검증된다 (reValidateMode=onChange)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/100자 이내로 작성해주세요/)).toBeInTheDocument();
      });
      await user.click(textarea);
      await user.keyboard('{Backspace}');
      await waitFor(() => {
        expect(screen.queryByText(/100자 이내로 작성해주세요/)).not.toBeInTheDocument();
      });
    });
  });

  describe('성공 플로우', () => {
    it('POST /api/simulations/invitations 로 내 아바타·상대 아바타·첫 인사를 보낸다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      let capturedBody: unknown = null;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockCreatedInvitation, { status: 201 });
        })
      );
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onSuccess })} />);
      await screen.findByRole('radiogroup');
      await user.type(screen.getByLabelText(/아바타가 건넬 첫 인사/), '  안녕하세요  ');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      expect(capturedBody).toEqual({
        inviterAvatarId: mockOwnedAvatars.data.content[0]?.avatarId,
        inviteeAvatarId: 'avatar-1',
        requestMessage: '안녕하세요',
      });
    });

    it('요청 보내기 → MSW 핸들러가 호출되고 성공 토스트가 노출된다', async () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose, onSuccess })} />);
      await screen.findByRole('radiogroup');

      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
      expect(screen.getByText('요청을 보냈어요')).toBeInTheDocument();
    });

    it('전송 중 버튼이 disabled 상태가 된다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async () => {
          await delay(200);
          return HttpResponse.json(mockCreatedInvitation, { status: 201 });
        })
      );
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      void user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /요청 보내는 중/ })).toBeDisabled();
      });
    });
  });

  describe('에러 플로우', () => {
    it.each([
      ['in-progress', 'SIMULATION_400_002', '이미 진행 중인 매칭이 있어요'],
      ['avatar-not-found', 'SIMULATION_400_001', '아바타를 찾을 수 없어요'],
      ['own-avatar', 'SIMULATION_400_005', '이 아바타로는 요청을 보낼 수 없어요'],
      ['same-avatar', 'SIMULATION_400_006', '이 아바타로는 요청을 보낼 수 없어요'],
      ['not-avatar-owner', 'SIMULATION_403_001', '이 아바타로는 요청을 보낼 수 없어요'],
    ] as const)('%s (%s) → 안내 토스트, 모달 닫힘', async (scenario, _code, title) => {
      setMatchRequestScenario(scenario);
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('500 → 일반 에러 토스트, 모달 유지', async () => {
      setMatchRequestScenario('server-error');
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByText('잠시 후 다시 시도해주세요')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeInTheDocument();
    });

    it('500 뒤 "요청 보내기" 를 다시 누르면 재요청이 성공한다', async () => {
      setMatchRequestScenario('server-error');
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose, onSuccess })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await screen.findByText('잠시 후 다시 시도해주세요');
      setMatchRequestScenario('success');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByText('잠시 후 다시 시도해주세요')).not.toBeInTheDocument();
    });

    it('500 이 반복돼도 실패 토스트는 하나만 떠 있다', async () => {
      setMatchRequestScenario('server-error');
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await screen.findByText('잠시 후 다시 시도해주세요');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /요청 보내기/ })).toBeEnabled();
      });
      expect(screen.getAllByText('잠시 후 다시 시도해주세요')).toHaveLength(1);
    });

    it('모달을 닫으면 실패 토스트도 함께 사라진다', async () => {
      setMatchRequestScenario('server-error');
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));
      await screen.findByText('잠시 후 다시 시도해주세요');

      rerender(<MatchRequestModal {...defaultProps({ open: false })} />);

      await waitFor(() => {
        expect(screen.queryByText('잠시 후 다시 시도해주세요')).not.toBeInTheDocument();
      });
    });
  });

  describe('아바타 목록 분기', () => {
    it('GET /api/avatars/me 실패 시 상단 에러 토스트로 알리고 다시 시도 버튼은 없다', async () => {
      server.use(ownedAvatarsHandlers.serverError);
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);

      const toast = (await screen.findByText('아바타 목록을 불러오지 못했어요')).closest(
        '[role="status"]'
      );
      expect(toast).toHaveClass('bg-danger-tint');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /다시 시도/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /요청 보내기/ })).toBeDisabled();
    });

    it('목록 로딩이 실패한 모달을 닫았다 다시 열면 재요청해 목록을 보여준다', async () => {
      let callCount = 0;
      let serverRecovered = false;
      server.use(
        http.get(`${import.meta.env.VITE_API_BASE_URL as string}/api/avatars/me`, () => {
          callCount++;
          return serverRecovered
            ? HttpResponse.json(mockOwnedAvatars)
            : HttpResponse.json(
                { code: 'COMMON_500_001', message: '서버 오류가 발생했습니다' },
                { status: 500 }
              );
        })
      );
      const { rerender } = renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByText('아바타 목록을 불러오지 못했어요');

      rerender(<MatchRequestModal {...defaultProps({ open: false })} />);
      expect(screen.queryByText('아바타 목록을 불러오지 못했어요')).not.toBeInTheDocument();
      serverRecovered = true;
      rerender(<MatchRequestModal {...defaultProps()} />);

      expect(await screen.findByRole('radiogroup')).toBeInTheDocument();
      expect(screen.queryByText('아바타 목록을 불러오지 못했어요')).not.toBeInTheDocument();
      expect(callCount).toBe(2);
    });

    it('아바타가 0 개일 때 "아바타를 먼저 만들어주세요" 안내가 노출되고 제출이 막힌다', async () => {
      server.use(ownedAvatarsHandlers.empty);
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText(/아바타를 먼저 만들어주세요/)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /요청 보내기/ })).toBeDisabled();
    });

    it('아바타가 모두 매칭 중일 때 "매칭 중인 아바타가 끝나면" 안내가 노출되고 제출이 막힌다', async () => {
      server.use(ownedAvatarsHandlers.allBusy);
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);

      await waitFor(() => {
        expect(screen.getByText(/매칭 중인 아바타가 끝나면 다시 시도해주세요/)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /요청 보내기/ })).toBeDisabled();
    });
  });

  describe('내 아바타 목록 페이지 (5개씩)', () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    const useOwnedAvatars = (content: typeof mockOwnedAvatars.data.content) => {
      server.use(
        http.get(`${BASE_URL}/api/avatars/me`, () =>
          HttpResponse.json({ data: { content, hasNext: false } })
        )
      );
    };

    it('5개를 넘으면 첫 5개만 보이고, 다음 페이지에서 나머지가 보인다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');

      expect(within(radioGroup).getAllByRole('radio')).toHaveLength(5);
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: '다음 페이지' }));

      expect(screen.getByText('2 / 2')).toBeInTheDocument();
      expect(
        within(radioGroup)
          .getAllByRole('radio')
          .map((radio) => (radio as HTMLInputElement).value)
      ).toEqual(mockOwnedAvatars.data.content.slice(5).map((a) => a.avatarId));
      expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: '이전 페이지' }));
      expect(within(radioGroup).getAllByRole('radio')).toHaveLength(5);
    });

    it('5개 이하면 페이지 이동 버튼을 그리지 않는다', async () => {
      useOwnedAvatars(mockOwnedAvatars.data.content.slice(0, 5));
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');

      expect(within(radioGroup).getAllByRole('radio')).toHaveLength(5);
      expect(screen.queryByRole('button', { name: '다음 페이지' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '이전 페이지' })).not.toBeInTheDocument();
    });

    it('아바타가 5개보다 적어도 목록은 5행 높이 틀을 유지하고 카드로 감싼다', async () => {
      useOwnedAvatars(mockOwnedAvatars.data.content.slice(0, 2));
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const radioGroup = await screen.findByRole('radiogroup');

      expect(within(radioGroup).getAllByRole('radio')).toHaveLength(2);
      expect(radioGroup).toHaveClass('grid-rows-5');
      expect(radioGroup.parentElement).toHaveClass(
        'rounded-card',
        'border',
        'border-subtle',
        'p-5'
      );
    });

    it('페이지를 넘겨도 목록은 다시 조회하지 않는다', async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE_URL}/api/avatars/me`, () => {
          calls += 1;
          return HttpResponse.json(mockOwnedAvatars);
        })
      );
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      await user.click(screen.getByRole('button', { name: '다음 페이지' }));
      await user.click(screen.getByRole('button', { name: '이전 페이지' }));

      expect(calls).toBe(1);
    });

    it('다른 페이지에서 고른 아바타가 페이지를 넘겨도 유지되고 그 avatarId 로 요청한다', async () => {
      let capturedRequester: unknown = null;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async ({ request }) => {
          const body = (await request.json()) as { inviterAvatarId?: unknown };
          capturedRequester = body.inviterAvatarId;
          return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
        })
      );
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      await user.click(screen.getByRole('button', { name: '다음 페이지' }));
      await user.click(screen.getByRole('radio', { name: /새벽/ }));
      await user.click(screen.getByRole('button', { name: '이전 페이지' }));
      expect(screen.getByRole('radio', { name: /hyunwoo/ })).not.toBeChecked();

      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(capturedRequester).toBe(mockOwnedAvatars.data.content[6]?.avatarId);
      });
    });

    it('기본 선택 아바타가 뒤 페이지에 있으면 그 페이지로 열리고 포커스가 그 라디오로 간다', async () => {
      useOwnedAvatars(
        mockOwnedAvatars.data.content.map((avatar, index) => ({
          ...avatar,
          canJoinSimulation: index >= 5,
        }))
      );
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      expect(await screen.findByText('2 / 2')).toBeInTheDocument();
      const selected = screen.getByRole('radio', { name: /겨울/ });
      expect(selected).toBeChecked();
      await waitFor(() => {
        expect(selected).toHaveFocus();
      });
    });
  });

  describe('아바타 라디오 변경', () => {
    it('다른 내 아바타 클릭 시 selection 이 변경된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      const hyunsoftRadio = screen.getByRole('radio', { name: /hyunsoft/ });
      await user.click(hyunsoftRadio);

      await waitFor(() => {
        expect(hyunsoftRadio).toBeChecked();
      });
    });

    it('busy 아바타 클릭은 selection 을 바꾸지 않는다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      const busyRadio = screen.getByRole('radio', { name: /hyun_night/ });
      await user.click(busyRadio);
      expect(busyRadio).not.toBeChecked();
      expect(screen.getByRole('radio', { name: /hyunwoo/ })).toBeChecked();
    });

    it('고른 내 아바타의 avatarId 를 inviterAvatarId 로 보낸다', async () => {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      let capturedRequester: unknown = null;
      server.use(
        http.post(`${BASE_URL}/api/simulations/invitations`, async ({ request }) => {
          const body = (await request.json()) as { inviterAvatarId?: unknown };
          capturedRequester = body.inviterAvatarId;
          return HttpResponse.json({ message: '서버 오류' }, { status: 500 });
        })
      );
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');

      await user.click(screen.getByRole('radio', { name: /hyunsoft/ }));
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(capturedRequester).toBe(mockOwnedAvatars.data.content[2]?.avatarId);
      });
    });
  });
});
