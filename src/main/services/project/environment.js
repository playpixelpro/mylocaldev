const path = require('path');
const fs = require('fs-extra');
const { parseEnvContent, buildEnvOverrides } = require('../../../shared/projectEnv');

module.exports = {
  async initialize() {
    if (!this.configStore.get('projects')) {
      this.configStore.set('projects', []);
    }

    await this.compatibilityManager.initialize();
    await this.cleanupOrphanedConfigs();
  },

  async cleanupOrphanedConfigs() {
    const dataPath = this.getDataPath();
    const projects = this.configStore.get('projects', []);
    const validIds = new Set(projects.map((project) => project.id));

    const dirs = [
      path.join(dataPath, 'apache', 'vhosts'),
      path.join(dataPath, 'nginx', 'sites'),
    ];

    const nginxDataDir = path.join(dataPath, 'nginx');
    try {
      if (await fs.pathExists(nginxDataDir)) {
        const entries = await fs.readdir(nginxDataDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const sitesDir = path.join(nginxDataDir, entry.name, 'sites');
            if (await fs.pathExists(sitesDir)) {
              dirs.push(sitesDir);
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors reading nginx data directory
    }

    for (const dir of dirs) {
      if (!await fs.pathExists(dir)) {
        continue;
      }

      const files = await fs.readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.conf')) {
          continue;
        }

        const projectId = file.replace('.conf', '');
        if (!validIds.has(projectId)) {
          await fs.remove(path.join(dir, file));
        }
      }
    }
  },

  async ensureCliInstalled() {
    const cli = this.managers.cli;
    if (!cli) {
      this.managers.log?.systemWarn('CLI manager not available');
      return;
    }

    try {
      const status = await cli.checkCliInstalled();

      if (!status.installed) {
        await cli.installCli();
      }

      if (!status.inPath && process.platform === 'win32' && process.env.PLAYWRIGHT_TEST !== 'true') {
        try {
          await cli.addToPath();
        } catch (error) {
          // Silently ignore PATH errors
        }
      }

      await this.syncCliProjectsFile();
    } catch (error) {
      this.managers.log?.systemWarn('Could not ensure CLI installed', { error: error.message });
    }
  },

  async syncCliProjectsFile() {
    const cli = this.managers.cli;
    if (!cli) {
      this.managers.log?.systemWarn('CLI Manager not initialized, skipping CLI sync');
      return;
    }

    try {
      const syncedPath = await cli.syncProjectsFile();
      this.managers.log?.systemInfo(`CLI projects file synced: ${syncedPath}`);

      if (cli.getDirectShimsEnabled()) {
        const status = await cli.checkCliInstalled();
        if (!status.installed || !status.inPath) {
          await cli.installCli();
          await cli.installDirectShims();
          if (process.env.PLAYWRIGHT_TEST !== 'true') {
            await cli.addToPath();
          }
          this.managers.log?.systemInfo('Terminal commands auto-initialized');
        }
      }
    } catch (error) {
      this.managers.log?.systemError('Failed to sync CLI projects file', { error: error.message, stack: error.stack });
    }
  },

  async syncEnvFile(project) {
    if (!project.path || !project.environment) {
      return;
    }

    const envPath = path.join(project.path, '.env');

    if (!await fs.pathExists(envPath)) {
      return;
    }

    let envContent = await fs.readFile(envPath, 'utf-8');

    for (const [key, value] of Object.entries(project.environment)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent = envContent.trim() + '\n' + newLine + '\n';
      }
    }

    await fs.writeFile(envPath, envContent);
  },

  /**
   * Read and parse a `.env` file from an absolute path.
   * Returns an empty object when the file is missing or unreadable.
   *
   * @param {string} envPath
   * @returns {Promise<Record<string, string>>}
   */
  async readEnvFileFromPath(envPath) {
    if (!envPath) {
      return {};
    }

    try {
      if (!await fs.pathExists(envPath)) {
        return {};
      }

      const envContent = await fs.readFile(envPath, 'utf-8');
      return parseEnvContent(envContent);
    } catch (error) {
      this.managers?.log?.systemWarn('Could not read .env file', { path: envPath, error: error.message });
      return {};
    }
  },

  async readEnvFile(projectId) {
    const project = this.getProject(projectId);
    if (!project || !project.path) {
      throw new Error('Project not found');
    }

    return this.readEnvFileFromPath(path.join(project.path, '.env'));
  },

  /**
   * Environment variables that should actually be injected into a project's child
   * processes (PHP-CGI, terminal sessions, supervisor workers).
   *
   * Empty values are dropped and values already present in the project's `.env` are
   * skipped, so only genuine MyLocalDev overrides reach the process environment.
   *
   * @param {object} project
   * @returns {Promise<Record<string, string>>}
   */
  async getEnvOverrides(project) {
    if (!project) {
      return {};
    }

    const fileEnvironment = project.path
      ? await this.readEnvFileFromPath(path.join(project.path, '.env'))
      : {};

    return buildEnvOverrides(project.environment, fileEnvironment);
  },

  getDefaultEnvironment(projectType, projectName, port, projectConfig = {}) {
    const mode = projectConfig.deploymentMode || 'local';
    const isProd = mode === 'production';

    const baseEnv = {
      APP_ENV: isProd ? 'production' : 'local',
      APP_DEBUG: isProd ? 'false' : 'true',
    };

    if (isProd) {
      baseEnv.LOG_LEVEL = 'error';
    }

    switch (projectType) {
      case 'laravel': {
        const dbConfig = this.getProjectDatabaseConfig({
          name: projectName,
          ...projectConfig,
        });

        const laravelEnv = {
          ...baseEnv,
          APP_NAME: projectName,
          APP_KEY: '',
          APP_URL: `http://localhost:${port}`,
          DB_CONNECTION: dbConfig.laravelConnection,
          DB_HOST: dbConfig.host,
          DB_PORT: String(dbConfig.port),
          DB_DATABASE: dbConfig.database,
          DB_USERNAME: dbConfig.user,
          DB_PASSWORD: dbConfig.password,
          CACHE_DRIVER: 'redis',
          QUEUE_CONNECTION: 'redis',
          SESSION_DRIVER: 'redis',
          REDIS_HOST: '127.0.0.1',
          REDIS_PORT: '6379',
          MAIL_MAILER: 'smtp',
          MAIL_HOST: '127.0.0.1',
          MAIL_PORT: '1025',
        };

        if (isProd) {
          laravelEnv.LOG_CHANNEL = 'daily';
          laravelEnv.LOG_LEVEL = 'error';
          laravelEnv.SESSION_SECURE_COOKIE = 'true';
        }

        return laravelEnv;
      }

      case 'symfony': {
        const dbConfig = this.getProjectDatabaseConfig({
          name: projectName,
          ...projectConfig,
        });

        const symfonyEnv = {
          ...baseEnv,
          DATABASE_URL: dbConfig.symfonyDatabaseUrl,
          MAILER_DSN: 'smtp://127.0.0.1:1025',
        };

        if (isProd) {
          symfonyEnv.APP_ENV = 'prod';
          symfonyEnv.APP_DEBUG = '0';
        }

        return symfonyEnv;
      }

      case 'wordpress':
        return {
          ...baseEnv,
          WP_DEBUG: isProd ? 'false' : 'true',
          WP_DEBUG_DISPLAY: isProd ? 'false' : 'true',
          WP_DEBUG_LOG: isProd ? 'true' : 'false',
        };

      default:
        return baseEnv;
    }
  },
};

