import React, { useState } from 'react';
import { Attendance, Student } from '../types';
import { Check, X, Calendar, ChevronLeft, ChevronRight, User, Users, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export const ATTENDANCE_MONTHS = [
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

interface MonthlyAttendanceGridProps {
  students: Student[];
  attendanceRecords: Attendance[];
  activeStudentId?: string; // If set, acts in Student Portal Mode
}

export default function MonthlyAttendanceGrid({
  students,
  attendanceRecords,
  activeStudentId,
}: MonthlyAttendanceGridProps) {
  const [selectedMonthLabel, setSelectedMonthLabel] = useState('June 2026');
  const [filterClass, setFilterClass] = useState('All');

  const classesList = Array.from(new Set(students.map((s) => s.class)));

  // Parse Month Label into details
  const getDaysInMonth = (monthLabel: string) => {
    const parts = monthLabel.split(' ');
    const monthName = parts[0];
    const year = parseInt(parts[1]) || 2026;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthIndex = monthNames.indexOf(monthName);
    const targetMonth = monthIndex !== -1 ? monthIndex : 5;

    // Days in target index
    const numDays = new Date(year, targetMonth + 1, 0).getDate();

    // Day of the week of 1st day (0 = Sunday, 1 = Monday...)
    const firstDayOfWeek = new Date(year, targetMonth, 1).getDay();

    const days = [];
    for (let i = 1; i <= numDays; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const monthNum = (targetMonth + 1) < 10 ? `0${targetMonth + 1}` : `${targetMonth + 1}`;
      const dateStr = `${year}-${monthNum}-${dayStr}`;
      days.push({
        dayNumber: i,
        dateString: dateStr,
      });
    }

    return { days, firstDayOfWeek, monthName, year, targetMonth };
  };

  const { days, firstDayOfWeek, monthName, year } = getDaysInMonth(selectedMonthLabel);

  // Filter students if in Admin mode
  const filteredStudents = activeStudentId
    ? students.filter((s) => s.studentId === activeStudentId)
    : filterClass === 'All'
    ? students
    : students.filter((s) => s.class === filterClass);

  const getDayStatus = (studentId: string, dateStr: string) => {
    const rec = attendanceRecords.find((r) => r.studentId === studentId && r.date === dateStr);
    return rec ? rec.status : null; // null = unmarked
  };

  // Student Portal Calendar layout renderer
  const renderStudentCalendar = (student: Student) => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const blanks = Array(firstDayOfWeek).fill(null);
    const calendarCells = [...blanks, ...days];

    // Compute stats for the month
    let presentCount = 0;
    let absentCount = 0;
    let holidayCount = 0;
    days.forEach((d) => {
      const status = getDayStatus(student.studentId, d.dateString);
      if (status === 'Present') presentCount++;
      if (status === 'Absent') absentCount++;
      if (status === 'Holiday') holidayCount++;
    });

    return (
      <div id="student-calendar-card" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Days Present</span>
            <span className="text-xl font-extrabold text-emerald-800 mt-1">{presentCount} Days</span>
            <span className="text-[10px] text-emerald-500 mt-0.5">Sincere attendance records</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Days Absent</span>
            <span className="text-xl font-extrabold text-rose-800 mt-1">{absentCount} Days</span>
            <span className="text-[10px] text-rose-500 mt-0.5">Contact center to submit leaves</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Holidays / Days Off</span>
            <span className="text-xl font-extrabold text-amber-800 mt-1">{holidayCount} Days</span>
            <span className="text-[10px] text-amber-500 mt-0.5">Recognized center holidays</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1">
              {presentCount + absentCount > 0
                ? Math.round((presentCount / (presentCount + absentCount)) * 100)
                : 100}
              %
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Required compliance criteria</span>
          </div>
        </div>

        {/* Real Calendar Grid */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 font-sans">
              🗓️ Daily Sign-In Sheet for {selectedMonthLabel}
            </span>
            <div className="flex gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm">
                P = Present
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-sm">
                A = Absent
              </span>
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-sm">
                H = Holiday
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/20">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1">
              {weekDays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 mt-2">
              {calendarCells.map((cell, index) => {
                if (cell === null) {
                  return <div key={`blank-${index}`} className="aspect-square bg-slate-50/40 rounded-lg border border-transparent" />;
                }

                const status = getDayStatus(student.studentId, cell.dateString);

                let bgClass = 'bg-white text-slate-800 border-slate-150 hover:bg-slate-50';
                let indicatorBadge = null;

                if (status === 'Present') {
                  bgClass = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  indicatorBadge = (
                    <span className="absolute bottom-1 right-1 text-[8px] bg-white text-emerald-800 font-extrabold px-1 rounded">P</span>
                  );
                } else if (status === 'Absent') {
                  bgClass = 'bg-rose-600 text-white border-rose-600 font-bold';
                  indicatorBadge = (
                    <span className="absolute bottom-1 right-1 text-[8px] bg-white text-rose-800 font-extrabold px-1 rounded">A</span>
                  );
                } else if (status === 'Holiday') {
                  bgClass = 'bg-amber-500 text-white border-amber-500 font-bold';
                  indicatorBadge = (
                    <span className="absolute bottom-1 right-1 text-[8px] bg-white text-amber-800 font-extrabold px-1 rounded">H</span>
                  );
                }

                return (
                  <div
                    key={cell.dateString}
                    className={`aspect-square relative flex flex-col justify-start p-1.5 rounded-lg border text-xs font-medium transition select-none ${bgClass}`}
                    title={`Date: ${cell.dateString} - status: ${status || 'Unmarked'}`}
                  >
                    <span className="text-[10px] opacity-75">{cell.dayNumber}</span>
                    {indicatorBadge}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200">
      {/* Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 text-base tracking-tight font-sans flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>{activeStudentId ? "My Full Month Attendance Calendar" : "Full Month Student Attendance Matrix"}</span>
          </h3>
          <p className="text-xs text-slate-500 font-sans font-medium">
            {activeStudentId
              ? "Check your comprehensive daily presence sign-in calendar sheet month-by-month."
              : "Review, analyze, and oversee institution-wide attendance records across all operational calendar days."}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {!activeStudentId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class:</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Classes</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month:</span>
            <select
              value={selectedMonthLabel}
              onChange={(e) => setSelectedMonthLabel(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {ATTENDANCE_MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Render based on Mode (Student view vs Admin View Matrix) */}
      {activeStudentId ? (
        filteredStudents.length > 0 ? (
          renderStudentCalendar(filteredStudents[0])
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">Student details not logged properly.</p>
        )
      ) : (
        /* Institution/Admin Matrix */
        <div className="space-y-4">
          <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20">
            {/* Scrollable Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-150 min-w-[150px]">Student name</th>
                    <th className="px-3 py-3 border-r border-slate-150 text-center text-[9px]">Class</th>
                    {days.map((d) => (
                      <th key={d.dayNumber} className="px-1 py-3 text-center border-r border-slate-150 min-w-[28px]">
                        {d.dayNumber}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/80 transition">
                        {/* Name Column sticky for perfect browsing layout */}
                        <td className="px-4 py-2.5 font-bold text-slate-800 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-150 whitespace-nowrap">
                          <div>{s.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono italic font-normal leading-tight mt-0.5">{s.studentId}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-650 border-r border-slate-150">
                          {s.class}
                        </td>
                        {days.map((d) => {
                          const status = getDayStatus(s.studentId, d.dateString);
                          let dotClass = 'bg-slate-100 text-slate-350 border-slate-200';
                          let title = 'Unmarked';
                          let label = '-';

                          if (status === 'Present') {
                            dotClass = 'bg-emerald-500 text-white border-emerald-500 font-bold scale-105';
                            title = 'Present';
                            label = 'P';
                          } else if (status === 'Absent') {
                            dotClass = 'bg-rose-500 text-white border-rose-500 font-bold scale-105';
                            title = 'Absent';
                            label = 'A';
                          } else if (status === 'Holiday') {
                            dotClass = 'bg-amber-500 text-white border-amber-500 font-bold scale-105';
                            title = 'Holiday';
                            label = 'H';
                          }

                          return (
                            <td key={d.dayNumber} className="px-0.5 py-2.5 text-center border-r border-slate-150">
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-md border text-[9px] select-none ${dotClass}`}
                                title={`${s.name} - ${d.dateString}: ${title}`}
                              >
                                {label}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={days.length + 3} className="p-8 text-center text-slate-400 font-medium">
                        No students enrolled in the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4 items-center justify-end text-[11px] font-semibold text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-500 rounded-md" />
              <span>Present (P)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 border border-rose-500 rounded-md" />
              <span>Absent (A)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 border border-amber-500 rounded-md" />
              <span>Holiday (H)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-100 border border-slate-200 rounded-md" />
              <span>Unmarked (-)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
