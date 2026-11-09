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
import { t } from './utils/language';

const AppContent: React.FC = () => {
  const { currentUser, isOwner, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(isOwner ? 'overview' : 'calendar');

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
      pageTitle = t('Chef-Übersicht');
      pageSubtitle = t('Abrechnung & Finanzen');
    } else if (activeTab === 'calendar') {
      pageTitle = t('Zeiterfassung');
      pageSubtitle = t('Tageszeiten der Arbeiter');
    } else if (activeTab === 'team') {
      pageTitle = t('Team & Sätze');
      pageSubtitle = t('Mitarbeiterverwaltung');
    } else if (activeTab === 'profile') {
      pageTitle = t('Inhaber-Konto');
      pageSubtitle = currentUser.displayName;
    }
  } else {
    if (activeTab === 'calendar') {
      pageTitle = t('Mein Kalender');
      pageSubtitle = t('Tägliche Zeiterfassung');
    } else if (activeTab === 'summary') {
      pageTitle = t('Meine Abrechnung');
      pageSubtitle = t('Lohn & Monatsstunden');
    } else if (activeTab === 'profile') {
      pageTitle = t('Mein Profil');
      pageSubtitle = currentUser.displayName;
    }
  }

  return (
    <div className="min-h-screen bg-ios-bg text-slate-900 pb-20">
      <Header
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      <main className="pt-2 animate-in fade-in duration-150">
        {isOwner ? (
          <>
            {activeTab === 'overview' && (
              <OwnerDashboard onNavigateToCalendar={() => setActiveTab('calendar')} />
            )}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'team' && <TeamManagementView />}
            {activeTab === 'profile' && <ProfileView />}
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
        onTabChange={tab => setActiveTab(tab)}
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
