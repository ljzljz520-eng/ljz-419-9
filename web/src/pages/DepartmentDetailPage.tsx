import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ApiError,
  departmentsApi,
  schedulesApi,
  usersApi
} from '../api/client';
import type { AuthUser, Department, DutySchedule, Shift } from '../types';
import { ROLE_LABELS, SHIFT_LABELS } from '../types';
import { useAuth } from '../auth/AuthContext';

interface ScheduleFormValues {
  staffId: string;
  dutyDate: Dayjs;
  shift: Shift;
  note?: string | null;
}

const SHIFT_TAG_COLOR: Record<Shift, string> = {
  MORNING: 'gold',
  AFTERNOON: 'blue',
  NIGHT: 'purple'
};

export function DepartmentDetailPage() {
  const { departmentId = '' } = useParams();
  const { user } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [staff, setStaff] = useState<AuthUser[]>([]);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DutySchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ScheduleFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const canManage = user?.role === 'ADMIN' || (user !== null && user.departmentId === departmentId);
  // 仅 ADMIN 拥有 schedule:manage；医生/护士只读
  const canEditSchedule = user?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dept, list] = await Promise.all([
        departmentsApi.getById(departmentId),
        schedulesApi.list(departmentId, {
          dateFrom: range?.[0]?.format('YYYY-MM-DD'),
          dateTo: range?.[1]?.format('YYYY-MM-DD')
        })
      ]);
      setDepartment(dept);
      setSchedules(list);
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : '加载科室详情失败');
    } finally {
      setLoading(false);
    }
  }, [departmentId, range, messageApi]);

  useEffect(() => {
    void load();
  }, [load]);

  // 管理员排班时从账号服务拉取本科室医生/护士
  useEffect(() => {
    if (!canEditSchedule) return;
    usersApi
      .list({ departmentId, pageSize: 100 })
      .then((data) => setStaff(data.items.filter((u) => u.role !== 'ADMIN')))
      .catch(() => undefined);
  }, [canEditSchedule, departmentId]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ dutyDate: dayjs(), shift: 'MORNING' });
    setModalOpen(true);
  };

  const openEdit = (record: DutySchedule) => {
    setEditing(record);
    form.setFieldsValue({
      staffId: record.staffId,
      dutyDate: dayjs(record.dutyDate),
      shift: record.shift,
      note: record.note ?? undefined
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      staffId: values.staffId,
      staffName: staff.find((s) => s.id === values.staffId)?.fullName ?? editing?.staffName ?? '',
      dutyDate: values.dutyDate.format('YYYY-MM-DD'),
      shift: values.shift,
      note: values.note ?? null
    };
    setSaving(true);
    try {
      if (editing) {
        await schedulesApi.update(departmentId, editing.id, payload);
        messageApi.success('值班安排已更新');
      } else {
        await schedulesApi.create(departmentId, payload);
        messageApi.success('值班安排已创建');
      }
      setModalOpen(false);
      void load();
    } catch (err) {
      if (err instanceof ApiError) {
        messageApi.error(err.details?.map((d) => `${d.field ?? ''} ${d.message}`).join('；') || err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: DutySchedule) => {
    try {
      await schedulesApi.remove(departmentId, record.id);
      messageApi.success('值班安排已删除');
      void load();
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : '删除失败');
    }
  };

  const columns: ColumnsType<DutySchedule> = [
    { title: '值班日期', dataIndex: 'dutyDate', width: 130 },
    {
      title: '班次',
      dataIndex: 'shift',
      width: 100,
      render: (shift: Shift) => <Tag color={SHIFT_TAG_COLOR[shift]}>{SHIFT_LABELS[shift]}</Tag>
    },
    { title: '值班人员', dataIndex: 'staffName' },
    { title: '备注', dataIndex: 'note', render: (note: string | null) => note ?? '—' },
    ...(canEditSchedule
      ? [
          {
            title: '操作',
            key: 'actions',
            width: 140,
            render: (_: unknown, record: DutySchedule) => (
              <Space>
                <Button size="small" onClick={() => openEdit(record)}>
                  编辑
                </Button>
                <Popconfirm title="确认删除该值班安排？" onConfirm={() => handleDelete(record)}>
                  <Button size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            )
          }
        ]
      : [])
  ];

  return (
    <>
      {contextHolder}
      <Card title="科室资料" style={{ marginBottom: 16 }} loading={loading && !department}>
        {department && (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="科室名称">{department.name}</Descriptions.Item>
            <Descriptions.Item label="科室编码">{department.code}</Descriptions.Item>
            <Descriptions.Item label="位置">{department.location ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{department.contactPhone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              {department.status === 'ACTIVE' ? <Tag color="green">运营中</Tag> : <Tag>已停诊</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="简介" span={2}>
              {department.description ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        title="值班信息"
        extra={
          <Space>
            <DatePicker.RangePicker
              value={range ?? undefined}
              onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
            />
            {canEditSchedule && (
              <Button type="primary" onClick={openCreate}>
                新增值班
              </Button>
            )}
            {!canEditSchedule && canManage && (
              <Tag color="default">本科室仅可查看（{user ? ROLE_LABELS[user.role] : ''}）</Tag>
            )}
          </Space>
        }
      >
        <Table rowKey="id" loading={loading} columns={columns} dataSource={schedules} pagination={false} />
      </Card>

      <Modal
        title={editing ? '编辑值班安排' : '新增值班安排'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="staffId" label="值班人员" rules={[{ required: true, message: '请选择值班人员' }]}>
            <Select
              showSearch
              placeholder="选择本科室医生/护士"
              optionFilterProp="label"
              options={staff.map((s) => ({
                value: s.id,
                label: `${s.fullName}（${ROLE_LABELS[s.role]}）`
              }))}
            />
          </Form.Item>
          <Form.Item name="dutyDate" label="值班日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shift" label="班次" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(SHIFT_LABELS) as Shift[]).map((s) => ({
                value: s,
                label: SHIFT_LABELS[s]
              }))}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
