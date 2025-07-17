
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import { PageLoader } from '../components/common/PageLoader.jsx';
import RoleProtectedRoute from '@/appGuards/RoleProtectedRoute';

// Lazy-loaded components
const Dashboard = React.lazy(() => import('../pages/dashboard/ProviderDashboard.jsx'));
const Patients = React.lazy(() => import('../pages/patients/Patients.jsx'));
const PatientDetail = React.lazy(() => import('../pages/patients/PatientDetailOptimized.jsx'));
const Sessions = React.lazy(() => import('../pages/sessions/Sessions.jsx'));
const EditSessionPage = React.lazy(() => import('../pages/sessions/[id]/page.tsx'));
const Orders = React.lazy(() => import('../pages/orders/Orders.jsx'));
const Invoices = React.lazy(() => import('../pages/invoices/InvoicePage.jsx'));
const Tasks = React.lazy(() => import('../pages/tasks/TaskManagement.jsx'));
const Messages = React.lazy(() => import('../pages/messaging/MessagingPage.jsx'));
const Settings = React.lazy(() => import('../pages/settings/Settings.jsx'));
const AuditLog = React.lazy(() => import('../pages/dashboard/admin/audit-log/page.tsx'));
const Providers = React.lazy(() => import('../pages/dashboard/admin/providers/page.tsx'));
const Pharmacies = React.lazy(() => import('../pages/dashboard/admin/pharmacies/page.tsx'));
const Discounts = React.lazy(() => import('../pages/dashboard/admin/discounts/page.tsx'));
const Tags = React.lazy(() => import('../pages/admin/TagManagement.jsx'));
const Products = React.lazy(() => import('../pages/dashboard/admin/products/page.tsx'));
const Resources = React.lazy(() => import('../pages/dashboard/admin/resources/page.tsx'));
const Insurance = React.lazy(() => import('../pages/dashboard/insurance/page.tsx'));
const Calendar = React.lazy(() => import('../pages/dashboard/calendar/page.tsx'));

// Auth Pages (can be loaded eagerly or lazy)
import Login from '../pages/auth/Login.jsx';
import Signup from '../pages/auth/Signup.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import ConfirmEmail from '../pages/auth/ConfirmEmail.jsx';

// Public Pages
import FormViewer from '../pages/forms/FormViewer.jsx';
import ModernIntakeFormPage from '../pages/intake/ModernIntakeFormPage.jsx';

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader message="Loading page..." />}>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        
        {/* Public Form Routes */}
        <Route path="/public/forms/:formId" element={<FormViewer />} />
        <Route path="/public/intake/:category" element={<ModernIntakeFormPage />} />
        <Route path="/public/intake" element={<ModernIntakeFormPage />} />

        {/* Core Authenticated Routes */}
        <Route path="/" element={<MainLayout><Navigate to="/dashboard" replace /></MainLayout>} />
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        
        {/* Admin & Provider Routes */}
        <Route path="/patients" element={<MainLayout><Patients /></MainLayout>} />
        <Route path="/patients/:id/*" element={<MainLayout><PatientDetail /></MainLayout>} />
        <Route path="/sessions" element={<MainLayout><Sessions /></MainLayout>} />
        <Route path="/sessions/:id" element={<MainLayout><EditSessionPage /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
        <Route path="/invoices" element={<MainLayout><Invoices /></MainLayout>} />
        <Route path="/tasks" element={<MainLayout><Tasks /></MainLayout>} />
        <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><Calendar /></MainLayout>} />
        <Route path="/insurance" element={<MainLayout><Insurance /></MainLayout>} />

        {/* Admin-only Routes */}
        <Route path="/admin/audit-log" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><AuditLog /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/providers" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Providers /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/pharmacies" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Pharmacies /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/discounts" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Discounts /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/tags" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Tags /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/products" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Products /></MainLayout></RoleProtectedRoute>} />
        <Route path="/admin/resources" element={<RoleProtectedRoute allowedRoles={['admin']}><MainLayout><Resources /></MainLayout></RoleProtectedRoute>} />
        
        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
