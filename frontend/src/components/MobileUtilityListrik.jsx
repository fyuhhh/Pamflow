import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ChevronLeft, Plus, Calendar, Zap, AlertCircle, CheckCircle2, XCircle,
  QrCode, X, RefreshCw, Camera, User, ClipboardList, Eye, CheckCircle, Trash2, ChevronDown, ChevronUp,
  Database, Clock, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';

const MobileUtilityListrik = () => {
  const navigate = useNavigate();

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
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const [readings, setReadings] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [selectedTenantGroup, setSelectedTenantGroup] = useState(null);
  const [expandedMeterId, setExpandedMeterId] = useState(null);
  const [expandedHistoryMeterId, setExpandedHistoryMeterId] = useState(null);
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardMeters, setWizardMeters] = useState([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardTokens, setWizardTokens] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showGroupQRModal, setShowGroupQRModal] = useState(false);
  const [groupQRTokens, setGroupQRTokens] = useState('');

  // Form states
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [selectedMeterData, setSelectedMeterData] = useState(null);
  const [standAwal, setStandAwal] = useState(0);
  const [standAkhir, setStandAkhir] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [meterPhoto, setMeterPhoto] = useState(''); // base64 string
  const [submitting, setSubmitting] = useState(false);

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
          areas: new Set()
        };
      }

      groups[parent].meters.push({ ...m, section });
      if (m.floor) groups[parent].floors.add(m.floor);
      if (m.area) groups[parent].areas.add(m.area);
    });

    return Object.values(groups).sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }, [meters]);

  // Search & tab filter
  const [activeSegment, setActiveSegment] = useState('meters'); // 'meters' or 'gantung' or 'histori'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [readingsRes, metersRes] = await Promise.all([
        authFetch('/api/utility/readings?utility_type=listrik'),
        authFetch('/api/utility/meters?utility_type=listrik')
      ]);

      if (readingsRes.ok) setReadings(await readingsRes.json());
      if (metersRes.ok) setMeters(await metersRes.json());
    } catch (err) {
      console.error('Error fetching utility data:', err);
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
        fetchData();
        setSelectedReading(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal membatalkan pencatatan.');
      }
    } catch (err) {
      console.error('Error cancelling reading:', err);
      alert('Terjadi kesalahan saat membatalkan pencatatan.');
    }
  };

  // Select meter card and open form pre-filled
  const handleSelectMeterCard = async (meter) => {
    setSelectedMeterId(meter.id);
    setSelectedMeterData(meter);
    setStandAwal(0);
    setStandAkhir('');
    setNotes('');
    setMeterPhoto('');
    setShowForm(true);

    try {
      const res = await authFetch(`/api/utility/meters/${meter.id}/latest-reading`);
      if (res.ok) {
        const data = await res.json();
        setStandAwal(data.latest_approved_reading);
        if (data.latest_reading_date) {
          const nextDay = new Date(data.latest_reading_date);
          nextDay.setDate(nextDay.getDate() + 1);
          setPeriodStart(nextDay.toISOString().slice(0, 10));
        } else {
          setPeriodStart('');
        }
        setPeriodEnd(new Date().toISOString().slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching latest reading:', err);
    }
  };

  // Handle Photo Capture/File selection and convert to Base64
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Compress image simple helper using Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress quality to 70%
        setMeterPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReading = async (e) => {
    e.preventDefault();
    if (!selectedMeterId || !standAkhir) {
      alert('Mohon masukkan angka Stand Akhir!');
      return;
    }

    if (parseFloat(standAkhir) < parseFloat(standAwal)) {
      alert('Stand Akhir tidak boleh lebih kecil dari Stand Awal!');
      return;
    }

    if (!meterPhoto) {
      alert('Mohon ambil/unggah foto meteran sebagai bukti fisik wajib!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/utility/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meter_id: selectedMeterId,
          current_reading: parseFloat(standAkhir),
          reading_date: periodEnd || readingDate,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          meter_photo: meterPhoto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        fetchData();

        // Reset states
        setSelectedMeterId('');
        setSelectedMeterData(null);
        setStandAwal(0);
        setStandAkhir('');
        setNotes('');
        setMeterPhoto('');
        setPeriodStart('');
        setPeriodEnd('');

        // Switch automatically to the pending list tab
        setActiveSegment('gantung');

        // Instantly display detail modal of this new reading
        const meterObj = meters.find(m => m.id === parseInt(selectedMeterId));
        const newReading = {
          id: data.id,
          meter_id: selectedMeterId,
          previous_reading: standAwal,
          current_reading: parseFloat(standAkhir),
          usage_amount: parseFloat(standAkhir) - standAwal,
          status: 'Pending',
          approval_token: data.approval_token,
          reading_date: periodEnd || readingDate,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          meter_photo: meterPhoto,
          tenant_name: meterObj?.tenant_name,
          meter_number: meterObj?.meter_number,
          power_capacity: meterObj?.power_capacity,
          floor: meterObj?.floor,
          area: meterObj?.area
        };
        setSelectedReading(newReading);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal menyimpan pencatatan.');
      }
    } catch (err) {
      console.error('Error saving reading:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGroupReading = async (meterId) => {
    if (!standAkhir) {
      alert('Mohon masukkan angka Stand Akhir!');
      return;
    }

    if (parseFloat(standAkhir) < parseFloat(standAwal)) {
      alert('Stand Akhir tidak boleh lebih kecil dari Stand Awal!');
      return;
    }

    if (!meterPhoto) {
      alert('Mohon ambil/unggah foto meteran sebagai bukti fisik wajib!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/utility/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meter_id: meterId,
          current_reading: parseFloat(standAkhir),
          reading_date: periodEnd || readingDate,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          meter_photo: meterPhoto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExpandedMeterId(null);
        fetchData();

        // Reset states
        setStandAwal(0);
        setStandAkhir('');
        setNotes('');
        setMeterPhoto('');
        setPeriodStart('');
        setPeriodEnd('');

        // Find meter details
        const meterObj = meters.find(m => m.id === parseInt(meterId));
        const newReading = {
          id: data.id,
          meter_id: meterId,
          previous_reading: standAwal,
          current_reading: parseFloat(standAkhir),
          usage_amount: parseFloat(standAkhir) - standAwal,
          status: 'Pending',
          approval_token: data.approval_token,
          reading_date: periodEnd || readingDate,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          meter_photo: meterPhoto,
          tenant_name: meterObj?.tenant_name,
          meter_number: meterObj?.meter_number,
          power_capacity: meterObj?.power_capacity,
          floor: meterObj?.floor,
          area: meterObj?.area
        };
        setSelectedReading(newReading);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal menyimpan pencatatan.');
      }
    } catch (err) {
      console.error('Error saving group reading:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startWizard = async (metersList) => {
    // Select all meters that are NOT Pending
    const toRecord = metersList.filter(m => {
      const hasPending = readings.find(r => r.meter_id === m.id && r.status === 'Pending');
      return !hasPending;
    });

    if (toRecord.length === 0) {
      alert('Semua meteran tenant ini sudah dicatat atau sedang menunggu persetujuan!');
      return;
    }

    setWizardMeters(toRecord);
    setWizardStep(0);
    setWizardTokens([]);
    setWizardActive(true);

    // Reset and Prefill first step
    setStandAkhir('');
    setNotes('');
    setMeterPhoto('');
    setStandAwal(0);
    setPeriodStart('');
    setPeriodEnd('');

    await prefillWizardStep(toRecord[0]);
  };

  const prefillWizardStep = async (meter) => {
    try {
      const res = await authFetch(`/api/utility/meters/${meter.id}/latest-reading`);
      if (res.ok) {
        const data = await res.json();
        setStandAwal(data.latest_approved_reading);
        if (data.latest_reading_date) {
          const nextDay = new Date(data.latest_reading_date);
          nextDay.setDate(nextDay.getDate() + 1);
          setPeriodStart(nextDay.toISOString().slice(0, 10));
        } else {
          setPeriodStart('');
        }
        setPeriodEnd(new Date().toISOString().slice(0, 10));
      }
    } catch (err) {
      console.error('Error prefetching latest stand awal for wizard:', err);
    }
  };

  const handleSaveWizardStep = async (e) => {
    e.preventDefault();
    if (!standAkhir) {
      alert('Mohon masukkan angka Stand Akhir!');
      return;
    }

    if (parseFloat(standAkhir) < parseFloat(standAwal)) {
      alert('Stand Akhir tidak boleh lebih kecil dari Stand Awal!');
      return;
    }

    if (!meterPhoto) {
      alert('Mohon ambil/unggah foto meteran sebagai bukti fisik wajib!');
      return;
    }

    setSubmitting(true);
    const currentMeter = wizardMeters[wizardStep];
    try {
      const res = await authFetch('/api/utility/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meter_id: currentMeter.id,
          current_reading: parseFloat(standAkhir),
          reading_date: periodEnd || readingDate,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes,
          meter_photo: meterPhoto
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newToken = data.approval_token;
        const updatedTokens = [...wizardTokens, newToken];
        setWizardTokens(updatedTokens);

        // Reset inputs for next step
        setStandAkhir('');
        setNotes('');
        setMeterPhoto('');
        setPeriodStart('');
        setPeriodEnd('');
        setStandAwal(0);

        if (wizardStep < wizardMeters.length - 1) {
          const nextStep = wizardStep + 1;
          setWizardStep(nextStep);
          await prefillWizardStep(wizardMeters[nextStep]);
        } else {
          // Completed wizard!
          setWizardActive(false);
          fetchData();
          // Open group QR Code modal
          setGroupQRTokens(updatedTokens.join(','));
          setShowGroupQRModal(true);
        }
      } else {
        const errData = await res.json();
        alert(errData.message || 'Gagal menyimpan pencatatan.');
      }
    } catch (err) {
      console.error('Error saving wizard reading:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="flex items-center gap-1 bg-[#E8FFF3] text-[#50CD89] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
            <CheckCircle2 size={10} /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1 bg-[#FFF5F8] text-[#F1416C] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
            <XCircle size={10} /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-[#FFF8DD] text-[#FFC700] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
            <AlertCircle size={10} /> Pending
          </span>
        );
    }
  };

  const getQRUrl = (token) => {
    const origin = window.location.origin;
    const approvalLink = `${origin}/approval-listrik/${token}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(approvalLink)}`;
  };

  // Stats
  const totalMeters = meters.length;
  const pendingCount = readings.filter(r => r.status === 'Pending').length;
  const approvedUsage = readings
    .filter(r => r.status === 'Approved')
    .reduce((sum, r) => sum + parseFloat(r.usage_amount), 0)
    .toLocaleString('id-ID', { maximumFractionDigits: 1 });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800 flex flex-col">
      {/* Mobile Top Header */}
      <div
        className="px-5 pb-4 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm flex items-center justify-between"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate('/demo/mobile')}
          className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[16px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <Zap size={18} className="text-[#7239EA] fill-[#7239EA]/10" />
          Pendataan Listrik
        </h2>
        <button
          onClick={fetchData}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-100"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Stats Widget Grid */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        {/* Card 1: Master KWH */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-[24px] flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.98] transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#7239EA]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Master KWH</span>
            <div className="w-6 h-6 rounded-lg bg-[#7239EA]/10 flex items-center justify-center text-[#7239EA]">
              <Database size={12} />
            </div>
          </div>
          <span className="text-[20px] font-black text-slate-800 mt-2">{totalMeters}</span>
        </div>

        {/* Card 2: Gantung */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-[24px] flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.98] transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FFC700]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gantung</span>
            <div className="w-6 h-6 rounded-lg bg-[#FFC700]/10 flex items-center justify-center text-[#FFC700]">
              <Clock size={12} className="animate-pulse" />
            </div>
          </div>
          <span className="text-[20px] font-black text-[#FFC700] mt-2">{pendingCount}</span>
        </div>

        {/* Card 3: kWh Approved */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-[24px] flex flex-col justify-between shadow-sm relative overflow-hidden active:scale-[0.98] transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#50CD89]" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Approved</span>
            <div className="w-6 h-6 rounded-lg bg-[#50CD89]/10 flex items-center justify-center text-[#50CD89]">
              <Zap size={12} />
            </div>
          </div>
          <span className="text-[18px] font-black text-[#50CD89] mt-2 truncate leading-none">{approvedUsage}</span>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="px-5 mt-5">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveSegment('meters')}
            className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider ${activeSegment === 'meters' ? 'bg-white text-[#7239EA] shadow-sm' : 'text-slate-500 active:text-slate-800'
              }`}
          >
            Master KWH ({totalMeters})
          </button>
          <button
            onClick={() => setActiveSegment('gantung')}
            className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider ${activeSegment === 'gantung' ? 'bg-white text-[#7239EA] shadow-sm' : 'text-slate-500 active:text-slate-800'
              }`}
          >
            Gantung ({pendingCount})
          </button>
          <button
            onClick={() => setActiveSegment('histori')}
            className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider ${activeSegment === 'histori' ? 'bg-white text-[#7239EA] shadow-sm' : 'text-slate-500 active:text-slate-800'
              }`}
          >
            Histori
          </button>
        </div>
      </div>

      {/* CORE SEGMENTS CONTAINER */}
      <div className="px-5 mt-5 flex-1">
        {/* SEGMENT 1: METERS LIST */}
        {activeSegment === 'meters' && (
          <div className="space-y-3">
            <div className="bg-purple-50/50 text-[#7239EA] p-4 rounded-[24px] border border-[#7239EA]/10 text-[12px] font-semibold leading-relaxed">
              💡 <strong>Petugas Engineering:</strong> Ketuk salah satu kartu Tenant di bawah ini untuk membuka daftar KWH meter terdaftar dan melakukan pencatatan berkelompok secara instan.
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="bg-white h-24 rounded-[24px] animate-pulse border border-slate-100" />
                <div className="bg-white h-24 rounded-[24px] animate-pulse border border-slate-100" />
              </div>
            ) : groupedMeters.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[28px] p-10 text-center text-slate-400 font-bold text-[13px]">
                Belum ada data tenant terdaftar di sistem.
              </div>
            ) : (
              groupedMeters.map(g => {
                const totalMetersInGroup = g.meters.length;
                const recordedCount = g.meters.filter(m => {
                  const hasPending = readings.find(r => r.meter_id === m.id && r.status === 'Pending');
                  const hasApproved = readings.find(r => r.meter_id === m.id && r.status === 'Approved');
                  const hasRejected = readings.find(r => r.meter_id === m.id && r.status === 'Rejected');
                  return hasPending || hasApproved || hasRejected;
                }).length;
                const isAllRecorded = recordedCount === totalMetersInGroup;

                return (
                  <div
                    key={g.tenantName}
                    onClick={() => setSelectedTenantGroup(g.tenantName)}
                    className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm active:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7239EA]" />
                    <div className="flex justify-between items-start pl-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#7239EA]/10 flex items-center justify-center text-[#7239EA] shrink-0">
                          <ClipboardList size={18} />
                        </div>
                        <div>
                          <h4 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">{g.tenantName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block bg-[#7239EA]/5 text-[#7239EA] text-[10px] font-black px-2 py-0.5 rounded-lg border border-[#7239EA]/5">
                              {totalMetersInGroup} KWH Meter
                            </span>
                            {isAllRecorded ? (
                              <span className="inline-block bg-green-50 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-green-100">
                                Selesai Catat
                              </span>
                            ) : (
                              <span className="inline-block bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-100">
                                Ada KWH Belum Dicatat
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 pl-1 text-[11px] text-slate-500 font-bold">
                      <div className="flex justify-between text-slate-400">
                        <span>Lantai: <strong className="text-slate-600">{Array.from(g.floors).join(', ') || '-'}</strong></span>
                        <span>Area: <strong className="text-slate-600">{Array.from(g.areas).join(', ') || '-'}</strong></span>
                      </div>
                      <div className="flex justify-between items-center text-[#7239EA] pt-3 border-t border-slate-100 mt-1 font-black text-[12px]">
                        <span>Kelola & Catat Listrik</span>
                        <span className="flex items-center gap-0.5">Buka Daftar <ChevronRight size={14} /></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SEGMENT 2: PENDING GANTUNG READINGS */}
        {activeSegment === 'gantung' && (() => {
          const pendingReadings = readings.filter(r => r.status === 'Pending');

          // Group by clean tenant name
          const groupedPending = {};
          pendingReadings.forEach(r => {
            const cleanTenant = r.tenant_name.split(' - ')[0] || 'Umum';
            if (!groupedPending[cleanTenant]) {
              groupedPending[cleanTenant] = {
                tenantName: cleanTenant,
                readings: [],
                tokens: []
              };
            }
            groupedPending[cleanTenant].readings.push(r);
            groupedPending[cleanTenant].tokens.push(r.approval_token);
          });

          const groupedList = Object.values(groupedPending).sort((a, b) => a.tenantName.localeCompare(b.tenantName));

          return (
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white h-24 rounded-[28px] animate-pulse border border-slate-100" />
              ) : groupedList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-[28px] p-8 text-center text-slate-400 text-[13px] font-bold">
                  Tidak ada pencatatan berstatus gantung.
                </div>
              ) : (
                groupedList.map(g => (
                  <div
                    key={g.tenantName}
                    onClick={() => {
                      setGroupQRTokens(g.tokens.join(','));
                      setShowGroupQRModal(true);
                    }}
                    className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm active:bg-slate-50 cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-5 right-5">
                      <span className="flex items-center gap-1 bg-[#FFF8DD] text-[#FFC700] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                        <AlertCircle size={10} /> {g.readings.length} Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFC700]/10 flex items-center justify-center text-[#FFC700] shrink-0">
                        <Clock size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-[15px] text-slate-800 pr-20 line-clamp-1">{g.tenantName}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pencatatan Gantung Tenant</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="space-y-1.5">
                        {g.readings.map(r => (
                          <div key={r.id} className="flex justify-between items-center text-[12px] font-bold bg-slate-50 px-3.5 py-2.5 rounded-2xl text-slate-600 border border-slate-100">
                            <span className="text-slate-700">{r.tenant_name.split(' - ')[1] || 'Umum'} <span className="text-[10px] text-slate-400 font-normal font-mono block">No KWH: {r.meter_number}</span></span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#7239EA] font-black font-mono">{r.usage_amount} kWh</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelReading(r.id);
                                }}
                                className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 active:scale-90 transition-transform cursor-pointer"
                                title="Batalkan & Hapus Pencatatan"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[#7239EA] pt-3 border-t border-slate-50 mt-1 font-black text-[12px]">
                        <span>Tampilkan 1 QR Code Persetujuan</span>
                        <span className="flex items-center gap-0.5">Buka QR <ChevronRight size={14} /></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })()}

        {/* SEGMENT 3: HISTORY READINGS */}
        {activeSegment === 'histori' && (
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white h-24 rounded-[28px] animate-pulse border border-slate-100" />
            ) : readings.filter(r => r.status !== 'Pending').length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[28px] p-8 text-center text-slate-400 text-[13px]">
                Belum ada histori pencatatan KWH.
              </div>
            ) : (
              readings.filter(r => r.status !== 'Pending').map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReading(r)}
                  className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm active:bg-slate-50 cursor-pointer relative"
                >
                  <div className="absolute right-5 top-5">
                    {getStatusBadge(r.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <History size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] text-slate-800 pr-20 line-clamp-1">{r.tenant_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">No: {r.meter_number}</p>
                        <span className="text-slate-300">•</span>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatIndonesianDate(r.reading_date, r.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Awal</p>
                      <p className="text-[14px] font-black text-slate-700 mt-0.5 font-mono">{r.previous_reading}</p>
                    </div>
                    <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Akhir</p>
                      <p className="text-[14px] font-black text-slate-700 mt-0.5 font-mono">{r.current_reading}</p>
                    </div>
                    <div className="bg-[#7239EA]/5 p-2.5 rounded-2xl border border-[#7239EA]/10">
                      <p className="text-[9px] text-[#7239EA] font-black uppercase tracking-wider">Pemakaian</p>
                      <p className="text-[14px] font-black text-[#7239EA] mt-0.5 font-mono">{r.usage_amount} <span className="text-[9px] font-bold">kWh</span></p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>      {/* MODAL 1: FORM PENCATATAN STAND LISTRIK */}
      {showForm && selectedMeterData && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-12 shadow-2xl animate-slide-up max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#7239EA] uppercase tracking-widest">FORM PENCATATAN KWH</span>
                <h3 className="text-[16px] font-black text-slate-900 leading-tight mt-0.5">{selectedMeterData.tenant_name}</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4 font-bold text-[13px] text-slate-700">
              {/* No KWH Read-only */}
              <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 flex justify-between items-center text-[12px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Nomor Meteran</span>
                <span className="font-mono text-slate-800 font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{selectedMeterData.meter_number}</span>
              </div>

              {/* Stand Awal (Read-only) */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Stand Awal (kWh)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={standAwal}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-3.5 rounded-2xl text-[13px] font-bold text-slate-500 outline-none cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">kWh</div>
                </div>
                <p className="text-[9px] text-[#7239EA] font-bold mt-1.5 pl-1">*Terisi otomatis berdasarkan stand akhir bulan lalu.</p>
              </div>

              {/* Stand Akhir Input */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Stand Akhir Baru (kWh)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={standAkhir}
                    onChange={(e) => setStandAkhir(e.target.value)}
                    placeholder="Contoh: 954120.5"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl text-[13px] font-black outline-none focus:border-[#7239EA] focus:bg-white transition-all shadow-sm"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7239EA] text-[11px] font-black">kWh</div>
                </div>
              </div>

              {/* Stand Usage Estimation */}
              {standAkhir && (
                <div className="bg-gradient-to-br from-[#7239EA]/5 to-[#8E51FF]/5 border border-[#7239EA]/15 rounded-[24px] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#7239EA] font-black uppercase tracking-wider">Estimasi Pemakaian</p>
                    <p className="text-[20px] font-black text-[#7239EA] mt-1 font-mono">
                      {Math.max(0, parseFloat(standAkhir) - parseFloat(standAwal)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-[12px] font-bold">kWh</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#7239EA]/10 flex items-center justify-center text-[#7239EA]">
                    <Zap size={18} className="animate-bounce" />
                  </div>
                </div>
              )}

              {/* Image Proof Capture */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Bukti Foto Stand Meteran (Wajib)</label>
                {meterPhoto ? (
                  <div className="relative rounded-[24px] overflow-hidden border border-slate-200 aspect-video flex items-center justify-center bg-slate-50 shadow-md">
                    <img src={meterPhoto} alt="Bukti KWH" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMeterPhoto('')}
                      className="absolute right-3 top-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#7239EA] bg-slate-50/50 hover:bg-slate-50 rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:bg-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-[#7239EA]/5 flex items-center justify-center text-[#7239EA] border border-[#7239EA]/10">
                      <Camera size={22} />
                    </div>
                    <span className="text-[12.5px] text-[#7239EA] font-black mt-1">Ambil Foto Meteran</span>
                    <span className="text-[10px] text-slate-400 font-bold">Kamera akan terbuka otomatis di mobile</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              {/* Date & Note */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Mulai Periode</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[12px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Akhir Periode</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[12px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Catatan Audit</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan catatan audit bila ada..."
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[12.5px] font-bold outline-none focus:border-[#7239EA] focus:bg-white h-16 resize-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#7239EA] to-[#8E51FF] text-white rounded-2xl font-black text-[14px] shadow-lg shadow-purple-500/25 active:opacity-90 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? 'Menyimpan...' : 'Simpan & Dapatkan QR'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL: LIST OF METERS & RECORDING FLOW FOR THE SELECTED TENANT */}
      {selectedTenantGroup && (() => {
        const tenantInfo = groupedMeters.find(g => g.tenantName === selectedTenantGroup) || { meters: [] };

        // Count unrecorded meters
        const unrecordedMeters = tenantInfo.meters.filter(m => {
          const hasPending = readings.find(r => r.meter_id === m.id && r.status === 'Pending');
          return !hasPending;
        });

        // Get pending readings for this tenant group
        const pendingReadings = readings.filter(r => r.tenant_name.startsWith(selectedTenantGroup) && r.status === 'Pending');

        return (
          <div className="fixed inset-0 z-40 bg-[#F8FAFC] flex flex-col overflow-y-auto" style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
              <button
                onClick={() => {
                  setSelectedTenantGroup(null);
                  setExpandedMeterId(null);
                  setExpandedHistoryMeterId(null);
                }}
                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center flex-1 mx-4">
                <span className="text-[9px] font-black text-[#7239EA] uppercase tracking-wider block">Pencatatan Listrik Tenant</span>
                <h3 className="text-[15px] font-black text-slate-900 leading-tight truncate">{selectedTenantGroup}</h3>
              </div>
              <div className="w-10 h-10" /> {/* spacer */}
            </div>

            {/* Meters List Body */}
            <div className="p-5 space-y-4 flex-1 pb-32">
              <div className="bg-purple-50/50 text-[#7239EA] p-4 rounded-2xl border border-[#7239EA]/10 text-[11px] font-semibold leading-relaxed">
                💡 <strong>Detail Meteran & Riwayat:</strong> Ketuk nama meteran/bagian di bawah ini untuk melihat riwayat pencatatan lengkap. Suku kata pertama adalah nama tenant induk.
              </div>

              {tenantInfo.meters.map(m => {
                const hasPending = readings.find(r => r.meter_id === m.id && r.status === 'Pending');
                const hasApproved = readings.find(r => r.meter_id === m.id && r.status === 'Approved');
                const hasRejected = readings.find(r => r.meter_id === m.id && r.status === 'Rejected');
                const isExpanded = expandedMeterId === m.id;

                const isHistoryExpanded = expandedHistoryMeterId === m.id;
                const meterHistory = readings.filter(r => r.meter_id === m.id);

                return (
                  <div key={m.id} className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7239EA]" />
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start pl-1">
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => setExpandedHistoryMeterId(isHistoryExpanded ? null : m.id)}
                      >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Bagian / Nama KWH</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <h4 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">{m.section || 'Umum'}</h4>
                          {isHistoryExpanded ? <ChevronUp size={16} className="text-[#7239EA]" /> : <ChevronDown size={16} className="text-[#7239EA]" />}
                        </div>
                        <p className="text-[11px] font-mono text-[#7239EA] font-black mt-0.5">No KWH: {m.meter_number}</p>
                      </div>

                      {hasApproved ? (
                        <span className="bg-[#E8FFF3] text-[#50CD89] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-0.5 border border-[#50CD89]/10">
                          <CheckCircle size={10} /> Approved
                        </span>
                      ) : hasPending ? (
                        <button
                          onClick={() => {
                            setSelectedReading(hasPending);
                          }}
                          className="bg-[#FFF8DD] text-[#FFC700] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-0.5 hover:opacity-90 active:scale-95 transition-all border border-[#FFC700]/10"
                        >
                          <AlertCircle size={10} /> Pending
                        </button>
                      ) : hasRejected ? (
                        <span className="bg-[#FFF5F8] text-[#F1416C] text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-0.5 border border-[#F1416C]/10">
                          <XCircle size={10} /> Rejected
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border border-slate-100">
                          Belum Catat
                        </span>
                      )}
                    </div>

                    {/* Meter Details Row */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-50 pl-2">
                      <div>Lantai & Area: <span className="text-slate-800">Lantai {m.floor || '-'}, Area {m.area || '-'}</span></div>
                      <div>Daya: <span className="text-slate-800">{m.power_capacity || '-'} VA</span></div>
                    </div>

                    {/* Expand/Collapse History */}
                    {isHistoryExpanded && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Riwayat Pencatatan Listrik</span>
                        {meterHistory.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-2xl">Belum ada riwayat pencatatan untuk meteran ini.</p>
                        ) : (
                          meterHistory.map(h => (
                            <div key={h.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-[11px] font-bold text-slate-600">
                              <div className="flex justify-between items-center">
                                <span className="text-[12px] font-black text-slate-800">{formatIndonesianDate(h.reading_date, h.created_at)}</span>
                                {getStatusBadge(h.status)}
                              </div>
                              <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-100 text-center font-mono">
                                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-50">
                                  <span className="text-[9px] text-slate-400 block font-sans font-bold uppercase tracking-wider">Awal</span>
                                  {parseFloat(h.previous_reading)}
                                </div>
                                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-50">
                                  <span className="text-[9px] text-slate-400 block font-sans font-bold uppercase tracking-wider">Akhir</span>
                                  {parseFloat(h.current_reading)}
                                </div>
                                <div className="bg-[#7239EA]/5 p-1.5 rounded-xl border border-[#7239EA]/10 text-[#7239EA] font-black">
                                  <span className="text-[9px] text-[#7239EA] block font-sans font-bold uppercase tracking-wider">Pakai</span>
                                  {parseFloat(h.usage_amount)}
                                </div>
                              </div>
                              {h.notes && <p className="italic text-slate-500 bg-white p-3 rounded-2xl border border-dashed border-slate-200 font-medium">"{h.notes}"</p>}

                              {/* Photos Proof in History Log */}
                              {(h.meter_photo || h.tenant_approval_photo) && (
                                <div className="grid grid-cols-2 gap-3 my-2">
                                  {h.meter_photo && (
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-400 uppercase font-black block pl-0.5">Foto KWH (Petugas)</span>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(h.meter_photo)}
                                        className="w-full relative rounded-2xl overflow-hidden border border-slate-150 aspect-video bg-white shadow-sm flex items-center justify-center outline-none cursor-zoom-in"
                                      >
                                        <img src={h.meter_photo} alt="Foto KWH" className="w-full h-full object-cover" />
                                      </button>
                                    </div>
                                  )}
                                  {h.tenant_approval_photo && (
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-400 uppercase font-black block pl-0.5">Selfie (Tenant)</span>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(h.tenant_approval_photo)}
                                        className="w-full relative rounded-2xl overflow-hidden border border-slate-150 aspect-video bg-white shadow-sm flex items-center justify-center outline-none cursor-zoom-in"
                                      >
                                        <img src={h.tenant_approval_photo} alt="Selfie Tenant" className="w-full h-full object-cover" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {h.tenant_approver_name && (
                                <div className="flex items-center gap-3 pt-2.5 border-t border-slate-200/55">
                                  {h.tenant_approval_photo && (
                                    <img src={h.tenant_approval_photo} className="w-6 h-6 rounded-full object-cover border border-slate-200 shadow-sm" alt="Selfie" />
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold">Penyetuju: <strong className="text-slate-700 font-black">{h.tenant_approver_name}</strong></span>
                                    {h.approved_at && (
                                      <span className="text-[9px] text-[#50CD89] font-black mt-0.5">Disetujui: {formatIndonesianDate(h.approved_at)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Standard Inline Form */}
                    {isExpanded ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await handleSaveGroupReading(m.id);
                        }}
                        className="space-y-4 pt-4 border-t border-slate-100 text-[12px] font-bold text-slate-700"
                      >
                        {/* Stand Awal */}
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Stand Awal (kWh)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={standAwal}
                              readOnly
                              className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-2xl text-[12px] font-bold text-slate-500 cursor-not-allowed outline-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">kWh</div>
                          </div>
                        </div>

                        {/* Stand Akhir */}
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Stand Akhir Baru (kWh)</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={standAkhir}
                              onChange={(e) => setStandAkhir(e.target.value)}
                              placeholder="Masukkan Stand Akhir Baru"
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[12px] font-bold outline-none focus:border-[#7239EA] focus:bg-white transition-all shadow-sm"
                              required
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7239EA]">kWh</div>
                          </div>
                        </div>

                        {/* Pemakaian Realtime */}
                        {standAkhir && (
                          <div className="bg-[#7239EA]/5 border border-[#7239EA]/10 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] text-[#7239EA] font-black uppercase tracking-wider">Estimasi Pemakaian</p>
                              <p className="text-[18px] font-black text-[#7239EA] mt-0.5 font-mono">
                                {Math.max(0, parseFloat(standAkhir) - parseFloat(standAwal)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-[11px] font-bold">kWh</span>
                              </p>
                            </div>
                            <Zap size={18} className="text-[#7239EA] animate-bounce" />
                          </div>
                        )}

                        {/* Image Bukti Stand */}
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Bukti Foto Stand Meteran (Wajib)</label>
                          {meterPhoto ? (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video flex items-center justify-center bg-slate-50 shadow-md">
                              <img src={meterPhoto} alt="Bukti stand" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setMeterPhoto('')}
                                className="absolute right-2 top-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-200 hover:border-[#7239EA] bg-slate-50/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors active:bg-slate-100">
                              <Camera size={22} className="text-slate-400" />
                              <span className="text-[11.5px] text-[#7239EA] font-black">Ambil Foto Meteran</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                                required
                              />
                            </label>
                          )}
                        </div>

                        {/* Periode Penggunaan */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mulai Periode</label>
                            <input
                              type="date"
                              value={periodStart}
                              onChange={(e) => setPeriodStart(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Akhir Periode</label>
                            <input
                              type="date"
                              value={periodEnd}
                              onChange={(e) => setPeriodEnd(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                              required
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Catatan Audit</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan penemuan di lapangan (jika ada)"
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] h-14 resize-none focus:bg-white"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedMeterId(null)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[12px] active:bg-slate-200"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 bg-gradient-to-r from-[#7239EA] to-[#8E51FF] text-white rounded-2xl font-black text-[12px] shadow-md active:opacity-90 transition-all flex items-center justify-center gap-1.5"
                          >
                            {submitting ? 'Menyimpan...' : 'Simpan KWH'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      !hasPending && (
                        <button
                          onClick={async () => {
                            setExpandedMeterId(m.id);
                            setStandAkhir('');
                            setNotes('');
                            setMeterPhoto('');
                            setStandAwal(0);

                            try {
                              const res = await authFetch(`/api/utility/meters/${m.id}/latest-reading`);
                              if (res.ok) {
                                const data = await res.json();
                                setStandAwal(data.latest_approved_reading);
                                if (data.latest_reading_date) {
                                  const nextDay = new Date(data.latest_reading_date);
                                  nextDay.setDate(nextDay.getDate() + 1);
                                  setPeriodStart(nextDay.toISOString().slice(0, 10));
                                } else {
                                  setPeriodStart('');
                                }
                                setPeriodEnd(new Date().toISOString().slice(0, 10));
                              }
                            } catch (err) {
                              console.error('Error prefetching latest stand awal:', err);
                            }
                          }}
                          className="w-full py-2.5 bg-slate-50 hover:bg-purple-50 text-[#7239EA] rounded-2xl text-[11px] font-black border border-slate-100 flex items-center justify-center gap-1 transition-all active:scale-[0.98] pl-1"
                        >
                          <Plus size={14} />
                          Input Pencatatan Mandiri
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky bottom panel for actions */}
            <div className="bg-white border-t border-slate-100 p-4 sticky bottom-0 left-0 right-0 z-50 space-y-2 pb-8 shadow-lg">
              {pendingReadings.length > 0 && (
                <button
                  onClick={() => {
                    const tokens = pendingReadings.map(r => r.approval_token).join(',');
                    setGroupQRTokens(tokens);
                    setShowGroupQRModal(true);
                  }}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-[#7239EA] border border-[#7239EA]/20 rounded-2xl font-black text-[12px] flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <QrCode size={16} />
                  Lihat 1 QR Code Persetujuan ({pendingReadings.length} Pending)
                </button>
              )}

              {unrecordedMeters.length > 0 && (
                <button
                  onClick={() => startWizard(tenantInfo.meters)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#7239EA] to-[#8E51FF] text-white rounded-2xl font-black text-[13px] shadow-lg shadow-purple-500/25 active:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <ClipboardList size={16} />
                  Mulai Catat Semua Meteran ({unrecordedMeters.length})
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: DETAIL PENCATATAN & QR VIEW */}
      {selectedReading && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-12 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-black text-slate-900">Audit & Persetujuan KWH</h3>
              <button
                onClick={() => {
                  setSelectedReading(null);
                  setShowQR(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {!showQR ? (
              <div className="space-y-4 text-[13px] font-bold">
                {/* Status Bar */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="text-[12px] font-bold text-slate-500">Status Validasi</span>
                  {getStatusBadge(selectedReading.status)}
                </div>

                {/* Tenant Info */}
                <div>
                  <h4 className="text-[15px] font-black text-slate-800 leading-tight">{selectedReading.tenant_name}</h4>
                  <p className="text-[11px] text-[#7239EA] font-mono mt-1 font-black uppercase">No KWH: {selectedReading.meter_number}</p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black mb-0.5">Lantai & Area</span>
                    Lantai {selectedReading.floor || '-'}, Area {selectedReading.area || '-'}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black mb-0.5">Daya Meteran</span>
                    {selectedReading.power_capacity || '-'}
                  </div>
                </div>

                {/* Photo Proof */}
                {selectedReading.meter_photo && (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black mb-1">Bukti Foto Kamera</span>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(selectedReading.meter_photo)}
                      className="w-full relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center group cursor-zoom-in outline-none"
                    >
                      <img src={selectedReading.meter_photo} alt="Bukti stand" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                        Klik untuk Memperbesar
                      </div>
                    </button>
                  </div>
                )}

                {/* Numeric block */}
                <div className="bg-gradient-to-br from-[#7239EA] to-[#8E51FF] p-5 rounded-[24px] shadow-md space-y-4 text-white">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <p className="text-[9px] text-white/70 font-black uppercase tracking-wider">Stand Awal</p>
                      <p className="text-[15px] font-black mt-1 font-mono truncate">{selectedReading.previous_reading}</p>
                    </div>
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <p className="text-[9px] text-white/70 font-black uppercase tracking-wider">Stand Akhir</p>
                      <p className="text-[15px] font-black mt-1 font-mono truncate">{selectedReading.current_reading}</p>
                    </div>
                  </div>

                  <div className="bg-white text-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                    <div>
                      <p className="text-[9px] text-[#7239EA] font-black uppercase tracking-wider">Pemakaian KWH Konsumsi</p>
                      <p className="text-[20px] font-black text-[#7239EA] mt-0.5 font-mono">
                        {parseFloat(selectedReading.usage_amount).toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-[12px] font-bold">kWh</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#7239EA]/10 flex items-center justify-center text-[#7239EA]">
                      <Zap size={18} className="animate-bounce" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-4 text-[12px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Tanggal Catat</span>
                    <span className="text-slate-700 font-bold">{formatIndonesianDate(selectedReading.reading_date, selectedReading.created_at)}</span>
                  </div>
                  {selectedReading.period_start && selectedReading.period_end && (
                    <div className="flex justify-between border-t border-slate-100/50 pt-1.5 mt-1.5">
                      <span>Periode Penggunaan</span>
                      <span className="text-[#7239EA] font-bold font-mono">
                        {formatDateShort(selectedReading.period_start)} ➔ {formatDateShort(selectedReading.period_end)}
                      </span>
                    </div>
                  )}
                  {selectedReading.tenant_approver_name && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#50CD89] font-black uppercase tracking-wider">Disetujui Oleh Tenant</span>
                        <span className="text-slate-700 font-black">{selectedReading.tenant_approver_name}</span>
                        {selectedReading.approved_at && (
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5">Waktu: {formatIndonesianDate(selectedReading.approved_at)}</span>
                        )}
                      </div>
                      {selectedReading.tenant_approval_photo && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(selectedReading.tenant_approval_photo)}
                          className="w-10 h-10 rounded-full overflow-hidden border border-emerald-100 shadow-sm cursor-zoom-in outline-none flex-shrink-0"
                          title="Lihat Selfie Persetujuan"
                        >
                          <img src={selectedReading.tenant_approval_photo} alt="Selfie" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </div>
                  )}
                  {selectedReading.notes && (
                    <div className="bg-slate-50 p-3 rounded-xl italic text-slate-600 mt-2 text-[12px] font-medium border border-slate-100">
                      "{selectedReading.notes}"
                    </div>
                  )}
                </div>

                {/* QR Presentation Trigger (Only for pending) */}
                {selectedReading.status === 'Pending' && (
                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => setShowQR(true)}
                      className="w-full py-4 bg-[#7239EA] text-white rounded-2xl font-black text-[14px] shadow-lg active:bg-[#602ecc] transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode size={18} />
                      Cetak QR / Tunjukkan QR
                    </button>
                    <button
                      onClick={() => handleCancelReading(selectedReading.id)}
                      className="w-full py-3.5 bg-red-50 text-red-500 rounded-2xl font-black text-[13px] border border-red-200 active:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Batalkan & Hapus Pencatatan
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-[13px] font-bold text-slate-500 text-center mb-6 px-4">
                  Tunjukkan QR Code ini kepada **Pihak Tenant** untuk memindai dan melakukan persetujuan mandiri.
                </p>

                {/* QR Code */}
                <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 shadow-inner flex items-center justify-center mb-6">
                  <img
                    src={(() => {
                      const cleanTenant = selectedReading.tenant_name.split(' - ')[0];
                      const sameTenantPending = readings.filter(
                        other => other.status === 'Pending' && other.tenant_name.split(' - ')[0] === cleanTenant
                      );
                      const tokens = sameTenantPending.map(other => other.approval_token).join(',');
                      return getQRUrl(tokens || selectedReading.approval_token);
                    })()}
                    alt="QR Code Approval"
                    className="w-48 h-48 rounded-2xl shadow-md border border-white"
                  />
                </div>

                <div className="text-center mb-6">
                  <p className="text-[10px] font-black text-[#7239EA] uppercase tracking-widest mb-0.5">Tenant Target</p>
                  <p className="text-[15px] font-black text-slate-800">{selectedReading.tenant_name.split(' - ')[0]}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {(() => {
                      const cleanTenant = selectedReading.tenant_name.split(' - ')[0];
                      const sameTenantPending = readings.filter(
                        other => other.status === 'Pending' && other.tenant_name.split(' - ')[0] === cleanTenant
                      );
                      const totalUsage = sameTenantPending.reduce((sum, other) => sum + parseFloat(other.usage_amount), 0);
                      return `Mencakup ${sameTenantPending.length} KWH Meter (Total: ${totalUsage} kWh)`;
                    })()}
                  </p>
                </div>

                <button
                  onClick={() => setShowQR(false)}
                  className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[13px] active:bg-slate-200 transition-all"
                >
                  Kembali ke Detail
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* OVERLAY: MULTI-METER RECORDING WIZARD */}
      {wizardActive && wizardMeters.length > 0 && (() => {
        const currentMeter = wizardMeters[wizardStep];
        return (
          <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-y-auto" style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin membatalkan pencatatan bersama? Data yang sudah tersimpan pada langkah sebelumnya akan tetap tersimpan.')) {
                    setWizardActive(false);
                    fetchData();
                  }
                }}
                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shadow-sm hover:text-slate-600 transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center flex-1 mx-4">
                <span className="text-[9px] font-black text-[#7239EA] uppercase tracking-wider block font-sans">Wizard Catat Meteran</span>
                <h3 className="text-[13px] font-black text-slate-800 leading-tight">
                  Langkah {wizardStep + 1} dari {wizardMeters.length}
                </h3>
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-[11px] font-black text-[#7239EA]">
                {Math.round(((wizardStep + 1) / wizardMeters.length) * 100)}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 sticky top-[56px] z-50">
              <div
                className="bg-[#7239EA] h-1.5 transition-all duration-300"
                style={{ width: `${((wizardStep + 1) / wizardMeters.length) * 100}%` }}
              />
            </div>

            {/* Wizard Body */}
            <div className="p-5 flex-1 pb-32">
              <form onSubmit={handleSaveWizardStep} className="space-y-5">
                {/* Meter Header info card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#7239EA]" />
                  <div className="pl-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Tenant & Lokasi</span>
                    <h4 className="text-[15px] font-black text-slate-800 leading-tight mt-0.5">{selectedTenantGroup}</h4>
                    <p className="text-[12px] font-bold text-[#7239EA] mt-0.5">Bagian: {currentMeter.section || 'Umum'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-50 pl-2">
                    <div>No KWH: <span className="font-mono font-bold text-slate-700">{currentMeter.meter_number}</span></div>
                    <div>Daya: <span className="font-bold text-slate-700">{currentMeter.power_capacity || '-'}</span></div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/50">Lantai {currentMeter.floor || '-'}, Area {currentMeter.area || '-'}</div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  {/* Stand Awal */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-1.5">Stand Awal (kWh)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={standAwal}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 px-4 py-3.5 rounded-2xl text-[13px] font-bold text-slate-500 cursor-not-allowed outline-none"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">kWh</div>
                    </div>
                  </div>

                  {/* Stand Akhir */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-1.5">Stand Akhir Baru (kWh) - Wajib</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={standAkhir}
                        onChange={(e) => setStandAkhir(e.target.value)}
                        placeholder="Masukkan Angka Stand Baru"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-2xl text-[13px] font-black outline-none focus:border-[#7239EA] transition-all shadow-sm"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7239EA] text-[11px] font-black">kWh</div>
                    </div>
                  </div>

                  {/* Pemakaian Realtime */}
                  {standAkhir && (
                    <div className="bg-gradient-to-br from-[#7239EA]/5 to-[#8E51FF]/5 border border-[#7239EA]/15 rounded-[24px] p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-[#7239EA] font-black uppercase">Pemakaian KWH Terhitung</p>
                        <p className="text-[18px] font-black text-[#7239EA] mt-0.5 font-mono">
                          {Math.max(0, parseFloat(standAkhir) - parseFloat(standAwal)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kWh
                        </p>
                      </div>
                      <Zap size={22} className="text-[#7239EA] animate-bounce" />
                    </div>
                  )}

                  {/* Image Bukti Stand */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-2">Bukti Foto Stand Meteran (Wajib)</label>
                    {meterPhoto ? (
                      <div className="relative rounded-[24px] overflow-hidden border border-slate-200 aspect-video flex items-center justify-center bg-slate-50 shadow-md">
                        <img src={meterPhoto} alt="Bukti stand" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMeterPhoto('')}
                          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-[#7239EA] bg-slate-50/50 hover:bg-slate-50 rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:bg-slate-100 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-[#7239EA]/5 flex items-center justify-center text-[#7239EA] border border-[#7239EA]/10">
                          <Camera size={22} />
                        </div>
                        <span className="text-[12.5px] text-[#7239EA] font-black mt-1">Ambil Foto Meteran</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoCapture}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>

                  {/* Periode Penggunaan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Mulai Periode</label>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Akhir Periode</label>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 mb-1.5">Catatan Audit</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan penemuan di lapangan (jika ada)"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-[11px] font-bold outline-none focus:border-[#7239EA] h-16 resize-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Sticky Action buttons */}
                <div className="bg-white border-t border-slate-100 p-4 fixed bottom-0 left-0 right-0 z-50 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Batal mencatat bersama?')) {
                        setWizardActive(false);
                        fetchData();
                      }
                    }}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-[12px] active:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-gradient-to-r from-[#7239EA] to-[#8E51FF] text-white rounded-2xl font-black text-[12px] shadow-lg shadow-purple-500/25 active:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    {submitting ? 'Menyimpan...' : (wizardStep < wizardMeters.length - 1 ? 'Simpan & Lanjut' : 'Simpan & Dapatkan QR')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: GROUP QR CODE FOR MULTI-METER APPROVAL */}
      {showGroupQRModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-12 shadow-2xl animate-slide-up max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-black text-slate-900 font-sans">QR Code Persetujuan Bersama</h3>
              <button
                onClick={() => {
                  setShowGroupQRModal(false);
                  setGroupQRTokens('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2 text-center">
              <p className="text-[12px] font-bold text-slate-500 mb-6 px-4 leading-relaxed font-sans">
                Tunjukkan QR Code terpadu ini kepada **Pihak Tenant** untuk memindai dan melakukan persetujuan atas seluruh meteran sekaligus dalam 1 kali selfie.
              </p>

              {/* QR Code */}
              <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 shadow-inner flex items-center justify-center mb-6">
                <img
                  src={getQRUrl(groupQRTokens)}
                  alt="QR Code Approval"
                  className="w-48 h-48 rounded-2xl shadow-md border border-white"
                />
              </div>

              <div className="text-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full">
                <p className="text-[9px] font-black text-[#7239EA] uppercase tracking-widest mb-0.5 font-sans">Nama Tenant Induk</p>
                <p className="text-[15px] font-black text-slate-800">{selectedTenantGroup}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1 font-sans">
                  Jumlah Meteran Terkait: <strong className="text-[#7239EA]">{groupQRTokens.split(',').length} KWH Meter</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowGroupQRModal(false);
                  setGroupQRTokens('');
                }}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[13px] active:bg-slate-800 transition-all shadow-md font-sans"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100000] flex items-center justify-center p-4 cursor-zoom-out"
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

export default MobileUtilityListrik;
