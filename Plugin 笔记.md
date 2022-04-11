# webpack-plugin

## 一、Plugin 的概述

### 1、 Plugin 的作用

​	通过插件我们可以扩展 webpack，加入自定义的构建行为，使 webpack 可以执行更广泛的任务，拥有更强的构建能力。Plugin 相比于 Loader，实现了一些 Loader 无法实现的工作。

### 2、 Plugin 工作原理

​	webpack 就像一条生产线，要**经过一系列处理流程后**才能将源文件转换成输出结果。 这条生产线上的每个处理流程的职责都是单一的，多个流程之间有存在依赖关系，**只有完成当前处理后**才能交给下一个流程去处理。
​	插件就像是一个插入到生产线中的一个功能，在**特定的时机**对生产线上的资源做处理。webpack 通过 Tapable 来组织这条复杂的生产线。webpack 在编译代码过程中，会**触发**一系列 Tapable **钩子事件**，**插件所做的，就是找到相应的钩子，往上面挂上自己的任务，也就是注册事件**，这样，当 webpack 构建的时候，插件注册的事件就会随着钩子的触发而执行了。
​	webpack 的事件流机制保证了插件的有序性，使得整个系统扩展性很好。

## 二、webpack 内部常用钩子

### 1、 webpack 内部常用钩子

#### （1）webpack 核心功能库 Tapable

​	Tapable 提供的九中hooks，为插件提供挂在的钩子（webpack的钩子都属于这九种之一）：

| 钩子                       | 钩入方式                          | 作用                                       |
| ------------------------ | ----------------------------- | ---------------------------------------- |
| Hook                     | `tap`、`tapAsync`、`tapPromise` | 钩子基类                                     |
| SyncHook                 | `tap`                         | 同步钩子                                     |
| SyncBailHook             | `tap`                         | 同步熔断钩子，只要执行的 handler 有返回值，剩余 handler 不执行 |
| SyncWaterfallHook        | `tap`                         | 同步流水钩子，上个 handler 的返回值作为下个 handler 的输入值  |
| SyncLoopHook             | `tap`                         | 同步循环钩子，只要执行的 handler 有返回值，一直循环执行此 handler |
| AsyncParallelHook        | `tap`、`tapAsync`、`tapPromise` | 异步并发钩子，handler 并行触发                      |
| AsyncParallelBailHook    | `tap`、`tapAsync`、`tapPromise` | 异步并发熔断钩子，handler 并行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncSeriesHook          | `tap`、`tapAsync`、`tapPromise` | 异步串行钩子，handler 串行触发                      |
| AsyncSeriesBailHook      | `tap`、`tapAsync`、`tapPromise` | 异步串行熔断钩子，handler 并行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncSeriesWaterfallHook | `tap`、`tapAsync`、`tapPromise` | 异步串行流水钩子，上个 handler 可以根据内部的回调函数传给下个 handler |

##### 		Tapable 钩子的类型

【按同步、异步（串行 / 并行）分类】

- **Sync**：同步方法。Sync 开头的 Hook 类只能用 `tap` 方法注册事件回调，如 myHook.tap()

- **AsyncSeries**：异步串行钩子。Async 开头的 Hook 类，没法用 `call` 方法触发事件，必须用 `callAsync` 或者 Promise 方法触发，这两个方法都能触发 `tap`、`tapAsync` 和 `tapPromise` 注册的事件回调。AsyncSeries 按照顺序执行，当前事件回调如果是异步的，那么会等到**异步执行完毕才会执行下一个事件回调**。

- **AsyncParallel**：异步并行执行钩子。AsyncParalle 会并行执行所有的事件回调，执行顺序为**并行**。

  ![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/77b2d62f24d7469987ea5dff01cef44d~tplv-k3u1fbpfcp-watermark.awebp)

  ​	【按执行模式分类】

- Basic：基础类型，执行每一个事件函数，不关心函数的返回值

![Tapable bda4604e3f27488082fd7a2820082dbc.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7ef3c3c27fa3478ca685b25ccd2ad8f2~tplv-k3u1fbpfcp-watermark.awebp)

- Bail：保险类型，当一个事件回调在运行时返回的值不为 `undefined` 时，停止后面事件回调的执行

![_(1).png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/213bd9c9e7a04f20b60195eb00f297c0~tplv-k3u1fbpfcp-watermark.awebp)

- Waterfall：瀑布类型，如果当前执行的事件回调返回值不为 `undefined`，那么就把下一个事件回调的第一个参数替换成这个值

![_(2).png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8beecdf93014aca950d754f212aabdb~tplv-k3u1fbpfcp-watermark.awebp)

- Loop：循环类型，如果当前执行的事件回调的返回值不是 `undefined`，重新从第一个注册的事件回调处执行，直到当前执行的事件回调没有返回值

