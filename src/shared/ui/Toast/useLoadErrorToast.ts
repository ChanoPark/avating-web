import { useEffect } from 'react';
import { useToast } from './useToast';

const LOAD_ERROR_DESCRIPTION = '잠시 후 다시 시도해주세요.';

export function useLoadErrorToast(active: boolean, title: string): void {
  const { show, dismiss } = useToast();

  useEffect(() => {
    if (!active) return;
    const id = show({ variant: 'error', title, description: LOAD_ERROR_DESCRIPTION });
    return () => {
      dismiss(id);
    };
  }, [active, title, show, dismiss]);
}
