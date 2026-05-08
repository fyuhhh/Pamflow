import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, Trash2, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, RefreshCw, X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import CustomDateRangePicker from './CustomDateRangePicker';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { authFetch } from '../services/api';
import { hasPermission } from '../utils/permissions';

import { useModal } from '../context/ModalContext';

const TerkirimList = () => {
  const navigate = useNavigate();
  const { confirm, success, error: showError } = useModal();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jenisTugasFilter, setJenisTugasFilter] = useState('Semua');

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
    status: [],
    perusahaan: [],
    departemen_asal: [],
    departemen_tujuan: [],
    dateRange: { start: null, end: null }
  });

  const [tempFilters, setTempFilters] = useState({...activeFilters});
  const [showExportWarning, setShowExportWarning] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [resComp, resDept] = await Promise.all([
        authFetch('/api/companies'),
        authFetch('/api/departments')
      ]);

      const [companies, departments] = await Promise.all([
        resComp.ok ? resComp.json() : [],
        resDept.ok ? resDept.json() : []
      ]);

      setFilterMetadata(prev => ({ ...prev, companies, departments }));
    } catch (err) {
      console.error('Error fetching filter metadata:', err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const company_id = user?.company_id;
      const response = await authFetch(`/api/department-tasks${company_id ? `?company_id=${company_id}` : ''}`);
      if (response.ok) {
        let data = await response.json();

        // Restriction: Only show tasks where user's department is the sender (asal)
        const isSuperAdmin = ['Super Admin', 'L1 - Super Admin', 'L1 - Superadmin', 'L1 - Admin Organization'].includes(user?.role);
        if (!isSuperAdmin && user?.department) {
          const userDept = user.department.toLowerCase().trim();
          data = data.filter(task => 
            (task.departemen_asal || '').toLowerCase().trim() === userDept
          );
        }

        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching department tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLaporan = async () => {
    // 1. Validation check - must choose date first
    if (!activeFilters.dateRange.start || !activeFilters.dateRange.end) {
      setShowExportWarning(true);
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Laporan Tugas Terkirim');

      // Define standard columns
      worksheet.columns = [
        { header: 'No', key: 'no', width: 8 },
        { header: 'ID Tugas', key: 'id_tugas', width: 20 },
        { header: 'Nama Tugas', key: 'nama_tugas', width: 40 },
        { header: 'Urgensi', key: 'urgensi', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Departemen Asal', key: 'dept_asal', width: 25 },
        { header: 'Departemen Tujuan', key: 'dept_tujuan', width: 25 },
        { header: 'Perusahaan', key: 'perusahaan', width: 25 },
        { header: 'Nama Peminta', key: 'peminta', width: 25 },
        { header: 'Tanggal Permintaan', key: 'tanggal', width: 25 }
      ];

      // Styling Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, name: 'Calibri', size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 30;
      
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      });

      // Add Data
      filteredTasks.forEach((task, index) => {
        const rowData = {
          no: index + 1,
          id_tugas: `${task.jenis_tugas === 'checklist' ? 'CHK' : 'WO'}-${task.dept_id_asal || task.departemen_asal?.substring(0, 3).toUpperCase() || 'GEN'}${String(task.id).padStart(5, '0')}`,
          nama_tugas: task.nama_wo,
          urgensi: task.urgensi || 'Normal',
          status: task.status || 'Baru',
          dept_asal: task.departemen_asal || '-',
          dept_tujuan: task.departemen_tujuan || '-',
          perusahaan: task.perusahaan || '-',
          peminta: task.nama_peminta || '-',
          tanggal: formatDate(task.created_at)
        };

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
      const filename = `Laporan_Tugas_Terkirim_${activeFilters.dateRange.start}_to_${activeFilters.dateRange.end}.xlsx`;
      saveAs(new Blob([buffer]), filename);
      
      showToast('Laporan berhasil diunduh!');
    } catch (err) {
      console.error('Error generating excel:', err);
      showToast('Gagal mengunduh laporan.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Baru': return 'bg-[#F1FAFF] text-[#0095E8]';
      case 'Diterima': return 'bg-[#F8E3FF] text-[#7239EA]';
      case 'Menunggu Pengerjaan': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Berlangsung': return 'bg-[#FFF8DD] text-[#FFC700]';
      case 'Selesai': return 'bg-[#E8FFF3] text-[#50CD89]';
      case 'Ditolak': return 'bg-[#FFF5F8] text-[#F1416C]';
      default: return 'bg-[#F1FAFF] text-[#0095E8]';
    }
  };

  const getUrgensiColor = (urgensi) => {
    switch (urgensi) {
      case 'Kritis': return 'text-[#F1416C]';
      case 'Sedang': return 'text-[#FFAD0F]';
      default: return 'text-[#0095E8]';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${mins}`;
    } catch { return '-'; }
  };

  const filteredTasks = tasks
    .filter(task => {
      // Search term filter
      const matchesSearch = (task.nama_wo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(task.id).includes(searchTerm);
      
      if (!matchesSearch) return false;

      // Urgensi filter
      if (activeFilters.urgensi.length > 0 && !activeFilters.urgensi.includes(task.urgensi || 'Normal')) return false;

      // Status filter
      if (activeFilters.status.length > 0 && !activeFilters.status.includes(task.status || 'Baru')) return false;

      // Perusahaan filter
      if (activeFilters.perusahaan.length > 0 && !activeFilters.perusahaan.includes(task.perusahaan)) return false;

      // Departemen Asal filter
      if (activeFilters.departemen_asal.length > 0 && !activeFilters.departemen_asal.includes(task.departemen_asal)) return false;

      // Departemen Tujuan filter
      if (activeFilters.departemen_tujuan.length > 0 && !activeFilters.departemen_tujuan.includes(task.departemen_tujuan)) return false;

      // Date Range filter
      if (activeFilters.dateRange.start && activeFilters.dateRange.end) {
        const taskDate = new Date(task.created_at);
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

  const handleDelete = (id) => {
    confirm(
      'Hapus Tugas',
      'Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const response = await authFetch(`/api/department-tasks/${id}`, { method: 'DELETE' });
          if (response.ok) {
            success('Berhasil', 'Tugas berhasil dihapus');
            fetchTasks();
          } else {
            showError('Gagal', 'Gagal menghapus tugas');
          }
        } catch (err) {
          console.error('Delete error:', err);
          showError('Kesalahan Jaringan', 'Terjadi kesalahan saat menghubungi server');
        }
      }
    );
  };

  const renderSortIcon = () => (
    <ChevronsUpDown size={11} className="inline ml-0.5 text-[#C4C4C4]" />
  );

  return (
    <div className="p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A5B7]" />
            <input
              type="text"
              placeholder="Cari ID, nama WO"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 border border-[#E4E6EF] rounded-lg text-[13px] bg-white outline-none focus:border-[#0095E8] w-[220px] transition-colors"
            />
          </div>
          <button 
            onClick={() => { setTempFilters({...activeFilters}); setIsFilterOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-[13px] font-semibold transition-colors ${
              Object.keys(activeFilters).some(k => Array.isArray(activeFilters[k]) ? activeFilters[k].length > 0 : (activeFilters[k]?.start))
                ? 'border-[#0095E8] bg-[#F1FAFF] text-[#0095E8]' 
                : 'border-[#E4E6EF] text-[#7E8299] hover:bg-gray-50'
            }`}
          >
            <Filter size={14} /> Filter
          </button>

          <button onClick={fetchTasks} className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E6EF] rounded-lg text-[13px] text-[#7E8299] font-semibold hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>

          {/* Task Type Filter Buttons */}
          <div className="flex items-center bg-[#F9F9F9] border border-[#E4E6EF] rounded-lg p-1 gap-1">
            <button 
              onClick={() => { setJenisTugasFilter('Semua'); setCurrentPage(1); }}
              className={`px-4 py-1 rounded-md text-[12px] font-bold transition-all ${jenisTugasFilter === 'Semua' ? 'bg-white text-[#3F4254] shadow-sm' : 'text-[#A1A5B7] hover:text-[#3F4254]'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => { setJenisTugasFilter('WO'); setCurrentPage(1); }}
              className={`px-4 py-1 rounded-md text-[12px] font-bold transition-all ${jenisTugasFilter === 'WO' ? 'bg-white text-[#7239EA] shadow-sm' : 'text-[#A1A5B7] hover:text-[#7239EA]'}`}
            >
              WO
            </button>
            <button 
              onClick={() => { setJenisTugasFilter('Checklist'); setCurrentPage(1); }}
              className={`px-4 py-1 rounded-md text-[12px] font-bold transition-all ${jenisTugasFilter === 'Checklist' ? 'bg-white text-[#0095E8] shadow-sm' : 'text-[#A1A5B7] hover:text-[#0095E8]'}`}
            >
              Checklist
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission(user, 'tugas_dept_terkirim', 'Download') && (
            <button 
              onClick={handleDownloadLaporan}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#0095E8] rounded-lg text-[13px] text-[#0095E8] font-bold hover:bg-[#F1FAFF] transition-colors"
            >
              <Download size={14} /> Download Laporan
            </button>
          )}
          <button 
            onClick={() => navigate('/tugas-departemen/buat')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F1FAFF] border border-[#0095E8]/20 rounded-lg text-[13px] text-[#0095E8] font-bold hover:bg-[#E1F0FF] transition-colors"
          >
            <Plus size={14} /> Buat Checklist
          </button>
          <button 
            onClick={() => navigate('/tugas-departemen/buat-wo')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0095E8] rounded-lg text-[13px] text-white font-bold hover:bg-[#0084CC] transition-colors"
          >
            <Plus size={14} /> Buat WO
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#F1F1F4] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFF2F5] bg-[#F9F9F9]">
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider w-[50px]">No</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">
                  ID Tugas {renderSortIcon()}
                </th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[200px]">Nama Tugas {renderSortIcon()}</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[100px]">Urgensi</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[120px]">Status</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Departemen Asal</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Departemen Tujuan</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Perusahaan</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[150px]">Nama Peminta</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider min-w-[180px]">Tanggal Permintaan {renderSortIcon()}</th>
                <th className="px-6 py-5 text-[11px] font-semibold text-[#A1A5B7] uppercase tracking-wider text-right w-[80px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-16 text-center text-[#A1A5B7] text-sm italic">Memuat data...</td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-20 text-center text-[#7E8299] text-[14px] font-medium">
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, index) => (
                  <tr key={task.id} className="border-b border-[#EFF2F5] hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-6 py-5 text-[13px] text-[#3F4254]">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <Link to={`/tugas-departemen/terkirim/${task.id}`} className="text-[13px] font-normal text-[#0095E8] underline hover:text-[#0084CC] mb-1">
                          {task.jenis_tugas === 'checklist' ? 'CHK' : 'WO'}-{task.dept_id_asal || task.departemen_asal?.substring(0, 3).toUpperCase() || 'GEN'}{String(task.id).padStart(5, '0')}
                        </Link>
                        <span className={`w-fit px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          task.jenis_tugas === 'checklist' 
                            ? 'bg-[#F1FAFF] text-[#0095E8] border border-[#0095E8]/20' 
                            : 'bg-[#F8E3FF] text-[#7239EA] border border-[#7239EA]/20'
                        }`}>
                          {task.jenis_tugas || 'WO'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#181C32]">
                      <div className="line-clamp-1 max-w-[250px]">{task.nama_wo}</div>
                      <div className="text-[10px] text-[#A1A5B7] mt-0.5">{task.jenis_tugas === 'checklist' ? 'Checklist' : 'Work Order'}</div>
                    </td>

                    <td className="px-6 py-5">
                      <span className={`text-[12px] font-semibold ${getUrgensiColor(task.urgensi)}`}>
                        {task.urgensi || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getStatusBadge(task.status)}`}>
                        {task.status || 'Baru'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[12px] text-[#7E8299]">{task.departemen_asal || '-'}</td>
                    <td className="px-6 py-5 text-[12px] text-[#7E8299] font-medium">{task.departemen_tujuan || '-'}</td>
                    <td className="px-6 py-5 text-[12px] text-[#7E8299]">{task.perusahaan || '-'}</td>
                    <td className="px-6 py-5 text-[12px] text-[#3F4254]">{task.nama_peminta || '-'}</td>

                    <td className="px-6 py-5 text-[12px] text-[#7E8299]">{formatDate(task.created_at)}</td>


                    <td className="px-6 py-5 text-right">
                      {hasPermission(user, 'tugas_dept_terkirim', 'Hapus') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                          className="text-[#A1A5B7] hover:text-[#F1416C] transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <div className="px-5 py-3 border-t border-[#EFF2F5] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] text-[#7E8299]">
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-[#F9F9F9] border border-[#F1F1F4] rounded-lg outline-none text-[#3F4254] font-bold text-[12px] cursor-pointer transition-colors focus:border-[#0095E8]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] pointer-events-none" />
              </div>
              <span className="text-[12px]">Baris per halaman</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded flex items-center justify-center text-[#7E8299] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded flex items-center justify-center text-[12px] font-bold transition-colors ${
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
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-[480px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <h3 className="text-[17px] font-bold text-[#181C32]">Filter</h3>
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="text-[#A1A5B7] hover:text-[#3F4254] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 custom-scrollbar text-left">
              {/* Filter Categories */}
              {[
                { id: 'urgensi', label: 'Urgensi', options: ['Normal', 'Sedang', 'Kritis'] },
                { id: 'status', label: 'Status', options: ['Baru', 'Diterima', 'Menunggu Pengerjaan', 'Berlangsung', 'Selesai', 'Ditolak'] },
                { id: 'perusahaan', label: 'Perusahaan', options: filterMetadata.companies.map(c => c.name || c.companyId || '').filter(Boolean) },
                { id: 'departemen_asal', label: 'Departemen Asal', options: filterMetadata.departments.map(d => d.name || '').filter(Boolean) },
                { id: 'departemen_tujuan', label: 'Departemen Tujuan', options: filterMetadata.departments.map(d => d.name || '').filter(Boolean) },
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
                      {(cat.id === 'perusahaan' || cat.id.includes('departemen')) && (
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

              {/* Date Range Section */}
              <div className="space-y-3">
                <label className="text-[14px] font-semibold text-[#7E8299]">Waktu Permintaan</label>
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
                    urgensi: [], status: [], perusahaan: [], departemen_asal: [], departemen_tujuan: [],
                    dateRange: { start: null, end: null }
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
                className="flex-1 py-3 bg-[#0095E8] rounded-xl text-[14px] font-bold text-white hover:bg-[#0084CC] transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Export Warning Modal */}
      {showExportWarning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-[400px] rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={40} className="text-amber-500" />
            </div>
            
            <h3 className="text-[18px] font-bold text-[#181C32] mb-3">Aktifkan Filter Waktu Tugas</h3>
            <p className="text-[14px] text-[#A1A5B7] leading-relaxed mb-8">
              Pilih rentang Waktu Permintaan untuk mengunduh laporan.
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

export default TerkirimList;
