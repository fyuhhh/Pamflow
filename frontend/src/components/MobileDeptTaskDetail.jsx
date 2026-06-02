import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, FileText, CheckCircle2, Clock, User, Building, AlertCircle } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authFetch } from '../services/api';

const MobileDeptTaskDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const id = params.id || location.pathname.split('/').pop();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      const response = await authFetch(`/api/department-tasks/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      }
    } catch (error) {
      console.error('Error fetching task detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Tidak diset';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-10 text-center">
        <AlertCircle size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Tugas tidak ditemukan</h3>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#0095E8] font-bold">Kembali</button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 bg-white z-40 px-6 py-4 flex items-center gap-4 border-b border-slate-50 shadow-sm"
              style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:scale-95 transition-transform">
          <ArrowLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Detail Permintaan</h1>
      </header>

      <div className="px-6 pt-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
        {/* Status & ID */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${
              task.status === 'Baru' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
              task.status === 'Menunggu Pengerjaan' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-green-50 text-green-600 border border-green-100'
            }`}>
              {task.status}
            </span>
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest ${
              task.urgensi === 'Kritis' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
            }`}>
              {task.urgensi || 'Normal'}
            </span>
          </div>
          <span className="text-[12px] font-bold text-slate-300">REQ-{task.id}</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">{task.nama_wo}</h2>
          <div className="flex items-center gap-2 text-slate-400">
            <Building size={16} />
            <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
              {task.departemen_asal} &rarr; {task.departemen_tujuan}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm mt-4">
            <h4 className="text-[11px] uppercase font-bold text-slate-300 mb-2">Deskripsi Kerja</h4>
            <p className="text-[14px] text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {task.deskripsi || 'Tidak ada deskripsi detail.'}
            </p>
          </div>

          {/* Info Banner for New Tasks */}
          {task.status === 'Baru' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-blue-700">Tugas Baru</p>
                <p className="text-[12px] text-blue-600 leading-relaxed">Tugas ini belum diambil. Tekan "Ambil & Mulai" untuk mengerjakannya sekarang.</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300 mb-1">Mulai</p>
              <p className="text-[13px] font-bold text-slate-700">{formatDate(task.tanggal_mulai)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-50 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300 mb-1">Selesai</p>
              <p className="text-[13px] font-bold text-slate-700">{formatDate(task.tanggal_selesai)}</p>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-[#1B3B6F] rounded-[24px] p-6 text-white overflow-hidden relative shadow-lg">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <MapPin size={22} />
              </div>
              <p className="text-[15px] font-bold">{task.lokasi || 'Lokasi Pekerjaan'}</p>
            </div>
            <p className="text-[12px] text-white/70 leading-relaxed pl-13">
              {task.detail_alamat || '-'}
            </p>
          </div>
          <MapPin size={100} className="absolute -right-6 -bottom-6 text-white/5" />
        </div>

        {/* GREEN BOX - IF ACCEPTED */}
        {(task.status === 'Menunggu Pengerjaan' || task.status === 'Berlangsung' || task.status === 'Selesai') && (
          <div className="bg-[#E8FFF3] border border-[#50CD89]/30 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#50CD89]/20">
              <div className="w-10 h-10 rounded-xl bg-[#50CD89] flex items-center justify-center text-white shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#1B3B6F]">Pekerjaan Diterima</h4>
                <p className="text-[11px] text-[#50CD89] font-bold uppercase tracking-widest">{task.status}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-600">
                  <User size={16} className="text-[#50CD89]" />
                  <span className="text-[13px] font-medium">Diterima oleh</span>
                </div>
                <span className="text-[13px] font-bold text-slate-800">{task.accepted_by_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={16} className="text-[#50CD89]" />
                  <span className="text-[13px] font-medium">Waktu Diterima</span>
                </div>
                <span className="text-[13px] font-bold text-slate-800">
                  {formatDate(task.waktu_diterima)}, {formatTime(task.waktu_diterima)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDeptTaskDetail;
