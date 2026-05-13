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
  ChevronDown
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
  Pie
} from 'recharts';

const MonitoringAset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  
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
        setAssets(data);
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

  // Analytics Data
  const analyticsData = useMemo(() => {
    const statusCounts = {};
    const priorityCounts = {};
    
    assets.forEach(asset => {
      statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
      priorityCounts[asset.prioritas] = (priorityCounts[asset.prioritas] || 0) + 1;
    });

    const statusChart = Object.keys(statusCounts).map(name => ({ name, value: statusCounts[name] }));
    const priorityChart = Object.keys(priorityCounts).map(name => ({ name, value: priorityCounts[name] }));

    return { statusChart, priorityChart, total: assets.length };
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
        <p className="text-[#A1A5B7] text-sm font-medium">Analisis dan pengawasan unit operasional secara real-time.</p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#F1F1F4] shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest mb-2">Total Aset Terdaftar</p>
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
              <BarChart data={analyticsData.statusChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#A1A5B7' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F9F9F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {analyticsData.statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.priorityChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
            placeholder="Cari nama mesin, merk, atau serial number..."
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
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Aset & Spesifikasi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Detail Teknis</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi & Kondisi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Pendaftar & Waktu</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>)
              ) : paginatedAssets.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-20 text-center text-[#A1A5B7] text-sm font-medium">Data aset tidak ditemukan.</td></tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F9F9F9]/50 transition-all group cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-[#181C32] mb-0.5">{asset.nama_mesin}</p>
                      <p className="text-[11px] text-[#A1A5B7] font-medium">{asset.brand || '-'} | <span className="text-[#0095E8]">{asset.model_tipe || '-'}</span></p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-[#3F4254] mb-1">SN: <span className="font-mono text-[#0095E8]">{asset.serial_number || 'N/A'}</span></p>
                      <p className="text-[11px] text-[#7E8299]">Maintenance: {asset.maintenance_hours > 0 ? `${asset.maintenance_hours} Jam` : 'N/A'}</p>
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
                      <p className="text-[10px] text-[#A1A5B7]">{formatDateTime(asset.created_at).date} | {formatDateTime(asset.created_at).time}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="p-2 bg-white border border-[#F1F1F4] text-[#A1A5B7] rounded-lg group-hover:text-[#0095E8] group-hover:border-[#0095E8]/30 transition-all inline-block">
                        <ChevronRight size={16} />
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
            <p className="text-xs font-bold text-[#A1A5B7]">Menampilkan {paginatedAssets.length} dari {filteredAssets.length} aset</p>
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
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
                <div>
                  <h2 className="text-lg font-bold text-[#181C32]">{selectedAsset.nama_mesin}</h2>
                  <p className="text-xs font-bold text-[#A1A5B7] uppercase tracking-widest">{selectedAsset.brand || '-'}</p>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white border border-transparent hover:border-[#F1F1F4] rounded-xl text-[#A1A5B7] transition-all"><X size={20} /></button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-7 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Model / Tipe</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.model_tipe || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Serial Number</label>
                      <p className="text-sm font-bold font-mono text-[#0095E8]">{selectedAsset.serial_number || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Lokasi Unit</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.lokasi || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Interval Servis</label>
                      <p className="text-sm font-bold text-[#3F4254]">{selectedAsset.maintenance_hours > 0 ? `${selectedAsset.maintenance_hours} Jam` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-[#F9F9F9] rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Catatan Spesifikasi</h4>
                    <p className="text-sm text-[#7E8299] leading-relaxed whitespace-pre-wrap">{selectedAsset.catatan || 'Tidak ada catatan teknis.'}</p>
                  </div>

                  <div className="pt-6 border-t border-[#F1F1F4] space-y-4">
                    <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Histori Pendaftaran</h4>
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-[#A1A5B7] uppercase">Admin Pendaftar</p>
                        <p className="text-xs font-bold text-[#3F4254]">{selectedAsset.firstName} {selectedAsset.lastName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#A1A5B7] uppercase">Waktu Input</p>
                        <p className="text-xs font-bold text-[#3F4254]">{formatDateTime(selectedAsset.created_at).date} | {formatDateTime(selectedAsset.created_at).time}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 space-y-6">
                  <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Lampiran Foto ({safeLampiran(selectedAsset.lampiran).length})</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {safeLampiran(selectedAsset.lampiran).length > 0 ? (
                      safeLampiran(selectedAsset.lampiran).map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#F1F1F4] group cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => setZoomedImage(img)}>
                          <img src={img} alt="Aset" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Maximize2 size={20} className="text-white" /></div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 bg-[#F9F9F9] rounded-2xl border-2 border-dashed border-[#E4E6EF] flex flex-col items-center justify-center text-[#A1A5B7] font-bold text-[10px] uppercase">Tidak Ada Media</div>
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
      `}</style>
    </div>
  );
};

export default MonitoringAset;
