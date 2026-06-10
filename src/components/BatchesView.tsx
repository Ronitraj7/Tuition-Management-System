import React, { useState } from 'react';
import { Batch, Teacher } from '../types';
import { Calendar, Clock, User, Plus, Trash2, Edit2, X } from 'lucide-react';

interface BatchesViewProps {
  batches: Batch[];
  teachers: Teacher[];
  onAddBatch: (batch: Batch) => void;
  onUpdateBatch: (batch: Batch) => void;
  onDeleteBatch: (id: string) => void;
  canModify: boolean;
}

export default function BatchesView({
  batches,
  teachers,
  onAddBatch,
  onUpdateBatch,
  onDeleteBatch,
  canModify,
}: BatchesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formTiming, setFormTiming] = useState('');
  const [formTeacher, setFormTeacher] = useState('');

  const handleOpenAddForm = () => {
    setEditingBatch(null);
    setFormName('');
    setFormTiming('4 PM - 5 PM');
    setFormTeacher(teachers[0]?.name || 'Rahul Sir');
    setShowForm(true);
  };

  const handleOpenEditForm = (b: Batch) => {
    setEditingBatch(b);
    setFormName(b.batchName);
    setFormTiming(b.timing);
    setFormTeacher(b.teacher);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formTiming) {
      alert('Batch Name and Timing are required!');
      return;
    }

    if (editingBatch) {
      const updated: Batch = {
        ...editingBatch,
        batchName: formName,
        timing: formTiming,
        teacher: formTeacher,
      };
      onUpdateBatch(updated);
    } else {
      // Generate ID B00x
      const numericIds = batches
        .map((b) => parseInt(b.batchId.replace('B', '')))
        .filter((id) => !isNaN(id));
      const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
      const newId = `B${String(nextNum).padStart(3, '0')}`;

      const newBatch: Batch = {
        batchId: newId,
        batchName: formName,
        timing: formTiming,
        teacher: formTeacher,
      };
      onAddBatch(newBatch);
    }

    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scheduled Tuition Batches</h2>
          <p className="text-sm text-slate-500 mt-1">
            Map timings, check class loads, and handle teacher allocations.
          </p>
        </div>

        {canModify && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Schedule Batch</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {batches.map((b) => {
          return (
            <div
              key={b.batchId}
              className="bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition duration-150 overflow-hidden flex flex-col justify-between"
            >
              {/* Batch Card Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-750 bg-indigo-50/70 border border-indigo-100/60 px-2.5 py-0.5 rounded-md">
                  {b.batchId}
                </span>

                {canModify && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEditForm(b)}
                      className="p-1 px-2 border border-slate-200 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer transition"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteBatch(b.batchId)}
                      className="p-1 px-2 border border-slate-200 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Batch Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-905 text-sm">{b.batchName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">Active Batch Schedule</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {b.timing}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>Instructor: <strong className="text-slate-950 font-bold">{b.teacher}</strong></span>
                  </div>
                </div>
              </div>

              {/* Decorative Card Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-medium">Tuition Main</span>
                <span className="text-indigo-600 font-bold">Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
          <div className="bg-white rounded-l-2xl w-full max-w-md h-full shadow-2xl border-l border-slate-100 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                {editingBatch ? 'Reschedule Batch' : 'Add Tuition Batch'}
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
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening C / Morning C"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Timings / Schedule
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11 AM - 12 PM / Sat-Sun 12 PM"
                  value={formTiming}
                  onChange={(e) => setFormTiming(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Assigned Teacher
                </label>
                <select
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 animate-fade-in"
                >
                  {teachers.map((t) => (
                    <option key={t.teacherId} value={t.name}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-705 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-xs text-center"
                >
                  {editingBatch ? 'Save Changes' : 'Schedule Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
