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
  FileText,
  Info
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
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  const hasPerm = (moduleId, action) => {
    if (isSuperAdmin) return true;
    return user?.permissions?.[moduleId]?.includes(action);
  };
  
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
            nama_mesin: '', brand: '', model_tipe: '', serial_number: '',
            lokasi: '', prioritas: 'Sedang', status: 'Baik', catatan: '',
            lampiran: [], maintenance_hours: 0
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
    asset.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (p) => {
    const pLow = p?.toLowerCase();
    if (pLow === 'tinggi' || pLow === 'kritis') return 'bg-red-50 text-red-600';
    if (pLow === 'sedang') return 'bg-amber-50 text-amber-600';
    if (pLow === 'rendah') return 'bg-blue-50 text-blue-600';
    return 'bg-slate-50 text-slate-600';
  };

  const getStatusColor = (s) => {
    const sLow = s?.toLowerCase();
    if (sLow === 'baik' || sLow === 'normal') return 'text-[#50CD89]';
    if (sLow === 'maintenance') return 'text-[#FFC700]';
    if (sLow === 'rusak') return 'text-[#F1416C]';
    return 'text-[#A1A5B7]';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    return { 
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="p-6 md:p-8 max-w-[1300px] mx-auto min-h-screen bg-[#FBFBFB]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32] mb-1">Registrasi Aset</h1>
          <p className="text-[#A1A5B7] text-sm font-light">Kelola dan daftar aset baru perusahaan dengan mudah.</p>
        </div>
        {hasPerm('aset_register', 'Buat') && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#0095E8] text-white rounded-xl text-sm font-normal hover:bg-[#0084CC] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Tambah Aset</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama mesin atau merk..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[#F1F1F4] text-[#7E8299] rounded-xl text-sm font-light hover:bg-[#F9F9F9] transition-all">
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#F1F1F4] bg-[#F9F9F9]/50">
          <h3 className="text-sm font-bold text-[#3F4254]">Data Terbaru Terdaftar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9]/30 border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Aset / Mesin</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Lokasi & Kondisi</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-center">Masa Pakai</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Pendaftar</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>)
              ) : filteredAssets.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-[#A1A5B7] text-sm font-light">Belum ada data tersedia.</td></tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F9F9F9]/50 transition-all group">
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-normal text-[#181C32] mb-0.5">{asset.nama_mesin}</p>
                        <p className="text-xs text-[#A1A5B7] font-light">{asset.brand || 'No Brand'} • <span className="font-mono text-[#0095E8] font-normal">{asset.serial_number || 'N/A'}</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#7E8299] font-light">
                          <MapPin size={13} />
                          {asset.lokasi || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-normal ${getStatusColor(asset.status)}`}>{asset.status}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-normal uppercase ${getPriorityColor(asset.prioritas)}`}>
                            {asset.prioritas}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F9F9F9] rounded-lg text-xs font-normal text-[#3F4254]">
                        <Clock size={14} className="text-[#0095E8]" />
                        {asset.maintenance_hours > 0 ? `${asset.maintenance_hours} Jam` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-normal text-[#3F4254]">{asset.firstName} {asset.lastName}</p>
                        <p className="text-[10px] text-[#A1A5B7] font-light">{formatDateTime(asset.created_at).date} | {formatDateTime(asset.created_at).time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => window.location.href = '/aset/monitoring'}
                        className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] rounded-lg hover:text-[#0095E8] hover:border-[#0095E8]/30 transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Clean Design */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#181C32]/30 backdrop-blur-[2px]"
              onClick={() => !submitting && setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-[#F1F1F4] flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#181C32]">Form Pendaftaran Aset</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[#F9F9F9] rounded-lg text-[#A1A5B7] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-[#3F4254]">Nama Mesin / Aset <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all" placeholder="Input nama aset..." value={formData.nama_mesin} onChange={(e) => setFormData({...formData, nama_mesin: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-normal text-[#3F4254]">Brand</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all" placeholder="Merk..." value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-normal text-[#3F4254]">Model/Tipe</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm font-light focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all" placeholder="Tipe..." value={formData.model_tipe} onChange={(e) => setFormData({...formData, model_tipe: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-[#3F4254]">Serial Number</label>
                    <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-mono font-light focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all" placeholder="SN..." value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-[#3F4254]">Lokasi / Ruangan</label>
                    {!showNewLocationInput ? (
                      <div className="relative">
                        <select className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light appearance-none pr-10 focus:bg-white focus:border-[#0095E8]/20 outline-none cursor-pointer" value={formData.lokasi} onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewLocationInput(true) : setFormData({...formData, lokasi: e.target.value})}>
                          <option value="">Pilih Lokasi</option>
                          {locations.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                          <option value="ADD_NEW">+ Tambah Baru...</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={18} />
                      </div>
                    ) : (
                      <div className="flex gap-2 p-1.5 bg-[#F1FAFF] rounded-xl">
                        <input autoFocus className="flex-1 px-3 py-1.5 bg-transparent border-none text-sm font-light outline-none" placeholder="Lokasi baru..." value={newLocationLabel} onChange={(e) => setNewLocationLabel(e.target.value)} />
                        <button type="button" onClick={handleAddLocation} className="px-3 py-1.5 bg-[#0095E8] text-white text-xs font-normal rounded-lg">OK</button>
                        <button type="button" onClick={() => setShowNewLocationInput(false)} className="px-2 text-[#A1A5B7]"><X size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-normal text-[#3F4254]">Prioritas</label>
                      {!showNewPriorityInput ? (
                        <div className="relative">
                          <select className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light appearance-none pr-10 focus:bg-white focus:border-[#0095E8]/20 outline-none cursor-pointer" value={formData.prioritas} onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewPriorityInput(true) : setFormData({...formData, prioritas: e.target.value})}>
                            {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                            <option value="ADD_NEW">+ Baru...</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={18} />
                        </div>
                      ) : (
                        <div className="flex gap-2 p-1 bg-[#F1FAFF] rounded-xl">
                          <input autoFocus className="flex-1 px-3 py-1.5 bg-transparent border-none text-sm font-light outline-none" value={newPriorityLabel} onChange={(e) => setNewPriorityLabel(e.target.value)} />
                          <button type="button" onClick={handleAddPriority} className="p-2 text-[#0095E8]"><CheckCircle2 size={18} /></button>
                          <button type="button" onClick={() => setShowNewPriorityInput(false)} className="p-2 text-red-500"><X size={18} /></button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-normal text-[#3F4254]">Kondisi</label>
                      {!showNewStatusInput ? (
                        <div className="relative">
                          <select className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light appearance-none pr-10 focus:bg-white focus:border-[#0095E8]/20 outline-none cursor-pointer" value={formData.status} onChange={(e) => e.target.value === 'ADD_NEW' ? setShowNewStatusInput(true) : setFormData({...formData, status: e.target.value})}>
                            {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                            <option value="ADD_NEW">+ Baru...</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" size={18} />
                        </div>
                      ) : (
                        <div className="flex gap-2 p-1 bg-[#F1FAFF] rounded-xl">
                          <input autoFocus className="flex-1 px-3 py-1.5 bg-transparent border-none text-sm font-light outline-none" value={newStatusLabel} onChange={(e) => setNewStatusLabel(e.target.value)} />
                          <button type="button" onClick={handleAddStatus} className="p-2 text-[#0095E8]"><CheckCircle2 size={18} /></button>
                          <button type="button" onClick={() => setShowNewStatusInput(false)} className="p-2 text-red-500"><X size={18} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Maintenance Card */}
                  <div className="p-5 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4] space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#0095E8]" />
                      <p className="text-xs font-normal text-[#181C32] uppercase">Jadwal Maintenance (Jam)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-normal text-[#A1A5B7]">HARI</label>
                        <input type="number" min="0" className="w-full px-3 py-2 bg-white border border-[#F1F1F4] rounded-lg text-sm font-light text-center" value={maintInput.days} onChange={(e) => handleMaintenanceInput('days', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-normal text-[#A1A5B7]">JAM</label>
                        <input type="number" min="0" className="w-full px-3 py-2 bg-white border border-[#F1F1F4] rounded-lg text-sm font-light text-center" value={maintInput.hours} onChange={(e) => handleMaintenanceInput('hours', e.target.value)} />
                      </div>
                    </div>
                    {formData.maintenance_hours > 0 && (
                      <div className="flex items-center justify-between text-xs font-normal text-[#50CD89] px-2">
                        <span>Konversi:</span>
                        <span>{formData.maintenance_hours} Jam Operasional</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-[#3F4254]">Catatan</label>
                    <textarea rows="3" className="w-full px-4 py-3 bg-[#F9F9F9] border border-transparent rounded-xl text-sm font-light focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all resize-none" placeholder="..." value={formData.catatan} onChange={(e) => setFormData({...formData, catatan: e.target.value})} />
                  </div>
                </div>

                {/* Full Width Photo Upload */}
                <div className="md:col-span-2 pt-4">
                  <label className="text-sm font-normal text-[#3F4254] block mb-4">Lampiran Foto</label>
                  <div className="flex flex-wrap gap-4">
                    {formData.lampiran.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#F1F1F4] group">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                          <button type="button" onClick={() => setZoomedImage(img)} className="text-white"><Maximize2 size={14} /></button>
                          <button type="button" onClick={() => removeImage(idx)} className="text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {formData.lampiran.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-[#E4E6EF] flex flex-col items-center justify-center text-[#A1A5B7] hover:border-[#0095E8] hover:text-[#0095E8] transition-all">
                        <Camera size={20} />
                        <span className="text-[9px] font-normal mt-1">FOTO</span>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="md:col-span-2 flex gap-4 pt-8 border-t border-[#F1F1F4]">
                  <button type="button" disabled={submitting} onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-normal text-[#7E8299] hover:bg-[#F9F9F9] rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#0095E8] text-white rounded-xl text-sm font-normal shadow-lg shadow-[#0095E8]/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Simpan Aset</span></>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90" onClick={() => setZoomedImage(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={zoomedImage} alt="Zoom" className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl" />
              <button onClick={() => setZoomedImage(null)} className="absolute -top-10 right-0 text-white hover:text-[#0095E8] transition-colors"><X size={28} /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default RegisterAset;
