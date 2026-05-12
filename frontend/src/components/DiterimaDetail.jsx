import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { hasPermission } from '../utils/permissions';
import { useModal } from '../context/ModalContext';
import { authFetch } from '../services/api';
import API_URL from '../config';

const safeArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const DiterimaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState('accept');
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

  // WO Items state (untuk partial/final submit)
  const [woItems, setWoItems] = useState([]);
  const [partialSaving, setPartialSaving] = useState(false);
  const [finalSaving, setFinalSaving] = useState(false);
  const [checkedItemIds, setCheckedItemIds] = useState([]);
  const [partialNotes, setPartialNotes] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await authFetch(`/api/department-tasks/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        // Parse wo_items
        const parsed = typeof data.wo_items === 'string' ? JSON.parse(data.wo_items) : (data.wo_items || []);
        setWoItems(parsed);
        // Pre-check already fixed items
        setCheckedItemIds(parsed.filter(i => i.status === 'fixed').map(i => i.id));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const endpoint = modalType === 'accept' ? 'accept' : 'reject';
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const body = modalType === 'accept' 
        ? { accepted_by_id: user.id, accepted_by_name: fullName }
        : { rejected_by_id: user.id, rejected_by_name: fullName };

      const response = await authFetch(`/api/department-tasks/${id}/${endpoint}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      if (response.ok) {
        setShowConfirmModal(false);
        if (modalType === 'accept') {
          // Langsung redirect ke form Buat WO/Checklist dengan data sudah terisi
          const jenisTugas = task.jenis_tugas === 'checklist' ? 'buat' : 'buat-wo';
          navigate(`/tugas-agen/${jenisTugas}?from_dept_task=${id}`);
        } else {
          success('Berhasil', 'Berhasil menolak tugas');
          navigate('/tugas-departemen/diterima');
        }
      } else {
        showError('Gagal', `Gagal ${modalType === 'accept' ? 'menerima' : 'menolak'} tugas`);
      }
    } catch (err) {
      console.error(`${modalType} error:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptClick = () => {
    setModalType('accept');
    setShowConfirmModal(true);
  };

  const handleRejectClick = () => {
    setModalType('reject');
    setShowConfirmModal(true);
  };

  // Toggle centang item selesai
  const toggleCheckItem = (itemId) => {
    setCheckedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    );
  };

  // Submit partial progress
  const handlePartialSubmit = async () => {
    if (checkedItemIds.length === 0) {
      showError('Pilih Item', 'Centang minimal 1 item yang sudah selesai diperbaiki');
      return;
    }
    setPartialSaving(true);
    try {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const res = await authFetch(`/api/department-tasks/${id}/partial-submit`, {
        method: 'PATCH',
        body: JSON.stringify({
          submitted_by_id: user.id,
          submitted_by_name: fullName,
          fixed_item_ids: checkedItemIds,
          notes: partialNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        success('Progress Disimpan', data.message);
        fetchTask();
      } else {
        showError('Gagal', data.message);
      }
    } catch (e) {
      showError('Error', 'Terjadi kesalahan jaringan');
    } finally {
      setPartialSaving(false);
    }
  };

  // Submit final (semua item harus selesai)
  const handleFinalSubmit = async () => {
    setFinalSaving(true);
    try {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const res = await authFetch(`/api/department-tasks/${id}/final-submit`, {
        method: 'PATCH',
        body: JSON.stringify({ submitted_by_id: user.id, submitted_by_name: fullName })
      });
      const data = await res.json();
      if (res.ok) {
        success('WO Disubmit Final', 'WO menunggu approval atasan');
        fetchTask();
      } else {
        showError('Gagal', data.message);
      }
    } catch (e) {
      showError('Error', 'Terjadi kesalahan jaringan');
    } finally {
      setFinalSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch { return '-'; }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    } catch { return '-'; }
  };

  const getUrgensiColor = (urgensi) => {
    switch (urgensi) {
      case 'Rendah': return 'bg-[#E8FFF3] text-[#50CD89]';
      case 'Kritis': return 'bg-[#FFF5F8] text-[#F1416C]';
      case 'Sedang': return 'bg-[#FFF8DD] text-[#FFAD0F]';
      default: return 'bg-[#F1FAFF] text-[#0095E8]';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Baru': return 'bg-[#F1FAFF] text-[#0095E8]';
      case 'Diterima': return 'bg-[#F8E3FF] text-[#7239EA]';
      case 'Menunggu Pengerjaan': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Berlangsung': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Selesai': return 'bg-[#E8FFF3] text-[#50CD89]';
      case 'Ditolak': return 'bg-[#FFF5F8] text-[#F1416C]';
      default: return 'bg-[#F1FAFF] text-[#0095E8]';
    }
  };


  const isImageFile = (url) => {
    if (!url) return false;
    return /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: '400px' }}>
        <p className="text-[#A1A5B7] text-sm italic">Memuat data...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center" style={{ minHeight: '400px' }}>
        <p className="text-[15px] font-bold text-[#181C32] mb-1.5">Data tidak ditemukan</p>
        <Link to="/tugas-departemen/diterima" className="text-[13px] text-[#0095E8] hover:underline">
          ← Kembali ke daftar WO diterima
        </Link>
      </div>
    );
  }

  const labelClass = "text-[13px] text-[#7E8299] py-3 pr-8 whitespace-nowrap align-top";
  const valueClass = "text-[13px] text-[#3F4254] py-3";

  return (
    <div className="p-8 px-10">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => navigate('/tugas-departemen/diterima')}
             className="w-8 h-8 rounded-full border border-[#E4E6EF] flex items-center justify-center text-[#7E8299] hover:bg-gray-50 bg-white"
           >
             <ArrowLeft size={16} />
           </button>
           <h2 className="text-[17px] font-bold text-[#181C32]">Detail Permintaan WO</h2>
        </div>
      </div>

      {/* Back link */}
      <Link
        to="/tugas-departemen/diterima"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#0095E8] hover:underline mb-6 font-medium"
      >
        <ArrowLeft size={15} /> Kembali ke daftar WO diterima
      </Link>

      {/* Accepted Info Box */}
      {task.status !== 'Baru' && task.status !== 'Ditolak' && (
        <div className="bg-[#E8FFF3] border border-[#50CD89] border-opacity-20 rounded-xl p-5 mb-6 flex items-start gap-4 transition-all">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#50CD89] border border-[#50CD89] border-opacity-10 shadow-sm">
                <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
                <p className="text-[14px] font-bold text-[#181C32] mb-0.5">{task.jenis_tugas === 'checklist' ? 'Checklist' : 'WO'} Diterima</p>
                <p className="text-[13px] text-[#3F4254]">
                    Diterima oleh <span className="font-semibold">{task.accepted_by_name || 'Admin'}</span> pada {formatDateTime(task.waktu_diterima)}
                </p>
                <div className="mt-3">
                    <button 
                        onClick={() => navigate(`/tugas-agen/${task.jenis_tugas === 'wo' ? 'buat-wo' : 'buat'}?from_dept_task=${task.id}`)}
                        className="px-4 py-1.5 bg-[#0095E8] rounded-lg text-[12px] text-white font-bold hover:bg-[#0084CC] transition-colors"
                    >
                        Buat {task.jenis_tugas === 'checklist' ? 'Checklist' : 'WO'}
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* Detail Card */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-8 mb-20" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass} style={{ width: '180px' }}>ID WO</td>
              <td className={valueClass}>{task.jenis_tugas === 'checklist' ? 'CHK' : 'WO'}-{task.dept_id_asal || task.departemen_asal?.substring(0, 3).toUpperCase() || 'GEN'}{String(task.id).padStart(5, '0')}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Perusahaan</td>
              <td className={valueClass}>{task.perusahaan || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Departemen asal</td>
              <td className={valueClass}>{task.departemen_asal || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Nama peminta</td>
              <td className={valueClass}>{task.nama_peminta || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Department tujuan</td>
              <td className={valueClass}>{task.departemen_tujuan || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Template Tugas</td>
              <td className={valueClass}>{task.template || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Nama WO</td>
              <td className={valueClass}>{task.nama_wo || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Deskripsi</td>
              <td className={valueClass} style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {task.deskripsi || '-'}
              </td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Titik lokasi</td>
              <td className={valueClass}>{task.lokasi || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Detail Alamat</td>
              <td className={valueClass}>{task.detail_alamat || '-'}</td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Lampiran</td>
              <td className={valueClass}>
                {task.lampiran ? (
                  <div className="flex items-center gap-3">
                    {isImageFile(task.lampiran) ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-[#E4E6EF] overflow-hidden flex-shrink-0">
                          <img 
                            src={`${API_URL}${task.lampiran}`} 
                            alt="Lampiran" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <a 
                          href={`${API_URL}${task.lampiran}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-[#0095E8] hover:underline flex items-center gap-1.5"
                        >
                          <Download size={14} /> Lihat Gambar
                        </a>
                      </div>
                    ) : (
                      <a 
                        href={`${API_URL}${task.lampiran}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[13px] text-[#0095E8] hover:underline"
                      >
                        <div className="w-8 h-8 rounded bg-[#FFF5F8] flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-[#F1416C]" />
                        </div>
                        Download PDF
                      </a>
                    )}
                  </div>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Tenggat waktu</td>
              <td className={valueClass}>
                {task.tanggal_mulai || task.tanggal_selesai 
                  ? `${formatDate(task.tanggal_mulai)} - ${formatDate(task.tanggal_selesai)}`
                  : '-'
                }
              </td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Urgensi</td>
              <td className={valueClass}>
                <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getUrgensiColor(task.urgensi)}`}>
                  {task.urgensi || '-'}
                </span>
              </td>
            </tr>
            <tr>
              <td className={labelClass}>Status WO</td>
              <td className={valueClass}>
                <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getStatusColor(task.status)}`}>
                  {task.status || 'Baru'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === WO ITEMS SECTION (hanya jika ada wo_items) === */}
      {woItems.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F1F1F4] p-8 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-[#181C32]">Item yang Perlu Diperbaiki</h3>
              <p className="text-[12px] text-[#7E8299] mt-0.5">
                {woItems.filter(i => i.status === 'fixed').length} dari {woItems.length} item selesai
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-48">
              <div className="flex justify-between text-[10px] text-[#A1A5B7] mb-1">
                <span>Progress</span>
                <span>{Math.round((woItems.filter(i=>i.status==='fixed').length/woItems.length)*100)}%</span>
              </div>
              <div className="w-full bg-[#F5F8FA] rounded-full h-2">
                <div className="h-2 bg-[#50CD89] rounded-full transition-all"
                  style={{ width: `${(woItems.filter(i=>i.status==='fixed').length/woItems.length)*100}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {woItems.map((item, idx) => (
              <div key={item.id}
                className={`flex items-start gap-4 px-5 py-4 rounded-xl border transition-all ${
                  item.status === 'fixed'
                    ? 'bg-[#E8FFF3] border-[#50CD89]/20'
                    : checkedItemIds.includes(item.id)
                      ? 'bg-[#F1FAFF] border-[#0095E8]/20'
                      : 'bg-[#F5F8FA] border-transparent'
                }`}>
                {/* Checkbox */}
                <div className="pt-0.5">
                  {item.status === 'fixed' ? (
                    <CheckCircle2 size={18} className="text-[#50CD89]" />
                  ) : [
                    'Berlangsung','Partial WO','Diterima','Menunggu Pengerjaan'
                  ].includes(task?.status) ? (
                    <input type="checkbox"
                      checked={checkedItemIds.includes(item.id)}
                      onChange={() => toggleCheckItem(item.id)}
                      className="w-4 h-4 accent-[#0095E8] cursor-pointer" />
                  ) : (
                    <div className="w-4 h-4 rounded border-2 border-[#E4E6EF]" />
                  )}
                </div>
                {/* Item info */}
                <div className="flex-1">
                  <p className={`text-[13px] font-medium ${
                    item.status === 'fixed' ? 'line-through text-[#A1A5B7]' : 'text-[#3F4254]'
                  }`}>{idx + 1}. {item.name}</p>
                  {item.original_notes && (
                    <p className="text-[11px] text-[#A1A5B7] mt-0.5">Catatan: {item.original_notes}</p>
                  )}
                  {(() => { const _photos = safeArr(item.original_photos).length > 0 ? safeArr(item.original_photos) : (item.original_photo ? [item.original_photo] : []); return _photos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {_photos.map((photo, pIdx) => (
                        <div key={pIdx} className="w-24 h-16 rounded-lg overflow-hidden border border-[#E4E6EF]">
                          <img src={photo} className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" alt={`Original ${pIdx + 1}`} onClick={() => setZoomedImage(photo)} />
                        </div>
                      ))}
                    </div>
                  ); })()}
                  {item.status === 'fixed' && (
                    <p className="text-[11px] text-[#50CD89] mt-0.5">
                      ✓ Diperbaiki oleh {item.fixed_by_name || '-'}
                    </p>
                  )}
                </div>
                {/* Status badge & Batal Action */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded flex-shrink-0 ${
                    item.status === 'fixed' ? 'bg-[#E8FFF3] text-[#50CD89]' : 
                    item.status === 'cancelled' ? 'bg-[#F5F8FA] text-[#A1A5B7]' : 
                    'bg-[#FFF8DD] text-[#FFA800]'
                  }`}>
                    {item.status === 'fixed' ? 'Selesai' : 
                     item.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                  </span>
                  
                  {item.status === 'pending' && ['Berlangsung','Partial WO','Diterima','Menunggu Pengerjaan'].includes(task?.status) && (
                    <button 
                      onClick={() => {
                        if(window.confirm(`Batalkan perbaikan untuk "${item.name}"?`)) {
                           const updatedItems = woItems.map(it => it.id === item.id ? {...it, status: 'cancelled', fixed_by_name: 'System (Cancelled)'} : it);
                           setWoItems(updatedItems);
                        }
                      }}
                      className="text-[10px] text-[#F1416C] hover:underline font-bold"
                    >
                      Batalkan Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Partial / Final Submit Panel */}
          {['Berlangsung','Partial WO','Diterima','Menunggu Pengerjaan'].includes(task?.status) && (
            <div className="border-t border-[#F1F1F4] pt-5">
              <textarea
                value={partialNotes}
                onChange={e => setPartialNotes(e.target.value)}
                placeholder="Catatan progress (opsional)..."
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-[#E4E6EF] text-[13px] outline-none focus:border-[#0095E8] resize-none mb-4"
              />
              <div className="flex justify-between items-center">
                  {checkedItemIds.length} item dipilih · {woItems.filter(i=>['fixed', 'cancelled'].includes(i.status)).length} dari {woItems.length} item final
                <div className="flex gap-3">
                  <button onClick={handlePartialSubmit} disabled={partialSaving || checkedItemIds.length === 0}
                    className="px-5 py-2 border border-[#0095E8] text-[#0095E8] rounded-lg text-[12px] font-bold hover:bg-[#F1FAFF] disabled:opacity-40 transition-colors">
                    {partialSaving ? 'Menyimpan...' : 'Simpan Progress'}
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={finalSaving || woItems.some(i => i.status === 'pending')}
                    title={woItems.some(i => i.status === 'pending') ? 'Semua item harus selesai dulu' : ''}
                    className="px-5 py-2 bg-[#0095E8] text-white rounded-lg text-[12px] font-bold hover:bg-[#0084CC] disabled:opacity-40 transition-colors">
                    {finalSaving ? 'Mengirim...' : 'Submit Final →'}
                  </button>
                </div>
              </div>
              {woItems.some(i => i.status === 'pending') && (
                <p className="text-[11px] text-[#FFA800] flex items-center gap-1 mt-2">
                  <AlertTriangle size={12} />
                  Submit Final baru aktif setelah semua {woItems.filter(i=>i.status==='pending').length} item pending diselesaikan atau dibatalkan
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {task.status === 'Baru' && hasPermission(user, 'tugas_dept_diterima', 'Edit') && (
        <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-[#F1F1F4] p-4 px-10 flex justify-end gap-3 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <button 
              onClick={handleRejectClick}
              disabled={actionLoading}
              className="px-8 py-2.5 border border-[#F1416C] rounded-lg text-[13px] text-[#F1416C] font-bold hover:bg-[#FFF5F8] transition-colors disabled:opacity-50"
            >
              Tolak
            </button>
            <button 
              onClick={handleAcceptClick}
              disabled={actionLoading}
              className="px-8 py-2.5 bg-[#0095E8] rounded-lg text-[13px] text-white font-bold hover:bg-[#0084CC] transition-colors disabled:opacity-50 shadow-sm"
            >
              Terima
            </button>
        </div>
      )}

      {/* Consistent Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-[400px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${
              modalType === 'accept' ? 'bg-[#F1FAFF]' : 'bg-[#FFF5F8]'
            }`}>
              <div className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center ${
                modalType === 'accept' ? 'border-[#D7F1FF]' : 'border-[#FFD7E0]'
              }`}>
                {modalType === 'accept' ? (
                  <AlertTriangle className="text-[#0095E8]" size={20} strokeWidth={2.5} />
                ) : (
                  <AlertTriangle className="text-[#F1416C]" size={20} strokeWidth={2.5} />
                )}
              </div>
            </div>
            
            <h3 className="text-[17px] font-bold text-[#181C32] mb-3">
              Konfirmasi {modalType === 'accept' ? 'Penerimaan' : 'Penolakan'}
            </h3>
            <p className="text-[13px] leading-relaxed text-[#7E8299] mb-8">
              Apakah Anda yakin ingin {modalType === 'accept' ? 'menerima' : 'menolak'} pekerjaan ini? 
              {modalType === 'accept' 
                ? ' Status akan berubah menjadi Diterima.' 
                : ' Pekerjaan ini akan ditandai sebagai ditolak.'}
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[13px] font-bold text-[#7E8299] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={handleAction}
                className={`flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-colors shadow-sm ${
                  modalType === 'accept' ? 'bg-[#0095E8] hover:bg-[#0084CC]' : 'bg-[#F1416C] hover:bg-[#D9214E]'
                }`}
              >
                Ya, {modalType === 'accept' ? 'Terima' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Zoomed" />
            <button 
              className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-gray-200"
              onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DiterimaDetail;
