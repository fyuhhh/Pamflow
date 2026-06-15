import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Clock, MapPin, FileText, User, Building2, Hash, History, Image, X } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import API_URL from '../config';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authFetch } from '../services/api';

const MobileApprovalDetail = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  // URL format: /demo/mobile/approval/123
  const taskId = params.taskId || pathParts[pathParts.length - 1];
  const [task, setTask] = useState(location.state?.task || null);
  const [loading, setLoading] = useState(!task);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('#2E7D32');
  const [auditLogs, setAuditLogs] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const isImageFile = (filename) => {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  };

  useEffect(() => {
    fetchTask();
    fetchAuditLogs();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        if (!data.is_dept_dispatch_approval) {
          // Also fetch history for agent name
          const histResponse = await authFetch(`/api/tasks/${taskId}/history`);
          if (histResponse.ok) {
            const history = await histResponse.json();
            const lastEntry = history.find(h => h.progres === 'Menunggu Approval' || h.progres === 'Menunggu Approval Penyelesaian') || history[0];
            data.agent_name = lastEntry?.nama_agen || '-';
            data.history_waktu_mulai = lastEntry?.waktu_mulai;
            data.history_waktu_selesai = lastEntry?.waktu_selesai;
          }
        }
        setTask(data);
      }
    } catch (err) {
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await authFetch(`/api/audit-logs/task/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleApproveTask = async () => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({
          approval_status: 'Approved',
          user_id: user?.id,
          user_name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Approver',
          notes: approvalNotes || 'Tugas disetujui'
        })
      });
      if (response.ok) {
        setBannerColor('#2E7D32');
        setBannerText('Tugas telah disetujui');
        setShowBanner(true);
        setTimeout(() => navigate('/demo/mobile/approvals'), 1500);
      }
    } catch (err) {
      console.error('Error approving task:', err);
    }
    setShowApprovalModal(false);
    setApprovalNotes('');
  };

  const handleRejectTask = async () => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({
          approval_status: 'Rejected',
          user_id: user?.id,
          user_name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Approver',
          notes: approvalNotes || 'Tugas ditolak'
        })
      });
      if (response.ok) {
        setBannerColor('#F1416C');
        setBannerText('Tugas telah ditolak');
        setShowBanner(true);
        setTimeout(() => navigate('/demo/mobile/approvals'), 1500);
      }
    } catch (err) {
      console.error('Error rejecting task:', err);
    }
    setShowApprovalModal(false);
    setApprovalNotes('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      if (typeof timeStr === 'string' && timeStr.includes(':')) return timeStr.substring(0, 5);
      return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return ''; }
  };

  const formatDateTime = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return '-'; }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '-';
    try {
      const ms = new Date(end) - new Date(start);
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return '< 1 Menit';
      if (mins < 60) return `${mins} Menit`;
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs} Jam ${remainMins > 0 ? remainMins + ' Menit' : ''}`;
    } catch { return '-'; }
  };

  // Parse submission_data and details
  const getSubmissionData = () => {
    if (!task?.submission_data) return {};
    return typeof task.submission_data === 'string' ? JSON.parse(task.submission_data) : task.submission_data;
  };

  const getTaskDetails = () => {
    if (!task?.details) return [];
    return typeof task.details === 'string' ? JSON.parse(task.details) : task.details;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-10 text-center bg-white min-h-screen">
        <p className="text-slate-500">Tugas tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-bold">Kembali</button>
      </div>
    );
  }

  const submissionData = getSubmissionData();
  const taskDetails = getTaskDetails();

  return (
    <>
      {/* Success/Error Banner */}
      {showBanner && (
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] text-white flex items-center justify-center gap-3 shadow-2xl px-6 py-4"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))', backgroundColor: bannerColor, animation: 'banner-flow 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
            <Check size={14} style={{ color: bannerColor }} strokeWidth={3} />
          </div>
          <span className="font-bold text-[14px] leading-tight">{bannerText}</span>
        </div>
      )}

      <div className="bg-white font-sans min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white z-40 px-6 pb-4 pt-8 flex items-center gap-3 border-b border-slate-200 shadow-sm"
                style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">Detail Approval</h1>
        </header>

        {/* Content */}
        <div className="px-5 pt-4 pb-28 space-y-5">

          {/* Agent Card */}
          <div className="bg-gradient-to-r from-[#0066B8] to-[#0095E8] rounded-xl p-4 text-white">
            <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Diajukan oleh</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-[16px]">
                {(task.agent_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[16px] font-bold">{task.agent_name || '-'}</p>
                <p className="text-[12px] text-white/70">
                  {task.is_dept_dispatch_approval ? `${task.departemen} → ${task.departemen_tujuan}` : task.departemen} · {task.nomor_perintah_kerja}
                </p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase ${
              task.progres === 'Selesai' || task.status === 'Baru' ? 'bg-[#E8FFF3] text-[#50CD89]' :
              task.progres === 'Ditolak' || task.status === 'Ditolak' ? 'bg-[#FFF5F8] text-[#F1416C]' :
              'bg-[#FFF8E1] text-[#FF8F00]'
            }`}>
              {task.ta_status === 'Approved' ? 'Disetujui' : task.ta_status === 'Rejected' ? 'Ditolak' : (task.progres === 'Menunggu Approval (Dikirim)' ? 'Menunggu Approval Kirim' : (task.progres || 'Menunggu Approval'))}
            </span>
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase ${
              task.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C]' : 'bg-[#E8EAF6] text-[#283593]'
            }`}>
              Urgensi {task.urgensi}
            </span>
            {(task.jenis_tugas || '').toLowerCase() === 'wo' ? (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase bg-[#F8E3FF] text-[#7239EA]">WO</span>
            ) : (
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase bg-[#F1FAFF] text-[#0095E8]">Checklist</span>
            )}
          </div>

          {/* Task Name */}
          <h2 className="text-[18px] font-bold text-[#181C32] leading-tight">{task.nama_tugas}</h2>

          {/* Informasi Umum */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
            <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Informasi Umum</h3>
            {[
              { icon: Building2, label: 'Perusahaan', value: task.perusahaan },
              task.is_dept_dispatch_approval
                ? { icon: Hash, label: 'Departemen Asal', value: task.departemen }
                : { icon: Hash, label: 'Departemen', value: task.departemen },
              task.is_dept_dispatch_approval && { icon: Hash, label: 'Departemen Tujuan', value: task.departemen_tujuan },
              { icon: FileText, label: 'Nomor Perintah Kerja', value: task.nomor_perintah_kerja },
              { icon: FileText, label: 'Deskripsi', value: task.deskripsi || '-' },
              { icon: MapPin, label: 'Lokasi', value: `${task.lokasi || '-'}${task.detail_alamat ? ', ' + task.detail_alamat : ''}` },
            ].filter(Boolean).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <item.icon size={14} className="text-[#B5B5C3] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#A1A5B7] font-medium">{item.label}</p>
                  <p className="text-[13px] text-[#3F4254] font-semibold mt-0.5 break-words">{item.value || '-'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Jadwal & Waktu Pengerjaan */}
          {!task.is_dept_dispatch_approval ? (
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Waktu Pengerjaan</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Jadwal Mulai</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDate(task.tanggal_mulai)} {formatTime(task.waktu_mulai)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Jadwal Selesai</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDate(task.tanggal_selesai)} {formatTime(task.waktu_selesai)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Waktu Dimulai</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDateTime(task.history_waktu_mulai || task.waktu_dimulai)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Waktu Diselesaikan</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDateTime(task.waktu_selesai_aktual)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E8ECF0]">
                <p className="text-[10px] text-[#A1A5B7]">Durasi Pengerjaan</p>
                <p className="text-[13px] font-bold text-[#0095E8] mt-0.5">
                  {calculateDuration(task.history_waktu_mulai || task.waktu_dimulai, task.waktu_selesai_aktual)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Jadwal Rencana</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Jadwal Mulai</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDate(task.tanggal_mulai)} {formatTime(task.waktu_mulai) || '08:00'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A5B7]">Jadwal Selesai</p>
                  <p className="text-[12px] font-semibold text-[#3F4254] mt-0.5">{formatDate(task.tanggal_selesai)} {formatTime(task.waktu_selesai) || '17:00'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lampiran Tugas */}
          {task.lampiran && (
            <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-4 py-3 bg-[#F9FEFF] border-b border-[#EFF2F5]">
                <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Lampiran Acuan</h3>
              </div>
              <div className="p-4 flex items-center gap-3">
                {isImageFile(task.lampiran) ? (
                  <div 
                    className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer"
                    onClick={() => setZoomedImage(getImageUrl(task.lampiran))}
                  >
                    <img 
                      src={getImageUrl(task.lampiran)} 
                      alt="Lampiran" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#FFF5F8] border border-[#FFD6E0] flex items-center justify-center shrink-0">
                    <FileText size={24} className="text-[#F1416C]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-700 truncate">
                    {task.lampiran.split('/').pop()}
                  </p>
                  <a 
                    href={`${API_URL}${task.lampiran}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#0095E8] font-bold mt-1 inline-block hover:underline"
                  >
                    Buka Dokumen ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Form yang diisi (Submission Data) - untuk approval setelah pengerjaan */}
          {!task.is_dept_dispatch_approval && taskDetails.length > 0 && (
            <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-4 py-3 bg-[#F9FEFF] border-b border-[#EFF2F5]">
                <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Hasil Pengerjaan</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {taskDetails.map((field, index) => {
                  const fieldKey = field.id || index;
                  const value = submissionData[fieldKey];
                  const isImage = field.bentuk_laporan === 'Image' || field.bentuk_laporan === 'Multiple Images';
                  
                  return (
                    <div key={fieldKey} className="px-4 py-3">
                      <p className="text-[10px] text-[#A1A5B7] font-medium uppercase">{field.nama_detail || `Tugas ${index + 1}`}</p>
                      <div className="mt-1.5">
                        {isImage ? (
                          value ? (
                            Array.isArray(value) ? (
                              <div className="grid grid-cols-3 gap-2">
                                {value.map((img, idx) => (
                                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setZoomedImage(getImageUrl(img))}>
                                    <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Lampiran ${idx + 1}`} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-[200px] rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setZoomedImage(getImageUrl(value))}>
                                <img src={getImageUrl(value)} className="w-full object-cover" alt="Lampiran" />
                              </div>
                            )
                          ) : (
                            <p className="text-[13px] text-[#A1A5B7] italic">Tidak ada gambar</p>
                          )
                        ) : (
                          <p className="text-[13px] text-[#3F4254] font-medium whitespace-pre-wrap">{value || '-'}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daftar Item Checklist (Template/Form) - untuk approval kirim checklist */}
          {task.is_dept_dispatch_approval && taskDetails.length > 0 && (
            <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-4 py-3 bg-[#F1FAFF] border-b border-[#EFF2F5]">
                <h3 className="text-[13px] font-bold text-[#0095E8] uppercase tracking-wider">Daftar Item Checklist</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {taskDetails.map((field, index) => (
                  <div key={field.id || index} className="px-4 py-3.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-bold text-[#3F4254]">
                        {index + 1}. {field.nama_detail || `Item ${index + 1}`}
                      </p>
                      {field.wajib_diisi && (
                        <span className="text-[9px] font-bold bg-[#FFF5F8] text-[#F1416C] px-1.5 py-0.5 rounded uppercase">
                          Wajib
                        </span>
                      )}
                    </div>
                    {field.deskripsi && (
                      <p className="text-[11px] text-[#7E8299]">{field.deskripsi}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-[#A1A5B7] bg-[#F5F8FA] px-2 py-0.5 rounded">
                        Tipe: {field.bentuk_laporan || 'Text Field'}
                      </span>
                      {field.bentuk_laporan === 'Pilihan Ganda' && field.options && field.options.length > 0 && (
                        <p className="text-[10px] text-[#7E8299] italic">
                          Opsi: {field.options.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Item Temuan / Subtugas (wo_items) for Dispatch Approval */}
          {task.is_dept_dispatch_approval && task.wo_items && task.wo_items.length > 0 && (
            <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-4 py-3 bg-[#FFF5F8] border-b border-[#EFF2F5]">
                <h3 className="text-[13px] font-bold text-[#F1416C] uppercase tracking-wider">Item Temuan / Subtugas</h3>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {task.wo_items.map((item, index) => (
                  <div key={index} className="px-4 py-4 space-y-2">
                    <p className="text-[13px] font-bold text-[#181C32]">{item.name}</p>
                    {item.original_notes && (
                      <p className="text-[12px] text-[#7E8299] bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-slate-100">
                        Catatan: {item.original_notes}
                      </p>
                    )}
                    {item.original_photos && item.original_photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {item.original_photos.map((photo, pIdx) => (
                          <div key={pIdx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setZoomedImage(getImageUrl(photo))}>
                            <img src={getImageUrl(photo)} className="w-full h-full object-cover" alt={`Lampiran ${pIdx + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verifikasi */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-2">
            <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Verifikasi & Keamanan</h3>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#A1A5B7]">Verifikasi Kehadiran (GPS)</span>
              <span className="text-[12px] font-semibold text-[#3F4254]">{task.verifikasi_kehadiran ? 'Ya' : 'Tidak'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#A1A5B7]">Selfie</span>
              <span className="text-[12px] font-semibold text-[#3F4254]">{task.selfie === 'Ya' || task.selfie === true || task.selfie === 'Wajib' ? 'Wajib' : 'Tidak Wajib'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#A1A5B7]">Persetujuan Atasan</span>
              <span className="text-[12px] font-semibold text-[#50CD89]">Wajib</span>
            </div>
          </div>

          {/* Riwayat Aktivitas */}
          {auditLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="px-4 py-3 bg-[#F9FEFF] border-b border-[#EFF2F5] flex items-center gap-2">
                <History size={14} className="text-[#0095E8]" />
                <h3 className="text-[13px] font-bold text-[#181C32] uppercase tracking-wider">Riwayat Aktivitas</h3>
              </div>
              <div className="p-4">
                <div className="space-y-0">
                  {auditLogs.map((log, idx) => {
                    const isLast = idx === auditLogs.length - 1;
                    const getActionColor = (action) => {
                      switch (action) {
                        case 'CREATE': return '#0095E8';
                        case 'START': return '#FF8F00';
                        case 'SUBMIT_FORM': return '#7239EA';
                        case 'FINISH': return '#50CD89';
                        case 'APPROVE': return '#2E7D32';
                        case 'REJECT': return '#F1416C';
                        case 'UPDATE': return '#0095E8';
                        default: return '#A1A5B7';
                      }
                    };
                    const getActionLabel = (action) => {
                      switch (action) {
                        case 'CREATE': return 'Tugas Dibuat';
                        case 'START': return 'Tugas Dimulai';
                        case 'SUBMIT_FORM': return 'Form Diisi';
                        case 'FINISH': return 'Diselesaikan';
                        case 'APPROVE': return 'Disetujui';
                        case 'REJECT': return 'Ditolak';
                        case 'UPDATE': return 'Diperbarui';
                        default: return action;
                      }
                    };
                    const color = getActionColor(log.action);

                    return (
                      <div key={log.id || idx} className="flex gap-3">
                        {/* Timeline dot & line */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                          {!isLast && <div className="w-[2px] flex-1 min-h-[32px] bg-[#E8ECF0]" />}
                        </div>
                        {/* Content */}
                        <div className={`flex-1 min-w-0 ${!isLast ? 'pb-4' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold" style={{ color }}>{getActionLabel(log.action)}</span>
                          </div>
                          <p className="text-[11px] text-[#7E8299] mt-0.5">
                            oleh <span className="font-semibold text-[#3F4254]">{log.user_name || '-'}</span>
                          </p>
                          {log.notes && (
                            <p className="text-[10px] text-[#A1A5B7] mt-0.5 italic">{log.notes}</p>
                          )}
                          <p className="text-[10px] text-[#B5B5C3] mt-0.5">
                            {formatDateTime(log.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {(task.progres === 'Menunggu Approval' || task.progres === 'Menunggu Approval (Dikirim)' || task.progres === 'Menunggu Approval Penyelesaian') ? (
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-3 flex gap-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: '6px' }}
          >
            <button
              onClick={() => { setApprovalAction('approve'); setShowApprovalModal(true); }}
              className="flex-1 bg-[#2E7D32] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={3} />
              Setujui
            </button>
            <button
              onClick={() => { setApprovalAction('reject'); setShowApprovalModal(true); }}
              className="flex-1 bg-[#F1416C] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              Tolak
            </button>
          </div>
        ) : (
          <div 
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: '6px' }}
          >
            <div className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] ${
              task.ta_status === 'Approved' || task.progres === 'Selesai' || task.status === 'Baru'
                ? 'bg-[#E8FFF3] text-[#2E7D32]'
                : 'bg-[#FFF5F8] text-[#F1416C]'
            }`}>
              {task.ta_status === 'Approved' || task.progres === 'Selesai' || task.status === 'Baru' ? (
                <><Check size={18} strokeWidth={3} /> {task.is_dept_dispatch_approval ? 'Pengiriman Disetujui' : 'Tugas Disetujui'}</>
              ) : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> {task.is_dept_dispatch_approval ? 'Pengiriman Ditolak' : 'Tugas Ditolak'}</>
              )}
            </div>
            {task.approved_by_name && (
              <p className="text-[11px] text-[#A1A5B7] text-center mt-2">
                oleh {task.approved_by_name} · {formatDate(task.approved_at)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-[90%] w-full shadow-lg mx-6" style={{ animation: 'slide-up 0.3s ease-out' }}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${approvalAction === 'approve' ? 'bg-[#E8F5E9]' : 'bg-[#FFF5F8]'}`}>
              <div className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center ${approvalAction === 'approve' ? 'border-[#C8E6C9]' : 'border-[#FCCCD5]'}`}>
                {approvalAction === 'approve' ? (
                  <Check size={20} className="text-[#2E7D32]" strokeWidth={3} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1416C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                )}
              </div>
            </div>

            <h3 className="text-xl font-medium text-[#181C32] mb-2">
              {approvalAction === 'approve'
                ? (task.is_dept_dispatch_approval ? 'Setujui Pengiriman?' : 'Setujui Tugas?')
                : (task.is_dept_dispatch_approval ? 'Tolak Pengiriman?' : 'Tolak Tugas?')}
            </h3>
            <p className="text-[13px] text-[#7E8299] mb-1 font-bold">{task.nama_tugas}</p>
            <p className="text-[12px] text-[#A1A5B7] mb-4">
              {approvalAction === 'approve'
                ? (task.is_dept_dispatch_approval
                  ? 'Tugas akan disetujui untuk dikirimkan ke departemen tujuan.'
                  : 'Tugas akan ditandai sebagai selesai dan tidak dapat diubah lagi.')
                : (task.is_dept_dispatch_approval
                  ? 'Pengiriman tugas ini akan ditolak.'
                  : 'Tugas akan dikembalikan ke agen untuk diperbaiki.')}
            </p>

            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={approvalAction === 'approve' ? 'Catatan approval (opsional)...' : 'Alasan penolakan (opsional)...'}
              className="w-full px-4 py-3 border border-[#F1F1F4] rounded-xl text-sm focus:outline-none focus:border-[#0095E8] mb-5 resize-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={approvalAction === 'approve' ? handleApproveTask : handleRejectTask}
                className={`flex-1 py-3 rounded-xl text-[14px] font-bold text-white active:scale-95 transition-transform ${
                  approvalAction === 'approve' ? 'bg-[#2E7D32]' : 'bg-[#F1416C]'
                }`}
              >
                {approvalAction === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
              <button
                onClick={() => { setShowApprovalModal(false); setApprovalNotes(''); }}
                className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[14px] font-bold text-[#3F4254] active:scale-95 transition-transform"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Lightbox Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X size={18} />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed preview" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
          />
        </div>
      )}

      <style>{`
        @keyframes banner-flow {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default MobileApprovalDetail;
