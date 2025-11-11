
import React from 'react';
import { AmbientSensor } from '../../types';

const AmbientSensorDisplay: React.FC<{ thing: AmbientSensor }> = ({ thing }) => {
  const co2Quality =
    thing.airQualityCO2 > 1000
      ? 'text-red-500'
      : thing.airQualityCO2 > 800
      ? 'text-yellow-500'
      : 'text-green-500';

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Humidity:</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">{thing.humidity.toFixed(1)}%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 dark:text-gray-400">Air Quality (CO2):</span>
        <span className={`font-semibold ${co2Quality}`}>{thing.airQualityCO2} ppm</span>
      </div>
    </div>
  );
};

export default AmbientSensorDisplay;
