import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal,
  Ban,
  Trash2,
  Edit2,
  Upload,
  Star
} from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';

const AdminList = () => {
  const navigate = useNavigate();
  const { confirm, success, error: showError } = useModal();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await authFetch(`/api/users?type=admin`);
      if (response.ok) {
        const data = await response.json();
        setAdmins(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm(
      'Hapus Admin',
      'Apakah Anda yakin ingin menghapus admin ini?',
      async () => {
        try {
          const response = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
          if (response.ok) {
            success('Berhasil', 'Admin berhasil dihapus');
            fetchAdmins(); 
          }
        } catch (err) {
          showError('Kesalahan', 'Terjadi kesalahan server.');
        }
      }
    );
  };

  const filteredAdmins = admins.filter(admin => 
    (admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (admin.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[14px] font-bold text-[#181C32]">Admin</h2>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 border border-[#0095E8] text-[#0095E8] rounded-lg text-[12px] font-bold hover:bg-[#F1FAFF] transition-colors">
              <Upload size={16} />
              Upload Admin
           </button>
           <button 
             onClick={() => navigate('/pengguna/admin/create')}
             className="flex items-center gap-2 px-4 py-2 bg-[#0095E8] text-white rounded-lg text-[12px] font-bold hover:bg-[#0084CC] transition-colors"
           >
             <Plus size={16} />
             Buat Admin
           </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E1E3EA] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#F5F8FA] flex justify-between items-center">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
              <input 
                type="text" 
                placeholder="Cari nama" 
                className="pl-10 pr-4 py-2 bg-[#F5F8FA] border-none rounded text-[12px] text-[#3F4254] outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-[#F5F8FA] text-[#7E8299] rounded text-[12px] font-bold hover:bg-[#E1E3EA] transition-colors">
              <Filter size={16} />
              Filter
           </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F5F8FA]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nama</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">No. Karyawan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Hak Akses</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Perusahaan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Departemen</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F8FA]">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-[#A1A5B7] text-[12px]">Memuat data...</td></tr>
              ) : paginatedAdmins.map((admin, index) => (
                <tr key={admin.id} className="hover:bg-[#F5F8FA] transition-colors group">
                  <td className="px-6 py-4 text-[12px] text-[#3F4254] font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => navigate(`/pengguna/admin/detail/${admin.id}`)}
                        className="text-[12px] text-[#0095E8] hover:underline cursor-pointer"
                      >
                        {admin.firstName} {admin.lastName}
                      </span>
                      {admin.role?.toLowerCase() === 'super admin' && (
                        <Star size={14} className="text-[#0095E8] fill-[#0095E8]/10" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[12px] text-[#7E8299]">{admin.employeeId || '-'}</td>
                  <td className="px-6 py-4 text-[12px] text-[#7E8299]">{admin.role || 'Admin'}</td>
                  <td className="px-6 py-4 text-[12px] text-[#7E8299]">{admin.company_name || 'Semua'}</td>
                  <td className="px-6 py-4 text-[12px] text-[#7E8299]">{admin.department || 'Semua'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${admin.status === 'Aktif' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF5F8] text-[#F1416C]'}`}>
                       {admin.status || 'Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-1">
                       <button onClick={() => navigate(`/pengguna/admin/edit/${admin.id}`)} className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded transition-colors"><Edit2 size={16} /></button>
                       <button className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-[#FFF5F8] rounded transition-colors"><Ban size={16} /></button>
                       <button onClick={() => handleDelete(admin.id)} className="p-2 text-[#A1A5B7] hover:text-[#F1416C] hover:bg-[#FFF5F8] rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-[#F5F8FA]/30 border-t border-[#F5F8FA] flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="relative">
                 <select 
                   value={rowsPerPage} 
                   onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                   className="appearance-none pl-3 pr-8 py-1.5 border border-[#E1E3EA] rounded bg-white text-[12px] font-medium outline-none"
                 >
                    {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                 </select>
                 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
              <span className="text-[12px] text-[#7E8299]">Baris per halaman</span>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-[#7E8299] hover:text-[#0095E8] disabled:opacity-30"><ChevronLeft size={18} /></button>
              <div className="flex gap-1">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button 
                      key={p} 
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-bold transition-colors ${currentPage === p ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F5F8FA]'}`}
                    >
                       {p}
                    </button>
                 ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-[#7E8299] hover:text-[#0095E8] disabled:opacity-30"><ChevronRight size={18} /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminList;
