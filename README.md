# lolHighlights - League of Legends Highlights Analyzer

A comprehensive tool for automatically detecting, extracting, and analyzing highlights from League of Legends matches.

## Features

- **Automatic Highlight Detection**: AI-powered detection of epic plays, teamfights, and memorable moments
- **Riot Games API Integration**: Real-time data fetching from official League APIs with rate limiting
- **Match Analysis**: Detailed KDA calculations, performance metrics, and highlight scoring
- **Highlight Categorization**: Highlights organized by combat, objectives, early game, comeback, and damage
- **Export**: Export highlights in JSON, CSV, or Markdown formats
- **Search & Filter**: Filter highlights by type, category, severity, score, or text search
- **Database Storage**: MongoDB with connection pooling, migrations, and health monitoring
- **Comprehensive Testing**: Full test suite covering unit, integration, and edge cases

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB (Mongoose ODM, connection pooling, migrations)
- **API Client**: Riot Games API with automatic rate limiting and retry logic
- **Testing**: Jest + Supertest

## Quick Start

```bash
git clone https://github.com/albertoalagon0bot-collab/lolHighlights.git
cd lolHighlights
npm install
cp .env.example .env
npm start
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup and deployment instructions.

## API Documentation

See [docs/API.md](docs/API.md) for the complete API reference with all endpoints, parameters, and examples.

## Project Structure

```
lolHighlights/
├── src/
│   ├── config/
│   │   ├── database.js      # DB connection, pooling, health checks
│   │   └── migrations.js    # Migration system
│   ├── models/
│   │   ├── Match.js         # Match schema with highlight detection
│   │   └── Summoner.js      # Summoner schema
│   ├── routes/
│   │   ├── matches.js       # Match CRUD endpoints
│   │   ├── champions.js     # Champion statistics
│   │   ├── highlights.js    # Highlights with search, export, analyze
│   │   └── summoners.js     # Riot API summoner lookup
│   ├── services/
│   │   └── riotApi.js       # Riot API client with rate limiting
│   ├── utils/
│   │   ├── HighlightDetector.js  # Base highlight detection
│   │   └── HighlightAnalyzer.js  # Enhanced analysis & export
│   └── server.js            # Express app
├── tests/
│   ├── highlightDetection.test.js  # Base detector tests
│   ├── highlightAnalyzer.test.js   # Enhanced analyzer tests
│   ├── models.test.js              # Model unit tests
│   ├── riotApi.test.js             # API client tests
│   ├── database.test.js            # DB config tests
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
| GET | `/health` | Health check with DB status |
| GET | `/api/matches` | List matches (paginated) |
| GET | `/api/matches/:id` | Get specific match |
| POST | `/api/matches` | Create match |
| GET | `/api/champions` | Champion statistics |
| GET | `/api/champions/:name` | Champion match history |
| GET | `/api/highlights` | List highlights (search/filter) |
| GET | `/api/highlights/:matchId/export` | Export highlights (JSON/CSV/MD) |
| POST | `/api/highlights/:matchId/analyze` | Run enhanced analysis |
| GET | `/api/summoners/:region/:name` | Look up summoner |
| GET | `/api/summoners/:region/:name/matches` | Summoner match history |

## Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npx jest --coverage # With coverage report
```

## Configuration

All configuration is done via environment variables. See `.env.example` for the full list.

Key variables:
- `MONGODB_URI` - MongoDB connection string (required)
- `RIOT_API_KEY` - Riot Games API key (required for summoner endpoints)
- `RIOT_API_REGION` - Default region (default: `euw1`)
- `HIGHLIGHT_THRESHOLD` - Minimum highlight score (default: `0.75`)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for your changes
4. Ensure all tests pass: `npm test`
5. Commit with descriptive messages
6. Push and open a Pull Request

## License

MIT - Alberto Alagon