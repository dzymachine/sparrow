# Know What's Yours | RuthAI

> **Empathetic Divorce Financial Discovery Platform for Women**  
> *Google AI Hackathon for Women's Social Good*

---

## 🌟 The Vision & Core Insight
Divorce cuts women's household income by roughly **41% to 50%**, and the women hit hardest are often the ones who never handled or saw the marital finances. 

Every existing legal tool asks the user to type in what they own. But if she was kept out of the accounts, she cannot list assets she doesn't know exist. 

**Know What's Yours (RuthAI)** reads messy financial paperwork (tax returns, W-2s, bank slips, retirement statements) using Google's Gemini multimodal reasoning, discovers hidden assets and missing disclosures, maps out state-specific entitlements, simulates a 5-year post-divorce budget ("Can I afford the house?"), and generates a lawyer consultation brief to save hundreds of dollars in legal fees.

---

## 🏛️ The 4 Core Pillars (v1 Skeleton)

1. **Landing Page (`/`)**: Empathetic, empowering introduction with research statistics, core pillars, and discreet safety exit.
2. **Sign Up & Login (`/auth`)**: Secure authentication via Firebase, Google Dev Account, or one-click Instant Demo Access.
3. **Onboarding Flow (`/onboarding`)**: 4-step wizard tailoring guidance to state jurisdiction (Community Property vs Equitable Distribution), marriage duration, children, and financial involvement.
4. **Home Dashboard (`/dashboard`)**:
   - **Financial Document Vault & Discovery Engine**: Cites discovered accounts back to source pages (e.g. Schedule B interest income).
   - **Entitlements Checklist**: 401(k) / QDROs, spousal maintenance duration, home equity, COBRA healthcare.
   - **Post-Divorce Life Projection**: 5-year affordability simulation for keeping vs selling the marital home.
   - **Ruth AI Advisor Chat**: Contextualized conversation powered by stored user profile and agent memory.
   - **Lawyer Prep Brief Exporter**: One-click download of discovered assets and target consultation questions.

---

## 🛡️ Digital Safety: Quick Safe Exit
In abusive or high-conflict situations, browsing privacy is critical. A prominent **Quick Safe Exit** bar is pinned to the header, allowing the user to immediately redirect to a neutral site (Weather.com).

---

## 🚀 Quickstart & Development

### 1. Prerequisites
- Node.js v18+ 
- npm v9+

### 2. Install Dependencies
```bash
# In the ruthAI directory:
npm run install:all
```

### 3. Start Development Servers
```bash
# Runs both Node.js Express backend (port 5001) and Vite React client (port 5173):
npm run dev
```

* **Client**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## ⚙️ Architecture & Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, React Router 7.
* **Backend**: Node.js, Express, Firebase Admin SDK integration, Agent Memory store.
* **Storage & Auth**: Firebase Auth + Firestore (with automatic local memory-store fallback for instant evaluation without environment setup).
* **AI Engine**: Google Gemini API long-context multimodal document reasoning.
