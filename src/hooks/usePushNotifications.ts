import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PushNotificationState {
  token: string | null;
  isSupported: boolean;
  isRegistered: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isSupported: false,
    isRegistered: false,
    error: null,
  });

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const initPushNotifications = async () => {
      try {
        // Request permission
        const permStatus = await PushNotifications.requestPermissions();
        
        if (permStatus.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
        } else {
          setState(prev => ({ 
            ...prev, 
            error: 'Push notification permission denied' 
          }));
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize push notifications' 
        }));
      }
    };

    // Listen for registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({ 
        ...prev, 
        token: token.value, 
        isRegistered: true 
      }));
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Push registration failed' 
      }));
    });

    // Listen for push notifications received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      toast(notification.title || 'Notification', {
        description: notification.body,
      });
    });

    // Listen for push notification action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const registerTokenForAppointment = async (appointmentId: string, platform: 'ios' | 'android') => {
    if (!state.token) {
      console.error('No push token available');
      return false;
    }

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          appointment_id: appointmentId,
          device_token: state.token,
          platform,
        });

      if (error) {
        console.error('Error registering push token:', error);
        return false;
      }

      console.log('Push token registered for appointment:', appointmentId);
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  };

  return {
    ...state,
    registerTokenForAppointment,
  };
};
