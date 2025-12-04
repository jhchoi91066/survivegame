const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
      }
    },
    argv
  );

  // Mock react-native-toast-message for web builds
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-toast-message': path.resolve(__dirname, 'src/utils/toast-message-mock.js'),
  };

  return config;
};
