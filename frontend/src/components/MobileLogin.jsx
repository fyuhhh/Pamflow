import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, CheckCircle, AlertCircle, Loader, Building2, User, KeyRound, ArrowRight } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import LoadingScreen from './LoadingScreen';
import API_URL from '../config';
import Logo from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

const MobileLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ orgId: '', username: '', pin: '', isMobile: true });
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetData, setResetData] = useState({ orgId: '', username: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [resetMsg, setResetMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setShowTransition(true);
        setTimeout(() => {
          if (onLogin) onLogin(data.user, data.token, data.refreshToken);
          if (data.user.userType === 'agen') {
            navigate('/demo/mobile');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        showError('Login Gagal', data.message || 'ID Organisasi, Username atau PIN salah.');
      }
    } catch (err) {
      showError('Kesalahan Jaringan', 'Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetData.orgId || !resetData.username) {
      showError('Data Tidak Lengkap', 'ID Organisasi dan Username wajib diisi.');
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/atur-ulang-pw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      const data = await response.json();
      if (response.ok) {
        success('Berhasil', data.message || 'Permintaan atur ulang kata sandi telah dikirim!');
        closeResetModal();
      } else {
        showError('Gagal', data.message || 'Permintaan gagal.');
      }
    } catch (err) {
      showError('Kesalahan Jaringan', 'Gagal menghubungkan ke server.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetData({ orgId: '', username: '' });
    setResetResult(null);
    setResetMsg('');
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <>
      {showTransition && <LoadingScreen variant="mobile" brand="PamFlow" logoLetter="P" />}
      <div className="min-h-screen flex flex-col font-sans bg-[#F5F8FA] relative overflow-hidden">
        
        {/* Background Decorative Blob */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-br from-[#0061D1] to-[#0095E8] rounded-b-[40px] shadow-[0_10px_30px_rgba(0,149,232,0.3)] z-0">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 top-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Header Content */}
        <div className="relative z-10 px-6 pt-16 pb-8 flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center justify-center border border-white/30 shadow-xl mb-4"
          >
            <Logo className="w-full h-full text-white drop-shadow-md" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-white font-black text-[28px] tracking-tight mb-1 drop-shadow-sm">PamFlow</h1>
          </motion.div>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 25, delay: 0.2 }}
          className="relative z-10 flex-1 bg-white mx-4 mb-6 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#E1E3EA]"
        >
          <div className="mb-6">
            <h2 className="text-[20px] font-bold text-[#181C32]">Masuk Agen</h2>
            <p className="text-[13px] text-[#A1A5B7] font-medium mt-1">Masukkan kredensial Anda untuk melanjutkan.</p>
          </div>

          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            {/* ID Organisasi */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#3F4254] ml-1">ID Organisasi</label>
              <div className="relative group">
                <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                <input
                  type="text"
                  name="orgId"
                  placeholder="Contoh: PAMFLOW"
                  value={formData.orgId}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-[14px] text-[#3F4254] font-medium outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                />
              </div>
            </motion.div>

            {/* Username */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#3F4254] ml-1">Username</label>
              <div className="relative group">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                <input
                  type="text"
                  name="username"
                  placeholder="Contoh: dimasaryo"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  required
                  className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-[14px] text-[#3F4254] font-medium outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                />
              </div>
            </motion.div>

            {/* PIN */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#3F4254] ml-1">PIN (6 Digit)</label>
              <div className="relative group">
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="pin"
                  placeholder="••••••"
                  value={formData.pin || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                    setFormData({ ...formData, pin: val });
                  }}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-12 text-[14px] text-[#3F4254] font-medium tracking-widest outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#0095E8] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-4">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#0095E8] text-white font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0084CC] transition-colors disabled:opacity-70 shadow-[0_8px_20px_rgba(0,149,232,0.25)]"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk Sekarang
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Lupa PIN */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-1.5 mt-6"
          >
            <span className="text-[13px] text-[#A1A5B7] font-medium">Lupa PIN akses?</span>
            <button
              onClick={() => setShowResetModal(true)}
              className="text-[13px] font-bold text-[#0095E8] active:scale-95 transition-transform"
            >
              Hubungi Admin
            </button>
          </motion.div>
        </motion.div>

        {/* Reset Password Modal */}
        <AnimatePresence>
          {showResetModal && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeResetModal}
              />

              {/* Modal Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white w-full rounded-t-[32px] px-6 pt-6 shadow-2xl"
                style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
              >
                <div className="w-12 h-1.5 bg-[#E1E3EA] rounded-full mx-auto mb-6"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-bold text-[#181C32]">Atur Ulang PIN</h3>
                  <button onClick={closeResetModal} className="p-2 bg-[#F5F8FA] rounded-full text-[#A1A5B7] active:scale-90 transition-transform">
                    <X size={18} />
                  </button>
                </div>

                {resetResult === 'success' ? (
                  <div className="flex flex-col items-center py-6 gap-4">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-full bg-[#E8FFF3] flex items-center justify-center"
                    >
                      <CheckCircle size={32} className="text-[#50CD89]" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-bold text-[#181C32] mb-1">Permintaan Terkirim!</p>
                      <p className="text-[13px] text-[#A1A5B7] leading-relaxed">{resetMsg}</p>
                    </div>
                    <button
                      onClick={closeResetModal}
                      className="mt-4 w-full py-3.5 rounded-xl bg-[#F5F8FA] text-[#3F4254] font-bold text-[14px] active:scale-95 transition-transform"
                    >
                      Tutup
                    </button>
                  </div>
                ) : resetResult === 'error' ? (
                  <div className="flex flex-col items-center py-6 gap-4">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-full bg-[#FFF5F8] flex items-center justify-center"
                    >
                      <AlertCircle size={32} className="text-[#F1416C]" />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-bold text-[#181C32] mb-1">Gagal</p>
                      <p className="text-[13px] text-[#A1A5B7] leading-relaxed">{resetMsg}</p>
                    </div>
                    <button
                      onClick={() => { setResetResult(null); setResetMsg(''); }}
                      className="mt-4 w-full py-3.5 rounded-xl bg-[#F5F8FA] text-[#3F4254] font-bold text-[14px] active:scale-95 transition-transform"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-[#A1A5B7] font-medium mb-6 leading-relaxed">
                      Masukkan ID Organisasi dan Username Anda. Admin akan segera dihubungi untuk melakukan *reset* PIN Anda.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-[#3F4254] ml-1">ID Organisasi</label>
                        <input
                          type="text"
                          placeholder="Contoh: PAMFLOW"
                          value={resetData.orgId}
                          onChange={(e) => setResetData({ ...resetData, orgId: e.target.value })}
                          className="w-full px-4 py-3.5 border border-[#E1E3EA] rounded-xl text-[14px] text-[#3F4254] bg-white outline-none focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-bold text-[#3F4254] ml-1">Username Agen</label>
                        <input
                          type="text"
                          placeholder="Username Anda"
                          value={resetData.username}
                          onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                          className="w-full px-4 py-3.5 border border-[#E1E3EA] rounded-xl text-[14px] text-[#3F4254] bg-white outline-none focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                        />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleResetRequest}
                      disabled={resetLoading}
                      className="mt-6 w-full py-4 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md"
                      style={{ backgroundColor: resetLoading ? '#7AA6D4' : '#181C32' }}
                    >
                      {resetLoading ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Memproses...
                        </>
                      ) : 'Kirim Permintaan Reset'}
                    </motion.button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MobileLogin;
