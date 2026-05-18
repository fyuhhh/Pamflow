import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Image, Download, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import { getImageUrl } from '../utils/imageUrl';

import API_URL from '../config';

const safeArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const TerkirimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [woItems, setWoItems] = useState([]);
  const [partialSubs, setPartialSubs] = useState([]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedProblemIds, setSelectedProblemIds] = useState([]);
  const [reopenSaving, setReopenSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
        const parsedItems = typeof data.wo_items === 'string' ? JSON.parse(data.wo_items) : (data.wo_items || []);
        setWoItems(parsedItems);
        const parsedSubs = typeof data.partial_submissions === 'string' ? JSON.parse(data.partial_submissions) : (data.partial_submissions || []);
        setPartialSubs(parsedSubs);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    if (selectedProblemIds.length === 0) {
      showError('Pilih Item', 'Pilih minimal 1 item yang masih bermasalah');
      return;
    }
    setReopenSaving(true);
    try {
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      const res = await authFetch(`/api/department-tasks/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({
          reopen_by_id: user?.id,
          reopen_by_name: fullName,
          problem_item_ids: selectedProblemIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        success('WO Diajukan Ulang', `WO baru #${data.new_wo_id} telah dikirim ke Engineering`);
        setShowReopenModal(false);
        navigate('/tugas-departemen/terkirim');
      } else {
        showError('Gagal', data.message);
      }
    } catch (e) {
      showError('Error', 'Terjadi kesalahan jaringan');
    } finally {
      setReopenSaving(false);
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
        <Link to="/tugas-departemen/terkirim" className="text-[13px] text-[#0095E8] hover:underline">
          ← Kembali ke daftar WO Terkirim
        </Link>
      </div>
    );
  }

  const labelClass = "text-[13px] font-semibold text-[#7E8299] py-3 pr-8 whitespace-nowrap align-top";
  const valueClass = "text-[13px] text-[#3F4254] py-3";

  return (
    <div className="p-8 px-10">
      {/* Back link */}
      <Link
        to="/tugas-departemen/terkirim"
        className="inline-flex items-center gap-1.5 text-[13px] text-[#0095E8] font-semibold hover:underline mb-6"
      >
        <ArrowLeft size={15} /> Kembali ke daftar WO Terkirim
      </Link>

      {/* Detail Card */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
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
              <td className={valueClass} style={{ fontWeight: 600 }}>{task.departemen_tujuan || '-'}</td>
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
                            src={getImageUrl(task.lampiran)} 
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
                  ? `${formatDate(task.tanggal_mulai)} ~ ${formatDate(task.tanggal_selesai)}`
                  : '-'
                }
              </td>
            </tr>
            <tr className="border-b border-[#F1F1F4]">
              <td className={labelClass}>Urgensi</td>
              <td className={valueClass}>
                <span className={`px-3 py-1 rounded text-[11px] font-bold ${getUrgensiColor(task.urgensi)}`}>
                  {task.urgensi || '-'}
                </span>
              </td>
            </tr>
            <tr>
              <td className={labelClass}>Status WO</td>
              <td className={valueClass}>
                <span className={`px-3 py-1 rounded text-[11px] font-bold ${getStatusColor(task.status)}`}>
                  {task.status || 'Baru'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === WO ITEMS PROGRESS (Operasional bisa lihat) === */}
      {woItems.length > 0 && (
        <div className="bg-white rounded-xl border border-[#F1F1F4] p-8 mt-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-[#181C32]">Progress Item WO</h3>
              <p className="text-[12px] text-[#7E8299] mt-0.5">
                {woItems.filter(i => i.status === 'fixed').length}/{woItems.length} item selesai
              </p>
            </div>
            <div className="w-40">
              <div className="w-full bg-[#F5F8FA] rounded-full h-2.5">
                <div className="h-2.5 bg-[#50CD89] rounded-full transition-all"
                  style={{ width: `${(woItems.filter(i=>i.status==='fixed').length/woItems.length)*100}%` }} />
              </div>
              <p className="text-[10px] text-[#A1A5B7] text-right mt-1">
                {Math.round((woItems.filter(i=>i.status==='fixed').length/woItems.length)*100)}%
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {woItems.map((item, idx) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                item.status === 'fixed' ? 'bg-[#E8FFF3]' : 'bg-[#FFF8DD]'
              }`}>
                {item.status === 'fixed'
                  ? <CheckCircle2 size={15} className="text-[#50CD89] flex-shrink-0" />
                  : <XCircle size={15} className="text-[#FFA800] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className={`text-[12px] block ${
                    item.status === 'fixed' ? 'line-through text-[#A1A5B7]' : 'text-[#3F4254] font-medium'
                  }`}>{idx+1}. {item.name}</span>
                  {item.original_notes && (
                    <p className="text-[10px] text-[#A1A5B7] mt-0.5 italic">Catatan: {item.original_notes}</p>
                  )}
                  {(() => { const _photos = safeArr(item.original_photos).length > 0 ? safeArr(item.original_photos) : (item.original_photo ? [item.original_photo] : []); return _photos.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {_photos.map((photo, pIdx) => (
                        <div key={pIdx} className="w-20 h-14 rounded border border-[#E4E6EF] overflow-hidden">
                          <img src={getImageUrl(photo)} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" alt={`Original ${pIdx + 1}`} onClick={() => setZoomedImage(photo)} />
                        </div>
                      ))}
                    </div>
                  ); })()}
                  {item.original_video && (
                    <div className="mt-1.5 w-44 h-24 rounded border border-[#E4E6EF] bg-black relative flex items-center justify-center">
                      <video src={getImageUrl(item.original_video)} className="w-full h-full object-contain" controls playsInline webkit-playsinline="true" preload="metadata" />
                    </div>
                  )}
                </div>
                {item.status === 'fixed' && item.fixed_by_name && (
                  <span className="text-[10px] text-[#50CD89] whitespace-nowrap">oleh {item.fixed_by_name}</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  item.status === 'fixed' ? 'bg-[#50CD89]/20 text-[#50CD89]' : 'bg-[#FFA800]/20 text-[#FFA800]'
                }`}>{item.status === 'fixed' ? 'Selesai' : 'Pending'}</span>
              </div>
            ))}
          </div>

          {/* Partial submission history */}
          {partialSubs.length > 0 && (
            <div>
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-[12px] text-[#7E8299] hover:text-[#0095E8] font-semibold mb-3">
                {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                Riwayat Progress ({partialSubs.length} update)
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {partialSubs.map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-3 px-4 py-3 bg-[#F5F8FA] rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-[#0095E8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-[#0095E8]">{idx+1}</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#3F4254]">
                          {sub.submitted_by_name} — {sub.items_fixed?.length || 0} item diselesaikan
                        </p>
                        {sub.notes && <p className="text-[11px] text-[#7E8299]">{sub.notes}</p>}
                        <p className="text-[10px] text-[#A1A5B7] mt-0.5">
                          {new Date(sub.submitted_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tombol Ajukan Ulang (hanya jika status Selesai) */}
          {task.status === 'Selesai' && (
            <div className="border-t border-[#F1F1F4] pt-5 mt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#3F4254]">Ada item yang masih bermasalah?</p>
                  <p className="text-[12px] text-[#7E8299]">Ajukan ulang untuk item yang perlu diperbaiki kembali</p>
                </div>
                <button onClick={() => { setSelectedProblemIds([]); setShowReopenModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FFF8F0] border border-[#FFA800]/30 text-[#FFA800] rounded-lg text-[12px] font-bold hover:bg-[#FFA800] hover:text-white transition-colors">
                  <RotateCcw size={14}/> Ajukan Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === REOPEN MODAL === */}
      {showReopenModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[1px] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#FFF8F0] flex items-center justify-center">
                <RotateCcw size={18} className="text-[#FFA800]" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#181C32]">Ajukan Ulang WO</h3>
                <p className="text-[12px] text-[#7E8299]">Pilih item yang masih bermasalah</p>
              </div>
            </div>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {woItems.map((item, idx) => (
                <label key={item.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  selectedProblemIds.includes(item.id)
                    ? 'bg-[#FFF8F0] border border-[#FFA800]/30'
                    : 'bg-[#F5F8FA] border border-transparent hover:border-[#E4E6EF]'
                }`}>
                  <input type="checkbox"
                    checked={selectedProblemIds.includes(item.id)}
                    onChange={() => setSelectedProblemIds(prev =>
                      prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                    )}
                    className="w-4 h-4 accent-[#FFA800]" />
                  <span className="text-[12px] text-[#3F4254] font-medium">{idx+1}. {item.name}</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.status === 'fixed' ? 'bg-[#E8FFF3] text-[#50CD89]' : 'bg-[#FFF8DD] text-[#FFA800]'
                  }`}>{item.status === 'fixed' ? 'Sudah diperbaiki' : 'Belum selesai'}</span>
                </label>
              ))}
            </div>
            {selectedProblemIds.length > 0 && (
              <p className="text-[12px] text-[#FFA800] mb-4 flex items-center gap-1.5">
                <AlertTriangle size={13}/> {selectedProblemIds.length} item akan diajukan ulang ke Engineering
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowReopenModal(false)}
                className="flex-1 py-2.5 border border-[#E4E6EF] rounded-xl text-[13px] font-bold text-[#7E8299] hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleReopen} disabled={reopenSaving || selectedProblemIds.length === 0}
                className="flex-1 py-2.5 bg-[#FFA800] text-white rounded-xl text-[13px] font-bold hover:bg-[#E69500] disabled:opacity-50">
                {reopenSaving ? 'Mengirim...' : 'Kirim WO Ulang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={getImageUrl(zoomedImage)} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Zoomed" />
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

export default TerkirimDetail;
