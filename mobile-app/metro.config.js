const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This project doesn't list `@expo/vector-icons` as a direct dependency, but Expo bundles it.
// Map the import so Metro can resolve it consistently.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@expo/vector-icons': path.resolve(__dirname, 'node_modules/expo/node_modules/@expo/vector-icons'),
};

module.exports = config;

