import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore, type Toast as ToastType } from '../../store/uiStore';

const ICONS = {
  success: <CheckCircle size={18} className="text-green-600 flex-shrink-0" />,
  error:   <XCircle     size={18} className="text-red-600   flex-shrink-0" />,
  info:    <Info        size={18} className="text-blue-600  flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useUIStore();
  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div className={clsx(
      'flex items-start gap-3 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-[#E5E5E0] p-4 animate-slide-up',
    )}>
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0D0D0B]">{toast.title}</p>
        {toast.message && <p className="text-xs text-[#6F6F6F] mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-[#F7F7F5] rounded-full flex-shrink-0" aria-label="Dismiss">
        <X size={14} className="text-[#6F6F6F]" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useUIStore();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto"><ToastItem toast={t} /></div>
      ))}
    </div>
  );
}
