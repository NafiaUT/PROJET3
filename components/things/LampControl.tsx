
import React from 'react';
import { Lamp } from '../../types';
import { useThings } from '../../contexts/ThingsContext';
import { useAuth } from '../../contexts/AuthContext';

const LampControl: React.FC<{ thing: Lamp }> = ({ thing }) => {
  const { updateThing } = useThings();
  const { hasScope } = useAuth();
  const canControl = hasScope('write:things');

  const handleToggle = () => {
    if (!canControl) return;
    updateThing(thing.id, { status: thing.status === 'ON' ? 'OFF' : 'ON' });
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    updateThing(thing.id, { brightness: parseInt(e.target.value, 10) });
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
      <div className="space-y-2">
        <label htmlFor={`brightness-${thing.id}`} className="text-gray-500 dark:text-gray-400 text-sm">Brightness</label>
        <div className="flex items-center space-x-3">
          <input
            id={`brightness-${thing.id}`}
            type="range"
            min="0"
            max="100"
            value={thing.brightness}
            onChange={handleBrightnessChange}
            disabled={!canControl || thing.status === 'OFF'}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 dark:accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{thing.brightness}%</span>
        </div>
      </div>
    </div>
  );
};

export default LampControl;
