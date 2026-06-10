import React, { useState } from 'react';
import { UserRole, Student, Teacher } from '../types';
import { Shield, BookOpen, User, Lock, Mail, ChevronRight, AlertCircle, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, email: string) => void;
  students: Student[];
  teachers: Teacher[];
  adminPassword?: string;
}

export default function LoginScreen({
  onLoginSuccess,
  students,
  teachers,
  adminPassword = 'admin123',
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'teacher' | 'student'>('admin');
  const [email, setEmail] = useState('admin@tuition.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Auto-fill template emails on tab changes for better UX, while keeping them typing their passwords
  const handleTabChange = (role: 'admin' | 'teacher' | 'student') => {
    setActiveTab(role);
    setError('');
    setPassword('');
    if (role === 'admin') {
      setEmail('admin@tuition.com');
    } else if (role === 'teacher') {
      setEmail('teacher@tuition.com');
    } else {
      setEmail('student@tuition.com');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setError('Please provide both your Login ID (Email) and password.');
      return;
    }

    if (activeTab === 'admin') {
      if (trimmedEmail === 'admin@tuition.com' && trimmedPass === adminPassword) {
        onLoginSuccess('admin', 'admin@tuition.com');
      } else {
        setError('Incorrect administrator credentials.');
      }
    } else if (activeTab === 'teacher') {
      // Find dynamically registered teacher
      const matchedTeacher = teachers.find(
        (t) =>
          t.email?.trim().toLowerCase() === trimmedEmail &&
          (t.password || 'teacher123').trim() === trimmedPass
      );

      // Support fallback teacher
      const isFallback = trimmedEmail === 'teacher@tuition.com' && trimmedPass === 'teacher123';

      if (matchedTeacher) {
        onLoginSuccess('teacher', matchedTeacher.email);
      } else if (isFallback) {
        onLoginSuccess('teacher', 'teacher@tuition.com');
      } else {
        setError('Incorrect instructor credentials. Please match dynamic records or use default.');
      }
    } else if (activeTab === 'student') {
      // Find dynamically registered student
      const matchedStudent = students.find(
        (s) =>
          s.email?.trim().toLowerCase() === trimmedEmail &&
          (s.password || 'student123').trim() === trimmedPass
      );

      // Support fallback student
      const isFallback = trimmedEmail === 'student@tuition.com' && trimmedPass === 'student123';

      if (matchedStudent) {
        onLoginSuccess('student', matchedStudent.email);
      } else if (isFallback) {
        onLoginSuccess('student', 'student@tuition.com');
      } else {
        setError('Incorrect student credentials. Please check dynamic registries or default settings.');
      }
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Emblem */}
        <div className="flex justify-center">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md">
            <BookOpen className="h-10 w-10 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-950 tracking-tight font-sans">
          Manisha Tuition Classes
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-sans font-medium">
          Secure Portal Access Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* TAB BUTTONS */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/80 rounded-xl mb-4 border border-slate-300/40">
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('teacher')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('student')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span className="capitalize">{activeTab} Portal Sign In</span>
          </h3>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Login Email ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={`${activeTab}@tuition.com`}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Security Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl border border-rose-100 flex items-start gap-2.5 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200"
              >
                <span>Authorize & Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>



        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        <p>&copy; 2026 Manisha Tuition Classes. All rights reserved.</p>
        <p className="mt-1 font-semibold text-slate-500">Developed By Ronitraj Yadav</p>
      </div>
    </div>
  );
}
