import { Button, Card, Form, Input } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

interface LoginForm {
  username: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<LoginForm>();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onFinish = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败，请稍后重试';
      form.setFields([{ name: 'password', errors: [message] }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="医院科室账号门户 · 登录" style={{ width: 400 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ username: '', password: '' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="admin / doctor1 / nurse1" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="Password123" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
