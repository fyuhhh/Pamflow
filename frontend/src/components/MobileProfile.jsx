import React, { useState, useEffect } from 'react';
import { User, Lock, FileText, ShieldCheck, LogOut, ChevronRight, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader, Phone, Bell, BellOff, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { toast } from 'react-hot-toast';
import { checkPushSubscriptionStatus, subscribeToPushNotifications, unsubscribeFromPushNotifications, testPushNotification } from '../services/pushService';
import { motion, AnimatePresence } from 'framer-motion';

const MobileProfile = ({ onLogout }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const firstName = user?.firstName || 'Pengguna';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${(lastName || firstName).charAt(lastName ? 0 : 1) || ''}`.toUpperCase();

  // Modals State
  const [showDataModal, setShowDataModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  // Pin State
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pinData, setPinData] = useState({ current: '', newPin: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState(null); // null | 'success' | 'error'
  const [pwMsg, setPwMsg] = useState('');

  // Push Notification State
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkPushSubscriptionStatus();
      setIsPushEnabled(status);
    };
    checkStatus();
  }, []);

  const handleTogglePush = async () => {
    setIsLoadingPush(true);
    try {
      if (isPushEnabled) {
        const res = await unsubscribeFromPushNotifications();
        if (res?.success) {
          setIsPushEnabled(false);
          toast.success(res.message);
        } else {
          toast.error(res?.message || 'Gagal menonaktifkan notifikasi');
        }
      } else {
        const res = await subscribeToPushNotifications(user?.id, false);
        if (res?.success) {
          setIsPushEnabled(true);
          toast.success(res.message);
        } else {
          toast.error(res?.message || 'Gagal mengaktifkan notifikasi');
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoadingPush(false);
    }
  };

  const handleTestPush = async () => {
    setIsLoadingPush(true);
    const res = await testPushNotification(user?.id);
    if (res?.success) {
      toast.success(res.message);
    } else {
      toast.error(res?.message || 'Gagal mengirim notifikasi tes');
    }
    setIsLoadingPush(false);
  };


  const closeModal = () => {
    setShowChangeModal(false);
    setShowPushModal(false);
    setPinData({ current: '', newPin: '', confirm: '' });
    setPwResult(null);
    setPwMsg('');
    setShowCurrentPw(false);
    setShowNewPw(false);
  };

  useEffect(() => {
    const nav = document.getElementById('mobile-nav-bar');
    const isAnyModalOpen = showDataModal || showChangeModal || showLogoutConfirm || showPushModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      if (nav) nav.style.display = 'none';
    } else {
      document.body.style.overflow = '';
      if (nav) nav.style.display = 'flex';
    }

    return () => {
      document.body.style.overflow = '';
      if (nav) nav.style.display = 'flex';
    };
  }, [showDataModal, showChangeModal, showLogoutConfirm, showPushModal]);

  const handleChangePin = async () => {
    setPwMsg('');
    if (!pinData.current || !pinData.newPin || !pinData.confirm) {
      setPwResult('error');
      setPwMsg('Semua field wajib diisi.');
      return;
    }
    if (pinData.newPin !== pinData.confirm) {
      setPwResult('error');
      setPwMsg('PIN baru dan konfirmasi tidak sama.');
      return;
    }
    if (pinData.newPin.length !== 6) {
      setPwResult('error');
      setPwMsg('PIN baru harus 6 digit.');
      return;
    }
    setPwLoading(true);
    setPwResult(null);
    try {
      const response = await authFetch(`/api/users/${user.id}/pin`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPin: pinData.current,
          newPin: pinData.newPin,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPwResult('success');
        setPwMsg('PIN berhasil diperbarui!');
      } else {
        setPwResult('error');
        setPwMsg(data.message || 'Gagal mengubah PIN.');
      }
    } catch (err) {
      setPwResult('error');
      setPwMsg('Gagal menghubungkan ke server.');
    } finally {
      setPwLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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

  return (
    <div className="bg-gradient-to-b from-[#0061D1] to-[#0095E8] min-h-full font-sans flex flex-col relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl -translate-x-1/2 pointer-events-none"></div>

      {/* Profile Header Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-6 pb-12 flex items-center justify-between text-white"
        style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-lg border border-white/30 shadow-lg">
            {initials}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold tracking-tight leading-tight drop-shadow-sm">{fullName}</h2>
            <p className="text-white/80 text-[11px] font-medium tracking-wide mt-0.5 uppercase">{user?.role || 'AGEN'}</p>
          </div>
        </div>
      </motion.div>

      {/* White Content Card */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex-1 bg-white rounded-t-[32px] px-6 pt-9 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-32"
      >
        {/* Pengaturan Akun */}
        <div className="mb-8">
          <motion.h3 variants={itemVariants} className="text-[17px] font-bold text-slate-800 mb-4">Pengaturan Akun</motion.h3>
          <div className="space-y-3">
            <motion.div variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDataModal(true)}
                className="w-full flex items-center justify-between p-4 bg-[#F5F8FA] hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0095E8] shadow-sm">
                    <User size={20} />
                  </div>
                  <span className="text-[15px] font-bold text-slate-700">Data Saya</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowChangeModal(true)}
                className="w-full flex items-center justify-between p-4 bg-[#F5F8FA] hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0095E8] shadow-sm">
                    <Lock size={20} />
                  </div>
                  <span className="text-[15px] font-bold text-slate-700">Ubah PIN Akses</span>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPushModal(true)}
                className="w-full flex items-center justify-between p-4 bg-[#F5F8FA] hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isPushEnabled ? 'bg-[#0095E8] text-white' : 'bg-white text-slate-500'}`}>
                    {isPushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[15px] font-bold text-slate-700">Notifikasi Push</span>
                    <span className={`text-[11px] font-bold mt-0.5 ${isPushEnabled ? 'text-[#0095E8]' : 'text-slate-400'}`}>
                      {isPushEnabled ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Lainnya */}
        <div className="mb-8">
          <motion.h3 variants={itemVariants} className="text-[17px] font-bold text-slate-800 mb-4">Lainnya</motion.h3>
          <div className="space-y-3">
            <motion.div variants={itemVariants}>
              <div className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#F1F1F4]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-slate-700">Debug Izin Aset</span>
                  <span className="text-[10px] font-bold text-[#0095E8] bg-[#E1F0FF] px-2 py-0.5 rounded">v1.9.0</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {['aset_menu', 'aset_register', 'aset_monitoring', 'aset_audit', 'aset_hak_akses'].map(mod => (
                    <div key={mod} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user?.permissions?.[mod] ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-medium text-slate-500 truncate">{mod.replace('aset_', '')}</span>
                    </div>
                  ))}
                </div>
                {user?.permissions?.aset_menu ? (
                  <p className="text-[10px] text-green-600 font-bold mt-3 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-2">
                    <CheckCircle size={12} /> Menu Aset Terdeteksi
                  </p>
                ) : (
                  <p className="text-[10px] text-red-600 font-bold mt-3 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertCircle size={12} /> Menu Aset TIDAK Terdeteksi
                  </p>
                )}
              </div>
            </motion.div>

            {[
              { icon: FileText, label: 'Syarat & Ketentuan' },
              { icon: ShieldCheck, label: 'Kebijakan Privasi' }
            ].map((item, idx) => (
              <motion.div variants={itemVariants} key={item.label}>
                <motion.button whileTap={{ scale: 0.97 }} className="w-full flex items-center justify-between p-4 bg-[#F5F8FA] hover:bg-slate-100 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                      <item.icon size={20} />
                    </div>
                    <span className="text-[15px] font-bold text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-4 mt-2 bg-[#FFF5F8] border border-[#F1416C]/20 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#F1416C] shadow-sm">
                <LogOut size={20} />
              </div>
              <span className="text-[15px] font-bold text-[#F1416C]">Keluar</span>
            </div>
            <ChevronRight size={18} className="text-[#F1416C]/50" />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Modals using AnimatePresence */}
      <AnimatePresence>
        {/* Push Notification Settings Modal */}
        {showPushModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 pb-10 shadow-2xl max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar"
              style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-black text-slate-800">Notifikasi Push</h3>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-[#F5F8FA] rounded-3xl p-6 mb-8 border border-slate-100 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${isPushEnabled ? 'bg-[#0095E8] text-white shadow-blue-200' : 'bg-white text-slate-400 shadow-slate-200'}`}>
                  {isPushEnabled ? <Bell size={32} /> : <BellOff size={32} />}
                </div>
                <h4 className="text-[17px] font-black text-slate-800 mb-2">
                  Status: <span className={isPushEnabled ? 'text-[#0095E8]' : 'text-slate-500'}>{isPushEnabled ? 'Aktif' : 'Tidak Aktif'}</span>
                </h4>
                <p className="text-[13px] text-slate-500 font-medium">
                  Dengan mengaktifkan fitur ini, ponsel Anda akan berdering saat ada tugas atau Work Order baru, bahkan saat aplikasi sedang ditutup.
                </p>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleTogglePush}
                  disabled={isLoadingPush}
                  className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition-colors ${
                    isPushEnabled 
                      ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                      : 'bg-[#0095E8] text-white shadow-blue-200'
                  } disabled:opacity-70`}
                >
                  {isLoadingPush ? <Loader size={18} className="animate-spin" /> : (isPushEnabled ? <BellOff size={18} /> : <Bell size={18} />)}
                  {isLoadingPush ? 'Memproses...' : (isPushEnabled ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi')}
                </motion.button>

                {isPushEnabled && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleTestPush}
                    disabled={isLoadingPush}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-sm disabled:opacity-70"
                  >
                    <Send size={18} />
                    Kirim Tes Notifikasi
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Change PIN Modal */}
        {showChangeModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 shadow-2xl max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar"
              style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-black text-slate-800">Ubah PIN Akses</h3>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {pwResult === 'success' ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-8 gap-4">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-800 mb-1">Berhasil!</p>
                    <p className="text-[14px] text-slate-500">{pwMsg}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={closeModal}
                    className="mt-4 w-full py-4 rounded-xl bg-[#0095E8] text-white font-bold text-[15px]"
                  >
                    Selesai
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <p className="text-[14px] text-slate-500 mb-6 font-medium">Masukkan PIN lama dan PIN baru Anda (6 digit angka).</p>

                  <AnimatePresence>
                    {pwResult === 'error' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                        <div className="p-3.5 rounded-xl bg-red-50 flex items-center gap-3 text-red-600 text-[13px] font-bold border border-red-100">
                          <AlertCircle size={18} className="shrink-0" />
                          {pwMsg}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">PIN Saat Ini <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          placeholder="••••••"
                          value={pinData.current}
                          onChange={(e) => setPinData({ ...pinData, current: e.target.value.replace(/\D/g, '').substring(0, 6) })}
                          style={{ fontSize: pinData.current ? '24px' : '16px', letterSpacing: pinData.current ? '0.4em' : 'normal' }}
                          inputMode="numeric"
                          className="w-full px-5 py-4 pr-14 bg-[#F5F8FA] border-2 border-transparent rounded-2xl text-slate-800 outline-none focus:border-[#0095E8] focus:bg-white transition-all font-bold"
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#0095E8] transition-colors">
                          {showCurrentPw ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">PIN Baru <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          placeholder="••••••"
                          value={pinData.newPin}
                          onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '').substring(0, 6) })}
                          style={{ fontSize: pinData.newPin ? '24px' : '16px', letterSpacing: pinData.newPin ? '0.4em' : 'normal' }}
                          inputMode="numeric"
                          className="w-full px-5 py-4 pr-14 bg-[#F5F8FA] border-2 border-transparent rounded-2xl text-slate-800 outline-none focus:border-[#0095E8] focus:bg-white transition-all font-bold"
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#0095E8] transition-colors">
                          {showNewPw ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">Konfirmasi PIN Baru <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          placeholder="••••••"
                          value={pinData.confirm}
                          onChange={(e) => setPinData({ ...pinData, confirm: e.target.value.replace(/\D/g, '').substring(0, 6) })}
                          style={{ fontSize: pinData.confirm ? '24px' : '16px', letterSpacing: pinData.confirm ? '0.4em' : 'normal' }}
                          inputMode="numeric"
                          className="w-full px-5 py-4 pr-14 bg-[#F5F8FA] border-2 border-transparent rounded-2xl text-slate-800 outline-none focus:border-[#0095E8] focus:bg-white transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChangePin}
                    disabled={pwLoading}
                    className="mt-8 w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2"
                    style={{ backgroundColor: pwLoading ? '#8FCFF4' : '#0095E8' }}
                  >
                    {pwLoading ? <><Loader size={18} className="animate-spin" /> Menyimpan...</> : 'Simpan PIN Baru'}
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Data Saya Modal */}
        {showDataModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowDataModal(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 shadow-2xl max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar"
              style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[20px] font-black text-slate-800">Data Saya</h3>
                <button onClick={() => setShowDataModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-[#F5F8FA] rounded-3xl p-5 mb-8 border border-slate-100">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[13px] font-bold text-slate-400">Nama Lengkap</span>
                    <span className="text-[14px] font-black text-slate-800 text-right">{fullName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[13px] font-bold text-slate-400">Username</span>
                    <span className="text-[14px] font-black text-[#0095E8] bg-[#0095E8]/10 px-3 py-1 rounded-lg">{user?.username || '-'}</span>
                  </div>
                  {user?.email && (
                    <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                      <span className="text-[13px] font-bold text-slate-400">Email</span>
                      <span className="text-[14px] font-black text-slate-800 truncate pl-4">{user?.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[13px] font-bold text-slate-400">Departemen</span>
                    <span className="text-[14px] font-black text-slate-800 text-right">{user?.department || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-[13px] font-bold text-slate-400">Perusahaan</span>
                    <span className="text-[14px] font-black text-slate-800 text-right">{user?.companyName || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-400">Organisasi</span>
                    <span className="text-[14px] font-black text-slate-800">{user?.orgId || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-[15px] font-black text-slate-800 mb-1">Butuh Bantuan?</h4>
                <p className="text-[13px] text-slate-500 mb-4 font-medium">Hubungi Admin jika Anda perlu mengubah data di atas.</p>
                <div className="space-y-3">
                  <motion.a
                    whileTap={{ scale: 0.96 }}
                    href={`https://wa.me/${(user?.phone || '628000000000').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-[#F2FBF5] border border-[#25D366]/20 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" fill="#25D366" /></svg>
                      </div>
                      <span className="text-[14px] font-bold text-slate-700">Hubungi via WhatsApp</span>
                    </div>
                  </motion.a>
                  
                  <motion.a
                    whileTap={{ scale: 0.96 }}
                    href={`tel:+${(user?.phone || '628000000000').replace(/\D/g, '')}`}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-500">
                        <Phone size={20} />
                      </div>
                      <span className="text-[14px] font-bold text-slate-700">Telepon Sekarang</span>
                    </div>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 pb-10 shadow-2xl max-w-lg"
              style={{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-[#FFF5F8] rounded-3xl flex items-center justify-center mb-6">
                  <LogOut size={36} className="text-[#F1416C] -ml-1" />
                </div>
                <h3 className="text-[24px] font-black text-slate-800 mb-2">Sudah Selesai?</h3>
                <p className="text-[14px] font-medium text-slate-500 max-w-[280px]">
                  Apakah Anda yakin ingin keluar dari sesi akun <span className="font-bold text-slate-700">{fullName}</span>?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    if (onLogout) onLogout();
                    navigate('/');
                  }}
                  className="w-full py-4 rounded-2xl bg-[#F1416C] text-white font-bold text-[16px] shadow-lg shadow-red-100/50"
                >
                  Ya, Keluar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold text-[16px]"
                >
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileProfile;
