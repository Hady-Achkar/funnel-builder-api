import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from '../../services/cache/cache.service';
import { redisService } from '../../services/cache/redis.service';

// Mock Redis service
vi.mock('../../services/cache/redis.service', () => ({
  redisService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    keys: vi.fn(),
    invalidatePattern: vi.fn(),
    setSession: vi.fn(),
    getSession: vi.fn(),
    deleteSession: vi.fn(),
    expire: vi.fn(),
    incrementCounter: vi.fn(),
    ping: vi.fn()
  }
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    vi.clearAllMocks();
  });

  describe('basic operations', () => {
    it('should get cached value', async () => {
      const mockValue = { test: 'data' };
      vi.mocked(redisService.get).mockResolvedValue(mockValue);

      const result = await cacheService.get('test-key');

      expect(redisService.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockValue);
    });

    it('should set cached value with default TTL', async () => {
      const mockValue = { test: 'data' };

      await cacheService.set('test-key', mockValue);

      expect(redisService.set).toHaveBeenCalledWith('test-key', mockValue, 3600);
    });

    it('should set cached value with custom TTL', async () => {
      const mockValue = { test: 'data' };

      await cacheService.set('test-key', mockValue, { ttl: 1800 });

      expect(redisService.set).toHaveBeenCalledWith('test-key', mockValue, 1800);
    });

    it('should delete cached value', async () => {
      await cacheService.del('test-key');

      expect(redisService.del).toHaveBeenCalledWith('test-key');
    });

    it('should check if key exists', async () => {
      vi.mocked(redisService.exists).mockResolvedValue(true);

      const result = await cacheService.exists('test-key');

      expect(redisService.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });
  });

  describe('prefix operations', () => {
    it('should format key with prefix', async () => {
      await cacheService.get('test-key', { prefix: 'user' });

      expect(redisService.get).toHaveBeenCalledWith('user:test-key');
    });

    it('should invalidate pattern with prefix', async () => {
      await cacheService.invalidatePattern('*', 'user');

      expect(redisService.invalidatePattern).toHaveBeenCalledWith('user:*');
    });
  });

  describe('memoization', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { cached: true };
      const fn = vi.fn().mockResolvedValue({ computed: true });
      
      vi.mocked(redisService.get).mockResolvedValue(cachedValue);

      const result = await cacheService.memoize('test-key', fn);

      expect(result).toEqual(cachedValue);
      expect(fn).not.toHaveBeenCalled();
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should compute and cache value if not exists', async () => {
      const computedValue = { computed: true };
      const fn = vi.fn().mockResolvedValue(computedValue);
      
      vi.mocked(redisService.get).mockResolvedValue(null);

      const result = await cacheService.memoize('test-key', fn);

      expect(result).toEqual(computedValue);
      expect(fn).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith('test-key', computedValue, 3600);
    });
  });

  describe('domain-specific operations', () => {
    it('should get user cache with proper prefix', async () => {
      await cacheService.getUserCache(123, 'profile');

      expect(redisService.get).toHaveBeenCalledWith('user:123:profile');
    });

    it('should set user cache with proper prefix', async () => {
      const data = { name: 'Test User' };

      await cacheService.setUserCache(123, 'profile', data);

      expect(redisService.set).toHaveBeenCalledWith('user:123:profile', data, 3600);
    });

    it('should invalidate user cache', async () => {
      await cacheService.invalidateUserCache(123);

      expect(redisService.invalidatePattern).toHaveBeenCalledWith('user:123:*');
    });

    it('should get domain cache with proper prefix', async () => {
      await cacheService.getDomainCache(456, 'status');

      expect(redisService.get).toHaveBeenCalledWith('domain:456:status');
    });

    it('should get funnel cache with proper prefix', async () => {
      await cacheService.getFunnelCache(789, 'pages');

      expect(redisService.get).toHaveBeenCalledWith('funnel:789:pages');
    });
  });

  describe('CloudFlare zone cache', () => {
    it('should get zone ID with correct prefix and TTL', async () => {
      await cacheService.getZoneId('example.com');

      expect(redisService.get).toHaveBeenCalledWith('cloudflare:zone:example.com');
    });

    it('should set zone ID with correct prefix and TTL', async () => {
      await cacheService.setZoneId('example.com', 'zone-123');

      expect(redisService.set).toHaveBeenCalledWith('cloudflare:zone:example.com', 'zone-123', 86400);
    });
  });

  describe('rate limiting', () => {
    it('should check rate limit and return status', async () => {
      vi.mocked(redisService.incrementCounter).mockResolvedValue(5);

      const result = await cacheService.checkRateLimit('user:123', 10, 3600);

      expect(redisService.incrementCounter).toHaveBeenCalledWith('ratelimit:user:123', 3600);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should deny when rate limit exceeded', async () => {
      vi.mocked(redisService.incrementCounter).mockResolvedValue(15);

      const result = await cacheService.checkRateLimit('user:123', 10, 3600);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('session management', () => {
    it('should create session with generated ID', async () => {
      const sessionData = { role: 'user' };

      const sessionId = await cacheService.createSession(123, sessionData);

      expect(sessionId).toMatch(/^123_\d+_[a-z0-9.]+$/);
      expect(redisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          userId: 123,
          role: 'user',
          createdAt: expect.any(String)
        }),
        86400
      );
    });

    it('should get session data', async () => {
      const sessionData = { userId: 123, role: 'user' };
      vi.mocked(redisService.getSession).mockResolvedValue(sessionData);

      const result = await cacheService.getSession('session-123');

      expect(redisService.getSession).toHaveBeenCalledWith('session-123');
      expect(result).toEqual(sessionData);
    });

    it('should delete session', async () => {
      await cacheService.deleteSession('session-123');

      expect(redisService.deleteSession).toHaveBeenCalledWith('session-123');
    });

    it('should refresh session TTL', async () => {
      await cacheService.refreshSession('session-123', 7200);

      expect(redisService.expire).toHaveBeenCalledWith('session:session-123', 7200);
    });
  });

  describe('health check', () => {
    it('should return healthy status when Redis is available', async () => {
      vi.mocked(redisService.ping).mockResolvedValue(true);

      const result = await cacheService.healthCheck();

      expect(result.redis).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when Redis is unavailable', async () => {
      vi.mocked(redisService.ping).mockResolvedValue(false);

      const result = await cacheService.healthCheck();

      expect(result.redis).toBe(false);
      expect(result.latency).toBeUndefined();
    });
  });
});