import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Building2, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import LoadingScreen from './LoadingScreen';
import API_URL from '../config';
import logo_pamflow from '../assets/logo_pamflow.png';
import { motion } from 'framer-motion';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useModal();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    orgId: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, isMobile: false }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Login Berhasil!', 'Selamat datang kembali di PamFlow.');
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
        showError('Login Gagal', data.message || 'ID Organisasi, Email atau Kata Sandi salah.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showError('Kesalahan Jaringan', 'Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <>
      {showTransition && <LoadingScreen variant="desktop" brand="PamFlow" logoLetter="P" />}

      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F8FA] p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0095E8]/10 to-transparent pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-[900px] w-full flex bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-[#E1E3EA] z-10"
        >

          {/* Left Panel: Branding & Info */}
          <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#0061D1] to-[#0095E8] p-12 flex-col justify-between text-white relative overflow-hidden">
            {/* Subtle Graphic Element */}
            <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-white/10 rounded-full border border-white/20 blur-3xl"></div>
            <div className="absolute -left-16 -top-16 w-64 h-64 bg-white/10 rounded-full border border-white/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <motion.img 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                src={logo_pamflow} 
                alt="PamFlow Logo" 
                className="w-[180px] h-auto mb-8 drop-shadow-xl" 
              />
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-[34px] font-black leading-tight tracking-tight mb-4"
              >
                Pamflow
              </motion.h2>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-[14px] text-white/80 font-medium leading-relaxed"
              >
                Kelola Work Order, Checklist, dan Tugas dalam satu platform
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="relative z-10 space-y-3"
            >
              {[
                'Pemantauan Real-Time',
                'Alur Persetujuan Berlapis',
                'Analitik Kinerja Tim'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="p-1 bg-white/20 rounded-full">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <span className="text-[13px] font-medium text-white/90">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Panel: Form */}
          <div className="flex-1 p-8 md:p-14 bg-white flex flex-col justify-center">
            <div className="max-w-[360px] w-full mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-10"
              >
                <h1 className="text-[26px] font-bold text-[#181C32] mb-2 tracking-tight">Selamat Datang</h1>
                <p className="text-[#7E8299] text-[13px] font-medium">Silakan masukkan kredensial Anda.</p>
              </motion.div>

              <motion.form 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-[11px] font-bold text-[#3F4254] uppercase tracking-widest">ID Organisasi</label>
                  <div className="relative group">
                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                    <input
                      type="text"
                      name="orgId"
                      placeholder="Contoh: PAMFLOW"
                      value={formData.orgId}
                      onChange={handleChange}
                      className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-[#3F4254] font-medium outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-[11px] font-bold text-[#3F4254] uppercase tracking-widest">Email Kantor</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                    <input
                      type="email"
                      name="email"
                      placeholder="nama@perusahaan.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-4 text-[13px] text-[#3F4254] font-medium outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-[11px] font-bold text-[#3F4254] uppercase tracking-widest">Kata Sandi</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] group-focus-within:text-[#0095E8] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-[#F5F8FA] border border-transparent rounded-xl py-3.5 pl-11 pr-12 text-[13px] text-[#3F4254] font-medium outline-none focus:bg-white focus:border-[#0095E8] focus:ring-4 focus:ring-[#0095E8]/10 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#0095E8] transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0095E8] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0084CC] transition-colors disabled:opacity-70 mt-6 shadow-[0_8px_20px_rgba(0,149,232,0.25)]"
                  >
                    {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
                    {!loading && <ArrowRight size={18} />}
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 text-center"
              >
                <p className="text-[#A1A5B7] text-[12px] font-medium">
                  © 2026 IT Dept. Pamflow.
                </p>
                <p className="text-[11px] text-[#A1A5B7] font-medium mt-1">
                  Butuh bantuan? Hubungi IT Administrator.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
