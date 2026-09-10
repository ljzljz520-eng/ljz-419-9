import { useCallback, useEffect, useState } from 'react';
import {
  Button,
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
import { ApiError, departmentsApi, usersApi } from '../api/client';
import type { AuthUser, Department, Role } from '../types';
import { ROLE_LABELS } from '../types';

interface UserFormValues {
  username?: string;
  password?: string;
  fullName: string;
  role: Role;
  departmentId: string | null;
  status?: 'ACTIVE' | 'DISABLED';
}

const ROLE_TAG_COLOR: Record<Role, string> = { ADMIN: 'red', DOCTOR: 'blue', NURSE: 'green' };

export function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<UserFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.list({ page, pageSize, role: roleFilter });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : '加载用户失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, messageApi]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartments)
      .catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: 'DOCTOR', departmentId: null });
    setModalOpen(true);
  };

  const openEdit = (record: AuthUser) => {
    setEditing(record);
    form.setFieldsValue({
      fullName: record.fullName,
      role: record.role,
      departmentId: record.departmentId,
      status: record.status
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          fullName: values.fullName,
          role: values.role,
          departmentId: values.departmentId,
          status: values.status
        };
        if (values.password) payload.password = values.password;
        await usersApi.update(editing.id, payload);
        messageApi.success('用户已更新');
      } else {
        await usersApi.create(values as unknown as Record<string, unknown>);
        messageApi.success('用户已创建');
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

  const handleDelete = async (record: AuthUser) => {
    try {
      await usersApi.remove(record.id);
      messageApi.success('用户已删除');
      void load();
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : '删除失败');
    }
  };

  const departmentName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? id.slice(0, 8) : '—';

  const columns: ColumnsType<AuthUser> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'fullName' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: Role) => <Tag color={ROLE_TAG_COLOR[role]}>{ROLE_LABELS[role]}</Tag>
    },
    { title: '所属科室', dataIndex: 'departmentId', render: departmentName },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (status === 'ACTIVE' ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该用户？" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      {contextHolder}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Select
          allowClear
          placeholder="按角色筛选"
          style={{ width: 160 }}
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <Button type="primary" onClick={openCreate}>
          新建用户
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={users}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          }
        }}
      />
      <Modal
        title={editing ? `编辑用户：${editing.username}` : '新建用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
                <Input placeholder="3-50 位字母、数字、_ . -" />
              </Form.Item>
              <Form.Item
                name="password"
                label="初始密码"
                rules={[{ required: true, min: 8, message: '密码至少 8 个字符' }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          {editing && (
            <Form.Item name="password" label="重置密码（留空表示不修改）" rules={[{ min: 8, message: '密码至少 8 个字符' }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          )}
          <Form.Item name="fullName" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            />
          </Form.Item>
          <Form.Item name="departmentId" label="所属科室">
            <Select
              allowClear
              placeholder="不归属科室（管理员）"
              options={departments.map((d) => ({ value: d.id, label: `${d.name}（${d.code}）` }))}
            />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 'ACTIVE', label: '启用' },
                  { value: 'DISABLED', label: '停用' }
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
