import { apiRequest, getStoredTokens } from './api';

export interface AppointmentData {
  service: string;
  vehicle: string;
  date: Date;
  time: string;
  location: string;
  name: string;
  email: string;
  phone: string;
}

export interface SavedAppointment extends AppointmentData {
  id: string;
  status: string;
  created_at: string;
}

export interface SaveAppointmentResult {
  appointment: SavedAppointment | null;
  error?: 'slot_taken' | 'unknown';
}

// Service durations in minutes (parsed from translation strings)
export const getServiceDurationMinutes = (serviceDuration: string): number => {
  const lowerDuration = serviceDuration.toLowerCase();
  if (lowerDuration.includes('változó') || lowerDuration.includes('varies')) return 60;
  const rangeMatch = lowerDuration.match(/(\d+)-(\d+)\s*(óra|hour)/);
  if (rangeMatch) return parseInt(rangeMatch[2]) * 60;
  const hourMatch = lowerDuration.match(/(\d+)\s*(óra|hour)/);
  if (hourMatch) return parseInt(hourMatch[1]) * 60;
  const minMatch = lowerDuration.match(/(\d+)\s*(perc|min)/);
  if (minMatch) return parseInt(minMatch[1]);
  return 30;
};

export const getServiceSlotCount = (durationMinutes: number): number => {
  return Math.ceil(durationMinutes / 30);
};

// Bay/station assignment: bay 1 = maintenance + ptcheater, bay 2 = everything else
const BAY_1_SERVICES = ['maintenance', 'ptcheater'];

export const getServiceBay = (serviceId: string): number => {
  return BAY_1_SERVICES.includes(serviceId) ? 1 : 2;
};

// TODO: These functions are stubs - the actual booking flow needs to be
// reworked to use the new REST API's /reservations endpoints.
// For now they return empty/null to avoid build errors.

export const saveAppointment = async (_data: AppointmentData): Promise<SaveAppointmentResult> => {
  console.warn("saveAppointment: Not yet connected to new API");
  return { appointment: null, error: 'unknown' };
};

export const getAppointmentById = async (_id: string): Promise<SavedAppointment | null> => {
  console.warn("getAppointmentById: Not yet connected to new API");
  return null;
};

export const getAppointmentsByEmail = async (_email: string): Promise<SavedAppointment[]> => {
  console.warn("getAppointmentsByEmail: Not yet connected to new API");
  return [];
};

export const getBookedTimeSlotsForDate = async (_date: Date, _location: string): Promise<string[]> => {
  return [];
};

export const getBookedAppointmentsForDate = async (_date: Date, _location: string): Promise<{ time: string; service: string }[]> => {
  return [];
};

export const cancelAppointment = async (
  _id: string,
  _sendEmail: boolean = true,
  _language: 'hu' | 'en' = 'hu'
): Promise<boolean> => {
  console.warn("cancelAppointment: Not yet connected to new API");
  return false;
};

export const rescheduleAppointment = async (
  _id: string,
  _newDate: Date,
  _newTime: string,
  _sendEmail: boolean = true,
  _language: 'hu' | 'en' = 'hu'
): Promise<SavedAppointment | null> => {
  console.warn("rescheduleAppointment: Not yet connected to new API");
  return null;
};
