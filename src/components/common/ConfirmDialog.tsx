import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  isDestructive = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`p-3 rounded-full mb-3 border ${
            isDestructive ? 'bg-rose-950/60 text-rose-400 border-rose-500/40' : 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-[#0c162b] p-3.5 rounded-xl border border-cyan-500/20">{message}</p>
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-slate-300 bg-[#0c162b] border border-cyan-500/30 rounded-xl hover:bg-cyan-950/50 hover:text-white transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all cursor-pointer shadow-sm ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-rose-900/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400 shadow-cyan-900/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
