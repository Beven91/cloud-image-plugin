const Plugin = require('./plugin')
const urlLoader = require('url-loader')

const getHashId = (md,result)=>{
  const assets = md.buildInfo.assets || {};
  const keys = Object.keys(assets)
  if(keys.length > 0){
    return keys[0];
  }
  return result.replace(/\s/g,'').split('+"').pop().replace('";','')
}

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
  const file = md.resource.split('?').shift();
  const id = getHashId(md,result);
  Plugin.addManifest(id, file);
  return result;
}

module.exports.raw = true;