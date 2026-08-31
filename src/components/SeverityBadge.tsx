import type { Severity } from '@/types/db';
import { SEVERITY_CONFIG } from '@/lib/triage';
import { useAuth } from '@/context/AuthContext';

interface Props {
  severity: Severity;
  size?: 'sm' | 'md';
  animate?: boolean;
}

export function SeverityBadge({ severity, size = 'md', animate = true }: Props) {
  const cfg = SEVERITY_CONFIG[severity];
  const { t } = useAuth();

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`chip ${cfg.bg} ${cfg.border} ${cfg.text} border ${sizeClasses} ${animate ? 'animate-badge-in' : ''}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${severity === 'outbreak-risk' ? 'animate-pulse-soft' : ''}`} />
      {t(severity)}
    </span>
  );
}
