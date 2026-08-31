import { useEffect, useState } from 'react';
import { AlertCircle, Plus, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel, SPECIES } from '@/lib/species';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Modal } from '@/components/Modal';
import { VoiceInput } from '@/components/VoiceInput';
import { EmptyState, Spinner } from '@/components/ui';
import type { Advisory, Severity, Language } from '@/types/db';

export function AdvisoriesPage() {
  const { profile, t, lang } = useAuth();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const isVet = profile?.role === 'vet_official';

  useEffect(() => {
    loadAdvisories();
  }, [lang]);

  async function loadAdvisories() {
    const { data } = await supabase
      .from('advisories')
      .select('*')
      .eq('language', lang)
      .order('created_at', { ascending: false });
    setAdvisories((data as Advisory[]) ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{t('healthAdvisories')}</h1>
          <p className="text-ink-500 text-sm mt-0.5">{t('advisorySubtitle')}</p>
        </div>
        {isVet && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} /> {t('addNewAdvisory')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card p-5 skeleton h-32 rounded-2xl" />)}
        </div>
      ) : advisories.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={<AlertCircle size={28} />} title={t('noAdvisories')} />
        </div>
      ) : (
        <div className="space-y-3">
          {advisories.map((adv, i) => (
            <div
              key={adv.id}
              className="card card-hover p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                {adv.species && (
                  <img
                    src={getSpeciesPhoto(adv.species)}
                    alt={adv.species}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <SeverityBadge severity={adv.severity} size="sm" animate={false} />
                    {adv.species && (
                      <span className="text-xs text-ink-500">{getSpeciesLabel(adv.species, lang)}</span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-ink-900 mb-1">{adv.title}</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{adv.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                    <span>{new Date(adv.created_at).toLocaleDateString()}</span>
                    {adv.region && <span className="flex items-center gap-1"><MapPin size={11} /> {adv.region}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAdvisoryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAdvisories(); }}
        />
      )}
    </div>
  );
}

function CreateAdvisoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t, lang } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [species, setSpecies] = useState('');
  const [region, setRegion] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('advisories').insert({
      title,
      body,
      language: lang as Language,
      severity,
      species: species || null,
      region: region || null,
    });
    setSaving(false);
    onCreated();
  }

  return (
    <Modal open={true} onClose={onClose} title={t('addNewAdvisory')}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">{t('advisoryTitle')}</label>
            <VoiceInput onTranscript={(text) => setTitle((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
          </div>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">{t('advisoryBody')}</label>
            <VoiceInput onTranscript={(text) => setBody((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
          </div>
          <textarea className="input min-h-[100px]" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('severity')}</label>
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            <option value="low">{t('low')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="high">{t('high')}</option>
            <option value="outbreak-risk">{t('outbreak-risk')}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('targetSpecies')}</label>
            <select className="input" value={species} onChange={(e) => setSpecies(e.target.value)}>
              <option value="">{t('all')}</option>
              {SPECIES.map((s) => <option key={s.key} value={s.key}>{s.label[lang]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('targetRegion')}</label>
            <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('enterDistrict')} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !title || !body} className="btn-primary flex-1">
            {saving ? <Spinner size={18} /> : t('issue')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
