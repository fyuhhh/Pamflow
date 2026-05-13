import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Package,
  Trash2,
  CheckCircle2,
  Filter,
  X,
  ChevronRight,
  ChevronDown,
  Camera,
  Maximize2
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/imageOptimizer';

const RegisterAset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // Dynamic Dropdowns
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  const [showNewPriorityInput, setShowNewPriorityInput] = useState(false);
  const [newPriorityLabel, setNewPriorityLabel] = useState('');
  
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  
  const { success, error: showError, confirm } = useModal();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nama_mesin: '',
    brand: '',
    model_tipe: '',
    serial_number: '',
    lokasi: '',
    prioritas: 'Sedang',
    status: 'Baik',
    catatan: '',
    lampiran: []
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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 }))
      );

      const base64Strings = await Promise.all(
        compressedFiles.map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => resolve(reader.result);
        }))
      );

      setFormData(prev => ({
        ...prev,
        lampiran: [...prev.lampiran, ...base64Strings].slice(0, 5) // Limit to 5 images
      }));
    } catch (err) {
      showError('Error', 'Gagal memproses gambar');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      lampiran: prev.lampiran.filter((_, i) => i !== index)
    }));
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
        success('Berhasil', 'Aset berhasil didaftarkan', () => {
          setShowModal(false);
          setFormData({
            nama_mesin: '',
            brand: '',
            model_tipe: '',
            serial_number: '',
            lokasi: '',
            prioritas: 'Sedang',
            status: 'Baik',
            catatan: '',
            lampiran: []
          });
          fetchAssets();
        });
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
      <div className="bg-white p-4 rounded-2xl border border-[#F1F1F4] shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
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
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E4E6EF] text-[#7E8299] rounded-xl text-[13px] font-bold hover:bg-[#F9F9F9] transition-all w-full md:w-auto justify-center">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Asset List Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 bg-[#0095E8] rounded-full"></div>
        <h2 className="text-[20px] font-bold text-[#181C32] tracking-tight">Data yang baru saja ditambahkan</h2>
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
                      <div>
                        <p className="text-[14px] font-medium text-[#181C32]">{asset.nama_mesin}</p>
                        <p className="text-[12px] text-[#A1A5B7]">{asset.brand || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-[13px] font-medium text-[#4B5563]">{asset.model_tipe || '-'}</p>
                        <p className="text-[12px] text-[#A1A5B7]">S/N: <span className="font-mono text-[#0095E8]">{asset.serial_number || 'N/A'}</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
                          <MapPin size={14} className="text-[#A1A5B7]" />
                          {asset.lokasi || '-'}
                        </div>
                        <div className="text-[12px] text-[#A1A5B7] font-medium flex items-center gap-1">
                          Kondisi: <span className={`${getStatusColor(asset.status)}`}>{asset.status || 'Baik'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-tight ${getPriorityColor(asset.prioritas)}`}>
                        {asset.prioritas}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end">
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
              className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
            >
              <div className="p-8 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]">
                <div>
                  <h2 className="text-[24px] font-black text-[#181C32] tracking-tight">Daftarkan Aset Baru</h2>
                  <p className="text-[13px] text-[#A1A5B7] font-medium">Lengkapi rincian data aset operasional Anda</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full text-[#A1A5B7] transition-all shadow-sm border border-[#E4E6EF]/40"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Left Column: Text Data */}
                  <div className="space-y-6">
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#3F4254]">Brand</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3.5 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-semibold"
                          placeholder="Daikin"
                          value={formData.brand}
                          onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#3F4254]">Model/Tipe</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3.5 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-semibold"
                          placeholder="VRV IV"
                          value={formData.model_tipe}
                          onChange={(e) => setFormData({...formData, model_tipe: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#3F4254]">Serial Number</label>
                      <input 
                        type="text"
                        className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-bold text-[#0095E8] focus:ring-2 focus:ring-[#0095E8]/20 transition-all font-mono"
                        placeholder="SN-XXXXXXXX"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#3F4254]">Lokasi</label>
                      <input 
                        type="text"
                        className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-semibold"
                        placeholder="Lantai 3 / Rooftop"
                        value={formData.lokasi}
                        onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Right Column: Dropdowns & Notes */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Priority */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#3F4254]">Prioritas</label>
                        {!showNewPriorityInput ? (
                          <div className="relative">
                            <select 
                              className="w-full px-4 py-3.5 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-semibold appearance-none pr-10 cursor-pointer"
                              value={formData.prioritas}
                              onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewPriorityInput(true) : setFormData({...formData, prioritas: e.target.value})}
                            >
                              {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                              <option value="ADD_NEW">+ Tambah...</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={16} />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <input 
                              autoFocus
                              className="w-full px-3 py-2 bg-[#F1FAFF] border border-[#0095E8]/20 rounded-xl text-[13px] font-bold"
                              placeholder="Nama baru..."
                              value={newPriorityLabel}
                              onChange={(e) => setNewPriorityLabel(e.target.value)}
                            />
                            <div className="flex gap-1">
                              <button type="button" onClick={handleAddPriority} className="flex-1 py-1.5 bg-[#0095E8] text-white text-[11px] font-bold rounded-lg">OK</button>
                              <button type="button" onClick={() => setShowNewPriorityInput(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-lg">X</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#3F4254]">Kondisi</label>
                        {!showNewStatusInput ? (
                          <div className="relative">
                            <select 
                              className="w-full px-4 py-3.5 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-semibold appearance-none pr-10 cursor-pointer"
                              value={formData.status}
                              onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewStatusInput(true) : setFormData({...formData, status: e.target.value})}
                            >
                              {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                              <option value="ADD_NEW">+ Tambah...</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={16} />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <input 
                              autoFocus
                              className="w-full px-3 py-2 bg-[#F1FAFF] border border-[#0095E8]/20 rounded-xl text-[13px] font-bold"
                              placeholder="Kondisi baru..."
                              value={newStatusLabel}
                              onChange={(e) => setNewStatusLabel(e.target.value)}
                            />
                            <div className="flex gap-1">
                              <button type="button" onClick={handleAddStatus} className="flex-1 py-1.5 bg-[#0095E8] text-white text-[11px] font-bold rounded-lg">OK</button>
                              <button type="button" onClick={() => setShowNewStatusInput(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-lg">X</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#3F4254]">Catatan Tambahan</label>
                      <textarea 
                        rows="6"
                        className="w-full px-5 py-4 bg-[#F9F9F9] border-none rounded-2xl text-[14px] font-medium resize-none placeholder:text-[#A1A5B7] placeholder:font-normal"
                        placeholder="Spesifikasi teknis, riwayat, dll..."
                        value={formData.catatan}
                        onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Image Upload Section - Full Width */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[13px] font-bold text-[#3F4254]">Foto Lampiran Aset (Max 5)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {formData.lampiran.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#F1F1F4] group shadow-sm">
                          <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => setZoomedImage(img)}
                              className="w-8 h-8 rounded-full bg-white text-[#181C32] flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Maximize2 size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {formData.lampiran.length < 5 && (
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-[#E4E6EF] bg-[#F9F9F9] flex flex-col items-center justify-center gap-2 text-[#A1A5B7] hover:bg-[#F1FAFF] hover:border-[#0095E8] hover:text-[#0095E8] transition-all"
                        >
                          <Camera size={24} />
                          <span className="text-[11px] font-bold">Unggah Foto</span>
                          <input 
                            type="file"
                            multiple
                            accept="image/jpeg,image/png"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex gap-4 pt-6 border-t border-[#F1F1F4]">
                  <button 
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[#F9F9F9] text-[#7E8299] rounded-2xl font-bold text-[15px] hover:bg-[#F1F1F4] transition-all border border-[#E4E6EF]/50"
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

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#181C32]/90 backdrop-blur-md" onClick={() => setZoomedImage(null)}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-auto rounded-[32px] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <img src={zoomedImage} alt="Zoom" className="w-full h-auto max-h-[90vh] object-contain" />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={24} />
              </button>
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
