import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, Info, Clock, ChevronRight, X, Phone, FileText, CheckCircle2, PlayCircle, AlertCircle, Activity, PieChart, Package, Database, Lock, ClipboardList, CheckSquare, History, ShieldCheck, Zap, Droplets, FileBarChart, Wrench, FileClock, User, QrCode } from 'lucide-react';
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
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

  const formattedTime = currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const userRole = user?.role?.toUpperCase() || 'STAF';
  const userDept = user?.department || 'Umum';
  const companyName = user?.company_name || 'PamFlow Workspace';
  const canApprove = user?.can_approve === 1 || user?.can_approve === true;

  const handleMenuClick = (path) => {
    if (path.startsWith('/')) {
      navigate(path);
    } else {
      alert(path);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  };

  return (
    <div className="bg-[#F5F8FA] min-h-screen font-sans flex flex-col relative overflow-x-hidden pb-10">
      
      {/* Top Header Section */}
      <div 
        className="px-6 flex items-center justify-between sticky top-0 z-30 transition-all pt-6 pb-4 bg-[#F5F8FA]/90 backdrop-blur-md"
        style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}
      >
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-slate-400 text-[12px] font-bold">{getGreeting()}</p>
          <h2 className="text-[18px] font-black text-slate-800 tracking-tight">{firstName}</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelpModal(true)}
            className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Phone size={18} />
          </motion.button>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/demo/mobile/notifications')}
            className="relative cursor-pointer"
          >
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-50 transition-colors">
              <Bell size={20} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F1416C] text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-5 flex-1 z-10">
        
        {/* Ringkasan Performa Widget (PamFlow Original Theme) */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#0095E8] to-[#283593] rounded-[28px] p-6 mb-8 shadow-[0_12px_32px_rgba(0,149,232,0.2)] relative overflow-hidden text-white mt-2">
          {/* Decorative shapes */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white/90 text-[13px] font-black tracking-widest uppercase flex items-center gap-2">
                <Activity size={16} className="text-white" />
                Performa Tugas
              </h3>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <span className="text-[10px] font-bold">Bulan Ini</span>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-6">
              <div>
                <p className="text-[48px] font-black leading-none tracking-tighter drop-shadow-sm">{taskStats.selesaiTepat + taskStats.selesaiLambat}</p>
                <p className="text-white/70 text-[12px] font-bold mt-1">Total Diselesaikan</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/70 text-[10px] font-black mb-1 uppercase tracking-widest">Terbuka</p>
                <div className="flex items-end gap-2">
                  <p className="text-[20px] font-black leading-none">{taskStats.terbuka}</p>
                  {taskStats.terbukaLambat > 0 && (
                    <span className="text-[#F1416C] text-[8px] font-black bg-white px-1.5 py-0.5 rounded-md uppercase mb-0.5">{taskStats.terbukaLambat} Telat</span>
                  )}
                </div>
              </div>
              
              <div className="pl-4 border-l border-white/20">
                <p className="text-white/70 text-[10px] font-black mb-1 uppercase tracking-widest">Berlangsung</p>
                <div className="flex items-end gap-2">
                  <p className="text-[20px] font-black leading-none">{taskStats.berlangsung}</p>
                  {taskStats.berlangsungLambat > 0 && (
                    <span className="text-[#F1416C] text-[8px] font-black bg-white px-1.5 py-0.5 rounded-md uppercase mb-0.5">{taskStats.berlangsungLambat} Telat</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Grid Menu - The Neatly Separated Module Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-y-7 gap-x-2">
          
          {/* Item: Mulai Checklist */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/checklist')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-active:bg-slate-50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#0095E8]/10 rounded-full -mr-4 -mt-4"></div>
              <ClipboardList size={26} className="text-[#0095E8] relative z-10" />
            </div>
            <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Mulai<br/>Checklist</span>
          </div>

          {/* Item: Riwayat Checklist */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/checklist-riwayat')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-active:bg-slate-50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#50CD89]/10 rounded-full -mr-4 -mt-4"></div>
              <History size={26} className="text-[#50CD89] relative z-10" />
            </div>
            <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Riwayat<br/>Checklist</span>
          </div>

          {/* Item: Daftar Tugas */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/tasks')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative group-active:bg-slate-50 transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#FFC700]/10 rounded-full -mr-4 -mt-4"></div>
              <FileText size={26} className="text-[#FFC700] relative z-10" />
              {(unreadCount > 0 || taskStats.terbuka > 0) && (
                 <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F1416C] rounded-full border-2 border-white z-20"></span>
              )}
            </div>
            <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Daftar<br/>Tugas</span>
          </div>

          {/* Item: Catat Listrik */}
          <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/utility-listrik')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-active:bg-slate-50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#7239EA]/10 rounded-full -mr-4 -mt-4"></div>
              <Zap size={26} className="text-[#7239EA] relative z-10" />
            </div>
            <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Catat<br/>Listrik</span>
          </div>

          {/* Item: Monitoring Aset (Conditional) */}
          {(user?.role?.toLowerCase() === 'super admin' || user?.permissions?.['aset_menu']?.includes('Lihat')) && (
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/aset')}>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-active:bg-slate-50 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#1E88E5]/10 rounded-full -mr-4 -mt-4"></div>
                <Package size={26} className="text-[#1E88E5] relative z-10" />
              </div>
              <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Monitoring<br/>Aset</span>
            </div>
          )}

          {/* Item: Approval (Conditional) */}
          {canApprove && (
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => handleMenuClick('/demo/mobile/approvals')}>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-active:bg-slate-50 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#F1416C]/10 rounded-full -mr-4 -mt-4"></div>
                <ShieldCheck size={26} className="text-[#F1416C] relative z-10" />
              </div>
              <span className="text-slate-600 text-[10px] font-bold text-center leading-tight">Persetujuan<br/>Dokumen</span>
            </div>
          )}

          {/* Item: Catat Air (Disabled) */}
          <div className="flex flex-col items-center gap-2 cursor-pointer opacity-60" onClick={() => handleMenuClick('Modul Catat Air sedang dikembangkan.')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#00BCD4]/10 rounded-full -mr-4 -mt-4"></div>
              <Droplets size={26} className="text-[#00BCD4] relative z-10" />
            </div>
            <span className="text-slate-400 text-[10px] font-bold text-center leading-tight">Catat<br/>Air</span>
          </div>

          {/* Item: Laporan (Disabled/Coming Soon) */}
          <div className="flex flex-col items-center gap-2 cursor-pointer opacity-60" onClick={() => handleMenuClick('Modul Laporan sedang dikembangkan.')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#FF9800]/10 rounded-full -mr-4 -mt-4"></div>
              <FileBarChart size={26} className="text-[#FF9800] relative z-10" />
            </div>
            <span className="text-slate-400 text-[10px] font-bold text-center leading-tight">Laporan<br/>Performa</span>
          </div>

        </motion.div>
      </motion.div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
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
                <h3 className="text-[20px] font-black text-slate-800">Hubungi Bantuan</h3>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
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
