
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThingsProvider } from './contexts/ThingsContext';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/views/Dashboard';
import Analytics from './components/views/Analytics';
import { View } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);

  if (!user) {
    return <Login />;
  }

  return (
    <ThingsProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            {currentView === View.DASHBOARD && <Dashboard />}
            {currentView === View.ANALYTICS && <Analytics />}
          </main>
        </div>
      </div>
    </ThingsProvider>
  );
};

export default App;
