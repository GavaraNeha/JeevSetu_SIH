import { useState, useEffect } from 'react';
import { Check, MapPin, Camera, Loader2, ArrowRight, AlertTriangle, ShieldCheck, Stethoscope, WifiOff, CloudUpload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SPECIES, getSpeciesPhoto, getSpeciesLabel, getBreedLabel } from '@/lib/species';
import { runTriage, type TriageResult } from '@/lib/triage';
import { normalizeLocationNullable } from '@/lib/location';
import { SeverityBadge } from '@/components/SeverityBadge';
import { VoiceInput } from '@/components/VoiceInput';
import { Spinner } from '@/components/ui';
import { useOfflineQueue } from '@/lib/offlineQueue';
import type { Animal, Severity } from '@/types/db';
import type { PageId } from '@/components/AppShell';

type Step = 'animal' | 'symptoms' | 'location' | 'review' | 'result';

export function ReportSymptomPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { profile, t, lang } = useAuth();
  const [step, setStep] = useState<Step>('animal');
  const [animals, setAnimals] = useState<Animal[]>([]);

  // form state
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [species, setSpecies] = useState('cattle');
  const [breed, setBreed] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [numAffected, setNumAffected] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [useAutoLocation, setUseAutoLocation] = useState(true);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [village, setVillage] = useState('');
  const [block, setBlock] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  // triage + submit
  const [triaging, setTriaging] = useState(false);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const { online, enqueueReport } = useOfflineQueue();

  useEffect(() => {
    if (profile) {
      supabase
        .from('animals')
        .select('*, herd:herds!inner(*)')
        .eq('herd.owner_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAnimals((data as Animal[]) ?? []));
    }
  }, [profile]);

  // Prefill location from profile
  useEffect(() => {
    if (profile) {
      setVillage(profile.village ?? '');
      setBlock(profile.block ?? '');
      setDistrict(profile.district ?? '');
      setState(profile.state ?? '');
    }
  }, [profile]);

  const speciesInfo = SPECIES.find((s) => s.key === species)!;

  function toggleSymptom(key: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseAutoLocation(true);
      },
      () => setUseAutoLocation(false),
    );
  }

  useEffect(() => {
    if (step === 'location' && useAutoLocation) {
      detectLocation();
    }
  }, [step]);

  async function runTriageStep() {
    setTriaging(true);
    const result = await runTriage({
      species,
      symptoms: selectedSymptoms,
      notes,
      numberOfAnimalsAffected: numAffected,
      lang,
    });
    setTriage(result);
    setTriaging(false);
    setStep('review');
  }

  async function handleSubmit() {
    if (!profile || !triage) return;
    setSubmitting(true);

    const reportData = {
      animal_id: animalId,
      reporter_id: profile.id,
      species,
      breed: breed || null,
      symptoms: selectedSymptoms,
      notes: notes || null,
      photo_url: photoUrl || null,
      latitude: lat,
      longitude: lng,
      village: normalizeLocationNullable(village),
      block: normalizeLocationNullable(block),
      district: normalizeLocationNullable(district),
      state: normalizeLocationNullable(state),
      severity: triage.severity as Severity,
      triage_recommendation: triage.recommendation,
      vet_referral_needed: triage.vetReferralNeeded,
      status: 'triaged' as const,
    };

    if (!online) {
      // Offline: save to local queue
      enqueueReport(reportData);
      setSubmitting(false);
      setQueuedOffline(true);
      setStep('result');
      return;
    }

    const { data, error } = await supabase.from('reports').insert(reportData).select('id').single();
    setSubmitting(false);
    if (error) {
      console.error('Submit error:', error);
      return;
    }
    setSubmittedId((data as { id: string }).id);
    setStep('result');
  }

  function reset() {
    setAnimalId(null);
    setSpecies('cattle');
    setBreed('');
    setSelectedSymptoms([]);
    setNotes('');
    setNumAffected(1);
    setPhotoUrl('');
    setTriage(null);
    setSubmittedId(null);
    setQueuedOffline(false);
    setStep('animal');
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'animal', label: t('animal') },
    { id: 'symptoms', label: t('symptoms') },
    { id: 'location', label: t('location') },
    { id: 'review', label: t('triageResult') },
  ];
  const currentStepIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{t('reportSymptom')}</h1>
        <p className="text-ink-500 text-sm mt-0.5">{t('newReport')}</p>
      </div>

      {/* Step progress */}
      {step !== 'result' && (
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 flex-1">
              <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i <= currentStepIdx ? 'bg-brand-500' : 'bg-ink-200'}`} />
            </div>
          ))}
        </div>
      )}

      {/* ─── Step: Animal ─── */}
      {step === 'animal' && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Select from herd */}
          {animals.length > 0 && (
            <div>
              <label className="label">{t('selectFromHerd')}</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {animals.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAnimalId(a.id);
                      setSpecies(a.species);
                      setBreed(a.breed ?? '');
                    }}
                    className={`flex-shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all ${animalId === a.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-200'}`}
                  >
                    <img src={a.photo_url || getSpeciesPhoto(a.species)} alt={a.name || a.species} className="w-full h-16 object-cover" loading="lazy" />
                    <p className="text-[10px] font-semibold text-ink-700 truncate px-1 py-1">{a.name || getSpeciesLabel(a.species, lang)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Species selector */}
          <div>
            <label className="label">{t('selectSpecies')}</label>
            <div className="grid grid-cols-3 gap-3">
              {SPECIES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSpecies(s.key); setBreed(''); setAnimalId(null); }}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${species === s.key ? 'border-brand-500 ring-2 ring-brand-200 scale-[1.02]' : 'border-ink-200 hover:border-clay-300'}`}
                >
                  <img src={s.photo} alt={s.label[lang]} className="w-full h-20 object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <p className="absolute bottom-1.5 left-1.5 right-1.5 text-xs font-semibold text-white leading-tight">{s.label[lang]}</p>
                  {species === s.key && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center animate-scale-in">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{t('selectBreed')}</label>
            <select className="input" value={breed} onChange={(e) => setBreed(e.target.value)}>
              <option value="">—</option>
              {speciesInfo.breeds.map((b) => <option key={b} value={b}>{getBreedLabel(b, lang)}</option>)}
            </select>
          </div>

          <button onClick={() => setStep('symptoms')} className="btn-primary w-full">
            {t('next')} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ─── Step: Symptoms ─── */}
      {step === 'symptoms' && (
        <div className="space-y-5 animate-fade-in-up">
          <div>
            <label className="label">{t('checkSymptoms')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {speciesInfo.commonSymptoms.map((sym) => {
                const checked = selectedSymptoms.includes(sym.key);
                return (
                  <button
                    key={sym.key}
                    onClick={() => toggleSymptom(sym.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${checked ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-clay-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-brand-500 animate-scale-in' : 'border-2 border-ink-300'}`}>
                      {checked && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${checked ? 'text-brand-800 font-medium' : 'text-ink-700'}`}>{sym.label[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">{t('numberOfAnimals')}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setNumAffected(Math.max(1, numAffected - 1))} className="w-10 h-10 rounded-xl bg-ink-100 text-ink-700 font-bold text-lg flex items-center justify-center active:scale-95">−</button>
              <span className="font-display text-2xl font-bold text-ink-900 w-12 text-center">{numAffected}</span>
              <button onClick={() => setNumAffected(numAffected + 1)} className="w-10 h-10 rounded-xl bg-ink-100 text-ink-700 font-bold text-lg flex items-center justify-center active:scale-95">+</button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('additionalNotes')}</label>
              <VoiceInput onTranscript={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
            </div>
            <textarea className="input min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe what you see..." />
          </div>

          <div>
            <label className="label flex items-center gap-2"><Camera size={16} /> {t('photoUpload')}</label>
            <div className="flex items-center gap-3">
              <img src={photoUrl || getSpeciesPhoto(species)} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-ink-200" />
              <input className="input text-sm" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Photo URL (optional)" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('animal')} className="btn-secondary flex-1">{t('back')}</button>
            <button
              onClick={() => setStep('location')}
              disabled={selectedSymptoms.length === 0}
              className="btn-primary flex-1"
            >
              {t('next')} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Location ─── */}
      {step === 'location' && (
        <div className="space-y-5 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setUseAutoLocation(true)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-medium ${useAutoLocation ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'}`}
              >
                <MapPin size={18} /> {t('autoDetect')}
              </button>
              <button
                onClick={() => setUseAutoLocation(false)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-medium ${!useAutoLocation ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'}`}
              >
                {t('enterManually')}
              </button>
            </div>

            {useAutoLocation && lat !== null && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-sm text-brand-700 flex items-center gap-2 animate-scale-in">
                <MapPin size={16} /> {lat.toFixed(4)}, {lng?.toFixed(4)}
              </div>
            )}

            {!useAutoLocation && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('village')}</label>
                    <input className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder={t('enterVillage')} />
                  </div>
                  <div>
                    <label className="label">{t('block')}</label>
                    <input className="input" value={block} onChange={(e) => setBlock(e.target.value)} placeholder={t('enterBlock')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('district')}</label>
                    <input className="input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={t('enterDistrict')} />
                  </div>
                  <div>
                    <label className="label">{t('state')}</label>
                    <input className="input" value={state} onChange={(e) => setState(e.target.value)} placeholder={t('enterState')} />
                  </div>
                </div>
              </div>
            )}

            {/* Always show manual fields too for completeness */}
            {useAutoLocation && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0">{t('village')}</label>
                      <VoiceInput onTranscript={(text) => setVillage((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
                    </div>
                    <input className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder={t('enterVillage')} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0">{t('district')}</label>
                      <VoiceInput onTranscript={(text) => setDistrict((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
                    </div>
                    <input className="input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={t('enterDistrict')} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('symptoms')} className="btn-secondary flex-1">{t('back')}</button>
            <button onClick={runTriageStep} disabled={triaging} className="btn-primary flex-1">
              {triaging ? (
                <><Spinner size={18} /> {t('triaging')}</>
              ) : (
                <>{t('triageResult')} <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Review / Triage Result ─── */}
      {step === 'review' && triage && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Triage result card */}
          <div className={`rounded-2xl p-5 border-2 animate-badge-in ${
            triage.severity === 'outbreak-risk' ? 'bg-red-50 border-red-300'
            : triage.severity === 'high' ? 'bg-orange-50 border-orange-300'
            : triage.severity === 'medium' ? 'bg-amber-50 border-amber-300'
            : 'bg-brand-50 border-brand-300'
          }`}>
            <div className="flex items-start gap-4 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                triage.severity === 'outbreak-risk' || triage.severity === 'high' ? 'bg-red-100 text-red-600'
                : triage.severity === 'medium' ? 'bg-amber-100 text-amber-600'
                : 'bg-brand-100 text-brand-600'
              }`}>
                {triage.vetReferralNeeded ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={triage.severity} animate={false} />
                </div>
                <p className="text-sm text-ink-700 leading-relaxed">{triage.recommendation}</p>
              </div>
            </div>

            {triage.vetReferralNeeded && (
              <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 text-sm font-medium text-red-700">
                <Stethoscope size={16} />
                {t('referralAdvice')}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img src={photoUrl || getSpeciesPhoto(species)} alt={species} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-semibold text-sm text-ink-900">{getSpeciesLabel(species, lang)} {breed && `· ${getBreedLabel(breed, lang)}`}</p>
                <p className="text-xs text-ink-500">{selectedSymptoms.length} {t('symptoms').toLowerCase()} · {numAffected} {t('animalsAffected').toLowerCase()}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedSymptoms.map((key) => {
                const sym = speciesInfo.commonSymptoms.find((s) => s.key === key);
                return sym && (
                  <span key={key} className="chip bg-ink-100 text-ink-600 text-[11px]">{sym.label[lang]}</span>
                );
              })}
            </div>
            {(village || district) && (
              <p className="text-xs text-ink-500 flex items-center gap-1"><MapPin size={12} /> {village}{village && district && ', '}{district}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('location')} className="btn-secondary flex-1">{t('back')}</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? <Spinner size={18} /> : <>{t('submit')} <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step: Result ─── */}
      {step === 'result' && triage && (submittedId || queuedOffline) && (
        <div className="text-center py-8 animate-scale-in">
          {queuedOffline ? (
            <>
              <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center bg-clay-100 text-clay-600">
                <WifiOff size={40} />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">{t('reportSavedOffline')}</h2>
              <p className="text-ink-500 text-sm mb-6 max-w-sm mx-auto">
                <span className="inline-flex items-center gap-1.5">
                  <CloudUpload size={16} /> {t('willSyncOnline')}
                </span>
              </p>
              <div className="bg-clay-50 border border-clay-200 rounded-xl p-4 mb-6 max-w-sm mx-auto flex items-center gap-2 text-clay-700 text-sm">
                <WifiOff size={18} /> {t('offlineMode')} · {t('queuedReports')}: 1
              </div>
            </>
          ) : (
            <>
              <div className={`w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center ${
                triage.severity === 'outbreak-risk' || triage.severity === 'high' ? 'bg-red-100 text-red-600'
                : triage.severity === 'medium' ? 'bg-amber-100 text-amber-600'
                : 'bg-brand-100 text-brand-600'
              }`}>
                <ShieldCheck size={40} />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">{t('reportSubmitted')}</h2>
              <p className="text-ink-500 text-sm mb-6 max-w-sm mx-auto">{triage.recommendation}</p>

              <div className="flex justify-center mb-6">
                <SeverityBadge severity={triage.severity} />
              </div>

              {triage.vetReferralNeeded && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                    <Stethoscope size={18} /> {t('vetReferral')}
                  </div>
                  <p className="text-amber-600 text-xs">{t('referralAdvice')}</p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 max-w-sm mx-auto">
            <button onClick={reset} className="btn-secondary flex-1">{t('newReport')}</button>
            <button onClick={() => onNavigate('dashboard')} className="btn-primary flex-1">{t('dashboard')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
