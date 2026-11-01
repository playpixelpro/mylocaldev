import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const path = require('path');
const fs = require('fs-extra');
const cliInstall = require('../../../../src/main/services/cli/install');

const originalPlatform = process.platform;

function setPlatform(value) {
  Object.defineProperty(process, 'platform', {
    value,
    configurable: true,
  });
}

function makeContext(overrides = {}) {
  return {
    ...cliInstall,
    resourcesPath: 'C:/MyLocalDev/resources',
    getAlias: vi.fn(() => 'mylocaldev'),
    getCliPath: vi.fn(() => 'C:/MyLocalDev/cli'),
    syncProjectsFile: vi.fn(async () => 'C:/MyLocalDev/cli/projects.json'),
    getInstallInstructions: vi.fn((cliPath) => ({ automatic: cliPath })),
    getProjectsFilePath: vi.fn(() => 'C:/MyLocalDev/cli/projects.json'),
    installWindowsCli: cliInstall.installWindowsCli,
    installUnixCli: cliInstall.installUnixCli,
    ...overrides,
  };
}

describe('cli/install', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setPlatform('win32');
  });

  afterEach(() => {
    setPlatform(originalPlatform);
  });

  it('installs the CLI wrapper by syncing projects and dispatching to the platform-specific installer', async () => {
    const ctx = makeContext({
      installWindowsCli: vi.fn(async () => 'C:/MyLocalDev/cli/mylocaldev.cmd'),
    });
    vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);

    const result = await ctx.installCli();

    expect(fs.ensureDir).toHaveBeenCalledWith('C:/MyLocalDev/cli');
    expect(ctx.syncProjectsFile).toHaveBeenCalled();
    expect(ctx.installWindowsCli).toHaveBeenCalledWith('mylocaldev', 'C:/MyLocalDev/cli');
    expect(result).toEqual({
      alias: 'mylocaldev',
      path: 'C:/MyLocalDev/cli',
      instructions: { automatic: 'C:/MyLocalDev/cli' },
    });
  });

  it('writes the Windows helper and wrapper scripts with project lookup support', async () => {
    const ctx = makeContext();
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    const result = await ctx.installWindowsCli('mylocaldev', 'C:/MyLocalDev/cli');

    expect(result).toBe(path.join('C:/MyLocalDev/cli', 'mylocaldev.cmd'));
    expect(writeFileSpy).toHaveBeenNthCalledWith(
      1,
      path.join('C:/MyLocalDev/cli', 'find-project.ps1'),
      expect.stringContaining('Write-Output "FOUND|$php|$node|$mt|$mv|$py"'),
      'utf8'
    );
    expect(writeFileSpy).toHaveBeenNthCalledWith(
      2,
      path.join('C:/MyLocalDev/cli', 'mylocaldev.cmd'),
      expect.stringContaining('Usage: mylocaldev ^<command^> [arguments]'),
      'utf8'
    );
  });

  it('writes the Unix wrapper script and marks it executable', async () => {
    setPlatform('linux');
    const ctx = makeContext({
      resourcesPath: '/opt/MyLocalDev/resources',
      getProjectsFilePath: vi.fn(() => '/opt/MyLocalDev/cli/projects.json'),
    });
    const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const chmodSpy = vi.spyOn(fs, 'chmod').mockResolvedValue(undefined);

    const result = await ctx.installUnixCli('mylocaldev', '/opt/MyLocalDev/cli');

    expect(result).toBe(path.join('/opt/MyLocalDev/cli', 'mylocaldev'));
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join('/opt/MyLocalDev/cli', 'mylocaldev'),
      expect.stringContaining('MYLOCALDEV_RESOURCES="/opt/MyLocalDev/resources"'),
      'utf8'
    );
    expect(writeFileSpy).toHaveBeenCalledWith(
      path.join('/opt/MyLocalDev/cli', 'mylocaldev'),
      expect.stringContaining('Usage: mylocaldev <command> [arguments]'),
      'utf8'
    );
    expect(chmodSpy).toHaveBeenCalledWith(path.join('/opt/MyLocalDev/cli', 'mylocaldev'), '755');
  });
});