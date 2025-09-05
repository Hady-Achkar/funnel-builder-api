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
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log("Redis: Max reconnection attempts reached");
            return null;
          }
          return Math.min(retries * 1000, 3000);
        },
      },
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
    this.client.on("error", (err: any) => {
      console.error("Redis Client Error:", err.message || err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("Redis Client Connected");
      this.isConnected = true;
    });

    this.client.on("ready", () => {
      console.log("Redis Client Ready");
      this.isConnected = true;
    });

    this.client.on("end", () => {
      console.log("Redis Client Disconnected");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      // Don't throw - allow app to run without Redis
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
      } catch (error) {
        console.error("Redis disconnect error:", error);
      }
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      return; // Skip if not connected
    }

    try {
      const serializedValue = JSON.stringify(value);
      const expiry = ttl !== undefined ? ttl : this.config.ttl;
      
      if (expiry === 0) {
        await this.client.set(key, serializedValue);
      } else {
        await this.client.setEx(key, expiry, serializedValue);
      }
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      // Don't throw - graceful degradation
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null; // Return null if not connected
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null; // Return null on error
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -2;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`Redis expire error for key ${key}:`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async flush(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error("Redis flush error:", error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Redis invalidate pattern error for ${pattern}:`, error);
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
      throw new Error("Redis is not connected - rate limiting unavailable");
    }

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      return (results?.[0] as number) || 0;
    } catch (error) {
      console.error(`Redis increment counter error for key ${key}:`, error);
      throw error; // Rate limiting should fail if Redis is down
    }
  }

  async getCounter(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error("Redis is not connected - rate limiting unavailable");
    }

    try {
      const value = await this.client.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error(`Redis get counter error for key ${key}:`, error);
      throw error; // Rate limiting should fail if Redis is down
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
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
      isConnected: this.isConnected,
    };
  }
}

// Singleton instance
export const redisService = new RedisService();