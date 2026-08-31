import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer } from './server.js';

describe('server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy on /healthz', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('returns a greeting on /api/hello', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/hello' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ message: 'Hello from @repo/api' });
  });
});
