const path = require('node:path');
const _ = require('lodash');

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { optimize } = require('webpack');

const isProd = process.env.NODE_ENV === 'production';
const outDir = path.join(__dirname, 'dist');
const prefix = 'zen-screen-time';
const title = 'Zen Screen Time';

const targets = {
  chrome: '116',
};

const devModeProps = { mode: 'development', devtool: false };

module.exports = {
  ...(isProd ? {} : devModeProps),
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.js',
    // settings: './src/settings/index.ts',
    sidepanel: './src/side-panel/index.ts',
  },
  output: {
    filename: `${prefix}-[name].js`,
    path: outDir,
  },
  optimization: {
    // Submit code as authored to review
    minimize: false,
  },
  plugins: _.compact([
    new HtmlWebpackPlugin({
      chunks: ['sidepanel'],
      filename: 'side-panel.html',
      template: './src/side-panel/side-panel.html',
      title: 'Zen Screen Time side panel',
      inject: 'head',
      scriptLoading: 'defer',
    }),
    // new HtmlWebpackPlugin({
    //   chunks: ['settings'],
    //   filename: 'settings.html',
    //   template: './src/settings/settings.html',
    //   title: 'Settings',
    //   inject: 'head',
    //   scriptLoading: 'defer',
    // }),
    new CopyPlugin({
      patterns: [{ context: 'public', from: '**/*' }],
    }),
    isProd ? new MiniCssExtractPlugin() : null,
  ]),
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

      // SVG files, utilising Asset Modules in Webpack 5
      { test: /\.svg$/, type: 'asset/source' },

      // CSS files
      {
        test: /\.css$/i,
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },

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
