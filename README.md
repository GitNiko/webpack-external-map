# webpack-external-map

## 方案

### json 文件中存放映射，externalConfig -> <script src>

```json
{
  "react": {
    "16.0.0": {
      "root": "window.React",
      "src": ["umd/react.production.min.js"],
      "devSrc": ["umd/react.production.min.js"],
      "css": [""]
    },
    "16.2.0": {
      "root": "window.React",
      "src": ["umd/react.production.min.js"],
      "devSrc": ["umd/react.production.min.js"],
      "css": [""]
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
// => 生成对应script tag

```
