import React, { useState, useEffect, useMemo } from 'react';
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
  Camera
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

const MonitoringAset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [assetLogs, setAssetLogs] = useState([]);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama_mesin: '',
    brand: '',
    model_tipe: '',
    serial_number: '',
    lokasi: '',
    prioritas: '',
    status: '',
    catatan: '',
    lampiran: [],
    maintenance_hours: 0
  });
  const [maintInput, setMaintInput] = useState({ days: 0, hours: 0 });

  const { confirm, success, error: showError } = useModal();
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    prioritas: '',
    lokasi: ''
  });

  // Metadata for filters
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    fetchAssets();
    fetchFilterMetadata();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        // Sort alphabetically by nama_mesin
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
    // Convert hours to days/hours for input
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

  // Analytics Data
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
          <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest mb-2">Total Aset</p>
          <h2 className="text-4xl font-bold text-[#181C32]">{analyticsData.total}</h2>
          <div className="mt-4 h-1 w-full bg-[#F1F1F4] rounded-full overflow-hidden">
            <div className="h-full bg-[#0095E8]" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Status Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm h-[200px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest">Distribusi Kondisi Aset</p>
          </div>
          <div className="w-full h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.statusChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#A1A5B7' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {analyticsData.statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#181C32' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie */}
        <div className="bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm h-[200px] flex flex-col">
          <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest mb-2">Level Prioritas</p>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.priorityChart}
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.priorityChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
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
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#F1F1F4] rounded-xl text-sm outline-none focus:border-[#0095E8]/30 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-6 py-3 border rounded-xl text-sm font-medium transition-all ${isFilterOpen ? 'bg-[#F1FAFF] border-[#0095E8] text-[#0095E8]' : 'bg-white border-[#F1F1F4] text-[#7E8299] hover:bg-[#F9F9F9]'}`}
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
                <label className="text-xs font-bold text-[#7E8299] uppercase tracking-wider">Status</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.status} onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}>
                  <option value="">Semua Status</option>
                  {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7E8299] uppercase tracking-wider">Prioritas</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.prioritas} onChange={(e) => setActiveFilters({...activeFilters, prioritas: e.target.value})}>
                  <option value="">Semua Prioritas</option>
                  {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#7E8299] uppercase tracking-wider">Lokasi</label>
                <select className="w-full px-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#0095E8]/20 transition-all" value={activeFilters.lokasi} onChange={(e) => setActiveFilters({...activeFilters, lokasi: e.target.value})}>
                  <option value="">Semua Lokasi</option>
                  {locations.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button onClick={() => setActiveFilters({ status: '', prioritas: '', lokasi: '' })} className="text-xs font-bold text-[#0095E8] hover:underline">Reset Filter</button>
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
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Informasi Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Spesifikasi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi & Kondisi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Input Oleh</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>)
              ) : paginatedAssets.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-20 text-center text-[#A1A5B7] text-sm font-medium">Data aset tidak ditemukan.</td></tr>
              ) : (
                paginatedAssets.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-[#F9F9F9]/50 transition-all group cursor-pointer" onClick={() => { setSelectedAsset(asset); fetchAssetLogs(asset.id); }}>
                    <td className="px-6 py-5 text-sm font-bold text-[#7E8299]">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[#181C32] mb-0.5">{asset.nama_mesin}</p>
                      <p className="text-[11px] text-[#A1A5B7] font-bold uppercase">{asset.brand || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-[#3F4254] mb-1">SN: <span className="font-mono text-[#0095E8]">{asset.serial_number || 'N/A'}</span></p>
                      <p className="text-[10px] text-[#7E8299]">{asset.model_tipe || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-[#3F4254] mb-1">{asset.lokasi || '-'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${getStatusColor(asset.status)}`}>{asset.status}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getPriorityColor(asset.prioritas)}`}>{asset.prioritas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-[#3F4254]">{asset.firstName} {asset.lastName}</p>
                      <p className="text-[10px] text-[#A1A5B7]">{formatDateTime(asset.created_at).date}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEditModal(asset)} className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] hover:text-[#0095E8] hover:border-[#0095E8]/30 rounded-lg transition-all"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(asset.id, asset.nama_mesin)} className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] hover:text-red-500 hover:border-red-200 rounded-lg transition-all"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/30">
            <p className="text-xs font-bold text-[#A1A5B7]">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev - 1); }} className="p-2 border border-[#F1F1F4] rounded-lg disabled:opacity-30 hover:bg-white transition-all"><ChevronLeft size={16} /></button>
              <button disabled={currentPage === totalPages} onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => prev + 1); }} className="p-2 border border-[#F1F1F4] rounded-lg disabled:opacity-30 hover:bg-white transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#181C32]/40 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
                <div>
                  <h2 className="text-lg font-bold text-[#181C32]">{selectedAsset.nama_mesin}</h2>
                  <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest">{selectedAsset.brand || '-'}</p>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white border border-transparent hover:border-[#F1F1F4] rounded-xl text-[#A1A5B7] transition-all"><X size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#A1A5B7] uppercase tracking-wider">Model</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.model_tipe || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#A1A5B7] uppercase tracking-wider">SN</label>
                      <p className="text-sm font-bold font-mono text-[#0095E8]">{selectedAsset.serial_number || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#A1A5B7] uppercase tracking-wider">Lokasi</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.lokasi || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#A1A5B7] uppercase tracking-wider">Servis</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.maintenance_hours > 0 ? `${selectedAsset.maintenance_hours} Jam` : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="p-6 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4]">
                    <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider mb-3">Catatan Spesifikasi</h4>
                    <p className="text-sm text-[#7E8299] leading-relaxed whitespace-pre-wrap">{selectedAsset.catatan || 'Tidak ada catatan.'}</p>
                  </div>

                  {/* Edit History (Audit Trail) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-[#0095E8]" />
                      <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Riwayat Perubahan & Audit</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {assetLogs.length > 0 ? (
                        assetLogs.map((log, idx) => (
                          <div key={idx} className="p-4 bg-white border border-[#F1F1F4] rounded-xl flex items-start gap-4 shadow-sm">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${log.action === 'CREATE' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF5F8] text-[#F1416C]'}`}>
                              {log.action === 'CREATE' ? 'C' : 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-[#3F4254]">{log.firstName} {log.lastName}</p>
                                <p className="text-[10px] font-bold text-[#A1A5B7]">{formatDateTime(log.created_at).date} | {formatDateTime(log.created_at).time}</p>
                              </div>
                              <p className="text-[11px] text-[#7E8299] italic">{log.details}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#A1A5B7] italic">Belum ada riwayat perubahan.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Dokumentasi Foto</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {safeLampiran(selectedAsset.lampiran).map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#F1F1F4] cursor-pointer" onClick={() => setZoomedImage(img)}>
                        <img src={img} alt="Aset" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {safeLampiran(selectedAsset.lampiran).length === 0 && (
                      <div className="col-span-2 py-10 bg-[#F9F9F9] rounded-xl border border-dashed border-[#E4E6EF] text-center text-[#A1A5B7] text-[10px] font-bold uppercase tracking-wider">No Media</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-[#F1F1F4] bg-[#F9F9F9]/50 flex justify-end">
                <button onClick={() => setSelectedAsset(null)} className="px-8 py-3 bg-white border border-[#F1F1F4] text-[#3F4254] rounded-xl text-sm font-bold hover:bg-[#F9F9F9] transition-all">Tutup</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Form Register Style) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#181C32]/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.form 
              onSubmit={handleUpdate}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#181C32]">Edit Data Aset</h2>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 text-[#A1A5B7]"><X size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#3F4254]">Nama Mesin / Aset</label>
                    <input required type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm focus:bg-white focus:border-[#0095E8]/20 outline-none transition-all" value={editFormData.nama_mesin} onChange={(e) => setEditFormData({...editFormData, nama_mesin: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#3F4254]">Brand</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm outline-none transition-all" value={editFormData.brand} onChange={(e) => setEditFormData({...editFormData, brand: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#3F4254]">Model/Tipe</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm outline-none transition-all" value={editFormData.model_tipe} onChange={(e) => setEditFormData({...editFormData, model_tipe: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#3F4254]">Serial Number</label>
                    <input type="text" className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm font-mono outline-none transition-all" value={editFormData.serial_number} onChange={(e) => setEditFormData({...editFormData, serial_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#3F4254]">Lokasi / Ruangan</label>
                    <select className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm outline-none transition-all" value={editFormData.lokasi} onChange={(e) => setEditFormData({...editFormData, lokasi: e.target.value})}>
                      {locations.map(l => <option key={l.id} value={l.label}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#3F4254]">Prioritas</label>
                      <select className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm outline-none transition-all" value={editFormData.prioritas} onChange={(e) => setEditFormData({...editFormData, prioritas: e.target.value})}>
                        {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#3F4254]">Kondisi</label>
                      <select className="w-full px-4 py-3 bg-[#F9F9F9] border-transparent rounded-xl text-sm outline-none transition-all" value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
                        {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4] space-y-3">
                    <p className="text-[10px] font-bold text-[#181C32] uppercase">Jadwal Maintenance</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" min="0" placeholder="Hari" className="px-3 py-2 bg-white rounded-lg text-sm border border-[#F1F1F4]" value={maintInput.days} onChange={(e) => handleMaintenanceInput('days', e.target.value)} />
                      <input type="number" min="0" placeholder="Jam" className="px-3 py-2 bg-white rounded-lg text-sm border border-[#F1F1F4]" value={maintInput.hours} onChange={(e) => handleMaintenanceInput('hours', e.target.value)} />
                    </div>
                    <p className="text-[10px] text-[#50CD89] font-bold">Total: {editFormData.maintenance_hours} Jam Operasional</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#3F4254]">Foto Lampiran</label>
                    <div className="flex flex-wrap gap-2">
                      {editFormData.lampiran.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#F1F1F4]">
                          <img src={img} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setEditFormData({...editFormData, lampiran: editFormData.lampiran.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg"><X size={10} /></button>
                        </div>
                      ))}
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-[#E4E6EF] flex items-center justify-center text-[#A1A5B7] cursor-pointer hover:border-[#0095E8]/30 transition-all">
                        <Camera size={16} />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-[#F1F1F4] bg-[#F9F9F9]/50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 py-3 text-sm font-bold text-[#7E8299] hover:bg-white rounded-xl transition-all">Batal</button>
                <button type="submit" className="px-10 py-3 bg-[#0095E8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0095E8]/20 hover:bg-[#0084ce] transition-all">Update Aset</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90" onClick={() => setZoomedImage(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={zoomedImage} alt="Zoom" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
              <button onClick={() => setZoomedImage(null)} className="absolute -top-10 right-0 text-white hover:text-[#0095E8] transition-colors"><X size={28} /></button>
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
      `}</style>
    </div>
  );
};

export default MonitoringAset;
