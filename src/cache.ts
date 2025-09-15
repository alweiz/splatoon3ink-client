import { CacheProvider, CacheEntry } from './types'

/**
 * In-memory cache implementation for Node.js environment
 */
export class MemoryCache implements CacheProvider {
  private cache = new Map<string, CacheEntry<any>>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    // Default TTL: 1 hour
    const ttl = 60 * 60 * 1000

    if (now - entry.timestamp > ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data: value
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * File-based cache implementation for persistent storage
 */
export class FileCache implements CacheProvider {
  private fs: any
  private path: any
  private cacheDir: string

  constructor(cacheDir: string = './cache') {
    this.fs = require('fs')
    this.path = require('path')
    this.cacheDir = cacheDir

    // Ensure cache directory exists
    if (!this.fs.existsSync(cacheDir)) {
      this.fs.mkdirSync(cacheDir, { recursive: true })
    }
  }

  private getCacheFilePath(key: string): string {
    return this.path.join(this.cacheDir, `${key}.json`)
  }

  get<T>(key: string): T | null {
    try {
      const filePath = this.getCacheFilePath(key)
      if (!this.fs.existsSync(filePath)) return null

      const content = this.fs.readFileSync(filePath, 'utf8')
      const entry: CacheEntry<T> = JSON.parse(content)

      const now = Date.now()
      const ttl = 60 * 60 * 1000 // 1 hour

      if (now - entry.timestamp > ttl) {
        this.fs.unlinkSync(filePath)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn(`Failed to read cache for key ${key}:`, error)
      return null
    }
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    try {
      const filePath = this.getCacheFilePath(key)
      const entry: CacheEntry<T> = {
        timestamp: Date.now(),
        data: value
      }
      this.fs.writeFileSync(filePath, JSON.stringify(entry, null, 2))
    } catch (error) {
      console.warn(`Failed to write cache for key ${key}:`, error)
    }
  }

  delete(key: string): void {
    try {
      const filePath = this.getCacheFilePath(key)
      if (this.fs.existsSync(filePath)) {
        this.fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.warn(`Failed to delete cache for key ${key}:`, error)
    }
  }
}