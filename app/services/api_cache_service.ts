type CacheEntry<T> = {
  value: T
  expiresAt: number
  tags: string[]
}

class ApiCacheService {
  private store = new Map<string, CacheEntry<unknown>>()

  async getOrSet<T>(key: string, ttlMs: number, producer: () => Promise<T>, tags: string[] = []): Promise<T> {
    const now = Date.now()
    const cached = this.store.get(key)

    if (cached && cached.expiresAt > now) {
      return cached.value as T
    }

    const value = await producer()
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      tags,
    })

    return value
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  invalidateByTags(tags: string[]): void {
    if (!tags.length) return

    const tagSet = new Set(tags)

    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.some((tag) => tagSet.has(tag))) {
        this.store.delete(key)
      }
    }
  }
}

const apiCacheService = new ApiCacheService()

export default apiCacheService
