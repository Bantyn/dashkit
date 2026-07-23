import { CacheService } from "../../../infrastructure/cache/cache.service";
import { NotImplementedError } from "../../../shared/utils/errors";

export interface ICacheProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): T;
  delete(key: string): void;
  deleteByPrefix(prefix: string): void;
  deleteByMatch(predicate: (key: string) => boolean): void;
  clear(): void;
}

export class MemoryCacheProvider implements ICacheProvider {
  private readonly cacheService = new CacheService();

  get<T>(key: string): T | null {
    return this.cacheService.get<T>(key);
  }

  set<T>(key: string, value: T, ttlMs: number): T {
    return this.cacheService.set<T>(key, value, ttlMs);
  }

  delete(key: string): void {
    this.cacheService.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    this.cacheService.deleteByPrefix(prefix);
  }

  deleteByMatch(predicate: (key: string) => boolean): void {
    this.cacheService.deleteByMatch(predicate);
  }

  clear(): void {
    this.cacheService.clear();
  }
}

export class RedisCacheProvider implements ICacheProvider {
  get<T>(_key: string): T | null {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }

  set<T>(_key: string, value: T, _ttlMs: number): T {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }

  delete(_key: string): void {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }

  deleteByPrefix(_prefix: string): void {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }

  deleteByMatch(_predicate: (key: string) => boolean): void {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }

  clear(): void {
    throw new NotImplementedError("Redis cache provider is not implemented.");
  }
}
