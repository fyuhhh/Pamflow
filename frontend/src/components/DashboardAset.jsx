import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { Package, MapPin, BadgeDollarSign, HeartPulse, ShieldCheck, Tag, Box, Wallet } from 'lucide-react';
import { authFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DashboardAset = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalAset: 0,
    totalNilai: 0,
    kondisiBaik: 0,
    kategoriTerbanyak: '-',
  });
  
  const [categoryData, setCategoryData] = useState({ series: [], labels: [] });
  const [conditionData, setConditionData] = useState({ series: [], labels: [] });
  const [recentAssets, setRecentAssets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch('/api/pure-assets');
        
        if (res.ok) {
          const data = await res.json();
          
          let totalValue = 0;
          let baikCount = 0;
          const categoryCount = {};
          const conditionCount = {};

          data.forEach(asset => {
            totalValue += parseFloat(asset.acquisition_cost) || 0;
            
            // Condition count
            const condName = asset.condition_name || 'Tidak Diketahui';
            conditionCount[condName] = (conditionCount[condName] || 0) + 1;
            
            // Assuming 'Baik' or similar indicates good condition
            if (condName.toLowerCase().includes('baik') || condName.toLowerCase().includes('good')) {
              baikCount++;
            }

            // Category count
            const catName = asset.category_name || 'Lainnya';
            categoryCount[catName] = (categoryCount[catName] || 0) + 1;
          });

          // Top Category
          let topCat = '-';
          let maxCatCount = 0;
          for (const [cat, count] of Object.entries(categoryCount)) {
            if (count > maxCatCount) {
              maxCatCount = count;
              topCat = cat;
            }
          }

          setStats({
            totalAset: data.length,
            totalNilai: totalValue,
            kondisiBaik: baikCount,
            kategoriTerbanyak: topCat
          });

          // Category Chart
          const sortedCats = Object.entries(categoryCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
          setCategoryData({
            labels: sortedCats.map(c => c[0]),
            series: sortedCats.map(c => c[1])
          });

          // Condition Chart
          setConditionData({
            labels: Object.keys(conditionCount),
            series: Object.values(conditionCount)
          });

          // Recent Assets (by acquisition_date or just last 5 in array assuming sorted/unsorted)
          const sortedAssets = [...data].sort((a, b) => {
            const dateA = new Date(a.acquisition_date || 0);
            const dateB = new Date(b.acquisition_date || 0);
            return dateB - dateA; // descending
          });
          setRecentAssets(sortedAssets.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to fetch pure asset data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(angka);
  };

  // Chart Options
  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'Poppins, sans-serif' },
    colors: ['#0095E8', '#50CD89', '#FFC700', '#F1416C', '#7239EA'],
    labels: categoryData.labels,
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '11px', color: '#A1A5B7' },
            value: { show: true, fontSize: '20px', fontWeight: 800, color: '#181C32' },
            total: { show: true, showAlways: true, label: 'Total', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { position: 'bottom', fontSize: '11px', markers: { radius: 12 } }
  };

  const conditionOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '50%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: conditionData.labels, labels: { style: { colors: '#A1A5B7', fontSize: '11px', fontWeight: 600 } } },
    yaxis: { labels: { style: { colors: '#A1A5B7', fontSize: '11px', fontWeight: 600 } } },
    grid: { show: false },
    colors: ['#50CD89'],
    legend: { show: false },
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const renderStatCard = (icon, label, value, subtext, colorClass, bgClass) => (
    <div className="bg-white border border-[#E1E3EA] p-5 rounded-2xl flex items-center justify-between group hover:border-[#7239EA]/30 hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-[24px] font-black text-[#181C32] leading-tight mb-2 truncate max-w-[150px] md:max-w-[180px] lg:max-w-[200px]" title={value}>{value}</h3>
        <p className="text-[11px] font-bold text-[#7E8299] flex items-center gap-1">
          {subtext}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} transform group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-white p-6 md:p-8 rounded-2xl border border-[#E1E3EA] flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group shadow-sm"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#7239EA]/10 rounded-full blur-3xl group-hover:bg-[#7239EA]/20 transition-all duration-700"></div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#F8F5FF] to-transparent opacity-80 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-[26px] font-bold text-[#181C32] tracking-tight">
              {getGreeting()}, <span className="text-[#7239EA]">{user?.firstName || 'Finance'}</span>!
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] text-[#7E8299] font-medium">Monitoring Nilai Investasi dan Inventaris Aset Perusahaan.</p>
            <span className="px-2 py-0.5 bg-[#F8F5FF] text-[#7239EA] text-[10px] font-bold rounded uppercase tracking-wider border border-[#7239EA]/20">
              MANAJEMEN ASET
            </span>
          </div>
        </div>

        <div className="text-left md:text-right relative z-10 mt-5 md:mt-0 flex flex-col md:items-end">
          <p className="text-[38px] md:text-[44px] font-black text-[#181C32] leading-none tracking-tighter drop-shadow-sm flex items-baseline gap-1">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':').replace('.', ':')}
            <span className="text-[24px] text-[#7239EA] font-bold animate-pulse">
              :{currentTime.toLocaleTimeString('id-ID', { second: '2-digit' })}
            </span>
          </p>
          <p className="text-[13px] font-bold text-[#A1A5B7] mt-1.5 uppercase tracking-[0.2em] bg-[#F5F8FA] px-3 py-1 rounded-md w-fit">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          {renderStatCard(<Package size={24} />, "Total Inventaris", stats.totalAset, "Aset terdaftar di sistem", "text-[#0095E8]", "bg-[#F1FAFF]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {renderStatCard(<Wallet size={24} />, "Nilai Investasi Aset", formatRupiah(stats.totalNilai), "Total harga perolehan", "text-[#50CD89]", "bg-[#E8FFF3]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          {renderStatCard(<ShieldCheck size={24} />, "Aset Kondisi Baik", stats.kondisiBaik, "Tersedia dan beroperasi", "text-[#7239EA]", "bg-[#F8F5FF]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          {renderStatCard(<Box size={24} />, "Kategori Dominan", stats.kategoriTerbanyak, "Populasi aset terbanyak", "text-[#FFC700]", "bg-[#FFF8DD]")}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Kategori (Donut Chart) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white border border-[#E1E3EA] p-6 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-[#181C32]">Distribusi Kategori Aset</h3>
              <p className="text-[12px] text-[#A1A5B7] font-medium mt-0.5">Top 5 kategori dengan populasi terbesar.</p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[250px]">
            {loading ? (
              <div className="w-8 h-8 border-4 border-[#7239EA] border-t-transparent rounded-full animate-spin"></div>
            ) : categoryData.series.length > 0 ? (
              <ReactApexChart options={donutOptions} series={categoryData.series} type="donut" width="100%" height={280} />
            ) : (
              <div className="text-[#A1A5B7] text-[12px] font-medium">Belum ada data kategori</div>
            )}
          </div>
        </motion.div>

        {/* Kondisi Aset (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-white border border-[#E1E3EA] p-6 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-[#181C32]">Status Kondisi Aset</h3>
              <p className="text-[12px] text-[#A1A5B7] font-medium mt-0.5">Sebaran kondisi fisik aset di perusahaan.</p>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#50CD89] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conditionData.series.length > 0 ? (
              <ReactApexChart options={conditionOptions} series={[{ name: 'Jumlah Aset', data: conditionData.series }]} type="bar" height="100%" />
            ) : (
              <div className="flex items-center justify-center h-full text-[#A1A5B7] text-[12px] font-medium">Belum ada data kondisi</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Aset Terdaftar Baru */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-white border border-[#E1E3EA] rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-5 border-b border-[#F1F1F4] flex justify-between items-center bg-[#F9F9F9]/50">
          <div>
            <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2">
              <Tag size={16} className="text-[#7239EA]" /> Akuisisi Aset Terbaru
            </h3>
          </div>
          <button onClick={() => navigate('/manajemen-aset/aset-group/list')} className="text-[12px] font-bold text-[#7239EA] hover:text-[#5014D0] transition-colors">Lihat Daftar Aset</button>
        </div>
        <div className="divide-y divide-[#F1F1F4]">
          {loading ? (
            <div className="p-8 text-center text-[#A1A5B7] text-[12px] font-medium animate-pulse">Memuat data aset...</div>
          ) : recentAssets.length === 0 ? (
            <div className="p-8 text-center text-[#A1A5B7] text-[12px] font-medium">Belum ada aset terdaftar</div>
          ) : recentAssets.map((asset, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F5F8FA] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#F8F5FF] text-[#7239EA] flex items-center justify-center">
                  <Package size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#181C32] group-hover:text-[#7239EA] transition-colors">{asset.asset_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-[#0095E8]">{asset.asset_id}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E1E3EA]"></span>
                    <span className="text-[11px] font-medium text-[#7E8299] flex items-center gap-1"><MapPin size={10} /> {asset.location_name || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-1 bg-[#F5F8FA] text-[#7E8299] border border-[#E1E3EA]">
                  {asset.category_name || '-'}
                </span>
                <p className="text-[12px] font-bold text-[#181C32]">{formatRupiah(asset.acquisition_cost || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardAset;
