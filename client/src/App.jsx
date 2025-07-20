import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

// Shared
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Departments from './pages/admin/Departments';
import AllocateFunds from './pages/admin/AllocateFunds';
import Reports from './pages/admin/Reports';
import DepartmentDetails from './pages/admin/DepartmentDetails';
import AdminTransactions from './pages/admin/Transactions';

// HOD Pages
import HoDDashboard from './pages/hod/HoDDashboard';
import Transactions from './pages/hod/Transactions';
import CoordinatorRegister from './pages/hod/CoordinatorRegister';
import VerifyBills from './pages/hod/VerifyBills';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import CoordinatorUploadBill from './pages/coordinator/UploadBill';
import CoordinatorTransactions from './pages/coordinator/Transactions';

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Departments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DepartmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/allocate"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AllocateFunds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bills"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <VerifyBills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTransactions />
            </ProtectedRoute>
          }
        />

        {/* HOD Routes */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HoDDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/verify-bills"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <VerifyBills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/transactions"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/register-coordinator"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <CoordinatorRegister />
            </ProtectedRoute>
          }
        />
        {/* Analytics route removed */}

        {/* Coordinator Routes */}
        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/upload"
          element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CoordinatorUploadBill />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/transactions"
          element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CoordinatorTransactions />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<div className="p-6 text-center text-xl">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
