import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Package, 
  MapPin, 
  Tag, 
  Calendar,
  User,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
  ChevronDown,
  Info
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';

const RegisterAset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Dynamic Dropdowns
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  const [showNewPriorityInput, setShowNewPriorityInput] = useState(false);
  const [newPriorityLabel, setNewPriorityLabel] = useState('');
  
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  
  const { success, error: showError, confirm } = useModal();

  const [formData, setFormData] = useState({
    nama_mesin: '',
    brand: '',
    model_tipe: '',
    serial_number: '',
    lokasi: '',
    prioritas: 'Sedang',
    status: 'Baik',
    catatan: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchPriorities();
    fetchStatuses();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await authFetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriorities = async () => {
    try {
      const response = await authFetch('/api/assets/priorities');
      if (response.ok) {
        const data = await response.json();
        setPriorities(data);
      }
    } catch (err) {
      console.error('Fetch priorities error:', err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await authFetch('/api/assets/statuses');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (err) {
      console.error('Fetch statuses error:', err);
    }
  };

  const handleAddPriority = async () => {
    if (!newPriorityLabel.trim()) return;
    try {
      const response = await authFetch('/api/assets/priorities', {
        method: 'POST',
        body: JSON.stringify({ label: newPriorityLabel })
      });
      if (response.ok) {
        await fetchPriorities();
        setFormData({ ...formData, prioritas: newPriorityLabel });
        setNewPriorityLabel('');
        setShowNewPriorityInput(false);
      }
    } catch (err) {
      showError('Error', 'Gagal menambah prioritas baru');
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusLabel.trim()) return;
    try {
      const response = await authFetch('/api/assets/statuses', {
        method: 'POST',
        body: JSON.stringify({ label: newStatusLabel })
      });
      if (response.ok) {
        await fetchStatuses();
        setFormData({ ...formData, status: newStatusLabel });
        setNewStatusLabel('');
        setShowNewStatusInput(false);
      }
    } catch (err) {
      showError('Error', 'Gagal menambah kondisi baru');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await authFetch('/api/assets', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        success('Berhasil', 'Aset berhasil didaftarkan');
        setShowModal(false);
        setFormData({
          nama_mesin: '',
          brand: '',
          model_tipe: '',
          serial_number: '',
          lokasi: '',
          prioritas: 'Sedang',
          status: 'Baik',
          catatan: ''
        });
        fetchAssets();
      } else {
        const data = await response.json();
        showError('Gagal', data.message || 'Gagal mendaftarkan aset');
      }
    } catch (err) {
      showError('Error', 'Terjadi kesalahan pada server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    confirm('Hapus Aset', 'Apakah Anda yakin ingin menghapus aset ini?', async () => {
      try {
        const response = await authFetch(`/api/assets/${id}`, { method: 'DELETE' });
        if (response.ok) {
          success('Berhasil', 'Aset berhasil dihapus');
          fetchAssets();
        }
      } catch (err) {
        showError('Error', 'Gagal menghapus aset');
      }
    });
  };

  const filteredAssets = assets.filter(asset => 
    asset.nama_mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (p) => {
    const pLow = p?.toLowerCase();
    if (pLow === 'tinggi' || pLow === 'kritis') return 'bg-red-50 text-red-600 border-red-100';
    if (pLow === 'sedang') return 'bg-amber-50 text-amber-600 border-amber-100';
    if (pLow === 'rendah') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getStatusColor = (s) => {
    const sLow = s?.toLowerCase();
    if (sLow === 'baik' || sLow === 'normal') return 'text-[#50CD89]';
    if (sLow === 'maintenance' || sLow === 'perbaikan') return 'text-[#FFC700]';
    if (sLow === 'rusak' || sLow === 'breakdown') return 'text-[#F1416C]';
    return 'text-[#A1A5B7]';
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-black text-[#181C32] tracking-tight mb-1">Register Aset</h1>
          <p className="text-[#A1A5B7] text-[14px] font-medium">Manajemen dan pendaftaran aset operasional perusahaan</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0095E8] text-white rounded-xl font-bold text-[14px] hover:bg-[#0084CC] transition-all shadow-lg shadow-[#0095E8]/20"
        >
          <Plus size={18} />
          <span>Tambah Aset Baru</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F1F1F4] shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama mesin, brand, atau serial number..."
            className="w-full pl-12 pr-4 py-3 bg-[#F9F9F9] border-none rounded-xl text-[14px] focus:ring-2 focus:ring-[#0095E8]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-[#E4E6EF] text-[#7E8299] rounded-xl text-[13px] font-bold hover:bg-[#F9F9F9] transition-all w-full md:w-auto justify-center">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Asset List Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-[#0095E8] rounded-full"></div>
        <h2 className="text-[20px] font-black text-[#181C32] tracking-tight">Data yang baru saja ditambahkan</h2>
      </div>

      {/* Asset List */}
      <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Info Mesin</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Spesifikasi</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi & Kondisi</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Prioritas</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Monitoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package size={48} className="text-[#E4E6EF] mb-4" />
                      <p className="text-[#A1A5B7] font-medium">Belum ada aset yang terdaftar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F9F9F9]/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F1FAFF] text-[#0095E8] flex items-center justify-center shadow-sm border border-[#0095E8]/10">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[#181C32]">{asset.nama_mesin}</p>
                          <p className="text-[12px] text-[#A1A5B7] font-bold">{asset.brand || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-[13px] font-bold text-[#4B5563]">{asset.model_tipe || '-'}</p>
                        <p className="text-[12px] text-[#A1A5B7]">S/N: <span className="font-mono text-[#0095E8] font-bold">{asset.serial_number || 'N/A'}</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[13px] text-[#4B5563] font-bold">
                          <MapPin size={14} className="text-[#A1A5B7]" />
                          {asset.lokasi || '-'}
                        </div>
                        <div className="text-[12px] text-[#A1A5B7] font-medium flex items-center gap-1">
                          Kondisi: <span className={`font-black ${getStatusColor(asset.status)}`}>{asset.status || 'Baik'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-tight ${getPriorityColor(asset.prioritas)}`}>
                        {asset.prioritas}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => window.location.href = '/aset/monitoring'}
                          className="w-9 h-9 flex items-center justify-center bg-[#F1FAFF] text-[#0095E8] rounded-xl hover:bg-[#0095E8] hover:text-white transition-all shadow-sm border border-[#0095E8]/10"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Aset */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#181C32]/40 backdrop-blur-sm"
              onClick={() => !submitting && setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]">
                <div>
                  <h2 className="text-[24px] font-black text-[#181C32] tracking-tight">Daftarkan Aset Baru</h2>
                  <p className="text-[13px] text-[#A1A5B7] font-bold">Pastikan data yang dimasukkan akurat dan lengkap</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full text-[#A1A5B7] transition-all shadow-sm border border-[#E4E6EF]/40"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Nama Mesin / Aset <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all placeholder:text-[#A1A5B7] placeholder:font-normal"
                      placeholder="Contoh: AC Central Chiller"
                      value={formData.nama_mesin}
                      onChange={(e) => setFormData({...formData, nama_mesin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Brand / Merk</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all placeholder:text-[#A1A5B7] placeholder:font-normal"
                      placeholder="Contoh: Daikin"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Model / Tipe</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all placeholder:text-[#A1A5B7] placeholder:font-normal"
                      placeholder="Contoh: VRV IV-S"
                      value={formData.model_tipe}
                      onChange={(e) => setFormData({...formData, model_tipe: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Serial Number</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-black text-[#0095E8] focus:ring-2 focus:ring-[#0095E8]/20 transition-all font-mono"
                      placeholder="SN-123456789"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Lokasi Penempatan</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all placeholder:text-[#A1A5B7] placeholder:font-normal"
                      placeholder="Contoh: Rooftop Pentacity"
                      value={formData.lokasi}
                      onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                    />
                  </div>
                  
                  {/* Priority Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Prioritas Aset</label>
                    {!showNewPriorityInput ? (
                      <div className="relative">
                        <select 
                          className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all appearance-none pr-12 cursor-pointer"
                          value={formData.prioritas}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewPriorityInput(true);
                            } else {
                              setFormData({...formData, prioritas: e.target.value});
                            }
                          }}
                        >
                          {priorities.map(p => (
                            <option key={p.id} value={p.label}>{p.label}</option>
                          ))}
                          <option value="ADD_NEW" className="text-[#0095E8] font-black">+ Tambah Baru...</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={18} />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          className="flex-1 px-5 py-4 bg-[#F1FAFF] border border-[#0095E8]/20 rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all"
                          placeholder="Nama prioritas..."
                          value={newPriorityLabel}
                          onChange={(e) => setNewPriorityLabel(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={handleAddPriority}
                          className="px-6 bg-[#0095E8] text-white rounded-2xl font-black text-[12px] hover:bg-[#0084CC] transition-colors"
                        >
                          Simpan
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowNewPriorityInput(false)}
                          className="px-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[12px] hover:bg-slate-200 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Kondisi Aset</label>
                    {!showNewStatusInput ? (
                      <div className="relative">
                        <select 
                          className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all appearance-none pr-12 cursor-pointer"
                          value={formData.status}
                          onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewStatusInput(true);
                            } else {
                              setFormData({...formData, status: e.target.value});
                            }
                          }}
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.label}>{s.label}</option>
                          ))}
                          <option value="ADD_NEW" className="text-[#0095E8] font-black">+ Tambah Baru...</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={18} />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          className="flex-1 px-5 py-4 bg-[#F1FAFF] border border-[#0095E8]/20 rounded-2xl text-[14px] font-bold text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all"
                          placeholder="Nama kondisi..."
                          value={newStatusLabel}
                          onChange={(e) => setNewStatusLabel(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={handleAddStatus}
                          className="px-6 bg-[#0095E8] text-white rounded-2xl font-black text-[12px] hover:bg-[#0084CC] transition-colors"
                        >
                          Simpan
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowNewStatusInput(false)}
                          className="px-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[12px] hover:bg-slate-200 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[13px] font-bold text-[#3F4254]">Catatan Tambahan (Opsional)</label>
                    <textarea 
                      rows="4"
                      className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-medium text-[#181C32] focus:ring-2 focus:ring-[#0095E8]/20 transition-all resize-none placeholder:text-[#A1A5B7] placeholder:font-normal"
                      placeholder="Jelaskan spesifikasi detail, riwayat singkat, atau catatan teknis lainnya..."
                      value={formData.catatan}
                      onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-[#F1F1F4] sticky bottom-0 bg-white">
                  <button 
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[#F9F9F9] text-[#7E8299] rounded-2xl font-bold text-[15px] hover:bg-[#F1F1F4] transition-all disabled:opacity-50 border border-[#E4E6EF]/50"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-[#0095E8] text-white rounded-2xl font-black text-[15px] hover:bg-[#0084CC] transition-all shadow-xl shadow-[#0095E8]/30 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        <span>Simpan Data Aset</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RegisterAset;
