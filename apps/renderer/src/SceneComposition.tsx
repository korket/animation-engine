import { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import { compileScene, evaluateScene } from '@animation-engine/engine';
import type { Scene } from '@animation-engine/scene-schema';
import type { AssetLibrary, StyledShape } from '@animation-engine/assets';

function AssetShape({ shape }: { shape: StyledShape }) {
  const style = {
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (shape.type) {
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.radius} {...style} />;
    case 'rect':
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          {...style}
        />
      );
    case 'line':
      return (
        <line
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          {...style}
        />
      );
  }
}

export function SceneComposition({
  scene,
  library,
}: {
  scene: Scene;
  library?: AssetLibrary;
}) {
  const compiled = useMemo(
    () => compileScene(scene, library),
    [scene, library],
  );
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
        ) : element.type === 'asset' ? (
          <svg
            key={element.id}
            data-node-id={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            viewBox={`0 0 ${element.viewBoxWidth} ${element.viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
            overflow="hidden"
          >
            {element.shapes.map((shape, index) => (
              <AssetShape key={index} shape={shape} />
            ))}
          </svg>
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
