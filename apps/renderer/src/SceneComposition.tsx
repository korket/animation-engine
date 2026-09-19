import { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { compileScene, evaluateScene } from '@animation-engine/engine';
import type { Scene } from '@animation-engine/scene-schema';

export function SceneComposition({ scene }: { scene: Scene }) {
  const compiled = useMemo(() => compileScene(scene), [scene]);
  const resolved = evaluateScene(compiled, useCurrentFrame());
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={resolved.width}
      height={resolved.height}
      viewBox={`0 0 ${resolved.width} ${resolved.height}`}
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <rect
        width={resolved.width}
        height={resolved.height}
        fill={resolved.background}
      />
      {resolved.elements.map((element) =>
        element.type === 'circle' ? (
          <circle
            key={element.id}
            data-node-id={element.id}
            cx={element.cx}
            cy={element.cy}
            r={element.radius}
            fill={element.fill}
          />
        ) : (
          <rect
            key={element.id}
            data-node-id={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
          />
        ),
      )}
    </svg>
  );
}
