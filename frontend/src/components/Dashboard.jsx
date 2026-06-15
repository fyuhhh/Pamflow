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
  Star,
  Grip,
  TrendingDown,
  Wrench,
  Database,
  History,
  Zap,
  Droplet
} from 'lucide-react';
import {
  PiSquaresFourDuotone,
  PiUsersDuotone,
  PiClipboardTextDuotone,
  PiBuildingsDuotone,
  PiGearDuotone,
  PiPackageDuotone,
  PiListChecksDuotone,
  PiFolderSimpleDuotone
} from 'react-icons/pi';

import Logo from './Logo';
import { authFetch } from '../services/api';

const Dashboard = ({ children, onLogout, isHub = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isSwitcherOpen, setSwitcherOpen] = useState(false);
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
      permission: ['tugas_dept_buat_checklist', 'tugas_dept_buat_wo', 'tugas_dept_diterima', 'tugas_dept_terkirim'],
      subItems: [
        { label: 'Buat Checklist', path: '/tugas-departemen/buat', permission: 'tugas_dept_buat_checklist' },
        { label: 'Buat WO', path: '/tugas-departemen/buat-wo', permission: 'tugas_dept_buat_wo' },
        { label: 'Diterima', path: '/tugas-departemen/diterima', permission: 'tugas_dept_diterima' },
        { label: 'Terkirim', path: '/tugas-departemen/terkirim', permission: 'tugas_dept_terkirim' },
      ]
    },
    {
      id: 'checklist',
      label: 'Checklist',
      icon: <PiListChecksDuotone size={20} />,
      permission: ['tugas_dept_buat_checklist'], // Uses similar permission or alwaysShow logic
      subItems: [
        { label: 'Dashboard Checklist Harian', path: '/tugas-departemen/dashboard-checklist', alwaysShow: true },
        { label: 'Checklist Harian', path: '/tugas-departemen/checklist-harian', alwaysShow: true },
        { label: 'Riwayat Checklist', path: '/tugas-departemen/checklist-riwayat', alwaysShow: true }
      ]
    },
    {
      id: 'aset',
      label: 'Maintenance Aset',
      icon: <PiPackageDuotone size={20} />,
      permission: ['aset_hak_akses', 'aset_register', 'aset_monitoring'],
      subItems: [
        { label: 'Dashboard Maintenance Aset', path: '/aset/dashboard-maintenance', permission: 'aset_monitoring' },
        { label: 'Register Aset', path: '/aset/register', permission: 'aset_register' },
        { label: 'Monitoring Aset', path: '/aset/monitoring', permission: 'aset_monitoring' },
        { label: 'Pendataan Listrik', path: '/aset/listrik', permission: 'aset_monitoring' },
        { label: 'Pendataan Air', path: '/aset/air', permission: 'aset_monitoring' },
        { label: 'Hak Akses Aset', path: '/aset/hak-akses', permission: 'aset_hak_akses' },
      ]
    },
    {
      id: 'manajemen-aset',
      label: 'Manajemen Aset',
      icon: <PiFolderSimpleDuotone size={20} />,
      permission: ['pure_asset_dashboard', 'pure_asset_register', 'pure_asset_mutation', 'pure_asset_maintenance', 'pure_asset_opname', 'pure_asset_disposal', 'pure_asset_depreciation', 'pure_asset_master', 'pure_asset_hak_akses'],
      subItems: [
        { label: 'Dashboard Aset', path: '/manajemen-aset/dashboard', permission: 'pure_asset_dashboard' },
        { 
          label: 'Aset', 
          path: '/manajemen-aset/aset-group', 
          permission: ['pure_asset_register', 'pure_asset_mutation', 'pure_asset_opname'],
          subItems: [
            { label: 'Daftar Aset', path: '/manajemen-aset/list', permission: 'pure_asset_register' },
            { label: 'Relokasi', path: '/manajemen-aset/mutasi', permission: 'pure_asset_mutation' },
            { label: 'Stok Opname', path: '/manajemen-aset/opname', permission: 'pure_asset_opname' }
          ]
        },
        {
          label: 'Depresiasi',
          path: '/manajemen-aset/depresiasi-group',
          permission: 'pure_asset_depreciation',
          subItems: [
            { label: 'Perhitungan Depresiasi', path: '/manajemen-aset/depresiasi', permission: 'pure_asset_depreciation' }
          ]
        },
        {
          label: 'Pemeliharaan',
          path: '/manajemen-aset/pemeliharaan-group',
          permission: 'pure_asset_maintenance',
          subItems: [
            { label: 'Pendataan Listrik', path: '/manajemen-aset/listrik', permission: 'pure_asset_maintenance' },
            { label: 'Pendataan Air', path: '/manajemen-aset/air', permission: 'pure_asset_maintenance' }
          ]
        },
        { 
          label: 'Master Data', 
          path: '/manajemen-aset/master-data', 
          permission: 'pure_asset_master',
          subItems: [
            { label: 'Aset', path: '/manajemen-aset/master-data?tab=asset', permission: 'pure_asset_master' },
            { label: 'Departemen', path: '/manajemen-aset/master-data?tab=department', permission: 'pure_asset_master' },
            { label: 'Kategori', path: '/manajemen-aset/master-data?tab=category', permission: 'pure_asset_master' },
            { label: 'Kondisi', path: '/manajemen-aset/master-data?tab=condition', permission: 'pure_asset_master' },
            { label: 'Lokasi', path: '/manajemen-aset/master-data?tab=location', permission: 'pure_asset_master' },
            { label: 'Vendor', path: '/manajemen-aset/master-data?tab=vendor', permission: 'pure_asset_master' }
          ]
        },
        {
          label: 'Manajemen Pengguna',
          path: '/manajemen-aset/pengguna-group',
          permission: 'pure_asset_hak_akses',
          subItems: [
            { label: 'Hak Akses Aset', path: '/manajemen-aset/hak-akses', permission: 'pure_asset_hak_akses' }
          ]
        },
        {
          label: 'Riwayat',
          path: '/manajemen-aset/riwayat-group',
          permission: 'pure_asset_master',
          subItems: [
            { label: 'History Penghapusan', path: '/manajemen-aset/history-penghapusan', permission: 'pure_asset_master' }
          ]
        }
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
    return subItems.filter(sub => {
      if (sub.path === '/tugas-departemen/checklist-harian') {
        const role = user?.role?.toLowerCase() || '';
        const isAdmin = isSuperAdmin || role === 'l3 - admin dept';
        if (isAdmin) return false;

        const isTargetOnly = deptRelations.isTarget && !deptRelations.isSource && !isSuperAdmin;
        if (isTargetOnly) return false;
      }
      return sub.alwaysShow || isSuperAdmin || hasPermission(sub.permission);
    });
  };

  // Apakah parent menu Tugas Dept visible:
  // Tampil jika ada sub yang visible ATAU dept user ada di relasi
  const isDeptMenuVisible = (item) => {
    if (item.id === 'checklist') return deptRelations.isSource || deptRelations.isTarget || isSuperAdmin;
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

  const isPathActive = (path) => {
    if (!path) return false;
    const [pathPart, queryPart] = path.split('?');
    const matchesPath = location.pathname === pathPart;
    if (!queryPart) return matchesPath;
    const searchParams = new URLSearchParams(location.search);
    const expectedParams = new URLSearchParams(queryPart);
    for (const [key, val] of expectedParams.entries()) {
      if (searchParams.get(key) !== val) return false;
    }
    return matchesPath;
  };

  const isParentActive = (item) => {
    return item.subItems?.some(sub => {
      if (isPathActive(sub.path)) return true;
      if (sub.subItems?.some(ss => isPathActive(ss.path))) return true;
      return false;
    });
  };

  const activeModule = localStorage.getItem('activeModule') || 'wo';
  let finalMenuItems = [];
  
  if (activeModule === 'checklist') {
    const parent = menuItems.find(i => i.id === 'checklist');
    if (isDeptMenuVisible(parent)) {
      finalMenuItems.push({ id: 'header-checklist', isHeader: true, label: 'CHECKLIST HARIAN' });
      const visibleSubs = filterSubItems(parent.subItems);
      visibleSubs.forEach((sub, i) => {
        finalMenuItems.push({
          ...sub,
          id: `checklist-sub-${i}`,
          icon: sub.label.includes('Dashboard') ? <LayoutDashboard size={20} /> : (sub.label.includes('Riwayat') ? <ClipboardList size={20} /> : (sub.label.includes('Akses') ? <Lock size={20} /> : <PiListChecksDuotone size={20} />))
        });
      });
    }
  } else if (activeModule === 'maintenance') {
    const parent = menuItems.find(i => i.id === 'aset');
    if (isDeptMenuVisible(parent)) {
      finalMenuItems.push({ id: 'header-maintenance', isHeader: true, label: 'MAINTENANCE ASET' });
      const visibleSubs = filterSubItems(parent.subItems);
      visibleSubs.forEach((sub, i) => {
        finalMenuItems.push({
          ...sub,
          id: `maintenance-sub-${i}`,
          icon: sub.label.includes('Dashboard') ? <LayoutDashboard size={20} /> : 
                sub.label.includes('Akses') ? <Lock size={20} /> : 
                sub.label.includes('Listrik') ? <Zap size={20} /> :
                sub.label.includes('Air') ? <Droplet size={20} /> :
                <PiPackageDuotone size={20} />
        });
      });
    }
  } else if (activeModule === 'manajemen_aset') {
    const parent = menuItems.find(i => i.id === 'manajemen-aset');
    if (isDeptMenuVisible(parent)) {
      finalMenuItems.push({ id: 'header-manajemen', isHeader: true, label: 'MANAJEMEN ASET' });
      const visibleSubs = filterSubItems(parent.subItems);
      visibleSubs.forEach((sub, i) => {
        finalMenuItems.push({
          ...sub,
          id: `manajemen-sub-${i}`,
          icon: sub.label.includes('Dashboard') ? <LayoutDashboard size={20} /> :
                sub.label === 'Aset' ? <PiPackageDuotone size={20} /> :
                sub.label === 'Depresiasi' ? <TrendingDown size={20} /> :
                sub.label === 'Pemeliharaan' ? <Wrench size={20} /> :
                sub.label === 'Master Data' ? <Database size={20} /> :
                sub.label === 'Manajemen Pengguna' ? <Users size={20} /> :
                <History size={20} />
        });
      });
    }
  } else {
    // WO / Checklist (default)
    finalMenuItems = menuItems.filter(item => 
      ['dashboard', 'pengguna', 'tugas-agen', 'tugas-dept', 'pengaturan'].includes(item.id)
    ).filter(item => isDeptMenuVisible(item));
  }

  const handleSwitchModule = (moduleId, path) => {
    localStorage.setItem('activeModule', moduleId);
    setSwitcherOpen(false);
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F8FA]">

      {/* Sidebar - Clean Light Theme */}
      {!isHub && (
        <aside className={`fixed top-0 left-0 h-full bg-white border-r border-[#E1E3EA] shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="flex flex-col h-full">

            {/* Logo Section - PamFlow */}
            <div className="p-4 flex items-center gap-3 border-b border-[#F1F1F4] h-16">
              <Logo className="w-8 h-8" />
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-none tracking-tight text-[#181C32]">PamFlow</span>
                  <span className="text-[10px] font-medium text-[#A1A5B7] self-end">v1.9.0</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
              {finalMenuItems.map(item => (
                item.isHeader ? (
                  <div key={item.id} className="mt-4 mb-2 px-4 text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">
                    {isSidebarOpen ? item.label : '•••'}
                  </div>
                ) : (
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
                        {filterSubItems(item.subItems).map(sub => {
                          const hasSubSubItems = sub.subItems && sub.subItems.length > 0;
                          const isSubSubActive = hasSubSubItems && sub.subItems.some(ss => isPathActive(ss.path));
                          const isSubSubOpen = !!openMenus[sub.label];

                          if (hasSubSubItems) {
                            return (
                              <div key={sub.label} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleMenu(sub.label)}
                                  className={`w-full flex items-center justify-between pl-10 pr-4 py-2 text-[12px] font-medium transition-all duration-200 rounded-md cursor-pointer border-none bg-transparent text-left ${isSubSubActive || isSubSubOpen ? 'text-[#0095E8] bg-[#F1FAFF]/30 font-semibold' : 'text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F5F8FA]'}`}
                                >
                                  <span>{sub.label}</span>
                                  {isSubSubOpen ? <ChevronDown size={12} className="text-[#0095E8]" /> : <ChevronRight size={12} />}
                                </button>
                                {isSubSubOpen && (
                                  <div className="space-y-1 pl-4 animate-dropdown">
                                    {sub.subItems.filter(ss => !ss.permission || hasPermission(ss.permission)).map(ss => (
                                      <Link
                                        key={ss.path}
                                        to={ss.path}
                                        className={`flex items-center justify-between pl-10 pr-4 py-1.5 text-[11px] font-medium transition-all duration-200 rounded-md ${isPathActive(ss.path) ? 'text-[#0095E8] font-bold bg-[#F1FAFF]/50' : 'text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F5F8FA]'}`}
                                      >
                                        <span>{ss.label}</span>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
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
                          );
                        })}
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
              )
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
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isHub ? 'pl-0' : (isSidebarOpen ? 'pl-64' : 'pl-20')}`}>

        {/* Header - Simple White Reversion */}
        <header className="bg-white border-b border-[#E1E3EA] px-8 h-16 flex items-center justify-between sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            {!isHub && (
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#7E8299] hover:bg-[#F5F8FA] rounded transition-colors">
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-[14px] font-bold text-[#181C32]">{isHub ? 'Portal Utama' : (location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1))}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* App Switcher */}
            <div className="relative">
              <button 
                onClick={() => { setSwitcherOpen(!isSwitcherOpen); setProfileOpen(false); }}
                className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded-lg transition-all"
                title="Pindah Modul"
              >
                <Grip size={20} />
              </button>
              
              {isSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E1E3EA] rounded-2xl shadow-xl z-20 p-4 animate-dropdown origin-top-right">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-black text-[#181C32] uppercase tracking-wider">Aplikasi Pamflow</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleSwitchModule('wo', '/dashboard')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeModule === 'wo' ? 'bg-[#F1FAFF] border-[#0095E8]/30' : 'bg-[#F9F9F9] border-transparent hover:border-[#E1E3EA] hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${activeModule === 'wo' ? 'bg-[#0095E8] text-white' : 'bg-white text-[#0095E8] shadow-sm'}`}>
                          <PiBuildingsDuotone size={20} />
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${activeModule === 'wo' ? 'font-bold text-[#0095E8]' : 'font-medium text-[#7E8299]'}`}>WO &<br/>Checklist</span>
                      </button>
                      <button 
                        onClick={() => handleSwitchModule('checklist', '/tugas-departemen/dashboard-checklist')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeModule === 'checklist' ? 'bg-[#E8FFF3] border-[#50CD89]/30' : 'bg-[#F9F9F9] border-transparent hover:border-[#E1E3EA] hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${activeModule === 'checklist' ? 'bg-[#50CD89] text-white' : 'bg-white text-[#50CD89] shadow-sm'}`}>
                          <PiListChecksDuotone size={20} />
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${activeModule === 'checklist' ? 'font-bold text-[#50CD89]' : 'font-medium text-[#7E8299]'}`}>Checklist<br/>Harian</span>
                      </button>
                      <button 
                        onClick={() => handleSwitchModule('maintenance', '/aset/dashboard-maintenance')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeModule === 'maintenance' ? 'bg-[#FFF8DD] border-[#FFA800]/30' : 'bg-[#F9F9F9] border-transparent hover:border-[#E1E3EA] hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${activeModule === 'maintenance' ? 'bg-[#FFA800] text-white' : 'bg-white text-[#FFA800] shadow-sm'}`}>
                          <PiPackageDuotone size={20} />
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${activeModule === 'maintenance' ? 'font-bold text-[#FFA800]' : 'font-medium text-[#7E8299]'}`}>Maintenance<br/>Aset</span>
                      </button>
                      <button 
                        onClick={() => handleSwitchModule('manajemen_aset', '/manajemen-aset/dashboard')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeModule === 'manajemen_aset' ? 'bg-[#F8F5FF] border-[#8A15E3]/30' : 'bg-[#F9F9F9] border-transparent hover:border-[#E1E3EA] hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${activeModule === 'manajemen_aset' ? 'bg-[#8A15E3] text-white' : 'bg-white text-[#8A15E3] shadow-sm'}`}>
                          <PiFolderSimpleDuotone size={20} />
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${activeModule === 'manajemen_aset' ? 'font-bold text-[#8A15E3]' : 'font-medium text-[#7E8299]'}`}>Manajemen<br/>Aset</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative border-l border-[#E1E3EA] pl-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => { setProfileOpen(!isProfileOpen); setSwitcherOpen(false); }}
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
