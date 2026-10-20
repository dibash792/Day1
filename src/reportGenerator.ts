import { jsPDF } from 'jspdf';
import type { Language, Student, Teacher, TeacherPayment } from './types';
import { formatCurrency, formatNum, toDevanagariDigits } from './translations';

export type TeacherReportData = {
  isSample?: boolean;
  teacher: Teacher;
  payment?: TeacherPayment;
  assignedStudents: Student[];
  generationDate: string;
};

// Generates sample report data when no teacher is selected or user clicks 'Preview Sample Report'
export function getSampleTeacherReportData(): TeacherReportData {
  return {
    isSample: true,
    teacher: {
      id: 'SAMPLE-TCH',
      name: 'Dr. Hari Krishna Sharma (Sample Profile)',
      initials: 'HS',
      color: 'teal',
      email: 'hari.sharma@sample-tuition.edu.np',
      phone: '+977-9800000000',
      qualification: 'Ph.D. Mathematics (Sample Institution)',
      subjects: ['Higher Mathematics', 'Calculus', 'Statistics'],
      assignedClasses: ['Grade 10 - Opt. Mathematics', 'Grade 9 - Advanced Math'],
      assignedStudentCount: 30,
      status: 'active',
      salaryType: 'monthly',
      baseRate: 35000,
    },
    payment: {
      id: 'TP-SAMPLE',
      teacherId: 'SAMPLE-TCH',
      teacherName: 'Dr. Hari Krishna Sharma (Sample Profile)',
      period: 'October 2026',
      amountDue: 35000,
      amountPaid: 35000,
      balance: 0,
      date: 'Oct 20, 2026',
      status: 'paid',
      method: 'Bank transfer',
      note: 'Sample verified monthly payroll settlement',
    },
    assignedStudents: [
      {
        id: 'ST-SAMPLE-1',
        name: 'Aayush Adhikari (Sample)',
        grade: 'Grade 10',
        initials: 'AA',
        color: 'blue',
        attendance: 'present',
        fee: 2500,
        confirmedPaid: 2500,
        parent: 'Gopal Adhikari',
        rollNumber: '01',
      },
      {
        id: 'ST-SAMPLE-2',
        name: 'Binita Shrestha (Sample)',
        grade: 'Grade 10',
        initials: 'BS',
        color: 'violet',
        attendance: 'present',
        fee: 2500,
        confirmedPaid: 2500,
        parent: 'Laxmi Shrestha',
        rollNumber: '02',
      },
      {
        id: 'ST-SAMPLE-3',
        name: 'Chirag Thapa (Sample)',
        grade: 'Grade 9',
        initials: 'CT',
        color: 'orange',
        attendance: 'absent',
        fee: 2200,
        confirmedPaid: 0,
        parent: 'Sunil Thapa',
        rollNumber: '03',
      },
    ],
    generationDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

// Compile actual report data for a specific teacher
export function compileTeacherReportData(
  teacher: Teacher,
  allStudents: Student[],
  teacherPayments: TeacherPayment[]
): TeacherReportData {
  const teacherClasses = teacher.assignedClasses || [];
  // Find linked students by assigned teacher id or by matching assigned classes
  const assignedStudents = allStudents.filter(
    s => s.assignedTeacherId === teacher.id || (s.assignedClass && teacherClasses.includes(s.assignedClass))
  );

  const payment = teacherPayments.find(p => p.teacherId === teacher.id);

  return {
    isSample: false,
    teacher,
    payment,
    assignedStudents,
    generationDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

// ─── PDF Report Generator ───────────────────────────────────────────
export function downloadTeacherReportPdf(data: TeacherReportData, lang: Language = 'en'): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const safeName = data.teacher.name.replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = data.isSample
      ? 'Teacher-Report-Sample-Preview.pdf'
      : `Teacher-Report-${safeName}.pdf`;

    // ─── Document Colors ───
    const primaryNavy = [20, 33, 61];     // #14213d
    const accentCobalt = [65, 105, 245];  // #4169f5
    const darkGray = [40, 50, 70];
    const lightGray = [100, 115, 130];
    const borderGray = [225, 230, 240];
    const bgLight = [248, 250, 255];

    let y = 18;

    // Header Band
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('TuitionTrack', 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Bright Path Tuition Center · Kathmandu, Nepal', 14, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(data.isSample ? 'SAMPLE REPORT PREVIEW' : 'OFFICIAL FACULTY REPORT', 196, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated: ${data.generationDate}`, 196, 21, { align: 'right' });

    y = 38;

    // Report Title
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Teacher Academic & Financial Summary Report', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      data.isSample
        ? 'Notice: This document contains simulated prototype sample data for feature demonstration.'
        : 'Comprehensive center record covering teaching assignments, attendance summary, and compensation.',
      14,
      y
    );
    y += 9;

    // Section 1: Teacher Profile Details Box
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

    doc.setTextColor(accentCobalt[0], accentCobalt[1], accentCobalt[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('FACULTY PROFILE', 18, y + 7);

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(data.teacher.name, 18, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Staff ID: ${data.teacher.id}`, 18, y + 20);
    doc.text(`Qualification: ${data.teacher.qualification}`, 18, y + 25);
    doc.text(`Status: ${data.teacher.status.toUpperCase()}`, 18, y + 30);

    doc.text(`Phone: ${data.teacher.phone}`, 115, y + 14);
    doc.text(`Email: ${data.teacher.email}`, 115, y + 20);
    doc.text(`Salary Agreement: Rs. ${data.teacher.baseRate.toLocaleString('en-IN')} / month`, 115, y + 25);
    doc.text(`Institution: Bright Path Tuition Center`, 115, y + 30);

    y += 44;

    // Section 2: Teaching & Class Assignments
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Class & Subject Assignments', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    const subjectsStr = (data.teacher.subjects || []).join(', ') || 'General';
    const classesStr = (data.teacher.assignedClasses || []).join('  |  ') || 'No classes currently assigned';

    doc.text(`Subjects Taught: ${subjectsStr}`, 14, y);
    y += 5;
    doc.text(`Assigned Classes: ${classesStr}`, 14, y);
    y += 5;
    doc.text(`Total Assigned Students: ${data.teacher.assignedStudentCount || 0} students across active sections`, 14, y);
    y += 9;

    // Section 3: Attendance Summary Table
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Student Roster & Attendance Summary', 14, y);
    y += 4;

    const presentCount = data.assignedStudents.filter(s => s.attendance === 'present').length;
    const absentCount = data.assignedStudents.filter(s => s.attendance === 'absent').length;
    const unmarkedCount = data.assignedStudents.filter(s => s.attendance === 'unmarked').length;
    const totalMarked = presentCount + absentCount;
    const rate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    // Table Header
    doc.setFillColor(accentCobalt[0], accentCobalt[1], accentCobalt[2]);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('STUDENT ID', 17, y + 5);
    doc.text('STUDENT NAME', 45, y + 5);
    doc.text('GRADE / CLASS', 95, y + 5);
    doc.text('ROLL NO.', 140, y + 5);
    doc.text("TODAY'S ATTENDANCE", 165, y + 5);

    y += 7;

    // Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    if (data.assignedStudents.length > 0) {
      data.assignedStudents.forEach((st, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(245, 248, 255);
          doc.rect(14, y, 182, 6.5, 'F');
        }
        doc.text(st.id, 17, y + 4.5);
        doc.text(st.name, 45, y + 4.5);
        doc.text(st.grade, 95, y + 4.5);
        doc.text(st.rollNumber, 140, y + 4.5);
        doc.text(st.attendance.toUpperCase(), 165, y + 4.5);
        y += 6.5;
      });
    } else {
      doc.text('No individual student records directly mapped to this faculty ID.', 17, y + 5);
      y += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(
      `Attendance Rate: ${rate}%  (${presentCount} Present, ${absentCount} Absent, ${unmarkedCount} Unmarked)`,
      14,
      y + 4
    );
    y += 10;

    // Section 4: Teacher Payment & Compensation Ledger
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Compensation & Center Payment Ledger (October 2026)', 14, y);
    y += 4;

    const due = data.payment ? data.payment.amountDue : data.teacher.baseRate;
    const paid = data.payment ? data.payment.amountPaid : 0;
    const balance = data.payment ? data.payment.balance : data.teacher.baseRate;
    const status = data.payment ? data.payment.status.toUpperCase() : 'PENDING';
    const method = data.payment ? data.payment.method : 'Bank transfer';

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

    doc.text(`Total Agreed Salary: Rs. ${due.toLocaleString('en-IN')}`, 18, y + 7);
    doc.text(`Amount Settled / Paid: Rs. ${paid.toLocaleString('en-IN')}`, 18, y + 14);
    doc.text(`Payment Method: ${method}`, 18, y + 21);

    doc.text(`Outstanding Balance: Rs. ${balance.toLocaleString('en-IN')}`, 115, y + 7);
    doc.text(`Payment Status: ${status}`, 115, y + 14);
    doc.text(`Settlement Cycle: October 2026`, 115, y + 21);

    y += 34;

    // Footer & Disclaimer
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(14, y, 196, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(
      'TuitionTrack Nepal · This is a shared record summary generated from active prototype demo data.',
      14,
      y
    );
    doc.text(
      'Teacher payments are recorded internally by the center and remain separate from student tuition accounts.',
      14,
      y + 4
    );

    // Save PDF
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF report:', err);
    return false;
  }
}

// ─── CSV Report Fallback Generator ──────────────────────────────────
export function downloadTeacherReportCsv(data: TeacherReportData): boolean {
  try {
    const lines: string[] = [];
    lines.push('TuitionTrack - Teacher Academic & Financial Report');
    lines.push(`Institution,Bright Path Tuition Center,Kathmandu,Nepal`);
    lines.push(`Generated On,${data.generationDate}`);
    lines.push(`Report Type,${data.isSample ? 'SAMPLE DEMO PREVIEW' : 'OFFICIAL FACULTY REPORT'}`);
    lines.push('');
    lines.push('--- TEACHER PROFILE ---');
    lines.push(`Teacher ID,${data.teacher.id}`);
    lines.push(`Full Name,"${data.teacher.name}"`);
    lines.push(`Qualification,"${data.teacher.qualification}"`);
    lines.push(`Phone,${data.teacher.phone}`);
    lines.push(`Email,${data.teacher.email}`);
    lines.push(`Status,${data.teacher.status}`);
    lines.push(`Monthly Salary Rate,Rs. ${data.teacher.baseRate}`);
    lines.push('');
    lines.push('--- ACADEMIC ASSIGNMENTS ---');
    lines.push(`Subjects Taught,"${(data.teacher.subjects || []).join(', ')}"`);
    lines.push(`Assigned Classes,"${(data.teacher.assignedClasses || []).join(', ')}"`);
    lines.push(`Assigned Students Count,${data.teacher.assignedStudentCount || 0}`);
    lines.push('');
    lines.push('--- ASSIGNED STUDENT ROSTER & ATTENDANCE ---');
    lines.push('Student ID,Student Name,Grade,Roll Number,Attendance Status');
    data.assignedStudents.forEach(st => {
      lines.push(`${st.id},"${st.name}",${st.grade},${st.rollNumber},${st.attendance}`);
    });
    lines.push('');
    lines.push('--- COMPENSATION & PAYMENT SUMMARY ---');
    const due = data.payment ? data.payment.amountDue : data.teacher.baseRate;
    const paid = data.payment ? data.payment.amountPaid : 0;
    const balance = data.payment ? data.payment.balance : data.teacher.baseRate;
    const status = data.payment ? data.payment.status : 'pending';
    const method = data.payment ? data.payment.method : 'Bank transfer';

    lines.push(`Payment Period,October 2026`);
    lines.push(`Amount Due,Rs. ${due}`);
    lines.push(`Amount Paid,Rs. ${paid}`);
    lines.push(`Remaining Balance,Rs. ${balance}`);
    lines.push(`Status,${status}`);
    lines.push(`Method,${method}`);
    lines.push('');
    lines.push('Notice,"Teacher payments are separate from student tuition accounts."');

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = data.teacher.name.replace(/[^a-zA-Z0-9_-]/g, '-');
    link.download = data.isSample ? 'Teacher-Report-Sample-Preview.csv' : `Teacher-Report-${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error generating CSV report:', err);
    return false;
  }
}
