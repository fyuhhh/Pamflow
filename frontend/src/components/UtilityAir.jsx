import React from 'react';
import { Droplet, Info, Compass, Sparkles, Hammer } from 'lucide-react';

const UtilityAir = () => {
  return (
    <div className="p-8 min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-center items-center">
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#0095E8]/5 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-[#50CD89]/5 rounded-full filter blur-[80px] pointer-events-none" />

      {/* Main Glassmorphic Panel */}
      <div className="bg-white/85 backdrop-blur-md border border-slate-100 p-10 rounded-[36px] shadow-2xl max-w-xl text-center relative z-10 flex flex-col items-center">
        {/* Animated Water Drop Icon Container */}
        <div className="w-20 h-20 bg-blue-50 border border-blue-100 text-[#0095E8] rounded-3xl flex items-center justify-center mb-8 relative animate-pulse shadow-sm">
          <Droplet size={38} className="fill-[#0095E8]/10" />
          <div className="absolute -top-1.5 -right-1.5 bg-[#50CD89] w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles size={8} className="text-white" />
          </div>
        </div>

        {/* Text Details */}
        <h2 className="text-[26px] font-black text-slate-800 tracking-tight leading-none mb-3">
          Pendataan Air
        </h2>
        <p className="text-[12px] font-bold text-[#0095E8] uppercase tracking-widest mb-6">
          Modul Maintenance Utilitas
        </p>

        <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-md mb-8">
          Fitur pencatatan, kalkulasi debit, dan approval tenant mandiri untuk utilitas air sedang dalam **Proses Pengembangan**. Hubungi divisi Administrator IT untuk detail jadwal perilisan fitur.
        </p>

        {/* Tech Badges / Future Spec Preview */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={12} className="text-slate-400" /> Spesifikasi Modul Air (v2.1)
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-[12px] font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0095E8]" />
              <span>Input Stand Meteran (m³)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0095E8]" />
              <span>Kalkulasi Kebocoran</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0095E8]" />
              <span>Sertifikasi QR Tenant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0095E8]" />
              <span>Grafik Debit Air Harian</span>
            </div>
          </div>
        </div>

        {/* Release Status */}
        <div className="mt-8 flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
          <Hammer size={12} className="animate-bounce" />
          <span>Fase Pembangunan Internal - Pamflow Ops</span>
        </div>
      </div>
    </div>
  );
};

export default UtilityAir;
