
import React from 'react';
import { useThings } from '../../contexts/ThingsContext';
import Card from '../ui/Card';
import { RobotIcon } from '../../utils/icons'; // Assuming a new icon is added

const AutomationStatus: React.FC = () => {
  const { isAutomationEnabled, toggleAutomation, automationEvents } = useThings();

  return (
    <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Automation Status</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAutomation}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAutomationEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAutomationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`font-semibold ${isAutomationEnabled ? 'text-green-500' : 'text-gray-500'}`}>
            {isAutomationEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      <div>
         <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Live Event Log</h3>
         <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-2">
            {automationEvents.length > 0 ? (
                automationEvents.map(event => (
                    <div key={event.id} className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="font-mono text-xs mr-2">{event.timestamp.toLocaleTimeString()}</span>
                        <span>{event.message}</span>
                    </div>
                ))
            ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No automation events yet.</p>
            )}
         </div>
      </div>
    </Card>
  );
};

export default AutomationStatus;
