import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsUpDown, Check, X, ChevronLeft, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { authFetch } from '../services/api';
import { hasPermission } from '../utils/permissions';
import { useModal } from '../context/ModalContext';

const PersetujuanList = () => {
  const { confirm, success, error: showError } = useModal();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Butuh Persetujuan');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const company_id = user?.company_id;
      const response = await authFetch(`/api/tasks${company_id ? `?company_id=${company_id}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        // Only tasks that need approval
        setTasks(Array.isArray(data) ? data.filter(t => t.butuh_persetujuan) : []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching approval tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'Butuh Persetujuan') {
      return task.approval_status === 'Pending';
    } else {
      return task.approval_status === 'Approved' || task.approval_status === 'Rejected';
    }
  });

  const handleApproval = async (taskId, status) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const response = await authFetch(`/api/tasks/${taskId}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approval_status: status,
          user_id: user?.id,
          user_name: user?.firstName || user?.username
        })
      });
      if (response.ok) {
        success('Berhasil', `Tugas berhasil ${status === 'Approved' ? 'disetujui' : 'ditolak'}`);
        fetchTasks();
      } else {
        showError('Gagal', 'Gagal memperbarui status persetujuan');
      }
    } catch (err) {
      console.error('Error updating approval:', err);
      showError('Gagal', 'Gagal memperbarui status persetujuan');
    }
  };

  const handleDelete = (taskId) => {
    confirm(
      'Hapus Tugas',
      'Apakah Anda yakin ingin menghapus tugas ini? Data yang dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          const response = await authFetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            body: JSON.stringify({ 
              user_id: currentUser?.id,
              user_name: currentUser?.firstName || currentUser?.username
            })
          });
          if (response.ok) {
            success('Berhasil', 'Tugas berhasil dihapus');
            fetchTasks();
          } else {
            showError('Gagal', 'Gagal menghapus tugas');
          }
        } catch (err) {
          console.error('Error deleting task:', err);
          showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server');
        }
      }
    );
  };

  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getUrgensiColor = (urgensi) => {
    switch (urgensi) {
      case 'Kritis': return 'text-[#F1416C]';
      case 'Sedang': return 'text-[#FFAD0F]';
      default: return 'text-[#0095E8]';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
  };

  const tabHeaders = activeTab === 'Butuh Persetujuan'
    ? [
        { label: 'No', width: '50px' },
        { label: 'ID Tugas', sort: true, width: '120px' },
        { label: 'Nama Tugas', sort: true },
        { label: 'Urgensi' },
        { label: 'Diserahkan', sort: true },
        { label: 'Status Waktu' },
        { label: 'Aksi', align: 'right', width: '120px' },
      ]
    : [
        { label: 'No', width: '50px' },
        { label: 'ID Tugas', sort: true, width: '120px' },
        { label: 'Nama Tugas', sort: true },
        { label: 'Urgensi' },
        { label: 'Diserahkan', sort: true },
        { label: 'Status Waktu' },
        { label: 'Status Persetujuan' },
      ];

  return (
    <div className="p-8">
      {/* Tabs + Table connected as one unit */}
      <div>
        {/* Tabs row */}
        <div className="flex items-end gap-0">
          <button
            onClick={() => setActiveTab('Butuh Persetujuan')}
            className={`px-5 py-2 text-[13px] font-semibold rounded-t-lg transition-all ${
              activeTab === 'Butuh Persetujuan'
                ? 'bg-[#0095E8] text-white'
                : 'bg-transparent text-[#7E8299] hover:text-[#3F4254]'
            }`}
          >
            Butuh Persetujuan
          </button>
          <button
            onClick={() => setActiveTab('Selesai')}
            className={`px-5 py-2 text-[13px] font-semibold rounded-t-lg transition-all ${
              activeTab === 'Selesai'
                ? 'bg-[#0095E8] text-white'
                : 'bg-transparent text-[#7E8299] hover:text-[#3F4254]'
            }`}
          >
            Selesai
          </button>
        </div>

        {/* Table header row - directly connected to tabs */}
        <div className="bg-[#F5F8FA] border-b border-[#EFF2F5]">
          <div className="flex items-center">
            {tabHeaders.map((col, i) => (
              <div
                key={i}
                className={`px-5 py-3 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider ${
                  col.align === 'right' ? 'text-right ml-auto' : ''
                }`}
                style={col.width ? { width: col.width, minWidth: col.width } : { flex: 1 }}
              >
                {col.label}
                {col.sort && <ChevronsUpDown size={11} className="inline ml-1 text-[#C4C4C4]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Table body - with shadow */}
        <div
          className="bg-white rounded-b-xl overflow-hidden"
          style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04), 0 2px 8px 0 rgba(0,0,0,0.02)' }}
        >
          {loading ? (
            <div className="py-20 text-center text-[#A1A5B7] text-sm italic">Memuat data...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-24 text-center text-[#7E8299] text-[14px] font-medium">
              Data tidak ditemukan
            </div>
          ) : (
            paginatedTasks.map((task, index) => (
              <div key={task.id} className="flex items-center border-b border-[#EFF2F5] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                <div className="px-5 py-3.5 text-[13px] text-[#3F4254]" style={{ width: '50px', minWidth: '50px' }}>
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </div>
                <div className="px-5 py-3.5 flex items-center gap-2" style={{ width: '120px', minWidth: '120px' }}>
                  <Link to={`/tugas-agen/detail/${task.id}`} className="text-[13px] font-normal text-[#0095E8] underline hover:text-[#0084CC]">
                    PAM-{task.id}
                  </Link>
                  {task.jenis_tugas === 'wo' ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#7239EA] bg-[#F8E3FF] border border-[#E1D0FF] uppercase">WO</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#0095E8] bg-[#F1FAFF] border border-[#D1E9FF] uppercase">Checklist</span>
                  )}
                </div>
                <div className="px-5 py-3.5 flex flex-col" style={{ flex: 1 }}>
                  <span className="text-[13px] font-bold text-[#181C32]">{task.nama_tugas}</span>
                </div>
                <div className={`px-5 py-3.5 text-[12px] font-bold ${getUrgensiColor(task.urgensi)}`} style={{ flex: 1 }}>
                  {task.urgensi || 'Normal'}
                </div>
                <div className="px-5 py-3.5 flex flex-col" style={{ flex: 1 }}>
                  <span className="text-[12px] font-bold text-[#3F4254]">{task.pic_pengerja || 'Admin'}</span>
                  <span className="text-[11px] text-[#A1A5B7]">{formatDate(task.created_at)}</span>
                </div>
                <div className="px-5 py-3.5" style={{ flex: 1 }}>
                  <span className="px-2 py-0.5 bg-[#E8FFF3] text-[#50CD89] rounded text-[10px] font-bold">Tepat Waktu</span>
                </div>
                
                {activeTab === 'Butuh Persetujuan' ? (
                  <div className="px-5 py-3.5 flex items-center justify-end gap-2" style={{ width: '120px', minWidth: '120px' }}>
                    {(() => {
                      const canApproveRole = currentUser?.role?.toLowerCase().includes('manager') || String(currentUser?.id) === String(task.admin_pemeriksa_id);
                      const hasEditPermission = hasPermission(currentUser, 'tugas_agen_persetujuan', 'Edit');
                      const canApprove = canApproveRole && hasEditPermission;
                      
                      return (
                        <>
                          {canApprove ? (
                            <>
                              <button 
                                onClick={() => handleApproval(task.id, 'Approved')}
                                className="p-1.5 rounded bg-[#E8FFF3] text-[#50CD89] hover:bg-[#50CD89] hover:text-white transition-all shadow-sm shadow-green-100"
                                title="Setujui"
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>
                              <button 
                                onClick={() => handleApproval(task.id, 'Rejected')}
                                className="p-1.5 rounded bg-[#FFF5F8] text-[#F1416C] hover:bg-[#F1416C] hover:text-white transition-all shadow-sm shadow-red-100"
                                title="Tolak"
                              >
                                <X size={14} strokeWidth={3} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#A1A5B7] italic">No Access</span>
                          )}
                          
                          {hasPermission(currentUser, 'tugas_agen_persetujuan', 'Hapus') && (
                            <button 
                              onClick={() => handleDelete(task.id)}
                              className="p-1.5 rounded bg-[#F9F9F9] text-[#7E8299] hover:bg-[#F1416C] hover:text-white transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="px-5 py-3.5 flex-1">
                    <span className={`text-[12px] font-semibold ${
                      task.status_persetujuan === 'Disetujui' ? 'text-[#50CD89]' : 'text-[#F1416C]'
                    }`}>
                      {task.status_persetujuan || '-'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Section */}
        {filteredTasks.length > 0 && (
          <div className="px-6 py-5 flex items-center justify-between border-t border-[#F1F1F4] bg-white rounded-b-xl mt-[-1px] relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select 
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none pl-4 pr-10 py-1.5 bg-[#F5F8FA] border border-transparent rounded text-[13px] text-[#3F4254] outline-none cursor-pointer font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
              <span className="text-[13px] text-[#A1A5B7]">Baris per halaman</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-8 h-8 flex items-center justify-center rounded text-[#A1A5B7] hover:bg-[#F5F8FA] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                    currentPage === page ? 'bg-[#F1FAFF] text-[#0095E8]' : 'text-[#7E8299] hover:bg-[#F5F8FA]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center rounded text-[#A1A5B7] hover:bg-[#F5F8FA] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersetujuanList;
