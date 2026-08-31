import { useEffect, useState } from 'react';
import { ClipboardPlus, Heart, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel, getBreedLabel } from '@/lib/species';
import { SeverityBadge } from '@/components/SeverityBadge';
import { LoadingCard, EmptyState } from '@/components/ui';
import type { Animal, Report } from '@/types/db';
import type { PageId } from '@/components/AppShell';

export function FarmerDashboard({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { profile, t, lang } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const [animalRes, reportRes] = await Promise.all([
        supabase
          .from('animals')
          .select('*, herd:herds!inner(*)')
          .eq('herd.owner_id', profile.id),
        supabase
          .from('reports')
          .select('*')
          .eq('reporter_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      setAnimals((animalRes.data as Animal[]) ?? []);
      setReports((reportRes.data as Report[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const activeReports = reports.filter((r) => r.status !== 'resolved').length;
  const highSeverity = reports.filter((r) => r.severity === 'high' || r.severity === 'outbreak-risk').length;

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            {t('welcomeBack')}, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {profile?.village && `${profile.village}, `}{profile?.district}
          </p>
        </div>
        <button onClick={() => onNavigate('report')} className="btn-primary">
          <ClipboardPlus size={18} />
          {t('reportSymptom')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Heart size={20} />}
          value={animals.length}
          label={t('totalAnimals')}
          color="brand"
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          value={activeReports}
          label={t('activeReports')}
          color="clay"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={highSeverity}
          label={t('urgentAttention')}
          color={highSeverity > 0 ? 'red' : 'brand'}
        />
        <StatCard
          icon={<ClipboardPlus size={20} />}
          value={reports.length}
          label={t('recentReports')}
          color="ink"
        />
      </div>

      {/* Recent reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-ink-900">{t('recentReports')}</h2>
          {reports.length > 0 && (
            <button onClick={() => onNavigate('animals')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              {t('viewAll')} <ArrowRight size={14} />
            </button>
          )}
        </div>

        {reports.length === 0 ? (
          <div className="card p-8">
            <EmptyState
              icon={<ClipboardPlus size={28} />}
              title={t('noReports')}
              subtitle={t('createFirstReport')}
              action={
                <button onClick={() => onNavigate('report')} className="btn-primary">
                  <ClipboardPlus size={18} />
                  {t('reportSymptom')}
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map((report, i) => (
              <div
                key={report.id}
                className="card card-hover p-4 flex items-center gap-4 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => onNavigate('animals')}
              >
                <img
                  src={getSpeciesPhoto(report.species)}
                  alt={report.species}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink-900 text-sm">
                    {getSpeciesLabel(report.species, lang)}
                    {report.breed && ` · ${getBreedLabel(report.breed, lang)}`}
                  </p>
                  <p className="text-ink-500 text-xs truncate">
                    {report.symptoms.length} {t('symptoms').toLowerCase()} · {report.village || report.district || '—'}
                  </p>
                </div>
                <SeverityBadge severity={report.severity} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animals preview */}
      {animals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">{t('myAnimals')}</h2>
            <button onClick={() => onNavigate('animals')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              {t('viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {animals.slice(0, 4).map((animal, i) => (
              <div
                key={animal.id}
                className="card card-hover overflow-hidden cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => onNavigate('animals')}
              >
                <img
                  src={animal.photo_url || getSpeciesPhoto(animal.species)}
                  alt={animal.name || animal.species}
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <p className="font-semibold text-sm text-ink-900 truncate">{animal.name || getSpeciesLabel(animal.species, lang)}</p>
                  <p className="text-xs text-ink-500 truncate">{getBreedLabel(animal.breed, lang) || getSpeciesLabel(animal.species, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'brand' | 'clay' | 'red' | 'ink';
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    clay: 'bg-clay-50 text-clay-600',
    red: 'bg-red-50 text-red-600',
    ink: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className="card p-4 animate-fade-in-up">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
