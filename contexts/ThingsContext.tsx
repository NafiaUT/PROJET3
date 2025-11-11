
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Thing, ThingType, ThermostatMode, Lamp, Thermostat, MotionSensor, AutomationEvent, AmbientSensor, SmartWindow } from '../types';

interface ThingsContextType {
  things: Record<string, Thing>;
  updateThing: (id: string, updates: Partial<Thing>) => void;
  isAutomationEnabled: boolean;
  toggleAutomation: () => void;
  automationEvents: AutomationEvent[];
}

const ThingsContext = createContext<ThingsContextType | undefined>(undefined);

// Simulation constants for better readability and easier tweaking
const SIMULATION_TICK_RATE_MS = 2000;
const INACTIVITY_TIMEOUT_MS = 20 * 1000;
const LAMP_ON_DURATION_MS = 60 * 1000;

const CO2 = {
  NATURAL_DISSIPATION: -5,
  PERSON_PRESENCE: 20,
  WINDOW_VENTILATION: -40,
  AIR_PURIFIER: -25,
  SAFE_THRESHOLD: 800,
  HIGH_THRESHOLD: 1000,
  PURIFIER_ON_THRESHOLD: 850,
  PURIFIER_OFF_THRESHOLD: 700,
  MIN_LEVEL: 400,
  MAX_LEVEL: 1200,
};

const TEMPERATURE = {
  HEATING_RATE: 0.2,
  ECO_COOLING_RATE: -0.1,
  WINDOW_COOLING_RATE: -0.3,
  NATURAL_LOSS_RATE: -0.05,
  ECO_TARGET: 17,
  COMFORT_TARGET: 21,
  COMFORT_RESUME_TARGET: 19,
};


const initialThings: Record<string, Thing> = {
  'lamp-1': { id: 'lamp-1', name: 'Lampe du salon', type: ThingType.LAMP, status: 'OFF', brightness: 75 },
  'thermostat-1': { id: 'thermostat-1', name: 'Thermostat principal', type: ThingType.THERMOSTAT, currentTemperature: 20.5, targetTemperature: 21, mode: ThermostatMode.HEATING },
  'motion-1': { id: 'motion-1', name: 'Detecteur de mouvement', type: ThingType.MOTION_SENSOR, motionDetected: false },
  'ambient-1': { id: 'ambient-1', name: 'Capteur de qualite d\'air', type: ThingType.AMBIENT_SENSOR, humidity: 45.2, airQualityCO2: 650 },
  'window-1': { id: 'window-1', name: 'Fenetre intelligente', type: ThingType.SMART_WINDOW, status: 'CLOSED' },
};

/**
 * Provides a virtual gateway that simulates sensors, actuators, and the automation rules engine.
 * The provider centralizes all read/write access to the devices so that the UI and services stay in sync.
 */
