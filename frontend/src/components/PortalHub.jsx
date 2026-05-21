import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiBuildingsDuotone, PiListChecksDuotone, PiPackageDuotone, PiFolderSimpleDuotone } from 'react-icons/pi';
import { hasPermission } from '../utils/permissions';

const PortalHub = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  }, []);

  if (!user) return null;

  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  // Check if user has access to each module
  const hasWoAccess = isSuperAdmin || hasPermission(user, 'dashboard', 'Lihat') || hasPermission(user, 'tugas_dept_buat_checklist', 'Lihat');
  const hasChecklistAccess = isSuperAdmin || hasPermission(user, 'checklist_harian_akses', 'Lihat');
  const hasMaintenanceAccess = isSuperAdmin || hasPermission(user, 'aset_monitoring', 'Lihat');
  const hasManajemenAsetAccess = isSuperAdmin || hasPermission(user, 'pure_asset_dashboard', 'Lihat');

  const modules = [
    {
      id: 'wo',
      title: 'WO & Checklist',
      description: 'Manajemen tugas, Work Order, dan penugasan antar departemen.',
      icon: <PiBuildingsDuotone size={48} />,
      color: 'from-[#0095E8] to-[#0074B5]',
      bgShadow: 'shadow-[#0095E8]/20',
      path: '/dashboard',
      hasAccess: hasWoAccess
    },
    {
      id: 'checklist',
      title: 'Checklist Harian',
      description: 'Operasional harian, pengecekan rutin, dan riwayat form checklist.',
      icon: <PiListChecksDuotone size={48} />,
      color: 'from-[#50CD89] to-[#39A86E]',
      bgShadow: 'shadow-[#50CD89]/20',
      path: '/tugas-departemen/checklist-harian',
      hasAccess: hasChecklistAccess
    },
    {
      id: 'maintenance',
      title: 'Maintenance Aset',
      description: 'Pusat kontrol engineering, jadwal maintenance, dan monitoring IoT.',
      icon: <PiPackageDuotone size={48} />,
      color: 'from-[#FFA800] to-[#E29500]',
      bgShadow: 'shadow-[#FFA800]/20',
      path: '/aset/monitoring',
      hasAccess: hasMaintenanceAccess
    },
    {
      id: 'manajemen_aset',
      title: 'Manajemen Aset',
      description: 'Pendataan aset, depresiasi, nilai buku, mutasi, dan stock opname.',
      icon: <PiFolderSimpleDuotone size={48} />,
      color: 'from-[#8A15E3] to-[#600E9F]',
      bgShadow: 'shadow-[#8A15E3]/20',
      path: '/manajemen-aset/dashboard',
      hasAccess: hasManajemenAsetAccess
    }
  ];

  const availableModules = modules.filter(m => m.hasAccess);

  const handleModuleClick = (mod) => {
    localStorage.setItem('activeModule', mod.id);
    navigate(mod.path);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#181C32] tracking-tight mb-3">Selamat Datang di Pamflow</h1>
        <p className="text-sm md:text-base text-[#7E8299] font-medium max-w-xl mx-auto">
          Silakan pilih modul aplikasi yang ingin Anda gunakan. Setiap modul dirancang khusus untuk memenuhi kebutuhan operasional dan manajemen perusahaan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        {availableModules.map((mod) => (
          <div 
            key={mod.id}
            onClick={() => handleModuleClick(mod)}
            className={`group relative overflow-hidden rounded-3xl bg-white border border-[#F1F1F4] p-8 cursor-pointer hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-2 ${mod.bgShadow}`}
          >
            {/* Background Gradient on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${mod.color} transition-opacity duration-300 z-0`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-20 h-20 rounded-2xl bg-[#F9F9F9] group-hover:bg-white/20 flex items-center justify-center text-[#181C32] group-hover:text-white transition-colors duration-300 mb-6 border border-[#F1F1F4] group-hover:border-white/10">
                {mod.icon}
              </div>
              <h2 className="text-xl font-extrabold text-[#181C32] group-hover:text-white mb-2 transition-colors duration-300">
                {mod.title}
              </h2>
              <p className="text-sm font-medium text-[#A1A5B7] group-hover:text-white/80 transition-colors duration-300 leading-relaxed flex-1">
                {mod.description}
              </p>
              
              <div className="mt-8 flex items-center text-xs font-bold text-[#0095E8] group-hover:text-white transition-colors duration-300">
                Buka Modul &rarr;
              </div>
            </div>
          </div>
        ))}
      </div>

      {availableModules.length === 0 && (
        <div className="text-center p-10 bg-white rounded-2xl border border-[#F1F1F4] shadow-sm max-w-md">
          <p className="text-[#A1A5B7] font-medium">Anda tidak memiliki akses ke modul apapun. Silakan hubungi Administrator.</p>
        </div>
      )}
    </div>
  );
};

export default PortalHub;
