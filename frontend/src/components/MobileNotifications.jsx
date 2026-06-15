import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, BellOff, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { getSocket } from '../services/socket';

const MobileNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Read task IDs from localStorage
  const getReadTasks = () => {
    const saved = localStorage.getItem('pamflow_read_tasks');
    return saved ? JSON.parse(saved) : [];
  };

  const [readTaskIds, setReadTaskIds] = useState(getReadTasks());
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }

    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => fetchNotifications();
      socket.on('task-created', handleRefresh);
      socket.on('dept-task-updated', handleRefresh);

      return () => {
        socket.off('task-created', handleRefresh);
        socket.off('dept-task-updated', handleRefresh);
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch both standard tasks and accepted dept requests
      const [tasksRes, deptRes] = await Promise.all([
        authFetch(`/api/tasks?agent_id=${user.id}&departemen=${user.department}&company_id=${user.company_id}`),
        authFetch(`/api/department-tasks?departemen_tujuan=${encodeURIComponent(user.department)}&company_id=${user.company_id}`)
      ]);

      let allNotifications = [];

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        allNotifications = [...allNotifications, ...tasks.map(t => ({ ...t, type: 'standard' }))];
      }

      if (deptRes.ok) {
        const deptTasks = await deptRes.json();
        // Only include those accepted but not yet converted (Menunggu Pengerjaan)
        const accepted = deptTasks
          .filter(dt => dt.status === 'Menunggu Pengerjaan')
          .map(dt => ({
            id: `dept-${dt.id}`,
            dept_task_id: dt.id,
            nama_tugas: dt.nama_wo,
            deskripsi: dt.deskripsi,
            created_at: dt.waktu_diterima || dt.created_at,
            type: 'dept_accepted',
            departemen_asal: dt.departemen_asal
          }));
        allNotifications = [...allNotifications, ...accepted];
      }

      // Sort by date
      allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (taskId) => {
    if (!readTaskIds.includes(taskId)) {
      const newReadIds = [...readTaskIds, taskId];
      setReadTaskIds(newReadIds);
      localStorage.setItem('pamflow_read_tasks', JSON.stringify(newReadIds));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const uniqueIds = Array.from(new Set([...readTaskIds, ...allIds]));
    setReadTaskIds(uniqueIds);
    localStorage.setItem('pamflow_read_tasks', JSON.stringify(uniqueIds));
  };

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-white z-40 px-6 pb-4 pt-8 flex items-center justify-between border-b border-slate-200 shadow-sm"
              style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">Notifikasi</h1>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-[12px] font-bold text-[#0095E8] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-10">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <BellOff size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada notifikasi</h3>
            <p className="text-slate-400 text-center text-sm">Tugas baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map((notif) => {
              const isRead = readTaskIds.includes(notif.id);
              return (
                <div 
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.type === 'dept_accepted') {
                      navigate(`/demo/mobile/task/new/form?dept_task_id=${notif.dept_task_id}`);
                    } else {
                      navigate(`/demo/mobile/task/${notif.id}`);
                    }
                  }}
                  className={`px-6 py-5 flex gap-4 cursor-pointer transition-colors active:bg-slate-50 ${
                    isRead ? 'bg-white' : 'bg-[#F0F9FF]'
                  }`}
                >
                  {/* Icon Bag */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isRead ? 'bg-slate-100 text-slate-400' : 
                    notif.type === 'dept_accepted' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#E0F2FE] text-[#0095E8]'
                  }`}>
                    <Bell size={22} strokeWidth={isRead ? 2 : 2.5} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isRead ? 'text-slate-400' : 
                        notif.type === 'dept_accepted' ? 'text-[#10B981]' : 'text-[#0095E8]'
                      }`}>
                        {notif.type === 'dept_accepted' ? 'Permintaan Diterima' : 'Tugas Baru'}
                        {notif.type === 'standard' && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-[9px] font-bold ${
                            notif.jenis_tugas === 'wo' ? 'bg-[#F8E3FF] text-[#7239EA]' : 'bg-[#F1FAFF] text-[#0095E8]'
                          }`}>
                            {notif.jenis_tugas === 'wo' ? 'WO' : 'Checklist'}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    <h4 className={`text-[15px] mb-1 line-clamp-1 ${
                      isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'
                    }`}>
                      {notif.nama_tugas}
                    </h4>
                    <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.type === 'dept_accepted' 
                        ? `Permintaan dari ${notif.departemen_asal} telah diterima. Klik untuk membuat laporan tugas agen.`
                        : (notif.deskripsi || 'Anda telah ditugaskan untuk tugas baru ini. Silakan cek detail tugas.')}
                    </p>
                  </div>


                  {/* Blue Indicator Dot */}
                  {!isRead && (
                    <div className="flex flex-col justify-center">
                      <div className="w-2.5 h-2.5 bg-[#0095E8] rounded-full shadow-[0_0_8px_rgba(0,149,232,0.5)]"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileNotifications;
