import { useEffect, useState, useMemo, useRef, type ReactNode, type FormEvent } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen, Calendar,
  CalendarCheck, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleHelp, ClipboardCheck, Clock3, CreditCard, Download, FileDown,
  FileSpreadsheet, FileText, GraduationCap, Globe,
  LayoutDashboard, LogOut, Menu, MessageCircle, Moon, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, Sparkles, Sun, TrendingUp, Trash2, Users, Wallet, X, Zap
} from 'lucide-react';

import type {
  Attendance, ClassItem, Language, Notice, Payment, PaymentStatus, Role, Section,
  Student, Teacher, TeacherPayment, TeacherPaymentStatus, Test, TestResult, Theme
} from './types';
import {
  initialClasses, initialNotices, initialPayments, initialResults, initialStudents,
  initialTeacherPayments, initialTeachers, initialTests
} from './demoData';
import {
  formatCurrency, formatNum, roleLabel, sectionTitle, t, translations
} from './translations';
import {
  compileTeacherReportData, downloadTeacherReportCsv, downloadTeacherReportPdf,
  getSampleTeacherReportData, type TeacherReportData
} from './reportGenerator';

// ─── Count-up animation hook ────────────────────────────────────────
export function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const currentValRef = useRef(0);

  const prefersReduced = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReduced) {
      setValue(target);
      currentValRef.current = target;
      return;
    }

    const startVal = currentValRef.current;
    const endVal = target;

    if (startVal === endVal) {
      setValue(endVal);
      return;
    }

    let rafId: number;
    let startTime: number | null = null;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < delay) {
        rafId = requestAnimationFrame(step);
        return;
      }

      const animElapsed = elapsed - delay;
      const progress = Math.min(animElapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startVal + (endVal - startVal) * eased);

      currentValRef.current = nextVal;
      setValue(nextVal);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        currentValRef.current = endVal;
        setValue(endVal);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, delay, prefersReduced]);

  return value;
}

function AnimatedMoney({ value, delay = 0, lang = 'en' }: { value: number; delay?: number; lang?: Language }) {
  const animated = useCountUp(value, 1200, delay);
  return <>{formatCurrency(animated, lang)}</>;
}

function AnimatedPercent({ value, delay = 0, lang = 'en' }: { value: number; delay?: number; lang?: Language }) {
  const animated = useCountUp(value, 1200, delay);
  return <>{formatNum(animated, lang)}%</>;
}

export function matchesStudent(s: Student, query: string): boolean {
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) return true;
  const normQ = rawQ.replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u');
  const nameLower = s.name.toLowerCase();
  const normName = nameLower.replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u');
  return (
    nameLower.includes(rawQ) ||
    normName.includes(normQ) ||
    s.id.toLowerCase().includes(rawQ) ||
    s.grade.toLowerCase().includes(rawQ) ||
    s.rollNumber.toLowerCase().includes(rawQ) ||
    s.parent.toLowerCase().includes(rawQ)
  );
}

function Brand({ inverse = false, onClick }: { inverse?: boolean; onClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <a href="/" onClick={handleClick} className={`brand ${inverse ? 'brand-inverse' : ''}`} aria-label="TuitionTrack home">
      <img src="/tuitiontrack-logo-mark.png" alt="TuitionTrack" className="brand-logo-mark" width={36} height={36} />
      <span className="brand-word">Tuition<span>Track</span></span>
    </a>
  );
}

// ─── Main Application Component ─────────────────────────────────────
function App() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [testResults, setTestResults] = useState<TestResult[]>(initialResults);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPayment[]>(initialTeacherPayments);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [toast, setToast] = useState('');

  // Language & Theme Persistence
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('tuitiontrack_lang');
    return saved === 'ne' ? 'ne' : 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('tuitiontrack_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Language choice prompt on first entry
  const [showLangPrompt, setShowLangPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Apply theme to document element
    if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
    localStorage.setItem('tuitiontrack_theme', theme);
  }, [theme]);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('tuitiontrack_lang', newLang);
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('tuitiontrack_theme', newTheme);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  // Student Fee Confirmation & Dispute
  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    const current = payments.find(p => p.id === id);
    if (!current) return;
    if (current.status === status) return;
    if (current.status === 'confirmed' || current.status === 'disputed') return;

    setPayments(items => items.map(p => p.id === id ? { ...p, status } : p));

    // Rule: Only a confirmed payment reduces student balance exactly once
    if (status === 'confirmed') {
      setStudents(items => items.map(s => s.name === current.student ? { ...s, confirmedPaid: s.confirmedPaid + current.amount } : s));
    }

    // Bilingual notifications
    const noticeNe = status === 'confirmed'
      ? `${current.student} को रु. ${current.amount.toLocaleString('en-IN')} को भुक्तानी अभिभावकद्वारा प्रमाणित गरियो (${current.month})।`
      : `${current.student} को भुक्तानी विवादित रूपमा दर्ता गरियो, समीक्षा गरिँदैछ।`;
    const noticeEn = status === 'confirmed'
      ? `Payment of Rs. ${current.amount.toLocaleString('en-IN')} for ${current.student} was confirmed by parent (${current.month}).`
      : `Payment for ${current.student} was flagged as disputed for review.`;

    setNotices(items => [{
      id: `N-${Date.now()}`,
      title: status === 'confirmed' ? 'Payment confirmed by parent' : 'Payment disputed',
      body: `${current.student} · ${formatCurrency(current.amount, 'en')} · ${current.month}.`,
      titleNe: noticeNe,
      titleEn: noticeEn,
      bodyNe: 'अभिभावक र शिक्षकको साझा खातामा अभिलेख अद्यावधिक गरिएको छ।',
      bodyEn: 'Ledger record updated in shared tuition life ledger.',
      time: 'Just now',
      kind: 'fee',
      read: false,
      student: current.student,
    }, ...items]);

    notify(status === 'confirmed' ? 'Payment marked as parent-confirmed.' : 'Payment flagged for review.');
  };

  const setAttendance = (id: string, attendance: Attendance) => {
    setStudents(items => items.map(s => s.id === id ? { ...s, attendance } : s));
  };

  const saveAttendance = (shown: Student[]) => {
    const absentStudents = shown.filter(s => s.attendance === 'absent');
    absentStudents.forEach(s => {
      setNotices(items => {
        const existing = items.find(n => n.kind === 'attendance' && n.student === s.name && n.time === 'Just now');
        if (existing) return items;
        return [{
          id: `N-${Date.now()}-${s.id}`,
          title: 'Attendance marked absent',
          body: `${s.name} was marked absent in ${s.grade}.`,
          titleNe: `${s.name} ${s.grade} मा अनुपस्थित हुनुभयो।`,
          titleEn: `${s.name} was marked absent in ${s.grade}.`,
          bodyNe: 'आजको उपस्थिति दर्तामा अनुपस्थित जनाइएको छ।',
          bodyEn: 'Marked absent in today’s class attendance register.',
          time: 'Just now',
          kind: 'attendance',
          read: false,
          student: s.name,
          grade: s.grade,
        }, ...items];
      });
    });
    notify('Attendance saved. Absence updates noted.');
  };

  const addStudent = (name: string, grade: string, fee: number) => {
    const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['blue', 'violet', 'orange', 'teal', 'pink'];
    const nextRoll = String(students.length + 1).padStart(2, '0');
    setStudents(items => [...items, {
      id: `ST-${109 + items.length - initialStudents.length}`,
      name, grade, initials,
      color: colors[items.length % colors.length],
      attendance: 'unmarked', fee, confirmedPaid: 0,
      parent: 'Parent not linked', rollNumber: nextRoll
    }]);
    notify('Student added to the demo workspace.');
  };

  const addPayment = (student: string, amount: number, month: string, method: string) => {
    const payment: Payment = {
      id: `TT-${Math.floor(84030 + Math.random() * 900)}`,
      student, amount, date: 'Oct 20, 2026', month, method, status: 'pending'
    };
    setPayments(items => [payment, ...items]);
    setNotices(items => [{
      id: `N-${Date.now()}`,
      title: 'Payment awaiting confirmation',
      body: `${formatCurrency(amount, 'en')} recorded for ${student} · ${month}.`,
      titleNe: `रु. ${amount.toLocaleString('en-IN')} को भुक्तानी अभिभावक प्रमाणीकरणको प्रतीक्षामा छ (${student})।`,
      titleEn: `Rs. ${amount.toLocaleString('en-IN')} recorded for ${student} is awaiting parent confirmation.`,
      bodyNe: 'कृपया शिक्षकले दर्ता गरेको रकम र विवरण जाँच गर्नुहोस्।',
      bodyEn: 'Please review and confirm the recorded payment details.',
      time: 'Just now',
      kind: 'fee',
      read: false,
      student
    }, ...items]);
    notify('Payment recorded and sent for parent confirmation.');
  };

  // Center Teacher Payment Action (Separate from Student Fees)
  const addTeacherPayment = (teacherId: string, period: string, amount: number, method: string, note?: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const paymentId = `TP-${Math.floor(105 + Math.random() * 900)}`;
    const due = teacher.baseRate;
    const existingPaid = teacherPayments
      .filter(tp => tp.teacherId === teacherId && tp.period === period)
      .reduce((sum, tp) => sum + tp.amountPaid, 0);
    const newTotalPaid = existingPaid + amount;
    const remaining = Math.max(0, due - newTotalPaid);
    const status: TeacherPaymentStatus = remaining === 0 ? 'paid' : 'partial';

    const newPayment: TeacherPayment = {
      id: paymentId,
      teacherId,
      teacherName: teacher.name,
      period,
      amountDue: due,
      amountPaid: amount,
      balance: remaining,
      date: 'Oct 20, 2026',
      status,
      method,
      note: note || `Center payment to ${teacher.name}`,
    };

    setTeacherPayments(items => [newPayment, ...items]);

    setNotices(items => [{
      id: `N-TCH-${Date.now()}`,
      title: 'Teacher payment recorded',
      body: `${teacher.name} · ${formatCurrency(amount, 'en')} · ${period}.`,
      titleNe: `${teacher.name} लाई रु. ${amount.toLocaleString('en-IN')} पारिश्रमिक भुक्तान गरियो (${period})।`,
      titleEn: `Teacher payment of Rs. ${amount.toLocaleString('en-IN')} recorded for ${teacher.name} (${period}).`,
      bodyNe: 'सेन्टरको शिक्षक खाता अद्यावधिक गरिएको छ। विद्यार्थी शुल्कमा असर पर्दैन।',
      bodyEn: 'Center teacher ledger updated. Student tuition fees remain untouched.',
      time: 'Just now',
      kind: 'general',
      read: false,
    }, ...items]);

    notify(`Teacher payment of ${formatCurrency(amount, lang)} recorded for ${teacher.name}.`);
  };

  // Assign Class to Teacher
  const assignClassToTeacher = (teacherId: string, className: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    if (teacher.assignedClasses.includes(className)) {
      notify('This class is already assigned to the teacher.');
      return;
    }

    const cls = classes.find(c => c.name === className);
    const addedStudents = cls ? cls.studentCount : 12;

    setTeachers(items => items.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          assignedClasses: [...t.assignedClasses, className],
          assignedStudentCount: t.assignedStudentCount + addedStudents,
        };
      }
      return t;
    }));

    notify(`${className} successfully assigned to ${teacher.name}.`);
  };

  const addTest = (title: string, subject: string, date: string, grade: string) => {
    setTests(items => [{
      id: `T-${String(items.length + 1).padStart(2, '0')}`,
      title, subject, date, grade, status: 'scheduled', fullMarks: 20
    }, ...items]);

    setNotices(items => [{
      id: `N-${Date.now()}`,
      title: 'New test scheduled',
      body: `${title} · ${date}.`,
      titleNe: `नयाँ परीक्षा तालिका: ${title} (${date})।`,
      titleEn: `Test scheduled: ${title} (${date}).`,
      bodyNe: `${grade} ${subject} को परीक्षा तालिका प्रकाशित भएको छ।`,
      bodyEn: `${grade} ${subject} test schedule has been published.`,
      time: 'Just now',
      kind: 'test',
      read: false,
      grade,
      student: grade === 'Grade 9' ? 'Suman Thapa' : undefined
    }, ...items]);
    notify('Test scheduled in the demo.');
  };

  const publishResults = (testId: string, newResults: TestResult[]) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setTests(items => items.map(t => t.id === testId ? { ...t, status: 'published' as const } : t));

    setTestResults(items => {
      const existing = new Set(items.filter(r => r.testId === testId).map(r => r.studentId));
      const unique = newResults.filter(r => !existing.has(r.studentId));
      return [...items, ...unique];
    });

    newResults.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (student) {
        setNotices(items => [{
          id: `N-${Date.now()}-${r.id}`,
          title: 'Test results published',
          body: `${test.title} · ${student.name} scored ${r.obtained}/${r.fullMarks}.`,
          titleNe: `परीक्षा नतिजा प्रकाशित: ${test.title} · ${student.name}: ${r.obtained}/${r.fullMarks} अंक।`,
          titleEn: `Test results published: ${test.title} · ${student.name}: ${r.obtained}/${r.fullMarks}.`,
          bodyNe: 'अभिभावक कार्यक्षेत्रमा विस्तृत अंक विवरण उपलब्ध छ।',
          bodyEn: 'Detailed marks breakdown is available in the parent workspace.',
          time: 'Just now',
          kind: 'test',
          read: false,
          grade: test.grade,
          student: student.name,
        }, ...items]);
      }
    });
    notify('Results published in the demo.');
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/start" element={<RolePicker />} />
        <Route path="/app/:role" element={<DefaultAppRoute />} />
        <Route path="/app/:role/:section" element={
          <AppShell
            students={students}
            payments={payments}
            tests={tests}
            testResults={testResults}
            notices={notices}
            teachers={teachers}
            teacherPayments={teacherPayments}
            classes={classes}
            lang={lang}
            setLanguage={setLanguage}
            theme={theme}
            setThemeMode={setThemeMode}
            showLangPrompt={showLangPrompt}
            setShowLangPrompt={setShowLangPrompt}
            setAttendance={setAttendance}
            updatePaymentStatus={updatePaymentStatus}
            addStudent={addStudent}
            addPayment={addPayment}
            addTeacherPayment={addTeacherPayment}
            assignClassToTeacher={assignClassToTeacher}
            addTest={addTest}
            publishResults={publishResults}
            setNotices={setNotices}
            notify={notify}
            saveAttendance={saveAttendance}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </>
  );
}

