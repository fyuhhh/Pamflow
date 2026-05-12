import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  Eye,
  RefreshCw,
  XCircle,
  Activity
} from 'lucide-react';
import { authFetch } from '../services/api';

const MobileMonitorWO = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const fetchMonitorData = async () => {
    setLoading(true);
    try {
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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Baru': return { bg: 'bg-blue-50', text: 'text-[#0095E8]', border: 'border-blue-100' };
      case 'Diterima': return { bg: 'bg-purple-50', text: 'text-[#7239EA]', border: 'border-purple-100' };
      case 'Berlangsung': return { bg: 'bg-amber-50', text: 'text-[#FFC700]', border: 'border-amber-100' };
      case 'Selesai': return { bg: 'bg-emerald-50', text: 'text-[#50CD89]', border: 'border-emerald-100' };
      case 'Ditolak': return { bg: 'bg-red-50', text: 'text-[#F1416C]', border: 'border-red-100' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100' };
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.nama_wo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.departemen_tujuan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['Semua', 'Baru', 'Diterima', 'Berlangsung', 'Selesai', 'Ditolak'];

  return (
    <div className="bg-[#F5F8FA] min-h-screen flex flex-col relative overflow-hidden">
      {/* Abstract Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0095E8]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7239EA]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 px-6 pb-6 bg-[#F5F8FA]/80 backdrop-blur-md border-b border-slate-200 shadow-sm"
              style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-4">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)} 
                className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm"
              >
                <ArrowLeft size={22} />
              </motion.button>
              <div>
                <h1 className="text-[20px] font-black text-slate-800 leading-tight">Monitor WO</h1>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Audit Tracking</p>
              </div>
           </div>
           <motion.button 
             whileTap={{ rotate: 180 }}
             onClick={fetchMonitorData} 
             className="w-11 h-11 bg-white border border-slate-200 text-[#0095E8] rounded-2xl flex items-center justify-center shadow-sm"
           >
             <RefreshCw size={20} />
           </motion.button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-sm">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Cari WO temuan..." 
              className="bg-transparent border-none outline-none text-[14px] font-bold w-full text-slate-700 placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilterModal(true)}
            className={`w-14 rounded-2xl border transition-all flex items-center justify-center shadow-sm ${
              statusFilter !== 'Semua' ? 'bg-[#0095E8] text-white border-[#0095E8]' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <Filter size={20} />
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-6 pt-6 pb-32 space-y-5 overflow-y-auto no-scrollbar relative z-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[32px] p-6 border border-slate-100 animate-pulse h-48 shadow-sm" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center pt-24 px-10 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center mb-6">
              <Activity size={40} className="text-slate-200" />
            </div>
            <h3 className="text-[18px] font-black text-slate-800 mb-2">Data Kosong</h3>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">Belum ada progres perbaikan temuan untuk departemen Anda.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task, idx) => {
              const config = getStatusConfig(task.status);
              const progress = task.total_wo_items ? Math.round((task.fixed_wo_items / task.total_wo_items) * 100) : 0;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={task.id} 
                  onClick={() => navigate(`/demo/mobile/task/${task.id}`)}
                  className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#181C32] text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                        <ArrowUpRight size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">ID: #{task.id}</span>
                        <h4 className="font-black text-slate-800 text-[16px] leading-tight mt-0.5 line-clamp-1">{task.nama_wo}</h4>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
                      {task.status}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</span>
                        <span className="text-[13px] font-black text-slate-700">{task.departemen_tujuan}</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Update</span>
                        <span className="text-[13px] font-black text-slate-700">{task.last_update_at ? new Date(task.last_update_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}</span>
                     </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="bg-slate-50 rounded-[24px] p-4 border border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repair Progress</p>
                        <p className="text-[16px] font-black text-slate-800">{progress}% <span className="text-[11px] font-bold text-slate-400 ml-1">Selesai</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-black text-[#0095E8]">{task.fixed_wo_items || 0}/{task.total_wo_items || 0}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">Items</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-400 to-[#0095E8] h-full rounded-full shadow-[0_0_10px_rgba(0,149,232,0.3)] relative"
                      >
                         <div className="absolute top-0 bottom-0 right-0 w-8 bg-white/20 skew-x-12 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5">
                    <div className="flex -space-x-2">
                       {[1,2].map(i => (
                         <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                            {i}
                         </div>
                       ))}
                       <div className="w-7 h-7 rounded-full border-2 border-white bg-[#0095E8] flex items-center justify-center text-[8px] font-black text-white">
                          +
                       </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#0095E8] text-[12px] font-black uppercase tracking-wider group-active:gap-3 transition-all">
                      Detail Audit <Eye size={16} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowFilterModal(false)} 
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[20px] font-black text-slate-800">Filter Status</h3>
                 <button onClick={() => setShowFilterModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <XCircle size={24} />
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {statusOptions.map(status => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setShowFilterModal(false);
                    }}
                    className={`py-4 rounded-[24px] text-[14px] font-black transition-all border-2 ${
                      statusFilter === status 
                        ? 'bg-[#0095E8] text-white border-[#0095E8] shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                    }`}
                  >
                    {status}
                  </motion.button>
                ))}
              </div>
              <button 
                onClick={() => {
                  setStatusFilter('Semua');
                  setShowFilterModal(false);
                }}
                className="w-full mt-8 py-4 text-slate-400 text-[14px] font-black uppercase tracking-widest"
              >
                Reset Filter
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileMonitorWO;
