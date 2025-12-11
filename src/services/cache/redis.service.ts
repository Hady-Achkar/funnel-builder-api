import { createClient, RedisClientType } from "redis";

export interface CacheConfig {
  url: string;
  password?: string;
  database?: number;
  ttl: number;
}

export class RedisService {
  private client: RedisClientType | null = null;
  private config: CacheConfig;

  constructor() {
    this.config = {
      url: process.env.REDIS_URL || "redis://localhost:6379",
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || "0"),
      ttl: 3600, // 1 hour default
    };
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        password: this.config.password,
        database: this.config.database,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: false, // Disable auto-reconnect to stop spamming
        },
      });

      this.client.on("error", () => {
        // Silently handle errors - already logged in connect catch
      });

      await this.client.connect();
      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Failed to connect to Redis - will operate without cache");
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client.isOpen) {
      try {
        await this.client.quit();
        console.log("Redis disconnected");
      } catch (error) {
        console.error("Error disconnecting Redis:", error);
      } finally {
        this.client = null;
      }
    } else if (this.client) {
      this.client = null;
    }
  }

  get isConnected(): boolean {
    return this.client?.isOpen || false;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client?.isOpen) return;
    
    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl !== undefined ? ttl : this.config.ttl;
      
      if (expiry > 0) {
        await this.client.setEx(key, expiry, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Redis set error [${key}]:`, error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client?.isOpen) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis get error [${key}]:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client?.isOpen) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Redis delete error [${key}]:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client?.isOpen) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error [${key}]:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.client?.isOpen) return -2;
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error [${key}]:`, error);
      return -2;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client?.isOpen) return;
    
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`Redis expire error [${key}]:`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client?.isOpen) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis keys error [${pattern}]:`, error);
      return [];
    }
  }

  async flush(): Promise<void> {
    if (!this.client?.isOpen) return;
    
    try {
      await this.client.flushDb();
    } catch (error) {
      console.error("Redis flush error:", error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client?.isOpen) return;
    
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Redis invalidate pattern error [${pattern}]:`, error);
    }
  }

  // Session methods
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
    if (!this.client?.isOpen) {
      throw new Error("Redis not connected - rate limiting unavailable");
    }

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      return (results?.[0] as number) || 0;
    } catch (error) {
      console.error(`Redis increment error [${key}]:`, error);
      throw error;
    }
  }

  async getCounter(key: string): Promise<number> {
    if (!this.client?.isOpen) {
      throw new Error("Redis not connected - rate limiting unavailable");
    }

    try {
      const value = await this.client.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error(`Redis get counter error [${key}]:`, error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.client?.isOpen) return false;
    
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

  // Get database info
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