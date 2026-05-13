import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  Maximize2,
  ChevronDown,
  Edit2,
  Trash2,
  CheckCircle2,
  History,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Camera,
  Power,
  MessageSquare,
  Settings,
  Info,
  Send,
  Zap,
  Activity
} from 'lucide-react';
import { authFetch } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList
} from 'recharts';
import { useModal } from '../context/ModalContext';
import { getSocket } from '../services/socket';

const MonitoringAset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [assetLogs, setAssetLogs] = useState([]);

  // Mobile Specific State
  const [activeMobileAsset, setActiveMobileAsset] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState({ show: false, assetId: null, action: '' });
  const timerRef = useRef(null);

  // App Mode Detection
  const appMode = import.meta.env.MODE; // 'pc' or 'mobile'
  const isMobile = appMode === 'mobile';

  // Permission Logic
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  const hasPerm = (moduleId, action) => {
    if (isSuperAdmin) return true;
    return user?.permissions?.[moduleId]?.includes(action);
  };
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama_mesin: '', brand: '', model_tipe: '', serial_number: '',
    lokasi: '', prioritas: '', status: '', catatan: '', lampiran: [],
    maintenance_hours: 0
  });
  const [maintInput, setMaintInput] = useState({ days: 0, hours: 0 });

  const { confirm, success, error: showError } = useModal();
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ status: '', prioritas: '', lokasi: '' });

  // Metadata for filters
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    fetchAssets();
    fetchFilterMetadata();

    const socket = getSocket();
    if (socket) {
      const handleAssetUpdate = (data) => {
        const cleanData = { ...data, id: parseInt(data.id) };
        setAssets(prev => prev.map(a => a.id === cleanData.id ? { ...a, ...cleanData } : a));
      };
      socket.on('asset-status-updated', (data) => {
        handleAssetUpdate(data);
      });
      return () => socket.off('asset-status-updated');
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const asset = isMobile ? activeMobileAsset : selectedAsset;
      if (!asset) return;

      if (!asset.is_running) {
        setTimeLeft(asset.remaining_seconds);
        return;
      }

      const start = new Date(asset.last_started_at);
      const now = new Date();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, asset.remaining_seconds - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => clearInterval(timerRef.current);
  }, [activeMobileAsset, selectedAsset, isMobile]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => a.nama_mesin.localeCompare(b.nama_mesin));
        setAssets(sortedData);
      }
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterMetadata = async () => {
    try {
      const [resLoc, resStat, resPrio] = await Promise.all([
        authFetch('/api/assets/locations'),
        authFetch('/api/assets/statuses'),
        authFetch('/api/assets/priorities')
      ]);
      if (resLoc.ok) setLocations(await resLoc.json());
      if (resStat.ok) setStatuses(await resStat.json());
      if (resPrio.ok) setPriorities(await resPrio.json());
    } catch (err) {
      console.error('Fetch metadata error:', err);
    }
  };

  const fetchAssetLogs = async (id) => {
    try {
      const res = await authFetch(`/api/assets/${id}/logs`);
      if (res.ok) {
        setAssetLogs(await res.json());
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    }
  };

  const handleToggleStatus = (id) => {
    const assetId = parseInt(id);
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    setToggleConfirm({ 
      show: true, 
      assetId, 
      action: asset.is_running ? 'Mematikan' : 'Menyalakan' 
    });
  };

  const executeToggleStatus = async () => {
    const { assetId } = toggleConfirm;
    if (!assetId || isToggling) return;

    try {
      setIsToggling(true);
      setToggleConfirm({ show: false, assetId: null, action: '' });
      
      const res = await authFetch(`/api/assets/${assetId}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const cleanData = { ...data, id: parseInt(data.id) };
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...cleanData } : a));
      } else {
        showError('Gagal mengubah status aset');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showError('Terjadi kesalahan saat mengubah status');
    } finally {
      setIsToggling(false);
    }
  };

  // Sync active views when assets state changes
  useEffect(() => {
    if (activeMobileAsset) {
      const updated = assets.find(a => a.id === activeMobileAsset.id);
      if (updated && (updated.is_running !== activeMobileAsset.is_running || updated.remaining_seconds !== activeMobileAsset.remaining_seconds || updated.operatorName !== activeMobileAsset.operatorName)) {
        setActiveMobileAsset(updated);
      }
    }
    if (selectedAsset) {
      const updated = assets.find(a => a.id === selectedAsset.id);
      if (updated && (updated.is_running !== selectedAsset.is_running || updated.remaining_seconds !== selectedAsset.remaining_seconds || updated.operatorName !== selectedAsset.operatorName)) {
        setSelectedAsset(updated);
      }
    }
  }, [assets]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      const assetId = isMobile ? activeMobileAsset?.id : selectedAsset?.id;
      const res = await authFetch(`/api/assets/${assetId}/note`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote })
      });
      if (res.ok) {
        success('Catatan berhasil ditambahkan');
        setNewNote('');
        setIsNoteModalOpen(false);
        fetchAssetLogs(assetId);
        // Update local asset catatan
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, catatan: newNote } : a));
        if (isMobile) setActiveMobileAsset(prev => ({ ...prev, catatan: newNote }));
      }
    } catch (err) {
      showError('Gagal menambahkan catatan');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    return { 
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const safeLampiran = (lampiran) => {
    if (!lampiran) return [];
    if (Array.isArray(lampiran)) return lampiran;
    try { return JSON.parse(lampiran); } catch (e) { return []; }
  };

  // --- RESTORED LOGIC ---
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Hapus Aset',
      message: `Apakah Anda yakin ingin menghapus aset "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Sekarang',
      type: 'danger'
    });

    if (isConfirmed) {
      try {
        const res = await authFetch(`/api/assets/${id}`, { method: 'DELETE' });
        if (res.ok) {
          success('Aset berhasil dihapus');
          fetchAssets();
        } else {
          showError('Gagal menghapus aset');
        }
      } catch (err) {
        showError('Terjadi kesalahan sistem');
      }
    }
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setEditFormData({
      nama_mesin: asset.nama_mesin || '',
      brand: asset.brand || '',
      model_tipe: asset.model_tipe || '',
      serial_number: asset.serial_number || '',
      lokasi: asset.lokasi || '',
      prioritas: asset.prioritas || '',
      status: asset.status || '',
      catatan: asset.catatan || '',
      lampiran: safeLampiran(asset.lampiran),
      maintenance_hours: asset.maintenance_hours || 0
    });
    const d = Math.floor(asset.maintenance_hours / 24);
    const h = asset.maintenance_hours % 24;
    setMaintInput({ days: d, hours: h });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        success('Data aset berhasil diperbarui');
        fetchAssets();
      } else {
        showError('Gagal memperbarui data aset');
      }
    } catch (err) {
      showError('Terjadi kesalahan sistem');
    }
  };

  const handleMaintenanceInput = (type, val) => {
    const newVal = parseInt(val) || 0;
    const nextMaint = { ...maintInput, [type]: newVal };
    setMaintInput(nextMaint);
    setEditFormData({ ...editFormData, maintenance_hours: (nextMaint.days * 24) + nextMaint.hours });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        showError(`File ${file.name} terlalu besar (Max 2MB)`);
        continue;
      }
      const reader = new FileReader();
      const promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
      });
      reader.readAsDataURL(file);
      newImages.push(await promise);
    }
    setEditFormData({ ...editFormData, lampiran: [...editFormData.lampiran, ...newImages] });
  };

  const analyticsData = useMemo(() => {
    const statusCounts = {};
    const priorityCounts = {};
    assets.forEach(asset => {
      statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
      priorityCounts[asset.prioritas] = (priorityCounts[asset.prioritas] || 0) + 1;
    });
    return { 
      statusChart: Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] })),
      priorityChart: Object.keys(priorityCounts).map(name => ({ name, value: priorityCounts[name] })),
      total: assets.length 
    };
  }, [assets]);

  const COLORS = ['#0095E8', '#50CD89', '#FFC700', '#F1416C', '#7239EA'];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.nama_mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !activeFilters.status || asset.status === activeFilters.status;
    const matchesPriority = !activeFilters.prioritas || asset.prioritas === activeFilters.prioritas;
    const matchesLocation = !activeFilters.lokasi || asset.lokasi === activeFilters.lokasi;
    return matchesSearch && matchesStatus && matchesPriority && matchesLocation;
  });

  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
    if (sLow === 'maintenance' || sLow === 'perbaikan') return 'text-[#FFC700]';
    if (sLow === 'rusak' || sLow === 'breakdown') return 'text-[#F1416C]';
    return 'text-[#A1A5B7]';
  };

  // --- MOBILE VIEW COMPONENTS ---
  if (isMobile) {
    return (
      <div className="min-h-full bg-[#F8FAFC] pb-24">
        {/* Header Section */}
        <div className="bg-white px-6 pb-6 rounded-b-[40px] shadow-sm border-b border-slate-100" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[20px] font-black text-[#1B3B6F] tracking-tight">Monitoring Mesin</h1>
              <p className="text-slate-400 text-[12px] font-bold">Pilih aset untuk kontrol operasional</p>
            </div>
          </div>

          {/* Asset Selection Area */}
          <div className="relative">
            <select 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-[15px] font-black text-slate-700 outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all appearance-none"
              value={activeMobileAsset?.id || ''}
              onChange={(e) => {
                const asset = assets.find(a => a.id === parseInt(e.target.value));
                setActiveMobileAsset(asset);
                if (asset) fetchAssetLogs(asset.id);
              }}
            >
              <option value="" disabled>Pilih Unit Mesin / Aset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.nama_mesin} - {a.brand}</option>
              ))}
            </select>
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0095E8]" size={20} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!activeMobileAsset ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-8 pt-20 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-slate-200 shadow-xl shadow-slate-200/50 mb-8 border border-slate-50">
                <Activity size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-black text-slate-800 mb-2">Belum Ada Aset Terpilih</h3>
              <p className="text-slate-400 text-[14px] font-medium leading-relaxed">
                Silakan pilih unit mesin dari daftar di atas untuk mulai memantau jam operasional.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeMobileAsset.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 pt-8 space-y-8 pb-10"
            >
              {/* Machine Name & Status Banner */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[22px] font-black text-slate-800 leading-tight">{activeMobileAsset.nama_mesin}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{activeMobileAsset.brand}</span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[11px] font-black text-[#0095E8] uppercase tracking-wider">{activeMobileAsset.lokasi}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${activeMobileAsset.is_running ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${activeMobileAsset.is_running ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[12px] font-black uppercase tracking-wide">
                    {activeMobileAsset.is_running 
                      ? `Running - ${activeMobileAsset.operatorName || activeMobileAsset.operatorFirstName || 'System'}` 
                      : 'Standby'}
                  </span>
                </div>
              </div>

              {/* GIANT ON/OFF BUTTON & TIMER */}
              <div className="flex flex-col items-center justify-center gap-8 py-4">
                {/* Big Round Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  disabled={isToggling}
                  onClick={() => handleToggleStatus(activeMobileAsset.id)}
                  className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-500 border-8 ${
                    isToggling ? 'opacity-70 grayscale' : ''
                  } ${
                    activeMobileAsset.is_running 
                      ? 'bg-red-500 border-red-100 shadow-red-200 text-white' 
                      : 'bg-white border-slate-50 shadow-slate-200 text-slate-300'
                  }`}
                >
                  <Power size={48} strokeWidth={2.5} className={`${activeMobileAsset.is_running ? 'drop-shadow-lg' : ''} ${isToggling ? 'animate-spin-slow' : ''}`} />
                  <span className="text-[18px] font-black uppercase tracking-widest">
                    {isToggling ? 'Wait...' : (activeMobileAsset.is_running ? 'Stop' : 'Start')}
                  </span>
                </motion.button>

                {/* COUNTDOWN TIMER */}
                <div className="text-center">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sisa Waktu Maintenance</p>
                  <div className="flex flex-col items-center">
                    <span className={`text-[56px] font-black leading-none tracking-tighter tabular-nums ${activeMobileAsset.is_running ? 'text-[#0095E8]' : 'text-slate-800'}`}>
                      {formatTime(timeLeft)}
                    </span>
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(activeMobileAsset.maintenance_hours && activeMobileAsset.maintenance_hours > 0) ? Math.min(100, (timeLeft / (activeMobileAsset.maintenance_hours * 3600)) * 100) : 0}%` }}
                        className={`h-full ${timeLeft < 3600 ? 'bg-red-500' : 'bg-[#0095E8]'}`} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Tabs / Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNoteModalOpen(true)}
                  className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm"
                >
                  <div className="w-10 h-10 bg-blue-50 text-[#0095E8] rounded-xl flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-[13px] font-black text-slate-700">Catatan Tim</span>
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAsset(activeMobileAsset)}
                  className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm"
                >
                  <div className="w-10 h-10 bg-emerald-50 text-[#50CD89] rounded-xl flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  <span className="text-[13px] font-black text-slate-700">Detail Aset</span>
                </motion.button>
              </div>

              {/* Team Notes Section Mobile (Max 3) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Catatan Tim Terkini</h4>
                  <button onClick={() => setSelectedAsset(activeMobileAsset)} className="text-[11px] font-black text-[#0095E8]">Lihat Semua</button>
                </div>
                <div className="space-y-3">
                  {assetLogs.filter(l => l.action === 'NOTE').slice(0, 3).map((note, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[11px] font-black text-slate-700">{note.firstName}</span>
                         <span className="text-[9px] font-bold text-slate-400">{formatDateTime(note.created_at).time}</span>
                      </div>
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">
                        "{note.details}"
                      </p>
                    </div>
                  ))}
                  {assetLogs.filter(l => l.action === 'NOTE').length === 0 && (
                    <div className="py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-[11px] font-bold italic">Belum ada catatan tim untuk unit ini.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Modal Mobile */}
        <AnimatePresence>
          {isNoteModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNoteModalOpen(false)} />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative bg-white w-full rounded-t-[40px] p-6 pb-12 shadow-2xl"
                style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-black text-slate-800">Tambah Catatan Tim</h3>
                  <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400"><X size={24} /></button>
                </div>
                <textarea 
                  className="w-full p-5 bg-slate-50 border-transparent rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all min-h-[150px]"
                  placeholder="Ketik pesan atau informasi tentang unit ini untuk tim lain..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmittingNote || !newNote.trim()}
                  onClick={handleAddNote}
                  className="w-full mt-6 py-4 bg-[#0095E8] text-white rounded-2xl font-black text-[16px] shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={18} />
                  <span>Kirim Catatan</span>
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Asset Detail Modal for Mobile */}
        <AnimatePresence>
          {selectedAsset && isMobile && (
            <div className="fixed inset-0 z-[2000] bg-white overflow-y-auto pb-10">
              <div className="px-6 pb-6 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
                <button onClick={() => setSelectedAsset(null)} className="p-2 bg-slate-50 rounded-xl text-slate-500"><ChevronLeft size={24} /></button>
                <h3 className="text-[16px] font-black text-slate-800">Detail Lengkap Aset</h3>
                <div className="w-10" />
              </div>

              <div className="p-6 space-y-8">
                {/* Visual Header */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-[#F1FAFF] rounded-2xl flex items-center justify-center text-[#0095E8]">
                    <Activity size={32} />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-black text-slate-800 leading-tight">{selectedAsset.nama_mesin}</h2>
                    <p className="text-slate-400 text-[13px] font-bold mt-1 uppercase">{selectedAsset.brand}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${selectedAsset.is_running ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                       <span className="text-[11px] font-black text-slate-500 uppercase">{selectedAsset.is_running ? 'Running' : 'Standby'}</span>
                    </div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Model / Tipe', value: selectedAsset.model_tipe },
                    { label: 'Serial Number', value: selectedAsset.serial_number, isMono: true },
                    { label: 'Lokasi Unit', value: selectedAsset.lokasi },
                    { label: 'Level Prioritas', value: selectedAsset.prioritas },
                    { label: 'Status Terakhir', value: selectedAsset.status }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                      <span className={`text-[14px] font-black text-slate-800 ${item.isMono ? 'font-mono text-[#0095E8]' : ''}`}>{item.value || '-'}</span>
                    </div>
                  ))}
                </div>

                {/* Catatan Tim Section in Detail */}
                <div className="space-y-4">
                   <h4 className="text-[14px] font-black text-slate-800">Catatan Khusus Tim</h4>
                   <div className="space-y-3">
                      {assetLogs.filter(l => l.action === 'NOTE').map((note, idx) => (
                        <div key={idx} className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] font-black text-amber-700">{note.firstName} {note.lastName}</span>
                              <span className="text-[10px] text-slate-400">{formatDateTime(note.created_at).date}</span>
                           </div>
                           <p className="text-[13px] text-slate-700 font-medium italic">"{note.details}"</p>
                        </div>
                      ))}
                      {assetLogs.filter(l => l.action === 'NOTE').length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-[12px] font-bold">Belum ada catatan tim.</div>
                      )}
                   </div>
                </div>

                {/* Media Section */}
                <div>
                  <h4 className="text-[14px] font-black text-slate-800 mb-4">Dokumentasi Foto</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {safeLampiran(selectedAsset.lampiran).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100" onClick={() => setZoomedImage(img)}>
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {safeLampiran(selectedAsset.lampiran).length === 0 && (
                      <div className="col-span-2 py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-[12px] font-bold">Tidak ada foto lampiran</div>
                    )}
                  </div>
                </div>

                {/* Log Section */}
                <div className="space-y-4">
                  <h4 className="text-[14px] font-black text-slate-800">Riwayat & Log Tim</h4>
                  <div className="space-y-3">
                    {assetLogs.map((log, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${
                            log.action === 'STATUS_CHANGE' ? 'bg-blue-50 text-blue-600' : 
                            log.action === 'NOTE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{formatDateTime(log.created_at).date}, {formatDateTime(log.created_at).time}</span>
                        </div>
                        <p className="text-[13px] font-medium text-slate-700">{log.details}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-2">— {log.firstName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Full Image Zoom for Mobile */}
        <AnimatePresence>
          {zoomedImage && isMobile && (
            <div className="fixed inset-0 z-[3000] bg-black flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
              <img src={zoomedImage} className="w-full h-auto max-h-screen object-contain" />
              <button className="absolute top-10 right-6 text-white"><X size={32} /></button>
            </div>
          )}
        {/* Local Confirmation Modal for Toggle (Mobile) */}
        <AnimatePresence>
          {toggleConfirm.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleConfirm({ show: false, assetId: null, action: '' })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
              >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${toggleConfirm.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                   <Power size={40} />
                </div>
                <h3 className="text-[20px] font-black text-slate-800 mb-2">{toggleConfirm.action} Mesin?</h3>
                <p className="text-[14px] text-slate-500 font-medium mb-8 leading-relaxed">
                  Apakah Anda yakin ingin <strong>{toggleConfirm.action.toLowerCase()}</strong> unit mesin <strong>{assets.find(a => a.id === toggleConfirm.assetId)?.nama_mesin}</strong> sekarang?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setToggleConfirm({ show: false, assetId: null, action: '' })}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[15px]"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={executeToggleStatus}
                    className={`py-4 text-white rounded-2xl font-black text-[15px] shadow-lg ${toggleConfirm.action === 'Mematikan' ? 'bg-red-500 shadow-red-100' : 'bg-[#0095E8] shadow-blue-100'}`}
                  >
                    Ya, Yakin
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- PC VIEW COMPONENTS ---
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto min-h-screen bg-[#FBFBFB]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#181C32] mb-1">Monitoring Aset</h1>
        <p className="text-[#A1A5B7] text-sm font-medium">Pengawasan unit operasional secara real-time dan terstruktur.</p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm flex flex-col justify-center">
          <p className="text-xs font-normal text-[#A1A5B7] uppercase tracking-widest mb-2">Total Aset</p>
          <h2 className="text-4xl font-bold text-[#181C32]">{analyticsData.total}</h2>
          <div className="mt-4 h-1 w-full bg-[#F1F1F4] rounded-full overflow-hidden">
            <div className="h-full bg-[#0095E8]" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Status Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm h-[200px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-normal text-[#A1A5B7] uppercase tracking-widest">Distribusi Kondisi Aset</p>
          </div>
          <div className="w-full h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.statusChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '400', fill: '#A1A5B7' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {analyticsData.statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fontWeight: '400', fill: '#181C32' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie */}
        <div className="bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm h-[200px] flex flex-col">
          <p className="text-xs font-normal text-[#A1A5B7] uppercase tracking-widest mb-2">Level Prioritas</p>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.priorityChart}
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                  labelLine={false}
                >
                  {analyticsData.priorityChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle" 
                  iconType="circle" 
                  formatter={(value, entry) => {
                    const item = analyticsData.priorityChart.find(p => p.name === value);
                    return <span className="text-[10px] font-normal text-[#3F4254]">{value} ({item?.value || 0})</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
          <input 
            type="text" 
            placeholder="Cari aset..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm font-light outline-none focus:border-[#0095E8]/30 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-6 py-3 border rounded-xl text-sm font-light transition-all ${isFilterOpen ? 'bg-[#F1FAFF] border-[#0095E8] text-[#0095E8]' : 'bg-white border-[#F1F1F4] text-[#7E8299] hover:bg-[#F9F9F9]'}`}
        >
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-normal text-[#7E8299] uppercase tracking-wider">Status</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.status} onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}>
                  <option value="">Semua Status</option>
                  {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-normal text-[#7E8299] uppercase tracking-wider">Prioritas</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.prioritas} onChange={(e) => setActiveFilters({...activeFilters, prioritas: e.target.value})}>
                  <option value="">Semua Prioritas</option>
                  {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-normal text-[#7E8299] uppercase tracking-wider">Lokasi</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm font-light outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.lokasi} onChange={(e) => setActiveFilters({...activeFilters, lokasi: e.target.value})}>
                  <option value="">Semua Lokasi</option>
                  {locations.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button onClick={() => setActiveFilters({ status: '', prioritas: '', lokasi: '' })} className="text-xs font-normal text-[#0095E8] hover:underline">Reset Filter</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9]/50 border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Informasi Aset</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Timer & Status</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider">Lokasi & Kondisi</th>
                <th className="px-6 py-4 text-[11px] font-normal text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>)
              ) : paginatedAssets.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center text-[#A1A5B7] text-sm font-light">Data aset tidak ditemukan.</td></tr>
              ) : (
                paginatedAssets.map((asset, index) => {
                  // Live Timer Calculation for PC Table
                  let liveTime = asset.remaining_seconds;
                  if (asset.is_running && asset.last_started_at) {
                    const start = new Date(asset.last_started_at);
                    const now = new Date();
                    const elapsed = Math.floor((now - start) / 1000);
                    liveTime = Math.max(0, asset.remaining_seconds - elapsed);
                  }

                  return (
                    <tr key={asset.id} className="hover:bg-[#F9F9F9]/50 transition-all group cursor-pointer">
                      <td className="px-6 py-5 text-sm font-light text-[#7E8299]">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-normal text-[#181C32] mb-0.5">{asset.nama_mesin}</p>
                        <p className="text-[11px] text-[#A1A5B7] font-normal uppercase">{asset.brand || '-'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${asset.is_running ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                          <div>
                            <p className={`text-sm font-black tabular-nums ${asset.is_running ? 'text-[#0095E8]' : 'text-slate-700'}`}>
                              {formatTime(liveTime)}
                            </p>
                            <p className="text-[9px] text-[#A1A5B7] font-bold uppercase tracking-wider">
                               {asset.is_running ? `RUNNING - ${asset.operatorName || asset.operatorFirstName || 'SYS'}` : 'STANDBY'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-normal text-[#3F4254] mb-1">{asset.lokasi || '-'}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-normal ${asset.status?.toLowerCase() === 'baik' ? 'text-[#50CD89]' : 'text-red-500'}`}>{asset.status}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-normal uppercase ${asset.prioritas?.toLowerCase() === 'kritis' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>{asset.prioritas}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] hover:text-[#0095E8] hover:border-[#0095E8]/30 rounded-lg transition-all" onClick={() => { setSelectedAsset(asset); fetchAssetLogs(asset.id); }}>
                             <Maximize2 size={14} />
                          </button>
                          {hasPerm('aset_register', 'Edit') && (
                            <button onClick={() => openEditModal(asset)} className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] hover:text-[#0095E8] hover:border-[#0095E8]/30 rounded-lg transition-all"><Edit2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal PC */}
      <AnimatePresence>
        {selectedAsset && !isMobile && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#181C32]/40 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedAsset.is_running ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-400'}`}>
                    <Power size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#181C32]">{selectedAsset.nama_mesin}</h2>
                    <p className="text-xs font-normal text-[#A1A5B7] uppercase tracking-widest">{selectedAsset.brand || '-'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white border border-transparent hover:border-[#F1F1F4] rounded-xl text-[#A1A5B7] transition-all"><X size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                  {/* Timer Large Display in Detail */}
                  <div className="p-8 bg-[#1E1E2D] rounded-[32px] text-white flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Zap size={100} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">Sisa Jam Operasional</p>
                    <h3 className="text-[64px] font-black leading-none tracking-tighter tabular-nums mb-4">
                      {formatTime(timeLeft)}
                    </h3>
                    <div className="flex items-center gap-4">
                       <div className={`px-6 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest ${selectedAsset.is_running ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                          {selectedAsset.is_running ? `Operational - Started by ${selectedAsset.operatorName || selectedAsset.operatorFirstName || 'System'}` : 'Standby Mode'}
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-normal text-[#A1A5B7] uppercase tracking-wider">Model</label>
                      <p className="text-sm font-normal text-[#3F4254]">{selectedAsset.model_tipe || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-normal text-[#A1A5B7] uppercase tracking-wider">SN</label>
                      <p className="text-sm font-normal font-mono text-[#0095E8]">{selectedAsset.serial_number || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-normal text-[#A1A5B7] uppercase tracking-wider">Lokasi</label>
                      <p className="text-sm font-normal text-[#3F4254]">{selectedAsset.lokasi || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-normal text-[#A1A5B7] uppercase tracking-wider">Pendaftar</label>
                      <p className="text-sm font-normal text-[#3F4254]">{selectedAsset.firstName}</p>
                    </div>
                  </div>

                  {/* PC Detail: Team Notes */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-amber-500" />
                        <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Catatan Khusus Tim</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assetLogs.filter(l => l.action === 'NOTE').slice(0, 6).map((note, idx) => (
                          <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-amber-700">{note.firstName} {note.lastName}</span>
                                <span className="text-[10px] text-slate-400">{formatDateTime(note.created_at).date}</span>
                             </div>
                             <p className="text-[12px] text-slate-600 italic">"{note.details}"</p>
                          </div>
                        ))}
                        {assetLogs.filter(l => l.action === 'NOTE').length === 0 && (
                          <div className="col-span-2 py-6 text-center text-slate-300 text-xs font-bold">Tidak ada catatan tim.</div>
                        )}
                     </div>
                  </div>

                  {/* Logs Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History size={16} className="text-[#0095E8]" />
                        <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Riwayat Operasional</h4>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {assetLogs.map((log, idx) => (
                        <div key={idx} className="p-4 bg-white border border-[#F1F1F4] rounded-xl flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.action === 'STATUS_CHANGE' ? 'bg-blue-50 text-blue-500' : 
                            log.action === 'NOTE' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {log.action === 'STATUS_CHANGE' ? <Power size={14} /> : <MessageSquare size={14} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-700">{log.firstName} {log.lastName}</span>
                              <span className="text-[10px] text-slate-400">{formatDateTime(log.created_at).date} {formatDateTime(log.created_at).time}</span>
                            </div>
                            <p className="text-[12px] text-slate-600 leading-relaxed">{log.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                   <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Media & Lampiran</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {safeLampiran(selectedAsset.lampiran).map((img, idx) => (
                        <img key={idx} src={img} className="w-full aspect-square object-cover rounded-xl border border-[#F1F1F4] cursor-zoom-in" onClick={() => setZoomedImage(img)} />
                      ))}
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Modal for PC */}
      <AnimatePresence>
        {isNoteModalOpen && !isMobile && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsNoteModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Tambah Catatan Tim</h3>
              <textarea 
                className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-blue-100 outline-none transition-all min-h-[120px]"
                placeholder="Tulis pesan untuk tim..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsNoteModalOpen(false)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl font-bold text-sm">Batal</button>
                <button onClick={handleAddNote} disabled={isSubmittingNote} className="flex-1 py-3 bg-[#0095E8] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100">Kirim</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Local Confirmation Modal for Toggle */}
        <AnimatePresence>
          {toggleConfirm.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleConfirm({ show: false, assetId: null, action: '' })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
              >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${toggleConfirm.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                   <Power size={40} />
                </div>
                <h3 className="text-[20px] font-black text-slate-800 mb-2">{toggleConfirm.action} Mesin?</h3>
                <p className="text-[14px] text-slate-500 font-medium mb-8 leading-relaxed">
                  Apakah Anda yakin ingin <strong>{toggleConfirm.action.toLowerCase()}</strong> unit mesin <strong>{assets.find(a => a.id === toggleConfirm.assetId)?.nama_mesin}</strong> sekarang?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setToggleConfirm({ show: false, assetId: null, action: '' })}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[15px]"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={executeToggleStatus}
                    className={`py-4 text-white rounded-2xl font-black text-[15px] shadow-lg ${toggleConfirm.action === 'Mematikan' ? 'bg-red-500 shadow-red-100' : 'bg-[#0095E8] shadow-blue-100'}`}
                  >
                    Ya, Yakin
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F9F9F9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E4E6EF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D3E0; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MonitoringAset;
