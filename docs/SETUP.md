# Setup & Deployment Guide

## Prerequisites

- **Node.js** >= 16.0.0
- **MongoDB** >= 4.4
- **npm** or **yarn**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/albertoalagon0bot-collab/lolHighlights.git
cd lolHighlights

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings (see Configuration below)

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start the server
npm start

# Or in development mode with auto-reload
npm run dev
```

The server starts at `http://localhost:3000`.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/lolhighlights | No |
| `MONGODB_TEST_URI` | Test database URI | mongodb://localhost:27017/lolhighlights_test | No |
| `RIOT_API_KEY` | Riot Games API key | — | Yes (for Riot features) |

Example `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lolhighlights
MONGODB_TEST_URI=mongodb://localhost:27017/lolhighlights_test
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Riot API Key

1. Go to https://developer.riotgames.com/ and sign up
2. Register a new application
3. Copy your API key to `.env`
4. **Note:** Development keys expire after 24 hours — regenerate as needed

## Database Setup

MongoDB indexes are created automatically by Mongoose models on first connection. No manual setup required.

### MongoDB Options

**Docker (recommended):**
```bash
docker run -d -p 27017:27017 --name lolhighlights-mongo mongo:latest
```

**MongoDB Atlas (cloud):**
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lolhighlights?retryWrites=true&w=majority
```

## Running Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npx jest --coverage # With coverage report
```

## Development

```bash
npm run dev    # Start with nodemon auto-reload
npm run lint   # Check code style
npm run lint:fix # Fix linting issues
```

## Deployment

### PM2 (recommended)

```bash
npm install -g pm2
pm2 start src/server.js --name lolhighlights
pm2 logs lolhighlights
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

```bash
docker build -t lolhighlights .
docker run -d -p 3000:3000 --link lolhighlights-mongo:mongodb \
  -e MONGODB_URI=mongodb://mongodb:27017/lolhighlights \
  -e RIOT_API_KEY=your-api-key \
  lolhighlights
```

### systemd

Create `/etc/systemd/system/lolhighlights.service`:
```ini
[Unit]
Description=LOL Highlights API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/lolHighlights
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=MONGODB_URI=mongodb://localhost:27017/lolhighlights
Environment=RIOT_API_KEY=your-api-key
ExecStart=/usr/bin/node /path/to/lolHighlights/src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

- **MongoDB Connection Failed:** Ensure MongoDB is running and `MONGODB_URI` is correct
- **Riot API Key Error:** Verify key in `.env`, check if development key expired (regenerate at developer.riotgames.com)
- **Port in use:** Change `PORT` in `.env` or kill the process: `kill $(lsof -ti:3000)`
- **Module not found:** Run `npm install`

## License

MIT License - see LICENSE file for details.
