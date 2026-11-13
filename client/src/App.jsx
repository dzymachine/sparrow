import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AgentMemoryProvider } from './context/AgentMemoryContext';
import { DiscoveryProvider } from './context/DiscoveryContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import RuthBuddyWidget from './components/RuthBuddyWidget';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage.tsx';
import FinancialDiscoveryPage from './pages/FinancialDiscoveryPage.tsx';
import DivorceChecklistPage from './pages/DivorceChecklistPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import ConsultProfessionalPage from './pages/ConsultProfessionalPage.tsx';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AgentMemoryProvider>
          <DiscoveryProvider>
            <div className="flex flex-col min-h-screen bg-[#F8F6F2]">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  {/* 1. Landing Page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* 2. Sign Up / Login Page */}
                  <Route path="/auth" element={<AuthPage />} />

                  {/* 3. Onboarding Flow */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 4. Home Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 5. Financial Discovery Engine Page */}
                  <Route
                    path="/discovery"
                    element={
                      <ProtectedRoute>
                        <FinancialDiscoveryPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 6. Divorce Document Checklist Page */}
                  <Route
                    path="/checklist"
                    element={
                      <ProtectedRoute>
                        <DivorceChecklistPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 7. Account & Security Settings Page */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 8. Consult a Family Law Professional (Google Maps Finder) */}
                  <Route path="/consult" element={<ConsultProfessionalPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <RuthBuddyWidget />
            </div>
          </DiscoveryProvider>
        </AgentMemoryProvider>
      </AuthProvider>
    </Router>
  );
}
