import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php'
const ARCHIVE_METADATA_URL = 'https://archive.org/metadata'

// Simple in-memory TTL cache. Archive.org can take 10-15s to respond,
// so caching identical queries avoids repeating that wait for every
// student hitting the same search/collection.
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes
type CacheEntry = { data: unknown; expiresAt: number }
const searchCache = new Map<string, CacheEntry>()
const metadataCache = new Map<string, CacheEntry>()

function getCached<T>(store: Map<string, CacheEntry>, key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

function setCached(store: Map<string, CacheEntry>, key: string, data: unknown) {
  store.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

export default class OnlineLibrariesController {
  /**
   * GET /api/online-library/search
   * Proxies Archive.org's advancedsearch.php so the request goes out
   * from the server (not the student's/dev's browser network).
   */
  public async search({ request, response }: HttpContext) {
    try {
      const { q, rows, page } = request.qs()

      if (!q) {
        return response.badRequest({ error: 'Missing required query param: q' })
      }

      const cacheKey = `${q}|${rows ?? 12}|${page ?? 1}`
      const cached = getCached(searchCache, cacheKey)
      if (cached) {
        return response.ok(cached)
      }

      const archiveResponse = await axios.get(ARCHIVE_SEARCH_URL, {
        params: {
          q,
          // licenseurl is required so the frontend can verify a book is
          // actually public-domain / Creative Commons before showing it.
          'fl[]': ['identifier', 'title', 'creator', 'language', 'licenseurl', 'collection'],
          rows: rows ?? 12,
          page: page ?? 1,
          output: 'json',
        },
        timeout: 20000,
      })

      setCached(searchCache, cacheKey, archiveResponse.data)
      return response.ok(archiveResponse.data)
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.message : 'Unknown error'

      return response.internalServerError({
        error: 'Failed to reach Archive.org',
        details: message,
      })
    }
  }

  /**
   * GET /api/online-library/metadata/:identifier
   * Proxies Archive.org's metadata endpoint to get the file list
   * (used for the chapter picker modal).
   */
  public async metadata({ params, response }: HttpContext) {
    try {
      const { identifier } = params

      if (!identifier) {
        return response.badRequest({ error: 'Missing required param: identifier' })
      }

      const cached = getCached(metadataCache, identifier)
      if (cached) {
        return response.ok(cached)
      }

      const archiveResponse = await axios.get(`${ARCHIVE_METADATA_URL}/${identifier}`, {
        timeout: 20000,
      })

      setCached(metadataCache, identifier, archiveResponse.data)
      return response.ok(archiveResponse.data)
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.message : 'Unknown error'

      return response.internalServerError({
        error: 'Failed to reach Archive.org',
        details: message,
      })
    }
  }
}