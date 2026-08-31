import type { Severity, Language } from '@/types/db';
import { getSpeciesInfo } from './species';

export interface TriageInput {
  species: string;
  symptoms: string[];
  notes: string;
  numberOfAnimalsAffected?: number;
  lang?: Language;
}

export interface TriageResult {
  severity: Severity;
  vetReferralNeeded: boolean;
  recommendation: string;
  recommendationKey: 'outbreak_mortality' | 'outbreak_multi' | 'high' | 'medium' | 'low';
}

export const TRIAGE_RECOMMENDATIONS: Record<
  'outbreak_mortality' | 'outbreak_multi' | 'high' | 'medium' | 'low',
  Record<Language, string>
> = {
  outbreak_mortality: {
    en: 'Animal mortality / sudden death reported. High risk of contagious outbreak. Immediate veterinary inspection and district notification required. Isolate remaining herd.',
    hi: 'पशु मृत्यु / अचानक मौत की सूचना। संक्रामक प्रकोप का उच्च जोखिम। तत्काल पशुचिकित्सा निरीक्षण और जिला अधिसूचना आवश्यक। शेष झुंड को अलग करें।',
    te: 'జంతువు మరణం / హఠాత్ మరణం నివేదించబడింది. సోకే వ్యాప్తి ప్రమాదం ఎక్కువగా ఉంది. తక్షణ పశువైద్య తనిఖీ మరియు జిల్లా సమాచారం అవసరం. మిగిలిన మందని వేరు చేయండి.',
  },
  outbreak_multi: {
    en: 'Potential outbreak detected. Immediate veterinary intervention and district notification required. Isolate affected animals and restrict movement.',
    hi: 'संभावित प्रकोप का पता चला। तत्काल पशुचिकित्सा हस्तक्षेप और जिला अधिसूचना आवश्यक। प्रभावित पशुओं को अलग करें और आवाजाही प्रतिबंधित करें।',
    te: 'సంభావ్య వ్యాప్తి గుర్తించబడింది. తక్షణ పశువైద్య జోక్యం మరియు జిల్లా సమాచారం అవసరం. ప్రభావిత జంతువులను వేరు చేయండి మరియు కదలికలను పరిమితం చేయండి.',
  },
  high: {
    en: 'Serious symptoms detected. Veterinary examination recommended within 24 hours. Monitor other animals in the herd closely.',
    hi: 'गंभीर लक्षण पाए गए। 24 घंटे के भीतर पशुचिकित्सक जांच की सिफारिश की जाती है। झुंड के अन्य पशुओं की निगरानी करें।',
    te: 'తీవ్రమైన లక్షణాలు గుర్తించబడ్డాయి. 24 గంటల్లోగా పశువైద్య పరీక్ష శ్రేయస్కరం. మందలోని ఇతర జంతువులను దగ్గరగా గమనించండి.',
  },
  medium: {
    en: 'Monitor closely. Isolate the animal if possible. If symptoms worsen or persist beyond 48 hours, consult a veterinarian.',
    hi: 'गहन निगरानी करें। संभव हो तो पशु को अलग करें। यदि लक्षण बिगड़ते हैं या 48 घंटे से अधिक रहते हैं, तो पशुचिकित्सक से परामर्श लें।',
    te: 'దగ్గరగా గమనించండి. వీలైతే జంతువును వేరు చేయండి. లక్షణాలు మరింత తీవ్రమైనా లేదా 48 గంటలు దాటినా, పశువైద్యుడిని సంప్రదించండి.',
  },
  low: {
    en: 'Mild symptoms. Keep the animal comfortable and hydrated. Observe for 48 hours. Report again if condition changes.',
    hi: 'हल्के लक्षण। पशु को आरामदायक और हाइड्रेटेड रखें। 48 घंटे तक निरीक्षण करें। स्थिति बदलने पर फिर से रिपोर्ट करें।',
    te: 'తేలికపాటి లక్షణాలు. జంతువును సౌకర్యవంతంగా మరియు హైడ్రేటెడ్‌గా ఉంచండి. 48 గంటలు పరిశీలించండి. పరిస్థితి మారితే మళ్లీ నివేదించండి.',
  },
};

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

export function ruleBasedTriage(input: TriageInput): TriageResult {
  const { species, symptoms, notes, numberOfAnimalsAffected, lang = 'en' } = input;
  const lowerNotes = notes.toLowerCase();
  const symptomCount = symptoms.length;
  const outbreakSymptoms = OUTBREAK_INDICATORS[species] ?? [];
  const highSymptoms = HIGH_INDICATORS[species] ?? [];

  const outbreakHits = symptoms.filter((s) => outbreakSymptoms.includes(s));
  const highHits = symptoms.filter((s) => highSymptoms.includes(s));

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

  if (symptoms.includes('sudden_death') || outbreakHits.length >= 3 || (outbreakHits.length >= 2 && notesSuggestOutbreak) || (manyAffected && outbreakHits.length >= 1) || (notesSuggestOutbreak && symptomCount >= 4)) {
    const key = symptoms.includes('sudden_death') ? 'outbreak_mortality' : 'outbreak_multi';
    return {
      severity: 'outbreak-risk',
      vetReferralNeeded: true,
      recommendationKey: key,
      recommendation: TRIAGE_RECOMMENDATIONS[key][lang] ?? TRIAGE_RECOMMENDATIONS[key].en,
    };
  }

  if (highHits.length >= 3 || (outbreakHits.length >= 2 && highHits.length >= 1) || (highHits.length >= 2 && symptomCount >= 4)) {
    return {
      severity: 'high',
      vetReferralNeeded: true,
      recommendationKey: 'high',
      recommendation: TRIAGE_RECOMMENDATIONS.high[lang] ?? TRIAGE_RECOMMENDATIONS.high.en,
    };
  }

  if (symptomCount >= 3 || highHits.length >= 1 || outbreakHits.length >= 1) {
    return {
      severity: 'medium',
      vetReferralNeeded: highHits.length >= 1,
      recommendationKey: 'medium',
      recommendation: TRIAGE_RECOMMENDATIONS.medium[lang] ?? TRIAGE_RECOMMENDATIONS.medium.en,
    };
  }

  return {
    severity: 'low',
    vetReferralNeeded: false,
    recommendationKey: 'low',
    recommendation: TRIAGE_RECOMMENDATIONS.low[lang] ?? TRIAGE_RECOMMENDATIONS.low.en,
  };
}

export async function runTriage(input: TriageInput): Promise<TriageResult> {
  return ruleBasedTriage(input);
}

export function getLocalizedRecommendation(recKey: string | null | undefined, severity: Severity, lang: Language): string {
  if (recKey && recKey in TRIAGE_RECOMMENDATIONS) {
    return TRIAGE_RECOMMENDATIONS[recKey as keyof typeof TRIAGE_RECOMMENDATIONS][lang];
  }
  if (severity === 'outbreak-risk') return TRIAGE_RECOMMENDATIONS.outbreak_multi[lang];
  if (severity === 'high') return TRIAGE_RECOMMENDATIONS.high[lang];
  if (severity === 'medium') return TRIAGE_RECOMMENDATIONS.medium[lang];
  return TRIAGE_RECOMMENDATIONS.low[lang];
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

