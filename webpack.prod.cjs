const { merge } = require('webpack-merge');
const getCommon = require('./webpack.common.cjs');

module.exports = merge(getCommon({ NODE_ENV: 'production' }), {
  mode: 'production',
  devtool: false,
});
