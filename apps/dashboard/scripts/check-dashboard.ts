import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({
  root,
  server: { host: '127.0.0.1', port: 0, open: false },
});
try {
  await server.listen();
  const address = server.httpServer?.address();
  assert.ok(
    address && typeof address !== 'string',
    'dashboard server did not bind',
  );
  const response = await fetch(`http://127.0.0.1:${address.port}`, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<title>Animation engine</title>'));
  const script = await fetch(`http://127.0.0.1:${address.port}/src/main.tsx`, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(script.status, 200);
  assert.ok((await script.text()).includes('Milestone 0 bootstrap'));
  console.log('Dashboard startup and module compilation passed.');
} finally {
  await server.close();
}
