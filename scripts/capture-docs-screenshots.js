/**
 * Capture the documentation screenshots used by the GitHub Pages site.
 *
 * Launches the real Electron app against a throwaway profile seeded with demo
 * projects, then saves PNGs into docs/images/shots/.
 *
 * Usage: node scripts/capture-docs-screenshots.js
 * (requires Playwright's Electron support, already a dev dependency)
 */
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { _electron: electron } = require('playwright');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'images', 'shots');

function demoProject(overrides) {
  return {
    id: overrides.id,
    name: overrides.name,
    path: overrides.path,
    type: overrides.type,
    phpVersion: overrides.phpVersion || '8.2',
    webServer: overrides.webServer || 'nginx',
    webServerVersion: overrides.webServerVersion || '1.24',
    port: overrides.port,
    sslPort: overrides.sslPort || 443,
    domain: overrides.domain,
    domains: [overrides.domain],
    ssl: true,
    autoStart: false,
    deploymentMode: 'global',
    services: {
      mysql: true,
      mysqlVersion: '8.0',
      mariadb: false,
      mariadbVersion: '11.4',
      redis: Boolean(overrides.redis),
      redisVersion: '7.4',
      queue: Boolean(overrides.queue),
      nodejs: overrides.type === 'nodejs',
      nodejsVersion: overrides.nodeVersion || '24',
      postgresql: false,
      postgresqlVersion: '17',
      mongodb: false,
      mongodbVersion: '8.0',
      python: false,
      pythonVersion: '3.13',
      memcached: false,
      memcachedVersion: '1.6',
      minio: false,
    },
    environment: {
      APP_NAME: overrides.name,
      APP_ENV: overrides.type === 'nodejs' ? 'local' : 'development',
      APP_DEBUG: 'true',
      APP_URL: `https://${overrides.domain}`,
      DB_HOST: '127.0.0.1',
      DB_PORT: '3306',
      DB_DATABASE: overrides.databaseName || 'app',
      DB_USERNAME: 'root',
      DB_PASSWORD: '',
    },
    supervisor: { workers: 1, processes: [] },
    createdAt: '2026-10-02T09:15:00.000Z',
    lastStarted: '2026-11-01T08:40:00.000Z',
    compatibilityWarningsAcknowledged: true,
    compatibilityWarnings: [],
    installing: false,
    updatedAt: '2026-11-01T08:40:00.000Z',
  };
}

(async () => {
  const tmpRoot = path.join(os.tmpdir(), `mylocaldev-shots-${Date.now()}`);
  const dataDir = path.join(tmpRoot, '.mylocaldev-test');
  await fs.ensureDir(dataDir);
  await fs.ensureDir(OUT_DIR);

  const projects = [
    demoProject({ id: 'demo-acme', name: 'Acme Commerce', path: 'C:\\Projects\\acme-commerce', type: 'laravel', port: 8000, domain: 'acme.test', databaseName: 'acme_commerce', redis: true, queue: true }),
    demoProject({ id: 'demo-orbit', name: 'Orbit API', path: 'C:\\Projects\\orbit-api', type: 'nodejs', port: 8001, domain: 'orbit.test', nodeVersion: '24' }),
    demoProject({ id: 'demo-starfall', name: 'Starfall CMS', path: 'C:\\Projects\\starfall-cms', type: 'custom', port: 8002, domain: 'starfall.test', databaseName: 'starfall' }),
  ];

  await fs.writeJson(path.join(dataDir, 'mylocaldev-config.json'), {
    dataPath: dataDir,
    settings: {
      theme: 'dark',
      webServer: 'nginx',
      defaultTld: 'test',
      portRangeStart: 8000,
      defaultProjectsPath: path.join(tmpRoot, 'Projects'),
      cliAlias: 'mylocaldev',
      deploymentMode: 'local',
    },
    projects,
    phpVersions: {},
    certificates: [],
    recentProjects: [],
    internal: {},
  }, { spaces: 2 });

  await fs.writeJson(path.join(tmpRoot, 'MyLocalDev-e2e.json'), { dataDir: tmpRoot });

  const app = await electron.launch({
    args: [path.join(__dirname, '..', 'src', 'main', 'main.js'), '--user-data-dir', tmpRoot, '--playwright-e2e', tmpRoot],
    env: { ...process.env, PLAYWRIGHT_TEST: 'true', TEST_USER_DATA_DIR: tmpRoot, NODE_ENV: 'production' },
  });

  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForSelector('#root', { state: 'attached' });
  await page.waitForTimeout(2500);

  const shoot = async (name) => {
    await page.waitForTimeout(900);
    const target = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: target });
    console.log(`captured ${name}.png`);
  };

  const go = async (hash) => {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForTimeout(700);
  };

  await shoot('dashboard');

  await go('#/projects');
  await shoot('projects');

  await go('#/projects/demo-acme');
  await shoot('project-overview');

  await go('#/projects/new');
  await shoot('create-project');

  await go('#/binaries');
  await shoot('binaries-language');
  for (const [tab, file] of [['Web Servers', 'binaries-webservers'], ['Databases', 'binaries-databases']]) {
    try {
      await page.locator('button', { hasText: tab }).first().click();
      await shoot(file);
    } catch (error) {
      console.log(`skipped ${file}: ${error.message}`);
    }
  }

  await go('#/services');
  await shoot('services');

  await go('#/databases');
  await shoot('databases');

  await go('#/settings');
  await shoot('settings');

  await app.close();
  await fs.remove(tmpRoot).catch(() => {});
  console.log('done');
})().catch((error) => {
  console.error('capture failed:', error);
  process.exit(1);
});
