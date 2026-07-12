import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CommentsSheet } from './CommentsSheet';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'POST' | 'REEL' | 'YOUTUBE_POST';
  entityId: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ 
  isOpen, 
  onClose, 
  entityType, 
  entityId 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex justify-center md:items-center items-end bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="bg-white dark:bg-black w-full md:w-[450px] md:h-[600px] h-[75vh] md:rounded-xl rounded-t-xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-300 border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Comments</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <CommentsSheet entityType={entityType} entityId={entityId} />
        </div>
      </div>
    </div>
  );

  // Mount directly to body to escape any parent `transform` or `overflow: hidden` contexts
  return createPortal(modalContent, document.body);
};
