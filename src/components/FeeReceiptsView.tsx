import React, { useState } from 'react';
import { FeeReceipt, Student } from '../types';
import { Search, Plus, Printer, Check, CreditCard, Landmark, Wallet, X, GraduationCap, Trash2, Calendar, AlertTriangle, Send } from 'lucide-react';

export const AVAILABLE_MONTHS = [
  'January 2026',
  'February 2026',
  'March 2026',
  'April 2026',
  'May 2026',
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026'
];

interface FeeReceiptsViewProps {
  receipts: FeeReceipt[];
  students: Student[];
  onAddReceipt: (receipt: FeeReceipt) => void;
  onDeleteReceipt?: (receiptId: string) => void;
  canModify: boolean;
}

export default function FeeReceiptsView({
  receipts,
  students,
  onAddReceipt,
  onDeleteReceipt,
  canModify,
}: FeeReceiptsViewProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toggle for WhatsApp reminders center
  const [showReminderBroadcaster, setShowReminderBroadcaster] = useState(false);

  // Dynamic Ledger Month selection
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState('June 2026');

  // Form states
  const [formStudent, setFormStudent] = useState('');
  const [formAmount, setFormAmount] = useState(2500);
  const [formMode, setFormMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [formDate, setFormDate] = useState('08-Jun-2026'); // Pre-set based on current local time
  const [formMonth, setFormMonth] = useState('June 2026');

  const filteredReceipts = receipts.filter((r) => {
    return (
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.receiptId.toLowerCase().includes(search.toLowerCase()) ||
      r.mode.toLowerCase().includes(search.toLowerCase()) ||
      (r.month && r.month.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleOpenAddForm = (studentId?: string, forceMonth?: string) => {
    const targetStudent = studentId ? students.find(s => s.studentId === studentId) : students[0];
    setFormStudent(targetStudent?.name || 'Priya Patel');
    setFormAmount(targetStudent?.fees || 2500);
    setFormMode('UPI');
    setFormDate('08-Jun-2026');
    setFormMonth(forceMonth || selectedLedgerMonth || 'June 2026');
    setShowForm(true);
  };

  const handleStudentChange = (studentName: string) => {
    setFormStudent(studentName);
    const matched = students.find((s) => s.name === studentName);
    if (matched) {
      setFormAmount(matched.fees);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent || !formAmount) {
      alert('Student and Amount are required!');
      return;
    }

    // Generate R00x ID
    const numericIds = receipts
      .map((r) => parseInt(r.receiptId.replace('R', '')))
      .filter((id) => !isNaN(id));
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const newId = `R${String(nextNum).padStart(3, '0')}`;

    const matchStudent = students.find((s) => s.name === formStudent);

    const newReceipt: FeeReceipt = {
      receiptId: newId,
      studentName: formStudent,
      studentId: matchStudent?.studentId || 'ST001',
      amount: Number(formAmount),
      date: formDate,
      mode: formMode,
      month: formMonth,
    };

    onAddReceipt(newReceipt);
    setShowForm(false);
  };

  const getModeIcon = (mode: 'UPI' | 'Cash' | 'Card') => {
    switch (mode) {
      case 'UPI':
        return <Landmark className="w-4 h-4 text-purple-600" />;
      case 'Card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'Cash':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Derive Monthly Ledger Data
  const studentLedgerData = students.map((s) => {
    // Collect all receipts for this student for the selected month representational ledger
    const monthReceipts = receipts.filter(
      (r) =>
        (r.studentId === s.studentId || r.studentName.toLowerCase() === s.name.toLowerCase()) &&
        (r.month && r.month.trim().toLowerCase() === selectedLedgerMonth.trim().toLowerCase())
    );

    const amountPaidInMonth = monthReceipts.reduce((sum, r) => sum + r.amount, 0);
    const feeDue = s.fees;

    let monthStatusFlag: 'Paid' | 'Pending' | 'Partial' = 'Pending';
    if (amountPaidInMonth >= feeDue) {
      monthStatusFlag = 'Paid';
    } else if (amountPaidInMonth > 0) {
      monthStatusFlag = 'Partial';
    }

    return {
      student: s,
      amountPaidInMonth,
      feeDue,
      status: monthStatusFlag,
    };
  });

  // Calculate stats for current selected month ledger
  const ledgerTotalDue = studentLedgerData.reduce((sum, item) => sum + item.feeDue, 0);
  const ledgerTotalPaid = studentLedgerData.reduce((sum, item) => sum + item.amountPaidInMonth, 0);
  const ledgerOutstanding = Math.max(0, ledgerTotalDue - ledgerTotalPaid);
  const ledgerPaidCount = studentLedgerData.filter((item) => item.status === 'Paid').length;
  const ledgerTotalCount = studentLedgerData.length;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipts or students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {canModify && (
          <button
            onClick={handleOpenAddForm}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* 🗓️ MONTHLY FEE STATUS MATRIX SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight font-sans flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Monthly Student Fee Status Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans font-medium">
              Tracks individual monthly billing iterations dynamically. Revised automatically from recorded payment receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowReminderBroadcaster(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Click to generate 20th of the month WhatsApp parent reminders for pending students"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast 20th Reminders</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Active Month:</span>
              <select
                value={selectedLedgerMonth}
                onChange={(e) => setSelectedLedgerMonth(e.target.value)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {AVAILABLE_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Ledger Summary Bento Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Tuition Fees</span>
            <span className="text-lg font-extrabold text-slate-800 mt-1">₹{ledgerTotalDue.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 mt-1 font-sans">{ledgerTotalCount} registered students</span>
          </div>
          <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Fees Collected ({selectedLedgerMonth})</span>
            <span className="text-lg font-extrabold text-emerald-800 mt-1">₹{ledgerTotalPaid.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-600 mt-1 font-sans">{ledgerPaidCount} fully settled</span>
          </div>
          <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Outstanding Outstanding</span>
            <span className="text-lg font-extrabold text-rose-800 mt-1">₹{ledgerOutstanding.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-rose-600 mt-1 font-sans">Needs month revision follow-up</span>
          </div>
        </div>

        {/* Mini Student-Month ledger grid flow */}
        <div className="border border-slate-100 rounded-xl overflow-hidden text-xs bg-slate-50/30">
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-150 p-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            <div className="col-span-4 sm:col-span-5">Student Details</div>
            <div className="col-span-3 sm:col-span-2 text-right">Fee Due</div>
            <div className="col-span-3 sm:col-span-2 text-right">Amount Paid</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          <div className="divide-y divide-slate-100">
            {studentLedgerData.length > 0 ? (
              studentLedgerData.map((item) => (
                <div key={item.student.studentId} className="grid grid-cols-12 p-3 items-center hover:bg-white bg-white/40 transition">
                  <div className="col-span-4 sm:col-span-5 pr-2">
                    <div className="text-xs truncate font-bold text-slate-900">{item.student.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">Class {item.student.class} • {item.student.batch}</div>
                  </div>
                  
                  <div className="col-span-3 sm:col-span-2 text-right font-bold text-slate-550 text-slate-650">
                    ₹{item.feeDue.toLocaleString('en-IN')}
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right font-bold text-slate-900">
                    ₹{item.amountPaidInMonth.toLocaleString('en-IN')}
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    {item.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 text-[10px] font-bold">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Paid</span>
                      </span>
                    ) : item.status === 'Partial' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 text-[10px] font-bold">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                        <span>Partial</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100 text-[10px] font-bold">
                        <span className="w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {canModify && item.status !== 'Paid' ? (
                      <button
                        onClick={() => handleOpenAddForm(item.student.studentId, selectedLedgerMonth)}
                        className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white border border-indigo-150 text-indigo-700 tracking-tight rounded-lg text-[10px] font-bold cursor-pointer transition"
                        title={`Record ${selectedLedgerMonth} payment`}
                      >
                        Record
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">-</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 font-semibold">
                No students enrolled currently.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historical Payment Receipts Ledger</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Receipt ID</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Billing Month</th>
              <th className="px-6 py-4">Received On</th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4 text-right">Amount Received</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {filteredReceipts.length > 0 ? (
              filteredReceipts.map((r) => (
                <tr key={r.receiptId} className="hover:bg-slate-50/40 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded text-xs border border-slate-200">
                      {r.receiptId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-905">{r.studentName}</span>
                    {r.studentId && (
                      <span className="text-[11px] text-slate-400 block font-mono">
                        ID: {r.studentId}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold dark:bg-indigo-950 dark:text-indigo-300 text-xs text-indigo-750 text-indigo-700 bg-indigo-50 border border-indigo-120 border-indigo-100">
                      {r.month || 'June 2026'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{r.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      {getModeIcon(r.mode)}
                      <span className="font-semibold text-xs tracking-wider uppercase">
                        {r.mode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{r.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                   <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-2">
                       {deletingId === r.receiptId ? (
                         <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 py-1 px-2 rounded-lg animate-fade-in">
                           <span className="text-[11px] font-bold text-rose-700">Delete?</span>
                           <button
                             onClick={() => {
                               if (onDeleteReceipt) {
                                 onDeleteReceipt(r.receiptId);
                               }
                               setDeletingId(null);
                             }}
                             className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 transition cursor-pointer"
                           >
                             Yes
                           </button>
                           <button
                             onClick={() => setDeletingId(null)}
                             className="px-2 py-0.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                           >
                             No
                           </button>
                         </div>
                       ) : (
                         <>
                           <button
                             onClick={() => setSelectedReceipt(r)}
                             className="p-1 px-3 border border-slate-200 text-slate-550 hover:text-indigo-600 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer transition inline-flex items-center gap-1"
                           >
                             <Printer className="w-3.5 h-3.5" />
                             <span>View</span>
                           </button>

                           {canModify && onDeleteReceipt && (
                             <button
                               onClick={() => setDeletingId(r.receiptId)}
                               className="p-1.5 border border-rose-150 hover:border-rose-350 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                               title="Delete Receipt Log"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                         </>
                       )}
                     </div>
                   </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No fee receipts recorded in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer Mode for adding receipt */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white rounded-l-2xl w-full max-w-md h-full shadow-2xl border-l border-slate-100 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                Log New Fee Payment
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Select Student
                </label>
                <select
                  value={formStudent}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {students.map((s) => (
                    <option key={s.studentId} value={s.name}>
                      {s.name} ({s.class} Class - {s.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Billing Month Tracked
                </label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                    placeholder="e.g. 08-Jun-2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as 'UPI' | 'Cash' | 'Card')}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Card">POS Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-xs text-center"
                >
                  Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official invoice popup */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header banner */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span className="font-bold tracking-tight text-sm">Manisha Tuition Classes</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Slip Content */}
            <div className="p-8 space-y-6">
              <div className="text-center font-sans">
                <h4 className="font-extrabold text-xl text-slate-950 uppercase tracking-wider">
                  Payment Receipt
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Tuition Center Primary Copies
                </p>
              </div>

              <div className="h-px border-t border-dashed border-slate-300 my-4" />

              <div className="space-y-2.5 text-sm text-slate-755">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Receipt Identifier:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-903">{selectedReceipt.studentName}</span>
                </div>
                {selectedReceipt.studentId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Student ID:</span>
                    <span className="font-mono text-slate-700">{selectedReceipt.studentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Billing Month:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg text-xs leading-none border border-indigo-100/60">{selectedReceipt.month || 'June 2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Receipt Date:</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Payment Mode:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.mode}</span>
                </div>
              </div>

              <div className="h-px border-t border-dashed border-slate-300 my-4" />

              {/* Total amount strip */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Amount Received</span>
                <span className="text-xl font-extrabold text-indigo-800">
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Verified seal */}
              <div className="flex justify-center items-center gap-1.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 rounded-xl">
                 <Check className="w-3.5 h-3.5" />
                 <span>Transaction Logged & Settled</span>
              </div>
            </div>

            {/* Footer with simulation buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex justify-center items-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📢 20th OF MONTH WHATSAPP REMINDER BROADCASTER MODAL */}
      {showReminderBroadcaster && (
        <div id="reminder-broadcaster-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <h3 className="font-extrabold text-lg">20th of Month Parent Reminder Broadcast</h3>
              </div>
              <button
                onClick={() => setShowReminderBroadcaster(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description banner */}
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-900 flex gap-3 items-start">
              <span className="text-base shrink-0">💡</span>
              <div>
                <p className="font-bold text-indigo-950">Direct Parent WhatsApp Routing (Instructor's Mobile)</p>
                <p className="text-indigo-800 mt-1">
                  Below is the roster of parents of students with **unpaid or partial fee balances** for <strong>{selectedLedgerMonth}</strong>.
                  According to instruction guidance, you can send personalized alerts directly on the 20th day of the month via WhatsApp of the instructor's mobile number.
                </p>
              </div>
            </div>

            {/* Roster list */}
            <div className="p-6 overflow-y-auto space-y-4">
              {(() => {
                const pendingList = studentLedgerData.filter(item => item.status === 'Pending' || item.status === 'Partial');
                
                if (pendingList.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <span className="text-3xl">🎉</span>
                      <h4 className="font-bold text-slate-800 text-sm">Perfect Fee Compliance!</h4>
                      <p className="text-xs text-slate-400">All student ledger iterations for {selectedLedgerMonth} are fully settled.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Dues Pending: {pendingList.length} Parents to alert
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                      {pendingList.map((item) => {
                        const dueAmount = item.feeDue - item.amountPaidInMonth;
                        
                        // Construct personalized WhatsApp message
                        const customMsg = `Hello ${item.student.parentName},

This is a reminder from Manisha Tuition Classes on the 20th of the month.
The tuition fee balance of ₹${dueAmount.toLocaleString('en-IN')} for ${item.student.name} for the month of ${selectedLedgerMonth} is currently pending.

Kindly complete payment at your earliest convenience using UPI/Cash options.

Regards,
Instructor
Manisha Tuition Classes`;

                        const cleanPhone = item.student.parentPhone.replace(/[^0-9]/g, '');
                        const prefix = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                        const waLink = `https://api.whatsapp.com/send?phone=${prefix}&text=${encodeURIComponent(customMsg)}`;

                        return (
                          <div key={item.student.studentId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20 hover:bg-slate-50/70 transition">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{item.student.name}</span>
                                <span className="text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md">
                                  Class {item.student.class} • {item.student.batch}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-0.5">
                                <p className="font-semibold text-slate-600">Parent: <strong className="text-slate-800">{item.student.parentName}</strong> ({item.student.parentPhone})</p>
                                <p className="text-[11px] font-extrabold text-rose-600">Dues Outstanding: ₹{dueAmount.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">(Base fee ₹{item.feeDue})</span></p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowReminderBroadcaster(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
