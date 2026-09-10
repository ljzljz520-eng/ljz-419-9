import { useMemo } from 'react';
import { Layout, Menu, Button, Tag, Space, Typography } from 'antd';
import {
  UserOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../types';

const ROLE_TAG_COLOR = { ADMIN: 'red', DOCTOR: 'blue', NURSE: 'green' } as const;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = useMemo(() => {
    const menu = [
      { key: '/departments', icon: <ApartmentOutlined />, label: <Link to="/departments">科室列表</Link> }
    ];
    if (user?.role === 'ADMIN') {
      menu.unshift({
        key: '/users',
        icon: <UserOutlined />,
        label: <Link to="/users">用户管理</Link>
      });
    }
    if (user?.departmentId && user.role !== 'ADMIN') {
      menu.push({
        key: `/departments/${user.departmentId}`,
        icon: <ScheduleOutlined />,
        label: <Link to={`/departments/${user.departmentId}`}>本科室详情</Link>
      });
    }
    return menu;
  }, [user]);

  const selectedKey =
    location.pathname.startsWith('/users') && user?.role === 'ADMIN'
      ? '/users'
      : location.pathname.startsWith('/departments')
        ? location.pathname.startsWith('/departments') && items.some((i) => location.pathname.startsWith(i.key) && i.key !== '/departments')
          ? items.filter((i) => i.key !== '/departments').find((i) => location.pathname.startsWith(i.key))?.key ?? '/departments'
          : '/departments'
        : undefined;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          paddingInline: 24
        }}
      >
        <Space size="large">
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            医院科室账号门户
          </Typography.Title>
          <Menu theme="dark" mode="horizontal" selectedKeys={selectedKey ? [selectedKey] : []} items={items} />
        </Space>
        <Space>
          {user && (
            <>
              <span style={{ color: '#fff' }}>{user.fullName}</span>
              <Tag color={ROLE_TAG_COLOR[user.role]}>{ROLE_LABELS[user.role]}</Tag>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                style={{ color: '#fff' }}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                退出
              </Button>
            </>
          )}
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
