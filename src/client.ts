import fetch from 'node-fetch'
import { Splatoon3ApiClient, MatchType, ScheduleInfo, CacheProvider, Locale } from './types'
import { MemoryCache } from './cache'

export class Splatoon3InkClient implements Splatoon3ApiClient {
  private baseUrl = 'https://splatoon3.ink/data'
  private cache: CacheProvider
  private userAgent: string
  private defaultLocale: Locale

  constructor(cache?: CacheProvider, userAgent?: string, defaultLocale: Locale = 'ja-JP') {
    this.cache = cache || new MemoryCache()
    this.userAgent = userAgent || 'splatoon3ink-client/1.0.0'
    this.defaultLocale = defaultLocale
  }

  async fetchSchedules(): Promise<any> {
    const cacheKey = 'splatoon3_schedules'

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const url = `${this.baseUrl}/schedules.json`
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Splatoon3 schedules (status: ${response.status})`)
    }

    const data = await response.json()
    this.cache.set(cacheKey, data)

    return data
  }

  async fetchLocale(locale?: Locale): Promise<any> {
    const targetLocale = locale || this.defaultLocale
    const cacheKey = `splatoon3_locale_${targetLocale}`

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const url = `${this.baseUrl}/locale/${targetLocale}.json`
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Splatoon3 locale (status: ${response.status})`)
    }

    const data = await response.json()
    this.cache.set(cacheKey, data)

    return data
  }

  async getScheduleForTime(dateTime: Date, matchType: MatchType, locale?: Locale): Promise<ScheduleInfo | null> {
    try {
      const [rawData, localeData] = await Promise.all([
        this.fetchSchedules(),
        this.fetchLocale(locale)
      ])

      const schedules = rawData?.data
      if (!schedules) {
        throw new Error('Failed to get schedule data')
      }

      const userMillis = dateTime.getTime()
      let nodes: any[] = []
      let matchKey: string = ''
      let subMode: string | null = null

      // Select appropriate schedule type
      switch (matchType) {
        case 'regular':
          nodes = schedules.regularSchedules.nodes
          matchKey = 'regularMatchSetting'
          break
        case 'bankara_open':
          nodes = schedules.bankaraSchedules.nodes
          matchKey = 'bankaraMatchSettings'
          subMode = 'OPEN'
          break
        case 'bankara_challenge':
          nodes = schedules.bankaraSchedules.nodes
          matchKey = 'bankaraMatchSettings'
          subMode = 'CHALLENGE'
          break
        case 'xmatch':
          nodes = schedules.xSchedules.nodes
          matchKey = 'xMatchSetting'
          break
        case 'event':
          nodes = schedules.eventSchedules.nodes
          matchKey = 'leagueMatchSetting'
          break
        case 'fest':
          nodes = schedules.festSchedules?.nodes || []
          matchKey = 'festMatchSetting'
          break
        default:
          throw new Error(`Unknown match type: ${matchType}`)
      }

      // Find matching time slot
      const targetNode = nodes.find(node => {
        const start = new Date(node.startTime).getTime()
        const end = new Date(node.endTime).getTime()
        return userMillis >= start && userMillis < end
      })

      if (!targetNode) {
        return null
      }

      // Extract match settings
      let matchSetting: any
      if (subMode && targetNode[matchKey]) {
        const settings = Array.isArray(targetNode[matchKey])
          ? targetNode[matchKey]
          : [targetNode[matchKey]]
        matchSetting = settings.find((s: any) => s.mode === subMode)
      } else {
        matchSetting = targetNode[matchKey]
      }

      if (!matchSetting) {
        return null
      }

      // Get localized names
      const ruleId = matchSetting.vsRule?.id
      const stage1Id = matchSetting.vsStages?.[0]?.id
      const stage2Id = matchSetting.vsStages?.[1]?.id

      const rule = ruleId ? this.getLocalizedName(localeData, ruleId) : 'Unknown Rule'
      const stage1 = stage1Id ? this.getLocalizedName(localeData, stage1Id) : 'Unknown Stage'
      const stage2 = stage2Id ? this.getLocalizedName(localeData, stage2Id) : 'Unknown Stage'

      return {
        rule,
        stages: [stage1, stage2],
        startTime: targetNode.startTime,
        endTime: targetNode.endTime
      }

    } catch (error) {
      console.error('Error fetching schedule:', error)
      return null
    }
  }

  private getLocalizedName(locale: any, id: string): string {
    // Navigate through the locale object to find the name
    const keys = id.split('/')
    let current = locale

    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key]
      } else {
        return id // Fallback to ID if path not found
      }
    }

    return current?.name || current || id
  }
}