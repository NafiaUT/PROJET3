import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Thing, ThingType, ThermostatMode, Lamp, Thermostat, MotionSensor, AutomationEvent, SmartPlug, AmbientSensor, SmartWindow } from '../types';

interface ThingsContextType {
  things: Record<string, Thing>;
  updateThing: (id: string, updates: Partial<Thing>) => void;
  isAutomationEnabled: boolean;
  toggleAutomation: () => void;
  automationEvents: AutomationEvent[];
}

const ThingsContext = createContext<ThingsContextType | undefined>(undefined);

const initialThings: Record<string, Thing> = {
  'lamp-1': { id: 'lamp-1', name: 'Living Room Lamp', type: ThingType.LAMP, status: 'OFF', brightness: 75 },
  'thermostat-1': { id: 'thermostat-1', name: 'Main Thermostat', type: ThingType.THERMOSTAT, currentTemperature: 20.5, targetTemperature: 21, mode: ThermostatMode.HEATING },
  'motion-1': { id: 'motion-1', name: 'Hallway Sensor', type: ThingType.MOTION_SENSOR, motionDetected: false },
  'plug-1': { id: 'plug-1', name: 'Air Purifier Plug', type: ThingType.SMART_PLUG, status: 'OFF', powerConsumption: 0 },
  'ambient-1': { id: 'ambient-1', name: 'Office Sensor', type: ThingType.AMBIENT_SENSOR, humidity: 45.2, airQualityCO2: 650 },
  'window-1': { id: 'window-1', name: 'Smart Window', type: ThingType.SMART_WINDOW, status: 'CLOSED' },
};

const INACTIVITY_TIMEOUT = 20 * 1000; 

