const webpack = require('webpack')
const path = require('path')
const CloudImagePlugin = require('../index')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const releaseDir = path.resolve('dist')
const isProduction = false;
const publicPath = ''

module.exports = {
  devtool: 'source-map',
  name: 'demo',
  mode: 'development',
  stats: 'errors-only',
  context: path.resolve(''),
  cache: {
    type: 'filesystem',
  },
  entry: {
    app: [
      './example/demo/index'
    ]
  },
  output: {
    path: releaseDir,
    filename: isProduction ? '[name].[chunkhash:8].js' : `[name].js`,
    chunkFilename: isProduction ? '[name].[chunkhash:8].js' : `[name].js`,
    publicPath: publicPath,
  },
  plugins: [
    new MiniCssExtractPlugin({  }),
    new CloudImagePlugin({
      publicPath: '',
      uploadToCloud:(resources)=>{
        console.log(resources)
      }
    }),
    new webpack.ProgressPlugin(),
  ],
  module: {
    rules: [
      {
        // jsx 以及js
        test: /\.(ts|tsx|js|jsx)$/,
        include: [
          /example/,
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              comments: true,
              presets: ['module:metro-react-native-babel-preset'],
              plugins: [
                ['@babel/plugin-proposal-decorators', { 'legacy': true }],
              ]
            },
          },
        ],
      },
      {
        test: /\.(css|scss)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        // url类型模块资源访问
        test: new RegExp(`\\.(${[
          'psd', // Image formats
          'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'jpeg', // Image formats
          'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', // Video formats
          'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav', // Audio formats
          'pdf', // Document formats
          'woff', 'woff2', 'woff', 'woff2', 'eot', 'ttf', // icon font
          'svg',
        ].join('|')})$`),
        use: [
          CloudImagePlugin.loader,
        ],
      },
    ]
  },
};
