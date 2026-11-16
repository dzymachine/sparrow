import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is this formal legal advice?',
    answer:
      'No. Sparrow provides financial modeling, document decoding, and educational legal information derived from publicly accessible state statutes. We do not represent you in court or provide formal attorney counseling. Our purpose is to make you financially informed so your actual legal consultations are targeted, efficient, and cost-effective.',
    defaultOpen: true
  },
  {
    question: 'What if my partner manages all passwords and accounts?',
    answer:
      'This is extremely common. You do not need online logins to build a comprehensive asset picture. Sparrow provides step-by-step guidance on how to request copies of joint tax transcripts directly from the IRS (using Form 4506-T) and how to request joint bank statements in person at local bank branches using your personal photo ID.'
  },
  {
    question: 'Can anyone see that I used this app?',
    answer:
      'We store zero personal identifiable information on our servers while you explore. If someone physically inspects your device browser history, they could see page visits unless you use Private Browsing or click our Clear History guide. You can also press Escape twice anytime to leave the site immediately.'
  },
  {
    question: 'Do I need to link my bank account or provide my SSN?',
    answer:
      'Never. Sparrow will never ask for your Social Security Number, bank account passwords, or financial institution login credentials. You enter rounded numbers manually, or upload statements locally to extract what matters.'
  },
  {
    question: 'Is it free to start?',
    answer:
      'Yes. The entire educational library, asset discovery guides, IRS form walkthroughs, and basic 5-year budget models are completely free without requiring an email address or credit card.'
  }
];

export default function FaqAccordionWidget() {
  return (
    <section
      id="faq-section"
      className="bg-[#edf2e8]/75 border border-[#E2DBD0] rounded-2xl p-6 sm:p-8 space-y-6"
    >
      <div className="space-y-1.5">
        <span className="text-[11px] uppercase tracking-wider text-[#546347] font-semibold flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Clarity &amp; Answers
        </span>
        <h2 className="font-editorial-heading text-2xl sm:text-3xl text-[#1f291e] font-normal">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-[#444841]">
          Direct, compassionate answers to the questions you might hesitate to ask out loud.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            open={item.defaultOpen}
            className="group bg-white p-5 rounded-2xl border border-[#4F5E47]/15 transition-all open:bg-[#f6f9f4] shadow-xs"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <h3 className="font-editorial-heading text-base sm:text-lg text-[#1f291e] font-normal pr-4">
                {item.question}
              </h3>
              <ChevronDown className="w-5 h-5 text-[#384631] shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pt-3 text-xs sm:text-sm text-[#444841] leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
