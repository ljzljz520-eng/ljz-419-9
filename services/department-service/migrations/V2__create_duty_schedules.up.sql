-- V2: 值班信息表（依赖 set_updated_at 函数，需在本迁移内保证存在）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE duty_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
    staff_id        UUID NOT NULL,
    staff_name      VARCHAR(100) NOT NULL,
    duty_date       DATE NOT NULL,
    shift           VARCHAR(20) NOT NULL,
    note            TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_duty_shift CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT')),
    CONSTRAINT uq_duty_assignment UNIQUE (department_id, staff_id, duty_date, shift)
);

COMMENT ON TABLE duty_schedules IS '科室值班信息';
COMMENT ON COLUMN duty_schedules.staff_id IS '值班人员账号服务用户 ID';

-- 同一科室同一天同一班次只安排一名值班人员
CREATE UNIQUE INDEX uq_duty_department_date_shift
    ON duty_schedules (department_id, duty_date, shift);
CREATE INDEX idx_duty_department_date ON duty_schedules (department_id, duty_date);
CREATE INDEX idx_duty_staff ON duty_schedules (staff_id);

CREATE TRIGGER trg_duty_schedules_updated_at
    BEFORE UPDATE ON duty_schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
