import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fs = require('fs-extra');
const codeIgniterInstaller = require('../../../../../src/main/services/project/installation/codeigniter');

describe('project/installation/codeigniter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a CodeIgniter 4 app and configures its environment', async () => {
    let envExists = false;
    const writeFile = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);
    vi.spyOn(fs, 'pathExists').mockImplementation(async (targetPath) => {
      const normalizedPath = String(targetPath);
      if (normalizedPath.endsWith(`${require('path').sep}.env`)) return envExists;
      if (normalizedPath.endsWith(`${require('path').sep}env`)) return true;
      return false;
    });
    vi.spyOn(fs, 'copy').mockImplementation(async () => {
      envExists = true;
    });
    vi.spyOn(fs, 'readFile').mockResolvedValue([
      '# CI_ENVIRONMENT = production',
      '# app.baseURL = \'http://localhost:\'',
      '# database.default.hostname = localhost',
      '# database.default.database = ci4',
      '# database.default.username = root',
      '# database.default.password =',
      '# database.default.DBDriver = MySQLi',
      '# database.default.port = 3306',
    ].join('\n'));

    const context = {
      managers: {
        binaryDownload: {
          runComposer: vi.fn().mockResolvedValue(undefined),
        },
        log: {
          systemError: vi.fn(),
        },
      },
      configStore: {
        get: vi.fn((key, fallback) => key === 'settings' ? {
          defaultTld: 'test',
          redisPort: 16379,
          mailpitSmtpPort: 11025,
        } : fallback),
      },
      getProjectDatabaseConfig: vi.fn(() => ({
        host: '127.0.0.1',
        database: 'ci_app',
        user: 'root',
        password: '',
        port: 13306,
      })),
    };

    const result = await codeIgniterInstaller.installCodeIgniter.call(context, {
      path: 'C:/Projects/ci-app',
      name: 'CI App',
      domain: 'ci-app.test',
      phpVersion: '8.4',
    });

    expect(result).toEqual({ success: true });
    expect(context.managers.binaryDownload.runComposer).toHaveBeenCalledWith(
      'C:/Projects',
      expect.stringContaining('create-project codeigniter4/appstarter ci-app'),
      '8.4',
      expect.any(Function),
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.env'),
      expect.stringContaining("app.baseURL = 'http://ci-app.test/'"),
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.env'),
      expect.stringContaining("database.default.port = 13306"),
    );
  });
});
