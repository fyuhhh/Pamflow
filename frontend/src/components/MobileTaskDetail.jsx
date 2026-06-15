import React, { useState, useEffect } from 'react';
import { ChevronLeft, Phone, MoreHorizontal, ChevronDown, ChevronUp, Clock, MapPin, CheckCircle2, Check, HelpCircle, Info } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { authFetch } from '../services/api';
import { saveOfflineData } from '../services/offlineDB';

const MobileTaskDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const taskId = params.taskId || location.pathname.split('/').pop();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState("Tugas telah dimulai");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSubConfirm, setShowSubConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [catatanMaterial, setCatatanMaterial] = useState('');
  const [catatanPengerjaan, setCatatanPengerjaan] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const showError = (title, message) => {
    alert(`${title}: ${message}`);
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  useEffect(() => {
    // Check if we came from form submission
    if (location.state?.formSubmitted) {
      setBannerText("Form Telah Diisi");
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskRes, historyRes] = await Promise.all([
        authFetch(`/api/tasks/${taskId}`),
        authFetch(`/api/tasks/${taskId}/history`)
      ]);

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        let historyData = [];
        if (historyRes.ok) {
          historyData = await historyRes.json();
        }
        setTask({ ...taskData, history: historyData });
      }
    } catch (err) {
      console.error('Fetch task details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNoteOnly = async () => {
    try {
      setLoadingAction(true);
      const response = await authFetch(`/api/tasks/${taskId}/material-note`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          catatan_material: catatanMaterial,
          nama_agen: user.firstName || user.username,
          agent_id: user.id
        })
      });

      if (response.ok) {
        setBannerText('Catatan material berhasil dikirim!');
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
        setShowConfirm(false);
        // Do NOT set isMaterialChecked to true here
      } else {
        const errorData = await response.json();
        showError('Gagal', errorData.message || 'Gagal mengirim catatan.');
      }
    } catch (err) {
      console.error('Update note error:', err);
      showError('Gagal', 'Terjadi kesalahan saat mengirim catatan.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          resolve({ latitude: null, longitude: null });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleStartTask = async () => {
    try {
      setBannerText("Mengambil lokasi GPS...");
      setShowBanner(true);
      const coords = await getCoordinates();

      const response = await authFetch(`/api/tasks/${taskId}/start`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id,
          latitude: coords.latitude,
          longitude: coords.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setTask(prev => ({ 
          ...prev, 
          progres: 'Berlangsung',
          waktu_dimulai: data.waktu_dimulai 
        }));
        setBannerText("Tugas telah dimulai");
        setShowBanner(true);
        // Hide banner after 5 seconds
        setTimeout(() => setShowBanner(false), 5000);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      // Offline Fallback
      if (!navigator.onLine) {
        // Assume coords were already fetched before error if offline
        const coords = await getCoordinates();
        await saveOfflineData('START_TASK', { 
          id: taskId, 
          payload: { 
            nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
            agent_id: user?.id,
            latitude: coords.latitude,
            longitude: coords.longitude
          } 
        });
        setTask(prev => ({ ...prev, progres: 'Berlangsung', waktu_dimulai: new Date().toISOString() }));
        setBannerText("Tugas dimulai (Offline)");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          // For start task, we might want to stay to see the 'Isi Form' button
        }, 1500);
      }
    }
  };

  const handleMaterialChecked = async () => {
    try {
      setBannerText("Menyimpan status material...");
      setShowBanner(true);

      const response = await authFetch(`/api/tasks/${taskId}/material-checked`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id,
          catatan_material: catatanMaterial
        })
      });

      if (response.ok) {
        // Update local state and fetch fresh history
        setTask(prev => ({ 
          ...prev, 
          progres: 'Berlangsung'
        }));
        await fetchTaskDetails(); // Refresh to get the new history timestamp
        setBannerText("Pengecekan material selesai");
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 5000);
      }
    } catch (error) {
      console.error('Error in material checked:', error);
      // Offline Fallback could be added here if necessary
    }
    setShowConfirm(false);
    setCatatanMaterial('');
  };

  const handleProceedToMaterialCheck = async () => {
    try {
      setBannerText("Menyimpan progres pengerjaan...");
      setShowBanner(true);

      const response = await authFetch(`/api/tasks/${taskId}/proceed-to-material-check`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id,
          catatan_pengerjaan: catatanPengerjaan
        })
      });

      if (response.ok) {
        // Update local state and fetch fresh history
        setTask(prev => ({ 
          ...prev, 
          progres: 'Menunggu Material'
        }));
        await fetchTaskDetails();
        setBannerText("Proses pengerjaan selesai, lanjut cek material");
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 5000);
      }
    } catch (error) {
      console.error('Error in proceed to material check:', error);
    }
    setShowConfirm(false);
    setShowSubConfirm(false);
    setCatatanPengerjaan('');
  };

  const handleUpdatePengerjaanNote = async () => {
    try {
      setBannerText("Mengirim catatan pengerjaan...");
      setShowBanner(true);

      const response = await authFetch(`/api/tasks/${taskId}/pengerjaan-note`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id,
          catatan_pengerjaan: catatanPengerjaan
        })
      });

      if (response.ok) {
        await fetchTaskDetails();
        setBannerText("Catatan pengerjaan terkirim");
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
    } catch (error) {
      console.error('Error updating pengerjaan note:', error);
    }
    setShowConfirm(false);
  };

  const handleFinishTask = async () => {
    try {
      setBannerText("Mengambil lokasi GPS...");
      setShowBanner(true);
      const coords = await getCoordinates();

      const response = await authFetch(`/api/tasks/${taskId}/finish`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id,
          latitude: coords.latitude,
          longitude: coords.longitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTask(prev => ({ 
          ...prev, 
          progres: 'Selesai',
          waktu_selesai_aktual: data.waktu_selesai_aktual 
        }));
        setBannerText("Tugas telah diselesaikan");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          navigate('/demo/mobile');
        }, 1500);
      }
    } catch (error) {
      console.error('Error finishing task:', error);
      // Offline Fallback
      if (!navigator.onLine) {
        const coords = await getCoordinates();
        await saveOfflineData('FINISH_TASK', { 
          id: taskId, 
          payload: { 
            nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
            agent_id: user?.id,
            latitude: coords.latitude,
            longitude: coords.longitude
          } 
        });
        setTask(prev => ({ ...prev, progres: 'Selesai', waktu_selesai_aktual: new Date().toISOString() }));
        setBannerText("Tugas diselesaikan (Offline)");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          navigate('/demo/mobile');
        }, 1500);
      }
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
        setTask(prev => ({ ...prev, progres: 'Selesai', approval_status: 'Approved' }));
        setBannerText("Tugas telah disetujui");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          navigate('/demo/mobile');
        }, 1500);
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
        setTask(prev => ({ ...prev, progres: 'Ditolak', approval_status: 'Rejected' }));
        setBannerText("Tugas telah ditolak");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          navigate('/demo/mobile');
        }, 1500);
      }
    } catch (err) {
      console.error('Error rejecting task:', err);
    }
    setShowApprovalModal(false);
    setApprovalNotes('');
  };

  const handleResubmit = async () => {
    try {
      const response = await authFetch(`/api/tasks/${taskId}/finish`, {
        method: 'PATCH',
        body: JSON.stringify({
          nama_agen: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Agen',
          agent_id: user?.id
        })
      });
      if (response.ok) {
        setTask(prev => ({ ...prev, progres: 'Menunggu Approval Penyelesaian' }));
        setBannerText("Tugas diajukan ulang untuk approval");
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          navigate('/demo/mobile');
        }, 1500);
      }
    } catch (err) {
      console.error('Error resubmitting task:', err);
    }
  };

  const renderApprovalModal = () => {
    if (!showApprovalModal) return null;
    const isApprove = approvalAction === 'approve';
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-2xl p-6 max-w-[90%] w-full shadow-lg mx-6 animate-slide-up">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isApprove ? 'bg-[#E8F5E9]' : 'bg-[#FFF5F8]'}`}>
            <div className={`w-10 h-10 rounded-full border-[3px] flex items-center justify-center ${isApprove ? 'border-[#C8E6C9]' : 'border-[#FCCCD5]'}`}>
              {isApprove ? (
                <Check size={20} className="text-[#2E7D32]" strokeWidth={3} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F1416C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              )}
            </div>
          </div>

          <h3 className="text-xl font-medium text-[#181C32] mb-2">
            {isApprove ? 'Setujui Tugas?' : 'Tolak Tugas?'}
          </h3>
          <p className="text-[13px] text-[#7E8299] mb-4">
            {isApprove 
              ? 'Tugas akan ditandai sebagai selesai dan tidak dapat diubah lagi.' 
              : 'Tugas akan dikembalikan ke agen untuk diperbaiki dan diajukan ulang.'}
          </p>

          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder={isApprove ? 'Catatan approval (opsional)...' : 'Alasan penolakan (opsional)...'}
            className="w-full px-4 py-3 border border-[#F1F1F4] rounded-xl text-sm focus:outline-none focus:border-[#0095E8] mb-5 resize-none"
            rows={3}
          />

          <div className="flex gap-3">
            <button
              onClick={isApprove ? handleApproveTask : handleRejectTask}
              className={`flex-1 py-3 rounded-xl text-[14px] font-bold text-white active:scale-95 transition-transform ${
                isApprove ? 'bg-[#2E7D32] hover:bg-[#1B5E20]' : 'bg-[#F1416C] hover:bg-[#D63657]'
              }`}
            >
              {isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}
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
    );
  };

  const renderConfirmModal = () => {
    if (!showConfirm) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-[90%] w-full shadow-lg mx-6 animate-slide-up">
          <div className="w-14 h-14 rounded-full bg-[#FFF9E6] flex items-center justify-center mb-6">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#FFF2CC] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-[#181C32] mb-3">
            {confirmConfig.title}
          </h3>
          <p className={`text-[14px] leading-relaxed text-[#7E8299] ${confirmConfig.title === 'Selesai Cek Material' ? 'mb-4' : 'mb-8'}`}>
            {confirmConfig.message}
          </p>

          {confirmConfig.title === 'Lanjut ke Pengecekan Material' && (
            <div className="mb-6">
              <label className="block text-[13px] font-bold text-[#3F4254] mb-2">Catatan Pengerjaan (Opsional)</label>
              <textarea
                value={catatanPengerjaan}
                onChange={(e) => setCatatanPengerjaan(e.target.value)}
                placeholder="Masukkan catatan pengerjaan jika ada..."
                className="w-full px-4 py-3 border border-[#F1F1F4] rounded-xl text-[13px] text-[#3F4254] focus:outline-none focus:border-[#0095E8] resize-none"
                rows={3}
              />
            </div>
          )}

          {confirmConfig.title === 'Selesai Cek Material' && (
            <div className="mb-6">
              <label className="block text-[13px] font-bold text-[#3F4254] mb-2">Catatan Material (Opsional)</label>
              <textarea
                value={catatanMaterial}
                onChange={(e) => setCatatanMaterial(e.target.value)}
                placeholder="Masukkan catatan jika ada material yang kurang/rusak..."
                className="w-full px-4 py-3 border border-[#F1F1F4] rounded-xl text-[13px] text-[#3F4254] focus:outline-none focus:border-[#0095E8] resize-none"
                rows={3}
              />
            </div>
          )}
          
          <div className="flex gap-4">
            {confirmConfig.title === 'Lanjut ke Pengecekan Material' ? (
              <>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSubConfirm(true);
                  }} 
                  className="flex-1 py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors active:scale-95"
                >
                  Lanjut
                </button>
                <button 
                  type="button" 
                  onClick={handleUpdatePengerjaanNote} 
                  className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[14px] font-bold text-[#005499] hover:bg-gray-50 transition-colors active:scale-95"
                >
                  Kirim Catatan
                </button>
              </>
            ) : confirmConfig.title === 'Selesai Cek Material' ? (
              <>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSubConfirm(true);
                  }} 
                  className="flex-1 py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors active:scale-95"
                >
                  Lanjut
                </button>
                <button 
                  type="button" 
                  onClick={handleUpdateNoteOnly} 
                  className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[14px] font-bold text-[#005499] hover:bg-gray-50 transition-colors active:scale-95"
                >
                  Kirim Catatan
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => {
                    confirmConfig.onConfirm();
                  }} 
                  className="flex-1 py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors active:scale-95"
                >
                  Lanjut
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowConfirm(false);
                  }} 
                  className="flex-1 py-3 bg-white border border-[#E4E6EF] rounded-xl text-[14px] font-bold text-[#005499] hover:bg-gray-50 transition-colors active:scale-95"
                >
                  Cek Kembali
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub Confirmation Modal */}
        {showSubConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-[85%] w-full shadow-2xl animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-[#E1F5FE] flex items-center justify-center mb-6 mx-auto">
                <HelpCircle size={32} className="text-[#0095E8]" />
              </div>
              <h3 className="text-xl font-bold text-[#181C32] text-center mb-4">Konfirmasi Lanjut</h3>
              <p className="text-[14px] leading-relaxed text-[#7E8299] text-center mb-8">
                {confirmConfig.title === 'Lanjut ke Pengecekan Material' 
                  ? 'Apakah Anda yakin ingin lanjut ke proses pengecekan material?'
                  : 'Apakah Anda yakin sudah selesai mengecek material dan ingin melanjutkan ke tahap Isi Form Tugas?'}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowSubConfirm(false);
                    confirmConfig.onConfirm();
                  }}
                  className="flex-1 py-3.5 bg-[#0095E8] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  Ya, Lanjut
                </button>
                <button 
                  onClick={() => setShowSubConfirm(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[14px] active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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

  const isAuditTask = task.checklist_session_id != null;
  const hasStarted = task.waktu_dimulai != null;
  
  // New: Stage identification for Audit Tasks
  const hasReachedMaterialCheck = task.waktu_material_dicek != null || task.history?.some(h => h.progres === 'Menunggu Material');
  const isWorking = isAuditTask && task.progres === 'Berlangsung' && !hasReachedMaterialCheck;
  const isWaitingMaterial = task.progres === 'Menunggu Material' && !task.waktu_material_dicek;
  const isFillingForm = (isAuditTask ? (hasReachedMaterialCheck || task.waktu_material_dicek) : hasStarted) && (task.progres === 'Berlangsung' || (isAuditTask && task.progres === 'Menunggu Material' && task.waktu_material_dicek));
  
  const isStarted = isWaitingMaterial || task.progres === 'Berlangsung' || task.progres === 'Selesai' || task.progres === 'Menunggu Approval' || task.progres === 'Menunggu Approval Penyelesaian' || task.progres === 'Ditolak' || (isAuditTask && task.progres === 'Menunggu Material' && task.waktu_material_dicek);
  const isMaterialChecked = (isAuditTask ? (task.waktu_material_dicek != null) : false) || task.progres === 'Selesai' || task.progres === 'Menunggu Approval' || task.progres === 'Menunggu Approval Penyelesaian' || task.progres === 'Ditolak';
  
  const isFinished = task.progres === 'Selesai';
  const isWaitingApproval = task.progres === 'Menunggu Approval' || task.progres === 'Menunggu Approval Penyelesaian';
  const isRejected = task.progres === 'Ditolak';
  const isFormFilled = !!task.waktu_dikirim;
  const canApprove = user?.can_approve === 1 || user?.can_approve === true;

  const getHistoryTime = (progresState) => {
    if (!task.history) return null;
    const item = [...task.history].reverse().find(h => h.progres === progresState);
    return item ? item.waktu_mulai : null;
  };

  const timeMulai = isAuditTask ? getHistoryTime('Menunggu Material') || task.waktu_dimulai : task.waktu_dimulai;
  const timeMaterialChecked = isAuditTask ? (task.waktu_material_dicek || getHistoryTime('Berlangsung')) : null;

  const formatScheduleDate = (dateString, timeString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timePart = timeString ? timeString.substring(0, 5) : '00:00';
    return `${datePart} - ${timePart}`;
  };

  const formatActualTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const datePart = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timePart = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace('.', ':');
    return `${datePart} ${timePart}`;
  };

  return (
    <>
      {/* Success Banner */}
      {showBanner && (
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#2E7D32] text-white flex items-center justify-center gap-3 shadow-2xl animate-banner-flow px-6 py-4"
          style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
        >
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
            <Check size={14} className="text-[#2E7D32]" strokeWidth={3} />
          </div>
          <span className="font-bold text-[14px] leading-tight">{bannerText}</span>
        </div>
      )}

      <div className="bg-white font-sans flex flex-col relative">
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
            <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">Detail Tugas</h1>
          </div>
          <button className="p-1">
            <MoreHorizontal size={24} className="text-slate-400" />
          </button>
        </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pt-6 overflow-y-auto no-scrollbar">
        {/* Badges */}
        <div className="flex gap-2 mb-4">
          <span className={`text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase ${
            isFinished ? 'bg-[#E8F5E9] text-[#2E7D32]' :
            isWaitingApproval ? 'bg-[#FFF8E1] text-[#FF8F00]' :
            isRejected ? 'bg-[#FFF5F8] text-[#F1416C]' :
            (task.progres === 'Berlangsung' || task.progres === 'Menunggu Material') ? 'bg-[#FFF8E1] text-[#FF8F00]' :
            'bg-[#E0F7FA] text-[#0095E8]'
          }`}>
            {task.progres === 'Menunggu Material' ? 'Cek Material' : (task.progres || 'Terbuka')}
          </span>
          <span className={`text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase ${
            task.urgensi === 'Kritis' ? 'bg-[#FFF5F8] text-[#F1416C]' : 
            task.urgensi === 'Normal' ? 'bg-[#E8EAF6] text-[#283593]' :
            'bg-[#F5F5F5] text-gray-500'
          }`}>
            Urgensi {task.urgensi || 'Normal'}
          </span>
          {task.jenis_tugas === 'wo' ? (
            <span className="text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase bg-[#F8E3FF] text-[#7239EA] border border-[#7239EA]/20 shadow-sm">
              WO
            </span>
          ) : (
            <span className="text-[10px] font-bold px-4 py-1.5 rounded-lg uppercase bg-[#F1FAFF] text-[#0095E8] border border-[#0095E8]/20 shadow-sm">
              Checklist
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
          {task.nama_tugas}
        </h2>

        {/* Description */}
        <div className="relative mb-6 text-wrap">
          <p className={`text-[13px] text-slate-500 leading-relaxed whitespace-pre-wrap ${!showFullDesc && 'line-clamp-2'}`}>
            {task.deskripsi || 'Tidak ada deskripsi untuk tugas ini.'}
          </p>
          {task.deskripsi && task.deskripsi.length > 50 && (
            <button 
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="mt-1 text-[13px] font-bold text-[#006097] flex items-center gap-1"
            >
              {showFullDesc ? 'Sembunyikan' : 'Selengkapnya'}
            </button>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-[#E1F5FE]/40 border border-[#E1F5FE] rounded-2xl p-5 mb-8">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">Waktu pengerjaan</p>
              <p className="text-[14px] font-bold text-slate-700">
                {formatScheduleDate(task.tanggal_mulai, task.waktu_mulai)}
              </p>
            </div>
            <div className="h-[1px] bg-[#E1F5FE]" />
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5">Alamat</p>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-400 mt-0.5" />
                <p className="text-[13px] font-medium text-slate-500 leading-tight">
                  {task.lokasi || '-'}{task.detail_alamat ? `, ${task.detail_alamat}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="space-y-0.5">
          {/* Step 1: Mulai Tugas */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {isStarted ? (
                <div className="w-6 h-6 rounded-full bg-[#1B3B6F] flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center bg-white z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                </div>
              )}
              <div className={`w-[2px] h-16 -mt-1 -mb-1 ${isStarted ? 'bg-[#1B3B6F]' : 'bg-slate-100'}`} />
            </div>
            <div className="pb-8">
              <h3 className={`text-[15px] font-bold mb-1 ${isStarted ? 'text-slate-800' : 'text-slate-800'}`}>Mulai Tugas</h3>
              <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                {timeMulai ? formatActualTime(timeMulai) : 'Tekan tombol "Mulai Tugas" untuk memulai tugas.'}
              </p>
            </div>
          </div>

          {/* Step 1.2: Pengerjaan (Hanya untuk Audit Task) */}
          {isAuditTask && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                {hasReachedMaterialCheck ? (
                  <div className="w-6 h-6 rounded-full bg-[#1B3B6F] flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5">
                    <Check size={14} strokeWidth={3} className="text-white" />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5 ${isStarted ? 'border-slate-200 bg-white' : 'bg-slate-200'}`}>
                    {!isStarted && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                  </div>
                )}
                <div className={`w-[2px] h-16 -mt-1 -mb-1 ${hasReachedMaterialCheck ? 'bg-[#1B3B6F]' : 'bg-slate-100'}`} />
              </div>
              <div className="pb-8">
                <h3 className={`text-[15px] font-bold ${isStarted ? 'text-slate-800' : 'text-slate-400'}`}>Pengerjaan</h3>
                {hasReachedMaterialCheck ? (
                  <p className="text-[12px] text-slate-400 font-medium mt-1">
                    Pengerjaan selesai pada {formatActualTime(getHistoryTime('Menunggu Material'))}
                  </p>
                ) : (
                  isStarted && <p className="text-[12px] text-slate-400 font-medium mt-1">Status: Berlangsung</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1.5: Pengecekan Material (Hanya untuk Audit Task) */}
          {isAuditTask && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                {isMaterialChecked ? (
                  <div className="w-6 h-6 rounded-full bg-[#1B3B6F] flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5">
                    <Check size={14} strokeWidth={3} className="text-white" />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5 ${isStarted ? 'border-slate-200 bg-white' : 'bg-slate-200'}`}>
                    {!isStarted && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                  </div>
                )}
                <div className={`w-[2px] h-16 -mt-1 -mb-1 ${isMaterialChecked ? 'bg-[#1B3B6F]' : 'bg-slate-100'}`} />
              </div>
              <div className="pb-8">
                <h3 className={`text-[15px] font-bold ${isStarted ? 'text-slate-800' : 'text-slate-400'}`}>Pengecekan Material</h3>
                {isMaterialChecked ? (
                  <p className="text-[12px] text-slate-400 font-medium mt-1">
                    Material telah dicek pada {formatActualTime(timeMaterialChecked)}
                  </p>
                ) : (
                  isStarted && <p className="text-[12px] text-slate-400 font-medium mt-1">Tekan "Selesai Cek Material" jika sudah siap.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Isi form tugas */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {isFormFilled ? (
                <div className="w-6 h-6 rounded-full bg-[#1B3B6F] flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </div>
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5 ${(isAuditTask ? isMaterialChecked : isStarted) ? 'border-slate-200 bg-white' : 'bg-slate-200'}`}>
                  {!(isAuditTask ? isMaterialChecked : isStarted) && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                </div>
              )}
              <div className={`w-[2px] h-16 -mt-1 -mb-1 ${isFormFilled ? 'bg-[#1B3B6F]' : 'bg-slate-100'}`} />
            </div>
            <div className="pb-8">
              <h3 className={`text-[15px] font-bold ${(isAuditTask ? isMaterialChecked : isStarted) ? 'text-slate-800' : 'text-slate-400'}`}>Isi form tugas</h3>
              {isFormFilled ? (
                <div className="space-y-1">
                  <p className="text-[12px] text-slate-400 font-medium mt-1">
                    Telah terkirim pada {formatActualTime(task.waktu_dikirim)}
                  </p>
                  <button 
                    onClick={() => navigate(`/demo/mobile/task/${taskId}/form`)}
                    className="text-[13px] font-bold text-[#006097] underline"
                  >
                    Lihat form tugas
                  </button>
                </div>
              ) : (
                (isAuditTask ? isMaterialChecked : isStarted) && <p className="text-[12px] text-slate-400 font-medium mt-1">Silakan isi form tugas</p>
              )}
            </div>
          </div>

          {/* Step 3: Tugas selesai */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              {isFinished ? (
                 <div className="w-6 h-6 rounded-full bg-[#1B3B6F] flex items-center justify-center z-10 border-4 border-white shadow-sm -ml-0.5">
                    <Check size={14} strokeWidth={3} className="text-white" />
                 </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center z-10 -ml-0.5" />
              )}
            </div>
            <div className="pb-8">
              <h3 className={`text-[15px] font-bold ${isFormFilled ? 'text-slate-800' : 'text-slate-400'}`}>Tugas selesai</h3>
              {isFinished ? (
                <p className="text-[12px] text-slate-400 font-medium mt-1">
                  Tugas telah diselesaikan pada {formatActualTime(task.waktu_selesai_aktual)}
                </p>
              ) : (
                isFormFilled && <p className="text-[12px] text-slate-400 font-medium mt-1">Tekan tombol "Selesaikan Tugas" untuk menyelesaikan tugas</p>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Bottom Sticky Action Bar - Fixed Bottom (Common Mobile Pattern) */}
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-50 px-6 py-3 flex gap-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: '6px' }}
        >
          <button className="p-3 border border-slate-200 rounded-xl text-slate-700 active:scale-95 transition-transform flex items-center justify-center">
            <Phone size={22} strokeWidth={2.5} />
          </button>
          {!isFinished && !isWaitingApproval && !isRejected && (
            <button 
              onClick={() => {
                if (isFormFilled) {
                  setConfirmConfig({
                    title: 'Selesaikan Tugas',
                    message: 'Apakah Anda yakin ingin menyelesaikan tugas ini? Tugas akan dikirim untuk approval.',
                    onConfirm: handleFinishTask
                  });
                  setShowConfirm(true);
                } else if (isWorking) {
                  setConfirmConfig({
                    title: 'Lanjut ke Pengecekan Material',
                    message: 'Apakah Anda yakin ingin melanjutkan ke proses pengecekan material?',
                    onConfirm: handleProceedToMaterialCheck
                  });
                  setShowConfirm(true);
                } else if (isAuditTask && isStarted && !isMaterialChecked) {
                  setConfirmConfig({
                    title: 'Selesai Cek Material',
                    message: 'Apakah Anda sudah selesai melakukan pengecekan material?',
                    onConfirm: handleMaterialChecked
                  });
                  setShowConfirm(true);
                } else if (isAuditTask ? isMaterialChecked : isStarted) {
                  navigate(`/demo/mobile/task/${taskId}/form`);
                } else {
                  setConfirmConfig({
                    title: 'Mulai Tugas',
                    message: 'Apakah Anda yakin ingin memulai tugas ini sekarang? Waktu mulai akan dicatat secara otomatis.',
                    onConfirm: handleStartTask
                  });
                  setShowConfirm(true);
                }
              }}
              className="flex-1 bg-[#004A71] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
            >
              {isFormFilled 
                ? 'Selesaikan Tugas' 
                : isWorking
                  ? 'Lanjut'
                  : (isAuditTask && isStarted && !isMaterialChecked)
                    ? 'Cek Material'
                    : (isAuditTask ? isMaterialChecked : isStarted) 
                      ? 'Isi Form Tugas' 
                      : 'Mulai Tugas'}
            </button>
          )}

          {/* Waiting Approval - show approve/reject for approvers */}
          {isWaitingApproval && canApprove && (
            <>
              <button
                onClick={() => { setApprovalAction('approve'); setShowApprovalModal(true); }}
                className="flex-1 bg-[#2E7D32] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                Setujui
              </button>
              <button
                onClick={() => { setApprovalAction('reject'); setShowApprovalModal(true); }}
                className="flex-1 bg-[#F1416C] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                Tolak
              </button>
            </>
          )}

          {/* Waiting Approval - non-approver info */}
          {isWaitingApproval && !canApprove && (
            <div className="flex-1 bg-[#FFF8E1] text-[#FF8F00] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
              <Clock size={20} />
              Menunggu Approval
            </div>
          )}

          {/* Rejected - re-submit button */}
          {isRejected && (
            <button
              onClick={() => {
                setConfirmConfig({
                  title: 'Ajukan Ulang',
                  message: 'Apakah Anda yakin ingin mengajukan ulang tugas ini untuk approval?',
                  onConfirm: handleResubmit
                });
                setShowConfirm(true);
              }}
              className="flex-1 bg-[#FF8F00] text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
            >
              Ajukan Ulang
            </button>
          )}

          {isFinished && (
            <div className="flex-1 bg-green-50 text-[#2E7D32] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Tugas Selesai
            </div>
          )}
        </div>

       {renderConfirmModal()}
       {renderApprovalModal()}
       <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes banner-flow {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-banner-flow { animation: banner-flow 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
      </div>
    </>
  );
};

export default MobileTaskDetail;
