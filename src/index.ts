// Main exports for the Splatoon3.ink API Client

export { Splatoon3InkClient } from './client'
export { MemoryCache, FileCache } from './cache'
export type {
  MatchType,
  ScheduleInfo,
  Splatoon3ApiClient,
  CacheProvider,
  CacheEntry,
  Locale
} from './types'

// Convenience function for quick usage
export async function getSchedule(
  dateTime: Date,
  matchType: MatchType = 'bankara_open',
  cacheProvider?: CacheProvider,
  locale?: Locale
): Promise<ScheduleInfo | null> {
  const client = new Splatoon3InkClient(cacheProvider)
  return await client.getScheduleForTime(dateTime, matchType, locale)
}

// Example usage:
/*
import { getSchedule, Splatoon3InkClient, FileCache } from 'splatoon3ink-client'

// Quick usage
const schedule = await getSchedule(new Date(), 'bankara_open')

// With specific language
const scheduleEn = await getSchedule(new Date(), 'bankara_open', undefined, 'en-US')

// With custom cache and language
const cache = new FileCache('./my-cache')
const client = new Splatoon3InkClient(cache, undefined, 'de-DE')
const schedule = await client.getScheduleForTime(new Date(), 'xmatch')
*/