import {
  Splatoon3ApiClient,
  MatchType,
  ScheduleInfo,
  CacheProvider,
  Locale,
  SchedulesResponse,
  SchedulesData,
  LocaleData,
  MatchSetting,
  BankaraMatchSetting,
  ScheduleNode,
  EventScheduleNode,
  TimePeriod
} from './types.js'
import { MemoryCache } from './cache.js'

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

  async fetchSchedules(): Promise<SchedulesResponse> {
    const cacheKey = 'splatoon3_schedules'

    // Check cache first
    const cached = this.cache.get<SchedulesResponse>(cacheKey)
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

    const data = await response.json() as SchedulesResponse
    this.cache.set(cacheKey, data)

    return data
  }

  async fetchLocale(locale?: Locale): Promise<LocaleData> {
    const targetLocale = locale || this.defaultLocale
    const cacheKey = `splatoon3_locale_${targetLocale}`

    // Check cache first
    const cached = this.cache.get<LocaleData>(cacheKey)
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

    const data = await response.json() as LocaleData
    this.cache.set(cacheKey, data)

    return data
  }

  async getScheduleForTime(dateTime: Date, matchType: MatchType, locale?: Locale): Promise<ScheduleInfo | null> {
    try {
      const [rawData, localeData] = await Promise.all([
        this.fetchSchedules(),
        this.fetchLocale(locale)
      ])

      const schedules: SchedulesData = rawData.data
      const userMillis = dateTime.getTime()

      // Find matching schedule and extract match setting
      const result = this.findMatchingSchedule(schedules, matchType, userMillis)
      if (!result) {
        return null
      }

      const { matchSetting, startTime, endTime } = result

      // Get localized names
      const ruleId = matchSetting.vsRule?.id
      const stage1Id = matchSetting.vsStages?.[0]?.id
      const stage2Id = matchSetting.vsStages?.[1]?.id

      const rule = ruleId ? this.getLocalizedName(localeData, 'rules', ruleId) : 'Unknown Rule'
      const stage1 = stage1Id ? this.getLocalizedName(localeData, 'stages', stage1Id) : 'Unknown Stage'
      const stage2 = stage2Id ? this.getLocalizedName(localeData, 'stages', stage2Id) : 'Unknown Stage'

      return {
        rule,
        stages: [stage1, stage2],
        startTime,
        endTime
      }

    } catch (error) {
      console.error('Error fetching schedule:', error)
      return null
    }
  }

  private findMatchingSchedule(
    schedules: SchedulesData,
    matchType: MatchType,
    userMillis: number
  ): { matchSetting: MatchSetting; startTime: string; endTime: string } | null {
    switch (matchType) {
      case 'regular':
        return this.findInNodes(
          schedules.regularSchedules.nodes,
          userMillis,
          (node) => node.regularMatchSetting
        )

      case 'bankara_open':
        return this.findInNodes(
          schedules.bankaraSchedules.nodes,
          userMillis,
          (node) => node.bankaraMatchSettings?.find(s => s.bankaraMode === 'OPEN')
        )

      case 'bankara_challenge':
        return this.findInNodes(
          schedules.bankaraSchedules.nodes,
          userMillis,
          (node) => node.bankaraMatchSettings?.find(s => s.bankaraMode === 'CHALLENGE')
        )

      case 'xmatch':
        return this.findInNodes(
          schedules.xSchedules.nodes,
          userMillis,
          (node) => node.xMatchSetting
        )

      case 'event':
        return this.findInEventNodes(schedules.eventSchedules.nodes, userMillis)

      case 'fest':
        if (!schedules.festSchedules?.nodes) return null
        return this.findInNodes(
          schedules.festSchedules.nodes,
          userMillis,
          (node) => node.festMatchSettings?.[0] ?? null
        )

      default:
        return null
    }
  }

  private findInNodes<T extends ScheduleNode>(
    nodes: T[],
    userMillis: number,
    getMatchSetting: (node: T) => MatchSetting | null | undefined
  ): { matchSetting: MatchSetting; startTime: string; endTime: string } | null {
    for (const node of nodes) {
      const start = new Date(node.startTime).getTime()
      const end = new Date(node.endTime).getTime()
      if (userMillis >= start && userMillis < end) {
        const matchSetting = getMatchSetting(node)
        if (matchSetting) {
          return {
            matchSetting,
            startTime: node.startTime,
            endTime: node.endTime
          }
        }
      }
    }
    return null
  }

  private findInEventNodes(
    nodes: EventScheduleNode[],
    userMillis: number
  ): { matchSetting: MatchSetting; startTime: string; endTime: string } | null {
    for (const node of nodes) {
      const timePeriod = node.timePeriods?.find((tp: TimePeriod) => {
        const start = new Date(tp.startTime).getTime()
        const end = new Date(tp.endTime).getTime()
        return userMillis >= start && userMillis < end
      })
      if (timePeriod && node.leagueMatchSetting) {
        return {
          matchSetting: node.leagueMatchSetting,
          startTime: timePeriod.startTime,
          endTime: timePeriod.endTime
        }
      }
    }
    return null
  }

  private getLocalizedName(locale: LocaleData, category: string, id: string): string {
    return locale[category]?.[id]?.name || id
  }
}