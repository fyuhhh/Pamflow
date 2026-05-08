import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomModal from '../components/common/CustomModal';

const ModalContext = createContext(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Ya',
    cancelText: 'Batal',
    onConfirm: null,
    onClose: null,
    loading: false
  });

  const showModal = useCallback((config) => {
    setModalConfig({
      show: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      confirmText: config.confirmText || 'Ya, Lanjutkan',
      cancelText: config.cancelText || 'Batal',
      onConfirm: config.onConfirm || null,
      onClose: config.onClose || null,
      loading: false
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, show: false }));
    if (modalConfig.onClose) modalConfig.onClose();
  }, [modalConfig]);

  const setModalLoading = useCallback((loading) => {
    setModalConfig(prev => ({ ...prev, loading }));
  }, []);

  const success = (title, message) => {
    showModal({ type: 'success', title, message });
  };

  const error = (title, message) => {
    showModal({ type: 'error', title, message });
  };

  const warning = (title, message) => {
    showModal({ type: 'warning', title, message });
  };

  const confirm = (title, message, onConfirm, options = {}) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm: async () => {
        setModalLoading(true);
        try {
          await onConfirm();
          hideModal();
        } catch (err) {
          console.error('Confirm error:', err);
          setModalLoading(false);
        }
      },
      ...options
    });
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, success, error, warning, confirm, setModalLoading }}>
      {children}
      <CustomModal 
        {...modalConfig} 
        onClose={hideModal}
        onConfirm={modalConfig.onConfirm}
      />
    </ModalContext.Provider>
  );
};
