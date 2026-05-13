import React, { useState, useEffect } from 'react';
import { Shield, Save, Search, Check, X, AlertCircle, Info, Lock } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const HakAksesAset = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error: showError, confirm } = useModal();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';
  const appMode = import.meta.env.MODE;

  // Mobile development placeholder
  if (appMode === 'mobile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] p-6 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#0095E8]">
            <Shield size={40} />
          </div>
          <h2 className="text-xl font-bold text-[#181C32]">Hak Akses Aset</h2>
          <p className="text-sm text-[#A1A5B7] font-light max-w-[280px]">
            Halaman konfigurasi hak akses aset masih dalam proses pengembangan untuk versi mobile.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const url = isSuperAdmin 
        ? '/api/roles'
        : `/api/roles?company_id=${user.company_id}`;
      
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setLoading(false);
    }
  };

  const assetModules = [
    { id: 'aset_menu', label: 'Menu Aset', actions: ['Lihat'] },
    { id: 'aset_register', label: 'Registrasi Aset', actions: ['Lihat', 'Buat', 'Edit', 'Hapus'] },
    { id: 'aset_monitoring', label: 'Monitoring Aset', actions: ['Lihat'] },
    { id: 'aset_audit', label: 'Log Audit Aset', actions: ['Lihat'] },
    { id: 'aset_hak_akses', label: 'Kelola Hak Akses Aset', actions: ['Lihat', 'Edit'] }
  ];

  const handleToggle = (roleId, moduleId, action) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        const currentPerms = { ...(role.permissions || {}) };
        const modulePerms = [...(currentPerms[moduleId] || [])];
        
        if (modulePerms.includes(action)) {
          currentPerms[moduleId] = modulePerms.filter(a => a !== action);
        } else {
          currentPerms[moduleId] = [...modulePerms, action];
        }
        
        // Logical dependency: If child perm is active, Menu must be active
        if (moduleId !== 'aset_menu' && currentPerms[moduleId].length > 0) {
          if (!currentPerms['aset_menu']?.includes('Lihat')) {
            currentPerms['aset_menu'] = ['Lihat'];
          }
        }

        return { ...role, permissions: currentPerms };
      }
      return role;
    }));
  };

  const savePermissions = async (role) => {
    try {
      setSaving(true);
      const response = await authFetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: role.name,
          level: role.level,
          status: role.status,
          permissions: role.permissions
        })
      });

      if (response.ok) {
        success('Berhasil', `Hak akses untuk ${role.name} telah diperbarui.`);
      } else {
        showError('Gagal', 'Gagal menyimpan perubahan.');
      }
    } catch (error) {
      showError('Kesalahan', 'Terjadi kesalahan pada server.');
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32] mb-1">Hak Akses Aset</h1>
          <p className="text-[#A1A5B7] text-sm font-light">Konfigurasi detail izin operasional aset untuk setiap peran pengguna.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
            <input 
              type="text" 
              placeholder="Cari Role..."
              className="pl-10 pr-4 py-2.5 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#F1F1F4] border-dashed">
          <div className="w-8 h-8 border-2 border-[#0095E8] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[#A1A5B7] font-light">Menyelaraskan data hak akses...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden group hover:border-[#0095E8]/20 transition-all">
              {/* Role Header */}
              <div className="px-6 py-4 bg-[#F9F9F9]/50 border-b border-[#F1F1F4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-[#F1F1F4] flex items-center justify-center text-[#0095E8] shadow-sm">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#181C32]">{role.name}</h3>
                    <p className="text-[11px] text-[#A1A5B7] font-light uppercase tracking-wider">Level: {role.level}</p>
                  </div>
                </div>
                <button 
                  onClick={() => savePermissions(role)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0095E8] text-white rounded-lg text-xs font-normal hover:bg-[#0084CC] transition-all shadow-lg shadow-[#0095E8]/10"
                >
                  <Save size={14} />
                  Simpan Perubahan
                </button>
              </div>

              {/* Permission Matrix */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-left border-b border-[#F1F1F4]">
                      <th className="pb-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Modul Aset</th>
                      <th className="pb-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-center">Lihat</th>
                      <th className="pb-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-center">Buat</th>
                      <th className="pb-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-center">Edit</th>
                      <th className="pb-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F1F4]">
                    {assetModules.map((module) => (
                      <tr key={module.id} className="group/row hover:bg-[#F9F9F9]/30 transition-all">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-normal text-[#3F4254]">{module.label}</span>
                            <div className="opacity-0 group-hover/row:opacity-100 transition-all">
                              <Info size={12} className="text-[#A1A5B7]" />
                            </div>
                          </div>
                        </td>
                        {['Lihat', 'Buat', 'Edit', 'Hapus'].map((action) => {
                          const isSupported = module.actions.includes(action);
                          const isActive = role.permissions?.[module.id]?.includes(action);
                          
                          return (
                            <td key={action} className="py-4 text-center">
                              {isSupported ? (
                                <button
                                  onClick={() => handleToggle(role.id, module.id, action)}
                                  className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    isActive 
                                      ? 'bg-[#E1F0FF] text-[#0095E8] shadow-sm' 
                                      : 'bg-[#F9F9F9] text-[#E4E6EF] hover:bg-[#F1F1F4]'
                                  }`}
                                >
                                  {isActive ? <Check size={14} strokeWidth={3} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                </button>
                              ) : (
                                <Lock size={14} className="mx-auto text-[#F1F1F4]" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filteredRoles.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#F1F1F4]">
              <AlertCircle size={40} className="mx-auto text-[#F1F1F4] mb-3" />
              <p className="text-sm text-[#A1A5B7] font-light">Role tidak ditemukan.</p>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 p-6 bg-[#F1FAFF] rounded-2xl border border-[#0095E8]/10 flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl text-[#0095E8] shadow-sm">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-[#181C32]">Petunjuk Konfigurasi</p>
          <p className="text-xs text-[#7E8299] font-light leading-relaxed">
            Perubahan hak akses akan langsung berdampak pada menu yang muncul di sidebar dan akses API bagi pengguna dengan peran tersebut. 
            Modul <span className="font-normal text-[#181C32]">Menu Aset</span> wajib diaktifkan (Lihat) agar modul lain dapat muncul di navigasi utama.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HakAksesAset;
