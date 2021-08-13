const http = require('http')
const path = require('path')

class StaticAppServer {

  server = null

  start(port, compiler) {
    this.server = http
      .createServer((req, resp) => {
        try {
          this.handleRequest(req, resp, compiler)
        } catch (ex) {
          console.error(ex)
        }
      })
      .listen(port, () => {
        console.log('静态服务已启动.......')
      });
    process.on('beforeExit', () => {
      // 进程退出前，关闭服务
      this.server.close();
    })
  }

  handleRequest(req, resp, compiler) {
    const url = req.url.split('?').shift();
    const id = url.replace(/^\//, '')
    const file = path.join(compiler.options.output.path, this.baseDir, id);
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