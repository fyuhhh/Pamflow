import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, MapPin, X, Info, Check, Eye, AlertTriangle, 
  Image as ImageIcon, Box, ChevronDown, Loader2, ArrowLeft, ClipboardList, 
  MapPinned, AlertCircle, Sparkles, CheckCircle2, HelpCircle
} from 'lucide-react';
import { authFetch } from '../services/api';
import API_URL from '../config';
import { useModal } from '../context/ModalContext';

// CUSTOM SEARCHABLE SELECT
const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled = false, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = (Array.isArray(options) ? options : []).find(opt => String(opt.value) === String(value));
  const filteredOptions = (Array.isArray(options) ? options : []).filter(opt =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex flex-col space-y-1.5 w-full">
      {label && <label className="text-xs font-bold text-[#3F4254] tracking-wide">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div 
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] flex items-center justify-between cursor-pointer select-none hover:border-[#B5B5C3] transition-all ${disabled ? 'opacity-50 bg-[#F9F9F9] cursor-not-allowed' : ''}`}
      >
        <span className={selectedOption ? "text-[#181C32]" : "text-[#B5B5C3]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#A1A5B7] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E1E3EA] rounded-xl shadow-lg z-[9999] overflow-hidden max-h-[200px] flex flex-col">
            <div className="p-2 border-b border-[#F1F1F4] bg-[#F9F9F9]">
              <div className="flex items-center px-2 py-1 bg-white border border-[#E1E3EA] rounded-lg">
                <Search size={12} className="text-[#A1A5B7] mr-2" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="w-full text-xs font-semibold outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-xs text-[#7E8299] text-center">Tidak ada data</div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-4 py-2 text-xs font-bold cursor-pointer transition-colors ${String(opt.value) === String(value) ? 'bg-[#0095E8]/10 text-[#0095E8]' : 'text-[#3F4254] hover:bg-[#F5F8FA]'}`}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AssetStockOpname = () => {
  const { confirm, success, showError } = useModal();
  
  // Sesi Lists & Workspace
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [locations, setLocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter & Search Sesi Aktif
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Draft' | 'Found' | 'Missing' | 'Foreign Item'
  const [activeSearch, setActiveSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showForeignModal, setShowForeignModal] = useState(false);

  // New Session Form
  const [newLocationId, setNewLocationId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Foreign Item Form
  const [foreignAssetId, setForeignAssetId] = useState('');
  const [foreignNotes, setForeignNotes] = useState('');

  // Inline Notes Edit
  const [editingItemId, setEditingItemId] = useState(null);
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchLocations();
    fetchAssets();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/stock-opnames');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await authFetch('/api/pure-assets/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await authFetch('/api/pure-assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async () => {
    if (!newLocationId) return showError('Harap pilih lokasi opname.');
    if (!newGroupName) return showError('Harap isi nama kelompok / sesi opname.');

    setSaving(true);
    try {
      const res = await authFetch('/api/stock-opnames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: newLocationId,
          group_name: newGroupName,
          description: newDescription
        })
      });

      if (res.ok) {
        const result = await res.json();
        success('Sesi stock opname berhasil dibuat');
        setShowAddModal(false);
        setNewLocationId('');
        setNewGroupName('');
        setNewDescription('');
        fetchSessions();
        // Langsung buka sesi yang baru dibuat
        handleOpenWorkspace(result.id);
      } else {
        const err = await res.json();
        showError(err.message || 'Gagal membuat sesi opname');
      }
    } catch (err) {
      showError('Gagal terhubung ke server');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenWorkspace = async (sessionId) => {
    setSessionLoading(true);
    try {
      const res = await authFetch(`/api/stock-opnames/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
      } else {
        showError('Gagal memuat sesi opname');
      }
    } catch (err) {
      showError('Gagal memuat sesi opname');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleDeleteSession = (id, code) => {
    confirm(
      'Hapus Sesi Opname',
      `Apakah Anda yakin ingin menghapus sesi opname "${code}"? Tindakan ini akan menghapus semua riwayat audit terkait.`,
      async () => {
        try {
          const res = await authFetch(`/api/stock-opnames/${id}`, { method: 'DELETE' });
          if (res.ok) {
            success('Sesi opname berhasil dihapus');
            fetchSessions();
            if (activeSession && activeSession.id === id) {
              setActiveSession(null);
            }
          } else {
            showError('Gagal menghapus sesi opname');
          }
        } catch (err) {
          showError('Gagal menghubungi server');
        }
      }
    );
  };

  const handleUpdateItemStatus = async (item, targetStatus) => {
    if (targetStatus === 'Foreign Item') {
      // Buka modal edit catatan karena notes wajib
      setEditingItemId(item.id);
      setNotesInput(item.notes || '');
      // Update status ke Draft/Foreign Item dulu dengan pemberitahuan
      confirm(
        'Barang Nyasar (Foreign Item)',
        'Menandai item sebagai Barang Nyasar mewajibkan Anda mengisi catatan/usulan lokasi aslinya. Lanjutkan mengisi catatan?',
        () => {
          // Tetap biarkan editingItemId terbuka agar user langsung mengetik catatan
        }
      );
      return;
    }

    try {
      const res = await authFetch(`/api/stock-opnames/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          notes: item.notes
        })
      });

      if (res.ok) {
        // Sync local state
        setActiveSession(prev => ({
          ...prev,
          items: prev.items.map(it => it.id === item.id ? { ...it, status: targetStatus } : it)
        }));
      } else {
        const err = await res.json();
        showError(err.message || 'Gagal memperbarui status');
      }
    } catch (err) {
      showError('Gagal menghubungi server');
    }
  };

  const handleSaveNotes = async (item) => {
    if (item.status === 'Foreign Item' && (!notesInput || notesInput.trim() === '')) {
      return showError('Untuk status Barang Nyasar, catatan/usulan lokasi asli wajib diisi!');
    }

    try {
      const targetStatus = item.status === 'Draft' ? 'Found' : item.status; // default to Found if draft when notes saved
      const res = await authFetch(`/api/stock-opnames/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          notes: notesInput
        })
      });

      if (res.ok) {
        setActiveSession(prev => ({
          ...prev,
          items: prev.items.map(it => it.id === item.id ? { ...it, status: targetStatus, notes: notesInput } : it)
        }));
        setEditingItemId(null);
        success('Catatan berhasil disimpan');
      } else {
        const err = await res.json();
        showError(err.message || 'Gagal menyimpan catatan');
      }
    } catch (err) {
      showError('Gagal menghubungi server');
    }
  };

  const handleAddForeignItem = async () => {
    if (!foreignAssetId) return showError('Harap pilih aset terlebih dahulu');
    if (!foreignNotes || foreignNotes.trim() === '') {
      return showError('Anda WAJIB mengisi catatan/usulan lokasi asli untuk Barang Nyasar!');
    }

    setSaving(true);
    try {
      const res = await authFetch(`/api/stock-opnames/${activeSession.id}/foreign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: foreignAssetId,
          notes: foreignNotes
        })
      });

      if (res.ok) {
        success('Barang nyasar berhasil ditambahkan');
        setShowForeignModal(false);
        setForeignAssetId('');
        setForeignNotes('');
        // Reload workspace
        handleOpenWorkspace(activeSession.id);
      } else {
        const err = await res.json();
        showError(err.message || 'Gagal menambahkan barang nyasar');
      }
    } catch (err) {
      showError('Gagal menghubungi server');
    } finally {
      setSaving(false);
    }
  };

  const resolveImagePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `${API_URL}${path}`;
    if (path.startsWith('uploads/')) return `${API_URL}/${path}`;
    return `${API_URL}/uploads/${path}`;
  };

  // Helper calculates
  const getAuditedCount = (items = []) => {
    return items.filter(it => it.status !== 'Draft').length;
  };

  const getProgressPercentage = (items = []) => {
    if (items.length === 0) return 0;
    return Math.round((getAuditedCount(items) / items.length) * 100);
  };

  // Filtered session items
  const getFilteredItems = () => {
    if (!activeSession) return [];
    let items = activeSession.items || [];
    
    // search filter
    if (activeSearch.trim() !== '') {
      const s = activeSearch.toLowerCase();
      items = items.filter(it => 
        String(it.asset_name).toLowerCase().includes(s) || 
        String(it.asset_code).toLowerCase().includes(s) ||
        String(it.register_no).toLowerCase().includes(s)
      );
    }

    // status tab filter
    if (activeFilter !== 'All') {
      items = items.filter(it => it.status === activeFilter);
    }

    return items;
  };

  return (
    <div className="flex flex-col gap-6 h-full p-1 sm:p-4 max-w-7xl mx-auto w-full">
      
      {/* HEADER SECTION */}
      {!activeSession ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#181C32] to-[#2B3054] p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md">
              <ClipboardList size={32} className="text-[#0095E8]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Stock Opname Aset</h1>
              <p className="text-xs text-[#A1A5B7] mt-0.5">Lakukan audit fisik, periksa keberadaan aset, dan lacak barang nyasar secara real-time.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#0095E8] hover:bg-[#0084CC] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-[#0095E8]/20 transition-all w-full sm:w-auto justify-center"
          >
            <Plus size={16} />
            Mulai Sesi Opname
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-[#F1F1F4] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button 
              onClick={() => { setActiveSession(null); fetchSessions(); }}
              className="flex items-center gap-2 text-xs font-bold text-[#7E8299] hover:text-[#181C32] transition-colors"
            >
              <ArrowLeft size={14} /> Kembali ke Daftar Sesi
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowForeignModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFA800] hover:bg-[#E29500] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all w-full sm:w-auto justify-center"
              >
                <AlertCircle size={14} />
                Temukan Barang Nyasar
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2 pt-4 border-t border-[#F1F1F4]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#F1FAFF] text-[#0095E8] rounded-xl border border-[#0095E8]/10">
                <MapPinned size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#181C32]">{activeSession.group_name}</h2>
                  <span className="px-2 py-0.5 bg-[#181C32] text-white rounded text-[10px] font-extrabold tracking-wider uppercase">{activeSession.stock_opname_code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7E8299] font-bold mt-1">
                  <span className="flex items-center gap-1 text-[#3F4254]"><MapPin size={12} className="text-[#0095E8]" /> {activeSession.location_name}</span>
                  <span>•</span>
                  <span>Tanggal: {new Date(activeSession.opname_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>Auditor: {activeSession.creator_name || '-'}</span>
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full md:w-80 bg-[#FAFAFA] border border-[#F1F1F4] rounded-2xl p-4 flex flex-col gap-2 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-[#7E8299]">Progress Audit Fisik</span>
                <span className="font-black text-[#181C32] bg-white px-2 py-0.5 rounded-lg border border-[#F1F1F4]">
                  {getAuditedCount(activeSession.items)} / {activeSession.items?.length || 0} Aset ({getProgressPercentage(activeSession.items)}%)
                </span>
              </div>
              <div className="w-full bg-[#E1E3EA] h-3.5 rounded-full overflow-hidden p-0.5 border border-white">
                <div 
                  className="bg-gradient-to-r from-[#0095E8] to-[#00D8C8] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage(activeSession.items)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {!activeSession ? (
        // VIEW 1: DAFTAR SESI STOCK OPNAME
        <div className="bg-white border border-[#F1F1F4] rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-5 border-b border-[#F1F1F4] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAFBFC]">
            <h2 className="text-sm font-extrabold text-[#181C32] tracking-wider uppercase">Daftar Sesi Audit Fisik</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
              <input 
                type="text" 
                placeholder="Cari sesi audit..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#0095E8]/30 transition-all text-[#181C32]"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#A1A5B7] gap-3">
                <Loader2 className="animate-spin text-[#0095E8]" size={36} />
                <span className="text-xs font-bold">Memuat data sesi opname...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#7E8299]">
                <Box size={52} className="text-[#D8D8E5] mb-4" />
                <h3 className="text-sm font-extrabold text-[#181C32] mb-1">Belum Ada Sesi Opname</h3>
                <p className="text-xs text-[#A1A5B7] max-w-sm">Anda belum membuat sesi stock opname fisik. Silakan klik tombol "Mulai Sesi Opname" di atas untuk memulai audit baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((sess) => (
                  <div 
                    key={sess.id}
                    className="group bg-white border border-[#F1F1F4] hover:border-[#0095E8]/20 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black tracking-wider text-[#A1A5B7] uppercase block">{sess.stock_opname_code}</span>
                          <h3 className="text-sm font-extrabold text-[#181C32] group-hover:text-[#0095E8] transition-colors mt-0.5">{sess.group_name}</h3>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(sess.id, sess.stock_opname_code); }}
                          className="p-2 hover:bg-red-50 text-[#A1A5B7] hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-xs text-[#5E6278] font-bold">
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-[#0095E8]" />
                          <span>{sess.location_name}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#F9F9F9] p-2.5 rounded-xl border border-[#F1F1F4] mt-2">
                          <div className="text-center flex-1 border-r border-[#E1E3EA]">
                            <span className="text-[10px] text-[#A1A5B7] block uppercase font-black">Found</span>
                            <span className="text-xs font-black text-[#50CD89]">{sess.counts?.Found || 0}</span>
                          </div>
                          <div className="text-center flex-1 border-r border-[#E1E3EA]">
                            <span className="text-[10px] text-[#A1A5B7] block uppercase font-black">Missing</span>
                            <span className="text-xs font-black text-[#F1416C]">{sess.counts?.Missing || 0}</span>
                          </div>
                          <div className="text-center flex-1 border-r border-[#E1E3EA]">
                            <span className="text-[10px] text-[#A1A5B7] block uppercase font-black">Nyasar</span>
                            <span className="text-xs font-black text-[#FFA800]">{sess.counts?.['Foreign Item'] || 0}</span>
                          </div>
                          <div className="text-center flex-1">
                            <span className="text-[10px] text-[#A1A5B7] block uppercase font-black">Total</span>
                            <span className="text-xs font-black text-[#181C32]">{sess.counts?.total || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#A1A5B7]">
                        {new Date(sess.opname_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => handleOpenWorkspace(sess.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181C32] hover:bg-[#0095E8] text-white text-xs font-bold rounded-lg transition-all"
                      >
                        <Eye size={12} /> Lanjutkan Audit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // VIEW 2: ACTIVE SESSION WORKSPACE
        <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-[500px]">
          
          {/* SIDEBAR: CONTROLS & FILTER TABS */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white border border-[#F1F1F4] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-[#181C32] uppercase tracking-wider">Pencarian & Filter</h3>
              
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={14} />
                <input 
                  type="text" 
                  placeholder="Cari nama / kode aset..."
                  className="w-full pl-8 pr-3 py-2.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#0095E8]/30 transition-all text-[#181C32]"
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                {[
                  { value: 'All', label: 'Semua Aset', count: activeSession.items?.length || 0, color: 'bg-[#181C32] text-white', inactiveColor: 'text-[#5E6278] hover:bg-[#F5F8FA]' },
                  { value: 'Draft', label: 'Belum Diperiksa', count: activeSession.items?.filter(it => it.status === 'Draft').length || 0, color: 'bg-[#7E8299] text-white', inactiveColor: 'text-[#7E8299] hover:bg-[#F5F8FA]' },
                  { value: 'Found', label: 'Found (Ada)', count: activeSession.items?.filter(it => it.status === 'Found').length || 0, color: 'bg-[#50CD89] text-white', inactiveColor: 'text-[#50CD89] hover:bg-[#E8FFF3]' },
                  { value: 'Missing', label: 'Missing (Hilang)', count: activeSession.items?.filter(it => it.status === 'Missing').length || 0, color: 'bg-[#F1416C] text-white', inactiveColor: 'text-[#F1416C] hover:bg-[#FFF5F8]' },
                  { value: 'Foreign Item', label: 'Barang Nyasar', count: activeSession.items?.filter(it => it.status === 'Foreign Item').length || 0, color: 'bg-[#FFA800] text-white', inactiveColor: 'text-[#FFA800] hover:bg-[#FFF8DD]' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      activeFilter === tab.value ? tab.color : tab.inactiveColor
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${activeFilter === tab.value ? 'bg-white/20' : 'bg-black/5'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#181C32] text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white">
                <Sparkles size={120} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-[#0095E8]">Panduan Audit</h4>
              <p className="text-[11px] text-[#A1A5B7] leading-relaxed">
                Silakan periksa keberadaan fisik seluruh aset di lokasi ini. Tandai dengan <b>Found</b> jika barang ada, atau <b>Missing</b> jika barang tidak ditemukan.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] leading-relaxed">
                💡 <b>Barang Nyasar?</b> Jika ada barang lain di lokasi ini, klik <b>Temukan Barang Nyasar</b> untuk mendaftarkannya dengan catatan lokasi aslinya.
              </div>
            </div>
          </div>

          {/* AUDIT WORKSPACE PANEL */}
          <div className="flex-1 w-full bg-white border border-[#F1F1F4] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#F1F1F4] bg-[#FAFBFC] flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-[#181C32] tracking-wider uppercase">Workspace Audit Fisik</h3>
              <span className="text-xs text-[#7E8299] font-bold">Menampilkan {getFilteredItems().length} aset</span>
            </div>

            <div className="divide-y divide-[#F1F1F4] overflow-y-auto max-h-[600px]">
              {sessionLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#A1A5B7] gap-3">
                  <Loader2 className="animate-spin text-[#0095E8]" size={28} />
                  <span className="text-xs font-bold">Memuat daftar aset...</span>
                </div>
              ) : getFilteredItems().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#7E8299] text-center">
                  <HelpCircle size={44} className="text-[#D8D8E5] mb-3" />
                  <p className="text-xs font-bold text-[#A1A5B7]">Tidak ada aset yang sesuai dengan filter/pencarian Anda.</p>
                </div>
              ) : (
                getFilteredItems().map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col gap-4 hover:bg-[#FAFBFC] transition-all">
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl border border-[#E1E3EA] bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {item.image_1 ? (
                            <img 
                              src={resolveImagePath(item.image_1)} 
                              alt="Asset" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-[#B5B5C3]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-[#181C32]">{item.asset_name}</h4>
                            {item.status === 'Foreign Item' && (
                              <span className="px-2 py-0.5 bg-[#FFF8DD] text-[#FFA800] border border-[#FFA800]/20 rounded text-[9px] font-black uppercase tracking-wider">
                                Barang Nyasar
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#A1A5B7] font-bold block mt-0.5">{item.asset_code} • Reg: {item.register_no || '-'}</span>
                          <span className="text-[10px] text-[#7E8299] font-bold block mt-1 flex items-center gap-1">
                            <MapPin size={10} className="text-[#0095E8]" /> Lokasi Asli: {item.original_location_name || '-'}
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                        <button
                          onClick={() => handleUpdateItemStatus(item, 'Found')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                            item.status === 'Found' 
                              ? 'bg-[#50CD89] border-[#50CD89] text-white shadow-sm shadow-[#50CD89]/20' 
                              : 'bg-white border-[#E1E3EA] text-[#5E6278] hover:bg-[#E8FFF3] hover:text-[#50CD89] hover:border-[#50CD89]/30'
                          }`}
                        >
                          <CheckCircle2 size={13} /> Found
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(item, 'Missing')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                            item.status === 'Missing' 
                              ? 'bg-[#F1416C] border-[#F1416C] text-white shadow-sm shadow-[#F1416C]/20' 
                              : 'bg-white border-[#E1E3EA] text-[#5E6278] hover:bg-[#FFF5F8] hover:text-[#F1416C] hover:border-[#F1416C]/30'
                          }`}
                        >
                          <X size={13} /> Missing
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(item, 'Foreign Item')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                            item.status === 'Foreign Item' 
                              ? 'bg-[#FFA800] border-[#FFA800] text-white shadow-sm shadow-[#FFA800]/20' 
                              : 'bg-white border-[#E1E3EA] text-[#5E6278] hover:bg-[#FFF8DD] hover:text-[#FFA800] hover:border-[#FFA800]/30'
                          }`}
                        >
                          <AlertTriangle size={13} /> Foreign Item
                        </button>
                      </div>
                    </div>

                    {/* FOREIGN WARNING ALERT */}
                    {item.status === 'Foreign Item' && (
                      <div className="bg-[#FFF8DD] border border-[#FFA800]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#805B00] font-bold">
                        <AlertCircle className="text-[#FFA800] shrink-0 mt-0.5" size={16} />
                        <div>
                          <span>Aset ini berada di lokasi yang salah. Anda <b>WAJIB</b> mengisi usulan lokasi asli atau catatan verifikasi di bawah ini.</span>
                        </div>
                      </div>
                    )}

                    {/* NOTES SECTION */}
                    {editingItemId === item.id ? (
                      <div className="bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl p-3.5 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-[#7E8299] tracking-wider">
                            Catatan Opname {item.status === 'Foreign Item' && <span className="text-red-500">(Wajib *)</span>}
                          </label>
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Contoh: Barang ditemukan di meja server, usulan lokasi asli: Ruang IT Server Lantai 2."
                            rows="2"
                            className="w-full px-3 py-2 bg-white border border-[#E1E3EA] rounded-lg text-xs font-semibold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1.5 bg-white hover:bg-[#F5F8FA] text-[#5E6278] border border-[#E1E3EA] rounded-lg text-xs font-bold transition-all"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveNotes(item)}
                            className="px-4 py-1.5 bg-[#0095E8] hover:bg-[#0084CC] text-white rounded-lg text-xs font-black shadow-sm transition-all"
                          >
                            Simpan Catatan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#F9F9F9] rounded-xl px-4 py-3 border border-[#F1F1F4] text-xs">
                        <div className="font-semibold text-[#5E6278] flex items-center gap-2">
                          <Info size={14} className="text-[#0095E8]" />
                          <span>Catatan: <span className="italic font-normal">{item.notes || 'Tidak ada catatan.'}</span></span>
                        </div>
                        <button
                          onClick={() => { setEditingItemId(item.id); setNotesInput(item.notes || ''); }}
                          className="text-[#0095E8] hover:text-[#0084CC] text-xs font-extrabold transition-colors"
                        >
                          Ubah
                        </button>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: BUAT SESI OPNAME BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#F1F1F4]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#181C32] bg-[#181C32] text-white">
              <h2 className="text-base font-extrabold tracking-wider uppercase">Mulai Sesi Stock Opname</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <SearchableSelect
                label="Lokasi Audit Fisik"
                required
                options={locations.map(loc => ({ value: loc.id, label: loc.location_name }))}
                value={newLocationId}
                onChange={setNewLocationId}
                placeholder="Pilih Lokasi Audit"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3F4254]">Nama Kelompok / Sesi Opname <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Contoh: Audit Semester 1 Ruang IT"
                  className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3F4254]">Deskripsi / Keterangan</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Opsional: Keterangan tambahan sesi audit"
                  rows="3"
                  className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-xs font-bold rounded-xl transition-colors border border-[#E1E3EA]"
              >
                Batal
              </button>
              <button 
                onClick={handleCreateSession}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0095E8] hover:bg-[#0084CC] text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Mulai Sesi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: TEMUKAN BARANG NYASAR (FOREIGN ITEM) */}
      {showForeignModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#F1F1F4]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#FFA800] bg-[#FFA800] text-white">
              <h2 className="text-base font-extrabold tracking-wider uppercase flex items-center gap-2">
                <AlertTriangle size={18} /> Daftarkan Barang Nyasar (Foreign Item)
              </h2>
              <button onClick={() => setShowForeignModal(false)} className="text-white hover:text-white/80 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="bg-[#FFF8DD] border border-[#FFA800]/20 rounded-xl p-4 flex items-start gap-3 text-xs text-[#805B00] font-bold leading-relaxed">
                <AlertCircle className="text-[#FFA800] shrink-0 mt-0.5" size={18} />
                <div>
                  <span><b>PENTING:</b> Barang Nyasar adalah barang yang secara fisik ditemukan di lokasi <b>"{activeSession?.location_name}"</b> ini, namun secara sistem tercatat berada di lokasi yang berbeda. Anda <b>WAJIB</b> mengisi catatan usulan lokasi aslinya.</span>
                </div>
              </div>

              <SearchableSelect
                label="Pilih Aset Yang Ditemukan"
                required
                options={assets.map(ast => ({ value: ast.id, label: `${ast.asset_name} [${ast.asset_id}]` }))}
                value={foreignAssetId}
                onChange={setForeignAssetId}
                placeholder="Cari & Pilih Aset..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3F4254]">Catatan / Usulan Lokasi Asli <span className="text-red-500">*</span></label>
                <textarea
                  value={foreignNotes}
                  onChange={(e) => setForeignNotes(e.target.value)}
                  placeholder="Wajib diisi. Contoh: Aset ditemukan di Ruang IT, aslinya seharusnya tercatat di Ruang GA Lantai 1."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-end gap-3">
              <button 
                onClick={() => setShowForeignModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-xs font-bold rounded-xl transition-colors border border-[#E1E3EA]"
              >
                Batal
              </button>
              <button 
                onClick={handleAddForeignItem}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#FFA800] hover:bg-[#E29500] text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Daftarkan Aset Nyasar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AssetStockOpname;
