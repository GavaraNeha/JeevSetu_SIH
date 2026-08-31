export type Role = 'farmer' | 'field_worker' | 'vet_official' | 'district_official';
export type Language = 'en' | 'hi' | 'te';
export type Severity = 'low' | 'medium' | 'high' | 'outbreak-risk';
export type AnimalStatus = 'healthy' | 'under_treatment' | 'recovered' | 'deceased';
export type ReportStatus = 'new' | 'triaged' | 'assigned' | 'resolved';
export type CaseStatus = 'open' | 'in_progress' | 'lab_referral_pending' | 'resolved' | 'closed';
export type LabReferralStatus = 'requested' | 'collected' | 'in_lab' | 'results_ready' | 'completed';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  language: Language;
  created_at: string;
}

export interface Herd {
  id: string;
  name: string;
  owner_id: string;
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Animal {
  id: string;
  herd_id: string;
  name: string | null;
  tag_number: string | null;
  species: string;
  breed: string | null;
  sex: 'male' | 'female' | 'unknown' | null;
  birth_date: string | null;
  photo_url: string | null;
  status: AnimalStatus;
  created_at: string;
}

export interface Vaccination {
  id: string;
  animal_id: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date: string | null;
  administered_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Treatment {
  id: string;
  animal_id: string;
  diagnosis: string | null;
  treatment: string;
  treatment_date: string;
  vet_notes: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  animal_id: string | null;
  reporter_id: string;
  species: string;
  breed: string | null;
  symptoms: string[];
  notes: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  village: string | null;
  block: string | null;
  district: string | null;
  state: string | null;
  severity: Severity;
  triage_recommendation: string | null;
  vet_referral_needed: boolean;
  status: ReportStatus;
  created_at: string;
}

export interface Case {
  id: string;
  report_id: string;
  assigned_vet_id: string | null;
  status: CaseStatus;
  priority: Severity;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabReferral {
  id: string;
  case_id: string | null;
  report_id: string | null;
  sample_type: string;
  lab_name: string | null;
  status: LabReferralStatus;
  result: string | null;
  result_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Advisory {
  id: string;
  title: string;
  body: string;
  language: Language;
  severity: Severity;
  species: string | null;
  region: string | null;
  created_at: string;
}

export interface ReportWithRelations extends Report {
  animal?: Animal | null;
  reporter?: Profile | null;
  case?: Case | null;
}

export interface CaseWithRelations extends Case {
  report?: ReportWithRelations | null;
  assigned_vet?: Profile | null;
  lab_referrals?: LabReferral[];
}

export interface AnimalWithRecords extends Animal {
  herd?: Herd | null;
  vaccinations?: Vaccination[];
  treatments?: Treatment[];
  reports?: Report[];
}
