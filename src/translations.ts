import type { Language, Role, Section } from './types';

// Convert Western digits (0-9) to Devanagari numerals (०-९)
export function toDevanagariDigits(num: number | string): string {
  const devDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, d => devDigits[parseInt(d, 10)]);
}

// Format money with localized currency symbol and numerals
export function formatCurrency(amount: number, lang: Language): string {
  const formattedEn = amount.toLocaleString('en-IN');
  if (lang === 'ne') {
    return `रु. ${toDevanagariDigits(formattedEn)}`;
  }
  return `Rs. ${formattedEn}`;
}

// Format numbers
export function formatNum(val: number | string, lang: Language): string {
  if (lang === 'ne') {
    return toDevanagariDigits(val);
  }
  return String(val);
}

export const translations = {
  // Navigation
  dashboard: { en: 'Overview', ne: 'मुख्य विवरण' },
  teachers: { en: 'Teachers', ne: 'शिक्षकहरू' },
  students: { en: 'Students', ne: 'विद्यार्थीहरू' },
  myChild: { en: 'My child', ne: 'मेरो बच्चा' },
  attendance: { en: 'Attendance', ne: 'उपस्थिति' },
  fees: { en: 'Fee records', ne: 'शुल्क विवरण' },
  tests: { en: 'Tests & marks', ne: 'परीक्षा र अंक' },
  notifications: { en: 'Notifications', ne: 'सूचनाहरू' },
  settings: { en: 'Settings', ne: 'सेटिङ' },
  backToWebsite: { en: 'Back to website', ne: 'वेबसाइटमा फर्कनुहोस्' },
  workspace: { en: 'WORKSPACE', ne: 'कार्यक्षेत्र' },

  // Roles
  tutorRole: { en: 'Tutor workspace', ne: 'शिक्षक कार्यक्षेत्र' },
  parentRole: { en: 'Parent account', ne: 'अभिभावक खाता' },
  centerRole: { en: 'Tuition center', ne: 'ट्युसन सेन्टर' },
  tutorDesc: { en: 'Independent tutor', ne: 'स्वतन्त्र शिक्षक' },
  parentDesc: { en: 'Parent account', ne: 'अभिभावक खाता' },
  centerDesc: { en: 'Center administrator', ne: 'सेन्टर प्रशासक' },

  // Help Button & Controls
  needHelp: { en: 'Need help?', ne: 'मद्दत चाहिन्छ?' },
  needAHand: { en: 'Need help?', ne: 'मद्दत चाहिन्छ?' },
  helpSub: { en: 'Guidance on attendance, fees, confirmations and test results.', ne: 'उपस्थिति, शुल्क, प्रमाणीकरण र परीक्षा नतिजा सम्बन्धी मार्गदर्शन।' },
  visitHelp: { en: 'Visit help center', ne: 'मद्दत केन्द्र हेर्नुहोस्' },
  helpTitle: { en: 'TuitionTrack Guidance & Help', ne: 'TuitionTrack मार्गदर्शन र मद्दत' },
  helpUnderstood: { en: 'Understood, return to workspace', ne: 'बुझें, कार्यक्षेत्रमा फर्कनुहोस्' },

  // Search & Actions
  searchStudents: { en: 'Search students...', ne: 'विद्यार्थी खोज्नुहोस्...' },
  searchTeachers: { en: 'Search teachers...', ne: 'शिक्षक खोज्नुहोस्...' },
  addStudent: { en: 'Add student', ne: 'विद्यार्थी थप्नुहोस्' },
  exportReport: { en: 'Export report', ne: 'प्रतिवेदन निकाल्नुहोस्' },
  exportTeacherReport: { en: 'Export Teacher Report', ne: 'शिक्षक प्रतिवेदन निकाल्नुहोस्' },
  previewSampleReport: { en: 'Preview Sample Report', ne: 'नमूना प्रतिवेदन पूर्वावलोकन' },
  downloadPdf: { en: 'Download PDF', ne: 'PDF डाउनलोड गर्नुहोस्' },
  downloadCsv: { en: 'Download CSV', ne: 'CSV डाउनलोड गर्नुहोस्' },
  selectTeacher: { en: 'Select Teacher', ne: 'शिक्षक छान्नुहोस्' },
  reportPreview: { en: 'Report Preview', ne: 'प्रतिवेदन पूर्वावलोकन' },
  addTeacher: { en: 'Add teacher', ne: 'शिक्षक थप्नुहोस्' },
  assignClass: { en: 'Assign class', ne: 'कक्षा जिम्मेवारी दिनुहोस्' },
  recordPayment: { en: 'Record payment', ne: 'शुल्क भुक्तानी दर्ता' },
  recordTeacherPayment: { en: 'Record teacher payment', ne: 'शिक्षक भुक्तानी दर्ता' },
  scheduleTest: { en: 'Schedule a test', ne: 'परीक्षा तालिका बनाउनुहोस्' },
  saveAttendance: { en: 'Save attendance', ne: 'उपस्थिति सुरक्षित गर्नुहोस्' },
  confirmAndSave: { en: 'Confirm & save', ne: 'निश्चित गरी सुरक्षित गर्नुहोस्' },
  markAllPresent: { en: 'Mark all present', ne: 'सबै उपस्थित जनाउनुहोस्' },
  enterMarks: { en: 'Enter marks', ne: 'अंक प्रविष्टि गर्नुहोस्' },
  publishResults: { en: 'Publish results', ne: 'नतिजा प्रकाशित गर्नुहोस्' },
  confirm: { en: 'Confirm', ne: 'प्रमाणित गर्नुहोस्' },
  dispute: { en: 'Dispute', ne: 'विवाद दर्ता' },
  review: { en: 'Review', ne: 'पुनरावलोकन' },
  details: { en: 'Details', ne: 'विवरण' },
  viewProfile: { en: 'View profile', ne: 'प्रोफाइल हेर्नुहोस्' },
  cancel: { en: 'Cancel', ne: 'रद्द गर्नुहोस्' },
  save: { en: 'Save', ne: 'सुरक्षित गर्नुहोस्' },
  filterAll: { en: 'All', ne: 'सबै' },
  active: { en: 'Active', ne: 'सक्रिय' },
  inactive: { en: 'Inactive', ne: 'निष्क्रिय' },

  // Statuses
  present: { en: 'Present', ne: 'उपस्थित' },
  absent: { en: 'Absent', ne: 'अनुपस्थित' },
  unmarked: { en: 'Not marked', ne: 'दर्ता नभएको' },
  pending: { en: 'Awaiting parent', ne: 'अभिभावक प्रतीक्षा' },
  confirmed: { en: 'Parent-confirmed', ne: 'अभिभावकद्वारा प्रमाणित' },
  disputed: { en: 'Disputed', ne: 'विवादित' },
  scheduled: { en: 'Scheduled', ne: 'तालिकाबद्ध' },
  completed: { en: 'Completed', ne: 'सम्पन्न' },
  published: { en: 'Published', ne: 'प्रकाशित' },
  paid: { en: 'Paid', ne: 'भुक्तान भएको' },
  partial: { en: 'Partially paid', ne: 'आंशिक भुक्तानी' },

  // Dashboard & Overview
  goodMorning: { en: 'Good morning', ne: 'शुभप्रभात' },
  centerOverview: { en: 'CENTER OVERVIEW', ne: 'सेन्टर समग्र विवरण' },
  tutorOverview: { en: 'TUTOR OVERVIEW', ne: 'शिक्षक समग्र विवरण' },
  parentOverview: { en: 'PARENT OVERVIEW', ne: 'अभिभावक विवरण' },
  centerWelcomeDesc: { en: "Here's a comprehensive overview of your tutors, students, fees, and classes.", ne: 'तपाईंको शिक्षकहरू, विद्यार्थीहरू, शुल्क र कक्षाहरूको पूर्ण विवरण यहाँ छ।' },
  tutorWelcomeDesc: { en: "Here's what needs your attention across your tuition classes.", ne: 'तपाईंको ट्युसन कक्षाहरूमा ध्यान दिनुपर्ने मुख्य विवरणहरू।' },
  parentWelcomeDesc: { en: "Here's a clear picture of Suman's tuition this week.", ne: 'यस हप्ता सुमनको ट्युसन गतिविधिहरूको स्पष्ट विवरण।' },

  // Metrics
  totalTeachers: { en: 'Total teachers', ne: 'जम्मा शिक्षकहरू' },
  activeTeachers: { en: 'Active teachers', ne: 'सक्रिय शिक्षकहरू' },
  totalStudents: { en: 'Total students', ne: 'जम्मा विद्यार्थीहरू' },
  activeStudents: { en: 'Active students', ne: 'सक्रिय विद्यार्थीहरू' },
  presentToday: { en: 'Present today', ne: 'आज उपस्थित' },
  absentToday: { en: 'Absent today', ne: 'आज अनुपस्थित' },
  notMarkedToday: { en: 'Not marked today', ne: 'उपस्थिति बाँकी' },
  studentFeesDue: { en: 'Total fees due', ne: 'जम्मा उठ्नुपर्ने शुल्क' },
  confirmedFees: { en: 'Confirmed payments', ne: 'प्रमाणित भुक्तानी' },
  outstandingFees: { en: 'Outstanding balances', ne: 'बाँकी शुल्क रकम' },
  paymentsAwaiting: { en: 'Awaiting confirmation', ne: 'प्रमाणीकरण प्रतीक्षा' },
  disputedPayments: { en: 'Disputed payments', ne: 'विवादित भुक्तानी' },
  teacherPaymentsDue: { en: 'Teacher salary due', ne: 'शिक्षकलाई दिनुपर्ने रकम' },
  teacherPaymentsPaid: { en: 'Teacher payments paid', ne: 'शिक्षकलाई भुक्तान भइसकेको' },
  upcomingTests: { en: 'Upcoming tests', ne: 'आगामी परीक्षाहरू' },
  publishedResults: { en: 'Published results', ne: 'प्रकाशित नतिजाहरू' },

  // Settings
  settingsTitle: { en: 'Workspace Settings', ne: 'कार्यक्षेत्र सेटिङहरू' },
  settingsDesc: { en: 'Manage your language, appearance, and account preferences.', ne: 'भाषा, रूप (Light/Dark mode), र खाता प्राथमिकताहरू व्यवस्थापन गर्नुहोस्।' },
  languageSetting: { en: 'Language / भाषा', ne: 'भाषा / Language' },
  languageDesc: { en: 'Choose your preferred language for this workspace. Changes apply immediately.', ne: 'यस कार्यक्षेत्रको लागि उपयुक्त भाषा रोज्नुहोस्। तुरुन्तै लागु हुनेछ।' },
  appearanceSetting: { en: 'Appearance / रूप', ne: 'रूप / Appearance' },
  appearanceDesc: { en: 'Switch between light and dark themes for comfortable reading.', ne: 'आँखालाई आरामदायी बनाउन हल्का वा गाढा थिम छान्नुहोस्।' },
  lightMode: { en: 'Light mode', ne: 'हल्का मोड (Light)' },
  darkMode: { en: 'Dark mode', ne: 'गाढा मोड (Dark)' },
  currentRoleLabel: { en: 'Active Role & Identity', ne: 'सक्रिय भूमिका र पहिचान' },

  // Language Prompt Modal
  langPromptTitle: { en: 'Language Preference', ne: 'भाषा प्राथमिकता' },
  langPromptEn: { en: 'Would you like to use TuitionTrack in Nepali?', ne: 'Would you like to use TuitionTrack in Nepali?' },
  langPromptNe: { en: 'के तपाईं TuitionTrack नेपाली भाषामा प्रयोग गर्न चाहनुहुन्छ?', ne: 'के तपाईं TuitionTrack नेपाली भाषामा प्रयोग गर्न चाहनुहुन्छ?' },
  switchToNepali: { en: 'नेपालीमा प्रयोग गर्नुहोस्', ne: 'नेपालीमा प्रयोग गर्नुहोस्' },
  continueInEnglish: { en: 'Continue in English', ne: 'Continue in English' },

  // Teacher Workspace
  teachersTitle: { en: 'Teachers & Staff Management', ne: 'शिक्षक तथा कर्मचारी व्यवस्थापन' },
  teachersDesc: { en: 'Manage teacher profiles, subject assignments, classes, and salary ledgers.', ne: 'शिक्षकहरूको विवरण, अध्यापन विषय, कक्षा जिम्मेवारी र भुक्तानी खाता व्यवस्थापन गर्नुहोस्।' },
  teacherDirectory: { en: 'Teacher Directory', ne: 'शिक्षक सूची' },
  teacherLedger: { en: 'Teacher Payment Ledger', ne: 'शिक्षक भुक्तानी खाता' },
  classAssignments: { en: 'Class Assignments', ne: 'कक्षा जिम्मेवारीहरू' },
  teacherName: { en: 'Teacher', ne: 'शिक्षकको नाम' },
  qualification: { en: 'Qualification', ne: 'योग्यता' },
  contactPhone: { en: 'Contact phone', ne: 'सम्पर्क फोन' },
  emailAddress: { en: 'Email address', ne: 'इमेल ठेगाना' },
  subjectsTaught: { en: 'Subjects taught', ne: 'पढाउने विषयहरू' },
  assignedClassesLabel: { en: 'Assigned classes', ne: 'जिम्मेवारी पाएका कक्षाहरू' },
  assignedStudentsLabel: { en: 'Assigned students', ne: 'जिम्मेवार विद्यार्थी संख्या' },
  salaryRate: { en: 'Payment arrangement', ne: 'पारिश्रमिक सम्झौता' },
  amountDue: { en: 'Amount due', ne: 'दिनुपर्ने रकम' },
  amountPaid: { en: 'Amount paid', ne: 'तिरिएको रकम' },
  remainingBalance: { en: 'Remaining balance', ne: 'बाँकी रकम' },
  paymentPeriod: { en: 'Payment period', ne: 'भुक्तानी महिना/अवधि' },
  paymentMethod: { en: 'Payment method', ne: 'भुक्तानी विधि' },
  paymentDate: { en: 'Payment date', ne: 'भुक्तानी मिति' },
  recordTeacherPaymentBtn: { en: 'Record teacher payment', ne: 'शिक्षक भुक्तानी दर्ता' },

  // Prototype Disclaimers
  prototypeNotice: { en: 'Prototype demo: changes persist during this session.', ne: 'प्रोटोटाइप डेमो: परिवर्तनहरू यसै ब्राउजर सत्रमा सुरक्षित रहन्छन्।' },
  teacherSalaryNote: { en: 'Teacher payments are managed by the center and do not affect student tuition fees.', ne: 'शिक्षक पारिश्रमिक सेन्टरद्वारा व्यवस्थापन गरिन्छ र यसले विद्यार्थीको शुल्क खातामा कुनै प्रभाव पार्दैन।' },
  noGatewayNote: { en: 'TuitionTrack is a record ledger; no real financial transactions take place.', ne: 'TuitionTrack एक साझा अभिलेख खाता हो; कुनै प्रत्यक्ष बैंक वा गेटवे कारोबार हुँदैन।' },
};

export function t(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
}

export function roleLabel(role: Role, lang: Language): string {
  if (role === 'center') return t('centerRole', lang);
  if (role === 'parent') return t('parentRole', lang);
  return t('tutorRole', lang);
}

export function sectionTitle(section: Section, lang: Language): string {
  switch (section) {
    case 'dashboard': return t('dashboard', lang);
    case 'teachers': return t('teachers', lang);
    case 'students': return t('students', lang);
    case 'attendance': return t('attendance', lang);
    case 'fees': return t('fees', lang);
    case 'tests': return t('tests', lang);
    case 'notifications': return t('notifications', lang);
    case 'settings': return t('settings', lang);
  }
}
