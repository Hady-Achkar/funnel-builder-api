import { createClient, RedisClientType } from "redis";

export interface CacheConfig {
  url: string;
  password?: string;
  database?: number;
  ttl: number; // default TTL in seconds
}

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;
  private config: CacheConfig;

  constructor() {
    this.config = this.loadConfig();
    this.client = createClient({
      url: this.config.url,
      password: this.config.password || undefined,
      database: this.config.database || 0,
    });

    this.setupEventHandlers();
  }

  private loadConfig(): CacheConfig {
    return {
      url: process.env.REDIS_URL || "redis://localhost:6379",
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || "0"),
      ttl: 3600, // 1 hour default
    };
  }

  private setupEventHandlers(): void {
    (this.client as any).on("error", (err: any) => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    (this.client as any).on("connect", () => {
      console.log("Redis Client Connected");
      console.log(`Redis: Using database ${this.config.database} on ${this.config.url}`);
      this.isConnected = true;
    });

    (this.client as any).on("disconnect", () => {
      console.log("Redis Client Disconnected");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const serializedValue = JSON.stringify(value);
    
    // If ttl is 0 or explicitly false, set without expiry (cache forever)
    if (ttl === 0) {
      await this.client.set(key, serializedValue);
    } else {
      const expiry = ttl || this.config.ttl;
      await this.client.setEx(key, expiry, serializedValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      await this.connect();
    }

    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Failed to parse cached value:", error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      await this.connect();
    }

    return await this.client.ttl(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.client.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    return await this.client.keys(pattern);
  }

  async flush(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    await this.client.flushDb();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  // Session-specific methods
  async setSession(sessionId: string, data: any, ttl = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Rate limiting methods
  async incrementCounter(key: string, ttl = 3600): Promise<number> {
    if (!this.isConnected) {
      await this.connect();
    }

    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();

    return (results?.[0] as number) || 0;
  }

  async getCounter(key: string): Promise<number> {
    if (!this.isConnected) {
      await this.connect();
    }

    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      const response = await this.client.ping();
      return response === "PONG";
    } catch (error) {
      return false;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get current database info
  getDatabaseInfo(): { url: string; database: number; isConnected: boolean } {
    return {
      url: this.config.url,
      database: this.config.database || 0,
      isConnected: this.isConnected
    };
  }
}

// Singleton instance
export const redisService = new RedisService();
