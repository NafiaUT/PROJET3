import React from 'react';
import { SmartWindow } from '../../types';
import { useThings } from '../../contexts/ThingsContext';
import { useAuth } from '../../contexts/AuthContext';

const SmartWindowControl: React.FC<{ thing: SmartWindow }> = ({ thing }) => {
  const { updateThing } = useThings();
  const { hasScope } = useAuth();
  const canControl = hasScope('write:things');

  const handleToggle = () => {
    if (!canControl) return;
    updateThing(thing.id, { status: thing.status === 'OPEN' ? 'CLOSED' : 'OPEN' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-400">Etat</span>
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${thing.status === 'OPEN' ? 'text-blue-500' : 'text-gray-500'}`}>
            {thing.status}
          </span>
          <button
            onClick={handleToggle}
            disabled={!canControl}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              thing.status === 'OPEN' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                thing.status === 'OPEN' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2">
        L'etat de la fenetre peut etre modifie automatiquement par le systeme en fonction de la qualite de l'air.
      </p>
    </div>
  );
};

export default SmartWindowControl;
