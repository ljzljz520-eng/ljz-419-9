# 统一错误响应规范

适用于 account-service、department-service 以及未来所有 HTTP 服务，由共享包
`@hospital/common` 的 `errorHandler` 统一实现。

## 1. 成功响应

所有成功响应使用统一信封：

```json
{ "success": true, "data": { } }
```

分页列表：

```json
{
  "success": true,
  "data": { "items": [], "page": 1, "pageSize": 20, "total": 0 }
}
```

## 2. 错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "details": [{ "field": "password", "message": "密码至少 8 个字符" }]
  },
  "requestId": "1-ABCxyz..."
}
```

- `code`：大写下划线的机器可读错误码，前端据此做分支处理，不随文案变化。
- `message`：面向调用方的中文可读信息，不得包含堆栈、SQL、密钥等敏感内容。
- `details`：可选，字段级错误（主要由 Zod 校验产生）。
- `requestId`：与访问日志中的请求 ID 一致，便于排障。

## 3. HTTP 状态码与错误码对照

| HTTP | code | 触发场景 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | body/query/path 参数校验失败 |
| 400 | INVALID_UUID | UUID 路径参数格式错误 |
| 401 | UNAUTHORIZED | 缺失/无效 JWT |
| 401 | INVALID_CREDENTIALS | 登录用户名或密码错误（不区分用户是否存在，防止账号枚举） |
| 401 | TOKEN_EXPIRED | 令牌过期（归入 401，消息提示重新登录） |
| 403 | FORBIDDEN | 角色/权限不足、跨科室访问 |
| 404 | NOT_FOUND | 资源或路由不存在 |
| 409 | CONFLICT | 唯一约束冲突（用户名重复、科室编码重复、排班冲突） |
| 500 | INTERNAL_ERROR | 未预期的服务端错误（响应不回传内部细节） |

## 4. 抛错方式

业务代码统一抛 `AppError` 或其子类：

```ts
throw new NotFoundError('用户');
throw new ConflictError('用户名 doctor1 已存在');
throw new ForbiddenError('只能访问本科室的数据');
```

数据库 `23505 unique_violation` 用 `isPgUniqueViolation(err)` 判断后转换为 409，
禁止直接把 pg 原始错误透传给客户端。
