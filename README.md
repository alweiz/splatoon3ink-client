# Splatoon3.ink API Client

Node.js/TypeScript client for the [Splatoon3.ink](https://splatoon3.ink) API to fetch Splatoon 3 match schedules.

## Data Source

This library depends on the [Splatoon3.ink](https://splatoon3.ink) API to fetch real-time Splatoon 3 schedule data. Splatoon3.ink is a community-maintained service that provides Splatoon 3 game data.

## Features

- ✅ Fetch real-time Splatoon 3 match schedules
- ✅ Support for all match types (Regular, Bankara, X Match, Event, Fest)
- ✅ **Specific datetime queries** - Get schedules for any past/future time
- ✅ Built-in caching (Memory/File-based)
- ✅ Multi-language support (14 languages)
- ✅ TypeScript support
- ✅ WebSocket-friendly (no browser dependencies)

## Installation

```bash
npm install splatoon3ink-client
# or
yarn add splatoon3ink-client
```

## Quick Usage

```typescript
import { getSchedule } from 'splatoon3ink-client'

// Get current Bankara Open schedule (Japanese)
const schedule = await getSchedule(new Date(), 'bankara_open')

// Get schedule for specific time (tomorrow 19:00)
const tomorrow19 = new Date()
tomorrow19.setDate(tomorrow19.getDate() + 1)
tomorrow19.setHours(19, 0, 0, 0)
const tomorrowSchedule = await getSchedule(tomorrow19, 'bankara_open')

// Get schedule in English for specific datetime
const specificTime = new Date('2024-12-25T14:30:00Z')
const scheduleEn = await getSchedule(specificTime, 'xmatch', undefined, 'en-US')

console.log(schedule)
// {
//   rule: "ガチエリア",
//   stages: ["ユノハナ大渓谷", "マサバ海峡大橋"],
//   startTime: "2024-01-15T10:00:00.000Z",
//   endTime: "2024-01-15T12:00:00.000Z"
// }

console.log(scheduleEn)
// {
//   rule: "Splat Zones",
//   stages: ["Um'ami Ruins", "Mahi-Mahi Resort"],
//   startTime: "2024-01-15T10:00:00.000Z",
//   endTime: "2024-01-15T12:00:00.000Z"
// }
```

## Advanced Usage

```typescript
import { Splatoon3InkClient, FileCache } from 'splatoon3ink-client'

// Create client with German language as default
const client = new Splatoon3InkClient(
  new FileCache('./cache'),
  'MyApp/1.0.0 (contact@example.com)',
  'de-DE'
)

// Get specific match type (uses default German)
const xMatchSchedule = await client.getScheduleForTime(
  new Date('2024-01-15T14:30:00Z'),
  'xmatch'
)

// Override language for specific request
const xMatchScheduleEn = await client.getScheduleForTime(
  new Date('2024-01-15T14:30:00Z'),
  'xmatch',
  'en-US'
)
```

## Supported Languages

The library supports 14 languages from Splatoon3.ink:

- `'de-DE'` - German
- `'en-GB'` - English (UK)
- `'en-US'` - English (US)
- `'es-ES'` - Spanish (Spain)
- `'es-MX'` - Spanish (Mexico)
- `'fr-CA'` - French (Canada)
- `'fr-FR'` - French (France)
- `'it-IT'` - Italian
- `'ja-JP'` - Japanese (default)
- `'ko-KR'` - Korean
- `'nl-NL'` - Dutch
- `'ru-RU'` - Russian
- `'zh-CN'` - Chinese (Simplified)
- `'zh-TW'` - Chinese (Traditional)

## Match Types

- `'regular'` - Turf War / レギュラーマッチ (ナワバリ)
- `'bankara_open'` - Ranked Battle (Open) / バンカラマッチ (オープン)
- `'bankara_challenge'` - Ranked Battle (Series) / バンカラマッチ (チャレンジ)
- `'xmatch'` - X Battle / Xマッチ
- `'event'` - Event Match / イベントマッチ
- `'fest'` - Splatfest / フェスマッチ

## WebSocket Integration Example

```typescript
import WebSocket from 'ws'
import { Splatoon3InkClient } from 'splatoon3ink-client'

const client = new Splatoon3InkClient()
const wss = new WebSocket.Server({ port: 8080 })

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { type, matchType, dateTime } = JSON.parse(message.toString())

    if (type === 'getSchedule') {
      const schedule = await client.getScheduleForTime(
        new Date(dateTime),
        matchType
      )

      ws.send(JSON.stringify({
        type: 'schedule',
        data: schedule
      }))
    }
  })
})
```

## API Reference

### `getSchedule(dateTime, matchType?, cacheProvider?)`
Quick function to get schedule for a specific time.

### `Splatoon3InkClient`
Main client class with methods:
- `fetchSchedules()` - Get raw schedule data from Splatoon3.ink
- `fetchLocale()` - Get Japanese localization data from Splatoon3.ink
- `getScheduleForTime(dateTime, matchType)` - Get parsed schedule

### Cache Providers
- `MemoryCache` - In-memory caching (default)
- `FileCache` - File-based persistent caching

## Important Notes

- **External Dependency**: This library relies on the availability of [Splatoon3.ink](https://splatoon3.ink) API
- **Rate Limiting**: Built-in 1-hour caching to respect the API and improve performance
- **Community Service**: Splatoon3.ink is a community-maintained service - please use responsibly
- **Data Accuracy**: Schedule data accuracy depends on Splatoon3.ink's data quality