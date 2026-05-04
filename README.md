# lolHighlights - League of Legends Highlights Analyzer

A tool for automatically detecting and scoring highlights from League of Legends matches with real-time Riot API integration.

## Features

### Implemented ✅
- **Automatic Highlight Detection**: Detects epic plays, teamfights, and memorable moments from match data
- **Riot Games API Integration**: Fetch summoner info and match history from all 11 Riot regions with rate limiting and retry logic
- **Highlight Scoring**: Weighted scoring system (0–100) based on multi-kills, objectives, KDA, and game impact
- **Summoner Caching**: Smart caching system to minimize Riot API calls
- **Match Sync**: Sync match history from Riot API to local MongoDB storage
- **Search & Filter**: Filter highlights by type and severity via query parameters
- **RESTful API**: Full CRUD endpoints for matches and highlights with pagination

### In Progress 🚧
- **Highlight Categorization**: Group highlights by combat, objectives, early game, comeback, damage
- **Enhanced Analysis**: Timeline-based detection with deeper match analysis

### Planned 📋
- **Export**: Export highlights in JSON, CSV, or Markdown formats
- **Highlight Search**: Full-text search across highlight descriptions
- **Web Dashboard**: Interactive frontend for browsing and managing highlights
- **User Authentication**: API key authentication and user accounts
- **Real-Time Notifications**: WebSocket-based live updates

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB (Mongoose ODM)
- **API Client**: Riot Games API (Match v5, Summoner v4) via Axios with interceptors
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint with Standard style

## Quick Start

```bash
git clone https://github.com/albertoalagon0bot-collab/lolHighlights.git
cd lolHighlights
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Riot API key
npm start
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup and deployment instructions.

## API Documentation

See [docs/API.md](docs/API.md) for the complete API reference with all endpoints, parameters, and examples.

## Project Structure

```
lolHighlights/
├── src/
│   ├── models/
│   │   ├── Match.js         # Match schema with highlight detection
│   │   └── Summoner.js      # Summoner schema with caching
│   ├── routes/
│   │   ├── matches.js       # Match CRUD endpoints
│   │   ├── champions.js     # Champion statistics
│   │   ├── highlights.js    # Highlight CRUD and filtering
│   │   └── summoners.js     # Riot API summoner lookup & match sync
│   ├── services/
│   │   └── riotApi.js       # Riot API client with rate limiting & retry
│   ├── utils/
│   │   └── HighlightDetector.js  # Highlight detection & scoring algorithm
│   └── server.js            # Express app entry point
├── tests/
│   ├── highlightDetection.test.js  # Highlight detector unit tests
│   ├── riotApi.test.js             # Riot API client tests
│   └── api.test.js                 # API integration tests
├── docs/
│   ├── API.md             # Full API documentation
│   └── SETUP.md           # Setup & deployment guide
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/matches` | List matches (paginated) |
| GET | `/api/matches/:id` | Get specific match |
| POST | `/api/matches` | Create match |
| DELETE | `/api/matches/:matchId` | Delete match |
| GET | `/api/champions` | Champion statistics |
| GET | `/api/champions/:name` | Champion match history |
| GET | `/api/highlights` | List highlights (filter by type/severity) |
| GET | `/api/highlights/:id` | Get specific highlight |
| POST | `/api/highlights` | Create highlight |
| DELETE | `/api/highlights/:matchId/:highlightId` | Delete highlight |
| GET | `/api/summoners/:region/:name` | Look up summoner |
| GET | `/api/summoners/:region/:name/matches` | Summoner match history |
| POST | `/api/summoners/:region/:name/matches/sync` | Sync matches from Riot API |

## Supported Highlight Types

| Type | Description | Severity |
|------|-------------|----------|
| pentaKill | 5 kills in a short time | critical |
| quadraKill | 4 kills in a short time | high |
| tripleKill | 3 kills in a short time | medium |
| firstBlood | First kill of the match | medium |
| perfectKDA | No deaths with kills and assists | high |
| baronKill | Baron Nashor secured | high |
| killingSpree | 5+ kill streak | medium |
| highDamage | Significantly above-average damage | low |
| comeback | Comeback victory (planned) | high |

## Supported Regions

All 11 Riot regions: BR1, EUN1, EUW1, JP1, KR, LA1, LA2, NA1, OC1, TR1, RU

## Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npx jest --coverage # With coverage report
```

## Configuration

All configuration is done via environment variables. See `.env.example` for the full list.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/lolhighlights | No |
| `RIOT_API_KEY` | Riot Games API key | — | Yes (for Riot features) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for your changes
4. Ensure all tests pass: `npm test`
5. Commit with descriptive messages
6. Push and open a Pull Request

## License

MIT - Alberto Alagon
