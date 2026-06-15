import React, { useState, useEffect } from 'react';
import { authFetch } from '../services/api';
import { 
  Zap, Plus, Trash2, Edit3, ClipboardList, CheckCircle, XCircle, 
  Search, RefreshCw, QrCode, X, Calendar, User, Eye, ChevronDown, ChevronUp, ArrowRight, Camera, Image
} from 'lucide-react';

const formatBillingStartMonth = (val) => {
  if (!val) return '-';
  if (val.includes('-')) {
    const parts = val.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${months[monthIndex]} ${year}`;
      }
    }
  }
  return val;
};

const convertToDateString = (val) => {
  if (!val) return '';
  if (val.includes('-')) {
    return val.substring(0, 10);
  }
  const months = [
    'jan', 'feb', 'mar', 'apr', 'mei', 'jun',
    'jul', 'agu', 'sep', 'okt', 'nov', 'des'
  ];
  const monthsFull = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  
  const valLower = val.toLowerCase();
  let monthIndex = -1;
  
  for (let i = 0; i < 12; i++) {
    if (valLower.includes(monthsFull[i]) || valLower.includes(months[i])) {
      monthIndex = i;
      break;
    }
  }
  
  const yearMatch = val.match(/\b\d{4}\b/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  
  if (monthIndex !== -1) {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${monthStr}-01`;
  }
  
  return '';
};

