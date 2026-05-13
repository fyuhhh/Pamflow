import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', actions: ['Lihat'] },
  { id: 'kalender', label: 'Kalender Tugas', actions: ['Lihat'] },
  { 
    id: 'manajemen_pengguna', 
    label: 'Manajemen Pengguna', 
    isHeader: true,
    submodules: [
      { id: 'admin', label: 'Admin', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'agent', label: 'Agent', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
    ]
  },
  { 
    id: 'tugas_agen', 
    label: 'Tugas ke Agen', 
    isHeader: true,
    submodules: [
      { id: 'tugas_agen_buat_checklist', label: 'Buat Checklist', actions: ['Lihat'] },
      { id: 'tugas_agen_buat_wo', label: 'Buat WO', actions: ['Lihat'] },
      { id: 'tugas_agen_upload', label: 'Upload', actions: ['Lihat', 'Import'] },
      { id: 'tugas_agen_draf', label: 'Draf', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'tugas_agen_ringkasan', label: 'Ringkasan', actions: ['Lihat', 'Edit', 'Hapus', 'Download'] },
      { id: 'tugas_agen_persetujuan', label: 'Butuh Persetujuan', actions: ['Lihat', 'Edit', 'Hapus'] },
    ]
  },
  { 
    id: 'tugas_dept', 
    label: 'Tugas antar Departemen', 
    isHeader: true,
    submodules: [
      { id: 'checklist_harian', label: 'Checklist Harian & Riwayat', actions: ['Buat', 'Lihat'] },
      { id: 'monitor_wo', label: 'Monitor WO Relasi', actions: ['Lihat'] },
      { id: 'tugas_dept_buat_checklist', label: 'Buat Checklist (Lama)', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'tugas_dept_buat_wo', label: 'Buat WO (Lama)', actions: ['Lihat'] },
      { id: 'tugas_dept_diterima', label: 'Diterima', actions: ['Lihat', 'Edit', 'Hapus', 'Download'] },
      { id: 'tugas_dept_terkirim', label: 'Terkirim', actions: ['Lihat', 'Edit', 'Hapus', 'Download'] },
    ]
  },
  { 
    id: 'pengaturan', 
    label: 'Pengaturan', 
    isHeader: true,
    submodules: [
      { id: 'organisasi', label: 'Organisasi', actions: ['Lihat'] },
      { id: 'perusahaan', label: 'Perusahaan', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'departemen', label: 'Departemen', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'relasi_departemen', label: 'Relasi Departemen', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'hak_akses', label: 'Hak Akses', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'template_tugas', label: 'Template Tugas', actions: ['Buat', 'Lihat', 'Edit', 'Hapus'] },
      { id: 'audit_log', label: 'Audit Log', actions: ['Lihat'] },
    ]
  }
];

const ACTIONS = ['Buat', 'Lihat', 'Edit', 'Hapus', 'Import', 'Download'];

