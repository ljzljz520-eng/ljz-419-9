-- V1: 账号服务用户表（医生 / 护士 / 管理员）
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    department_id   UUID NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE')),
    CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);

COMMENT ON TABLE users IS '账号服务：医生、护士、管理员账号';
COMMENT ON COLUMN users.department_id IS '所属科室 UUID，由 department-service 维护，管理员可为 NULL';

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_department_id ON users (department_id);
CREATE INDEX idx_users_status ON users (status);

-- 统一的 updated_at 自动刷新触发器
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
