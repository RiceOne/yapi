## RiceAPI 可视化接口管理平台

### 简介

  * RiceAPI是基于YApi平台开发的一个<strong>高效</strong>、<strong>易用</strong>、<strong>功能强大</strong>的API管理平台，旨在为开发、产品、测试人员提供更优雅的接口管理服务。可以帮助开发者轻松创建、发布、维护 API，还为用户提供了优秀的交互体验，开发人员只需利用平台提供的接口数据写入工具以及简单的点击操作就可以实现接口的管理。
  * 在保持YApi强大功能（可视化接口管理、权限管理、Mock Server、自动化测试、数据导入、可扩展插件）的基础上，新增了多级目录树状特性，用以适配更加复杂的项目结构（如微服务架构项目），优化了数个功能使平台更易于操作和管理。

### 特性

#### YApi
*  基于 Json5 和 Mockjs 定义接口返回数据的结构和文档，效率提升多倍
*  扁平化权限设计，即保证了大型企业级项目的管理，又保证了易用性
*  类似 Postman 的接口调试
*  自动化测试, 支持对 Response 断言
*  MockServer 除支持普通的随机 mock 外，还增加了 Mock 期望功能，根据设置的请求过滤规则，返回期望数据
*  支持 postman, har, swagger 数据导入
*  免费开源，内网部署，保证接口信息安全

#### RiceAPI-Add
*  接口单级目录改为多级树状目录分类，实现多级目录增删改查
*  树目录去除拖拽特性，作为补偿增加<strong>顺序</strong>字段作为目录排序依据
*  接口导入导出新增选择目录项，可选择指定目录下的目录及接口进行导入导出
*  Swagger自动同步修改为可配置多套同步方案，可分别为每一个目录下的接口进行同步
*  权限由原来的{小组长，开发者，访客}变为{xx项目管理员，xx项目开发者，xx项目访客}
*  修改管理员默认密码为admin123
*  管理员在“用户管理”菜单处可新增用户和管理员

### 部署步骤

#### 环境准备

* nodejs（7.6+） + python（npm需要）
* mongodb（2.6+）

#### 安装步骤

1. 将打包好的项目解压缩，得到如下结构：

```
    |- GientechAPI   
        |- plugins      ---- chrome插件，用于在线调试接口    
        |- vendors      ---- 核心代码目录    
        |· config.json  ---- 项目初始化配置文件  
```   
   
2. 修改config.json配置文件，参数说明:

```
    port:            服务运行端口     
    adminAccount:    预置管理员账号    
    db:              mongdb数据库的连接配置    
    mail:            邮箱配置：用于LDAP方式注册登录，内网使用无需关注    
```

3. 在vendors目录下，执行命令安装依赖 (内网环境可事先准备好node_modules)

```
    npm install --registry https://registry.npm.taobao.org
```

4. 在vendors目录下，执行如下命令初始化数据库表（自动建表）    
   默认管理员账号名："admin@admin.com"，密码："admin123"

```
    npm run install-server
```

5. 在vendors目录下，执行如下命令启动服务

```
    node server/app.js
```
6. 服务启动成功后，访问 http://127.0.0.1:{端口号}/ 跳转到接口管理平台     
   使用默认管理员账号登录 —— 邮箱："admin@admin.com"，密码："admin123"

### 服务管理
利用pm2方便服务管理维护。
```
    npm install pm2 -g  //安装pm2
    cd  {项目目录}
    pm2 start "vendors/server/app.js" --name yapi //pm2管理yapi服务
    pm2 info yapi //查看服务信息
    pm2 stop yapi //停止服务
    pm2 restart yapi //重启服务
```
### YApi插件及工具
* [yapi sso 登录插件](https://github.com/YMFE/yapi-plugin-qsso)
* [yapi cas 登录插件](https://github.com/wsfe/yapi-plugin-cas) By wsfe
* [yapi gitlab集成插件](https://github.com/cyj0122/yapi-plugin-gitlab)
* [oauth2.0登录](https://github.com/xwxsee2014/yapi-plugin-oauth2)
* [rap平台数据导入](https://github.com/wxxcarl/yapi-plugin-import-rap)
* [dingding](https://github.com/zgs225/yapi-plugin-dding) 钉钉机器人推送插件
* [export-docx-data](https://github.com/inceptiongt/Yapi-plugin-export-docx-data) 数据导出docx文档
* [interface-oauth-token](https://github.com/shouldnotappearcalm/yapi-plugin-interface-oauth2-token) 定时自动获取鉴权token的插件
* [import-swagger-customize](https://github.com/follow-my-heart/yapi-plugin-import-swagger-customize) 导入指定swagger接口
* [Api Generator](https://github.com/Forgus/api-generator) 接口文档自动生成插件（零入侵）
* [mysql服务http工具,可配合做自动化测试](https://github.com/hellosean1025/http-mysql-server)
* [idea 一键上传接口到yapi插件](https://github.com/diwand/YapiIdeaUploadPlugin)
* [idea 接口上传调试插件 easy-yapi](https://easyyapi.com/)
* [执行 postgres sql 的服务](https://github.com/shouldnotappearcalm/http-postgres-server)

### 教程及帮助文档

* [YApi平台官方文档](https://hellosean1025.github.io/yapi/index.html)
* [使用 YApi 管理 API 文档，测试， mock](https://juejin.im/post/5acc879f6fb9a028c42e8822)
* [自动化测试](https://juejin.im/post/5a388892f265da430e4f4681)

### License
Apache License 2.0