import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Info, MapPin, ExternalLink, Clock, Calendar, CheckCircle2, History, X, User, Timer, FileText, Camera } from 'lucide-react';
import { authFetch } from '../services/api';
import { generateTaskPDF } from '../utils/pdfGenerator';
import { Download } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';


const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tugas');
  const [history, setHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await authFetch(`/api/tasks/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setTask(data);
        }
      } catch (err) {
        console.error('Error fetching task:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTaskHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await authFetch(`/api/tasks/${taskId}/history`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await authFetch(`/api/users`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    const fetchAuditLogs = async () => {
      setLoadingAudit(true);
      try {
        const response = await authFetch(`/api/audit-logs/task/${taskId}`);
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoadingAudit(false);
      }
    };

    fetchTask();
    fetchTaskHistory();
    fetchAuditLogs();
    fetchUsers();
  }, [taskId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e - s;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '< 1 Menit';
    if (diffMins < 60) return `${diffMins} Menit`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours} Jam ${remainingMins} Menit`;
  };

  const getUrgensiColor = (urgensi) => {
    switch (urgensi) {
      case 'Kritis': return 'text-[#F1416C] bg-[#FFF5F8] border-[#FFE2E5]';
      case 'Normal': return 'text-[#0095E8] bg-[#F1FAFF] border-[#E1F0FF]';
      case 'Rendah': return 'text-[#50CD89] bg-[#E8FFF3] border-[#D1F7E4]';
      default: return 'text-[#0095E8] bg-[#F1FAFF] border-[#E1F0FF]';
    }
  };

  const getAgentNames = () => {
    if (!task || !task.agen_id || !Array.isArray(task.agen_id)) return '-';
    if (users.length === 0) return 'Memuat...';
    
    const names = task.agen_id.map(id => {
      const user = users.find(u => String(u.id) === String(id));
      return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : `ID: ${id}`;
    });
    
    return names.filter(n => n).join(', ') || '-';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0095E8]"></div>
    </div>
  );

  if (!task) return (
    <div className="p-10 text-center">
      <div className="text-red-500 font-bold mb-4">Tugas tidak ditemukan.</div>
      <button onClick={() => navigate('/tugas-agen/ringkasan')} className="text-[#0095E8] underline">Kembali ke Daftar</button>
    </div>
  );

  const isWO = task.nomor_perintah_kerja && task.nomor_perintah_kerja.startsWith('WO-');

  const renderTugasTab = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* WO Banner if applicable */}
      {isWO && (
        <div className="bg-[#E8FFF3] border border-[#D1F7E4] rounded-xl p-5 flex flex-col gap-1">
          <p className="text-[14px] font-bold text-[#50CD89]">Tugas bagian dari WO</p>
          <p className="text-[12px] text-[#50CD89] opacity-80">
            Diterima oleh {task.pic_penerima || 'Penerima'} pada {formatDate(task.created_at)}, {formatTime(new Date(task.created_at).toLocaleTimeString())} UTC+08.00
          </p>
        </div>
      )}

      {/* Summary Info Card */}
      <div className="bg-[#F4F9FA] rounded-xl border border-[#E9F3F5] overflow-hidden">
        <div className="p-6 border-b border-[#E9F3F5] flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex gap-16">
              <div>
                <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-1">ID Tugas</p>
                <p className="text-[13px] font-medium text-[#3F4254]">PAM-{task.id}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-1">Nama Tugas</p>
                <p className="text-[13px] font-medium text-[#3F4254]">{task.nama_tugas}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-4 gap-8">
          <div>
            <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-2">Progres Tugas</p>
            <span className={`inline-block px-3 py-1 rounded text-[11px] font-medium ${
              task.progres === 'Selesai' ? 'bg-[#E8FFF3] text-[#50CD89] border-[#D1F7E4]' :
              task.progres === 'Berlangsung' ? 'bg-[#FFF8DD] text-[#FFC700] border-[#FFC700]/20' :
              task.progres === 'Menunggu Persetujuan' ? 'bg-[#F8E3FF] text-[#7239EA] border-[#7239EA]/20' :
              'bg-[#F1FAFF] text-[#0095E8] border-[#E1F0FF]'
            }`}>
              {task.progres || 'Terbuka'}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-2">Urgensi</p>
            <span className={`inline-block px-3 py-1 border rounded text-[11px] font-medium ${getUrgensiColor(task.urgensi)}`}>
              {task.urgensi || 'Normal'}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-2 flex items-center gap-1">
              Aturan waktu <Info size={12} className="text-[#B5B5C3]" />
            </p>
            <p className="text-[13px] font-medium text-[#3F4254]">{task.aturan_waktu || 'Tanpa Tanggal Berakhir'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-2">Jadwal tugas</p>
            <div className="text-[13px] font-medium text-[#3F4254]">
              {formatDate(task.tanggal_mulai)} {formatTime(task.waktu_mulai)}
              <p className="text-[11px] text-[#A1A5B7] mt-0.5 font-normal">
                {task.pengulangan ? `Berulang: ${task.jenis_pengulangan}` : 'Tidak ada pengulangan Tugas'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informasi Umum Section */}
      <section className="pt-2">
        <h3 className="text-[15px] font-bold text-[#181C32] mb-6">Informasi Umum</h3>
        <div className="space-y-4">
          {[
            { label: 'Perusahaan', value: task.perusahaan },
            { label: 'Departemen', value: task.departemen },
            { label: 'Nomor perintah kerja', value: task.nomor_perintah_kerja || '-' },
            { label: 'Deskripsi tugas', value: task.deskripsi || '-', isLongText: true },
            { label: 'Titik lokasi', value: task.lokasi || '-' },
            { label: 'Detail alamat', value: task.detail_alamat || '-' },
          ].map(item => (
            <div key={item.label} className="grid grid-cols-[250px_1fr] items-start py-1">
              <span className="text-[13px] text-[#7E8299] font-normal">{item.label}</span>
              <div className={`text-[13px] text-[#3F4254] font-normal leading-relaxed ${item.isLongText ? 'whitespace-pre-line' : ''}`}>
                {item.value || '-'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Informasi Agen Section */}
      <section className="pt-6 border-t border-[#F1F1F4]">
        <h3 className="text-[15px] font-bold text-[#181C32] mb-6">Informasi Agen</h3>
        <div className="space-y-4">
          {[
            { label: 'Tugas departemen', value: task.tugas_departemen ? 'Ya' : 'Tidak' },
            { label: 'Agen', value: getAgentNames() },
            { label: 'Verifikasi Kehadiran', value: task.verifikasi_kehadiran ? 'Ya' : 'Tidak' },
          ].map(item => (
            <div key={item.label} className="grid grid-cols-[250px_1fr] items-start py-1">
              <span className="text-[13px] text-[#7E8299] font-normal">{item.label}</span>
              <span className="text-[13px] text-[#3F4254] font-normal">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Verifikasi Tugas Section */}
      <section className="pt-6 border-t border-[#F1F1F4]">
        <h3 className="text-[15px] font-bold text-[#181C32] mb-6">Verifikasi Tugas</h3>
        <div className="space-y-4">
          {[
            { label: 'Persetujuan', value: task.butuh_persetujuan ? 'Ya' : 'Tidak' },
          ].map(item => (
            <div key={item.label} className="grid grid-cols-[250px_1fr] items-start py-1">
              <span className="text-[13px] text-[#7E8299] font-normal">{item.label}</span>
              <span className="text-[13px] text-[#3F4254] font-normal">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderDetailTab = () => (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-10 grid grid-cols-[250px_1fr] items-center">
        <span className="text-[13px] text-[#7E8299] font-normal">Nama template tugas</span>
        <span className="text-[13px] font-normal text-[#3F4254]">{task.template_name || 'Work Order'}</span>
      </div>

      <div className="space-y-12">
        {Array.isArray(task.details) && task.details.map((detail, index) => (
          <div key={detail.id || index} className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#181C32]">Detail Tugas ke {index + 1}</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-[250px_1fr] items-start py-1">
                <span className="text-[13px] text-[#7E8299] font-normal">Nama detail tugas</span>
                <span className="text-[13px] text-[#3F4254] font-normal">{detail.nama_detail}</span>
              </div>

              <div className="grid grid-cols-[250px_1fr] items-start py-1">
                <span className="text-[13px] text-[#7E8299] font-normal">Bentuk laporan</span>
                <span className="text-[13px] text-[#3F4254] font-normal">{detail.bentuk_laporan}</span>
              </div>

              <div className="grid grid-cols-[250px_1fr] items-start py-1">
                <span className="text-[13px] text-[#7E8299] font-normal">Deskripsi</span>
                <div className="text-[13px] text-[#3F4254] font-normal leading-relaxed whitespace-pre-line">
                  {detail.deskripsi || '-'}
                </div>
              </div>

              <div className="grid grid-cols-[250px_1fr] items-start py-1">
                <span className="text-[13px] text-[#7E8299] font-normal">Ketentuan Pengisian</span>
                <span className="text-[13px] text-[#3F4254] font-normal">Wajib diisi</span>
              </div>
            </div>
          </div>
        ))}
        {(!task.details || task.details.length === 0) && (
          <p className="text-center text-[#A1A5B7] italic py-10">Tidak ada detail tugas tambahan.</p>
        )}
      </div>
    </div>
  );

  const renderRiwayatTab = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Task Header Summary in History */}
      <div className="bg-[#F4F9FA] rounded-xl border border-[#E9F3F5] p-6 grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-1">Nama Tugas</p>
          <p className="text-[13px] font-bold text-[#3F4254]">{task.nama_tugas}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#A1A5B7] uppercase tracking-wider mb-1">Jadwal Tugas</p>
          <p className="text-[13px] font-bold text-[#3F4254]">
            {formatDate(task.tanggal_mulai)} {formatTime(task.waktu_mulai)} - {formatDate(task.tanggal_selesai)} {formatTime(task.waktu_selesai)}
          </p>
        </div>
      </div>

      <div className="border border-[#F1F1F4] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#F1F1F4]">
              <th className="p-4 pl-6 text-[11px] font-bold text-[#B5B5C3] uppercase tracking-wider">Nama Agen</th>
              <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase tracking-wider text-center">Progres tugas</th>
              <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase tracking-wider text-center">Tugas Mulai</th>
              <th className="p-4 text-[11px] font-bold text-[#B5B5C3] uppercase tracking-wider text-center">Tugas Selesai</th>
              <th className="p-4 pr-6 text-[11px] font-bold text-[#B5B5C3] uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-[#A1A5B7] text-[13px] italic">Memuat riwayat...</td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center">
                  <History size={40} className="mx-auto text-[#E4E6EF] mb-3" />
                  <p className="text-[13px] font-bold text-[#3F4254]">Belum ada riwayat pengerjaan</p>
                  <p className="text-[11px] text-[#A1A5B7]">Data akan muncul setelah agen mulai mengerjakan tugas ini.</p>
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="border-b border-[#F1F1F4] hover:bg-gray-50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="text-[13px] text-[#3F4254] font-medium">{item.nama_agen || 'Sistem'}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 ${
                      item.progres === 'Selesai' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF8DD] text-[#FFC700]'
                    }`}>
                      {item.progres}
                      {item.progres === 'Selesai' && <CheckCircle2 size={12} />}
                    </span>
                  </td>
                  <td className="p-4 text-center text-[12px] text-[#7E8299] font-medium">
                    {item.waktu_mulai ? new Date(item.waktu_mulai).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="p-4 text-center text-[12px] text-[#7E8299] font-medium">
                    {item.waktu_selesai ? new Date(item.waktu_selesai).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <button 
                      onClick={() => {
                        setSelectedHistory(item);
                        setIsSidebarOpen(true);
                      }}
                      className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-[#F4F9FA] text-[#0095E8] hover:bg-[#0095E8] hover:text-white transition-all shadow-sm flex items-center gap-2 mx-auto"
                    >
                      <FileText size={12} />
                      Lihat Laporan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAktivitasTab = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#F1F1F4]">
        {loadingAudit ? (
          <p className="text-[13px] text-[#A1A5B7] italic">Memuat aktivitas...</p>
        ) : auditLogs.length === 0 ? (
          <div className="py-10 text-center bg-[#F9FAFB] rounded-xl border border-dashed border-[#E4E6EF]">
            <p className="text-[13px] font-bold text-[#3F4254]">Belum ada riwayat aktivitas</p>
            <p className="text-[11px] text-[#A1A5B7] mt-1">Aktivitas admin dan sistem akan muncul di sini.</p>
          </div>
        ) : (
          auditLogs.map((log, idx) => (
            <div key={log.id} className="relative">
              {/* Timeline Dot */}
              <div className={`absolute -left-[30px] top-1.5 w-[24px] h-[24px] rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${
                log.action === 'CREATE' ? 'bg-[#50CD89]' :
                log.action === 'APPROVE' ? 'bg-[#0095E8]' :
                log.action === 'REJECT' ? 'bg-[#F1416C]' :
                log.action === 'UPDATE_STATUS' ? 'bg-[#7239EA]' :
                'bg-[#A1A5B7]'
              }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#F1F1F4] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      log.action === 'CREATE' ? 'bg-[#E8FFF3] text-[#50CD89]' :
                      log.action === 'APPROVE' ? 'bg-[#F1FAFF] text-[#0095E8]' :
                      log.action === 'REJECT' ? 'bg-[#FFF5F8] text-[#F1416C]' :
                      log.action === 'UPDATE_STATUS' ? 'bg-[#F8E3FF] text-[#7239EA]' :
                      'bg-[#F5F8FA] text-[#7E8299]'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <h4 className="text-[14px] font-bold text-[#181C32] mt-2">{log.notes || 'Perubahan sistem'}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-[#3F4254]">{new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[11px] text-[#A1A5B7]">{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F1F1F4]">
                  <div className="w-6 h-6 rounded-full bg-[#F5F8FA] flex items-center justify-center text-[#A1A5B7]">
                    <User size={12} />
                  </div>
                  <span className="text-[12px] text-[#7E8299]">
                    Oleh <span className="font-bold text-[#3F4254]">{log.user_name || 'Sistem'}</span>
                    {log.ip_address && <span className="text-[10px] opacity-60 ml-2">({log.ip_address})</span>}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderLaporanTugasSidebar = () => {
    if (!isSidebarOpen || !selectedHistory) return null;

    const h = selectedHistory;
    const isFinished = h.progres === 'Selesai';
    let submissionData = {};
    try {
      if (h.submission_data) {
        submissionData = typeof h.submission_data === 'string' ? JSON.parse(h.submission_data) : h.submission_data;
      }
    } catch (e) {
      console.error('Error parsing history submission_data:', e);
    }
    
    // Parse task details to map IDs to labels
    let taskDetails = [];
    try {
      if (task.details) {
        taskDetails = typeof task.details === 'string' ? JSON.parse(task.details) : task.details;
      }
    } catch (e) {
      console.error('Error parsing task details:', e);
    }

    const sidebarContent = (
      <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Panel */}
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[1240px] bg-white shadow-2xl transition-transform duration-500 ease-in-out pointer-events-auto translate-x-0`}>
          <div className="flex flex-col h-full bg-white">
            {/* Sidebar Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-500" />
              </button>
              <h2 className="text-[18px] font-bold text-[#181C32]">Laporan Tugas</h2>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 overflow-y-auto px-16 py-12 space-y-16 custom-scrollbar no-scrollbar scroll-smooth">
              {/* Section 1: Detail Tugas */}
              <div className="space-y-8">
                <h3 className="text-[16px] font-bold text-[#181C32]">Detail Tugas</h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'ID Tugas', value: `PAM-${task.id}` },
                    { label: 'Nama Tugas', value: task.nama_tugas },
                    { label: 'Jadwal Tugas', value: (
                      <div className="space-y-0.5">
                        <p>{formatDate(task.tanggal_mulai)} {formatTime(task.waktu_mulai)} - {formatDate(task.tanggal_selesai)} {formatTime(task.waktu_selesai)}</p>
                        <p className="text-[12px] text-[#A1A5B7]">Tidak ada pengulangan Tugas</p>
                      </div>
                    ) },
                    { label: 'Urgensi', value: task.urgensi },
                    { label: 'Perusahaan', value: task.perusahaan || '-' },
                    { label: 'Departemen', value: task.departemen || '-' },
                    { label: 'Nomor Perintah Kerja', value: task.nomor_perintah_kerja || '-' },
                    { label: 'Deskripsi Tugas', value: task.deskripsi || '-' },
                    { label: 'Titik Lokasi', value: task.lokasi || '-' },
                    { label: 'Detail Alamat', value: task.detail_alamat || '-' },
                    { label: 'Verifikasi Kehadiran', value: task.verifikasi_kehadiran ? 'Ya' : 'Tidak' },
                    { label: 'Persetujuan', value: task.butuh_persetujuan ? 'Ya' : 'Tidak' }
                  ].map((field, idx) => (
                    <div key={idx} className="flex gap-10 items-start">
                      <p className="w-[200px] min-w-[200px] text-[13px] text-[#A1A5B7] font-medium leading-relaxed">{field.label}</p>
                      <div className="text-[14px] text-[#3F4254] font-medium leading-[22px] flex-1">{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Hasil Tugas */}
              <div className="space-y-10">
                <h3 className="text-[16px] font-bold text-[#181C32]">Hasil Tugas</h3>

                <div className="rounded-2xl border border-[#EFF2F5] overflow-hidden bg-[#F9FEFF]">
                  {/* Summary Row with Dividers */}
                  <div className="flex border-b border-[#EFF2F5] px-10 py-12">
                    <div className="flex-1 pr-8 border-r border-[#EFF2F5]">
                      <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Nama Agen</p>
                      <p className="text-[14px] font-bold text-[#3F4254]">{h.nama_agen}</p>
                    </div>
                    <div className="flex-1 px-8 border-r border-[#EFF2F5]">
                      <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Durasi Waktu</p>
                      <p className="text-[14px] font-bold text-[#3F4254]">{calculateDuration(h.waktu_mulai, h.waktu_selesai)}</p>
                    </div>
                    <div className="flex-1 px-8 border-r border-[#EFF2F5]">
                      <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Persetujuan</p>
                      <p className="text-[14px] font-bold text-[#3F4254]">-</p>
                    </div>
                    <div className="flex-1 pl-8">
                      <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Progres Tugas</p>
                      <p className="text-[14px] font-bold text-[#50CD89]">Selesai</p>
                      <p className="text-[12px] text-[#A1A5B7] mt-2 font-medium">Catatan: -</p>
                    </div>
                  </div>

                  {/* Timestamps Row */}
                  <div className="bg-white px-10 py-12 space-y-12">
                    <div className="grid grid-cols-2 gap-y-12 gap-x-20">
                      <div className="flex items-start gap-10">
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Waktu Mulai</p>
                          <p className="text-[14px] font-bold text-[#3F4254]">
                            {h.waktu_mulai ? new Date(h.waktu_mulai).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' + new Date(h.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Selfie</p>
                          <p className="text-[14px] font-bold text-[#3F4254]">-</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-10">
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Waktu Selesai</p>
                          <p className="text-[14px] font-bold text-[#3F4254]">
                            {h.waktu_selesai ? new Date(h.waktu_selesai).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' + new Date(h.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Selfie</p>
                          <p className="text-[14px] font-bold text-[#3F4254]">-</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-10 col-span-1">
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Lokasi</p>
                          <p className="text-[14px] font-bold text-[#3F4254] text-wrap">-</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-10 col-span-1">
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-[#A1A5B7] mb-3">Lokasi</p>
                          <p className="text-[14px] font-bold text-[#3F4254] text-wrap">-</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Form Results Table */}
                <div className="border border-[#EFF2F5] rounded-2xl overflow-hidden mt-12 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-[#F9FEFF] border-b border-[#EFF2F5]">
                      <tr>
                        <th className="px-10 py-5 text-[12px] font-bold text-[#A1A5B7] w-[45%] uppercase tracking-wider">Tugas</th>
                        <th className="px-10 py-5 text-[12px] font-bold text-[#A1A5B7] w-[55%] uppercase tracking-wider">Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {taskDetails.map((field, index) => {
                        const fieldKey = field.id || index;
                        const value = submissionData[fieldKey];
                        const isImage = field.bentuk_laporan === 'Image' || field.bentuk_laporan === 'Multiple Images';
                        
                        return (
                          <tr key={fieldKey} className="border-b border-[#EFF2F5] last:border-0 hover:bg-slate-50/30 transition-colors">
                            <td className="px-10 py-8 text-[14px] text-[#3F4254] font-medium leading-relaxed vertical-top align-top">
                              {field.nama_detail}
                            </td>
                            <td className="px-10 py-8 text-[14px] text-[#3F4254] font-medium leading-relaxed align-top">
                              {isImage ? (
                                <div className="space-y-4">
                                  {value ? (
                                    Array.isArray(value) ? (
                                      <div className="grid grid-cols-2 gap-3 w-full max-w-[500px]">
                                        {value.map((img, idx) => (
                                          <div key={idx} className="aspect-square border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 group hover:shadow-md transition-all">
                                            <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Lampiran ${idx + 1}`} />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="w-[300px] max-w-full border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 group transition-all hover:shadow-md">
                                        <img src={getImageUrl(value)} className="w-full object-cover" alt="Lampiran" />
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-[300px] max-w-full aspect-video border border-slate-100 rounded-2xl flex items-center justify-center text-[#A1A5B7] bg-slate-50 border-dashed">
                                      <Camera size={24} className="opacity-40" />
                                      <span className="ml-2 text-[12px] font-medium">Tidak ada gambar</span>
                                    </div>
                                  )}
                                  <p className="text-[13px] text-[#7E8299] font-bold">
                                    {Array.isArray(value) ? `${value.length} Lampiran Gambar` : 'Lampiran Gambar'}
                                  </p>
                                </div>
                              ) : (
                                  <div className="space-y-1.5 py-1">
                                    {Array.isArray(value) ? (
                                      value.map((v, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#0095E8] flex-shrink-0" />
                                          <span className="text-[14px] text-[#3F4254] font-medium leading-tight">{v}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="whitespace-pre-line text-[14px] text-[#3F4254] font-medium">{value || '-'}</p>
                                    )}
                                  </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Final Result / Pengecekan */}
                <div className="border border-[#EFF2F5] rounded-2xl overflow-hidden mt-8 shadow-sm">
                   <div className="flex items-center min-h-[70px]">
                      <div className="px-10 py-6 text-[14px] text-[#3F4254] font-medium w-[45%] bg-[#F9FEFF] border-r border-[#EFF2F5] flex items-center h-full">Hasil Pengecekan</div>
                      <div className="px-10 py-6 text-[14px] text-[#3F4254] font-medium w-[55%] bg-white h-full flex items-center">
                        {isFinished ? 'selesai' : '-'}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-16 py-8 border-t border-slate-100 bg-white flex justify-end gap-4 shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.1)]">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="px-10 py-3.5 rounded-2xl bg-[#004A71] text-white text-[14px] font-bold hover:bg-[#003652] transition-all active:scale-[0.97] shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return sidebarContent;
  };

  return (
    <div className="p-8 px-10 pb-20 font-sans tracking-tight">
      {/* Sidebar Overlay */}
      {renderLaporanTugasSidebar()}
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/tugas-agen/ringkasan')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E4E6EF] text-[#7E8299] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[18px] font-bold text-[#181C32]">Detail Tugas</h2>
      </div>

      <div className="bg-white rounded-xl border border-[#F1F1F4] shadow-sm overflow-hidden min-h-[600px]">
        {/* Navigation Tabs */}
        <div className="px-10 border-b border-[#F1F1F4] flex gap-10">
          {['Tugas', 'Detail', 'Pengerjaan', 'Aktivitas'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pt-8 pb-4 text-[14px] font-medium transition-all relative ${
                activeTab === tab ? 'text-[#0095E8]' : 'text-[#7E8299] hover:text-[#0095E8]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0095E8] rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-10">
          {activeTab === 'Tugas' && renderTugasTab()}
          {activeTab === 'Detail' && renderDetailTab()}
          {activeTab === 'Pengerjaan' && renderRiwayatTab()}
          {activeTab === 'Aktivitas' && renderAktivitasTab()}
        </div>
      </div>

      {/* Sticky Footer Actions if needed */}
      <div className="fixed bottom-0 left-[265px] right-0 bg-white border-t border-[#F1F1F4] p-4 px-10 flex justify-end gap-3 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => navigate('/tugas-agen/ringkasan')}
          className="px-6 py-2.5 rounded-lg text-[13px] font-bold text-[#7E8299] hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
        <button 
          onClick={() => generateTaskPDF(task, history, auditLogs)}
          className="px-6 py-2.5 bg-white border border-[#0095E8] rounded-lg text-[13px] font-bold text-[#0095E8] hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <Download size={16} />
          Cetak PDF
        </button>
        <button 
          onClick={() => {
            const canEdit = task.status !== 'Tidak aktif' && task.progres !== 'Selesai' && task.progres !== 'Berlangsung';
            if (canEdit) navigate(`/tugas-agen/edit/${task.id}`);
          }}
          disabled={task.status === 'Tidak aktif' || task.progres === 'Selesai' || task.progres === 'Berlangsung'}
          title={
            task.progres === 'Selesai' ? 'Tugas sudah selesai' :
            task.progres === 'Berlangsung' ? 'Tugas sedang berlangsung' : 
            task.status === 'Tidak aktif' ? 'Aktifkan tugas terlebih dahulu' : 'Edit Tugas'
          }
          className={`px-8 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
            task.status === 'Tidak aktif' || task.progres === 'Selesai' || task.progres === 'Berlangsung'
              ? 'bg-[#E4E6EF] text-[#A1A5B7] cursor-not-allowed'
              : 'bg-[#0095E8] text-white hover:bg-[#0084CC] shadow-lg shadow-blue-200'
          }`}
        >
          Edit Tugas
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;
