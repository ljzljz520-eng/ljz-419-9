-- V1: 科室资料表
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT NULL,
    location        VARCHAR(200) NULL,
    contact_phone   VARCHAR(30)  NULL,
    head_doctor_id  UUID NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_departments_code UNIQUE (code),
    CONSTRAINT ck_departments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

COMMENT ON TABLE departments IS '科室资料';
COMMENT ON COLUMN departments.head_doctor_id IS '科室主任对应的账号服务用户 ID';

CREATE INDEX idx_departments_status ON departments (status);

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
