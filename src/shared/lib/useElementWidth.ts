import { useLayoutEffect, useRef, useState } from 'react';

/**
 * 요소의 현재 폭(px)을 돌려준다. 첫 값은 paint 전에 재서(useLayoutEffect) 첫 화면부터 맞는 크기로 그리고,
 * 이후 크기 변화는 ResizeObserver 로 따라간다. 잴 수 없는 환경(jsdom 등)에서는 0 이다.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, width] as const;
}
