import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, RefreshCcw, Search, Clock, KeyRound } from 'lucide-react';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { success, error, confirm } = useModal();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/password-reset/pending');
      const data = await res.json();
      if (res.ok) {
        setRequests(data);
      } else {
        error('Gagal', data.message || 'Gagal mengambil data permintaan.');
      }
    } catch (err) {
      console.error(err);
      error('Kesalahan', 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (reqId, username) => {
    confirm(
      'Reset PIN Agen',
      `Anda yakin ingin mereset PIN untuk agen ${username}? PIN akan dikembalikan ke default (123456).`,
      async () => {
        try {
          const res = await authFetch(`/api/password-reset/${reqId}/resolve`, {
            method: 'PUT'
          });
          const data = await res.json();
          if (res.ok) {
            success('Berhasil', data.message);
            fetchRequests(); // Refresh the data
          } else {
            error('Gagal', data.message);
          }
        } catch (err) {
          error('Kesalahan', 'Gagal memproses permintaan.');
        }
      }
    );
  };

  const filteredRequests = requests.filter(req => 
    (req.identifier || '').toLowerCase().includes(search.toLowerCase()) ||
    (req.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
    (req.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#181C32] mb-1 flex items-center gap-2">
            <ShieldAlert size={24} className="text-[#F1416C]" />
            Permintaan Ganti PIN
          </h1>
          <p className="text-[13px] text-[#A1A5B7] font-medium">
            Daftar agen yang meminta reset PIN karena lupa kredensial login.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
            <input
              type="text"
              placeholder="Cari agen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#E1E3EA] rounded-lg text-[13px] focus:border-[#0095E8] outline-none w-full md:w-[250px] transition-colors"
            />
          </div>
          <button 
            onClick={fetchRequests}
            className="p-2 border border-[#E1E3EA] rounded-lg text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F1FAFF] transition-colors"
            title="Muat Ulang"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-[#E1E3EA] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F8FA] border-b border-[#E1E3EA] text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">
                <th className="px-6 py-4">Waktu Request</th>
                <th className="px-6 py-4">Agen</th>
                <th className="px-6 py-4">ID Organisasi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-[#A1A5B7] text-[13px]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCcw size={20} className="animate-spin text-[#0095E8]" />
                        Memuat data permintaan...
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-[#F5F8FA] rounded-full flex items-center justify-center">
                          <CheckCircle size={24} className="text-[#50CD89]" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#181C32]">Tidak Ada Permintaan Baru</p>
                          <p className="text-[12px] text-[#A1A5B7] mt-1">Semua permintaan reset PIN telah diselesaikan.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, idx) => (
                    <motion.tr 
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="border-b border-[#E1E3EA] hover:bg-[#F9F9F9] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[13px] font-medium text-[#7E8299]">
                          <Clock size={14} />
                          {new Date(req.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#F1FAFF] flex items-center justify-center text-[#0095E8] font-bold text-[13px]">
                            {(req.firstName?.[0] || req.identifier?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#181C32]">{req.firstName} {req.lastName}</span>
                            <span className="text-[12px] font-medium text-[#A1A5B7]">{req.identifier} &bull; {req.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#F5F8FA] text-[#3F4254] text-[12px] font-bold rounded-md border border-[#E1E3EA]">
                          {req.orgId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF5F8] text-[#F1416C] w-max rounded-md border border-[#F1416C]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F1416C] animate-pulse"></span>
                          <span className="text-[11px] font-bold tracking-wide">PENDING</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleResolve(req.id, req.identifier)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#181C32] text-white text-[12px] font-bold rounded-lg hover:bg-[#3F4254] transition-colors shadow-sm"
                        >
                          <KeyRound size={14} />
                          Reset & Selesai
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetRequests;