![_(4).png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/da83f83795614d33b352233d8730f7d2~tplv-k3u1fbpfcp-watermark.awebp)

![Untitled 1.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0a43f84222e49e3ae733e4c40dcb5e5~tplv-k3u1fbpfcp-watermark.awebp)

##### 		钩入方式

- **tap**：可以注册同步钩子和异步钩子。
- **tapAsync**：回调方式注册异步钩子。
- **tapPromise**：Promise方式注册异步钩子。

Compiler、Compilation、JavascriptParser 都继承了 Tapable 类，它们身上挂着丰富的钩子。

#### （2）Compiler Hooks

webpack 在构建时会从上到下依次触发 Compiler 对象中的钩子事件

| 钩子           | 类型                | 什么时候调用                                   |
| ------------ | ----------------- | ---------------------------------------- |
| run          | AsyncSeriesHook   | 在编译器开始读取记录前执行                            |
| compile      | SyncHook          | 在一个新的compilation创建之前执行                   |
| compilation  | SyncHook          | 在一次compilation创建后执行插件                    |
| make         | AsyncParallelHook | 完成一次编译之前执行                               |
| emit         | AsyncSeriesHook   | 在生成文件到output目录之前执行，回调参数： `compilation`   |
| afterEmit    | AsyncSeriesHook   | 在生成文件到output目录之后执行                       |
| assetEmitted | AsyncSeriesHook   | 生成文件的时候执行，提供访问产出文件信息的入口，回调参数：`file`，`info` |
| done         | AsyncSeriesHook   | 一次编译完成后执行，回调参数：`stats`                   |

#### （3）Compilation Hooks

`Compilation`：由 `Compiler` 来创建的实例对象，是每次打包流程最核心的流程，该对象内进行模块依赖解析、优化资源、渲染 `runtime` 代码等事情

| 钩子                   | 类型              | 什么时候调用                                   |
| -------------------- | --------------- | ---------------------------------------- |
| buildModule          | SyncHook        | 在模块开始编译之前触发，可以用于修改模块                     |
| succeedModule        | SyncHook        | 当一个模块被成功编译，会执行这个钩子                       |
| finishModules        | AsyncSeriesHook | 当所有模块都编译成功后被调用                           |
| seal                 | SyncHook        | 当一次compilation停止接收新模块时触发                 |
| optimizeDependencies | SyncBailHook    | 在依赖优化的开始执行                               |
| optimize             | SyncHook        | 在优化阶段的开始执行                               |
| optimizeModules      | SyncBailHook    | 在模块优化阶段开始时执行，插件可以在这个钩子里执行对模块的优化，回调参数：`modules` |
| optimizeChunks       | SyncBailHook    | 在代码块优化阶段开始时执行，插件可以在这个钩子里执行对代码块的优化，回调参数：`chunks` |
| optimizeChunkAssets  | AsyncSeriesHook | 优化任何代码块资源，这些资源存放在 `compilation.assets` 上。一个 `chunk` 有一个 `files` 属性，它指向由一个chunk创建的所有文件。任何额外的 `chunk` 资源都存放在 `compilation.additionalChunkAssets` 上。回调参数：`chunks` |
| optimizeAssets       | AsyncSeriesHook | 优化所有存放在 `compilation.assets` 的所有资源。回调参数：`assets` |

#### 

## 三、如何写一个 webpack 插件

### 1、plugin 的组成

- 一个命名的 Javascript 方法或者 JavaScript 类。
- 它的原型上需要定义一个叫做 `apply` 的方法。
- 注册一个事件钩子。
- 操作webpack内部实例特定数据。
- 功能完成后，调用webpack提供的回调。

### 2、plugin 实例

```js
class createFileListPlugin {
  constructor (options) {
    // 获取插件配置项
      this.filename = options && options.filename ? options.filename : 'FILELIST.md';
  }

  apply(compiler) {
      // 注册 compiler 上的 emit 钩子
      compiler.hooks.emit.tapAsync('FileListPlugin', (compilation, cb) => {
          
          // 通过 compilation.assets 获取文件数量
          let len = Object.keys(compilation.assets).length;
          console.log(compilation.getAssets());
          // 添加统计信息
          let content = `# ${len} file${len>1?'s':''} emitted by webpack\n\n`;

          console.log(compilation.assets); // 通过 compilation.assets 获取文件名列表
          
          for(let filename in compilation.assets) {
              content += `- ${filename}\n`;
          }

          // 往 compilation.assets 中添加清单文件
          compilation.assets[this.filename] = {
            // 写入新文件的内容
              source: function() {
                  return content;
              },
              // 新文件大小（给 webapck 输出展示用）
              size: function() {
                  return content.length;
              }
          }
          // 执行回调，让 webpack 继续执行
          cb();
      })
  }
}

module.exports = createFileListPlugin;
```





















