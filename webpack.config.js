const path = require('node:path');

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const outDir = path.join(__dirname, 'dist');
const prefix = 'zen-screen-time';
const title = 'Zen Screen Time';

const targets = {
  chrome: '116',
};

module.exports = {
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.js',
    popup: './src/popup/index.js',
    settings: './src/settings/index.ts',
    sidepanel: './src/side-panel/index.ts',
  },
  output: {
    filename: `${prefix}-[name].js`,
    path: outDir,
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['popup'],
      filename: 'popup.html',
      template: './src/popup/index.html',
      title,
    }),
    new HtmlWebpackPlugin({
      chunks: ['sidepanel'],
      filename: 'side-panel.html',
      template: './src/side-panel/side-panel.html',
      title: 'Zen Screen Time side panel',
      inject: 'head',
      scriptLoading: 'defer',
    }),
    new HtmlWebpackPlugin({
      chunks: ['settings'],
      filename: 'settings.html',
      template: './src/settings/settings.html',
      title: 'Settings | Zen Screen Time',
      inject: 'head',
      scriptLoading: 'defer',
    }),
    new CopyPlugin({
      patterns: [{ context: 'public', from: '**/*' }],
    }),
  ],
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.cjs': ['.cjs', '.cts'],
      '.mjs': ['.mjs', '.mts'],
    },
  },
  module: {
    rules: [
      // loading TS files
      { test: /\.([cm]?ts|tsx)$/, loader: 'ts-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
    ],
  },
};
