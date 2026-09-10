# API 文档与接口设计规范

## 1. 基本约定

- REST 风格，统一前缀 `/api/v1`；版本号通过路径前缀演进。
- 请求/响应一律 `application/json; charset=utf-8`。
- 路径名词使用复数：`/users`、`/departments`、`/departments/{id}/schedules`。
- 值班信息嵌套在科室下，体现归属关系并便于做数据范围校验。
- 时间字段统一 ISO8601；值班日期等纯日期字段使用 `YYYY-MM-DD`。
- 主键统一 PostgreSQL `uuid`，对外即 UUID 字符串。
- 枚举值一律大写英文：角色 `ADMIN/DOCTOR/NURSE`、班次 `MORNING/AFTERNOON/NIGHT`、状态 `ACTIVE/DISABLED/INACTIVE`。

## 2. HTTP 方法语义

| 方法 | 语义 | 返回 |
| --- | --- | --- ---
| GET | 查询（列表/详情），安全幂等 | 200 |
| POST | 创建 | 201 + 新资源 |
| PATCH | 局部更新（至少一个字段） | 200 |
| DELETE | 删除 | 200 + `{ id, deleted: true }` |

## 3. 认证与权限

- 登录：`POST /api/v1/auth/login`，返回 `accessToken`（JWT）。
- 之后所有受保护接口携带 `Authorization: Bearer <token>`。
- JWT claims：`sub`(用户 ID)、`username`、`role`、`departmentId`、`exp`。
- 科室服务不签发令牌，只校验账号服务签发的 JWT（两个服务配置相同 `JWT_SECRET`，生产建议演进为 JWKS）。

### RBAC 矩阵

| 权限 | ADMIN | DOCTOR | NURSE |
| --- | --- | --- | --- |
| user:read（用户列表/详情） | ✔ | ✔ | ✔ |
| user:manage（增/改/删用户） | ✔ | – | – |
| department:read | ✔ | ✔ | ✔ |
| department:manage | ✔ | – | – |
| schedule:read（全部科室） | ✔ | – | – |
| schedule:read:department（本科室） | – | ✔ | ✔ |
| schedule:manage | ✔ | – | – |

> DOCTOR / NURSE 的 `schedule:read` 由共享包按角色授予，再由
> `restrictToOwnDepartment` 中间件把科室路径参数限制为本人 `departmentId`。

## 4. 查询参数

- 分页：`page`（从 1 开始）、`pageSize`（1–100，默认 20）。
- 筛选：`role`、`departmentId`、`status`、`keyword`、`dateFrom`、`dateTo`。
- 非法参数（含类型可转换但非法）统一由 Zod 校验，返回 400 VALIDATION_ERROR。

## 5. 文档位置

- 账号服务：`docs/openapi/account-service.yaml`（OpenAPI 3.0.3）
- 科室服务：`docs/openapi/department-service.yaml`
- 可用 Swagger Editor / `redocly lint` 打开校验；新增接口必须同步更新 OpenAPI 文件。

## 6. 前端代理映射

开发环境下 Vite 代理避免跨域：

| 前端请求 | 转发到 |
| --- | --- |
| `/api/account/**` | `http://localhost:3001/api/v1/**` |
| `/api/department/**` | `http://localhost:3002/api/v1/**` |
