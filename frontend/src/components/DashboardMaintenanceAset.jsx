import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { Package, AlertTriangle, Settings, CheckCircle2, Wrench, Activity, Clock, FileText, Building2 } from 'lucide-react';
import { authFetch } from '../services/api';

const DashboardMaintenanceAset = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [stats, setStats] = useState({
    totalAset: 0,
    asetNormal: 0,
    asetRusak: 0,
    sedangPerbaikan: 0,
    rataRataUptime: 0,
    perbaikanMingguIni: 12, // Dummy trend
    biayaMaintenance: "Rp 45.000.000" // Dummy
  });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch('/api/assets');
        if (res.ok) {
          const data = await res.json();
          const total = data.length;
          // Asumsi status aset
          const normal = data.filter(a => ['Normal', 'Beroperasi Normal', 'Baik'].includes(a.status)).length;
          const rusak = data.filter(a => ['Kritis', 'Rusak', 'Rusak Berat'].includes(a.status)).length;
          const perbaikan = data.filter(a => ['Perbaikan', 'Sedang Perbaikan', 'Maintenance'].includes(a.status)).length;
          
          let uptime = 100;
          if (total > 0) {
            uptime = Math.round(((total - rusak) / total) * 100 * 10) / 10;
          }

          setStats(prev => ({
            ...prev,
            totalAset: total,
            asetNormal: normal || (total - rusak - perbaikan), // fallback
            asetRusak: rusak,
            sedangPerbaikan: perbaikan,
            rataRataUptime: uptime,
          }));
        }

        // Fetch logs
        const resLogs = await authFetch('/api/department-tasks?jenis_tugas=wo');
        if (resLogs.ok) {
          const dataLogs = await resLogs.json();
          const recentLogs = (dataLogs.data || dataLogs).slice(0, 5).map(l => ({
            id: `WO-${l.id?.toString().padStart(4, '0') || '0000'}`,
            title: l.judul || 'Maintenance Task',
            dept: l.departemen_tujuan || l.departemen_asal || 'Engineering',
            status: l.status || l.progres || 'Sedang Berjalan',
            time: new Date(l.created_at).toLocaleDateString('id-ID')
          }));
          
          if (recentLogs.length > 0) {
            setLogs(recentLogs);
          } else {
            setLogs([
               { id: 'MT-202605-001', title: 'Perbaikan Kompresor AC Utama', dept: 'Engineering', status: 'Kritis', time: 'Hari ini, 09:30' },
               { id: 'MT-202605-002', title: 'Kalibrasi Sensor Suhu Server', dept: 'IT', status: 'Terjadwal', time: 'Besok, 10:00' },
               { id: 'MT-202605-003', title: 'Pengecekan Pompa Air Gedung', dept: 'Operasional', status: 'Sedang Berjalan', time: 'Hari ini, 14:15' },
            ]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch real data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(clock);
    };
  }, []);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Chart Options
  const donutOptions = {
    chart: { type: 'donut', fontFamily: 'Poppins, sans-serif' },
    labels: ['Beroperasi Normal', 'Sedang Perbaikan', 'Rusak / Kritis'],
    colors: ['#50CD89', '#FFC700', '#F1416C'],
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: '#A1A5B7' },
            value: { show: true, fontSize: '24px', fontWeight: 800, color: '#181C32' },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Aset',
              fontSize: '11px',
              fontWeight: 600,
              color: '#A1A5B7',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { show: false },
  };
  const donutSeries = [stats.asetNormal, stats.sedangPerbaikan, stats.asetRusak];

  const barOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['transparent'] },
    xaxis: { 
      categories: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#A1A5B7', fontSize: '11px', fontWeight: 600 } }
    },
    yaxis: { labels: { show: false } },
    grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: -10 } },
    colors: ['#0095E8', '#E1E3EA'],
    legend: { show: false },
    fill: { opacity: 1 }
  };
  const barSeries = [
    { name: 'Selesai', data: [4, 6, 3, 8, 5, 2, 0] },
    { name: 'Tertunda', data: [1, 0, 2, 1, 0, 0, 0] }
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const renderStatCard = (icon, label, value, trend, colorClass, bgClass) => (
    <div className="bg-white border border-[#E1E3EA] p-5 rounded-2xl flex items-center justify-between group hover:border-[#0095E8]/30 hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-[28px] font-black text-[#181C32] leading-none mb-2">{value}</h3>
        <p className={`text-[11px] font-bold ${trend > 0 ? 'text-[#50CD89]' : trend < 0 ? 'text-[#F1416C]' : 'text-[#7E8299]'} flex items-center gap-1`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}% dari bulan lalu
        </p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} transform group-hover:scale-110 transition-transform duration-300`}>
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
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#FFA800]/10 rounded-full blur-3xl group-hover:bg-[#FFA800]/20 transition-all duration-700"></div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#FFF8DD] to-transparent opacity-80 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-[26px] font-bold text-[#181C32] tracking-tight">
              {getGreeting()}, <span className="text-[#FFA800]">{user?.firstName || 'Manajer'}</span>!
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] text-[#7E8299] font-medium">Ikhtisar Kesehatan dan Pemeliharaan Aset Perusahaan.</p>
            <span className="px-2 py-0.5 bg-[#FFF8DD] text-[#D9A400] text-[10px] font-bold rounded uppercase tracking-wider border border-[#FFA800]/20">
              MAINTENANCE
            </span>
          </div>
        </div>

        <div className="text-left md:text-right relative z-10 mt-5 md:mt-0 flex flex-col md:items-end">
          <p className="text-[38px] md:text-[44px] font-black text-[#181C32] leading-none tracking-tighter drop-shadow-sm flex items-baseline gap-1">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':').replace('.', ':')}
            <span className="text-[24px] text-[#FFA800] font-bold animate-pulse">
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
          {renderStatCard(<Package size={24} />, "Total Aset Dimonitor", stats.totalAset.toLocaleString(), 2.4, "text-[#0095E8]", "bg-[#F1FAFF]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {renderStatCard(<Activity size={24} />, "Ketersediaan (Uptime)", `${stats.rataRataUptime}%`, 0.8, "text-[#50CD89]", "bg-[#E8FFF3]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          {renderStatCard(<Wrench size={24} />, "Dalam Perbaikan", stats.sedangPerbaikan, -15.2, "text-[#FFC700]", "bg-[#FFF8DD]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          {renderStatCard(<AlertTriangle size={24} />, "Kondisi Kritis", stats.asetRusak, -5.0, "text-[#F1416C]", "bg-[#FFF5F8]")}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Donut Chart: Kondisi Aset */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white border border-[#E1E3EA] p-6 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-[16px] font-bold text-[#181C32]">Status Fisik Aset</h3>
            <p className="text-[12px] text-[#A1A5B7] font-medium mt-0.5">Proporsi kondisi keseluruhan aset terdaftar.</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {loading ? (
              <div className="w-8 h-8 border-4 border-[#FFA800] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height="240" />
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-[12px] font-bold">
              <span className="flex items-center gap-2 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#50CD89]"></span> Normal</span>
              <span className="text-[#181C32]">{stats.asetNormal.toLocaleString()} <span className="text-[#A1A5B7] font-medium">({Math.round(stats.asetNormal/stats.totalAset*100)}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-bold">
              <span className="flex items-center gap-2 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#FFC700]"></span> Perbaikan</span>
              <span className="text-[#181C32]">{stats.sedangPerbaikan.toLocaleString()} <span className="text-[#A1A5B7] font-medium">({Math.round(stats.sedangPerbaikan/stats.totalAset*100)}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-[12px] font-bold">
              <span className="flex items-center gap-2 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#F1416C]"></span> Kritis / Rusak</span>
              <span className="text-[#181C32]">{stats.asetRusak.toLocaleString()} <span className="text-[#A1A5B7] font-medium">({Math.round(stats.asetRusak/stats.totalAset*100)}%)</span></span>
            </div>
          </div>
        </motion.div>

        {/* Bar Chart: Aktivitas Pemeliharaan */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 }}
          className="xl:col-span-2 bg-white border border-[#E1E3EA] p-6 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#181C32]">Aktivitas Work Order Pemeliharaan</h3>
              <p className="text-[12px] text-[#A1A5B7] font-medium mt-0.5">Penyelesaian tiket pemeliharaan aset 7 hari terakhir.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#0095E8]"></span> Selesai</span>
              <span className="flex items-center gap-1.5 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#E1E3EA]"></span> Tertunda</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ReactApexChart options={barOptions} series={barSeries} type="bar" height="100%" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail / Log Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-white border border-[#E1E3EA] rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-5 border-b border-[#F1F1F4] flex justify-between items-center bg-[#F9F9F9]/50">
          <div>
            <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2">
              <Clock size={16} className="text-[#0095E8]" /> Log Prioritas Pemeliharaan
            </h3>
          </div>
          <button className="text-[12px] font-bold text-[#0095E8] hover:text-[#007AC2] transition-colors">Lihat Semua</button>
        </div>
        <div className="divide-y divide-[#F1F1F4]">
          {logs.map((log, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F5F8FA] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  ['Kritis', 'Rusak', 'Ditolak'].includes(log.status) ? 'bg-[#FFF5F8] text-[#F1416C]' : 
                  ['Sedang Berjalan', 'Proses', 'Menunggu'].includes(log.status) ? 'bg-[#FFF8DD] text-[#FFC700]' : 'bg-[#F1FAFF] text-[#0095E8]'
                }`}>
                  <Settings size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#181C32] group-hover:text-[#0095E8] transition-colors">{log.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-[#A1A5B7]">{log.id}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E1E3EA]"></span>
                    <span className="text-[11px] font-medium text-[#7E8299] flex items-center gap-1"><Building2 size={10} /> {log.dept}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  ['Kritis', 'Rusak', 'Ditolak'].includes(log.status) ? 'bg-[#F1416C] text-white' : 
                  ['Sedang Berjalan', 'Proses', 'Menunggu'].includes(log.status) ? 'bg-[#FFC700] text-white' : 'bg-[#F5F8FA] text-[#7E8299] border border-[#E1E3EA]'
                }`}>
                  {log.status}
                </span>
                <p className="text-[11px] font-medium text-[#A1A5B7]">{log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardMaintenanceAset;
