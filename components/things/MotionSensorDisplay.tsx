import React from 'react';
import { MotionSensor } from '../../types';

const MotionSensorDisplay: React.FC<{ thing: MotionSensor }> = ({ thing }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">Mouvement detecte :</span>
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${
          thing.motionDetected
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}
      >
        {thing.motionDetected ? 'OUI' : 'NON'}
      </span>
    </div>
  );
};

export default MotionSensorDisplay;
