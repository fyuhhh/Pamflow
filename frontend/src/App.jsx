import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import MobileLogin from './components/MobileLogin';
import Dashboard from './components/Dashboard';
import AdminList from './components/AdminList';
import AdminForm from './components/AdminForm';
import AdminDetail from './components/AdminDetail';
import AgenList from './components/AgenList';
import AgenForm from './components/AgenForm';
import BuatTugas from './components/BuatTugas';
import UploadTugas from './components/UploadTugas';
import DraftList from './components/DraftList';
import TaskDetail from './components/TaskDetail';
import RingkasanList from './components/RingkasanList';
import PersetujuanList from './components/PersetujuanList';
import BuatTugasDepartemen from './components/BuatTugasDepartemen';
import TerkirimList from './components/TerkirimList';
import TerkirimDetail from './components/TerkirimDetail';
import ChangePassword from './components/ChangePassword';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import DepartemenList from './components/DepartemenList';
import DepartemenForm from './components/DepartemenForm';
import DepartemenDetail from './components/DepartemenDetail';
import Organisasi from './components/Organisasi';
import TemplateList from './components/TemplateList';
import TemplateForm from './components/TemplateForm';
import TemplateDetail from './components/TemplateDetail';
import MobileDemo from './components/MobileDemo';
import Profile from './components/Profile';
import DiterimaList from './components/DiterimaList';
import DiterimaDetail from './components/DiterimaDetail';
import HakAkses from './components/HakAkses';
import BuatHakAkses from './components/BuatHakAkses';
import OfflineIndicator from './components/OfflineIndicator';
import OfflineSyncManager from './components/OfflineSyncManager';
import { subscribeToPushNotifications } from './services/pushService';
import { initSocket, disconnectSocket } from './services/socket';
import { hasPermission } from './utils/permissions';
import { ModalProvider } from './context/ModalContext';
import AuditLog from './components/AuditLog';
import PasswordResetRequests from './components/PasswordResetRequests';
import RelasiDepartemen from './components/RelasiDepartemen';
import ChecklistHarian from './components/ChecklistHarian';
import { trackPageView, trackLogout } from './services/activityTracker';

import DashboardHome from './components/DashboardHome';

const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth <= 768;
};

// Headless component that logs every route change to the audit system
// Must be inside <Router> context to use useLocation
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};


