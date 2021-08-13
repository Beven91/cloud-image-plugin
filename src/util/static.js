const http = require('http')
const fs = require('fs');

class StaticAppServer {

  server = null

  start(pluginInstance) {
    this.server = http
      .createServer((req, resp) => {
        try {
          this.handleRequest(req, resp, pluginInstance)
        } catch (ex) {
          console.error(ex)
        }
      })
      .listen(pluginInstance.options.port, () => {
        console.log('静态服务已启动.......')
      });
    process.on('beforeExit', () => {
      // 进程退出前，关闭服务
      this.server.close();
    })
  }

  handleRequest(req, resp, pluginInstance) {
    const url = req.url.split('?').shift();
    const id = url.replace(/^\//, '')
    const file = (pluginInstance.manifest[id] || {}).file;
    if (!fs.existsSync(file)) {
      resp.writeHead(404)
      resp.end()
      return;
    }
    resp.write(fs.readFileSync(file))
    resp.end();
  }
}

module.exports = StaticAppServer