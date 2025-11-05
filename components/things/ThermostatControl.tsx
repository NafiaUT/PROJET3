
import React from 'react';
import { Thermostat, ThermostatMode } from '../../types';
import { useThings } from '../../contexts/ThingsContext';
import { useAuth } from '../../contexts/AuthContext';

const ThermostatControl: React.FC<{ thing: Thermostat }> = ({ thing }) => {
  const { updateThing } = useThings();
  const { hasScope } = useAuth();
  const canControl = hasScope('write:things');

  const handleTargetTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControl) return;
    updateThing(thing.id, { targetTemperature: parseInt(e.target.value, 10) });
  };

  const setMode = (mode: ThermostatMode) => {
    if (!canControl) return;
    updateThing(thing.id, { mode });
  };

  const modeColors: { [key in ThermostatMode]: string } = {
    [ThermostatMode.HEATING]: 'bg-red-500 hover:bg-red-600',
    [ThermostatMode.ECO]: 'bg-green-500 hover:bg-green-600',
    [ThermostatMode.OFF]: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700',
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-800 dark:text-gray-200">
          {thing.currentTemperature.toFixed(1)}°C
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Current Temperature</div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor={`target-temp-${thing.id}`} className="text-gray-500 dark:text-gray-400 text-sm">Target Temperature: {thing.targetTemperature}°C</label>
        <input
          id={`target-temp-${thing.id}`}
          type="range"
          min="15"
          max="30"
          value={thing.targetTemperature}
          onChange={handleTargetTempChange}
          disabled={!canControl || thing.mode === ThermostatMode.OFF}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <span className="text-gray-500 dark:text-gray-400 text-sm mb-2 block">Mode</span>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(ThermostatMode).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              disabled={!canControl}
              className={`px-2 py-1 text-xs sm:text-sm font-semibold text-white rounded-md transition-opacity ${
                thing.mode === mode ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : ''
              } ${modeColors[mode]} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThermostatControl;
