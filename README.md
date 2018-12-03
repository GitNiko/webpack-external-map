# webpack-external-map

## Motivation
理想的结果：
每个需要运行在浏览器的库，在package.json中指定了external的信息。
package.json
```json
{
  //...
  "external": {
    "root": "window.antd",
    "js": {
        "deployment": [
            "dist/antd.min.js"
        ],
        "development": [
            "dist/antd.js"
        ],
        "deployment-i18n": [
            "dist/antd-with-locales.js"
        ],
        "development-i18n": [
            "dist/antd-with-locales.min.js"
        ]
    },
    "css": {
        "deployment:": [
            "dist/antd.min.css"
        ],
        "development": [
            "dist/antd.min.css"
        ]
    },
  },
  "peerDependencies": {
    "react": ">=16.0.0",
    "react-dom": ">=16.0.0"
  }
  //...
}
```

## Trouble

CSS的主题可能是个无法回避的坑。

### peer dependencies
webpack插件中进行包依赖的拓扑排序时，因为依赖的包都在package-lock.json中，所以在剔除peerDep的时候，不需要处理版本范围的问题。  
但是，在编辑external后做测试的时候，peerDep的包没有在package.json(甚至都没有package.json)，这个时候就需要处理peerDep的范围，也就是根据peerDep去external中找到对应包，并且范围是适配的。  

### upper limit
每个包是否存在一个上界限：
- 必须，如果新版本发布，并且入口文件变了（deploy,development)，这个错误会就不会被发现。为了避免这个可能性，设置上界，新版本情况下，直接不匹配到版本。
- 不必，绝大部分库是稳定的，入口文件几乎不会变。

不必，正常开发流程都会先走一遍测试环境，最差情况下能在测试环境的时候即可发现错误。

