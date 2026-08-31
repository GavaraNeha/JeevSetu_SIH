import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full ${sizeClass} max-h-[90vh] overflow-y-auto animate-slide-down sm:animate-scale-in no-tap-callout`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-ink-100 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
            <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
