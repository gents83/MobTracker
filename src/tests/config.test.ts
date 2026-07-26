import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Vite Config Base Path Resolving', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('GITHUB_PAGES', '');
    vi.stubEnv('VITE_BASE_PATH', '');
    vi.stubEnv('GITHUB_REPOSITORY', '');
  });

  it('resolves base path to "/" when running in serve mode', async () => {
    const configModule = await import('../../vite.config');
    // Call the function returned by defineConfig
    const configFn = configModule.default;
    const config = typeof configFn === 'function' ? configFn({ command: 'serve', mode: 'development' }) : configFn;

    expect(config.base).toBe('/');
  });

  it('resolves base path to "./" when running in build mode and GITHUB_PAGES is not "true" (native app / Capacitor target)', async () => {
    const configModule = await import('../../vite.config');
    const configFn = configModule.default;
    const config = typeof configFn === 'function' ? configFn({ command: 'build', mode: 'production' }) : configFn;

    expect(config.base).toBe('./');
  });

  it('resolves base path to GITHUB_REPOSITORY subpath when GITHUB_PAGES is "true"', async () => {
    vi.stubEnv('GITHUB_PAGES', 'true');
    vi.stubEnv('GITHUB_REPOSITORY', 'gents83/MobTracker');

    const configModule = await import('../../vite.config');
    const configFn = configModule.default;
    const config = typeof configFn === 'function' ? configFn({ command: 'build', mode: 'production' }) : configFn;

    expect(config.base).toBe('/MobTracker/');
  });

  it('resolves base path to VITE_BASE_PATH when GITHUB_PAGES is "true" and VITE_BASE_PATH is defined', async () => {
    vi.stubEnv('GITHUB_PAGES', 'true');
    vi.stubEnv('VITE_BASE_PATH', 'custom-path');

    const configModule = await import('../../vite.config');
    const configFn = configModule.default;
    const config = typeof configFn === 'function' ? configFn({ command: 'build', mode: 'production' }) : configFn;

    expect(config.base).toBe('/custom-path/');
  });
});
