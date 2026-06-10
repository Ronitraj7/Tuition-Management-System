export type UserRole = 'admin' | 'teacher' | 'student';

export interface Student {
  studentId: string;
  name: string;
  class: string;
  batch: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  fees: number; // e.g., 2500
  status: 'Paid' | 'Pending' | 'Partial';
  email: string;
  password?: string;
  subjects?: string; // Comma separated list of subjects, default "All Subjects"
}

export interface Teacher {
  teacherId: string;
  name: string;
  subject: string;
  salary: number; // e.g., 25000
  phone: string;
  email: string;
  password?: string;
}

export interface Attendance {
  attendanceId: string;
  studentId: string;
  studentName?: string; // Cache or join for easy rendering
  class?: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Holiday';
}

export interface Batch {
  batchId: string;
  batchName: string;
  timing: string;
  teacher: string;
}

export interface FeeReceipt {
  receiptId: string;
  studentName: string;
  studentId?: string;
  amount: number;
  date: string; // e.g. "01-Jun-2026"
  mode: 'UPI' | 'Cash' | 'Card';
  month: string; // e.g. "June 2026"
}

export interface DispatchLog {
  dispatchId: string;
  studentId: string;
  studentName: string;
  recipient: string;
  phone: string;
  type: 'Fee Reminder' | 'Absence Alert';
  message: string;
  timestamp: string;
  status: string;
  channel: string; // e.g., 'WhatsApp' or 'SMS' or 'API'
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  pendingFees: number;
  todayPresentCount: number;
  activeBatches: number;
  monthlyRevenue: number;
}
