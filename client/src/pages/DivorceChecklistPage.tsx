import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DivorceChecklistTab from '../components/DivorceChecklistTab';

export default function DivorceChecklistPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-page-fade-in">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4E43] hover:text-[#261E19] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <DivorceChecklistTab />
    </div>
  );
}
