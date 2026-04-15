/**
 * Riot Games API Client
 * Handles API requests with rate limiting, retry logic, and multi-region support.
 */
const axios = require('axios');

const REGIONS = {
  br1: { platform: 'BR1', host: 'americas.api.riotgames.com' },
  eun1: { platform: 'EUN1', host: 'europe.api.riotgames.com' },
  euw1: { platform: 'EUW1', host: 'europe.api.riotgames.com' },
  jp1: { platform: 'JP1', host: 'asia.api.riotgames.com' },
  kr: { platform: 'KR', host: 'asia.api.riotgames.com' },
  la1: { platform: 'LA1', host: 'americas.api.riotgames.com' },
  la2: { platform: 'LA2', host: 'americas.api.riotgames.com' },
  na1: { platform: 'NA1', host: 'americas.api.riotgames.com' },
  oc1: { platform: 'OC1', host: 'sea.api.riotgames.com' },
  tr1: { platform: 'TR1', host: 'europe.api.riotgames.com' },
  ru: { platform: 'RU', host: 'europe.api.riotgames.com' }
};

class RiotApiClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.RIOT_API_KEY;
    this.defaultRegion = options.region || process.env.RIOT_API_REGION || 'euw1';

    if (!this.apiKey) {
      throw new Error('RIOT_API_KEY is required');
    }

    // Rate limit tracking
    this.rateLimits = new Map(); // key -> { limit, remaining, reset }
    this.requestQueue = new Map(); // key -> Promise[]
    this.requestTimes = []; // For app-level rate limiting

    // Create axios instance
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'X-Riot-Token': this.apiKey
      }
    });

    // Response interceptor for rate limit header parsing
    this.client.interceptors.response.use(
      response => this._handleRateLimitHeaders(response),
      error => {
        if (error.response) {
          this._handleRateLimitHeaders(error.response);
          if (error.response.status === 429) {
            return this._handleRateLimitError(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  _getRateLimitKey(host) {
    return host;
  }

  _handleRateLimitHeaders(response) {
    const key = this._getRateLimitKey(response.config.baseURL || '');
    const appLimit = response.headers['x-app-rate-limit-limit'];
    const appCount = response.headers['x-app-rate-limit-count'];
    const methodLimit = response.headers['x-method-rate-limit-limit'];
    const methodCount = response.headers['x-method-rate-limit-count'];

    if (appLimit && appCount) {
      const limits = appLimit.split(':').map(Number);
      const counts = appCount.split(':').map(Number);
      this.rateLimits.set(`app-${limits[1]}`, { limit: limits[0], remaining: limits[0] - counts[0], reset: limits[1] });
    }

    if (methodLimit && methodCount) {
      const limits = methodLimit.split(':').map(Number);
      const counts = methodCount.split(':').map(Number);
      this.rateLimits.set(`method-${key}-${limits[1]}`, { limit: limits[0], remaining: limits[0] - counts[0], reset: limits[1] });
    }

    return response;
  }

  async _handleRateLimitError(error) {
    const retryAfter = error.response.headers['retry-after'];
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
    console.warn(`Rate limited. Retrying after ${waitTime}ms...`);
    await this._sleep(waitTime);
    return this.client.request(error.config);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _getHost(region) {
    const r = REGIONS[region.toLowerCase()];
    if (!r) throw new Error(`Unknown region: ${region}`);
    return r;
  }

  /**
   * Summoner API
   */
  async getSummonerByName(name, region) {
    region = region || this.defaultRegion;
    const { platform } = this._getHost(region);
    const res = await this.client.get(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`);
    return res.data;
  }

  async getSummonerByPuuid(puuid, region) {
    region = region || this.defaultRegion;
    const { platform } = this._getHost(region);
    const res = await this.client.get(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    return res.data;
  }

  async getSummonerByAccountId(accountId, region) {
    region = region || this.defaultRegion;
    const { platform } = this._getHost(region);
    const res = await this.client.get(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-account/${accountId}`);
    return res.data;
  }

  /**
   * Match API (uses regional routing)
   */
  async getMatchHistory(puuid, region, options = {}) {
    region = region || this.defaultRegion;
    const { host } = this._getHost(region);
    const params = [];
    if (options.start) params.push(`start=${options.start}`);
    if (options.count) params.push(`count=${options.count}`);
    if (options.queue) params.push(`queue=${options.queue}`);
    if (options.type) params.push(`type=${options.type}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    const res = await this.client.get(`https://${host}/lol/match/v5/matches/by-puuid/${puuid}/ids${qs}`);
    return res.data;
  }

  async getMatch(matchId, region) {
    region = region || this.defaultRegion;
    const { host } = this._getHost(region);
    const res = await this.client.get(`https://${host}/lol/match/v5/matches/${matchId}`);
    return res.data;
  }

  async getMatchTimeline(matchId, region) {
    region = region || this.defaultRegion;
    const { host } = this._getHost(region);
    const res = await this.client.get(`https://${host}/lol/match/v5/matches/${matchId}/timeline`);
    return res.data;
  }

  /**
   * Champion API (DDragon - no rate limit)
   */
  async getChampionList(version = 'latest') {
    if (version === 'latest') {
      const versions = await this._getDDragonVersions();
      version = versions[0];
    }
    const res = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    return Object.values(res.data.data);
  }

  async getChampionByName(name, version = 'latest') {
    if (version === 'latest') {
      const versions = await this._getDDragonVersions();
      version = versions[0];
    }
    const res = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champions/${name}.json`);
    return res.data.data[name];
  }

  async _getDDragonVersions() {
    const res = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
    return res.data;
  }

  /**
   * Status API
   */
  async getStatus(region) {
    region = region || this.defaultRegion;
    const { platform } = this._getHost(region);
    const res = await this.client.get(`https://${platform}.api.riotgames.com/lol/status/v4/platform-data`);
    return res.data;
  }

  /**
   * Fetch full match data with player info (convenience method)
   */
  async getSummonerMatchHistory(summonerName, region, options = {}) {
    const summoner = await this.getSummonerByName(summonerName, region);
    const matchIds = await this.getMatchHistory(summoner.puuid, region, options);

    const matches = [];
    // Fetch matches sequentially to respect rate limits
    for (const matchId of matchIds) {
      try {
        const match = await this.getMatch(matchId, region);
        matches.push(match);
      } catch (err) {
        console.warn(`Failed to fetch match ${matchId}: ${err.message}`);
      }
    }

    return { summoner, matches };
  }

  /**
   * Check if API key is valid
   */
  async validateKey() {
    try {
      await this.getStatus(this.defaultRegion);
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}

// Singleton instance
let instance = null;

function createClient(options = {}) {
  instance = new RiotApiClient(options);
  return instance;
}

function getClient() {
  if (!instance) {
    instance = new RiotApiClient();
  }
  return instance;
}

module.exports = { RiotApiClient, createClient, getClient, REGIONS };
