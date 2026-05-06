import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (first === undefined || last === undefined) return;
      const focused = document.activeElement as HTMLElement | null;
      const inside = focused !== null && container.contains(focused);

      if (event.shiftKey) {
        if (!inside || focused === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!inside || focused === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKey);
    return () => {
      container.removeEventListener('keydown', onKey);
    };
  }, [active, containerRef]);
}