export const ThingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [things, setThings] = useState<Record<string, Thing>>(initialThings);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>([]);

  const automationState = useRef({
    lampTurnOffTime: 0,
    noMotionSince: Date.now(),
    outdoorTemperature: 18,
    dayCycle: 0,
    motionCountdown: 0,
  }).current;

  const addAutomationEvent = useCallback((message: string) => {
    const newEvent: AutomationEvent = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      message,
    };
    setAutomationEvents(prev => [newEvent, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    const simulateSensorsAndEnvironment = (newThings: Record<string, Thing>) => {
      const thermostat = newThings['thermostat-1'] as Thermostat;
      automationState.dayCycle += 0.1;
      automationState.outdoorTemperature = 15 + Math.sin(automationState.dayCycle) * 5;

      if (thermostat.mode === ThermostatMode.HEATING && thermostat.currentTemperature < thermostat.targetTemperature) {
        thermostat.currentTemperature += TEMPERATURE.HEATING_RATE;
      } else if (thermostat.mode === ThermostatMode.ECO && thermostat.currentTemperature > TEMPERATURE.ECO_TARGET) {
        thermostat.currentTemperature += TEMPERATURE.ECO_COOLING_RATE;
      } else if ((newThings['window-1'] as SmartWindow).status === 'OPEN') {
        if (thermostat.currentTemperature > automationState.outdoorTemperature) {
          thermostat.currentTemperature += TEMPERATURE.WINDOW_COOLING_RATE;
        }
      } else if (thermostat.currentTemperature > 15) {
        thermostat.currentTemperature += TEMPERATURE.NATURAL_LOSS_RATE;
      }

      // More realistic motion sensor simulation
      const motion = newThings['motion-1'] as MotionSensor;
      automationState.motionCountdown--;

      if (automationState.motionCountdown <= 0) {
        if (motion.motionDetected) {
          // Motion was active, now set to inactive for a longer period
          motion.motionDetected = false;
          // Inactive for 20 to 60 seconds (10-30 ticks)
          automationState.motionCountdown = 10 + Math.floor(Math.random() * 20);
        } else {
          // Motion was inactive, now potentially activate it for a shorter period
          if (Math.random() < 0.3) { // 30% chance to start a motion event
            motion.motionDetected = true;
            // Active for 6 to 14 seconds (3-7 ticks)
            automationState.motionCountdown = 3 + Math.floor(Math.random() * 5);
          } else {
            // Remain inactive, check again in a bit
            automationState.motionCountdown = 5 + Math.floor(Math.random() * 10);
          }
        }
      }

      const ambient = newThings['ambient-1'] as AmbientSensor;
      ambient.humidity += (Math.random() - 0.5);
      if (ambient.humidity < 30) ambient.humidity = 30; if (ambient.humidity > 70) ambient.humidity = 70;
      
      let co2Change = CO2.NATURAL_DISSIPATION;
      if ((newThings['motion-1'] as MotionSensor).motionDetected) co2Change += CO2.PERSON_PRESENCE;
      if ((newThings['window-1'] as SmartWindow).status === 'OPEN') co2Change += CO2.WINDOW_VENTILATION;
      ambient.airQualityCO2 += co2Change;
      if (ambient.airQualityCO2 < CO2.MIN_LEVEL) ambient.airQualityCO2 = CO2.MIN_LEVEL;
      if (ambient.airQualityCO2 > CO2.MAX_LEVEL) ambient.airQualityCO2 = CO2.MAX_LEVEL;
    };

    const runAutomationEngine = (newThings: Record<string, Thing>) => {
      if (!isAutomationEnabled) return;
      
      const lamp = newThings['lamp-1'] as Lamp;
      const motion = newThings['motion-1'] as MotionSensor;
      const thermostat = newThings['thermostat-1'] as Thermostat;
      const window = newThings['window-1'] as SmartWindow;
      const ambient = newThings['ambient-1'] as AmbientSensor;
      const now = Date.now();

      const wasManuallyUpdated = (thing: Thing, withinSeconds: number) => {
        return thing.lastManualUpdate && now - thing.lastManualUpdate < withinSeconds * 1000;
      };
      
      // TODO: Abstract these rules into a configurable engine, maybe using a rules array.
      
      // Rule: CO2 Safety Ventilation (High Priority)
      if (ambient.airQualityCO2 > CO2.HIGH_THRESHOLD && window.status === 'CLOSED' && !wasManuallyUpdated(window, 300)) {
        window.status = 'OPEN';
        addAutomationEvent(`Alerte CO2 elevee. Ouverture de la fenetre. (Exterieur: ${automationState.outdoorTemperature.toFixed(1)}C)`);
      } else if (thermostat.currentTemperature > thermostat.targetTemperature + 1 && automationState.outdoorTemperature < thermostat.currentTemperature && window.status === 'CLOSED' && !wasManuallyUpdated(window, 300)) {
        window.status = 'OPEN';
        addAutomationEvent(`Trop chaud a l'interieur. Ouverture de la fenetre pour refroidissement naturel. (Exterieur: ${automationState.outdoorTemperature.toFixed(1)}C)`);
      } else if (window.status === 'OPEN' && !wasManuallyUpdated(window, 300)) {
        if (ambient.airQualityCO2 < CO2.SAFE_THRESHOLD && thermostat.currentTemperature <= thermostat.targetTemperature) {
             window.status = 'CLOSED';
             addAutomationEvent('Conditions optimales. Fermeture de la fenetre.');
        } else if (automationState.outdoorTemperature >= thermostat.currentTemperature) {
            window.status = 'CLOSED';
            addAutomationEvent("Il ne fait plus plus frais a l'exterieur. Fermeture de la fenetre.");
        }
      }

      if (thermostat.mode === ThermostatMode.HEATING && window.status === 'OPEN' && !wasManuallyUpdated(thermostat, 60)) {
        thermostat.mode = ThermostatMode.OFF;
        addAutomationEvent("Fenetre ouverte. Extinction du thermostat pour economiser de l'energie.");
      }
      
      if(motion.motionDetected) automationState.noMotionSince = now;

      if (motion.motionDetected && lamp.status === 'OFF' && !wasManuallyUpdated(lamp, 60)) {
        lamp.status = 'ON';
        automationState.lampTurnOffTime = now + LAMP_ON_DURATION_MS;
        addAutomationEvent('Mouvement detecte. Allumage de la lampe.');
      } else if (lamp.status === 'ON' && automationState.lampTurnOffTime && now > automationState.lampTurnOffTime && !wasManuallyUpdated(lamp, 60)) {
        lamp.status = 'OFF';
        automationState.lampTurnOffTime = 0;
        addAutomationEvent("Delai d'inactivite. Extinction de la lampe.");
      }
      
      if (!motion.motionDetected && now - automationState.noMotionSince > INACTIVITY_TIMEOUT_MS) {
          if (thermostat.mode !== ThermostatMode.ECO && !wasManuallyUpdated(thermostat, 300)) {
              thermostat.mode = ThermostatMode.ECO;
              thermostat.targetTemperature = TEMPERATURE.ECO_TARGET;
              addAutomationEvent('Inactivite detectee. Activation du mode ECO.');
          }
          if (lamp.status === 'ON' && !wasManuallyUpdated(lamp, 60)) {
            lamp.status = 'OFF';
            addAutomationEvent('Inactivite detectee. Extinction de la lampe.');
          }
      }
      
      if (motion.motionDetected) {
        if (thermostat.mode === ThermostatMode.ECO && !wasManuallyUpdated(thermostat, 300)) {
          thermostat.mode = ThermostatMode.HEATING;
          thermostat.targetTemperature = TEMPERATURE.COMFORT_RESUME_TARGET;
          addAutomationEvent('Mouvement detecte. Reprise du mode CHAUFFAGE.');
        } else if (thermostat.currentTemperature < 19 && thermostat.mode === ThermostatMode.OFF && !wasManuallyUpdated(thermostat, 300)) {
          thermostat.mode = ThermostatMode.HEATING;
          thermostat.targetTemperature = TEMPERATURE.COMFORT_TARGET;
          if (lamp.status === 'OFF' && !wasManuallyUpdated(lamp, 60)) lamp.status = 'ON';
          addAutomationEvent('Regle de confort : Mouvement et basse temperature. Activation du CHAUFFAGE.');
        }
      }
    };

    const simulationInterval = setInterval(() => {
      setThings(currentThings => {
        const newThings: Record<string, Thing> = JSON.parse(JSON.stringify(currentThings));
        simulateSensorsAndEnvironment(newThings);
        runAutomationEngine(newThings);
        return newThings;
      });
    }, SIMULATION_TICK_RATE_MS);

    return () => clearInterval(simulationInterval);
  }, [isAutomationEnabled, automationState, addAutomationEvent]);

  const updateThing = useCallback((id: string, updates: Partial<Thing>) => {
    setThings(currentThings => {
      const existingThing = currentThings[id];
      if (!existingThing) {
        console.error(`Cannot update thing "${id}" because it does not exist in the gateway registry.`);
        addAutomationEvent(`Echec mise a jour : appareil ${id} introuvable.`);
        return currentThings;
      }

      const manualUpdate = { ...updates, lastManualUpdate: Date.now() };
      return {
        ...currentThings,
        [id]: { ...existingThing, ...manualUpdate } as Thing,
      };
    });
  }, [addAutomationEvent]);

  const toggleAutomation = useCallback(() => {
    setIsAutomationEnabled(prev => {
      const next = !prev;
      addAutomationEvent(
        next ? 'Automatisation reactivee par un utilisateur.' : 'Automatisation mise en pause par un utilisateur.'
      );
      return next;
    });
  }, [addAutomationEvent]);

  return (
    <ThingsContext.Provider value={{ things, updateThing, isAutomationEnabled, toggleAutomation, automationEvents }}>
      {children}
    </ThingsContext.Provider>
  );
};

export const useThings = () => {
  const context = useContext(ThingsContext);
  if (context === undefined) {
    throw new Error('useThings must be used within a ThingsProvider');
  }
  return context;
};
