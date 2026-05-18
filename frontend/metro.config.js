const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  resolver: {
    extraNodeModules: {
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@context': path.resolve(__dirname, 'src/context'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
