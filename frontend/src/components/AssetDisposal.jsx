import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, MapPin, X, Info, Check, Eye, AlertTriangle, 
  Image as ImageIcon, Box, ChevronDown, Loader2, ArrowLeft, Trash, 
  Calendar, FileText, Activity, AlertCircle, ShoppingCart
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

const AssetDisposal = () => {
  const { confirm, success, showError } = useModal();

  const [disposals, setDisposals] = useState([]);
  const [activeAssets, setActiveAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' | 'buat'
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Disposal for Detail Modal
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form State
  const [disposalDate, setDisposalDate] = useState('');
  const [conditionStatus, setConditionStatus] = useState('Dibuang');
  const [description, setDescription] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]); // Aset terpilih untuk di-disposal

  // Warning Red Modal
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Search filter inside Create tab (for assets multi-select)
  const [assetSearch, setAssetSearch] = useState('');

  useEffect(() => {
    fetchDisposals();
    fetchActiveAssets();
    setDisposalDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchDisposals = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/disposals');
      if (res.ok) {
        const data = await res.json();
        setDisposals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAssets = async () => {
    try {
      const res = await authFetch('/api/pure-assets');
      if (res.ok) {
        const data = await res.json();
        // Hanya tampilkan aset yang statusnya 'Active'
        setActiveAssets(data.filter(a => a.status === 'Active'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await authFetch(`/api/disposals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDisposal(data);
        setShowDetailModal(true);
      } else {
        showError('Gagal memuat detail disposal');
      }
    } catch (err) {
      showError('Gagal memuat detail disposal');
    }
  };

  const handleDeleteDisposalRecord = (id, no) => {
    confirm(
      'Hapus Riwayat Disposal',
      `Apakah Anda yakin ingin menghapus record riwayat disposal "${no}"? Tindakan ini hanya menghapus log riwayat dan TIDAK akan mengembalikan status aset.`,
      async () => {
        try {
          const res = await authFetch(`/api/disposals/${id}`, { method: 'DELETE' });
          if (res.ok) {
            success('Log riwayat disposal berhasil dihapus');
            fetchDisposals();
          } else {
            showError('Gagal menghapus log');
          }
        } catch (err) {
          showError('Gagal terhubung ke server');
        }
      }
    );
  };

  const handleToggleAssetSelection = (id) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedAssetIds(prev => [...prev, id]);
    }
  };

  const handleSelectAllFilteredAssets = (filtered) => {
    const allFilteredIds = filtered.map(a => a.id);
    const allSelected = allFilteredIds.every(id => selectedAssetIds.includes(id));
    if (allSelected) {
      // Uncheck all filtered
      setSelectedAssetIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Check all filtered
      setSelectedAssetIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handlePreSubmit = () => {
    if (!disposalDate) return showError('Tanggal disposal wajib diisi');
    if (selectedAssetIds.length === 0) return showError('Harap pilih minimal satu aset untuk dihapus');
    if (!description || description.trim() === '') return showError('Harap isi alasan / deskripsi disposal');
    
    // Buka Warning Red Modal khas Pamflow
    setShowWarningModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowWarningModal(false);
    setSaving(true);
    try {
      const res = await authFetch('/api/disposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposal_date: disposalDate,
          condition_status: conditionStatus,
          description: description,
          asset_ids: selectedAssetIds
        })
      });

      if (res.ok) {
        success('Aset berhasil dihapus secara permanen dari operasional');
        setSelectedAssetIds([]);
        setDescription('');
        setDisposalDate(new Date().toISOString().split('T')[0]);
        setConditionStatus('Dibuang');
        setActiveTab('daftar');
        fetchDisposals();
        fetchActiveAssets();
      } else {
        const err = await res.json();
        showError(err.message || 'Gagal menyimpan disposal');
      }
    } catch (err) {
      showError('Gagal terhubung ke server');
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

  // Filtered lists
  const getFilteredDisposals = () => {
    const s = searchTerm.toLowerCase();
    return disposals.filter(d => 
      String(d.disposal_no).toLowerCase().includes(s) || 
      String(d.description).toLowerCase().includes(s) ||
      String(d.condition_status).toLowerCase().includes(s)
    );
  };

  const getFilteredAssetsToSelect = () => {
    const s = assetSearch.toLowerCase();
    return activeAssets.filter(a => 
      String(a.asset_name).toLowerCase().includes(s) || 
      String(a.asset_id).toLowerCase().includes(s) ||
      String(a.register_no).toLowerCase().includes(s)
    );
  };

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-4 max-w-7xl mx-auto w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#F1416C] to-[#C71B43] p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md">
            <Trash size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Disposal Aset (Penghapusan)</h1>
            <p className="text-xs text-white/80 mt-0.5">Hapus aset yang rusak berat, hilang, atau dijual secara permanen dari daftar operasional aktif.</p>
          </div>
        </div>
        
        <div className="flex bg-white/10 p-1.5 rounded-xl border border-white/10 backdrop-blur-md w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all w-full sm:w-auto text-center ${activeTab === 'daftar' ? 'bg-white text-[#C71B43] shadow-md' : 'text-white hover:bg-white/10'}`}
          >
            Riwayat Disposal
          </button>
          <button
            onClick={() => setActiveTab('buat')}
            className={`px-5 py-2 rounded-lg text-xs font-black transition-all w-full sm:w-auto text-center ${activeTab === 'buat' ? 'bg-white text-[#C71B43] shadow-md' : 'text-white hover:bg-white/10'}`}
          >
            Buat Disposal Baru
          </button>
        </div>
      </div>

      {/* VIEW 1: RIWAYAT DISPOSAL */}
      {activeTab === 'daftar' && (
        <div className="bg-white border border-[#F1F1F4] rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#F1F1F4] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAFBFC]">
            <h2 className="text-sm font-extrabold text-[#181C32] tracking-wider uppercase">Daftar Penghapusan Aset</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
              <input 
                type="text" 
                placeholder="Cari riwayat disposal..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#F1416C]/30 transition-all text-[#181C32]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[60px] text-center">No</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nomor Disposal</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Kondisi / Metode</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Jumlah Barang</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Alasan</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Petugas</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[120px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#7E8299] text-xs font-bold italic">
                      <Loader2 className="animate-spin text-[#F1416C] mx-auto mb-2" size={24} />
                      Memuat riwayat disposal...
                    </td>
                  </tr>
                ) : getFilteredDisposals().length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#7E8299] text-xs font-bold italic">Tidak ada data disposal ditemukan</td>
                  </tr>
                ) : (
                  getFilteredDisposals().map((disp, idx) => (
                    <tr key={disp.id} className="border-b border-[#F1F1F4] hover:bg-[#F5F8FA] transition-all">
                      <td className="px-6 py-4 text-xs font-semibold text-[#5E6278] text-center">{idx + 1}</td>
                      <td className="px-6 py-4 font-black text-[#181C32] text-xs">{disp.disposal_no}</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#3F4254]">
                        {new Date(disp.disposal_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          disp.condition_status === 'Dijual' 
                            ? 'bg-[#E8FFF3] text-[#50CD89] border-[#50CD89]/20' 
                            : disp.condition_status === 'Rusak Berat' 
                            ? 'bg-[#FFF5F8] text-[#F1416C] border-[#F1416C]/20'
                            : 'bg-[#F1FAFF] text-[#0095E8] border-[#0095E8]/20'
                        }`}>
                          {disp.condition_status || 'Dibuang'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-[#181C32]">{disp.items?.length || 0} Aset</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#5E6278] max-w-[200px] truncate">{disp.description || '-'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">{disp.creator_name || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(disp.id)}
                            className="p-1.5 bg-[#F5F8FA] hover:bg-[#0095E8] hover:text-white text-[#5E6278] rounded-lg transition-all"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteDisposalRecord(disp.id, disp.disposal_no)}
                            className="p-1.5 bg-[#FFF5F8] hover:bg-[#F1416C] hover:text-white text-[#F1416C] rounded-lg transition-all"
                            title="Hapus Log"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* VIEW 2: BUAT DISPOSAL BARU (WORKSPACE) */}
      {activeTab === 'buat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: FORM INPUT DISPOSAL */}
          <div className="lg:col-span-4 bg-white border border-[#F1F1F4] rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-[#181C32] uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-[#F1416C]" /> Detail Penghapusan
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3F4254] flex items-center gap-1"><Calendar size={13} className="text-[#A1A5B7]" /> Tanggal Penghapusan <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#F1416C] outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <SearchableSelect
                  label="Kondisi Akhir / Metode"
                  required
                  options={[
                    { value: 'Rusak Berat', label: 'Rusak Berat (Dibuang)' },
                    { value: 'Dijual', label: 'Dijual (Komersial)' },
                    { value: 'Dihibahkan', label: 'Dihibahkan (Sosial)' },
                    { value: 'Hilang', label: 'Hilang' },
                    { value: 'Afkir', label: 'Afkir / Expired' }
                  ]}
                  value={conditionStatus}
                  onChange={setConditionStatus}
                  placeholder="Pilih Metode"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3F4254] flex items-center gap-1"><Activity size={13} className="text-[#A1A5B7]" /> Alasan / Deskripsi Lengkap <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Isi alasan penghapusan aset secara rinci..."
                  rows="4"
                  className="w-full px-4 py-2.5 bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl text-xs font-bold text-[#3F4254] focus:border-[#F1416C] outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-[#FFF5F8] border border-[#F1416C]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#A81C43] font-bold">
                <AlertCircle className="text-[#F1416C] shrink-0 mt-0.5" size={16} />
                <div>
                  <span>Semua aset yang dipilih di sisi kanan akan dinonaktifkan secara permanen dari sistem operasional Pamflow.</span>
                </div>
              </div>

              <button
                onClick={handlePreSubmit}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#F1416C] hover:bg-[#C71B43] text-white rounded-xl text-xs font-black shadow-lg shadow-[#F1416C]/20 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Proses Disposal Permanen
              </button>
            </div>
          </div>

          {/* RIGHT: MULTI-SELECT ASSET WORKSPACE */}
          <div className="lg:col-span-8 bg-white border border-[#F1F1F4] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-5 border-b border-[#F1F1F4] bg-[#FAFBFC] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFF5F8] text-[#F1416C] rounded-lg">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#181C32] uppercase tracking-wider">Pilih Aset Untuk Dihapus</h3>
                  <span className="text-[10px] text-[#A1A5B7] font-bold block mt-0.5">Telah memilih {selectedAssetIds.length} aset</span>
                </div>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={14} />
                <input 
                  type="text" 
                  placeholder="Cari kode / nama aset..."
                  className="w-full pl-8 pr-3 py-2 bg-[#F9F9F9] border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#F1416C]/30 transition-all text-[#181C32]"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                    <th className="px-6 py-3 w-[60px] text-center">
                      <input 
                        type="checkbox"
                        checked={getFilteredAssetsToSelect().length > 0 && getFilteredAssetsToSelect().every(a => selectedAssetIds.includes(a.id))}
                        onChange={() => handleSelectAllFilteredAssets(getFilteredAssetsToSelect())}
                        className="w-4 h-4 rounded text-[#F1416C] focus:ring-[#F1416C] border-[#E1E3EA] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Aset</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Lokasi</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tanggal Beli</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nilai Perolehan</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAssetsToSelect().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[#7E8299] text-xs font-bold italic">
                        Tidak ada aset aktif tersedia untuk diproses
                      </td>
                    </tr>
                  ) : (
                    getFilteredAssetsToSelect().map((asset) => (
                      <tr key={asset.id} className="border-b border-[#F1F1F4] hover:bg-[#FAFBFC] transition-all">
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedAssetIds.includes(asset.id)}
                            onChange={() => handleToggleAssetSelection(asset.id)}
                            className="w-4 h-4 rounded text-[#F1416C] focus:ring-[#F1416C] border-[#E1E3EA] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border border-[#E1E3EA] overflow-hidden flex items-center justify-center bg-white shrink-0">
                              {asset.image_1 ? (
                                <img src={resolveImagePath(asset.image_1)} alt="Asset" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={16} className="text-[#B5B5C3]" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-[#181C32]">{asset.asset_name}</h4>
                              <span className="text-[10px] text-[#A1A5B7] font-bold block">{asset.asset_id} • Reg: {asset.register_no || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">{asset.category_name || '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">{asset.location_name || '-'}</td>
                        <td className="px-6 py-4 text-xs font-bold text-[#7E8299]">
                          {asset.acquisition_date ? new Date(asset.acquisition_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-[#181C32]">
                          Rp {Number(asset.acquisition_cost || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* DETAIL MODAL (RIWAYAT DISPOSAL) */}
      {showDetailModal && selectedDisposal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#F1F1F4] flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#181C32] bg-[#181C32] text-white">
              <div>
                <span className="text-[10px] font-black uppercase text-white/50 block tracking-widest">{selectedDisposal.disposal_no}</span>
                <h2 className="text-base font-extrabold tracking-wider mt-0.5">Detail Penghapusan Aset</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white hover:text-white/80 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F9F9F9] border border-[#F1F1F4] rounded-2xl p-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#A1A5B7] font-black uppercase block tracking-wider mb-1">Tanggal Disposal</span>
                  <span className="font-extrabold text-[#3F4254]">{new Date(selectedDisposal.disposal_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A5B7] font-black uppercase block tracking-wider mb-1">Kondisi / Metode</span>
                  <span className="font-black text-[#F1416C] uppercase">{selectedDisposal.condition_status || 'Dibuang'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A5B7] font-black uppercase block tracking-wider mb-1">Petugas Audit</span>
                  <span className="font-extrabold text-[#3F4254]">{selectedDisposal.creator_name || '-'}</span>
                </div>
                <div className="sm:col-span-3 pt-2 border-t border-[#E1E3EA] mt-2">
                  <span className="text-[10px] text-[#A1A5B7] font-black uppercase block tracking-wider mb-1">Alasan Lengkap</span>
                  <span className="font-semibold text-[#5E6278]">{selectedDisposal.description || '-'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#181C32]">Aset Terhapus ({selectedDisposal.items?.length || 0})</h4>
                <div className="divide-y divide-[#F1F1F4] border border-[#F1F1F4] rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  {selectedDisposal.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#F9F9F9] transition-all bg-white text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-[#E1E3EA] overflow-hidden flex items-center justify-center bg-white shrink-0">
                          {item.image_1 ? (
                            <img src={resolveImagePath(item.image_1)} alt="Asset" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-[#B5B5C3]" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-[#181C32]">{item.asset_name}</h5>
                          <span className="text-[9px] text-[#A1A5B7] font-bold block">{item.asset_code} • Reg: {item.register_no || '-'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#3F4254] block">Rp {Number(item.acquisition_cost || 0).toLocaleString('id-ID')}</span>
                        <span className="text-[9px] text-[#A1A5B7] font-bold">{item.location_name || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-xs font-bold rounded-xl transition-colors border border-[#E1E3EA] shadow-sm"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WARNING RED MODAL KHAS PAMFLOW */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-[#F1416C] animate-zoom-in">
            
            <div className="bg-[#F1416C] text-white p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white border-2 border-white/20 animate-pulse">
                <AlertTriangle size={36} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">Peringatan Kritis!</h3>
                <span className="text-[10px] tracking-widest uppercase font-black opacity-80 mt-1 block">Aksi Ini Tidak Dapat Dibatalkan</span>
              </div>
            </div>

            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-[#3F4254] font-bold leading-relaxed">
                Anda akan menghapus secara permanen <span className="font-black text-[#F1416C] underline">{selectedAssetIds.length} aset</span> dari operasional aktif.
              </p>
              <div className="bg-[#FFF5F8] border border-[#F1416C]/10 rounded-xl p-3.5 text-xs text-[#A81C43] font-bold text-left space-y-1.5">
                <div>⚠️ <b>Aset yang dipilih:</b></div>
                <div className="max-h-[80px] overflow-y-auto divide-y divide-[#F1416C]/10 pr-2">
                  {selectedAssetIds.map(id => {
                    const ast = activeAssets.find(a => a.id === id);
                    return ast ? (
                      <div key={id} className="py-1 text-[11px] font-black">{ast.asset_name} ({ast.asset_id})</div>
                    ) : null;
                  })}
                </div>
              </div>
              <p className="text-[11px] text-[#7E8299] leading-relaxed">
                Apakah Anda benar-benar yakin ingin melanjutkan disposal permanen ini?
              </p>
            </div>

            <div className="p-5 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-center gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-5 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-xs font-bold rounded-xl transition-colors border border-[#E1E3EA] shadow-sm"
              >
                Batal (Kembali)
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 bg-[#F1416C] hover:bg-[#C71B43] text-white text-xs font-black rounded-xl shadow-md transition-all"
              >
                Ya, Hapus Permanen
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AssetDisposal;
