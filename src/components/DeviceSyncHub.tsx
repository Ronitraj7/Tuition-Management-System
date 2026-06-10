import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, RefreshCw, Smartphone, Laptop } from 'lucide-react';

interface DeviceSyncHubProps {
  students: any[];
  teachers: any[];
  attendance: any[];
  batches: any[];
  receipts: any[];
  onSyncRestore?: (data: any) => void;
}

export default function DeviceSyncHub({
  students,
  teachers,
  attendance,
  batches,
  receipts
}: DeviceSyncHubProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-emerald-50/50 border border-indigo-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden" id="device-sync-cloud-card">
      {/* Decorative Sparkles */}
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
        <Sparkles className="w-40 h-40 text-indigo-600" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider">
                Production Safe Network
              </span>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Google Firebase Firestore Active
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                  ● Real-time Live
                </span>
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Your Tuition Classes database is now securely synchronized with Google Cloud in real-time. Any updates made to students, receipts, attendances, or batches are instantenously paired across your <strong>mobile phone</strong>, <strong>laptops</strong>, and <strong>tablets</strong>. You can safely close any browser tabs without ever losing your progress!
          </p>
        </div>

        <div className="flex flex-row md:flex-col gap-3 justify-end shrink-0">
          <div className="bg-white border border-indigo-100 px-4 py-3 rounded-xl shadow-xs text-center flex-1 md:flex-none min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Collections</span>
            <span className="text-sm font-extrabold text-indigo-700 font-mono">5 Active Labs</span>
          </div>
          <div className="bg-white border border-indigo-100 px-4 py-3 rounded-xl shadow-xs text-center flex-1 md:flex-none min-w-[120px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Storage Sync</span>
            <span className="text-sm font-extrabold text-emerald-600 font-mono">Always Persistent</span>
          </div>
        </div>
      </div>

      <div className="border-t border-indigo-100/80 mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans font-medium">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center border border-white">
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-white">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <span>Seamless live multi-device collaboration enabled.</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Listening for remote database edits...</span>
        </div>
      </div>
    </div>
  );
}
