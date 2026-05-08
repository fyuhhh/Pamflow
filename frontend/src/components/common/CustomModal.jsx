import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const CustomModal = ({ 
  show, 
  onClose, 
  type = 'info', // 'success', 'error', 'warning', 'confirm'
  title, 
  message, 
  onConfirm, 
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  loading = false 
}) => {
  if (!show) return null;

  const icons = {
    success: <CheckCircle className="w-16 h-16 text-[#50CD89]" />,
    error: <XCircle className="w-16 h-16 text-[#F1416C]" />,
    warning: <AlertTriangle className="w-16 h-16 text-[#FFC700]" />,
    confirm: <AlertTriangle className="w-16 h-16 text-[#0095E8]" />
  };

  const bgColors = {
    success: 'bg-[#E8FFF3]',
    error: 'bg-[#FFF5F8]',
    warning: 'bg-[#FFF8DD]',
    confirm: 'bg-[#F1FAFF]'
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={type !== 'confirm' ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-[450px] mx-auto my-6 animate-in fade-in zoom-in duration-200">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-2xl shadow-2xl outline-none focus:outline-none overflow-hidden">
          
          {/* Header (Optional Close Button) */}
          {type !== 'confirm' && (
            <button 
              className="absolute top-4 right-4 p-2 text-[#A1A5B7] hover:text-[#3F4254] hover:bg-gray-100 rounded-full transition-all z-10"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}

          {/* Body */}
          <div className="relative p-10 flex-auto text-center">
            {/* Icon */}
            <div className={`mx-auto w-24 h-24 rounded-full ${bgColors[type]} flex items-center justify-center mb-6 animate-bounce-subtle`}>
              {icons[type]}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-[#181C32] mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-[14px] text-[#7E8299] leading-relaxed mb-8">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {type === 'confirm' ? (
                <div className="flex items-center gap-3">
                  <button
                    className="flex-1 px-6 py-3 bg-[#F5F8FA] text-[#7E8299] text-sm font-bold rounded-xl hover:bg-[#EFF2F5] transition-all"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                  <button
                    className={`flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-blue-200 ${
                      loading ? 'bg-blue-300' : 'bg-[#0095E8] hover:bg-[#0084CC]'
                    }`}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : confirmText}
                  </button>
                </div>
              ) : (
                <button
                  className="w-full px-6 py-3 bg-[#0095E8] text-white text-sm font-bold rounded-xl hover:bg-[#0084CC] transition-all shadow-lg shadow-blue-200"
                  onClick={onClose}
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default CustomModal;
