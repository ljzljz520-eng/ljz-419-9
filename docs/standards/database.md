# 数据库与迁移规范

## 1. 服务与数据库隔离

- account-service 与 department-service 使用**各自独立的 PostgreSQL 数据库**：
  `account_service`、`department_service`（见 `docker/postgres/init/01-create-databases.sql`）。
- 服务间不做跨库 JOIN，外键只引用本库表。科室服务中 `head_doctor_id`、值班表的
  `staff_id` 是账号服务用户 ID 的**软引用**，不建物理外键；用户表的
  `department_id` 同理。
- 连接通过环境变量注入，禁止硬编码：服务级 `.env` 或显式注入使用通用名
  `DATABASE_URL`；monorepo 根 `.env` 统一注入时按服务区分，使用
  `ACCOUNT_DATABASE_URL` / `DEPARTMENT_DATABASE_URL`。连接串缺失时必须立即报错，
  禁止静默回退到 `localhost:5432` 默认值。

## 2. 迁移文件

每个迁移由一对 SQL 组成，放在服务的 `migrations/` 目录：

```
V1__create_users.up.sql
V1__create_users.down.sql
V2__create_duty_schedules.up.sql
V2__create_duty_schedules.down.sql
```

- 命名：`V<递增序号>__<小写下划线描述>.(up|down).sql`。
- 每个迁移在一个事务内执行，成功后在 `schema_migrations(version, name, applied_at)` 记录。
- 必须同时提供 up 与 down，down 负责按相反顺序撤销对象。
- 只能通过迁移变更表结构，禁止在业务代码里执行 DDL；迁移一旦合入主分支即不可修改，只能新增迁移。
- 运行：`npm run migrate:account` / `npm run migrate:department`，
  回滚最近一个版本：服务目录下 `npm run migrate:rollback`。

## 3. 表设计约定

- 主键：`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`。
- 时间：`created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`、`updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`。
- `updated_at` 由 `set_updated_at()` 触发器自动维护（各库自建）。
- 枚举语义用 `VARCHAR + CHECK CONSTRAINT`（如 `ck_users_role`）。
- 唯一性用显式约束：`uq_users_username`、`uq_departments_code`、
  `uq_duty_department_date_shift`（同一科室同一天同一班次仅一人值班）、
  `uq_duty_assignment`（同一人不在同科室同日同班次重复排班）。
- 常用过滤列建索引：`role`、`department_id`、`status`、`(department_id, duty_date)`。
- 每个表/关键列写 `COMMENT` 说明业务含义与跨服务引用关系。
- 命名：表/列 `snake_case`；约束前缀 `pk_/uq_/ck_`，索引前缀 `idx_/uq_`，触发器前缀 `trg_`。

## 4. 种子数据

- 种子脚本幂等（`ON CONFLICT DO NOTHING`），仅用于本地开发。
- 固定 UUID 保证两个库种子数据可对应（如内科 `...0001`、李医生 `...0101`）。
- 示例账号：`admin / doctor1 / nurse1`，初始密码均为 `Password123`。
