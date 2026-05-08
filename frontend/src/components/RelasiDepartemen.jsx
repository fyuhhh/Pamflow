import React, { useState, useEffect } from 'react';
import { Link2, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import SearchableSelect from './SearchableSelect';

const RelasiDepartemen = () => {
  const { success, error: showError, confirm } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
  const company_id = user?.company_id || 1;

  const [relations, setRelations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ source_dept_id: '', target_dept_id: '' });
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [relRes, deptRes] = await Promise.all([
        authFetch(`/api/dept-relations?company_id=${company_id}`),
        authFetch(`/api/departments?company_id=${company_id}`)
      ]);
      const [rels, depts] = await Promise.all([relRes.json(), deptRes.json()]);
      setRelations(Array.isArray(rels) ? rels : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (e) {
      showError('Gagal', 'Gagal memuat data relasi departemen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.source_dept_id || !form.target_dept_id) {
      setFormError('Pilih departemen asal dan tujuan');
      return;
    }
    if (form.source_dept_id === form.target_dept_id) {
      setFormError('Departemen asal dan tujuan tidak boleh sama');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/dept-relations', {
        method: 'POST',
        body: JSON.stringify({
          company_id,
          source_dept_id: form.source_dept_id,
          target_dept_id: form.target_dept_id,
          created_by_id: user?.id,
          created_by_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        success('Berhasil', data.message);
        setShowForm(false);
        setForm({ source_dept_id: '', target_dept_id: '' });
        fetchData();
      } else {
        setFormError(data.message || 'Gagal menambah relasi');
      }
    } catch (e) {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rel) => {
    try {
      const res = await authFetch(`/api/dept-relations/${rel.id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setRelations(prev => prev.map(r => r.id === rel.id ? { ...r, is_active: data.is_active } : r));
      }
    } catch (e) {
      showError('Gagal', 'Gagal mengubah status relasi');
    }
  };

  const handleDelete = (rel) => {
    confirm(
      'Hapus Relasi',
      `Hapus relasi ${rel.source_name} → ${rel.target_name}? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const res = await authFetch(`/api/dept-relations/${rel.id}`, { method: 'DELETE' });
          if (res.ok) {
            success('Berhasil', 'Relasi berhasil dihapus');
            setRelations(prev => prev.filter(r => r.id !== rel.id));
          }
        } catch (e) {
          showError('Gagal', 'Gagal menghapus relasi');
        }
      }
    );
  };

  return (
    <div className="p-8 px-10 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[18px] font-bold text-[#181C32]">Relasi Departemen</h2>
          <p className="text-[12px] text-[#7E8299] mt-1">
            Kelola hubungan antar departemen untuk alur checklist dan Work Order otomatis
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); setForm({ source_dept_id: '', target_dept_id: '' }); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0095E8] text-white rounded-lg text-[13px] font-bold hover:bg-[#0084CC] transition-colors"
        >
          <Plus size={16} /> Tambah Relasi
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-[#F1FAFF] border border-[#D6EEFB] rounded-xl px-5 py-4 mb-6">
        <AlertCircle size={16} className="text-[#0095E8] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] text-[#0095E8] font-semibold">Cara Kerja Relasi Departemen</p>
          <p className="text-[11px] text-[#0095E8]/80 mt-0.5">
            Departemen <strong>Asal</strong> (misal: Operasional) dapat membuat checklist harian dan menghasilkan Work Order otomatis ke departemen <strong>Tujuan</strong> (misal: Engineering) untuk item yang rusak/bermasalah.
          </p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-[#E4E6EF] rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#181C32] mb-5">Tambah Relasi Baru</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#3F4254] mb-1.5 block">
                  Departemen Asal <span className="text-[#F1416C]">*</span>
                </label>
                <SearchableSelect
                  name="source_dept_id"
                  options={departments}
                  value={form.source_dept_id}
                  valueField="id"
                  labelField="name"
                  onChange={e => setForm(p => ({ ...p, source_dept_id: e.target.value }))}
                  placeholder="Pilih departemen asal"
                />
                <p className="text-[10px] text-[#A1A5B7] mt-1">Dept yang melakukan checklist (misal: Operasional)</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#3F4254] mb-1.5 block">
                  Departemen Tujuan <span className="text-[#F1416C]">*</span>
                </label>
                <SearchableSelect
                  name="target_dept_id"
                  options={departments}
                  value={form.target_dept_id}
                  valueField="id"
                  labelField="name"
                  onChange={e => setForm(p => ({ ...p, target_dept_id: e.target.value }))}
                  placeholder="Pilih departemen tujuan"
                />
                <p className="text-[10px] text-[#A1A5B7] mt-1">Dept yang menerima & mengerjakan WO (misal: Engineering)</p>
              </div>
            </div>
            {formError && (
              <p className="text-[12px] text-[#F1416C] flex items-center gap-1.5">
                <AlertCircle size={13} /> {formError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-[#E4E6EF] rounded-lg text-[13px] font-semibold text-[#7E8299] hover:bg-gray-50">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-[#0095E8] text-white rounded-lg text-[13px] font-bold hover:bg-[#0084CC] disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan Relasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Relations List */}
      {loading ? (
        <div className="text-center py-16 text-[#A1A5B7] text-[13px]">Memuat data...</div>
      ) : relations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#F1F1F4]">
          <Building2 size={40} className="text-[#E4E6EF] mx-auto mb-3" />
          <p className="text-[14px] font-bold text-[#3F4254]">Belum ada relasi departemen</p>
          <p className="text-[12px] text-[#A1A5B7] mt-1">Tambah relasi untuk mengaktifkan alur checklist & WO otomatis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {relations.map(rel => (
            <div key={rel.id}
              className={`bg-white border rounded-xl px-6 py-5 flex items-center gap-6 transition-all ${rel.is_active ? 'border-[#E4E6EF]' : 'border-[#F1F1F4] opacity-60'}`}>
              {/* Dept pills */}
              <div className="flex items-center gap-3 flex-1">
                <span className="px-3 py-1.5 bg-[#F1FAFF] text-[#0095E8] rounded-lg text-[12px] font-bold border border-[#D6EEFB]">
                  {rel.source_name}
                </span>
                <Link2 size={16} className={rel.is_active ? 'text-[#0095E8]' : 'text-[#A1A5B7]'} />
                <span className="px-3 py-1.5 bg-[#F5F8FA] text-[#3F4254] rounded-lg text-[12px] font-bold border border-[#E4E6EF]">
                  {rel.target_name}
                </span>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                {rel.is_active
                  ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#50CD89] bg-[#E8FFF3] px-3 py-1 rounded-full">
                      <CheckCircle2 size={12} /> Aktif
                    </span>
                  : <span className="text-[11px] font-bold text-[#A1A5B7] bg-[#F5F8FA] px-3 py-1 rounded-full">
                      Nonaktif
                    </span>
                }
              </div>

              {/* Creator info */}
              {rel.created_by_name && (
                <span className="text-[11px] text-[#A1A5B7] hidden md:block">
                  oleh {rel.created_by_name}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(rel)}
                  title={rel.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  className="p-2 rounded-lg hover:bg-[#F5F8FA] text-[#A1A5B7] hover:text-[#0095E8] transition-colors">
                  {rel.is_active ? <ToggleRight size={20} className="text-[#0095E8]" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => handleDelete(rel)}
                  title="Hapus relasi"
                  className="p-2 rounded-lg hover:bg-[#FFF5F8] text-[#A1A5B7] hover:text-[#F1416C] transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelasiDepartemen;
