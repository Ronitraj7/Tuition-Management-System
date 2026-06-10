import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { X, Copy, ExternalLink, Calendar, CheckSquare, MessageSquare } from 'lucide-react';

interface ReminderModalProps {
  student: Student;
  onClose: () => void;
}

export default function ReminderModal({ student, onClose }: ReminderModalProps) {
  const [dueDate, setDueDate] = useState('10 June');
  const [pendingAmount, setPendingAmount] = useState<number>(student.fees);
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  // Derive initial text based on the user's sample format
  useEffect(() => {
    const formatted = `Hello ${student.name},

Your tuition fee of ₹${pendingAmount} is pending.

Please complete payment before ${dueDate}.

Regards,
Manisha Tuition Classes`;
    setMessageText(formatted);
  }, [student, pendingAmount, dueDate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const getWhatsAppLink = () => {
    // Trim phone number just in case
    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const prefix = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone; // Fallback to Indian code if exactly 10 digits
    return `https://api.whatsapp.com/send?phone=${prefix}&text=${encodeURIComponent(messageText)}`;
  };

  return (
    <div id="reminder-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold text-lg animate-fade-in">Send Tuition Reminder</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Quick Config Inputs */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2 ml-0.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 10 June"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pending Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1.5 text-sm font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  value={pendingAmount}
                   onChange={(e) => setPendingAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
          </div>

          {/* Message Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-505 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Preview Message Text</span>
              <span className="text-[11px] text-slate-400 lowercase">Editable</span>
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              className="w-full p-4 bg-slate-905 text-slate-105 font-mono text-xs leading-relaxed rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-800"
            />
          </div>

          {/* Student details summary card */}
          <div className="flex gap-4 items-center p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-slate-700">
            <div>
              <span className="font-semibold block">Student Target:</span>
              <span>{student.name} ({student.studentId})</span>
            </div>
            <div className="h-6 w-[1px] bg-indigo-200" />
            <div>
              <span className="font-semibold block">Phone Number:</span>
              <span>{student.phone}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 bg-white rounded-xl text-sm font-medium transition cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            <span>Send via WhatsApp</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
