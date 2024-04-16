<h1 align="center">Welcome to web-pub 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/web-pub" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/web-pub.svg">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg" />
  <img src="https://img.shields.io/badge/npm-%3E%3D%209.8.1-blue.svg" />
  <img src="https://img.shields.io/badge/yarn-%3E%3D%201.22.0-blue.svg" />
  <a href="github+https://github.com/DESsmily/web-pub#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="github+https://github.com/DESsmily/web-pub/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="github+https://github.com/DESsmily/web-pub/blob/master/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/github+DESsmily/web-pub" />
  </a>
</p>

> 一款用于发布静态资源到服务器的脚本。

### 🏠 [Homepage](https://github.com/DESsmily/web-pub#readme)

## Prerequisites

- node >= 18.0.0
- npm >= 9.8.1
- yarn >= 1.22.0

## Author

👤 **Smilydes**

* Github: [@github+DESsmily](https://github.com/DESsmily)

### 起步

- `npm install web-pub -g`

### ssh操作
- 查看ssh配置 `web-pub ssh list`
- 添加ssh配置 `web-pub ssh add <名称> <host@port> <user> <password>`
    - `web-pub ssh add test 127.0.0.1@22 root 123456`
- 删除指定ssh配置 `web-pub ssh del test`
    - `web-pub ssh del <name>`

- 局部配置ssh
  - `web-pub run -S <ip@port@user@pass> -R <remotePath>`
    - `web-pub run -S 127.0.0.1@22@root@123456. -R /mnt/test`
    - 可使用`web-pub run --help` 查看配置描述

### 部署
    - `web-pub use <ssh名称> <远程服务器部署路径>`
### 示例

```
# 进入web/dist打包好的目录将dist目录内的文件上传到指定服务器的 /mnt/statics/test目录中

cd /web/dist
web-pub use test /mnt/statics/test
```


Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2024 [Smilydes](https://github.com/github+DESsmily).<br />
This project is [ISC](github+https://github.com/DESsmily/web-pub/blob/master/LICENSE) licensed.
