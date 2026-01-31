import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-[92vw] max-w-lg rounded-2xl border border-zinc-200 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.35)] p-6 relative">

        {/*
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
