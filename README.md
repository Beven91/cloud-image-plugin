# cloud-image-plugin

一个基于`webpack`的小程序图片资源打包工具(支持将图片资源和源代码分离，可通过配置上传至云端)


### 原因

由于图片会占用较大的体积，一般小程序开发时，
在大多数情况下我们会将一些体积较大图片先上传到图片服务器，然后再改成`url`的形式进行引用。
为了提升开发体验，我们允许将图片和代码存放在一起，仅在发布构建时将图片资源和小程序源代码进行分离，
从而达到既不占用小程序包体积，也可以方便管理图片资源。

### 原理

将相关图片资源引用的相对地址转换成url的引用形式。

在构建阶段会将所有图片，通过配置上传函数，上传至云端，同时会提供一份`manifest.json`，

 可以基于`manifest.json`来进行增量上传，优化体验。

### 使用

```js
const CloudImagePlugin = require('cloud-image-plugin');

module.exports = {
  plugins:[
    new CloudImagePlugin({ 
      // 运行模式: remote 模式会实时上传，local 仅使用本地静态资源服务 默认为 remote
      mode:'remote', 
      // 需要上传的云端访问地址
      publicPath: 'https://oss.com/my-app',
      // 自定义上传函数
      uploadToCloud: (resources, manifest, cloudManifest) => {
        // 注意: resources数组为：和云端manifest.json对比hash后计算出需要上传的资源列表
        oss.batchUpload(resources)
      },
    })
  ],
  module:{
    rules:[
      {
        // url类型模块资源访问
        test: /\.(png|jpeg|gif|ttf|woff|woff2)/,
        loader: CloudImagePlugin.loader,
      },
    ]
  }
}
```

### Taro使用

#### 第一步

修改 `config/index` 中 `postcss.url`的url模式为:`copy`

```js
module.exports = {
  mini: {
    postcss: {
      url: {
        config: {
          url:'copy',
        }
      },
    }
  },
}
```

#### 第二步

通过`webpackChain`添加插件

```js
module.exports = {
  mini: {
    webpackChain: (chain)=>{
       // 移除默认的图片处理loader 下文中会使用cloud-image-plugin来处理
      chain.module.rules.delete('image');
      chain.module.rules.delete('font');

      // 配置cloud处理
      chain.merge({
        plugin: {
          'cloud': {
            plugin: CloudImagePlugin,
            args: [
              {
                // 需要上传的云端访问地址
                publicPath: 'https://oss.com/my-app',
                // 自定义上传函数
                uploadToCloud: (resources, manifest, cloudManifest) => {
                  // 注意: resources数组为：和云端manifest.json对比hash后计算出需要上传的资源列表
                  return Promise.all(
                    resources.map((item) => {
                      // 文件相对于publicPath的路径名
                      const name = item.path;
                      // 要上传文件的本地绝对路径
                      const absPath = item.file;
                      // 这里可以自定义实现将文件上传至云端
                    })
                  )
                }
              }
            ]
          }
        },
        module: {
          rule: {
            // 定义cloud的loader
            cloud: {
              test: /\.(png|jpeg|jpg|gif|ttf|woff|woff2)/,
              loader: CloudImagePlugin.loader
            },
          }
        }
      })
    }
  },
}

```
