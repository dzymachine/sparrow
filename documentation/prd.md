---
title: "Project Clarity — California Financial & Legal Readiness Platform PRD"
status: "Draft"
version: "1.0"
last_updated: "2026-11-13"
jurisdiction: "California, USA"
stack: ["React", "Node.js", "Express", "PostgreSQL + pgvector", "Auth + AI Agent"]
---

# Project Clarity (CA Financial & Legal Readiness Platform) — PRD

## Document Metadata
* **Author:** [Your Name]
* **Status:** Draft
* **Last Updated:** 2026-11-13
* **Target Release:** MVP / v1.0 (California Only)
* **Key Stakeholders:**
  * Product: [Name]
  * Engineering Lead (Full-Stack / AI): [Name]
  * Design / UX Lead: [Name]
  * Legal Advisor / Family Law Reviewer: [Name]
* **Knowledge Base Sources:**
  * California Courts Self-Help — Divorce in California: https://selfhelp.courts.ca.gov/divorce-california
  * California Courts Self-Help — Divorce Overview: https://selfhelp.courts.ca.gov/divorce

---

## 1. Executive Summary
**Project Clarity** is a California-focused web application built on a React, Node.js/Express, and agent-integrated database stack designed to help individuals—especially women earning less than their partners or feeling trapped in unhealthy or abusive relationships—understand their true financial standing and legal options before taking action. By combining a **Relationship & Goal Intake flow**, a **Financial Discovery Engine** (analyzing mortgages, tax returns, and assets under California community property law), a **Document Tracker**, and a **grounded AI Chatbot Buddy**, the platform demystifies separation vs. divorce and provides actionable financial clarity. For users in healthy relationships, the platform serves as an accessible financial and legal literacy tool.

---

## 2. Problem Statement & Opportunity

