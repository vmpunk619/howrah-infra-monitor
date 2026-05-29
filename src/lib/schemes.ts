/**
 * Government schemes and services available to citizens of Howrah Sadar Subdivision.
 * Information based on official government portals — verify on the website
 * linked in each entry before applying.
 */

export type SchemeCategory = 'central' | 'state' | 'land'

export interface Scheme {
  id: string
  name: string
  short?: string
  category: SchemeCategory
  icon: string                // emoji
  accent: string              // tailwind colour name
  objective: string
  benefits?: string[]
  eligibility: string[]
  documents: string[]
  whereToApply: string[]
  websites: { label: string; url: string }[]
}

/** Row shape as stored in the Supabase `schemes` table (admin-added schemes). */
export interface SchemeRow {
  id: string
  name: string
  short: string | null
  category: SchemeCategory
  icon: string
  accent: string
  objective: string
  benefits: string[] | null
  eligibility: string[] | null
  documents: string[] | null
  where_to_apply: string[] | null
  websites: { label: string; url: string }[] | null
  created_at?: string
}

export function rowToScheme(r: SchemeRow): Scheme {
  return {
    id: r.id,
    name: r.name,
    short: r.short ?? undefined,
    category: r.category,
    icon: r.icon || '📋',
    accent: r.accent || 'amber',
    objective: r.objective,
    benefits: r.benefits ?? [],
    eligibility: r.eligibility ?? [],
    documents: r.documents ?? [],
    whereToApply: r.where_to_apply ?? [],
    websites: r.websites ?? [],
  }
}

export const CATEGORY_META: Record<SchemeCategory, { label: string; icon: string; color: string }> = {
  central: { label: 'Central Government Schemes', icon: '🇮🇳', color: 'text-saffron-dark' },
  state:   { label: 'West Bengal State Schemes',  icon: '🌾', color: 'text-emerald-600'   },
  land:    { label: 'Land Records & Registration', icon: '📜', color: 'text-amber-700'    },
}

