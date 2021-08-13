# cloud-image-plugin

一个基于`webpack`的小程序图片资源打包工具(支持将图片资源和源代码分离，可通过配置上传至云端)


### 原因

由于图片会占用较大的体积，一般小程序开发时，
在大多数情况下我们会将一些体积较大图片先上传到图片服务器，然后再改成`url`的形式进行引用。
为了提升开发体验，我们允许将图片和代码存放在一起，仅在发布构建时将图片资源和小程序源代码进行分离，
从而达到既不占用小程序包体积，也可以方便管理图片资源。

### 原理

将相关图片资源引用的相对地址转换成url的引用形式。

插件主要分为两个阶段:

> 开发阶段

开发阶段会启动一个`nodejs`的静态资源服务，来提供图片资源服务，所有扫描到的资源会以url的形式引用，同时提供一个静态服务来支持访问。

> 发布构建阶段

在构建阶段会将所有图片，通过配置上传函数，上传至云端，同时会提供一份`manifest.json`， 可以基于`manifest.json`来进行优化上传处理（例如：文件hash未发生变化，则不处理)。

### 使用

```js
const CloudImagePlugin = require('cloud-image-plugin');

module.exports = {
  plugins:[
    new CloudImagePlugin({ 
      // 需要上传的云端访问地址
      publicPath: 'https://oss.com/my-app',
      // 自定义上传函数
      uploadToCloud: (resources, manifest, cloudManifest) => {
        oss.batchUpload(resources)
      },
    })
  ],
  module:{
    rules:[
      {
        // url类型模块资源访问
        test: /\.(png|jpeg|gif)/,
        loader: CloudImagePlugin.loader,
      },
    ]
  }
}
```