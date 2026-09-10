import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { DepartmentDetailPage } from './pages/DepartmentDetailPage';
import { RequireAuth } from './auth/RequireAuth';
import { AuthProvider } from './auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/departments" replace />} />
            <Route
              path="/users"
              element={
                <RequireAuth roles={['ADMIN']}>
                  <UsersPage />
                </RequireAuth>
              }
            />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:departmentId" element={<DepartmentDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
