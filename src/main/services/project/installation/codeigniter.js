const path = require('path');
const fs = require('fs-extra');

function quoteEnvValue(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function setEnvValue(content, key, value) {
  const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = `${key} = ${value}`;
  const pattern = new RegExp(`^\\s*#?\\s*${keyPattern}\\s*=.*$`, 'm');

  return pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.trimEnd()}\n${line}\n`;
}

module.exports = {
  async installCodeIgniter(project, mainWindow = null) {
    const projectPath = project.path;
    const phpVersion = project.phpVersion || '8.4';
    const projectName = project.name || 'codeigniter';
    const parentPath = path.dirname(projectPath);
    const folderName = path.basename(projectPath);
    const binary = this.managers.binaryDownload;

    if (!binary) {
      throw new Error('BinaryDownloadManager not available');
    }

    const onOutput = (text, type) => {
      const cleanText = text.toString().replace(/\r\n/g, '\n').trim();
      if (!cleanText) return;

      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('terminal:output', {
            projectId: 'installation',
            text: cleanText,
            type,
          });
        } catch {
          // Ignore renderer disconnects while installation continues.
        }
      }
    };

    await fs.ensureDir(parentPath);
    onOutput('Creating CodeIgniter 4 project...', 'info');
    onOutput(`$ composer create-project codeigniter4/appstarter ${folderName} --prefer-dist`, 'command');

    try {
      await binary.runComposer(
        parentPath,
        `create-project codeigniter4/appstarter ${folderName} --prefer-dist --no-interaction`,
        phpVersion,
        onOutput,
      );
      onOutput('✓ CodeIgniter 4 files installed successfully!', 'success');
    } catch (error) {
      this.managers.log?.systemError('[installCodeIgniter] Composer error', { error: error.message });
      onOutput(`✗ Composer error: ${error.message}`, 'error');
      throw error;
    }

    try {
      const envTemplatePath = path.join(projectPath, 'env');
      const envPath = path.join(projectPath, '.env');

      if (!await fs.pathExists(envPath) && await fs.pathExists(envTemplatePath)) {
        await fs.copy(envTemplatePath, envPath);
        onOutput('✓ .env file created from CodeIgniter environment template', 'success');
      }

      if (await fs.pathExists(envPath)) {
        const dbConfig = this.getProjectDatabaseConfig(project);
        const settings = this.configStore?.get('settings', {}) || {};
        const deploymentMode = project.deploymentMode === 'production' ? 'production' : 'development';
        const domain = project.domain || `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${settings.defaultTld || 'test'}`;
        let envContent = await fs.readFile(envPath, 'utf-8');

        envContent = setEnvValue(envContent, 'CI_ENVIRONMENT', deploymentMode);
        envContent = setEnvValue(envContent, 'app.baseURL', quoteEnvValue(`http://${domain}/`));
        envContent = setEnvValue(envContent, 'database.default.hostname', quoteEnvValue(dbConfig.host));
        envContent = setEnvValue(envContent, 'database.default.database', quoteEnvValue(dbConfig.database));
        envContent = setEnvValue(envContent, 'database.default.username', quoteEnvValue(dbConfig.user));
        envContent = setEnvValue(envContent, 'database.default.password', quoteEnvValue(dbConfig.password));
        envContent = setEnvValue(envContent, 'database.default.DBDriver', 'MySQLi');
        envContent = setEnvValue(envContent, 'database.default.port', String(dbConfig.port));

        await fs.writeFile(envPath, envContent);
        onOutput('✓ CodeIgniter environment configured', 'success');
      }
    } catch (error) {
      onOutput(`Warning: Could not configure CodeIgniter environment: ${error.message}`, 'warning');
    }

    onOutput('', 'info');
    onOutput('🎉 CodeIgniter 4 project created successfully!', 'success');
    onOutput(`Project location: ${projectPath}`, 'info');

    return { success: true };
  },
};
