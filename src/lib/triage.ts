import type { Severity } from '@/types/db';
import { getSpeciesInfo } from './species';

export interface TriageInput {
  species: string;
  symptoms: string[];
  notes: string;
  numberOfAnimalsAffected?: number;
}

export interface TriageResult {
  severity: Severity;
  vetReferralNeeded: boolean;
  recommendation: string;
}

// ─────────────────────────────────────────────────────────────
// HIGH-RISK symptom groups that suggest notifiable / outbreak diseases
// ─────────────────────────────────────────────────────────────
const OUTBREAK_INDICATORS: Record<string, string[]> = {
  cattle: ['salivation', 'skin_lesions', 'lameness', 'abortion', 'nasal_discharge', 'sudden_death'],
  buffalo: ['salivation', 'skin_lesions', 'lameness', 'abortion', 'nasal_discharge', 'sudden_death'],
  goat: ['mouth_lesions', 'skin_lesions', 'abortion', 'nasal_discharge', 'sudden_death'],
  sheep: ['mouth_lesions', 'skin_lesions', 'nasal_discharge', 'sudden_death'],
  pig: ['skin_lesions', 'abortion', 'fever', 'sudden_death'],
  poultry: ['sudden_death', 'reduced_egg', 'nasal_discharge', 'coughing'],
};

const HIGH_INDICATORS: Record<string, string[]> = {
  cattle: ['fever', 'diarrhea', 'bloating', 'reduced_milk', 'loss_of_appetite'],
  buffalo: ['fever', 'diarrhea', 'bloating', 'reduced_milk', 'loss_of_appetite'],
  goat: ['fever', 'diarrhea', 'nasal_discharge', 'coughing'],
  sheep: ['fever', 'diarrhea', 'coughing', 'nasal_discharge'],
  pig: ['fever', 'diarrhea', 'coughing', 'skin_lesions'],
  poultry: ['fever', 'sudden_death', 'diarrhea', 'reduced_egg'],
};

/**
 * RULE-BASED TRIAGE ENGINE
 *
 * This function assesses symptom severity and generates a triage recommendation.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  AI PLUG-IN POINT                                                 │
 * │  To replace this with an external AI API call later:              │
 * │  1. Create a Supabase Edge Function at `supabase/functions/triage`│
 * │  2. Call it from here via fetch():                                │
 * │     const res = await fetch(`${SUPABASE_URL}/functions/v1/triage`│
 * │       { method:'POST', headers, body: JSON.stringify(input) })   │
 * │  3. The edge function can call your AI provider and return       │
 * │     a TriageResult with severity + recommendation.               │
 * │  4. Keep this rule-based function as the fallback.               │
 * └──────────────────────────────────────────────────────────────────┘
 */
export function ruleBasedTriage(input: TriageInput): TriageResult {
  const { species, symptoms, notes, numberOfAnimalsAffected } = input;
  const lowerNotes = notes.toLowerCase();
  const symptomCount = symptoms.length;
  const outbreakSymptoms = OUTBREAK_INDICATORS[species] ?? [];
  const highSymptoms = HIGH_INDICATORS[species] ?? [];

  const outbreakHits = symptoms.filter((s) => outbreakSymptoms.includes(s));
  const highHits = symptoms.filter((s) => highSymptoms.includes(s));

  // Check for multi-animal outbreak language in notes
  const outbreakKeywords = [
    'many animals',
    'entire herd',
    'multiple animals',
    'spreading',
    'outbreak',
    'several died',
    'death',
    'dying',
  ];
  const notesSuggestOutbreak = outbreakKeywords.some((k) => lowerNotes.includes(k));
  const manyAffected = (numberOfAnimalsAffected ?? 1) > 3;

  // OUTBREAK-RISK: sudden_death selected, 3+ outbreak symptoms, or outbreak language in notes, or many animals affected
  if (symptoms.includes('sudden_death') || outbreakHits.length >= 3 || (outbreakHits.length >= 2 && notesSuggestOutbreak) || (manyAffected && outbreakHits.length >= 1) || (notesSuggestOutbreak && symptomCount >= 4)) {
    return {
      severity: 'outbreak-risk',
      vetReferralNeeded: true,
      recommendation: symptoms.includes('sudden_death')
        ? 'Animal mortality / sudden death reported. High risk of contagious outbreak. Immediate veterinary inspection and district notification required. Isolate remaining herd.'
        : 'Potential outbreak detected. Immediate veterinary intervention and district notification required. Isolate affected animals and restrict movement.',
    };
  }

  // HIGH: 2+ high-risk symptoms or outbreak indicators with fever
  if (highHits.length >= 3 || (outbreakHits.length >= 2 && highHits.length >= 1) || (highHits.length >= 2 && symptomCount >= 4)) {
    return {
      severity: 'high',
      vetReferralNeeded: true,
      recommendation:
        'Serious symptoms detected. Veterinary examination recommended within 24 hours. Monitor other animals in the herd closely.',
    };
  }

  // MEDIUM: 2+ symptoms or 1 high-risk symptom
  if (symptomCount >= 3 || highHits.length >= 1 || outbreakHits.length >= 1) {
    return {
      severity: 'medium',
      vetReferralNeeded: highHits.length >= 1,
      recommendation:
        'Monitor closely. Isolate the animal if possible. If symptoms worsen or persist beyond 48 hours, consult a veterinarian.',
    };
  }

  // LOW: minor symptoms
  return {
    severity: 'low',
    vetReferralNeeded: false,
    recommendation:
      'Mild symptoms. Keep the animal comfortable and hydrated. Observe for 48 hours. Report again if condition changes.',
  };
}

/**
 * Main triage entry point. Currently uses rule-based logic.
 * Replace the body with an edge-function call when AI is wired up.
 */
export async function runTriage(input: TriageInput): Promise<TriageResult> {
  // ── AI PLUG-IN POINT ──────────────────────────────────────────
  // When ready, uncomment and replace with an edge function call:
  //
  // try {
  //   const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/triage`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  //     },
  //     body: JSON.stringify(input),
  //   });
  //   if (res.ok) return (await res.json()) as TriageResult;
  // } catch { /* fall through to rule-based */ }
  // ──────────────────────────────────────────────────────────────

  return ruleBasedTriage(input);
}

export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bg: string; border: string; text: string; dot: string }
> = {
  low: {
    label: 'Low',
    color: 'severity-low',
    bg: 'bg-brand-50',
    border: 'border-brand-300',
    text: 'text-brand-700',
    dot: 'bg-brand-500',
  },
  medium: {
    label: 'Medium',
    color: 'severity-medium',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  high: {
    label: 'High',
    color: 'severity-high',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  'outbreak-risk': {
    label: 'Outbreak Risk',
    color: 'severity-outbreak-risk',
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};