function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  // Listen for changes in localStorage from same-tab custom events
  useEffect(() => {
    const handleAuthChange = () => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      setUser(currentUser);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleAuthChange);

    if (user) {
      subscribeToPushNotifications(user.id, true);
      initSocket(user);
    } else {
      disconnectSocket();
    }

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [user]);

  const login = (userData, token, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    setUser(userData);
    window.dispatchEvent(new Event('auth-change'));
  };

  const logout = async () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email : 'Unknown';
    await trackLogout(userName);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const checkPermission = (moduleId, action = 'Lihat') => {
    return hasPermission(user, moduleId, action);
  };

  const getDefaultRoute = (user) => {
    if (!user) return '/';
    if (user.userType === 'agen') return '/demo/mobile';

    const isSuperAdmin = user.role?.toLowerCase() === 'super admin';
    if (isSuperAdmin) return '/dashboard';

    const permissions = user.permissions || {};

    const moduleRoutes = [
      { id: 'dashboard', path: '/dashboard' },
      { id: 'admin', path: '/pengguna/admin' },
      { id: 'agent', path: '/pengguna/agen' },
      { id: 'tugas_agen_ringkasan', path: '/tugas-agen/ringkasan' },
      { id: 'tugas_agen_persetujuan', path: '/tugas-agen/persetujuan' },
      { id: 'tugas_dept_terkirim', path: '/tugas-departemen/terkirim' },
      { id: 'tugas_dept_diterima', path: '/tugas-departemen/diterima' },
      { id: 'organisasi', path: '/pengaturan/organisasi' },
      { id: 'perusahaan', path: '/pengaturan/perusahaan' },
      { id: 'departemen', path: '/pengaturan/departemen' },
      { id: 'hak_akses', path: '/pengaturan/hak-akses' },
      { id: 'template_tugas', path: '/pengaturan/template-tugas' }
    ];

    for (const mod of moduleRoutes) {
      if (permissions[mod.id] && permissions[mod.id].includes('Lihat')) {
        return mod.path;
      }
    }

    return '/profile/user';
  };

  const PrivateRoute = ({ children, moduleId, action = 'Lihat' }) => {
    if (!user) return <Navigate to="/" replace />;

    // Always enforce permission check if moduleId is provided
    if (moduleId) {
      if (!checkPermission(moduleId, action)) {
        return <Navigate to={getDefaultRoute(user)} replace />;
      }
    }

    return children;
  };

  return (
    <Router>
      <ModalProvider>
        <RouteTracker />
        <OfflineIndicator />
        <OfflineSyncManager />
        <Routes>
          {/* Public / Root Route */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={getDefaultRoute(user)} replace />
              ) : (
                isMobileDevice() ? <MobileLogin onLogin={login} /> : <Login onLogin={login} />
              )
            }
          />

          {/* Protected Routes - only accessible if user exists */}
          {user ? (
            <>
              {/* Desktop Dashboard Routes */}
              <Route path="/dashboard" element={<PrivateRoute moduleId="dashboard"><Dashboard onLogout={logout}><DashboardHome /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/admin" element={<PrivateRoute moduleId="admin"><Dashboard onLogout={logout}><AdminList /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/admin/create" element={<PrivateRoute moduleId="admin" action="Buat"><Dashboard onLogout={logout}><AdminForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/admin/edit/:id" element={<PrivateRoute moduleId="admin" action="Edit"><Dashboard onLogout={logout}><AdminForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/admin/detail/:id" element={<PrivateRoute moduleId="admin"><Dashboard onLogout={logout}><AdminDetail /></Dashboard></PrivateRoute>} />

              <Route path="/pengguna/agen" element={<PrivateRoute moduleId="agent"><Dashboard onLogout={logout}><AgenList /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/agen/create" element={<PrivateRoute moduleId="agent" action="Buat"><Dashboard onLogout={logout}><AgenForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/agen/edit/:id" element={<PrivateRoute moduleId="agent" action="Edit"><Dashboard onLogout={logout}><AgenForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengguna/agen/detail/:id" element={<PrivateRoute moduleId="agent"><Dashboard onLogout={logout}><AdminDetail /></Dashboard></PrivateRoute>} />

              <Route path="/tugas-agen/buat" element={<PrivateRoute moduleId="tugas_agen_buat_checklist"><Dashboard onLogout={logout}><BuatTugas key="buat-checklist" taskType="checklist" /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/buat-wo" element={<PrivateRoute moduleId="tugas_agen_buat_wo"><Dashboard onLogout={logout}><BuatTugas key="buat-wo" taskType="wo" /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/edit/:taskId" element={<PrivateRoute moduleId="tugas_agen_ringkasan" action="Edit"><Dashboard onLogout={logout}><BuatTugas key="edit-checklist" taskType="checklist" /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/upload" element={<PrivateRoute moduleId="tugas_agen_upload"><Dashboard onLogout={logout}><UploadTugas /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/draf" element={<PrivateRoute moduleId="tugas_agen_draf"><Dashboard onLogout={logout}><DraftList /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/detail/:taskId" element={<PrivateRoute moduleId="tugas_agen_ringkasan"><Dashboard onLogout={logout}><TaskDetail /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/ringkasan" element={<PrivateRoute moduleId="tugas_agen_ringkasan"><Dashboard onLogout={logout}><RingkasanList /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-agen/persetujuan" element={<PrivateRoute moduleId="tugas_agen_persetujuan"><Dashboard onLogout={logout}><PersetujuanList /></Dashboard></PrivateRoute>} />

              <Route path="/tugas-departemen/buat" element={<PrivateRoute moduleId="tugas_dept_buat_checklist"><Dashboard onLogout={logout}><BuatTugasDepartemen key="buat-checklist-dept" taskType="checklist" /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/buat-wo" element={<PrivateRoute moduleId="tugas_dept_buat_wo"><Dashboard onLogout={logout}><BuatTugasDepartemen key="buat-wo-dept" taskType="wo" /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/diterima" element={<PrivateRoute moduleId="tugas_dept_diterima"><Dashboard onLogout={logout}><DiterimaList /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/diterima/:id" element={<PrivateRoute moduleId="tugas_dept_diterima"><Dashboard onLogout={logout}><DiterimaDetail /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/terkirim" element={<PrivateRoute moduleId="tugas_dept_terkirim"><Dashboard onLogout={logout}><TerkirimList /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/terkirim/:id" element={<PrivateRoute moduleId="tugas_dept_terkirim"><Dashboard onLogout={logout}><TerkirimDetail /></Dashboard></PrivateRoute>} />

              <Route path="/pengaturan/organisasi" element={<PrivateRoute moduleId="organisasi"><Dashboard onLogout={logout}><Organisasi /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/perusahaan" element={<PrivateRoute moduleId="perusahaan"><Dashboard onLogout={logout}><CompanyList /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/perusahaan/create" element={<PrivateRoute moduleId="perusahaan" action="Buat"><Dashboard onLogout={logout}><CompanyForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/perusahaan/edit/:id" element={<PrivateRoute moduleId="perusahaan" action="Edit"><Dashboard onLogout={logout}><CompanyForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/departemen" element={<PrivateRoute moduleId="departemen"><Dashboard onLogout={logout}><DepartemenList /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/departemen/create" element={<PrivateRoute moduleId="departemen" action="Buat"><Dashboard onLogout={logout}><DepartemenForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/departemen/edit/:id" element={<PrivateRoute moduleId="departemen" action="Edit"><Dashboard onLogout={logout}><DepartemenForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/departemen/detail/:id" element={<PrivateRoute moduleId="departemen"><Dashboard onLogout={logout}><DepartemenDetail /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/hak-akses" element={<PrivateRoute moduleId="hak_akses"><Dashboard onLogout={logout}><HakAkses /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/hak-akses/create" element={<PrivateRoute moduleId="hak_akses" action="Buat"><Dashboard onLogout={logout}><BuatHakAkses /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/hak-akses/edit/:id" element={<PrivateRoute moduleId="hak_akses" action="Edit"><Dashboard onLogout={logout}><BuatHakAkses /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/template-tugas" element={<PrivateRoute moduleId="template_tugas"><Dashboard onLogout={logout}><TemplateList /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/template-tugas/create" element={<PrivateRoute moduleId="template_tugas" action="Buat"><Dashboard onLogout={logout}><TemplateForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/template-tugas/edit/:id" element={<PrivateRoute moduleId="template_tugas" action="Edit"><Dashboard onLogout={logout}><TemplateForm /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/template-tugas/detail/:id" element={<PrivateRoute moduleId="template_tugas"><Dashboard onLogout={logout}><TemplateDetail /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/relasi-departemen" element={<PrivateRoute moduleId="relasi_departemen"><Dashboard onLogout={logout}><RelasiDepartemen /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/audit-log" element={<PrivateRoute moduleId="audit_log"><Dashboard onLogout={logout}><AuditLog /></Dashboard></PrivateRoute>} />
              <Route path="/pengaturan/ganti-pin" element={<PrivateRoute moduleId="hak_akses"><Dashboard onLogout={logout}><PasswordResetRequests /></Dashboard></PrivateRoute>} />

              <Route path="/tugas-departemen/checklist-harian" element={<PrivateRoute><Dashboard onLogout={logout}><ChecklistHarian /></Dashboard></PrivateRoute>} />
              <Route path="/tugas-departemen/checklist-riwayat" element={<PrivateRoute><Dashboard onLogout={logout}><ChecklistHarian /></Dashboard></PrivateRoute>} />

              <Route path="/pengaturan/ubah-password" element={<Dashboard onLogout={logout}><ChangePassword /></Dashboard>} />
              <Route path="/profile/user" element={<Dashboard onLogout={logout}><Profile /></Dashboard>} />

              {/* Demo Mobile Routes */}
              <Route path="/demo/mobile" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/tasks" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/checklist" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/checklist/buat-wo" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/checklist-riwayat" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/notifications" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/profile" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/task/:taskId" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/task/:taskId/form" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/dept-tasks" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/dept-task/:id" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/approvals" element={<MobileDemo onLogout={logout} />} />
              <Route path="/demo/mobile/approval/:taskId" element={<MobileDemo onLogout={logout} />} />
            </>
          ) : (
            /* If no user, all paths redirect to / */
            <Route path="*" element={<Navigate to="/" replace />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ModalProvider>
    </Router>
  );
}

export default App;
