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

export const saveAppointment = async (data: AppointmentData): Promise<SavedAppointment | null> => {
  try {
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
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving appointment:', error);
      return null;
    }

    return mapAppointment(appointment);
  } catch (error) {
    console.error('Error saving appointment:', error);
    return null;
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
