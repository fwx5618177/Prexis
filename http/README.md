# Prexis HTTP 测试文件

本目录包含使用 VS Code REST Client 扩展的 API 测试文件。

## 📦 安装

在 VS Code 中安装 [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) 扩展。

## 🚀 使用方法

1. 启动服务器: `pnpm dev`
2. 打开任意 `.http` 文件
3. 点击 `Send Request` 发送请求

## 📁 文件说明

| 文件 | 描述 |
|------|------|
| `health.http` | 健康检查和基础端点测试 |
| `auth.http` | 认证相关接口（注册/登录/登出） |
| `users.http` | 用户 CRUD 接口 |
| `graphql.http` | GraphQL 查询和变更 |
| `api-general.http` | 通用 API 测试 |
| `error-scenarios.http` | 错误场景测试 |
| `performance.http` | 性能相关测试 |

## ⚙️ 配置

所有文件使用统一的变量配置：

```http
@baseURL = http://localhost:3000
```

## 🔐 认证流程

1. 先运行 `auth.http` 中的注册请求
2. 然后运行登录请求获取 Cookie
3. 需要认证的请求会自动使用 Cookie

## 📊 测试覆盖

- ✅ 健康检查 (GET /health)
- ✅ Swagger 文档 (GET /api-docs)
- ✅ 用户注册 (POST /signup)
- ✅ 用户登录 (POST /login)
- ✅ 用户登出 (POST /logout)
- ✅ 用户 CRUD (GET/POST/PUT/DELETE /users)
- ✅ GraphQL 查询 (POST /graphql)
- ✅ GraphQL Mock (POST /graphql/mock)
- ✅ 错误处理 (4xx, 5xx)