export const SCHEMES: Scheme[] = [
  /* ════════ CENTRAL ════════ */
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana',
    short: 'PMAY',
    category: 'central',
    icon: '🏠',
    accent: 'orange',
    objective: 'Affordable pucca housing for economically weaker sections and low-income groups.',
    benefits: [
      'Up to ₹1.20 lakh financial assistance for rural housing (PMAY-G)',
      'Interest subsidy up to ₹2.67 lakh under Credit Linked Subsidy (PMAY-U)',
      'Toilet construction support under Swachh Bharat Mission',
    ],
    eligibility: [
      'Family does not own a pucca house anywhere in India',
      'Annual household income within EWS/LIG limit (varies by sub-scheme)',
      'Not a beneficiary of any other Central housing scheme',
      'Listed in SECC-2011 deprivation criteria (for PMAY-G)',
    ],
    documents: [
      'Aadhaar card of all family members',
      'Income certificate from SDO/BDO',
      'Bank passbook (account linked to Aadhaar)',
      'Passport-size photograph',
      'Caste certificate (if applicable)',
      'Affidavit of non-ownership of pucca house',
    ],
    whereToApply: [
      'Gram Panchayat office (rural)',
      'Municipality / Howrah Sadar SDO office (urban)',
      'Online via PMAY portal',
    ],
    websites: [
      { label: 'PMAY-Gramin', url: 'https://pmayg.nic.in' },
      { label: 'PMAY-Urban',  url: 'https://pmaymis.gov.in' },
    ],
  },
  {
    id: 'mgnrega',
    name: 'Mahatma Gandhi National Rural Employment Guarantee Act',
    short: 'MGNREGA',
    category: 'central',
    icon: '⛏️',
    accent: 'amber',
    objective: '100 days of guaranteed wage employment per year to every rural household whose adult members volunteer for unskilled manual work.',
    benefits: [
      'Minimum 100 days of paid manual work per household per year',
      'Wage paid within 15 days, directly to bank account',
      'Creation of durable community assets (ponds, roads, plantations)',
    ],
    eligibility: [
      'Adult member (18+) of a rural household in Howrah Sadar',
      'Willing to do unskilled manual work',
      'Resident in the Gram Panchayat where job card is issued',
    ],
    documents: [
      'Job card application form (Form-1, free)',
      'Aadhaar of all adult family members',
      'Recent passport-size photographs',
      'Bank or post office account passbook',
      'Proof of residence',
    ],
    whereToApply: [
      'Gram Panchayat office',
      'Block Development Office (BDO)',
    ],
    websites: [
      { label: 'NREGA Portal', url: 'https://nrega.nic.in' },
    ],
  },
  {
    id: 'jal-jeevan',
    name: 'Jal Jeevan Mission',
    short: 'JJM',
    category: 'central',
    icon: '💧',
    accent: 'cyan',
    objective: 'Functional household tap connection (FHTC) providing safe potable drinking water to every rural home by 2024.',
    benefits: [
      'Functional piped tap connection at home',
      'Water quality testing & monitoring',
      'Community awareness on water conservation',
    ],
    eligibility: [
      'All rural households without an existing piped water connection',
      'Priority to villages in quality-affected or water-stressed areas',
    ],
    documents: [
      'Aadhaar of head of household',
      'Address proof / ration card',
      'Existing water bill (if any)',
    ],
    whereToApply: [
      'Gram Panchayat office',
      'Public Health Engineering Department (PHE), Howrah',
    ],
    websites: [
      { label: 'Jal Jeevan Mission', url: 'https://jaljeevanmission.gov.in' },
    ],
  },
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi',
    short: 'PM-KISAN',
    category: 'central',
    icon: '🌾',
    accent: 'green',
    objective: 'Direct income support of ₹6,000 per year to eligible landholder farmer families, paid in three equal instalments.',
    benefits: [
      '₹6,000 per year (₹2,000 every 4 months)',
      'Direct Benefit Transfer to bank account',
      'Free crop insurance enrolment in some cases',
    ],
    eligibility: [
      'Cultivable landholding farmer family (husband, wife, minor children)',
      'NOT eligible: institutional landholders, constitutional post holders, income-tax payers, retired pensioners with monthly pension ≥ ₹10,000, professionals (doctors, CAs, etc.)',
    ],
    documents: [
      'Aadhaar (mandatory)',
      'Bank account passbook (linked to Aadhaar)',
      'Land records / khatian / ROR',
      'Mobile number',
    ],
    whereToApply: [
      'Block Agriculture Office',
      'Common Service Centre (CSC)',
      'Online via PM-KISAN portal',
    ],
    websites: [
      { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
    ],
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana',
    short: 'PM-JAY',
    category: 'central',
    icon: '🏥',
    accent: 'rose',
    objective: 'Health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation at empanelled hospitals.',
    benefits: [
      'Cashless treatment up to ₹5 lakh per family per year',
      'Covers 1,393 medical procedures including surgery',
      'Pre and post-hospitalisation expenses covered',
      'No cap on family size or member age',
    ],
    eligibility: [
      'Listed in SECC-2011 database (deprivation criteria for rural; occupational for urban)',
      'Check eligibility on PM-JAY portal using mobile number or ration card',
    ],
    documents: [
      'Aadhaar card',
      'Ration card (preferably PHH/AAY)',
      'Mobile number registered with Aadhaar',
      'Any family ID issued by govt (if available)',
    ],
    whereToApply: [
      'Common Service Centre (CSC)',
      'Empanelled hospital — meet the Ayushman Mitra desk',
      'Online via PM-JAY portal',
    ],
    websites: [
      { label: 'PM-JAY Official', url: 'https://pmjay.gov.in' },
    ],
  },
  {
    id: 'skill-india',
    name: 'Skill India Mission (PMKVY)',
    short: 'PMKVY',
    category: 'central',
    icon: '🎓',
    accent: 'indigo',
    objective: 'Free short-term skill training and certification to enable youth to take up industry-relevant jobs.',
    benefits: [
      'Free training in industry-aligned trades (electrical, retail, IT, healthcare, etc.)',
      'NSDC-issued certificate recognised across India',
      'Post-training placement assistance',
      'Boarding/lodging support in residential courses',
    ],
    eligibility: [
      'Indian citizen aged 15 – 45',
      'Unemployed youth, school/college dropouts, or those seeking re-skilling',
      'Minimum qualification varies by trade (Class 5 to Class 12)',
    ],
    documents: [
      'Aadhaar card',
      'Educational certificates',
      'Bank account passbook',
      'Recent passport-size photo',
    ],
    whereToApply: [
      'PM Kaushal Kendra (PMKK) nearest you',
      'Empanelled skill training centres',
      'Online via Skill India portal',
    ],
    websites: [
      { label: 'Skill India', url: 'https://www.skillindia.gov.in' },
      { label: 'PMKVY',       url: 'https://www.pmkvyofficial.org' },
    ],
  },

  /* ════════ WEST BENGAL ════════ */
  {
    id: 'kanyashree',
    name: 'Kanyashree Prakalpa',
    short: 'K1 / K2',
    category: 'state',
    icon: '👧',
    accent: 'pink',
    objective: 'Empower adolescent girls through education and delay marriage by providing financial incentives for continued schooling.',
    benefits: [
      'K1: ₹1,000/year scholarship (age 13–18, in school/college)',
      'K2: ₹25,000 one-time grant (age 18–19, still unmarried & studying)',
      'K3: Monthly stipend for post-graduate students',
    ],
    eligibility: [
      'Resident of West Bengal',
      'Unmarried girl aged 13 to 19',
      'Enrolled in a recognised educational/vocational institution',
      'Annual family income ≤ ₹1.2 lakh (for K2)',
    ],
    documents: [
      'Aadhaar of applicant',
      'Birth certificate',
      'School / college admission certificate',
      'Bank account in applicant\'s own name',
      'Self-declaration of unmarried status',
      'Income certificate (for K2)',
    ],
    whereToApply: [
      'School or college head\'s office',
      'Block Development Office (BDO)',
      'Online via Kanyashree portal',
    ],
    websites: [
      { label: 'Kanyashree', url: 'https://wbkanyashree.gov.in' },
    ],
  },
  {
    id: 'lakshmir-bhandar',
    name: 'Lakshmir Bhandar',
    short: 'LB',
    category: 'state',
    icon: '💰',
    accent: 'fuchsia',
    objective: 'Monthly cash assistance to women heads of household for personal/family expenses.',
    benefits: [
      '₹1,000 per month for general category women',
      '₹1,200 per month for SC/ST category women',
      'Credited directly to bank account every month',
    ],
    eligibility: [
      'Female resident of West Bengal',
      'Age 25 to 59 years',
      'Holder of Swasthya Sathi card (or willing to enrol)',
      'NOT a regular government employee or pensioner',
    ],
    documents: [
      'Aadhaar card',
      'Swasthya Sathi card',
      'Bank passbook in beneficiary\'s own name',
      'Caste certificate (if SC/ST)',
      'Passport-size photo',
    ],
    whereToApply: [
      'Duare Sarkar camps (held periodically)',
      'BDO office / Municipality',
      'SDO Office, Howrah Sadar',
    ],
    websites: [
      { label: 'Social Security Portal', url: 'https://socialsecurity.wb.gov.in' },
    ],
  },
  {
    id: 'krishak-bandhu',
    name: 'Krishak Bandhu Scheme',
    short: 'KB',
    category: 'state',
    icon: '👨‍🌾',
    accent: 'lime',
    objective: 'Financial assistance and life cover for farmers and agricultural workers of West Bengal.',
    benefits: [
      'Up to ₹10,000/year (₹5,000 per Kharif & Rabi season)',
      'One-time ₹2 lakh death benefit (age 18-60, any cause)',
      'Coverage for both landowners and bargadars (sharecroppers)',
    ],
    eligibility: [
      'Farmer / bargadar / agricultural worker of West Bengal',
      'Age between 18 and 60 for death benefit',
      'Landholding details registered with Agriculture Department',
    ],
    documents: [
      'Aadhaar card',
      'Land records (khatian / ROR / bargadar certificate)',
      'Bank passbook',
      'Recent photograph',
      'Voter ID',
    ],
    whereToApply: [
      'Block Agriculture Office (ADA office)',
      'Duare Sarkar camps',
      'Online via Krishak Bandhu portal',
    ],
    websites: [
      { label: 'Krishak Bandhu', url: 'https://krishakbandhu.net' },
    ],
  },
  {
    id: 'swasthya-sathi',
    name: 'Swasthya Sathi',
    short: 'SS',
    category: 'state',
    icon: '🩺',
    accent: 'red',
    objective: 'Cashless health insurance coverage of up to ₹5 lakh per family per year for secondary and tertiary care.',
    benefits: [
      'Cover up to ₹5 lakh per family per year',
      'No cap on family size; includes parents, spouse, children',
      'Cashless treatment at 2,500+ empanelled hospitals',
      'Pre-existing diseases covered from day one',
    ],
    eligibility: [
      'All families of West Bengal (universal coverage)',
      'Female head of family is the primary card holder',
    ],
    documents: [
      'Aadhaar of all family members',
      'Address proof',
      'Family photograph',
      'Mobile number',
    ],
    whereToApply: [
      'Duare Sarkar camps',
      'BDO / Municipality / SDO Office',
      'Online via Swasthya Sathi portal',
    ],
    websites: [
      { label: 'Swasthya Sathi', url: 'https://swasthyasathi.gov.in' },
    ],
  },

  /* ════════ LAND ════════ */
  {
    id: 'banglarbhumi',
    name: 'BanglarBhumi Land Records & Services',
    category: 'land',
    icon: '🗺️',
    accent: 'amber',
    objective: 'Online access to land records, mutation, conversion, plot/khatian search, and Mouza maps for West Bengal.',
    benefits: [
      'View Record of Rights (ROR / Khatian) online',
      'Apply for mutation, conversion, and certified copies digitally',
      'Search by plot, khatian, or mouza',
      'Download Mouza maps',
    ],
    eligibility: [
      'Any citizen / landowner of West Bengal',
      'Free for viewing; certified copies and applications carry nominal fees',
    ],
    documents: [
      'Aadhaar number (for application services)',
      'Khatian / plot number to search',
      'Mobile number for OTP verification',
    ],
    whereToApply: [
      'BL&LRO (Block Land & Land Reforms Office), Howrah Sadar',
      'Online via BanglarBhumi portal',
      'Tathya Mitra Kendra (CSC)',
    ],
    websites: [
      { label: 'BanglarBhumi', url: 'https://banglarbhumi.gov.in' },
    ],
  },
  {
    id: 'mutation',
    name: 'Mutation of Land',
    category: 'land',
    icon: '📝',
    accent: 'orange',
    objective: 'Update the ownership record (khatian) in government records after purchase, inheritance, gift, or partition.',
    benefits: [
      'Legal recognition of new ownership',
      'Required for sale, mortgage, or further transfer',
      'Updated record of rights (RoR) issued',
    ],
    eligibility: [
      'New owner after a registered sale/gift/inheritance',
      'Application within 30 days of acquiring property recommended',
    ],
    documents: [
      'Registered Sale Deed / Gift Deed / Probated Will / Succession Certificate',
      'Current Khatian / Record of Rights (RoR)',
      'Aadhaar of applicant',
      'Latest land revenue (khajna) payment receipt',
      'Mutation application form (Form D)',
      'Mutation fee receipt',
    ],
    whereToApply: [
      'BL&LRO Office, Howrah Sadar',
      'Online via BanglarBhumi portal',
    ],
    websites: [
      { label: 'BanglarBhumi (mutation)', url: 'https://banglarbhumi.gov.in' },
    ],
  },
  {
    id: 'conversion',
    name: 'Conversion of Land',
    category: 'land',
    icon: '🔄',
    accent: 'yellow',
    objective: 'Change land classification (e.g., agricultural → residential/commercial/industrial) as per West Bengal Land Reforms Act.',
    benefits: [
      'Legal use of land for non-agricultural purposes',
      'Enables building plan sanction and registration',
    ],
    eligibility: [
      'Recorded landowner with up-to-date mutation',
      'Land must qualify per zoning / master plan',
    ],
    documents: [
      'Application form (Form J)',
      'Latest Record of Rights (RoR)',
      'Mutation certificate',
      'Recent khajna receipt',
      'Site plan / sketch map',
      'Affidavit stating intended use',
      'Conversion fee (varies by classification)',
    ],
    whereToApply: [
      'BL&LRO Office for cases up to 0.5 acre',
      'SDO Office, Howrah Sadar for larger holdings',
      'Online via BanglarBhumi portal',
    ],
    websites: [
      { label: 'BanglarBhumi (conversion)', url: 'https://banglarbhumi.gov.in' },
    ],
  },
  {
    id: 'land-registration',
    name: 'Land / Property Registration',
    category: 'land',
    icon: '✍️',
    accent: 'amber',
    objective: 'Statutory registration of sale, gift, mortgage, partition, or lease deeds for immovable property.',
    benefits: [
      'Legal validity of property transfer',
      'Public record for ownership claims',
      'Required for mutation, loans, court proceedings',
    ],
    eligibility: [
      'Buyer + seller (or both parties to the deed) must appear before the registrar',
      'Two adult witnesses required',
    ],
    documents: [
      'Draft deed (sale / gift / mortgage / partition)',
      'PAN and Aadhaar of buyer, seller, and witnesses',
      'Recent passport-size photos',
      'Latest land tax / khajna receipt',
      'Stamp duty paid (e-stamp)',
      'Registration fee receipt',
      'NOC from co-owners (if applicable)',
    ],
    whereToApply: [
      'Office of the Additional District Sub-Registrar (ADSR), Howrah',
      'e-appointment via WB Registration portal',
    ],
    websites: [
      { label: 'WB Registration', url: 'https://wbregistration.gov.in' },
    ],
  },
  {
    id: 'edistrict',
    name: 'e-District Citizen Services',
    category: 'land',
    icon: '📋',
    accent: 'blue',
    objective: 'Online issue of certificates and citizen-centric services from a single portal.',
    benefits: [
      'Income certificate',
      'Caste certificate (SC / ST / OBC)',
      'Residence / domicile certificate',
      'Certified copies of land records',
      'Track application status online',
    ],
    eligibility: [
      'Resident of West Bengal',
      'Documentary proof for the specific certificate sought',
    ],
    documents: [
      'Aadhaar of applicant',
      'Address proof (voter card, ration card)',
      'Income proof (for income certificate): salary slips, ITR',
      'Caste certificate from elder family member (for caste cert.)',
      'Application form for the specific service',
    ],
    whereToApply: [
      'Tathya Mitra Kendra (CSC)',
      'BDO / SDO Office, Howrah Sadar',
      'Online via e-District portal',
    ],
    websites: [
      { label: 'WB e-District', url: 'https://edistrict.wb.gov.in' },
    ],
  },
]

export const SCHEME_STATS = {
  total: SCHEMES.length,
  central: SCHEMES.filter(s => s.category === 'central').length,
  state:   SCHEMES.filter(s => s.category === 'state').length,
  land:    SCHEMES.filter(s => s.category === 'land').length,
}
