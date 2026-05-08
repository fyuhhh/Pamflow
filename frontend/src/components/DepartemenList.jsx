import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Edit2, Trash2, Lock, MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const DepartemenList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { confirm, success, error: showError } = useModal();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const url = isSuperAdmin 
        ? '/api/departments'
        : `/api/departments?company_id=${user.company_id}`;
      
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : []);
      } else {
        setDepartments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Departemen',
      'Apakah Anda yakin ingin menghapus departemen ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          const response = await authFetch(`/api/departments/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            success('Berhasil', 'Departemen berhasil dihapus');
            fetchDepartments();
          } else {
            showError('Gagal', 'Gagal menghapus departemen');
          }
        } catch (error) {
          console.error('Error deleting department:', error);
          showError('Kesalahan Jaringan', 'Terjadi kesalahan jaringan saat menghubungi server.');
        }
      }
    );
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.dept_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[20px] font-bold text-[#181C32]">Departemen</h1>
        <button
          onClick={() => navigate('/pengaturan/departemen/create')}
          className="bg-[#0095E8] hover:bg-[#0073B7] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-[13px] font-bold transition-colors"
        >
          <Plus size={18} />
          Buat Departemen
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-[#F1F1F4] flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
            <input
              type="text"
              placeholder="Cari ID, Nama Departemen"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9F9F9] border-none rounded-lg text-[13px] focus:ring-1 focus:ring-[#0095E8] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F9F9] text-[#7E8299] rounded-lg text-[13px] font-bold hover:bg-[#F1F1F4] transition-colors">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Departemen</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">ID Departemen</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama Perusahaan</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">No Telepon</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">No WhatsApp</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F4]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-[#A1A5B7] text-[13px]">Memuat data...</td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-[#A1A5B7] text-[13px]">Tidak ada data departemen ditemukan.</td>
                </tr>
              ) : (
                paginatedDepartments.map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-[#F9F9F9] transition-colors group">
                    <td className="px-6 py-4 text-[13px] text-[#3F4254] font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-[13px]">
                      <button 
                        onClick={() => navigate(`/pengaturan/departemen/detail/${dept.id}`)}
                        className="text-[13px] font-normal text-[#0095E8] underline hover:text-[#0084CC]"
                      >
                        {dept.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#7E8299]">{dept.dept_id}</td>
                    <td className="px-6 py-4 text-[13px] text-[#7E8299]">{dept.company_name}</td>
                    <td className="px-6 py-4 text-[13px] text-[#7E8299]">{dept.phone}</td>
                    <td className="px-6 py-4 text-[13px] text-[#7E8299]">{dept.whatsapp}</td>
                    <td className="px-6 py-4 text-[13px]">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                        dept.status === 'Aktif' 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => navigate(`/pengaturan/departemen/edit/${dept.id}`)}
                          className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded-lg transition-colors">
                          <Lock size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dept.id)}
                          className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-[#FFF5F8] rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="p-5 border-t border-[#F1F1F4] flex justify-between items-center text-[13px] text-[#7E8299]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg text-[13px] text-[#3F4254] font-semibold outline-none focus:ring-0 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
            </div>
            <span>Baris per halaman</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-[#F9F9F9] rounded disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                    currentPage === page ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F9F9F9]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 hover:bg-[#F9F9F9] rounded disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartemenList;
