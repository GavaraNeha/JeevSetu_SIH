import type { Language } from '@/types/db';

export interface SpeciesInfo {
  key: string;
  label: Record<Language, string>;
  icon: string;
  photo: string;
  breeds: string[];
  commonSymptoms: { key: string; label: Record<Language, string> }[];
}

export const SPECIES: SpeciesInfo[] = [
  {
    key: 'cattle',
    label: { en: 'Cattle (Cow)', hi: 'गोवंश (गाय)', te: 'ఆవు (పశువు)' },
    icon: '🐮',
    photo: 'https://images.pexels.com/photos/30147594/pexels-photo-30147594.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Holstein Friesian', 'Jersey', 'Crossbred', 'Nagauri', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'High fever', hi: 'उच्च बुखार', te: 'అధిక జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'reduced_milk', label: { en: 'Reduced milk yield', hi: 'दूध उत्पादन कम', te: 'పాల ఉత్పత్తి తగ్గడం' } },
      { key: 'nasal_discharge', label: { en: 'Nasal discharge', hi: 'नाक से स्राव', te: 'ముక్కు స్రావం' } },
      { key: 'coughing', label: { en: 'Coughing', hi: 'खांसी', te: 'దగ్గు' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'lameness', label: { en: 'Lameness', hi: 'लंगड़ापन', te: 'కాలు జారడం' } },
      { key: 'salivation', label: { en: 'Excess salivation', hi: 'अधिक लार', te: 'అధిక లాలాజలం' } },
      { key: 'abortion', label: { en: 'Abortion', hi: 'गर्भपात', te: 'గర్భస్రావం' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
    ],
  },
  {
    key: 'buffalo',
    label: { en: 'Buffalo', hi: 'भैंस', te: 'దున్న' },
    icon: '🐃',
    photo: 'https://images.pexels.com/photos/13180841/pexels-photo-13180841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Murrah', 'Nili-Ravi', 'Mehsana', 'Jaffarabadi', 'Surti', 'Bhadawari', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'High fever', hi: 'उच्च बुखार', te: 'అధిక జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'reduced_milk', label: { en: 'Reduced milk yield', hi: 'दूध उत्पादन कम', te: 'పాల ఉత్పత్తి తగ్గడం' } },
      { key: 'nasal_discharge', label: { en: 'Nasal discharge', hi: 'नाक से स्राव', te: 'ముక్కు స్రావం' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'lameness', label: { en: 'Lameness', hi: 'लंगड़ापन', te: 'కాలు జారడం' } },
      { key: 'bloating', label: { en: 'Bloating', hi: 'पेट फूलना', te: 'పొత్తి ఉబ్బడం' } },
      { key: 'skin_lesions', label: { en: 'Skin lesions / nodules', hi: 'त्वचा पर घाव', te: 'చర్మ గాయాలు' } },
      { key: 'salivation', label: { en: 'Excess salivation', hi: 'अधिक लार', te: 'అధిక లాలాజలం' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
    ],
  },
  {
    key: 'goat',
    label: { en: 'Goat', hi: 'बकरी', te: 'మేక' },
    icon: '🐐',
    photo: 'https://images.pexels.com/photos/28607441/pexels-photo-28607441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Black Bengal', 'Jamunapari', 'Beetal', 'Sirohi', 'Osmanabadi', 'Barbari', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'High fever', hi: 'उच्च बुखार', te: 'అధిక జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'nasal_discharge', label: { en: 'Nasal discharge', hi: 'नाक से स्राव', te: 'ముక్కు స్రావం' } },
      { key: 'coughing', label: { en: 'Coughing', hi: 'खांसी', te: 'దగ్గు' } },
      { key: 'lameness', label: { en: 'Lameness', hi: 'लंगड़ापन', te: 'కాలు జారడం' } },
      { key: 'skin_lesions', label: { en: 'Skin lesions / scabs', hi: 'त्वचा पर घाव', te: 'చర్మ గాయాలు' } },
      { key: 'abortion', label: { en: 'Abortion', hi: 'गर्भपात', te: 'గర్భస్రావం' } },
      { key: 'mouth_lesions', label: { en: 'Mouth sores', hi: 'मुंह में घाव', te: 'నోటి పుండ్లు' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
    ],
  },
  {
    key: 'sheep',
    label: { en: 'Sheep', hi: 'भेड़', te: 'గొర్రె' },
    icon: '🐑',
    photo: 'https://images.pexels.com/photos/8783454/pexels-photo-8783454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Nellore', 'Mandya', 'Deccani', 'Malpura', 'Marwari', 'Chokla', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'High fever', hi: 'उच्च बुखार', te: 'అధిక జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'nasal_discharge', label: { en: 'Nasal discharge', hi: 'नाक से स्राव', te: 'ముక్కు స్రావం' } },
      { key: 'coughing', label: { en: 'Coughing', hi: 'खांसी', te: 'దగ్గు' } },
      { key: 'lameness', label: { en: 'Lameness', hi: 'लंगड़ापन', te: 'కాలు జారడం' } },
      { key: 'skin_lesions', label: { en: 'Skin lesions / wool loss', hi: 'ऊन गिरना', te: 'ఉన్ని రాలడం' } },
      { key: 'mouth_lesions', label: { en: 'Mouth sores', hi: 'मुंह में घाव', te: 'నోటి పుండ్లు' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
    ],
  },
  {
    key: 'pig',
    label: { en: 'Pig', hi: 'सुअर', te: 'పంది' },
    icon: '🐷',
    photo: 'https://images.pexels.com/photos/20729021/pexels-photo-20729021.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Large White Yorkshire', 'Landrace', 'Duroc', 'Indigenous', 'Crossbred', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'High fever', hi: 'उच्च बुखार', te: 'అధిక జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'coughing', label: { en: 'Coughing', hi: 'खांसी', te: 'దగ్గు' } },
      { key: 'skin_lesions', label: { en: 'Skin redness / lesions', hi: 'त्वचा लाल होना', te: 'చర్మం ఎరుపు' } },
      { key: 'lameness', label: { en: 'Lameness', hi: 'लंगड़ापन', te: 'కాలు జారడం' } },
      { key: 'abortion', label: { en: 'Abortion', hi: 'गर्भपात', te: 'గర్భస్రావం' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
    ],
  },
  {
    key: 'poultry',
    label: { en: 'Poultry (Chicken)', hi: 'मुर्गी पालन', te: 'కోడి (పోల్ట్రీ)' },
    icon: '🐔',
    photo: 'https://images.pexels.com/photos/19972937/pexels-photo-19972937.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    breeds: ['Vanaraja', 'Gramapriya', 'Kadaknath', 'Aseel', 'Broiler', 'Layer', 'Other'],
    commonSymptoms: [
      { key: 'fever', label: { en: 'Dullness / fever', hi: 'सुस्त / बुखार', te: 'స్థిమిత / జ్వరం' } },
      { key: 'loss_of_appetite', label: { en: 'Loss of appetite', hi: 'भूख की कमी', te: 'ఆకలి లేకపోవడం' } },
      { key: 'reduced_egg', label: { en: 'Reduced egg production', hi: 'अंडा उत्पादन कम', te: 'గుడ్డు ఉత్పత్తి తగ్గడం' } },
      { key: 'nasal_discharge', label: { en: 'Nasal / eye discharge', hi: 'आंख-नाक से स्राव', te: 'కళ్లు-ముక్కు స్రావం' } },
      { key: 'coughing', label: { en: 'Coughing / sneezing', hi: 'खांसी / छींक', te: 'దగ్గు / తుమ్ము' } },
      { key: 'diarrhea', label: { en: 'Diarrhea', hi: 'दस्त', te: 'అతిసారం' } },
      { key: 'lameness', label: { en: 'Lameness / paralysis', hi: 'लंगड़ापन / पक्षाघात', te: 'కాలు జారడం / పక్షవాతం' } },
      { key: 'sudden_death', label: { en: 'Sudden death / Mortality', hi: 'अचानक मृत्यु / पशु मौत', te: 'హఠాత్ మరణం / చనిపోవడం' } },
      { key: 'skin_lesions', label: { en: 'Skin lesions / swellings', hi: 'त्वचा पर सूजन', te: 'చర్మ వాపు' } },
    ],
  },
];

export function getSpeciesInfo(key: string): SpeciesInfo | undefined {
  return SPECIES.find((s) => s.key === key);
}

export function getSpeciesPhoto(key: string): string {
  return getSpeciesInfo(key)?.photo ?? SPECIES[0].photo;
}

export function getSpeciesLabel(key: string, lang: Language): string {
  return getSpeciesInfo(key)?.label[lang] ?? key;
}

export const BREED_LABELS: Record<string, Record<Language, string>> = {
  // Cattle
  Gir: { en: 'Gir', hi: 'गिर', te: 'గిర్' },
  Sahiwal: { en: 'Sahiwal', hi: 'साहीवाल', te: 'సాహివాల్' },
  'Red Sindhi': { en: 'Red Sindhi', hi: 'रेड सिंधी', te: 'రెడ్ సింధీ' },
  Tharparkar: { en: 'Tharparkar', hi: 'थारपारकर', te: 'తార్పార్కర్' },
  'Holstein Friesian': { en: 'Holstein Friesian', hi: 'होलस्टीन फ्रीजियन', te: 'హోల్‌స్టెయిన్ ఫ్రీసియన్' },
  Jersey: { en: 'Jersey', hi: 'जर्सी', te: 'జెర్సీ' },
  Crossbred: { en: 'Crossbred', hi: 'संकर नस्ल', te: 'సంకర జాతి' },
  Nagauri: { en: 'Nagauri', hi: 'नागौरी', te: 'నాగౌరీ' },

  // Buffalo
  Murrah: { en: 'Murrah', hi: 'मुर्रा', te: 'మురా' },
  'Nili-Ravi': { en: 'Nili-Ravi', hi: 'नीली-रावी', te: 'నీలి-రావి' },
  Mehsana: { en: 'Mehsana', hi: 'मेहसाना', te: 'మెహసానా' },
  Jaffarabadi: { en: 'Jaffarabadi', hi: 'जाफराबादी', te: 'జాఫరాబాదీ' },
  Surti: { en: 'Surti', hi: 'सूरती', te: 'సూర్తి' },
  Bhadawari: { en: 'Bhadawari', hi: 'भदावरी', te: 'భదావరి' },

  // Goat
  'Black Bengal': { en: 'Black Bengal', hi: 'ब्लैक बंगाल', te: 'బ్లాక్ బెంగాల్' },
  Jamunapari: { en: 'Jamunapari', hi: 'जमुनापारी', te: 'జమునాపారి' },
  Beetal: { en: 'Beetal', hi: 'बीतल', te: 'బీటల్' },
  Sirohi: { en: 'Sirohi', hi: 'सिरोही', te: 'సిరోహి' },
  Osmanabadi: { en: 'Osmanabadi', hi: 'उस्मानाबादी', te: 'ఉస్మానాబాదీ' },
  Barbari: { en: 'Barbari', hi: 'बरबरी', te: 'బర్బరీ' },
  Boer: { en: 'Boer', hi: 'Boer', te: 'బోయర్' },

  // Sheep
  Nellore: { en: 'Nellore', hi: 'नेल्लौर', te: 'నెల్లూరు' },
  Mandya: { en: 'Mandya', hi: 'मांड्या', te: 'మాండ్యా' },
  Deccani: { en: 'Deccani', hi: 'डेक्कनी', te: 'దక్కనీ' },
  Malpura: { en: 'Malpura', hi: 'मालपुरा', te: 'మాల్‌పురా' },
  Marwari: { en: 'Marwari', hi: 'मारवाड़ी', te: 'మార్వాడీ' },
  Chokla: { en: 'Chokla', hi: 'चोकला', te: 'చోక్లా' },

  // Pig
  'Large White Yorkshire': { en: 'Large White Yorkshire', hi: 'Large White Yorkshire', te: 'Large White Yorkshire' },
  Landrace: { en: 'Landrace', hi: 'Landrace', te: 'Landrace' },
  Duroc: { en: 'Duroc', hi: 'Duroc', te: 'Duroc' },
  Indigenous: { en: 'Indigenous / Desi', hi: 'देशी', te: 'దేశీ' },

  // Poultry
  Vanaraja: { en: 'Vanaraja', hi: 'वनराजा', te: 'వనరాజ' },
  Gramapriya: { en: 'Gramapriya', hi: 'ग्रामप्रिया', te: 'గ్రామప్రియ' },
  Kadaknath: { en: 'Kadaknath', hi: 'कड़कनाथ', te: 'కడక్నాథ్' },
  Aseel: { en: 'Aseel', hi: 'असील', te: 'అసీల్' },
  Broiler: { en: 'Broiler', hi: 'Broiler', te: 'Broiler' },
  Layer: { en: 'Layer', hi: 'Layer', te: 'Layer' },

  // General
  Other: { en: 'Other', hi: 'अन्य', te: 'ఇతర' },
};

export function getBreedLabel(breed: string | null | undefined, lang: Language): string {
  if (!breed) return '';
  const labelObj = BREED_LABELS[breed];
  if (!labelObj) return breed;
  return labelObj[lang] ?? breed;
}
