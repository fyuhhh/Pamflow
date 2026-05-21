import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactApexChart from 'react-apexcharts';
import { ClipboardList, CheckCircle2, AlertTriangle, FileWarning, Clock, Building2, TrendingUp, Search } from 'lucide-react';
import { authFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DashboardChecklistHarian = () => {
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalInspeksi: 0,
    complianceRate: 0,
    temuanKerusakan: 0,
    woGenerated: 0,
  });
  
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState({ series: [], categories: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const companyId = user?.company_id;
        
        // Fetch sessions limit 100 to get a good dataset for stats
        const res = await authFetch(`/api/checklist-sessions?limit=100${companyId ? `&company_id=${companyId}` : ''}`);
        
        if (res.ok) {
          const data = await res.json();
          
          let totalItems = 0;
          let okItems = 0;
          let brokenItems = 0;
          let woCount = 0;

          // Process stats
          data.forEach(session => {
            totalItems += (session.total_items || 0);
            okItems += (session.ok_count || 0);
            brokenItems += (session.broken_count || 0);
            if (session.wo_generated_id) woCount++;
          });

          const compliance = totalItems > 0 ? Math.round((okItems / totalItems) * 100 * 10) / 10 : 100;

          setStats({
            totalInspeksi: data.length,
            complianceRate: compliance,
            temuanKerusakan: brokenItems,
            woGenerated: woCount
          });

          // Process chart data (by date)
          const dateMap = {};
          data.forEach(s => {
            const dateStr = s.session_date ? s.session_date.split('T')[0] : 'Unknown';
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = { ok: 0, broken: 0, count: 0 };
            }
            dateMap[dateStr].ok += (s.ok_count || 0);
            dateMap[dateStr].broken += (s.broken_count || 0);
            dateMap[dateStr].count += 1;
          });

          // Sort dates and get last 7
          const sortedDates = Object.keys(dateMap).sort().slice(-7);
          const okSeries = sortedDates.map(d => dateMap[d].ok);
          const brokenSeries = sortedDates.map(d => dateMap[d].broken);
          
          const formattedDates = sortedDates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
          });

          setChartData({
            categories: formattedDates.length > 0 ? formattedDates : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            series: [
              { name: 'Aman (OK)', data: okSeries.length > 0 ? okSeries : [0,0,0,0,0,0,0] },
              { name: 'Temuan (Rusak)', data: brokenSeries.length > 0 ? brokenSeries : [0,0,0,0,0,0,0] }
            ]
          });

          // Recent Logs
          setLogs(data.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to fetch checklist data', e);
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

  // Chart Options
  const barOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Poppins, sans-serif', stacked: true },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    xaxis: { 
      categories: chartData.categories,
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#A1A5B7', fontSize: '11px', fontWeight: 600 } }
    },
    yaxis: { labels: { style: { colors: '#A1A5B7', fontSize: '11px', fontWeight: 600 } } },
    grid: { borderColor: '#F1F1F4', strokeDashArray: 4, padding: { top: 0, right: 0, bottom: 0, left: 10 } },
    colors: ['#50CD89', '#F1416C'],
    legend: { show: false },
    fill: { opacity: 1 }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const renderStatCard = (icon, label, value, subtext, colorClass, bgClass) => (
    <div className="bg-white border border-[#E1E3EA] p-5 rounded-2xl flex items-center justify-between group hover:border-[#50CD89]/30 hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-[12px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-[28px] font-black text-[#181C32] leading-none mb-2">{value}</h3>
        <p className="text-[11px] font-bold text-[#7E8299] flex items-center gap-1">
          {subtext}
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
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#50CD89]/10 rounded-full blur-3xl group-hover:bg-[#50CD89]/20 transition-all duration-700"></div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#E8FFF3] to-transparent opacity-80 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-[26px] font-bold text-[#181C32] tracking-tight">
              {getGreeting()}, <span className="text-[#50CD89]">{user?.firstName || 'Operator'}</span>!
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] text-[#7E8299] font-medium">Monitoring Kepatuhan Checklist dan Operasional Harian.</p>
            <span className="px-2 py-0.5 bg-[#E8FFF3] text-[#39A86E] text-[10px] font-bold rounded uppercase tracking-wider border border-[#50CD89]/20">
              OPERASIONAL
            </span>
          </div>
        </div>

        <div className="text-left md:text-right relative z-10 mt-5 md:mt-0 flex flex-col md:items-end">
          <p className="text-[38px] md:text-[44px] font-black text-[#181C32] leading-none tracking-tighter drop-shadow-sm flex items-baseline gap-1">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':').replace('.', ':')}
            <span className="text-[24px] text-[#50CD89] font-bold animate-pulse">
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
          {renderStatCard(<ClipboardList size={24} />, "Total Inspeksi", stats.totalInspeksi, "Sesi tercatat bulan ini", "text-[#0095E8]", "bg-[#F1FAFF]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          {renderStatCard(<CheckCircle2 size={24} />, "Tingkat Kepatuhan", `${stats.complianceRate}%`, "Item berstatus OK", "text-[#50CD89]", "bg-[#E8FFF3]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          {renderStatCard(<AlertTriangle size={24} />, "Total Temuan", stats.temuanKerusakan, "Item terdeteksi rusak", "text-[#F1416C]", "bg-[#FFF5F8]")}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          {renderStatCard(<FileWarning size={24} />, "WO Diterbitkan", stats.woGenerated, "Dari hasil temuan", "text-[#FFC700]", "bg-[#FFF8DD]")}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart: Temuan per Hari */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="xl:col-span-2 bg-white border border-[#E1E3EA] p-6 rounded-2xl shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[16px] font-bold text-[#181C32]">Analitik Kepatuhan & Temuan</h3>
              <p className="text-[12px] text-[#A1A5B7] font-medium mt-0.5">Tren hasil checklist harian dalam 7 hari terakhir.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#50CD89]"></span> OK</span>
              <span className="flex items-center gap-1.5 text-[#7E8299]"><span className="w-2 h-2 rounded-full bg-[#F1416C]"></span> Temuan Rusak</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#50CD89] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ReactApexChart options={barOptions} series={chartData.series} type="bar" height="100%" />
            )}
          </div>
        </motion.div>

        {/* Insight / Mini Summary */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-[#181C32] rounded-2xl shadow-lg p-6 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={120} className="text-white" />
          </div>
          <div className="relative z-10 flex-1 flex flex-col">
            <h3 className="text-white text-[18px] font-black mb-1">Status Kepatuhan</h3>
            <p className="text-[#A1A5B7] text-[12px] font-medium mb-6">Ringkasan cepat performa inspeksi</p>

            <div className="space-y-4 flex-1">
              <div className="bg-white/10 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[#A1A5B7] text-[11px] font-bold uppercase tracking-wider">Skor Kepatuhan</span>
                  <span className={`text-[20px] font-black ${stats.complianceRate > 90 ? 'text-[#50CD89]' : stats.complianceRate > 75 ? 'text-[#FFC700]' : 'text-[#F1416C]'}`}>
                    {stats.complianceRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${stats.complianceRate > 90 ? 'bg-[#50CD89]' : stats.complianceRate > 75 ? 'bg-[#FFC700]' : 'bg-[#F1416C]'}`} style={{ width: `${stats.complianceRate}%` }}></div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/5 backdrop-blur-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#FFC700]/20 flex items-center justify-center text-[#FFC700]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[14px] leading-tight">{stats.temuanKerusakan} Item Perlu Perhatian</h4>
                  <p className="text-[#A1A5B7] text-[11px] mt-0.5">{stats.woGenerated} WO telah di-generate</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/tugas-departemen/checklist-harian')}
              className="mt-6 w-full py-3 bg-[#50CD89] hover:bg-[#39A86E] text-white text-[13px] font-bold rounded-xl transition-colors shadow-[0_4px_12px_rgba(80,205,137,0.3)]"
            >
              Mulai Checklist Sekarang
            </button>
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
              <Clock size={16} className="text-[#50CD89]" /> Riwayat Checklist Terbaru
            </h3>
          </div>
          <button onClick={() => navigate('/tugas-departemen/checklist-riwayat')} className="text-[12px] font-bold text-[#50CD89] hover:text-[#39A86E] transition-colors">Lihat Semua</button>
        </div>
        <div className="divide-y divide-[#F1F1F4]">
          {loading ? (
            <div className="p-8 text-center text-[#A1A5B7] text-[12px] font-medium animate-pulse">Memuat data riwayat...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[#A1A5B7] text-[12px] font-medium flex flex-col items-center">
              <Search size={32} className="mb-2 text-[#E1E3EA]" />
              Belum ada data checklist
            </div>
          ) : logs.map((log, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F5F8FA] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  log.broken_count > 0 ? 'bg-[#FFF5F8] text-[#F1416C]' : 'bg-[#E8FFF3] text-[#50CD89]'
                }`}>
                  {log.broken_count > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#181C32] group-hover:text-[#50CD89] transition-colors">{log.template_name || 'Checklist Rutin'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-[#A1A5B7]">{log.submitted_by_name || 'Operator'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E1E3EA]"></span>
                    <span className="text-[11px] font-medium text-[#7E8299] flex items-center gap-1"><Building2 size={10} /> {log.dept_name || '-'}</span>
                    <span className="w-1 h-1 rounded-full bg-[#E1E3EA]"></span>
                    <span className="text-[11px] font-bold text-[#0095E8] uppercase">{log.session_shift}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8FFF3] text-[#50CD89]">OK: {log.ok_count}</span>
                  {log.broken_count > 0 && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF5F8] text-[#F1416C]">Rusak: {log.broken_count}</span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-[#A1A5B7]">
                  {log.session_date ? new Date(log.session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''} {log.session_time ? log.session_time.substring(0,5) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardChecklistHarian;
