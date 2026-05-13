import React, { useState, useEffect } from 'react';
import { Shield, Save, Search, Check, X, AlertCircle, Info, Lock, User, Users, ChevronDown } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const HakAksesAset = () => {
  const [activeTab, setActiveTab] = useState('role'); // 'role' or 'user'
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useModal();
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = currentUser?.role?.toLowerCase() === 'super admin';
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
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const url = isSuperAdmin 
        ? '/api/roles'
        : `/api/roles?company_id=${currentUser.company_id}`;
      
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

  const fetchUsers = async () => {
    try {
      const url = isSuperAdmin 
        ? '/api/users'
        : `/api/users?company_id=${currentUser.company_id}`;
      
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        // Parse permissions if they are strings
        const parsedData = data.map(u => ({
          ...u,
          permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {})
        }));
        setUsers(parsedData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const assetModules = [
    { id: 'aset_menu', label: 'Menu Aset', actions: ['Lihat'] },
    { id: 'aset_register', label: 'Registrasi Aset', actions: ['Lihat', 'Buat', 'Edit', 'Hapus'] },
    { id: 'aset_monitoring', label: 'Monitoring Aset', actions: ['Lihat'] },
    { id: 'aset_audit', label: 'Log Audit Aset', actions: ['Lihat'] },
    { id: 'aset_hak_akses', label: 'Kelola Hak Akses Aset', actions: ['Lihat', 'Edit'] }
  ];

  const handleRoleToggle = (roleId, moduleId, action) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        const currentPerms = { ...(role.permissions || {}) };
        const modulePerms = [...(currentPerms[moduleId] || [])];
        
        if (modulePerms.includes(action)) {
          currentPerms[moduleId] = modulePerms.filter(a => a !== action);
        } else {
          currentPerms[moduleId] = [...modulePerms, action];
        }
        
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

  const handleUserToggle = (moduleId, action) => {
    if (!selectedUser) return;
    
    const currentPerms = { ...(selectedUser.permissions || {}) };
    const modulePerms = [...(currentPerms[moduleId] || [])];
    
    if (modulePerms.includes(action)) {
      currentPerms[moduleId] = modulePerms.filter(a => a !== action);
    } else {
      currentPerms[moduleId] = [...modulePerms, action];
    }
    
    if (moduleId !== 'aset_menu' && currentPerms[moduleId].length > 0) {
      if (!currentPerms['aset_menu']?.includes('Lihat')) {
        currentPerms['aset_menu'] = ['Lihat'];
      }
    }

    setSelectedUser({ ...selectedUser, permissions: currentPerms });
    // Also update in the users list to keep it in sync
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: currentPerms } : u));
  };

  const saveRolePermissions = async (role) => {
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
        // Update local session if the user just edited their own role
        if (role.id === currentUser.role_id) {
          const updatedUser = { ...currentUser, permissions: role.permissions };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('auth-change'));
        }
        success('Berhasil', `Hak akses untuk role ${role.name} telah diperbarui.`);
      } else {
        showError('Gagal', 'Gagal menyimpan perubahan.');
      }
    } catch (error) {
      showError('Kesalahan', 'Terjadi kesalahan pada server.');
    } finally {
      setSaving(false);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      const response = await authFetch(`/api/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: selectedUser.permissions
        })
      });

      if (response.ok) {
        // Update local session if the admin just edited themselves
        if (selectedUser.id === currentUser.id) {
          // Re-merge current role perms with the new specific perms
          const rolePerms = currentUser.role_permissions || {}; // We might not have this in localStorage yet
          // For now, the most robust way to get the merged result is to just update 
          // the localStorage with what we have and trigger event.
          // Note: The login logic is the one that really knows how to merge.
          // But we can approximate it here.
          const updatedUser = { ...currentUser, permissions: selectedUser.permissions }; 
          // Wait, 'permissions' in localStorage is the MERGED one. 
          // So replacing it with ONLY specific perms is wrong.
          // The best approach is to just tell them to refresh or re-fetch.
          success('Berhasil', 'Izin spesifik Anda telah diperbarui. Silakan refresh halaman untuk menerapkan perubahan sepenuhnya.');
        } else {
          success('Berhasil', `Izin spesifik untuk ${selectedUser.firstName} telah diperbarui.`);
        }
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

  const filteredUsers = users.filter(user => 
    (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32] mb-1">Hak Akses Aset</h1>
          <p className="text-[#A1A5B7] text-sm font-light">Konfigurasi detail izin operasional aset baik berdasarkan Role maupun Pengguna spesifik.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-[#F1F1F4] shadow-sm">
          <button 
            onClick={() => { setActiveTab('role'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-normal transition-all ${activeTab === 'role' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <Users size={14} />
            Berdasarkan Role
          </button>
          <button 
            onClick={() => { setActiveTab('user'); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-normal transition-all ${activeTab === 'user' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'}`}
          >
            <User size={14} />
            Berdasarkan Pengguna
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'role' ? "Cari Role..." : "Cari Nama/Email User..."}
            className="pl-10 pr-4 py-2.5 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#F1F1F4] border-dashed">
          <div className="w-8 h-8 border-2 border-[#0095E8] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[#A1A5B7] font-light">Menyelaraskan data hak akses...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'role' ? (
            filteredRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden group hover:border-[#0095E8]/20 transition-all">
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
                    onClick={() => saveRolePermissions(role)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0095E8] text-white rounded-lg text-xs font-normal hover:bg-[#0084CC] transition-all shadow-lg shadow-[#0095E8]/10"
                  >
                    <Save size={14} />
                    Simpan Perubahan Role
                  </button>
                </div>

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
                            <span className="text-sm font-normal text-[#3F4254]">{module.label}</span>
                          </td>
                          {['Lihat', 'Buat', 'Edit', 'Hapus'].map((action) => {
                            const isSupported = module.actions.includes(action);
                            const isActive = role.permissions?.[module.id]?.includes(action);
                            return (
                              <td key={action} className="py-4 text-center">
                                {isSupported ? (
                                  <button
                                    onClick={() => handleRoleToggle(role.id, module.id, action)}
                                    className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-[#E1F0FF] text-[#0095E8]' : 'bg-[#F9F9F9] text-[#E4E6EF] hover:bg-[#F1F1F4]'}`}
                                  >
                                    {isActive ? <Check size={14} strokeWidth={3} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                  </button>
                                ) : <Lock size={14} className="mx-auto text-[#F1F1F4]" />}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* User List Sidebar */}
              <div className="lg:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedUser?.id === user.id ? 'bg-[#F1FAFF] border-[#0095E8] shadow-sm' : 'bg-white border-[#F1F1F4] hover:border-[#0095E8]/30'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${selectedUser?.id === user.id ? 'bg-[#0095E8] text-white' : 'bg-[#F9F9F9] text-[#0095E8]'}`}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className={`text-sm font-bold truncate ${selectedUser?.id === user.id ? 'text-[#181C32]' : 'text-[#3F4254]'}`}>{user.firstName} {user.lastName}</h4>
                      <p className="text-[11px] text-[#A1A5B7] truncate font-light">{user.role} • {user.email || user.username}</p>
                    </div>
                    {selectedUser?.id === user.id && <Check size={16} className="text-[#0095E8]" />}
                  </div>
                ))}
              </div>

              {/* Specific Permission Matrix */}
              <div className="lg:col-span-8">
                {selectedUser ? (
                  <div className="bg-white rounded-2xl border border-[#0095E8]/20 shadow-xl shadow-[#0095E8]/5 overflow-hidden animate-fade-in">
                    <div className="px-8 py-6 bg-gradient-to-r from-[#F1FAFF] to-white border-b border-[#F1F1F4] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#E1F0FF] text-[#0095E8] rounded text-[9px] font-bold uppercase tracking-wider">Izin Spesifik User</span>
                          <h3 className="text-base font-bold text-[#181C32]">{selectedUser.firstName} {selectedUser.lastName}</h3>
                        </div>
                        <p className="text-xs text-[#A1A5B7] font-light italic">Izin ini akan ditambahkan (gabungkan) dengan izin dasar dari role {selectedUser.role}.</p>
                      </div>
                      <button 
                        onClick={saveUserPermissions}
                        className="flex items-center gap-2 px-6 py-3 bg-[#50CD89] text-white rounded-xl text-sm font-normal hover:bg-[#47BC7A] transition-all shadow-lg shadow-[#50CD89]/20"
                      >
                        <Save size={16} />
                        Simpan Izin User
                      </button>
                    </div>
                    <div className="p-8">
                      <table className="w-full">
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
                              <td className="py-5">
                                <span className="text-sm font-normal text-[#3F4254]">{module.label}</span>
                              </td>
                              {['Lihat', 'Buat', 'Edit', 'Hapus'].map((action) => {
                                const isSupported = module.actions.includes(action);
                                const isActive = selectedUser.permissions?.[module.id]?.includes(action);
                                return (
                                  <td key={action} className="py-5 text-center">
                                    {isSupported ? (
                                      <button
                                        onClick={() => handleUserToggle(module.id, action)}
                                        className={`mx-auto w-7 h-7 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#50CD89] text-white shadow-sm' : 'bg-[#F9F9F9] text-[#E4E6EF] hover:bg-[#F1F1F4]'}`}
                                      >
                                        {isActive ? <Check size={16} strokeWidth={3} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                      </button>
                                    ) : <Lock size={14} className="mx-auto text-[#F1F1F4]" />}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-8 p-5 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4] flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl text-[#F1416C] shadow-sm">
                          <AlertCircle size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#181C32]">Catatan Penting</p>
                          <p className="text-[11px] text-[#7E8299] font-light leading-relaxed">
                            Izin di sini bersifat <span className="font-bold text-[#181C32]">Tambahan</span>. Jika di role user sudah punya akses "Lihat", maka di sini tidak perlu dicentang lagi. 
                            Gunakan fitur ini hanya jika Anda ingin memberikan akses spesial ke user tertentu tanpa mengubah role globalnya.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#F1F1F4] border-dashed">
                    <div className="w-16 h-16 bg-[#F9F9F9] rounded-2xl flex items-center justify-center text-[#A1A5B7] mb-4">
                      <User size={32} />
                    </div>
                    <h3 className="text-base font-bold text-[#181C32]">Pilih Pengguna</h3>
                    <p className="text-xs text-[#A1A5B7] font-light mt-1">Pilih user di samping untuk mengatur izin spesifiknya.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'role' && filteredRoles.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-[#F1F1F4]">
              <AlertCircle size={40} className="mx-auto text-[#F1F1F4] mb-3" />
              <p className="text-sm text-[#A1A5B7] font-light">Role tidak ditemukan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HakAksesAset;
