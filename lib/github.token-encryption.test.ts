import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encryptGitHubToken,
  decryptGitHubToken,
  isEncryptedToken,
  parseAndEncryptTokens,
  getNextToken,
  redactToken,
} from './github-token-encryption';

describe('github-token-encryption', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(32);
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encryptGitHubToken', () => {
    it('encrypts token using AES-256-GCM format', () => {
      const token = 'ghp_myTestToken12345678901234567890';
      const encrypted = encryptGitHubToken(token);

      // GCM format: base64.base64.base64.base64
      expect(encrypted).toContain('.');
      const parts = encrypted.split('.');
      expect(parts).toHaveLength(4);
    });

    it('decrypts encrypted token correctly', () => {
      const token = 'ghp_myRealGitHubToken';
      const encrypted = encryptGitHubToken(token);
      const decrypted = decryptGitHubToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('throws error when encryption key is not configured', () => {
      delete process.env.ENCRYPTION_KEY;
      const token = 'ghp_plaintext_token';

      expect(() => encryptGitHubToken(token)).toThrow(
        'ENCRYPTION_KEY must be at least 32 characters'
      );
    });

    it('throws error for invalid token input', () => {
      expect(() => encryptGitHubToken('')).toThrow('Invalid GitHub token');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => encryptGitHubToken(null as any)).toThrow('Invalid GitHub token');
    });
  });

  describe('isEncryptedToken', () => {
    it('returns false for null/undefined', () => {
      expect(isEncryptedToken(null)).toBe(false);
      expect(isEncryptedToken(undefined)).toBe(false);
    });

    it('returns false for non-string', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isEncryptedToken(123 as any)).toBe(false);
    });

    it('returns false for plaintext tokens', () => {
      expect(isEncryptedToken('ghp_plaintext')).toBe(false);
    });

    it('returns true for GCM format tokens', () => {
      const encrypted = encryptGitHubToken('ghp_test');
      expect(isEncryptedToken(encrypted)).toBe(true);
    });

    it('returns false for malformed encrypted tokens', () => {
      expect(isEncryptedToken('abc:def:ghi')).toBe(false);
    });
  });

  describe('parseAndEncryptTokens', () => {
    it('parses and encrypts comma-separated tokens', () => {
      const tokenString = 'ghp_token1,ghp_token2,ghp_token3';
      const result = parseAndEncryptTokens(tokenString);

      expect(result).toHaveLength(3);
      result.forEach((item) => {
        expect(item.token).toMatch(/^ghp_/);
        expect(isEncryptedToken(item.encryptedToken)).toBe(true);
      });
    });

    it('throws error for empty string', () => {
      expect(() => parseAndEncryptTokens('')).toThrow('Token string is required');
    });

    it('throws error for no valid tokens', () => {
      expect(() => parseAndEncryptTokens(',,,')).toThrow('No valid tokens found');
    });
  });

  describe('getNextToken', () => {
    it('decrypts and rotates tokens', () => {
      const tokens = ['ghp_token1', 'ghp_token2', 'ghp_token3'];
      const encrypted = tokens.map((t) => encryptGitHubToken(t));

      const result = getNextToken(encrypted, 0);
      expect(result.token).toBe('ghp_token2');
      expect(result.nextIndex).toBe(1);
    });

    it('wraps around to first token', () => {
      const tokens = ['ghp_token1', 'ghp_token2'];
      const encrypted = tokens.map((t) => encryptGitHubToken(t));

      const result = getNextToken(encrypted, 1);
      expect(result.token).toBe('ghp_token1');
      expect(result.nextIndex).toBe(0);
    });

    it('throws for empty array', () => {
      expect(() => getNextToken([])).toThrow('No encrypted tokens available');
    });
  });

  describe('redactToken', () => {
    it('redacts token for safe logging', () => {
      const token = 'ghp_abcdefghijklmnopqrstuvwxyz123456';
      const redacted = redactToken(token);

      expect(redacted).toBe('ghp_...3456');
      expect(redacted).not.toContain('mnopqr');
    });

    it('returns *** for short tokens', () => {
      expect(redactToken('short')).toBe('***');
      expect(redactToken(null)).toBe('***');
      expect(redactToken(undefined)).toBe('***');
    });
  });
});
