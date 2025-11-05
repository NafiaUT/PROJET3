
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardIcon, AnalyticsIcon, LogoutIcon, LogoIcon } from '../../utils/icons';
import { View } from '../../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { logout } = useAuth();

  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: DashboardIcon },
    { view: View.ANALYTICS, label: 'Analytics', icon: AnalyticsIcon },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <LogoIcon className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-lg font-bold text-gray-800 dark:text-gray-200">WoT Eco</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
              currentView === item.view
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <LogoutIcon className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
