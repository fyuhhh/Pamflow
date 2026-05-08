import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Download, Upload, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, X } from 'lucide-react';
import { authFetch } from '../services/api';
import { hasPermission } from '../utils/permissions';
import { useModal } from '../context/ModalContext';

const DraftList = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { confirm, success, error: showError } = useModal();
  const [jenisTugasFilter, setJenisTugasFilter] = useState('Semua');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    departemen: []
  });
  const [tempFilters, setTempFilters] = useState({ departemen: [] });
  const [availableDepartments, setAvailableDepartments] = useState([]);

  useEffect(() => {
    fetchDrafts();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await authFetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        const uniqueDepts = [...new Set(data.map(d => d.name))].sort();
        setAvailableDepartments(uniqueDepts);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchDrafts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const company_id = user?.company_id;
      const response = await authFetch(`/api/tasks${company_id ? `?company_id=${company_id}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        // Filter only drafts
        setDrafts(data.filter(t => t.status === 'Draft' || t.status === 'Tidak aktif'));
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Draf',
      'Apakah Anda yakin ingin menghapus draf ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
          const response = await authFetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ 
              user_id: user?.id,
              user_name: user?.firstName || user?.username
            })
          });
          if (response.ok) {
            success('Berhasil', 'Draf berhasil dihapus');
            fetchDrafts();
          } else {
            showError('Gagal', 'Gagal menghapus draf');
          }
        } catch (err) {
          console.error('Error deleting draft:', err);
          showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
        }
      }
    );
  };

  const filteredDrafts = drafts.filter(draft => {
    // Search filter
    const matchesSearch = draft.nama_tugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (`PAM-${draft.id}`).toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Jenis Tugas filter
    if (jenisTugasFilter !== 'Semua') {
      if ((draft.jenis_tugas || 'checklist').toLowerCase() !== jenisTugasFilter.toLowerCase()) return false;
    }

    // Departemen filter
    if (activeFilters.departemen.length > 0 && !activeFilters.departemen.includes(draft.departemen)) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredDrafts.length / rowsPerPage);
  const paginatedDrafts = filteredDrafts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-8">
      {/* Header Actions */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
            <input 
              type="text" 
              placeholder="Cari ID, nama tugas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg text-sm w-64 focus:outline-none focus:border-[#0095E8] transition-colors"
            />
          </div>
          <button 
            onClick={() => { setTempFilters({...activeFilters}); setIsFilterOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
              activeFilters.departemen.length > 0 
                ? 'border-[#0095E8] bg-[#F1FAFF] text-[#0095E8]' 
                : 'border-[#F1F1F4] text-[#3F4254] hover:bg-gray-50'
            }`}
          >
            <Filter size={16} /> Filter
          </button>
          
          <button 
            onClick={fetchDrafts}
            className="flex items-center gap-2 px-4 py-2 border border-[#F1F1F4] rounded-lg text-sm font-semibold text-[#3F4254] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} /> Refresh
          </button>

          {/* Task Type Filter Toggles */}
          <div className="flex items-center bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg p-1 gap-1">
            {['Semua', 'WO', 'Checklist'].map((type) => (
              <button
                key={type}
                onClick={() => { setJenisTugasFilter(type); setCurrentPage(1); }}
                className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                  jenisTugasFilter === type 
                    ? 'bg-white text-[#3F4254] shadow-sm' 
                    : 'text-[#A1A5B7] hover:text-[#3F4254]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors flex items-center gap-2">
            <Download size={16} /> Download Laporan
          </button>
          <button 
            onClick={() => navigate('/tugas-agen/upload')}
            className="px-4 py-2 border border-[#0095E8] rounded-lg text-sm font-bold text-[#0095E8] hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Upload size={16} /> Upload Tugas
          </button>
          <button 
            onClick={() => navigate('/tugas-agen/buat')}
            className="px-4 py-2 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Buat Tugas
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]">
                <th className="p-4 pl-6 text-[11px] font-bold text-[#B5B5C3] uppercase">No</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">ID Tugas</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">Nama Tugas</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">Jadwal Tugas</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">Perusahaan</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">Departemen</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase">Urgensi</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase text-center">Progres Tugas</th>
                <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase text-center">Status</th>
                <th className="p-4 pr-6 text-[11px] font-bold text-[#B5B5C3] uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#7E8299] text-sm italic">Memuat data...</td>
                </tr>
              ) : filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#7E8299] text-sm font-medium">Data tidak ditemukan</td>
                </tr>
              ) : (
                paginatedDrafts.map((draft, index) => (
                  <tr key={draft.id} className="border-b border-[#F1F1F4] hover:bg-gray-50 transition-colors group">
                    <td className="p-4 pl-6 text-[13px] text-[#3F4254] font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/tugas-agen/detail/${draft.id}`} className="text-[13px] font-normal text-[#0095E8] underline hover:text-[#0084CC]">
                          PAM-{draft.id}
                        </Link>
                        {draft.jenis_tugas === 'wo' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#7239EA] bg-[#F8E3FF] border border-[#E1D0FF] uppercase">WO</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#0095E8] bg-[#F1FAFF] border border-[#D1E9FF] uppercase">Checklist</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-[13px] text-[#3F4254] font-bold max-w-xs">{draft.nama_tugas}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[12px] text-[#3F4254] font-medium">
                        {draft.tanggal_mulai ? new Date(draft.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        {draft.waktu_mulai ? ` ${draft.waktu_mulai.substring(0,5)}` : ''} 
                        {draft.tanggal_selesai || draft.waktu_selesai ? ' - ' : ''}
                        {draft.tanggal_selesai ? new Date(draft.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        {draft.waktu_selesai ? ` ${draft.waktu_selesai.substring(0,5)}` : ''}
                      </div>
                      <div className="text-[11px] text-[#A1A5B7] mt-0.5">
                        {draft.pengulangan ? `Berulang: ${draft.jenis_pengulangan}` : 'Tidak ada pengulangan Tugas'}
                      </div>
                    </td>
                    <td className="p-4 text-[13px] text-[#7E8299] font-semibold">{draft.perusahaan}</td>
                    <td className="p-4 text-[13px] text-[#7E8299] font-semibold">{draft.departemen}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        draft.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C]' : 
                        draft.urgensi === 'Sedang' ? 'bg-[#FFF8DD] text-[#FFAD0F]' :
                        'bg-[#F1FAFF] text-[#0095E8]'
                      }`}>
                        {draft.urgensi || 'Normal'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#B5B5C3]">-</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-[#F5F8FA] text-[#A1A5B7] rounded text-[11px] font-bold">
                        Tidak aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission(user, 'tugas_agen_draf', 'Edit') && (
                          <button
                            onClick={() => navigate(`/tugas-agen/edit/${draft.id}`)}
                            className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {hasPermission(user, 'tugas_agen_draf', 'Hapus') && (
                          <button
                            onClick={() => handleDelete(draft.id)}
                            className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-[#FFF5F8] rounded-lg transition-colors"
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

        {/* Footer / Pagination */}
        <div className="p-4 pl-6 border-t border-[#F1F1F4] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-[#7E8299]">
              <div className="relative">
                <select 
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-1 bg-[#F9F9F9] border border-[#F1F1F4] rounded outline-none text-[#3F4254] font-bold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
              <span>Baris per halaman</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded flex items-center justify-center text-[#7E8299] hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all ${
                    currentPage === page ? 'bg-[#0095E8] text-white' : 'text-[#7E8299] hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 rounded flex items-center justify-center text-[#7E8299] hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#181C32]" />
                <h3 className="text-base font-bold text-[#181C32]">Filter Lanjutan</h3>
              </div>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-[#7E8299]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Departemen */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-[#3F4254]">Departemen / Divisi</label>
                <div className="flex flex-wrap gap-2">
                  {availableDepartments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => {
                        const current = tempFilters.departemen;
                        if (current.includes(dept)) {
                          setTempFilters({ ...tempFilters, departemen: current.filter(d => d !== dept) });
                        } else {
                          setTempFilters({ ...tempFilters, departemen: [...current, dept] });
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all ${
                        tempFilters.departemen.includes(dept)
                          ? 'bg-[#0095E8] border-[#0095E8] text-white shadow-md shadow-blue-200'
                          : 'bg-white border-[#F1F1F4] text-[#7E8299] hover:border-[#0095E8] hover:text-[#0095E8]'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F9F9F9] border-t border-[#F1F1F4] flex items-center gap-3">
              <button
                onClick={() => {
                  setTempFilters({ departemen: [] });
                  setActiveFilters({ departemen: [] });
                  setIsFilterOpen(false);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2.5 border border-[#F1F1F4] bg-white text-[#7E8299] text-[13px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setActiveFilters(tempFilters);
                  setIsFilterOpen(false);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2.5 bg-[#0095E8] text-white text-[13px] font-bold rounded-lg hover:bg-[#0084CC] transition-colors shadow-sm shadow-blue-200"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftList;
