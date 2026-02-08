import { supabase } from '@/integrations/supabase/client';

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

export const saveAppointment = async (data: AppointmentData): Promise<SaveAppointmentResult> => {
  try {
    // Double-check availability before inserting
    const bookedSlots = await getBookedTimeSlotsForDate(data.date, data.location);
    if (bookedSlots.includes(data.time)) {
      return { appointment: null, error: 'slot_taken' };
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        service: data.service,
        vehicle: data.vehicle,
        appointment_date: data.date.toISOString().split('T')[0],
        appointment_time: data.time,
        location: data.location,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving appointment:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return { appointment: null, error: 'slot_taken' };
      }
      return { appointment: null, error: 'unknown' };
    }

    return { appointment: mapAppointment(appointment) };
  } catch (error) {
    console.error('Error saving appointment:', error);
    return { appointment: null, error: 'unknown' };
  }
};

export const getAppointmentById = async (id: string): Promise<SavedAppointment | null> => {
  try {
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error || !appointment) {
      console.error('Error fetching appointment:', error);
      return null;
    }

    return mapAppointment(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return null;
  }
};

export const getAppointmentsByEmail = async (email: string): Promise<SavedAppointment[]> => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select()
      .eq('email', email.toLowerCase().trim())
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return appointments?.map(mapAppointment) || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Service durations in minutes (parsed from translation strings)
export const getServiceDurationMinutes = (serviceDuration: string): number => {
  // Parse duration strings like "45 perc", "1-2 óra", "30 min", "1 hour", etc.
  const lowerDuration = serviceDuration.toLowerCase();
  
  // Handle "Változó" / "Varies" - default to 60 min
  if (lowerDuration.includes('változó') || lowerDuration.includes('varies')) {
    return 60;
  }
  
  // Handle range like "1-2 óra" / "1-2 hours" - use the maximum
  const rangeMatch = lowerDuration.match(/(\d+)-(\d+)\s*(óra|hour)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2]) * 60;
  }
  
  // Handle single hour like "1 óra" / "1 hour"
  const hourMatch = lowerDuration.match(/(\d+)\s*(óra|hour)/);
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60;
  }
  
  // Handle minutes like "45 perc" / "45 min"
  const minMatch = lowerDuration.match(/(\d+)\s*(perc|min)/);
  if (minMatch) {
    return parseInt(minMatch[1]);
  }
  
  // Default to 30 minutes
  return 30;
};

// Calculate how many 30-minute slots a service occupies
export const getServiceSlotCount = (durationMinutes: number): number => {
  return Math.ceil(durationMinutes / 30);
};

// Get booked time slots for a specific date, considering service durations
export const getBookedTimeSlotsForDate = async (date: Date, location: string): Promise<string[]> => {
  try {
    const dateString = date.toISOString().split('T')[0];
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, service')
      .eq('appointment_date', dateString)
      .eq('location', location)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }

    // Return raw booked times - the component will handle duration-based blocking
    return appointments?.map(a => a.appointment_time) || [];
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }
};

// Get full appointment data for a date (including service info for duration calculation)
export const getBookedAppointmentsForDate = async (date: Date, location: string): Promise<{ time: string; service: string }[]> => {
  try {
    const dateString = date.toISOString().split('T')[0];
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, service')
      .eq('appointment_date', dateString)
      .eq('location', location)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching booked appointments:', error);
      return [];
    }

    return appointments?.map(a => ({ time: a.appointment_time, service: a.service })) || [];
  } catch (error) {
    console.error('Error fetching booked appointments:', error);
    return [];
  }
};

export const cancelAppointment = async (
  id: string,
  sendEmail: boolean = true,
  language: 'hu' | 'en' = 'hu'
): Promise<boolean> => {
  try {
    // First get the appointment details for the email
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      console.error('Appointment not found');
      return false;
    }

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling appointment:', error);
      return false;
    }

    // Send cancellation email
    if (sendEmail) {
      try {
        await supabase.functions.invoke('send-appointment-update-email', {
          body: {
            type: 'cancellation',
            appointmentId: id,
            customerName: appointment.name,
            customerEmail: appointment.email,
            service: appointment.service,
            vehicle: appointment.vehicle,
            originalDate: appointment.date.toISOString(),
            originalTime: appointment.time,
            location: appointment.location,
            language,
          },
        });
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return false;
  }
};

export const rescheduleAppointment = async (
  id: string,
  newDate: Date,
  newTime: string,
  sendEmail: boolean = true,
  language: 'hu' | 'en' = 'hu'
): Promise<SavedAppointment | null> => {
  try {
    // First get the original appointment details
    const originalAppointment = await getAppointmentById(id);
    if (!originalAppointment) {
      console.error('Appointment not found');
      return null;
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        appointment_date: newDate.toISOString().split('T')[0],
        appointment_time: newTime,
        status: 'rescheduled',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rescheduling appointment:', error);
      return null;
    }

    // Send reschedule email
    if (sendEmail) {
      try {
        await supabase.functions.invoke('send-appointment-update-email', {
          body: {
            type: 'reschedule',
            appointmentId: id,
            customerName: originalAppointment.name,
            customerEmail: originalAppointment.email,
            service: originalAppointment.service,
            vehicle: originalAppointment.vehicle,
            originalDate: originalAppointment.date.toISOString(),
            originalTime: originalAppointment.time,
            newDate: newDate.toISOString(),
            newTime: newTime,
            location: originalAppointment.location,
            language,
          },
        });
      } catch (emailError) {
        console.error('Error sending reschedule email:', emailError);
        // Don't fail the reschedule if email fails
      }
    }

    return mapAppointment(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return null;
  }
};

// Helper function to map database row to SavedAppointment
const mapAppointment = (appointment: any): SavedAppointment => ({
  id: appointment.id,
  service: appointment.service,
  vehicle: appointment.vehicle,
  date: new Date(appointment.appointment_date),
  time: appointment.appointment_time,
  location: appointment.location,
  name: appointment.name,
  email: appointment.email,
  phone: appointment.phone || '',
  status: appointment.status,
  created_at: appointment.created_at,
});
