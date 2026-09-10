# 医院科室账号门户

面向医院内部的科室账号门户，包含三个组件：

| 组件 | 目录 | 职责 | 默认端口 |
| --- | --- | --- | --- |
| account-service | `services/account-service` | 医生/护士/管理员账号、RBAC 权限、登录与 JWT 签发 | 3001 |
| department-service | `services/department-service` | 科室资料、值班排班；校验 JWT、限制跨科室访问 | 3002 |
| web | `web` | React 门户：登录、用户管理（管理员）、科室详情与值班表 | 5173 |
| 共享包 | `packages/common` | 统一错误响应、结构化日志、鉴权、响应信封、迁移运行器 | – |

## 技术栈

Node.js 20 + TypeScript（NodeNext ESM）+ Express + pg + Zod + Pino；
PostgreSQL 16（账号库与科室库物理隔离）；
React 18 + Vite + Ant Design 5 + Axios + React Router。

## 快速开始

```bash
# 1. 安装依赖（会自动构建 @hospital/common）
npm install

# 2. 启动 PostgreSQL（自动创建 account_service / department_service 两个库）
docker compose up -d

# 3. 准备环境变量（复制根目录样例即可，两个服务会自动读取；
#    也可按需再复制各服务的 .env.example 做服务级覆盖）
cp .env.example .env
# 确保两个服务的 JWT_SECRET 一致

# 4. 数据库迁移 + 种子数据
npm run migrate:account && npm run seed:account
npm run migrate:department && npm run seed:department

# 5. 启动（三个终端）
npm run dev:account
npm run dev:department
npm run dev:web
```

打开 http://localhost:5173 ，种子账号（密码均为 `Password123`）：

| 用户名 | 角色 | 可见能力 |
| --- | --- | --- |
| admin | 管理员 | 用户增删改查、科室管理、值班排班 |
| doctor1 | 医生（内科） | 查看全部科室列表、查看本科室详情与值班表 |
| nurse1 | 护士（内科） | 同医生（只读） |

## 权限模型

JWT 中携带 `sub / username / role / departmentId`。科室服务用相同密钥验签后：

- ADMIN：全部数据；
- DOCTOR / NURSE：科室列表可见，但单个科室、值班表只能访问自己所属科室（403 FORBIDDEN）；
- 用户管理仅 ADMIN 可写。

## 统一规范

- 错误响应：[`docs/standards/api-errors.md`](docs/standards/api-errors.md)
- 日志字段：[`docs/standards/logging.md`](docs/standards/logging.md)
- API 设计/文档：[`docs/standards/api-design.md`](docs/standards/api-design.md)
- 数据库迁移：[`docs/standards/database.md`](docs/standards/database.md)
- OpenAPI：[`docs/openapi/account-service.yaml`](docs/openapi/account-service.yaml)、
  [`docs/openapi/department-service.yaml`](docs/openapi/department-service.yaml)

成功统一信封 `{ "success": true, "data": ... }`；错误统一信封
`{ "success": false, "error": { code, message, details? }, requestId }`。

## 常用脚本

```bash
npm run build:common       # 构建共享包（服务构建前必须先构建）
npm run build              # 构建共享包 + 两个服务 + 前端
npm run typecheck:services # 两个服务类型检查
npm run migrate:account    # 应用账号库迁移（--rollback 回滚最近一版需在服务目录执行）
npm run migrate:department
npm run seed:account       # 写入开发用种子数据（幂等）
npm run seed:department
```

## 生产注意事项

- `JWT_SECRET` 通过密钥管理系统注入，两个服务保持一致；后续建议升级为 JWKS 公私钥分离。
- 服务仅通过环境变量获取数据库连接串与密钥；日志自动脱敏 password / token / authorization。
- CORS 当前放开所有来源，生产环境应按门户域名收敛。
