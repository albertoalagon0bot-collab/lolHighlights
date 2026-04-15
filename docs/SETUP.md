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

# Start the server
npm start

# Or in development mode with auto-reload
npm run dev
```

The server starts at `http://localhost:3000`.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/lolhighlights` |
| `PORT` | Server port | `3000` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `MONGODB_TEST_URI` | Test DB URI | `mongodb://localhost:27017/lolhighlights_test` |
| `RIOT_API_KEY` | Riot Games API key | - |
| `RIOT_API_REGION` | Default Riot region | `euw1` |
| `DB_POOL_SIZE` | Max DB connections | `10` |
| `DB_MIN_POOL_SIZE` | Min DB connections | `2` |
| `JWT_SECRET` | JWT secret for auth | - |
| `HIGHLIGHT_THRESHOLD` | Min highlight score (0-1) | `0.75` |

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npx jest --coverage
```

## Database Setup

The application automatically:
1. Connects to MongoDB with connection pooling
2. Creates required indexes via the migration system
3. Tracks migrations in a `migrations` collection

No manual database initialization is needed.

### Production Database

For production, ensure MongoDB uses authentication and TLS:

```
MONGODB_URI=mongodb://user:password@mongo.example.com:27017/lolhighlights?authSource=admin&tls=true
```

## Deployment

### Docker (Recommended)

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
docker run -d -p 3000:3000 --env-file .env lolhighlights
```

### PM2

```bash
npm install -g pm2
pm2 start src/server.js --name lolhighlights
pm2 save
pm2 startup
```

### systemd

Create `/etc/systemd/system/lolhighlights.service`:

```ini
[Unit]
Description=LoL Highlights API
After=network.target mongodb.service

[Service]
Type=simple
User=node
WorkingDirectory=/opt/lolhighlights
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable lolhighlights
sudo systemctl start lolhighlights
```

## Getting a Riot API Key

1. Go to [Riot Developer Portal](https://developer.riotgames.com/)
2. Sign in or create an account
3. Register your application to get an API key
4. Add the key to your `.env` as `RIOT_API_KEY`

**Rate Limits:** The client automatically handles Riot API rate limits with retry logic.
