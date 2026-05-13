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
  Maximize2,
  Clock,
  User,
  Calendar,
  Settings,
  Info,
  FileText,
  Tool
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
  const [locations, setLocations] = useState([]);
  
  const [showNewPriorityInput, setShowNewPriorityInput] = useState(false);
  const [newPriorityLabel, setNewPriorityLabel] = useState('');
  
  const [showNewStatusInput, setShowNewStatusInput] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');

  const [showNewLocationInput, setShowNewLocationInput] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState('');
  
  const { success, error: showError } = useModal();
  const fileInputRef = useRef(null);

  // Maintenance conversion state
  const [maintInput, setMaintInput] = useState({ days: 0, hours: 0 });

  const [formData, setFormData] = useState({
    nama_mesin: '',
    brand: '',
    model_tipe: '',
    serial_number: '',
    lokasi: '',
    prioritas: 'Sedang',
    status: 'Baik',
    catatan: '',
    lampiran: [],
    maintenance_hours: 0
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchPriorities();
    fetchStatuses();
    fetchLocations();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await authFetch('/api/assets?limit=5');
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

  const fetchLocations = async () => {
    try {
      const response = await authFetch('/api/assets/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Fetch locations error:', err);
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

  const handleAddLocation = async () => {
    if (!newLocationLabel.trim()) return;
    try {
      const response = await authFetch('/api/assets/locations', {
        method: 'POST',
        body: JSON.stringify({ label: newLocationLabel })
      });
      if (response.ok) {
        await fetchLocations();
        setFormData({ ...formData, lokasi: newLocationLabel });
        setNewLocationLabel('');
        setShowNewLocationInput(false);
      }
    } catch (err) {
      showError('Error', 'Gagal menambah lokasi baru');
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
        lampiran: [...prev.lampiran, ...base64Strings].slice(0, 5) 
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

  const handleMaintenanceInput = (type, val) => {
    const num = parseInt(val) || 0;
    const newInput = { ...maintInput, [type]: num };
    setMaintInput(newInput);
    const totalHours = (newInput.days * 24) + newInput.hours;
    setFormData(prev => ({ ...prev, maintenance_hours: totalHours }));
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
            lampiran: [],
            maintenance_hours: 0
          });
          setMaintInput({ days: 0, hours: 0 });
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F8F9FA]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-[32px] font-black text-[#181C32] tracking-tight mb-2">Manajemen Aset</h1>
          <p className="text-[#7E8299] text-[15px] font-medium max-w-md leading-relaxed">
            Pusat registrasi dan pemantauan aset operasional perusahaan Anda.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-3 px-8 py-4 bg-[#0095E8] text-white rounded-[20px] font-black text-[15px] hover:bg-[#0084CC] transition-all shadow-xl shadow-[#0095E8]/25 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <span>Daftarkan Aset Baru</span>
        </button>
      </div>

      {/* Quick Search & Filters */}
      <div className="bg-white p-5 rounded-[24px] border border-[#F1F1F4] shadow-sm mb-12 flex flex-col md:flex-row gap-5 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari aset berdasarkan nama, merk, atau serial..."
            className="w-full pl-14 pr-6 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[18px] text-[15px] focus:bg-white focus:border-[#0095E8]/20 focus:ring-4 focus:ring-[#0095E8]/5 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2.5 px-7 py-4 bg-white border-2 border-[#F1F1F4] text-[#3F4254] rounded-[18px] text-[14px] font-bold hover:bg-[#F9F9F9] hover:border-[#E4E6EF] transition-all w-full md:w-auto justify-center">
          <Filter size={18} />
          <span>Filter Lanjutan</span>
        </button>
      </div>

      {/* Main Table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-[#0095E8] rounded-full"></div>
            <h2 className="text-[22px] font-black text-[#181C32] tracking-tight">5 Data Terbaru</h2>
          </div>
          <span className="text-[13px] font-bold text-[#A1A5B7] bg-[#F1F1F4] px-4 py-1.5 rounded-full">
            Total Terdaftar: {assets.length}
          </span>
        </div>

        <div className="bg-white rounded-[32px] border border-[#F1F1F4] shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9F9]/50 border-b border-[#F1F1F4]">
                  <th className="px-8 py-6 text-[12px] font-black text-[#7E8299] uppercase tracking-[0.1em]">Informasi Dasar</th>
                  <th className="px-8 py-6 text-[12px] font-black text-[#7E8299] uppercase tracking-[0.1em]">Lokasi & Kondisi</th>
                  <th className="px-8 py-6 text-[12px] font-black text-[#7E8299] uppercase tracking-[0.1em]">Jadwal Servis</th>
                  <th className="px-8 py-6 text-[12px] font-black text-[#7E8299] uppercase tracking-[0.1em]">Admin / Waktu</th>
                  <th className="px-8 py-6 text-[12px] font-black text-[#7E8299] uppercase tracking-[0.1em] text-right">Monitoring</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F4]">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-8 py-10"><div className="h-6 bg-slate-100 rounded-xl w-full"></div></td>
                    </tr>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center max-w-xs mx-auto">
                        <div className="w-20 h-20 bg-[#F9F9F9] rounded-full flex items-center justify-center mb-6">
                          <Package size={40} className="text-[#E4E6EF]" />
                        </div>
                        <h3 className="text-[16px] font-bold text-[#181C32] mb-1">Data Kosong</h3>
                        <p className="text-[#A1A5B7] text-[13px]">Belum ada aset yang didaftarkan dalam sistem.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#F9F9F9]/80 transition-all group">
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#F1FAFF] rounded-2xl flex items-center justify-center text-[#0095E8] group-hover:scale-110 transition-transform shadow-sm">
                            <Settings size={22} />
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-[#181C32] leading-none mb-1.5">{asset.nama_mesin}</p>
                            <p className="text-[12px] font-bold text-[#7E8299] flex items-center gap-2">
                              {asset.brand || 'No Brand'} 
                              <span className="w-1 h-1 bg-[#D8D8E5] rounded-full"></span>
                              <span className="font-mono text-[#0095E8] bg-[#E8F6FF] px-1.5 rounded leading-none pt-0.5">{asset.serial_number || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[14px] font-bold text-[#3F4254]">
                            <MapPin size={15} className="text-[#A1A5B7]" />
                            {asset.lokasi || 'Lokasi Belum Diatur'}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-[12px] font-black tracking-tight px-3 py-1 rounded-lg ${getStatusColor(asset.status)} bg-current/10`}>
                              {asset.status}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-wider ${getPriorityColor(asset.prioritas)}`}>
                              {asset.prioritas}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4]">
                          <Clock size={16} className="text-[#0095E8]" />
                          <div className="text-[13px] font-black text-[#181C32]">
                            {asset.maintenance_hours > 0 ? (
                              <span>Setiap {asset.maintenance_hours} Jam</span>
                            ) : (
                              <span className="text-[#A1A5B7] font-bold italic">Tanpa Jadwal</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[13px] font-black text-[#3F4254]">
                            <div className="w-6 h-6 bg-[#E8FFF3] rounded-full flex items-center justify-center text-[#50CD89]">
                              <User size={12} />
                            </div>
                            {asset.firstName} {asset.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#A1A5B7] font-bold px-1">
                            <Calendar size={12} />
                            {formatDateTime(asset.created_at).date} <span className="text-[#E4E6EF]">|</span> {formatDateTime(asset.created_at).time}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <button 
                          onClick={() => window.location.href = '/aset/monitoring'}
                          className="inline-flex items-center justify-center w-11 h-11 bg-white border-2 border-[#F1F1F4] text-[#0095E8] rounded-2xl hover:bg-[#0095E8] hover:text-white hover:border-[#0095E8] transition-all shadow-sm group/btn"
                        >
                          <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal - Modern Redesign */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#181C32]/50 backdrop-blur-md"
              onClick={() => !submitting && setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-4 border-white"
            >
              {/* Header */}
              <div className="px-10 py-8 border-b border-[#F1F1F4] flex items-center justify-between bg-gradient-to-r from-[#F9F9F9] to-white">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#0095E8] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#0095E8]/30">
                      <Plus size={24} />
                    </div>
                    <h2 className="text-[28px] font-black text-[#181C32] tracking-tight leading-none">Registrasi Aset</h2>
                  </div>
                  <p className="text-[14px] text-[#7E8299] font-bold">Masukkan detail unit operasional baru ke dalam database.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-[#F9F9F9] rounded-2xl text-[#A1A5B7] transition-all border-2 border-[#F1F1F4]"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-10 py-10 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-12 gap-10">
                
                {/* Section 1: Data Utama */}
                <div className="md:col-span-7 space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-[#F1FAFF] pb-3">
                      <div className="w-1.5 h-6 bg-[#0095E8] rounded-full"></div>
                      <h3 className="text-[18px] font-black text-[#181C32]">Informasi Unit</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[14px] font-black text-[#3F4254] flex items-center gap-2 ml-1">
                        Nama Mesin / Nama Aset <span className="text-red-500 font-black">*</span>
                      </label>
                      <input 
                        required
                        type="text"
                        className="w-full px-6 py-5 bg-[#F9F9F9] border-2 border-transparent rounded-[24px] text-[16px] font-black text-[#181C32] focus:bg-white focus:border-[#0095E8]/30 transition-all placeholder:text-[#D1D3E0] placeholder:font-bold"
                        placeholder="Contoh: Chiller Central LT 3"
                        value={formData.nama_mesin}
                        onChange={(e) => setFormData({...formData, nama_mesin: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Merk / Brand</label>
                        <input 
                          type="text"
                          className="w-full px-6 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:border-[#0095E8]/30 transition-all"
                          placeholder="Daikin / Carrier"
                          value={formData.brand}
                          onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Model / Tipe</label>
                        <input 
                          type="text"
                          className="w-full px-6 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-bold focus:bg-white focus:border-[#0095E8]/30 transition-all"
                          placeholder="XZ-200 / VRV IV"
                          value={formData.model_tipe}
                          onChange={(e) => setFormData({...formData, model_tipe: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Serial Number</label>
                        <input 
                          type="text"
                          className="w-full px-6 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-black text-[#0095E8] font-mono focus:bg-white focus:border-[#0095E8]/30 transition-all"
                          placeholder="SN-99228..."
                          value={formData.serial_number}
                          onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Lokasi / Ruangan</label>
                        {!showNewLocationInput ? (
                          <div className="relative">
                            <select 
                              className="w-full px-6 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-bold appearance-none pr-12 cursor-pointer focus:bg-white focus:border-[#0095E8]/30 transition-all"
                              value={formData.lokasi}
                              onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewLocationInput(true) : setFormData({...formData, lokasi: e.target.value})}
                            >
                              <option value="">Pilih Lokasi</option>
                              {locations.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                              <option value="ADD_NEW">+ Tambah Lokasi Baru</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={20} />
                          </div>
                        ) : (
                          <div className="flex gap-2 p-1 bg-[#F1FAFF] rounded-[20px] border-2 border-[#0095E8]/20">
                            <input 
                              autoFocus
                              className="flex-1 px-4 py-3 bg-transparent border-none text-[15px] font-black focus:ring-0"
                              placeholder="Ketik lokasi baru..."
                              value={newLocationLabel}
                              onChange={(e) => setNewLocationLabel(e.target.value)}
                            />
                            <button type="button" onClick={handleAddLocation} className="px-4 py-2 bg-[#0095E8] text-white text-[12px] font-black rounded-2xl">Simpan</button>
                            <button type="button" onClick={() => setShowNewLocationInput(false)} className="px-4 py-2 text-[#A1A5B7] hover:text-red-500 transition-colors"><X size={20} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-[#F1FAFF] pb-3">
                      <div className="w-1.5 h-6 bg-[#0095E8] rounded-full"></div>
                      <h3 className="text-[18px] font-black text-[#181C32]">Lampiran Foto (Wajib)</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {formData.lampiran.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[24px] overflow-hidden border-2 border-[#F1F1F4] group shadow-sm">
                          <img src={img} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-[#181C32]/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => setZoomedImage(img)}
                              className="w-9 h-9 rounded-xl bg-white text-[#181C32] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            >
                              <Maximize2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {formData.lampiran.length < 5 && (
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-[24px] border-3 border-dashed border-[#E4E6EF] bg-[#F9F9F9] flex flex-col items-center justify-center gap-2 text-[#A1A5B7] hover:bg-[#F1FAFF] hover:border-[#0095E8] hover:text-[#0095E8] transition-all group"
                        >
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                            <Camera size={26} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider">Tambah Foto</span>
                          <input 
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Konfigurasi & Maintenance */}
                <div className="md:col-span-5 space-y-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-[#F1FAFF] pb-3">
                      <div className="w-1.5 h-6 bg-[#0095E8] rounded-full"></div>
                      <h3 className="text-[18px] font-black text-[#181C32]">Status & Prioritas</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Prioritas</label>
                        {!showNewPriorityInput ? (
                          <div className="relative">
                            <select 
                              className="w-full px-5 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-bold appearance-none pr-12 cursor-pointer focus:bg-white focus:border-[#0095E8]/30 transition-all"
                              value={formData.prioritas}
                              onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewPriorityInput(true) : setFormData({...formData, prioritas: e.target.value})}
                            >
                              {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                              <option value="ADD_NEW">+ Custom...</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={20} />
                          </div>
                        ) : (
                          <div className="flex gap-1 p-1 bg-[#F1FAFF] rounded-[20px] border-2 border-[#0095E8]/20">
                            <input autoFocus className="flex-1 px-4 py-2 bg-transparent border-none text-[14px] font-black focus:ring-0" value={newPriorityLabel} onChange={(e) => setNewPriorityLabel(e.target.value)} />
                            <button type="button" onClick={handleAddPriority} className="p-2 text-[#0095E8]"><CheckCircle2 size={20} /></button>
                            <button type="button" onClick={() => setShowNewPriorityInput(false)} className="p-2 text-red-500"><X size={20} /></button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-[#3F4254] ml-1">Kondisi Awal</label>
                        {!showNewStatusInput ? (
                          <div className="relative">
                            <select 
                              className="w-full px-5 py-4 bg-[#F9F9F9] border-2 border-transparent rounded-[20px] text-[15px] font-bold appearance-none pr-12 cursor-pointer focus:bg-white focus:border-[#0095E8]/30 transition-all"
                              value={formData.status}
                              onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewStatusInput(true) : setFormData({...formData, status: e.target.value})}
                            >
                              {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                              <option value="ADD_NEW">+ Custom...</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={20} />
                          </div>
                        ) : (
                          <div className="flex gap-1 p-1 bg-[#F1FAFF] rounded-[20px] border-2 border-[#0095E8]/20">
                            <input autoFocus className="flex-1 px-4 py-2 bg-transparent border-none text-[14px] font-black focus:ring-0" value={newStatusLabel} onChange={(e) => setNewStatusLabel(e.target.value)} />
                            <button type="button" onClick={handleAddStatus} className="p-2 text-[#0095E8]"><CheckCircle2 size={20} /></button>
                            <button type="button" onClick={() => setShowNewStatusInput(false)} className="p-2 text-red-500"><X size={20} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-[#F1FAFF] pb-3">
                      <div className="w-1.5 h-6 bg-[#50CD89] rounded-full"></div>
                      <h3 className="text-[18px] font-black text-[#181C32]">Penjadwalan Servis</h3>
                    </div>

                    <div className="p-7 bg-[#F9F9F9] rounded-[32px] border-2 border-[#F1F1F4] space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 text-[#E4E6EF]/40 -rotate-12 translate-x-4 -translate-y-4">
                        <Clock size={80} />
                      </div>
                      
                      <div className="relative space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#50CD89] shadow-sm">
                            <Settings size={20} />
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-[#181C32] leading-tight">Masa Pakai Maintenance</p>
                            <p className="text-[11px] text-[#A1A5B7] font-bold uppercase tracking-wider">Jam Operasional (Runtime)</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[12px] font-black text-[#7E8299] ml-1">Hari</label>
                            <input 
                              type="number" min="0"
                              className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-[18px] text-[18px] font-black text-[#181C32] focus:border-[#50CD89]/30 transition-all text-center shadow-sm"
                              value={maintInput.days}
                              onChange={(e) => handleMaintenanceInput('days', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[12px] font-black text-[#7E8299] ml-1">Jam</label>
                            <input 
                              type="number" min="0" max="23"
                              className="w-full px-5 py-4 bg-white border-2 border-transparent rounded-[18px] text-[18px] font-black text-[#181C32] focus:border-[#50CD89]/30 transition-all text-center shadow-sm"
                              value={maintInput.hours}
                              onChange={(e) => handleMaintenanceInput('hours', e.target.value)}
                            />
                          </div>
                        </div>

                        {formData.maintenance_hours > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#E8FFF3] p-5 rounded-[24px] border-2 border-[#50CD89]/10 flex items-center gap-4"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#50CD89] shadow-sm">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <p className="text-[11px] text-[#50CD89] font-black uppercase tracking-widest">Total Terhitung</p>
                              <p className="text-[20px] font-black text-[#181C32] leading-none">
                                {formData.maintenance_hours} <span className="text-[14px] text-[#7E8299]">Jam Kerja</span>
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex gap-3 px-1">
                          <Info size={16} className="text-[#0095E8] shrink-0 mt-0.5" />
                          <p className="text-[12px] text-[#7E8299] font-bold leading-relaxed">
                            Peringatan maintenance akan muncul setelah mesin beroperasi selama durasi jam yang Anda tentukan di atas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[14px] font-black text-[#3F4254] flex items-center gap-2 ml-1">
                      <FileText size={18} className="text-[#A1A5B7]" />
                      Catatan Spesifikasi / History
                    </label>
                    <textarea 
                      rows="4"
                      className="w-full px-6 py-5 bg-[#F9F9F9] border-2 border-transparent rounded-[24px] text-[15px] font-bold text-[#181C32] focus:bg-white focus:border-[#0095E8]/30 transition-all resize-none placeholder:font-normal"
                      placeholder="Masukkan catatan teknis atau riwayat awal aset jika ada..."
                      value={formData.catatan}
                      onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                    />
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="md:col-span-12 flex gap-6 pt-10 border-t-2 border-[#F1F1F4] mt-4">
                  <button 
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-5 bg-[#F9F9F9] text-[#7E8299] rounded-[24px] font-black text-[16px] hover:bg-[#F1F1F4] transition-all border-2 border-transparent"
                  >
                    Batalkan
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-5 bg-[#0095E8] text-white rounded-[24px] font-black text-[18px] hover:bg-[#0084CC] transition-all shadow-2xl shadow-[#0095E8]/30 flex items-center justify-center gap-4 disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={24} />
                        <span>Simpan Data Aset Sekarang</span>
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
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-[#181C32]/95 backdrop-blur-xl" onClick={() => setZoomedImage(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img src={zoomedImage} alt="Zoom" className="w-full h-auto max-h-[85vh] object-contain rounded-[32px] shadow-2xl border-4 border-white/10" />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 -right-12 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
              >
                <X size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}</style>
    </div>
  );
};

export default RegisterAset;
