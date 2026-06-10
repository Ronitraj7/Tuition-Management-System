import React, { useState } from 'react';
import { Student } from '../types';
import { Search, UserPlus, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, Send, X } from 'lucide-react';
import ReminderModal from './ReminderModal';

const STANDARD_CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const SUBJECT_OPTIONS = ['All Subjects', 'English', 'Hindi', 'Marathi', 'Geography', 'History', 'Science', 'Maths'];

interface StudentsViewProps {
  students: Student[];
  batches: string[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  canModify: boolean;
}

export default function StudentsView({
  students,
  batches,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  canModify,
}: StudentsViewProps) {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Form states for adding or editing
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formBatch, setFormBatch] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formFees, setFormFees] = useState(2000);
  const [formStatus, setFormStatus] = useState<'Paid' | 'Pending' | 'Partial'>('Paid');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('student123');
  const [formSubjects, setFormSubjects] = useState<string[]>(['All Subjects']);

  // Selected student for WhatsApp Reminder
  const [reminderTarget, setReminderTarget] = useState<Student | null>(null);

  // Active Classes list derived from data
  const classesList = Array.from(new Set([...STANDARD_CLASSES, ...students.map((s) => s.class)]));

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.parentName.toLowerCase().includes(search.toLowerCase());

    const matchesClass = filterClass === 'All' || s.class === filterClass;
    const matchesBatch = filterBatch === 'All' || s.batch === filterBatch;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;

    return matchesSearch && matchesClass && matchesBatch && matchesStatus;
  });

  const handleOpenAddForm = () => {
    setEditingStudent(null);
    setFormName('');
    setFormClass('10th');
    setFormBatch(batches[0] || 'Morning A');
    setFormPhone('');
    setFormParentName('');
    setFormParentPhone('');
    setFormFees(2500);
    setFormStatus('Paid');
    setFormEmail('');
    setFormPassword('student123');
    setFormSubjects(['All Subjects']);
    setShowForm(true);
  };

  const handleOpenEditForm = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormClass(student.class);
    setFormBatch(student.batch);
    setFormPhone(student.phone);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormFees(student.fees);
    setFormStatus(student.status);
    setFormEmail(student.email || '');
    setFormPassword(student.password || 'student123');
    if (student.subjects) {
      setFormSubjects(student.subjects.split(', '));
    } else {
      setFormSubjects(['All Subjects']);
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      alert('Name and Phone are required!');
      return;
    }

    const finalEmail = formEmail.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, '')}@tuition.com`;
    const finalPassword = formPassword.trim() || 'student123';
    const finalSubjects = formSubjects.length > 0 ? formSubjects.join(', ') : 'All Subjects';

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        name: formName,
        class: formClass,
        batch: formBatch,
        phone: formPhone,
        parentName: formParentName,
        parentPhone: formParentPhone,
        fees: Number(formFees),
        status: formStatus,
        email: finalEmail,
        password: finalPassword,
        subjects: finalSubjects,
      };
      onUpdateStudent(updated);
    } else {
      // Generate standard ID: ST + next sequence
      const numericIds = students
        .map((s) => parseInt(s.studentId.replace('ST', '')))
        .filter((id) => !isNaN(id));
      const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
      const newId = `ST${String(nextNum).padStart(3, '0')}`;

      const newStudent: Student = {
        studentId: newId,
        name: formName,
        class: formClass,
        batch: formBatch,
        phone: formPhone,
        parentName: formParentName,
        parentPhone: formParentPhone,
        fees: Number(formFees),
        status: formStatus,
        email: finalEmail,
        password: finalPassword,
        subjects: finalSubjects,
      };
      onAddStudent(newStudent);
    }

    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, parents, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mr-1">
            Filter:
          </div>

          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Classes</option>
            {classesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Fee Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>

          {canModify && (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-indigo-200" />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Students Data Grid/Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">ID / Name</th>
                <th className="px-6 py-4">Class & Batch</th>
                <th className="px-6 py-4">Student Phone</th>
                <th className="px-6 py-4">Parent Details</th>
                <th className="px-6 py-4">Fees (Monthly)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => {
                  const isPaid = s.status === 'Paid';
                  const isPending = s.status === 'Pending';
                  const isPartial = s.status === 'Partial';

                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50/50 transition">
                      {/* ID / Name */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-xs font-mono text-slate-400">{s.studentId}</span>
                          <div className="flex flex-col gap-1 text-[10px] mt-1">
                            <span className="text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1 w-fit cursor-help" title="Student Portal Email">
                              <span>📧</span> {s.email}
                            </span>
                            <span className="text-slate-600 bg-slate-150 border border-slate-250/60 px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1 w-fit cursor-help" title="Student Portal Password">
                              <span>🔑</span> {s.password || 'student123'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class / Batch */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{s.class}</div>
                        <div className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md inline-block mt-1">
                          {s.batch}
                        </div>
                        {s.subjects && (
                          <div className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1.5 font-semibold w-fit leading-tight truncate max-w-[140px]" title={s.subjects}>
                            📚 {s.subjects}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {s.phone}
                      </td>

                      {/* Parent details */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-800">{s.parentName}</div>
                        <div className="text-slate-500 font-medium">{s.parentPhone}</div>
                      </td>

                      {/* Fees */}
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        ₹{s.fees}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : isPending ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Send WhatsApp fee reminder if Pending or Partial */}
                          {!isPaid && (
                            <button
                              title="Send Tuition WhatsApp Reminder"
                              onClick={() => setReminderTarget(s)}
                              className="p-2 border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canModify && (
                            <>
                              <button
                                title="Edit Student"
                                onClick={() => handleOpenEditForm(s)}
                                className="p-2 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Delete Student"
                                onClick={() => onDeleteStudent(s.studentId)}
                                className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No students found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side drawer/modal for Add/Edit student */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white rounded-l-2xl w-full max-w-md h-full shadow-2xl border-l border-slate-100 flex flex-col animate-slide-in">
            {/* Form Header */}
            <div className="p-6 border-b border-secondary bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 text-sans flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span>{editingStudent ? 'Edit Student Details' : 'Register New Student'}</span>
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Class
                  </label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Batch Allocation
                  </label>
                  <select
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {batches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Options selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Subject Selection Options
                </label>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {SUBJECT_OPTIONS.map((sub) => {
                      const isChecked = formSubjects.includes(sub);
                      return (
                        <label key={sub} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-indigo-600 select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (sub === 'All Subjects') {
                                if (isChecked) {
                                  setFormSubjects([]);
                                } else {
                                  setFormSubjects(['All Subjects']);
                                }
                              } else {
                                let updated = [...formSubjects];
                                if (updated.includes('All Subjects')) {
                                  updated = updated.filter(x => x !== 'All Subjects');
                                }
                                if (isChecked) {
                                  updated = updated.filter(x => x !== sub);
                                } else {
                                  updated.push(sub);
                                }
                                if (updated.length === 0) {
                                  updated = ['All Subjects'];
                                }
                                setFormSubjects(updated);
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-550 w-4 h-4 cursor-pointer"
                          />
                          <span>{sub}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Student Phone Number
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit number (e.g. 9876543210)"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Parent / Guardian Info
                </span>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Parent Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Parent Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit parent phone"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Portal Credentials Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <span className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-wider block">
                  Student Portal Credentials
                </span>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Portal Login Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. custom@tuition.com (or leave empty to auto-generate)"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 leading-normal">
                    Leave blank to automatically construct from student name.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Portal Login Password
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter login password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Monthly Tuition Fees (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={formFees}
                    min={0}
                    onChange={(e) => setFormFees(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Fee Balance Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Paid' | 'Pending' | 'Partial')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Drawer Action Bar */}
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
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render WhatsApp Reminder Modal if targeted */}
      {reminderTarget && (
        <ReminderModal
          student={reminderTarget}
          onClose={() => setReminderTarget(null)}
        />
      )}
    </div>
  );
}
