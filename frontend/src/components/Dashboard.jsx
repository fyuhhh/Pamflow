import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCircle,
  Lock,
  Star
} from 'lucide-react';
import {
  PiSquaresFourDuotone,
  PiUsersDuotone,
  PiClipboardTextDuotone,
  PiBuildingsDuotone,
  PiGearDuotone,
  PiPackageDuotone
} from 'react-icons/pi';

import Logo from './Logo';
import { authFetch } from '../services/api';

const Dashboard = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const [pendingResetCount, setPendingResetCount] = useState(0);
  // Relasi departemen — fetch sekali saat load
  const [deptRelations, setDeptRelations] = useState({ isSource: false, isTarget: false, loaded: false });

  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';
  const userDeptName = (user?.department || '').toLowerCase();

  useEffect(() => {
    if (isSuperAdmin || user?.permissions?.['hak_akses']?.includes('Lihat')) {
      authFetch('/api/password-reset/pending')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setPendingResetCount(data.length); })
        .catch(console.error);
    }
    // Cek apakah dept user ada di relasi aktif
    if (user?.company_id) {
      authFetch(`/api/dept-relations?company_id=${user.company_id}&is_active=true`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          const isSource = data.some(r => r.source_name?.toLowerCase() === userDeptName);
          const isTarget = data.some(r => r.target_name?.toLowerCase() === userDeptName);
          setDeptRelations({ isSource, isTarget, loaded: true });
        })
        .catch(() => setDeptRelations({ isSource: false, isTarget: false, loaded: true }));
    }
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <PiSquaresFourDuotone size={20} />,
      path: '/dashboard',
      permission: 'dashboard'
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      icon: <PiUsersDuotone size={20} />,
      permission: ['admin', 'agent'],
      subItems: [
        { label: 'Admin', path: '/pengguna/admin', permission: 'admin' },
        { label: 'Agen', path: '/pengguna/agen', permission: 'agent' },
      ]
    },
    {
      id: 'tugas-agen',
      label: 'Tugas ke Agen',
      icon: <PiClipboardTextDuotone size={20} />,
      permission: ['tugas_agen_buat_checklist', 'tugas_agen_buat_wo', 'tugas_agen_ringkasan', 'tugas_agen_persetujuan'],
      subItems: [
        { label: 'Buat Checklist', path: '/tugas-agen/buat', permission: 'tugas_agen_buat_checklist' },
        { label: 'Buat WO', path: '/tugas-agen/buat-wo', permission: 'tugas_agen_buat_wo' },
        { label: 'Ringkasan Tugas', path: '/tugas-agen/ringkasan', permission: 'tugas_agen_ringkasan' },
        { label: 'Persetujuan', path: '/tugas-agen/persetujuan', permission: 'tugas_agen_persetujuan' },
      ]
    },
    {
      id: 'tugas-dept',
      label: 'Tugas antar Departemen',
      icon: <PiBuildingsDuotone size={20} />,
      // Parent tampil jika ada salah satu sub yang tampil
      permission: ['tugas_dept_buat_checklist', 'tugas_dept_buat_wo', 'tugas_dept_diterima', 'tugas_dept_terkirim'],
      subItems: [
        // Menu relasi — muncul otomatis jika dept user adalah SOURCE (pengirim) dalam relasi
        ...(deptRelations.isSource || isSuperAdmin ? [
          { label: 'Checklist Harian', path: '/tugas-departemen/checklist-harian', alwaysShow: true },
          { label: 'Riwayat Checklist', path: '/tugas-departemen/checklist-riwayat', alwaysShow: true },
        ] : []),
        { label: 'Buat Checklist', path: '/tugas-departemen/buat', permission: 'tugas_dept_buat_checklist' },
        { label: 'Buat WO', path: '/tugas-departemen/buat-wo', permission: 'tugas_dept_buat_wo' },
        { label: 'Diterima', path: '/tugas-departemen/diterima', permission: 'tugas_dept_diterima' },
        { label: 'Terkirim', path: '/tugas-departemen/terkirim', permission: 'tugas_dept_terkirim' },
      ]
    },
    {
      id: 'aset',
      label: 'Aset',
      icon: <PiPackageDuotone size={20} />,
      permission: ['aset_hak_akses', 'aset_register', 'aset_monitoring'],
      subItems: [
        { label: 'Register Aset', path: '/aset/register', permission: 'aset_register' },
        { label: 'Monitoring Aset', path: '/aset/monitoring', permission: 'aset_monitoring' },
        { label: 'Hak Akses Aset', path: '/aset/hak-akses', permission: 'aset_hak_akses' },
      ]
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: <PiGearDuotone size={20} />,
      permission: ['organisasi', 'perusahaan', 'departemen', 'hak_akses', 'template_tugas', 'audit_log', 'relasi_departemen'],
      subItems: [
        { label: 'Profil Organisasi', path: '/pengaturan/organisasi', permission: 'organisasi' },
        { label: 'Unit Perusahaan', path: '/pengaturan/perusahaan', permission: 'perusahaan' },
        { label: 'Departemen', path: '/pengaturan/departemen', permission: 'departemen' },
        { label: 'Relasi Departemen', path: '/pengaturan/relasi-departemen', permission: 'relasi_departemen' },
        { label: 'Hak Akses', path: '/pengaturan/hak-akses', permission: 'hak_akses' },
        { label: 'Template Tugas', path: '/pengaturan/template-tugas', permission: 'template_tugas' },
        { label: 'Audit Log', path: '/pengaturan/audit-log', permission: 'audit_log' },
        { label: 'Permintaan Ganti PIN', path: '/pengaturan/ganti-pin', permission: 'hak_akses', badge: pendingResetCount > 0 ? pendingResetCount : null },
      ]
    }
  ];

  const hasPermission = (perm) => {
    if (isSuperAdmin) return true;
    if (Array.isArray(perm)) {
      return perm.some(p => user?.permissions?.[p]?.includes('Lihat'));
    }
    return user?.permissions?.[perm]?.includes('Lihat');
  };

  // Filter subItem — support alwaysShow (untuk menu relasi dept otomatis)
  const filterSubItems = (subItems) => {
    return subItems.filter(sub => sub.alwaysShow || isSuperAdmin || hasPermission(sub.permission));
  };

  // Apakah parent menu Tugas Dept visible:
  // Tampil jika ada sub yang visible ATAU dept user ada di relasi
  const isDeptMenuVisible = (item) => {
    if (item.id !== 'tugas-dept') return hasPermission(item.permission);
    const hasRelationMenus = deptRelations.isSource || isSuperAdmin;
    const hasPermMenus = Array.isArray(item.permission)
      ? item.permission.some(p => user?.permissions?.[p]?.includes('Lihat'))
      : user?.permissions?.[item.permission]?.includes('Lihat');
    return hasRelationMenus || hasPermMenus || isSuperAdmin;
  };

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isPathActive = (path) => location.pathname === path;
  const isParentActive = (item) => item.subItems?.some(sub => isPathActive(sub.path));

  return (
    <div className="flex min-h-screen bg-[#F5F8FA]">

      {/* Sidebar - Clean Light Theme */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-[#E1E3EA] shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">

          {/* Logo Section - PamFlow */}
          <div className="p-4 flex items-center gap-3 border-b border-[#F1F1F4] h-16">
            <Logo className="w-8 h-8" />
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none tracking-tight text-[#181C32]">PamFlow</span>
                <span className="text-[10px] font-medium text-[#A1A5B7] self-end">v1.8.2</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
            {menuItems.filter(item => isDeptMenuVisible(item)).map(item => (
              <div 
                key={item.id}
                className="relative group mb-1"
                onMouseEnter={() => setHoveredMenu(item.id)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 text-[13px] font-semibold border-l-4 ${isParentActive(item) || openMenus[item.id] ? 'bg-gradient-to-r from-[#F1FAFF] to-transparent text-[#0095E8] border-[#0095E8]' : 'border-transparent text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F5F8FA]'}`}
                    >
                      <span className={`transform transition-transform duration-300 group-hover:scale-110 ${isParentActive(item) || openMenus[item.id] ? 'text-[#0095E8]' : 'text-[#A1A5B7]'}`}>{item.icon}</span>
                      {isSidebarOpen && <span className="flex-1 text-left flex items-center gap-2">{item.label} {item.subItems.some(s => s.badge) && <span className="w-2 h-2 bg-[#F1416C] rounded-full animate-pulse"></span>}</span>}
                      {isSidebarOpen && (openMenus[item.id] ? <ChevronDown size={14} className="text-[#0095E8]" /> : <ChevronRight size={14} />)}
                    </button>
                    {isSidebarOpen && openMenus[item.id] && (
                      <div className="mt-1 space-y-1 animate-dropdown">
                        {filterSubItems(item.subItems).map(sub => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            className={`flex items-center justify-between pl-10 pr-4 py-2 text-[12px] font-medium transition-all duration-200 rounded-md ${isPathActive(sub.path) ? 'text-[#0095E8] font-bold bg-[#F1FAFF]/50' : 'text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F5F8FA]'}`}
                          >
                            <span>{sub.label}</span>
                            {sub.badge && (
                              <span className="bg-[#F1416C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-300 text-[13px] font-semibold border-l-4 ${isPathActive(item.path) ? 'bg-gradient-to-r from-[#F1FAFF] to-transparent text-[#0095E8] border-[#0095E8]' : 'border-transparent text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F5F8FA]'}`}
                  >
                    <span className={`transform transition-transform duration-300 group-hover:scale-110 ${isPathActive(item.path) ? 'text-[#0095E8]' : 'text-[#A1A5B7]'}`}>{item.icon}</span>
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                )}

                {/* Floating Tooltip for Collapsed Sidebar */}
                {!isSidebarOpen && (
                  <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#181C32] text-white text-xs font-medium rounded-md shadow-lg pointer-events-none transition-all duration-200 z-[100] whitespace-nowrap ${hoveredMenu === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#181C32] transform rotate-45"></div>
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#F1F1F4]">
            <div className="text-[10px] text-[#A1A5B7] font-medium text-center">
              © 2026 IT Dept. Pamflow.
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>

        {/* Header - Simple White Reversion */}
        <header className="bg-white border-b border-[#E1E3EA] px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] rounded transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="text-[14px] font-bold text-[#181C32]">{location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative border-l border-[#E1E3EA] pl-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setProfileOpen(!isProfileOpen)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[12px] font-bold text-[#181C32] group-hover:text-[#0095E8] transition-colors flex items-center gap-1">
                    Hi, {user?.firstName} {user?.lastName}
                    {isSuperAdmin && <Star size={12} className="text-[#0095E8] fill-[#0095E8]/10" />}
                  </p>
                  <p className="text-[10px] text-[#7E8299] font-medium">{user?.role || 'User'}</p>
                </div>
                <div className="w-8 h-8 rounded bg-[#F1FAFF] text-[#0095E8] flex items-center justify-center font-bold text-[12px] group-hover:bg-[#0095E8] group-hover:text-white transition-all">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E1E3EA] rounded-xl shadow-xl z-20 py-2 animate-dropdown">
                    <div className="px-4 py-3 border-b border-[#F5F8FA] mb-1">
                      <p className="text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">{user?.orgId || 'PAM'} • ID: {user?.orgId || 'PAM'}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/profile/user'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#3F4254] hover:bg-[#F5F8FA] hover:text-[#0095E8] transition-all"
                    >
                      <UserCircle size={18} className="text-[#A1A5B7]" />
                      <span>Profile Saya</span>
                    </button>

                    <button
                      onClick={() => { navigate('/pengaturan/ubah-password'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#3F4254] hover:bg-[#F5F8FA] hover:text-[#0095E8] transition-all"
                    >
                      <Lock size={18} className="text-[#A1A5B7]" />
                      <span>Ubah Password</span>
                    </button>

                    <div className="h-px bg-[#F5F8FA] my-1"></div>

                    <button
                      onClick={() => { onLogout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-[#F1416C] hover:bg-[#FFF5F8] transition-all"
                    >
                      <LogOut size={18} />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
