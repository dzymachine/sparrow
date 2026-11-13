import React from 'react';
import { ShieldCheck, HeartHandshake, Lock, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#261E19] text-[#EADBCE] mt-20 border-t border-[#4F3E33]">
      {/* Help Hotline Banner */}
      <div className="bg-[#1F1916] border-b border-[#3D2F27] py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#EADBCE]">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#ADC2B5]" />
            <span>Confidential domestic, legal, or emotional support is available 24/7. You are never alone.</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#D1DDD6]" />
            <a 
              href="tel:1-800-799-7233" 
              className="text-white font-medium underline hover:text-[#ADC2B5]"
            >
              National Domestic Violence Hotline: 1-800-799-SAFE (7233)
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="col-span-1 md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#435C4D] flex items-center justify-center text-white font-medium text-xs">
                F
              </div>
              <span className="text-white font-medium text-base tracking-tight">Sparrow</span>
              <span className="text-[#8C7D73]">·</span>
              <span className="text-[#DFCABC]">Know What's Yours</span>
            </div>
            <p className="text-xs text-[#CBB2A0] leading-relaxed max-w-md">
              Demystifying marital finances for women navigating divorce. Grounded document intelligence, 
              unlisted asset discovery from Schedule B lines, and baseline cash flow modeling powered by Gemini.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#DFCABC] pt-2">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#ADC2B5]" />
                <span>Zero Data Training</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ADC2B5]" />
                <span>California F.C. § 760 & § 2550 Grounded</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-white tracking-wider uppercase mb-3">Discovery Modules</h4>
            <ul className="space-y-1.5 text-xs text-[#CBB2A0]">
              <li>Financial Discovery Engine</li>
              <li>Account Vault & Schedule B Leads</li>
              <li>My New Baseline (Must-Pays vs Life)</li>
              <li>Housing Sandbox & Equity Buyout</li>
              <li>Ledger & Court Stipulations</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-white tracking-wider uppercase mb-3">Statutory Guardrails</h4>
            <p className="text-[11px] text-[#A98F7C] leading-relaxed">
              Sparrow provides educational financial discovery and legal disclosure modeling, not legal advice. 
              Always review your Discovery Packet with a qualified California family law attorney or court mediator.
            </p>
          </div>
        </div>

        <div className="border-t border-[#3D2F27] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C725F]">
          <p>© {new Date().getFullYear()} Sparrow · Built for financial clarity and independence.</p>
          <p>California Family Law Discovery Compliant · AES-256 Storage</p>
        </div>
      </div>
    </footer>
  );
}
