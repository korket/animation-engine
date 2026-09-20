import { parseScene, parseSmokeScene } from '@animation-engine/scene-schema';
import { compileScene } from '@animation-engine/engine';
import { Composition } from 'remotion';
import fixture from '../../../tests/fixtures/smoke.json';
import { SmokeComposition } from './SmokeComposition';
import coreFixture from '../../../tests/fixtures/scene-v1.json';
import { SceneComposition } from './SceneComposition';
import { builtinLibrary } from '@animation-engine/assets/builtin';
import assetFixture from '../../../tests/fixtures/assets-v1.json';
import motionFixture from '../../../tests/fixtures/motion-v1.json';

const scene = parseSmokeScene(fixture);
const coreScene = parseScene(coreFixture);
const compiled = compileScene(coreScene);
const assetScene = parseScene(assetFixture);
const assetCompiled = compileScene(assetScene, builtinLibrary);
const motionScene = parseScene(motionFixture);
const motionCompiled = compileScene(motionScene, builtinLibrary);

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
        id="Assets"
        component={SceneComposition}
        width={assetCompiled.width}
        height={assetCompiled.height}
        fps={assetCompiled.fps}
        durationInFrames={assetCompiled.durationInFrames}
        defaultProps={{ scene: assetScene, library: builtinLibrary }}
        calculateMetadata={({ props }) => {
          const validated = parseScene(props.scene);
          const runtime = compileScene(validated, props.library);
          return {
            width: runtime.width,
            height: runtime.height,
            fps: runtime.fps,
            durationInFrames: runtime.durationInFrames,
            props: {
              scene: validated,
              ...(props.library ? { library: props.library } : {}),
            },
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
          const runtime = compileScene(validated, props.library);
          return {
            width: runtime.width,
            height: runtime.height,
            fps: runtime.fps,
            durationInFrames: runtime.durationInFrames,
            props: {
              scene: validated,
              ...(props.library ? { library: props.library } : {}),
            },
          };
        }}
      />
      <Composition
        id="Motion"
        component={SceneComposition}
        width={motionCompiled.width}
        height={motionCompiled.height}
        fps={motionCompiled.fps}
        durationInFrames={motionCompiled.durationInFrames}
        defaultProps={{ scene: motionScene, library: builtinLibrary }}
        calculateMetadata={({ props }) => {
          const scene = parseScene(props.scene),
            compiled = compileScene(scene, props.library);
          return {
            width: compiled.width,
            height: compiled.height,
            fps: compiled.fps,
            durationInFrames: compiled.durationInFrames,
            props: {
              scene,
              ...(props.library ? { library: props.library } : {}),
            },
          };
        }}
      />
    </>
  );
}
