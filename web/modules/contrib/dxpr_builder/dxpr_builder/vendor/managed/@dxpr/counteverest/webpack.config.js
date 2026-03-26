const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      counteverest: ['./js/counteverest.js', './scss/counteverest.scss'],
    },
    output: {
      filename: isProduction ? '[name].min.js' : '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.scss$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].min.css' : '[name].css',
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2018,
            compress: isProduction
              ? {
                  drop_console: true, // Remove console.log statements in production
                  drop_debugger: true, // Remove debugger statements
                  pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
                  passes: 2, // Run compression twice for better results
                }
              : {
                  drop_console: false, // Keep console.log in development
                  drop_debugger: false,
                },
            format: {
              comments: false,
            },
            mangle: isProduction
              ? {
                  toplevel: true, // Mangle top-level variable names in production
                }
              : false, // Don't mangle in development for easier debugging
            keep_classnames: !isProduction, // Keep class names in development
            keep_fnames: !isProduction, // Keep function names in development
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    },
    devServer: {
      static: {
        directory: path.join(__dirname),
      },
      compress: true,
      port: 9000,
    },
  };
};
