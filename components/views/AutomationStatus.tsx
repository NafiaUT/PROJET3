import React from 'react';
import { useThings } from '../../contexts/ThingsContext';
import Card from '../ui/Card';
import { RobotIcon } from '../../utils/icons';

const AutomationStatus: React.FC = () => {
  const { isAutomationEnabled, toggleAutomation, automationEvents } = useThings();

  return (
    <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Etat de l'automatisation</h3>
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
            {isAutomationEnabled ? 'Active' : 'Desactive'}
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Journal des evenements</h3>
        <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-2">
          {automationEvents.length > 0 ? (
            automationEvents.map(event => (
              <div key={event.id} className="flex items-start text-gray-600 dark:text-gray-400">
                <RobotIcon className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                <div>
                  <span className="font-mono text-xs block">{event.timestamp.toLocaleTimeString()}</span>
                  <span>{event.message}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              Aucun evenement d'automatisation pour le moment.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AutomationStatus;
