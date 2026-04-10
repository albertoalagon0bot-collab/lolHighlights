# lolHighlights - League of Legends Highlights Analyzer

A comprehensive tool for automatically detecting, extracting, and analyzing highlights from League of Legends matches.

## Features

- **Automatic Highlight Detection**: AI-powered detection of epic plays, teamfights, and memorable moments
- **Riot Games API Integration**: Real-time data fetching from official League APIs
- **Match Analysis**: Detailed KDA calculations, performance metrics, and highlight scoring
- **Web Dashboard**: Interactive interface for browsing and managing highlights
- **Database Storage**: Persistent storage for matches, highlights, and player data
- **Comprehensive Testing**: Full test suite for all core functionality

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB (document storage)
- **AI/ML**: TensorFlow.js for highlight detection
- **Frontend**: React.js (planned)
- **Testing**: Jest + Supertest

## Project Structure

```
lolHighlights/
├── src/
│   ├── models/
│   │   └── Match.js
│   ├── utils/
│   │   └── HighlightDetector.js
│   ├── routes/
│   │   ├── matches.js
│   │   ├── champions.js
│   │   └── highlights.js
│   └── server.js
├── tests/
│   └── highlightDetection.test.js
├── package.json
├── .env.example
└── README.md
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: `cp .env.example .env`
4. Start the server: `npm start`

## API Endpoints

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get specific match
- `POST /api/matches` - Create new match record

### Champions
- `GET /api/champions` - List all champions
- `GET /api/champions/:id` - Get champion details

### Highlights
- `GET /api/highlights` - Get all highlights
- `POST /api/highlights` - Create new highlight
- `GET /api/highlights/:id` - Get specific highlight

## Issues and TODOs

### High Priority
- [ ] Set up database schema and connection (#1)
- [ ] Implement Riot Games API integration (#2)
- [ ] Enhance highlight extraction and analysis (#3)

### Medium Priority
- [ ] Add comprehensive test suite (#5)
- [ ] Improve project documentation (#6)

### Future Features
- [ ] Build web dashboard interface (#4)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details