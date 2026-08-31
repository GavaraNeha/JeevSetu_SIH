import { useEffect, useState, useCallback } from 'react';
import {
  Stethoscope, AlertTriangle, CheckCircle2, Activity, Search, X,
  User, MapPin, FlaskConical, Plus, ArrowRight, Filter, TestTube, Send, Bell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getSpeciesPhoto, getSpeciesLabel, getBreedLabel, SPECIES } from '@/lib/species';
import { getLocalizedRecommendation } from '@/lib/triage';
import { normalizeLocation } from '@/lib/location';
import { SeverityBadge } from '@/components/SeverityBadge';
import { VoiceInput } from '@/components/VoiceInput';
import { Modal } from '@/components/Modal';
import { LoadingList, EmptyState, Spinner, ErrorState } from '@/components/ui';
import type {
  Report, Case, Profile, LabReferral, CaseWithRelations,
  CaseStatus, Severity, LabReferralStatus,
} from '@/types/db';

export function VetDashboard() {
  const { t, lang } = useAuth();
  const [cases, setCases] = useState<CaseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<CaseWithRelations | null>(null);
  const [vets, setVets] = useState<Profile[]>([]);

  // filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        report:reports(*),
        lab_referrals(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setError(true);
    } else {
      setCases((data as CaseWithRelations[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCases();
    supabase.from('profiles').select('*').eq('role', 'vet_official').then(({ data }) => {
      setVets((data as Profile[]) ?? []);
    });
  }, [loadCases]);

  // Collect unique locations for filter dropdowns
  const villages = [...new Set(cases.map((c) => normalizeLocation(c.report?.village)).filter(Boolean))] as string[];
  const blocks = [...new Set(cases.map((c) => normalizeLocation(c.report?.block)).filter(Boolean))] as string[];
  const districts = [...new Set(cases.map((c) => normalizeLocation(c.report?.district)).filter(Boolean))] as string[];

  // Filter cases
  const filtered = cases.filter((c) => {
    const report = c.report;
    if (!report) return false;
    if (severityFilter !== 'all' && report.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (speciesFilter !== 'all' && report.species !== speciesFilter) return false;
    if (villageFilter !== 'all' && normalizeLocation(report.village) !== villageFilter) return false;
    if (blockFilter !== 'all' && normalizeLocation(report.block) !== blockFilter) return false;
    if (districtFilter !== 'all' && normalizeLocation(report.district) !== districtFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches =
        report.village?.toLowerCase().includes(q) ||
        report.district?.toLowerCase().includes(q) ||
        report.block?.toLowerCase().includes(q) ||
        report.species.toLowerCase().includes(q) ||
        report.breed?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const openCases = cases.filter((c) => c.status === 'open').length;
  const resolvedCases = cases.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const labPending = cases.filter((c) => c.status === 'lab_referral_pending' || (c.lab_referrals && c.lab_referrals.length > 0 && c.lab_referrals.some((r) => r.status !== 'completed'))).length;
  const outbreakAlerts = cases.filter((c) => c.report?.severity === 'outbreak-risk' && c.status !== 'closed' && c.status !== 'resolved').length;

  async function refreshCase(caseId: string) {
    const { data } = await supabase
      .from('cases')
      .select(`*, report:reports(*), lab_referrals(*)`)
      .eq('id', caseId)
      .single();
    if (data) {
      const updated = data as CaseWithRelations;
      setSelected(updated);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{t('caseManagement')}</h1>
        <p className="text-ink-500 text-sm mt-0.5">{t('dashboard')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox icon={<Activity size={20} />} value={openCases} label={t('openCases')} color="clay" />
        <StatBox icon={<FlaskConical size={20} />} value={labPending} label={t('labReferralPending')} color={labPending > 0 ? 'red' : 'ink'} />
        <StatBox icon={<CheckCircle2 size={20} />} value={resolvedCases} label={t('resolvedCases')} color="brand" />
        <StatBox icon={<AlertTriangle size={20} />} value={outbreakAlerts} label={t('outbreakAlerts')} color={outbreakAlerts > 0 ? 'red' : 'ink'} pulse={outbreakAlerts > 0} />
        <StatBox icon={<Stethoscope size={20} />} value={cases.length} label={t('totalCases')} color="ink" />
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchCases')}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                <X size={18} />
              </button>
            )}
          </div>
          <VoiceInput onTranscript={(text) => setSearch((prev) => (prev ? `${prev} ${text}` : text))} />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label={t('allSeverities')} value={severityFilter} onChange={setSeverityFilter} options={[
            { value: 'all', label: t('allSeverities') },
            { value: 'outbreak-risk', label: t('outbreak-risk') },
            { value: 'high', label: t('high') },
            { value: 'medium', label: t('medium') },
            { value: 'low', label: t('low') },
          ]} />
          <FilterSelect label={t('allStatuses')} value={statusFilter} onChange={setStatusFilter} options={[
            { value: 'all', label: t('allStatuses') },
            { value: 'open', label: t('open') },
            { value: 'in_progress', label: t('inProgress') },
            { value: 'lab_referral_pending', label: t('labReferralPending') },
            { value: 'resolved', label: t('resolved') },
            { value: 'closed', label: t('closed') },
          ]} />
          <FilterSelect label={t('allSpecies')} value={speciesFilter} onChange={setSpeciesFilter} options={[
            { value: 'all', label: t('allSpecies') },
            ...SPECIES.map((s) => ({ value: s.key, label: s.label.en })),
          ]} />
          {districts.length > 0 && (
            <FilterSelect label={t('allDistricts')} value={districtFilter} onChange={setDistrictFilter} options={[
              { value: 'all', label: t('allDistricts') },
              ...districts.map((d) => ({ value: d, label: d })),
            ]} />
          )}
          {blocks.length > 0 && (
            <FilterSelect label={t('allBlocks')} value={blockFilter} onChange={setBlockFilter} options={[
              { value: 'all', label: t('allBlocks') },
              ...blocks.map((b) => ({ value: b, label: b })),
            ]} />
          )}
          {villages.length > 0 && (
            <FilterSelect label={t('allVillages')} value={villageFilter} onChange={setVillageFilter} options={[
              { value: 'all', label: t('allVillages') },
              ...villages.map((v) => ({ value: v, label: v })),
            ]} />
          )}
        </div>
      </div>

      {/* Case list */}
      {loading ? (
        <LoadingList count={5} />
      ) : error ? (
        <ErrorState message={t('error')} onRetry={loadCases} />
      ) : filtered.length === 0 ? (
        <div className="card p-8">
          <EmptyState icon={<Stethoscope size={28} />} title={t('noCases')} />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <CaseRow key={c.id} caseData={c} onClick={() => setSelected(c)} index={i} lang={lang} t={t} />
          ))}
        </div>
      )}

      {/* Case detail */}
      {selected && (
        <CaseDetailModal
          caseData={selected}
          vets={vets}
          onClose={() => setSelected(null)}
          onUpdate={() => refreshCase(selected.id)}
        />
      )}
    </div>
  );
}

function CaseRow({
  caseData, onClick, index, lang, t,
}: {
  caseData: CaseWithRelations;
  onClick: () => void;
  index: number;
  lang: 'en' | 'hi' | 'te';
  t: (k: string) => string;
}) {
  const report = caseData.report;
  if (!report) return null;

  const statusLabel =
    caseData.status === 'open' ? t('open')
    : caseData.status === 'in_progress' ? t('inProgress')
    : caseData.status === 'resolved' ? t('resolved')
    : t('closed');

  const statusColor =
    caseData.status === 'open' ? 'bg-red-50 text-red-600'
    : caseData.status === 'in_progress' ? 'bg-amber-50 text-amber-600'
    : caseData.status === 'resolved' ? 'bg-brand-50 text-brand-600'
    : 'bg-ink-100 text-ink-500';

  return (
    <div
      onClick={onClick}
      className="card card-hover p-4 flex items-center gap-4 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <img
        src={report.photo_url || getSpeciesPhoto(report.species)}
        alt={report.species}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm text-ink-900 truncate">{getSpeciesLabel(report.species, lang)}</p>
          <SeverityBadge severity={report.severity} size="sm" animate={false} />
        </div>
        <p className="text-xs text-ink-500 truncate">
          {report.symptoms.length} {t('symptoms').toLowerCase()}
          {report.village && ` · ${report.village}`}
          {report.district && `, ${report.district}`}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`chip ${statusColor} text-[11px]`}>{statusLabel}</span>
        <span className="text-[10px] text-ink-400">{new Date(caseData.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label, color, pulse }: {
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

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Case Detail Modal ──────────────────────────────────────
function CaseDetailModal({
  caseData, vets, onClose, onUpdate,
}: {
  caseData: CaseWithRelations;
  vets: Profile[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { t, lang, profile } = useAuth();
  const report = caseData.report;
  const [assignVet, setAssignVet] = useState(caseData.assigned_vet_id ?? '');
  const [newStatus, setNewStatus] = useState<CaseStatus>(caseData.status);
  const [resolutionNotes, setResolutionNotes] = useState(caseData.resolution_notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAssignVet(caseData.assigned_vet_id ?? '');
    setNewStatus(caseData.status);
    setResolutionNotes(caseData.resolution_notes ?? '');
  }, [caseData]);

  // Lab referral state
  const [showLabReferral, setShowLabReferral] = useState(false);
  const [sampleType, setSampleType] = useState('');
  const [labName, setLabName] = useState('');
  const [labSaving, setLabSaving] = useState(false);

  // Lab result entry
  const [labResultInput, setLabResultInput] = useState<Record<string, string>>({});

  if (!report) return null;

  async function handleSave() {
    setSaving(true);
    await supabase
      .from('cases')
      .update({
        assigned_vet_id: assignVet || null,
        status: newStatus,
        resolution_notes: resolutionNotes || null,
      })
      .eq('id', caseData.id);

    // If status is resolved, also update the report status to close the loop
    if (newStatus === 'resolved' || newStatus === 'closed') {
      await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', report!.id);
    }
    setSaving(false);
    onUpdate();
  }

  async function handleAddLabReferral() {
    setLabSaving(true);
    await supabase.from('lab_referrals').insert({
      case_id: caseData.id,
      report_id: report!.id,
      sample_type: sampleType,
      lab_name: labName || null,
    });
    // Auto-set case status to lab_referral_pending
    await supabase.from('cases').update({ status: 'lab_referral_pending' }).eq('id', caseData.id);
    setLabSaving(false);
    setShowLabReferral(false);
    setSampleType('');
    setLabName('');
    onUpdate();
  }

  async function updateLabReferralStatus(ref: LabReferral, status: LabReferralStatus) {
    await supabase.from('lab_referrals').update({ status }).eq('id', ref.id);

    // If status is results_ready or completed, update case to reflect lab progress
    if (status === 'in_lab') {
      await supabase.from('cases').update({ status: 'lab_referral_pending' }).eq('id', caseData.id);
    }
    onUpdate();
  }

  async function saveLabResult(ref: LabReferral) {
    const result = labResultInput[ref.id];
    if (!result) return;
    await supabase.from('lab_referrals').update({
      status: 'completed',
      result,
      result_date: new Date().toISOString(),
    }).eq('id', ref.id);

    // Close the loop: set case to resolved and update report
    await supabase.from('cases').update({
      status: 'resolved',
      resolution_notes: `Lab result: ${result}`,
    }).eq('id', caseData.id);
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', report!.id);

    setLabResultInput((prev) => { const n = { ...prev }; delete n[ref.id]; return n; });
    onUpdate();
  }

  return (
    <Modal open={true} onClose={onClose} size="lg" title={t('caseDetails')}>
      <div className="space-y-5">
        {/* Report summary */}
        <div className="rounded-xl overflow-hidden border border-ink-100">
          <img src={report.photo_url || getSpeciesPhoto(report.species)} alt={report.species} className="w-full h-32 object-cover" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={report.severity} animate={false} />
              <span className="text-xs text-ink-500">{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <p className="font-semibold text-sm text-ink-900">{getSpeciesLabel(report.species, lang)} {report.breed && `· ${getBreedLabel(report.breed, lang)}`}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {report.symptoms.map((s) => {
                const sym = SPECIES.find((sp) => sp.key === report.species)?.commonSymptoms.find((cs) => cs.key === s);
                return sym && <span key={s} className="chip bg-ink-100 text-ink-600 text-[11px]">{sym.label[lang]}</span>;
              })}
            </div>
            {report.notes && <p className="text-sm text-ink-600 mt-2 italic">"{report.notes}"</p>}
            {(report.village || report.district) && (
              <p className="text-xs text-ink-500 flex items-center gap-1 mt-2"><MapPin size={12} /> {report.village}{report.village && report.district && ', '}{report.district}</p>
            )}
            {report.triage_recommendation && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 text-xs text-amber-700">
                {getLocalizedRecommendation(null, report.severity, lang)}
              </div>
            )}
          </div>
        </div>

        {/* Assignment + status */}
        <div className="space-y-3">
          <div>
            <label className="label flex items-center gap-2"><User size={14} /> {t('assignTo')}</label>
            <select className="input" value={assignVet} onChange={(e) => setAssignVet(e.target.value)}>
              <option value="">—</option>
              {vets.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('status')}</label>
            <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as CaseStatus)}>
              <option value="open">{t('open')}</option>
              <option value="in_progress">{t('inProgress')}</option>
              <option value="lab_referral_pending">{t('labReferralPending')}</option>
              <option value="resolved">{t('resolved')}</option>
              <option value="closed">{t('closed')}</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('resolutionNotes')}</label>
              <VoiceInput onTranscript={(text) => setResolutionNotes((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
            </div>
            <textarea className="input min-h-[70px]" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner size={18} /> : t('save')}
          </button>
        </div>

        {/* Lab referrals */}
        <div className="border-t border-ink-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-ink-900 flex items-center gap-2"><FlaskConical size={18} /> {t('labReferral')}</h3>
            <button onClick={() => setShowLabReferral(!showLabReferral)} className="btn-secondary text-sm py-2">
              <Plus size={16} /> {t('requestSample')}
            </button>
          </div>

          {showLabReferral && (
            <div className="bg-clay-50 rounded-xl p-3 space-y-3 mb-3 animate-slide-down">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">{t('sampleType')}</label>
                  <VoiceInput onTranscript={(text) => setSampleType((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
                </div>
                <input className="input" value={sampleType} onChange={(e) => setSampleType(e.target.value)} placeholder={t('sampleType_ph')} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">{t('labName')}</label>
                  <VoiceInput onTranscript={(text) => setLabName((prev) => (prev ? `${prev} ${text}` : text))} size="sm" />
                </div>
                <input className="input" value={labName} onChange={(e) => setLabName(e.target.value)} placeholder={t('labName_ph')} />
              </div>
              <button onClick={handleAddLabReferral} disabled={labSaving || !sampleType} className="btn-primary w-full text-sm">
                {labSaving ? <Spinner size={16} /> : t('save')}
              </button>
            </div>
          )}

          {caseData.lab_referrals && caseData.lab_referrals.length > 0 ? (
            <div className="space-y-2">
              {caseData.lab_referrals.map((ref) => (
                <div key={ref.id} className="border border-ink-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-ink-800 flex items-center gap-1.5"><TestTube size={14} /> {ref.sample_type}</p>
                    <LabStatusBadge status={ref.status} t={t} />
                  </div>
                  <p className="text-xs text-ink-500">{ref.lab_name || '—'}</p>
                  {ref.result && <p className="text-xs text-brand-700 mt-1 font-medium">{t('labResult')}: {ref.result}</p>}

                  {/* Status progression buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <LabStepButton current={ref.status} step="requested" label={t('requested')} onClick={() => updateLabReferralStatus(ref, 'requested')} />
                    <LabStepButton current={ref.status} step="collected" label={t('sampleCollected')} onClick={() => updateLabReferralStatus(ref, 'collected')} icon={<TestTube size={12} />} />
                    <LabStepButton current={ref.status} step="in_lab" label={t('sentToLab')} onClick={() => updateLabReferralStatus(ref, 'in_lab')} icon={<Send size={12} />} />
                    <LabStepButton current={ref.status} step="results_ready" label={t('resultsReady')} onClick={() => updateLabReferralStatus(ref, 'results_ready')} />
                  </div>

                  {/* Lab result entry — appears when sample is in_lab or results_ready */}
                  {(ref.status === 'in_lab' || ref.status === 'results_ready') && !ref.result && (
                    <div className="mt-2 flex items-center gap-2 animate-slide-down">
                      <input
                        className="input text-sm flex-1"
                        value={labResultInput[ref.id] ?? ''}
                        onChange={(e) => setLabResultInput((prev) => ({ ...prev, [ref.id]: e.target.value }))}
                        placeholder={t('enterLabResult')}
                      />
                      <VoiceInput onTranscript={(text) => setLabResultInput((prev) => ({ ...prev, [ref.id]: prev[ref.id] ? `${prev[ref.id]} ${text}` : text }))} size="sm" />
                      <button
                        onClick={() => saveLabResult(ref)}
                        disabled={!labResultInput[ref.id]}
                        className="btn-primary text-sm px-3 whitespace-nowrap"
                      >
                        <Bell size={14} /> {t('closeLoop')}
                      </button>
                    </div>
                  )}

                  {ref.result && ref.status === 'completed' && (
                    <div className="mt-2 bg-brand-50 border border-brand-200 rounded-lg p-2 text-xs text-brand-700 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> {t('loopClosed')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !showLabReferral && <p className="text-xs text-ink-400 text-center py-3">{t('noRecords')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function LabStatusBadge({ status, t }: { status: LabReferralStatus; t: (k: string) => string }) {
  const colors: Record<LabReferralStatus, string> = {
    requested: 'bg-amber-50 text-amber-600',
    collected: 'bg-blue-50 text-blue-600',
    in_lab: 'bg-clay-50 text-clay-600',
    results_ready: 'bg-brand-50 text-brand-600',
    completed: 'bg-ink-100 text-ink-600',
  };
  const labels: Record<LabReferralStatus, string> = {
    requested: t('requested'),
    collected: t('collected'),
    in_lab: t('inLab'),
    results_ready: t('resultsReady'),
    completed: t('completed'),
  };
  return <span className={`chip ${colors[status]} text-[11px]`}>{labels[status]}</span>;
}

function LabStepButton({ current, step, label, onClick, icon }: {
  current: LabReferralStatus;
  step: LabReferralStatus;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  const order: LabReferralStatus[] = ['requested', 'collected', 'in_lab', 'results_ready', 'completed'];
  const currentIdx = order.indexOf(current);
  const stepIdx = order.indexOf(step);
  const isDone = stepIdx < currentIdx || current === 'completed';
  const isCurrent = current === step;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
        isCurrent ? 'bg-brand-600 text-white'
        : isDone ? 'bg-brand-50 text-brand-600'
        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
      }`}
    >
      {isDone && <CheckCircle2 size={12} />}
      {icon}
      {label}
    </button>
  );
}