const BuatHakAkses = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { success, error: showError } = useModal();
  const isEdit = !!id;
  const user = JSON.parse(localStorage.getItem('user'));
  const currentCompanyId = user?.company_id;

  const [formData, setFormData] = useState({
    level: '',
    name: '',
    status: 'Aktif',
    permissions: {}
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    try {
      const response = await authFetch(`/api/roles/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          level: data.level,
          name: data.name,
          status: data.status,
          permissions: data.permissions || {}
        });
      }
    } catch (err) {
      console.error('Fetch role error:', err);
    }
  };

  const handlePermissionChange = (moduleId, action) => {
    const newPerms = { ...formData.permissions };
    if (!newPerms[moduleId]) newPerms[moduleId] = [];
    
    if (newPerms[moduleId].includes(action)) {
      newPerms[moduleId] = newPerms[moduleId].filter(a => a !== action);
    } else {
      newPerms[moduleId] = [...newPerms[moduleId], action];
    }
    
    setFormData({ ...formData, permissions: newPerms });
  };

  const handleSelectAll = (checked) => {
    if (!checked) {
      setFormData({ ...formData, permissions: {} });
    } else {
      const allPerms = {};
      MODULES.forEach(m => {
        if (m.isHeader) {
          m.submodules.forEach(sm => {
            allPerms[sm.id] = sm.actions;
          });
        } else {
          allPerms[m.id] = m.actions;
        }
      });
      setFormData({ ...formData, permissions: allPerms });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/roles/${id}` : '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: currentCompanyId
        }),
      });

      if (response.ok) {
        success('Berhasil', isEdit ? 'Hak akses berhasil diperbarui' : 'Hak akses berhasil dibuat');
        navigate('/pengaturan/hak-akses');
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal menyimpan hak akses.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showError('Kesalahan Jaringan', 'Terjadi kesalahan jaringan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const isAllSelected = () => {
    let totalPossible = 0;
    let totalSelected = 0;
    MODULES.forEach(m => {
      if (m.isHeader) {
        m.submodules.forEach(sm => {
          totalPossible += sm.actions.length;
          totalSelected += (formData.permissions[sm.id] || []).length;
        });
      } else {
        totalPossible += m.actions.length;
        totalSelected += (formData.permissions[m.id] || []).length;
      }
    });
    return totalPossible > 0 && totalPossible === totalSelected;
  };

  const renderRow = (module) => {
    if (module.isHeader) {
      return (
        <React.Fragment key={module.id}>
          <tr className="bg-[#F9F9F9]">
            <td colSpan={7} className="px-6 py-3 text-[13px] font-bold text-[#181C32]">
              {module.label}
            </td>
          </tr>
          {module.submodules.map(sm => renderRow(sm))}
        </React.Fragment>
      );
    }

    return (
      <tr key={module.id} className="border-b border-[#F1F1F4] hover:bg-[#FBFCFD] transition-colors">
        <td className="px-10 py-4 text-[13px] text-[#3F4254] font-medium min-w-[200px]">
          {module.label}
        </td>
        {ACTIONS.map(action => {
          const isAvailable = module.actions.includes(action);
          const isChecked = (formData.permissions[module.id] || []).includes(action);

          return (
            <td key={action} className="px-6 py-4 text-center">
              {isAvailable ? (
                <div 
                  className={`w-5 h-5 mx-auto rounded border flex items-center justify-center cursor-pointer transition-all ${
                    isChecked ? 'bg-[#0095E8] border-[#0095E8]' : 'bg-white border-[#E4E6EF] hover:border-[#0095E8]'
                  }`}
                  onClick={() => handlePermissionChange(module.id, action)}
                >
                  {isChecked && <Check size={14} className="text-white" />}
                </div>
              ) : (
                <div className="w-5 h-5 mx-auto rounded border border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"></div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="p-8 px-10">
      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Header Banner */}
        <div className="mx-8 mt-8 p-4 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg flex items-center gap-3">
          <Info size={18} className="text-[#0095E8]" />
          <span className="text-sm text-[#3F4254]">Tanda (<span className="text-[#F1416C]">*</span>) adalah wajib di isi</span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
            {/* Level */}
            <div className="flex items-center gap-8">
              <label className="w-48 text-sm text-[#3F4254]">Level hak akses <span className="text-[#F1416C]">*</span></label>
              <div className="flex-1 max-w-2xl relative">
                <select
                  name="level"
                  required
                  value={formData.level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    const levelPrefix = newLevel ? `${newLevel} - ` : '';
                    setFormData({ 
                      ...formData, 
                      level: newLevel,
                      name: formData.name.replace(/^(L\d - )/, levelPrefix) || levelPrefix
                    });
                  }}
                  className="w-full appearance-none px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm text-[#3F4254] focus:outline-none focus:border-[#0095E8] transition-colors"
                >
                  <option value="">Pilih level hak akses</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
            </div>

            {/* Nama */}
            <div className="flex items-center gap-8">
              <label className="w-48 text-sm text-[#3F4254]">Nama hak akses <span className="text-[#F1416C]">*</span></label>
              <input 
                type="text"
                name="name"
                placeholder="Masukkan nama hak akses"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="flex-1 max-w-2xl px-4 py-3 bg-white border border-[#F1F1F4] rounded-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors"
              />
            </div>
          </div>

          {/* Matrix Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[#181C32] text-center mb-6">Pilihan Hak Akses</h3>
            
            {!formData.level ? (
              <div className="py-12 bg-[#F9F9F9] rounded-xl border border-dashed border-[#E4E6EF] text-center">
                <p className="text-[13px] text-[#A1A5B7]">Pilih level hak akses terlebih dahulu</p>
              </div>
            ) : (
              <div className="border border-[#F1F1F4] rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F8FA] border-b border-[#F1F1F4]">
                      <th className="px-6 py-4 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider w-[300px]">Akses</th>
                      {ACTIONS.map(action => (
                        <th key={action} className="px-6 py-4 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider text-center">
                          {action}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-white border-b border-[#F1F1F4]">
                      <td className="px-6 py-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected()}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 rounded border-[#E4E6EF] text-[#0095E8] focus:ring-[#0095E8]"
                          />
                          <span className="text-[12px] font-semibold text-[#3F4254] group-hover:text-[#0095E8] transition-colors">Pilih Semua</span>
                        </label>
                      </td>
                      <td colSpan={6}></td>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(module => renderRow(module))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/pengaturan/hak-akses')}
              className="px-6 py-3 rounded-lg border border-[#F1F1F4] text-[#7E8299] font-bold text-[13px] hover:bg-[#F9F9F9] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !formData.level}
              className="px-8 py-3 rounded-lg bg-[#0095E8] text-white font-bold text-[13px] hover:bg-[#0073B7] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Buat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuatHakAkses;
