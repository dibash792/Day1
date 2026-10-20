export type Role = 'tutor' | 'parent' | 'center';

export type Section =
  | 'dashboard'
  | 'teachers'
  | 'students'
  | 'attendance'
  | 'fees'
  | 'tests'
  | 'notifications'
  | 'settings';

export type Attendance = 'present' | 'absent' | 'unmarked';
export type PaymentStatus = 'pending' | 'confirmed' | 'disputed';
export type TeacherPaymentStatus = 'paid' | 'partial' | 'pending';

export type Language = 'en' | 'ne';
export type Theme = 'light' | 'dark';

export type Student = {
  id: string;
  name: string;
  grade: string;
  initials: string;
  color: string;
  attendance: Attendance;
  fee: number;
  confirmedPaid: number;
  parent: string;
  rollNumber: string;
  assignedTeacherId?: string;
  assignedClass?: string;
};

export type Payment = {
  id: string;
  student: string;
  amount: number;
  date: string;
  month: string;
  method: string;
  status: PaymentStatus;
  note?: string;
};

export type Teacher = {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
  phone: string;
  qualification: string;
  subjects: string[];
  assignedClasses: string[];
  assignedStudentCount: number;
  status: 'active' | 'inactive';
  salaryType: 'monthly' | 'per_class';
  baseRate: number;
};

export type TeacherPayment = {
  id: string;
  teacherId: string;
  teacherName: string;
  period: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  date: string;
  status: TeacherPaymentStatus;
  method: string;
  note?: string;
};

export type ClassItem = {
  id: string;
  name: string;
  grade: string;
  subject: string;
  studentCount: number;
};

export type Test = {
  id: string;
  title: string;
  subject: string;
  date: string;
  grade: string;
  status: 'scheduled' | 'completed' | 'published';
  fullMarks: number;
};

export type TestResult = {
  id: string;
  testId: string;
  studentId: string;
  obtained: number;
  fullMarks: number;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  titleNe?: string;
  titleEn?: string;
  bodyNe?: string;
  bodyEn?: string;
  time: string;
  kind: 'attendance' | 'fee' | 'test' | 'general';
  read: boolean;
  student?: string;
  grade?: string;
};
