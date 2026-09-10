import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApiError, departmentsApi } from '../api/client';
import type { Department } from '../types';
import { useAuth } from '../auth/AuthContext';

interface DepartmentFormValues {
  code: string;
  name: string;
  description?: string | null;
  location?: string | null;
  contactPhone?: string | null;
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<DepartmentFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async (kw = keyword) => {
    setLoading(true);
    try {
      setDepartments(await departmentsApi.list(kw || undefined));
    } catch (err) {
      messageApi.error(err instanceof ApiError ? err.message : '加载科室失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await departmentsApi.create(values as unknown as Record<string, unknown>);
      messageApi.success('科室已创建');
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

  return (
    <>
      {contextHolder}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Input.Search
          placeholder="按科室名称或编码搜索"
          allowClear
          style={{ width: 300 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(v) => void load(v)}
        />
        {user?.role === 'ADMIN' && (
          <Button
            type="primary"
            onClick={() => {
              form.resetFields();
              setModalOpen(true);
            }}
          >
            新建科室
          </Button>
        )}
      </Space>
      <Row gutter={[16, 16]}>
        {departments.map((dept) => (
          <Col xs={24} sm={12} lg={8} key={dept.id}>
            <Card
              loading={loading}
              hoverable
              title={
                <Space>
                  {dept.name}
                  <Tag>{dept.code}</Tag>
                </Space>
              }
              extra={dept.status === 'ACTIVE' ? <Tag color="green">运营中</Tag> : <Tag>已停诊</Tag>}
              onClick={() => navigate(`/departments/${dept.id}`)}
            >
              <p style={{ minHeight: 44, color: '#666' }}>{dept.description ?? '暂无简介'}</p>
              <p>📍 {dept.location ?? '未填写'}</p>
              <p>📞 {dept.contactPhone ?? '未填写'}</p>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal
        title="新建科室"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="科室编码" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="如 INTERNAL" />
          </Form.Item>
          <Form.Item name="name" label="科室名称" rules={[{ required: true }]}>
            <Input placeholder="如 内科" />
          </Form.Item>
          <Form.Item name="description" label="科室简介">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="如 门诊楼 3 层" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="如 010-88880001" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
