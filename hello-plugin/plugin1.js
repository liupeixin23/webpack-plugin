module.exports = class plugin1{
  constructor(options){
    this.options = options
  }
  apply(compiler){
    compiler.hooks.run.tap('plugin1',Compilation=>{
      // compiler = 完整的webpack环境配置
      // console.log(compiler);
      // 访问配置参数
      console.log(this.options.words);
      // 包含当前构建中的资源配置，每次有文件变动，就会产生新的Compilation
      // console.log(Compilation);
    })
  }
}