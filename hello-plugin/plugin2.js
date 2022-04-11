module.exports = class plugin2{
  constructor(options){
    this.options = options
  }
  apply(compiler){
    compiler.hooks.run.tapAsync('plugin2',(Compilation,callback)=>{
      setTimeout(() => {
        console.log(this.options.words);
        callback()
      }, 3000);
    })
  }
}