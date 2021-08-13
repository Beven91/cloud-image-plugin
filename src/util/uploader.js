const http = require('http');
const https = require('https');
const urlParser = require('url')

/**
 * 获取云端的manfiest.json
 */
function fetchCloudManifest(url) {
  return new Promise((resolve, reject) => {
    const agent = /^https:/.test(url) ? https : http;
    const params = urlParser.parse(url);
    params.rejectUnauthorized = false;
    agent.get(params, (res) => {
      if (res.statusCode == 404) {
        return resolve({})
      }
      if (res.statusCode !== 200) {
        return reject(new Error('获取云端manifest.json失败', url))
      }
      const buffers = []
      res.on('data', (chunk) => { buffers.push(chunk) });
      res.on('error', reject)
      res.on('end', () => {
        try {
          resolve(JSON.parse(buffers.join('')))
        } catch (e) {
          reject(e);
        }
      });
    })
  })
}

module.exports = function (customUpload, manifest, manifestUrl) {
  // 1. 获取云端资源manifest.json
  return fetchCloudManifest(manifestUrl).then(
    (cManifest) => {
      const resources = Object.keys(manifest).filter((k) => !cManifest[k]).map((k) => manifest[k]);
      if(resources.length > 1){
        // 如果存在变更的资源文件，则需要进行manifest更新, 否则不产生任何更新
        resources.push(manifest['manifest.json']);
      }
      // 2. 调用自定义上传，将发生改变的资源上传至云端
      return Promise.resolve(customUpload(resources, manifest, cManifest));
    }
  )
}