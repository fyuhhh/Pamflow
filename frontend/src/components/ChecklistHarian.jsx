import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2, XCircle, ChevronDown, AlertCircle, AlertTriangle,
  ClipboardList, Send, Clock, Info, Users, Plus, Calendar, ChevronRight, Search,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../services/api';
import { useModal } from '../context/ModalContext';
import CustomDatePicker from './CustomDatePicker';
import SearchableSelect from './SearchableSelect';
import ChecklistField from './ChecklistField';
import CustomTimePicker from './CustomTimePicker';

// Helper: always return a proper array (handles JSON strings from API)
const safeArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const ChecklistHarian = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user'));
  const company_id = user?.company_id || 1;
  const dept_name = user?.department || '';

  const isHistoryMode = location.pathname.includes('checklist-riwayat');
  const isMobile = location.pathname.startsWith('/demo/mobile');
  const basePath = isMobile ? '/demo/mobile' : '/tugas-departemen';

  const [step, setStep] = useState(isHistoryMode ? 'history' : 'setup');   // history | setup | checklist | result | wo-form
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [shift, setShift] = useState('pagi');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState(() => {
    // Priority: Local Storage -> Current Time
    const saved = localStorage.getItem(`active_checklist_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessionTime) return parsed.sessionTime;
      } catch (e) { }
    }
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  });
  const [items, setItems] = useState([]);       // [{id, name, status, notes, photo_url}]
  const [submittedSession, setSubmittedSession] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // History list state
  const [historySessions, setHistorySessions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // WO form state
  const [woForm, setWoForm] = useState({
    nama_wo: '', deskripsi: '', urgensi: 'Normal',
    tanggal_selesai: '', departemen_tujuan: ''
  });
  const [relations, setRelations] = useState([]);
  const [woSaving, setWoSaving] = useState(false);

  // Duplicate WO check state
  const [dupeCheck, setDupeCheck] = useState(null);      // null | { checking, duplicates, safe_items }
  const [dupeModal, setDupeModal] = useState(false);
  const [dupeTarget, setDupeTarget] = useState(null);    // 'dept' | 'agen'
  const [selectedSafeItems, setSelectedSafeItems] = useState([]);

  const requiredStar = <span className="text-[#F1416C] ml-0.5">*</span>;

  // Persist State to LocalStorage (Resumable after refresh)
  useEffect(() => {
    if (step === 'checklist' && items.length > 0) {
      const dataToSave = { step, selectedTemplate, shift, sessionDate, sessionTime, items };
      localStorage.setItem(`active_checklist_${user?.id}`, JSON.stringify(dataToSave));
    }
  }, [items, step]);

  // Load Persisted State & Initial Data
  useEffect(() => {
    const load = async () => {
      try {
        // Try recover from localStorage first if not in history mode
        const saved = localStorage.getItem(`active_checklist_${user?.id}`);
        if (saved && !isHistoryMode) {
          const parsed = JSON.parse(saved);
          setStep(parsed.step);
          setSelectedTemplate(parsed.selectedTemplate);
          setShift(parsed.shift);
          setSessionDate(parsed.sessionDate);
          setSessionTime(parsed.sessionTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
          setItems(parsed.items);
        }

        const [tplRes, relRes] = await Promise.all([
          authFetch(`/api/templates?company_id=${company_id}&jenis_template=checklist`),
          authFetch(`/api/dept-relations?company_id=${company_id}&is_active=true`)
        ]);
        const [tpls, rels] = await Promise.all([tplRes.json(), relRes.json()]);
        setTemplates(Array.isArray(tpls) ? tpls : []);
        const myRels = (Array.isArray(rels) ? rels : []).filter(r =>
          r.source_name?.toLowerCase() === dept_name?.toLowerCase()
        );
        setRelations(myRels);

        if (isHistoryMode) {
          setStep('history');
          fetchHistory();
        } else if (!saved) {
          setStep('setup');
        }
      } catch (e) {
        console.error('Checklist load error:', e);
      }
    };
    load();
  }, [location.pathname]); // Reload when path changes

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/api/checklist-sessions?company_id=${company_id}&dept_name=${dept_name}`);
      if (res.ok) {
        const data = await res.json();
        setHistorySessions(data);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    let rawDetails = [];
    try {
      rawDetails = typeof tpl.details === 'string' ? JSON.parse(tpl.details) : (tpl.details || []);
    } catch (e) {
      console.error("Failed to parse template details", e);
      rawDetails = [];
    }

    const tplItems = rawDetails.map((d, idx) => {
      let itemName = `Item ${idx + 1}`;
      let fieldType = 'Text Field';
      let options = [];
      let isRequired = false;

      if (typeof d === 'string') {
        itemName = d;
      } else if (typeof d === 'object' && d !== null) {
        itemName = d.nama_detail || d.task_name || d.item || d.name || d.label || itemName;
        fieldType = d.bentuk_laporan || d.type || 'Text Field';
        options = d.options || [];
        isRequired = d.wajib_diisi === 1 || d.wajib_diisi === "1" || d.wajib_diisi === true;
      }

      return {
        id: idx + 1,
        name: itemName,
        type: fieldType,
        options: options,
        required: isRequired,
        value: (fieldType === 'Multiple Choice' || fieldType === 'Multiple Images') ? [] : '',
        status: 'ok',
        notes: ''
      };
    });

    if (tplItems.length === 0) {
      showError('Template Kosong', 'Template ini tidak memiliki item checklist. Silakan lengkapi template di Pengaturan.');
      return;
    }

    setItems(tplItems);
    setStep('checklist');
  };

  const handleViewDetail = (s) => {
    try {
      let parsedResults = [];
      if (typeof s.item_results === 'string') {
        parsedResults = JSON.parse(s.item_results);
      } else if (Array.isArray(s.item_results)) {
        parsedResults = s.item_results;
      }

      setSubmittedSession({
        session_id: s.id,
        wo_id: s.wo_id,
        summary: { total_items: s.total_items, ok_count: s.ok_count, broken_count: s.broken_count },
        item_results: parsedResults,
        submitted_by_name: s.submitted_by_name
      });
      setItems(parsedResults);
      setShift(s.session_shift);
      setSessionDate(s.session_date);
      setSessionTime(s.session_time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setSelectedTemplate({ id: s.template_id, name: s.template_name });
      setStep('result');
    } catch (err) {
      console.error('Error viewing detail:', err);
      showError('Gagal', 'Terjadi kesalahan saat memproses data detail riwayat.');
    }
  };

  const updateItemField = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Sync photo_urls for backward compatibility with WO generator
        if (field === 'value' && (item.type === 'Image' || item.type === 'Multiple Images')) {
          updated.photo_url = Array.isArray(value) ? value[0] : value;
          updated.photo_urls = Array.isArray(value) ? value : (value ? [value] : []);
        }
        return updated;
      }
      return item;
    }));
  };

  const brokenItems = items
    .filter(i => i.status === 'rusak')
    .map(item => {
      let defaultUrls = [];
      if (item.type === 'Image' || item.type === 'Multiple Images') {
        defaultUrls = Array.isArray(item.value) ? item.value : (item.value ? [item.value] : []);
      }
      const resolvedUrls = safeArr(item.photo_urls).length > 0
        ? safeArr(item.photo_urls)
        : (item.photo_url ? [item.photo_url] : defaultUrls);
      return { ...item, photo_urls: resolvedUrls };
    });
  const okCount = items.filter(i => i.status === 'ok').length;

  const handleSubmitChecklist = async () => {
    setSubmitting(true);
    try {
      const [deptRes] = await Promise.all([
        authFetch(`/api/departments?company_id=${company_id}`)
      ]);
      const depts = await deptRes.json();
      const myDept = depts.find(d => d.name?.toLowerCase() === dept_name?.toLowerCase());

      const res = await authFetch('/api/checklist-sessions', {
        method: 'POST',
        body: JSON.stringify({
          company_id,
          dept_id: myDept?.id || 0,
          dept_name,
          template_id: selectedTemplate?.id,
          template_name: selectedTemplate?.name,
          session_date: sessionDate,
          session_time: sessionTime,
          session_shift: shift,
          item_results: items,
          submitted_by_id: user?.id,
          submitted_by_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedSession(data);
        setStep('result');
        // Clear local persistence
        localStorage.removeItem(`active_checklist_${user?.id}`);
        // Pre-fill WO form
        setWoForm(prev => ({
          ...prev,
          nama_wo: `WO Perbaikan - ${selectedTemplate?.name || 'Checklist'} (${shift.toUpperCase()})`,
          departemen_tujuan: relations[0]?.target_name || ''
        }));
      } else {
        showError('Gagal', data.message || 'Gagal submit checklist');
      }
    } catch (e) {
      showError('Error', 'Terjadi kesalahan saat mengirim checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateWO = async (e) => {
    e.preventDefault();
    if (!woForm.nama_wo || !woForm.departemen_tujuan || !woForm.urgensi) {
      showError('Validasi', 'Nama WO, departemen tujuan, dan urgensi wajib diisi');
      return;
    }
    setWoSaving(true);
    try {
      const res = await authFetch(`/api/checklist-sessions/${submittedSession.session_id}/generate-wo`, {
        method: 'POST',
        body: JSON.stringify({
          ...woForm,
          departemen_asal: dept_name,
          nama_peminta: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          company_id,
          perusahaan: user?.orgId || ''
        })
      });
      const data = await res.json();
      if (res.ok) {
        success('WO Berhasil Dibuat', `${data.wo_items_count} item telah dikirim ke ${woForm.departemen_tujuan}`);
        navigate(`${basePath}/terkirim`);
      } else {
        showError('Gagal', data.message || 'Gagal membuat WO');
      }
    } catch (e) {
      showError('Error', 'Terjadi kesalahan jaringan');
    } finally {
      setWoSaving(false);
    }
  };

  // ─── CHECK DUPLICATE WO ITEMS ─────────────────────────────────
  const handleCheckAndNavigate = async () => {
    if (brokenItems.length === 0) return;
    setDupeTarget('dept');
    setDupeCheck({ checking: true, duplicates: {}, safe_items: [] });
    setDupeModal(true);
    try {
      const res = await authFetch('/api/checklist-sessions/check-duplicate-items', {
        method: 'POST',
        body: JSON.stringify({
          company_id,
          dept_name,
          broken_item_names: brokenItems.map(i => i.name)
        })
      });
      const data = await res.json();
      setDupeCheck({ checking: false, ...data });
      setSelectedSafeItems(data.safe_items || []);
    } catch (e) {
      // Jika endpoint gagal, tetap lanjutkan dengan semua item
      const fallbackSafe = brokenItems.map(i => i.name);
      setDupeCheck({ checking: false, has_duplicates: false, duplicates: {}, safe_items: fallbackSafe });
      setSelectedSafeItems(fallbackSafe);
    }
  };

  const handleNavigateWithItems = (overrideItems) => {
    setDupeModal(false);
    const finalItems = overrideItems || brokenItems;
    const route = isMobile ? '/demo/mobile/checklist/buat-wo' : '/tugas-departemen/buat-wo';

    const defaultTarget = relations[0]?.target_name || 'ENGINEERING';

    navigate(route, {
      state: {
        fromAudit: true,
        isBatchWO: true,
        session_id: submittedSession?.session_id,
        template_id: selectedTemplate?.id,
        brokenItems: finalItems,
        templateName: selectedTemplate?.name,
        shift: submittedSession?.session_shift || shift,
        deptAsal: user?.department || 'OPERASIONAL',
        targetDept: defaultTarget,
        availableTargetDepts: relations.map(r => r.target_name)
      }
    });
  };

  const handleNavigateSingleItem = (item) => {
    const route = isMobile ? '/demo/mobile/checklist/buat-wo' : '/tugas-departemen/buat-wo';
    const defaultTarget = relations[0]?.target_name || 'ENGINEERING';

    navigate(route, {
      state: {
        fromAudit:    true,
        isBatchWO:    false, // Single item mode
        session_id:   submittedSession?.session_id,
        template_id:  selectedTemplate?.id,
        brokenItems:  [item], // Only one item
        templateName: selectedTemplate?.name,
        shift:        submittedSession?.session_shift || shift,
        deptAsal:     user?.department || 'OPERASIONAL',
        targetDept:   defaultTarget,
        availableTargetDepts: relations.map(r => r.target_name)
      }
    });
  };
  // ─── DUPLICATE WO WARNING MODAL (Rich Info) ──────────────────
  const DuplicateModal = () => {
    if (!dupeModal) return null;
    const dupeNames = Object.keys(dupeCheck?.duplicates || {});
    const safeNames = dupeCheck?.safe_items || [];
    const isChecking = dupeCheck?.checking;

    // Status badge helper
    const StatusBadge = ({ status }) => {
      const map = {
        'Baru': { bg: 'bg-[#E8F4FD]', text: 'text-[#0095E8]', dot: 'bg-[#0095E8]' },
        'Proses': { bg: 'bg-[#FFF8E1]', text: 'text-[#FFA800]', dot: 'bg-[#FFA800]' },
        'Ditahan': { bg: 'bg-[#FFF5F8]', text: 'text-[#F1416C]', dot: 'bg-[#F1416C]' },
      };
      const s = map[status] || { bg: 'bg-[#F5F8FA]', text: 'text-[#7E8299]', dot: 'bg-[#A1A5B7]' };
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {status || 'Aktif'}
        </span>
      );
    };

    const UrgensiBadge = ({ urgensi }) => {
      const map = {
        'Kritis': 'bg-[#FFF5F8] text-[#F1416C] border border-[#F1416C]/20',
        'Normal': 'bg-[#F1FAFF] text-[#0095E8] border border-[#0095E8]/20',
        'Rendah': 'bg-[#F5F8FA] text-[#7E8299] border border-[#E4E6EF]',
      };
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[urgensi] || map['Normal']}`}>
          {urgensi || 'Normal'}
        </span>
      );
    };

    // Group duplikat berdasarkan WO yang sama
    const groupedByWO = {};
    for (const name of dupeNames) {
      const info = dupeCheck.duplicates[name];
      const key = info.wo_id;
      if (!groupedByWO[key]) groupedByWO[key] = { info, items: [] };
      groupedByWO[key].items.push(name);
    }

    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isChecking && setDupeModal(false)} />

        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#181C32] to-[#2D3155] px-8 py-6 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <AlertTriangle size={26} className="text-[#FFA800]" />
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold tracking-tight">Pemeriksaan Duplikasi WO</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Analisis otomatis Work Order yang sedang berjalan</p>
                </div>
              </div>
              <button onClick={() => !isChecking && setDupeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <XCircle size={18} />
              </button>
            </div>

            {/* Summary Chips */}
            {!isChecking && (
              <div className="flex gap-3 mt-6">
                {dupeNames.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#F1416C]/20 border border-[#F1416C]/30 px-4 py-2 rounded-xl">
                    <XCircle size={14} className="text-[#F1416C]" />
                    <span className="text-[12px] font-bold text-white">{dupeNames.length} Item Terkunci</span>
                  </div>
                )}
                {safeNames.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#50CD89]/20 border border-[#50CD89]/30 px-4 py-2 rounded-xl">
                    <CheckCircle2 size={14} className="text-[#50CD89]" />
                    <span className="text-[12px] font-bold text-white">{safeNames.length} Item Siap Dibuat WO</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-8 space-y-8">
            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-16 gap-5">
                <div className="w-16 h-16 border-4 border-[#0095E8]/20 border-t-[#0095E8] rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-[16px] font-bold text-[#181C32]">Memeriksa WO Aktif...</p>
                  <p className="text-[12px] text-[#7E8299] mt-1">Sistem menganalisis Work Order yang sedang berjalan di semua departemen</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── DUPLICATE SECTION ── */}
                {Object.keys(groupedByWO).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF5F8] flex items-center justify-center">
                        <XCircle size={18} className="text-[#F1416C]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#F1416C]">Item dengan WO Aktif — Tidak Dapat Dibuat Duplikat</h4>
                        <p className="text-[11px] text-[#A1A5B7] mt-0.5">Item berikut sudah masuk ke Work Order yang belum selesai</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(groupedByWO).map(([woId, { info, items }]) => {
                        const progress = info.wo_total_items > 0
                          ? Math.round((info.wo_fixed_items / info.wo_total_items) * 100)
                          : 0;
                        const sessionDate = info.session_date
                          ? new Date(info.session_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                          : null;

                        return (
                          <div key={woId} className="border border-[#F1416C]/20 rounded-2xl overflow-hidden shadow-sm">
                            {/* WO Header */}
                            <div className="bg-[#FFF5F8] px-5 py-4 border-b border-[#F1416C]/10">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-mono text-[#F1416C] font-bold">WO #{info.wo_id}</span>
                                    <StatusBadge status={info.wo_status} />
                                    <UrgensiBadge urgensi={info.wo_urgensi} />
                                  </div>
                                  <p className="text-[14px] font-bold text-[#181C32] mt-1.5 leading-tight">{info.wo_name}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] text-[#A1A5B7] font-bold uppercase">Tujuan</p>
                                  <p className="text-[12px] font-bold text-[#3F4254]">{info.wo_dept_target}</p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[10px] text-[#A1A5B7] font-bold uppercase">Progress Perbaikan</span>
                                  <span className="text-[11px] font-bold text-[#3F4254]">
                                    {info.wo_fixed_items}/{info.wo_total_items} item selesai ({progress}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-[#F1F1F4] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#50CD89] to-[#47B679] rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Checklist Origin Info */}
                            {info.checklist_session_id && (
                              <div className="bg-white px-5 py-3 border-b border-[#F5F8FA] flex flex-wrap gap-x-6 gap-y-2">
                                <div>
                                  <p className="text-[10px] font-bold text-[#A1A5B7] uppercase">Asal Checklist</p>
                                  <p className="text-[11px] font-bold text-[#181C32]">#{info.checklist_session_id} · {info.template_name || 'Template tidak diketahui'}</p>
                                </div>
                                {sessionDate && (
                                  <div>
                                    <p className="text-[10px] font-bold text-[#A1A5B7] uppercase">Tanggal & Shift</p>
                                    <p className="text-[11px] font-bold text-[#181C32]">{sessionDate} · Shift {(info.session_shift || '').toUpperCase()}</p>
                                  </div>
                                )}
                                {info.submitted_by_name && (
                                  <div>
                                    <p className="text-[10px] font-bold text-[#A1A5B7] uppercase">Dilaporkan Oleh</p>
                                    <p className="text-[11px] font-bold text-[#181C32]">{info.submitted_by_name}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Affected Items */}
                            <div className="bg-white px-5 py-4">
                              <p className="text-[10px] font-bold text-[#A1A5B7] uppercase mb-3">
                                {items.length} Item Terkunci dalam WO ini
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {items.map(name => (
                                  <span key={name}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F8] border border-[#F1416C]/20 rounded-lg text-[12px] font-semibold text-[#F1416C]">
                                    <XCircle size={11} />
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SAFE ITEMS SECTION ── */}
                {safeNames.length > 0 && !isMobile && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-[#E8FFF3] flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-[#50CD89]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#50CD89]">Item Baru — Aman Dibuat WO</h4>
                        <p className="text-[11px] text-[#A1A5B7] mt-0.5">Item berikut belum memiliki WO aktif dan siap diproses</p>
                      </div>
                    </div>
                    <div className="p-5 bg-[#E8FFF3]/40 border border-[#50CD89]/20 rounded-2xl">
                      <p className="text-[11px] font-bold text-[#A1A5B7] uppercase mb-3">Pilih Item untuk Dibuat WO</p>
                      <div className="flex flex-col gap-2">
                        {safeNames.map(name => (
                          <label key={name} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${selectedSafeItems.includes(name) ? 'bg-white border-[#50CD89]/40 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                            <input 
                              type="checkbox"
                              checked={selectedSafeItems.includes(name)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSafeItems([...selectedSafeItems, name]);
                                else setSelectedSafeItems(selectedSafeItems.filter(n => n !== name));
                              }}
                              className="w-4 h-4 text-[#50CD89] border-[#E4E6EF] rounded focus:ring-[#50CD89] focus:ring-2"
                            />
                            <span className={`text-[13px] font-semibold ${selectedSafeItems.includes(name) ? 'text-[#3F4254]' : 'text-[#A1A5B7]'}`}>
                              {name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ALL DUPLICATES — NO SAFE ITEMS ── */}
                {dupeNames.length > 0 && safeNames.length === 0 && (
                  <div className="flex items-start gap-4 p-5 bg-[#FFF8F0] border border-[#FFE2C5] rounded-2xl">
                    <Info size={20} className="text-[#FFA800] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] text-[#A07050] leading-relaxed">
                        Tidak ada item baru yang perlu dibuatkan WO. Seluruh temuan audit sebelumnya sudah dalam proses perbaikan.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!isChecking && !isMobile && (
            <div className="shrink-0 border-t border-[#F1F1F4] px-8 py-5 bg-[#FAFAFA] flex gap-3">
              <button
                onClick={() => setDupeModal(false)}
                className="flex-1 py-3 bg-white border border-[#E4E6EF] text-[#7E8299] rounded-xl text-[13px] font-bold hover:bg-[#F5F8FA] transition-all"
              >
                Tutup
              </button>

              {safeNames.length > 0 && (
                <button
                  onClick={() => {
                    const safeItemObjects = brokenItems.filter(i => selectedSafeItems.includes(i.name));
                    if (safeItemObjects.length > 0) {
                      handleNavigateWithItems(safeItemObjects);
                    } else {
                      showError('Validasi', 'Pilih minimal 1 item untuk dibuat WO');
                    }
                  }}
                  disabled={selectedSafeItems.length === 0}
                  className="flex-[2] py-4 bg-[#0095E8] text-white rounded-xl text-[14px] font-black hover:bg-[#0084CC] transition-all shadow-lg shadow-[#0095E8]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  <span>Buat WO Satu per satu ({selectedSafeItems.length} Item)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };


  const shiftOptions = ['pagi', 'siang', 'sore', 'malam'];
  const urgensiOptions = ['Rendah', 'Normal', 'Kritis'];

  // ─── STEP: HISTORY (Daftar Riwayat) ─────────────────────────
  if (step === 'history') {
    return (
      <div className="bg-[#F5F8FA] min-h-screen flex flex-col relative">
        {/* Sticky Header with Glassmorphism */}
        <div 
          className={`sticky top-0 z-30 px-6 pb-6 bg-[#F5F8FA]/80 backdrop-blur-md border-b border-slate-200 shadow-sm ${isMobile ? 'pt-8' : 'pt-10'}`}
          style={isMobile ? { paddingTop: 'calc(20px + env(safe-area-inset-top))' } : {}}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-black text-slate-800 tracking-tight leading-tight">Riwayat Checklist</h2>
              <p className="text-[12px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Audit {dept_name}</p>
            </div>
            <div className="flex gap-2.5">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep('setup'); navigate(`${basePath}/checklist${isMobile ? '' : '-harian'}`); }}
                className="px-6 py-2.5 bg-[#0095E8] text-white rounded-2xl text-[14px] font-black hover:bg-[#0084CC] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Plus size={18} /> {isMobile ? 'Baru' : 'Mulai Baru'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className={`flex-1 ${isMobile ? 'px-6 pt-6 pb-24' : 'p-8 px-10 pb-24'}`}>
          {isMobile ? (
            /* Mobile Card View with Staggered Animation */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                   <div className="w-8 h-8 border-3 border-blue-100 border-t-[#0095E8] rounded-full animate-spin" />
                   <p className="text-[13px] font-bold">Memuat riwayat...</p>
                </div>
              ) : historySessions.length === 0 ? (
                <div className="bg-white rounded-[32px] p-10 text-center border border-slate-100 shadow-sm">
                   <p className="text-slate-400 text-[14px] font-medium">Belum ada data riwayat.</p>
                </div>
              ) : historySessions.map((s, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={s.id}
                  onClick={() => handleViewDetail(s)}
                  className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-black text-slate-800">{new Date(s.session_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[#0095E8] font-black uppercase">{s.session_shift}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400 font-bold">{s.session_time ? s.session_time.substring(0, 5) : '-'}</span>
                      </div>
                    </div>
                    {s.wo_id ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[10px] font-black uppercase rounded-xl border border-emerald-100">WO DIBUAT</span>
                    ) : s.broken_count > 0 && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black uppercase rounded-xl border border-rose-100">WO DIBUTUHKAN</span>
                    )}
                  </div>
                  <h4 className="text-[16px] font-black text-slate-800 mb-4">{s.template_name}</h4>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-black text-emerald-500">{s.ok_count} OK</span>
                      {s.broken_count > 0 && <span className="text-[13px] font-black text-rose-500">{s.broken_count} Rusak</span>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
          /* Desktop Table View */
          <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9F9] border-b border-[#F1F1F4]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Waktu & Shift</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Template</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Hasil (OK/Rusak)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Status WO</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider">Pelapor</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#A1A5B7] uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F4]">
                {historyLoading ? (
                  <tr><td colSpan="6" className="py-20 text-center text-[13px] text-[#A1A5B7] italic">Memuat riwayat...</td></tr>
                ) : historySessions.length === 0 ? (
                  <tr><td colSpan="6" className="py-20 text-center text-[13px] text-[#A1A5B7]">Belum ada data riwayat checklist.</td></tr>
                ) : historySessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FBFCFD] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#181C32]">{new Date(s.session_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#0095E8] font-bold uppercase flex items-center gap-1">
                            <Clock size={10} /> {s.session_shift}
                          </span>
                          <span className="text-[10px] text-[#A1A5B7]">•</span>
                          <span className="text-[11px] text-[#7E8299] font-bold uppercase">{s.session_time ? s.session_time.substring(0, 5) : '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[13px] text-[#3F4254] font-medium">{s.template_name}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-[#50CD89]">{s.ok_count} OK</span>
                        {s.broken_count > 0 && <span className="text-[12px] font-bold text-[#F1416C]">{s.broken_count} Rusak</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {s.wo_id ? (
                        <span className="px-2.5 py-1 bg-[#E8FFF3] text-[#50CD89] text-[10px] font-extrabold uppercase rounded border border-[#50CD89]/20">WO DIBUAT</span>
                      ) : s.broken_count > 0 ? (
                        <span className="px-2.5 py-1 bg-[#FFF5F8] text-[#F1416C] text-[10px] font-extrabold uppercase rounded border border-[#F1416C]/20">WO DIBUTUHKAN</span>
                      ) : (
                        <span className="text-[11px] text-[#A1A5B7] font-medium">Tidak Perlu WO</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-[12px] text-[#7E8299] font-semibold">{s.submitted_by_name}</td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(s)}
                        className="px-4 py-2 bg-[#F1FAFF] text-[#0095E8] rounded-xl text-[11px] font-bold hover:bg-[#0095E8] hover:text-white transition-all flex items-center gap-2 ml-auto shadow-sm"
                      >
                        <Info size={14} /> Detail Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

  // ─── STEP: SETUP ────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="bg-[#F5F8FA] min-h-screen flex flex-col relative overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0095E8]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7239EA]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Sticky Header with Glassmorphism */}
        <div 
          className="sticky top-0 z-30 px-6 pb-6 bg-[#F5F8FA]/80 backdrop-blur-md border-b border-slate-200 shadow-sm pt-8"
          style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[22px] font-black text-slate-800 tracking-tight leading-tight">Checklist</h2>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Konfigurasi Audit</p>
            </div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`${basePath}/checklist-riwayat`)}
              className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm"
            >
              <XCircle size={24} />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 px-6 pt-6 pb-24 space-y-6 relative z-10 overflow-y-auto no-scrollbar">
          {/* Quick Stats Header for Mobile */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0095E8] flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Templates</p>
                   <p className="text-[15px] font-black text-slate-800 leading-none">{templates.length}</p>
                </div>
             </div>
             <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#F1416C] flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Temuan</p>
                   <p className="text-[15px] font-black text-slate-800 leading-none">8</p>
                </div>
             </div>
          </div>

          {/* Session Parameters Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                  <Calendar size={16} className="text-[#0095E8]" /> Jadwal Audit
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Tanggal</span>
                    <CustomDatePicker value={sessionDate} onChange={setSessionDate} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Waktu</span>
                    <CustomTimePicker value={sessionTime} onChange={setSessionTime} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[13px] font-black text-slate-800 flex items-center gap-2">
                  <Send size={16} className="text-[#0095E8]" /> Shift Kerja
                </label>
                <div className="flex gap-2.5">
                  {shiftOptions.map(s => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={s}
                      onClick={() => setShift(s)}
                      className={`flex-1 py-3.5 rounded-2xl text-[12px] font-black capitalize transition-all border-2 ${shift === s
                        ? 'bg-[#E3F2FD] text-[#0095E8] border-[#0095E8] shadow-sm'
                        : 'bg-[#F5F8FA] text-slate-400 border-transparent'
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>

          {/* Template Selection Section */}
          <div className="space-y-4">
             <label className="text-[13px] font-black text-slate-800 flex items-center gap-2 ml-1">
               <ClipboardList size={16} className="text-[#0095E8]" /> Pilih Template Audit
             </label>
             <div className="grid grid-cols-1 gap-4">
               {templates.map((tpl, idx) => (
                 <motion.div
                   key={tpl.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleSelectTemplate(tpl)}
                   className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group active:bg-blue-50 transition-colors cursor-pointer"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-[#F1FAFF] text-[#0095E8] flex items-center justify-center group-active:bg-white transition-colors">
                        <FileText size={22} />
                     </div>
                     <div>
                        <h4 className="text-[15px] font-black text-slate-800 leading-tight">{tpl.name}</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{tpl.details?.length || 0} Item Checklist</p>
                     </div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-active:bg-white group-active:text-[#0095E8]">
                      <ChevronRight size={20} />
                   </div>
                 </motion.div>
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP: CHECKLIST ────────────────────────────────────────
  if (step === 'checklist') {
    return (
      <div className="bg-[#F5F8FA] min-h-screen flex flex-col relative overflow-hidden">
        <div 
          className="sticky top-0 z-30 px-6 pb-6 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm"
          style={{ paddingTop: 'calc(35px + env(safe-area-inset-top, 20px))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (confirm('Batal melakukan audit? Data yang belum di-submit akan hilang.')) {
                    setStep('setup');
                    localStorage.removeItem(`active_checklist_${user?.id}`);
                  }
                }} 
                className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>
              <div>
                <h2 className="text-[17px] font-black text-slate-800 leading-tight">{selectedTemplate?.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black text-[#0095E8] uppercase">{shift}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{sessionTime.substring(0, 5)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#E8FFF3] px-3 py-2 rounded-2xl border border-[#50CD89]/20">
              <div className="w-8 h-8 rounded-full border-2 border-[#50CD89]/20 relative flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#50CD89] stroke-current"
                    strokeDasharray={`${(okCount / items.length) * 100}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[8px] font-black text-[#50CD89]">{Math.round((okCount / items.length) * 100)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#50CD89] leading-none">{okCount}/{items.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pt-6 pb-32 space-y-4 overflow-y-auto no-scrollbar">
          {items.map((item, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              key={item.id} 
              className="relative"
            >
              <ChecklistField
                field={item}
                value={item.value}
                status={item.status}
                notes={item.notes}
                onValueChange={(val) => updateItemField(item.id, 'value', val)}
                onStatusChange={(status) => updateItemField(item.id, 'status', status)}
                onNotesChange={(notes) => updateItemField(item.id, 'notes', notes)}
                photoUrls={safeArr(item.photo_urls).length > 0 ? safeArr(item.photo_urls) : (item.photo_url ? [item.photo_url] : [])}
                onPhotoChange={(urls) => updateItemField(item.id, 'photo_urls', Array.isArray(urls) ? urls : [])}
              />
            </motion.div>
          ))}

          <div className="pt-8 pb-12">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitChecklist} 
              disabled={submitting}
              className="w-full h-14 bg-[#0095E8] text-white rounded-2xl text-[16px] font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <Send size={20} />
                  <span>Submit Laporan Audit</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <>
        <DuplicateModal />

        {/* Lightbox Modal */}
        {zoomedImage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Zoomed" />
              <button
                className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-gray-200"
                onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div 
          className={`${isMobile ? 'px-4 pb-24' : 'p-8 px-10 pb-24'}`}
          style={isMobile ? { paddingTop: 'calc(35px + env(safe-area-inset-top, 20px))' } : {}}
        >
          {/* Header Detail */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => isHistoryMode ? setStep('history') : setStep('setup')}
                className="w-10 h-10 rounded-full bg-white border border-[#E4E6EF] flex items-center justify-center text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] transition-all"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>
              <div>
                <h2 className="text-[20px] font-bold text-[#181C32]">Detail Hasil Checklist</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-[#F1FAFF] text-[#0095E8] text-[11px] font-bold rounded uppercase">{shift}</span>
                  <span className="text-[12px] text-[#A1A5B7]">•</span>
                  <span className="text-[12px] text-[#7E8299] font-medium">{new Date(sessionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  <span className="text-[12px] text-[#A1A5B7]">•</span>
                  <span className="text-[12px] text-[#7E8299] font-bold">{sessionTime?.substring(0, 5)}</span>
                  <span className="text-[12px] text-[#A1A5B7]">•</span>
                  <span className="text-[12px] text-[#7E8299] font-medium">{dept_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white p-3 px-4 rounded-xl border border-[#F1F1F4] flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#F1FAFF] flex items-center justify-center text-[#0095E8] font-bold text-[11px]">
                  {submittedSession?.submitted_by_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-[10px] text-[#A1A5B7] font-bold uppercase leading-tight">Dilaporkan Oleh</p>
                  <p className="text-[12px] font-bold text-[#3F4254]">{submittedSession?.submitted_by_name || user?.firstName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Summary & All Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="flex gap-3">
                <div className="flex-1 bg-white p-4 rounded-2xl border border-[#F1F1F4] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03]">
                    <ClipboardList size={60} />
                  </div>
                  <p className="text-[9px] font-bold text-[#A1A5B7] uppercase tracking-wider mb-2 leading-tight">Total Item</p>
                  <p className="text-[24px] font-black text-[#181C32] leading-none">{submittedSession?.summary?.total_items}</p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border border-[#F1F1F4] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05]">
                    <CheckCircle2 size={60} className="text-[#50CD89]" />
                  </div>
                  <p className="text-[9px] font-bold text-[#50CD89] uppercase tracking-wider mb-2 leading-tight">Kondisi Baik</p>
                  <p className="text-[24px] font-black text-[#50CD89] leading-none">{submittedSession?.summary?.ok_count}</p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-2xl border border-[#F1F1F4] shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.05]">
                    <XCircle size={60} className="text-[#F1416C]" />
                  </div>
                  <p className="text-[9px] font-bold text-[#F1416C] uppercase tracking-wider mb-2 leading-tight">Rusak / Bermasalah</p>
                  <p className="text-[24px] font-black text-[#F1416C] leading-none">{submittedSession?.summary?.broken_count}</p>
                </div>
              </div>

              {/* Full Item List */}
              <div className="bg-white rounded-2xl border border-[#F1F1F4] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F1F1F4] flex items-center justify-between bg-[#F9F9F9]/50">
                  <h3 className="text-[14px] font-bold text-[#181C32]">Rincian Pemeriksaan Item</h3>
                  <span className="text-[11px] font-bold text-[#A1A5B7] uppercase">Audit Trail</span>
                </div>
                <div className="divide-y divide-[#F1F1F4]">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-[#F5F8FA]/30 transition-colors`}>
                      <div className="w-6 text-[11px] font-mono text-[#A1A5B7]">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-[#3F4254]">{item.name}</p>

                        {/* Dynamic Value Display */}
                        {item.value && (
                          <div className="mt-1 text-[12px] text-[#7E8299]">
                            {item.type === 'Image' ? (
                              <div className="mt-2 w-24 h-16 rounded-lg overflow-hidden border border-[#E4E6EF]">
                                <img src={item.value} className="w-full h-full object-cover" alt="Result" />
                              </div>
                            ) : item.type === 'Multiple Images' ? (
                              <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar">
                                {Array.isArray(item.value) && item.value.map((img, i) => (
                                  <div key={i} className="w-16 h-12 rounded border border-[#E4E6EF] flex-shrink-0">
                                    <img src={img} className="w-full h-full object-cover rounded" alt="Result" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="font-medium text-[#181C32]">
                                {Array.isArray(item.value) ? item.value.join(', ') : item.value}
                              </p>
                            )}
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-1.5 flex flex-col gap-1.5 p-2 bg-[#FFF5F8] rounded-lg border border-[#F1416C]/10">
                            <div className="flex items-center gap-1.5">
                              <Info size={12} className="text-[#F1416C]" />
                              <p className="text-[11px] text-[#F1416C] font-medium">{item.notes}</p>
                            </div>
                            {(() => { const _urls = safeArr(item.photo_urls).length > 0 ? safeArr(item.photo_urls) : (item.photo_url ? [item.photo_url] : []); return _urls.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-2">
                                {_urls.map((url, i) => (
                                  <div key={i} className="w-24 h-16 rounded border border-[#F1416C]/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(url)}>
                                    <img src={url} className="w-full h-full object-cover" alt="Foto kerusakan" />
                                  </div>
                                ))}
                              </div>
                            ); })()}
                          </div>
                        )}
                        {!item.notes && (() => { const _urls = safeArr(item.photo_urls).length > 0 ? safeArr(item.photo_urls) : (item.photo_url ? [item.photo_url] : []); return _urls.length > 0 && (
                          <div className="mt-1.5 p-2 bg-[#FFF5F8] rounded-lg border border-[#F1416C]/10 inline-block">
                            <div className="flex flex-wrap gap-2">
                              {_urls.map((url, i) => (
                                <div key={i} className="w-24 h-16 rounded border border-[#F1416C]/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setZoomedImage(url)}>
                                  <img src={url} className="w-full h-full object-cover" alt="Foto kerusakan" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ); })()}
                      </div>
                      <div>
                        {item.status === 'ok' ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#E8FFF3] text-[#50CD89] text-[11px] font-bold rounded-full">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF5F8] text-[#F1416C] text-[11px] font-bold rounded-full">
                              <XCircle size={12} /> RUSAK
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Actions & WO Recommendation */}
            <div className="space-y-6">
              {!isMobile && brokenItems.length > 0 ? (
                <div className="bg-[#181C32] rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
                  <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                      <Send size={24} className="text-[#0095E8]" />
                    </div>
                    <h4 className="text-[16px] font-bold mb-2">Tindakan Diperlukan</h4>
                    <p className="text-[12px] text-gray-400 mb-6 leading-relaxed">
                      Ditemukan {brokenItems.length} item bermasalah. Segera buatkan Work Order agar departemen terkait dapat melakukan perbaikan.
                    </p>

                    <div className="space-y-3">
                      {submittedSession?.wo_id ? (
                        <button
                          onClick={() => navigate(`${basePath}/terkirim`)}
                          className="w-full py-3.5 bg-[#50CD89] hover:bg-[#47B679] text-white rounded-xl text-[13px] font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Info size={16} /> Lihat WO Aktif
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckAndNavigate()}
                          className="w-full py-3.5 bg-[#0095E8] hover:bg-[#0084CC] text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-[#0095E8]/20 flex items-center justify-center gap-2"
                        >
                          <Send size={15} /> Kirim WO Masal (Satu per satu)
                        </button>
                      )}
                      <button
                        onClick={() => isHistoryMode ? setStep('history') : navigate(`${basePath}/checklist-riwayat`)}
                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[13px] font-bold transition-all"
                      >
                        Kembali ke Riwayat
                      </button>
                    </div>
                  </div>
                </div>
              ) : brokenItems.length === 0 ? (
                <div className="bg-[#E8FFF3] border border-[#50CD89]/20 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 size={32} className="text-[#50CD89]" />
                  </div>
                  <h4 className="text-[16px] font-bold text-[#181C32] mb-2">Kondisi Aman</h4>
                  <p className="text-[12px] text-[#7E8299] mb-6 leading-relaxed">
                    Seluruh item dalam kondisi optimal. Tidak ada tindakan perbaikan yang diperlukan saat ini.
                  </p>
                  <button
                    onClick={() => isHistoryMode ? setStep('history') : navigate(`${basePath}/checklist-riwayat`)}
                    className="w-full py-3 bg-white border border-[#50CD89]/30 text-[#50CD89] rounded-xl text-[13px] font-bold hover:bg-[#50CD89] hover:text-white transition-all"
                  >
                    Selesai
                  </button>
                </div>
              ) : null}

              {/* Quick Info Card */}
              <div className="bg-white rounded-2xl border border-[#F1F1F4] p-6 shadow-sm">
                <h5 className="text-[13px] font-bold text-[#181C32] mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-[#A1A5B7]" />
                  Metadata Sesi
                </h5>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#A1A5B7] font-bold uppercase">ID Sesi</span>
                    <span className="text-[12px] font-mono text-[#3F4254]">#SES-{submittedSession?.session_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#A1A5B7] font-bold uppercase">Template</span>
                    <span className="text-[12px] font-bold text-[#0095E8]">{selectedTemplate?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#A1A5B7] font-bold uppercase">Shift Kerja</span>
                    <span className="text-[12px] font-bold text-[#3F4254] uppercase">{shift}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#A1A5B7] font-bold uppercase">Waktu Audit</span>
                    <span className="text-[12px] font-bold text-[#3F4254] uppercase">{sessionTime?.substring(0, 5)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }


  // ─── STEP: WO FORM (Khusus Audit) ─────────────────────────
  if (step === 'wo-form') {
    return (
      <>
        <DuplicateModal />
        <div className={`${isMobile ? 'p-4 pb-24' : 'p-8 px-10 pb-24'}`}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('result')}
                className="w-10 h-10 rounded-full bg-white border border-[#E4E6EF] flex items-center justify-center text-[#7E8299] hover:bg-[#F5F8FA] hover:text-[#0095E8] transition-all shadow-sm"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>
              <div>
                <h2 className="text-[20px] font-bold text-[#181C32]">Buat Tindakan Perbaikan (WO)</h2>
                <p className="text-[12px] text-[#7E8299] mt-1">Mengonversi hasil temuan rusak menjadi perintah kerja</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Form Side */}
              <div className="md:col-span-3 space-y-6">
                <div className="bg-white rounded-2xl border border-[#F1F1F4] p-8 shadow-sm">
                  <form onSubmit={handleGenerateWO} className="space-y-6">
                    {/* Info Referensi Audit (Kolom Khusus) */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-[#F5F8FA] rounded-xl border border-[#E4E6EF]">
                      <div>
                        <label className="text-[10px] font-bold text-[#A1A5B7] uppercase block mb-1">Referensi Sesi Audit</label>
                        <p className="text-[13px] font-bold text-[#181C32]">#SES-{submittedSession?.session_id}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#A1A5B7] uppercase block mb-1">Kategori Temuan</label>
                        <p className="text-[13px] font-bold text-[#F1416C]">KERUSAKAN FISIK</p>
                      </div>
                    </div>

                    {/* Dept Tujuan */}
                    <div>
                      <label className="text-[13px] font-bold text-[#3F4254] mb-2 block">Kirim Perintah Ke Departemen {requiredStar}</label>
                      <select
                        value={woForm.departemen_tujuan}
                        onChange={e => setWoForm(p => ({ ...p, departemen_tujuan: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#E4E6EF] text-[13px] outline-none focus:border-[#0095E8] bg-[#F9F9F9] focus:bg-white transition-all">
                        <option value="">Pilih departemen tujuan</option>
                        {relations.map(r => (
                          <option key={r.id} value={r.target_name}>{r.target_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Judul WO */}
                    <div>
                      <label className="text-[13px] font-bold text-[#3F4254] mb-2 block">Judul Pekerjaan {requiredStar}</label>
                      <input type="text" value={woForm.nama_wo}
                        onChange={e => setWoForm(p => ({ ...p, nama_wo: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-[#E4E6EF] text-[13px] outline-none focus:border-[#0095E8] font-semibold" />
                    </div>

                    {/* Urgensi & Deadline */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-bold text-[#3F4254] mb-2 block">Prioritas {requiredStar}</label>
                        <div className="flex gap-2">
                          {urgensiOptions.map(o => (
                            <button key={o} type="button" onClick={() => setWoForm(p => ({ ...p, urgensi: o }))}
                              className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold uppercase transition-all border ${woForm.urgensi === o
                                ? 'bg-[#0095E8] text-white border-[#0095E8]'
                                : 'bg-white text-[#A1A5B7] border-[#E4E6EF] hover:border-[#0095E8] hover:text-[#0095E8]'}`}>
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[13px] font-bold text-[#3F4254] mb-2 block">Estimasi Selesai</label>
                        <CustomDatePicker
                          value={woForm.tanggal_selesai}
                          onChange={val => setWoForm(p => ({ ...p, tanggal_selesai: val }))}
                          minDate={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {/* Deskripsi Tambahan */}
                    <div>
                      <label className="text-[13px] font-bold text-[#3F4254] mb-2 block">Instruksi Tambahan (Opsional)</label>
                      <textarea value={woForm.deskripsi}
                        onChange={e => setWoForm(p => ({ ...p, deskripsi: e.target.value }))}
                        placeholder="Tambahkan detail instruksi jika diperlukan..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-[#E4E6EF] text-[13px] outline-none focus:border-[#0095E8] resize-none" />
                    </div>

                    <div className="pt-4">
                      <button type="submit" disabled={woSaving || !woForm.departemen_tujuan}
                        className="w-full py-4 bg-[#0095E8] hover:bg-[#0084CC] text-white rounded-xl text-[14px] font-bold transition-all shadow-lg shadow-[#0095E8]/20 flex items-center justify-center gap-3 disabled:opacity-50">
                        {woSaving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Send size={18} /> Kirim Work Order
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Preview Side */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[#F9F9F9] rounded-2xl border border-[#E4E6EF] p-6">
                  <h4 className="text-[14px] font-bold text-[#181C32] mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#F1416C]" />
                    Daftar Kerusakan ({brokenItems.length})
                  </h4>
                  <div className="space-y-3">
                    {brokenItems.map((item, idx) => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-[#E4E6EF] shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 bg-[#FFF5F8] text-[#F1416C] rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-[12px] font-bold text-[#3F4254] leading-tight">{item.name}</p>
                            {item.notes ? (
                              <p className="text-[11px] text-[#F1416C] mt-1 italic">"{item.notes}"</p>
                            ) : (
                              <p className="text-[10px] text-[#A1A5B7] mt-1 italic">Tidak ada catatan tambahan</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#E4E6EF] space-y-4">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-[#A1A5B7]">Checklist Ref</span>
                      <span className="font-bold text-[#3F4254]">#SES-{submittedSession?.session_id}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-[#A1A5B7]">Dibuat Pada</span>
                      <span className="font-bold text-[#3F4254]">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FFF8F0] border border-[#FFE2C5] rounded-xl flex items-start gap-3">
                  <Info size={18} className="text-[#FFA800] mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-[#845E2D] leading-relaxed">
                    Setiap item di samping akan otomatis terlampir di dalam Work Order dan dapat dilihat oleh departemen tujuan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;

};

export default ChecklistHarian;
