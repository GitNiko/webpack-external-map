# webpack-external-map

## 需求
antd 2.2.3 => db => 

## 方案

### json 文件中存放映射，externalConfig -> <script src>

```json
{
  "moment": {
    "^2.22.2": {
      "root": "window.moment",
      "js": {
        "deployment": ["moment.js"],
        "development": ["moment.min.js"],
        "deployment-i18n": ["moment-with-locales.min.js"],
        "development-i18n": ["moment-with-locales.js"]
      }
    },
  },
  "antd": {
    "^3.10.0": {
      "root": "window.antd",
      "js": {
        "deployment": ["dist/antd.min.js"],
        "development": ["dist/antd.js"],
        "deployment-i18n": ["dist/antd-with-locales.js"],
        "development-i18n": ["dist/antd-with-locales.min.js"]
      },
      "css": {
        "deployment:": ["dist/antd.min.css"],
        "development": ["dist/antd.min.css"],
      },
    }
  },
  "shineout": {
    "^1.0.10": {
      "root": "window.shineout",
      "js": {
        "deployment": ["shineout.min.js"],
        "development": ["shineout.min.js"]
      },
      "css": {
        "deployment": ["theme.default.css"],
        "development": ["theme.default.css"],
        "theme-antd": ["theme.antd.css"]
      }
    }
  }
}
```

### 流程

```js
[
  "lodash",
  "react",
  "react-dom",
  "antd",
  "moment",
  "babel-polyfill",
  "shineout"
]
// 二维数组可能导致最终拓扑排序错误
// e.g. [[1, 4, 3], 2, 5] => [[1, 3, 4], 2, 5]
[
  ["babel-polyfill", "react", "react-dom"],
  "lodash",
  "shineout",
  "moment",
]
// =>
{
  lodash: 'window._',
  react: 'window.React',
  'react-dom': 'window.ReactDOM',
  antd: 'window.antd',
  moment: 'window.moment',
  'babel-polyfill': 'undefined',
  shineout: 'window.Shineout'
}
{
  stylesheet: '',
  script: '',
}
[] => 
// => 生成对应script tag

```
### 测试
通过`html-webpack-plugin`生成html，通过`Puppeteer`加载html后确认window上的库是否加载进来。


### trouble
- 依赖顺序
- i18n加载区分