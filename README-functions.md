# 使用腾讯 Pages One 部署函数

api格式

export function onRequest({ request, params, env }){} 

与vercel使用的不兼容

export default (req, res) => {}

## 不同之处

`export function onRequest({ request, params, env }){}` 格式通常用于边缘运行时环境，例如腾讯 Pages One 或 Cloudflare Workers。 它将请求详细信息、路由参数和环境变量作为单个对象中的命名属性接收。 此格式专为更靠近用户运行的函数而设计，可提供更低的延迟。

*   **运行时环境:** 这些环境通常在全球范围内分布，更靠近用户运行以减少延迟。 它们通常对执行时间和内存使用有限制。
*   **可用工具:** 这些环境通常提供用于路由、缓存和安全性的内置工具。 它们还可以访问 KV 存储或其他边缘优化数据存储解决方案。
*   **方法差异:** 环境变量通过 `env` 对象访问。 `request` 对象提供对标头、正文和其他请求详细信息的访问。 `params` 对象提供对路由参数的访问。

`export default (req, res) => {}` 格式通常用于 Node.js 环境，例如 Vercel 或 Netlify。 它接收单独的 `req`（请求）和 `res`（响应）对象，遵循更传统的服务器端模式。 此格式通常用于在集中式服务器上运行的函数。

*   **运行时环境:** 这些环境通常在集中式服务器上运行。 与边缘运行时环境相比，它们通常具有更多可用资源，但也可能具有更高的延迟。
*   **可用工具:** 这些环境通常提供用于构建、部署和扩展 Node.js 应用程序的工具。 它们还可以与数据库和其他后端服务集成。
*   **方法差异:** `req` 对象提供对请求详细信息的访问，`res` 对象提供用于发送响应的方法。 环境变量通过 `process.env` 访问。

### functions 依赖文件

#### vercel中

必须在vercel.json中配置,将文件包含在函数中才能访问文件,Issue: https://github.com/vercel/next.js/discussions/14807
文档: https://vercel.com/docs/project-configuration#functions

```json
{
    "functions": {
        "api/maxmind.js": {
            "includeFiles": "common/maxmind-db/*.mmdb"
        }
    }
}
```

#### edgeone

暂未实现

## 不足

### 1. edgeone.json 配置  redirects 目前仅支持 301跳转

参考文档: https://edgeone.cloud.tencent.com/pages/document/162936771610066944

### 2. 获取参数方式和vercel,netlify不同

### 3. functions import一些包无法工作,如 whoiser (依赖的一些包无法使用:https等)

## 参考

- [Pages one](https://edgeone.cloud.tencent.com/pages/document/162936866445025280#2c328570-c058-4655-88cb-81936a58cc0d)