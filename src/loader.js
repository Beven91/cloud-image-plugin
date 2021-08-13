const Plugin = require('./plugin')
const urlLoader = require('url-loader')

module.exports = function (content) {
  const loaderContext = {
    ...this,
    query: {
      limit: false,
      esModule:false,
      name: '[hash].[ext]'
    }
  }
  const result = urlLoader.call(loaderContext, content)
  const md = this._module;
  const assets = md.buildInfo.assets || {};
  const keys = Object.keys(assets)
  const id = keys[0];
  Plugin.addManifest(id, md.resource);
  return result;
}

module.exports.raw = true;