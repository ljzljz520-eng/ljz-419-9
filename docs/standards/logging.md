# 统一日志字段规范

两个服务统一使用 `pino` 输出结构化 JSON 日志（本地开发也是 JSON，可用
`pino-pretty` 管道美化），由 `@hospital/common` 的 `createLogger` / `pino-http` 实现。

## 1. 固定字段

每条日志至少包含：

| 字段 | 说明 |
| --- | --- |
| `service` | 服务名：`account-service` / `department-service`（迁移脚本后缀 `-migrate`） |
| `level` | 日志级别：debug / info / warn / error / fatal |
| `time` | ISO8601 时间戳 |
| `msg` | 日志消息 |
| `requestId` | pino-http 自动生成，随请求进入注入；错误响应中原样回显 |
| `userId` | 认证后注入（JWT `sub`），未认证请求无此字段 |
| `role` | 认证后注入：ADMIN / DOCTOR / NURSE |
| `req` / `res` | pino-http 记录方法、URL、状态码、耗时等 |

启动与关闭示例：

```json
{"service":"account-service","level":"info","time":"2026-09-09T12:00:00.000Z","msg":"account-service 已启动","port":3001}
```

## 2. 级别约定

- `info`：服务启动/关闭、迁移应用、登录成功、写操作（创建/更新/删除）。
- `warn`：4xx 业务错误（校验失败、未授权、禁止访问、资源不存在、冲突）。
- `error`：5xx、未捕获异常、迁移/种子失败，需带 `err` 对象。

## 3. 敏感信息脱敏

`redact` 配置自动将下列字段替换为 `[REDACTED]`：

- `req.headers.authorization`、`req.headers.cookie`
- `password`、`oldPassword`、`newPassword`
- `token`、`accessToken`

任何业务日志都禁止打印密码哈希、JWT 原文、数据库连接串。

## 4. 使用方式

```ts
// 中间件链中自动具备 req.log
req.log.warn({ code: err.code }, err.message);
// 认证后自动追加 userId/role
req.log = req.log.child({ userId: req.user.sub, role: req.user.role });
```
