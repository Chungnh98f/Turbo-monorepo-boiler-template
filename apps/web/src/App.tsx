import { Button } from '@repo/ui';
import { useCallback, useState } from 'react';

interface HelloResponse {
  message: string;
  timestamp: string;
}

export function App() {
  const [greeting, setGreeting] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hits the Vite dev proxy, which forwards /api to the Fastify app on :3001.
  const fetchGreeting = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hello');
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      setGreeting((await res.json()) as HelloResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="app">
      <h1>Turbo Monorepo Template</h1>
      <p className="app__subtitle">Vite · Turborepo · pnpm · Tilt</p>

      <Button onClick={() => void fetchGreeting()} disabled={loading}>
        {loading ? 'Loading…' : 'Call the API'}
      </Button>

      {greeting && (
        <p className="app__result">
          {greeting.message} <span className="app__muted">({greeting.timestamp})</span>
        </p>
      )}
      {error && <p className="app__error">{error}</p>}
    </main>
  );
}
