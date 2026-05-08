import { authFetch } from './api';

// Session ID unique per browser tab session
let _sessionId = sessionStorage.getItem('pf_session_id');
if (!_sessionId) {
  _sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessionStorage.setItem('pf_session_id', _sessionId);
}

// Map of route paths -> human-readable page names (Indonesian)
const PAGE_NAMES = {
  '/': 'Halaman Login',
  '/dashboard': 'Dashboard Utama',
  '/pengguna/admin': 'Daftar Admin',
  '/pengguna/admin/create': 'Buat Admin Baru',
  '/pengguna/agen': 'Daftar Agen',
  '/pengguna/agen/create': 'Buat Agen Baru',
  '/tugas-agen/buat': 'Buat Checklist',
  '/tugas-agen/buat-wo': 'Buat Work Order',
  '/tugas-agen/ringkasan': 'Ringkasan Tugas',
  '/tugas-agen/persetujuan': 'Persetujuan Tugas',
  '/tugas-agen/draf': 'Draf Tugas',
  '/tugas-agen/upload': 'Upload Tugas',
  '/tugas-departemen/buat': 'Buat Checklist Departemen',
  '/tugas-departemen/buat-wo': 'Buat WO Departemen',
  '/tugas-departemen/diterima': 'WO Diterima',
  '/tugas-departemen/terkirim': 'WO Terkirim',
  '/pengaturan/organisasi': 'Pengaturan Organisasi',
  '/pengaturan/perusahaan': 'Pengaturan Perusahaan',
  '/pengaturan/departemen': 'Pengaturan Departemen',
  '/pengaturan/hak-akses': 'Pengaturan Hak Akses',
  '/pengaturan/template-tugas': 'Template Tugas',
  '/pengaturan/audit-log': 'Audit Log',
  '/pengaturan/ganti-pin': 'Permintaan Ganti PIN',
  '/pengaturan/ubah-password': 'Ubah Password',
  '/profile/user': 'Profil Pengguna',
  // Mobile routes
  '/demo/mobile': 'Mobile - Beranda',
  '/demo/mobile/tasks': 'Mobile - Tugas',
  '/demo/mobile/notifications': 'Mobile - Notifikasi',
  '/demo/mobile/profile': 'Mobile - Profil',
  '/demo/mobile/approvals': 'Mobile - Persetujuan',
};

const getPageName = (pathname) => {
  // Exact match first
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];

  // Pattern matching for dynamic routes
  if (/^\/pengguna\/admin\/detail\/\d+/.test(pathname)) return 'Detail Admin';
  if (/^\/pengguna\/admin\/edit\/\d+/.test(pathname)) return 'Edit Admin';
  if (/^\/pengguna\/agen\/detail\/\d+/.test(pathname)) return 'Detail Agen';
  if (/^\/pengguna\/agen\/edit\/\d+/.test(pathname)) return 'Edit Agen';
  if (/^\/tugas-agen\/detail\/\d+/.test(pathname)) return 'Detail Tugas Agen';
  if (/^\/tugas-agen\/edit\/\d+/.test(pathname)) return 'Edit Tugas';
  if (/^\/tugas-departemen\/diterima\/\d+/.test(pathname)) return 'Detail WO Diterima';
  if (/^\/tugas-departemen\/terkirim\/\d+/.test(pathname)) return 'Detail WO Terkirim';
  if (/^\/pengaturan\/departemen\/detail\/\d+/.test(pathname)) return 'Detail Departemen';
  if (/^\/pengaturan\/template-tugas\/detail\/\d+/.test(pathname)) return 'Detail Template Tugas';
  if (/^\/demo\/mobile\/task\/[^/]+\/form/.test(pathname)) return 'Mobile - Form Laporan Tugas';
  if (/^\/demo\/mobile\/task\/[^/]+/.test(pathname)) return 'Mobile - Detail Tugas';
  if (/^\/demo\/mobile\/dept-task\/[^/]+/.test(pathname)) return 'Mobile - Detail WO Departemen';
  if (/^\/demo\/mobile\/approval\/[^/]+/.test(pathname)) return 'Mobile - Detail Persetujuan';

  return `Halaman: ${pathname}`;
};

let _lastTrackedPath = null;

/**
 * Track a page view. Call this on route change.
 */
export const trackPageView = async (pathname) => {
  // Debounce: don't log same page twice in a row
  if (pathname === _lastTrackedPath) return;
  _lastTrackedPath = pathname;

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return; // Only track authenticated users

  const pageName = getPageName(pathname);

  try {
    // Fire and forget — never block the UI
    authFetch('/api/audit/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_url: pathname,
        page_name: pageName,
        session_id: _sessionId
      })
    }).catch(() => {}); // Swallow errors silently
  } catch (e) {
    // Never throw
  }
};

/**
 * Log logout action to backend before clearing session.
 */
export const trackLogout = async (userName) => {
  try {
    await authFetch('/api/logout', {
      method: 'POST',
      body: JSON.stringify({ user_name: userName })
    });
  } catch (e) {
    // Silent fail
  }
};

export const getSessionId = () => _sessionId;
