import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Download, Upload, Plus, Edit3, Trash2, Eye, Power, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, ChevronDown, X, Calendar, AlertCircle, ChevronsUpDown, Info, Clock } from 'lucide-react';
import { hasPermission } from '../utils/permissions';
import { useModal } from '../context/ModalContext';
import Skeleton from './common/Skeleton';
import CustomDateRangePicker from './CustomDateRangePicker';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { authFetch } from '../services/api';
import { getSocket } from '../services/socket';
import { generateSummaryPDF } from '../utils/pdfGenerator';

const RingkasanList = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { confirm, success, error: showError } = useModal();
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMetadata, setFilterMetadata] = useState({
    companies: [],
    departments: [],
    agens: [],
    templates: []
  });

  const [activeFilters, setActiveFilters] = useState({
    urgensi: [],
    progres: [],
    perusahaan: [],
    departemen: [],
    agen: [],
    template: [],
    status: null, // 'Aktif', 'Tidak aktif', or null
    dateRange: { start: null, end: null }
  });

  const [tempFilters, setTempFilters] = useState({...activeFilters});
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [jenisTugasFilter, setJenisTugasFilter] = useState('Semua');

  useEffect(() => {
    fetchTasks();
    fetchMetadata();

    const socket = getSocket();
    if (socket) {
      const handleRefresh = () => fetchTasks();
      socket.on('task-created', handleRefresh);
      socket.on('task-updated', handleRefresh);
      socket.on('task-approval-updated', handleRefresh);
      socket.on('task-progress-updated', handleRefresh);
      socket.on('task-deleted', handleRefresh);

      return () => {
        socket.off('task-created', handleRefresh);
        socket.off('task-updated', handleRefresh);
        socket.off('task-approval-updated', handleRefresh);
        socket.off('task-progress-updated', handleRefresh);
        socket.off('task-deleted', handleRefresh);
      };
    }
  }, []);

  const fetchMetadata = async () => {
    try {
      const [resComp, resDept, resAgen, resTpl] = await Promise.all([
        authFetch('/api/companies'),
        authFetch('/api/departments'),
        authFetch('/api/users?type=agen'),
        authFetch('/api/templates')
      ]);

      const [companies, departments, agens, templates] = await Promise.all([
        resComp.ok ? resComp.json() : [],
        resDept.ok ? resDept.json() : [],
        resAgen.ok ? resAgen.json() : [],
        resTpl.ok ? resTpl.json() : []
      ]);

      setFilterMetadata({ companies, departments, agens, templates });
    } catch (err) {
      console.error('Error fetching filter metadata:', err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const company_id = user?.company_id;
      const response = await authFetch(`/api/tasks${company_id ? `?company_id=${company_id}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        showError('Gagal', 'Gagal mengambil data tugas');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      showError('Gagal', 'Gagal mengambil data tugas');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLaporan = async () => {
    // 1. Validation check
    if (!activeFilters.dateRange.start || !activeFilters.dateRange.end) {
      setShowExportWarning(true);
      return;
    }

    try {
      // Fetch ALL users (Admins & Agents) to ensure everyone assigned to a task can be identified
      const resUsers = await authFetch('/api/users');
      const allUsers = resUsers.ok ? await resUsers.json() : [];

      // 2. Collect all unique template detail fields from filtered tasks
      // We need a stable ordered list of all possible detail columns
      const detailColumnsMap = new Map(); // id/index -> { key, label }
      filteredTasks.forEach((task) => {
        let details = [];
        try {
          if (task.details) {
            details = typeof task.details === 'string' ? JSON.parse(task.details) : task.details;
          }
        } catch (e) { /* skip */ }
        if (Array.isArray(details)) {
          details.forEach((detail, idx) => {
            const key = detail.id || `detail_${idx}`;
            if (!detailColumnsMap.has(key)) {
              detailColumnsMap.set(key, {
                key: `tmpl_${key}`,
                label: detail.nama_detail || `Detail ${idx + 1}`
              });
            }
          });
        }
      });

      const detailColumns = Array.from(detailColumnsMap.entries()); // [[origKey, {key, label}], ...]

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Tugas');

      // 3. Define columns: standard + dynamic template detail columns
      const standardColumns = [
        { header: 'Nama Tugas', key: 'nama_tugas', width: 35 },
        { header: 'No Tugas', key: 'no_tugas', width: 15 },
        { header: 'Perusahaan', key: 'perusahaan', width: 22 },
        { header: 'Departemen', key: 'departemen', width: 22 },
        { header: 'Nama Agen', key: 'nama_agen', width: 30 },
        { header: 'Jadwal Mulai Tugas', key: 'jadwal_mulai', width: 20 },
        { header: 'Jadwal Selesai Tugas', key: 'jadwal_selesai', width: 20 },
        { header: 'Aturan Waktu', key: 'aturan_waktu', width: 15 },
        { header: 'Progres Tugas', key: 'progres', width: 18 },
        { header: 'Urgensi', key: 'urgensi', width: 15 },
        { header: 'Persetujuan', key: 'persetujuan', width: 15 }
      ];

      const templateColumns = detailColumns.map(([origKey, col]) => ({
        header: col.label,
        key: col.key,
        width: Math.max(20, Math.min(col.label.length * 1.5 + 5, 40))
      }));

      worksheet.columns = [...standardColumns, ...templateColumns];

      // 4. Styling Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, name: 'Calibri', size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 30;
      
      headerRow.eachCell((cell, colNumber) => {
        const isTemplateCol = colNumber > standardColumns.length;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isTemplateCol ? 'DBEAFE' : 'F2F2F2' } // blue tint for template columns
        };
      });

      // 5. Add Data
      filteredTasks.forEach((task) => {
        // Resolve agent names accurately
        let agentNames = '-';
        try {
          if (task.agen_id) {
            let ids = [];
            if (typeof task.agen_id === 'string') {
                try {
                    ids = JSON.parse(task.agen_id);
                } catch(e) {
                    ids = [task.agen_id];
                }
            } else if (Array.isArray(task.agen_id)) {
                ids = task.agen_id;
            } else {
                ids = [task.agen_id];
            }
            
            agentNames = ids.map(id => {
              const user = allUsers.find(u => String(u.id) === String(id));
              if (user) {
                return `${user.firstName} ${user.lastName || ''}`.trim();
              }
              return `ID: ${id}`;
            }).filter(n => n).join(', ');
          }
        } catch (err) {
          console.error("Error mapping names:", err);
          agentNames = "Error parsing";
        }

        // Resolve company name accurately
        let companyName = task.perusahaan || '-';
        if (!isNaN(companyName) || !companyName || companyName === '-' || companyName === 'PAM') {
          const companyObj = filterMetadata.companies.find(c => 
            String(c.id) === String(task.company_id) || 
            String(c.companyId) === String(companyName) ||
            String(c.orgId) === String(companyName)
          );
          if (companyObj) {
            companyName = companyObj.name || companyObj.companyId; 
          }
        }

        // Parse submission data for this task
        let submissionData = {};
        try {
          if (task.submission_data) {
            submissionData = typeof task.submission_data === 'string' 
              ? JSON.parse(task.submission_data) 
              : task.submission_data;
          }
        } catch (e) { /* skip */ }

        // Build row data
        const rowData = {
          nama_tugas: task.nama_tugas,
          no_tugas: `PAM-${task.id}`,
          perusahaan: companyName,
          departemen: task.departemen || '-',
          nama_agen: agentNames || '-',
          jadwal_mulai: `${formatDate(task.tanggal_mulai)} ${formatTime(task.waktu_mulai)}`,
          jadwal_selesai: `${formatDate(task.tanggal_selesai)} ${formatTime(task.waktu_selesai)}`,
          aturan_waktu: task.aturan_waktu || '-',
          progres: task.progres || 'Terbuka',
          urgensi: task.urgensi || 'Normal',
          persetujuan: task.butuh_persetujuan ? 'Ya' : 'Tidak'
        };

        // Add template detail values
        detailColumns.forEach(([origKey, col]) => {
          const value = submissionData[origKey];
          if (Array.isArray(value)) {
            rowData[col.key] = value.join(', ');
          } else {
            rowData[col.key] = value || '-';
          }
        });

        const row = worksheet.addRow(rowData);

        // Styling Data Row
        row.font = { name: 'Calibri', size: 10 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Buffer and Save
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Laporan_Tugas_${activeFilters.dateRange.start}_to_${activeFilters.dateRange.end}.xlsx`;
      saveAs(new Blob([buffer]), filename);
      
      success('Berhasil', 'Laporan berhasil diunduh!');
    } catch (err) {
      console.error('Error generating excel:', err);
      showError('Gagal', 'Gagal mengunduh laporan.');
    }
  };

  const handleToggleStatus = async (task) => {
    const isInactive = task.status === 'Tidak aktif';
    const newStatus = isInactive ? 'Pending' : 'Tidak aktif';
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
      const response = await authFetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          user_id: user?.id,
          user_name: user?.firstName || user?.username
        })
      });
      if (response.ok) {
        success('Berhasil', isInactive ? 'Tugas berhasil diaktifkan!' : 'Tugas berhasil dinonaktifkan!');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const filteredTasks = tasks
    .filter(task => task.status !== 'Draft')
    .filter(task => {
      // Search term filter
      const matchesSearch = (task.nama_tugas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (`PAM-${task.id}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.nomor_perintah_kerja || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Urgensi filter
      if (activeFilters.urgensi.length > 0 && !activeFilters.urgensi.includes(task.urgensi)) return false;

      // Progres filter
      if (activeFilters.progres.length > 0 && !activeFilters.progres.includes(task.progres || 'Terbuka')) return false;

      // Perusahaan filter
      if (activeFilters.perusahaan.length > 0 && !activeFilters.perusahaan.includes(task.perusahaan)) return false;

      // Departemen filter
      if (activeFilters.departemen.length > 0 && !activeFilters.departemen.includes(task.departemen)) return false;

      // Agen filter - Assuming task has agen info or we matching by name if available, handle with care
      // For now based on request, we'll assume matching task properties

      // Status filter
      if (activeFilters.status) {
        const isAktif = task.status !== 'Tidak aktif';
        if (activeFilters.status === 'Aktif' && !isAktif) return false;
        if (activeFilters.status === 'Tidak aktif' && isAktif) return false;
      }

      // Date Range filter
      if (activeFilters.dateRange.start && activeFilters.dateRange.end) {
        const taskDate = new Date(task.tanggal_mulai);
        const startDate = new Date(activeFilters.dateRange.start);
        const endDate = new Date(activeFilters.dateRange.end);
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
        if (taskDate < startDate || taskDate > endDate) return false;
      }

      return true;
    })
    .filter(task => {
      if (jenisTugasFilter === 'Semua') return true;
      return (task.jenis_tugas || '').toLowerCase() === jenisTugasFilter.toLowerCase();
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-[#F5F8FA] text-[#7E8299]';
      case 'Pending':
      case 'Aktif':
        return 'bg-[#E8FFF3] text-[#50CD89]';
      case 'Selesai':
        return 'bg-[#F1FAFF] text-[#0095E8]';
      default:
        return 'bg-[#F5F8FA] text-[#7E8299]';
    }
  };

  const getUrgensiColor = (urgensi) => {
    switch (urgensi) {
      case 'Kritis':
        return 'bg-[#FFF5F8] text-[#F1416C]';
      case 'Sedang':
        return 'bg-[#FFF8DD] text-[#FFAD0F]';
      default: // Normal
        return 'bg-[#F1FAFF] text-[#0095E8]';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  return (
    <div className="p-8">
      {/* Header Actions */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
            <input
              type="text"
              placeholder="Cari ID, nama tugas, nomor perintah kerja"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg text-sm w-80 focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <button 
            onClick={() => { 
              console.log('Opening filter modal');
              setTempFilters({...activeFilters}); 
              setIsFilterOpen(true); 
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-colors ${
              activeFilters.urgensi.length > 0 || 
              activeFilters.progres.length > 0 || 
              activeFilters.perusahaan.length > 0 || 
              activeFilters.departemen.length > 0 || 
              activeFilters.status !== null || 
              activeFilters.dateRange.start !== null
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' 
                : 'border-[#F1F1F4] text-[#3F4254] hover:bg-gray-50'
            }`}
          >
            <Filter size={16} /> Filter
          </button>
          <button onClick={fetchTasks} className="flex items-center gap-2 px-4 py-2 border border-[#F1F1F4] rounded-lg text-sm font-semibold text-[#3F4254] hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>

          {/* Task Type Filter Buttons */}
          <div className="flex items-center bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg p-1 gap-1">
            <button 
              onClick={() => { setJenisTugasFilter('Semua'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all ${jenisTugasFilter === 'Semua' ? 'bg-white text-[#3F4254] shadow-sm' : 'text-[#A1A5B7] hover:text-[#3F4254]'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => { setJenisTugasFilter('WO'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all ${jenisTugasFilter === 'WO' ? 'bg-white text-[#7239EA] shadow-sm' : 'text-[#A1A5B7] hover:text-[#7239EA]'}`}
            >
              WO
            </button>
            <button 
              onClick={() => { setJenisTugasFilter('Checklist'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all ${jenisTugasFilter === 'Checklist' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[#A1A5B7] hover:text-[var(--primary)]'}`}
            >
              Checklist
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission(user, 'tugas_agen_ringkasan', 'Download') && (
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadLaporan}
                className="px-4 py-2 border border-[var(--primary)] rounded-lg text-sm font-bold text-[var(--primary)] hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download size={16} /> Excel
              </button>
              <button 
                onClick={() => generateSummaryPDF(filteredTasks)}
                className="px-4 py-2 border border-[#E4E6EF] rounded-lg text-sm font-bold text-[#7E8299] hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download size={16} /> PDF
              </button>
            </div>
          )}
          <button
            onClick={() => navigate('/tugas-agen/upload')}
            className="px-4 py-2 border border-[var(--primary)] rounded-lg text-sm font-bold text-[var(--primary)] hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Upload size={16} /> Upload Tugas
          </button>
          <button
            onClick={() => navigate('/tugas-agen/buat')}
            className="px-4 py-2 bg-[var(--primary)] rounded-lg text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Buat Tugas
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F4] bg-[#F9F9F9]">
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left w-[50px]">No</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[140px]">
                  <div className="flex items-center gap-1">ID Tugas <ChevronsUpDown size={11} className="text-[#C4C4C4]" /></div>
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[200px]">
                  <div className="flex items-center gap-1">Nama Tugas <ChevronsUpDown size={11} className="text-[#C4C4C4]" /></div>
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[180px]">
                  <div className="flex items-center gap-1">Jadwal Tugas <ChevronsUpDown size={11} className="text-[#C4C4C4]" /></div>
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[150px]">Perusahaan</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[150px]">Departemen</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-left min-w-[100px]">Urgensi</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-center min-w-[130px]">Progres Tugas</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-center min-w-[100px]">Status</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#B5B5C3] uppercase text-center w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-[#F1F1F4]">
                    <td className="px-6 py-5"><Skeleton width="20px" /></td>
                    <td className="px-6 py-5"><Skeleton width="100px" /></td>
                    <td className="px-6 py-5"><Skeleton width="200px" /></td>
                    <td className="px-6 py-5"><Skeleton width="150px" /></td>
                    <td className="px-6 py-5"><Skeleton width="120px" /></td>
                    <td className="px-6 py-5"><Skeleton width="120px" /></td>
                    <td className="px-6 py-5"><Skeleton width="80px" /></td>
                    <td className="px-6 py-5"><Skeleton width="100px" /></td>
                    <td className="px-6 py-5"><Skeleton width="80px" /></td>
                    <td className="px-6 py-5"><Skeleton width="60px" /></td>
                  </tr>
                ))
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#7E8299] text-sm font-medium">Data tidak ditemukan</td>
                </tr>
              ) : (
                paginatedTasks.map((task, index) => {
                  // Resolve company name accurately
                  let companyName = task.perusahaan || '-';
                  if (!isNaN(companyName) || !companyName || companyName === '-' || companyName === 'PAM') {
                    const companyObj = filterMetadata.companies.find(c => 
                      String(c.id) === String(task.company_id) || 
                      String(c.companyId) === String(companyName) ||
                      String(c.orgId) === String(companyName)
                    );
                    if (companyObj) {
                      companyName = companyObj.name || companyObj.companyId; 
                    }
                  }

                  return (
                    <tr key={task.id} className="border-b border-[#F1F1F4] hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-5 text-[13px] text-[#3F4254] font-medium">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Link to={`/tugas-agen/detail/${task.id}`} className="text-[13px] font-normal text-[#0095E8] underline hover:text-[#0084CC]">
                            PAM-{task.id}
                          </Link>
                          {task.jenis_tugas === 'wo' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#7239EA] bg-[#F8E3FF] border border-[#E1D0FF] uppercase">WO</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#0095E8] bg-[#F1FAFF] border border-[#D1E9FF] uppercase">Checklist</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] text-[#3F4254] font-normal max-w-xs">
                          {task.nomor_perintah_kerja && <span>{task.nomor_perintah_kerja}: </span>}
                          {task.nama_tugas}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[12px] text-[#3F4254] font-medium">
                          {formatDate(task.tanggal_mulai)}
                          {task.waktu_mulai ? ` ${formatTime(task.waktu_mulai)}` : ''}
                          {(task.tanggal_selesai || task.waktu_selesai) ? ' - ' : ''}
                          {formatDate(task.tanggal_selesai) !== '-' ? formatDate(task.tanggal_selesai) : ''}
                          {task.waktu_selesai ? ` ${formatTime(task.waktu_selesai)}` : ''}
                        </div>
                        <div className="text-[11px] text-[#A1A5B7] mt-0.5">
                        {task.pengulangan ? `Berulang: ${task.jenis_pengulangan || 'Ya'}` : 'Tidak ada pengulangan Tugas'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[13px] text-[#7E8299] font-semibold">{companyName || '-'}</td>
                    <td className="px-6 py-5 text-[13px] text-[#7E8299] font-semibold">{task.departemen || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getUrgensiColor(task.urgensi)}`}>
                        {task.urgensi || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                            task.progres === 'Selesai' ? 'bg-[#E8FFF3] text-[#50CD89]' :
                            task.progres === 'Menunggu Material' ? 'bg-[#FFF8DD] text-[#FFC700]' :
                            'bg-[#F1FAFF] text-[#0095E8]'
                          }`}>
                            {task.progres === 'Menunggu Material' ? 'Menunggu Material' : 
                             (task.progres === 'Berlangsung' && task.catatan_pengerjaan && !task.waktu_material_dicek) ? 'Berlangsung (Catatan)' :
                             (task.progres || 'Terbuka')}
                            {task.progres === 'Selesai' && <CheckCircle size={14} className="ml-1 inline" />}
                          </span>
                          
                           {(task.catatan_material || task.catatan_pengerjaan) && task.progres !== 'Menunggu Approval' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                confirm(
                                  'Rincian Progres Tugas',
                                  <div className="text-left space-y-6">
                                    {task.catatan_pengerjaan && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                                          <Clock size={12} />
                                          Catatan Pengerjaan
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                          <p className="text-[13px] text-blue-800 leading-relaxed font-medium">
                                            {task.catatan_pengerjaan}
                                          </p>
                                        </div>
                                        <div className="text-[10px] text-slate-400 pl-1">
                                          Dilaporkan pada: {formatDate(task.waktu_catatan_pengerjaan)} {task.waktu_catatan_pengerjaan && formatTime(new Date(task.waktu_catatan_pengerjaan).toLocaleTimeString('en-GB'))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {task.catatan_material && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                                          <Info size={12} />
                                          Catatan Material
                                        </div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                          <p className="text-[13px] text-amber-800 leading-relaxed font-medium">
                                            {task.catatan_material}
                                          </p>
                                        </div>
                                        <div className="text-[10px] text-slate-400 pl-1">
                                          Dilaporkan pada: {formatDate(task.waktu_catatan_material)} {task.waktu_catatan_material && formatTime(new Date(task.waktu_catatan_material).toLocaleTimeString('en-GB'))}
                                        </div>
                                      </div>
                                    )}
                                  </div>,
                                  () => {},
                                  { confirmText: 'Tutup', showCancel: false }
                                );
                              }}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm border border-blue-100"
                              title="Lihat Rincian Progres"
                            >
                              <Info size={14} className="animate-pulse" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${getStatusBadge(task.status)}`}>
                        {task.status === 'Draft' ? 'Tidak aktif' : (task.status === 'Pending' ? 'Aktif' : (task.status || 'Aktif'))}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit button */}
                        {hasPermission(user, 'tugas_agen_ringkasan', 'Edit') && (
                          <div className="relative group">
                            <button
                              onClick={() => {
                                const canEdit = task.status !== 'Tidak aktif' && task.progres !== 'Selesai' && task.progres !== 'Berlangsung';
                                if (canEdit) navigate(`/tugas-agen/edit/${task.id}`);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                task.status === 'Tidak aktif' || task.progres === 'Selesai' || task.progres === 'Berlangsung'
                                  ? 'bg-[#F5F5F5] text-[#D0D0D0] cursor-not-allowed' 
                                  : 'bg-[#F9F9F9] text-[#7E8299] hover:text-[#0095E8] hover:bg-[#F1FAFF]'
                              }`}
                              title={
                                task.progres === 'Selesai' ? 'Tugas sudah selesai' :
                                task.progres === 'Berlangsung' ? 'Tugas sedang berlangsung' :
                                task.status === 'Tidak aktif' ? 'Aktifkan tugas terlebih dahulu' : 'Edit Tugas'
                              }
                            >
                              <Edit3 size={16} />
                            </button>
                            {(task.status === 'Tidak aktif' || task.progres === 'Selesai' || task.progres === 'Berlangsung') && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 w-max bg-[#333] text-white text-[10px] py-1.5 px-2.5 rounded z-50 shadow-md">
                                {task.progres === 'Selesai' ? 'Tugas sudah selesai' : 
                                 task.progres === 'Berlangsung' ? 'Tugas sedang berlangsung' : 
                                 'Aktifkan tugas terlebih dahulu'}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#333]"></div>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Toggle status button (Edit permission too) */}
                        {hasPermission(user, 'tugas_agen_ringkasan', 'Edit') && (
                          <div className="relative group">
                            <button
                              onClick={() => task.progres !== 'Selesai' && handleToggleStatus(task)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                task.progres === 'Selesai'
                                  ? 'bg-[#F5F5F5] text-[#D0D0D0] cursor-not-allowed'
                                  : task.status === 'Tidak aktif'
                                    ? 'bg-[#E8FFF3] text-[#50CD89] hover:bg-[#D0F5E0]'
                                    : 'bg-[#F9F9F9] text-[#7E8299] hover:text-[#F1416C] hover:bg-[#FFF5F8]'
                              }`}
                              title={
                                task.progres === 'Selesai' ? 'Tugas sudah selesai' :
                                task.status === 'Tidak aktif' ? 'Aktifkan Tugas' : 'Nonaktifkan Tugas'
                              }
                            >
                              <Power size={16} />
                            </button>
                            {task.progres === 'Selesai' && (
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 w-max bg-[#333] text-white text-[10px] py-1.5 px-2.5 rounded z-50 shadow-md">
                                Tugas sudah selesai
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#333]"></div>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Delete button */}
                        {hasPermission(user, 'tugas_agen_ringkasan', 'Hapus') && (
                          <div className="relative group">
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="w-8 h-8 rounded-lg bg-[#F9F9F9] flex items-center justify-center text-[#7E8299] hover:text-[#F1416C] hover:bg-[#FFF5F8] transition-all"
                              title="Hapus Tugas"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 pl-6 border-t border-[#F1F1F4] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-[#7E8299]">
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg outline-none text-[#3F4254] font-bold cursor-pointer transition-colors focus:border-[#0095E8]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
              <span>Baris per halaman</span>
            </div>
            <span className="text-[12px] text-[#A1A5B7]">
              Menampilkan {filteredTasks.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, filteredTasks.length)} dari {filteredTasks.length} tugas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded flex items-center justify-center text-[#7E8299] hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                  currentPage === page ? 'bg-[#0095E8] text-white' : 'text-[#7E8299] hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 rounded flex items-center justify-center text-[#7E8299] hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-[480px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-[17px] font-bold text-[#181C32]">Filter</h3>
              <button 
                onClick={() => {
                  console.log('Closing filter');
                  setIsFilterOpen(false);
                }} 
                className="text-[#A1A5B7] hover:text-[#3F4254] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 custom-scrollbar">
              {/* Filter Categories */}
              {[
                { id: 'urgensi', label: 'Urgensi', options: ['Normal', 'Sedang', 'Kritis'] },
                { id: 'progres', label: 'Progres Tugas', options: ['Terbuka', 'Berlangsung', 'Menunggu Persetujuan', 'Selesai'] },
                { id: 'perusahaan', label: 'Perusahaan', options: filterMetadata.companies.map(c => c.companyId || '').filter(Boolean) },
                { id: 'departemen', label: 'Departemen', options: filterMetadata.departments.map(d => d.name || '').filter(Boolean) },
                { id: 'agen', label: 'Agen', options: filterMetadata.agens.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean) },
                { id: 'template', label: 'Template', options: filterMetadata.templates.map(t => t.name || '').filter(Boolean) },
              ].map(cat => (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-semibold text-[#7E8299]">{cat.label}</label>
                    <button 
                      onClick={() => {
                        setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                        setFilterSearch('');
                      }} 
                      className={`transition-colors ${expandedCategory === cat.id ? 'text-[#0095E8]' : 'text-[#A1A5B7] hover:text-[#0095E8]'}`}
                    >
                      <Plus size={22} className={`transition-transform duration-200 ${expandedCategory === cat.id ? 'rotate-45' : ''}`} />
                    </button>
                  </div>
                  
                  {expandedCategory === cat.id && (
                    <div className="bg-[#F9F9F9] border border-[#F1F1F4] rounded-xl p-4 transition-all overflow-hidden">
                      {(cat.id === 'departemen' || cat.id === 'agen' || cat.id === 'template') && (
                        <div className="relative mb-3">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
                          <input 
                            type="text" 
                            placeholder="Cari..." 
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E6EF] rounded-lg text-xs outline-none focus:border-[#0095E8]"
                          />
                        </div>
                      )}
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {cat.options
                          .filter(opt => opt.toLowerCase().includes(filterSearch.toLowerCase()))
                          .map(opt => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                className="peer appearance-none w-4 h-4 border border-[#E4E6EF] rounded bg-white checked:bg-[#0095E8] checked:border-[#0095E8] transition-all"
                                checked={tempFilters[cat.id].includes(opt)}
                                onChange={(e) => {
                                  const list = [...tempFilters[cat.id]];
                                  if (e.target.checked) list.push(opt);
                                  else {
                                    const idx = list.indexOf(opt);
                                    if (idx > -1) list.splice(idx, 1);
                                  }
                                  setTempFilters({...tempFilters, [cat.id]: list});
                                }}
                              />
                              <CheckCircle size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <span className="text-[13px] font-medium text-[#3F4254] group-hover:text-[#0095E8] transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Tags Display */}
                  {tempFilters[cat.id].length > 0 && !expandedCategory && (
                    <div className="flex flex-wrap gap-2">
                      {tempFilters[cat.id].map(val => (
                        <span key={val} className="px-2.5 py-1 bg-[#F1FAFF] text-[#0095E8] rounded-lg text-[11px] font-bold flex items-center gap-1.5 border border-[#D1E9FF]">
                          {val}
                          <X 
                            size={12} 
                            className="cursor-pointer hover:text-[#0084CC]" 
                            onClick={() => {
                              const list = tempFilters[cat.id].filter(item => item !== val);
                              setTempFilters({...tempFilters, [cat.id]: list});
                            }}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Status Section */}
              <div className="space-y-3">
                <label className="text-[14px] font-semibold text-[#7E8299]">Status</label>
                <div className="flex items-center gap-8">
                  {['Aktif', 'Tidak aktif'].map(s => (
                    <label key={s} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center">
                        <input 
                          type="radio" 
                          name="filterStatus"
                          className="peer appearance-none w-5 h-5 border border-[#E4E6EF] rounded-full checked:border-[#0095E8] checked:border-4"
                          checked={tempFilters.status === s}
                          onChange={() => setTempFilters({...tempFilters, status: s})}
                        />
                      </div>
                      <span className="text-[13px] font-semibold text-[#3F4254]">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Section */}
              <div className="space-y-3">
                <label className="text-[14px] font-semibold text-[#7E8299]">Waktu Tugas</label>
                <CustomDateRangePicker 
                  value={tempFilters.dateRange}
                  onChange={(range) => setTempFilters({...tempFilters, dateRange: range})}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-4 border-t border-[#F1F1F4] flex gap-4">
              <button 
                onClick={() => {
                  const resetFilters = {
                    urgensi: [], progres: [], perusahaan: [], departemen: [], agen: [], template: [],
                    status: null, dateRange: { start: null, end: null }
                  };
                  setTempFilters(resetFilters);
                  setActiveFilters(resetFilters);
                  setIsFilterOpen(false);
                }}
                className="flex-1 py-3 border border-[#0095E8] rounded-xl text-[14px] font-bold text-[#0095E8] hover:bg-blue-50 transition-colors"
              >
                Atur Ulang
              </button>
              <button 
                onClick={() => {
                  setActiveFilters(tempFilters);
                  setIsFilterOpen(false);
                  setCurrentPage(1);
                }}
                className="flex-1 py-3 bg-[#0095E8]/40 rounded-xl text-[14px] font-bold text-white hover:bg-[#0095E8] transition-colors"
                style={{ backgroundColor: Object.keys(tempFilters).some(k => Array.isArray(tempFilters[k]) ? tempFilters[k].length > 0 : tempFilters[k] !== null && typeof tempFilters[k] !== 'object' || (tempFilters[k]?.start)) ? '#0095E8' : '' }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Warning Modal */}
      {showExportWarning && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-[400px] rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F8] flex items-center justify-center mb-6">
              <AlertCircle size={32} className="text-[#F1416C]" />
            </div>
            
            <h3 className="text-[18px] font-bold text-[#181C32] mb-3">Aktifkan Filter Waktu Tugas</h3>
            <p className="text-[14px] text-[#A1A5B7] leading-relaxed mb-8">
              Pilih rentang Waktu Tugas untuk mengunduh laporan.
            </p>
            
            <button 
              onClick={() => setShowExportWarning(false)}
              className="w-full py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors shadow-lg shadow-blue-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}



    </div>
  );
};

export default RingkasanList;
