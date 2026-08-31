import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { env } from './env.js';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    // Pretty logs in dev, structured JSON in prod, silence under test.
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.LOG_LEVEL,
            ...(env.NODE_ENV === 'development'
              ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
              : {}),
          },
  });

  await app.register(cors, { origin: true });

  // Liveness/readiness for Tilt. Deliberately does not touch Postgres or Redis —
  // Tilt uses this to decide the process is up, not that dependencies are healthy.
  app.get('/healthz', () => ({ status: 'ok' }));

  app.get('/api/hello', () => ({
    message: 'Hello from @repo/api',
    timestamp: new Date().toISOString(),
  }));

  return app;
}