// ─── First-Entry Language Choice Prompt Modal ───────────────────────
function LanguagePromptModal({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card lang-prompt-card" role="dialog" aria-modal="true">
        <div className="lang-prompt-icon">
          <Globe size={28} />
        </div>
        <h2 className="lang-prompt-title">TuitionTrack</h2>
        <div className="lang-prompt-question-ne">
          के तपाईं TuitionTrack नेपाली भाषामा प्रयोग गर्न चाहनुहुन्छ?
        </div>
        <div className="lang-prompt-question-en">
          Would you like to use TuitionTrack in Nepali?
        </div>
        <div className="lang-prompt-actions">
          <button
            type="button"
            className="lang-choice-btn lang-choice-primary"
            onClick={() => onSelect('ne')}
          >
            नेपालीमा प्रयोग गर्नुहोस्
          </button>
          <button
            type="button"
            className="lang-choice-btn lang-choice-secondary"
            onClick={() => onSelect('en')}
          >
            Continue in English
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Sign In Modal (Clean Inputs & Separated Demo Access) ───────────
function SignInModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('parent');
  // Starts EMPTY as required
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleQuickEnter = (targetRole: Role) => {
    onClose();
    navigate(`/app/${targetRole}/dashboard`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setValidationError('Please enter your email or phone number.');
      return;
    }
    if (!password.trim()) {
      setValidationError('Please enter your password.');
      return;
    }
    onClose();
    navigate(`/app/${role}/dashboard`);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card signin-modal-card" role="dialog" aria-modal="true" aria-labelledby="signin-modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="signin-modal-title">Sign in to TuitionTrack</h2>
            <p>Access your workspace or choose a pre-configured demo account.</p>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="signin-modal-body">
          {/* SEPARATE 1-CLICK DEMO ACCESS AREA */}
          <div className="signin-demo-section">
            <span className="signin-section-kicker">1-CLICK DEMO ACCESS (PROTOTYPE ACCOUNTS)</span>
            <div className="signin-demo-roles">
              <button type="button" className="demo-role-pill" onClick={() => handleQuickEnter('parent')}>
                <Users size={18} />
                <div>
                  <b>Parent Account</b>
                  <small>Mina Thapa (Child: Suman Thapa)</small>
                </div>
                <ArrowRight size={14} />
              </button>
              <button type="button" className="demo-role-pill" onClick={() => handleQuickEnter('tutor')}>
                <GraduationCap size={18} />
                <div>
                  <b>Tutor Workspace</b>
                  <small>Dibash Lamichhane</small>
                </div>
                <ArrowRight size={14} />
              </button>
              <button type="button" className="demo-role-pill" onClick={() => handleQuickEnter('center')}>
                <LayoutDashboard size={18} />
                <div>
                  <b>Tuition Center</b>
                  <small>Bright Path Tuition Center</small>
                </div>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="signin-divider"><span>OR SIGN IN WITH CREDENTIALS</span></div>

          <form className="modal-form signin-form" onSubmit={handleSubmit}>
            <label>Workspace role
              <select value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="parent">Parent Account</option>
                <option value="tutor">Tutor Workspace</option>
                <option value="center">Tuition Center</option>
              </select>
            </label>
            <label>Email address or phone number
              <input
                type="text"
                placeholder="name@example.com or 98XXXXXXXX"
                value={emailOrPhone}
                onChange={e => { setEmailOrPhone(e.target.value); setValidationError(''); }}
                required
              />
            </label>
            <label>Password
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setValidationError(''); }}
                required
              />
            </label>
            {validationError && (
              <div className="form-error"><CircleAlert size={14} /> {validationError}</div>
            )}
            <div className="signin-note">
              <ShieldCheck size={15} />
              <span>Frontend demo mode: passwords are simulated locally without an external server.</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="button button-primary">Enter {role === 'center' ? 'Tuition Center' : role === 'parent' ? 'Parent Account' : 'Tutor Workspace'} <ArrowRight size={15} /></button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

// ─── Help Modal with Full Guidance (Bilingual) ──────────────────────
function HelpModal({ role, lang, onClose }: { role: Role; lang: Language; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees' | 'disputes' | 'tests' | 'teachers'>('attendance');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card help-modal-card" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="help-modal-title">{t('helpTitle', lang)}</h2>
            <p>{lang === 'ne' ? `${roleLabel(role, lang)} का लागि व्यावहारिक निर्देशन र उत्तरहरू।` : `Practical guidance and answers for ${roleLabel(role, lang)}.`}</p>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="help-modal-tabs">
          <button type="button" className={`help-tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <CalendarCheck size={15} /> {t('attendance', lang)}
          </button>
          <button type="button" className={`help-tab ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
            <Wallet size={15} /> {t('fees', lang)}
          </button>
          <button type="button" className={`help-tab ${activeTab === 'disputes' ? 'active' : ''}`} onClick={() => setActiveTab('disputes')}>
            <ShieldCheck size={15} /> {lang === 'ne' ? 'प्रमाणीकरण र विवाद' : 'Confirm & Dispute'}
          </button>
          <button type="button" className={`help-tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
            <ClipboardCheck size={15} /> {t('tests', lang)}
          </button>
          {role === 'center' && (
            <button type="button" className={`help-tab ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
              <GraduationCap size={15} /> {t('teachers', lang)}
            </button>
          )}
        </div>

        <div className="help-modal-content">
          {activeTab === 'attendance' && (
            <div className="help-section">
              <h3>{lang === 'ne' ? 'दैनिक उपस्थिति कसरी सञ्चालन हुन्छ' : 'How Daily Attendance Works'}</h3>
              <p>{lang === 'ne' ? 'TuitionTrack ले प्रमाणित कक्षा उपस्थिति अभिलेख राख्छ जुन अभिभावकले सिधै हेर्न सक्छन्।' : 'TuitionTrack keeps a verified record of class attendance that parents can see directly without phone calls.'}</p>
              <div className="help-guide-list">
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'शिक्षक कार्यप्रवाह:' : 'Tutor workflow:'}</b>
                  {lang === 'ne' ? 'विद्यार्थीहरूलाई उपस्थित वा अनुपस्थित चिन्ह लगाउनुहोस् र "उपस्थिति सुरक्षित गर्नुहोस्" थिच्नुहोस्।' : 'Mark students Present or Absent in the register and click "Save attendance". Absences immediately generate parent notifications.'}
                </div>
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'अभिभावक कार्यप्रवाह:' : 'Parent workflow:'}</b>
                  {lang === 'ne' ? 'आफ्नो बच्चाको मासिक उपस्थिति प्रतिशत र विस्तृत उपस्थिति सत्रहरू समीक्षा गर्नुहोस्।' : "View your child's attendance rate and review individual marked dates and statuses."}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="help-section">
              <h3>{lang === 'ne' ? 'शुल्क अभिलेख बुझ्दै' : 'Understanding Fee Records'}</h3>
              <p>{lang === 'ne' ? 'TuitionTrack ले वास्तविक भुक्तानी रकम ट्र्याक गर्छ तर एप भित्र पैसा प्रशोधन गर्दैन।' : 'TuitionTrack records external tuition payments without processing money through gateways.'}</p>
              <div className="help-guide-list">
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'भुक्तानी प्रविष्टि:' : 'Recording payments:'}</b>
                  {lang === 'ne' ? 'शिक्षकले नगद वा बैंक ट्रान्सफर मार्फत प्राप्त रकम दर्ता गर्छन्। यो "अभिभावक प्रतीक्षा" स्थितिमा बस्छ।' : 'Tutors log offline cash or bank transfers. The record is created with "Awaiting parent" status.'}
                </div>
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'बाँकी रकम नियम:' : 'Outstanding balance rule:'}</b>
                  {lang === 'ne' ? 'अभिभावकले प्रमाणित गरेपछि मात्र बाँकी शुल्क घट्छ। प्रतीक्षा वा विवादित भुक्तानीले बाँकी रकम घटाउँदैन।' : 'Outstanding balance is reduced strictly when the parent confirms the payment. Pending and disputed records never reduce the balance.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="help-section">
              <h3>{lang === 'ne' ? 'प्रमाणीकरण र विवाद नियमहरू' : 'Parent Confirmation & Dispute Rules'}</h3>
              <p>{lang === 'ne' ? 'खाताको पारदर्शिताका लागि प्रत्येक दर्ता भएको भुक्तानीमा अभिभावकको पुष्टि आवश्यक हुन्छ।' : 'Every recorded payment requires parent confirmation to ensure ledger integrity.'}</p>
              <div className="help-guide-list">
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'प्रमाणित गर्दा:' : 'Confirming:'}</b>
                  {lang === 'ne' ? 'रकम र महिना सही भएमा "Confirm" थिच्नुहोस्। यसले प्रमाणित भुक्तानी बढाउँछ।' : 'Parents review amount and month. Clicking "Confirm" updates the verified paid balance exactly once.'}
                </div>
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'विवाद दर्ता गर्दा:' : 'Disputing:'}</b>
                  {lang === 'ne' ? 'यदि विवरण गलत भएमा "Dispute" थिच्नुहोस्। यसले बाँकी रकम घटाउँदैन र समीक्षाका लागि चिन्ह लगाउँछ।' : 'If details are wrong, clicking "Dispute" flags the record for review without reducing outstanding dues.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="help-section">
              <h3>{lang === 'ne' ? 'परीक्षा, अंक प्रविष्टि र नतिजा' : 'Tests, Marks Entry & Results'}</h3>
              <p>{lang === 'ne' ? 'कक्षा परीक्षाहरू तालिकाबद्ध गर्नुहोस् र पारदर्शी रूपमा अंक प्रकाशित गर्नुहोस्।' : 'Schedule class assessments and publish student scores in one transparent system.'}</p>
              <div className="help-guide-list">
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'पूर्णाङ्क प्रमाणीकरण:' : 'Full marks validation:'}</b>
                  {lang === 'ne' ? 'विद्यार्थीको अंक ० भन्दा कम वा निर्धारित पूर्णाङ्कभन्दा बढी हुन सक्दैन।' : 'Marks entered cannot be negative or exceed the configured full marks. Errors highlight immediately while typing.'}
                </div>
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'अभिभावक नतिजा हेराई:' : 'Parent view:'}</b>
                  {lang === 'ne' ? 'नतिजा प्रकाशित भएपछि अभिभावकले आफ्नो बच्चाको अंक, प्रतिशत र विषयगत विश्लेषण हेर्न पाउँछन्।' : 'Once published, marks and percentage bars are visible in the parent workspace for their linked child.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="help-section">
              <h3>{lang === 'ne' ? 'शिक्षक व्यवस्थापन र पारिश्रमिक' : 'Teacher Management & Salaries'}</h3>
              <p>{lang === 'ne' ? 'ट्युसन सेन्टरले आफ्ना सम्पूर्ण शिक्षकहरूको विवरण र पारिश्रमिक खाता छुट्टै राख्छ।' : 'The tuition center manages teacher profiles, subject assignments, and teacher salary ledgers separately from student fees.'}</p>
              <div className="help-guide-list">
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'शिक्षक पारिश्रमिक खाता:' : 'Teacher payment ledger:'}</b>
                  {lang === 'ne' ? 'शिक्षकलाई दिइएको भुक्तानीले विद्यार्थीको ट्युसन शुल्कमा कुनै असर पार्दैन।' : 'Recording a teacher payment updates the teacher ledger only and never alters student tuition balances.'}
                </div>
                <div className="help-guide-item">
                  <b>{lang === 'ne' ? 'कक्षा जिम्मेवारी:' : 'Class assignment:'}</b>
                  {lang === 'ne' ? 'उपलब्ध कक्षाहरू शिक्षकलाई सजिलै जिम्मेवारी दिन सकिन्छ।' : 'Assign existing center classes to teachers to maintain organized subject rosters.'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="button button-primary" onClick={onClose}>
            {t('helpUnderstood', lang)}
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Profile Modal ──────────────────────────────────────────────────
function ProfileModal({ role, roleName, students, lang, onClose }: { role: Role; roleName: string; students: Student[]; lang: Language; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const linkedStudent = students.find(s => s.name === 'Suman Thapa') || students[0];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="profile-modal-title">Account Profile · {roleName}</h2>
            <p>{roleLabel(role, lang)} details and linked tuition information.</p>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="profile-details-content">
          <div className="profile-header-card">
            <span className={`user-avatar avatar-${role === 'parent' ? 'orange' : role === 'center' ? 'teal' : 'blue'}`} style={{ width: 48, height: 48, fontSize: 16 }}>
              {role === 'parent' ? 'MT' : role === 'center' ? 'BP' : 'DL'}
            </span>
            <div>
              <h3>{roleName}</h3>
              <p>{roleLabel(role, lang)} · Active member since Sept 2026</p>
            </div>
          </div>

          <div className="profile-fields-grid">
            <div className="profile-field">
              <label>Role</label>
              <b>{roleLabel(role, lang)}</b>
            </div>
            <div className="profile-field">
              <label>Contact Phone</label>
              <b>+977-9841234567</b>
            </div>
            {role === 'parent' ? (
              <>
                <div className="profile-field">
                  <label>Linked Child</label>
                  <b>{linkedStudent.name}</b>
                </div>
                <div className="profile-field">
                  <label>Class / Grade</label>
                  <b>{linkedStudent.grade} (Roll {linkedStudent.rollNumber})</b>
                </div>
                <div className="profile-field">
                  <label>Tuition Center</label>
                  <b>Bright Path Tuition Center</b>
                </div>
              </>
            ) : role === 'tutor' ? (
              <>
                <div className="profile-field">
                  <label>Subject Focus</label>
                  <b>Science & Mathematics (Grades 8–10)</b>
                </div>
                <div className="profile-field">
                  <label>Enrolled Students</label>
                  <b>42 Active Students</b>
                </div>
              </>
            ) : (
              <>
                <div className="profile-field">
                  <label>Institution</label>
                  <b>Bright Path Tuition Center</b>
                </div>
                <div className="profile-field">
                  <label>Location</label>
                  <b>Kathmandu, Nepal</b>
                </div>
              </>
            )}
          </div>

          <div className="profile-note">
            <ShieldCheck size={16} />
            <span>Prototype demo profile with simulated Nepal tuition links.</span>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="button button-primary" onClick={onClose}>Close Profile</button>
        </div>
      </section>
    </div>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────
function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <div className="marketing-page">
      <header className="site-header-wrapper">
        <div className="site-header wrap">
          <Brand />
          <nav className={`marketing-nav ${mobileOpen ? 'is-open' : ''}`}>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#for-everyone" onClick={() => setMobileOpen(false)}>Who it's for</a>
            <a href="#our-approach" onClick={() => setMobileOpen(false)}>Our approach</a>
            <button type="button" className="text-button mobile-only" onClick={() => { setMobileOpen(false); setSignInOpen(true); }} style={{ padding: '8px 0', fontSize: 14 }}>
              Sign in
            </button>
            <Link className="mobile-only" to="/start">Explore demo <ArrowRight size={16} /></Link>
          </nav>
          <div className="header-actions">
            <button type="button" className="button button-ghost header-login" onClick={() => setSignInOpen(true)}>
              Sign in
            </button>
            <Link to="/start" className="button button-primary">Explore demo <ArrowRight size={16} /></Link>
          </div>
          <button className="mobile-menu-button" aria-label="Toggle navigation" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section wrap">
          <div className="hero-copy reveal-once">
            <div className="eyebrow"><span className="eyebrow-dot" /> A clearer picture of tuition</div>
            <h1>Every tuition day.<br /><span>In the picture.</span></h1>
            <p className="hero-subtitle">Attendance, fees, test results and parent updates — in one calm, clear place. Less chasing for information. More time for learning.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/start">Explore the demo <ArrowRight size={18} /></Link>
              <a className="text-link" href="#how-it-works">See how it works <ArrowDownRight size={17} /></a>
            </div>
            <div className="hero-note"><ShieldCheck size={17} /> Designed for tutors, parents and tuition centers in Nepal</div>
          </div>
          <div className="hero-visual" aria-label="Illustration of the TuitionTrack dashboard">
            <div className="visual-glow" />
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="dashboard-preview">
              <div className="preview-topbar">
                <div className="preview-brand"><span className="tiny-mark"><i /><i /><i /></span> TuitionTrack</div>
                <div className="preview-top-right"><span className="preview-date">TUE, OCT 20</span><span className="preview-avatar">DL</span></div>
              </div>
              <div className="preview-inner">
                <div className="preview-welcome">
                  <div>
                    <span className="preview-muted">TUTOR WORKSPACE</span>
                    <h3>Good morning, Dibash <span className="wave">✦</span></h3>
                    <p>Here's what's happening with your students today.</p>
                  </div>
                  <div className="preview-period">This week <ChevronDown size={13} /></div>
                </div>
                <div className="preview-metrics">
                  <div className="preview-metric"><span className="metric-icon metric-blue"><Users size={15} /></span><small>Active students</small><strong>42</strong><span className="metric-foot"><ArrowUpRight size={12} /> 4 new this month</span></div>
                  <div className="preview-metric"><span className="metric-icon metric-teal"><CalendarCheck size={15} /></span><small>Present today</small><strong>38 <em>/ 42</em></strong><span className="metric-foot">90% attendance</span></div>
                  <div className="preview-metric"><span className="metric-icon metric-orange"><Wallet size={15} /></span><small>Pending fees</small><strong>Rs. 8.2k</strong><span className="metric-foot">Across 6 students</span></div>
                </div>
                <div className="preview-lower">
                  <div className="preview-attendance">
                    <div className="preview-section-title">Today's attendance <span>View all <ArrowRight size={12} /></span></div>
                    {[['AS','Aarav Shrestha','Present','blue'],['PK','Prakriti Karki','Present','violet'],['ST','Suman Thapa','Absent','orange']].map(row => (
                      <div className="preview-student" key={row[0]}>
                        <span className={`mini-avatar avatar-${row[3]}`}>{row[0]}</span>
                        <span className="preview-student-name">{row[1]}</span>
                        <span className={`mini-status ${row[2] === 'Absent' ? 'status-absent' : ''}`}><i />{row[2]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="preview-next-test">
                    <span className="test-kicker">UP NEXT</span>
                    <span className="test-date-square"><b>26</b><small>OCT</small></span>
                    <h4>Weekly Science<br />Check-in</h4>
                    <p>Grade 9 · Science</p>
                    <span className="test-reminder"><Bell size={12} /> Parents notified</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="float-card float-confirm">
              <span className="float-icon"><CheckCheck size={16} /></span>
              <span><b>Payment confirmed</b><small>Prakriti Karki · Rs. 1,000</small></span>
              <span className="float-check"><Check size={14} /></span>
            </div>
            <div className="float-card float-progress">
              <span className="progress-ring"><TrendingUp size={17} /></span>
              <span><small>TEST PERFORMANCE</small><b>+12% <em>this month</em></b></span>
              <span className="sparkline"><i /><i /><i /><i /><i /><i /></span>
            </div>
            <div className="visual-caption"><span /><span>Sample dashboard · Demo data</span></div>
          </div>
        </section>

        <section className="problem-section" id="how-it-works">
          <div className="wrap problem-grid">
            <div className="section-intro">
              <div className="eyebrow eyebrow-light">The gap we're closing</div>
              <h2>Less guessing.<br /><span>More knowing.</span></h2>
            </div>
            <div className="problem-copy">
              <p>Parents are busy. Tutors are busy teaching. Important updates can get lost between classes, messages and memory.</p>
              <p>TuitionTrack gives everyone a shared, reliable view of what happened — without making tutors spend their day doing admin.</p>
              <div className="principle-line">
                <span className="principle-number">01</span><span>Records over assumptions.</span>
                <span className="principle-number">02</span><span>Updates without the chasing.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section wrap" id="for-everyone">
          <div className="section-heading">
            <div>
              <div className="eyebrow">One connected view</div>
              <h2>Every important detail,<br /><span>finally in one place.</span></h2>
            </div>
            <p>Four practical tools that make tuition easier to follow — for the people teaching, learning and supporting.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-attendance">
              <div className="feature-top"><span className="feature-index">01</span><span className="feature-icon icon-blue"><CalendarCheck /></span></div>
              <div className="feature-art attendance-art"><div className="art-date"><span>MON</span><b>20</b><small>OCT</small></div><div className="art-check-list"><span><i className="check-dot" /> Aarav Shrestha <b>Present</b></span><span><i className="check-dot" /> Prakriti Karki <b>Present</b></span><span><i className="cross-dot" /> Suman Thapa <b className="absent-text">Absent</b></span></div></div>
              <h3>Attendance that travels home.</h3>
              <p>Mark a class in seconds. Parents can see attendance updates without needing to call the tutor.</p>
              <span className="feature-tag">Daily records · Absence updates</span>
            </article>
            <article className="feature-card feature-fees">
              <div className="feature-top"><span className="feature-index">02</span><span className="feature-icon icon-teal"><Wallet /></span></div>
              <div className="feature-art fee-art"><div className="fee-art-label">OCTOBER FEE RECORD</div><div className="fee-art-amount">Rs. 1,500 <span>monthly</span></div><div className="fee-progress"><span /></div><div className="fee-art-bottom"><span>Rs. 1,000 recorded</span><b>Rs. 500 due</b></div><div className="fee-confirm-chip"><CheckCircle2 size={14} /> Parent confirmation</div></div>
              <h3>Clear fees. Clear records.</h3>
              <p>Track monthly dues, partial payments and outstanding balances, with parent confirmation for recorded payments.</p>
              <span className="feature-tag">Monthly ledger · Confirmation</span>
            </article>
            <article className="feature-card feature-tests">
              <div className="feature-top"><span className="feature-index">03</span><span className="feature-icon icon-purple"><ClipboardCheck /></span></div>
              <div className="feature-art marks-art"><div className="marks-header"><span>RECENT TEST RESULTS</span><span className="marks-filter">Grade 9 <ChevronDown size={12} /></span></div><div className="marks-row"><span><i className="subject-dot science-dot" /> Science</span><b>17<span>/20</span></b><div className="marks-track"><i style={{ width: '85%' }} /></div></div><div className="marks-row"><span><i className="subject-dot math-dot" /> Mathematics</span><b>14<span>/20</span></b><div className="marks-track"><i style={{ width: '70%' }} /></div></div><div className="marks-row"><span><i className="subject-dot english-dot" /> English</span><b>18<span>/20</span></b><div className="marks-track"><i style={{ width: '90%' }} /></div></div></div>
              <h3>Progress, not just marks.</h3>
              <p>Schedule tests, record results and help parents spot where students are improving or need support.</p>
              <span className="feature-tag">Test reminders · Mark history</span>
            </article>
            <article className="feature-card feature-parents">
              <div className="feature-top"><span className="feature-index">04</span><span className="feature-icon icon-coral"><MessageCircle /></span></div>
              <div className="feature-art parent-art"><div className="parent-art-head"><span className="parent-avatar">ST</span><span><b>Suman Thapa</b><small>Parent view</small></span><span className="parent-online"><i /> Updated</span></div><div className="parent-notice"><span className="notice-icon notice-blue"><Calendar /></span><span><b>Science test scheduled</b><small>Monday, Oct 26 · Grade 9</small></span><span className="notice-new">NEW</span></div><div className="parent-notice"><span className="notice-icon notice-teal"><TrendingUp /></span><span><b>Test results published</b><small>Physics · 14 out of 20</small></span></div></div>
              <h3>Parents in the picture.</h3>
              <p>Relevant updates reach the right people, so routine information doesn't depend on memory or second-hand messages.</p>
              <span className="feature-tag">One shared view · Timely updates</span>
            </article>
          </div>
        </section>

        <section className="roles-section" id="our-approach">
          <div className="wrap">
            <div className="roles-heading">
              <div className="eyebrow eyebrow-light">Made for the whole tuition circle</div>
              <h2>Different roles.<br /><span>One shared picture.</span></h2>
              <p>Whether a tutor teaches independently or a center manages many classes, the right information stays in the right hands.</p>
            </div>
            <div className="role-cards">
              <div className="role-card">
                <span className="role-symbol role-symbol-blue"><GraduationCap /></span>
                <h3>For tutors</h3>
                <p>Spend less time maintaining records and more time teaching.</p>
                <span className="role-link">A calmer teaching day <ArrowUpRight size={15} /></span>
              </div>
              <div className="role-card">
                <span className="role-symbol role-symbol-teal"><Users /></span>
                <h3>For parents</h3>
                <p>Stay informed about attendance, fees, tests and progress.</p>
                <span className="role-link">A clearer view of tuition <ArrowUpRight size={15} /></span>
              </div>
              <div className="role-card">
                <span className="role-symbol role-symbol-coral"><Activity /></span>
                <h3>For tuition centers</h3>
                <p>Keep track of classes and records without scattered spreadsheets.</p>
                <span className="role-link">A connected center <ArrowUpRight size={15} /></span>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section wrap" id="cta-section">
          <div className="cta-panel">
            <div className="cta-orb cta-orb-one" /><div className="cta-orb cta-orb-two" />
            <div className="cta-copy">
              <span className="eyebrow eyebrow-light">Start with the experience</span>
              <h2>Tuition should be<br />clearer for everyone.</h2>
              <p>Explore the interactive demo and see how the pieces fit together.</p>
              <Link to="/start" className="button button-white button-large">Explore TuitionTrack <ArrowRight size={17} /></Link>
            </div>
            <div className="cta-illustration">
              <div className="cta-ring ring-a" /><div className="cta-ring ring-b" />
              <div className="cta-core"><span className="brand-mark brand-mark-large"><span /><span /><span /></span></div>
              <div className="cta-chip cta-chip-one"><CheckCircle2 size={15} /> Confirmed</div>
              <div className="cta-chip cta-chip-two"><CalendarCheck size={15} /> Attendance saved</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer wrap">
        <Brand />
        <span>Designed around real tuition life in Nepal.</span>
        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <a href="#our-approach">Our approach</a>
          <Link to="/start">Explore demo</Link>
          <button type="button" className="footer-signin-btn" onClick={() => setSignInOpen(true)}>Sign in</button>
        </div>
      </footer>
      {signInOpen && <SignInModal onClose={() => setSignInOpen(false)} />}
    </div>
  );
}

// ─── Role Picker (Clear Demo Entry) ──────────────────────────────────
function RolePicker() {
  return (
    <div className="role-picker-page">
      <header className="site-header-wrapper">
        <div className="site-header wrap">
          <Brand />
          <Link to="/" className="button button-ghost"><ChevronLeft size={16} /> Back to home</Link>
        </div>
      </header>
      <main className="role-picker-wrap">
        <div className="eyebrow"><span className="eyebrow-dot" /> INTERACTIVE PROTOTYPE</div>
        <h1>How would you like<br />to explore <span>TuitionTrack?</span></h1>
        <p className="role-picker-intro">Choose a demo role. Each workspace has its own navigation and example data, so you can explore the product from a different point of view.</p>
        <div className="role-choice-grid">
          <Link to="/app/parent/dashboard" className="role-choice-card">
            <span className="role-choice-icon choice-teal"><Users /></span>
            <span className="choice-kicker">DEMO ACCOUNT 01</span>
            <h2>I'm a parent</h2>
            <p>Mina Thapa · View attendance, check marks, and confirm or dispute recorded fees.</p>
            <span className="role-choice-bottom">Open parent demo <ArrowRight size={16} /></span>
          </Link>
          <Link to="/app/tutor/dashboard" className="role-choice-card">
            <span className="role-choice-icon choice-blue"><GraduationCap /></span>
            <span className="choice-kicker">DEMO ACCOUNT 02</span>
            <h2>I'm a tutor</h2>
            <p>Dibash Lamichhane · Manage students, mark attendance, record fees and schedule tests.</p>
            <span className="role-choice-bottom">Open tutor demo <ArrowRight size={16} /></span>
          </Link>
          <Link to="/app/center/dashboard" className="role-choice-card">
            <span className="role-choice-icon choice-purple"><LayoutDashboard /></span>
            <span className="choice-kicker">DEMO ACCOUNT 03</span>
            <h2>I manage a center</h2>
            <p>Bright Path Tuition · Oversee teachers, students, attendance, fee ledgers, and staff payroll.</p>
            <span className="role-choice-bottom">Open center demo <ArrowRight size={16} /></span>
          </Link>
        </div>
        <div className="prototype-disclaimer">
          <Sparkles size={16} />
          <span>This is a front-end prototype with sample data. No real accounts, messages or payments are connected.</span>
        </div>
      </main>
    </div>
  );
}

function DefaultAppRoute() {
  const { role } = useParams();
  return <Navigate to={`/app/${validRole(role)}/dashboard`} replace />;
}

function validRole(raw?: string): Role {
  return raw === 'parent' || raw === 'center' ? raw : 'tutor';
}

// ─── App Shell with Complete Navigation, Help Button & Language ─────
function AppShell(props: {
  students: Student[];
  payments: Payment[];
  tests: Test[];
  testResults: TestResult[];
  notices: Notice[];
  teachers: Teacher[];
  teacherPayments: TeacherPayment[];
  classes: ClassItem[];
  lang: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setThemeMode: (theme: Theme) => void;
  showLangPrompt: boolean;
  setShowLangPrompt: (show: boolean) => void;
  setAttendance: (id: string, attendance: Attendance) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  addStudent: (name: string, grade: string, fee: number) => void;
  addPayment: (student: string, amount: number, month: string, method: string) => void;
  addTeacherPayment: (teacherId: string, period: string, amount: number, method: string, note?: string) => void;
  assignClassToTeacher: (teacherId: string, className: string) => void;
  addTest: (title: string, subject: string, date: string, grade: string) => void;
  publishResults: (testId: string, results: TestResult[]) => void;
  setNotices: (fn: (items: Notice[]) => Notice[]) => void;
  notify: (message: string) => void;
  saveAttendance: (shown: Student[]) => void;
}) {
  const { role: rawRole, section: rawSection } = useParams();
  const role = validRole(rawRole);
  const location = useLocation();
  const navigate = useNavigate();

  const validSections: Section[] = ['dashboard', 'teachers', 'students', 'attendance', 'fees', 'tests', 'notifications', 'settings'];
  const section = (validSections.includes(rawSection as Section) ? rawSection : 'dashboard') as Section;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    teacher: Teacher | null;
    isSample: boolean;
  }>({
    isOpen: false,
    teacher: null,
    isSample: false,
  });
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const handleOpenReportModal = (teacher?: Teacher | null, isSample = false) => {
    setReportModalState({
      isOpen: true,
      teacher: teacher || (props.teachers.length > 0 ? props.teachers[0] : null),
      isSample,
    });
  };

  const handleCloseReportModal = () => {
    setReportModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Check language prompt on first entry to any workspace
  useEffect(() => {
    const hasChosen = localStorage.getItem('tuitiontrack_lang_chosen');
    if (!hasChosen) {
      props.setShowLangPrompt(true);
    }
  }, []);

  const handleLangPromptSelect = (chosenLang: Language) => {
    props.setLanguage(chosenLang);
    localStorage.setItem('tuitiontrack_lang_chosen', 'true');
    props.setShowLangPrompt(false);
    props.notify(chosenLang === 'ne' ? 'भाषा नेपालीमा परिवर्तन गरियो।' : 'Language set to English.');
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter notifications based on role
  const relevantNotices = role === 'parent'
    ? props.notices.filter(n => n.student === 'Suman Thapa' || (!n.student && (!n.grade || n.grade === 'Grade 9')))
    : props.notices;
  const unread = relevantNotices.filter(n => !n.read).length;

  const roleName = role === 'tutor'
    ? 'Dibash Lamichhane'
    : role === 'parent'
    ? 'Mina Thapa'
    : 'Bright Path Tuition';

  // Navigation Items per Role
  const roleNavItems: { section: Section; label: string; icon: typeof LayoutDashboard }[] = useMemo(() => {
    if (role === 'center') {
      return [
        { section: 'dashboard', label: sectionTitle('dashboard', props.lang), icon: LayoutDashboard },
        { section: 'teachers', label: sectionTitle('teachers', props.lang), icon: GraduationCap },
        { section: 'students', label: sectionTitle('students', props.lang), icon: Users },
        { section: 'attendance', label: sectionTitle('attendance', props.lang), icon: CalendarCheck },
        { section: 'fees', label: sectionTitle('fees', props.lang), icon: Wallet },
        { section: 'tests', label: sectionTitle('tests', props.lang), icon: ClipboardCheck },
        { section: 'notifications', label: sectionTitle('notifications', props.lang), icon: Bell },
        { section: 'settings', label: sectionTitle('settings', props.lang), icon: Settings },
      ];
    }
    if (role === 'parent') {
      return [
        { section: 'dashboard', label: sectionTitle('dashboard', props.lang), icon: LayoutDashboard },
        { section: 'attendance', label: sectionTitle('attendance', props.lang), icon: CalendarCheck },
        { section: 'fees', label: sectionTitle('fees', props.lang), icon: Wallet },
        { section: 'tests', label: sectionTitle('tests', props.lang), icon: ClipboardCheck },
        { section: 'notifications', label: sectionTitle('notifications', props.lang), icon: Bell },
        { section: 'settings', label: sectionTitle('settings', props.lang), icon: Settings },
      ];
    }
    // Tutor
    return [
      { section: 'dashboard', label: sectionTitle('dashboard', props.lang), icon: LayoutDashboard },
      { section: 'students', label: sectionTitle('students', props.lang), icon: Users },
      { section: 'attendance', label: sectionTitle('attendance', props.lang), icon: CalendarCheck },
      { section: 'fees', label: sectionTitle('fees', props.lang), icon: Wallet },
      { section: 'tests', label: sectionTitle('tests', props.lang), icon: ClipboardCheck },
      { section: 'notifications', label: sectionTitle('notifications', props.lang), icon: Bell },
      { section: 'settings', label: sectionTitle('settings', props.lang), icon: Settings },
    ];
  }, [role, props.lang]);

  // Scoped views for renderPage
  const renderPage = () => {
    const scopedStudents = role === 'parent'
      ? props.students.filter(s => s.name === 'Suman Thapa')
      : props.students;
    const scopedPayments = role === 'parent'
      ? props.payments.filter(p => p.student === 'Suman Thapa')
      : props.payments;
    const scopedNotices = role === 'parent'
      ? relevantNotices
      : props.notices;
    const scopedTests = role === 'parent'
      ? props.tests.filter(t => t.grade === 'Grade 9')
      : props.tests;
    const scopedResults = role === 'parent'
      ? props.testResults.filter(r => {
          const student = props.students.find(s => s.id === r.studentId);
          return student?.name === 'Suman Thapa';
        })
      : props.testResults;

    const common = {
      ...props,
      students: scopedStudents,
      payments: scopedPayments,
      tests: scopedTests,
      testResults: scopedResults,
      notices: scopedNotices,
      role,
      lang: props.lang,
      theme: props.theme,
      notify: props.notify,
      onOpenReport: handleOpenReportModal,
    };

    switch (section) {
      case 'dashboard':
        return <DashboardPage {...common} onNavigate={(s: Section) => navigate(`/app/${role}/${s}`)} />;
      case 'teachers':
        return <TeachersPage {...common} />;
      case 'students':
        return <StudentsPage {...common} searchTerm={searchTerm} onSearchChange={setSearchTerm} addStudent={props.addStudent} />;
      case 'attendance':
        return <AttendancePage {...common} onAttendance={props.setAttendance} saveAttendance={props.saveAttendance} />;
      case 'fees':
        return <FeesPage {...common} addPayment={props.addPayment} updatePaymentStatus={props.updatePaymentStatus} />;
      case 'tests':
        return <TestsPage {...common} addTest={props.addTest} publishResults={props.publishResults} allStudents={props.students} />;
      case 'notifications':
        return <NotificationsPage {...common} setNotices={props.setNotices} />;
      case 'settings':
        return <SettingsPage {...common} />;
    }
  };

  return (
    <div className={`app-shell ${props.theme === 'dark' ? 'theme-dark' : ''}`}>
      {sidebarOpen && <button aria-label="Close navigation" className="mobile-sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <Brand />
          <button className="sidebar-close mobile-only" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className={`workspace-avatar workspace-${role}`}>
            {role === 'tutor' ? 'DL' : role === 'parent' ? 'MT' : 'BP'}
          </span>
          <span className="workspace-meta">
            <b>{role === 'center' ? 'Bright Path' : role === 'parent' ? 'Mina Thapa' : 'Dibash L.'}</b>
            <small>{roleLabel(role, props.lang)}</small>
          </span>
          <ChevronDown size={15} />
        </div>

        <div className="sidebar-caption">{t('workspace', props.lang)}</div>
        <nav className="app-nav" aria-label="Application navigation">
          {roleNavItems.map(item => {
            const Icon = item.icon;
            const active = section === item.section;
            return (
              <Link
                key={item.section}
                to={`/app/${role}/${item.section}`}
                onClick={() => setSidebarOpen(false)}
                className={`app-nav-link ${active ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {item.section === 'notifications' && unread > 0 && <span className="nav-count">{unread}</span>}
                {active && <span className="nav-active-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        {/* Fully visible Sidebar Help Control */}
        <div
          className="sidebar-help"
          role="button"
          tabIndex={0}
          onClick={() => setHelpModalOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHelpModalOpen(true); } }}
          aria-label={t('needHelp', props.lang)}
        >
          <span className="help-orb"><CircleHelp size={17} /></span>
          <b>{t('needHelp', props.lang)}</b>
          <p>{t('helpSub', props.lang)}</p>
          <button type="button" onClick={e => { e.stopPropagation(); setHelpModalOpen(true); }}>
            {t('visitHelp', props.lang)} <ArrowRight size={13} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <Link to="/" className="app-nav-link">
            <LogOut size={17} />
            <span>{t('backToWebsite', props.lang)}</span>
          </Link>
          <div className="sidebar-user">
            <span className={`user-avatar avatar-${role === 'parent' ? 'orange' : role === 'center' ? 'teal' : 'blue'}`}>
              {role === 'parent' ? 'MT' : role === 'center' ? 'BP' : 'DL'}
            </span>
            <span className="sidebar-user-meta">
              <b>{roleName}</b>
              <small>{role === 'center' ? t('centerDesc', props.lang) : role === 'parent' ? t('parentDesc', props.lang) : t('tutorDesc', props.lang)}</small>
            </span>
            <button
              className="icon-button tiny-icon"
              aria-label="Settings"
              onClick={() => navigate(`/app/${role}/settings`)}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-menu-button app-mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu />
          </button>
          <div className="breadcrumbs">
            <span>TuitionTrack</span>
            <ChevronRight size={14} />
            <b>{sectionTitle(section, props.lang)}</b>
          </div>

          <div className="topbar-actions">
            <div className="app-search">
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('searchStudents', props.lang)}
                aria-label="Search"
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search"><X size={13} /></button>}
              <kbd>⌘ K</kbd>
            </div>

            {/* TASK 2 FIX: FULLY VISIBLE "NEED HELP?" BUTTON WITH ICON & TEXT */}
            <button
              type="button"
              className="topbar-help-button"
              onClick={() => setHelpModalOpen(true)}
              aria-label={t('needHelp', props.lang)}
            >
              <CircleHelp size={17} />
              <span>{t('needHelp', props.lang)}</span>
            </button>

            <button
              className="icon-button notification-top-button"
              aria-label="Notifications"
              onClick={() => navigate(`/app/${role}/notifications`)}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>

            <div className="topbar-divider" />

            <div className="topbar-account-container" ref={accountMenuRef}>
              <button
                type="button"
                className={`topbar-user-btn ${accountMenuOpen ? 'active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label={`${roleName} account menu`}
                onClick={() => setAccountMenuOpen(v => !v)}
              >
                <span className={`user-avatar avatar-${role === 'parent' ? 'orange' : role === 'center' ? 'teal' : 'blue'}`}>
                  {role === 'parent' ? 'MT' : role === 'center' ? 'BP' : 'DL'}
                </span>
                <span className="topbar-user-text">
                  <b className="topbar-user-name">{roleName}</b>
                  <small className="topbar-user-sub">{roleLabel(role, props.lang)}</small>
                </span>
                <ChevronDown size={14} className={`topbar-user-chevron ${accountMenuOpen ? 'chevron-rotated' : ''}`} />
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown-menu" role="menu" aria-label="Account options">
                  <div className="account-dropdown-head">
                    <b>{roleName}</b>
                    <small>{role === 'parent' ? 'Parent of Suman Thapa · Grade 9' : roleLabel(role, props.lang)}</small>
                  </div>
                  <div className="account-dropdown-divider" />
                  <button
                    type="button"
                    role="menuitem"
                    className="account-menu-item"
                    onClick={() => { setAccountMenuOpen(false); setProfileModalOpen(true); }}
                  >
                    <Users size={16} />
                    <span>Profile details</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="account-menu-item"
                    onClick={() => { setAccountMenuOpen(false); navigate(`/app/${role}/settings`); }}
                  >
                    <Settings size={16} />
                    <span>{t('settings', props.lang)}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="account-menu-item"
                    onClick={() => { setAccountMenuOpen(false); setHelpModalOpen(true); }}
                  >
                    <CircleHelp size={16} />
                    <span>{t('helpTitle', props.lang)}</span>
                  </button>
                  <div className="account-dropdown-divider" />
                  <div className="account-dropdown-subhead">SWITCH DEMO ROLE</div>
                  {role !== 'parent' && (
                    <Link
                      to="/app/parent/dashboard"
                      role="menuitem"
                      className="account-menu-item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <Users size={16} />
                      <span>Parent workspace</span>
                    </Link>
                  )}
                  {role !== 'tutor' && (
                    <Link
                      to="/app/tutor/dashboard"
                      role="menuitem"
                      className="account-menu-item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <GraduationCap size={16} />
                      <span>Tutor workspace</span>
                    </Link>
                  )}
                  {role !== 'center' && (
                    <Link
                      to="/app/center/dashboard"
                      role="menuitem"
                      className="account-menu-item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      <span>Center workspace</span>
                    </Link>
                  )}
                  <div className="account-dropdown-divider" />
                  <Link
                    to="/"
                    role="menuitem"
                    className="account-menu-item account-menu-logout"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <LogOut size={16} />
                    <span>{t('backToWebsite', props.lang)}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content" key={location.pathname}>
          {renderPage()}
        </main>

        <footer className="app-footer">
          <span>TuitionTrack Workspace</span>
          <span><span className="footer-green-dot" /> Demo data only</span>
          <span>Made for clearer tuition life in Nepal</span>
        </footer>
      </div>

      {props.showLangPrompt && (
        <LanguagePromptModal onSelect={handleLangPromptSelect} />
      )}

      {helpModalOpen && (
        <HelpModal role={role} lang={props.lang} onClose={() => setHelpModalOpen(false)} />
      )}

      {profileModalOpen && (
        <ProfileModal
          role={role}
          roleName={roleName}
          students={props.students}
          lang={props.lang}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      {reportModalState.isOpen && (
        <TeacherReportModal
          teacher={reportModalState.teacher}
          teachers={props.teachers}
          allStudents={props.students}
          teacherPayments={props.teacherPayments}
          isInitialSample={reportModalState.isSample}
          onClose={handleCloseReportModal}
          notify={props.notify}
          lang={props.lang}
        />
      )}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-heading-actions">{action}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    unmarked: 'Not marked',
    pending: 'Awaiting parent',
    confirmed: 'Parent-confirmed',
    disputed: 'Disputed',
    scheduled: 'Scheduled',
    completed: 'Completed',
    published: 'Published',
    paid: 'Paid',
    partial: 'Partially paid',
  };
  const label = labels[status] || status;
  return <span className={`status-pill status-${status}`}><i />{label}</span>;
}

function StudentAvatar({ student, small = false }: { student: Student; small?: boolean }) {
  return <span className={`student-avatar avatar-${student.color} ${small ? 'student-avatar-small' : ''}`}>{student.initials}</span>;
}

function AnimatedStatCard({
  label, value, detail, icon: Icon, tone, trend, delay = 0, prefix = '', suffix = '', lang = 'en'
}: {
  label: string; value: number; detail: string; icon: typeof Users; tone: string;
  trend?: string; delay?: number; prefix?: string; suffix?: string; lang?: Language;
}) {
  const animated = useCountUp(value, 1200, delay);
  const displayVal = prefix
    ? formatCurrency(animated, lang)
    : `${formatNum(animated, lang)}`;

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}><Icon size={18} /></span>
        {trend && <span className="stat-trend"><ArrowUpRight size={13} />{trend}</span>}
      </div>
      <div className="stat-value">{displayVal}{suffix}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

// SVG donut chart component with animation
function AttendanceDonut({ present, absent, unmarked, delay = 80, lang = 'en' }: { present: number; absent: number; unmarked: number; delay?: number; lang?: Language }) {
  const marked = present + absent;
  const pct = marked > 0 ? Math.round((present / marked) * 100) : 0;
  const animatedPct = useCountUp(pct, 1200, delay);
  const animatedPresent = useCountUp(present, 1200, delay);
  const animatedAbsent = useCountUp(absent, 1200, delay + 80);
  const animatedUnmarked = useCountUp(unmarked, 1200, delay + 160);

  const size = 125;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedPct / 100);

  return (
    <div className="attendance-summary">
      <div className="attendance-ring-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="attendance-donut-svg">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#edf1f7" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none" stroke="#12a887" strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
          <text x={size/2} y={size/2 - 2} textAnchor="middle" className="donut-pct-text">
            {formatNum(animatedPct, lang)}%
          </text>
          <text x={size/2} y={size/2 + 15} textAnchor="middle" className="donut-label-text">
            {t('attendance', lang)}
          </text>
        </svg>
      </div>
      <div className="attendance-legend">
        <div><i className="legend-teal" /><span>{t('present', lang)}</span><b>{formatNum(animatedPresent, lang)}</b></div>
        <div><i className="legend-orange" /><span>{t('absent', lang)}</span><b>{formatNum(animatedAbsent, lang)}</b></div>
        <div><i className="legend-gray" /><span>{t('unmarked', lang)}</span><b>{formatNum(animatedUnmarked, lang)}</b></div>
      </div>
    </div>
  );
}

// ─── Dashboard Overview (Center, Tutor & Parent) ────────────────────
function DashboardPage({
  role, students, payments, tests, testResults, notices, teachers, teacherPayments, onNavigate, onOpenReport, notify, lang
}: any) {
  const isParent = role === 'parent';
  const isCenter = role === 'center';

  const present = students.filter((s: Student) => s.attendance === 'present').length;
  const absent = students.filter((s: Student) => s.attendance === 'absent').length;
  const unmarked = students.filter((s: Student) => s.attendance === 'unmarked').length;

  const pendingPayments = payments.filter((p: Payment) => p.status === 'pending');
  const disputedPayments = payments.filter((p: Payment) => p.status === 'disputed');
  const confirmedPayments = payments.filter((p: Payment) => p.status === 'confirmed');

  const totalFeeDue = students.reduce((sum: number, s: Student) => sum + s.fee, 0);
  const totalConfirmedPaid = students.reduce((sum: number, s: Student) => sum + s.confirmedPaid, 0);
  const totalOutstanding = students.reduce((sum: number, s: Student) => sum + Math.max(0, s.fee - s.confirmedPaid), 0);

  // Center Teacher Ledger Stats
  const activeTeachersCount = teachers.filter((t: Teacher) => t.status === 'active').length;
  const teacherSalariesDue = teacherPayments.reduce((sum: number, tp: TeacherPayment) => sum + tp.amountDue, 0);
  const teacherSalariesPaid = teacherPayments.reduce((sum: number, tp: TeacherPayment) => sum + tp.amountPaid, 0);
  const teacherSalariesBalance = teacherPayments.reduce((sum: number, tp: TeacherPayment) => sum + tp.balance, 0);

  if (isParent) {
    return (
      <div className="page-wrap dashboard-page">
        <PageHeader
          eyebrow={t('parentOverview', lang)}
          title={`${t('goodMorning', lang)}, Mina.`}
          description={t('parentWelcomeDesc', lang)}
          action={
            <button className="button button-secondary" onClick={() => notify('Report export simulated.')}>
              <ArrowDownRight size={16} /> {t('exportReport', lang)}
            </button>
          }
        />
        <ParentDashboard
          students={students}
          payments={payments}
          tests={tests}
          testResults={testResults}
          onNavigate={onNavigate}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div className="page-wrap dashboard-page">
      <PageHeader
        eyebrow={isCenter ? t('centerOverview', lang) : t('tutorOverview', lang)}
        title={isCenter ? `${t('goodMorning', lang)}, Bright Path.` : `${t('goodMorning', lang)}, Dibash.`}
        description={isCenter ? t('centerWelcomeDesc', lang) : t('tutorWelcomeDesc', lang)}
        action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="button button-secondary"
              onClick={() => {
                if (isCenter) {
                  onOpenReport?.(teachers[0] || null, false);
                } else {
                  const tutorTeacher = teachers.find((tch: Teacher) => tch.name.includes('Dibash')) || teachers[0];
                  onOpenReport?.(tutorTeacher || null, false);
                }
              }}
            >
              <FileDown size={16} /> {t('exportTeacherReport', lang)}
            </button>
            <button
              className="button button-secondary"
              onClick={() => onOpenReport?.(null, true)}
            >
              <Sparkles size={16} /> {t('previewSampleReport', lang)}
            </button>
          </div>
        }
      />

      {/* Meaningful Center Statistics from Actual Demo Records */}
      {isCenter ? (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <AnimatedStatCard
              label={t('activeTeachers', lang)}
              value={activeTeachersCount}
              detail={`${teachers.length} total staff in directory`}
              icon={GraduationCap}
              tone="stat-blue"
              delay={0}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('activeStudents', lang)}
              value={students.length}
              detail={`${present} present, ${absent} absent today`}
              icon={Users}
              tone="stat-teal"
              delay={80}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('outstandingFees', lang)}
              value={totalOutstanding}
              detail={`${pendingPayments.length} awaiting, ${disputedPayments.length} disputed`}
              icon={Wallet}
              tone="stat-orange"
              prefix="Rs. "
              delay={160}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('teacherPaymentsDue', lang)}
              value={teacherSalariesBalance}
              detail={`${formatCurrency(teacherSalariesPaid, lang)} paid this month`}
              icon={CreditCard}
              tone="stat-purple"
              prefix="Rs. "
              delay={240}
              lang={lang}
            />
          </div>

          <div className="dashboard-grid-main">
            <section className="panel attendance-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('attendance', lang)}</h2>
                  <p>Tuesday, October 20, 2026</p>
                </div>
                <button className="text-button" onClick={() => onNavigate('attendance')}>
                  Open register <ArrowRight size={14} />
                </button>
              </div>
              <AttendanceDonut present={present} absent={absent} unmarked={unmarked} delay={100} lang={lang} />
              <div className="panel-subheading">
                <b>Today's Classroom Roster</b>
                <span>{students.length} students</span>
              </div>
              <div className="mini-student-list">
                {students.slice(0, 3).map((s: Student) => (
                  <div className="mini-student-row" key={s.id}>
                    <StudentAvatar student={s} small />
                    <span className="mini-student-meta">
                      <b>{s.name}</b>
                      <small>{s.grade} · {s.assignedClass || 'General'}</small>
                    </span>
                    <StatusPill status={s.attendance} />
                  </div>
                ))}
              </div>
            </section>

            <section className="panel schedule-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('teacherLedger', lang)}</h2>
                  <p>Staff compensation and settlement</p>
                </div>
                <button className="icon-button" aria-label="Teachers" onClick={() => onNavigate('teachers')}>
                  <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="upcoming-list">
                {teachers.slice(0, 3).map((tch: Teacher) => {
                  const pmt = teacherPayments.find((tp: TeacherPayment) => tp.teacherId === tch.id);
                  return (
                    <div className="upcoming-test" key={tch.id}>
                      <span className={`user-avatar avatar-${tch.color}`} style={{ width: 38, height: 38, fontSize: 12 }}>
                        {tch.initials}
                      </span>
                      <div className="upcoming-meta">
                        <b>{tch.name}</b>
                        <span>{tch.subjects.join(', ')} · {tch.assignedClasses.length} classes</span>
                        <small>{pmt ? `${pmt.status.toUpperCase()} · Bal: ${formatCurrency(pmt.balance, lang)}` : 'Monthly active'}</small>
                      </div>
                      <button className="button button-small button-secondary" onClick={() => onNavigate('teachers')}>
                        Ledger
                      </button>
                    </div>
                  );
                })}
              </div>
              <button className="panel-bottom-link" onClick={() => onNavigate('teachers')}>
                {t('teachers', lang)} workspace <ArrowRight size={14} />
              </button>
            </section>
          </div>

          <div className="dashboard-grid-bottom">
            <section className="panel fee-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('fees', lang)}</h2>
                  <p>October 2026 Student Dues</p>
                </div>
                <button className="text-button" onClick={() => onNavigate('fees')}>
                  View all fee records <ArrowRight size={14} />
                </button>
              </div>
              <div className="fee-overview-numbers">
                <div>
                  <span>Confirmed collection</span>
                  <b><AnimatedMoney value={totalConfirmedPaid} delay={200} lang={lang} /></b>
                  <small>{confirmedPayments.length} payments verified</small>
                </div>
                <div>
                  <span>Awaiting confirmation</span>
                  <b><AnimatedMoney value={pendingPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)} delay={260} lang={lang} /></b>
                  <small>{pendingPayments.length} awaiting response</small>
                </div>
              </div>
              <div className="fee-bar-labels">
                <span>Fee collection progress</span>
                <span>{totalFeeDue > 0 ? Math.round((totalConfirmedPaid / totalFeeDue) * 100) : 0}% collected</span>
              </div>
              <div className="fee-bars">
                <i style={{ width: `${totalFeeDue > 0 ? (totalConfirmedPaid / totalFeeDue) * 100 : 0}%` }} />
              </div>
              <div className="fee-chart-foot">
                <span><i className="legend-teal" /> Parent-confirmed</span>
                <span><i className="legend-orange" /> Awaiting / Disputed</span>
              </div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('notifications', lang)}</h2>
                  <p>Recent activity updates</p>
                </div>
                <button className="icon-button" aria-label="All notifications" onClick={() => onNavigate('notifications')}>
                  <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="activity-list">
                {notices.slice(0, 3).map((n: Notice) => (
                  <div className="activity-item" key={n.id}>
                    <span className={`activity-icon activity-${n.kind}`}>
                      {n.kind === 'attendance' ? <CalendarCheck size={15} /> : n.kind === 'fee' ? <Wallet size={15} /> : <ClipboardCheck size={15} />}
                    </span>
                    <span className="activity-meta">
                      <b>{lang === 'ne' ? (n.titleNe || n.title) : n.title}</b>
                      <small>{lang === 'ne' ? (n.bodyNe || n.body) : n.body}</small>
                      <em>{n.time}</em>
                    </span>
                    {!n.read && <i className="activity-unread" />}
                  </div>
                ))}
              </div>
              <button className="panel-bottom-link" onClick={() => onNavigate('notifications')}>
                View all notifications <ArrowRight size={14} />
              </button>
            </section>
          </div>
        </>
      ) : (
        // Tutor Dashboard View
        <>
          <div className="stat-grid">
            <AnimatedStatCard
              label={t('activeStudents', lang)}
              value={students.length}
              detail="Across your active classes"
              icon={Users}
              tone="stat-blue"
              delay={0}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('presentToday', lang)}
              value={present}
              detail="Marked in today's register"
              icon={CalendarCheck}
              tone="stat-teal"
              delay={80}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('outstandingFees', lang)}
              value={totalOutstanding}
              detail={`${pendingPayments.length} awaiting confirmation`}
              icon={Wallet}
              tone="stat-orange"
              prefix="Rs. "
              delay={160}
              lang={lang}
            />
            <AnimatedStatCard
              label={t('upcomingTests', lang)}
              value={tests.filter((t: Test) => t.status === 'scheduled').length}
              detail="Next test on Oct 26"
              icon={ClipboardCheck}
              tone="stat-purple"
              delay={240}
              lang={lang}
            />
          </div>

          <div className="dashboard-grid-main">
            <section className="panel attendance-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('attendance', lang)}</h2>
                  <p>Tuesday, October 20, 2026</p>
                </div>
                <button className="text-button" onClick={() => onNavigate('attendance')}>
                  Open register <ArrowRight size={14} />
                </button>
              </div>
              <AttendanceDonut present={present} absent={absent} unmarked={unmarked} delay={100} lang={lang} />
              <div className="panel-subheading">
                <b>Recent student records</b>
                <span>Demo class</span>
              </div>
              <div className="mini-student-list">
                {students.slice(0, 3).map((s: Student) => (
                  <div className="mini-student-row" key={s.id}>
                    <StudentAvatar student={s} small />
                    <span className="mini-student-meta">
                      <b>{s.name}</b>
                      <small>{s.grade}</small>
                    </span>
                    <StatusPill status={s.attendance} />
                  </div>
                ))}
              </div>
            </section>

            <section className="panel schedule-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('upcomingTests', lang)}</h2>
                  <p>Keep students and parents prepared</p>
                </div>
                <button className="icon-button" aria-label="View tests" onClick={() => onNavigate('tests')}>
                  <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="upcoming-list">
                {tests.filter((t: Test) => t.status === 'scheduled').slice(0, 3).map((t: Test, i: number) => (
                  <div className="upcoming-test" key={t.id}>
                    <div className={`test-date-tile tile-${i}`}>
                      <small>{t.date.split(' ')[0].slice(0,3).toUpperCase()}</small>
                      <b>{t.date.match(/\d+/)?.[0] || '26'}</b>
                    </div>
                    <div className="upcoming-meta">
                      <b>{t.title}</b>
                      <span>{t.grade} · {t.subject}</span>
                      <small><Bell size={12} /> Parent reminders enabled</small>
                    </div>
                    <MoreHorizontal size={17} className="upcoming-more" />
                  </div>
                ))}
              </div>
              <button className="panel-bottom-link" onClick={() => onNavigate('tests')}>
                Manage tests <ArrowRight size={14} />
              </button>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Parent Dashboard ───────────────────────────────────────────────
function ParentDashboard({ students, payments, tests, testResults, onNavigate, lang }: any) {
  const student = students.find((s: Student) => s.name === 'Suman Thapa') || students[0];
  const pendingPayments = payments.filter((p: Payment) => p.status === 'pending');

  const sumanResults = (testResults as TestResult[]).filter(r => {
    const s = students.find((st: Student) => st.id === r.studentId);
    return s?.name === 'Suman Thapa';
  });
  const latestResult = sumanResults[sumanResults.length - 1];
  const latestTest = latestResult ? tests.find((t: Test) => t.id === latestResult.testId) : null;

  return (
    <>
      <div className="parent-child-banner">
        <StudentAvatar student={student} />
        <div>
          <span>YOUR CHILD'S PROFILE</span>
          <h2>{student.name}</h2>
          <p>{student.grade} (Roll {student.rollNumber}) · Bright Path Tuition</p>
        </div>
        <button className="button button-secondary" onClick={() => onNavigate('attendance')}>
          View activity <ArrowRight size={15} />
        </button>
      </div>

      <div className="stat-grid parent-stat-grid">
        <AnimatedStatCard
          label="Attendance this month"
          value={92}
          detail="11 of 12 sessions attended"
          icon={CalendarCheck}
          tone="stat-teal"
          suffix="%"
          delay={0}
          lang={lang}
        />
        <AnimatedStatCard
          label="Current month due"
          value={Math.max(0, student.fee - student.confirmedPaid)}
          detail="Based on parent-confirmed payments"
          icon={Wallet}
          tone="stat-orange"
          prefix="Rs. "
          delay={80}
          lang={lang}
        />
        <AnimatedStatCard
          label="Latest test result"
          value={latestResult?.obtained ?? 14}
          detail={latestTest ? `${latestTest.subject} · ${latestTest.grade}` : 'Physics · Grade 9'}
          icon={ClipboardCheck}
          tone="stat-purple"
          delay={160}
          suffix={`/${latestResult?.fullMarks ?? 20}`}
          lang={lang}
        />
        <AnimatedStatCard
          label="Pending confirmations"
          value={pendingPayments.length}
          detail="Please review payment records"
          icon={ShieldCheck}
          tone="stat-blue"
          delay={240}
          lang={lang}
        />
      </div>

      <div className="parent-dashboard-grid">
        <section className="panel parent-actions-panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Just the important items</p>
            </div>
            <span className="count-chip">{pendingPayments.length + 1} items</span>
          </div>
          {pendingPayments.length > 0 ? (
            pendingPayments.map((p: Payment) => (
              <div className="parent-action-row" key={p.id}>
                <span className="action-row-icon action-fee"><Wallet size={17} /></span>
                <span className="parent-action-meta">
                  <b>Confirm a recorded payment</b>
                  <small>{p.student} · {formatCurrency(p.amount, lang)} · {p.month}</small>
                </span>
                <button className="button button-small button-primary" onClick={() => onNavigate('fees')}>
                  Review
                </button>
              </div>
            ))
          ) : (
            <div className="empty-inline">No pending payment confirmations.</div>
          )}
          <div className="parent-action-row">
            <span className="action-row-icon action-test"><Calendar size={17} /></span>
            <span className="parent-action-meta">
              <b>Upcoming Science test</b>
              <small>Mon, Oct 26 · Grade 9</small>
            </span>
            <button className="button button-small button-secondary" onClick={() => onNavigate('tests')}>
              Details
            </button>
          </div>
        </section>

        <section className="panel parent-progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent test results</h2>
              <p>Learning progress over time</p>
            </div>
            <button className="text-button" onClick={() => onNavigate('tests')}>
              See all <ArrowRight size={14} />
            </button>
          </div>
          {sumanResults.map((r: TestResult) => {
            const t = tests.find((test: Test) => test.id === r.testId);
            if (!t) return null;
            return (
              <div className="parent-result-row" key={r.id}>
                <span className="result-subject-mark">{t.subject.slice(0, 1)}</span>
                <span className="result-subject-meta">
                  <b>{t.title}</b>
                  <small>{t.date} · {t.subject}</small>
                  <span className="result-track">
                    <i style={{ width: `${(r.obtained / r.fullMarks) * 100}%` }} />
                  </span>
                </span>
                <b className="result-score">{r.obtained}<small>/{r.fullMarks}</small></b>
              </div>
            );
          })}
          <div className="parent-progress-note">
            <TrendingUp size={16} />
            <span>Results help show learning over time. A single mark never tells the whole story.</span>
          </div>
        </section>
      </div>
    </>
  );
}

// ─── TASK 1: TEACHERS WORKSPACE (Tuition Center) ────────────────────
function TeachersPage({
  teachers, teacherPayments, classes, addTeacherPayment, assignClassToTeacher, onOpenReport, notify, lang
}: any) {
  const [activeTab, setActiveTab] = useState<'directory' | 'ledger' | 'assignments'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignModalTeacher, setAssignModalTeacher] = useState<Teacher | null>(null);
  const [paymentModalTeacher, setPaymentModalTeacher] = useState<Teacher | null>(null);

  const activeTeachers = teachers.filter((t: Teacher) => t.status === 'active');
  const totalSalariesDue = teacherPayments.reduce((s: number, p: TeacherPayment) => s + p.amountDue, 0);
  const totalSalariesPaid = teacherPayments.reduce((s: number, p: TeacherPayment) => s + p.amountPaid, 0);
  const totalSalariesRemaining = teacherPayments.reduce((s: number, p: TeacherPayment) => s + p.balance, 0);

  const filteredTeachers = teachers.filter((t: Teacher) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.subjects.some(s => s.toLowerCase().includes(q)) ||
      t.assignedClasses.some(c => c.toLowerCase().includes(q)) ||
      t.qualification.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="TUITION CENTER STAFF"
        title={t('teachersTitle', lang)}
        description={t('teachersDesc', lang)}
        action={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button button-secondary" onClick={() => onOpenReport?.(teachers[0], false)}>
              <FileDown size={16} /> {t('exportTeacherReport', lang)}
            </button>
            <button className="button button-secondary" onClick={() => onOpenReport?.(null, true)}>
              <Sparkles size={16} /> {t('previewSampleReport', lang)}
            </button>
            <button className="button button-secondary" onClick={() => setPaymentModalTeacher(teachers[0])}>
              <CreditCard size={16} /> {t('recordTeacherPayment', lang)}
            </button>
            <button className="button button-primary" onClick={() => setAssignModalTeacher(teachers[0])}>
              <Plus size={16} /> {t('assignClass', lang)}
            </button>
          </div>
        }
      />

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <AnimatedStatCard
          label={t('totalTeachers', lang)}
          value={teachers.length}
          detail={`${activeTeachers.length} active faculty members`}
          icon={GraduationCap}
          tone="stat-blue"
          delay={0}
          lang={lang}
        />
        <AnimatedStatCard
          label="Total Center Classes"
          value={classes.length}
          detail="Active curricula offered"
          icon={BookOpen}
          tone="stat-teal"
          delay={80}
          lang={lang}
        />
        <AnimatedStatCard
          label="Center Payroll Paid"
          value={totalSalariesPaid}
          detail={`${formatCurrency(totalSalariesRemaining, lang)} pending settlement`}
          icon={CreditCard}
          tone="stat-purple"
          prefix="Rs. "
          delay={160}
          lang={lang}
        />
        <AnimatedStatCard
          label="Faculty Coverage"
          value={Math.round((activeTeachers.length / teachers.length) * 100)}
          detail="Classes actively taught"
          icon={CheckCircle2}
          tone="stat-orange"
          suffix="%"
          delay={240}
          lang={lang}
        />
      </div>

      <div className="teachers-view-tabs">
        <button
          type="button"
          className={`teacher-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Users size={16} /> {t('teacherDirectory', lang)} ({teachers.length})
        </button>
        <button
          type="button"
          className={`teacher-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <CreditCard size={16} /> {t('teacherLedger', lang)} ({teacherPayments.length})
        </button>
        <button
          type="button"
          className={`teacher-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <BookOpen size={16} /> {t('classAssignments', lang)} ({classes.length})
        </button>
      </div>

      {activeTab === 'directory' && (
        <div className="panel student-list-panel">
          <div className="list-toolbar">
            <div>
              <b>{formatNum(filteredTeachers.length, lang)} {lang === 'ne' ? 'शिक्षकहरू' : 'teachers'}</b>
              <span>·</span>
              <span>{lang === 'ne' ? 'योग्य तथा अनुभवी संकाय' : 'Qualified Faculty'}</span>
            </div>
            <div className="toolbar-search-wrap">
              <Search size={16} />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder={t('searchTeachers', lang)}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Filter teachers"
              />
              {searchTerm && (
                <button type="button" className="toolbar-clear-btn" onClick={() => setSearchTerm('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('teacherName', lang)}</th>
                  <th>{t('qualification', lang)}</th>
                  <th>{t('subjectsTaught', lang)}</th>
                  <th>{t('assignedClassesLabel', lang)}</th>
                  <th>{t('assignedStudentsLabel', lang)}</th>
                  <th>Status</th>
                  <th>{t('salaryRate', lang)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((tch: Teacher) => (
                  <tr key={tch.id}>
                    <td>
                      <div className="table-student">
                        <span className={`student-avatar avatar-${tch.color} student-avatar-small`}>{tch.initials}</span>
                        <span>
                          <b>{tch.name}</b>
                          <small>{tch.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>{tch.qualification}</td>
                    <td>{(tch.subjects || []).join(', ')}</td>
                    <td>
                      {(tch.assignedClasses || []).length > 0 ? (
                        tch.assignedClasses.map(c => <span key={c} className="teacher-class-tag">{c}</span>)
                      ) : (
                        <span className="plain-status">No classes assigned</span>
                      )}
                    </td>
                    <td><b>{formatNum(tch.assignedStudentCount, lang)}</b> students</td>
                    <td>
                      <span className={tch.status === 'active' ? 'teacher-badge-active' : 'teacher-badge-inactive'}>
                        {tch.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-amount">{formatCurrency(tch.baseRate, lang)} / mo</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() => setSelectedTeacher(tch)}
                        >
                          {lang === 'ne' ? 'विवरण' : 'Profile'}
                        </button>
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          title={t('exportTeacherReport', lang)}
                          onClick={() => onOpenReport?.(tch, false)}
                        >
                          <FileDown size={14} /> {lang === 'ne' ? 'प्रतिवेदन' : 'Export'}
                        </button>
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() => setAssignModalTeacher(tch)}
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {filteredTeachers.length} of {teachers.length} teachers · Prototype demo data</span>
            <span className="no-gateway-note"><ShieldCheck size={14} /> {t('teacherSalaryNote', lang)}</span>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="panel fee-ledger-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('teacherLedger', lang)}</h2>
              <p>Center compensation payments to teaching faculty. Separate from student tuition fees.</p>
            </div>
            <button className="button button-primary" onClick={() => setPaymentModalTeacher(teachers[0])}>
              <Plus size={16} /> {t('recordTeacherPaymentBtn', lang)}
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TEACHER</th>
                  <th>PAYMENT PERIOD</th>
                  <th>AMOUNT DUE</th>
                  <th>AMOUNT PAID</th>
                  <th>REMAINING BALANCE</th>
                  <th>PAYMENT DATE</th>
                  <th>METHOD</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {teacherPayments.map((tp: TeacherPayment) => (
                  <tr key={tp.id}>
                    <td>
                      <b>{tp.teacherName}</b>
                      <small style={{ display: 'block', color: '#94a3b8' }}>{tp.id}</small>
                    </td>
                    <td>{tp.period}</td>
                    <td className="table-amount">{formatCurrency(tp.amountDue, lang)}</td>
                    <td className="table-amount" style={{ color: '#10b981' }}>{formatCurrency(tp.amountPaid, lang)}</td>
                    <td className="table-amount" style={{ color: tp.balance > 0 ? '#f59e0b' : '#10b981' }}>
                      {formatCurrency(tp.balance, lang)}
                    </td>
                    <td>{tp.date}</td>
                    <td>{tp.method}</td>
                    <td><StatusPill status={tp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{teacherPayments.length} teacher settlement records</span>
            <span className="no-gateway-note"><ShieldCheck size={14} /> Center ledger only</span>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t('classAssignments', lang)}</h2>
              <p>Active classes offered by Bright Path Tuition Center and their assigned faculty.</p>
            </div>
            <button className="button button-primary" onClick={() => setAssignModalTeacher(teachers[0])}>
              <Plus size={16} /> Assign a Class
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CLASS NAME</th>
                  <th>GRADE</th>
                  <th>SUBJECT</th>
                  <th>ASSIGNED TEACHER</th>
                  <th>ENROLLED STUDENTS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls: ClassItem) => {
                  const assignedTch = teachers.find((t: Teacher) => t.assignedClasses.includes(cls.name));
                  return (
                    <tr key={cls.id}>
                      <td><b>{cls.name}</b></td>
                      <td>{cls.grade}</td>
                      <td><span className="subject-tag">{cls.subject}</span></td>
                      <td>
                        {assignedTch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`student-avatar avatar-${assignedTch.color} student-avatar-small`}>
                              {assignedTch.initials}
                            </span>
                            <b>{assignedTch.name}</b>
                          </div>
                        ) : (
                          <span className="status-pill status-unmarked">Unassigned</span>
                        )}
                      </td>
                      <td><b>{cls.studentCount}</b> students</td>
                      <td>
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() => setAssignModalTeacher(assignedTch || teachers[0])}
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Profile Detail Modal */}
      {selectedTeacher && (
        <Modal
          title={`Teacher Profile · ${selectedTeacher.name}`}
          subtitle="Detailed faculty profile, subjects, assigned classes, and contact records."
          onClose={() => setSelectedTeacher(null)}
        >
          <div className="teacher-profile-card">
            <div className="teacher-profile-header">
              <span className={`user-avatar avatar-${selectedTeacher.color}`} style={{ width: 48, height: 48, fontSize: 16 }}>
                {selectedTeacher.initials}
              </span>
              <div>
                <h3>{selectedTeacher.name}</h3>
                <p>{selectedTeacher.qualification} · Status: <b style={{ color: selectedTeacher.status === 'active' ? '#10b981' : '#64748b' }}>{selectedTeacher.status.toUpperCase()}</b></p>
              </div>
            </div>

            <div className="profile-fields-grid" style={{ marginBottom: 18 }}>
              <div className="profile-field">
                <label>Contact Phone</label>
                <b>{selectedTeacher.phone}</b>
              </div>
              <div className="profile-field">
                <label>Email Address</label>
                <b>{selectedTeacher.email}</b>
              </div>
              <div className="profile-field">
                <label>Subjects Taught</label>
                <b>{selectedTeacher.subjects.join(', ')}</b>
              </div>
              <div className="profile-field">
                <label>Monthly Salary Agreement</label>
                <b>{formatCurrency(selectedTeacher.baseRate, lang)} / month</b>
              </div>
              <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                <label>Assigned Classes ({selectedTeacher.assignedClasses.length})</label>
                <div style={{ marginTop: 4 }}>
                  {selectedTeacher.assignedClasses.map(c => (
                    <span key={c} className="teacher-class-tag">{c}</span>
                  ))}
                  {selectedTeacher.assignedClasses.length === 0 && <span className="plain-status">None assigned</span>}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  const tch = selectedTeacher;
                  setSelectedTeacher(null);
                  onOpenReport?.(tch, false);
                }}
              >
                <FileDown size={16} /> {t('exportTeacherReport', lang)}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  const tch = selectedTeacher;
                  setSelectedTeacher(null);
                  setPaymentModalTeacher(tch);
                }}
              >
                Record Payment
              </button>
              <button type="button" className="button button-primary" onClick={() => setSelectedTeacher(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Class Modal */}
      {assignModalTeacher && (
        <Modal
          title="Assign Class to Teacher"
          subtitle={`Assign a center class to ${assignModalTeacher.name}.`}
          onClose={() => setAssignModalTeacher(null)}
        >
          <AssignClassForm
            teacher={assignModalTeacher}
            classes={classes}
            teachers={teachers}
            onCancel={() => setAssignModalTeacher(null)}
            onSave={(teacherId, className) => {
              assignClassToTeacher(teacherId, className);
              setAssignModalTeacher(null);
            }}
          />
        </Modal>
      )}

      {/* Record Teacher Payment Modal */}
      {paymentModalTeacher && (
        <Modal
          title="Record Teacher Payment"
          subtitle="Record a compensation payment from the center to a teacher. This does NOT alter student fee balances."
          onClose={() => setPaymentModalTeacher(null)}
        >
          <RecordTeacherPaymentForm
            teacher={paymentModalTeacher}
            teachers={teachers}
            lang={lang}
            onCancel={() => setPaymentModalTeacher(null)}
            onSave={(teacherId, period, amount, method, note) => {
              addTeacherPayment(teacherId, period, amount, method, note);
              setPaymentModalTeacher(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// Form: Assign Class
function AssignClassForm({
  teacher, classes, teachers, onSave, onCancel
}: {
  teacher: Teacher; classes: ClassItem[]; teachers: Teacher[];
  onSave: (teacherId: string, className: string) => void; onCancel: () => void;
}) {
  const [selectedTchId, setSelectedTchId] = useState(teacher.id);
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedTchId && selectedClass) {
      onSave(selectedTchId, selectedClass);
    }
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Teacher
        <select value={selectedTchId} onChange={e => setSelectedTchId(e.target.value)}>
          {teachers.map((t: Teacher) => (
            <option key={t.id} value={t.id}>{t.name} ({t.qualification})</option>
          ))}
        </select>
      </label>
      <label>Class to assign
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          {classes.map((c: ClassItem) => (
            <option key={c.id} value={c.name}>{c.name} · {c.subject} ({c.studentCount} students)</option>
          ))}
        </select>
      </label>
      <div className="modal-form-note">
        <ShieldCheck size={15} /> Prevents duplicate assignments and updates teacher student counts consistently.
      </div>
      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Assign Class <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

// Form: Record Teacher Payment
function RecordTeacherPaymentForm({
  teacher, teachers, lang, onSave, onCancel
}: {
  teacher: Teacher; teachers: Teacher[]; lang: Language;
  onSave: (teacherId: string, period: string, amount: number, method: string, note?: string) => void;
  onCancel: () => void;
}) {
  const [selectedTchId, setSelectedTchId] = useState(teacher.id);
  const [period, setPeriod] = useState('October 2026');
  const [amount, setAmount] = useState(String(teacher.baseRate));
  const [method, setMethod] = useState('Bank transfer');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const currentTeacher = teachers.find(t => t.id === selectedTchId) || teacher;

  const handleTeacherChange = (id: string) => {
    setSelectedTchId(id);
    const t = teachers.find(tch => tch.id === id);
    if (t) setAmount(String(t.baseRate));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    onSave(selectedTchId, period, amt, method, note);
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Teacher
        <select value={selectedTchId} onChange={e => handleTeacherChange(e.target.value)}>
          {teachers.map((t: Teacher) => (
            <option key={t.id} value={t.id}>{t.name} (Agreed: {formatCurrency(t.baseRate, lang)})</option>
          ))}
        </select>
      </label>

      <div className="form-two-col">
        <label>Payment period
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option>October 2026</option>
            <option>September 2026</option>
            <option>November 2026</option>
          </select>
        </label>
        <label>Amount to pay (Rs.)
          <input
            type="number"
            min="100"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <label>Payment method
        <select value={method} onChange={e => setMethod(e.target.value)}>
          <option>Bank transfer</option>
          <option>Cash</option>
          <option>Cheque</option>
          <option>Other</option>
        </select>
      </label>

      <label>Optional memo / note
        <input
          type="text"
          placeholder="e.g. October monthly settlement via corporate account"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </label>

      {error && <div className="form-error"><CircleAlert size={14} /> {error}</div>}

      <div className="modal-form-note">
        <ShieldCheck size={15} />
        <b>Rule:</b> This updates the center teacher payment ledger only. Student tuition fee balances are not changed.
      </div>

      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Record Teacher Payment <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

// ─── TEACHER REPORT EXPORT & PREVIEW MODAL ──────────────────────────
function TeacherReportModal({
  teacher,
  teachers,
  allStudents,
  teacherPayments,
  isInitialSample = false,
  onClose,
  notify,
  lang,
}: {
  teacher: Teacher | null;
  teachers: Teacher[];
  allStudents: Student[];
  teacherPayments: TeacherPayment[];
  isInitialSample?: boolean;
  onClose: () => void;
  notify: (msg: string) => void;
  lang: Language;
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teacher ? teacher.id : (teachers[0]?.id || '')
  );
  const [isSample, setIsSample] = useState<boolean>(isInitialSample);

  // Get active teacher from list
  const currentTeacher = useMemo(() => {
    return teachers.find(tch => tch.id === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  // Compile report data
  const reportData: TeacherReportData = useMemo(() => {
    if (isSample || !currentTeacher) {
      return getSampleTeacherReportData();
    }
    return compileTeacherReportData(currentTeacher, allStudents, teacherPayments);
  }, [isSample, currentTeacher, allStudents, teacherPayments]);

  const handleDownloadPdf = () => {
    const success = downloadTeacherReportPdf(reportData, lang);
    if (success) {
      notify(lang === 'ne' ? 'PDF प्रतिवेदन सफलतापूर्वक डाउनलोड गरियो।' : `Report for ${reportData.teacher.name} downloaded as PDF.`);
    } else {
      notify(lang === 'ne' ? 'PDF निकाल्न समस्या भयो।' : 'Failed to generate PDF report.');
    }
  };

  const handleDownloadCsv = () => {
    const success = downloadTeacherReportCsv(reportData);
    if (success) {
      notify(lang === 'ne' ? 'CSV प्रतिवेदन सफलतापूर्वक डाउनलोड गरियो।' : `Report for ${reportData.teacher.name} downloaded as CSV.`);
    } else {
      notify(lang === 'ne' ? 'CSV निकाल्न समस्या भयो।' : 'Failed to generate CSV report.');
    }
  };

  const studentsList = reportData.assignedStudents || [];
  const presentCount = studentsList.filter(st => st.attendance === 'present').length;
  const absentCount = studentsList.filter(st => st.attendance === 'absent').length;
  const unmarkedCount = studentsList.filter(st => st.attendance === 'unmarked').length;
  const totalMarked = presentCount + absentCount;
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  const due = reportData.payment ? reportData.payment.amountDue : (reportData.teacher.baseRate || 0);
  const paid = reportData.payment ? reportData.payment.amountPaid : 0;
  const balance = reportData.payment ? reportData.payment.balance : (reportData.payment ? 0 : (reportData.teacher.baseRate || 0));
  const status = reportData.payment ? reportData.payment.status : 'pending';
  const method = reportData.payment ? reportData.payment.method : 'Bank transfer';

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card report-modal-card" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="report-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} style={{ color: '#3b63e8' }} />
              {t('exportTeacherReport', lang)}
            </h2>
            <p>{lang === 'ne' ? 'शिक्षकको प्राज्ञिक जिम्मेवारी, उपस्थिति तथा पारिश्रमिक प्रतिवेदन' : 'Academic assignments, attendance summary, and compensation record.'}</p>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="report-modal-body">
          {/* Controls Bar: Teacher Selector & Sample Toggle */}
          <div className="report-selector-bar">
            <div className="report-selector-left">
              <label htmlFor="report-teacher-select" style={{ fontSize: 13, fontWeight: 700, color: 'inherit' }}>
                {t('selectTeacher', lang)}:
              </label>
              <select
                id="report-teacher-select"
                value={isSample ? 'SAMPLE' : selectedTeacherId}
                disabled={isSample}
                onChange={e => {
                  setSelectedTeacherId(e.target.value);
                  setIsSample(false);
                }}
              >
                {teachers.map(tch => (
                  <option key={tch.id} value={tch.id}>
                    {tch.name} ({tch.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={`sample-toggle-btn ${isSample ? 'active' : ''}`}
              onClick={() => setIsSample(prev => !prev)}
              title={isSample ? 'Switch back to official records' : 'Preview with clearly marked sample data'}
            >
              <Sparkles size={15} />
              {isSample
                ? (lang === 'ne' ? 'वास्तविक विवरण हेर्नुहोस्' : 'View Real Record')
                : t('previewSampleReport', lang)}
            </button>
          </div>

          {/* Visual Report Sheet Preview */}
          <div className="report-sheet">
            <div className="report-sheet-header">
              <div className="report-sheet-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3>TuitionTrack</h3>
                  {reportData.isSample ? (
                    <span className="report-badge-sample">
                      <Sparkles size={12} /> SAMPLE DEMO PREVIEW
                    </span>
                  ) : (
                    <span className="report-badge-official">
                      <CheckCircle2 size={12} /> OFFICIAL FACULTY REPORT
                    </span>
                  )}
                </div>
                <p>Bright Path Tuition Center · Kathmandu, Nepal · {lang === 'ne' ? 'उत्पन्न मिति:' : 'Generated:'} {reportData.generationDate}</p>
              </div>
            </div>

            {reportData.isSample && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16
              }}>
                ℹ️ {lang === 'ne'
                  ? 'सूचना: यो नमूना पूर्वावलोकन हो। यसमा देखाइएका सबै विवरणहरू केवल प्रदर्शनका लागि हुन् र वास्तविक विवरण परिवर्तन हुँदैन।'
                  : 'Notice: This preview displays simulated prototype sample data. It is completely isolated and does not alter real faculty records.'}
              </div>
            )}

            {/* Section 1: Teacher Profile Details Box */}
            <div className="report-section-box">
              <h4>{lang === 'ne' ? '१. शिक्षक प्रोफाइल विवरण' : '1. Faculty Profile Details'}</h4>
              <div className="report-grid-two">
                <div className="report-data-item">
                  <small>{t('teacherName', lang)}</small>
                  <b>{reportData.teacher.name}</b>
                </div>
                <div className="report-data-item">
                  <small>Staff ID</small>
                  <b>{reportData.teacher.id}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('qualification', lang)}</small>
                  <b>{reportData.teacher.qualification || 'N/A'}</b>
                </div>
                <div className="report-data-item">
                  <small>Status</small>
                  <b style={{ color: reportData.teacher.status === 'active' ? '#10b981' : '#64748b' }}>
                    {reportData.teacher.status.toUpperCase()}
                  </b>
                </div>
                <div className="report-data-item">
                  <small>{t('contactPhone', lang)}</small>
                  <b>{reportData.teacher.phone || 'N/A'}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('emailAddress', lang)}</small>
                  <b>{reportData.teacher.email || 'N/A'}</b>
                </div>
              </div>
            </div>

            {/* Section 2: Teaching & Class Assignments */}
            <div className="report-section-box">
              <h4>{lang === 'ne' ? '२. अध्यापन तथा कक्षा जिम्मेवारी' : '2. Teaching & Class Assignments'}</h4>
              <div className="report-grid-two">
                <div className="report-data-item">
                  <small>{t('subjectsTaught', lang)}</small>
                  <b>{(reportData.teacher.subjects || []).join(', ') || 'General'}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('assignedClassesLabel', lang)}</small>
                  <b>{(reportData.teacher.assignedClasses || []).join(', ') || 'No classes currently assigned'}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('assignedStudentsLabel', lang)}</small>
                  <b>{formatNum(reportData.teacher.assignedStudentCount || 0, lang)} {lang === 'ne' ? 'विद्यार्थीहरू' : 'assigned students'}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('salaryRate', lang)}</small>
                  <b>{formatCurrency(reportData.teacher.baseRate || 0, lang)} / {reportData.teacher.salaryType || 'month'}</b>
                </div>
              </div>
            </div>

            {/* Section 3: Attendance Summary */}
            <div className="report-section-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <h4 style={{ margin: 0 }}>{lang === 'ne' ? '३. विद्यार्थी नामावली र उपस्थिति' : '3. Student Roster & Attendance Summary'}</h4>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b63e8' }}>
                  {lang === 'ne' ? 'उपस्थिति दर:' : 'Attendance Rate:'} {formatNum(attendanceRate, lang)}%
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
                {formatNum(presentCount, lang)} {lang === 'ne' ? 'उपस्थित' : 'Present'} · {formatNum(absentCount, lang)} {lang === 'ne' ? 'अनुपस्थित' : 'Absent'} · {formatNum(unmarkedCount, lang)} {lang === 'ne' ? 'उपस्थिति बाँकी' : 'Unmarked'}
              </p>

              {studentsList.length > 0 ? (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <table className="report-table-mini">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Grade</th>
                        <th>Roll</th>
                        <th>Today's Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.map(st => (
                        <tr key={st.id}>
                          <td><code>{st.id}</code></td>
                          <td><b>{st.name}</b></td>
                          <td>{st.grade}</td>
                          <td>{st.rollNumber}</td>
                          <td>
                            <span className={`status-pill status-${st.attendance}`}>
                              {st.attendance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: '4px 0' }}>
                  {lang === 'ne' ? 'यस शिक्षकसँग प्रत्यक्ष जोडिएको कुनै विद्यार्थी रेकर्ड छैन।' : 'No individual student roster entries mapped to this faculty ID.'}
                </p>
              )}
            </div>

            {/* Section 4: Teacher Payment Summary */}
            <div className="report-section-box" style={{ marginBottom: 0 }}>
              <h4>{lang === 'ne' ? '४. शिक्षक पारिश्रमिक तथा भुक्तानी सारांश' : '4. Compensation & Settlement Summary'}</h4>
              <div className="report-grid-two">
                <div className="report-data-item">
                  <small>{t('amountDue', lang)}</small>
                  <b>{formatCurrency(due, lang)}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('amountPaid', lang)}</small>
                  <b style={{ color: '#10b981' }}>{formatCurrency(paid, lang)}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('remainingBalance', lang)}</small>
                  <b style={{ color: balance > 0 ? '#f59e0b' : '#10b981' }}>{formatCurrency(balance, lang)}</b>
                </div>
                <div className="report-data-item">
                  <small>{t('paymentMethod', lang)}</small>
                  <b>{method}</b>
                </div>
                <div className="report-data-item">
                  <small>Payment Status</small>
                  <b><span className={`status-pill status-${status}`}>{status.toUpperCase()}</span></b>
                </div>
                <div className="report-data-item">
                  <small>Settlement Period</small>
                  <b>{reportData.payment ? reportData.payment.period : 'October 2026 (Active)'}</b>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {t('teacherSalaryNote', lang)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="report-modal-footer">
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {lang === 'ne'
              ? 'PDF वा CSV ढाँचामा पूर्ण विवरण डाउनलोड गर्नुहोस्।'
              : 'Export complete faculty report as formatted PDF or data CSV.'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleDownloadCsv}
              title={t('downloadCsv', lang)}
            >
              <FileSpreadsheet size={16} /> {t('downloadCsv', lang)}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={handleDownloadPdf}
              title={t('downloadPdf', lang)}
            >
              <Download size={16} /> {t('downloadPdf', lang)}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              {t('cancel', lang)}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── TASK 3 & 4: SETTINGS PAGE (Language & Appearance) ──────────────
function SettingsPage({ lang, setLanguage, theme, setThemeMode, role, notify }: any) {
  const roleName = role === 'center'
    ? 'Bright Path Tuition Center'
    : role === 'parent'
    ? 'Mina Thapa (Parent)'
    : 'Dibash Lamichhane (Tutor)';

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="PREFERENCES & LOCALIZATION"
        title={t('settingsTitle', lang)}
        description={t('settingsDesc', lang)}
      />

      <div className="settings-grid">
        <div className="settings-main-col">
          {/* TASK 3: LANGUAGE SETTINGS */}
          <div className="panel settings-block">
            <h3>{t('languageSetting', lang)}</h3>
            <p>{t('languageDesc', lang)}</p>
            <div className="setting-options-row">
              <button
                type="button"
                className={`setting-card-option ${lang === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                  notify('Language switched to English.');
                }}
              >
                <Globe size={22} color="#3b63e8" />
                <div>
                  <b>English</b>
                  <small>Standard English UI</small>
                </div>
              </button>

              <button
                type="button"
                className={`setting-card-option ${lang === 'ne' ? 'active' : ''}`}
                onClick={() => {
                  setLanguage('ne');
                  notify('भाषा नेपालीमा परिवर्तन गरियो।');
                }}
              >
                <Globe size={22} color="#059669" />
                <div>
                  <b>नेपाली (Nepali)</b>
                  <small>सम्पूर्ण नेपाली इन्टरफेस</small>
                </div>
              </button>
            </div>
          </div>

          {/* TASK 4: DARK MODE & LIGHT MODE APPEARANCE */}
          <div className="panel settings-block">
            <h3>{t('appearanceSetting', lang)}</h3>
            <p>{t('appearanceDesc', lang)}</p>
            <div className="setting-options-row">
              <button
                type="button"
                className={`setting-card-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setThemeMode('light');
                  notify('Light mode enabled.');
                }}
              >
                <Sun size={22} color="#d97706" />
                <div>
                  <b>{t('lightMode', lang)}</b>
                  <small>Clean daylight palette</small>
                </div>
              </button>

              <button
                type="button"
                className={`setting-card-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setThemeMode('dark');
                  notify('Dark mode enabled.');
                }}
              >
                <Moon size={22} color="#818cf8" />
                <div>
                  <b>{t('darkMode', lang)}</b>
                  <small>High contrast dark theme</small>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-side-col">
          <div className="panel settings-block">
            <h3>{t('currentRoleLabel', lang)}</h3>
            <p>Active workspace identity details.</p>
            <div className="profile-field" style={{ marginBottom: 12 }}>
              <label>Current Role</label>
              <b>{roleLabel(role, lang)}</b>
            </div>
            <div className="profile-field" style={{ marginBottom: 12 }}>
              <label>Identity</label>
              <b>{roleName}</b>
            </div>
            <div className="profile-field">
              <label>Active Region</label>
              <b>Nepal (NPR currency, BS/AD support)</b>
            </div>
            <div className="info-note" style={{ marginTop: 16 }}>
              <ShieldCheck size={16} />
              <span>Settings persist across page reloads and navigation sessions.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Students Directory Page ─────────────────────────────────────────
function StudentsPage({ role, students, searchTerm, onSearchChange, addStudent, notify, lang }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const handleSearch = onSearchChange || (() => {});
  const filtered = students.filter((s: Student) => matchesStudent(s, searchTerm));

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow={role === 'parent' ? 'PARENT VIEW' : 'STUDENT DIRECTORY'}
        title={role === 'parent' ? t('myChild', lang) : t('students', lang)}
        description={role === 'parent' ? 'A quick view of the student linked to your account.' : 'Keep student details organised in one place.'}
        action={role !== 'parent' && (
          <button className="button button-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> {t('addStudent', lang)}
          </button>
        )}
      />
      <div className="student-list-panel panel">
        <div className="list-toolbar">
          <div>
            <b>{formatNum(filtered.length, lang)} {lang === 'ne' ? 'विद्यार्थीहरू' : 'students'}</b>
            <span>·</span>
            <span>Grades 8–10</span>
          </div>
          <div className="toolbar-search-wrap">
            <Search size={16} />
            <input
              type="text"
              className="toolbar-search-input"
              placeholder="Search student name, ID, roll (e.g. Aarav)..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              aria-label="Filter students list"
            />
            {searchTerm && (
              <button
                type="button"
                className="toolbar-clear-btn"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>GRADE</th>
                <th>ROLL NO.</th>
                <th>ATTENDANCE</th>
                <th>MONTHLY FEE</th>
                <th>FEE STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: Student) => (
                <tr key={s.id}>
                  <td>
                    <div className="table-student">
                      <StudentAvatar student={s} small />
                      <span>
                        <b>{s.name}</b>
                        <small>{s.id}</small>
                      </span>
                    </div>
                  </td>
                  <td>{s.grade}</td>
                  <td>{formatNum(s.rollNumber, lang)}</td>
                  <td><StatusPill status={s.attendance} /></td>
                  <td className="table-amount">{formatCurrency(s.fee, lang)}</td>
                  <td>
                    {s.confirmedPaid >= s.fee ? (
                      <StatusPill status="confirmed" />
                    ) : (
                      <span className="plain-status">{s.confirmedPaid > 0 ? 'Partially paid' : 'Outstanding'}</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-button row-more"
                      aria-label={`More options for ${s.name}`}
                      onClick={() => notify(`${s.name}'s profile is available in the demo.`)}
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={24} />
              <b>No students found matching "{searchTerm}"</b>
              <span>Try another search term or click below to reset.</span>
              <button type="button" className="button button-small button-secondary" style={{ marginTop: 10 }} onClick={() => handleSearch('')}>
                Reset search
              </button>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>Showing {filtered.length} of {students.length} demo students</span>
          <div>
            <button className="pagination-button" disabled><ChevronLeft size={15} /></button>
            <button className="pagination-button current-page">1</button>
            <button className="pagination-button" disabled><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>
      {modalOpen && (
        <Modal title="Add a student" subtitle="This adds fictional demo data to the current session." onClose={() => setModalOpen(false)}>
          <AddStudentForm onCancel={() => setModalOpen(false)} onSave={(name, grade, fee) => { addStudent(name, grade, fee); setModalOpen(false); }} />
        </Modal>
      )}
    </div>
  );
}

// ─── Attendance Register Page ───────────────────────────────────────
function AttendancePage({ role, students, onAttendance, notify, saveAttendance, lang }: any) {
  const [date, setDate] = useState('2026-10-20');
  const [grade, setGrade] = useState('All grades');
  const [saved, setSaved] = useState(false);
  const shown: Student[] = students.filter((s: Student) => grade === 'All grades' || s.grade === grade);

  const markAll = () => {
    shown.forEach(s => onAttendance(s.id, 'present'));
    setSaved(false);
  };
  const save = () => {
    setSaved(true);
    saveAttendance(shown);
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="ATTENDANCE REGISTER"
        title={role === 'parent' ? 'Attendance history' : t('attendance', lang)}
        description={role === 'parent' ? "See the recorded attendance for your child's tuition sessions." : 'Mark a class quickly, review the record, and save when everything looks right.'}
        action={role !== 'parent' && (
          <button className="button button-primary" onClick={save}>
            <Check size={16} /> {t('saveAttendance', lang)}
          </button>
        )}
      />
      {role === 'parent' && (
        <div className="dashboard-banner slim-banner">
          <div className="banner-icon"><ShieldCheck size={18} /></div>
          <div className="banner-copy">
            <b>Records shared by the tutor</b>
            <span>Attendance is visible after the tutor saves the register. Absences trigger timely alerts.</span>
          </div>
        </div>
      )}
      <div className="register-controls panel">
        <div className="control-group">
          <label htmlFor="attendance-date">CLASS DATE</label>
          <div className="control-input">
            <Calendar size={16} />
            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setSaved(false); }}
              disabled={role === 'parent'}
            />
          </div>
        </div>
        <div className="control-group">
          <label htmlFor="attendance-grade">CLASS / GRADE</label>
          <div className="control-input">
            <BookOpen size={16} />
            <select id="attendance-grade" value={grade} onChange={e => setGrade(e.target.value)}>
              <option>All grades</option>
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
            </select>
            <ChevronDown size={13} />
          </div>
        </div>
        <div className="register-count">
          <span className="count-circle">{formatNum(shown.filter(s => s.attendance !== 'unmarked').length, lang)}</span>
          <span><b>of {formatNum(shown.length, lang)} marked</b><small>Students in this view</small></span>
        </div>
        {role !== 'parent' && (
          <button className="button button-secondary mark-all-button" onClick={markAll}>
            <CheckCheck size={16} /> {t('markAllPresent', lang)}
          </button>
        )}
      </div>
      <div className="panel attendance-register-panel">
        <div className="register-header">
          <div>
            <h2>Student register</h2>
            <p>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="register-legend">
            <span><i className="legend-teal" />Present</span>
            <span><i className="legend-orange" />Absent</span>
          </div>
        </div>
        <div className="attendance-student-list">
          {shown.map(s => (
            <div className="attendance-row" key={s.id}>
              <StudentAvatar student={s} />
              <span className="attendance-student-meta">
                <b>{s.name}</b>
                <small>{s.grade} · {s.id}</small>
              </span>
              {role === 'parent' ? (
                <StatusPill status={s.attendance} />
              ) : (
                <div className="attendance-choice">
                  <button
                    className={s.attendance === 'present' ? 'choice-selected choice-present' : ''}
                    onClick={() => { onAttendance(s.id, 'present'); setSaved(false); }}
                  >
                    <Check size={14} /> Present
                  </button>
                  <button
                    className={s.attendance === 'absent' ? 'choice-selected choice-absent' : ''}
                    onClick={() => { onAttendance(s.id, 'absent'); setSaved(false); }}
                  >
                    <X size={14} /> Absent
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="register-footer">
          <span>{saved ? <><CheckCircle2 size={15} /> Saved · {shown.filter(s => s.attendance === 'absent').length} absence(s) noted</> : 'Changes are not saved until you confirm.'}</span>
          {role !== 'parent' && (
            <button className="button button-primary" onClick={save}>
              <Check size={16} /> {t('confirmAndSave', lang)}
            </button>
          )}
        </div>
      </div>
      <div className="info-note">
        <CircleAlert size={16} />
        <span>Demo behaviour: attendance changes are held in this browser session. Parent notifications are shown as simulated product states.</span>
      </div>
    </div>
  );
}

// ─── Student Fee Records Page ───────────────────────────────────────
function FeesPage({ role, students, payments, addPayment, updatePaymentStatus, notify, lang }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const pending = payments.filter((p: Payment) => p.status === 'pending');
  const confirmed = payments.filter((p: Payment) => p.status === 'confirmed');
  const disputed = payments.filter((p: Payment) => p.status === 'disputed');
  const filteredPayments = payments.filter((p: Payment) => filter === 'all' || p.status === filter);

  // Strict Balance Rule: Only confirmed payments reduce outstanding balance!
  const dueTotal = students.reduce((sum: number, s: Student) => sum + Math.max(0, s.fee - s.confirmedPaid), 0);

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="FEE MANAGEMENT"
        title={role === 'parent' ? 'Fee records & confirmations' : t('fees', lang)}
        description={role === 'parent' ? 'Review payments recorded by the tutor. Confirm the details or report a disagreement.' : 'Monthly fee records, partial payments and clear confirmation status — without processing money.'}
        action={role !== 'parent' && (
          <button className="button button-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> {t('recordPayment', lang)}
          </button>
        )}
      />

      <div className="stat-grid fee-stat-grid">
        <AnimatedStatCard
          label={role === 'parent' ? 'Current month due' : 'Confirmed outstanding'}
          value={dueTotal}
          detail="Based strictly on parent-confirmed payments"
          icon={Wallet}
          tone="stat-orange"
          prefix="Rs. "
          delay={0}
          lang={lang}
        />
        <AnimatedStatCard
          label={t('pending', lang)}
          value={pending.length}
          detail={formatCurrency(pending.reduce((sum: number, p: Payment) => sum + p.amount, 0), lang) + ' recorded'}
          icon={Clock3}
          tone="stat-blue"
          delay={80}
          lang={lang}
        />
        <AnimatedStatCard
          label={t('confirmed', lang)}
          value={confirmed.length}
          detail="Confirmation acknowledged"
          icon={CheckCheck}
          tone="stat-teal"
          delay={160}
          lang={lang}
        />
        <AnimatedStatCard
          label={t('disputed', lang)}
          value={disputed.length}
          detail="Needs follow-up review"
          icon={CircleAlert}
          tone="stat-purple"
          delay={240}
          lang={lang}
        />
      </div>

      {role === 'parent' && pending.length > 0 && (
        <section className="confirmation-callout">
          <div className="confirmation-callout-icon"><ShieldCheck size={20} /></div>
          <div className="confirmation-callout-copy">
            <b>{pending.length} payment{pending.length > 1 ? 's' : ''} waiting for your confirmation</b>
            <span>Check the amount, date and month carefully. Awaiting payments do NOT reduce your balance until confirmed.</span>
          </div>
          <span className="pending-total">{formatCurrency(pending.reduce((sum: number, p: Payment) => sum + p.amount, 0), lang)}</span>
        </section>
      )}

      <div className="panel fee-ledger-panel">
        <div className="panel-heading fee-ledger-heading">
          <div>
            <h2>{role === 'parent' ? 'Payment confirmation inbox' : 'Payment activity'}</h2>
            <p>Each payment has its own reference and response status.</p>
          </div>
          <div className="filter-pills">
            {[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'disputed', label: 'Disputed' }].map(o => (
              <button
                key={o.value}
                className={filter === o.value ? 'filter-active' : ''}
                onClick={() => setFilter(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table fee-data-table">
            <thead>
              <tr>
                <th>PAYMENT</th>
                <th>MONTH COVERED</th>
                <th>DATE RECORDED</th>
                <th>METHOD</th>
                <th>AMOUNT</th>
                <th>STATUS / ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p: Payment) => (
                <tr key={p.id}>
                  <td>
                    <div className="payment-id-cell">
                      <span className="payment-receipt-icon"><CreditCard size={16} /></span>
                      <span><b>{p.student}</b><small>{p.id}</small></span>
                    </div>
                  </td>
                  <td>{p.month}</td>
                  <td>{p.date}</td>
                  <td>{p.method}</td>
                  <td className="table-amount">{formatCurrency(p.amount, lang)}</td>
                  <td>
                    <div className="payment-action-cell">
                      {role === 'parent' && p.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="button button-small button-confirm"
                            onClick={() => updatePaymentStatus(p.id, 'confirmed')}
                          >
                            <Check size={13} /> {t('confirm', lang)}
                          </button>
                          <button
                            type="button"
                            className="button button-small button-dispute"
                            onClick={() => updatePaymentStatus(p.id, 'disputed')}
                          >
                            {t('dispute', lang)}
                          </button>
                        </>
                      ) : (
                        <StatusPill status={p.status} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="empty-state">
              <Wallet size={22} />
              <b>No records in this category</b>
              <span>Choose another status filter.</span>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>{filteredPayments.length} payment records · Demo data</span>
          <span className="no-gateway-note"><ShieldCheck size={14} /> No money is processed in TuitionTrack</span>
        </div>
      </div>

      {modalOpen && (
        <Modal title="Record a payment" subtitle="This records money received outside the app. No payment will be processed." onClose={() => setModalOpen(false)}>
          <RecordPaymentForm students={students} onCancel={() => setModalOpen(false)} onSave={(student, amount, month, method) => { addPayment(student, amount, month, method); setModalOpen(false); }} />
        </Modal>
      )}
    </div>
  );
}

// ─── Tests & Marks Page ─────────────────────────────────────────────
function TestsPage({ role, tests, testResults, addTest, publishResults, notify, allStudents, students, lang }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [markTest, setMarkTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'results'>('upcoming');

  const upcoming = tests.filter((t: Test) => t.status === 'scheduled');
  const results = tests.filter((t: Test) => t.status !== 'scheduled');

  const getTestResults = (testId: string): TestResult[] => {
    return (testResults as TestResult[]).filter(r => r.testId === testId);
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="LEARNING PROGRESS"
        title={role === 'parent' ? 'Tests & results' : t('tests', lang)}
        description={role === 'parent' ? 'See upcoming tests and results published by the tutor.' : 'Schedule tests, keep parents informed, and record marks in one place.'}
        action={role !== 'parent' && (
          <button className="button button-primary" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> {t('scheduleTest', lang)}
          </button>
        )}
      />

      <div className="test-page-summary">
        <div className="test-summary-main">
          <span className="test-summary-icon"><ClipboardCheck size={22} /></span>
          <div>
            <span>UP NEXT</span>
            <h2>{upcoming[0]?.title || 'No tests scheduled'}</h2>
            <p>{upcoming[0] ? `${upcoming[0].date} · ${upcoming[0].grade} · ${upcoming[0].subject}` : 'Schedule the next test to get started.'}</p>
          </div>
        </div>
        <div className="test-summary-reminder">
          <Bell size={16} />
          <span>Parent reminders are ready for scheduled tests</span>
        </div>
      </div>

      <div className="panel test-records-panel">
        <div className="panel-heading">
          <div>
            <h2>Test calendar & results</h2>
            <p>One place for upcoming assessments and published marks.</p>
          </div>
          <div className="filter-pills">
            <button className={activeTab === 'upcoming' ? 'filter-active' : ''} onClick={() => setActiveTab('upcoming')}>
              Upcoming ({upcoming.length})
            </button>
            <button className={activeTab === 'results' ? 'filter-active' : ''} onClick={() => setActiveTab('results')}>
              Results ({results.length})
            </button>
          </div>
        </div>

        <div className="test-cards-list">
          {(activeTab === 'upcoming' ? upcoming : results).map((testItem: Test, i: number) => {
            const tResults = getTestResults(testItem.id);
            const avgMarks = tResults.length > 0 ? Math.round(tResults.reduce((s, r) => s + r.obtained, 0) / tResults.length) : null;
            return (
              <div className="test-record-card" key={testItem.id}>
                <div className={`test-date-tile test-date-large tile-${i}`}>
                  <small>{testItem.date.split(' ')[0].slice(0, 3).toUpperCase()}</small>
                  <b>{testItem.date.match(/\d+/)?.[0] || '26'}</b>
                </div>
                <div className="test-record-meta">
                  <div className="test-record-tags">
                    <span className="subject-tag">{testItem.subject}</span>
                    <StatusPill status={testItem.status} />
                  </div>
                  <h3>{testItem.title}</h3>
                  <p>{testItem.grade} <span>·</span> {testItem.date}</p>
                  {testItem.status === 'published' && tResults.length > 0 && (
                    <div className="test-score-progress">
                      <span>{tResults.length} result{tResults.length > 1 ? 's' : ''}</span>
                      <div className="fee-progress">
                        <span style={{ width: `${((avgMarks || 0) / testItem.fullMarks) * 100}%` }} />
                      </div>
                      <b>{avgMarks}/{testItem.fullMarks}</b>
                    </div>
                  )}
                </div>
                <div className="test-record-actions">
                  {role !== 'parent' && (testItem.status === 'scheduled' || testItem.status === 'published') ? (
                    <button className="button button-small button-secondary" onClick={() => setMarkTest(testItem)}>
                      {testItem.status === 'published' ? 'Add more results' : t('enterMarks', lang)}
                    </button>
                  ) : testItem.status === 'published' ? (
                    <button className="button button-small button-secondary" onClick={() => notify('Viewing published demo result.')}>
                      View result <ArrowRight size={13} />
                    </button>
                  ) : (
                    <span className="notify-badge"><Bell size={13} /> Parent notified</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Schedule a test" subtitle="Add a test to the demo calendar. Parent notifications are simulated." onClose={() => setModalOpen(false)}>
          <AddTestForm onCancel={() => setModalOpen(false)} onSave={(title, subject, date, grade) => { addTest(title, subject, date, grade); setModalOpen(false); }} />
        </Modal>
      )}

      {markTest && (
        <Modal title="Enter test results" subtitle={`Publish individual student marks for ${markTest.title}.`} onClose={() => setMarkTest(null)}>
          <EnterMarksForm
            test={markTest}
            students={(allStudents || students) as Student[]}
            existingResults={(testResults as TestResult[]).filter(r => r.testId === markTest.id)}
            onCancel={() => setMarkTest(null)}
            onSave={(newResults) => {
              publishResults(markTest.id, newResults);
              setMarkTest(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// Form: Enter Marks with Live Full-Marks Validation
function EnterMarksForm({
  test, students, existingResults, onSave, onCancel
}: {
  test: Test; students: Student[]; existingResults: TestResult[];
  onSave: (results: TestResult[]) => void; onCancel: () => void;
}) {
  const [fullMarks, setFullMarks] = useState(String(test.fullMarks || 20));
  const [rows, setRows] = useState<{ studentId: string; obtained: string }[]>([{ studentId: '', obtained: '' }]);
  const [searchTerms, setSearchTerms] = useState<string[]>(['']);
  const [submitError, setSubmitError] = useState('');

  const eligibleStudents = students.filter(s => s.grade === test.grade);
  const usedStudentIds = new Set([
    ...existingResults.map(r => r.studentId),
    ...rows.map(r => r.studentId).filter(Boolean),
  ]);

  const fmNum = Number(fullMarks);

  const validateMarks = (valStr: string): string => {
    if (valStr.trim() === '') return '';
    const num = Number(valStr);
    if (isNaN(num)) return 'Please enter a valid number.';
    if (num < 0) return 'Marks cannot be negative.';
    if (!isNaN(fmNum) && fmNum > 0 && num > fmNum) {
      return `Marks cannot exceed the full marks of ${fmNum}.`;
    }
    return '';
  };

  const addRow = () => {
    setRows(r => [...r, { studentId: '', obtained: '' }]);
    setSearchTerms(s => [...s, '']);
  };

  const removeRow = (idx: number) => {
    setRows(r => r.filter((_, i) => i !== idx));
    setSearchTerms(s => s.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: 'studentId' | 'obtained', value: string) => {
    setSubmitError('');
    setRows(r => r.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const updateSearch = (idx: number, value: string) => {
    setSearchTerms(s => s.map((v, i) => i === idx ? value : v));
  };

  const rowErrors = rows.map(r => validateMarks(r.obtained));
  const hasRowErrors = rowErrors.some(err => err !== '');
  const hasIncompleteRows = rows.some(r => !r.studentId || r.obtained.trim() === '');
  const isFmValid = !isNaN(fmNum) && fmNum > 0;
  const canPublish = isFmValid && !hasIncompleteRows && !hasRowErrors && rows.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!isFmValid) {
      setSubmitError('Full marks must be greater than 0.');
      return;
    }
    const validRows = rows.filter(r => r.studentId && r.obtained.trim() !== '');
    if (validRows.length === 0) {
      setSubmitError('Add at least one student with marks.');
      return;
    }
    const ids = validRows.map(r => r.studentId);
    if (new Set(ids).size !== ids.length) {
      setSubmitError('Duplicate students detected. Each student can appear once.');
      return;
    }
    for (const r of validRows) {
      const err = validateMarks(r.obtained);
      if (err) {
        const s = students.find(st => st.id === r.studentId);
        setSubmitError(`${s?.name || 'Student'}: ${err}`);
        return;
      }
    }

    const newResults: TestResult[] = validRows.map(r => ({
      id: `R-${Date.now()}-${r.studentId}`,
      testId: test.id,
      studentId: r.studentId,
      obtained: Number(r.obtained),
      fullMarks: fmNum,
    }));

    onSave(newResults);
  };

  return (
    <form className="modal-form result-entry-form" onSubmit={submit}>
      <div className="modal-form-note">
        <ClipboardCheck size={15} /> {test.title} · {test.grade} · {test.subject} · {test.date}
      </div>

      <label>Full marks (applies to all students)
        <input
          type="number"
          min="1"
          value={fullMarks}
          onChange={e => {
            setFullMarks(e.target.value);
            setSubmitError('');
          }}
          required
        />
      </label>

      {existingResults.length > 0 && (
        <div className="existing-results-note">
          <CheckCircle2 size={14} /> {existingResults.length} result{existingResults.length > 1 ? 's' : ''} already published for this test.
        </div>
      )}

      <div className="result-rows-header">
        <b>Student results</b>
        <small>Select students and enter their marks</small>
      </div>

      {rows.map((row, idx) => {
        const selectedStudent = students.find(s => s.id === row.studentId);
        const term = searchTerms[idx] || '';
        const filteredOptions = eligibleStudents.filter(s =>
          !usedStudentIds.has(s.id) || s.id === row.studentId
        ).filter(s =>
          term === '' || s.name.toLowerCase().includes(term.toLowerCase()) || s.rollNumber.includes(term)
        );
        const rowError = rowErrors[idx];

        return (
          <div className="result-row" key={idx}>
            <div className="result-row-number">{idx + 1}</div>
            <div className="result-row-fields">
              <div className="result-student-select">
                <label>Student
                  <div className="student-search-wrap">
                    <input
                      type="text"
                      placeholder="Search by name or roll no."
                      value={selectedStudent ? selectedStudent.name : term}
                      onChange={e => {
                        updateSearch(idx, e.target.value);
                        if (row.studentId) updateRow(idx, 'studentId', '');
                      }}
                      onFocus={() => {
                        if (selectedStudent) {
                          updateSearch(idx, '');
                          updateRow(idx, 'studentId', '');
                        }
                      }}
                    />
                    {(!row.studentId && (term || document.activeElement?.closest('.student-search-wrap'))) && filteredOptions.length > 0 && (
                      <div className="student-dropdown">
                        {filteredOptions.map(s => (
                          <button
                            type="button"
                            key={s.id}
                            className="student-dropdown-item"
                            onClick={() => {
                              updateRow(idx, 'studentId', s.id);
                              updateSearch(idx, s.name);
                            }}
                          >
                            <StudentAvatar student={s} small />
                            <span><b>{s.name}</b><small>Roll {s.rollNumber} · {s.grade}</small></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>
              {selectedStudent && (
                <div className="result-student-info">
                  <span><small>Grade</small><b>{selectedStudent.grade}</b></span>
                  <span><small>Roll No.</small><b>{selectedStudent.rollNumber}</b></span>
                </div>
              )}
              <div className="marks-obtained-wrap">
                <label>Marks obtained
                  <input
                    type="number"
                    step="any"
                    placeholder={`Out of ${fullMarks}`}
                    value={row.obtained}
                    className={rowError ? 'input-error' : ''}
                    onChange={e => updateRow(idx, 'obtained', e.target.value)}
                  />
                </label>
                {rowError && <div className="field-error-text"><CircleAlert size={12} /> {rowError}</div>}
              </div>
            </div>
            {rows.length > 1 && (
              <button type="button" className="result-row-remove" aria-label="Remove student" onClick={() => removeRow(idx)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}

      <button type="button" className="button button-secondary add-student-row" onClick={addRow}>
        <Plus size={14} /> Add another student
      </button>

      {submitError && <div className="form-error"><CircleAlert size={14} /> {submitError}</div>}

      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={!canPublish}>
          Publish results <ArrowRight size={15} />
        </button>
      </div>
    </form>
  );
}

// ─── TASK 5: BILINGUAL NOTIFICATIONS PAGE ───────────────────────────
function NotificationsPage({ role, notices, setNotices, notify, lang }: any) {
  const unread = notices.filter((n: Notice) => !n.read).length;
  const markRead = (id: string) => {
    setNotices((items: Notice[]) => items.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="UPDATES & REMINDERS"
        title={t('notifications', lang)}
        description={role === 'parent' ? 'Important tuition updates, showing both Nepali and English messages.' : 'A single place for attendance, fee and test activity.'}
        action={
          <button
            className="button button-secondary"
            onClick={() => {
              setNotices((items: Notice[]) => items.map(n => ({ ...n, read: true })));
              notify('All notifications marked as read.');
            }}
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        }
      />

      <div className="notification-summary-row">
        <div className="notification-summary">
          <span className="notification-summary-icon"><Bell size={18} /></span>
          <span>
            <b>{formatNum(unread, lang)} unread updates</b>
            <small>Bilingual in-app prototype alerts</small>
          </span>
        </div>
        <span className="notification-summary-note">
          <ShieldCheck size={15} /> {t('prototypeNotice', lang)}
        </span>
      </div>

      <div className="panel notifications-panel">
        <div className="notification-date-label">RECENT UPDATES</div>
        {notices.map((n: Notice) => (
          <div className={`notification-row ${n.read ? '' : 'notification-unread'}`} key={n.id}>
            <span className={`notification-large-icon activity-${n.kind}`}>
              {n.kind === 'attendance' ? <CalendarCheck size={18} /> : n.kind === 'fee' ? <Wallet size={18} /> : n.kind === 'test' ? <ClipboardCheck size={18} /> : <Bell size={18} />}
            </span>
            {/* TASK 5 BILINGUAL DISPLAY: BOTH NEPALI AND ENGLISH SHOWN TOGETHER */}
            <div className="notification-content">
              <b className="notification-title-ne">{n.titleNe || n.title}</b>
              <span className="notification-title-en">{n.titleEn || n.title}</span>
              {n.bodyNe && <p className="notification-body-ne">{n.bodyNe}</p>}
              <small className="notification-time">{n.time}</small>
            </div>
            {!n.read ? (
              <button className="notification-read-button" onClick={() => markRead(n.id)}>
                Mark read
              </button>
            ) : (
              <span className="read-label"><Check size={13} /> Read</span>
            )}
          </div>
        ))}
        {notices.length === 0 && (
          <div className="empty-state">
            <Bell size={22} />
            <b>You're all caught up</b>
            <span>New updates will appear here.</span>
          </div>
        )}
      </div>

      <div className="info-note">
        <CircleAlert size={16} />
        <span>Prototype notifications are local sample records. No external SMS or push messages are sent.</span>
      </div>
    </div>
  );
}

// ─── Modal Base Component ───────────────────────────────────────────
function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AddStudentForm({ onSave, onCancel }: { onSave: (name: string, grade: string, fee: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Grade 8');
  const [fee, setFee] = useState('1500');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && Number(fee) > 0) onSave(name.trim(), grade, Number(fee));
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Student full name
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samira Joshi" required />
      </label>
      <div className="form-two-col">
        <label>Grade
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>Monthly fee (Rs.)
          <input type="number" min="1" value={fee} onChange={e => setFee(e.target.value)} required />
        </label>
      </div>
      <div className="modal-form-note"><ShieldCheck size={15} /> This creates a sample record only. Parent linking and verification are not connected.</div>
      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Add student <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

function RecordPaymentForm({ students, onSave, onCancel }: { students: Student[]; onSave: (student: string, amount: number, month: string, method: string) => void; onCancel: () => void }) {
  const [student, setStudent] = useState(students[0]?.name || '');
  const [amount, setAmount] = useState('1000');
  const [month, setMonth] = useState('October 2026');
  const [method, setMethod] = useState('Cash');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (student && Number(amount) > 0) onSave(student, Number(amount), month, method);
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Student
        <select value={student} onChange={e => setStudent(e.target.value)}>
          {students.map((s: Student) => (
            <option key={s.id} value={s.name}>{s.name} · {s.grade}</option>
          ))}
        </select>
      </label>
      <div className="form-two-col">
        <label>Amount received (Rs.)
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required />
        </label>
        <label>Payment method
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option>Cash</option>
            <option>Bank transfer</option>
            <option>External wallet</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label>Fee month
        <select value={month} onChange={e => setMonth(e.target.value)}>
          {['August 2026','September 2026','October 2026','November 2026'].map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <div className="modal-form-note"><ShieldCheck size={15} /> This only records an external payment. The parent must confirm or dispute it.</div>
      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Record for confirmation <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

function AddTestForm({ onSave, onCancel }: { onSave: (title: string, subject: string, date: string, grade: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [date, setDate] = useState('Mon, Oct 26');
  const [grade, setGrade] = useState('Grade 9');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) onSave(title.trim(), subject, date, grade);
  };

  return (
    <form className="modal-form" onSubmit={submit}>
      <label>Test name
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Science Check-in" required />
      </label>
      <div className="form-two-col">
        <label>Subject
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            {['Science','Mathematics','English','Physics','Chemistry','Computer Science','Nepali','Social Studies'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>Class / grade
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10'].map(g => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <label>Test date
        <select value={date} onChange={e => setDate(e.target.value)}>
          {['Fri, Oct 23','Sat, Oct 24','Sun, Oct 25','Mon, Oct 26','Tue, Oct 27','Wed, Oct 28','Thu, Oct 29','Fri, Oct 30'].map(d => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <div className="modal-form-note"><Bell size={15} /> Parent reminders are simulated in this demo, not actually sent.</div>
      <div className="modal-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary">Schedule test <ArrowRight size={15} /></button>
      </div>
    </form>
  );
}

export default App;
