import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Zap, Clock, ShieldCheck, AlertTriangle, FileText, ArrowRight, X } from 'lucide-react';

const TenantApprovalListrik = () => {
  const { token } = useParams();
  
  const formatIndonesianDate = (dateString, timestamp = null) => {
    const target = timestamp || dateString;
    if (!target) return '-';
    try {
      const date = new Date(target);
      if (isNaN(date.getTime())) return target;
      
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${dayName}, ${day} ${monthName} ${year}, ${hours}:${minutes}`;
    } catch (e) {
      return target;
    }
  };

  const formatDateShort = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approve' or 'Reject'
  const [rejectReason, setRejectReason] = useState('');
  const [approverName, setApproverName] = useState('');
  const [approverPhoto, setApproverPhoto] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchReadingDetails();
  }, [token]);

  const fetchReadingDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Calls public unauthenticated endpoint
      const res = await fetch(`/api/utility/public/readings/token/${token}`);
      if (res.ok) {
        const data = await res.json();
        setReading(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Token approval tidak valid atau sudah kedaluwarsa.');
      }
    } catch (err) {
      console.error('Error fetching reading details:', err);
      setError('Gagal terhubung dengan server. Mohon periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // compress quality to 80%
        setApproverPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDecision = async (e) => {
    e.preventDefault();
    if (actionType === 'Reject' && !rejectReason.trim()) {
      alert('Mohon masukkan alasan penolakan!');
      return;
    }

    if (actionType === 'Approve') {
      if (!approverName.trim()) {
        alert('Mohon masukkan nama Anda!');
        return;
      }
      if (!approverPhoto) {
        alert('Mohon ambil foto selfie sebagai bukti persetujuan!');
        return;
      }
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/utility/public/readings/token/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          notes: actionType === 'Reject' ? rejectReason : 'Disetujui oleh Tenant',
          tenant_approver_name: actionType === 'Approve' ? approverName : null,
          tenant_approval_photo: actionType === 'Approve' ? approverPhoto : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message);
        // Refresh reading state
        fetchReadingDetails();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal memproses keputusan.');
      }
    } catch (err) {
      console.error('Error submitting decision:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white font-sans px-6">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-[#0095E8] rounded-full animate-spin mb-4" />
        <p className="text-[14px] font-bold text-slate-400">Memuat berkas persetujuan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white font-sans px-6 text-center">
        <div className="w-16 h-16 bg-red-950/30 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-[20px] font-black text-white mb-2">Validasi Gagal</h3>
        <p className="text-[13px] text-slate-400 max-w-sm leading-relaxed mb-8">{error}</p>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          OPTERA SECURE TRANS-CHECK
        </div>
      </div>
    );
  }

  const listToRender = reading?.readings || (reading ? [reading] : []);
  const overallStatus = reading?.status || 'Pending';

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white font-sans flex flex-col justify-between py-10 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#0095E8]/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7239EA]/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 mb-4">
          <ShieldCheck size={16} className="text-[#0095E8]" />
          <span className="text-[11px] font-black tracking-widest text-[#0095E8] uppercase">Persetujuan Resmi Tenant</span>
        </div>
        <h2 className="text-[24px] font-black text-white text-center leading-tight">Pencatatan Listrik</h2>
        <p className="text-[12px] text-slate-400 text-center mt-1">Harap teliti data pemakaian KWH Anda sebelum konfirmasi.</p>
      </div>

      {/* Card Details */}
      <div className="flex-1 max-w-md mx-auto w-full relative z-10 space-y-6">
        {/* Tenant Parent Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[32px] p-6 shadow-2xl space-y-4">
          <div>
            <p className="text-[10px] font-black text-[#0095E8] uppercase tracking-widest mb-1">Tenant Induk</p>
            <h3 className="text-[20px] font-black text-white leading-tight">{reading?.tenant_name}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Memiliki <strong className="text-[#0095E8]">{listToRender.length} KWH Meteran</strong> untuk disetujui.
            </p>
          </div>
        </div>

        {/* List of Meters */}
        <div className="space-y-4">
          {listToRender.map((item, idx) => (
            <div key={item.id || idx} className="bg-slate-900/40 border border-white/5 rounded-[28px] p-5 space-y-5 shadow-lg">
              {/* Meter Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Meteran #{idx + 1}</span>
                  <h4 className="text-[15px] font-black text-white mt-0.5">{item.section || 'Bagian Utama'}</h4>
                  <p className="text-[11px] font-mono text-[#0095E8] mt-0.5">No KWH: {item.meter_number}</p>
                </div>
                <span className="bg-white/5 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                  {item.status}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold bg-white/5 p-3 rounded-xl border border-white/5">
                <div>Lantai & Area: Lantai {item.floor || '-'}, Area {item.area || '-'}</div>
                <div>Daya Listrik: {item.power_capacity || '-'}</div>
                {item.period_start && item.period_end && (
                  <div className="col-span-2 mt-1.5 pt-1.5 border-t border-white/5 text-[#0095E8]">
                    Periode Penggunaan: <span className="font-bold text-white font-mono bg-white/5 px-2 py-0.5 rounded">{formatDateShort(item.period_start)} ➔ {formatDateShort(item.period_end)}</span>
                  </div>
                )}
              </div>

              {/* Photo Proof */}
              {item.meter_photo && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto Fisik Stand KWH (Petugas)</p>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(item.meter_photo)}
                    className="w-full relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 aspect-video flex items-center justify-center shadow-inner group cursor-zoom-in outline-none"
                  >
                    <img 
                      src={item.meter_photo} 
                      alt={`Foto meteran ${item.section}`} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                      Klik untuk Memperbesar
                    </div>
                  </button>
                </div>
              )}

              {/* Stand Values */}
              <div className="bg-gradient-to-br from-[#1E293B]/60 to-[#0F172A]/60 p-4 rounded-[20px] border border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Stand Awal</p>
                    <p className="text-[14px] font-bold text-white mt-1 font-mono truncate">{parseFloat(item.previous_reading)}</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Stand Akhir</p>
                    <p className="text-[14px] font-bold text-white mt-1 font-mono truncate">{parseFloat(item.current_reading)}</p>
                  </div>
                </div>
                
                <div className="bg-[#0095E8]/10 p-3 rounded-xl border border-[#0095E8]/20 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-[#0095E8] font-black uppercase tracking-wider">Konsumsi Pemakaian</p>
                    <p className="text-[16px] font-black text-[#0095E8] font-mono">
                      {parseFloat(item.usage_amount).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-[11px] font-bold">kWh</span>
                    </p>
                  </div>
                  <Zap size={18} className="text-[#0095E8] fill-[#0095E8]/10" />
                </div>
              </div>

              {/* Engineer Notes */}
              {item.notes && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[11px] leading-relaxed text-slate-300">
                  <p className="text-[8px] text-slate-500 font-black uppercase mb-0.5">Catatan Petugas</p>
                  <p className="italic">"{item.notes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Panel */}
        <div className="relative z-10">
          {overallStatus !== 'Pending' ? (
            <div className={`p-6 rounded-[32px] border text-center shadow-xl space-y-4 ${
              overallStatus === 'Approved' 
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-950/20 border-red-500/20 text-red-400'
            }`}>
              {overallStatus === 'Approved' ? (
                <>
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-black uppercase tracking-wider mb-1">Seluruh Meteran Disetujui</h4>
                    <p className="text-[12px] text-slate-400 leading-relaxed px-4">Pencatatan ini telah resmi disetujui secara mandiri.</p>
                  </div>

                  {/* Approver Identity card */}
                  {reading?.tenant_approver_name && (
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 text-left flex items-center gap-3 mt-3">
                      {reading?.tenant_approval_photo && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(reading.tenant_approval_photo)}
                          className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-slate-950 flex-shrink-0 cursor-zoom-in outline-none"
                        >
                          <img src={reading.tenant_approval_photo} className="w-full h-full object-cover" alt="Selfie Penyetuju" />
                        </button>
                      )}
                      <div>
                        <p className="text-[9px] text-[#0095E8] uppercase font-black tracking-widest">Nama Penyetuju</p>
                        <p className="text-[14px] font-black text-white leading-tight mt-0.5">{reading.tenant_approver_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Disetujui pada: {formatIndonesianDate(reading.approved_at)}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400 border border-red-500/20">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-black uppercase tracking-wider mb-1">Pencatatan Ditolak</h4>
                    <p className="text-[12px] text-slate-400 leading-relaxed mb-3">Pencatatan ini telah ditolak oleh tenant dengan alasan:</p>
                    <p className="text-[13px] font-black text-white bg-slate-900/60 p-3 rounded-xl italic">"{listToRender[0]?.notes || 'Ditolak'}"</p>
                  </div>
                </>
              )}
            </div>
          ) : !actionType ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setActionType('Approve');
                }}
                className="py-4 bg-[#50CD89] hover:bg-[#47b87b] active:scale-95 text-white rounded-[24px] font-black text-[15px] shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 size={18} /> Setuju Semua
              </button>
              <button
                onClick={() => {
                  setActionType('Reject');
                }}
                className="py-4 bg-slate-900 border border-red-500/30 text-red-400 hover:bg-slate-800 active:scale-95 rounded-[24px] font-black text-[15px] flex items-center justify-center gap-2 transition-all"
              >
                <XCircle size={18} /> Tolak Semua
              </button>
            </div>
          ) : (
            <form onSubmit={handleDecision} className="bg-slate-900/80 border border-white/10 rounded-[28px] p-5 shadow-2xl space-y-4">
              {actionType === 'Approve' ? (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black">Konfirmasi Persetujuan Bersama</h4>
                    <p className="text-[12px] text-slate-400 mt-1 leading-relaxed px-4">
                      Dengan mengonfirmasi, Anda menyetujui stand meteran yang tercatat di atas adalah sah dan benar.
                    </p>
                  </div>
                  
                  {/* Name Input */}
                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-black text-[#0095E8] uppercase tracking-widest">Nama Penyetuju (Tenant)</label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-2xl text-[12px] font-bold outline-none focus:border-[#0095E8] text-white transition-all"
                      required
                    />
                  </div>

                  {/* Photo Input */}
                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-black text-[#0095E8] uppercase tracking-widest block mb-1.5">Foto Selfie (Wajib)</label>
                    {approverPhoto ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 aspect-video flex items-center justify-center shadow-inner group">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(approverPhoto)}
                          className="w-full h-full cursor-zoom-in outline-none"
                          title="Klik untuk memperbesar foto selfie"
                        >
                          <img src={approverPhoto} alt="Bukti Persetujuan Selfie" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApproverPhoto('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="absolute right-2 top-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95 z-10"
                          title="Hapus foto selfie dan ambil ulang"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-white/10 hover:border-[#0095E8] bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors active:bg-white/10">
                        <div className="w-10 h-10 rounded-full bg-[#0095E8]/10 text-[#0095E8] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                        </div>
                        <span className="text-[11px] text-slate-300 font-bold">Ambil Foto Selfie</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="user" 
                          ref={fileInputRef} 
                          onChange={handlePhotoCapture} 
                          className="hidden" 
                          required
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('');
                        setApproverName('');
                        setApproverPhoto('');
                      }}
                      className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-[12px] text-slate-400 active:opacity-90 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={processing || !approverName.trim() || !approverPhoto}
                      className={`py-3 text-white font-black text-[12px] rounded-xl flex items-center justify-center gap-1 shadow-md transition-all ${
                        processing || !approverName.trim() || !approverPhoto
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                          : 'bg-[#50CD89] hover:bg-[#47b87b] active:scale-[0.98] shadow-emerald-500/20'
                      }`}
                    >
                      {processing ? 'Memproses...' : 'Ya, Setujui Semua'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 border border-red-500/20">
                      <XCircle size={20} />
                    </div>
                    <h4 className="text-[14px] font-black">Alasan Penolakan Bersama</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Harap sebutkan alasan penolakan agar petugas kami dapat mengoreksi seluruh meteran listrik ini.
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Angka stand meteran tidak sesuai..."
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-2xl text-[12px] font-bold outline-none focus:border-red-500 text-white h-24 resize-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActionType('')}
                      className="py-3 bg-slate-800 rounded-xl font-bold text-[12px] text-slate-400 active:opacity-90"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="py-3 bg-[#F1416C] text-white font-black text-[12px] rounded-xl active:opacity-90 flex items-center justify-center gap-1 shadow-md shadow-red-500/20"
                    >
                      {processing ? 'Mengirim...' : 'Kirim Penolakan'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>



      {/* Universal Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100000] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-3xl overflow-hidden shadow-2xl animate-scale-up flex flex-col items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 z-10 active:scale-95"
            >
              <X size={20} />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantApprovalListrik;
