import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { authFetch } from '../services/api';
import API_URL from '../config';

const MonitorRelasiWO = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const fetchMonitorData = async () => {
    try {
      // Menggunakan endpoint monitor khusus yang sudah kita buat di backend
      const response = await authFetch(`/api/department-tasks/monitor?company_id=${user.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Fetch monitor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Baru': return 'bg-[#F1FAFF] text-[#0095E8]';
      case 'Diterima': return 'bg-[#F8E3FF] text-[#7239EA]';
      case 'Menunggu Pengerjaan': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Berlangsung': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Partial WO': return 'bg-[#E8FFF3] text-[#50CD89] border border-[#50CD89]/20';
      case 'Selesai': return 'bg-[#E8FFF3] text-[#50CD89]';
      case 'Ditolak': return 'bg-[#FFF5F8] text-[#F1416C]';
      case 'Menunggu Approval': return 'bg-[#FFF8DD] text-[#FFAD0F]';
      default: return 'bg-[#F1FAFF] text-[#0095E8]';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.nama_wo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.departemen_tujuan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[13px] text-[#A1A5B7] font-medium">Memuat data monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 px-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-[#181C32]">Monitor WO Relasi</h2>
          <p className="text-[13px] text-[#7E8299] mt-1">Pantau real-time progres WO antar departemen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-5 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={18} />
          <input 
            type="text"
            placeholder="Cari nama WO atau departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F9F9F9] border-transparent rounded-lg text-[13px] focus:bg-white focus:border-[#0095E8] transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#7E8299]" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F9F9F9] border-transparent rounded-lg px-4 py-2.5 text-[13px] font-medium outline-none focus:bg-white focus:border-[#0095E8]"
          >
            <option value="Semua">Semua Status</option>
            <option value="Baru">Baru</option>
            <option value="Diterima">Diterima</option>
            <option value="Partial WO">Partial WO</option>
            <option value="Menunggu Approval">Menunggu Approval</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <button 
          onClick={fetchMonitorData}
          className="ml-auto px-4 py-2.5 bg-[#F1FAFF] text-[#0095E8] rounded-lg text-[13px] font-bold hover:bg-[#0095E8] hover:text-white transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Info WO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tujuan</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Progres Item</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Terakhir Update</th>
              <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F1F4]">
            {filteredTasks.length > 0 ? filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-[#FBFCFD] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#181C32] group-hover:text-[#0095E8] transition-colors line-clamp-1">
                      {task.nama_wo}
                    </span>
                    <span className="text-[11px] text-[#A1A5B7] mt-0.5">ID: WO-{task.id}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-[#F5F8FA] flex items-center justify-center text-[#7E8299]">
                      <ArrowUpRight size={14} />
                    </div>
                    <span className="text-[12px] font-semibold text-[#3F4254]">{task.departemen_tujuan}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5 w-32">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#3F4254]">{task.fixed_wo_items || 0}/{task.total_wo_items || 0}</span>
                      <span className="text-[#0095E8]">
                        {task.total_wo_items ? Math.round((task.fixed_wo_items/task.total_wo_items)*100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[#F1F1F4] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#0095E8] h-full rounded-full transition-all duration-500"
                        style={{ width: `${task.total_wo_items ? (task.fixed_wo_items/task.total_wo_items)*100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold inline-block ${getStatusBadge(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[#3F4254] font-medium">
                      {task.last_update_at ? new Date(task.last_update_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                    <span className="text-[11px] text-[#A1A5B7]">
                      {task.last_update_at ? new Date(task.last_update_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => navigate(`/tugas-departemen/terkirim/detail/${task.id}`)}
                    className="p-2 text-[#A1A5B7] hover:text-[#0095E8] hover:bg-[#F1FAFF] rounded-lg transition-all"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Clock size={32} className="text-[#E4E6EF]" />
                    <p className="text-[13px] text-[#A1A5B7]">Belum ada data WO relasi yang ditemukan.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorRelasiWO;
