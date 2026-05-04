# lolHighlights API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Endpoints

### Health Check

#### `GET /health`
Returns application health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### `GET /`
Returns API info and available endpoints.

---

### Matches

#### `GET /api/matches`
List all matches with optional pagination and filtering.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `highlighted` | bool | — | Filter by highlighted status |

**Response:**
```json
{
  "matches": [
    {
      "matchId": "EUW1_1234567890",
      "gameId": 1234567890,
      "gameDuration": 1800,
      "gameCreation": 1234567890000,
      "platformId": "EUW1",
      "participants": [...],
      "teams": [...],
      "highlighted": true,
      "highlightScore": 45
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

#### `GET /api/matches/:matchId`
Get a specific match by its Riot match ID.

#### `POST /api/matches`
Create a new match record.

**Body:** Match object (matchId, gameId, platformId, gameDuration, gameCreation, participants, teams)

#### `DELETE /api/matches/:matchId`
Delete a match by ID.

---

### Champions

#### `GET /api/champions`
Get champion statistics aggregated from all stored matches.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

**Response:**
```json
{
  "champions": [
    {
      "championId": 266,
      "name": "Aatrox",
      "gamesPlayed": 25,
      "winRate": 0.56,
      "avgKDA": 3.45
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 160, "pages": 8 }
}
```

#### `GET /api/champions/:name`
Get champion details and recent match history.

---

### Highlights

#### `GET /api/highlights`
List all highlights with optional filtering.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `type` | string | — | Filter by highlight type (e.g., `pentaKill`, `baronKill`) |
| `severity` | string | — | Filter by severity (`low`, `medium`, `high`, `critical`) |
| `participantId` | int | — | Filter by participant ID |

**Response:**
```json
{
  "highlights": [
    {
      "type": "pentaKill",
      "timestamp": 1234567900000,
      "participantId": 1,
      "championName": "Aatrox",
      "description": "Aatrox achieved a PentaKill!",
      "severity": "critical",
      "score": 30,
      "matchId": "EUW1_1234567890",
      "highlightScore": 80
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

#### `GET /api/highlights/:id`
Get a specific highlight by ID.

#### `POST /api/highlights`
Create a highlight manually.

**Body:**
```json
{
  "matchId": "EUW1_1234567890",
  "highlight": {
    "type": "pentaKill",
    "timestamp": 1700000000000,
    "participantId": 1,
    "description": "Aatrox achieved a PentaKill!",
    "severity": "critical"
  }
}
```

#### `DELETE /api/highlights/:matchId/:highlightId`
Delete a specific highlight.

---

### Summoners

#### `GET /api/summoners/:region/:name`
Look up a summoner via Riot API. Results are cached to minimize API calls.

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | string | Riot region (e.g., `euw1`, `na1`, `kr`) |
| `name` | string | Summoner name (URL-encoded) |

**Response:**
```json
{
  "summoner": {
    "id": "summoner-id-123",
    "name": "SummonerName",
    "profileIconId": 1234,
    "summonerLevel": 150,
    "region": "EUW1",
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

#### `GET /api/summoners/:region/:name/matches`
Get match history for a summoner. Returns cached matches first, fetches remaining from Riot API.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | int | 0 | Start index |
| `count` | int | 20 | Number of matches (max 100) |

#### `POST /api/summoners/:region/:name/matches/sync`
Sync summoner matches from Riot API to local database.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | int | 10 | Number of matches to sync (max 50) |

---

## Supported Riot Regions

| Code | Region |
|------|--------|
| `BR1` | Brazil |
| `EUN1` | Europe Nordic & East |
| `EUW1` | Europe West |
| `JP1` | Japan |
| `KR` | Korea |
| `LA1` | Latin America North |
| `LA2` | Latin America South |
| `NA1` | North America |
| `OC1` | Oceania |
| `TR1` | Turkey |
| `RU` | Russia |

---

## Highlight Types

Currently detected by `HighlightDetector.js`:

| Type | Description | Severity |
|------|-------------|----------|
| `pentaKill` | 5 kills in a short time | critical |
| `quadraKill` | 4 kills in a short time | high |
| `tripleKill` | 3 kills in a short time | medium |
| `firstBlood` | First kill of the match | medium |
| `perfectKDA` | No deaths with kills and assists | high |
| `killingSpree` | 5+ kill streak | medium |
| `highDamage` | Significantly above-average damage | low |
| `baronKill` | Baron Nashor secured | high |

### Not yet implemented:
- `dragonKill`, `towerDestroyed`, `inhibitorDestroyed` (objective detection)
- `comeback` (requires timeline data from Riot API)

---

## Scoring System

Highlights are scored based on weighted rules:
- Multi-kills: pentaKill (30), quadraKill (20), tripleKill (10)
- Objectives: baronKill (8)
- Performance: perfectKDA (10), killingSpree (3), highDamage (5)
- Events: firstBlood (5)

**Score Range:** 0–100
- 80–100: Epic (penta kills, baron steals)
- 60–79: Great (quadra kills, perfect KDA)
- 40–59: Good (triple kills, objectives)
- 0–39: Minor (first blood, towers)

---

## Error Handling

All errors return a consistent format:
```json
{ "error": "Error description" }
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 404 | Resource not found |
| 429 | Rate limit exceeded (Riot API) |
| 500 | Internal server error |

## Rate Limits

- **Riot API**: 20 requests/minute, 1 request/second (per Riot's limits)
- **Local API**: No rate limiting currently implemented
