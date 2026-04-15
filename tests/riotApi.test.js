/**
 * Riot API Client Unit Tests (no network calls)
 */
const { RiotApiClient } = require('../src/services/riotApi');

describe('RiotApiClient', () => {
  describe('constructor', () => {
    it('should throw without API key', () => {
      const origKey = process.env.RIOT_API_KEY;
      delete process.env.RIOT_API_KEY;
      expect(() => new RiotApiClient()).toThrow('RIOT_API_KEY is required');
      process.env.RIOT_API_KEY = origKey;
    });

    it('should accept API key from options', () => {
      const client = new RiotApiClient({ apiKey: 'test-key', region: 'na1' });
      expect(client.apiKey).toBe('test-key');
      expect(client.defaultRegion).toBe('na1');
    });
  });

  describe('region handling', () => {
    let client;
    beforeEach(() => {
      client = new RiotApiClient({ apiKey: 'test-key' });
    });

    it('should resolve known regions', () => {
      const euw = client._getHost('euw1');
      expect(euw.platform).toBe('EUW1');
      expect(euw.host).toBe('europe.api.riotgames.com');
    });

    it('should resolve NA region', () => {
      const na = client._getHost('na1');
      expect(na.platform).toBe('NA1');
      expect(na.host).toBe('americas.api.riotgames.com');
    });

    it('should throw for unknown region', () => {
      expect(() => client._getHost('unknown')).toThrow('Unknown region');
    });

    it('should handle all 11 regions', () => {
      const regions = ['br1', 'eun1', 'euw1', 'jp1', 'kr', 'la1', 'la2', 'na1', 'oc1', 'tr1', 'ru'];
      regions.forEach(r => {
        const host = client._getHost(r);
        expect(host).toBeDefined();
        expect(host.platform).toBeDefined();
        expect(host.host).toBeDefined();
      });
    });
  });
});

describe('REGIONS constant', () => {
  const { REGIONS } = require('../src/services/riotApi');

  it('should have all 11 Riot regions', () => {
    expect(Object.keys(REGIONS).length).toBe(11);
  });

  it('should have required fields for each region', () => {
    Object.values(REGIONS).forEach(region => {
      expect(region).toHaveProperty('platform');
      expect(region).toHaveProperty('host');
    });
  });
});
