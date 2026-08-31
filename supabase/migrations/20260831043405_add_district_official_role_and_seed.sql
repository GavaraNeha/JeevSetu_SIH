/*
# Add district_official role, lab_referral_pending status, seed data

## Changes
1. profiles.role: add 'district_official'
2. cases.status: add 'lab_referral_pending'
3. cases.priority: add 'outbreak-risk'
4. Fix existing reports: fill missing block
5. Seed demo reports with consistent village/block/district hierarchy
6. Create cases for high-severity seed reports
7. Seed multilingual advisories
*/

-- 1. Expand profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('farmer','field_worker','vet_official','district_official'));

-- 2. Expand cases.status
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE cases ADD CONSTRAINT cases_status_check
  CHECK (status IN ('open','in_progress','lab_referral_pending','resolved','closed'));

-- 3. Expand cases.priority
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_priority_check;
ALTER TABLE cases ADD CONSTRAINT cases_priority_check
  CHECK (priority IN ('low','medium','high','critical','outbreak-risk'));

-- 4. Fix existing reports
UPDATE reports SET block = 'Kakinada Rural' WHERE district = 'Kakinada' AND block IS NULL;
UPDATE reports SET block = district WHERE block IS NULL AND district IS NOT NULL;

-- 5. Seed demo reports
INSERT INTO reports (reporter_id, species, breed, symptoms, notes, photo_url, village, block, district, state, severity, triage_recommendation, vet_referral_needed, status, latitude, longitude, created_at)
SELECT '909bcd74-cc7d-4ed1-85a9-0cc397fcf9f8', sp, br, sym, nt, ph, vil, blk, dis, st, sev, rec, vref, stat, lat, lng, ca
FROM (VALUES
  ('cattle', 'Gir', ARRAY['fever','loss_of_appetite','salivation','lameness'], 'Multiple cows showing similar symptoms. 4 animals affected.', NULL, 'Peddapuram', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'outbreak-risk', 'Potential FMD outbreak. Immediate vaccination and movement restriction required.', true, 'new', 16.8463, 82.1395, now() - interval '2 days'),
  ('buffalo', 'Murrah', ARRAY['fever','loss_of_appetite','salivation'], 'Buffalo also showing similar signs as the cattle nearby.', NULL, 'Peddapuram', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'high', 'Veterinary examination recommended within 24 hours.', true, 'new', 16.8463, 82.1395, now() - interval '1 day'),
  ('cattle', 'Crossbred', ARRAY['fever','lameness','salivation'], 'Third animal with mouth lesions.', NULL, 'Peddapuram', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'outbreak-risk', 'Potential outbreak detected. Immediate intervention required.', true, 'new', 16.8463, 82.1395, now() - interval '18 hours'),
  ('goat', 'Black Bengal', ARRAY['coughing','nasal_discharge','fever'], 'Goats coughing, 2 affected.', NULL, 'Samalkot', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'medium', 'Monitor closely. Isolate if possible.', false, 'new', 16.7850, 82.1750, now() - interval '3 days'),
  ('sheep', 'Nellore', ARRAY['coughing','nasal_discharge'], 'Sheep in same flock also coughing.', NULL, 'Samalkot', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'medium', 'Monitor for 48 hours.', false, 'new', 16.7850, 82.1750, now() - interval '2 days'),
  ('cattle', 'Sahiwal', ARRAY['reduced_milk','loss_of_appetite'], 'Cow giving less milk, seems dull.', NULL, 'Pithapuram', 'Pitapuram', 'Kakinada', 'Andhra Pradesh', 'low', 'Mild symptoms. Keep comfortable and hydrated.', false, 'new', 16.6110, 82.2700, now() - interval '5 days'),
  ('poultry', 'Vanaraja', ARRAY['sudden_death','dullness'], '3 chickens died suddenly overnight.', NULL, 'Gollala Mamidada', 'Kakinada Rural', 'Kakinada', 'Andhra Pradesh', 'high', 'Possible viral infection. Veterinary examination needed.', true, 'new', 16.9600, 82.0500, now() - interval '1 day'),
  ('buffalo', 'Nili-Ravi', ARRAY['diarrhea','loss_of_appetite'], 'Recovered after treatment.', NULL, 'Peddapuram', 'Pitapuram', 'Kakinada', 'Andhra Pradesh', 'low', 'Recovered. No further action needed.', false, 'resolved', 16.8463, 82.1395, now() - interval '10 days')
) AS t(sp, br, sym, nt, ph, vil, blk, dis, st, sev, rec, vref, stat, lat, lng, ca)
WHERE NOT EXISTS (SELECT 1 FROM reports WHERE village = 'Peddapuram' AND block = 'Kakinada Rural' AND species = 'cattle' AND breed = 'Gir' LIMIT 1);

-- 6. Create cases for high-severity seed reports
INSERT INTO cases (report_id, status, priority)
SELECT r.id, 'open', r.severity
FROM reports r
WHERE r.status = 'new' AND r.severity IN ('outbreak-risk','high')
  AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.report_id = r.id);

-- 7. Seed advisories
INSERT INTO advisories (title, body, language, severity, species, region, created_at)
SELECT * FROM (VALUES
  ('FMD Outbreak Alert — Kakinada', 'Foot and Mouth Disease symptoms detected in Peddapuram village. All cattle and buffalo owners should immediately isolate affected animals and contact the nearest veterinary officer for emergency vaccination.', 'en', 'outbreak-risk', 'cattle', 'Kakinada', now() - interval '1 day'),
  ('एफएमडी प्रकोप चेतावनी — काकीनाडा', 'पेद्दापुरम गाँव में फुट एंड माउथ डिजीज के लक्षण मिले हैं। सभी गोवंश और भैंस पालक तुरंत प्रभावित जानवरों को अलग करें और आपातकालीन टीकाकरण के लिए निकटतम पशु चिकित्सा अधिकारी से संपर्क करें।', 'hi', 'outbreak-risk', 'cattle', 'Kakinada', now() - interval '1 day'),
  ('ఎఫ్‌ఎండి వ్యాప్తి హెచ్చరిక — కాకినాడ', 'పెద్దాపురం గ్రామంలో ఫుట్ అండ్ మౌత్ డిజీజ్ లక్షణాలు గుర్తించబడ్డాయి. అన్ని ఆవు, దున్న యజమానులు తక్షణమే ప్రభావిత జంతువులను వేరు చేయాలి.', 'te', 'outbreak-risk', 'cattle', 'Kakinada', now() - interval '1 day')
) AS t(title, body, language, severity, species, region, created_at)
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE title = 'FMD Outbreak Alert — Kakinada' LIMIT 1);