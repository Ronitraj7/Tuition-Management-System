import React, { useState } from 'react';
import { Teacher } from '../types';
import { Search, UserPlus, Trash2, Edit2, X, Landmark, PhoneCall } from 'lucide-react';

interface TeachersViewProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  canModify: boolean;
}

export default function TeachersView({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  canModify,
}: TeachersViewProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formSalary, setFormSalary] = useState(20000);
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('teacher123');

  const filteredTeachers = teachers.filter((t) => {
    return (
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
    );
  });

  const handleOpenAddForm = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormSubject('Mathematics');
    setFormSalary(20000);
    setFormPhone('');
    setFormEmail('');
    setFormPassword('teacher123');
    setShowForm(true);
  };

  const handleOpenEditForm = (t: Teacher) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormSubject(t.subject);
    setFormSalary(t.salary);
    setFormPhone(t.phone);
    setFormEmail(t.email || '');
    setFormPassword(t.password || 'teacher123');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      alert('Name and Phone are required!');
      return;
    }

    const finalEmail = formEmail.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, '')}@tuition.com`;
    const finalPassword = formPassword.trim() || 'teacher123';

    if (editingTeacher) {
      const updated: Teacher = {
        ...editingTeacher,
        name: formName,
        subject: formSubject,
        salary: Number(formSalary),
        phone: formPhone,
        email: finalEmail,
        password: finalPassword,
      };
      onUpdateTeacher(updated);
    } else {
      // Generate ID: T00x
      const numericIds = teachers
        .map((t) => parseInt(t.teacherId.replace('T', '')))
        .filter((id) => !isNaN(id));
      const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
      const newId = `T${String(nextNum).padStart(3, '0')}`;

      const newTeacher: Teacher = {
        teacherId: newId,
        name: formName,
        subject: formSubject,
        salary: Number(formSalary),
        phone: formPhone,
        email: finalEmail,
        password: finalPassword,
      };
      onAddTeacher(newTeacher);
    }

    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and action header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher, ID, subject..."
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
            <UserPlus className="w-4 h-4 text-indigo-200" />
            <span>Add Teacher</span>
          </button>
        )}
      </div>

      {/* Grid of Teachers (Bento/Card format is extremely gorgeous for teachers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((t) => (
            <div
              key={t.teacherId}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative hover:shadow-sm hover:border-slate-300 transition duration-150 flex flex-col justify-between animate-fade-in"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-slate-50 px-2.5 py-1 text-slate-500 border border-slate-200 rounded-md">
                    {t.teacherId}
                  </span>
                  
                  {canModify && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(t)}
                        className="p-1 px-2 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTeacher(t.teacherId)}
                        className="p-1 px-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-750 bg-indigo-50 border border-indigo-100/60 rounded-md px-2.5 py-0.5 inline-block mt-1 font-sans">
                    {t.subject} Tutor
                  </p>
                </div>

                <div className="mt-5 space-y-2 text-slate-600 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-800">{t.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salary: <strong className="text-slate-800">₹{t.salary.toLocaleString('en-IN')}</strong>/mo</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1 w-fit cursor-help" title="Teacher Portal Email">
                      <span>📧</span> {t.email}
                    </span>
                    <span className="text-[10px] text-slate-600 bg-slate-150 border border-slate-250/60 px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1 w-fit cursor-help" title="Teacher Portal Password">
                      <span>🔑</span> {t.password || 'teacher123'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative base block */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Roster Registered</span>
                <span className="text-indigo-600 font-bold">Active</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-xl">
            No instructors found matching search filters.
          </div>
        )}
      </div>

      {/* Slide form for Add/Edit instructor */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white rounded-l-2xl w-full max-w-md h-full shadow-2xl border-l border-slate-100 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-secondary bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 animate-pulse" />
                <span>{editingTeacher ? 'Modify Instructor Details' : 'Add New Instructor'}</span>
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
                  Instructor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sir / Sneha Ma'am"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Primary Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Science, English"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Salary Allocation (₹ per month)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formSalary}
                  onChange={(e) => setFormSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit number (e.g. 9991110001)"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-slate-50/20"
                />
              </div>

              {/* Portal Credentials Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-fade-in">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Teacher Portal Credentials
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
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-550 text-slate-500 block mt-1 leading-normal">
                    Leave blank to automatically construct from instructor name.
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
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-905"
                  />
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
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-xs text-center"
                >
                  {editingTeacher ? 'Save Changes' : 'Register Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
