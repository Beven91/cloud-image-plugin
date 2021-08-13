
const path = require('path');
const upload = require('./util/uploader');
const StaticAppServer = require('./util/static');

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
  addManifest(id) {
    const manifest = this.manifest;
    manifest[id] = {
      file: path.join(this.compiler.options.output.path, this.getPath(id))
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
      key: this.getPath('manifest.json'),
      content: {
        size: () => content.length,
        source: () => content,
      }
    }
  }

  getProjectConfigAsset(assets) {
    const asset = assets['project.config.json'];
    let config = {};
    if (asset) {
      config = JSON.parse(asset.buffer().toString('utf8'));
    }
    config.scripts = config.scripts || {};
    config.scripts.beforePreview = ""
    const content = '';
    return {
      key: 'project.config.json',
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
    // const pAsset = this.getProjectConfigAsset(assets);
    // 生成manifest.json
    assets[asset.key] = asset.content;
    // 修改prect.config.json
    // assets[pAsset.key] = pAsset.content;
    // 控制云端资源输出 目录
    Object.keys(manifest).forEach((key) => {
      const asset = assets[key];
      if (asset) {
        delete assets[key];
        assets[this.getPath(key)] = asset;
      }
    })
  }

  apply(compiler) {
    // 设置编译器
    this.compiler = compiler;
    if (this.options.mode === 'local') {
      // 启动静态资源服务
      (new StaticAppServer()).start(this)
    }
    // 修改compiler.publicPath为对应的serverURL
    compiler.options.output.publicPath = this.serverURL;

    compiler.hooks.compilation.tap('CloudImagePlugin', (compilation) => {
      if (compilation.compiler == compiler) {
        // 设置编译器引用
        this.compilation = compilation;
        // 每次重新构建，需要清空manifest
        this.manifest = {};
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