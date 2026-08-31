import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Flame, Map as MapIcon,
  Send, Radio, Loader2, TrendingUp, ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel, SPECIES } from '@/lib/species';
import { normalizeLocation } from '@/lib/location';
import { SeverityBadge } from '@/components/SeverityBadge';
import { VoiceInput } from '@/components/VoiceInput';
import { LeafletMap } from '@/components/LeafletMap';
import { Modal } from '@/components/Modal';
import { LoadingList, EmptyState, Spinner, ErrorState } from '@/components/ui';
import type { Report, Severity, Language, Advisory } from '@/types/db';

interface Cluster {
  village: string;
  block: string;
  district: string;
  count: number;
  severity: Severity;
  reports: Report[];
  species: string;
  lat: number;
  lng: number;
}

export function DistrictDashboard() {
  const { t, lang, profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(false);
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
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Cluster detection: 3+ similar-severity cases in same village within 7 days
  const clusters = useMemo<Cluster[]>(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const recent = reports.filter((r) => now - new Date(r.created_at).getTime() < sevenDays);

    const byVillage = new Map<string, Report[]>();
    for (const r of recent) {
      const v = normalizeLocation(r.village);
      const b = normalizeLocation(r.block);
      const d = normalizeLocation(r.district);
      const key = `${v || 'Unknown'}|${b}|${d}`;
      if (!byVillage.has(key)) byVillage.set(key, []);
      byVillage.get(key)!.push(r);
    }

    const result: Cluster[] = [];
    for (const [, villageReports] of byVillage) {
      if (villageReports.length < 3) continue;

      // Group by severity within village
      const bySeverity = new Map<Severity, Report[]>();
      for (const r of villageReports) {
        if (!bySeverity.has(r.severity)) bySeverity.set(r.severity, []);
        bySeverity.get(r.severity)!.push(r);
      }

      for (const [severity, severityReports] of bySeverity) {
        if (severityReports.length >= 3 && (severity === 'high' || severity === 'outbreak-risk')) {
          const first = severityReports[0];
          result.push({
            village: normalizeLocation(first.village) || 'Unknown',
            block: normalizeLocation(first.block) || 'Unknown',
            district: normalizeLocation(first.district) || 'Unknown',
            count: severityReports.length,
            severity,
            reports: severityReports,
            species: first.species,
            lat: first.latitude ?? 16.989,
            lng: first.longitude ?? 82.243,
          });
        }
      }
    }
    return result.sort((a, b) => b.count - a.count);
  }, [reports]);

  // Map pins: aggregate by village
  const mapPins = useMemo(() => {
    const byVillage = new Map<string, Report[]>();
    for (const r of reports) {
      if (r.status === 'resolved') continue;
      const v = normalizeLocation(r.village);
      const key = `${v || 'Unknown'}|${r.latitude ?? 0}|${r.longitude ?? 0}`;
      if (!byVillage.has(key)) byVillage.set(key, []);
      byVillage.get(key)!.push(r);
    }

    const pins: Parameters<typeof LeafletMap>[0]['pins'] = [];
    for (const [, villageReports] of byVillage) {
      const first = villageReports[0];
      const outbreakCount = villageReports.filter((r) => r.severity === 'outbreak-risk').length;
      const highCount = villageReports.filter((r) => r.severity === 'high').length;
      const severity: Severity =
        outbreakCount > 0 ? 'outbreak-risk'
        : highCount > 0 ? 'high'
        : villageReports.length > 2 ? 'medium'
        : 'low';

      pins.push({
        lat: first.latitude ?? 16.989,
        lng: first.longitude ?? 82.243,
        village: normalizeLocation(first.village) || 'Unknown',
        block: normalizeLocation(first.block) || 'Unknown',
        district: normalizeLocation(first.district) || 'Unknown',
        count: villageReports.length,
        severity,
        species: first.species,
      });
    }
    return pins;
  }, [reports]);

  // Species distribution
  const speciesDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      map.set(r.species, (map.get(r.species) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const totalActive = reports.filter((r) => r.status !== 'resolved').length;
  const totalCases = reports.length;
  const outbreakCount = reports.filter((r) => r.severity === 'outbreak-risk' && r.status !== 'resolved').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-ink-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card p-4 h-24 animate-pulse bg-ink-50" />)}
        </div>
        <LoadingList count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={t('error')} onRetry={loadReports} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{t('surveillance')}</h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {profile?.district ?? 'Kakinada'} · {t('riskMapSubtitle')}
          </p>
        </div>
        <button onClick={() => setShowBroadcast(true)} className="btn-primary">
          <Radio size={18} /> {t('broadcastAdvisory')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SurveillanceStat icon={<Activity size={20} />} value={totalCases} label={t('totalCases')} color="clay" />
        <SurveillanceStat icon={<TrendingUp size={20} />} value={totalActive} label={t('activeCases')} color="brand" />
        <SurveillanceStat icon={<ShieldAlert size={20} />} value={outbreakCount} label={t('outbreakAlerts')} color={outbreakCount > 0 ? 'red' : 'ink'} pulse={outbreakCount > 0} />
        <SurveillanceStat icon={<Flame size={20} />} value={clusters.length} label={t('clusterAlerts')} color={clusters.length > 0 ? 'red' : 'ink'} pulse={clusters.length > 0} />
      </div>

      {/* Cluster alerts */}
      {clusters.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" /> {t('clusterAlerts')}
          </h2>
          {clusters.map((cluster, i) => (
            <div
              key={`${cluster.village}-${cluster.severity}`}
              className="card p-4 border-l-4 border-l-red-500 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 animate-pulse-soft">
                  <Flame size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-ink-900">{cluster.village}</p>
                    <SeverityBadge severity={cluster.severity} size="sm" animate={false} />
                  </div>
                  <p className="text-xs text-ink-600">
                    {cluster.count} {t('casesInVillage')} {cluster.village}, {cluster.block} · {t('withinDays')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {cluster.reports.slice(0, 5).map((r) => (
                      <img
                        key={r.id}
                        src={r.photo_url || getSpeciesPhoto(r.species)}
                        alt={r.species}
                        className="w-8 h-8 rounded-lg object-cover border border-ink-200"
                        loading="lazy"
                      />
                    ))}
                    {cluster.reports.length > 5 && (
                      <span className="text-xs text-ink-500 font-medium">+{cluster.reports.length - 5}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Geospatial map */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-ink-100">
          <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
            <MapIcon size={20} className="text-brand-600" /> {t('riskMapTitle')}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">{t('riskMapSubtitle')}</p>
        </div>
        <div className="h-[450px]">
          {mapPins.length > 0 ? (
            <LeafletMap pins={mapPins} center={[16.989, 82.243]} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState icon={<MapIcon size={28} />} title={t('noCases')} />
            </div>
          )}
        </div>
      </div>

      {/* Case distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">{t('bySpecies')}</h3>
          <div className="space-y-3">
            {speciesDist.map(([sp, count]) => {
              const pct = totalCases > 0 ? (count / totalCases) * 100 : 0;
              return (
                <div key={sp}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-700">{getSpeciesLabel(sp, lang)}</span>
                    <span className="text-sm text-ink-500 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">{t('byVillage')}</h3>
          <VillageBreakdown reports={reports} t={t} lang={lang} />
        </div>
      </div>

      {/* Broadcast modal */}
      {showBroadcast && (
        <BroadcastAdvisoryModal
          onClose={() => setShowBroadcast(false)}
          villages={[...new Set(reports.map((r) => r.village).filter(Boolean))] as string[]}
          blocks={[...new Set(reports.map((r) => r.block).filter(Boolean))] as string[]}
          districts={[...new Set(reports.map((r) => r.district).filter(Boolean))] as string[]}
        />
      )}
    </div>
  );
}

function SurveillanceStat({ icon, value, label, color, pulse }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'brand' | 'clay' | 'red' | 'ink';
  pulse?: boolean;
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    clay: 'bg-clay-50 text-clay-600',
    red: 'bg-red-50 text-red-600',
    ink: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className="card p-4 animate-fade-in-up">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]} ${pulse ? 'animate-pulse-soft' : ''}`}>
        {icon}
      </div>
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

function VillageBreakdown({ reports, t, lang }: { reports: Report[]; t: (k: string) => string; lang: Language }) {
  const byVillage = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of reports) {
      const key = normalizeLocation(r.village) || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  }, [reports]);

  if (byVillage.length === 0) {
    return <EmptyState icon={<MapIcon size={24} />} title={t('noCases')} />;
  }

  return (
    <div className="space-y-2">
      {byVillage.map(([village, villageReports]) => {
        const active = villageReports.filter((r) => r.status !== 'resolved').length;
        const outbreak = villageReports.filter((r) => r.severity === 'outbreak-risk').length;
        return (
          <div key={village} className="flex items-center gap-3 py-2 border-b border-ink-100 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-800 truncate">{village}</p>
              <p className="text-xs text-ink-500">{villageReports.length} {t('totalCases').toLowerCase()}</p>
            </div>
            <div className="flex gap-2">
              {active > 0 && <span className="chip bg-clay-50 text-clay-600 text-[11px]">{active} {t('activeCases').toLowerCase()}</span>}
              {outbreak > 0 && <span className="chip bg-red-50 text-red-600 text-[11px]">{outbreak} {t('outbreakAlerts').toLowerCase()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Broadcast Advisory Modal ──────────────────────────────
function BroadcastAdvisoryModal({
  onClose, villages, blocks, districts,
}: {
  onClose: () => void;
  villages: string[];
  blocks: string[];
  districts: string[];
}) {
  const { t } = useAuth();
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [bodyHi, setBodyHi] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [bodyTe, setBodyTe] = useState('');
  const [severity, setSeverity] = useState<Severity>('high');
  const [species, setSpecies] = useState<string>('');
  const [targetLevel, setTargetLevel] = useState<'district' | 'block' | 'village'>('district');
  const [targetRegion, setTargetRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const regions = targetLevel === 'district' ? districts : targetLevel === 'block' ? blocks : villages;

  async function handleBroadcast() {
    setSaving(true);
    const region = targetRegion || (districts.length > 0 ? districts[0] : null);

    const advisories: Omit<Advisory, 'id' | 'created_at'>[] = [
      { title: titleEn, body: bodyEn, language: 'en' as Language, severity, species: species || null, region },
      { title: titleHi, body: bodyHi, language: 'hi' as Language, severity, species: species || null, region },
      { title: titleTe, body: bodyTe, language: 'te' as Language, severity, species: species || null, region },
    ].filter((a) => a.title && a.body);

    if (advisories.length === 0) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('advisories').insert(advisories);
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    }
  }

  const hasEn = titleEn && bodyEn;
  const hasHi = titleHi && bodyHi;
  const hasTe = titleTe && bodyTe;
  const canSubmit = hasEn && (hasHi || hasTe);

  return (
    <Modal open={true} onClose={onClose} size="lg" title={t('composeAdvisory')}>
      {success ? (
        <div className="text-center py-8 animate-scale-in">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-brand-100 text-brand-600">
            <CheckCircle2 size={32} />
          </div>
          <p className="font-display text-lg font-semibold text-ink-900">{t('advisoryIssued')}</p>
          <p className="text-sm text-ink-500 mt-1">{t('advisorySubtitle')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Target + severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('targetLevel')}</label>
              <select className="input" value={targetLevel} onChange={(e) => { setTargetLevel(e.target.value as 'district' | 'block' | 'village'); setTargetRegion(''); }}>
                <option value="district">{t('mapDistrict')}</option>
                <option value="block">{t('mapBlock')}</option>
                <option value="village">{t('mapVillage')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('targetRegion')}</label>
              <select className="input" value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)}>
                <option value="">{t('all')}</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('severity')}</label>
              <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                <option value="low">{t('low')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="high">{t('high')}</option>
                <option value="outbreak-risk">{t('outbreak-risk')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('targetSpecies')}</label>
              <select className="input" value={species} onChange={(e) => setSpecies(e.target.value)}>
                <option value="">{t('all')}</option>
                {SPECIES.map((s) => <option key={s.key} value={s.key}>{s.label.en}</option>)}
              </select>
            </div>
          </div>

          {/* English */}
          <LanguageInput langLabel="English" title={titleEn} setTitle={setTitleEn} body={bodyEn} setBody={setBodyEn} required />

          {/* Hindi */}
          <LanguageInput langLabel="हिंदी" title={titleHi} setTitle={setTitleHi} body={bodyHi} setBody={setBodyHi} />

          {/* Telugu */}
          <LanguageInput langLabel="తెలుగు" title={titleTe} setTitle={setTitleTe} body={bodyTe} setBody={setBodyTe} />

          <button onClick={handleBroadcast} disabled={saving || !canSubmit} className="btn-primary w-full">
            {saving ? <Spinner size={18} /> : <><Send size={18} /> {t('issue')}</>}
          </button>
        </div>
      )}
    </Modal>
  );
}

function LanguageInput({ langLabel, title, setTitle, body, setBody, required }: {
  langLabel: string;
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="border border-ink-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-800">{langLabel}</span>
          {required && <span className="text-xs text-red-500">*</span>}
        </div>
        <VoiceInput onTranscript={(text) => setTitle(title ? `${title} ${text}` : text)} size="sm" />
      </div>
      <input className="input text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <div className="relative">
        <textarea className="input text-sm min-h-[60px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body..." />
        <div className="absolute right-2 bottom-2">
          <VoiceInput onTranscript={(text) => setBody(body ? `${body} ${text}` : text)} size="sm" />
        </div>
      </div>
    </div>
  );
}
