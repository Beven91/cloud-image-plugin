const http = require('http');
const https = require('https');


/**
 * 获取云端的manfiest.json
 */
function fetchCloudManifest(url) {
  return new Promise((resolve, reject) => {
    const agent = /^https:/.test(url) ? https : http;
    agent.get(url, (res) => {
      if(res.statusCode == 404){
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
      // 2. 调用自定义上传，将发生改变的资源上传至云端
      return Promise.resolve(customUpload(resources, manifest, cManifest));
    }
  )
}