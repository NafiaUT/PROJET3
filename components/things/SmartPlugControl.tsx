
import React from 'react';
import { SmartPlug } from '../../types';
import { useThings } from '../../contexts/ThingsContext';
import { useAuth } from '../../contexts/AuthContext';

const SmartPlugControl: React.FC<{ thing: SmartPlug }> = ({ thing }) => {
  const { updateThing } = useThings();
  const { hasScope } = useAuth();
  const canControl = hasScope('write:things');

  const handleToggle = () => {
    if (!canControl) return;
    updateThing(thing.id, { status: thing.status === 'ON' ? 'OFF' : 'ON' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-400">Status</span>
        <div className="flex items-center space-x-2">
           <span className={`font-semibold ${thing.status === 'ON' ? 'text-green-500' : 'text-gray-500'}`}>
              {thing.status}
           </span>
            <button
                onClick={handleToggle}
                disabled={!canControl}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                thing.status === 'ON' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    thing.status === 'ON' ? 'translate-x-6' : 'translate-x-1'
                }`}
                />
            </button>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">Power Consumption:</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">{thing.powerConsumption.toFixed(2)} W</span>
      </div>
    </div>
  );
};

export default SmartPlugControl;
