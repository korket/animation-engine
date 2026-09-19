import { parseSmokeScene } from '@animation-engine/scene-schema';
import { Composition } from 'remotion';
import fixture from '../../../tests/fixtures/smoke.json';
import { SmokeComposition } from './SmokeComposition';

const scene = parseSmokeScene(fixture);

export function RemotionRoot() {
  return (
    <Composition
      id="Smoke"
      component={SmokeComposition}
      width={scene.width}
      height={scene.height}
      fps={scene.fps}
      durationInFrames={scene.durationInFrames}
      defaultProps={{ scene }}
      calculateMetadata={({ props }) => {
        const validated = parseSmokeScene(props.scene);
        return {
          width: validated.width,
          height: validated.height,
          fps: validated.fps,
          durationInFrames: validated.durationInFrames,
          props: { scene: validated },
        };
      }}
    />
  );
}
