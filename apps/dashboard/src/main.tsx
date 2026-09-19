import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return (
    <main>
      <h1>Animation engine</h1>
      <p>Milestone 0 bootstrap</p>
      <p>A local foundation for deterministic SVG animation.</p>
      <h2>Try the render proof</h2>
      <p>Run these commands from the repository root in another terminal:</p>
      <ul>
        <li>
          <code>pnpm dev:renderer</code> — preview the circle fade in Remotion
          Studio.
        </li>
        <li>
          <code>pnpm render:smoke</code> — render the JSON fixture to MP4 and
          PNG frames.
        </li>
        <li>
          <code>pnpm test:render</code> — verify the rendered artifacts.
        </li>
      </ul>
      <p>
        Output: <code>out/smoke/smoke.mp4</code>
      </p>
      <p>Episode workflows and editing are not available in this bootstrap.</p>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Dashboard root element is missing');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
