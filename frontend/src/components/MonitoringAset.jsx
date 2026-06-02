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
import { getImageUrl } from '../utils/imageUrl';
import { authFetch } from '../services/api';

import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/imageOptimizer';
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


const AssetAnalyticsDashboard = ({ data }) => {
  if (!data || !data.trend || !data.asset) return (
    <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
      <div className="flex flex-col items-center gap-2">
        <Activity className="text-slate-300 animate-pulse" size={32} />
        <span className="text-[11px] font-bold text-slate-400">Menyiapkan analisis aset...</span>
      </div>
    </div>
  );
  
  const { trend = [], asset = {} } = data;
  
  // Calculate health score (0-100)
  const maintenanceCount = Array.isArray(trend) ? trend.reduce((sum, item) => sum + (item.count || 0), 0) : 0;
  const totalSeconds = (asset.maintenance_hours || 100) * 3600;
  const remainingPercent = asset.remaining_seconds !== undefined ? (asset.remaining_seconds / totalSeconds) * 100 : 0;
  
  let healthScore = 100;
  healthScore -= (maintenanceCount * 10); // Each maintenance in last 12 months costs 10 points
  if (remainingPercent < 20) healthScore -= 30; // Heavy penalty for low timer
  
  healthScore = Math.max(0, Math.min(100, healthScore));

  const getHealthStatus = (score) => {
    if (score > 80) return { label: 'Sangat Baik', color: 'text-green-500', bg: 'bg-green-50' };
    if (score > 60) return { label: 'Normal', color: 'text-blue-500', bg: 'bg-blue-50' };
    if (score > 30) return { label: 'Perlu Perhatian', color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'Rekomendasi Penggantian', color: 'text-red-500', bg: 'bg-red-50' };
  };

  const status = getHealthStatus(healthScore);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#0095E8]" />
            <h4 className="text-xs font-black text-[#181C32] uppercase tracking-wider">Replacement Analysis</h4>
         </div>
         <div className={`px-4 py-1.5 rounded-full ${status.bg} ${status.color} text-[10px] font-black uppercase tracking-widest border border-current/10`}>
           {status.label}
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Health Score</p>
           <h5 className={`text-2xl font-black ${status.color}`}>{Math.round(healthScore)}%</h5>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Repair Freq (12m)</p>
           <h5 className="text-2xl font-black text-slate-800">{maintenanceCount}x</h5>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Asset Status</p>
           <h5 className="text-[13px] font-black text-slate-700">{asset.status}</h5>
        </div>
      </div>

      <div className="h-[220px] w-full bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
         <div className="absolute top-4 left-6">
            <span className="text-[10px] font-black text-slate-400 uppercase">Trend Frekuensi Kerusakan</span>
         </div>
         <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={trend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F4" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 900, fill: '#A1A5B7'}} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#F9F9F9' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: '16px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 900, color: '#181C32' }}
              />
              <Bar dataKey="count" fill="#0095E8" radius={[8, 8, 0, 0]} barSize={28}>
                {trend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count >= 2 ? '#F1416C' : '#0095E8'} />
                ))}
              </Bar>
            </BarChart>
         </ResponsiveContainer>
      </div>
      <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50">
         <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
               <Info size={16} />
            </div>
            <div>
               <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Rekomendasi Sistem</p>
               <p className="text-[12px] text-blue-700 font-medium leading-relaxed">
                 {healthScore < 40 ? 
                   "Aset ini menunjukkan tingkat degradasi yang kritis. Frekuensi maintenance yang tinggi menandakan biaya operasional akan terus membengkak. Disarankan untuk segera merencanakan pengadaan unit baru." : 
                   healthScore < 70 ? 
                   "Aset dalam kondisi penurunan performa. Lakukan pengecekan komponen utama lebih sering untuk mencegah kerusakan total." : 
                   "Aset dalam kondisi optimal. Terus pertahankan jadwal maintenance rutin untuk menjaga life-cycle mesin."
                 }
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

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
  const [notePhotos, setNotePhotos] = useState([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState({ show: false, assetId: null, action: '', selectedIds: null });
  const [toggleSelectModal, setToggleSelectModal] = useState({
    show: false,
    assetId: null,
    action: '',
    connectedAssets: [],
    selectedIds: []
  });
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintFormData, setMaintFormData] = useState({
    reason: '', responsible_person: '', actions_taken: '', photos: [],
    days: 0, hours: 0
  });
  const [maintLogs, setMaintLogs] = useState([]);
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);
  const [specificAssetAnalytics, setSpecificAssetAnalytics] = useState(null);
  const [isFetchingSpecificAnalytics, setIsFetchingSpecificAnalytics] = useState(false);
  const timerRef = useRef(null);

  const assetsNeedingMaint = useMemo(() => {
    return assets.filter(a => a.remaining_seconds > 0 && a.remaining_seconds <= 604800);
  }, [assets]);

  const assetsLockout = useMemo(() => {
    return assets.filter(a => a.remaining_seconds <= 0);
  }, [assets]);

  const sortedAlertAssets = useMemo(() => {
    const combined = [...assetsLockout, ...assetsNeedingMaint];
    return combined.sort((a, b) => {
      const aLock = a.remaining_seconds <= 0;
      const bLock = b.remaining_seconds <= 0;
      if (aLock !== bLock) return aLock ? -1 : 1;
      
      const aIsChild = a.parent_id !== null && a.parent_id !== undefined;
      const bIsChild = b.parent_id !== null && b.parent_id !== undefined;
      
      if (aIsChild !== bIsChild) {
        return aIsChild ? -1 : 1;
      }
      
      return a.remaining_seconds - b.remaining_seconds;
    });
  }, [assetsLockout, assetsNeedingMaint]);

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

  const safeParseJSON = (str, fallback = []) => {
    if (!str) return fallback;
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (e) {
      console.error('JSON Parse error:', e);
      return fallback;
    }
  };
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama_mesin: '', brand: '', model_tipe: '', serial_number: '',
    lokasi: '', prioritas: '', status: '', catatan: '', lampiran: [],
    maintenance_hours: 0, parent_id: null
  });
  const [maintInput, setMaintInput] = useState({ days: 0, hours: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  // New item inputs for Edit Modal
  const [showNewLocInput, setShowNewLocInput] = useState(false);
  const [newLocLabel, setNewLocLabel] = useState('');
  const [showNewStatInput, setShowNewStatInput] = useState(false);
  const [newStatLabel, setNewStatLabel] = useState('');
  const [showNewPrioInput, setShowNewPrioInput] = useState(false);
  const [newPrioLabel, setNewPrioLabel] = useState('');

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
        setAssets(prev => {
          if (cleanData.parent_id) {
            const parent = prev.find(p => p.id === cleanData.parent_id);
            if (parent) {
              cleanData.parent_name = parent.nama_mesin;
            }
          }
          return prev.map(a => a.id === cleanData.id ? { ...a, ...cleanData } : a);
        });
        setSelectedAsset(prev => prev && prev.id === cleanData.id ? { ...prev, ...cleanData } : prev);
        setActiveMobileAsset(prev => prev && prev.id === cleanData.id ? { ...prev, ...cleanData } : prev);
      };
      socket.on('asset-status-updated', (data) => {
        handleAssetUpdate(data);
      });
      return () => socket.off('asset-status-updated');
    }
  }, []);

  const fetchAssetAnalytics = async (id) => {
    setIsFetchingSpecificAnalytics(true);
    try {
      const res = await authFetch(`/api/assets/${id}/analytics`);
      if (res.ok) setSpecificAssetAnalytics(await res.json());
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setIsFetchingSpecificAnalytics(false);
    }
  };

  useEffect(() => {
    if (selectedAsset && !isMobile) {
      fetchAssetLogs(selectedAsset.id);
      fetchMaintLogs(selectedAsset.id);
      fetchAssetAnalytics(selectedAsset.id);
    }
  }, [selectedAsset, isMobile]);

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

    // Lockout logic: cannot start if remaining time is 0
    if (!asset.is_running && asset.remaining_seconds <= 0) {
      showError('Unit membutuhkan maintenance segera. Tidak dapat dinyalakan.');
      return;
    }

    const parentId = asset.parent_id || asset.id;
    const parentAsset = assets.find(a => a.id === parentId);
    const children = assets.filter(a => a.parent_id === parentId);

    const connectedGroup = [];
    if (parentAsset) connectedGroup.push(parentAsset);
    connectedGroup.push(...children);

    const uniqueGroup = Array.from(new Map(connectedGroup.map(item => [item.id, item])).values());

    if (uniqueGroup.length > 1) {
      // Show the selective checkbox modal
      setToggleSelectModal({
        show: true,
        assetId,
        action: asset.is_running ? 'Mematikan' : 'Menyalakan',
        connectedAssets: uniqueGroup,
        selectedIds: uniqueGroup.map(a => a.id) // checked by default
      });
    } else {
      // Standalone asset
      setToggleConfirm({ 
        show: true, 
        assetId, 
        action: asset.is_running ? 'Mematikan' : 'Menyalakan',
        selectedIds: [assetId]
      });
    }
  };

  const executeToggleStatus = async () => {
    const { assetId, selectedIds } = toggleConfirm;
    if (!assetId || isToggling) return;

    try {
      setIsToggling(true);
      setToggleConfirm({ show: false, assetId: null, action: '', selectedIds: null });
      
      const res = await authFetch(`/api/assets/${assetId}/toggle`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_ids: selectedIds })
      });
      if (!res.ok) {
        showError('Gagal mengubah status aset');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showError('Terjadi kesalahan saat mengubah status');
    } finally {
      setIsToggling(false);
    }
  };

  const fetchMaintLogs = async (id) => {
    try {
      const res = await authFetch(`/api/assets/${id}/maintenance-logs`);
      if (res.ok) {
        setMaintLogs(await res.json());
      }
    } catch (err) {
      console.error('Fetch maint logs error:', err);
    }
  };

  const handleSubmitMaintenance = async () => {
    const { reason, responsible_person, actions_taken, photos, days, hours } = maintFormData;
    if (!reason || !responsible_person || !actions_taken) {
      showError('Mohon lengkapi data maintenance');
      return;
    }

    const totalHours = parseInt(days || 0) * 24 + parseInt(hours || 0);
    if (totalHours <= 0) {
      showError('Interval maintenance baru harus lebih dari 0');
      return;
    }

    setIsSubmittingMaint(true);
    try {
      const assetId = isMobile ? activeMobileAsset?.id : selectedAsset?.id;
      const res = await authFetch(`/api/assets/${assetId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          responsible_person,
          actions_taken,
          photos,
          new_maintenance_hours: totalHours
        })
      });

      if (res.ok) {
        const data = await res.json();
        success('Data maintenance berhasil disimpan');
        setIsMaintModalOpen(false);
        setMaintFormData({ reason: '', responsible_person: '', actions_taken: '', photos: [], days: 0, hours: 0 });
        
        setAssets(prev => prev.map(a => a.id === assetId ? { 
          ...a, 
          remaining_seconds: data.remaining_seconds, 
          maintenance_hours: data.maintenance_hours,
          is_running: 0,
          last_started_at: null
        } : a));
        
        fetchMaintLogs(assetId);
        fetchAssetLogs(assetId);
      }
    } catch (err) {
      showError('Gagal menyimpan data maintenance');
    } finally {
      setIsSubmittingMaint(false);
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
    if (!newNote.trim() && notePhotos.length === 0) return;
    setIsSubmittingNote(true);
    try {
      const assetId = isMobile ? activeMobileAsset?.id : selectedAsset?.id;
      const res = await authFetch(`/api/assets/${assetId}/note`, {
        method: 'POST',
        body: JSON.stringify({ 
          note: newNote,
          photos: notePhotos
        })
      });
      if (res.ok) {
        success('Catatan berhasil ditambahkan');
        setNewNote('');
        setNotePhotos([]);
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

  // Add New Handlers for Edit Modal
  const handleAddNewLoc = async () => {
    if (!newLocLabel.trim()) return;
    try {
      const res = await authFetch('/api/assets/locations', {
        method: 'POST',
        body: JSON.stringify({ label: newLocLabel })
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(prev => [...prev, data]);
        setEditFormData({ ...editFormData, lokasi: data.label });
        setShowNewLocInput(false);
        setNewLocLabel('');
        success('Lokasi baru ditambahkan');
      }
    } catch (err) { showError('Gagal menambah lokasi'); }
  };

  const handleAddNewStat = async () => {
    if (!newStatLabel.trim()) return;
    try {
      const res = await authFetch('/api/assets/statuses', {
        method: 'POST',
        body: JSON.stringify({ label: newStatLabel })
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses(prev => [...prev, data]);
        setEditFormData({ ...editFormData, status: data.label });
        setShowNewStatInput(false);
        setNewStatLabel('');
        success('Status baru ditambahkan');
      }
    } catch (err) { showError('Gagal menambah status'); }
  };

  const handleAddNewPrio = async () => {
    if (!newPrioLabel.trim()) return;
    try {
      const res = await authFetch('/api/assets/priorities', {
        method: 'POST',
        body: JSON.stringify({ label: newPrioLabel })
      });
      if (res.ok) {
        const data = await res.json();
        setPriorities(prev => [...prev, data]);
        setEditFormData({ ...editFormData, prioritas: data.label });
        setShowNewPrioInput(false);
        setNewPrioLabel('');
        success('Prioritas baru ditambahkan');
      }
    } catch (err) { showError('Gagal menambah prioritas'); }
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
      lampiran: safeParseJSON(asset.lampiran),
      maintenance_hours: asset.maintenance_hours || 0,
      parent_id: asset.parent_id || null
    });
    const d = Math.floor(asset.maintenance_hours / 24);
    const h = asset.maintenance_hours % 24;
    setMaintInput({ days: d, hours: h });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await authFetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        success('Data aset berhasil diperbarui');
        fetchAssets();
        // Update selected asset if viewing detail
        if (selectedAsset && selectedAsset.id === editingAsset.id) {
          const parentAsset = assets.find(a => a.id === editFormData.parent_id);
          const updated = { 
            ...selectedAsset, 
            ...editFormData,
            parent_name: parentAsset ? parentAsset.nama_mesin : null,
            remaining_seconds: (editFormData.maintenance_hours || 0) * 3600
          };
          setSelectedAsset(updated);
        }
        if (activeMobileAsset && activeMobileAsset.id === editingAsset.id) {
          const parentAsset = assets.find(a => a.id === editFormData.parent_id);
          const updated = { 
            ...activeMobileAsset, 
            ...editFormData,
            parent_name: parentAsset ? parentAsset.nama_mesin : null,
            remaining_seconds: (editFormData.maintenance_hours || 0) * 3600
          };
          setActiveMobileAsset(updated);
        }
      } else {
        showError('Gagal memperbarui data aset');
      }
    } catch (err) {
      showError('Terjadi kesalahan sistem');
    } finally {
      setIsUpdating(false);
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

          {/* Maintenance Alerts Notification */}
          {sortedAlertAssets.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-amber-600" size={20} />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-amber-900 leading-tight">Perhatian: Maintenance Unit</h4>
                  <p className="text-[11px] text-amber-700/80 font-bold mt-1 leading-relaxed">
                    Terdapat unit kritis teratas (Freon/Perintilan diprioritaskan paling atas):
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sortedAlertAssets.slice(0, 3).map(a => (
                      <span key={a.id} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${a.remaining_seconds <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {a.nama_mesin}
                      </span>
                    ))}
                    {sortedAlertAssets.length > 3 && (
                      <span className="text-[9px] font-bold text-amber-400">+{sortedAlertAssets.length - 3} lagi</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Asset Selection Area */}
          <div className="relative">
            <select 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-[15px] font-black text-slate-700 outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all appearance-none"
              value={activeMobileAsset?.id || ''}
              onChange={(e) => {
                const asset = assets.find(a => a.id === parseInt(e.target.value));
                setActiveMobileAsset(asset);
                if (asset) {
                  fetchAssetLogs(asset.id);
                  fetchMaintLogs(asset.id);
                }
              }}
            >
              <option value="" disabled>Pilih Unit Mesin / Aset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id} className={a.remaining_seconds <= 0 ? 'text-red-500' : ''}>
                  {a.nama_mesin} - {a.brand} {a.remaining_seconds <= 0 ? '(MAINTENANCE)' : ''}
                </option>
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
                {/* Big Round Toggle or Maintenance Selection */}
                <div className="flex flex-col items-center gap-6">
                  {/* Start / Stop Button */}
                  {!(activeMobileAsset.remaining_seconds <= 0 && !activeMobileAsset.is_running) && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      disabled={isToggling}
                      onClick={() => handleToggleStatus(activeMobileAsset.id)}
                      className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 shadow-2xl transition-all duration-500 border-8 ${
                        isToggling ? 'opacity-70 grayscale' : ''
                      } ${
                        activeMobileAsset.is_running 
                          ? 'bg-red-500 border-red-100 shadow-red-200 text-white' 
                          : (activeMobileAsset.remaining_seconds <= 604800 ? 'bg-amber-500 border-amber-50 shadow-amber-100 text-white' : 'bg-white border-slate-50 shadow-slate-200 text-slate-300')
                      }`}
                    >
                      <Power size={48} strokeWidth={2.5} className={`${activeMobileAsset.is_running ? 'drop-shadow-lg' : ''} ${isToggling ? 'animate-spin-slow' : ''}`} />
                      <span className="text-[18px] font-black uppercase tracking-widest">
                        {isToggling ? 'Wait...' : (activeMobileAsset.is_running ? 'Stop' : 'Start')}
                      </span>
                    </motion.button>
                  )}

                  {/* Maintenance Button (Shown if <= 7d and NOT running) */}
                  {!activeMobileAsset.is_running && activeMobileAsset.remaining_seconds <= 604800 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMaintModalOpen(true)}
                      className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[14px] uppercase tracking-wider shadow-lg transition-all ${
                        activeMobileAsset.remaining_seconds <= 0 
                          ? 'bg-amber-500 text-white shadow-amber-100 w-64 h-64 rounded-full flex-col !gap-4' 
                          : 'bg-white text-amber-600 border border-amber-100'
                      }`}
                    >
                      {activeMobileAsset.remaining_seconds <= 0 ? (
                        <>
                          <AlertTriangle size={64} className="animate-pulse" />
                          <span className="text-center">Maintenance Required<br/><span className="text-[10px] opacity-70">Unit Locked</span></span>
                        </>
                      ) : (
                        <>
                          <Settings size={18} />
                          <span>Maintenance Sekarang</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

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

              {/* Hubungan & Sinkronisasi Aset Induk / Anak */}
              {activeMobileAsset.parent_id && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-[28px] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-blue-900 leading-tight">Terhubung ke Induk</h4>
                    <p className="text-[11px] text-blue-700/80 font-bold mt-1 leading-relaxed">
                      Aset ini terhubung ke <strong>{activeMobileAsset.parent_name || 'Aset Induk'}</strong>. Timer hitung mundur berjalan otomatis menyinkronkan status induknya.
                    </p>
                  </div>
                </div>
              )}

              {(() => {
                const childAssets = assets.filter(a => a.parent_id === activeMobileAsset.id);
                if (childAssets.length > 0) {
                  return (
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-[28px] space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-[#0095E8]" />
                        <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-widest">Aset Anak Terhubung ({childAssets.length})</h4>
                      </div>
                      <div className="space-y-2.5">
                        {childAssets.map(child => {
                          let childLiveTime = child.remaining_seconds;
                          if (child.is_running && child.last_started_at) {
                            const start = new Date(child.last_started_at);
                            const now = new Date();
                            const elapsed = Math.floor((now - start) / 1000);
                            childLiveTime = Math.max(0, child.remaining_seconds - elapsed);
                          }
                          return (
                            <div key={child.id} className="p-3 bg-white rounded-2xl border border-slate-100/80 flex items-center justify-between shadow-sm">
                              <div>
                                <p className="text-[12px] font-black text-slate-700 leading-tight">{child.nama_mesin}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{child.brand || '-'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase ${child.is_running ? 'text-green-500 animate-pulse' : 'text-slate-300'}`}>
                                  {child.is_running ? 'ON' : 'OFF'}
                                </span>
                                <span className="text-[12px] font-mono font-black text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                  {formatTime(childLiveTime)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-blue-500 font-bold italic leading-relaxed bg-blue-50/20 p-2.5 rounded-xl border border-blue-50/50">
                        * Mengaktifkan unit ini otomatis akan menyalakan timer seluruh aset anak di atas.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

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

        {/* Maintenance Submission Modal for Mobile */}
        <AnimatePresence>
          {isMaintModalOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMaintModalOpen(false)} />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative bg-white w-full rounded-t-[40px] p-6 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                         <Settings size={20} />
                      </div>
                      <h3 className="text-[18px] font-black text-slate-800">Submit Maintenance</h3>
                   </div>
                   <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400 p-2"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                  {/* Form Fields */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Maintenance / Kerusakan</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border-transparent rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-amber-400/30 transition-all min-h-[100px]"
                      placeholder="Contoh: Penggantian oli berkala atau perbaikan rantai..."
                      value={maintFormData.reason}
                      onChange={(e) => setMaintFormData({...maintFormData, reason: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Penanggung Jawab (PIC)</label>
                    <input 
                      type="text"
                      className="w-full p-5 bg-slate-50 border-transparent rounded-2xl text-[14px] font-black text-slate-700 outline-none focus:bg-white focus:border-amber-400/30 transition-all"
                      placeholder="Nama lengkap teknisi..."
                      value={maintFormData.responsible_person}
                      onChange={(e) => setMaintFormData({...maintFormData, responsible_person: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tindakan Yang Dilakukan</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border-transparent rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-amber-400/30 transition-all min-h-[100px]"
                      placeholder="Detail perbaikan yang dikerjakan..."
                      value={maintFormData.actions_taken}
                      onChange={(e) => setMaintFormData({...maintFormData, actions_taken: e.target.value})}
                    />
                  </div>

                  {/* Photo Upload for Maintenance */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto Bukti (Maks 5)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {maintFormData.photos.map((img, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img src={getImageUrl(img)} className="w-full h-full object-cover rounded-2xl border border-slate-100" />
                          <button 
                            onClick={() => setMaintFormData({...maintFormData, photos: maintFormData.photos.filter((_, i) => i !== idx)})}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {maintFormData.photos.length < 5 && (
                        <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-100 transition-all">
                          <Camera size={24} className="text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400">Upload</span>
                          <input 
                            type="file" accept="image/*" multiple className="hidden" 
                            onChange={async (e) => {
                              const files = Array.from(e.target.files).slice(0, 5 - maintFormData.photos.length);
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
                                setMaintFormData(prev => ({ ...prev, photos: [...prev.photos, ...base64Strings] }));
                              } catch (err) {
                                showError('Gagal memproses gambar');
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* New Interval Setting */}
                  <div className="bg-blue-50/50 rounded-[32px] p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                       <Clock size={18} className="text-[#0095E8]" />
                       <h4 className="text-[14px] font-black text-slate-800">Atur Interval Selanjutnya</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase">Hari</label>
                         <input 
                           type="number" className="w-full p-4 bg-white rounded-2xl text-center font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#0095E8]/20"
                           value={maintFormData.days} onChange={(e) => setMaintFormData({...maintFormData, days: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase">Jam</label>
                         <input 
                           type="number" className="w-full p-4 bg-white rounded-2xl text-center font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#0095E8]/20"
                           value={maintFormData.hours} onChange={(e) => setMaintFormData({...maintFormData, hours: e.target.value})}
                         />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-bold italic">Waktu akan dikonversi menjadi total jam operasional baru.</p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmittingMaint}
                    onClick={handleSubmitMaintenance}
                    className="w-full py-4 bg-amber-500 text-white rounded-[24px] font-black text-[16px] shadow-xl shadow-amber-100 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {isSubmittingMaint ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        <span>Selesaikan & Reset Timer</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
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
                  className="w-full p-5 bg-slate-50 border-transparent rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-[#0095E8]/30 transition-all min-h-[120px]"
                  placeholder="Ketik pesan atau informasi tentang unit ini untuk tim lain..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />

                {/* Photo Upload for Note (Mobile) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Lampiran Foto ({notePhotos.length}/5)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notePhotos.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                        <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setNotePhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {notePhotos.length < 5 && (
                      <label className="w-20 h-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer active:bg-slate-100 transition-all">
                        <Camera size={24} />
                        <input 
                          type="file" accept="image/*" multiple className="hidden" 
                          onChange={async (e) => {
                            const files = Array.from(e.target.files).slice(0, 5 - notePhotos.length);
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
                              setNotePhotos(prev => [...prev, ...base64Strings]);
                            } catch (err) {
                              showError('Gagal memproses gambar');
                            }
                          }} 
                        />
                      </label>
                    )}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmittingNote || (!newNote.trim() && notePhotos.length === 0)}
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

                {/* Hubungan Aset Induk / Anak di Detail */}
                <div className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[#0095E8]" />
                    <h4 className="text-[13px] font-black text-slate-800 tracking-wide">Hubungan Aset & Timer</h4>
                  </div>
                  
                  {selectedAsset.parent_id ? (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-[12px] font-black text-blue-900">Aset Induk: {selectedAsset.parent_name || 'Terhubung'}</p>
                      <p className="text-[11px] text-blue-700/80 mt-1 leading-relaxed font-bold">
                        Aset ini terhubung ke induknya. Timer berjalan otomatis mengikuti induk.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-bold italic">Aset ini berdiri sendiri (tidak memiliki aset induk).</p>
                  )}

                  {(() => {
                    const childAssets = assets.filter(a => a.parent_id === selectedAsset.id);
                    if (childAssets.length > 0) {
                      return (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aset Anak Terhubung ({childAssets.length})</p>
                          <div className="space-y-2">
                            {childAssets.map(child => {
                              let childLiveTime = child.remaining_seconds;
                              if (child.is_running && child.last_started_at) {
                                const start = new Date(child.last_started_at);
                                const now = new Date();
                                const elapsed = Math.floor((now - start) / 1000);
                                childLiveTime = Math.max(0, child.remaining_seconds - elapsed);
                              }
                              return (
                                <div key={child.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                                  <div>
                                    <p className="text-[12px] font-black text-slate-700">{child.nama_mesin}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{child.brand || '-'}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase ${child.is_running ? 'text-green-500 animate-pulse' : 'text-slate-400'}`}>
                                      {child.is_running ? 'ON' : 'OFF'}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-slate-600">
                                      {formatTime(childLiveTime)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                           {note.photos && safeParseJSON(note.photos).length > 0 && (
                             <div className="grid grid-cols-3 gap-2 mt-3">
                                {safeParseJSON(note.photos).map((img, i) => (
                                  <img key={i} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-xl border border-amber-100" onClick={() => setZoomedImage(img)} />
                                ))}
                             </div>
                           )}
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
                    {safeParseJSON(selectedAsset.lampiran).map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100" onClick={() => setZoomedImage(img)}>
                        <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {safeParseJSON(selectedAsset.lampiran).length === 0 && (
                      <div className="col-span-2 py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-[12px] font-bold">Tidak ada foto lampiran</div>
                    )}
                  </div>
                </div>

                {/* Maintenance History Section in Detail */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[14px] font-black text-slate-800">Riwayat Maintenance</h4>
                     <Zap size={16} className="text-amber-500" />
                   </div>
                   <div className="space-y-4">
                      {maintLogs.length === 0 ? (
                        <div className="py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-[11px] font-bold italic">Belum ada riwayat maintenance.</div>
                      ) : (
                        maintLogs.map((log, idx) => (
                          <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm space-y-3">
                             <div className="flex justify-between items-center">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase">Service Done</span>
                                <span className="text-[10px] text-slate-400 font-bold">{formatDateTime(log.created_at).date}</span>
                             </div>
                             <div>
                                <p className="text-[14px] font-black text-slate-800 leading-tight">{log.reason}</p>
                                <p className="text-[12px] text-slate-500 font-medium mt-1">{log.actions_taken}</p>
                                <div className="mt-2 flex items-center gap-2">
                                   <Clock size={12} className="text-blue-500" />
                                   <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                      Interval Reset: {Math.floor(log.old_remaining_seconds / 3600)}h → {Math.floor(log.new_remaining_seconds / 3600)}h
                                   </span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                   <Settings size={12} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600">PIC: {log.responsible_person}</span>
                             </div>
                             {log.photos && safeParseJSON(log.photos).length > 0 && (
                               <div className="grid grid-cols-3 gap-2 mt-2">
                                  {safeParseJSON(log.photos).map((img, i) => (
                                    <img key={i} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-xl border border-slate-100" onClick={() => setZoomedImage(img)} />
                                  ))}
                               </div>
                             )}
                          </div>
                        )
                      ))}
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
                        {log.action === 'NOTE' && log.photos && safeParseJSON(log.photos).length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                             {safeParseJSON(log.photos).map((img, i) => (
                               <img key={i} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-xl" onClick={() => setZoomedImage(img)} />
                             ))}
                          </div>
                        )}
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
              <img src={getImageUrl(zoomedImage)} className="w-full h-auto max-h-screen object-contain" />
              <button className="absolute top-10 right-6 text-white"><X size={32} /></button>
            </div>
          )}
        </AnimatePresence>
        
        {/* Selection Checkbox Modal (Mobile) */}
        <AnimatePresence>
          {toggleSelectModal.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleSelectModal({ show: false, assetId: null, action: '', connectedAssets: [], selectedIds: [] })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${toggleSelectModal.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                     <Power size={28} />
                  </div>
                  <h3 className="text-[18px] font-black text-slate-800 leading-tight">Kontrol Multi-Aset</h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Pilih unit yang ingin di{toggleSelectModal.action.toLowerCase() === 'mematikan' ? 'matikan' : 'nyalakan'}</p>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mb-6 custom-scrollbar">
                  {toggleSelectModal.connectedAssets.map(ast => {
                    const isParent = !ast.parent_id;
                    const isChecked = toggleSelectModal.selectedIds.includes(ast.id);
                    return (
                      <div 
                        key={ast.id} 
                        onClick={() => {
                          const alreadySelected = toggleSelectModal.selectedIds.includes(ast.id);
                          const newIds = alreadySelected 
                            ? toggleSelectModal.selectedIds.filter(id => id !== ast.id)
                            : [...toggleSelectModal.selectedIds, ast.id];
                          setToggleSelectModal(prev => ({ ...prev, selectedIds: newIds }));
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked 
                            ? 'bg-[#F1FAFF] border-[#0095E8]/30 shadow-sm' 
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded text-[#0095E8] border-slate-300 focus:ring-[#0095E8]"
                          />
                          <div>
                            <p className="text-[13px] font-black text-slate-800 leading-tight">{ast.nama_mesin}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isParent ? 'Aset Induk' : 'Aset Anak'}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${ast.is_running ? 'text-green-500' : 'text-slate-400'}`}>
                          {ast.is_running ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 font-bold italic text-center mb-6 leading-normal">
                  * Unit yang tidak dicentang tidak akan berubah statusnya.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setToggleSelectModal({ show: false, assetId: null, action: '', connectedAssets: [], selectedIds: [] })}
                    className="py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-black text-[13px]"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      if (toggleSelectModal.selectedIds.length === 0) {
                        showError('Mohon pilih minimal 1 unit');
                        return;
                      }
                      setToggleConfirm({
                        show: true,
                        assetId: toggleSelectModal.assetId,
                        action: toggleSelectModal.action,
                        selectedIds: toggleSelectModal.selectedIds
                      });
                      setToggleSelectModal(prev => ({ ...prev, show: false }));
                    }}
                    className={`py-3.5 text-white rounded-2xl font-black text-[13px] shadow-lg ${toggleSelectModal.action === 'Mematikan' ? 'bg-red-500 shadow-red-100' : 'bg-[#0095E8] shadow-blue-100'}`}
                  >
                    Lanjut
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Local Confirmation Modal for Toggle (Mobile) */}
        <AnimatePresence>
          {toggleConfirm.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleConfirm({ show: false, assetId: null, action: '', selectedIds: null })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
              >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${toggleConfirm.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                   <Power size={40} />
                </div>
                <h3 className="text-[20px] font-black text-slate-800 mb-2">{toggleConfirm.action} Mesin?</h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed">
                  Apakah Anda yakin ingin <strong>{toggleConfirm.action.toLowerCase()}</strong> unit berikut sekarang?
                </p>

                {toggleConfirm.selectedIds && toggleConfirm.selectedIds.length > 0 && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 max-h-[120px] overflow-y-auto custom-scrollbar">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unit yang akan di{toggleConfirm.action.toLowerCase() === 'mematikan' ? 'matikan' : 'nyalakan'}:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {toggleConfirm.selectedIds.map(sid => {
                        const targetAsset = assets.find(a => a.id === sid);
                        return (
                          <span key={sid} className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm border ${
                            toggleConfirm.action === 'Mematikan' 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {targetAsset?.nama_mesin || 'Aset'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setToggleConfirm({ show: false, assetId: null, action: '', selectedIds: null })}
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
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32] mb-1">Monitoring Aset</h1>
          <p className="text-[#A1A5B7] text-sm font-medium">Pengawasan unit operasional secara real-time dan terstruktur.</p>
        </div>
        
        {/* Maintenance Alert Banner for PC */}
        {sortedAlertAssets.length > 0 && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="flex items-start gap-4 bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm max-w-md shrink-0"
          >
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
               <AlertTriangle size={20} />
            </div>
            <div>
               <p className="text-[13px] font-black text-amber-900 leading-tight">
                  {sortedAlertAssets.length} Unit Butuh Perhatian!
               </p>
               <p className="text-[11px] font-bold text-amber-700/80 mt-1 leading-normal">Berikut unit kritis teratas (Freon/Perintilan diprioritaskan):</p>
               <div className="mt-2 flex flex-wrap gap-1.5">
                 {sortedAlertAssets.slice(0, 3).map(a => (
                   <span key={a.id} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm border ${
                     a.remaining_seconds <= 0 
                       ? 'bg-red-500 text-white border-red-400' 
                       : 'bg-amber-100 text-amber-800 border-amber-200'
                   }`}>
                     {a.nama_mesin}
                   </span>
                 ))}
                 {sortedAlertAssets.length > 3 && (
                   <span className="text-[9px] font-bold text-amber-500/80">+{sortedAlertAssets.length - 3} lagi</span>
                 )}
               </div>
            </div>
          </motion.div>
        )}
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
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    <tr key={asset.id} className={`hover:bg-[#F9F9F9]/50 transition-all group cursor-pointer ${liveTime <= 604800 ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-5 text-sm font-light text-[#7E8299]">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-normal text-[#181C32] mb-0.5">{asset.nama_mesin}</p>
                        <p className="text-[11px] text-[#A1A5B7] font-normal uppercase">{asset.brand || '-'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${asset.is_running ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                          <div>
                            <p className={`text-sm font-black tabular-nums ${liveTime <= 604800 ? 'text-red-600' : (asset.is_running ? 'text-[#0095E8]' : 'text-slate-700')}`}>
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
                  <div className={`p-8 rounded-[32px] text-white flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${timeLeft <= 604800 ? 'bg-red-600 shadow-xl shadow-red-100' : 'bg-[#1E1E2D]'}`}>
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

                  {/* Hubungan Aset Induk / Anak di PC Detail */}
                  <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-[#0095E8]" />
                      <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Hubungan Aset & Sinkronisasi Timer</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Aset Induk</p>
                        {selectedAsset.parent_id ? (
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
                            <div>
                              <p className="text-sm font-black text-blue-900">{selectedAsset.parent_name || 'Terhubung'}</p>
                              <p className="text-[11px] text-blue-700/80 font-bold mt-0.5">Timer menyatu & sinkron secara otomatis dengan unit ini.</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                              <Zap size={16} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-bold italic">Aset ini berdiri sendiri (tidak memiliki aset induk).</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#A1A5B7] uppercase tracking-wider">Aset Anak Terhubung</p>
                        {(() => {
                          const childAssets = assets.filter(a => a.parent_id === selectedAsset.id);
                          if (childAssets.length > 0) {
                            return (
                              <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                {childAssets.map(child => {
                                  let childLiveTime = child.remaining_seconds;
                                  if (child.is_running && child.last_started_at) {
                                    const start = new Date(child.last_started_at);
                                    const now = new Date();
                                    const elapsed = Math.floor((now - start) / 1000);
                                    childLiveTime = Math.max(0, child.remaining_seconds - elapsed);
                                  }
                                  return (
                                    <div key={child.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                                      <div>
                                        <p className="text-[12px] font-black text-slate-700 leading-none">{child.nama_mesin}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{child.brand || '-'}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase ${child.is_running ? 'text-green-500 animate-pulse' : 'text-slate-300'}`}>
                                          {child.is_running ? 'ON' : 'OFF'}
                                        </span>
                                        <span className="text-[12px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                          {formatTime(childLiveTime)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return <p className="text-xs text-slate-400 font-bold italic">Tidak ada aset anak yang terhubung ke unit ini.</p>
                        })()}
                      </div>
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
                             {note.photos && safeParseJSON(note.photos).length > 0 && (
                               <div className="grid grid-cols-4 gap-2 mt-3">
                                  {safeParseJSON(note.photos).map((img, i) => (
                                    <img key={i} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-xl border border-slate-100 cursor-zoom-in" onClick={() => setZoomedImage(img)} />
                                  ))}
                               </div>
                             )}
                          </div>
                        ))}
                        {assetLogs.filter(l => l.action === 'NOTE').length === 0 && (
                          <div className="col-span-2 py-6 text-center text-slate-300 text-xs font-bold">Tidak ada catatan tim.</div>
                        )}
                      </div>
                   </div>

                   {/* Dashboard Analytics Section */}
                   <AssetAnalyticsDashboard data={specificAssetAnalytics} />

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

                <div className="lg:col-span-4 space-y-8">
                   <div>
                     <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider mb-4">Media & Lampiran</h4>
                     <div className="grid grid-cols-2 gap-3">
                       {safeParseJSON(selectedAsset.lampiran).map((img, idx) => (
                         <img key={idx} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-xl border border-[#F1F1F4] cursor-zoom-in" onClick={() => setZoomedImage(img)} />
                       ))}
                     </div>
                   </div>

                   <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-[#181C32] uppercase tracking-wider">Riwayat Maintenance</h4>
                        <Settings size={14} className="text-amber-500" />
                      </div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {maintLogs.length === 0 ? (
                           <p className="text-[11px] text-slate-400 italic">Belum ada data maintenance.</p>
                         ) : (
                           maintLogs.map((log, idx) => (
                             <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                <div className="flex justify-between items-start">
                                   <span className="text-[10px] font-black text-[#181C32] uppercase">{log.reason}</span>
                                   <span className="text-[9px] text-slate-400 font-bold">{formatDateTime(log.created_at).date}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{log.actions_taken}</p>
                                <div className="flex items-center gap-1.5 py-1 px-2 bg-blue-50/50 rounded-lg w-fit">
                                   <Clock size={10} className="text-blue-500" />
                                   <span className="text-[9px] font-black text-blue-600 uppercase">
                                      {Math.floor(log.old_remaining_seconds / 3600)}h → {Math.floor(log.new_remaining_seconds / 3600)}h
                                   </span>
                                </div>
                                <p className="text-[9px] font-bold text-[#0095E8]">PIC: {log.responsible_person}</p>
                                {log.photos && safeParseJSON(log.photos).length > 0 && (
                                  <div className="grid grid-cols-4 gap-2 mt-2">
                                     {safeParseJSON(log.photos).map((img, i) => (
                                       <img key={i} src={getImageUrl(img)} className="w-full aspect-square object-cover rounded-lg cursor-zoom-in" onClick={() => setZoomedImage(img)} />
                                     ))}
                                  </div>
                                )}
                             </div>
                           ))
                         )}
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* Edit Asset Modal (Universal) */}
       <AnimatePresence>
         {isEditModalOpen && (
           <div className="fixed inset-0 z-[4000] flex items-center justify-center p-0 md:p-4 overflow-hidden">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
             <motion.div 
               initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
               animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
               exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0 }}
               className={`relative bg-white w-full ${isMobile ? 'h-[92vh] rounded-t-[40px] mt-auto' : 'max-w-2xl max-h-[90vh] rounded-[32px]'} flex flex-col shadow-2xl`}
             >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Edit Data Aset</h3>
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{editingAsset?.nama_mesin}</p>
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X size={20} /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Mesin</label>
                        <input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={editFormData.nama_mesin} onChange={e => setEditFormData({...editFormData, nama_mesin: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Brand</label>
                        <input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={editFormData.brand} onChange={e => setEditFormData({...editFormData, brand: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Model / Tipe</label>
                        <input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={editFormData.model_tipe} onChange={e => setEditFormData({...editFormData, model_tipe: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Serial Number</label>
                        <input className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 outline-none" value={editFormData.serial_number} onChange={e => setEditFormData({...editFormData, serial_number: e.target.value})} />
                      </div>
                    </div>

                    {/* Metadata Selection */}
                    <div className="space-y-6 pt-4 border-t border-slate-50">
                      {/* Lokasi */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Lokasi Aset</label>
                        <div className="flex gap-2">
                          <select className="flex-1 p-4 bg-slate-50 border-none rounded-2xl text-sm outline-none" value={editFormData.lokasi} onChange={e => setEditFormData({...editFormData, lokasi: e.target.value})}>
                            <option value="">Pilih Lokasi</option>
                            {locations.map(loc => <option key={loc.id} value={loc.label}>{loc.label}</option>)}
                          </select>
                          <button type="button" onClick={() => setShowNewLocInput(!showNewLocInput)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Plus size={20} /></button>
                        </div>
                        {showNewLocInput && (
                          <div className="flex gap-2 animate-in slide-in-from-top-2">
                            <input className="flex-1 p-4 bg-white border border-blue-100 rounded-2xl text-sm outline-none" placeholder="Label lokasi baru..." value={newLocLabel} onChange={e => setNewLocLabel(e.target.value)} />
                            <button type="button" onClick={handleAddNewLoc} className="px-6 bg-blue-600 text-white rounded-2xl text-xs font-bold">Simpan</button>
                          </div>
                        )}
                      </div>

                      {/* Status & Prioritas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Status Aset</label>
                          <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm outline-none" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                            {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Prioritas</label>
                          <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm outline-none" value={editFormData.prioritas} onChange={e => setEditFormData({...editFormData, prioritas: e.target.value})}>
                            {priorities.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Aset Induk */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Aset Induk (Opsional)</label>
                        {assets.some(a => a.parent_id === editingAsset?.id) ? (
                          <div className="p-4 bg-slate-100 rounded-2xl text-[12px] text-slate-500 font-bold italic leading-relaxed">
                            * Unit ini adalah Aset Induk bagi unit lain dan tidak dapat memiliki induk.
                          </div>
                        ) : (
                          <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm outline-none cursor-pointer" value={editFormData.parent_id || ''} onChange={e => setEditFormData({...editFormData, parent_id: e.target.value ? parseInt(e.target.value) : null})}>
                            <option value="">Tanpa Induk (Mandiri)</option>
                            {assets.filter(a => a.id !== editingAsset?.id && !a.parent_id).map(a => (
                              <option key={a.id} value={a.id}>{a.nama_mesin} ({a.brand || 'No Brand'})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Maintenance Interval */}
                    <div className="p-6 bg-blue-50/50 rounded-[24px] space-y-4">
                       <div className="flex items-center gap-2">
                         <Clock size={16} className="text-blue-500" />
                         <span className="text-[11px] font-black text-blue-700 uppercase">Interval Maintenance</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-blue-400 ml-1">Hari</label>
                           <input type="number" className="w-full p-4 bg-white border-none rounded-2xl text-sm outline-none" value={maintInput.days} onChange={e => handleMaintenanceInput('days', e.target.value)} />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[9px] font-bold text-blue-400 ml-1">Jam</label>
                           <input type="number" className="w-full p-4 bg-white border-none rounded-2xl text-sm outline-none" value={maintInput.hours} onChange={e => handleMaintenanceInput('hours', e.target.value)} />
                         </div>
                       </div>
                       <p className="text-[10px] text-blue-400 font-medium italic">Total: {editFormData.maintenance_hours} jam operasional.</p>
                    </div>

                    {/* Photos Upload Section */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dokumentasi Aset ({editFormData.lampiran.length}/5)</label>
                       <div className="flex flex-wrap gap-3">
                          {editFormData.lampiran.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                              <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setEditFormData({...editFormData, lampiran: editFormData.lampiran.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X size={12} /></button>
                            </div>
                          ))}
                          {editFormData.lampiran.length < 5 && (
                            <label className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-all">
                              <Camera size={24} />
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                          )}
                       </div>
                    </div>

                    {/* Catatan Section */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catatan Tambahan</label>
                       <textarea className="w-full p-5 bg-slate-50 border-none rounded-3xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none min-h-[100px]" value={editFormData.catatan} onChange={e => setEditFormData({...editFormData, catatan: e.target.value})} placeholder="Informasi tambahan tentang unit ini..." />
                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t border-slate-50 flex gap-4 shrink-0">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[14px]">Batal</button>
                  <button type="button" onClick={handleUpdate} disabled={isUpdating} className="flex-1 py-4 bg-[#0095E8] text-white rounded-2xl font-black text-[14px] shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                    {isUpdating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

        {/* Selection Checkbox Modal (PC) */}
        <AnimatePresence>
          {toggleSelectModal.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleSelectModal({ show: false, assetId: null, action: '', connectedAssets: [], selectedIds: [] })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${toggleSelectModal.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                     <Power size={28} />
                  </div>
                  <h3 className="text-[18px] font-black text-slate-800 leading-tight">Kontrol Multi-Aset</h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Pilih unit yang ingin di{toggleSelectModal.action.toLowerCase() === 'mematikan' ? 'matikan' : 'nyalakan'}</p>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mb-6 custom-scrollbar">
                  {toggleSelectModal.connectedAssets.map(ast => {
                    const isParent = !ast.parent_id;
                    const isChecked = toggleSelectModal.selectedIds.includes(ast.id);
                    return (
                      <div 
                        key={ast.id} 
                        onClick={() => {
                          const alreadySelected = toggleSelectModal.selectedIds.includes(ast.id);
                          const newIds = alreadySelected 
                            ? toggleSelectModal.selectedIds.filter(id => id !== ast.id)
                            : [...toggleSelectModal.selectedIds, ast.id];
                          setToggleSelectModal(prev => ({ ...prev, selectedIds: newIds }));
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked 
                            ? 'bg-[#F1FAFF] border-[#0095E8]/30 shadow-sm' 
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            readOnly
                            className="w-4 h-4 rounded text-[#0095E8] border-slate-300 focus:ring-[#0095E8]"
                          />
                          <div>
                            <p className="text-[13px] font-black text-slate-800 leading-tight">{ast.nama_mesin}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isParent ? 'Aset Induk' : 'Aset Anak'}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${ast.is_running ? 'text-green-500' : 'text-slate-400'}`}>
                          {ast.is_running ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 font-bold italic text-center mb-6 leading-normal">
                  * Unit yang tidak dicentang tidak akan berubah statusnya.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setToggleSelectModal({ show: false, assetId: null, action: '', connectedAssets: [], selectedIds: [] })}
                    className="py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-black text-[13px]"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      if (toggleSelectModal.selectedIds.length === 0) {
                        showError('Mohon pilih minimal 1 unit');
                        return;
                      }
                      setToggleConfirm({
                        show: true,
                        assetId: toggleSelectModal.assetId,
                        action: toggleSelectModal.action,
                        selectedIds: toggleSelectModal.selectedIds
                      });
                      setToggleSelectModal(prev => ({ ...prev, show: false }));
                    }}
                    className={`py-3.5 text-white rounded-2xl font-black text-[13px] shadow-lg ${toggleSelectModal.action === 'Mematikan' ? 'bg-red-500 shadow-red-100' : 'bg-[#0095E8] shadow-blue-100'}`}
                  >
                    Lanjut
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Local Confirmation Modal for Toggle */}
        <AnimatePresence>
          {toggleConfirm.show && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToggleConfirm({ show: false, assetId: null, action: '', selectedIds: null })} />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
              >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${toggleConfirm.action === 'Mematikan' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0095E8]'}`}>
                   <Power size={40} />
                </div>
                <h3 className="text-[20px] font-black text-slate-800 mb-2">{toggleConfirm.action} Mesin?</h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed">
                  Apakah Anda yakin ingin <strong>{toggleConfirm.action.toLowerCase()}</strong> unit berikut sekarang?
                </p>

                {toggleConfirm.selectedIds && toggleConfirm.selectedIds.length > 0 && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 max-h-[120px] overflow-y-auto custom-scrollbar">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unit yang akan di{toggleConfirm.action.toLowerCase() === 'mematikan' ? 'matikan' : 'nyalakan'}:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {toggleConfirm.selectedIds.map(sid => {
                        const targetAsset = assets.find(a => a.id === sid);
                        return (
                          <span key={sid} className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shadow-sm border ${
                            toggleConfirm.action === 'Mematikan' 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {targetAsset?.nama_mesin || 'Aset'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setToggleConfirm({ show: false, assetId: null, action: '', selectedIds: null })}
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

        {/* Global Image Zoom Modal */}
        <AnimatePresence>
          {zoomedImage && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setZoomedImage(null)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-full max-h-full flex items-center justify-center"
              >
                <img 
                  src={getImageUrl(zoomedImage)} 
                  className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
                  alt="Zoomed View"
                />
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="absolute -top-12 right-0 md:-right-12 md:top-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
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
