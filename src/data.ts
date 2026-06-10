import { Student, Teacher, Attendance, Batch, FeeReceipt, DashboardStats } from './types';

export const initialStudents: Student[] = [];

export const initialTeachers: Teacher[] = [];

export const initialAttendance: Attendance[] = [];

export const initialBatches: Batch[] = [];

export const initialFeeReceipts: FeeReceipt[] = [];

export const initialStats: DashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  pendingFees: 0,
  todayPresentCount: 0,
  activeBatches: 0,
  monthlyRevenue: 0,
};

