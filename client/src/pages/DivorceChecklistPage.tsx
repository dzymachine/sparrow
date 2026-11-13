import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DivorceChecklistTab from '../components/DivorceChecklistTab';

export default function DivorceChecklistPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-fade-in">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F635E] hover:text-[#4F5E47] transition-smooth"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Dashboard</span>
        </Link>
      </div>

      <DivorceChecklistTab />
    </div>
  );
}
