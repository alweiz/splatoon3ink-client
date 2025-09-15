// Splatoon 3 Schedule Types

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
  fetchSchedules(): Promise<any>
  fetchLocale(locale?: Locale): Promise<any>
  getScheduleForTime(dateTime: Date, matchType: MatchType, locale?: Locale): Promise<ScheduleInfo | null>
}

export interface CacheProvider {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttlMs?: number): void
  delete(key: string): void
}