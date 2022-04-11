module.exports = class plugin3{
  constructor(options){
    this.options = options
  }
  apply(compiler){
    compiler.hooks.run.tapPromise('plugin3',(Compilation)=>{
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          console.log(this.options.words);
          resolve()
        }, 5000);
      })
    })
  }
}