module.exports = class plugin4{
  constructor(options){
    this.options = options
  }
  apply(compiler){
    compiler.hooks.run.tap('plugin4',(Compilation)=>{
      console.log(this.options.words);
    })
  }
}