# Onboarding & Dynamic User Profile TL;DR

## Overview
The `feat/onboarding` branch delivers end-to-end user authentication persistence and a dynamic, 5-step intake questionnaire. It extracts user goals, marital status, child ages, and tax filing details to seed the backend **Personal LLM Wiki (`wiki/profile.md`)** and personalize the **Dashboard**.

---

## 1. Key Features Implemented

### A. Firebase Auth Session Persistence & Safe Routing
* Configured `browserLocalPersistence` in `client/src/services/firebase.js` so logged-in users remain authenticated across page reloads and browser sessions.
* Fixed signup redirect race conditions in `AuthPage.jsx` to ensure new users transition smoothly into `/onboarding`.

### B. Dynamic 5-Step Intake Questionnaire (`OnboardingPage.jsx`)
1. **Step 1: Primary Goal & Marital Status / Divorce Intent**
   * Styled select dropdown for Primary Goal (*Understand Rights, Prepare for Divorce, Explore Separation, Uncover Assets, General Education*) and current status options (*Married considering divorce, Married exploring, Legally separated, Divorced*).
2. **Step 2: State Jurisdiction & Marriage Duration**
   * Styled select dropdown for State Jurisdiction (*California Community Property, New York Equitable Distribution, Texas, Florida, etc.*) and compact marriage duration input flagging California Family Code § 4336 for 10+ year long-duration marriages.
3. **Step 3: Minor Children & Dynamic Age Inputs**
   * Clean, un-nested standalone form sections with compact input boxes for child count and dynamic age fields per child (e.g. Child 1: Age 4, Child 2: Age 8).
4. **Step 4: Tax Return Status & Financial Dynamic**
   * Styled select dropdowns for Tax Filing Status (*Married Filing Jointly, Married Filing Separately, Head of Household, Single*) and Household Financial Dynamic (*Spouse managed everything, Daily groceries & kids, Equal partnership*) with Gemini Schedule B account discovery flags.
5. **Step 5: Immediate Priorities & Discreet Safety Setup**
   * Collects top concerns (*Keep home, hidden accounts, spousal support, QDRO*) and confirms the Quick Safe Exit bar (ESC key redirect to Weather.com).

![Step 1 Goal Dropdown & Onboarding Form](/var/folders/jn/_rsvm6v54878sdz1mhf4qng00000gp/T/cursor/screenshots/page-2026-11-13T21-43-01-981Z.png)

![Un-nested Clean Step 3 Form Layout](/var/folders/jn/_rsvm6v54878sdz1mhf4qng00000gp/T/cursor/screenshots/page-2026-11-13T21-47-34-507Z.png)

![Step 4 Tax Return & Financial Control Dropdowns](/var/folders/jn/_rsvm6v54878sdz1mhf4qng00000gp/T/cursor/screenshots/page-2026-11-13T21-54-12-404Z.png)

### C. Personal LLM Wiki Context Sync (`wikiStore.js` & `memoryStore.js`)
* Enhanced `buildProfileSyncFacts()` in `server/src/store/wikiStore.js` to automatically format onboarding answers into structured facts.
* Renders canonical markdown facts directly into `wiki/profile.md` (which the Ruth AI Agent reads as foundational context in chat):
  * `Primary Goal: preparing divorce`
  * `Marital Status: married considering divorce`
  * `Jurisdiction: California`
  * `Length of marriage: 15 years (crosses CA 10-year long-duration threshold under Fam. Code § 4336)`
  * `Dependents: 2 children (Ages: 4, 8)`
  * `Tax Filing Status: married filing jointly (Form 1040 Schedule B tracing recommended)`

### D. Profile-Driven Personalized Dashboard (`DashboardPage.jsx`)
* Added dynamic guidance widgets to the Dashboard header:
  1. **Statutory Timeline Notice**: Highlights CA § 2339 6-month mandatory waiting period & residency requirements.
  2. **Child Custody & Support Widget**: Displays guideline support context customized to the user's minor children count and ages.
  3. **Schedule B Asset Discovery Vault**: Highlights interest and dividend tracing on joint Form 1040 tax returns.

![Personalized Dashboard Banner](/var/folders/jn/_rsvm6v54878sdz1mhf4qng00000gp/T/cursor/screenshots/page-2026-11-13T21-32-30-348Z.png)

---

## 2. Technical Verification
* **Server Unit & Integration Tests**: All **9/9 tests** passed in `server/tests/wikiAndAgent.test.js`, including the new profile-to-wiki sync test.
* **Client Production Build**: Vite production build completed cleanly (`dist/assets/index-*.js`).
* **Live App Running**: Running at `http://localhost:5173`.
