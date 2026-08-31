import { useEffect, useState, useMemo } from 'react';
import { Map as MapIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel } from '@/lib/species';
import { normalizeLocation } from '@/lib/location';
import { SeverityBadge } from '@/components/SeverityBadge';
import { LoadingCard, EmptyState, ErrorState } from '@/components/ui';
import type { Report, Severity } from '@/types/db';

interface RegionAggregate {
  region: string;
  level: string;
  count: number;
  active: number;
  outbreakCount: number;
  highCount: number;
  lat?: number;
  lng?: number;
  severity: Severity;
  reports: Report[];
}

export function RiskMapPage() {
  const { t, lang } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [level, setLevel] = useState<'village' | 'block' | 'district'>('district');
  const [selectedRegion, setSelectedRegion] = useState<RegionAggregate | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        setError(true);
      } else {
        setReports((data as Report[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Aggregate reports by region level
  const regions = useMemo<RegionAggregate[]>(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      // Cascade: village → block → district, so every report resolves to a real name
      const rawKey = r[level] ?? (level === 'village' ? (r.block || r.district) : level === 'block' ? r.district : null) ?? 'Unknown';
      const key = normalizeLocation(rawKey) || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    const result: RegionAggregate[] = [];
    for (const [region, regionReports] of map) {
      const active = regionReports.filter((r) => r.status !== 'resolved').length;
      const outbreakCount = regionReports.filter((r) => r.severity === 'outbreak-risk').length;
      const highCount = regionReports.filter((r) => r.severity === 'high').length;
      const severity: Severity =
        outbreakCount > 0 ? 'outbreak-risk'
        : highCount > 0 ? 'high'
        : active > 2 ? 'medium'
        : 'low';

      result.push({
        region,
        level,
        count: regionReports.length,
        active,
        outbreakCount,
        highCount,
        severity,
        reports: regionReports,
        lat: regionReports.find((r) => r.latitude)?.latitude ?? undefined,
        lng: regionReports.find((r) => r.longitude)?.longitude ?? undefined,
      });
    }

    return result.sort((a, b) => b.active - a.active);
  }, [reports, level]);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={t('error')} onRetry={() => window.location.reload()} />;
  }

  const totalActive = reports.filter((r) => r.status !== 'resolved').length;
  const totalOutbreak = reports.filter((r) => r.severity === 'outbreak-risk').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{t('riskMapTitle')}</h1>
        <p className="text-ink-500 text-sm mt-0.5">{t('riskMapSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="font-display text-2xl font-bold text-ink-900">{reports.length}</p>
          <p className="text-xs text-ink-500">{t('totalCases')}</p>
        </div>
        <div className="card p-4">
          <p className="font-display text-2xl font-bold text-clay-600">{totalActive}</p>
          <p className="text-xs text-ink-500">{t('activeCases')}</p>
        </div>
        <div className="card p-4">
          <p className={`font-display text-2xl font-bold ${totalOutbreak > 0 ? 'text-red-600 animate-pulse-soft' : 'text-ink-400'}`}>{totalOutbreak}</p>
          <p className="text-xs text-ink-500">{t('outbreakAlerts')}</p>
        </div>
      </div>

      {/* Level toggle */}
      <div className="flex gap-1 bg-ink-100 rounded-xl p-1 w-fit">
        {(['village', 'block', 'district'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${level === l ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'}`}
          >
            {l === 'village' ? t('mapVillage') : l === 'block' ? t('mapBlock') : t('mapDistrict')}
          </button>
        ))}
      </div>

      {/* Heatmap visualization */}
      {regions.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={<MapIcon size={28} />} title={t('noCases')} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Heat tiles */}
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">{t('inYourArea')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {regions.map((r, i) => (
                <HeatTile
                  key={r.region}
                  region={r}
                  onClick={() => setSelectedRegion(r)}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Region detail */}
          <div>
            {selectedRegion ? (
              <div className="card p-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-900">{selectedRegion.region}</h3>
                    <p className="text-xs text-ink-500">{selectedRegion.level === 'village' ? t('mapVillage') : selectedRegion.level === 'block' ? t('mapBlock') : t('mapDistrict')}</p>
                  </div>
                  <SeverityBadge severity={selectedRegion.severity} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-ink-50 rounded-lg py-2">
                    <p className="font-bold text-ink-900">{selectedRegion.count}</p>
                    <p className="text-[10px] text-ink-500">{t('totalCases')}</p>
                  </div>
                  <div className="text-center bg-clay-50 rounded-lg py-2">
                    <p className="font-bold text-clay-600">{selectedRegion.active}</p>
                    <p className="text-[10px] text-ink-500">{t('activeCases')}</p>
                  </div>
                  <div className="text-center bg-red-50 rounded-lg py-2">
                    <p className="font-bold text-red-600">{selectedRegion.outbreakCount}</p>
                    <p className="text-[10px] text-ink-500">{t('outbreakAlerts')}</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedRegion.reports.slice(0, 10).map((report) => (
                    <div key={report.id} className="flex items-center gap-3 py-2 border-b border-ink-100 last:border-0">
                      <img src={getSpeciesPhoto(report.species)} alt={report.species} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800 truncate">{getSpeciesLabel(report.species, lang)}</p>
                        <p className="text-xs text-ink-500">{report.symptoms.length} {t('symptoms').toLowerCase()}</p>
                      </div>
                      <SeverityBadge severity={report.severity} size="sm" animate={false} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-14 h-14 rounded-2xl bg-clay-100 flex items-center justify-center text-clay-500 mb-3">
                  <MapIcon size={28} />
                </div>
                <p className="text-sm text-ink-500 text-center">{t('selectRegionDetails')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeatTile({ region, onClick, index }: { region: RegionAggregate; onClick: () => void; index: number }) {
  const { t } = useAuth();
  const intensity =
    region.severity === 'outbreak-risk' ? 1.0
    : region.severity === 'high' ? 0.75
    : region.severity === 'medium' ? 0.5
    : 0.25;

  const bg =
    region.severity === 'outbreak-risk' ? 'bg-red-500'
    : region.severity === 'high' ? 'bg-orange-500'
    : region.severity === 'medium' ? 'bg-amber-400'
    : 'bg-brand-400';

  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl p-4 text-left text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-card-hover animate-fade-in-up ${bg}`}
      style={{ animationDelay: `${index * 60}ms`, opacity: 0.5 + intensity * 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20" />
      <div className="relative">
        <p className="font-semibold text-sm leading-tight truncate">{region.region}</p>
        <p className="text-2xl font-bold font-display mt-1">{region.active}</p>
        <p className="text-[10px] text-white/80">{t('activeCasesLabel')}</p>
        {region.outbreakCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5 w-fit">
            <AlertTriangle size={10} /> {region.outbreakCount} {t('outbreak')}
          </div>
        )}
      </div>
    </button>
  );
}
