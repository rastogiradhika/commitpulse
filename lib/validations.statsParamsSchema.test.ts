import { describe, it, expect } from 'vitest';
import { statsParamsSchema } from './validations';

describe('statsParamsSchema', () => {
  it('parses a minimal valid input with only user', () => {
    const result = statsParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.refresh).toBe(false);
      expect(result.data.tz).toBeUndefined();
    }
  });

  it('parses a full valid input with optional params', () => {
    const result = statsParamsSchema.safeParse({
      user: 'octocat',
      refresh: 'true',
      tz: 'Asia/Kolkata',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.refresh).toBe(true);
      expect(result.data.tz).toBe('Asia/Kolkata');
    }
  });

  it('transforms refresh parameter correctly', () => {
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'true' }).data?.refresh).toBe(
      true
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'false' }).data?.refresh).toBe(
      false
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: '1' }).data?.refresh).toBe(
      false
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', refresh: 'TRUE' }).data?.refresh).toBe(
      false
    );
  });

  it('fails validation on invalid user parameters', () => {
    expect(statsParamsSchema.safeParse({}).success).toBe(false);
    expect(statsParamsSchema.safeParse({ user: '' }).success).toBe(false);
    expect(statsParamsSchema.safeParse({ user: 'a'.repeat(40) }).success).toBe(false);
    expect(statsParamsSchema.safeParse({ user: 'invalid-user!' }).success).toBe(false);
  });

  it('fails validation on invalid timezone strings', () => {
    expect(statsParamsSchema.safeParse({ user: 'octocat', tz: 'Invalid/Timezone' }).success).toBe(
      false
    );
    expect(statsParamsSchema.safeParse({ user: 'octocat', tz: 'UTC' }).success).toBe(true);
  });
});
