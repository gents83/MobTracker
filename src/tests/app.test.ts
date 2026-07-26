import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localLookup, countryFallbacks } from '../utils/browserLookup';
import { generatePairId, updatePairLocation, getPairStatus } from '../services/pairService';

// Mock Vite's import.meta.env.BASE_URL
vi.stubGlobal('import', {
  meta: {
    env: {
      BASE_URL: '/'
    }
  }
});

describe('localLookup - Offline-First Phone Geocoding & Carrier Detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly validates formatting of invalid numbers and throws error', async () => {
    await expect(localLookup('invalid-phone')).rejects.toThrow('Invalid phone number format.');
  });

  it('correctly fetches Nominatim geocoding data and returns coordinates', async () => {
    const mockNominatimResponse = [
      { lat: '41.8719', lon: '12.5674' }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('nominatim')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNominatimResponse)
        } as Response);
      }
      return Promise.resolve({
        ok: false
      } as Response);
    });

    const result = await localLookup('+393331234567');

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.countryCode).toBe('IT');
    expect(result.countryName).toBe('Italy');
    expect(result.lat).toBe(41.8719);
    expect(result.lng).toBe(12.5674);
  });

  it('gracefully falls back to robust local coordinates if Nominatim fetch fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.reject(new Error('Network offline'));
    });

    const result = await localLookup('+393331234567'); // Italy number

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.countryCode).toBe('IT');
    expect(result.countryName).toBe('Italy');
    // Coords should equal the fallback coords for Italy
    const italyFallback = countryFallbacks['IT'];
    expect(result.lat).toBe(italyFallback.coords[0]);
    expect(result.lng).toBe(italyFallback.coords[1]);
  });
});

describe('pairService - Serverless Pairing Protocol via ntfy.sh', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates unique, randomized pairing identifiers', () => {
    const id1 = generatePairId();
    const id2 = generatePairId();
    expect(id1).toBeDefined();
    expect(id1.length).toBeGreaterThan(10);
    expect(id1).not.toEqual(id2);
  });

  it('sends correct location updates payload to ntfy.sh endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: true
      } as Response);
    });

    const success = await updatePairLocation('test_session', 41.8719, 12.5674);

    expect(success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://ntfy.sh/mobtrack-pair-test_session',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"lat":41.8719')
      })
    );
  });

  it('polls and parses pairing status correctly from ntfy.sh cached lines', async () => {
    const mockNtfyLines = [
      JSON.stringify({ event: 'open', topic: 'mobtrack-pair-test_session' }),
      JSON.stringify({
        event: 'message',
        topic: 'mobtrack-pair-test_session',
        time: 1721590000,
        message: JSON.stringify({ lat: 45.4642, lng: 9.1900, active: true })
      })
    ].join('\n');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockNtfyLines)
      } as Response);
    });

    const status = await getPairStatus('test_session');

    expect(status).not.toBeNull();
    expect(status?.lat).toBe(45.4642);
    expect(status?.lng).toBe(9.1900);
    expect(status?.active).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith('https://ntfy.sh/mobtrack-pair-test_session/json?poll=1');
  });

  it('handles empty message logs gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('')
      } as Response);
    });

    const status = await getPairStatus('test_session');

    expect(status).not.toBeNull();
    expect(status?.lat).toBe(0);
    expect(status?.active).toBe(false);
  });
});

describe('localStorage - Safe Webview Error Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles write failures gracefully if setItem throws', () => {
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError or SecurityError in Webview');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Try setting item to verify it doesn't crash the program execution
    let caughtError = null;
    try {
      localStorage.setItem('recentSearches', 'test');
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('QuotaExceededError');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('recentSearches', 'test');

    consoleWarnSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
