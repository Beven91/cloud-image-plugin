
const path = require('path');
const upload = require('./util/uploader');
const fs = require('fs');
const StaticAppServer = require('./util/static');
const urlParser = require('url');

const runtime = {
  instance: null
}

class CloudImagePlugin {

  /**
   * 获取当前缓存的manifest数据
   */
  static addManifest(hashId) {
    runtime.instance.addManifest(hashId);
  }

  /**
   * 获取云端文件，物理输入位置基础目录
   */
  get baseDir() {
    return '../@cloud';
  }

  options = {
    // 本地静态服务端口
    port: 9016,
    // 需要上传的云端访问地址
    publicPath: '',
    // 运行模式： local | remote
    mode: 'remote',
    // 自定义上传函数
    uploadToCloud: (resources, manifest, cloudManifest) => 1,
  }

  compiler = null

  compilation = null

  constructor(options) {
    this.manifest = {};
    this.emitCount = 0;
    this.options = Object.assign({}, this.options, options || {});
    this.serverURL = options.mode === 'local' ? 'http://localhost:' + this.options.port + '/' : options.publicPath;
    runtime.instance = this;
  }

  /**
   * 获取要上传至云端文件的绝对路径
   * @returns 
   */
  getPath(id) {
    return this.baseDir + '/' + id;
  }

  /**
   * 添加指定资源到清单中
   */
  addManifest(id, filePath) {
    const manifest = this.manifest;
    const meta = urlParser.parse(this.options.publicPath || '')
    const prefix = meta.path ? meta.path + '/' : '';
    manifest[id] = {
      file: filePath,
      name: id,
      path: (prefix + id).replace(/^\//, ''),
    }
  }

  /**
   * 获取清单文件asset
   * @returns 
   */
  getManifestAsset() {
    const manifest = this.manifest;
    const out = {};
    Object.keys(manifest).forEach((k) => {
      out[k] = path.basename(k);
    })
    const content = JSON.stringify(out, null, 2);
    return {
      key: 'manifest.json',
      content: {
        size: () => content.length,
        source: () => content,
      }
    }
  }

  /**
   * 生成需要上传云端的资源
   * @param {} assets 
   */
  processAssets = (assets) => {
    const manifest = this.manifest;
    const asset = this.getManifestAsset();
    // 生成manifest.json
    assets[asset.key] = asset.content;
    console.log(manifest);
    // 控制云端资源输出 目录
    Object.keys(manifest).forEach((key) => {
      const asset = assets[key];
      if (asset) {
        // 删除掉，需要上传到云端的资源文件打包输出
        delete assets[key];
      }
    })
  }

  getCachePath() {
    const nmRoot = path.resolve('node_modules');
    const root = fs.existsSync(nmRoot) ? nmRoot : path.join(__dirname, '..');
    const cacheRoot = path.join(root, '.cache');
    if (!fs.existsSync(cacheRoot)) {
      fs.mkdirSync(cacheRoot)
    }
    return path.join(cacheRoot, '@cloud-manifest.json');
  }

  /**
   * 缓存manifest
   */
  cacheManifest() {
    const content = JSON.stringify(this.manifest, null, 2);
    fs.writeFileSync(this.getCachePath(), content);
  }

  getCachedManifest() {
    try {
      const file = this.getCachePath();
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file).toString('utf-8'));
      } else {
        return {}
      }
    } catch (ex) {
      return {}
    }
  }

  apply(compiler) {
    // 设置编译器
    this.compiler = compiler;
    if (this.options.mode === 'local') {
      // 启动静态资源服务
      (new StaticAppServer()).start(this)
    }
    const idManifestPath = path.join(compiler.options.output.path, 'manifest.json')
    // 修改compiler.publicPath为对应的serverURL
    compiler.options.output.publicPath = this.serverURL;

    compiler.hooks.compilation.tap('CloudImagePlugin', (compilation) => {
      if (compilation.compiler == compiler) {
        // 设置编译器引用
        this.compilation = compilation;
        // 每次重新构建，需要清空manifest
        this.manifest = this.getCachedManifest();
        // 将清单作为文件
        this.addManifest('manifest.json', idManifestPath)
        // 生成需要上传云端的资源
        if (compilation.hooks.processAssets) {
          compilation.hooks.processAssets.tap('CloudImagePlugin', this.processAssets)
        }
      }
    })

    // 编译结束后，这里需要进行文件上传至云端处理
    compiler.hooks.emit.tapAsync('CloudImagePlugin', (compilation, callback, a) => {
      if (!compilation.hooks.processAssets) {
        // 如果不支持processAssets
        this.processAssets(compilation.assets);
      }
      this.cacheManifest();
      if (this.options.mode === 'local') {
        // 本地模式，不上传内容
        return;
      }
      // this.emitCount = this.emitCount + 1;
      // if (this.emitCount == 1) {
      // 仅在第一次结束后上传一次，热更时不进行处理
      const manifestUrl = this.options.publicPath + '/manifest.json';
      upload(this.options.uploadToCloud, this.manifest, manifestUrl).then(
        () => callback(),
        (e) => callback(e)
      )
      // }
    })
  }
}

module.exports = CloudImagePlugin