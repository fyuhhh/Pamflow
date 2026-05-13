import React from 'react';
import { Package, Construction } from 'lucide-react';

const AssetPlaceholder = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-2xl border border-[#F1F1F4] shadow-sm">
      <div className="w-24 h-24 rounded-full bg-[#F1FAFF] flex items-center justify-center text-[#0095E8] mb-6 animate-pulse">
        <Package size={48} />
      </div>
      <h2 className="text-[24px] font-black text-[#181C32] mb-2">{title}</h2>
      <div className="flex items-center gap-2 px-4 py-2 bg-[#FFF8F0] border border-[#FFA800]/20 rounded-xl text-[#FFA800] font-bold text-sm mb-6">
        <Construction size={18} />
        <span>Dalam Tahap Pengembangan</span>
      </div>
      <p className="text-[14px] text-[#A1A5B7] max-w-md leading-relaxed">
        Fitur ini sedang dalam proses pengembangan oleh tim kami untuk memberikan pengalaman manajemen aset yang lebih baik. Silakan cek kembali dalam beberapa waktu ke depan.
      </p>
    </div>
  );
};

export default AssetPlaceholder;
