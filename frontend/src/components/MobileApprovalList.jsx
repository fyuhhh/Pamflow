import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ChevronRight, Clock, User, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { authFetch } from '../services/api';

const MobileApprovalList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingTasks, setPendingTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchPendingTasks = useCallback(async () => {
    try {
      const response = await authFetch(
        `/api/tasks/pending-approval?company_id=${user?.company_id}&departemen=${encodeURIComponent(user?.department || '')}`
      );
      if (response.ok) {
        const data = await response.json();
        setPendingTasks(data);
      }
    } catch (err) {
      console.error('Error fetching pending approval tasks:', err);
    }
  }, [user?.company_id, user?.department]);

  const fetchHistoryTasks = useCallback(async () => {
    try {
      const response = await authFetch(
        `/api/tasks/approval-history?company_id=${user?.company_id}&departemen=${encodeURIComponent(user?.department || '')}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistoryTasks(data);
      }
    } catch (err) {
      console.error('Error fetching approval history:', err);
    }
  }, [user?.company_id, user?.department]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingTasks(), fetchHistoryTasks()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPendingTasks, fetchHistoryTasks]);

  const getUrgencyColor = (urgensi) => {
    switch (urgensi) {
      case 'Kritis': return { bg: '#FFF5F8', text: '#F1416C', border: '#F1416C' };
      case 'Normal': return { bg: '#EEF6FF', text: '#0095E8', border: '#0095E8' };
      case 'Rendah': return { bg: '#F1FAFF', text: '#7239EA', border: '#7239EA' };
      default: return { bg: '#F9F9F9', text: '#A1A5B7', border: '#A1A5B7' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const currentTasks = activeTab === 'pending' ? pendingTasks : historyTasks;

  const renderPendingCard = (task) => {
    const urgency = getUrgencyColor(task.urgensi);
    return (
      <div
        key={task.id}
        onClick={() => navigate(`/demo/mobile/approval/${task.id}`, { state: { task } })}
        className="bg-white rounded-xl border border-[#F1F1F4] p-4 active:bg-[#F9F9F9] transition-colors"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Agent Name */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#0095E8] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold">
              {(task.agent_name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#181C32] truncate">{task.agent_name || '-'}</p>
            <p className="text-[10px] text-[#A1A5B7]">Meminta persetujuan</p>
          </div>
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap"
            style={{ backgroundColor: urgency.bg, color: urgency.text, border: `1px solid ${urgency.border}20` }}
          >
            {task.urgensi}
          </span>
        </div>

        {/* Task Info */}
        <div className="bg-[#F8FAFC] rounded-lg p-3 mb-3">
          <h3 className="text-[13px] font-bold text-[#181C32] leading-tight">{task.nama_tugas}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#A1A5B7]">{task.nomor_perintah_kerja}</span>
            {task.jenis_tugas === 'wo' ? (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#7239EA] bg-[#F8E3FF]">WO</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#0095E8] bg-[#F1FAFF]">Checklist</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[#B5B5C3]" />
              <span className="text-[10px] text-[#7E8299]">{formatDate(task.waktu_selesai_aktual)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User size={11} className="text-[#B5B5C3]" />
              <span className="text-[10px] text-[#7E8299]">{task.departemen}</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#B5B5C3]" />
        </div>
      </div>
    );
  };

  const renderHistoryCard = (task) => {
    const isApproved = task.ta_status === 'Approved';
    return (
      <div
        key={`${task.id}-${task.approved_at}`}
        onClick={() => navigate(`/demo/mobile/approval/${task.id}`, { state: { task } })}
        className="bg-white rounded-xl border border-[#F1F1F4] p-4 active:bg-[#F9F9F9] transition-colors"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Agent + Status */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isApproved ? 'bg-[#E8F5E9]' : 'bg-[#FFF5F8]'}`}>
            {isApproved ? (
              <CheckCircle2 size={16} className="text-[#2E7D32]" />
            ) : (
              <XCircle size={16} className="text-[#F1416C]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#181C32] truncate">{task.agent_name || '-'}</p>
            <p className="text-[10px] text-[#A1A5B7]">
              {isApproved ? 'Disetujui' : 'Ditolak'} oleh {task.approved_by_name || '-'}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
            isApproved ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF5F8] text-[#F1416C]'
          }`}>
            {isApproved ? 'Disetujui' : 'Ditolak'}
          </span>
        </div>

        {/* Task Info */}
        <div className="bg-[#F8FAFC] rounded-lg p-3 mb-3">
          <h3 className="text-[13px] font-bold text-[#181C32] leading-tight">{task.nama_tugas}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[#A1A5B7]">{task.nomor_perintah_kerja}</span>
            {task.jenis_tugas === 'wo' ? (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#7239EA] bg-[#F8E3FF]">WO</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-[#0095E8] bg-[#F1FAFF]">Checklist</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[#B5B5C3]" />
              <span className="text-[10px] text-[#7E8299]">{formatDate(task.approved_at)}</span>
            </div>
            {task.approval_notes && (
              <span className="text-[10px] text-[#A1A5B7] italic truncate max-w-[150px]">"{task.approval_notes}"</span>
            )}
          </div>
          <ChevronRight size={16} className="text-[#B5B5C3]" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0066B8 0%, #0095E8 100%)',
        paddingTop: 'env(safe-area-inset-top, 20px)',
      }}>
        <div className="px-5 pb-0 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[20px] font-bold text-white tracking-tight">Approval Tugas</h1>
              <p className="text-[13px] text-white/70 mt-0.5">
                {pendingTasks.length} menunggu · {historyTasks.length} riwayat
              </p>
            </div>
            <button 
              onClick={async () => {
                setLoading(true);
                await Promise.all([fetchPendingTasks(), fetchHistoryTasks()]);
                setLoading(false);
              }}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25"
            >
              <RefreshCw size={18} className="text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('pending')}
              className="flex-1 py-2.5 text-[13px] font-bold text-center transition-all relative"
              style={{
                color: activeTab === 'pending' ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              Menunggu Approval
              {pendingTasks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {pendingTasks.length}
                </span>
              )}
              {activeTab === 'pending' && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="flex-1 py-2.5 text-[13px] font-bold text-center transition-all relative"
              style={{
                color: activeTab === 'history' ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            >
              Riwayat
              {historyTasks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {historyTasks.length}
                </span>
              )}
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#0095E8] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#A1A5B7] mt-3">Memuat data...</p>
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#F1FAFF] flex items-center justify-center mb-3">
              <ClipboardCheck size={28} className="text-[#0095E8]" />
            </div>
            <p className="text-[15px] font-bold text-[#181C32]">
              {activeTab === 'pending' ? 'Tidak ada tugas' : 'Belum ada riwayat'}
            </p>
            <p className="text-[13px] text-[#A1A5B7] mt-1">
              {activeTab === 'pending' ? 'Semua tugas sudah diproses' : 'Tugas yang sudah disetujui/ditolak akan muncul di sini'}
            </p>
          </div>
        ) : (
          currentTasks.map((task) =>
            activeTab === 'pending' ? renderPendingCard(task) : renderHistoryCard(task)
          )
        )}
      </div>
    </div>
  );
};

export default MobileApprovalList;
