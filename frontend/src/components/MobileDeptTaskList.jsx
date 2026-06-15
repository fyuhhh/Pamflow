import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, ChevronRight, Info } from 'lucide-react';
import API_URL from '../config';

const MobileDeptTaskList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const dept = user?.department || '';
      const response = await fetch(`${API_URL}/api/department-tasks?departemen_tujuan=${encodeURIComponent(dept)}&company_id=${user.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching dept tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusList = ['Semua', 'Menunggu Pengerjaan', 'Berlangsung', 'Selesai'];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.nama_wo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.departemen_asal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.nama_peminta?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'Semua' ? (task.status !== 'Baru' && task.status !== 'Ditolak') : task.status === activeFilter;
    
    // Additional hard filter: NEVER show 'Baru' tasks on mobile
    const isAccepted = task.status !== 'Baru' && task.status !== 'Ditolak';
    
    return matchesSearch && matchesFilter && isAccepted;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Baru':
        return 'bg-[#F1FAFF] text-[#0095E8] border-[#0095E8]/20';
      case 'Diterima':
        return 'bg-[#F8E3FF] text-[#7239EA] border-[#7239EA]/20';
      case 'Menunggu Pengerjaan':
        return 'bg-[#FFF8DD] text-[#FFC700] border-[#FFC700]/20';
      case 'Berlangsung':
        return 'bg-[#FFF8DD] text-[#FFC700] border-[#FFC700]/20';
      case 'Selesai':
        return 'bg-[#E8FFF3] text-[#50CD89] border-[#50CD89]/20';
      case 'Ditolak':
        return 'bg-[#FFF5F8] text-[#F1416C] border-[#F1416C]/20';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-50';
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white z-40 px-6 pb-4 pt-8 flex flex-col border-b border-slate-200 shadow-sm"
              style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">Tugas Diterima</h1>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">Permintaan dari Departemen Lain</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari WO, pengirim, atau departemen..." 
              className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
              activeFilter !== 'Semua' ? 'bg-[#0095E8] text-white border-[#0095E8]' : 'bg-white text-slate-600 border-slate-200 shadow-sm'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Filter Horizontal Bar for quick access */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white/50 backdrop-blur-sm sticky top-[110px] z-30 border-b border-slate-50">
        {statusList.map(status => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border ${
              activeFilter === status 
                ? 'bg-[#0095E8] text-white border-[#0095E8] shadow-md shadow-blue-100' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 bg-slate-100 rounded w-20"></div>
                  <div className="h-3 bg-slate-100 rounded w-16"></div>
                </div>
                <div className="h-5 bg-slate-100 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-50 rounded w-full"></div>
                  <div className="h-3 bg-slate-50 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-10 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Info size={32} className="text-slate-200" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800 mb-1">
              {searchTerm || activeFilter !== 'Semua' ? 'Hasil tidak ditemukan' : 'Tidak ada permintaan'}
            </h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">
              {searchTerm || activeFilter !== 'Semua' 
                ? 'Coba ubah kata kunci pencarian atau bersihkan filter Anda' 
                : `Belum ada tugas yang diterima untuk departemen ${user?.department || 'Anda'}. Tugas harus diterima melalui Dashboard PC terlebih dahulu.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {filteredTasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => navigate(`/demo/mobile/dept-task/${task.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  task.urgensi === 'Kritis' ? 'bg-red-500' : 'bg-[#0095E8]/30'
                }`} />

                <div className="flex justify-between items-start mb-3 pl-1">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">
                      {task.jenis_tugas === 'checklist' ? 'CHK' : 'WO'}-{task.dept_id_asal || task.departemen_asal?.substring(0, 3).toUpperCase() || 'GEN'}{String(task.id).padStart(5, '0')}
                    </span>
                    <h4 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mt-0.5">
                      {task.nama_wo}
                    </h4>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </div>
                </div>

                <p className="text-[12px] text-slate-500 mb-4 line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded-lg">
                  {task.deskripsi || 'Tidak ada deskripsi'}
                </p>

                <div className="grid grid-cols-2 gap-y-3 pt-3 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pengirim</span>
                    <span className="text-[12px] font-bold text-slate-700">{task.nama_peminta}</span>
                    <span className="text-[10px] text-slate-400">{task.departemen_asal}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Diminta Pada</span>
                    <span className="text-[12px] font-bold text-slate-700">{formatDate(task.created_at)}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">Perusahaan</span>
                    <span className="text-[12px] font-medium text-slate-600 line-clamp-1">{task.perusahaan || '-'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end mt-4 pt-2">
                   <div className="text-[#0095E8] flex items-center gap-1.5 text-[11px] font-bold bg-blue-50/50 px-3 py-1.5 rounded-full">
                     <span>Lihat Detail</span>
                     <ChevronRight size={14} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal Sheet */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
          <div className="bg-white w-full rounded-t-[32px] p-8 pb-12 z-10 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-bold text-slate-800 mb-6">Filter Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {statusList.map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveFilter(status);
                    setShowFilterModal(false);
                  }}
                  className={`py-3.5 rounded-2xl text-[14px] font-bold transition-all border-2 ${
                    activeFilter === status 
                      ? 'bg-[#0095E8] text-white border-[#0095E8]' 
                      : 'bg-white text-slate-600 border-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                setActiveFilter('Semua');
                setShowFilterModal(false);
              }}
              className="w-full mt-6 py-4 text-slate-400 text-[14px] font-bold underline"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};


export default MobileDeptTaskList;