### The Problem
Financial dependency and lack of financial visibility are primary barriers keeping women trapped in unhealthy or abusive relationships:
* **Prevalence of Financial Abuse:** Financial abuse occurs in **99% of domestic violence cases** (National Network to End Domestic Violence / NNEDV) and is cited as the **#1 reason** women stay in or return to abusive relationships (The Allstate Foundation). On average, it takes a woman **7 attempts** to leave an abusive relationship for good.
* **Inability to Leave Due to Finances:** In survivor surveys, **83%** reported being *"unable to support myself and/or my children"* or *"didn't have another place to live"* as key financial factors forcing them to stay with or return to a partner, alongside unaffordable childcare (**50%**) and transportation (**49%**) (Institute for Women's Policy Research). Additionally, **73%** of relationship abuse survivors identified unrestricted cash/financial resources as their top need for securing future safety (FreeFrom / National Domestic Violence Hotline).
* **Income Asymmetry:** Even outside of abusive dynamics, women frequently hold less financial leverage. Pew Research Center's analysis of U.S. Census data shows that **55% of opposite-sex marriages** have a husband as the primary or sole breadwinner (earning >60% of household income), and **63% of recently married young-adult women** (ages 18–39) are outearned by their husbands. Broadly, U.S. women earned an average of **85%** of what men earned in 2024 (Pew Research Center).

### The Opportunity
Legal self-help portals are dense and intimidating, while divorce attorneys are prohibitively expensive for a lower-earning or financially controlled spouse. Providing an interactive, privacy-first financial estimator and guided California document workflow empowers users with concrete numbers (*"What would I actually keep?"*) and lowers the cognitive barrier to safety or financial literacy.

### Impact of Not Building
Financially dependent spouses remain uninformed about their legal entitlements under California's community property laws (e.g., 50/50 equity rights regardless of whose name is on the title or who earned the paycheck), prolonging stays in unsafe or unfulfilling households.

---

## 3. Goals & Success Metrics

### Business & User Goals
* **Empowerment via Financial Clarity:** Enable users to estimate their post-divorce/post-separation net assets and potential support landscape within 15 minutes using real financial documents.
* **Legal Readiness (California):** Guide users through exact California Judicial Council forms and statutory disclosure checklists tailored to their relationship stage, goal (separation vs. divorce), and prenup status.
* **Dual-Purpose Education:** Provide safe, judgment-free financial education for individuals in healthy relationships who want to understand marital property, prenups, and household finances.

### Key Metrics (KPIs)
| Metric Type | Metric | Baseline | Target (90 Days Post-Launch) | Timeframe |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (North Star)** | **Financial Discovery Completion Rate** (% of registered users who complete asset/mortgage/tax intake and view estimated post-divorce outcome) | N/A (New) | >= 55% | 90 days |
| **Secondary** | **Document Checklist Activation** (% of users who start tracking >= 3 CA court forms/disclosures) | N/A (New) | >= 40% | 90 days |
| **Secondary** | **Chatbot Resolution / Engagement** (% of chatbot sessions with >= 3 grounded turns & zero hallucinated legal citations) | N/A (New) | >= 85% citation accuracy | Ongoing |
| **Guardrail** | **Privacy & Safety Compliance** (Zero PII/financial data leaks; Quick-Exit trigger latency) | 0 breaches | 0 breaches; < 150ms Quick-Exit | Ongoing |

### Non-Goals (Out of Scope for v1)
* **Non-California Jurisdictions:** All legal logic, forms, and case citations are strictly scoped to **California** (non-community-property states are excluded).
* **Attorney-Client Representation / E-Filing:** The app provides legal *information* and *financial modeling*, not legal advice (strict UPL — Unauthorized Practice of Law — disclaimers required), and will not directly e-file documents with California Superior Courts in v1.
* **Child Custody / Support Litigation Modeling:** While child/spousal support factors can be explained via the knowledge base, complex custody litigation calculators are out of scope for v1.

---

## 4. Target Audience & Personas
* **Primary Persona — "Financially Trapped / Lower-Earning Spouse" (California):**
  * Women earning significantly less than their spouse/significant other (or managing unpaid caregiving/domestic work) who feel stuck in an unhealthy, controlling, or abusive marriage because they fear financial ruin or homelessness if they leave.
  * *Needs:* Discreet access, plain-English explanations of what they are legally entitled to under California law, a clear estimate of post-divorce money/equity, and a step-by-step document checklist.
* **Secondary Persona — "Healthy Relationship / Financial Literacy Seeker" (General Population):**
  * Individuals in stable marriages, domestic partnerships, or pre-marital relationships (California residents) who want to proactively educate themselves on community vs. separate property, prenuptial agreements, and how household assets work legally.
  * *Needs:* Educational mode without crisis framing, interactive scenarios (e.g., how a prenup or pre-marital mortgage affects equity), and grounded Q&A.

---

## 5. Legal & Knowledge Base Scope (California Citations)
The AI Chatbot Buddy, Intake Engine, and Financial Discovery Engine must reference and cite verified California statutes, Judicial Council forms, and landmark case law sourced from `selfhelp.courts.ca.gov` and the California Family Code.

### Statutory Framework
* **Community vs. Separate Property:**
  * **Cal. Fam. Code § 760:** Presumes all real or personal property acquired during marriage while domiciled in California is community property, regardless of whose name is on the title or who earned the income.
  * **Cal. Fam. Code §§ 770–771:** Defines separate property (pre-marital assets, gifts, inheritances, and earnings/accumulations *after* the date of separation).
  * **Cal. Fam. Code § 2550:** Mandates an equal (50/50) division of the net community estate in value (achieved via asset offsets or equalization payments).
  * **Cal. Fam. Code § 2640:** Provides dollar-for-dollar reimbursement (without interest/appreciation) for traceable separate property contributions (e.g., down payments) toward community property.
  * **Cal. Fam. Code §§ 1600–1617 (UPAA):** Governs prenuptial agreements, which can legally override default community property rules.
* **Spousal Support & Domestic Violence Protections:**
  * **Cal. Fam. Code § 4320:** Establishes 14 statutory factors for long-term spousal support, including earning capacity, marketable skills, impairment due to domestic/caregiving duties, marital standard of living, length of marriage, and documented history of domestic violence.
  * **Cal. Fam. Code § 4325:** Establishes a rebuttable presumption against awarding spousal support to a spouse convicted of domestic violence.
* **Mandatory Financial Disclosures & Waiting Periods:**
  * **Cal. Fam. Code §§ 2102, 2104, 2105:** Mandates Preliminary and Final Declarations of Disclosure between spouses (exchanged within 60 days of filing Petition/Response).
  * **Legal Separation vs. Divorce:** Both follow the same procedural steps in California, except divorce carries a mandatory **6-month waiting period** before marital status ends, whereas legal separation has no 6-month waiting period.

### Landmark Case Law Citations (Financial Discovery Engine)
* **Real Estate / Mortgage Apportionment (*Moore/Marsden*):**
  * *In re Marriage of Moore* (1980) 28 Cal.3d 366 & *In re Marriage of Marsden* (1982) 130 Cal.App.3d 426 (with valuation timing clarified in *In re Marriage of Freeman* (2025)): Determines the community's *pro tanto* equity and appreciation share when one spouse owned a home before marriage and community income paid down the mortgage principal during marriage.
* **Pre-Marital Business & Investment Apportionment:**
  * *Pereira v. Pereira* (1909) 156 Cal. 1 & *Van Camp v. Van Camp* (1921) 53 Cal.App. 17: Determines how much of a separate-property business's growth during marriage belongs to the community (labor/skill) vs. separate estate (capital).
  * *Beam v. Bank of America* (1971) 6 Cal.3d 12: Applies apportionment rules to separate-property investments/securities actively managed during marriage.

---

## 6. User Stories & Functional Requirements
*Prioritization key: **P0** (Must-have for MVP), **P1** (Should-have), **P2** (Stretch goal).*

| ID | Priority | Feature Area | User Story / Requirement | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-1** | **P0** | **Relationship & Goal Intake** | As a user, I want to answer an intake flow covering my **relationship stage**, **app goal** (Legal Separation vs. Divorce vs. Financial Education), and **prenup status** (Prenup vs. No Prenup) so I receive a tailored roadmap. | - Captures: Stage (Pre-marital / Married <10 yrs / Married 10+ yrs / Separated), Goal (Separation, Divorce, Education), Prenup (Yes/No/Unsure).<br>- Outputs a tailored legal path explaining the 6-month divorce wait vs. separation, prenup impact (FC §§ 1600–1617), and generates the specific California form list. |
| **FR-2** | **P0** | **Financial Discovery Engine** | As a user, I want to input or upload financial records (**mortgage statements, assets/debts, and tax returns**) so I can see an estimated breakdown of what money and equity I would keep after a California divorce. | - Accepts structured inputs or parsed PDFs (last 2 years tax returns, pay stubs, mortgage balance/purchase price/date of marriage, bank/retirement/credit balances).<br>- Distinguishes Community (FC § 760) vs. Separate Property (FC § 770), flags potential *Moore/Marsden* home equity claims or FC § 2640 reimbursements, and outputs an estimated 50/50 net community split + equalization payment estimate.<br>- Displays transparent assumptions and statutory/case citations. |
| **FR-3** | **P0** | **Document Tracker** | As a user, I want a centralized tracker of required California court forms and supporting financial documents so I know what I have gathered, what is missing, and upcoming deadlines. | - Pre-populates CA Judicial Council forms based on FR-1 (**FL-100** Petition, **FL-110** Summons, **FL-120** Response, **FL-140** Declaration of Disclosure, **FL-141** Proof of Service, **FL-142/FL-160** Assets & Debts, **FL-150** Income & Expense).<br>- Tracks supporting docs (2 yrs tax returns, 2 mos pay stubs, mortgage/bank/401k statements) and 60-day disclosure deadline reminders.<br>- Links directly to official `selfhelp.courts.ca.gov` instructions. |
| **FR-4** | **P0** | **Chatbot Buddy (AI Agent)** | As a user, I want to ask a trauma-informed AI Chatbot Buddy questions about California divorce, separation, and my financial scenario, grounded in official court guidelines. | - Agent uses RAG over `selfhelp.courts.ca.gov/divorce-california`, `selfhelp.courts.ca.gov/divorce`, and CA Family Code.<br>- Context-aware via Auth/Database layer (remembers user's intake stage, prenup status, and discovery progress).<br>- Every legal explanation includes inline citations and a clear "Not Legal Advice" disclaimer; automatically surfaces DV hotline resources (1-800-799-SAFE) if abuse/crisis cues are detected. |
| **FR-5** | **P1** | **Safety & Discreet UX** | As a user in an unsafe household, I want a "Quick Exit" button and discreet session handling so my partner cannot easily see my activity. | - Persistent "Quick Exit" button redirects immediately to a neutral site (e.g., weather/news) and clears local session state.<br>- Neutral branding option / non-obvious browser tab title. |
| **FR-6** | **P2** | **Life-Stage Options (Stretch)** | As a user, I want tailored guidance across different life/relationship stages (e.g., dating/cohabiting, newlywed, stay-at-home parent, approaching retirement) so the app adapts beyond active divorce. | - Adds scenario branches for cohabitation vs. marriage, long-term marriage (10+ years under FC § 4320), and retirement QDRO considerations. |

### Edge Cases & Error States
* **Missing / Withheld Financial Documents:** Many financially abused users do not have access to their spouse's tax returns or mortgage statements. The Financial Discovery Engine must support `"Unknown / Spouse Controls This Account"` flags and explain how mandatory discovery (FL-140/FL-142) compels disclosure.
* **Commingled Assets & Prenup Ambiguity:** If a user selects `"Unsure"` on Prenup or enters commingled funds (e.g., pre-marital down payment on a marital home), the estimator must display a *range* with a flagged warning for FC § 2640 / *Moore/Marsden* complexity rather than a false-precision single number.
* **Hallucination / Out-of-Jurisdiction Queries:** If a user asks about non-California law (e.g., Texas or New York), the Chatbot Buddy must explicitly decline to answer out-of-state law and restate its California-only scope.

---

## 7. Design & User Experience
* **Tone & Accessibility:** Calm, trauma-informed, non-judgmental copy at an 8th-grade reading level for legal explanations. Avoid alarmist language so users in healthy relationships also feel comfortable using the app for financial education.
* **Core User Flow:**
  1. **Landing / Mode Selection:** Discreet overview with persistent Quick-Exit button in header.
  2. **Auth & Onboarding Intake:** Create account -> 3-step intake (Stage, Goal: Separation vs. Divorce vs. Education, Prenup status).
  3. **Dashboard (3 Pillars):**
     * *My Financial Picture* (Discovery Engine inputs + Post-Divorce Equity Estimator card).
     * *My Document Tracker* (CA Forms FL-100 through FL-150 + tax/mortgage upload checklist).
     * *Ask Buddy* (Persistent side-drawer or tab for the grounded AI Chatbot).

---

## 8. Non-Functional Requirements
* **Security & Privacy (Critical):**
  * End-to-end TLS encryption in transit; AES-256 encryption at rest for all uploaded financial documents (tax returns, mortgage statements) and PII.
  * Strict Auth isolation: JWT/session-based authentication ensuring the AI Agent only queries database records scoped to the authenticated `user_id`.
  * Explicit data retention controls: Users must have a one-click **"Delete All My Data"** option.
* **Compliance & Legal Guardrails:**
  * Persistent UPL (Unauthorized Practice of Law) disclaimer on onboarding, Discovery Engine outputs, and Chatbot Buddy.
  * CCPA compliance (California Consumer Privacy Act) for California residents.
* **Accessibility & Responsiveness:**
  * WCAG 2.1 AA compliant; mobile-responsive down to 375px (crucial for users accessing discreetly on a phone).

---

## 9. Technical Architecture & Stack
* **Frontend:** **React** (SPA with React Router, Tailwind CSS/accessible component library, client-side Quick-Exit handler, interactive charts for Community vs. Separate equity breakdown).
* **Backend API:** **Node.js + Express** (RESTful API handling intake logic, deterministic financial calculation engine for FC § 2550 / *Moore/Marsden* math, file upload/parsing pipeline, and proxy to AI Agent).
* **Database & Auth Layer with Agent:**
  * **Database:** PostgreSQL storing `users`, `intake_profiles`, `financial_items` (assets, debts, mortgages, income), `document_checklist_items`, and `chat_sessions`; `pgvector` storing chunked embeddings of `selfhelp.courts.ca.gov` pages and CA Family Code sections.
  * **Auth + Agent Integration:** Authenticated middleware injects verified `user_id` context into the AI Agent's tool-calling/retrieval pipeline so the Chatbot Buddy can read the user's current Document Tracker status and Financial Discovery summary without exposing cross-tenant data.
* **Analytics & Telemetry (Privacy-Safe):** Track anonymized funnel events (`intake_completed`, `discovery_calculated`, `doc_checked_off`, `chatbot_citation_clicked`)—never log raw financial values or PII in analytics tools.
* **Risks & Mitigations:**
  * *Risk:* AI Chatbot gives inaccurate legal advice or hallucinates a CA form number -> *Mitigation:* Strict RAG grounding with mandatory source URLs from `selfhelp.courts.ca.gov`, deterministic rule-based lookup for form checklists, and deterministic JS/TS math for financial splits (never let the LLM perform arithmetic).
  * *Risk:* Partner discovers browser history or uploaded tax PDFs -> *Mitigation:* Quick-Exit button, short session timeouts, and server-side encrypted storage rather than local browser storage.

---

## 10. Rollout & Go-to-Market Plan
* **Phase 1 — Internal & Legal SME Alpha:** Test deterministic Financial Discovery Engine math against sample California divorce scenarios (simple 50/50 split, *Moore/Marsden* pre-marital house, valid prenup) with a California family law reviewer.
* **Phase 2 — Closed Beta:** Partner with 1–2 California domestic violence financial advocacy groups and general financial-literacy communities to validate trauma-informed UX and educational clarity.
* **Phase 3 — Public Launch (California):** Launch web app with SEO/community outreach focused on California financial literacy and legal self-help readiness.

---

## 11. Open Questions & Decision Log

### Open Questions
* [ ] Which PDF/OCR parsing tool will we use in Node/Express to extract baseline numbers from uploaded tax returns (Form 1040) and mortgage statements without sending sensitive PII to unapproved third-party endpoints? — *Assigned to Engineering Lead*
* [ ] Should unauthenticated guests be allowed to try the Financial Discovery Engine in ephemeral memory (for safety/low friction) before creating an account? — *Assigned to Product / Design*
* [ ] What specific thresholds trigger the Chatbot Buddy's crisis/DV hotline banner? — *Assigned to Product / Legal Advisor*

### Decision Log
| Date | Decision | Rationale | Decided By |
| :--- | :--- | :--- | :--- |
| 2026-11-13 | Scope v1 strictly to California law | Community property statutes (FC § 760, § 2550) and Judicial Council forms vary drastically by state; focusing on CA ensures accuracy and citation rigor. | Product |
| 2026-11-13 | Separate deterministic math from LLM Chatbot | Prevents AI arithmetic errors in post-divorce equity/mortgage estimates; LLM only explains deterministic outputs and cites knowledge base. | Product / Eng |
