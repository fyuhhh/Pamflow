import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const LoadingScreen = ({ brand = "PamFlow", logoLetter = "P", variant = "mobile" }) => {
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = [
    "Mengautentikasi akun aman...",
    "Menghubungkan ke server pusat...",
    "Memeriksa enkripsi data...",
    "Sinkronisasi data departemen...",
    "Menyiapkan dashboard Anda..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const isDesktop = variant === 'desktop';

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${isDesktop ? 'bg-[#0F172A]' : 'bg-[#0D1117]'}`}>
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] ${isDesktop ? 'bg-[#3B82F6]' : 'bg-[#0095E8]'} opacity-10 blur-[120px] rounded-full animate-pulse-slow`}></div>
        <div className={`absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] ${isDesktop ? 'bg-[#6366F1]' : 'bg-[#00C9A7]'} opacity-10 blur-[100px] rounded-full animate-pulse-slow delay-[2000ms]`}></div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center">
        {/* Spinner/Orb */}
        <div className="relative w-24 h-24 mb-10">
          <div className={`absolute inset-0 rounded-full border-4 ${isDesktop ? 'border-t-[#3B82F6]' : 'border-t-[#0095E8]'} border-r-transparent border-b-transparent border-l-transparent animate-spin`}></div>
          <div className={`absolute inset-2 rounded-full border-2 ${isDesktop ? 'border-r-[#6366F1]' : 'border-r-[#00C9A7]'} border-t-transparent border-b-transparent border-l-transparent animate-spin-reverse opacity-50`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Logo className="w-14 h-14 animate-pulse" />
          </div>
        </div>

        {/* Text Container */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
             <div className="flex items-baseline">
                <span className="text-white font-bold text-3xl tracking-[2px] uppercase">{brand}</span>
              </div>
          </div>
          
          <div className="h-6 overflow-hidden">
            <p className="text-[#A1A5B7] text-sm font-medium tracking-wide animate-fade-in-up">
              {statuses[statusIndex]}
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className={`mt-8 ${isDesktop ? 'w-64' : 'w-48'} h-1.5 bg-[#1E1E2D] rounded-full overflow-hidden shadow-inner mx-auto`}>
            <div 
              className={`h-full bg-gradient-to-r ${isDesktop ? 'from-[#3B82F6] to-[#6366F1]' : 'from-[#0095E8] to-[#00C9A7]'} transition-all duration-500 ease-out`}
              style={{ width: `${((statusIndex + 1) / statuses.length) * 100}%` }}
            ></div>
          </div>
          
          <p className="mt-5 text-[10px] text-[#494B74] uppercase tracking-[6px] font-bold opacity-80">
            {isDesktop ? 'Enterprise Initialization' : 'System Initialization'}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default LoadingScreen;
