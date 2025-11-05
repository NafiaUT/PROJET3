export enum ThingType {
  LAMP = 'lamp',
  THERMOSTAT = 'thermostat',
  MOTION_SENSOR = 'motion_sensor',
  SMART_PLUG = 'smart_plug',
  AMBIENT_SENSOR = 'ambient_sensor',
  SMART_WINDOW = 'smart_window',
}

export enum ThermostatMode {
  HEATING = 'HEATING',
  ECO = 'ECO',
  OFF = 'OFF',
}

export interface BaseThing {
  id: string;
  name: string;
  type: ThingType;
  lastManualUpdate?: number; // Timestamp of the last user-initiated change
}

export interface Lamp extends BaseThing {
  type: ThingType.LAMP;
  status: 'ON' | 'OFF';
  brightness: number;
}

export interface Thermostat extends BaseThing {
  type: ThingType.THERMOSTAT;
  currentTemperature: number;
  targetTemperature: number;
  mode: ThermostatMode;
}

export interface MotionSensor extends BaseThing {
  type: ThingType.MOTION_SENSOR;
  motionDetected: boolean;
}

export interface SmartPlug extends BaseThing {
  type: ThingType.SMART_PLUG;
  status: 'ON' | 'OFF';
  powerConsumption: number;
}

export interface AmbientSensor extends BaseThing {
  type: ThingType.AMBIENT_SENSOR;
  humidity: number;
  airQualityCO2: number;
}

export interface SmartWindow extends BaseThing {
  type: ThingType.SMART_WINDOW;
  status: 'OPEN' | 'CLOSED';
}

export type Thing = Lamp | Thermostat | MotionSensor | SmartPlug | AmbientSensor | SmartWindow;

export interface User {
  username: string;
  token: string;
  scopes: string[];
}

export enum View {
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
}

export interface TempHistoryData {
    hour: string;
    avgTemp: number;
}

export interface PowerHistoryData {
    day: string;
    totalPower: number;
}

export interface MotionHistoryData {
    hour: string;
    detections: number;
}

export interface AnalyticsSummary {
  temperatureHistory: TempHistoryData[];
  powerHistory: PowerHistoryData[];
  motionHistory: MotionHistoryData[];
}

export interface AutomationEvent {
  id: string;
  timestamp: Date;
  message: string;
}
