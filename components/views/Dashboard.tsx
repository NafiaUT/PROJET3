import React from 'react';
import { useThings } from '../../contexts/ThingsContext';
import { Thing, ThingType } from '../../types';
import Card from '../ui/Card';
import { LampIcon, ThermostatIcon, MotionSensorIcon, SmartPlugIcon, AmbientSensorIcon, WindowIcon } from '../../utils/icons';
import LampControl from '../things/LampControl';
import ThermostatControl from '../things/ThermostatControl';
import MotionSensorDisplay from '../things/MotionSensorDisplay';
import SmartPlugControl from '../things/SmartPlugControl';
import AmbientSensorDisplay from '../things/AmbientSensorDisplay';
import SmartWindowControl from '../things/SmartWindowControl';
import AutomationStatus from './AutomationStatus';

const ThingCard: React.FC<{ thing: Thing }> = ({ thing }) => {
  const getIcon = () => {
    switch (thing.type) {
      case ThingType.LAMP:
        return <LampIcon className="h-8 w-8 text-yellow-400" />;
      case ThingType.THERMOSTAT:
        return <ThermostatIcon className="h-8 w-8 text-red-500" />;
      case ThingType.MOTION_SENSOR:
        return <MotionSensorIcon className="h-8 w-8 text-blue-500" />;
      case ThingType.SMART_PLUG:
        return <SmartPlugIcon className="h-8 w-8 text-green-500" />;
      case ThingType.AMBIENT_SENSOR:
        return <AmbientSensorIcon className="h-8 w-8 text-purple-500" />;
      case ThingType.SMART_WINDOW:
        return <WindowIcon className="h-8 w-8 text-cyan-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (thing.type) {
      case ThingType.LAMP:
        return <LampControl thing={thing} />;
      case ThingType.THERMOSTAT:
        return <ThermostatControl thing={thing} />;
      case ThingType.MOTION_SENSOR:
        return <MotionSensorDisplay thing={thing} />;
      case ThingType.SMART_PLUG:
        return <SmartPlugControl thing={thing} />;
      case ThingType.AMBIENT_SENSOR:
        return <AmbientSensorDisplay thing={thing} />;
      case ThingType.SMART_WINDOW:
        return <SmartWindowControl thing={thing} />;
      default:
        return <p>Unknown device type</p>;
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{thing.name}</h3>
        {getIcon()}
      </div>
      <div>{renderContent()}</div>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { things } = useThings();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Device Dashboard</h2>
      
      <AutomationStatus />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {
          Object.values(things).map((thing: Thing) => (
            <ThingCard key={thing.id} thing={thing} />
          ))
        }
      </div>
    </div>
  );
};

export default Dashboard;
