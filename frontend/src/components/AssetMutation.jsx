import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Users, Building2, X, Info, Check, Eye, ChevronLeft, ChevronRight, AlertTriangle, Image as ImageIcon, Box, ChevronDown, Loader2 } from 'lucide-react';
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
                filteredOptions.map(opt => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors border-b border-[#FAFBFC] last:border-b-0 ${
                      String(opt.value) === String(value)
                        ? 'bg-[#E1F0FF] text-[#0095E8]'
                        : 'text-[#3F4254] hover:bg-[#F5F8FA]'
                    }`}
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

const AssetMutation = () => {
  const { confirm, success, error: showError } = useModal();
  
  // Data States
  const [relocations, setRelocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' | 'persetujuan'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRelocation, setSelectedRelocation] = useState(null);
  
  // Add Relocation Form State
  const [mutationDate, setMutationDate] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [destDepartmentId, setDestDepartmentId] = useState('');
  const [relocationDescription, setRelocationDescription] = useState('');
  const [relocationItems, setRelocationItems] = useState([]);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  
  // Add Item Form State
  const [selectedAssetGroup, setSelectedAssetGroup] = useState('');
  const [itemAssetId, setItemAssetId] = useState('');
  const [itemNewUser, setItemNewUser] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [itemAssetId]);

  const resolveImagePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return `${API_URL}${path}`;
    if (path.startsWith('uploads/')) return `${API_URL}/${path}`;
    return `${API_URL}/uploads/${path}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [relocRes, asRes, locRes, depRes] = await Promise.all([
        authFetch('/api/relocations'),
        authFetch('/api/pure-assets'),
        authFetch('/api/pure-assets/locations'),
        authFetch('/api/pure-assets/departments')
      ]);

      const [relocData, asData, locData, depData] = await Promise.all([
        relocRes.ok ? relocRes.json() : [],
        asRes.ok ? asRes.json() : [],
        locRes.ok ? locRes.json() : [],
        depRes.ok ? depRes.json() : []
      ]);

      setRelocations(relocData);
      setAssets(asData);
      setLocations(locData);
      setDepartments(depData);
    } catch (err) {
      console.error(err);
      showError('Gagal memuat data relokasi');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Pagination for Main List
  const safeRelocations = Array.isArray(relocations) ? relocations : [];
  const listData = safeRelocations.filter(r => {
    if (activeTab === 'daftar') return true;
    if (activeTab === 'persetujuan') return r.status === 'Pending';
    return true;
  }).filter(r => 
    (r.mutation_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.destination_location_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.destination_department_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(listData.length / rowsPerPage) || 1;
  const paginatedData = listData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getStatusBadge = (status) => {
    if (status === 'Pending') return <span className="px-2.5 py-1 bg-[#FFF8DD] text-[#FFA800] border border-[#FFA800]/20 rounded-lg text-[10px] font-bold">Menunggu</span>;
    if (status === 'Approved') return <span className="px-2.5 py-1 bg-[#E8FFF3] text-[#50CD89] border border-[#50CD89]/20 rounded-lg text-[10px] font-bold">Disetujui</span>;
    if (status === 'Rejected') return <span className="px-2.5 py-1 bg-[#FFF5F8] text-[#F1416C] border border-[#F1416C]/20 rounded-lg text-[10px] font-bold">Ditolak</span>;
    return <span>{status}</span>;
  };

  // Handlers for Add Relocation
  const handleOpenAddModal = () => {
    setMutationDate(new Date().toISOString().split('T')[0]);
    setDestLocationId('');
    setDestDepartmentId('');
    setRelocationDescription('');
    setRelocationItems([]);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleOpenItemModal = () => {
    setSelectedAssetGroup('');
    setItemAssetId('');
    setItemNewUser('');
    setItemNotes('');
    setShowItemModal(true);
  };

  const handleAddItem = () => {
    if (!itemAssetId) {
      showError('Pilih aset terlebih dahulu');
      return;
    }
    const safeAssets = Array.isArray(assets) ? assets : [];
    const asset = safeAssets.find(a => String(a.id) === String(itemAssetId));
    if (!asset) return;
    
    // Check if already added
    if (relocationItems.some(i => String(i.asset_id) === String(itemAssetId))) {
      showError('Aset ini sudah ditambahkan ke daftar relokasi');
      return;
    }

    setRelocationItems([
      ...relocationItems,
      {
        asset_id: asset.id,
        asset_code: asset.asset_id,
        asset_name: asset.asset_name,
        register_no: asset.register_no,
        location_name: asset.location_name,
        department_name: asset.department_name,
        asset_user: asset.asset_user,
        new_asset_user: itemNewUser,
        keterangan: itemNotes
      }
    ]);
    setShowItemModal(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...relocationItems];
    newItems.splice(index, 1);
    setRelocationItems(newItems);
  };

  const handleSaveRelocation = async () => {
    if (!mutationDate) return showError('Tanggal mutasi wajib diisi');
    if (relocationItems.length === 0) return showError('Tambahkan minimal satu aset');
    // Show confirmation modal
    setShowConfirmSaveModal(true);
  };

  const handleConfirmSaveRelocation = async () => {
    setSaving(true);
    setShowConfirmSaveModal(false);
    try {
      const safeLocations = Array.isArray(locations) ? locations : [];
      const safeDepts = Array.isArray(departments) ? departments : [];
      const payload = {
        mutation_date: mutationDate,
        destination_location_id: destLocationId || null,
        destination_department_id: destDepartmentId || null,
        description: relocationDescription || null,
        items: relocationItems.map(i => ({
          asset_id: i.asset_id,
          new_asset_user: i.new_asset_user || null,
          keterangan: i.keterangan || null
        }))
      };

      const res = await authFetch('/api/relocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan relokasi');
      }

      success('Relokasi berhasil diajukan dan menunggu persetujuan');
      setShowAddModal(false);
      setActiveTab('persetujuan');
      fetchData();
    } catch (err) {
      showError(err.message || 'Gagal menyimpan relokasi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Relokasi',
      'Apakah Anda yakin ingin menghapus pengajuan relokasi ini?',
      async () => {
        try {
          const res = await authFetch(`/api/relocations/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus');
          success('Relokasi berhasil dihapus');
          fetchData();
        } catch (err) {
          showError(err.message || 'Gagal menghapus');
        }
      }
    );
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await authFetch(`/api/relocations/${id}`);
      if (!res.ok) throw new Error('Gagal mengambil detail');
      const data = await res.json();
      setSelectedRelocation(data);
      setShowDetailModal(true);
    } catch (err) {
      showError('Gagal mengambil detail');
    }
  };

  const handleApprove = () => {
    confirm(
      'Setujui Relokasi',
      'Apakah Anda yakin menyetujui relokasi aset ini?',
      async () => {
        try {
          const res = await authFetch(`/api/relocations/${selectedRelocation.id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approval_notes: 'Disetujui via Web' })
          });
          if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
          success('Relokasi disetujui');
          setShowDetailModal(false);
          fetchData();
        } catch (err) {
          showError(err.message || 'Gagal menyetujui');
        }
      }
    );
  };

  const handleReject = () => {
    confirm(
      'Tolak Relokasi',
      'Apakah Anda yakin menolak relokasi aset ini?',
      async () => {
        try {
          const res2 = await authFetch(`/api/relocations/${selectedRelocation.id}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approval_notes: 'Ditolak via Web' })
          });
          if (!res2.ok) { const e = await res2.json(); throw new Error(e.message); }
          success('Relokasi ditolak');
          setShowDetailModal(false);
          fetchData();
        } catch (err) {
          showError(err.message || 'Gagal menolak');
        }
      }
    );
  };

  const safeAssets = Array.isArray(assets) ? assets : [];
  const selectedAssetObj = safeAssets.find(a => String(a.id) === String(itemAssetId));

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#181C32]">Relokasi</h1>
          <p className="text-sm text-[#7E8299] mt-1">Manajemen perpindahan dan relokasi aset perusahaan</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0095E8] hover:bg-[#0084CC] text-white rounded-xl text-sm font-bold shadow-md shadow-[#0095E8]/20 transition-all"
          >
            <Plus size={16} />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl border border-[#F1F1F4] shadow-sm w-max p-1">
        <button
          onClick={() => { setActiveTab('daftar'); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'daftar' ? 'bg-[#181C32] text-white shadow-sm' : 'text-[#5E6278] hover:bg-[#F5F8FA]'
          }`}
        >
          Daftar Relokasi
        </button>
        <button
          onClick={() => { setActiveTab('persetujuan'); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'persetujuan' ? 'bg-[#181C32] text-white shadow-sm' : 'text-[#5E6278] hover:bg-[#F5F8FA]'
          }`}
        >
          Persetujuan Relokasi
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-[#F1F1F4] rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-5 border-b border-[#F1F1F4] flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-[#181C32]">
            {activeTab === 'daftar' ? 'Daftar Relokasi' : 'Daftar Persetujuan Relokasi'}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
            <input 
              type="text" 
              placeholder="Cari data..."
              className="w-full pl-9 pr-4 py-2 bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#0095E8]/30 transition-all text-[#181C32]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[60px] text-center">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Relokasi</th>
                {activeTab === 'daftar' && <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tujuan</th>}
                {activeTab === 'persetujuan' && <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Pengaju</th>}
                {activeTab === 'persetujuan' && <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tujuan</th>}
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Jumlah Aset</th>
                {activeTab === 'daftar' && <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Pengaju</th>}
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-[#7E8299] text-sm font-semibold italic">Memuat data...</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-[#7E8299] text-sm font-semibold italic">Tidak ada data</td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="border-b border-[#F1F1F4] hover:bg-[#F5F8FA] transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-[#5E6278] text-center">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#181C32]">{item.mutation_no}</div>
                      <div className="text-xs font-semibold text-[#A1A5B7] mt-0.5">
                        {new Date(item.mutation_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    {activeTab === 'persetujuan' && (
                      <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">
                        {item.created_by_name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-[#3F4254]">{item.destination_location_name || '-'}</div>
                      <div className="text-[10px] font-semibold text-[#A1A5B7] mt-0.5">{item.destination_department_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-[#F1FAFF] text-[#0095E8] rounded-lg text-xs font-bold border border-[#0095E8]/20">
                        {item.item_count}
                      </span>
                    </td>
                    {activeTab === 'daftar' && (
                      <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">
                        {item.created_by_name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleViewDetail(item.id)}
                          className="p-1.5 text-[#0095E8] hover:bg-[#E1F0FF] rounded-lg transition-colors border border-transparent hover:border-[#0095E8]/20"
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {item.status === 'Pending' && activeTab === 'daftar' && (
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-[#F1416C] hover:bg-[#FFF5F8] rounded-lg transition-colors border border-transparent hover:border-[#F1416C]/20"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-[#F1F1F4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#A1A5B7] bg-[#F9F9F9]">
            <div>
              Menampilkan {Math.min((currentPage - 1) * rowsPerPage + 1, listData.length)} hingga {Math.min(currentPage * rowsPerPage, listData.length)} dari {listData.length} entri
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-[#E1E3EA] hover:bg-[#F5F8FA] disabled:opacity-50 disabled:cursor-not-allowed text-[#3F4254] font-bold transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg border border-[#E1E3EA] hover:bg-[#F5F8FA] disabled:opacity-50 disabled:cursor-not-allowed text-[#3F4254] font-bold transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          MODAL: TAMBAH RELOKASI
      ========================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-[#F1F1F4]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#181C32] bg-[#181C32]">
              <h2 className="text-lg font-extrabold text-white">Tambah Relokasi</h2>
              <button onClick={handleCloseAddModal} className="text-white hover:text-white/80 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAFBFC]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-[#F1F1F4] shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F4254] tracking-wide">Tanggal Mutasi <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={mutationDate}
                    onChange={(e) => setMutationDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F4254] tracking-wide">Deskripsi / Alasan Relokasi</label>
                  <input
                    type="text"
                    value={relocationDescription}
                    onChange={(e) => setRelocationDescription(e.target.value)}
                    placeholder="Masukkan alasan relokasi..."
                    className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all"
                  />
                </div>

                <SearchableSelect
                  label="Lokasi Tujuan"
                  options={(Array.isArray(locations) ? locations : []).map(l => ({ value: l.id, label: l.location_name }))}
                  value={destLocationId}
                  onChange={setDestLocationId}
                  placeholder="Pilih Lokasi Tujuan"
                />

                <SearchableSelect
                  label="Departemen Tujuan"
                  options={(Array.isArray(departments) ? departments : []).map(d => ({ value: d.id, label: d.name }))}
                  value={destDepartmentId}
                  onChange={setDestDepartmentId}
                  placeholder="Pilih Departemen Tujuan"
                />
              </div>

              <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#F1F1F4] flex justify-between items-center bg-white">
                  <h3 className="text-sm font-extrabold text-[#181C32]">Daftar Aset</h3>
                  <button 
                    onClick={handleOpenItemModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#181C32] hover:bg-[#3F4254] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Plus size={14} /> Tambah Aset
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[50px] text-center">No</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Aset</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nomor Registrasi</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi Asal</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Pengguna</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Keterangan</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[80px] text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relocationItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-[#7E8299] text-sm font-semibold italic">
                            Tidak ada data aset
                          </td>
                        </tr>
                      ) : (
                        relocationItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#F1F1F4] hover:bg-[#F5F8FA] transition-colors">
                            <td className="px-5 py-4 text-xs font-semibold text-[#5E6278] text-center">{idx + 1}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#181C32]">{item.asset_name}</td>
                            <td className="px-5 py-4 text-xs font-bold text-[#5E6278]">{item.register_no || '-'}</td>
                            <td className="px-5 py-4">
                              <div className="text-xs font-bold text-[#3F4254]">{item.location_name || '-'}</div>
                              <div className="text-[10px] font-semibold text-[#A1A5B7] mt-0.5">{item.department_name || '-'}</div>
                            </td>
                            <td className="px-5 py-4">
                              {item.new_asset_user ? (
                                <div>
                                  <div className="text-[10px] font-semibold text-[#A1A5B7] line-through">{item.asset_user || '-'}</div>
                                  <div className="text-xs font-bold text-[#50CD89] mt-0.5">{item.new_asset_user}</div>
                                </div>
                              ) : (
                                <div className="text-xs font-bold text-[#3F4254]">{item.asset_user || '-'}</div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-[#5E6278]">{item.keterangan || '-'}</td>
                            <td className="px-5 py-4 text-center">
                              <button 
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-[#F1416C] hover:bg-[#FFF5F8] rounded-lg transition-colors border border-transparent hover:border-[#F1416C]/20"
                                title="Hapus Aset"
                              >
                                <Trash2 size={16} />
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
            
            <div className="p-5 border-t border-[#F1F1F4] flex justify-end gap-3 bg-white">
              <button 
                onClick={handleCloseAddModal}
                className="px-6 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-sm font-bold rounded-xl transition-colors border border-[#E1E3EA]"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveRelocation}
                disabled={saving}
                className="px-6 py-2.5 bg-[#181C32] hover:bg-[#3F4254] text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: KONFIRMASI SIMPAN RELOKASI
      ========================================= */}
      {showConfirmSaveModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#F1F1F4] animate-zoom-in">
            <div className="flex items-center justify-between p-5 border-b border-[#F1F1F4] bg-[#181C32] rounded-t-2xl">
              <h2 className="text-base font-extrabold text-white">Konfirmasi Pengajuan Relokasi</h2>
              <button onClick={() => setShowConfirmSaveModal(false)} className="text-white/70 hover:text-white"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#FFF8DD] border border-[#FFA800]/20 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-[#FFA800] mt-0.5 shrink-0"/>
                <p className="text-xs font-semibold text-[#7E4A00]">Pastikan semua informasi benar sebelum mengajukan. Relokasi akan menunggu persetujuan.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F9F9F9] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">Tanggal Mutasi</div>
                  <div className="font-bold text-[#181C32]">{mutationDate ? new Date(mutationDate).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'}</div>
                </div>
                <div className="bg-[#F9F9F9] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">Jumlah Aset</div>
                  <div className="font-bold text-[#181C32]">{relocationItems.length} aset</div>
                </div>
                <div className="bg-[#F9F9F9] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">Lokasi Tujuan</div>
                  <div className="font-bold text-[#181C32]">{(Array.isArray(locations)?locations:[]).find(l=>String(l.id)===String(destLocationId))?.location_name || '-'}</div>
                </div>
                <div className="bg-[#F9F9F9] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">Departemen Tujuan</div>
                  <div className="font-bold text-[#181C32]">{(Array.isArray(departments)?departments:[]).find(d=>String(d.id)===String(destDepartmentId))?.name || '-'}</div>
                </div>
              </div>
              {relocationDescription && (
                <div className="bg-[#F9F9F9] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">Alasan Relokasi</div>
                  <div className="text-xs font-semibold text-[#3F4254]">{relocationDescription}</div>
                </div>
              )}
              <div className="bg-[#F9F9F9] rounded-xl p-3">
                <div className="text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-2">Aset yang Direlokasi</div>
                {relocationItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#F1F1F4] last:border-0">
                    <span className="w-5 h-5 bg-[#0095E8]/10 text-[#0095E8] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                    <div>
                      <div className="font-bold text-[#181C32] text-xs">{item.asset_name}</div>
                      <div className="text-[10px] text-[#A1A5B7] font-semibold">{item.register_no || '-'} • {item.location_name || '-'}</div>
                    </div>
                    {item.new_asset_user && <span className="ml-auto text-[10px] font-bold text-[#50CD89] bg-[#E8FFF3] px-2 py-0.5 rounded-lg">→ {item.new_asset_user}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-[#F1F1F4] flex justify-end gap-3">
              <button onClick={() => setShowConfirmSaveModal(false)} className="px-5 py-2.5 text-sm font-bold text-[#181C32] bg-white hover:bg-[#F5F8FA] rounded-xl border border-[#E1E3EA] transition-colors">Kembali</button>
              <button
                onClick={handleConfirmSaveRelocation}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0095E8] hover:bg-[#0084CC] rounded-xl shadow-md transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
                Ya, Ajukan Relokasi
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-visible flex flex-col animate-zoom-in border border-[#F1F1F4]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#181C32] bg-[#181C32] rounded-t-2xl">
              <h2 className="text-lg font-extrabold text-white">Tambah Aset</h2>
              <button onClick={() => setShowItemModal(false)} className="text-white hover:text-white/80 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
                <SearchableSelect
                  label="Aset"
                  required
                  options={Array.from(new Set((Array.isArray(assets) ? assets : []).map(a => a.asset_name))).map(name => ({ value: name, label: name }))}
                  value={selectedAssetGroup}
                  onChange={(val) => {
                    setSelectedAssetGroup(val);
                    const matching = (Array.isArray(assets) ? assets : []).filter(a => a.asset_name === val);
                    if (matching.length > 0) {
                      setItemAssetId(matching[0].id);
                    } else {
                      setItemAssetId('');
                    }
                  }}
                  placeholder="Pilih Aset"
                />
                
                <div className="space-y-1.5 z-40">
                  <SearchableSelect
                    label="Nomor Registrasi"
                    required
                    disabled={!selectedAssetGroup}
                    options={(Array.isArray(assets) ? assets : []).filter(a => a.asset_name === selectedAssetGroup).map(a => ({ value: a.id, label: a.register_no || 'Tidak ada' }))}
                    value={itemAssetId}
                    onChange={setItemAssetId}
                    placeholder="Pilih Registrasi"
                  />
                </div>
              </div>

              {selectedAssetObj ? (
                <div className="bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4] p-5 relative z-10">
                  <h3 className="text-sm font-extrabold text-[#181C32] flex items-center gap-2 mb-5">
                    <Info size={16} className="text-[#0095E8]" /> Info Aset
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 shrink-0">
                      <div className="aspect-video md:aspect-square bg-white border border-[#E1E3EA] rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                        {(() => {
                          const assetImages = selectedAssetObj
                            ? [selectedAssetObj.image_1, selectedAssetObj.image_2, selectedAssetObj.image_3].filter(Boolean)
                            : [];
                          if (assetImages.length > 0) {
                            return (
                              <div className="relative w-full h-full group">
                                <img 
                                  src={resolveImagePath(assetImages[activeImageIndex])} 
                                  alt={`Aset Gambar ${activeImageIndex + 1}`} 
                                  className="w-full h-full object-cover transition-all duration-300 ease-in-out"
                                />
                                {assetImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndex(prev => (prev === 0 ? assetImages.length - 1 : prev - 1));
                                      }}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                    >
                                      <ChevronLeft size={18} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndex(prev => (prev === assetImages.length - 1 ? 0 : prev + 1));
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                    >
                                      <ChevronRight size={18} />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-2 py-1 rounded-full">
                                      {assetImages.map((_, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveImageIndex(idx);
                                          }}
                                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                                            idx === activeImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col items-center justify-center text-[#B5B5C3] p-4 text-center">
                              <div className="w-24 h-24 rounded-full border-[5px] border-[#F1F1F4] flex items-center justify-center mb-3 bg-[#FAFBFC]">
                                <ImageIcon size={36} className="text-[#A1A5B7]" />
                              </div>
                              <span className="text-sm font-extrabold text-[#A1A5B7]">NO IMAGE<br/>AVAILABLE</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 content-center">
                      <div>
                        <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Lokasi</div>
                        <div className="text-sm font-bold text-[#3F4254]">{selectedAssetObj.location_name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Departemen</div>
                        <div className="text-sm font-bold text-[#3F4254]">{selectedAssetObj.department_name || '-'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Pengguna Saat Ini</div>
                        <div className="text-sm font-bold text-[#3F4254]">{selectedAssetObj.asset_user || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4] p-12 flex flex-col items-center justify-center text-center relative z-10">
                  <Box size={48} className="text-[#D8D8E5] mb-4" />
                  <p className="text-sm font-bold text-[#A1A5B7]">Pilih aset untuk menampilkan informasi terkait aset.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F4254] tracking-wide">Pengguna Baru <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={itemNewUser}
                    onChange={(e) => setItemNewUser(e.target.value)}
                    placeholder="Pengguna Aset Baru"
                    className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F4254] tracking-wide">Keterangan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Deskripsi"
                    className="w-full px-4 py-2.5 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#0095E8] focus:ring-1 focus:ring-[#0095E8]/30 outline-none transition-all"
                  />
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-[#F1F1F4] flex justify-end gap-3 bg-[#FAFBFC] rounded-b-2xl relative z-10">
              <button 
                onClick={() => setShowItemModal(false)}
                className="px-6 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-sm font-bold rounded-xl transition-colors border border-[#E1E3EA]"
              >
                Batal
              </button>
              <button 
                onClick={handleAddItem}
                className="px-6 py-2.5 bg-[#181C32] hover:bg-[#3F4254] text-white text-sm font-bold rounded-xl transition-shadow shadow-md"
              >
                Simpan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================
          MODAL: DETAIL RELOKASI & PERSETUJUAN
      ========================================= */}
      {showDetailModal && selectedRelocation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-[#F1F1F4]">
            
            <div className="flex items-center justify-between p-5 lg:p-6 border-b border-[#F1F1F4] bg-[#181C32]">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-3">
                  Detail Relokasi {selectedRelocation.mutation_no}
                  {getStatusBadge(selectedRelocation.status)}
                </h2>
                <div className="text-xs font-semibold text-[#A1A5B7] mt-1.5">
                  Diajukan oleh {selectedRelocation.created_by_name || '-'} pada {new Date(selectedRelocation.mutation_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-[#A1A5B7] hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAFBFC]">
              
              <div className="bg-white p-5 rounded-2xl border border-[#F1F1F4] shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Lokasi Tujuan</div>
                  <div className="text-sm font-bold text-[#181C32]">{selectedRelocation.destination_location_name || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Departemen Tujuan</div>
                  <div className="text-sm font-bold text-[#181C32]">{selectedRelocation.destination_department_name || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-[#A1A5B7] uppercase tracking-wider mb-1.5">Deskripsi / Alasan</div>
                  <div className="text-sm font-bold text-[#5E6278]">{selectedRelocation.description || '-'}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[#F1F1F4] bg-[#F9F9F9]">
                  <h3 className="text-sm font-extrabold text-[#181C32]">Aset yang Direlokasi ({selectedRelocation.items?.length || 0})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-[#F1F1F4]">
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[50px] text-center">No</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Aset</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi Asal</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Perubahan Pengguna</th>
                        <th className="px-5 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRelocation.items && selectedRelocation.items.length > 0 ? (
                        selectedRelocation.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#F1F1F4] hover:bg-[#F5F8FA] transition-colors">
                            <td className="px-5 py-4 text-xs font-semibold text-[#5E6278] text-center">{idx + 1}</td>
                            <td className="px-5 py-4">
                              <div className="text-xs font-bold text-[#181C32]">{item.asset_name}</div>
                              <div className="text-[10px] text-[#A1A5B7] font-bold mt-0.5">{item.asset_code} / {item.register_no}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-xs font-bold text-[#3F4254]">{item.previous_location_name || '-'}</div>
                              <div className="text-[10px] text-[#A1A5B7] font-semibold mt-0.5">{item.previous_department_name || '-'}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#A1A5B7] line-through">{item.previous_asset_user || '-'}</span>
                                <ChevronRight size={14} className="text-[#D8D8E5]" />
                                <span className="text-xs font-bold text-[#50CD89] bg-[#E8FFF3] px-2 py-0.5 rounded-md border border-[#50CD89]/20">{item.new_asset_user || '-'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold text-[#5E6278]">{item.keterangan || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-[#7E8299] text-sm font-semibold italic">Tidak ada item aset</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {selectedRelocation.status !== 'Pending' && (
                <div className={`p-5 rounded-2xl border ${selectedRelocation.status === 'Approved' ? 'bg-[#E8FFF3] border-[#50CD89]/30' : 'bg-[#FFF5F8] border-[#F1416C]/30'}`}>
                  <div className="text-xs font-bold mb-1.5">
                    {selectedRelocation.status === 'Approved' ? <span className="text-[#50CD89]">Disetujui</span> : <span className="text-[#F1416C]">Ditolak</span>} oleh {selectedRelocation.approved_by_name || '-'}
                  </div>
                  {selectedRelocation.approval_notes && (
                    <div className="text-sm font-semibold text-[#3F4254] italic">"{selectedRelocation.approval_notes}"</div>
                  )}
                </div>
              )}

            </div>
            
            <div className="p-5 border-t border-[#F1F1F4] flex justify-between items-center bg-white">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-sm font-bold rounded-xl transition-colors border border-[#E1E3EA]"
              >
                Tutup
              </button>
              
              {selectedRelocation.status === 'Pending' && activeTab === 'persetujuan' && (
                <div className="flex gap-3">
                  <button 
                    onClick={handleReject}
                    className="px-6 py-2.5 bg-white hover:bg-[#FFF5F8] text-[#F1416C] text-sm font-bold rounded-xl transition-all border border-[#F1416C]/30"
                  >
                    Tolak Relokasi
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#50CD89] hover:bg-[#47BE7D] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[#50CD89]/20"
                  >
                    <Check size={16} />
                    Setujui Relokasi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetMutation;
