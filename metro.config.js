// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for audio file extensions
config.resolver.assetExts.push(
  // Audio formats
  'ogg',
  'wav',
  'mp3',
  'm4a',
  'aac'
);

// Force zustand to use CommonJS on web to avoid "import.meta" error
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.startsWith('zustand')) {
    if (moduleName === 'zustand/middleware') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/shallow') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/react/shallow') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/react/shallow.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand/vanilla') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'zustand') {
      return {
        filePath: path.resolve(__dirname, 'node_modules/zustand/index.js'),
        type: 'sourceFile',
      };
    }
  }
  // Ensure default resolver is called
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
