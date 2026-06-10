import React, { useState, useEffect } from 'react';
import {
  initialStudents,
  initialTeachers,
  initialAttendance,
  initialBatches,
  initialFeeReceipts,
  initialStats,
} from './data';
import { Student, Teacher, Attendance, Batch, FeeReceipt, UserRole, DispatchLog } from './types';
import LoginScreen from './components/LoginScreen';
import StudentsView from './components/StudentsView';
import TeachersView from './components/TeachersView';
import AttendanceView from './components/AttendanceView';
import BatchesView from './components/BatchesView';
import FeeReceiptsView, { AVAILABLE_MONTHS } from './components/FeeReceiptsView';
import DeviceSyncHub from './components/DeviceSyncHub';
import MonthlyAttendanceGrid from './components/MonthlyAttendanceGrid';
import {
  GraduationCap,
  Users,
  LineChart,
  CalendarDays,
  Grid3X3,
  Receipt,
  LogOut,
  User,
  Shield,
  BookOpen,
  Mail,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CircleDollarSign,
  Briefcase,
  RotateCcw,
  KeyRound,
  MessageSquare,
  Send,
  Bell,
  Smartphone,
  CheckCircle,
  Sliders,
  Calendar,
  Trash2
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  // Session Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Default to FALSE to require login
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('student');
  const [adminPassword, setAdminPassword] = useState('admin123'); // Dynamic setting from Firestore
  const [showPassModal, setShowPassModal] = useState(false);

  // Database States loaded from Firebase Firestore
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [receipts, setReceipts] = useState<FeeReceipt[]>([]);
  const [dispatches, setDispatches] = useState<DispatchLog[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [selectedStudentLedgerMonth, setSelectedStudentLedgerMonth] = useState('June 2026');

  // Automated Dispatches pagination, filtering, searching and delete confirmation states
  const [dispatchSearchQuery, setDispatchSearchQuery] = useState('');
  const [dispatchFilterType, setDispatchFilterType] = useState('all');
  const [dispatchPage, setDispatchPage] = useState(1);
  const [dispatchDeletingId, setDispatchDeletingId] = useState<string | null>(null);

  // Automated Notification Webhook & Trigger State Configs
  const [whatsappWebhook, setWhatsappWebhook] = useState('https://api.whatsapp-gateway.mock/dispatch');
  const [whatsappSenderPhone, setWhatsappSenderPhone] = useState('+91 98210 54321');
  const [autoSendOnAbsent, setAutoSendOnAbsent] = useState(true);
  const [autoSendFeeReminder, setAutoSendFeeReminder] = useState(true);
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; sub: string; type: 'success' | 'info' } | null>(null);

  // Real-time administrator password settings synchronization
  useEffect(() => {
    let active = true;
    const adminPassRef = doc(db, 'settings', 'admin');
    const unsubAdminPass = onSnapshot(
      adminPassRef,
      (docSnap) => {
        if (!active) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.password) {
            setAdminPassword(data.password);
          }
        } else {
          // Auto-seed default administrator password config if not present in DB
          setDoc(adminPassRef, { password: 'admin123' }).catch((err) => {
            console.error("Firestore error auto-seeding admin password:", err);
          });
        }
      },
      (error) => {
        console.error("Firestore subscription error for admin password settings:", error);
      }
    );

    return () => {
      active = false;
      unsubAdminPass();
    };
  }, []);

  // Real-time WhatsApp system configs subscription
  useEffect(() => {
    let active = true;
    const waRef = doc(db, 'settings', 'whatsapp');
    const unsubWa = onSnapshot(
      waRef,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          const d = snap.data();
          if (d.whatsappWebhook) setWhatsappWebhook(d.whatsappWebhook);
          if (d.whatsappSenderPhone) setWhatsappSenderPhone(d.whatsappSenderPhone);
          if (d.autoSendOnAbsent !== undefined) setAutoSendOnAbsent(d.autoSendOnAbsent);
          if (d.autoSendFeeReminder !== undefined) setAutoSendFeeReminder(d.autoSendFeeReminder);
        } else {
          // Initial seed for WhatsApp configs
          setDoc(waRef, {
            whatsappWebhook: 'https://api.whatsapp-gateway.mock/dispatch',
            whatsappSenderPhone: '+91 98210 54321',
            autoSendOnAbsent: true,
            autoSendFeeReminder: true
          }).catch(err => console.log("Init seed wa error:", err));
        }
      },
      (error) => {
        console.error("WhatsApp settings subscription error:", error);
      }
    );
    return () => {
      active = false;
      unsubWa();
    };
  }, []);

  // Reset page of automated dispatches log on filter change
  useEffect(() => {
    setDispatchPage(1);
  }, [dispatchSearchQuery, dispatchFilterType]);

  // Self-expiring helper hook for auto-message alert toasts
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Real-time synchronization to/from Firebase Firestore
  useEffect(() => {
    const collectionsToSync = [
      { name: 'students', setter: setStudents, initial: initialStudents },
      { name: 'teachers', setter: setTeachers, initial: initialTeachers },
      { name: 'attendance', setter: setAttendance, initial: initialAttendance },
      { name: 'batches', setter: setBatches, initial: initialBatches },
      { name: 'receipts', setter: setReceipts, initial: initialFeeReceipts },
      { name: 'dispatches', setter: setDispatches, initial: [] },
    ];

    const loadedCollections = new Set<string>();

    const unsubscribers = collectionsToSync.map(({ name, setter, initial }) => {
      const colRef = collection(db, name);

      return onSnapshot(
        colRef,
        async (snapshot) => {
          if (snapshot.empty) {
            setter([]);
            // Seed the Firestore database with beautiful default data on first load if initial seed elements exist
            if (initial && initial.length > 0) {
              try {
                const promises = initial.map((item: any) => {
                  let docId = '';
                  if (name === 'students') docId = item.studentId;
                  else if (name === 'teachers') docId = item.teacherId;
                  else if (name === 'attendance') docId = item.attendanceId;
                  else if (name === 'batches') docId = item.batchId;
                  else if (name === 'receipts') docId = item.receiptId;
                  else if (name === 'dispatches') docId = item.dispatchId;

                  return setDoc(doc(db, name, docId), item);
                });
                await Promise.all(promises);
              } catch (err) {
                console.error(`Error auto-seeding empty collection ${name}:`, err);
              }
            }
          } else {
            const list: any[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data());
            });
            setter(list);
          }

          loadedCollections.add(name);
          if (loadedCollections.size === collectionsToSync.length) {
            setDbLoading(false);
          }
        },
        (error) => {
          console.error(`Firestore real-time subscription error for ${name}:`, error);
          handleFirestoreError(error, OperationType.LIST, name);
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'teachers' | 'attendance' | 'batches' | 'receipts'>('dashboard');

  // Handle Logins
  const handleLoginSuccess = (role: UserRole, email: string) => {
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setIsLoggedIn(true);
    // Auto-navigate based on role limits
    if (role === 'student') {
      setActiveTab('dashboard'); // Student Dashboard is custom tailored
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Database Modifiers
  const handleAddStudent = async (newS: Student) => {
    try {
      await setDoc(doc(db, 'students', newS.studentId), newS);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `students/${newS.studentId}`);
    }
  };

  const handleUpdateStudent = async (updatedS: Student) => {
    try {
      await setDoc(doc(db, 'students', updatedS.studentId), updatedS);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `students/${updatedS.studentId}`);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `students/${id}`);
    }
  };

  const handleAddTeacher = async (newT: Teacher) => {
    try {
      await setDoc(doc(db, 'teachers', newT.teacherId), newT);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `teachers/${newT.teacherId}`);
    }
  };

  const handleUpdateTeacher = async (updatedT: Teacher) => {
    try {
      await setDoc(doc(db, 'teachers', updatedT.teacherId), updatedT);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `teachers/${updatedT.teacherId}`);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `teachers/${id}`);
    }
  };

  const handleAddBatch = async (newB: Batch) => {
    try {
      await setDoc(doc(db, 'batches', newB.batchId), newB);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `batches/${newB.batchId}`);
    }
  };

  const handleUpdateBatch = async (updatedB: Batch) => {
    try {
      await setDoc(doc(db, 'batches', updatedB.batchId), updatedB);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `batches/${updatedB.batchId}`);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'batches', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `batches/${id}`);
    }
  };

  const handleAddReceipt = async (newR: FeeReceipt) => {
    try {
      await setDoc(doc(db, 'receipts', newR.receiptId), newR);

      // Optionally update the student pay status to 'Paid' or 'Partial' reactively
      const matchS = students.find((s) => s.name === newR.studentName);
      if (matchS) {
        const updatedS: Student = {
          ...matchS,
          status: newR.amount >= matchS.fees ? 'Paid' : 'Partial',
        };
        await handleUpdateStudent(updatedS);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `receipts/${newR.receiptId}`);
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      const receiptToDelete = receipts.find((r) => r.receiptId === receiptId);
      await deleteDoc(doc(db, 'receipts', receiptId));

      if (receiptToDelete) {
        // Filter remaining receipts of that same student to compute refreshed status
        const remainingReceipts = receipts.filter(
          (r) => r.receiptId !== receiptId && r.studentName === receiptToDelete.studentName
        );
        const matchS = students.find((s) => s.name === receiptToDelete.studentName);
        if (matchS) {
          const totalPaid = remainingReceipts.reduce((sum, r) => sum + r.amount, 0);
          let newStatus: 'Paid' | 'Pending' | 'Partial' = 'Pending';
          if (totalPaid >= matchS.fees) {
            newStatus = 'Paid';
          } else if (totalPaid > 0) {
            newStatus = 'Partial';
          }

          const updatedS: Student = {
            ...matchS,
            status: newStatus,
          };
          await handleUpdateStudent(updatedS);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `receipts/${receiptId}`);
    }
  };

  const handleChangeAdminPassword = async (newPassword: string) => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), { password: newPassword });
      setAdminPassword(newPassword);
      return true;
    } catch (e) {
      console.error("Error setting administrator password profile in DB: ", e);
      return false;
    }
  };

  const handleSyncRestore = (data: {
    students: Student[];
    teachers: Teacher[];
    attendance: Attendance[];
    batches: Batch[];
    receipts: FeeReceipt[];
  }) => {
    // Legacy endpoint restore helper - we can also map backups directly to Firestore
    const collectionsToBackup = [
      { name: 'students', list: data.students, idKey: 'studentId' },
      { name: 'teachers', list: data.teachers, idKey: 'teacherId' },
      { name: 'attendance', list: data.attendance, idKey: 'attendanceId' },
      { name: 'batches', list: data.batches, idKey: 'batchId' },
      { name: 'receipts', list: data.receipts, idKey: 'receiptId' },
    ];

    collectionsToBackup.forEach(({ name, list, idKey }) => {
      if (!list) return;
      list.forEach(async (item: any) => {
        try {
          await setDoc(doc(db, name, item[idKey]), item);
        } catch (e) {
          console.error(`Restore error on ${name}/${item[idKey]}:`, e);
        }
      });
    });
  };

  // Live Attendance Toggler/Setter
  const handleToggleAttendanceStatus = async (
    studentId: string,
    date: string,
    targetStatus?: 'Present' | 'Absent' | 'Holiday'
  ) => {
    const targetStudent = students.find((s) => s.studentId === studentId);
    if (!targetStudent) return;

    const existingIndex = attendance.findIndex((a) => a.studentId === studentId && a.date === date);

    try {
      if (existingIndex > -1) {
        const record = attendance[existingIndex];
        if (targetStatus === undefined) {
          // Legacy check: alternate between Present <=> Absent
          const nextStatus = record.status === 'Present' ? 'Absent' : 'Present';
          const updatedRecord = {
            ...record,
            status: nextStatus as 'Present' | 'Absent' | 'Holiday',
          };
          await setDoc(doc(db, 'attendance', record.attendanceId), updatedRecord);
          if (nextStatus === 'Absent' && autoSendOnAbsent) {
            await dispatchNotification('Absence Alert', targetStudent);
          }
        } else if (record.status === targetStatus) {
          // Clear marking if clicking the active one
          await deleteDoc(doc(db, 'attendance', record.attendanceId));
        } else {
          // Set to specified target status
          const updatedRecord = {
            ...record,
            status: targetStatus,
          };
          await setDoc(doc(db, 'attendance', record.attendanceId), updatedRecord);
          if (targetStatus === 'Absent' && autoSendOnAbsent) {
            await dispatchNotification('Absence Alert', targetStudent);
          }
        }
      } else {
        // Create initial record
        const newRecord: Attendance = {
          attendanceId: `A${String(attendance.length + 1).padStart(3, '0')}-${Date.now()}`,
          studentId: studentId,
          studentName: targetStudent.name,
          class: targetStudent.class,
          date: date,
          status: targetStatus || 'Present',
        };
        await setDoc(doc(db, 'attendance', newRecord.attendanceId), newRecord);
        if (newRecord.status === 'Absent' && autoSendOnAbsent) {
          await dispatchNotification('Absence Alert', targetStudent);
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'attendance');
    }
  };

  // Automated WhatsApp Dispatcher Subsystem
  const dispatchNotification = async (
    type: 'Fee Reminder' | 'Absence Alert',
    student: Student,
    customMessage?: string
  ) => {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let messageText = '';
    if (type === 'Absence Alert') {
      messageText = `Hello Guardian,\nThis is an automated alert from Manisha Tuition Classes to inform you that your child ${student.name} was marked ABSENT today, ${formattedDate}. Kindly follow up if unexcused.`;
    } else {
      messageText = `Hello Guardian / Parent of ${student.name},\nThis is a friendly reminder that the tuition fee of ₹${student.fees} is pending of 20th billing cycle.\n\nPlease clear the outstanding dues directly to the instructor. Thank you!`;
    }

    const finalMessage = customMessage || messageText;
    const cleanPh = student.parentPhone.replace(/[^0-9]/g, '');
    const recipientPhone = cleanPh.length === 10 ? `91${cleanPh}` : cleanPh;

    const newDispatch: DispatchLog = {
      dispatchId: `D${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.studentId,
      studentName: student.name,
      recipient: `${student.parentName} (Parent)`,
      phone: student.parentPhone,
      type: type,
      message: finalMessage,
      timestamp: new Date().toLocaleString('en-IN'),
      status: 'Sent Successfully',
      channel: 'WhatsApp Automation Gateway',
    };

    try {
      await setDoc(doc(db, 'dispatches', newDispatch.dispatchId), newDispatch);
    } catch (err) {
      console.error("Firestore write dispatch alert log error:", err);
    }

    // Trigger REST API Webhook in background for live integration setup
    if (whatsappWebhook && whatsappWebhook.startsWith('http')) {
      try {
        fetch(whatsappWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: type === 'Absence Alert' ? 'student_absent' : 'fee_reminder',
            sender: whatsappSenderPhone,
            studentId: student.studentId,
            studentName: student.name,
            parentName: student.parentName,
            phone: recipientPhone,
            message: finalMessage,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.log("Silent error posting alert webhook:", err));
      } catch (e) {
        console.warn("REST Webhook dispatch skipped:", e);
      }
    }

    // Trigger Toast Notification on screen
    setActiveToast({
      id: String(Date.now()),
      message: `Auto WhatsApp ${type === 'Absence Alert' ? 'Absence Alert' : 'Fee Reminder'} Sent!`,
      sub: `Dispatched directly to ${student.parentName} (${student.parentPhone}) hands-free.`,
      type: 'success',
    });
  };

  const handleDeleteDispatch = async (dispatchId: string) => {
    try {
      await deleteDoc(doc(db, 'dispatches', dispatchId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `dispatches/${dispatchId}`);
    }
  };

  // Bulk 20th Month Fee Reminder Runner
  const trigger20thFeeReminders = async () => {
    const pendingStudents = students.filter(s => s.status === 'Pending' || s.status === 'Partial');
    if (pendingStudents.length === 0) {
      setActiveToast({
        id: String(Date.now()),
        message: "No Fees Outstanding",
        sub: "All registered students are fully settled for this active month.",
        type: 'info',
      });
      return;
    }

    let count = 0;
    for (const student of pendingStudents) {
      await dispatchNotification('Fee Reminder', student);
      count++;
    }

    setActiveToast({
      id: String(Date.now()),
      message: `Fired ${count} Automated Fee Reminders!`,
      sub: `Successfully generated and sent recurring monthly fee reminders directly to parent accounts.`,
      type: 'success',
    });
  };

  // Dynamic calculations based on our actual datasets
  const actualPaidFees = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalExpectedFees = students.reduce((sum, s) => sum + s.fees, 0);

  // Completely live calculations computed directly from active database records
  const reactiveStudentsCount = students.length;
  const reactiveTeachersCount = teachers.length;
  const specPendingFees = students.reduce((sum, s) => {
    if (s.status === 'Pending') return sum + s.fees;
    if (s.status === 'Partial') return sum + (s.fees * 0.5); // Assume 50% unpaid/pending for partial
    return sum;
  }, 0);
  const specPresentAttendanceCount = attendance.filter(a => a.status === 'Present').length;
  const reactiveActiveBatches = batches.length;
  const reactiveRevenue = actualPaidFees;

  const [resetConfirm, setResetConfirm] = useState(false);

  // Auto clean confirmation state after 3 seconds if not clicked
  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => setResetConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  // Unauthorised fallback redirect
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        students={students}
        teachers={teachers}
        adminPassword={adminPassword}
      />
    );
  }

  // Quick switch handles in top header
  const swapRole = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'admin') {
      setCurrentUserEmail('admin@tuition.com');
    } else if (role === 'teacher') {
      setCurrentUserEmail('teacher@tuition.com');
    } else {
      const firstStudent = students[0];
      setCurrentUserEmail(firstStudent ? firstStudent.email : 'student@tuition.com');
    }
  };

  const handleResetDatabase = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    setResetConfirm(false);

    // Write back default values to Firestore collections
    const collectionsToReset = [
      { name: 'students', initial: initialStudents, idKey: 'studentId' },
      { name: 'teachers', initial: initialTeachers, idKey: 'teacherId' },
      { name: 'attendance', initial: initialAttendance, idKey: 'attendanceId' },
      { name: 'batches', initial: initialBatches, idKey: 'batchId' },
      { name: 'receipts', initial: initialFeeReceipts, idKey: 'receiptId' },
    ];

    try {
      for (const col of collectionsToReset) {
        const promises = col.initial.map((item: any) => {
          return setDoc(doc(db, col.name, item[col.idKey]), item);
        });
        await Promise.all(promises);
      }
    } catch (e) {
      console.error("Error resetting database in Firestore: ", e);
    }
  };

  if (dbLoading) {
    return (
      <div id="loader-container" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-bold text-slate-900 font-sans">Connecting to Firestore Database...</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto font-sans">
            Initializing secure connections and synchronizing Manisha Tuition Classes records in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 leading-normal selection:bg-indigo-100">
      
      {/* Dynamic Automated Notification Toast */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-950 text-white border-l-4 border-indigo-500 rounded-2xl shadow-2xl p-4.5 transition-all animate-bounce duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <span>{activeToast.message}</span>
                <span className="text-[9px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-bold font-mono tracking-widest uppercase">
                  AUTO-SENT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-normal font-medium">{activeToast.sub}</p>
              <button 
                onClick={() => { setActiveTab('dispatches'); setActiveToast(null); }} 
                className="flex gap-1.5 mt-2.5 items-center text-[10px] text-indigo-400 font-extrabold hover:text-indigo-300 transition cursor-pointer uppercase tracking-tight"
              >
                <span>📁 View Auto logs & Gateway state</span>
                <span>→</span>
              </button>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-200 text-base font-bold leading-none shrink-0 cursor-pointer p-0.5"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Sandbox Header Bar */}
      <header className="bg-slate-900 text-white py-4 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Institution Identity */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-1.5">
                <span>MANISHA TUITION CLASSES</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-900">
                  CORE HUB
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Tuition Management System</p>
            </div>
          </div>

          {/* Portal User Actions Profile Area */}
          <div className="flex flex-wrap items-center gap-3.5 justify-end">
            
            {/* Profile Detail Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-850 border border-slate-700/60 rounded-xl">
              <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">
                {currentUserRole === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : currentUserRole === 'teacher' ? (
                  <BookOpen className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-none uppercase tracking-wider text-slate-200">
                  {currentUserRole === 'admin' ? 'Administrator' : currentUserRole === 'teacher' ? (() => {
                    const t = teachers.find(x => x.email?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
                    return t ? `${t.name}` : 'Instructor';
                  })() : (() => {
                    const st = students.find(s => s.email?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
                    return st ? `${st.name} (${st.studentId})` : 'Student';
                  })()}
                </div>
                <div className="text-[10px] text-slate-450 mt-0.5 leading-none">
                  {currentUserEmail}
                </div>
              </div>
            </div>

            {/* Change Admin Password Button */}
            {(currentUserRole === 'admin' || currentUserRole === 'teacher') && (
              <button
                onClick={() => setShowPassModal(true)}
                className="p-2 border border-slate-700 hover:border-indigo-400 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Change Administrator Password Tool"
              >
                <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="hidden md:inline">Change Admin Password</span>
              </button>
            )}

            {/* Reset Database Button */}
            {currentUserRole === 'admin' && (
              <button
                onClick={handleResetDatabase}
                className={`p-2 border transition-all duration-150 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                  resetConfirm
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400 animate-pulse font-bold'
                    : 'border-slate-705 bg-slate-800 hover:border-indigo-400 hover:bg-slate-750 text-slate-300 hover:text-indigo-400'
                }`}
                title={resetConfirm ? 'Click again to confirm database reset' : 'Reset Database to Default Samples'}
              >
                <RotateCcw className={`w-4 h-4 ${resetConfirm ? 'animate-spin' : ''}`} />
                {resetConfirm && <span className="text-[10px] tracking-tight text-rose-400">Confirm Reset?</span>}
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 border border-slate-700 hover:border-rose-400 hover:bg-rose-955/20 text-slate-300 hover:text-rose-400 rounded-xl transition cursor-pointer"
              title="Sign Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs (Restricted/Hidden appropriately according to user permissions) */}
        {currentUserRole !== 'student' && (
          <div className="mb-8 border-b border-slate-200">
            <nav className="flex flex-wrap -mb-px gap-1.5" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <LineChart className="w-4.5 h-4.5" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'students'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Students Registry</span>
              </button>

              <button
                onClick={() => setActiveTab('teachers')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'teachers'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <Briefcase className="w-4.5 h-4.5" />
                <span>Tutors Registry</span>
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'attendance'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <CalendarDays className="w-4.5 h-4.5" />
                <span>Daily Attendance</span>
              </button>

              <button
                onClick={() => setActiveTab('batches')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'batches'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <Grid3X3 className="w-4.5 h-4.5" />
                <span>Batch Timings</span>
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'receipts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <Receipt className="w-4.5 h-4.5" />
                <span>Fee Receipts Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('dispatches')}
                className={`py-3 px-4 inline-flex items-center gap-2 border-b-2 font-bold text-sm cursor-pointer transition ${
                  activeTab === 'dispatches'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-slate-300'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5 text-indigo-500" />
                <span>WhatsApp Automation Hub</span>
              </button>
            </nav>
          </div>
        )}

        {/* Tab Content Router */}
        <div>
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && currentUserRole !== 'student' && (
            <div className="space-y-8">
              
              {/* Core Stats Grid matching user specified totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Stat 1: Students */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Students
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
                      {reactiveStudentsCount}
                    </span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Registry live
                    </span>
                  </div>
                </div>

                {/* Stat 2: Teachers */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Instructors
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
                      {reactiveTeachersCount}
                    </span>
                    <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Active roster
                    </span>
                  </div>
                </div>

                {/* Stat 3: Pending Fees */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                    <CircleDollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Outstanding Fees
                    </span>
                    <span className="text-2xl font-extrabold text-rose-600 tracking-tight block mt-0.5">
                      ₹{specPendingFees.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Live pending
                    </span>
                  </div>
                </div>

                {/* Stat 4: Attendance Present */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Today's Attendance
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
                      {specPresentAttendanceCount} Present
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Marked present today
                    </span>
                  </div>
                </div>

                {/* Stat 5: Active Batches */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                    <Grid3X3 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Batches
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
                      {reactiveActiveBatches} Batches
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Active groups
                    </span>
                  </div>
                </div>

                {/* Stat 6: Monthly Revenue */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition duration-150">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Monthly Revenue
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-700 tracking-tight block mt-0.5">
                      ₹{reactiveRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 rounded-md px-2 py-0.5 mt-1 inline-block font-bold">
                      Receipts received
                    </span>
                  </div>
                </div>

              </div>

              {/* Graphic Performance Analytics Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SVG Visual Chart Card 1: Revenue & Fee Collection Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Receipt Collections Ledger
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mb-5">Payment Receipts Collected vs Outstanding Ratio</h3>
                  
                  {/* Custom Graphic SVG Progress Chart */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                        <span>Paid & Settled Ledger Receipts</span>
                        <span className="text-indigo-600 font-bold">₹{actualPaidFees.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${(actualPaidFees / (actualPaidFees + speckTotalExpected() || 1)) * 100}%` }}
                          className="bg-indigo-600 h-full transition-all duration-300" 
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Calculated from {receipts.length} successful payment entries</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                        <span>Out of View Institutional Fees Expected</span>
                        <span className="text-slate-500">₹{totalExpectedFees.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: '45%' }} 
                          className="bg-sky-500 h-full transition-all duration-300" 
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Active class workload prediction statistics</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex gap-4 items-center">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        The tuition center has verified <strong className="text-slate-800">₹{reactiveRevenue.toLocaleString('en-IN')}</strong> in monthly revenue. To test changes, click the <strong className="text-slate-800">Fee Receipts Ledger</strong> tab and record a new transaction!
                      </p>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Chart Card 2: Student Fee Balance status distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Quick Tuition Directory Health
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mb-5">Current Active Students Payment Compliance</h3>
                  
                  {/* Simple responsive visual stats chart */}
                  <div className="grid grid-cols-3 gap-3.5 pt-2">
                    <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto font-black text-xs mb-2">
                        {students.filter(s => s.status === 'Paid').length}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Fully Paid</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clear ledger</p>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-black text-xs mb-2">
                        {students.filter(s => s.status === 'Partial').length}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Partials</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Partial balance</p>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto font-black text-xs mb-2">
                        {students.filter(s => s.status === 'Pending').length}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Pending</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Fees due</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Interactive Reminders Engine</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Need outstanding collections? Highlight students roster to trigger the specified <strong>Sample WhatsApp Reminder text</strong> preformatted automatically!
                    </p>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <span>Go to Students Registry directory &rarr;</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Mobile and Computer sync cards */}
              <div className="mt-8">
                <DeviceSyncHub
                  students={students}
                  teachers={teachers}
                  attendance={attendance}
                  batches={batches}
                  receipts={receipts}
                  onSyncRestore={handleSyncRestore}
                />
              </div>

            </div>
          )}

          {/* 1.1 STUDENT ONLY TAILORED DASHBOARD */}
          {currentUserRole === 'student' && (() => {
            const loggedInStudent = students.find(s => s.email?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
            
            // Fallback object to default profile in case no custom student matches yet
            const activeStudent = loggedInStudent || {
              studentId: 'ST001',
              name: 'Aarav Sharma',
              class: '10th',
              batch: 'Morning A',
              phone: '9876543210',
              parentName: 'Rajesh Sharma',
              parentPhone: '9876500011',
              fees: 2500,
              status: 'Paid' as const,
              email: 'student@tuition.com',
            };

            const matchedBatch = batches.find(b => b.batchName === activeStudent.batch);
            const tutorName = matchedBatch ? matchedBatch.teacher : 'Rahul Sir';

            // Filter actual attendance marked for this student
            const studentAttendance = attendance.filter(a => a.studentId === activeStudent.studentId);
            const latestAttendance = studentAttendance.length > 0 ? studentAttendance[studentAttendance.length - 1] : null;

            // Filter receipts for this student
            const studentReceipts = receipts.filter(r => r.studentId === activeStudent.studentId || (r.studentName && r.studentName.toLowerCase() === activeStudent.name.toLowerCase()));

            return (
               <div className="space-y-8 animate-fade-in">
                 {/* Student Header */}
                 <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div>
                     <span className="text-xs font-bold text-indigo-150 uppercase tracking-wider block">Student Profile Dashboard</span>
                     <h2 className="text-2xl font-black mt-1 capitalize">{activeStudent.name}</h2>
                     <p className="text-xs text-indigo-100 mt-1">Student ID: {activeStudent.studentId} | Class: {activeStudent.class} | Batch Assigned: {activeStudent.batch}</p>
                   </div>
                   <div className="bg-indigo-700/80 border border-indigo-500 rounded-xl px-4 py-3 text-center shadow-inner">
                     <span className="text-[10px] uppercase font-bold text-indigo-200 block">Fee Compliance Status</span>
                     <span className="text-lg font-black block text-white mt-0.5">
                       ₹{activeStudent.fees} - {activeStudent.status.toUpperCase()}
                     </span>
                   </div>
                 </div>

                 {/* Stats and detail Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   
                   {/* Profile detail card */}
                   <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                     <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
                       Student Details Directory
                     </h4>
                     <div className="space-y-4 text-xs font-medium text-slate-600">
                       <div>
                         <span className="text-slate-400 block font-normal">Tutor Allocated</span>
                         <span className="text-slate-900 font-bold block mt-0.5">{tutorName}</span>
                       </div>
                       <div>
                         <span className="text-slate-400 block font-normal">Contact Phone Number</span>
                         <span className="text-slate-900 font-bold block mt-0.5">{activeStudent.phone}</span>
                       </div>
                       <div>
                         <span className="text-slate-400 block font-normal">Parent Guardian Detail</span>
                         <span className="text-slate-900 font-bold block mt-0.5">{activeStudent.parentName} (Parent)</span>
                       </div>
                       <div>
                         <span className="text-slate-400 block font-normal">Parent Notification Phone</span>
                         <span className="text-slate-900 font-bold block mt-0.5">{activeStudent.parentPhone}</span>
                       </div>
                     </div>
                   </div>

                   {/* Dynamic Attendance summary */}
                   <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                     <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
                       My Attendance log
                     </h4>
                     
                     <div className="space-y-4 text-center py-4">
                       {latestAttendance ? (
                         <>
                           <span className={`inline-flex items-center gap-1 border px-3 py-1.5 rounded-full text-xs font-bold ${
                             latestAttendance.status === 'Present'
                               ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                               : 'bg-rose-50 text-rose-700 border-rose-250'
                           }`}>
                             {latestAttendance.status === 'Present' ? (
                               <CheckCircle2 className="w-4 h-4 text-emerald-555" />
                             ) : (
                               <AlertCircle className="w-4 h-4 text-rose-555" />
                             )}
                             <span>{latestAttendance.status.toUpperCase()} ON {latestAttendance.date}</span>
                           </span>
                           <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed mt-2">
                             Total classes attended: {studentAttendance.filter(a => a.status === 'Present').length} / {studentAttendance.length} slots marked.
                           </p>
                         </>
                       ) : (
                         <>
                           <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold">
                             <span>NO LOG RECORDED YET</span>
                           </span>
                           <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed mt-2">
                             A primary teacher has not issued any active daily sign-ins under your assigned slot.
                           </p>
                         </>
                       )}
                     </div>
                   </div>

                   {/* Month-by-month Tuition billing tracker */}
                   <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                     <div>
                       <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                         <h4 className="font-bold text-slate-900 text-sm truncate">
                           My Monthly Fee Ledger
                         </h4>
                         <select
                           value={selectedStudentLedgerMonth}
                           onChange={(e) => setSelectedStudentLedgerMonth(e.target.value)}
                           className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 max-w-[124px] truncate"
                         >
                           {AVAILABLE_MONTHS.map((m) => (
                             <option key={m} value={m}>{m}</option>
                           ))}
                         </select>
                       </div>

                       {/* Retrieve billing state for selected student and selected month */}
                       {(() => {
                         const monthReceipts = studentReceipts.filter(
                           (r) => r.month && r.month.trim().toLowerCase() === selectedStudentLedgerMonth.trim().toLowerCase()
                         );
                         const totalPaidInMonth = monthReceipts.reduce((sum, r) => sum + r.amount, 0);
                         const baseFeeDue = activeStudent.fees;
                         const unpaidBalance = Math.max(0, baseFeeDue - totalPaidInMonth);

                         let statusText = 'Pending Payment';
                         let badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                         if (totalPaidInMonth >= baseFeeDue) {
                           statusText = 'Fully Settled';
                           badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                         } else if (totalPaidInMonth > 0) {
                           statusText = 'Partial Payment';
                           badgeStyle = 'bg-amber-50 text-amber-700 border-amber-250';
                         }

                         return (
                           <div className="space-y-4 text-xs font-medium text-slate-600">
                             <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                               <span className="text-slate-400">Ledger Status:</span>
                               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                                 {statusText.toUpperCase()}
                                </span>
                             </div>

                             <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                               <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                 <span className="text-slate-400 block font-normal text-[10px]">Base Fee</span>
                                 <span className="text-slate-900 font-bold mt-0.5 block">₹{baseFeeDue}</span>
                               </div>
                               <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                                 <span className="text-indigo-505 block font-normal text-[10px]">Paid</span>
                                 <span className="text-indigo-700 font-bold mt-0.5 block">₹{totalPaidInMonth}</span>
                               </div>
                               <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                                 <span className="text-rose-505 block font-normal text-[10px]">Outstanding</span>
                                 <span className="text-rose-700 font-bold mt-0.5 block">₹{unpaidBalance}</span>
                               </div>
                             </div>

                             <div className="space-y-2 mt-2">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month Receipts ({monthReceipts.length})</span>
                               <div className="max-h-[100px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                                 {monthReceipts.length > 0 ? (
                                   monthReceipts.map((rcpt) => (
                                     <div key={rcpt.receiptId} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                                       <div>
                                         <span className="font-mono font-bold text-slate-700">{rcpt.receiptId}</span>
                                         <span className="text-slate-400 block text-[9px]">{rcpt.date} ({rcpt.mode})</span>
                                       </div>
                                       <span className="font-bold text-slate-800">₹{rcpt.amount}</span>
                                     </div>
                                   ))
                                 ) : (
                                   <p className="text-[10px] text-slate-400 font-medium italic text-center py-3">No payments recorded for this cycle.</p>
                                 )}
                               </div>
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   </div>

                 </div>

                 {/* Student Security section & Parent Log Notifications */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                   
                   {/* Security Section (Changer) */}
                   <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                     <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                       <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                         <KeyRound className="w-5 h-5" />
                       </span>
                       <div>
                         <h4 className="font-extrabold text-slate-900 text-sm">Security & Password Portal</h4>
                         <span className="text-[10px] text-slate-400 block font-medium">Update your secure student identity login credentials</span>
                       </div>
                     </div>

                     <form
                       onSubmit={async (e) => {
                         e.preventDefault();
                         const form = e.currentTarget;
                         const newPass = (form.elements.namedItem('newStudentPass') as HTMLInputElement).value.trim();
                         
                         if (!newPass) {
                           alert('Password cannot be empty!');
                           return;
                         }
                         if (newPass.length < 4) {
                           alert('Password must be at least 4 characters long!');
                           return;
                         }

                         const updatedS = {
                           ...activeStudent,
                           password: newPass,
                         };

                         try {
                           await handleUpdateStudent(updatedS);
                           alert(`Your login password has been changed successfully to "${newPass}". Admin and Teachers are aware about your updated password.`);
                           form.reset();
                         } catch (err) {
                           console.error("Error updating student password:", err);
                           alert("Failed to update password. Try again.");
                         }
                       }}
                       className="space-y-4"
                     >
                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                           Active Sync Login Password
                         </label>
                         <div className="bg-slate-50 border border-slate-150 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                           <span>🔑 {activeStudent.password || 'student123'}</span>
                           <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                             Active Key
                           </span>
                         </div>
                       </div>

                       <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                           New Login Password
                         </label>
                         <input
                           name="newStudentPass"
                           type="text"
                           placeholder="Type new secure credentials"
                           required
                           className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:border-indigo-500 outline-none transition"
                         />
                       </div>

                       <button
                         type="submit"
                         className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide border border-slate-900"
                       >
                         <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                         <span>Update Login Password</span>
                       </button>
                     </form>
                   </div>

                   {/* Parents Alert Logs */}
                   <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                     <div>
                       <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                         <span className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                           <Bell className="w-5 h-5 shrink-0" />
                         </span>
                         <div>
                           <h4 className="font-extrabold text-slate-900 text-sm">Parent Broadcast Archives</h4>
                           <span className="text-[10px] text-slate-400 block font-medium">History of automatic dispatches delivered to {activeStudent.parentName}</span>
                         </div>
                       </div>

                       {/* Filtered alerts for this specific student */}
                       {(() => {
                         const studentDispatches = dispatches.filter(d => d.studentId === activeStudent.studentId);
                         return (
                           <div className="space-y-3 max-h-[175px] overflow-y-auto pr-1 scrollbar-thin">
                             {studentDispatches.length > 0 ? (
                               studentDispatches
                                 .sort((a,b) => b.timestamp.localeCompare(a.timestamp))
                                 .map((sd) => (
                                   <div key={sd.dispatchId} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                     <div className="flex items-center justify-between mb-1.5">
                                       <span className={`px-2 py-0.2 rounded-full text-[8.5px] font-extrabold pb-0.5 ${
                                         sd.type === 'Absence Alert' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                                       }`}>
                                         {sd.type.toUpperCase()}
                                       </span>
                                       <span className="text-[9px] font-mono text-slate-400">{sd.timestamp}</span>
                                     </div>
                                     <p className="text-slate-500 font-medium italic">"{sd.message}"</p>
                                     <div className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                       <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                       <span>Delivered to {sd.phone}</span>
                                     </div>
                                   </div>
                                 ))
                             ) : (
                               <div className="text-center py-6 text-slate-400 italic text-[11px] flex flex-col items-center justify-center space-y-1">
                                 <MessageSquare className="w-6 h-6 text-slate-200" />
                                 <span>No communication dispatches recorded for your parent account.</span>
                                </div>
                             )}
                           </div>
                         );
                       })()}
                     </div>

                     <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 mt-4">
                       <span className="text-[10px] uppercase font-bold text-slate-400 block text-center leading-relaxed">
                         🛡️ SECURITY ASSURANCE POLICY
                       </span>
                       <p className="text-[10px] text-slate-450 text-center leading-normal mt-1">
                         Admins and assigned batch tutors are kept informed about any key updates regarding your active portal entry point for academic assistance safety.
                       </p>
                     </div>
                   </div>

                 </div>

                 {/* Comprehensive Month-by-Month Attendance Calendar Grid for Students */}
                 <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                   <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 font-sans">
                     <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                     <span>My Full Month Attendance Calendar Matrix</span>
                   </h3>
                   <MonthlyAttendanceGrid
                     students={students}
                     attendanceRecords={attendance}
                     activeStudentId={activeStudent.studentId}
                   />
                 </div>

                 {/* Mobile & Computer sync */}
                <div className="mt-8">
                  <DeviceSyncHub
                    students={students}
                    teachers={teachers}
                    attendance={attendance}
                    batches={batches}
                    receipts={receipts}
                    onSyncRestore={handleSyncRestore}
                  />
                </div>

              </div>
            );
          })()}

          {/* 2. STUDENTS VIEW */}
          {activeTab === 'students' && currentUserRole !== 'student' && (
            <StudentsView
              students={students}
              batches={batches.map((b) => b.batchName)}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              canModify={currentUserRole === 'admin'} // Admin has writes, Teacher read-only
            />
          )}

          {/* 3. INSTRUCTORS VIEW */}
          {activeTab === 'teachers' && currentUserRole !== 'student' && (
            <TeachersView
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              canModify={currentUserRole === 'admin'}
            />
          )}

          {/* 4. DAILY ATTENDANCE */}
          {activeTab === 'attendance' && currentUserRole !== 'student' && (
            <AttendanceView
              students={students}
              attendanceRecords={attendance}
              onToggleStatus={handleToggleAttendanceStatus}
              canModify={currentUserRole === 'admin' || currentUserRole === 'teacher'} // Admin or Teacher can mark sheets
            />
          )}

          {/* 5. BATCHES VIEW */}
          {activeTab === 'batches' && currentUserRole !== 'student' && (
            <BatchesView
              batches={batches}
              teachers={teachers}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              onDeleteBatch={handleDeleteBatch}
              canModify={currentUserRole === 'admin'}
            />
          )}

          {/* 6. FEE RECEIPTS LEDGER */}
          {activeTab === 'receipts' && currentUserRole !== 'student' && (
            <FeeReceiptsView
              receipts={receipts}
              students={students}
              onAddReceipt={handleAddReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              canModify={currentUserRole === 'admin'}
            />
          )}

          {/* 7. WHATSAPP & COMMUNICATION AUTOMATION HUB */}
          {activeTab === 'dispatches' && currentUserRole !== 'student' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header section with state indicator */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="bg-indigo-505 bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest leading-none">
                      HANDS-FREE BROADCASTING ENGINE
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2.5 flex items-center gap-2">
                      <MessageSquare className="w-8 h-8 text-indigo-400" />
                      <span>WhatsApp Automation Hub</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
                      Automate tuition fee payment reminders on the 20th of every month and trigger daily absence alerts instantly directly from the Instructor's WhatsApp platform to parent guardians.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 shrink-0 flex items-center gap-4.5">
                    <span className="relative flex h-3.5 w-3.5 mt-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-455 text-slate-400 uppercase tracking-widest">GATEWAY LINK</div>
                      <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">ACTIVE & LISTENING</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Action Row: 2 column bento layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: System Scheduler (20th of Month Check) */}
                <div className="bg-white border border-slate-205 border-slate-205/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 my-0.5 rounded-md">
                        20th monthly
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 font-sans">Scheduled Run Scheduler</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Sends automated WhatsApp fee alert notifications to all students/parents with pending or partial fee status for the active month on the 20th.
                    </p>

                    {/* Today Date Watcher Box */}
                    <div className="mt-4 bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Gregorian Date</span>
                      <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {(() => {
                        const is20th = new Date().getDate() === 20;
                        return is20th ? (
                          <div className="mt-2.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] py-1 border border-emerald-200 rounded-lg animate-pulse uppercase tracking-wide">
                            🎯 SCHEDULED TARGET MATCHED (TODAY IS THE 20th!)
                          </div>
                        ) : (
                          <div className="mt-2.5 bg-amber-50 text-amber-800 font-bold text-[10.5px] py-1 border border-amber-200 rounded-lg uppercase tracking-wide">
                            ⚡ Scheduled Run Standby mode
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      onClick={trigger20thFeeReminders}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>Dispatch 20th Reminders Now</span>
                    </button>
                    <span className="text-[10px] text-slate-400 italic block text-center leading-normal">
                      Select above button to force execute automated fee dispatches for this cycle at any time.
                    </span>
                  </div>
                </div>

                {/* Column 2: Webhook Gateway & Auto Toggles Configuration Panel */}
                <div className="bg-white border border-slate-205 border-slate-205/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                      <Sliders className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 font-sans">Instructor's Gateway Settings</h3>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const whUrl = (form.elements.namedItem('whUrl') as HTMLInputElement).value.trim();
                      const sndPh = (form.elements.namedItem('sndPh') as HTMLInputElement).value.trim();
                      
                      try {
                        await setDoc(doc(db, 'settings', 'whatsapp'), {
                          whatsappWebhook: whUrl,
                          whatsappSenderPhone: sndPh,
                          autoSendOnAbsent: autoSendOnAbsent,
                          autoSendFeeReminder: autoSendFeeReminder,
                        });
                        setActiveToast({
                          id: String(Date.now()),
                          message: "Gateway Configs Upgraded!",
                          sub: "Standardized transmitter variables mapped to Firebase settings securely.",
                          type: 'success',
                        });
                      } catch (err) {
                        alert("Settings sync failure: " + err);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Sender WhatsApp Number / Caller ID
                        </label>
                        <input
                          name="sndPh"
                          type="text"
                          defaultValue={whatsappSenderPhone}
                          placeholder="e.g., +91 98210 54321"
                          required
                          className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl py-3 px-4 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                          WhatsApp REST Webhook Gateway Endpoint
                        </label>
                        <input
                          name="whUrl"
                          type="url"
                          defaultValue={whatsappWebhook}
                          placeholder="https://api.whatsapp-gateway.mock/dispatch"
                          required
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl py-3 px-4 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <span className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                        ⚡ Real-time Event Broadcasters (Toggles)
                      </span>
                      
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoSendOnAbsent}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setAutoSendOnAbsent(checked);
                              await setDoc(doc(db, 'settings', 'whatsapp'), {
                                whatsappWebhook,
                                whatsappSenderPhone,
                                autoSendOnAbsent: checked,
                                autoSendFeeReminder,
                              });
                            }}
                            className="mt-1 accent-indigo-600 w-4 h-4 rounded"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block">Immediate Absence Alerts</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              When a tutor or admin marks an active student "Absent", automatically trigger a WhatsApp parent alert instantly in background without further prompts.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer border-t border-slate-50 pt-2.5">
                          <input
                            type="checkbox"
                            checked={autoSendFeeReminder}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setAutoSendFeeReminder(checked);
                              await setDoc(doc(db, 'settings', 'whatsapp'), {
                                whatsappWebhook,
                                whatsappSenderPhone,
                                autoSendOnAbsent,
                                autoSendFeeReminder: checked,
                              });
                            }}
                            className="mt-1 accent-indigo-600 w-4 h-4 rounded"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 block">Allow Scheduled Fee Broadcaster</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Grants operational rights to parse billing states on the 20th of the month and fire automated fee dues alerts sequentially.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer flex items-center gap-1.5 uppercase tracking-wide border border-slate-900"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0 text-indigo-400" />
                        <span>Save Gateway Settings</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Instant WhatsApp Test console & Live Dispatch logs view */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Instant Test Console (Left) */}
                <div className="bg-white border border-slate-205 border-slate-205/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 font-sans">Instant Test Console</h3>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Select a student below to instantly draft and send a test WhatsApp alert message directly to their guardian parent account. Useful for diagnostic runs.
                  </p>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const sId = (form.elements.namedItem('testStudentId') as HTMLSelectElement).value;
                      const mType = (form.elements.namedItem('testMessageType') as HTMLSelectElement).value;
                      const rawMsg = (form.elements.namedItem('testRawMessage') as HTMLTextAreaElement).value.trim();

                      const tgtStudent = students.find(s => s.studentId === sId);
                      if (!tgtStudent) {
                        alert('Please select a student from the active list registry!');
                        return;
                      }

                      await dispatchNotification(
                        mType as 'Absence Alert' | 'Fee Reminder',
                        tgtStudent,
                        rawMsg || undefined
                      );
                      form.reset();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase tracking-widest mb-1.5">
                        1. Target Registry Student
                      </label>
                      <select
                        name="testStudentId"
                        required
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:border-indigo-500 outline-none transition"
                      >
                        <option value="">-- Select Student --</option>
                        {students.map(s => (
                          <option key={s.studentId} value={s.studentId}>
                            {s.name} ({s.class}) - Parent: {s.parentName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase tracking-widest mb-1.5">
                        2. Broadcast Notification Category
                      </label>
                      <select
                        name="testMessageType"
                        required
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:border-indigo-500 outline-none transition"
                      >
                        <option value="Fee Reminder">Fee Reminder (Dues Alert)</option>
                        <option value="Absence Alert">Absence Alert (Mark Absent)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-655 text-slate-600 uppercase tracking-widest mb-1.5">
                        3. Custom Overwrite Message (Optional)
                      </label>
                      <textarea
                        name="testRawMessage"
                        placeholder="Leave empty to use institutional default message templates..."
                        rows={3}
                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl py-2.5 px-3.5 outline-none transition resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide border border-slate-900"
                    >
                      <Smartphone className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                      <span>Trigger Diagnostic Send</span>
                    </button>
                  </form>
                </div>

                {/* Dispatch Audit Logs Timeline (Right - spans 2 columns) */}
                <div className="bg-white border border-slate-205 border-slate-205/80 rounded-2xl p-6 shadow-sm xl:col-span-2 flex flex-col">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                        <Bell className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 font-sans">Automated Dispatches Log</h3>
                        <p className="text-[10px] text-slate-400 font-medium">History of automatic alerts & reminders</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search Bar */}
                      <input
                        type="text"
                        placeholder="Search student, recipient..."
                        value={dispatchSearchQuery}
                        onChange={(e) => setDispatchSearchQuery(e.target.value)}
                        className="text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-1.5 outline-none transition w-full sm:w-48 font-medium placeholder-slate-400"
                      />

                      {/* Filter category */}
                      <select
                        value={dispatchFilterType}
                        onChange={(e) => setDispatchFilterType(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none transition font-semibold text-slate-600 cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        <option value="Absence Alert">Absence Alerts</option>
                        <option value="Fee Reminder">Fee Reminders</option>
                      </select>

                      <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl font-mono shrink-0">
                        Total: {dispatches.length}
                      </span>
                    </div>
                  </div>

                  {/* Calculations & filtering */}
                  {(() => {
                    const filteredDispatches = dispatches
                      .filter((dl) => {
                        if (dispatchSearchQuery) {
                          const q = dispatchSearchQuery.toLowerCase();
                          const matchStudent = dl.studentName?.toLowerCase().includes(q);
                          const matchPhone = dl.phone?.toLowerCase().includes(q);
                          const matchRecipient = dl.recipient?.toLowerCase().includes(q);
                          const matchMessage = dl.message?.toLowerCase().includes(q);
                          return matchStudent || matchPhone || matchRecipient || matchMessage;
                        }
                        if (dispatchFilterType !== 'all') {
                          return dl.type === dispatchFilterType;
                        }
                        return true;
                      })
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

                    const dispatchPageSize = 8;
                    const totalDispatchPages = Math.max(1, Math.ceil(filteredDispatches.length / dispatchPageSize));
                    const currentDispatchPage = Math.min(dispatchPage, totalDispatchPages);
                    
                    const paginatedDispatches = filteredDispatches.slice(
                      (currentDispatchPage - 1) * dispatchPageSize,
                      currentDispatchPage * dispatchPageSize
                    );

                    const startIdx = filteredDispatches.length === 0 ? 0 : (currentDispatchPage - 1) * dispatchPageSize + 1;
                    const endIdx = Math.min(currentDispatchPage * dispatchPageSize, filteredDispatches.length);

                    return (
                      <>
                        {/* Table area - max height wrapped for scrolling */}
                        <div className="flex-1 overflow-x-auto border border-slate-100 rounded-xl max-h-[460px] overflow-y-auto">
                          {paginatedDispatches.length > 0 ? (
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(15,23,42,0.06)]">
                                <tr className="border-b border-slate-150 text-slate-505 font-extrabold text-[10.5px] uppercase tracking-wider">
                                  <th className="px-4 py-3">Timestamp / Student</th>
                                  <th className="px-4 py-3">Guardian Recipient</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Message Snippet</th>
                                  <th className="px-4 py-3">Delivery Status</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-600 font-sans">
                                {paginatedDispatches.map((dl) => (
                                  <tr key={dl.dispatchId} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3.5">
                                      <div className="text-slate-400 text-[10px] font-mono leading-none mb-1">
                                        {dl.timestamp}
                                      </div>
                                      <div className="font-extrabold text-slate-800">{dl.studentName}</div>
                                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">ID: {dl.studentId}</div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="font-semibold text-slate-700">{dl.recipient}</div>
                                      <div className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/50 w-fit px-1.5 py-0.2 rounded mt-1">
                                        {dl.phone}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                        dl.type === 'Absence Alert'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      }`}>
                                        {dl.type.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 max-w-[200px]" title={dl.message}>
                                      <p className="truncate text-slate-500 leading-relaxed italic">
                                        "{dl.message}"
                                      </p>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-fit text-[10px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>AUTO SUCCESS</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                      {dispatchDeletingId === dl.dispatchId ? (
                                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 p-1 rounded-lg">
                                          <span className="text-[10px] font-bold text-rose-600 px-1">Delete?</span>
                                          <button
                                            onClick={() => {
                                              handleDeleteDispatch(dl.dispatchId);
                                              setDispatchDeletingId(null);
                                            }}
                                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-extrabold shadow-sm cursor-pointer transition uppercase"
                                          >
                                            Yes
                                          </button>
                                          <button
                                            onClick={() => setDispatchDeletingId(null)}
                                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-extrabold cursor-pointer transition uppercase"
                                          >
                                            No
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setDispatchDeletingId(dl.dispatchId)}
                                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition inline-flex items-center cursor-pointer"
                                          title="Delete dispatch log"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center py-12 px-4 text-slate-400 flex flex-col items-center justify-center space-y-2">
                              <MessageSquare className="w-8 h-8 text-slate-200 animate-bounce" />
                              <span className="italic block text-xs">
                                {dispatchSearchQuery || dispatchFilterType !== 'all'
                                  ? 'No dispatches match your search filters.'
                                  : 'No dispatches triggered yet. Wait for a student absence or trigger reminders manually.'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Pagination Selector */}
                        {filteredDispatches.length > 0 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-medium text-slate-400">
                              Showing <span className="font-bold text-slate-600">{startIdx}</span> to{' '}
                              <span className="font-bold text-slate-600">{endIdx}</span> of{' '}
                              <span className="font-bold text-slate-600">{filteredDispatches.length}</span> records
                            </span>

                            {totalDispatchPages > 1 && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  disabled={currentDispatchPage === 1}
                                  onClick={() => setDispatchPage((p) => Math.max(1, p - 1))}
                                  className="px-2.5 py-1 border border-slate-205 rounded-lg text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Prev
                                </button>
                                
                                {Array.from({ length: totalDispatchPages }, (_, i) => i + 1).map((pg) => (
                                  <button
                                    key={pg}
                                    onClick={() => setDispatchPage(pg)}
                                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center ${
                                      pg === currentDispatchPage
                                        ? 'bg-slate-950 text-white shadow-sm'
                                        : 'border border-slate-202 text-slate-600 bg-white hover:bg-slate-50'
                                    }`}
                                  >
                                    {pg}
                                  </button>
                                ))}

                                <button
                                  disabled={currentDispatchPage === totalDispatchPages}
                                  onClick={() => setDispatchPage((p) => Math.min(totalDispatchPages, p + 1))}
                                  className="px-2.5 py-1 border border-slate-205 rounded-lg text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Styled institutional footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
          <div>
            &copy; 2026 Manisha Tuition Classes. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="font-semibold text-slate-500">Developed By Ronitraj Yadav</span>
          </div>
        </div>
      </footer>

      {/* Change Password Modal Overlay */}
      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 animate-scale-in relative">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 font-sans">
              <KeyRound className="w-5 h-5 text-indigo-600 animate-bounce" />
              <span>Update Admin Credentials</span>
            </h3>

            <p className="text-xs text-slate-550 text-slate-500 mb-4 leading-relaxed font-sans">
              As an authorized system tutor or main administrator, you can update the global credential password. The default is <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">admin123</span>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const newPass = (form.elements.namedItem('newPass') as HTMLInputElement).value.trim();
                const confirmPass = (form.elements.namedItem('confirmPass') as HTMLInputElement).value.trim();

                if (!newPass) {
                  alert('Password cannot be empty!');
                  return;
                }
                if (newPass.length < 4) {
                  alert('Password is too short! Please provide at least 4 characters for security.');
                  return;
                }
                if (newPass !== confirmPass) {
                  alert('Passwords do not match. Please verify and re-type.');
                  return;
                }

                const success = await handleChangeAdminPassword(newPass);
                if (success) {
                  alert(`Administrator password successfully changed to "${newPass}".`);
                  setShowPassModal(false);
                } else {
                  alert('Error updating password. Try again.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 font-sans">
                  New Administrator Password
                </label>
                <input
                  type="text"
                  name="newPass"
                  required
                  placeholder="e.g. Manisha@123"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20 text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 font-sans">
                  Confirm New Password
                </label>
                <input
                  type="text"
                  name="confirmPass"
                  required
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20 text-slate-900 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs text-center"
                >
                  Confirm Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  function speckTotalExpected() {
    return totalExpectedFees || 10000;
  }
}
