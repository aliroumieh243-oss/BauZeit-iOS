import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { Header } from './components/common/Header';
import { TabBar, TabType } from './components/common/TabBar';
import { LoginView } from './components/auth/LoginView';
import { CalendarView } from './components/worker/CalendarView';
import { WorkerSummaryView } from './components/worker/WorkerSummaryView';
import { ProfileView } from './components/profile/ProfileView';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { TeamManagementView } from './components/owner/TeamManagementView';
import { FirebaseConfigModal } from './components/owner/FirebaseConfigModal';

const AppContent: React.FC = () => {
  const { currentUser, isOwner, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(isOwner ? 'overview' : 'calendar');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">BauZeit wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  // Get Page Title
  let pageTitle = 'BauZeit';
  let pageSubtitle = '';

  if (isOwner) {
    if (activeTab === 'overview') {
      pageTitle = 'Chef-Übersicht';
      pageSubtitle = 'Abrechnung & Finanzen';
    } else if (activeTab === 'calendar') {
      pageTitle = 'Zeiterfassung';
      pageSubtitle = 'Tageszeiten der Arbeiter';
    } else if (activeTab === 'team') {
      pageTitle = 'Team & Sätze';
      pageSubtitle = 'Mitarbeiterverwaltung';
    } else if (activeTab === 'settings') {
      pageTitle = 'Google Cloud';
      pageSubtitle = 'Firebase Synchronisierung';
    }
  } else {
    if (activeTab === 'calendar') {
      pageTitle = 'Mein Kalender';
      pageSubtitle = 'Tägliche Zeiterfassung';
    } else if (activeTab === 'summary') {
      pageTitle = 'Meine Abrechnung';
      pageSubtitle = 'Lohn & Monatsstunden';
    } else if (activeTab === 'profile') {
      pageTitle = 'Mein Profil';
      pageSubtitle = currentUser.displayName;
    }
  }

  return (
    <div className="min-h-screen bg-ios-bg text-slate-900 pb-20">
      <Header
        title={pageTitle}
        subtitle={pageSubtitle}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      <main className="pt-2 animate-in fade-in duration-150">
        {isOwner ? (
          <>
            {activeTab === 'overview' && (
              <OwnerDashboard onNavigateToCalendar={() => setActiveTab('calendar')} />
            )}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'team' && <TeamManagementView />}
            {activeTab === 'settings' && (
              <div className="max-w-md mx-auto px-4 pt-2">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                  <h2 className="text-base font-bold text-slate-900 mb-2">Google Cloud & Firebase</h2>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Hier kannst du deine Google Cloud Firebase Anmeldedaten hinterlegen, um alle Zeiterfassungen live in der Firebase Firestore Cloud zu sichern und auf allen Geräten zu synchronisieren.
                  </p>
                  <button
                    onClick={() => setIsFirebaseModalOpen(true)}
                    className="ios-touch w-full py-3 px-4 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md"
                  >
                    Firebase Konfiguration öffnen
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'summary' && <WorkerSummaryView />}
            {activeTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      <TabBar
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'settings') {
            setIsFirebaseModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Global Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TimeTrackingProvider>
        <AppContent />
      </TimeTrackingProvider>
    </AuthProvider>
  );
}

export default App;
