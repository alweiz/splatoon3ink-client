import { CacheProvider, CacheEntry } from './types.js'
import fs from 'node:fs'
import path from 'node:path'

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
  private cacheDir: string

  constructor(cacheDir: string = './cache') {
    this.cacheDir = cacheDir

    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
  }

  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`)
  }

  get<T>(key: string): T | null {
    try {
      const filePath = this.getCacheFilePath(key)
      if (!fs.existsSync(filePath)) return null

      const content = fs.readFileSync(filePath, 'utf8')
      const entry: CacheEntry<T> = JSON.parse(content)

      const now = Date.now()
      const ttl = 60 * 60 * 1000 // 1 hour

      if (now - entry.timestamp > ttl) {
        fs.unlinkSync(filePath)
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
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2))
    } catch (error) {
      console.warn(`Failed to write cache for key ${key}:`, error)
    }
  }

  delete(key: string): void {
    try {
      const filePath = this.getCacheFilePath(key)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.warn(`Failed to delete cache for key ${key}:`, error)
    }
  }
}