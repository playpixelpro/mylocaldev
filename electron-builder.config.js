/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.playpixelpro.mylocaldev',
  productName: 'MyLocalDev',
  copyright: 'Copyright © 2026 PlayPixelPro',
  asar: true,
  // Use the Electron binary already downloaded by `npm install` (node_modules/electron/dist)
  // This avoids re-downloading 138MB from GitHub during every build.
  electronDist: './node_modules/electron/dist',
  directories: {
    output: 'dist',
    buildResources: 'resources',
  },
  files: [
    'src/main/**/*',
    'src/shared/**/*',
    'config/binaries.json',
    'config/compatibility.json',
    '!src/main/**/*.map',
    'node_modules/**/*',
    '!node_modules/.cache/**/*',
    '!node_modules/.vite/**/*',
    {
      from: 'src/renderer/dist',
      to: 'renderer',
    },
  ],
  asarUnpack: [
    'src/main/services/extractWorker.js',
    'node_modules/adm-zip/**/*',
    'node_modules/fs-extra/**/*',
    'node_modules/graceful-fs/**/*',
    'node_modules/jsonfile/**/*',
    'node_modules/universalify/**/*',
  ],
  extraFiles: [
    {
      from: 'NOTICE',
      to: 'NOTICE',
    },
    {
      from: 'LICENSE',
      to: 'LICENSE',
    },
    {
      from: 'build/icon.png',
      to: 'icon.png',
    },
    {
      from: 'logo.ico',
      to: 'icon.ico',
    },
  ],
  extraResources: [
    {
      from: 'vcredist',
      to: 'vcredist',
      filter: ['**/*'],
    },
    {
      from: 'resources/php',
      to: 'php',
      filter: ['**/*'],
    },
    {
      from: 'resources/mysql',
      to: 'mysql',
      filter: ['**/*'],
    },
    {
      from: 'resources/redis',
      to: 'redis',
      filter: ['**/*'],
    },
    {
      from: 'resources/mailpit',
      to: 'mailpit',
      filter: ['**/*'],
    },
    {
      from: 'resources/phpmyadmin',
      to: 'phpmyadmin',
      filter: ['**/*'],
    },
  ],
  win: {
    executableName: 'MyLocalDev',
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    icon: 'build/icon.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MyLocalDev',
    include: 'resources/installer.nsh',
    artifactName: 'MyLocalDev-Setup-${version}.${ext}',
  },
  portable: {
    artifactName: 'MyLocalDev-${version}.${ext}',
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
    ],
    icon: 'build/icon.png',
    category: 'public.app-category.developer-tools',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'resources/entitlements.mac.plist',
    entitlementsInherit: 'resources/entitlements.mac.plist',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
      {
        target: 'deb',
        arch: ['x64'],
      },
    ],
    icon: 'build/icon.png',
    category: 'Development',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  },
  publish: {
    provider: 'github',
    owner: 'playpixelpro',
    repo: 'mylocaldev',
    releaseType: 'release',
  },
};
