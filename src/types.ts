// Splatoon 3 Schedule Types
//
// API Reference: https://splatoon3.ink/
// Types based on API response as of: 2026-01-20
// Endpoints:
//   - Schedules: https://splatoon3.ink/data/schedules.json
//   - Locale:    https://splatoon3.ink/data/locale/{locale}.json

// ============================================
// API Response Types
// ============================================

export interface VsStage {
  vsStageId: number
  name: string
  image: { url: string }
  id: string
}

export interface VsRule {
  name: string
  rule: string
  id: string
}

export interface MatchSetting {
  vsStages: VsStage[]
  vsRule: VsRule
}

export interface BankaraMatchSetting extends MatchSetting {
  bankaraMode: 'OPEN' | 'CHALLENGE'
}

export interface ScheduleNode {
  startTime: string
  endTime: string
}

export interface RegularScheduleNode extends ScheduleNode {
  regularMatchSetting: MatchSetting | null
  festMatchSettings: MatchSetting[] | null
}

export interface BankaraScheduleNode extends ScheduleNode {
  bankaraMatchSettings: BankaraMatchSetting[] | null
  festMatchSettings: MatchSetting[] | null
}

export interface XScheduleNode extends ScheduleNode {
  xMatchSetting: MatchSetting | null
  festMatchSettings: MatchSetting[] | null
}

export interface TimePeriod {
  startTime: string
  endTime: string
}

export interface EventScheduleNode {
  leagueMatchSetting: MatchSetting | null
  timePeriods: TimePeriod[]
}

export interface FestScheduleNode extends ScheduleNode {
  festMatchSettings: MatchSetting[] | null
}

export interface SchedulesData {
  regularSchedules: { nodes: RegularScheduleNode[] }
  bankaraSchedules: { nodes: BankaraScheduleNode[] }
  xSchedules: { nodes: XScheduleNode[] }
  eventSchedules: { nodes: EventScheduleNode[] }
  festSchedules: { nodes: FestScheduleNode[] } | null
}

export interface SchedulesResponse {
  data: SchedulesData
}

export interface LocaleEntry {
  name: string
}

export interface LocaleData {
  rules: Record<string, LocaleEntry>
  stages: Record<string, LocaleEntry>
  [key: string]: Record<string, LocaleEntry>
}

// ============================================
// Client Types
// ============================================

export type Locale =
  | 'de-DE'    // German
  | 'en-GB'    // English (UK)
  | 'en-US'    // English (US)
  | 'es-ES'    // Spanish (Spain)
  | 'es-MX'    // Spanish (Mexico)
  | 'fr-CA'    // French (Canada)
  | 'fr-FR'    // French (France)
  | 'it-IT'    // Italian
  | 'ja-JP'    // Japanese
  | 'ko-KR'    // Korean
  | 'nl-NL'    // Dutch
  | 'ru-RU'    // Russian
  | 'zh-CN'    // Chinese (Simplified)
  | 'zh-TW'    // Chinese (Traditional)

export type MatchType =
  | 'regular'           // レギュラーマッチ(ナワバリ)
  | 'bankara_open'      // バンカラ(オープン)
  | 'bankara_challenge' // バンカラ(チャレンジ)
  | 'xmatch'            // Xマッチ
  | 'event'             // イベントマッチ
  | 'fest'              // フェスマッチ(フェス開催時)

export interface CacheEntry<T> {
  timestamp: number
  data: T
}

export interface ScheduleInfo {
  rule: string
  stages: string[]
  startTime: string
  endTime: string
}

export interface Splatoon3ApiClient {
  fetchSchedules(): Promise<SchedulesResponse>
  fetchLocale(locale?: Locale): Promise<LocaleData>
  getScheduleForTime(dateTime: Date, matchType: MatchType, locale?: Locale): Promise<ScheduleInfo | null>
}

export interface CacheProvider {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttlMs?: number): void
  delete(key: string): void
}