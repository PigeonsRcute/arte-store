'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PALETTES } from '@/lib/palettes';

interface Particle {
  id: number;
  color: string;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

let nextExplosionId = 0;

const BURST_KEYFRAMES = `
@keyframes clickBurst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
`;

export default function ClickExplosion() {
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [mounted, setMounted] = useState(false);
  const lastPaletteIndex = useRef(-1);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      let paletteIndex: number;
      do {
        paletteIndex = Math.floor(Math.random() * PALETTES.length);
      } while (paletteIndex === lastPaletteIndex.current);
      lastPaletteIndex.current = paletteIndex;
      const palette = PALETTES[paletteIndex];

      const count = 10 + Math.floor(Math.random() * 5);
      const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        color: palette[Math.floor(Math.random() * palette.length)],
        angle: (360 / count) * i + (Math.random() * 24 - 12),
        distance: 40 + Math.random() * 60,
        size: 4 + Math.random() * 6,
        duration: 400 + Math.random() * 200,
        delay: Math.random() * 80,
      }));

      const explosion: Explosion = { id: nextExplosionId++, x: e.clientX, y: e.clientY, particles };
      setExplosions((prev) => [...prev, explosion]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((ex) => ex.id !== explosion.id));
      }, 750);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{BURST_KEYFRAMES}</style>
      {explosions.map((explosion) =>
        explosion.particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
            <div
              key={`${explosion.id}-${p.id}`}
              style={{
                position: 'fixed',
                left: explosion.x - p.size / 2,
                top: explosion.y - p.size / 2,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                pointerEvents: 'none',
                zIndex: 99999,
                ['--tx' as string]: `${tx}px`,
                ['--ty' as string]: `${ty}px`,
                animation: `clickBurst ${p.duration}ms ease-out ${p.delay}ms forwards`,
              }}
            />
          );
        })
      )}
    </>,
    document.body
  );
}
