const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const os = require('os');

const PATH_MARKER = '# MyLocalDev PATH';
const LEGACY_PATH_MARKER = '# MyLocalDev CLI';

function normalizePathValue(targetPath) {
  return String(targetPath || '').replace(/[\\/]+$/, '');
}

function normalizeForComparison(targetPath) {
  return normalizePathValue(path.normalize(targetPath)).toLowerCase();
}

function uniquePaths(entries = []) {
  const result = [];
  const seen = new Set();

  for (const entry of entries) {
    const normalized = normalizePathValue(entry);
    if (!normalized) continue;

    const key = normalizeForComparison(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function powerShellArray(entries) {
  const values = uniquePaths(entries);
  return values.length > 0 ? `@(${values.map(quotePowerShell).join(', ')})` : '@()';
}

function broadcastEnvironmentChangeScript() {
  return `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class MyLocalDevEnvironmentBroadcast {
  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd, uint Msg, IntPtr wParam, string lParam,
    uint fuFlags, uint uTimeout, out IntPtr lpdwResult);
}
'@
$broadcastResult = [IntPtr]::Zero
[MyLocalDevEnvironmentBroadcast]::SendMessageTimeout(
  [IntPtr]0xffff, 0x001A, [IntPtr]::Zero, 'Environment', 0x0002, 5000,
  [ref]$broadcastResult) | Out-Null
`;
}

function buildPathUpdateScript(entries, oldEntries, scope, resultFile = null) {
  const targetScope = scope === 'Machine' ? 'Machine' : 'User';
  const resultWriter = resultFile
    ? `'UPDATED' | Out-File -FilePath ${quotePowerShell(resultFile)} -Encoding utf8 -NoNewline`
    : "Write-Output 'UPDATED'";
  const failureWriter = resultFile
    ? `'FAILED' | Out-File -FilePath ${quotePowerShell(resultFile)} -Encoding utf8 -NoNewline`
    : 'Write-Error $_';

  return `
$managedEntries = ${powerShellArray(entries)}
$oldManagedEntries = ${powerShellArray(oldEntries)}
$currentPath = [Environment]::GetEnvironmentVariable('Path', '${targetScope}')
if ([string]::IsNullOrWhiteSpace($currentPath)) {
  $currentEntries = @()
} else {
  $currentEntries = @($currentPath.Split(';') | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

$entriesToRemove = @($oldManagedEntries + $managedEntries)
$remainingEntries = @($currentEntries | Where-Object {
  $currentEntry = $_.Trim().TrimEnd('\\', '/')
  -not ($entriesToRemove | Where-Object { $_.Trim().TrimEnd('\\', '/') -ieq $currentEntry })
})
$newEntries = @($managedEntries + $remainingEntries)
$newPath = $newEntries -join ';'

try {
  [Environment]::SetEnvironmentVariable('Path', $newPath, '${targetScope}')
  ${broadcastEnvironmentChangeScript()}
  ${resultWriter}
} catch {
  ${failureWriter}
  exit 1
}
`;
}

module.exports = {
  getInstallInstructions(cliPath) {
    if (process.platform === 'win32') {
      return {
        automatic: `Add MyLocalDev's managed runtime paths to the User/System PATH.\nThe selected PHP, Node.js, Python, database, and tool directories are updated automatically.`,
        manual: [
          '1. Open System Properties (Win + Pause/Break)',
          '2. Click "Advanced system settings"',
          '3. Click "Environment Variables"',
          '4. Under "User variables", select "Path"',
          '5. Add the MyLocalDev runtime directories and the CLI directory:',
          `   ${cliPath}`,
          '6. Open a new terminal/editor after changing PATH',
        ],
        powershell: `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";${cliPath}", "User")`,
      };
    }

    const shell = process.env.SHELL || '/bin/bash';
    const rcFile = shell.includes('zsh') ? '~/.zshrc' : '~/.bashrc';

    return {
      automatic: `Add MyLocalDev's managed runtime paths to ${rcFile}.`,
      manual: [
        `1. Open ${rcFile} in a text editor`,
        `2. Add the MyLocalDev runtime directories before $PATH`,
        '3. Save and close the file',
        `4. Run: source ${rcFile}`,
      ],
      command: `echo 'export PATH="${cliPath}:$PATH"  ${PATH_MARKER}' >> ${rcFile} && source ${rcFile}`,
    };
  },

  getConfiguredManagedPathEntries() {
    const configured = this.configStore?.get?.('settings.managedPathEntries', []);
    return Array.isArray(configured) ? configured : [];
  },

  getPathEntriesForUpdate() {
    const currentEntries = typeof this.getManagedPathEntries === 'function'
      ? this.getManagedPathEntries()
      : [];
    const cliPath = typeof this.getCliPath === 'function' ? this.getCliPath() : null;
    return uniquePaths([...currentEntries, cliPath]);
  },

  getPreviousPathEntries() {
    const cliPath = typeof this.getCliPath === 'function' ? this.getCliPath() : null;
    return uniquePaths([...this.getConfiguredManagedPathEntries(), cliPath]);
  },

  async checkCliInstalled() {
    const alias = this.getAlias();
    const cliPath = this.getCliPath();
    const scriptName = process.platform === 'win32' ? `${alias}.cmd` : alias;
    const scriptPath = path.join(cliPath, scriptName);
    const scriptExists = await fs.pathExists(scriptPath);
    let inPath = false;

    try {
      if (process.platform === 'win32') {
        inPath = await this.isInWindowsUserPath(cliPath);
      } else {
        const pathDirs = (process.env.PATH || '').split(path.delimiter);
        inPath = pathDirs.some((dir) => normalizeForComparison(dir) === normalizeForComparison(cliPath));
      }
    } catch (error) {
      this.managers?.log?.systemError('Error checking PATH', { error: error.message });
    }

    return { alias, installed: scriptExists, inPath, scriptPath, cliPath };
  },

  async isInWindowsUserPath(targetPath) {
    return new Promise((resolve) => {
      const psScript = `
$targetPath = ${quotePowerShell(normalizePathValue(targetPath))}
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$systemPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$fullPath = "$systemPath;$userPath"
$found = $fullPath.Split(';') | Where-Object {
  $_.Trim().TrimEnd('\\', '/') -ieq $targetPath
}
if ($found) { 'FOUND' } else { 'NOTFOUND' }
`;

      const child = spawn('powershell', ['-NoProfile', '-Command', psScript], { windowsHide: true });
      const timeout = setTimeout(() => {
        child.kill();
        resolve(false);
      }, 5000);
      let stdout = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve(code === 0 && stdout.trim() === 'FOUND');
      });
    });
  },

  async addToPath() {
    const entries = this.getPathEntriesForUpdate();
    const previousEntries = this.getPreviousPathEntries();

    if (process.platform === 'win32') {
      const systemPath = await this.tryAddToSystemPath(entries, previousEntries);
      const userPath = await this.addToUserPath(entries, previousEntries);
      const success = Boolean(systemPath.success || userPath.success);

      if (success) this.configStore?.set?.('settings.managedPathEntries', entries);

      return {
        success,
        systemPath,
        userPath,
        message: systemPath.success
          ? 'Added selected binaries to System PATH'
          : userPath.success
            ? 'Added selected binaries to User PATH'
            : 'Could not update Windows PATH',
        entries,
        note: 'Open a new terminal/editor for PATH changes to take effect.',
      };
    }

    const result = await this.addToUnixPath(entries);
    if (result.success) this.configStore?.set?.('settings.managedPathEntries', entries);
    return { ...result, entries };
  },

  async addToUnixPath(pathEntries) {
    const entries = Array.isArray(pathEntries) ? uniquePaths(pathEntries) : uniquePaths([pathEntries]);
    const homeDir = os.homedir();
    const shell = process.env.SHELL || '/bin/bash';
    const rcFile = shell.includes('zsh') ? '.zshrc' : '.bashrc';
    const rcPath = path.join(homeDir, rcFile);
    const exportLine = `export PATH="${entries.join(':')}:$PATH"  ${PATH_MARKER}`;

    try {
      let content = '';
      if (await fs.pathExists(rcPath)) content = await fs.readFile(rcPath, 'utf8');
      const nextContent = content
        .split('\n')
        .filter((line) => !line.includes(PATH_MARKER) && !line.includes(LEGACY_PATH_MARKER))
        .join('\n');
      await fs.writeFile(rcPath, `${exportLine}\n${nextContent}`, 'utf8');

      return {
        success: true,
        message: `Added selected binaries to ${rcFile}`,
        rcFile: rcPath,
        note: `Please restart your terminal or run: source ~/${rcFile}`,
      };
    } catch (error) {
      return { success: false, message: `Failed to modify ${rcFile}: ${error.message}`, rcFile: rcPath };
    }
  },

  async tryAddToSystemPath(entries, oldEntries = []) {
    const targetEntries = Array.isArray(entries) ? entries : [entries];
    return this.tryUpdateWindowsPath(targetEntries, oldEntries, 'Machine');
  },

  async addToUserPath(entries, oldEntries = []) {
    const targetEntries = Array.isArray(entries) ? entries : [entries];
    return this.tryUpdateWindowsPath(targetEntries, oldEntries, 'User');
  },

  async tryUpdateWindowsPath(entries, oldEntries, scope) {
    const targetEntries = uniquePaths(entries);
    const previousEntries = uniquePaths(oldEntries);

    if (scope === 'User') {
      return new Promise((resolve) => {
        const psScript = buildPathUpdateScript(targetEntries, previousEntries, 'User');
        const child = spawn('powershell', ['-NoProfile', '-Command', psScript], { windowsHide: true });
        let stderr = '';
        child.stderr.on('data', (data) => { stderr += data.toString(); });
        child.on('error', (error) => resolve({ success: false, reason: 'spawn_error', error: error.message }));
        child.on('close', (code) => resolve(code === 0
          ? { success: true, message: 'Updated User PATH', entries: targetEntries }
          : { success: false, reason: 'failed', error: stderr.trim() }));
      });
    }

    const tempScriptFile = path.join(os.tmpdir(), 'mylocaldev_update_machine_path.ps1');
    const tempResultFile = path.join(os.tmpdir(), 'mylocaldev_path_result.txt');
    const psScript = buildPathUpdateScript(targetEntries, previousEntries, 'Machine', tempResultFile);

    try {
      await fs.writeFile(tempScriptFile, psScript, 'utf8');
      if (await fs.pathExists(tempResultFile)) await fs.remove(tempResultFile);

      return await new Promise((resolve) => {
        const scriptArgument = tempScriptFile.replace(/'/g, "''");
        const elevatedCommand = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '${scriptArgument}'`;
        const child = spawn('powershell', ['-NoProfile', '-Command', elevatedCommand], { windowsHide: true });

        child.on('error', async () => {
          await fs.remove(tempScriptFile).catch(() => { });
          resolve({ success: false, reason: 'spawn_error' });
        });
        child.on('close', async () => {
          await fs.remove(tempScriptFile).catch(() => { });
          try {
            if (!await fs.pathExists(tempResultFile)) {
              resolve({ success: false, reason: 'uac_cancelled' });
              return;
            }
            const result = (await fs.readFile(tempResultFile, 'utf8')).trim();
            await fs.remove(tempResultFile);
            resolve(result === 'UPDATED'
              ? { success: true, message: 'Updated System PATH', entries: targetEntries }
              : { success: false, reason: 'failed' });
          } catch {
            resolve({ success: false, reason: 'read_error' });
          }
        });
      });
    } catch {
      return { success: false, reason: 'write_error' };
    }
  },

  async removeFromPath() {
    const previousEntries = this.getPreviousPathEntries();

    if (process.platform === 'win32') {
      const systemPath = await this.tryUpdateWindowsPath([], previousEntries, 'Machine');
      const userPath = await this.tryUpdateWindowsPath([], previousEntries, 'User');
      const success = Boolean(systemPath.success || userPath.success);
      if (success) this.configStore?.delete?.('settings.managedPathEntries');

      return {
        success,
        systemPath,
        userPath,
        message: success ? 'Removed MyLocalDev binaries from PATH' : 'Could not update Windows PATH',
        note: 'Open a new terminal/editor for PATH changes to take effect.',
      };
    }

    const result = await this.removeFromUnixPath();
    if (result.success) this.configStore?.delete?.('settings.managedPathEntries');
    return result;
  },

  async removeFromUnixPath() {
    const homeDir = os.homedir();
    const shell = process.env.SHELL || '/bin/bash';
    const rcFile = shell.includes('zsh') ? '.zshrc' : '.bashrc';
    const rcPath = path.join(homeDir, rcFile);

    try {
      if (!await fs.pathExists(rcPath)) return { success: true, message: 'Not in PATH', rcFile: rcPath };

      const content = await fs.readFile(rcPath, 'utf8');
      const nextContent = content
        .split('\n')
        .filter((line) => !line.includes(PATH_MARKER) && !line.includes(LEGACY_PATH_MARKER))
        .join('\n');
      await fs.writeFile(rcPath, nextContent, 'utf8');

      return {
        success: true,
        message: `Removed MyLocalDev binaries from ${rcFile}`,
        rcFile: rcPath,
        note: `Please restart your terminal or run: source ~/${rcFile}`,
      };
    } catch (error) {
      return { success: false, message: `Failed to modify ${rcFile}: ${error.message}`, rcFile: rcPath };
    }
  },

  async tryRemoveFromSystemPath() {
    return this.tryUpdateWindowsPath([], this.getPreviousPathEntries(), 'Machine');
  },

  async removeFromUserPath() {
    return this.tryUpdateWindowsPath([], this.getPreviousPathEntries(), 'User');
  },
};
