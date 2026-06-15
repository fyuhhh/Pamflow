import React, { useState, useEffect } from 'react';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';

const ConnectionGuard = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBuffering, setIsBuffering] = useState(true);

  // Simulasi buffering saat aplikasi pertama kali dibuka
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsBuffering(false);
    }, 1500); // Buffering 1.5 detik

    return () => clearTimeout(timer);
  }, []);

  // Listen perubahan status jaringan
  useEffect(() => {
    const handleOnline = () => {
      // Saat koneksi kembali, pura-pura buffering sebentar lalu masuk
      setIsBuffering(true);
      setTimeout(() => {
        setIsOnline(true);
        setIsBuffering(false);
      }, 1000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTryAgain = () => {
    setIsBuffering(true);
    // Cek ulang jaringan setelah 1.5 detik (animasi loading)
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsBuffering(false);
    }, 1500);
  };

  // Tampilan layar loading (buffering)
  if (isBuffering) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">Menyambungkan...</h2>
        <p className="text-gray-500 text-sm">Memeriksa koneksi jaringan Anda</p>
      </div>
    );
  }

  // Tampilan layar diblokir (offline)
  if (!isOnline) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Koneksi</h2>
        <p className="text-gray-500 mb-8 max-w-[280px]">
          Aplikasi tidak bisa terhubung. Anda membutuhkan jaringan internet yang aktif untuk melanjutkan.
        </p>
        <button
          onClick={handleTryAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200"
        >
          <RefreshCw className="w-5 h-5" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // Jika online dan selesai buffering, tampilkan isi aplikasi
  return children;
};

export default ConnectionGuard;
