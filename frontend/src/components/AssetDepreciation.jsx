import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, ChevronDown, Loader2, Calendar, DollarSign, TrendingDown, 
  BarChart3, Sparkles, BookOpen, FileSpreadsheet, Info, X
} from 'lucide-react';
import { authFetch } from '../services/api';
import { exportToExcel, exportToPDF } from '../utils/exportHelper';
import API_URL from '../config';
import { useModal } from '../context/ModalContext';
import { hasPermission } from '../utils/permissions';


const AssetDepreciation = () => {
  const { showError } = useModal();
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const canCalculate = hasPermission(currentUser, 'pure_asset_depreciation', 'Buat');
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Asset for Monthly Schedule Modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    handleCalculate();
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/depreciations/calculate?year=${year}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        showError('Gagal melakukan kalkulasi depresiasi');
      }
    } catch (err) {
      showError('Gagal terhubung dengan server');
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!data || !data.assets) return;
    const headers = ['Nama Aset', 'Metode', 'Tgl Perolehan', 'Nilai Perolehan', 'Umur Ekonomis', 'Akumulasi Penyusutan', 'Nilai Buku'];
    const rows = data.assets.map((a) => [
      a.asset_name,
      a.formula,
      new Date(a.acquisition_date).toLocaleDateString('id-ID'),
      Number(a.acquisition_cost || 0).toLocaleString('id-ID'),
      `${a.useful_life_years} Tahun`,
      Number(a.accumulated_depreciation || 0).toLocaleString('id-ID'),
      Number(a.book_value || 0).toLocaleString('id-ID')
    ]);
    exportToExcel('Laporan Depresiasi Aset', headers, rows, `Depresiasi_${year}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!data || !data.assets) return;
    const headers = ['Nama Aset', 'Metode', 'Tgl Perolehan', 'Nilai Perolehan', 'Umur Ekonomis', 'Akumulasi Penyusutan', 'Nilai Buku'];
    const rows = data.assets.map((a) => [
      a.asset_name,
      a.formula,
      new Date(a.acquisition_date).toLocaleDateString('id-ID'),
      Number(a.acquisition_cost || 0).toLocaleString('id-ID'),
      `${a.useful_life_years} Tahun`,
      Number(a.accumulated_depreciation || 0).toLocaleString('id-ID'),
      Number(a.book_value || 0).toLocaleString('id-ID')
    ]);
    exportToPDF('Laporan Depresiasi Aset', headers, rows, `Depresiasi_${year}.pdf`);
  };

  const getFilteredAssets = () => {
    if (!data || !data.assets) return [];
    const s = searchTerm.toLowerCase();
    return data.assets.filter(a => 
      String(a.asset_name).toLowerCase().includes(s) || 
      String(a.asset_code).toLowerCase().includes(s) ||
      String(a.register_no).toLowerCase().includes(s)
    );
  };

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-4 max-w-7xl mx-auto w-full">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#8A15E3] to-[#430B8A] p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md">
            <BarChart3 size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Perhitungan Depresiasi</h1>
            <p className="text-xs text-white/80 mt-0.5">Analisis nilai penyusutan, akumulasi depresiasi, dan nilai buku aset secara akurat menggunakan metode Straight-Line.</p>
          </div>
        </div>

        {/* YEAR SELECTION CONTROL */}
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-md w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3">
            <Calendar size={14} className="text-white/70" />
            <span className="text-xs font-black uppercase text-white/70 tracking-wider">Tahun:</span>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#181C32] text-white border-0 rounded-lg px-4 py-2 text-xs font-extrabold outline-none cursor-pointer focus:ring-1 focus:ring-white/20"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            {canCalculate && (
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-white text-[#430B8A] hover:bg-[#F5F8FA] rounded-lg text-xs font-black shadow-md transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Calculate
              </button>
            )}
            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#181C32] text-white hover:bg-[#1f263e] rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              title="Export to Excel"
            >
              <FileSpreadsheet size={12} /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading || !data}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#181C32] text-white hover:bg-[#1f263e] rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              title="Export to PDF"
            >
              <FileSpreadsheet size={12} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ANALYTICS KPI CARDS */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: TOTAL COST */}
          <div className="bg-white border border-[#F1F1F4] rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] text-[#A1A5B7] font-black uppercase tracking-wider block">Total Nilai Perolehan</span>
              <h3 className="text-xl font-black text-[#181C32]">
                Rp {Number(data.totals?.total_acquisition_cost || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-[#5E6278] font-bold block">Seluruh aset yang terhitung penyusutan</span>
            </div>
            <div className="p-4 bg-[#F8F5FF] text-[#8A15E3] rounded-2xl group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>

          {/* CARD 2: TOTAL ACCUMULATED DEPRECIATION */}
          <div className="bg-white border border-[#F1F1F4] rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] text-[#A1A5B7] font-black uppercase tracking-wider block">Total Akumulasi Penyusutan</span>
              <h3 className="text-xl font-black text-[#E42A5B]">
                Rp {Number(data.totals?.total_accumulated_depreciation || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-[#7E8299] font-bold block">Penyusutan berjalan s.d. Desember {data.year}</span>
            </div>
            <div className="p-4 bg-[#FFF5F8] text-[#E42A5B] rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingDown size={24} />
            </div>
          </div>

          {/* CARD 3: TOTAL BOOK VALUE */}
          <div className="bg-white border border-[#F1F1F4] rounded-2xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] text-[#A1A5B7] font-black uppercase tracking-wider block">Total Nilai Buku</span>
              <h3 className="text-xl font-black text-[#10B981]">
                Rp {Number(data.totals?.total_book_value || 0).toLocaleString('id-ID')}
              </h3>
              <span className="text-[10px] text-[#7E8299] font-bold block">Estimasi nilai sisa aset s.d. Desember {data.year}</span>
            </div>
            <div className="p-4 bg-[#E8FFF3] text-[#10B981] rounded-2xl group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
          </div>

        </div>
      )}

      {/* CALCULATED RESULTS TABLE */}
      <div className="bg-white border border-[#F1F1F4] rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#F1F1F4] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAFBFC]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-[#181C32] tracking-wider uppercase">Tabel Laporan Depresiasi Aset ({data?.year})</h2>
            <span className="px-2.5 py-0.5 bg-[#8A15E3]/10 text-[#8A15E3] text-[10px] font-black uppercase rounded-full">Active</span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" size={16} />
            <input 
              type="text" 
              placeholder="Cari aset..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E1E3EA] rounded-xl text-xs font-bold outline-none focus:border-[#8A15E3]/30 transition-all text-[#181C32]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider w-[60px] text-center">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Aset</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Metode</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Tgl Perolehan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nilai Perolehan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Umur Ekonomis</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Akumulasi Penyusutan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Nilai Buku</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-center w-[120px]">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#7E8299] text-xs font-bold italic">
                    <Loader2 className="animate-spin text-[#8A15E3] mx-auto mb-2" size={24} />
                    Mengkalkulasi depresiasi aset...
                  </td>
                </tr>
              ) : getFilteredAssets().length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#7E8299] text-xs font-bold italic">Tidak ada data aset depresiasi ditemukan</td>
                </tr>
              ) : (
                getFilteredAssets().map((asset, idx) => (
                  <tr key={asset.asset_id} className="border-b border-[#F1F1F4] hover:bg-[#F5F8FA] transition-all">
                    <td className="px-6 py-4 text-xs font-semibold text-[#5E6278] text-center">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <h4 className="text-xs font-extrabold text-[#181C32]">{asset.asset_name}</h4>
                        <span className="text-[10px] text-[#A1A5B7] font-bold block">{asset.asset_code} • Reg: {asset.register_no || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">{asset.formula}</td>
                    <td className="px-6 py-4 text-xs font-bold text-[#7E8299]">
                      {new Date(asset.acquisition_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-[#181C32]">
                      Rp {Number(asset.acquisition_cost || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#5E6278]">{asset.useful_life_years} Tahun</td>
                    <td className="px-6 py-4 text-xs font-black text-[#E42A5B]">
                      Rp {Number(asset.accumulated_depreciation || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-[#10B981]">
                      Rp {Number(asset.book_value || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedAsset(asset); setShowScheduleModal(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8A15E3]/10 hover:bg-[#8A15E3] hover:text-white text-[#8A15E3] text-xs font-extrabold rounded-lg transition-all"
                        title="Lihat Rincian Bulanan"
                      >
                        <Eye size={12} /> Bulanan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MONTHLY DEPRECIATION DETAIL MODAL */}
      {showScheduleModal && selectedAsset && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#F1F1F4] flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#8A15E3] bg-[#8A15E3] text-white">
              <div>
                <span className="text-[10px] font-black uppercase text-white/60 block tracking-widest">{selectedAsset.asset_code}</span>
                <h2 className="text-base font-extrabold tracking-wider mt-0.5">Rincian Penyusutan Bulanan ({data?.year})</h2>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-white hover:text-white/80 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F9F9F9] border border-[#F1F1F4] rounded-2xl p-4 text-xs font-bold text-[#5E6278]">
                <div className="space-y-1">
                  <div>Nama Aset: <span className="text-[#181C32]">{selectedAsset.asset_name}</span></div>
                  <div>Nilai Perolehan: <span className="text-[#181C32]">Rp {Number(selectedAsset.acquisition_cost || 0).toLocaleString('id-ID')}</span></div>
                </div>
                <div className="space-y-1">
                  <div>Metode Penyusutan: <span className="text-[#8A15E3]">{selectedAsset.formula}</span></div>
                  <div>Umur Ekonomis: <span className="text-[#181C32]">{selectedAsset.useful_life_years} Tahun (60 Bulan)</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#181C32] flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-[#8A15E3]" /> Jadwal Amortisasi Bulanan ({data?.year})
                </h4>
                
                <div className="overflow-hidden border border-[#F1F1F4] rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4] text-[10px] font-bold text-[#A1A5B7] uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-center w-[60px]">Bulan</th>
                        <th className="px-4 py-2.5">Nama Bulan</th>
                        <th className="px-4 py-2.5">Penyusutan</th>
                        <th className="px-4 py-2.5">Akumulasi Penyusutan</th>
                        <th className="px-4 py-2.5">Nilai Buku</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F1F4] text-xs">
                      {selectedAsset.monthly_details?.map((m) => (
                        <tr key={m.month_index} className="hover:bg-[#F9F9F9] transition-all font-semibold">
                          <td className="px-4 py-2.5 text-center text-[#7E8299]">{String(m.month_index).padStart(2, '0')}</td>
                          <td className="px-4 py-2.5 text-[#181C32]">{m.month_name}</td>
                          <td className="px-4 py-2.5 text-[#E42A5B]">Rp {Number(m.depreciation).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2.5 text-[#5E6278]">Rp {Number(m.accumulated).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2.5 text-[#10B981]">Rp {Number(m.book_value).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-5 border-t border-[#F1F1F4] bg-[#FAFBFC] flex justify-end">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2.5 bg-white hover:bg-[#F5F8FA] text-[#181C32] text-xs font-bold rounded-xl transition-colors border border-[#E1E3EA] shadow-sm"
              >
                Tutup Rincian
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AssetDepreciation;
