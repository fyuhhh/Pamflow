import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Calendar, User, Monitor, Globe, Info,
  ChevronLeft, ChevronRight, Filter, Eye, Clock,
  Smartphone, Laptop, Tablet, LogIn, LogOut, Navigation,
  AlertCircle, CheckCircle, Edit3, Trash2, Plus, X, RefreshCw
} from 'lucide-react';
import { authFetch } from '../services/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, total_pages: 1 });
  const [filters, setFilters] = useState({ entity_type: '', action: '', search: '', date_from: '', date_to: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/audit-logs?page=${page}&limit=${pagination.limit}`;
      if (filters.entity_type) url += `&entity_type=${filters.entity_type}`;
      if (filters.action) url += `&action=${filters.action}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;

      const response = await authFetch(url);
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data);
        setPagination(prev => ({ ...prev, ...result.pagination, page }));
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchLogs(1); }, [filters.entity_type, filters.action, filters.search]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionConfig = (action) => {
    const a = action?.toUpperCase();
    if (a === 'LOGIN') return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: LogIn, label: 'Login' };
    if (a === 'LOGOUT') return { color: 'bg-slate-100 text-slate-600 border-slate-200', Icon: LogOut, label: 'Logout' };
    if (a === 'LOGIN_FAILED') return { color: 'bg-red-100 text-red-700 border-red-200', Icon: AlertCircle, label: 'Gagal Login' };
    if (a === 'PAGE_VIEW') return { color: 'bg-blue-100 text-blue-600 border-blue-200', Icon: Navigation, label: 'Navigasi' };
    if (a === 'CREATE') return { color: 'bg-teal-100 text-teal-700 border-teal-200', Icon: Plus, label: 'Buat' };
    if (a === 'UPDATE' || a === 'UPDATE_STATUS') return { color: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Edit3, label: 'Edit' };
    if (a === 'DELETE') return { color: 'bg-rose-100 text-rose-700 border-rose-200', Icon: Trash2, label: 'Hapus' };
    if (a === 'APPROVE') return { color: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle, label: 'Setujui' };
    if (a === 'REJECT') return { color: 'bg-orange-100 text-orange-700 border-orange-200', Icon: X, label: 'Tolak' };
    if (a === 'AGENT_START') return { color: 'bg-purple-100 text-purple-700 border-purple-200', Icon: CheckCircle, label: 'Mulai' };
    if (a === 'AGENT_FINISH') return { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', Icon: CheckCircle, label: 'Selesai' };
    return { color: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Info, label: action || '-' };
  };

  const getDeviceIcon = (deviceBrand, ua) => {
    const b = (deviceBrand || '').toLowerCase();
    const u = (ua || '').toLowerCase();
    if (b === 'apple' && (u.includes('iphone') || u.includes('ipad'))) return <Smartphone size={14} className="text-slate-400" />;
    if (u.includes('android') || u.includes('mobile')) return <Smartphone size={14} className="text-slate-400" />;
    return <Laptop size={14} className="text-slate-400" />;
  };

  const getEntityTypeLabel = (type) => {
    const map = { auth: '🔐 Auth', navigation: '🧭 Navigasi', task: '📋 Tugas', user: '👤 Pengguna', department: '🏢 Departemen', organization: '🏛️ Organisasi', template: '📄 Template' };
    return map[type?.toLowerCase()] || type;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Log Lengkap</h2>
          <p className="text-slate-500 text-sm mt-1">Lacak semua aktivitas pengguna — login, navigasi halaman, perubahan data, dan perangkat yang digunakan</p>
        </div>
        <button onClick={() => fetchLogs(pagination.page)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama pengguna, halaman, catatan..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-[#0095E8] text-white rounded-xl text-sm font-bold hover:bg-[#0084CC]">Cari</button>
        </form>

        {/* Entity Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer"
            value={filters.entity_type}
            onChange={(e) => setFilters(prev => ({ ...prev, entity_type: e.target.value }))}
          >
            <option value="">Semua Modul</option>
            <option value="auth">🔐 Autentikasi (Login/Logout)</option>
            <option value="navigation">🧭 Navigasi Halaman</option>
            <option value="task">📋 Tugas</option>
            <option value="user">👤 Pengguna</option>
            <option value="department">🏢 Departemen</option>
            <option value="template">📄 Template</option>
          </select>
        </div>

        {/* Action Filter */}
        <div className="relative">
          <select
            className="pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer"
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
          >
            <option value="">Semua Aksi</option>
            <option value="LOGIN">Login Berhasil</option>
            <option value="LOGOUT">Logout</option>
            <option value="LOGIN_FAILED">Gagal Login</option>
            <option value="PAGE_VIEW">Kunjungi Halaman</option>
            <option value="CREATE">Buat Data</option>
            <option value="UPDATE">Edit Data</option>
            <option value="DELETE">Hapus Data</option>
            <option value="APPROVE">Setujui</option>
            <option value="REJECT">Tolak</option>
          </select>
        </div>

        {filters.entity_type || filters.action || filters.search ? (
          <button onClick={() => { setFilters({ entity_type: '', action: '', search: '', date_from: '', date_to: '' }); setSearchInput(''); }}
            className="px-3 py-2.5 text-sm text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1">
            <X size={14} /> Reset Filter
          </button>
        ) : null}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Aktivitas', value: pagination.total, color: 'bg-blue-50 text-blue-700', icon: '📊' },
          { label: 'Login Hari Ini', value: logs.filter(l => l.action === 'LOGIN').length, color: 'bg-emerald-50 text-emerald-700', icon: '🔐' },
          { label: 'Navigasi Halaman', value: logs.filter(l => l.action === 'PAGE_VIEW').length, color: 'bg-purple-50 text-purple-700', icon: '🧭' },
          { label: 'Perubahan Data', value: logs.filter(l => ['CREATE','UPDATE','DELETE','UPDATE_STATUS'].includes(l.action)).length, color: 'bg-amber-50 text-amber-700', icon: '✏️' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl p-4 flex items-center gap-3 ${stat.color} border border-current border-opacity-20`}>
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs font-medium opacity-70">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna & Waktu</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Modul / Halaman</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perangkat</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-5 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <div className="text-slate-500 font-medium">Tidak ada log aktivitas ditemukan</div>
                    <div className="text-slate-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const { color, Icon, label } = getActionConfig(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* User & Time */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(log.user_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-700 text-sm leading-tight">{log.user_name || '-'}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock size={9} /> {formatDate(log.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${color}`}>
                          <Icon size={11} />
                          {log.action_label || label}
                        </span>
                      </td>

                      {/* Module / Page */}
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-slate-600 leading-tight">{getEntityTypeLabel(log.entity_type)}</div>
                        {log.page_url && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-[180px]" title={log.page_url}>
                            {log.page_url}
                          </div>
                        )}
                        {log.notes && !log.page_url && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={log.notes}>
                            {log.notes}
                          </div>
                        )}
                      </td>

                      {/* Device */}
                      <td className="px-5 py-3.5">
                        {(log.device_name || log.device_brand || log.browser) ? (
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(log.device_brand, log.user_agent)}
                            <div>
                              <div className="text-[12px] font-semibold text-slate-600 leading-tight">
                                {log.device_name || log.device_brand || '—'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {[log.browser, log.os].filter(Boolean).join(' · ') || '—'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">data lama</span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Globe size={12} className="text-slate-300 shrink-0" />
                          {log.ip_address || '-'}
                        </div>
                      </td>

                      {/* Detail Button */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="text-slate-800 font-bold">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> –{' '}
            <span className="text-slate-800 font-bold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{' '}
            <span className="text-slate-800 font-bold">{pagination.total}</span> entri
          </div>
          <div className="flex gap-2">
            <button disabled={pagination.page <= 1 || loading} onClick={() => fetchLogs(pagination.page - 1)}
              className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition-all shadow-sm text-sm font-medium flex items-center gap-1">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg">
              {pagination.page} / {pagination.total_pages}
            </span>
            <button disabled={pagination.page >= pagination.total_pages || loading} onClick={() => fetchLogs(pagination.page + 1)}
              className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition-all shadow-sm text-sm font-medium flex items-center gap-1">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (() => {
        const { color, Icon } = getActionConfig(selectedLog.action);
        return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Detail Aktivitas</h3>
                    <p className="text-xs text-slate-400">ID #{selectedLog.id} · {formatDate(selectedLog.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Identity */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Pengguna', value: selectedLog.user_name || '-', icon: '👤' },
                    { label: 'Aksi', value: selectedLog.action_label || selectedLog.action, icon: '⚡' },
                    { label: 'Modul', value: getEntityTypeLabel(selectedLog.entity_type), icon: '📦' },
                    { label: 'IP Address', value: selectedLog.ip_address || '-', icon: '🌐' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{icon} {label}</div>
                      <div className="text-sm font-semibold text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Device Info */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">📱 Informasi Perangkat</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-400 text-xs">Brand:</span> <span className="font-semibold text-slate-700 ml-1">{selectedLog.device_brand || '-'}</span></div>
                    <div><span className="text-slate-400 text-xs">Perangkat:</span> <span className="font-semibold text-slate-700 ml-1">{selectedLog.device_name || '-'}</span></div>
                    <div><span className="text-slate-400 text-xs">Browser:</span> <span className="font-semibold text-slate-700 ml-1">{selectedLog.browser || '-'}</span></div>
                    <div><span className="text-slate-400 text-xs">Sistem Operasi:</span> <span className="font-semibold text-slate-700 ml-1">{selectedLog.os || '-'}</span></div>
                  </div>
                </div>

                {/* Page & Session */}
                {(selectedLog.page_url || selectedLog.session_id) && (
                  <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3">🧭 Navigasi & Sesi</div>
                    {selectedLog.page_url && <div className="text-sm"><span className="text-slate-400 text-xs">URL Halaman:</span> <span className="font-semibold text-slate-700 ml-1 font-mono text-xs">{selectedLog.page_url}</span></div>}
                    {selectedLog.session_id && <div className="text-sm mt-2"><span className="text-slate-400 text-xs">Session ID:</span> <span className="font-mono text-xs text-slate-500 ml-1">{selectedLog.session_id}</span></div>}
                  </div>
                )}

                {/* Notes */}
                {selectedLog.notes && (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">📝 Catatan</div>
                    <p className="text-sm text-slate-700">{selectedLog.notes}</p>
                  </div>
                )}

                {/* Data Changes */}
                {(selectedLog.old_value || selectedLog.new_value) && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">📊 Perubahan Data</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
                        <div className="text-[10px] font-bold text-rose-400 uppercase mb-2">Data Lama</div>
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono break-all max-h-[150px] overflow-y-auto">
                          {selectedLog.old_value ? (selectedLog.old_value.startsWith('{') ? JSON.stringify(JSON.parse(selectedLog.old_value), null, 2) : selectedLog.old_value) : '—'}
                        </pre>
                      </div>
                      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                        <div className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Data Baru</div>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono break-all max-h-[150px] overflow-y-auto">
                          {selectedLog.new_value ? (selectedLog.new_value.startsWith('{') ? JSON.stringify(JSON.parse(selectedLog.new_value), null, 2) : selectedLog.new_value) : '—'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw UA */}
                <details className="text-xs text-slate-400 cursor-pointer">
                  <summary className="font-semibold text-slate-500 hover:text-slate-700 transition-colors">Lihat Raw User-Agent String</summary>
                  <div className="mt-2 bg-slate-50 p-3 rounded-xl font-mono break-all border border-slate-200 text-slate-500 select-all">
                    {selectedLog.user_agent || 'Tidak tersedia'}
                  </div>
                </details>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedLog(null)} className="px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-all active:scale-[0.98]">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AuditLog;
