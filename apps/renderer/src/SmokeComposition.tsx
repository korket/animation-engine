import { evaluateSmokeScene } from '@animation-engine/engine';
import type { SmokeScene } from '@animation-engine/scene-schema';
import { useCurrentFrame } from 'remotion';

// Test palette only; these are not approved production style tokens.
const palette = { background: '#102030', accent: '#f0a040' } as const;

export type SmokeProps = { scene: SmokeScene };

export function SmokeComposition({ scene }: SmokeProps) {
  const frame = evaluateSmokeScene(scene, useCurrentFrame());
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={frame.width}
      height={frame.height}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
    >
      <rect
        width={frame.width}
        height={frame.height}
        fill={palette[frame.background]}
      />
      <circle
        cx={frame.circle.cx}
        cy={frame.circle.cy}
        r={frame.circle.radius}
        fill={palette[frame.circle.fill]}
        opacity={frame.circle.opacity}
      />
    </svg>
  );
}
