import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE } from './route';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  notifyRateLimiter: {
    vi.mocked(notifyRateLimiter.checkWithResult).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(429);
  });

  it('bypasses gracefully when MONGODB_URI is not set in development', async () => {
    delete process.env.MONGODB_URI;

    vi.stubEnv('NODE_ENV', 'development');

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('bypassed');
  });

  it('returns 404 when notification preferences do not exist', async () => {
    vi.mocked(Notification.deleteOne).mockResolvedValue({
      deletedCount: 0,
    } as never);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(404);

    const data = await res.json();

    expect(data.message).toContain('No notification preferences found');
  });

  it('returns 200 when notification preferences are deleted successfully', async () => {
    vi.mocked(Notification.deleteOne).mockResolvedValue({
      deletedCount: 1,
    } as never);

    const res = await DELETE(makeRequest('user=testuser'));

    expect(res.status).toBe(200);

    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted successfully');
  });
});
