import { redisService } from './redis.service';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class CacheService {
  private static instance: CacheService;
  private defaultTTL = 3600; // 1 hour

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private formatKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const formattedKey = this.formatKey(key, options?.prefix);
    return await redisService.get<T>(formattedKey);
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const formattedKey = this.formatKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;
    await redisService.set(formattedKey, value, ttl);
  }

  async del(key: string, options?: CacheOptions): Promise<void> {
    const formattedKey = this.formatKey(key, options?.prefix);
    await redisService.del(formattedKey);
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const formattedKey = this.formatKey(key, options?.prefix);
    return await redisService.exists(formattedKey);
  }

  async invalidatePattern(pattern: string, prefix?: string): Promise<void> {
    const formattedPattern = prefix ? `${prefix}:${pattern}` : pattern;
    await redisService.invalidatePattern(formattedPattern);
  }

  // Memoization wrapper
  async memoize<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  // Domain-specific cache methods
  async getUserCache<T>(userId: number, key: string, options?: CacheOptions): Promise<T | null> {
    return await this.get<T>(key, { ...options, prefix: `user:${userId}` });
  }

  async setUserCache(userId: number, key: string, value: any, options?: CacheOptions): Promise<void> {
    await this.set(key, value, { ...options, prefix: `user:${userId}` });
  }

  async invalidateUserCache(userId: number): Promise<void> {
    await this.invalidatePattern('*', `user:${userId}`);
  }

  async getDomainCache<T>(domainId: number, key: string, options?: CacheOptions): Promise<T | null> {
    return await this.get<T>(key, { ...options, prefix: `domain:${domainId}` });
  }

  async setDomainCache(domainId: number, key: string, value: any, options?: CacheOptions): Promise<void> {
    await this.set(key, value, { ...options, prefix: `domain:${domainId}` });
  }

  async invalidateDomainCache(domainId: number): Promise<void> {
    await this.invalidatePattern('*', `domain:${domainId}`);
  }

  async getFunnelCache<T>(funnelId: number, key: string, options?: CacheOptions): Promise<T | null> {
    return await this.get<T>(key, { ...options, prefix: `funnel:${funnelId}` });
  }

  async setFunnelCache(funnelId: number, key: string, value: any, options?: CacheOptions): Promise<void> {
    await this.set(key, value, { ...options, prefix: `funnel:${funnelId}` });
  }

  async invalidateFunnelCache(funnelId: number): Promise<void> {
    await this.invalidatePattern('*', `funnel:${funnelId}`);
  }

  // CloudFlare zone cache
  async getZoneId(domain: string): Promise<string | null> {
    return await this.get<string>(`zone:${domain}`, { prefix: 'cloudflare', ttl: 86400 }); // 24 hours
  }

  async setZoneId(domain: string, zoneId: string): Promise<void> {
    await this.set(`zone:${domain}`, zoneId, { prefix: 'cloudflare', ttl: 86400 });
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`;
    const current = await redisService.incrementCounter(key, window);
    
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    const resetTime = Date.now() + (window * 1000);

    return { allowed, remaining, resetTime };
  }

  // Session management
  async createSession(userId: number, sessionData: any, ttl = 86400): Promise<string> {
    const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36)}`;
    await redisService.setSession(sessionId, {
      userId,
      createdAt: new Date().toISOString(),
      ...sessionData
    }, ttl);
    return sessionId;
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await redisService.getSession<T>(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await redisService.deleteSession(sessionId);
  }

  async refreshSession(sessionId: string, ttl = 86400): Promise<void> {
    await redisService.expire(`session:${sessionId}`, ttl);
  }

  // Health check
  async healthCheck(): Promise<{ redis: boolean; latency?: number }> {
    const start = Date.now();
    const isHealthy = await redisService.ping();
    const latency = Date.now() - start;

    return { redis: isHealthy, latency: isHealthy ? latency : undefined };
  }
}

export const cacheService = CacheService.getInstance();