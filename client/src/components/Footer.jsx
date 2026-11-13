import React from 'react';
import { ShieldCheck, HeartHandshake, Lock, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#F4EFEA] text-[#2C332A] mt-20 border-t border-[#E2DAD0]">
      {/* Help Hotline Banner */}
      <div className="bg-[#FAF2F0] border-b border-[#D9B3AC] py-3.5 px-4 sm:px-6">
        <div className="max-w-[1160px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F635E]">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#A86851] shrink-0" />
            <span>Confidential domestic, legal, or emotional support is available 24/7. You are never alone.</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#4F5E47] shrink-0" />
            <a
              href="tel:1-800-799-7233"
              className="text-[#384631] font-medium underline decoration-[#A07E5F]/60 underline-offset-2 hover:text-[#4F5E47] transition-smooth"
            >
              National Domestic Violence Hotline: 1-800-799-SAFE (7233)
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="col-span-1 md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#4F5E47] flex items-center justify-center text-[#FAF7F2] font-serif font-medium text-xs">
                S
              </div>
              <span className="font-serif text-[#1c1c19] font-medium text-base tracking-tight">Sparrow</span>
              <span className="text-[#A07E5F]">·</span>
              <span className="text-[#5F635E]">Know What&apos;s Yours</span>
            </div>
            <p className="text-xs text-[#5F635E] leading-relaxed max-w-md">
              Demystifying marital finances for women navigating divorce. Grounded document intelligence, 
              unlisted asset discovery from Schedule B lines, and baseline cash flow modeling powered by Gemini.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#4F5E47] pt-2">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8A9A7B]" />
                <span>Zero Data Training</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8A9A7B]" />
                <span>California F.C. § 760 &amp; § 2550 Grounded</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#1c1c19] tracking-wider uppercase mb-3">Discovery Modules</h4>
            <ul className="space-y-1.5 text-xs text-[#5F635E]">
              <li>Financial Discovery Engine</li>
              <li>Account Vault &amp; Schedule B Leads</li>
              <li>My New Baseline (Must-Pays vs Life)</li>
              <li>Housing Sandbox &amp; Equity Buyout</li>
              <li>Ledger &amp; Court Stipulations</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#1c1c19] tracking-wider uppercase mb-3">Statutory Guardrails</h4>
            <p className="text-[11px] text-[#5F635E] leading-relaxed">
              Sparrow provides educational financial discovery and legal disclosure modeling, not legal advice. 
              Always review your Discovery Packet with a qualified California family law attorney or court mediator.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E2DAD0] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#5F635E]">
          <p>© {new Date().getFullYear()} Sparrow · Built for financial clarity and independence.</p>
          <p>California Family Law Discovery Compliant · AES-256 Storage</p>
        </div>
      </div>
    </footer>
  );
}
