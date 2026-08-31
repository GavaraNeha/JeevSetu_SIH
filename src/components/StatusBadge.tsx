import type { AnimalStatus } from '@/types/db';
import { useAuth } from '@/context/AuthContext';

const STATUS_STYLES: Record<AnimalStatus, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  under_treatment: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  recovered: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  deceased: { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' },
};

export function StatusBadge({ status }: { status: AnimalStatus }) {
  const { t } = useAuth();
  const s = STATUS_STYLES[status];
  const label =
    status === 'healthy'
      ? t('healthy')
      : status === 'under_treatment'
        ? t('underTreatment')
        : status === 'recovered'
          ? t('recovered')
          : t('deceased');

  return (
    <span className={`chip ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
