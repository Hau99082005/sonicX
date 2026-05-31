module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@utils': './src/utils',
          '@views': './src/views',
          '@ui': './src/ui',
          '@api': './src/api',
          '@navigation': './src/navigation',
          '@context': './src/context',
          '@hooks': './src/hooks',
          src: './src',
        },
      },
    ],
    'react-native-worklets-core/plugin',
  ],
};
