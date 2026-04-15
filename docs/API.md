# lolHighlights API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Endpoints

### Health Check

#### `GET /health`
Returns application and database health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "healthy",
    "latency": "5ms",
    "pool": { "ready": true, "poolSize": 3 }
  }
}
```

#### `GET /`
Returns API info and available endpoints.

---

### Matches

#### `GET /api/matches`
List all matches with pagination.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |

**Response:**
```json
{
  "matches": [...],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

#### `GET /api/matches/:matchId`
Get a specific match by its Riot match ID.

#### `POST /api/matches`
Create a new match record.

**Body:** Match object (see Match schema below)

---

### Champions

#### `GET /api/champions`
Get champion statistics aggregated from all stored matches.

**Response:**
```json
{
  "champions": [
    {
      "name": "Aatrox",
      "gamesPlayed": 25,
      "winRate": "56.0",
      "avgKDA": "3.45",
      "pentaKills": 1
    }
  ]
}
```

#### `GET /api/champions/:name`
Get recent matches for a specific champion.

---

### Highlights

#### `GET /api/highlights`
List all highlights with search and filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `limit` | int | Items per page |
| `type` | string | Filter by highlight type (e.g., `pentaKill`, `baronKill`) |
| `severity` | string | Filter by severity (`low`, `medium`, `high`, `critical`) |
| `search` | string | Text search in descriptions |
| `sort` | string | Sort by `score` or default `date` |

#### `GET /api/highlights/:matchId`
Get highlights for a specific match.

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

#### `GET /api/highlights/:matchId/export`
Export highlights in various formats.

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | `json` (default), `csv`, or `markdown` |

#### `POST /api/highlights/:matchId/analyze`
Run enhanced analysis on a match to detect and score highlights.

---

### Summoners

#### `GET /api/summoners/:region/:name`
Look up a summoner via Riot API.

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | string | Riot region (e.g., `euw1`, `na1`, `kr`) |
| `name` | string | Summoner name (URL-encoded) |

**Response:**
```json
{
  "summonerId": "...",
  "puuid": "...",
  "name": "SummonerName",
  "summonerLevel": 150,
  "region": "euw1"
}
```

#### `GET /api/summoners/:region/:name/matches`
Get match history for a summoner.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | int | 0 | Start index |
| `count` | int | 20 | Number of matches (max 100) |

---

## Supported Riot Regions

| Code | Region | Platform |
|------|--------|----------|
| `br1` | Brazil | BR1 |
| `eun1` | Europe Nordic & East | EUN1 |
| `euw1` | Europe West | EUW1 |
| `jp1` | Japan | JP1 |
| `kr` | Korea | KR |
| `la1` | Latin America North | LA1 |
| `la2` | Latin America South | LA2 |
| `na1` | North America | NA1 |
| `oc1` | Oceania | OC1 |
| `tr1` | Turkey | TR1 |
| `ru` | Russia | RU |

---

## Highlight Types

| Type | Category | Default Severity |
|------|----------|-----------------|
| `pentaKill` | combat | critical |
| `quadraKill` | combat | high |
| `tripleKill` | combat | medium |
| `perfectKDA` | combat | high |
| `killingSpree` | combat | medium |
| `highDamage` | damage | low |
| `firstBlood` | earlyGame | medium |
| `baronKill` | objectives | high |
| `dragonKill` | objectives | medium |
| `towerDestroyed` | objectives | low |
| `inhibitorDestroyed` | objectives | medium |
| `comeback` | comeback | high |

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
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded (Riot API) |
| 500 | Internal server error |
