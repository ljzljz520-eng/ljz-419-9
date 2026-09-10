import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './AuthContext';
import type { Role } from '../types';
import type { ReactNode } from 'react';

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
        <Spin size="large" tip="正在校验登录状态…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
