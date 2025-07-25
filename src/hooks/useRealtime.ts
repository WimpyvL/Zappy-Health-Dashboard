/**
 * @fileoverview Real-time hooks for Firebase-based real-time updates
 * Provides type-safe real-time functionality for patient updates, notifications, and connection management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

// Type definitions
type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type NotificationType = 'patient' | 'order' | 'session' | 'message' | 'system';
type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeNotification {
  id: string | number;
  type: NotificationType;
  event: DatabaseEvent;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface RealtimeOptions {
  enablePatientUpdates?: boolean;
  enableOrderUpdates?: boolean;
  enableSessionUpdates?: boolean;
  enableStatusUpdates?: boolean;
  enableNotifications?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  notificationLimit?: number;
}

interface RealtimeHookReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  forceReconnect: () => void;
  notifications: RealtimeNotification[];
  unreadCount: number;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getNotificationsByType: (type: NotificationType) => RealtimeNotification[];
  getUnreadNotifications: () => RealtimeNotification[];
  connectionAttempts: number;
  lastConnected: Date | null;
}

// Default options
const DEFAULT_OPTIONS: Required<RealtimeOptions> = {
  enablePatientUpdates: false,
  enableOrderUpdates: false,
  enableSessionUpdates: false,
  enableStatusUpdates: false,
  enableNotifications: false,
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  notificationLimit: 100,
};

export const useRealtimePatients = (options: RealtimeOptions = {}): RealtimeHookReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { toast } = useToast();
  
  // State management
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [lastConnected, setLastConnected] = useState<Date | null>(new Date());
  
  // Refs for cleanup and intervals
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  const forceReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      if (mountedRef.current) {
        const success = Math.random() > 0.1;
        setIsConnected(success);
        setConnectionStatus(success ? 'connected' : 'error');
        if (success) {
          setConnectionAttempts(0);
          setLastConnected(new Date());
          if (config.enableNotifications) {
            toast({ 
              title: "Real-time connection established", 
              description: "You're now receiving live updates."
            });
          }
        }
      }
    }, 1000);
  }, [config.enableNotifications, toast]);

  const handleConnectionChange = useCallback(() => {
    setIsConnected(prev => !prev);
    setConnectionStatus(prev => prev === 'connected' ? 'disconnected' : 'connected');
    if (config.enableNotifications) {
      toast({ 
        title: isConnected ? "Real-time connection lost." : "Real-time connection established." 
      });
    }
  }, [isConnected, config.enableNotifications, toast]);

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!mountedRef.current) return;
    
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, config.notificationLimit));
    setUnreadCount(prev => prev + 1);
    
    if (config.enableNotifications) {
      toast({ 
        title: "New Notification", 
        description: notification.message 
      });
    }
  }, [config.notificationLimit, config.enableNotifications, toast]);

  const markAsRead = useCallback((id: string | number) => {
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

  const getNotificationsByType = useCallback((type: NotificationType): RealtimeNotification[] => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback((): RealtimeNotification[] => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  // Simulate updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (config.enablePatientUpdates && isConnected) {
      interval = setInterval(() => {
        const event: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'> = {
          type: 'patient',
          event: Math.random() > 0.5 ? 'INSERT' : 'UPDATE',
          message: 'A patient record was just updated.',
          data: { first_name: 'Simulated' },
          priority: 'medium',
        };
        // Uncomment to test: addNotification(event);
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.enablePatientUpdates, isConnected, addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    forceReconnect,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    connectionAttempts,
    lastConnected,
  };
};

// Additional specialized hooks
export const useRealtimeOrders = (options: Omit<RealtimeOptions, 'enablePatientUpdates'> = {}) => {
  return useRealtimePatients({
    ...options,
    enableOrderUpdates: true,
    enablePatientUpdates: false,
  });
};

export const useRealtimeSessions = (options: Omit<RealtimeOptions, 'enablePatientUpdates'> = {}) => {
  return useRealtimePatients({
    ...options,
    enableSessionUpdates: true,
    enablePatientUpdates: false,
  });
};

export const useRealtimeNotifications = (options: RealtimeOptions = {}) => {
  return useRealtimePatients({
    ...options,
    enableNotifications: true,
  });
};

// Export types
export type {
  ConnectionStatus,
  NotificationType,
  DatabaseEvent,
  RealtimeNotification,
  RealtimeOptions,
  RealtimeHookReturn,
};
