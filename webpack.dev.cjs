const { merge } = require('webpack-merge');
const getCommon = require('./webpack.common.cjs');

module.exports = merge(getCommon({ NODE_ENV: 'development' }), {
  mode: 'development',
  devtool: 'inline-source-map',
});
