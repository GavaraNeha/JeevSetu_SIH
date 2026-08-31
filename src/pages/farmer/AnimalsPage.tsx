import { useEffect, useState } from 'react';
import { Plus, Heart, Syringe, Pill, FileText, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel, getBreedLabel, SPECIES } from '@/lib/species';
import { AnimalCardPhoto } from '@/components/AnimalPhoto';
import { StatusBadge } from '@/components/StatusBadge';
import { SeverityBadge } from '@/components/SeverityBadge';
import { Modal } from '@/components/Modal';
import { VoiceInput } from '@/components/VoiceInput';
import { LoadingCard, EmptyState, Spinner, ErrorState } from '@/components/ui';
import type { Animal, AnimalWithRecords, Vaccination, Treatment, Report, AnimalStatus } from '@/types/db';

export function AnimalsPage() {
  const { profile, t, lang } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnimalWithRecords | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadAnimals();
  }, [profile]);

  async function loadAnimals() {
    if (!profile) return;
    const { data } = await supabase
      .from('animals')
      .select('*, herd:herds!inner(*)')
      .eq('herd.owner_id', profile.id)
      .order('created_at', { ascending: false });
    setAnimals((data as Animal[]) ?? []);
    setLoading(false);
  }

  async function openAnimal(animal: Animal) {
    const [vacRes, treatRes, reportRes] = await Promise.all([
      supabase.from('vaccinations').select('*').eq('animal_id', animal.id).order('administered_date', { ascending: false }),
      supabase.from('treatments').select('*').eq('animal_id', animal.id).order('treatment_date', { ascending: false }),
      supabase.from('reports').select('*').eq('animal_id', animal.id).order('created_at', { ascending: false }),
    ]);
    setSelected({
      ...animal,
      vaccinations: (vacRes.data as Vaccination[]) ?? [],
      treatments: (treatRes.data as Treatment[]) ?? [],
      reports: (reportRes.data as Report[]) ?? [],
    });
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{t('myAnimals')}</h1>
          <p className="text-ink-500 text-sm">{animals.length} {t('totalAnimals').toLowerCase()}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={18} />
          {t('addAnimal')}
        </button>
      </div>

      {animals.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Heart size={28} />}
            title={t('noAnimals')}
            subtitle={t('addFirstAnimal')}
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                <Plus size={18} />
                {t('addAnimal')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {animals.map((animal, i) => (
            <div
              key={animal.id}
              className="card card-hover overflow-hidden cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => openAnimal(animal)}
            >
              <AnimalCardPhoto
                species={animal.species}
                breed={animal.breed}
                photoUrl={animal.photo_url}
                name={animal.name}
                tag={animal.tag_number}
                lang={lang}
              />
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-ink-500">{getSpeciesLabel(animal.species, lang)}</p>
                  <StatusBadge status={animal.status} />
                </div>
                <p className="text-xs text-ink-400 truncate">
                  {animal.tag_number && `#${animal.tag_number} · `}
                  {getBreedLabel(animal.breed, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animal detail modal */}
      {selected && (
        <AnimalDetailModal
          animal={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            openAnimal(selected);
            loadAnimals();
          }}
        />
      )}

      {/* Add animal modal */}
      {showAdd && profile && (
        <AddAnimalModal
          ownerId={profile.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            loadAnimals();
          }}
        />
      )}
    </div>
  );
}

function AnimalDetailModal({
  animal,
  onClose,
  onUpdate,
}: {
  animal: AnimalWithRecords;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { t, lang } = useAuth();
  const [tab, setTab] = useState<'vaccinations' | 'treatments' | 'reports'>('vaccinations');
  const [showAddVac, setShowAddVac] = useState(false);
  const [showAddTreat, setShowAddTreat] = useState(false);

  const ageStr = animal.birth_date
    ? `${Math.floor((Date.now() - new Date(animal.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))}y`
    : '—';

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <div className="-m-5">
        {/* Hero photo */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img
            src={animal.photo_url || getSpeciesPhoto(animal.species)}
            alt={animal.name || animal.species}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-white drop-shadow">{animal.name || getSpeciesLabel(animal.species, lang)}</h2>
              <p className="text-white/80 text-sm drop-shadow">{getBreedLabel(animal.breed, lang)} · {animal.tag_number || 'No tag'}</p>
            </div>
            <StatusBadge status={animal.status} />
          </div>
        </div>

        {/* Info bar */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-ink-100">
          <InfoCell label={t('species')} value={getSpeciesLabel(animal.species, lang)} />
          <InfoCell label={t('sex')} value={animal.sex ? t(animal.sex) : '—'} />
          <InfoCell label={t('age')} value={ageStr} />
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 bg-ink-100 rounded-xl p-1">
            <TabButton active={tab === 'vaccinations'} onClick={() => setTab('vaccinations')} icon={<Syringe size={16} />} label={t('vaccinationHistory')} count={animal.vaccinations?.length ?? 0} />
            <TabButton active={tab === 'treatments'} onClick={() => setTab('treatments')} icon={<Pill size={16} />} label={t('treatmentHistory')} count={animal.treatments?.length ?? 0} />
            <TabButton active={tab === 'reports'} onClick={() => setTab('reports')} icon={<FileText size={16} />} label={t('pastReports')} count={animal.reports?.length ?? 0} />
          </div>
        </div>

        {/* Tab content */}
        <div className="p-5 min-h-[200px]">
          {tab === 'vaccinations' && (
            <RecordList
              records={animal.vaccinations ?? []}
              emptyIcon={<Syringe size={24} />}
              emptyTitle={t('noRecords')}
              renderItem={(v) => (
                <div className="flex items-start justify-between py-3 border-b border-ink-100 last:border-0">
                  <div>
                    <p className="font-semibold text-sm text-ink-900">{(v as Vaccination).vaccine_name}</p>
                    <p className="text-xs text-ink-500">{(v as Vaccination).administered_date}{(v as Vaccination).administered_by && ` · ${(v as Vaccination).administered_by}`}</p>
                    {(v as Vaccination).next_due_date && (
                      <p className="text-xs text-clay-600 mt-0.5">{t('nextDue')}: {(v as Vaccination).next_due_date}</p>
                    )}
                  </div>
                </div>
              )}
              action={
                <button onClick={() => setShowAddVac(true)} className="btn-secondary text-sm">
                  <Plus size={16} /> {t('addVaccination')}
                </button>
              }
            />
          )}

          {tab === 'treatments' && (
            <RecordList
              records={animal.treatments ?? []}
              emptyIcon={<Pill size={24} />}
              emptyTitle={t('noRecords')}
              renderItem={(tr) => (
                <div className="py-3 border-b border-ink-100 last:border-0">
                  <p className="font-semibold text-sm text-ink-900">{(tr as Treatment).treatment}</p>
                  {(tr as Treatment).diagnosis && <p className="text-xs text-ink-600 mt-0.5">{t('diagnosis')}: {(tr as Treatment).diagnosis}</p>}
                  <p className="text-xs text-ink-500 mt-0.5">{(tr as Treatment).treatment_date}</p>
                  {(tr as Treatment).vet_notes && <p className="text-xs text-ink-400 mt-1 italic">{(tr as Treatment).vet_notes}</p>}
                </div>
              )}
              action={
                <button onClick={() => setShowAddTreat(true)} className="btn-secondary text-sm">
                  <Plus size={16} /> {t('addTreatment')}
                </button>
              }
            />
          )}

          {tab === 'reports' && (
            <RecordList
              records={animal.reports ?? []}
              emptyIcon={<FileText size={24} />}
              emptyTitle={t('noRecords')}
              renderItem={(r) => (
                <div className="flex items-center justify-between py-3 border-b border-ink-100 last:border-0">
                  <div>
                    <p className="text-sm text-ink-700">{(r as Report).symptoms.length} {t('symptoms').toLowerCase()}</p>
                    <p className="text-xs text-ink-500">{new Date((r as Report).created_at).toLocaleDateString()}</p>
                  </div>
                  <SeverityBadge severity={(r as Report).severity} size="sm" />
                </div>
              )}
            />
          )}
        </div>
      </div>

      {showAddVac && (
        <AddVaccinationModal animalId={animal.id} onClose={() => setShowAddVac(false)} onAdded={() => { setShowAddVac(false); onUpdate(); }} />
      )}
      {showAddTreat && (
        <AddTreatmentModal animalId={animal.id} onClose={() => setShowAddTreat(false)} onAdded={() => { setShowAddTreat(false); onUpdate(); }} />
      )}
    </Modal>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{count}</span>
      {count > 0 && <span className={`text-[10px] rounded-full px-1.5 ${active ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-600'}`}>{count}</span>}
    </button>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800 capitalize">{value}</p>
    </div>
  );
}

function RecordList({ records, emptyIcon, emptyTitle, renderItem, action }: {
  records: unknown[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  renderItem: (r: unknown) => React.ReactNode;
  action?: React.ReactNode;
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-400 mx-auto mb-2">{emptyIcon}</div>
        <p className="text-sm text-ink-500 mb-4">{emptyTitle}</p>
        {action}
      </div>
    );
  }
  return (
    <div>
      {action && <div className="mb-3">{action}</div>}
      {records.map((r, i) => <div key={i}>{renderItem(r)}</div>)}
    </div>
  );
}

// ─── Add Animal Modal ───────────────────────────────────────
function AddAnimalModal({ ownerId, onClose, onAdded }: { ownerId: string; onClose: () => void; onAdded: () => void }) {
  const { t, lang } = useAuth();
  const [herdId, setHerdId] = useState<string | null>(null);
  const [herds, setHerds] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [species, setSpecies] = useState('cattle');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('herds').select('id, name').eq('owner_id', ownerId).then(({ data }) => {
      setHerds((data as { id: string; name: string }[]) ?? []);
    });
  }, [ownerId]);

  const speciesInfo = SPECIES.find((s) => s.key === species);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let hid = herdId;
      if (!hid) {
        const { data: newHerd, error: herdErr } = await supabase
          .from('herds')
          .insert({ name: `${name || 'My'} Herd`, owner_id: ownerId })
          .select('id')
          .single();
        if (herdErr) throw herdErr;
        hid = (newHerd as { id: string }).id;
      }

      const { error: insertErr } = await supabase.from('animals').insert({
        herd_id: hid,
        name: name || null,
        tag_number: tag || null,
        species,
        breed: breed || null,
        sex,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
      });
      if (insertErr) throw insertErr;
      onAdded();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  }

  return (
    <Modal open={true} onClose={onClose} title={t('addAnimal')}>
      <div className="space-y-4">
        {/* Species selector with photos */}
        <div>
          <label className="label">{t('selectSpecies')}</label>
          <div className="grid grid-cols-3 gap-2">
            {SPECIES.map((s) => (
              <button
                key={s.key}
                onClick={() => { setSpecies(s.key); setBreed(''); }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${species === s.key ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent'}`}
              >
                <img src={s.photo} alt={s.label[lang]} className="w-full h-16 object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-semibold text-white leading-tight">{s.label[lang]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Photo preview */}
        <div className="flex items-center gap-3">
          <img src={photoUrl || speciesInfo?.photo} alt="preview" className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1">
            <label className="label">{t('photoUpload')}</label>
            <input className="input text-sm" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Photo URL (optional)" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('animalName')}</label>
              <VoiceInput onTranscript={(text) => setName((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
            </div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakshmi" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('tagNumber')}</label>
              <VoiceInput onTranscript={(text) => setTag((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
            </div>
            <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. 001" />
          </div>
        </div>

        <div>
          <label className="label">{t('selectBreed')}</label>
          <select className="input" value={breed} onChange={(e) => setBreed(e.target.value)}>
            <option value="">—</option>
            {speciesInfo?.breeds.map((b) => <option key={b} value={b}>{getBreedLabel(b, lang)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('sex')}</label>
            <select className="input" value={sex} onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'unknown')}>
              <option value="unknown">{t('unknown')}</option>
              <option value="female">{t('female')}</option>
              <option value="male">{t('male')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('birthDate')}</label>
            <input type="date" className="input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
        </div>

        {herds.length > 0 && (
          <div>
            <label className="label">{t('herd')}</label>
            <select className="input" value={herdId ?? ''} onChange={(e) => setHerdId(e.target.value || null)}>
              <option value="">{t('createHerd')}</option>
              {herds.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? <Spinner size={18} /> : t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Vaccination Modal ──────────────────────────────────
function AddVaccinationModal({ animalId, onClose, onAdded }: { animalId: string; onClose: () => void; onAdded: () => void }) {
  const { t } = useAuth();
  const [vaccineName, setVaccineName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDue, setNextDue] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('vaccinations').insert({
      animal_id: animalId,
      vaccine_name: vaccineName,
      administered_date: date,
      next_due_date: nextDue || null,
      administered_by: administeredBy || null,
    });
    setSaving(false);
    onAdded();
  }

  return (
    <Modal open={true} onClose={onClose} title={t('addVaccination')} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">{t('vaccineName')}</label>
          <input className="input" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder={t('vaccinationName_ph')} />
        </div>
        <div>
          <label className="label">{t('administeredDate')}</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('nextDue')}</label>
          <input type="date" className="input" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('administeredBy')}</label>
          <input className="input" value={administeredBy} onChange={(e) => setAdministeredBy(e.target.value)} placeholder="Vet name" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !vaccineName} className="btn-primary flex-1">
            {saving ? <Spinner size={18} /> : t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Treatment Modal ────────────────────────────────────
function AddTreatmentModal({ animalId, onClose, onAdded }: { animalId: string; onClose: () => void; onAdded: () => void }) {
  const { t } = useAuth();
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from('treatments').insert({
      animal_id: animalId,
      diagnosis: diagnosis || null,
      treatment,
      treatment_date: date,
      vet_notes: notes || null,
    });
    setSaving(false);
    onAdded();
  }

  return (
    <Modal open={true} onClose={onClose} title={t('addTreatment')} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">{t('diagnosis')}</label>
          <input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. FMD" />
        </div>
        <div>
          <label className="label">{t('treatment')}</label>
          <input className="input" value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="e.g. Antibiotics, fluids" />
        </div>
        <div>
          <label className="label">{t('treatmentDate')}</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('vetNotes')}</label>
          <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving || !treatment} className="btn-primary flex-1">
            {saving ? <Spinner size={18} /> : t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
