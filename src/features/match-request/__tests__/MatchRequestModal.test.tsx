import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@shared/mocks/server';
import {
  setMatchRequestScenario,
  resetMatchRequestScenario,
} from '@shared/mocks/handlers/matchRequest';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MatchRequestModal } from '../ui/MatchRequestModal';
import type { PartnerAvatarSummary } from '../ui/PartnerAvatarCard';

const partner: PartnerAvatarSummary = {
  initials: 'MN',
  name: 'Moonlit Narrator',
  handle: '@moonlit',
  type: '내향·낭만형',
  verified: true,
  status: 'online',
  tags: ['독립서점', '심야 카페'],
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
        screen.getByRole('heading', { name: /이 아바타에게 소개팅을 요청합니다/ })
      ).toBeInTheDocument();
    });

    it('open=false 일 때 dialog 가 렌더되지 않는다', () => {
      renderWithProviders(<MatchRequestModal {...defaultProps({ open: false })} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('상대 아바타 카드가 표시된다 (이름·태그·인증)', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Moonlit Narrator')).toBeInTheDocument();
      expect(within(dialog).getByText('인증')).toBeInTheDocument();
      expect(within(dialog).getByText('독립서점')).toBeInTheDocument();
    });

    it('비용 안내 ◇ 30 이 표시된다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      expect(await screen.findByText(/◇ 30/)).toBeInTheDocument();
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

    it('busy 상태 아바타는 disabled 라디오로 표시된다', async () => {
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const busyRadio = screen.getByRole('radio', { name: /hyun_night/ });
      expect(busyRadio).toBeDisabled();
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

    it('우측 상단 ✕ 버튼 클릭 시 onClose 가 호출된다', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: '닫기' }));
      expect(onClose).toHaveBeenCalledOnce();
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
      expect(screen.getByText(/6\/100/)).toBeInTheDocument();
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
    it('100자 초과 후 blur 시 textarea 에 border-danger 클래스가 적용된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps()} />);
      await screen.findByRole('radiogroup');
      const textarea = screen.getByLabelText(/아바타가 건넬 첫 인사/);
      await user.type(textarea, 'a'.repeat(101));
      await user.tab();
      await waitFor(() => {
        expect(textarea.className).toMatch(/border-danger/);
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
        expect(screen.getByText(/101\/100/).className).toMatch(/text-danger/);
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
        http.post(`${BASE_URL}/api/match-requests`, async () => {
          await delay(200);
          return HttpResponse.json({
            data: {
              id: 'req-1',
              requesterUserId: 'me',
              requesterAvatarId: 'me-hyunwoo',
              partnerUserId: 'partner',
              partnerAvatarId: 'avatar-1',
              greeting: null,
              status: 'pending',
              rejectionReason: null,
              createdAt: '2026-05-06T05:00:00.000Z',
              respondedAt: null,
              expiresAt: '2026-05-07T05:00:00.000Z',
            },
          });
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
    it('402 INSUFFICIENT_GEMS → 다이아 부족 토스트, 모달 유지', async () => {
      setMatchRequestScenario('insufficient-gems');
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByText('다이아가 부족해요')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('409 PARTNER_BLOCKED → 안내 토스트, 모달 닫힘', async () => {
      setMatchRequestScenario('partner-blocked');
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByText('이 사용자에게는 요청을 보낼 수 없어요')).toBeInTheDocument();
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('409 DUPLICATE_REQUEST → 안내 토스트, 모달 닫힘', async () => {
      setMatchRequestScenario('duplicate-request');
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<MatchRequestModal {...defaultProps({ onClose })} />);
      await screen.findByRole('radiogroup');
      await user.click(screen.getByRole('button', { name: /요청 보내기/ }));

      await waitFor(() => {
        expect(screen.getByText('이미 응답 대기 중인 요청이 있어요')).toBeInTheDocument();
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
  });
});
