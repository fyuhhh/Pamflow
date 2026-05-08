import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { getSocket } from '../services/socket';
import Skeleton from './common/Skeleton';
import { Search, SlidersHorizontal, FileText, X, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Terbuka');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [urgency, setUrgency] = useState('');
  const [timeStatus, setTimeStatus] = useState('');

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  useEffect(() => {
    fetchTasks();

    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => fetchTasks();
      socket.on('task-created', handleRefresh);
      socket.on('task-updated', handleRefresh);
      socket.on('task-approval-updated', handleRefresh);
      socket.on('task-progress-updated', handleRefresh);
      socket.on('task-deleted', handleRefresh);

      return () => {
        socket.off('task-created', handleRefresh);
        socket.off('task-updated', handleRefresh);
        socket.off('task-approval-updated', handleRefresh);
        socket.off('task-progress-updated', handleRefresh);
        socket.off('task-deleted', handleRefresh);
      };
    }
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/tasks?agent_id=${user.id}&departemen=${user.department}&company_id=${user.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['Terjadwal', 'Terbuka', 'Berlangsung', 'Menunggu Persetujuan', 'Ditolak', 'Selesai'];
  const urgencies = ['Kritis', 'Normal', 'Rendah'];
  const timeStatuses = ['Terlambat', 'Tepat waktu'];

  const handleReset = () => {
    setFilterDate('');
    setUrgency('');
    setTimeStatus('');
    setSearchTerm('');
  };

  const handleApply = () => setIsFilterOpen(false);

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return tasks.filter(task => {
      const matchesSearch = !searchTerm || 
        task.nama_tugas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.nomor_perintah_kerja?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      let matchesTab = false;
      const progres = task.progres || 'Terbuka';
      const status = task.status || 'Aktif';
      const tMulai = task.tanggal_mulai ? new Date(task.tanggal_mulai).toISOString().split('T')[0] : null;
      const tSelesai = task.tanggal_selesai ? new Date(task.tanggal_selesai).toISOString().split('T')[0] : null;

      switch (activeTab) {
        case 'Terjadwal': matchesTab = progres === 'Terbuka' && tMulai > today; break;
        case 'Terbuka': matchesTab = progres === 'Terbuka' && (!tMulai || tMulai <= today); break;
        case 'Berlangsung': matchesTab = progres === 'Berlangsung'; break;
        case 'Menunggu Persetujuan': matchesTab = progres === 'Selesai' && task.butuh_persetujuan === 1 && task.approval_status !== 'Approved' && status !== 'Ditolak'; break;
        case 'Ditolak': matchesTab = status === 'Ditolak' || task.approval_status === 'Rejected'; break;
        case 'Selesai': matchesTab = progres === 'Selesai' && (task.butuh_persetujuan === 0 || task.approval_status === 'Approved' || status === 'Selesai'); break;
        default: matchesTab = true;
      }

      if (!matchesTab) return false;

      if (filterDate && tMulai !== filterDate) return false;
      if (urgency && task.urgensi !== urgency) return false;
      
      if (timeStatus) {
        const isPastDeadline = tSelesai && tSelesai < today;
        const isLate = (progres !== 'Selesai' && isPastDeadline) || 
                      (progres === 'Selesai' && task.waktu_selesai_aktual && new Date(task.waktu_selesai_aktual).toISOString().split('T')[0] > tSelesai);
        
        if (timeStatus === 'Terlambat' && !isLate) return false;
        if (timeStatus === 'Tepat waktu' && isLate) return false;
      }

      return true;
    });
  }, [tasks, activeTab, searchTerm, filterDate, urgency, timeStatus]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const modalVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { y: "100%", transition: { type: "spring", damping: 25, stiffness: 300 } }
  };

  return (
    <div className="bg-[#F5F8FA] min-h-full font-sans relative flex flex-col">
      {/* Search & Filter Header (Sticky with Glass effect) */}
      <div 
        className="px-6 pb-4 space-y-4 sticky top-0 z-20 backdrop-blur-md bg-[#F5F8FA]/90 border-b border-slate-200 shadow-sm"
        style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm focus-within:border-[#0095E8] focus-within:ring-2 focus-within:ring-[#0095E8]/20 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari ID atau nama tugas" 
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 font-bold placeholder:text-slate-300 placeholder:font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFilterOpen(true)}
            className={`p-3.5 rounded-2xl shadow-sm transition-all border relative ${
              filterDate || urgency || timeStatus 
                ? 'bg-[#0095E8] border-[#0095E8] text-white' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <SlidersHorizontal size={20} />
            {(filterDate || urgency || timeStatus) && (
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F1416C] rounded-full border-2 border-white"></span>
            )}
          </motion.button>
        </div>

        {/* Horizontal Filter Tabs */}
        <div className="flex overflow-x-auto gap-2.5 pb-2 no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] font-bold border transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-[#1B3B6F] border-[#1B3B6F] text-white shadow-md shadow-[#1B3B6F]/20' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Task List Content */}
      <div className="flex-1 px-6 pt-4 pb-24 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex gap-2 mb-4">
                  <Skeleton width="60px" height="24px" borderRadius="8px" />
                  <Skeleton width="60px" height="24px" borderRadius="8px" />
                </div>
                <Skeleton width="80%" height="22px" className="mb-3" />
                <Skeleton width="60%" height="18px" className="mb-6" />
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <Skeleton width="100px" height="16px" />
                  <Skeleton width="60px" height="32px" borderRadius="12px" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center pt-24 px-10 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <FileText size={40} className="text-slate-300" />
            </div>
            <h3 className="text-[18px] font-black text-slate-800 mb-2">Tidak ada tugas</h3>
            <p className="text-slate-500 text-[14px] font-medium leading-relaxed">Tidak ada tugas yang sesuai dengan filter Anda saat ini</p>
            {(searchTerm || filterDate || urgency || timeStatus) && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleReset} 
                className="mt-6 px-6 py-2.5 bg-[#0095E8]/10 text-[#0095E8] rounded-full font-bold text-[14px]"
              >
                Reset Filter
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  key={task.id} 
                  onClick={() => navigate(`/demo/mobile/task/${task.id}`)}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 active:bg-slate-50 cursor-pointer overflow-hidden relative"
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${
                        task.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C] border border-[#F1416C]/20' : 
                        task.urgensi === 'Sedang' ? 'bg-[#FFF8DD] text-[#FFC700] border border-[#FFC700]/20' :
                        'bg-[#F1FAFF] text-[#0095E8] border border-[#0095E8]/20'
                      }`}>
                        {task.urgensi || 'Normal'}
                      </span>

                      {task.jenis_tugas === 'wo' ? (
                        <span className="text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider bg-[#F8E3FF] text-[#7239EA] border border-[#7239EA]/20">
                          WO
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Checklist
                        </span>
                      )}
                      
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const progres = task.progres || 'Terbuka';
                        const status = task.status || 'Aktif';
                        const tMulai = task.tanggal_mulai ? new Date(task.tanggal_mulai).toISOString().split('T')[0] : null;
                        
                        let label = '';
                        let colorClass = '';

                        if (status === 'Ditolak' || task.approval_status === 'Rejected') {
                          label = 'Ditolak'; colorClass = 'bg-[#FFF5F8] text-[#F1416C] border-[#F1416C]/20';
                        } else if (progres === 'Selesai') {
                          if (task.butuh_persetujuan === 1 && task.approval_status !== 'Approved') {
                            label = 'Menunggu'; colorClass = 'bg-[#F8E3FF] text-[#7239EA] border-[#7239EA]/20';
                          } else {
                            label = 'Selesai'; colorClass = 'bg-[#E8FFF3] text-[#50CD89] border-[#50CD89]/20';
                          }
                        } else if (progres === 'Berlangsung') {
                          label = 'Proses'; colorClass = 'bg-[#FFF8DD] text-[#FFC700] border-[#FFC700]/20';
                        } else if (progres === 'Terbuka') {
                          if (tMulai && tMulai > today) {
                            label = 'Jadwal'; colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
                          } else {
                            label = 'Terbuka'; colorClass = 'bg-[#F1FAFF] text-[#0095E8] border-[#0095E8]/20';
                          }
                        }

                        if (!label) return null;
                        return (
                          <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider border ${colorClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>

                    <span className="text-[11px] font-black text-slate-300">{task.nomor_perintah_kerja || `PAM-${task.id}`}</span>
                  </div>

                  <h4 className="font-black text-slate-800 text-[16px] mb-5 leading-snug line-clamp-2 relative z-10">
                    {task.nama_tugas}
                  </h4>

                  <div className="flex items-end justify-between pt-4 border-t border-slate-100 relative z-10">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Calendar size={14} className="text-slate-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Deadline</span>
                        <span className="text-[13px] font-black text-slate-700">{formatDate(task.tanggal_selesai)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-[#F5F8FA] px-3.5 py-2.5 rounded-xl text-[#0095E8]">
                      <span className="text-[12px] font-bold">Buka</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Filter Bottom Sheet Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            />

            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 shadow-2xl max-h-[92vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[20px] font-black text-slate-800">Filter Tugas</h2>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Date Picker Section */}
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Tanggal Mulai</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full bg-[#F5F8FA] border-2 border-transparent rounded-2xl px-4 py-4 text-[14px] text-slate-700 outline-none focus:border-[#0095E8] focus:bg-white transition-all appearance-none font-bold"
                    />
                    <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Urgency Selection */}
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Urgensi</label>
                  <div className="flex flex-wrap gap-3">
                    {urgencies.map((u) => (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={u}
                        onClick={() => setUrgency(urgency === u ? '' : u)}
                        className={`px-5 py-3 rounded-2xl text-[13px] font-bold border transition-all ${
                          urgency === u 
                            ? 'bg-[#E3F2FD] border-[#0095E8] text-[#0095E8]' 
                            : 'bg-[#F5F8FA] border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {u}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Status Selection */}
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Status Waktu</label>
                  <div className="flex flex-wrap gap-3">
                    {timeStatuses.map((s) => (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={s}
                        onClick={() => setTimeStatus(timeStatus === s ? '' : s)}
                        className={`px-5 py-3 rounded-2xl text-[13px] font-bold border transition-all ${
                          timeStatus === s 
                            ? 'bg-[#E3F2FD] border-[#0095E8] text-[#0095E8]' 
                            : 'bg-[#F5F8FA] border-transparent text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-2 gap-4 mt-12">
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReset}
                  className="py-4 rounded-2xl bg-[#F5F8FA] text-slate-500 font-bold hover:bg-slate-200 transition-colors"
                >
                  Reset
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleApply}
                  className="py-4 rounded-2xl bg-[#0095E8] text-white font-bold shadow-lg shadow-blue-500/20"
                >
                  Terapkan
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileTasks;
