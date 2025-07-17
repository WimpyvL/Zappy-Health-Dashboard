
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Assuming supabase client is exported from here
import { toast } from 'react-toastify';

export const useRealtimePatients = (options = {}) => {
  const { 
    enablePatientUpdates = false, 
    enableStatusUpdates = false, 
    enableNotifications = false 
  } = options;

  const [isConnected, setIsConnected] = useState(supabase.realtime.isConnected());
  const [connectionStatus, setConnectionStatus] = useState(supabase.realtime.status);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleConnectionChange = useCallback(() => {
    setIsConnected(supabase.realtime.isConnected());
    setConnectionStatus(supabase.realtime.status);
    if (supabase.realtime.isConnected()) {
      toast.info("Real-time connection established.");
    } else {
      toast.warn("Real-time connection lost. Attempting to reconnect...");
    }
  }, []);

  const forceReconnect = useCallback(() => {
    supabase.realtime.disconnect();
    setTimeout(() => supabase.realtime.connect(), 1000);
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
    if (enableNotifications) {
      toast.info(notification.message);
    }
  }, [enableNotifications]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const statusSubscription = supabase.realtime.onStateChange((status, error) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    });

    let patientSubscription = null;
    if (enablePatientUpdates) {
      patientSubscription = supabase
        .channel('public:patients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
          const event = {
            id: Date.now(),
            type: 'patient',
            event: payload.eventType,
            message: `Patient ${payload.new.first_name || ''} ${payload.eventType === 'INSERT' ? 'created' : 'updated'}.`,
            data: payload.new,
            read: false,
          };
          addNotification(event);
        })
        .subscribe();
    }
    
    // You could add more subscriptions here based on options, e.g., for status updates
    // if (enableStatusUpdates) { ... }

    return () => {
      statusSubscription.unsubscribe();
      if (patientSubscription) {
        supabase.removeChannel(patientSubscription);
      }
    };
  }, [enablePatientUpdates, handleConnectionChange, addNotification]);

  return {
    isConnected,
    connectionStatus,
    forceReconnect,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};
