import { parseScene, parseSmokeScene } from '@animation-engine/scene-schema';
import { compileScene } from '@animation-engine/engine';
import { Composition } from 'remotion';
import fixture from '../../../tests/fixtures/smoke.json';
import { SmokeComposition } from './SmokeComposition';
import coreFixture from '../../../tests/fixtures/scene-v1.json';
import { SceneComposition } from './SceneComposition';

const scene = parseSmokeScene(fixture);
const coreScene = parseScene(coreFixture);
const compiled = compileScene(coreScene);

export function RemotionRoot() {
  return (
    <>
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
      <Composition
        id="Scene"
        component={SceneComposition}
        width={compiled.width}
        height={compiled.height}
        fps={compiled.fps}
        durationInFrames={compiled.durationInFrames}
        defaultProps={{ scene: coreScene }}
        calculateMetadata={({ props }) => {
          const validated = parseScene(props.scene);
          const runtime = compileScene(validated);
          return {
            width: runtime.width,
            height: runtime.height,
            fps: runtime.fps,
            durationInFrames: runtime.durationInFrames,
            props: { scene: validated },
          };
        }}
      />
    </>
  );
}
