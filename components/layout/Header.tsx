
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon } from '../../utils/icons';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">WoT Dashboard</h1>
      <div className="flex items-center">
        <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username}</span>
      </div>
    </header>
  );
};

export default Header;