export const ThingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [things, setThings] = useState<Record<string, Thing>>(initialThings);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true);
  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>([]);

  const automationState = useRef({
    lampTurnOffTime: 0,
    noMotionSince: Date.now(),
    outdoorTemperature: 18,
    dayCycle: 0,
  }).current;

  const addAutomationEvent = (message: string) => {
    const newEvent: AutomationEvent = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      message,
    };
    setAutomationEvents(prev => [newEvent, ...prev].slice(0, 10));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setThings(currentThings => {
        const newThings: Record<string, Thing> = JSON.parse(JSON.stringify(currentThings));

        // --- SENSOR & ENVIRONMENT SIMULATION ---
        const thermostat = newThings['thermostat-1'] as Thermostat;
        // Simulate outdoor temperature cycle (warmer day, cooler night)
        automationState.dayCycle += 0.1;
        automationState.outdoorTemperature = 15 + Math.sin(automationState.dayCycle) * 5; // Varies between 10°C and 20°C
        
        if(thermostat.mode === ThermostatMode.HEATING && thermostat.currentTemperature < thermostat.targetTemperature) {
          thermostat.currentTemperature += 0.2;
        } else if (thermostat.mode === ThermostatMode.ECO && thermostat.currentTemperature > 17) {
          thermostat.currentTemperature -= 0.1;
        } else if ((newThings['window-1'] as SmartWindow).status === 'OPEN') {
           // Cools down faster if window is open and it's colder outside
          if(thermostat.currentTemperature > automationState.outdoorTemperature) {
            thermostat.currentTemperature -= 0.3;
          }
        }
        else if (thermostat.currentTemperature > 15) {
          thermostat.currentTemperature -= 0.05; // Natural heat loss
        }


        if (Math.random() < 0.15) (newThings['motion-1'] as MotionSensor).motionDetected = !(newThings['motion-1'] as MotionSensor).motionDetected;

        const ambient = newThings['ambient-1'] as AmbientSensor;
        ambient.humidity += (Math.random() - 0.5);
        if(ambient.humidity < 30) ambient.humidity = 30; if(ambient.humidity > 70) ambient.humidity = 70;
        
        let co2Change = -5; // Natural dissipation
        if ((newThings['motion-1'] as MotionSensor).motionDetected) co2Change += 20;
        if ((newThings['window-1'] as SmartWindow).status === 'OPEN') co2Change -= 40;
        if ((newThings['plug-1'] as SmartPlug).status === 'ON') co2Change -= 25;
        ambient.airQualityCO2 += co2Change;
        if(ambient.airQualityCO2 < 400) ambient.airQualityCO2 = 400; if(ambient.airQualityCO2 > 1200) ambient.airQualityCO2 = 1200;


        const plug = newThings['plug-1'] as SmartPlug;
        plug.powerConsumption = plug.status === 'ON' ? 50 + (Math.random() - 0.5) * 5 : 0;
        
        // --- AUTOMATION ENGINE ---
        if (isAutomationEnabled) {
          const lamp = newThings['lamp-1'] as Lamp;
          const motion = newThings['motion-1'] as MotionSensor;
          const window = newThings['window-1'] as SmartWindow;
          const now = Date.now();

          const wasManuallyUpdated = (thing: Thing, withinSeconds: number) => {
            return thing.lastManualUpdate && now - thing.lastManualUpdate < withinSeconds * 1000;
          };

          // --- New Automation Rules ---
          
          // Rule: CO2 Safety Ventilation (High Priority) - Overrides other rules
          if (ambient.airQualityCO2 > 1000 && window.status === 'CLOSED' && !wasManuallyUpdated(window, 300)) {
            window.status = 'OPEN';
            addAutomationEvent(`CO2 Safety Alert! Opening window. (Outdoor: ${automationState.outdoorTemperature.toFixed(1)}°C)`);
          } 
          // Rule: Natural "Free Cooling" Ventilation (Comfort/Eco Priority)
          else if (thermostat.currentTemperature > thermostat.targetTemperature + 1 && automationState.outdoorTemperature < thermostat.currentTemperature && window.status === 'CLOSED' && !wasManuallyUpdated(window, 300)) {
            window.status = 'OPEN';
            addAutomationEvent(`Too warm inside. Opening window for natural cooling. (Outdoor: ${automationState.outdoorTemperature.toFixed(1)}°C)`);
          } 
          // Rule: Close window when no longer needed
          else if (window.status === 'OPEN' && !wasManuallyUpdated(window, 300)) {
            if (ambient.airQualityCO2 < 800 && thermostat.currentTemperature <= thermostat.targetTemperature) {
                 window.status = 'CLOSED';
                 addAutomationEvent("Conditions optimal. Closing window.");
            } else if (automationState.outdoorTemperature >= thermostat.currentTemperature) {
                window.status = 'CLOSED';
                addAutomationEvent("No longer cooler outside. Closing window.");
            }
          }

          // Rule: Energy Saving - Thermostat off if window is open
          if (thermostat.mode === ThermostatMode.HEATING && window.status === 'OPEN' && !wasManuallyUpdated(thermostat, 60)) {
            thermostat.mode = ThermostatMode.OFF;
            addAutomationEvent("Window open! Turning off thermostat to save energy.");
          }
          
          // Rule: Smart Air Purifier (Moderate Priority)
          const wasPlugManuallyUpdated = wasManuallyUpdated(plug, 300);
          if (ambient.airQualityCO2 > 850 && motion.motionDetected && plug.status === 'OFF' && window.status === 'CLOSED' && !wasPlugManuallyUpdated) {
            plug.status = 'ON';
            addAutomationEvent("Moderate CO2. Activating Air Purifier.");
          } else if (plug.status === 'ON' && !wasPlugManuallyUpdated && (ambient.airQualityCO2 < 700 || window.status === 'OPEN')) {
            const reason = window.status === 'OPEN' ? "Window opened" : "Air quality restored";
            plug.status = 'OFF';
            addAutomationEvent(`${reason}. Deactivating Air Purifier.`);
          }


          // --- Core Automation Rules ---
          if(motion.motionDetected) automationState.noMotionSince = now;

          // Rule 1: Motion Lighting
          if (motion.motionDetected && lamp.status === 'OFF' && !wasManuallyUpdated(lamp, 60)) {
            lamp.status = 'ON';
            automationState.lampTurnOffTime = now + 60 * 1000;
            addAutomationEvent("Motion detected. Turning on lamp.");
          } else if (lamp.status === 'ON' && automationState.lampTurnOffTime && now > automationState.lampTurnOffTime && !wasManuallyUpdated(lamp, 60)) {
            lamp.status = 'OFF';
            automationState.lampTurnOffTime = 0;
            addAutomationEvent("Lamp timeout. Turning off lamp.");
          }
          
          // Rule 3: Eco Mode on Inactivity
          if (!motion.motionDetected && now - automationState.noMotionSince > INACTIVITY_TIMEOUT) {
              if (thermostat.mode !== ThermostatMode.ECO && !wasManuallyUpdated(thermostat, 300)) {
                  thermostat.mode = ThermostatMode.ECO;
                  thermostat.targetTemperature = 17;
                  addAutomationEvent("Inactivity detected. Activating ECO mode.");
              }
              if (lamp.status === 'ON' && !wasManuallyUpdated(lamp, 60)) {
                lamp.status = 'OFF';
                addAutomationEvent("Inactivity detected. Turning off lamp.");
              }
          }
          
          // Rule 2 & 4: Comfort Mode / Resume from Eco
          if (motion.motionDetected) {
            if (thermostat.mode === ThermostatMode.ECO && !wasManuallyUpdated(thermostat, 300)) {
              thermostat.mode = ThermostatMode.HEATING;
              thermostat.targetTemperature = 19;
              addAutomationEvent("Motion detected. Resuming HEATING mode.");
            } else if (thermostat.currentTemperature < 19 && thermostat.mode === ThermostatMode.OFF && !wasManuallyUpdated(thermostat, 300)) {
              thermostat.mode = ThermostatMode.HEATING;
              thermostat.targetTemperature = 21;
              if (lamp.status === 'OFF' && !wasManuallyUpdated(lamp, 60)) lamp.status = 'ON';
              addAutomationEvent("Comfort rule: Motion & low temp. Activating HEATING.");
            }
          }
        }
        
        return newThings;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutomationEnabled, automationState]);

  const updateThing = useCallback((id: string, updates: Partial<Thing>) => {
    const manualUpdate = { ...updates, lastManualUpdate: Date.now() };
    setThings(currentThings => ({
      ...currentThings,
      [id]: { ...currentThings[id], ...manualUpdate } as Thing,
    }));
  }, []);

  const toggleAutomation = () => setIsAutomationEnabled(prev => !prev);

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
