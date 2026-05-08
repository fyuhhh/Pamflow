import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Pencil, Ban, Trash2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const CompanyList = () => {
  const navigate = useNavigate();
  const { confirm, success, error: showError } = useModal();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await authFetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/pengaturan/perusahaan/edit/${id}`);
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Perusahaan',
      'Apakah Anda yakin ingin menghapus perusahaan ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          const response = await authFetch(`/api/companies/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            success('Berhasil', 'Perusahaan berhasil dihapus');
            fetchCompanies();
          } else {
            showError('Gagal', 'Gagal menghapus perusahaan.');
          }
        } catch (err) {
          console.error('Delete error:', err);
          showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server.');
        }
      }
    );
  };

  const filteredCompanies = companies.filter(company => 
    (company.name && company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.companyId && company.companyId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-8 px-10">
      <div className="bg-white rounded-xl shadow-sm border border-[#F1F1F4] overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama Perusahaan" 
                className="w-full pl-10 pr-4 py-2.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg text-sm focus:outline-none focus:border-[#0095E8] transition-colors"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#F1F1F4] rounded-lg text-sm font-semibold text-[#3F4254] hover:bg-[#F9F9F9] transition-colors">
              <Filter size={18} className="text-[#A1A5B7]" />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/pengaturan/perusahaan/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0095E8] rounded-lg text-sm font-bold text-white hover:bg-[#0084CC] transition-colors"
            >
              <Plus size={18} strokeWidth={3} />
              Buat Perusahaan
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-[#F1F1F4] bg-[#F9F9F9]/50">
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Perusahaan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Perusahaan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Zona Waktu</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">No Telepon</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-[#A1A5B7]">Loading data...</td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-[#A1A5B7]">Tidak ada data perusahaan ditemukan</td>
                </tr>
              ) : (
                paginatedCompanies.map((company, index) => (
                  <tr key={company.id} className="hover:bg-[#F9F9F9] transition-colors group">
                    <td className="px-6 py-4 text-sm text-[#3F4254]">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-6 py-4">
                      <span 
                        onClick={() => handleEdit(company.id)}
                        className="text-sm font-normal text-[#0095E8] underline cursor-pointer hover:text-[#0084CC]"
                      >
                        {company.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#3F4254] font-semibold">{company.companyId}</td>
                    <td className="px-6 py-4 text-sm text-[#3F4254]">{company.type}</td>
                    <td className="px-6 py-4 text-sm text-[#3F4254]">{company.timezone}</td>
                    <td className="px-6 py-4 text-sm text-[#3F4254]">{company.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        company.status === 'Aktif' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF8DD] text-[#F1BC00]'
                      }`}>
                        {company.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(company.id)}
                          className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-red-50 rounded-lg transition-colors" title="Nonaktifkan">
                          <Ban size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(company.id)}
                          className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-[#F1F1F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-4 pr-10 py-2 bg-white border border-[#F1F1F4] rounded-lg text-sm font-semibold text-[#3F4254] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
            </div>
            <span className="text-sm text-[#A1A5B7]">Baris per halaman</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-[#A1A5B7] hover:text-[#0095E8] transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
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
              className="p-2 text-[#A1A5B7] hover:text-[#0095E8] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyList;
