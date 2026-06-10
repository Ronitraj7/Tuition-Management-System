import React, { useState } from 'react';
import { Attendance, Student } from '../types';
import { Calendar, Check, X, Users, AlertTriangle, CheckCircle, Info, Grid } from 'lucide-react';
import MonthlyAttendanceGrid from './MonthlyAttendanceGrid';

interface AttendanceViewProps {
  students: Student[];
  attendanceRecords: Attendance[];
  onToggleStatus: (studentId: string, date: string, targetStatus?: 'Present' | 'Absent' | 'Holiday') => void;
  canModify: boolean;
}

export default function AttendanceView({
  students,
  attendanceRecords,
  onToggleStatus,
  canModify,
}: AttendanceViewProps) {
  // Toggle between Daily sign-in and Monthly ledger
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'monthly'>('daily');

  // Current chosen date for marking/viewing attendance
  const [selectedDate, setSelectedDate] = useState('2026-06-01');

  // Filter attendance database for the selected date
  const selectedDateRecords = attendanceRecords.filter((r) => r.date === selectedDate);

  // Statistics for the selected date
  const totalStudentsCount = students.length;
  const presentCount = selectedDateRecords.filter((r) => r.status === 'Present').length;
  const absentCount = selectedDateRecords.filter((r) => r.status === 'Absent').length;
  const holidayCount = selectedDateRecords.filter((r) => r.status === 'Holiday').length;
  const unmarkedCount = totalStudentsCount - selectedDateRecords.length;

  const getAttendanceStatus = (studentId: string) => {
    const record = selectedDateRecords.find((r) => r.studentId === studentId);
    return record ? record.status : null; // null means unmarked
  };

  const attendanceRate = totalStudentsCount > 0 
    ? Math.round((presentCount / (presentCount + absentCount || 1)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Toggle Row */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start w-fit">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'daily'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Sheet Logger</span>
        </button>
        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'monthly'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Full Month Board Ledger</span>
        </button>
      </div>

      {activeSubTab === 'monthly' ? (
        <MonthlyAttendanceGrid
          students={students}
          attendanceRecords={attendanceRecords}
        />
      ) : (
        <>
          {/* Date selector and mini stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Selector Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Operating Workday
                </span>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  Note: The database seeds contain attendance logs for <strong className="text-slate-600">2026-06-01</strong>. Toggle other dates to log fresh attendance sheets!
                </p>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="text-[11px] font-semibold text-slate-500 bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-xl flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Select/Click Status tags on the right to log or correct attendance.</span>
              </div>
            </div>

            {/* Attendance Statistics for Chosen Date */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500 block">Logged Sheet</span>
                <div className="mt-2.5">
                  <span className="text-xl font-bold text-slate-950">
                    {selectedDateRecords.length}/{totalStudentsCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Students Logged</span>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/70 flex flex-col justify-between">
                <span className="text-xs font-semibold text-emerald-700 block">Present Count</span>
                <div className="mt-2.5">
                  <span className="text-xl font-bold text-emerald-800">{presentCount}</span>
                  <span className="text-[10px] text-emerald-600 block mt-1">Status Present</span>
                </div>
              </div>

              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/70 flex flex-col justify-between">
                <span className="text-xs font-semibold text-rose-700 block">Absent Count</span>
                <div className="mt-2.5">
                  <span className="text-xl font-bold text-rose-800">{absentCount}</span>
                  <span className="text-[10px] text-rose-600 block mt-1">Status Absent</span>
                </div>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/70 flex flex-col justify-between">
                <span className="text-xs font-semibold text-amber-700 block">Holiday Count</span>
                <div className="mt-2.5">
                  <span className="text-xl font-bold text-amber-800">{holidayCount}</span>
                  <span className="text-[10px] text-amber-600 block mt-1">Status Holiday</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/70 flex flex-col justify-between">
                <span className="text-xs font-semibold text-indigo-700 block">Present Ratio</span>
                <div className="mt-2.5">
                  <span className="text-xl font-bold text-indigo-800">{attendanceRate}%</span>
                  <span className="text-[10px] text-indigo-600 block mt-1">Of Logged Entries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main interactive attendance board */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  Attendance Roster for date: <strong className="text-slate-900">{selectedDate}</strong>
                </h3>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                {canModify && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Apply a universal Holiday status to all ${students.length} registry students on ${selectedDate}?`)) {
                        students.forEach((s) => {
                          const curr = getAttendanceStatus(s.studentId);
                          if (curr !== 'Holiday') {
                            onToggleStatus(s.studentId, selectedDate, 'Holiday');
                          }
                        });
                      }
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10.5px] uppercase tracking-wide rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    title="Mark entire day as Holiday for all students in the roster list"
                  >
                    <span>🎉</span>
                    <span>Mark Holiday for All</span>
                  </button>
                )}

                {unmarkedCount > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 font-bold px-2.5 py-1 rounded-full animate-pulse-slow">
                    {unmarkedCount} Students Pending Log
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((s) => {
                const currentStatus = getAttendanceStatus(s.studentId);

                return (
                  <div
                    key={s.studentId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/50 transition gap-4"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm border border-slate-200">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 leading-tight">{s.name}</h4>
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          <span className="text-xs text-slate-400 font-mono font-medium">
                            {s.studentId}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-xs text-slate-500 font-medium">Class {s.class}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            {s.batch}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                      <button
                        id={`mark-present-${s.studentId}`}
                        disabled={!canModify}
                        onClick={() => onToggleStatus(s.studentId, selectedDate, 'Present')}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none hover:scale-102 ${
                          currentStatus === 'Present'
                            ? 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-600'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Present</span>
                      </button>

                      <button
                        id={`mark-absent-${s.studentId}`}
                        disabled={!canModify}
                        onClick={() => onToggleStatus(s.studentId, selectedDate, 'Absent')}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none hover:scale-102 ${
                          currentStatus === 'Absent'
                            ? 'bg-rose-600 border-rose-600 hover:bg-rose-700 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:border-rose-500 hover:bg-rose-50/20 text-slate-600'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Absent</span>
                      </button>

                      <button
                        id={`mark-holiday-${s.studentId}`}
                        disabled={!canModify}
                        onClick={() => onToggleStatus(s.studentId, selectedDate, 'Holiday')}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none hover:scale-102 ${
                          currentStatus === 'Holiday'
                            ? 'bg-amber-500 border-amber-500 hover:bg-amber-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:border-amber-500 hover:bg-amber-50/20 text-slate-600'
                        }`}
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>Holiday</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
