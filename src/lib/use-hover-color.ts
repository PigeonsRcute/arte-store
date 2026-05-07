import { useCallback, useRef } from 'react';
import { PALETTES } from '@/lib/palettes';

const HOVER_COLORS = PALETTES.flat();

export function useHoverColor() {
  const currentIndexRef = useRef(-1);

  const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * HOVER_COLORS.length);
    } while (idx === currentIndexRef.current);
    currentIndexRef.current = idx;
    const color = HOVER_COLORS[idx];
    const el = e.currentTarget;
    el.style.color = color;
    (el.style as unknown as Record<string, string>).webkitTextFillColor = color;
  }, []);

  return { onClick };
}
