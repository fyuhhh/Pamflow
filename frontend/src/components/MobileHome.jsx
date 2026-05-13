import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, Info, Clock, ChevronRight, X, Phone, FileText, CheckCircle2, PlayCircle, AlertCircle, Activity, PieChart, Package, Database, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { getSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

const MobileHome = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = firstName ? `${firstName} ${lastName}`.trim() : 'Pengguna PamFlow';

  const [deptTasks, setDeptTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [taskStats, setTaskStats] = useState({
    terbuka: 0, berlangsung: 0,
    terbukaTepat: 0, terbukaLambat: 0,
    berlangsungTepat: 0, berlangsungLambat: 0,
    selesaiTepat: 0, selesaiLambat: 0,
  });
  const [deptRequests, setDeptRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch unread count
  useEffect(() => {
    if (user) {
      calculateUnreadNotifications();
      fetchTaskStats();
    }

    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => {
        calculateUnreadNotifications();
        fetchTaskStats();
        fetchDeptRequests();
        fetchTodayTasks();
        fetchDeptTasks();
      };

      socket.on('task-created', handleRefresh);
      socket.on('task-updated', handleRefresh);
      socket.on('task-approval-updated', handleRefresh);
      socket.on('dept-task-created', handleRefresh);
      socket.on('dept-task-updated', handleRefresh);

      return () => {
        socket.off('task-created', handleRefresh);
        socket.off('task-updated', handleRefresh);
        socket.off('task-approval-updated', handleRefresh);
        socket.off('dept-task-created', handleRefresh);
        socket.off('dept-task-updated', handleRefresh);
      };
    }
  }, []);

  const calculateUnreadNotifications = async () => {
    try {
      const [tasksRes, deptRes] = await Promise.all([
        authFetch(`/api/tasks?agent_id=${user.id}&departemen=${user.department}&company_id=${user.company_id}`),
        authFetch(`/api/department-tasks?departemen_tujuan=${encodeURIComponent(user.department)}&company_id=${user.company_id}`)
      ]);

      let unread = 0;
      const saved = localStorage.getItem('pamflow_read_tasks');
      const readIds = saved ? JSON.parse(saved) : [];

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        unread += tasks.filter(t => !readIds.includes(t.id)).length;
      }

      if (deptRes.ok) {
        const deptTasks = await deptRes.json();
        unread += deptTasks.filter(dt => dt.status === 'Menunggu Pengerjaan' && !readIds.includes(`dept-${dt.id}`)).length;
      }

      setUnreadCount(unread);
    } catch (error) {
      console.error('Error calculating unread:', error);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await authFetch(
        `/api/tasks?agent_id=${user.id}&departemen=${encodeURIComponent(user.department || '')}&company_id=${user.company_id}`
      );
      if (!response.ok) return;
      const tasks = await response.json();
      const now = new Date();

      let terbuka = 0, berlangsung = 0;
      let terbukaTepat = 0, terbukaLambat = 0;
      let berlangsungTepat = 0, berlangsungLambat = 0;
      let selesaiTepat = 0, selesaiLambat = 0;

      tasks.forEach(task => {
        const deadline = task.tanggal_selesai ? new Date(task.tanggal_selesai) : null;
        const aktual = task.waktu_selesai_aktual ? new Date(task.waktu_selesai_aktual) : null;
        const isLateNow = deadline && deadline < now;

        if (task.progres === 'Terbuka') {
          terbuka++;
          if (isLateNow) terbukaLambat++;
          else terbukaTepat++;
        } else if (task.progres === 'Berlangsung' || task.progres === 'Menunggu Material') {
          berlangsung++;
          if (isLateNow) berlangsungLambat++;
          else berlangsungTepat++;
        } else if (task.progres === 'Selesai') {
          if (!deadline) {
            selesaiTepat++; 
          } else if (aktual && aktual <= deadline) {
            selesaiTepat++;
          } else {
            selesaiLambat++;
          }
        }
      });

      setTaskStats({
        terbuka, berlangsung,
        terbukaTepat, terbukaLambat,
        berlangsungTepat, berlangsungLambat,
        selesaiTepat, selesaiLambat,
      });
    } catch (err) {
      console.error('Error fetching task stats:', err);
    }
  };

  useEffect(() => {
    const scrollContainer = document.getElementById('mobile-scroll-container');
    if (showHelpModal) {
      if (scrollContainer) scrollContainer.classList.add('no-scroll');
      document.body.style.overflow = 'hidden';
    } else {
      if (scrollContainer) scrollContainer.classList.remove('no-scroll');
      document.body.style.overflow = '';
    }
    return () => {
      if (scrollContainer) scrollContainer.classList.remove('no-scroll');
      document.body.style.overflow = '';
    };
  }, [showHelpModal]);

  useEffect(() => {
    if (user?.department) {
      fetchAllData();
    }
  }, [user?.department]);

  const fetchAllData = async () => {
    try {
      setLoadingTasks(true);
      setLoadingRequests(true);
      setLoadingToday(true);

      const dept = user?.department || '';
      
      const [deptTasksRes, deptReqRes, todayTasksRes] = await Promise.all([
        authFetch(`/api/tasks?departemen=${encodeURIComponent(dept)}&company_id=${user.company_id}`),
        authFetch(`/api/department-tasks?departemen_tujuan=${encodeURIComponent(dept)}&company_id=${user.company_id}`),
        authFetch(`/api/tasks?agent_id=${user.id}&departemen=${encodeURIComponent(dept)}&company_id=${user.company_id}`)
      ]);

      if (deptTasksRes.ok) {
        const data = await deptTasksRes.json();
        setDeptTasks(data.filter(t => t.progres === 'Terbuka' || !t.progres));
      }

      if (deptReqRes.ok) {
        const data = await deptReqRes.json();
        setDeptRequests(data.filter(d => d.status === 'Baru' || d.status === 'Menunggu Pengerjaan'));
      }

      if (todayTasksRes.ok) {
        const data = await todayTasksRes.json();
        const ongoing = data.filter(t => t.progres === 'Berlangsung' || t.progres === 'Menunggu Material');
        ongoing.sort((a, b) => new Date(a.tanggal_selesai) - new Date(b.tanggal_selesai));
        setTodayTasks(ongoing);
      }

      // Also fetch stats
      fetchTaskStats();
    } catch (error) {
      console.error('Error fetching all mobile home data:', error);
    } finally {
      setLoadingTasks(false);
      setLoadingRequests(false);
      setLoadingToday(false);
    }
  };

  const getUrgencyScore = (item) => {
    if (item.progres === 'Selesai' || item.status === 'Selesai') return 100;
    const urgensi = (item.urgensi || '').toLowerCase();
    if (urgensi === 'kritis') return 1;
    if (urgensi === 'tinggi') return 2;
    if (urgensi === 'sedang') return 3;
    if (urgensi === 'normal') return 4;
    if (urgensi === 'rendah') return 5;
    return 6;
  };

  const sortedDeptRequests = [...deptRequests].sort((a, b) => getUrgencyScore(a) - getUrgencyScore(b));
  const sortedDeptTasks = [...deptTasks].sort((a, b) => getUrgencyScore(a) - getUrgencyScore(b));
  const sortedTodayTasks = [...todayTasks].sort((a, b) => getUrgencyScore(a) - getUrgencyScore(b));

  const fetchTodayTasks = async () => {
    try {
      setLoadingToday(true);
      const dept = user?.department || '';
      const response = await authFetch(
        `/api/tasks?agent_id=${user.id}&departemen=${encodeURIComponent(dept)}&company_id=${user.company_id}`
      );
      if (response.ok) {
        const data = await response.json();
        const ongoing = data.filter(t => t.progres === 'Berlangsung' || t.progres === 'Menunggu Material');
        ongoing.sort((a, b) => new Date(a.tanggal_selesai) - new Date(b.tanggal_selesai));
        setTodayTasks(ongoing);
      }
    } catch (error) {
      console.error('Error fetching today tasks:', error);
    } finally {
      setLoadingToday(false);
    }
  };

  const formatDate = (dateString, timeString) => {
    if (!dateString) return 'Tidak diset';
    const date = new Date(dateString);
    let datePart = date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    if (timeString) {
      const timePart = timeString.substring(0, 5);
      return `${datePart}, ${timePart}`;
    }
    return datePart;
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const modalVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { y: "100%", transition: { type: "spring", damping: 25, stiffness: 300 } }
  };

  return (
    <div className="bg-[#F5F8FA] min-h-full pb-10 font-sans">
      {/* Top Header Section - Sticky at the top */}
      <div 
        className="px-6 pb-2 mb-2 flex items-center justify-between bg-[#F5F8FA]/90 backdrop-blur-md sticky top-0 z-30 transition-all"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
      >
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col -space-y-1">
          <p className="text-slate-400 text-[12px] font-bold">Halo,</p>
          <h2 className="text-[18px] font-black text-slate-800">{fullName}</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelpModal(true)}
            className="bg-white border border-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-500 font-bold text-[12px] shadow-sm hover:bg-slate-50 transition-colors"
          >
            <HelpCircle size={16} />
            <span>Bantuan</span>
          </motion.button>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/demo/mobile/notifications')}
            className="relative cursor-pointer"
          >
            <div className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
              <Bell size={20} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F1416C] text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {/* Total Tugas Saya - Next Level Unified Widget */}
        <motion.section variants={itemVariants} className="px-6 mb-8 mt-4">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[32px] p-7 text-white shadow-[0_12px_40px_rgba(15,23,42,0.4)] overflow-hidden"
          >
            {/* Glowing Ambient Background Orbs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#0095E8] rounded-full mix-blend-screen filter blur-[60px] opacity-40"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#50CD89] rounded-full mix-blend-screen filter blur-[60px] opacity-30"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white/80 text-[12px] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                  <Activity size={16} className="text-[#0095E8]" />
                  Ringkasan Performa
                </h3>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10">
                  <PieChart size={14} className="text-white/80" />
                </div>
              </div>

              {/* Main Metric: Selesai */}
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[56px] font-black leading-none tracking-tighter">{taskStats.selesaiTepat + taskStats.selesaiLambat}</p>
                  <p className="text-white/60 text-[14px] font-bold mt-2">Total Diselesaikan</p>
                </div>
                <div className="flex flex-col gap-2 items-end pb-1">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <CheckCircle2 size={12} className="text-[#50CD89]" />
                    <span className="text-[11px] font-black text-white">{taskStats.selesaiTepat} Tepat</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <AlertCircle size={12} className="text-[#F1416C]" />
                    <span className="text-[11px] font-black text-white">{taskStats.selesaiLambat} Telat</span>
                  </div>
                </div>
              </div>

              {/* Sub Metrics: Terbuka & Proses */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div>
                  <p className="text-white/50 text-[10px] font-black mb-2 uppercase tracking-widest">Tugas Terbuka</p>
                  <div className="flex items-end gap-3">
                    <p className="text-[28px] font-black leading-none">{taskStats.terbuka}</p>
                    {taskStats.terbukaLambat > 0 ? (
                      <span className="text-[#F1416C] text-[9px] font-black bg-[#F1416C]/20 px-2 py-1 rounded-lg uppercase mb-1 border border-[#F1416C]/20">{taskStats.terbukaLambat} Telat</span>
                    ) : (
                      <span className="text-[#0095E8] text-[9px] font-black bg-[#0095E8]/20 px-2 py-1 rounded-lg uppercase mb-1 border border-[#0095E8]/20">Aman</span>
                    )}
                  </div>
                </div>
                
                <div className="pl-5 border-l border-white/10">
                  <p className="text-white/50 text-[10px] font-black mb-2 uppercase tracking-widest">Sedang Proses</p>
                  <div className="flex items-end gap-3">
                    <p className="text-[28px] font-black leading-none">{taskStats.berlangsung}</p>
                    {taskStats.berlangsungLambat > 0 ? (
                      <span className="text-[#F1416C] text-[9px] font-black bg-[#F1416C]/20 px-2 py-1 rounded-lg uppercase mb-1 border border-[#F1416C]/20">{taskStats.berlangsungLambat} Telat</span>
                    ) : (
                      <span className="text-[#FFC700] text-[9px] font-black bg-[#FFC700]/20 px-2 py-1 rounded-lg uppercase mb-1 border border-[#FFC700]/20">Aman</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Akses Cepat - Premium Section */}
        <motion.section variants={itemVariants} className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Akses Cepat</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/demo/mobile/checklist')}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0095E8]/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
              <div className="w-12 h-12 bg-blue-50 text-[#0095E8] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-active:bg-[#0095E8] group-active:text-white transition-colors">
                <FileText size={24} />
              </div>
              <h4 className="text-[15px] font-black text-slate-800 leading-tight">Mulai Audit</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Checklist Harian</p>
            </motion.div>

          </div>
        </motion.section>

        {/* Permintaan Departemen */}
        <motion.section variants={itemVariants} className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Permintaan Departemen</h3>
              {deptRequests.length > 0 && (
                <span className="bg-[#0095E8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {deptRequests.length}
                </span>
              )}
            </div>
          </div>
          
          {loadingRequests ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[1].map(i => (
                <div key={i} className="min-w-[280px] bg-slate-50 border border-slate-100 rounded-3xl p-5 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                </div>
              ))}
            </div>
          ) : deptRequests.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm">
              <p className="text-slate-400 text-[13px] font-medium">Tidak ada permintaan tugas baru.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6">
              {sortedDeptRequests.map((req) => (
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  key={req.id} 
                  onClick={() => navigate(`/demo/mobile/dept-task/${req.id}`)}
                  className="min-w-[280px] bg-white border border-slate-100 rounded-3xl p-5 shadow-sm cursor-pointer relative overflow-hidden"
                >
                  <div className="flex gap-2 mb-4">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${
                      req.status === 'Baru' ? 'bg-[#F1FAFF] text-[#0095E8]' : 'bg-[#FFF8DD] text-[#FFC700]'
                    }`}>
                      {req.status}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${
                      req.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {req.urgensi}
                    </span>
                  </div>
                  <h4 className="font-black text-[15px] text-slate-800 mb-2 line-clamp-1">{req.nama_wo}</h4>
                  <p className="text-[13px] text-slate-500 mb-5 line-clamp-2 leading-relaxed">
                    {req.deskripsi}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F5F8FA] flex items-center justify-center text-[10px] font-black text-[#0095E8] uppercase">
                        {req.departemen_asal?.substring(0, 2)}
                      </div>
                      <span className="text-[12px] font-bold text-slate-500">{req.departemen_asal}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Manajemen ASET */}
        <motion.section variants={itemVariants} className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Manajemen ASET</h3>
              <span className="bg-[#FFF8DD] text-[#FFC700] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Beta</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'hak-akses', label: 'Hak Akses Aset', icon: <Lock size={20} />, color: 'text-blue-500', bg: 'bg-blue-50', path: '/demo/mobile/aset/hak-akses' },
              { id: 'register', label: 'Register Aset', icon: <Database size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/demo/mobile/aset/register' },
              { id: 'monitoring', label: 'Monitoring Aset', icon: <Activity size={20} />, color: 'text-purple-500', bg: 'bg-purple-50', path: '/demo/mobile/aset/monitoring' },
            ].map(item => (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={item.id}
                onClick={() => navigate(item.path)}
                className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800 leading-tight">{item.label}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pengembangan</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-active:text-slate-500 transition-colors" />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tugas Departemen */}
        <motion.section variants={itemVariants} className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Tugas Departemen</h3>
            <Info size={16} className="text-slate-300" />
          </div>
          
          {loadingTasks ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2].map(i => (
                <div key={i} className="min-w-[280px] bg-slate-50 border border-slate-100 rounded-3xl p-5 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : deptTasks.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center shadow-sm">
              <p className="text-slate-400 text-[13px] font-medium">Tidak ada tugas terbuka di departemen Anda.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6">
              {sortedDeptTasks.map((task) => (
                <motion.div 
                  whileTap={{ scale: 0.95 }}
                  key={task.id} 
                  onClick={() => navigate(`/demo/mobile/task/${task.id}`)}
                  className="min-w-[280px] bg-white border border-slate-100 rounded-3xl p-5 shadow-sm cursor-pointer"
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${
                      (task.progres === 'Berlangsung' || task.progres === 'Menunggu Material') ? 'bg-[#FFF8DD] text-[#FFC700]' : 
                      task.progres === 'Selesai' ? 'bg-[#E8FFF3] text-[#50CD89]' :
                      'bg-[#F1FAFF] text-[#0095E8]'
                    }`}>
                      {task.progres === 'Menunggu Material' ? 'Cek Material' : (task.progres || 'Terbuka')}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${
                      task.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C]' : 
                      task.urgensi === 'Normal' ? 'bg-[#E3F2FD] text-[#1E88E5]' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {task.urgensi}
                    </span>
                    {task.jenis_tugas === 'wo' ? (
                      <span className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase bg-[#F8E3FF] text-[#7239EA]">
                        WO
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase bg-slate-100 text-slate-600">
                        Checklist
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-[15px] text-slate-800 mb-4 line-clamp-1">{task.nomor_perintah_kerja ? `${task.nomor_perintah_kerja} - ` : ''}{task.nama_tugas}</h4>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mulai</p>
                    <p className="text-[13px] font-black text-slate-600">
                      {formatDate(task.tanggal_mulai, task.waktu_mulai)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>


        {/* Tugas Hari ini */}
        <motion.section variants={itemVariants} className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Tugas Hari ini</h3>
          </div>

          {loadingToday ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 animate-pulse text-center">
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-20 bg-slate-50 rounded"></div>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
               <p className="text-slate-400 text-[13px] font-medium">Tidak ada tugas berlangsung untuk hari ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTodayTasks.map((task) => {
                const now = new Date();
                const deadline = new Date(`${task.tanggal_selesai} ${task.waktu_selesai}`);
                const isLate = deadline < now;

                return (
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    key={task.id}
                    onClick={() => navigate(`/demo/mobile/task/${task.id}`)}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer"
                  >
                    <div className="flex flex-wrap">
                      <span className="bg-[#FFF8DD] text-[#FFC700] text-[10px] font-black px-4 py-2 uppercase">
                        {task.progres === 'Menunggu Material' ? 'Cek Material' : 'Berlangsung'}
                      </span>
                      <span className={`text-white text-[10px] font-black px-4 py-2 uppercase ${
                        task.urgensi === 'Kritis' ? 'bg-[#F1416C]' : 
                        task.urgensi === 'Tinggi' ? 'bg-[#1E88E5]' : 'bg-[#283593]'
                      }`}>
                        Urgensi {task.urgensi}
                      </span>
                      {isLate && (
                        <span className="bg-[#FFF5F8] text-[#F1416C] text-[10px] font-black px-4 py-2 border-l border-[#F1416C]/10 uppercase">Terlambat</span>
                      )}
                      {task.jenis_tugas === 'wo' ? (
                        <span className="bg-[#F8E3FF] text-[#7239EA] text-[10px] font-black px-4 py-2 border-l border-[#7239EA]/10 uppercase">WO</span>
                      ) : (
                        <span className="bg-[#F1FAFF] text-[#0095E8] text-[10px] font-black px-4 py-2 border-l border-[#0095E8]/10 uppercase">Checklist</span>
                      )}
                    </div>
                    <div className="p-5">
                      <h4 className="font-black text-[16px] text-slate-800 mb-5 leading-snug">
                        {task.nomor_perintah_kerja ? `${task.nomor_perintah_kerja} - ` : (task.id_tugas ? `${task.id_tugas}: ` : '')}{task.nama_tugas}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mulai</p>
                          <p className="text-[13px] font-black text-slate-700 mt-0.5">
                            {formatDate(task.tanggal_mulai, task.waktu_mulai)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Berakhir</p>
                          <p className="text-[13px] font-black text-[#F1416C] mt-0.5">
                            {formatDate(task.tanggal_selesai, task.waktu_selesai)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/demo/mobile/tasks')}
            className="w-full mt-6 py-3 bg-white border border-slate-200 text-[#0095E8] rounded-2xl font-bold text-[14px] shadow-sm hover:bg-slate-50 transition-colors"
          >
            Lihat Semua Tugas
          </motion.button>
        </motion.section>
      </motion.div>

      {/* Hubungi Admin Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowHelpModal(false)}
            />
            
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] p-6 pb-12 shadow-2xl max-w-md mx-auto"
              style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[20px] font-black text-[#181C32]">Hubungi Admin</h3>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {/* WhatsApp Option */}
                <motion.a 
                  whileTap={{ scale: 0.96 }}
                  href="https://wa.me/62800000000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-[#F2FBF5] border border-[#25D366]/20 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" fill="#25D366" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-bold text-slate-700">Kirim pesan WhatsApp</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </motion.a>

                {/* Phone Option */}
                <motion.a 
                  whileTap={{ scale: 0.96 }}
                  href="tel:+62800000000000" 
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-500">
                      <Phone size={20} />
                    </div>
                    <span className="text-[14px] font-bold text-slate-700">Telepon Sekarang</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </motion.a>
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

export default MobileHome;