const SearchableDropdown = ({ label, type, value, onChange, placeholder }) => {
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingVal, setEditingVal] = useState('');

  const fetchOptions = async () => {
    try {
      const res = await authFetch(`/api/utility/options?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setOptions(data);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [type]);

  const handleAdd = async () => {
    if (!newVal.trim()) return;
    try {
      const res = await authFetch('/api/utility/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_type: type, option_value: newVal.trim() })
      });
      if (res.ok) {
        setNewVal('');
        fetchOptions();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menambahkan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingVal.trim()) return;
    try {
      const res = await authFetch(`/api/utility/options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_value: editingVal.trim() })
      });
      if (res.ok) {
        setEditingId(null);
        setEditingVal('');
        fetchOptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pilihan ini?')) return;
    try {
      const res = await authFetch(`/api/utility/options/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOptions();
        if (value && !options.find(o => o.id !== id && o.option_value === value)) {
          onChange('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = options.filter(o => 
    o.option_value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
        {label}
      </label>
      
      {/* Click-outside backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99998]" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsManageMode(false);
        }}
        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[13px] font-bold text-left outline-none focus:border-[#7239EA] transition-all flex items-center justify-between"
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400 font-medium'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {/* Dropdown Floating Card */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl p-4 shadow-xl z-[99999] animate-scale-up max-h-[320px] overflow-y-auto">
          {!isManageMode ? (
            <>
              {/* Search Box */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Cari ${label}...`}
                  className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-2.5 rounded-xl text-[12px] font-bold outline-none focus:border-[#7239EA]"
                />
              </div>

              {/* Options List */}
              <div className="space-y-0.5 max-h-[160px] overflow-y-auto mb-3 scrollbar-thin">
                {filtered.length > 0 ? (
                  filtered.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        onChange(o.option_value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                        value === o.option_value 
                          ? 'bg-purple-50 text-[#7239EA]' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {o.option_value}
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 font-semibold py-2 text-center">
                    Tidak ada hasil
                  </p>
                )}
              </div>

              {/* Manage Trigger */}
              <button
                type="button"
                onClick={() => setIsManageMode(true)}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-[#7239EA] text-[11px] font-black rounded-xl transition-all"
              >
                + Kelola Pilihan {label}
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Kelola {label}
                </h5>
                <button
                  type="button"
                  onClick={() => setIsManageMode(false)}
                  className="text-[#7239EA] text-[11px] font-black hover:underline"
                >
                  Kembali
                </button>
              </div>

              {/* Add New Field */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  placeholder={`Tambah ${label} baru...`}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[12px] font-semibold outline-none focus:border-[#7239EA]"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 bg-[#7239EA] hover:bg-[#602ecc] text-white rounded-xl text-[12px] font-black flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Items Management List */}
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {options.map(o => (
                  <div 
                    key={o.id}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100"
                  >
                    {editingId === o.id ? (
                      <input
                        type="text"
                        value={editingVal}
                        onChange={(e) => setEditingVal(e.target.value)}
                        className="flex-1 bg-white border border-[#7239EA] px-2 py-1 rounded-lg text-[12px] font-bold outline-none mr-2"
                      />
                    ) : (
                      <span className="text-[12px] font-bold text-slate-700 truncate max-w-[150px]">
                        {o.option_value}
                      </span>
                    )}

                    <div className="flex gap-1.5 flex-shrink-0">
                      {editingId === o.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdate(o.id)}
                            className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center"
                          >
                            <CheckCircle size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <XCircle size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(o.id);
                              setEditingVal(o.option_value);
                            }}
                            className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(o.id)}
                            className="w-6 h-6 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const UtilityListrik = () => {
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('master'); // 'master' or 'history'
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(null); // for edit mode
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrTenantName, setQrTenantName] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [selectedTenantName, setSelectedTenantName] = useState(null);
  const [showTenantDetailModal, setShowTenantDetailModal] = useState(false);
  const [expandedMeterId, setExpandedMeterId] = useState(null);

  // Meter Form Fields
  const [tenantName, setTenantName] = useState('');
  const [meterSection, setMeterSection] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [powerCapacity, setPowerCapacity] = useState('');
  const [meterBrand, setMeterBrand] = useState('');
  const [meterType, setMeterType] = useState('');
  const [initialReading, setInitialReading] = useState('0');
  const [billingStartMonth, setBillingStartMonth] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metersRes, readingsRes] = await Promise.all([
        authFetch('/api/utility/meters?utility_type=listrik'),
        authFetch('/api/utility/readings?utility_type=listrik')
      ]);

      if (metersRes.ok) setMeters(await metersRes.json());
      if (readingsRes.ok) setReadings(await readingsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard utility data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReading = async (readingId) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus pencatatan gantung ini?')) {
      return;
    }
    try {
      const res = await authFetch(`/api/utility/readings/${readingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Pencatatan gantung berhasil dibatalkan.');
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal membatalkan pencatatan.');
      }
    } catch (err) {
      console.error('Error cancelling reading:', err);
      alert('Terjadi kesalahan saat membatalkan pencatatan.');
    }
  };

  const handleOpenMeterModal = (meter = null) => {
    if (meter) {
      setSelectedMeter(meter);
      const parts = meter.tenant_name.split(' - ');
      setTenantName(parts[0] || '');
      setMeterSection(parts[1] || '');
      setMeterNumber(meter.meter_number);
      setFloor(meter.floor || '');
      setArea(meter.area || '');
      setPowerCapacity(meter.power_capacity || '');
      setMeterBrand(meter.meter_brand || '');
      setMeterType(meter.meter_type || '');
      setInitialReading('0'); // Disabled in edit mode
      setBillingStartMonth(convertToDateString(meter.billing_start_month || ''));
    } else {
      setSelectedMeter(null);
      // Keep tenantName if we are adding a meter from the Tenant Detail Modal
      setTenantName(tenantName || '');
      setMeterSection('');
      setMeterNumber('');
      setFloor('');
      setArea('');
      setPowerCapacity('');
      setMeterBrand('');
      setMeterType('');
      setInitialReading('0');
      setBillingStartMonth('');
    }
    setShowMeterModal(true);
  };

  const handleSaveMeter = (e) => {
    e.preventDefault();
    if (!tenantName || !meterNumber) {
      alert('Nama Tenant dan Nomor Meter wajib diisi!');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSaveMeter = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const url = selectedMeter ? `/api/utility/meters/${selectedMeter.id}` : '/api/utility/meters';
      const method = selectedMeter ? 'PUT' : 'POST';
      
      const finalTenantName = meterSection.trim() 
        ? `${tenantName.trim()} - ${meterSection.trim()}` 
        : tenantName.trim();

      const body = {
        tenant_name: finalTenantName,
        utility_type: 'listrik',
        floor,
        area,
        power_capacity: powerCapacity,
        meter_brand: meterBrand,
        meter_type: meterType,
        meter_number: meterNumber,
        initial_reading: parseFloat(initialReading) || 0,
        billing_start_month: billingStartMonth
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowMeterModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menyimpan data meteran.');
      }
    } catch (err) {
      console.error('Error saving meter:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeter = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus meteran ini? Semua riwayat pembacaan terkait akan ikut terhapus!')) return;
    try {
      const res = await authFetch(`/api/utility/meters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting meter:', err);
    }
  };

  const handleDirectApproval = async (token, action, notes = '') => {
    if (!confirm(`Apakah Anda yakin ingin langsung me-${action === 'Approve' ? 'nyetujui' : 'nolak'} pembacaan ini?`)) return;
    try {
      const res = await authFetch(`/api/utility/public/readings/token/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: notes || (action === 'Approve' ? 'Disetujui oleh Supervisor' : 'Ditolak oleh Supervisor')
        })
      });

      if (res.ok) {
        setShowDetailModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal mengubah status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openQRModal = (token, tenantName) => {
    setQrToken(token);
    setQrTenantName(tenantName);
    setShowQRModal(true);
  };

  const formatIndonesianDate = (dateString, timestamp = null) => {
    const target = timestamp || dateString;
    if (!target) return '-';
    try {
      const date = new Date(target);
      if (isNaN(date.getTime())) return target;
      
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${dayName}, ${day} ${monthName} ${year}, ${hours}:${minutes}`;
    } catch (e) {
      return target;
    }
  };

  const formatDateShort = (dStr) => {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getPeriodText = (r) => {
    if (!r) return '';
    if (r.period_start && r.period_end) {
      return `${formatDateShort(r.period_start)} ➔ ${formatDateShort(r.period_end)}`;
    }
    // Find the previous approved reading of the same KWH meter
    const prevReadings = readings
      .filter(other => 
        other.meter_id === r.meter_id && 
        other.status === 'Approved' && 
        new Date(other.reading_date) < new Date(r.reading_date)
      )
      .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));

    const prev = prevReadings[0];
    if (prev) {
      return `${formatDateShort(prev.reading_date)} ➔ ${formatDateShort(r.reading_date)}`;
    } else {
      // Check if there is a billing_start_month on the meter
      const meterObj = meters.find(m => m.id === r.meter_id);
      if (meterObj && meterObj.billing_start_month) {
        return `${formatDateShort(meterObj.billing_start_month)} ➔ ${formatDateShort(r.reading_date)}`;
      }
      return formatDateShort(r.reading_date);
    }
  };

  const getQRUrl = (token) => {
    const origin = window.location.origin;
    const approvalLink = `${origin}/approval-listrik/${token}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(approvalLink)}`;
  };

  // Stats / KPIs
  const totalMeters = meters.length;
  const pendingApprovals = readings.filter(r => r.status === 'Pending').length;
  const totalUsageKwh = readings
    .filter(r => r.status === 'Approved')
    .reduce((sum, r) => sum + parseFloat(r.usage_amount), 0)
    .toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Group meters by parent tenant
  const groupedMeters = React.useMemo(() => {
    const groups = {};
    meters.forEach(m => {
      const parts = m.tenant_name.split(' - ');
      const parent = parts[0] || 'Umum';
      const section = parts[1] || '';
      
      if (!groups[parent]) {
        groups[parent] = {
          tenantName: parent,
          meters: [],
          floors: new Set(),
          areas: new Set(),
          minBillingMonth: null
        };
      }
      
      groups[parent].meters.push({ ...m, section });
      if (m.floor) groups[parent].floors.add(m.floor);
      if (m.area) groups[parent].areas.add(m.area);
      if (m.billing_start_month) {
        if (!groups[parent].minBillingMonth || m.billing_start_month < groups[parent].minBillingMonth) {
          groups[parent].minBillingMonth = m.billing_start_month;
        }
      }
    });
    
    return Object.values(groups).sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }, [meters]);

  const handleOpenTenantDetail = (tenantName) => {
    setSelectedTenantName(tenantName);
    setShowTenantDetailModal(true);
  };

  // Filtered readings
  const filteredReadings = readings.filter(r => {
    const matchesSearch = r.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.meter_number.includes(searchQuery);
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 leading-tight flex items-center gap-2">
            <Zap className="text-[#7239EA] fill-[#7239EA]/10" size={26} />
            Pendataan Utilitas Listrik
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Kelola data master meteran KWH dan audit seluruh pencatatan stand pemakaian listrik tenant.
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-[13px] shadow-sm transition-colors text-slate-600"
        >
          <RefreshCw size={15} />
          Segarkan Data
        </button>
      </div>

      {/* KPI Stats Widget Grid — soft white style like Dashboard (gambar 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 — Total Meteran */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Meteran Aktif (Master)</p>
            <h3 className="text-[28px] font-bold text-slate-800 leading-none">
              {totalMeters}
              <span className="text-[13px] text-slate-400 font-medium ml-1.5">KWH</span>
            </h3>
          </div>
          <div className="w-11 h-11 bg-[#EEF2FF] rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList size={20} className="text-[#6366F1]" />
          </div>
        </div>

        {/* Metric 2 — Persetujuan Gantung */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Persetujuan Gantung</p>
            <h3 className="text-[28px] font-bold text-slate-800 leading-none">
              {pendingApprovals}
              <span className="text-[13px] text-slate-400 font-medium ml-1.5">Tenant</span>
            </h3>
          </div>
          <div className="w-11 h-11 bg-[#FFFBEB] rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={20} className="text-[#F59E0B]" />
          </div>
        </div>

        {/* Metric 3 — Total Konsumsi */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Konsumsi Disetujui</p>
            <h3 className="text-[28px] font-bold text-slate-800 leading-none">
              {totalUsageKwh}
              <span className="text-[13px] text-slate-400 font-medium ml-1.5">kWh</span>
            </h3>
          </div>
          <div className="w-11 h-11 bg-[#F0FDF4] rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={20} className="text-[#22C55E]" />
          </div>
        </div>
      </div>

      {/* Tabs Menu for Clean Separation */}
      <div className="flex border-b border-slate-200/80 gap-2">
        <button
          onClick={() => setActiveTab('master')}
          className={`pb-3 px-6 font-bold text-[14px] transition-all border-b-2 outline-none ${
            activeTab === 'master' 
              ? 'border-[#7239EA] text-[#7239EA]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Master Data Meteran
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-6 font-bold text-[14px] transition-all border-b-2 flex items-center gap-2 outline-none ${
            activeTab === 'history' 
              ? 'border-[#7239EA] text-[#7239EA]' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Riwayat Log & Persetujuan</span>
          {pendingApprovals > 0 && (
            <span className="bg-[#FFC700] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingApprovals}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: MASTER DATA METERAN LISTRIK */}
      {activeTab === 'master' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Registrasi & Master Data KWH</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-0.5">Daftar seluruh meteran tenant yang terdaftar di area gedung.</p>
            </div>
            <button 
              onClick={() => handleOpenMeterModal()}
              className="bg-[#7239EA] hover:bg-[#602ecc] text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-[13px] shadow-md shadow-purple-500/10 transition-colors"
            >
              <Plus size={16} />
              Daftarkan Meteran Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 pl-4">Nama Tenant</th>
                  <th className="pb-4 text-center">Jumlah KWH Meter</th>
                  <th className="pb-4">Penempatan / Lantai</th>
                  <th className="pb-4">Area Penempatan</th>
                  <th className="pb-4">Mulai Pendataan</th>
                  <th className="pb-4 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {groupedMeters.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                      Belum ada tenant terdaftar. Klik "Daftarkan Meteran Baru" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  groupedMeters.map(g => (
                    <tr key={g.tenantName} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-4">
                        <span className="text-[13px] font-bold text-slate-800">{g.tenantName}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="bg-purple-50 text-[#7239EA] px-3 py-1 rounded-xl text-[11px] font-bold border border-[#7239EA]/5">
                          {g.meters.length} KWH
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        {Array.from(g.floors).join(', ') || '-'}
                      </td>
                      <td className="py-4 text-slate-400 font-medium">
                        {Array.from(g.areas).join(', ') || '-'}
                      </td>
                      <td className="py-4 text-slate-400 font-medium">
                        {g.minBillingMonth ? formatIndonesianDate(g.minBillingMonth) : '-'}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button
                          onClick={() => handleOpenTenantDetail(g.tenantName)}
                          className="bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-[#7239EA] px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold transition-all ml-auto"
                        >
                          <Eye size={14} />
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LOG PENCATATAN & PERSETUJUAN */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-[15px] font-bold text-slate-800">Riwayat Log & Persetujuan KWH Listrik</h3>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">Audit data stand kWh awal, akhir, dan approval dari pihak tenant.</p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
            {/* Search */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari tenant atau nomor KWH..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] font-semibold w-full text-slate-600 placeholder-slate-400"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[13px] font-semibold outline-none text-slate-600 focus:border-[#7239EA] transition-all"
              >
                <option value="">Semua Status Approval</option>
                <option value="Pending">Gantung (Butuh Approval)</option>
                <option value="Approved">Disetujui (Approved)</option>
                <option value="Rejected">Ditolak (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Readings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 pl-4">Tenant / KWH</th>
                  <th className="pb-4">Tanggal Catat</th>
                  <th className="pb-4">Stand Awal</th>
                  <th className="pb-4">Stand Akhir</th>
                  <th className="pb-4 text-center">Pemakaian</th>
                  <th className="pb-4">Petugas</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {filteredReadings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-slate-400 font-semibold">
                      Tidak ada log pembacaan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredReadings.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 pl-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 leading-tight">{r.tenant_name}</span>
                          <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">No KWH: {r.meter_number} {r.floor ? `(Lantai ${r.floor}, ${r.area})` : ''}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 text-[12px]">
                          <Calendar size={13} className="text-slate-400" />
                          {formatIndonesianDate(r.reading_date, r.created_at)}
                        </div>
                      </td>
                      <td className="py-4 text-slate-600 font-medium">{r.previous_reading}</td>
                      <td className="py-4 text-slate-600 font-medium">{r.current_reading}</td>
                      <td className="py-4 text-center">
                        <span className="bg-purple-50 text-[#7239EA] px-2.5 py-1 rounded-xl text-[12px] font-bold border border-[#7239EA]/5">
                          {r.usage_amount} kWh
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400" />
                          {r.agent_name || 'Petugas'}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {r.status === 'Approved' ? (
                            <span className="bg-[#E8FFF3] text-[#50CD89] px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold">Approved</span>
                          ) : r.status === 'Rejected' ? (
                            <span className="bg-[#FFF5F8] text-[#F1416C] px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold">Rejected</span>
                          ) : (
                            <span className="bg-[#FFF8DD] text-[#FFC700] px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold">Gantung</span>
                          )}

                          {r.tenant_approver_name && (
                            <div className="flex flex-col items-start mt-1">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Disetujui Oleh</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {r.tenant_approval_photo && (
                                  <a href={r.tenant_approval_photo} target="_blank" rel="noopener noreferrer" className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 hover:border-[#7239EA] transition-colors" title="Lihat Foto Persetujuan">
                                    <img src={r.tenant_approval_photo} alt="Penyetuju" className="w-full h-full object-cover" />
                                  </a>
                                )}
                                <span className="text-[11px] font-black text-slate-700">{r.tenant_approver_name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedReading(r);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            title="Rincian Audit"
                          >
                            <Eye size={16} />
                          </button>
                          {r.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => {
                                  const cleanTenantName = r.tenant_name.split(' - ')[0];
                                  const sameTenantPending = readings.filter(
                                    other => other.status === 'Pending' && other.tenant_name.split(' - ')[0] === cleanTenantName
                                  );
                                  const tokens = sameTenantPending.map(other => other.approval_token).join(',');
                                  openQRModal(tokens, cleanTenantName);
                                }}
                                className="p-1.5 hover:bg-purple-50 rounded-lg text-[#7239EA] hover:text-[#5e28ce] transition-colors"
                                title="Tampilkan QR Link"
                              >
                                <QrCode size={16} />
                              </button>
                              <button
                                onClick={() => handleCancelReading(r.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-[#F1416C] hover:text-[#d9214e] transition-colors"
                                title="Batalkan & Hapus Pencatatan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: METER REGISTER/EDIT FORM */}
      {showMeterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowMeterModal(false)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <X size={16} />
            </button>

            <h3 className="text-[18px] font-black text-slate-900 mb-6">
              {selectedMeter ? 'Perbarui Data Meteran' : 'Daftarkan Meteran Listrik Baru'}
            </h3>

            <form onSubmit={handleSaveMeter} className="space-y-6">
              {/* SECTION A: IDENTITAS TENANT & METERAN */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <h4 className="text-[11px] font-black text-[#7239EA] uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-1.5 h-1.5 bg-[#7239EA] rounded-full"></span>
                  Identitas Tenant & Meteran
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Parent Tenant Dropdown */}
                  <div>
                    <SearchableDropdown
                      label="Nama Tenant"
                      type="tenant"
                      value={tenantName}
                      onChange={setTenantName}
                      placeholder="Pilih Nama Tenant"
                    />
                  </div>

                  {/* Section / Deskripsi KWH */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bagian / Deskripsi KWH</label>
                    <input
                      type="text"
                      value={meterSection}
                      onChange={(e) => setMeterSection(e.target.value)}
                      placeholder="Misal: PUTR TARIF 1 (LWBP)"
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[13px] font-bold outline-none focus:border-[#7239EA] transition-all"
                      required
                    />
                  </div>

                  {/* Meter Number */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nomor Meteran (No KWH)</label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="Masukkan Nomor Meteran (No KWH)"
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[13px] font-bold outline-none focus:border-[#7239EA] transition-all"
                      required
                    />
                  </div>

                  {/* Mulai Pendataan */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mulai Pendataan (Bulan/Tahun)</label>
                    <input
                      type="date"
                      value={billingStartMonth}
                      onChange={(e) => setBillingStartMonth(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[13px] font-bold outline-none focus:border-[#7239EA] transition-all text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: SPESIFIKASI KWH METERAN */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <h4 className="text-[11px] font-black text-[#7239EA] uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-1.5 h-1.5 bg-[#7239EA] rounded-full"></span>
                  Spesifikasi Kelistrikan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jenis KWH */}
                  <SearchableDropdown
                    label="Jenis KWH"
                    type="jenis_kwh"
                    value={meterBrand}
                    onChange={setMeterBrand}
                    placeholder="Pilih Jenis KWH"
                  />

                  {/* Tipe Meteran */}
                  <SearchableDropdown
                    label="Tipe Meteran"
                    type="tipe_meteran"
                    value={meterType}
                    onChange={setMeterType}
                    placeholder="Pilih Tipe Meteran"
                  />

                  {/* Daya Listrik */}
                  <div className="md:col-span-2">
                    <SearchableDropdown
                      label="Daya Listrik"
                      type="daya_listrik"
                      value={powerCapacity}
                      onChange={setPowerCapacity}
                      placeholder="Pilih Daya Listrik"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: DETAIL PENEMPATAN & BILLING */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <h4 className="text-[11px] font-black text-[#7239EA] uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <span className="w-1.5 h-1.5 bg-[#7239EA] rounded-full"></span>
                  Lokasi & Penempatan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lantai Unit */}
                  <SearchableDropdown
                    label="Lantai Unit"
                    type="lantai_unit"
                    value={floor}
                    onChange={setFloor}
                    placeholder="Pilih Lantai Unit"
                  />

                  {/* Area Unit */}
                  <SearchableDropdown
                    label="Area Unit"
                    type="area_unit"
                    value={area}
                    onChange={setArea}
                    placeholder="Pilih Area Unit"
                  />

                  {/* Stand Akhir Saat Ini */}
                  {!selectedMeter && (
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stand Akhir Saat Ini</label>
                      <input
                        type="number"
                        step="0.01"
                        value={initialReading}
                        onChange={(e) => setInitialReading(e.target.value)}
                        placeholder="Masukkan stand kWh awal saat registrasi"
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[13px] font-bold outline-none focus:border-[#7239EA] transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMeterModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-[13px] font-bold text-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#7239EA] hover:bg-[#602ecc] text-white rounded-2xl text-[13px] font-black shadow-md shadow-purple-500/10 transition-colors"
                >
                  {submitting ? 'Memproses...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE APPROVAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[36px] p-6 shadow-2xl relative text-center animate-scale-up">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <X size={16} />
            </button>

            <h3 className="text-[17px] font-black text-slate-900 mb-2">QR Code Persetujuan</h3>
            <p className="text-[12px] text-slate-400 max-w-xs mx-auto mb-6">
              Pihak tenant **{qrTenantName}** dapat memindai QR Code ini untuk membuka portal validasi mandiri tanpa login.
            </p>

            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner flex items-center justify-center mb-6">
              <img 
                src={getQRUrl(qrToken)} 
                alt="QR Code" 
                className="w-48 h-48 rounded-xl shadow-md border border-white"
              />
            </div>

            <button
              onClick={() => {
                const link = `${window.location.origin}/approval-listrik/${qrToken}`;
                navigator.clipboard.writeText(link);
                alert('Tautan persetujuan berhasil disalin ke clipboard!');
              }}
              className="w-full py-3 bg-[#7239EA] text-white rounded-2xl font-black text-[13px] hover:bg-[#602ecc] transition-all"
            >
              Salin Tautan Approval
            </button>
          </div>
        </div>
      )}

      {/* MODAL: AUDIT DETAIL */}
      {showDetailModal && selectedReading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <X size={16} />
            </button>

            <h3 className="text-[18px] font-black text-slate-900 mb-6">Audit Rincian Pembacaan</h3>

            <div className="space-y-5">
              {/* Tenant Profile */}
              <div>
                <p className="text-[10px] font-black text-[#7239EA] uppercase tracking-widest">Nama Tenant Utilitas</p>
                <h4 className="text-[20px] font-black text-slate-900 leading-tight mt-0.5">{selectedReading.tenant_name.split(' - ')[0]}</h4>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="bg-purple-50 text-[#7239EA] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-purple-100 flex items-center gap-1">
                    <Zap size={12} />
                    {selectedReading.tenant_name.split(' - ')[1] || 'UMUM'}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    No KWH: {selectedReading.meter_number}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Tanggal Catat</p>
                  <p className="text-[12px] font-black text-slate-700 mt-0.5">{formatIndonesianDate(selectedReading.reading_date, selectedReading.created_at)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Periode Penggunaan</p>
                  <p className="text-[12px] font-black text-[#7239EA] mt-0.5">{getPeriodText(selectedReading)}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/40">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Kapasitas Daya</p>
                  <p className="text-[12px] font-black text-slate-700 mt-0.5">{selectedReading.power_capacity || '-'}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/40">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Lantai & Unit Area</p>
                  <p className="text-[12px] font-black text-slate-700 mt-0.5">Lantai {selectedReading.floor || '-'}, Area {selectedReading.area || '-'}</p>
                </div>
              </div>

              {/* Photo Proof */}
              {selectedReading.meter_photo && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bukti Foto Stand Meteran</p>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(selectedReading.meter_photo)}
                    className="w-full relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center group cursor-zoom-in outline-none"
                  >
                    <img 
                      src={selectedReading.meter_photo} 
                      alt="Bukti Foto" 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" 
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[12px] font-bold gap-1">
                      <Search size={14} /> Klik untuk Memperbesar
                    </div>
                  </button>
                </div>
              )}

              {/* Values Block */}
              <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-5 rounded-3xl text-white shadow-md relative overflow-hidden text-center">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-white/50 font-black uppercase">Stand Awal</p>
                    <p className="text-[15px] font-black text-white mt-1">{selectedReading.previous_reading}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/50 font-black uppercase">Stand Akhir</p>
                    <p className="text-[15px] font-black text-white mt-1">{selectedReading.current_reading}</p>
                  </div>
                  <div className="border-l border-white/10 pl-2">
                    <p className="text-[9px] text-[#8E51FF] font-black uppercase">Pemakaian</p>
                    <p className="text-[15px] font-black text-[#8E51FF] mt-1">{selectedReading.usage_amount} kWh</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-[12px] font-bold text-slate-500">Status Validasi</span>
                {selectedReading.status === 'Approved' ? (
                  <span className="bg-[#E8FFF3] text-[#50CD89] px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border border-[#50CD89]/20">Approved</span>
                ) : selectedReading.status === 'Rejected' ? (
                  <span className="bg-[#FFF5F8] text-[#F1416C] px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border border-[#F1416C]/20">Rejected</span>
                ) : (
                  <span className="bg-[#FFF8DD] text-[#FFC700] px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider border border-[#FFC700]/20">Gantung</span>
                )}
              </div>

              {/* Tenant Approver Info */}
              {selectedReading.tenant_approver_name && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Disetujui Secara Mandiri Oleh
                    </p>
                    <p className="text-[14px] font-black text-slate-800">{selectedReading.tenant_approver_name}</p>
                    {selectedReading.approved_at && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Disetujui pada: {formatIndonesianDate(selectedReading.approved_at)}</p>
                    )}
                  </div>
                  {selectedReading.tenant_approval_photo && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(selectedReading.tenant_approval_photo)}
                      className="block relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-colors shadow-sm cursor-zoom-in outline-none"
                      title="Klik untuk lihat foto original"
                    >
                      <img src={selectedReading.tenant_approval_photo} alt="Selfie Persetujuan" className="w-full h-full object-cover" />
                    </button>
                  )}
                </div>
              )}

              {/* Rejection / Notes */}
              {selectedReading.notes && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Catatan Validasi</p>
                  <p className="text-[12px] font-semibold text-slate-600 italic">"{selectedReading.notes}"</p>
                </div>
              )}

              {/* Supervisor Direct Approval Panel */}
              {selectedReading.status === 'Pending' && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Validasi Supervisor Mandiri</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDirectApproval(selectedReading.approval_token, 'Approve')}
                      className="py-3 bg-[#50CD89] hover:bg-[#43b074] text-white rounded-2xl text-[12px] font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all"
                    >
                      <CheckCircle size={15} /> Setujui Langsung
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Masukkan alasan penolakan pencatatan:');
                        if (reason === null) return; // cancel
                        if (!reason.trim()) {
                          alert('Alasan penolakan wajib diisi!');
                          return;
                        }
                        handleDirectApproval(selectedReading.approval_token, 'Reject', reason);
                      }}
                      className="py-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-2xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle size={15} /> Tolak Langsung
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      handleCancelReading(selectedReading.id);
                      setShowDetailModal(false);
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-all border border-red-200 mt-2"
                  >
                    <Trash2 size={15} /> Batalkan & Hapus Pencatatan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL TENANT (MANY METERS & MoM PROGRESSION) */}
      {showTenantDetailModal && selectedTenantName && (() => {
        const tenantGroup = groupedMeters.find(g => g.tenantName === selectedTenantName) || { meters: [] };
        
        // Filter readings for this tenant
        const tenantMeterIds = tenantGroup.meters.map(m => m.id);
        const tenantReadings = readings.filter(r => tenantMeterIds.includes(r.meter_id));
        
        // Helper: Format KWH with thousand separator
        const formatKwh = (val) => {
          const num = parseFloat(val);
          if (isNaN(num)) return val;
          return num.toLocaleString('id-ID', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        };

        // Helper: Group readings by Month for a specific meter
        const getReadingsByMonthForMeter = (meterId) => {
          const meterReadings = tenantReadings.filter(r => r.meter_id === meterId);
          const groups = {};
          meterReadings.forEach(r => {
            const date = new Date(r.reading_date);
            if (isNaN(date.getTime())) return;
            const year = date.getFullYear();
            const monthIndex = date.getMonth();
            const monthNames = [
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
            const label = `${monthNames[monthIndex]} ${year}`;
            
            if (!groups[key]) {
              groups[key] = {
                label,
                readings: []
              };
            }
            groups[key].readings.push(r);
          });
          
          return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .map(key => ({
              key,
              label: groups[key].label,
              readings: groups[key].readings.sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date))
            }));
        };
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[32px] p-6 shadow-2xl relative animate-scale-up max-h-[90vh] flex flex-col">
              
              {/* STICKY HEADER */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <span className="text-[10px] font-bold text-[#7239EA] uppercase tracking-widest">Detail Tenant Utilitas</span>
                  <h3 className="text-[22px] font-black text-slate-900 leading-tight mt-1">
                    {selectedTenantName}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowTenantDetailModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all active:scale-95 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto pr-1.5 mt-4 space-y-6 scrollbar-thin">

              {/* SECTION A: LIST OF METERS (REDESIGNED TO PREMIUM CARDS FOR ZERO SQUEEZING) */}
              <div className="border border-slate-100 rounded-3xl p-5 bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                  <h4 className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#7239EA] rounded-full"></span>
                    Daftar KWH Meter Terdaftar ({tenantGroup.meters.length})
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedMeter(null);
                      setTenantName(selectedTenantName);
                      setMeterSection('');
                      setMeterNumber('');
                      setFloor('');
                      setArea('');
                      setPowerCapacity('');
                      setMeterBrand('');
                      setMeterType('');
                      setInitialReading('0');
                      setBillingStartMonth('');
                      setShowMeterModal(true);
                    }}
                    className="bg-white border border-slate-200 hover:bg-purple-50 text-[#7239EA] hover:text-[#5e28ce] px-4 py-2 rounded-2xl flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    Tambah Meteran Tenant
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenantGroup.meters.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                      Belum ada meteran terdaftar.
                    </div>
                  ) : (
                    tenantGroup.meters.map(m => (
                      <div key={m.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-3">
                        {/* Title Row */}
                        <div className="flex justify-between items-start pr-16">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-[#7239EA]">
                              <Zap size={15} />
                            </div>
                            <div>
                              <h5 className="text-[13px] font-black text-slate-800 leading-tight">{m.section || 'Umum'}</h5>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Bagian KWH</span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Action Buttons */}
                        <div className="absolute right-4 top-4 flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button
                            onClick={() => handleOpenMeterModal(m)}
                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-[#7239EA] transition-all"
                            title="Edit Meteran"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteMeter(m.id);
                              if (tenantGroup.meters.length <= 1) {
                                setShowTenantDetailModal(false);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all"
                            title="Hapus Meteran"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Card Details Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 text-[11px] font-bold text-slate-600">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Nomor Meteran</span>
                            <span className="text-[#7239EA] font-mono text-[12px]">{m.meter_number}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Daya Listrik</span>
                            <span className="bg-purple-50 text-[#7239EA] px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block border border-purple-100">
                              {m.power_capacity || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Lantai & Area</span>
                            <span className="text-slate-800">{`Lantai ${m.floor || '-'}, Area ${m.area || '-'}`}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Merk & Tipe</span>
                            <span className="text-slate-800">{m.meter_brand ? `${m.meter_brand} (${m.meter_type || '-'})` : '-'}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-50">
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-0.5">Mulai Pendataan</span>
                            <span className="text-slate-500 font-medium">{formatIndonesianDate(m.billing_start_month)}</span>
                          </div>
                        </div>

                        {/* Accordion History for this specific meter */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setExpandedMeterId(expandedMeterId === m.id ? null : m.id)}
                            className={`w-full flex items-center justify-between text-[11px] font-black uppercase tracking-widest p-2.5 rounded-xl transition-all ${
                              expandedMeterId === m.id 
                                ? 'bg-[#7239EA] text-white shadow-md shadow-purple-500/20' 
                                : 'bg-slate-50 text-[#7239EA] hover:bg-purple-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} />
                              Lihat Riwayat Pencatatan Listrik
                            </span>
                            {expandedMeterId === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {expandedMeterId === m.id && (() => {
                             const meterReadingsByMonth = getReadingsByMonthForMeter(m.id);
                             return (
                               <div className="mt-3 space-y-3 animate-scale-up border-t border-slate-100 pt-3">
                                 {meterReadingsByMonth.length === 0 ? (
                                   <div className="text-center py-5 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400 text-[11px] font-bold">
                                     Belum ada riwayat pencatatan untuk meteran ini.
                                   </div>
                                 ) : (
                                   meterReadingsByMonth.map(group => (
                                     <div key={group.key} className="bg-slate-50/70 rounded-2xl border border-slate-100 p-3 space-y-3 shadow-sm">
                                       <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                                         <div className="w-6 h-6 bg-purple-100 text-[#7239EA] rounded-md flex items-center justify-center">
                                           <Calendar size={12} />
                                         </div>
                                         <h6 className="text-[11px] font-black text-slate-800 tracking-wide">{group.label}</h6>
                                         <span className="ml-auto bg-white text-slate-500 text-[9px] px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                                           {group.readings.length} Log
                                         </span>
                                       </div>
                                       
                                       <div className="space-y-2.5">
                                         {group.readings.map(r => (
                                           <div key={r.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:border-purple-200 transition-colors">
                                             <div className="flex justify-between items-start mb-2 pb-2 border-b border-slate-50">
                                               <div>
                                                 <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Periode Penggunaan</span>
                                                 <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                   {getPeriodText(r)}
                                                 </span>
                                               </div>
                                               <div className="text-right flex flex-col items-end">
                                                 {r.status === 'Approved' ? (
                                                   <span className="text-[#50CD89] bg-[#E8FFF3] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Approved</span>
                                                 ) : r.status === 'Rejected' ? (
                                                   <span className="text-[#F1416C] bg-[#FFF5F8] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Rejected</span>
                                                 ) : (
                                                   <span className="text-[#FFC700] bg-[#FFF8DD] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Pending</span>
                                                 )}
                                               </div>
                                             </div>
                                             
                                             <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                                               <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100">
                                                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Stand Awal & Akhir</span>
                                                 <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                                                   <span>{formatKwh(r.previous_reading)}</span>
                                                   <ArrowRight size={10} className="text-slate-400" />
                                                   <span className="text-slate-800 font-black">{formatKwh(r.current_reading)}</span>
                                                 </div>
                                               </div>
                                               <div className="bg-purple-50/50 rounded-lg p-2 flex flex-col items-center justify-center border border-purple-100">
                                                 <span className="text-[9px] text-[#7239EA] font-black uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                                   <Zap size={10} /> Konsumsi Daya
                                                 </span>
                                                 <span className="text-[#7239EA] font-black text-[13px]">{formatKwh(r.usage_amount)} <span className="text-[10px]">kWh</span></span>
                                               </div>
                                             </div>
                                             
                                             <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                               {/* Data Petugas & Foto Meteran */}
                                               <div className="flex items-center justify-between bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80">
                                                 <div className="flex flex-col gap-0.5">
                                                   <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Dilaporkan Oleh Petugas</span>
                                                   <div className="flex items-center gap-1.5 text-slate-700 font-black text-[11px]">
                                                     <User size={12} className="text-slate-400" />
                                                     {r.agent_name || 'Petugas Tidak Terdaftar'}
                                                   </div>
                                                 </div>
                                                 {r.meter_photo ? (
                                                   <button
                                                      type="button"
                                                      onClick={() => setPreviewImage(r.meter_photo)}
                                                      className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] text-[#0095E8] hover:bg-[#0095E8]/5 hover:border-[#0095E8]/30 transition-all font-black uppercase shadow-sm cursor-zoom-in outline-none"
                                                      title="Lihat Foto Meteran Listrik"
                                                    >
                                                      <Camera size={12} /> Bukti Meteran
                                                    </button>
                                                 ) : (
                                                   <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">Tanpa Foto</span>
                                                 )}
                                               </div>
                                               
                                               {/* Data Penyetuju & Bukti Persetujuan Selfie */}
                                               {(r.status === 'Approved' || r.tenant_approver_name) && (
                                                 <div className="flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80">
                                                   <div className="flex flex-col gap-0.5">
                                                     <span className="text-[9px] text-emerald-600 uppercase tracking-widest font-bold flex items-center gap-1">
                                                       <CheckCircle size={10} /> Disetujui Secara Mandiri Oleh
                                                     </span>
                                                     <div className="flex items-center gap-1.5 text-slate-800 font-black text-[11px]">
                                                        {r.tenant_approver_name || 'Pihak Tenant'}
                                                      </div>
                                                      {r.approved_at && (
                                                        <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                                                          Waktu: {formatIndonesianDate(r.approved_at)}
                                                        </div>
                                                      )}
                                                   </div>
                                                   {r.tenant_approval_photo && (
                                                     <button
                                                        type="button"
                                                        onClick={() => setPreviewImage(r.tenant_approval_photo)}
                                                        className="flex items-center gap-2 bg-white border border-emerald-200 p-1 pr-3 rounded-full text-[9px] text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all font-black uppercase shadow-sm group cursor-zoom-in outline-none"
                                                        title="Lihat Selfie Persetujuan"
                                                      >
                                                        <img src={r.tenant_approval_photo} alt="Penyetuju" className="w-6 h-6 rounded-full object-cover border border-emerald-100 group-hover:scale-105 transition-transform" />
                                                        Selfie Verifikasi
                                                      </button>
                                                   )}
                                                 </div>
                                               )}
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   ))
                                 )}
                               </div>
                             );
                          })()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}

      {/* MODAL: CONFIRM SAVE */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative text-center animate-scale-up border border-slate-100">
            <div className="w-16 h-16 bg-purple-50 text-[#7239EA] rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <Zap size={28} className="fill-[#7239EA]/10" />
            </div>
            <h4 className="text-[16px] font-black text-slate-900 mb-2">Konfirmasi Simpan Data</h4>
            <p className="text-[12px] text-slate-500 font-semibold leading-relaxed mb-6">
              Apakah Anda yakin seluruh data spesifikasi meteran listrik untuk tenant <strong>{tenantName}</strong> sudah benar dan siap disimpan?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[13px] font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeSaveMeter}
                disabled={submitting}
                className="flex-1 py-3 bg-[#7239EA] hover:bg-[#602ecc] text-white rounded-2xl text-[13px] font-black shadow-md shadow-purple-500/10 transition-all"
              >
                {submitting ? 'Menyimpan...' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100000] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-3xl overflow-hidden shadow-2xl animate-scale-up flex flex-col items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all border border-white/15 z-10 active:scale-95"
            >
              <X size={20} />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityListrik;
