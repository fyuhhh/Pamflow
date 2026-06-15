import React, { useState, useEffect, useRef } from 'react';
import { Calendar, RotateCcw, AlertTriangle, CheckCircle2, Clock, ClipboardList, Building2, Package, Inbox, Send, Search, ChevronDown } from 'lucide-react';
import { authFetch } from '../services/api';
import ReactApexChart from 'react-apexcharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Searchable Select Component ---
const SearchableSelect = ({ value, onChange, options, placeholder, icon: Icon, width = 'w-[180px]' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value.toString() === value.toString())?.label || placeholder;

  return (
    <div className={`relative ${width} z-50`} ref={wrapperRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border border-[#E1E3EA] rounded-lg text-[12px] font-medium text-[#3F4254] bg-white hover:border-[#0095E8] transition-colors w-full text-left`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {Icon && <Icon size={14} className="text-[#A1A5B7] flex-shrink-0" />}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown size={14} className={`text-[#A1A5B7] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-[220px] bg-white border border-[#E1E3EA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[60] overflow-hidden"
          >
            <div className="p-2 border-b border-[#E1E3EA] bg-[#F5F8FA]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-[#E1E3EA] outline-none focus:border-[#0095E8]"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
              <button
                onClick={() => { onChange(placeholder); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12px] rounded-md transition-colors ${value === placeholder ? 'bg-[#F1FAFF] text-[#0095E8] font-bold' : 'text-[#3F4254] hover:bg-[#F5F8FA]'}`}
              >
                {placeholder}
              </button>
              {filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[12px] rounded-md transition-colors ${value.toString() === opt.value.toString() ? 'bg-[#F1FAFF] text-[#0095E8] font-bold' : 'text-[#3F4254] hover:bg-[#F5F8FA]'}`}
                >
                  {opt.label}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-[12px] text-[#A1A5B7]">Tidak ada hasil</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua Waktu');
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return user?.company_id ? user.company_id.toString() : 'Semua Perusahaan';
  });
  const [selectedDept, setSelectedDept] = useState(() => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    return user?.department || 'Semua Departemen';
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('agen'); 

  useEffect(() => {
    fetchStats();
    fetchFilters();
  }, [startDate, endDate, selectedCompany, selectedDept]);

  const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDateRange = (filter) => {
    const now = new Date();
    let start = '', end = '';

    if (filter === 'Hari Ini') {
      start = formatDateLocal(now);
      end = start;
    } else if (filter === 'Minggu Ini') {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
      start = formatDateLocal(new Date(curr.setDate(first)));
      const last = first + 6;
      end = formatDateLocal(new Date(curr.setDate(last)));
    } else if (filter === 'Bulan Ini') {
      start = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
      end = formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }

    return { start, end };
  };

  useEffect(() => {
    if (selectedFilter !== 'Kustom') {
      const { start, end } = calculateDateRange(selectedFilter);
      setStartDate(start);
      setEndDate(end);
    }
  }, [selectedFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompany !== 'Semua Perusahaan') params.append('company_id', selectedCompany);
      if (selectedDept !== 'Semua Departemen') params.append('departemen', selectedDept);

      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      const res = await authFetch(`/api/dashboard/stats?${params.toString()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [compRes, deptRes] = await Promise.all([
        authFetch('/api/companies'),
        authFetch('/api/departments')
      ]);
      if (compRes.ok) setCompanies(await compRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  // --- Data Calculations ---
  const getStatTotal = (arr, label) => {
    if (!arr || !Array.isArray(arr)) return 0;
    const items = arr.filter(s => 
      (s.progres === label) || 
      (s.status === label) || 
      ((label === 'Menunggu Approval') && (s.progres === 'Menunggu Persetujuan' || s.progres === 'Menunggu Approval' || s.progres === 'Menunggu Approval Penyelesaian' || s.progres === 'Menunggu Approval (Dikirim)' || s.status === 'Menunggu Approval')) ||
      ((label === 'Diproses') && (s.progres === 'Sedang Dikerjakan' || s.progres === 'Berlangsung' || s.status === 'Sedang Dikerjakan' || s.status === 'Diproses'))
    );
    return items.reduce((acc, item) => acc + Number(item.total || item.count || 0), 0);
  };

  const calculateTotal = (arr) => {
    if (!arr) return 0;
    return arr.reduce((acc, curr) => acc + Number(curr.total || curr.count || 0), 0);
  };

  // --- TAB 1: Tugas ke Agen ---
  const agenTerlambat = stats?.tasks?.timeliness?.terlambat || 0;
  const agenTepat = stats?.tasks?.timeliness?.tepat_waktu || 0;
  const agenTotal = calculateTotal(stats?.tasks?.status);
  
  const agenPipeline = {
    terbuka: getStatTotal(stats?.tasks?.status, 'Terbuka'),
    diproses: getStatTotal(stats?.tasks?.status, 'Diproses'),
    menungguApproval: getStatTotal(stats?.tasks?.status, 'Menunggu Approval'),
    selesai: getStatTotal(stats?.tasks?.status, 'Selesai')
  };

  // --- Dept Data ---
  const woReceived = stats?.workOrders?.received || [];
  const woSent = stats?.workOrders?.sent || [];
  const clReceived = stats?.checklists?.received || [];
  const clSent = stats?.checklists?.sent || [];

  const woTotalReceived = calculateTotal(woReceived);
  const woTotalSent = calculateTotal(woSent);
  const woTotal = woTotalReceived + woTotalSent;

  const clTotalReceived = calculateTotal(clReceived);
  const clTotalSent = calculateTotal(clSent);
  const clTotal = clTotalReceived + clTotalSent;

  // --- TAB 2: Tugas antar Departemen ---
  const deptTotal = woTotal + clTotal;
  const deptPipeline = {
    menunggu: getStatTotal(woReceived, 'Menunggu Pengerjaan') + getStatTotal(woSent, 'Menunggu Pengerjaan') + getStatTotal(clReceived, 'Menunggu Pengerjaan') + getStatTotal(clSent, 'Menunggu Pengerjaan'),
    diproses: getStatTotal(woReceived, 'Diproses') + getStatTotal(woSent, 'Diproses') + getStatTotal(clReceived, 'Diproses') + getStatTotal(clSent, 'Diproses'),
    selesai: getStatTotal(woReceived, 'Selesai') + getStatTotal(woSent, 'Selesai') + getStatTotal(clReceived, 'Selesai') + getStatTotal(clSent, 'Selesai')
  };

  // --- TAB 3: WO Detailed ---
  const woReceivedPipeline = {
    menunggu: getStatTotal(woReceived, 'Menunggu Pengerjaan'),
    diproses: getStatTotal(woReceived, 'Diproses'),
    selesai: getStatTotal(woReceived, 'Selesai')
  };
  const woSentPipeline = {
    menunggu: getStatTotal(woSent, 'Menunggu Pengerjaan'),
    diproses: getStatTotal(woSent, 'Diproses'),
    selesai: getStatTotal(woSent, 'Selesai')
  };

  // --- TAB 4: Checklist Detailed ---
  const clReceivedPipeline = {
    menunggu: getStatTotal(clReceived, 'Menunggu Pengerjaan'),
    diproses: getStatTotal(clReceived, 'Diproses'),
    selesai: getStatTotal(clReceived, 'Selesai')
  };
  const clSentPipeline = {
    menunggu: getStatTotal(clSent, 'Menunggu Pengerjaan'),
    diproses: getStatTotal(clSent, 'Diproses'),
    selesai: getStatTotal(clSent, 'Selesai')
  };

  // --- Chart Configurations (ApexCharts) ---
  const barChartOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'Poppins, sans-serif' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '40%' } },
    xaxis: { categories: ['Progres'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false } },
    grid: { show: false, padding: { top: 0, bottom: -20, left: 0, right: 0 } },
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (val) => val > 0 ? val : '' },
    tooltip: { y: { formatter: (val) => val + " Item" } }
  };

  const createSeries = (pipeline) => [
    { name: 'Selesai', data: [pipeline.selesai], color: '#50CD89' },
    { name: 'Diproses', data: [pipeline.diproses], color: '#FFC700' },
    { name: 'Menunggu', data: [pipeline.menunggu || pipeline.terbuka], color: '#0095E8' }
  ];
  
  const agenSeries = [
    { name: 'Selesai', data: [agenPipeline.selesai], color: '#50CD89' },
    { name: 'Menunggu Approval', data: [agenPipeline.menungguApproval], color: '#7239EA' },
    { name: 'Berlangsung', data: [agenPipeline.diproses], color: '#FFC700' },
    { name: 'Terbuka', data: [agenPipeline.terbuka], color: '#0095E8' }
  ];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // --- Helpers for Welcome Card ---
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const greetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 15) return '☀️';
    if (hour < 18) return '⛅';
    return '🌙';
  };

  // Render Functions
  const renderProgressBar = (label, value, total, colorClass, bgClass) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="space-y-1 mt-3">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-[#7E8299]">{label}</span>
          <span className={colorClass}>{value} <span className="text-[#A1A5B7] font-medium">({percent}%)</span></span>
        </div>
        <div className={`h-1.5 w-full rounded-full ${bgClass} overflow-hidden`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} 
          />
        </div>
      </div>
    );
  };

  const renderLegend = (label, value, color) => (
    <span className="flex items-center gap-1.5" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
      {label} ({value})
    </span>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Card & Real-time Clock */}
      <motion.div 
        whileHover={{ y: -2, boxShadow: '0 15px 40px -5px rgba(0,0,0,0.05)' }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 md:p-8 rounded-2xl border border-[#E1E3EA] flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group"
      >
        {/* Dynamic ambient background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0095E8]/10 rounded-full blur-3xl group-hover:bg-[#0095E8]/20 transition-all duration-700"></div>
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#F1FAFF] to-transparent opacity-80 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-[26px] font-bold text-[#181C32] tracking-tight">
              {getGreeting()}, <span className="text-[#0095E8]">{user?.firstName || 'User'}</span>! <span className="text-[22px]">{greetingIcon()}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] text-[#7E8299] font-medium">Ringkasan metrik Anda siap dianalisis.</p>
            {user?.role && (
              <span className="px-2 py-0.5 bg-[#F5F8FA] text-[#A1A5B7] text-[10px] font-bold rounded uppercase tracking-wider border border-[#E1E3EA]">
                {user.role}
              </span>
            )}
          </div>
        </div>

        <div className="text-left md:text-right relative z-10 mt-5 md:mt-0 flex flex-col md:items-end">
          <p className="text-[38px] md:text-[44px] font-black text-[#181C32] leading-none tracking-tighter drop-shadow-sm flex items-baseline gap-1">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':').replace('.', ':')}
            <span className="text-[24px] text-[#0095E8] font-bold animate-pulse">
              :{currentTime.toLocaleTimeString('id-ID', { second: '2-digit' })}
            </span>
          </p>
          <p className="text-[13px] font-bold text-[#A1A5B7] mt-1.5 uppercase tracking-[0.2em] bg-[#F5F8FA] px-3 py-1 rounded-md w-fit">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Modern Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-[#E1E3EA] shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-[#F5F8FA] rounded-lg">
          {['Semua Waktu', 'Hari Ini', 'Minggu Ini', 'Bulan Ini'].map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all duration-200 ${selectedFilter === f ? 'bg-white text-[#0095E8] shadow-sm' : 'text-[#7E8299] hover:text-[#3F4254]'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-[#E1E3EA] rounded-lg text-[12px] font-medium text-[#3F4254] bg-white transition-colors focus-within:border-[#0095E8]">
          <Calendar size={14} className="text-[#0095E8]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setSelectedFilter('Kustom'); }}
            className="outline-none border-none bg-transparent w-[105px] focus:text-[#0095E8]"
          />
          <span className="text-[#A1A5B7]">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setSelectedFilter('Kustom'); }}
            className="outline-none border-none bg-transparent w-[105px] focus:text-[#0095E8]"
          />
        </div>

        <div className="flex flex-1 items-center gap-2 min-w-min justify-end">
          <SearchableSelect
            value={selectedCompany}
            onChange={setSelectedCompany}
            options={companies.map(c => ({ value: c.id.toString(), label: c.name }))}
            placeholder="Semua Perusahaan"
            icon={Building2}
          />
          <SearchableSelect
            value={selectedDept}
            onChange={setSelectedDept}
            options={departments.filter(d => selectedCompany === 'Semua Perusahaan' || d.company_id === Number(selectedCompany)).map(d => ({ value: d.name, label: d.name }))}
            placeholder="Semua Departemen"
            icon={Building2}
          />
          <button
            onClick={() => { setSelectedFilter('Semua Waktu'); setSelectedCompany('Semua Perusahaan'); setSelectedDept('Semua Departemen'); }}
            className="p-1.5 bg-[#FFF5F8] text-[#F1416C] rounded-lg hover:bg-[#F1416C] hover:text-white transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Pill Tabs for Categories (Updated to 4 Tabs) */}
      <div className="flex flex-wrap p-1 bg-[#E1E3EA]/40 rounded-xl w-fit">
        {[
          { id: 'agen', label: 'Tugas ke Agen', icon: <ClipboardList size={16} /> },
          { id: 'departemen', label: 'Tugas antar Departemen', icon: <Building2 size={16} /> },
          { id: 'wo', label: 'Work Order', icon: <Clock size={16} /> },
          { id: 'checklist', label: 'Checklist', icon: <CheckCircle2 size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-[#0095E8]' : 'text-[#7E8299] hover:text-[#3F4254]'}`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${loading ? 'loading' : 'loaded'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-[#E1E3EA] p-6 shadow-sm min-h-[400px]"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
              <div className="w-8 h-8 border-4 border-[#0095E8] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#A1A5B7] font-medium text-[13px]">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* --- TAB 1: TUGAS KE AGEN --- */}
              {activeTab === 'agen' && (
                <div className="space-y-6">
                  {agenTerlambat > 0 ? (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-center gap-4 p-4 bg-[#FFF5F8] border border-[#F1416C]/30 rounded-xl">
                      <div className="p-2 bg-[#F1416C] rounded-full text-white"><AlertTriangle size={20} /></div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#F1416C]">Perhatian: Ada {agenTerlambat} Tugas Agen Terlambat!</h4>
                        <p className="text-[12px] font-medium text-[#F1416C]/80 mt-0.5">Pantau kinerja agen lapangan dan pastikan tugas yang melewati tenggat waktu segera ditindaklanjuti.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-[#E8FFF3] border border-[#50CD89]/30 rounded-xl">
                      <div className="p-2 bg-[#50CD89] rounded-full text-white"><CheckCircle2 size={20} /></div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#50CD89]">Kinerja Agen Optimal</h4>
                        <p className="text-[12px] font-medium text-[#50CD89]/80 mt-0.5">Tidak ada tugas lapangan yang berstatus terlambat saat ini.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 border border-[#E1E3EA] rounded-xl p-5 relative bg-gradient-to-br from-white to-[#F5F8FA]/50">
                      <h3 className="text-[14px] font-bold text-[#181C32] mb-1">Pipeline Progres Tugas Agen</h3>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Rincian status tugas dari mulai dibuat hingga divalidasi selesai.</p>
                      <div className="h-[120px]">
                        <ReactApexChart options={barChartOptions} series={agenSeries} type="bar" height="100%" />
                      </div>
                      <div className="flex flex-wrap justify-center items-center gap-4 mt-2 px-2 text-[11px] font-bold">
                        {renderLegend('Terbuka', agenPipeline.terbuka, '#0095E8')}
                        {renderLegend('Berlangsung', agenPipeline.diproses, '#FFC700')}
                        {renderLegend('Menunggu Approval', agenPipeline.menungguApproval, '#7239EA')}
                        {renderLegend('Selesai', agenPipeline.selesai, '#50CD89')}
                      </div>
                    </div>

                    <div className="border border-[#E1E3EA] rounded-xl p-5 flex flex-col justify-center">
                      <h3 className="text-[14px] font-bold text-[#181C32] mb-1">Kesehatan Waktu (SLA)</h3>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Efisiensi penyelesaian tugas.</p>
                      <div className="text-center mb-2">
                        <span className="text-[42px] font-black text-[#181C32]">{agenTotal}</span>
                        <p className="text-[10px] text-[#A1A5B7] font-bold uppercase tracking-widest mt-1">Total Tugas Agen</p>
                      </div>
                      {renderProgressBar('Tepat Waktu', agenTepat, agenTotal, 'text-[#50CD89]', 'bg-[#E8FFF3]')}
                      {renderProgressBar('Terlambat', agenTerlambat, agenTotal, 'text-[#F1416C]', 'bg-[#FFF5F8]')}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 2: TUGAS ANTAR DEPARTEMEN --- */}
              {activeTab === 'departemen' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border border-[#E1E3EA] p-5 rounded-xl bg-gradient-to-r from-[#F5F8FA] to-white">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#181C32]">Ikhtisar Tugas Departemen</h3>
                      <p className="text-[12px] text-[#7E8299] mt-1">Gabungan seluruh aktivitas Work Order dan Checklist lintas departemen.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[36px] font-black text-[#181C32] leading-none">{deptTotal}</p>
                      <p className="text-[10px] text-[#A1A5B7] font-bold uppercase tracking-widest mt-1">Total Permintaan</p>
                    </div>
                  </div>

                  <div className="border border-[#E1E3EA] rounded-xl p-5">
                     <h3 className="text-[14px] font-bold text-[#181C32] mb-1">Pipeline Gabungan Departemen</h3>
                     <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Visualisasi kemacetan (bottleneck) dari total WO dan Checklist.</p>
                     <div className="h-[150px]">
                        <ReactApexChart options={barChartOptions} series={createSeries(deptPipeline)} type="bar" height="100%" />
                     </div>
                     <div className="flex flex-wrap justify-center gap-5 mt-2 text-[12px] font-bold">
                        {renderLegend('Menunggu Pengerjaan', deptPipeline.menunggu, '#0095E8')}
                        {renderLegend('Diproses', deptPipeline.diproses, '#FFC700')}
                        {renderLegend('Selesai', deptPipeline.selesai, '#50CD89')}
                     </div>
                  </div>
                </div>
              )}

              {/* --- TAB 3: WORK ORDER --- */}
              {activeTab === 'wo' && (
                <div className="space-y-6">
                  {(woReceivedPipeline.menunggu + woSentPipeline.menunggu) > 0 && (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-center gap-4 p-4 bg-[#FFF8DD] border border-[#FFC700]/30 rounded-xl">
                      <div className="p-2 bg-[#FFC700] rounded-full text-white"><Clock size={20} /></div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#D9A400]">Ada {woReceivedPipeline.menunggu + woSentPipeline.menunggu} Work Order Tertunda</h4>
                        <p className="text-[12px] font-medium text-[#D9A400]/80 mt-0.5">Pantau departemen yang terlambat merespons Work Order.</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* WO Diterima */}
                    <div className="border border-[#E1E3EA] rounded-xl p-5 bg-gradient-to-br from-white to-[#F1FAFF]/30">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2"><Inbox size={16} className="text-[#0095E8]" /> WO Diterima</h3>
                        <span className="px-2 py-1 bg-[#F1FAFF] text-[#0095E8] text-[10px] font-bold rounded">Total: {woTotalReceived}</span>
                      </div>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Pipeline WO yang masuk ke departemen.</p>
                      <div className="h-[120px]">
                        <ReactApexChart options={barChartOptions} series={createSeries(woReceivedPipeline)} type="bar" height="100%" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-bold">
                        {renderLegend('Menunggu', woReceivedPipeline.menunggu, '#0095E8')}
                        {renderLegend('Diproses', woReceivedPipeline.diproses, '#FFC700')}
                        {renderLegend('Selesai', woReceivedPipeline.selesai, '#50CD89')}
                      </div>
                    </div>
                    
                    {/* WO Terkirim */}
                    <div className="border border-[#E1E3EA] rounded-xl p-5 bg-gradient-to-br from-white to-[#F5F8FA]/50">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2"><Send size={16} className="text-[#A1A5B7]" /> WO Terkirim</h3>
                        <span className="px-2 py-1 bg-[#F5F8FA] text-[#7E8299] text-[10px] font-bold rounded">Total: {woTotalSent}</span>
                      </div>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Pipeline WO yang dikirim ke departemen lain.</p>
                      <div className="h-[120px]">
                        <ReactApexChart options={barChartOptions} series={createSeries(woSentPipeline)} type="bar" height="100%" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-bold">
                        {renderLegend('Menunggu', woSentPipeline.menunggu, '#0095E8')}
                        {renderLegend('Diproses', woSentPipeline.diproses, '#FFC700')}
                        {renderLegend('Selesai', woSentPipeline.selesai, '#50CD89')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB 4: CHECKLIST --- */}
              {activeTab === 'checklist' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Checklist Diterima */}
                    <div className="border border-[#E1E3EA] rounded-xl p-5 bg-gradient-to-br from-white to-[#F8F5FF]/30">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2"><Inbox size={16} className="text-[#7239EA]" /> Checklist Diterima</h3>
                        <span className="px-2 py-1 bg-[#F8F5FF] text-[#7239EA] text-[10px] font-bold rounded">Total: {clTotalReceived}</span>
                      </div>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Pipeline form rutin yang diterima.</p>
                      <div className="h-[120px]">
                        <ReactApexChart options={barChartOptions} series={createSeries(clReceivedPipeline)} type="bar" height="100%" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-bold">
                        {renderLegend('Menunggu', clReceivedPipeline.menunggu, '#0095E8')}
                        {renderLegend('Diproses', clReceivedPipeline.diproses, '#FFC700')}
                        {renderLegend('Selesai', clReceivedPipeline.selesai, '#50CD89')}
                      </div>
                    </div>
                    
                    {/* Checklist Terkirim */}
                    <div className="border border-[#E1E3EA] rounded-xl p-5 bg-gradient-to-br from-white to-[#F5F8FA]/50">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-[14px] font-bold text-[#181C32] flex items-center gap-2"><Send size={16} className="text-[#A1A5B7]" /> Checklist Terkirim</h3>
                        <span className="px-2 py-1 bg-[#F5F8FA] text-[#7E8299] text-[10px] font-bold rounded">Total: {clTotalSent}</span>
                      </div>
                      <p className="text-[11px] text-[#A1A5B7] font-medium mb-4">Pipeline form rutin yang dikirimkan.</p>
                      <div className="h-[120px]">
                        <ReactApexChart options={barChartOptions} series={createSeries(clSentPipeline)} type="bar" height="100%" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-2 text-[11px] font-bold">
                        {renderLegend('Menunggu', clSentPipeline.menunggu, '#0095E8')}
                        {renderLegend('Diproses', clSentPipeline.diproses, '#FFC700')}
                        {renderLegend('Selesai', clSentPipeline.selesai, '#50CD89')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DashboardHome;
