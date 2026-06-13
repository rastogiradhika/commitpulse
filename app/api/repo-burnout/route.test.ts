import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchBurnoutAnalysis } from '@/services/github/burnout-analyzer';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

vi.mock('@/services/github/burnout-analyzer', () => ({
  fetchBurnoutAnalysis: vi.fn(),
}));

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/repo-burnout');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: {
      'x-forwarded-for': '127.0.0.1',
    },
  });
}

describe('GET /api/repo-burnout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    quotaMonitor.reset();
    vi.mocked(fetchBurnoutAnalysis).mockResolvedValue({
      analysis: 'test analysis',
    });
  });

  it('returns 400 when owner or repo is missing', async () => {
    const response = await GET(makeRequest({ owner: 'octocat' }));
    expect(response.status).toBe(400);

    const response2 = await GET(makeRequest({ repo: 'hello' }));
    expect(response2.status).toBe(400);
  });

  it('returns 200 with data for valid parameters', async () => {
    const response = await GET(makeRequest({ owner: 'octocat', repo: 'hello-world' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.analysis).toBe('test analysis');
  });

  it('bypasses cache when refresh=true is specified and limits are not hit', async () => {
    const response = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache-Status')).toBe('MISS');
    expect(fetchBurnoutAnalysis).toHaveBeenCalledWith('octocat', 'hello-world', {
      bypassCache: true,
    });
  });

  it('returns 429 when GitHub API quota is low and refresh is requested', async () => {
    quotaMonitor.setQuota(5000, 400, Date.now() + 60000); // 8% remaining
    const response = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('quota is low');
  });

  it('returns 429 when IP refresh limit is exceeded', async () => {
    refreshRateLimiter.setLimit(1, 60000); // 1 refresh per window
    const response1 = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response1.status).toBe(200);

    const response2 = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response2.status).toBe(429);
  });

  it('falls back to cached data when per-repository cooldown is active', async () => {
    const response1 = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response1.status).toBe(200);
    expect(response1.headers.get('X-Cache-Status')).toBe('MISS');

    const response2 = await GET(
      makeRequest({ owner: 'octocat', repo: 'hello-world', refresh: 'true' })
    );
    expect(response2.status).toBe(200);
    expect(response2.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
