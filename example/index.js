const webpack = require('webpack');
const config = require('./webpack');

const compier = webpack(config);

compier.watch({},(err,result)=>{
  console.error(err);
  console.log(result.compilation.getErrors())
});