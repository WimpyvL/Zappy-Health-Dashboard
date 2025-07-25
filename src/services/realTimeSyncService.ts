/**
 * Real-time Sync Service
 * 
 * Provides live data synchronization across multiple clients and devices.
 * Handles real-time updates for patient data, consultations, orders, and forms.
 * Adapted from the old repository to work with Firebase Realtime Database and modern TypeScript.
 */

import { getDatabase, ref, onValue, set, push, update, remove, off, serverTimestamp } from 'firebase/database';
import { getFirebaseApp } from '@/lib/firebase';

// Real-time sync interfaces
export interface SyncEvent {
  id: string;
  type: 'create' | 'update' | 'delete' | 'status_change';
  entity: 'patient' | 'consultation' | 'order' | 'form' | 'message' | 'appointment';
  entityId: string;
  data: any;
  userId: string;
  timestamp: number;
  metadata?: SyncMetadata;
}

export interface SyncMetadata {
  source: 'user_action' | 'system_update' | 'external_api' | 'scheduled_task';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  conflictResolution?: 'last_write_wins' | 'merge' | 'manual';
  version?: string;
}

export interface SyncSubscription {
  id: string;
  path: string;
  callback: (data: any, event: SyncEvent) => void;
  filters?: SyncFilter[];
  active: boolean;
  lastSync?: number;
}

export interface SyncFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ConflictResolution {
  conflictId: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
  resolution: 'pending' | 'resolved' | 'ignored';
  resolvedData?: any;
  resolvedBy?: string;
}

export interface SyncStatus {
  connected: boolean;
  lastSync: number;
  pendingOperations: number;
  conflictsCount: number;
  subscriptionsCount: number;
  performance: {
    averageLatency: number;
    syncRate: number;
    errorRate: number;
  };
}

export interface RealTimeUpdate {
  path: string;
  data: any;
  event: 'value' | 'child_added' | 'child_changed' | 'child_removed';
  timestamp: number;
  source: string;
}

/**
 * Real-time Sync Service Class
 */
export class RealTimeSyncService {
  private database = getDatabase(getFirebaseApp());
  private subscriptions: Map<string, SyncSubscription> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private isConnected: boolean = false;
  private syncQueue: SyncEvent[] = [];
  private status: SyncStatus;

  constructor() {
    this.status = {
      connected: false,
      lastSync: 0,
      pendingOperations: 0,
      conflictsCount: 0,
      subscriptionsCount: 0,
      performance: {
        averageLatency: 0,
        syncRate: 0,
        errorRate: 0
      }
    };

    this.initialize();
  }

  /**
   * Initialize the real-time sync service
   */
  private initialize(): void {
    // Monitor connection status
    const connectedRef = ref(this.database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      this.isConnected = snapshot.val() === true;
      this.status.connected = this.isConnected;
      
      if (this.isConnected) {
        this.processSyncQueue();
        console.log('Real-time sync connected');
      } else {
        console.log('Real-time sync disconnected');
      }
    });

    console.log('Real-time Sync Service initialized');
  }

  /**
   * Subscribe to real-time updates for a specific path
   */
  subscribeToPath(
    path: string,
    callback: (data: any, event: SyncEvent) => void,
    options?: {
      filters?: SyncFilter[];
      eventTypes?: ('value' | 'child_added' | 'child_changed' | 'child_removed')[];
    }
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: SyncSubscription = {
      id: subscriptionId,
      path,
      callback,
      filters: options?.filters || [],
      active: true,
      lastSync: Date.now()
    };

    // Set up Firebase listeners
    const dataRef = ref(this.database, path);
    
    const eventTypes = options?.eventTypes || ['value'];
    
    eventTypes.forEach(eventType => {
      onValue(dataRef, (snapshot) => {
        if (!subscription.active) return;

        const data = snapshot.val();
        const syncEvent: SyncEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'update',
          entity: this.extractEntityType(path),
          entityId: this.extractEntityId(path),
          data,
          userId: 'system',
          timestamp: Date.now(),
          metadata: {
            source: 'system_update',
            priority: 'medium',
            tags: ['real_time', eventType]
          }
        };

        // Apply filters
        if (this.passesFilters(data, subscription.filters)) {
          subscription.callback(data, syncEvent);
          subscription.lastSync = Date.now();
        }
      });
    });

    this.subscriptions.set(subscriptionId, subscription);
    this.status.subscriptionsCount = this.subscriptions.size;

    console.log(`Subscribed to real-time updates: ${path}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.active = false;
    
    // Remove Firebase listeners
    const dataRef = ref(this.database, subscription.path);
    off(dataRef);

    this.subscriptions.delete(subscriptionId);
    this.status.subscriptionsCount = this.subscriptions.size;

    console.log(`Unsubscribed from real-time updates: ${subscription.path}`);
    return true;
  }

  /**
   * Sync patient data in real-time
   */
  async syncPatientData(patientId: string, data: any, userId: string): Promise<boolean> {
    try {
      const syncEvent: SyncEvent = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'update',
        entity: 'patient',
        entityId: patientId,
        data,
        userId,
        timestamp: Date.now(),
        metadata: {
          source: 'user_action',
          priority: 'high',
          tags: ['patient', 'sync'],
          conflictResolution: 'last_write_wins'
        }
      };

      // Update in real-time database
      const patientRef = ref(this.database, `patients/${patientId}`);
      await update(patientRef, {
        ...data,
        lastModified: serverTimestamp(),
        lastModifiedBy: userId
      });

      // Log sync event
      await this.logSyncEvent(syncEvent);

      console.log(`Synced patient data: ${patientId}`);
      return true;
    } catch (error) {
      console.error('Error syncing patient data:', error);
      this.addToSyncQueue({
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'update',
        entity: 'patient',
        entityId: patientId,
        data,
        userId,
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Sync consultation status in real-time
   */
  async syncConsultationStatus(
    consultationId: string,
    status: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const syncEvent: SyncEvent = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'status_change',
        entity: 'consultation',
        entityId: consultationId,
        data: { status, metadata },
        userId,
        timestamp: Date.now(),
        metadata: {
          source: 'user_action',
          priority: 'high',
          tags: ['consultation', 'status', status]
        }
      };

      // Update consultation status
      const consultationRef = ref(this.database, `consultations/${consultationId}/status`);
      await set(consultationRef, {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
        metadata
      });

      // Notify subscribers
      await this.notifyStatusChange('consultation', consultationId, status, userId);

      // Log sync event
      await this.logSyncEvent(syncEvent);

      console.log(`Synced consultation status: ${consultationId} -> ${status}`);
      return true;
    } catch (error) {
      console.error('Error syncing consultation status:', error);
      return false;
    }
  }

  /**
   * Sync order updates in real-time
   */
  async syncOrderUpdate(
    orderId: string,
    updates: Record<string, any>,
    userId: string
  ): Promise<boolean> {
    try {
      const syncEvent: SyncEvent = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'update',
        entity: 'order',
        entityId: orderId,
        data: updates,
        userId,
        timestamp: Date.now(),
        metadata: {
          source: 'user_action',
          priority: 'medium',
          tags: ['order', 'update']
        }
      };

      // Update order in real-time
      const orderRef = ref(this.database, `orders/${orderId}`);
      await update(orderRef, {
        ...updates,
        lastModified: serverTimestamp(),
        lastModifiedBy: userId
      });

      // Log sync event
      await this.logSyncEvent(syncEvent);

      console.log(`Synced order update: ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error syncing order update:', error);
      return false;
    }
  }

  /**
   * Sync form data in real-time
   */
  async syncFormData(
    formId: string,
    formData: Record<string, any>,
    progress: number,
    userId: string
  ): Promise<boolean> {
    try {
      const syncEvent: SyncEvent = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'update',
        entity: 'form',
        entityId: formId,
        data: { formData, progress },
        userId,
        timestamp: Date.now(),
        metadata: {
          source: 'user_action',
          priority: 'medium',
          tags: ['form', 'progress', `${progress}%`]
        }
      };

      // Update form data
      const formRef = ref(this.database, `forms/${formId}`);
      await update(formRef, {
        formData,
        progress,
        lastModified: serverTimestamp(),
        lastModifiedBy: userId,
        isComplete: progress >= 100
      });

      // Log sync event
      await this.logSyncEvent(syncEvent);

      console.log(`Synced form data: ${formId} (${progress}% complete)`);
      return true;
    } catch (error) {
      console.error('Error syncing form data:', error);
      return false;
    }
  }

  /**
   * Sync messages in real-time
   */
  async syncMessage(
    conversationId: string,
    message: {
      content: string;
      senderId: string;
      senderName: string;
      type: 'text' | 'image' | 'file' | 'system';
      metadata?: Record<string, any>;
    }
  ): Promise<string | null> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const messageData = {
        id: messageId,
        ...message,
        timestamp: serverTimestamp(),
        read: false
      };

      // Add message to conversation
      const messagesRef = ref(this.database, `conversations/${conversationId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, messageData);

      // Update conversation metadata
      const conversationRef = ref(this.database, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessage: message.content,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: message.senderId,
        unreadCount: serverTimestamp() // This would be calculated properly
      });

      console.log(`Synced message: ${messageId} in conversation ${conversationId}`);
      return messageId;
    } catch (error) {
      console.error('Error syncing message:', error);
      return null;
    }
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'use_local' | 'use_remote' | 'merge',
    mergedData?: any
  ): Promise<boolean> {
    try {
      const conflict = this.conflicts.get(conflictId);
      if (!conflict) return false;

      let resolvedData: any;

      switch (resolution) {
        case 'use_local':
          resolvedData = conflict.localVersion;
          break;
        case 'use_remote':
          resolvedData = conflict.remoteVersion;
          break;
        case 'merge':
          resolvedData = mergedData || this.mergeData(conflict.localVersion, conflict.remoteVersion);
          break;
      }

      // Apply resolution
      const entityRef = ref(this.database, `${conflict.entityType}s/${conflict.entityId}`);
      await update(entityRef, {
        ...resolvedData,
        lastModified: serverTimestamp(),
        conflictResolved: true
      });

      // Update conflict status
      conflict.resolution = 'resolved';
      conflict.resolvedData = resolvedData;
      conflict.resolvedBy = 'user'; // Would be actual user ID

      this.conflicts.set(conflictId, conflict);
      this.status.conflictsCount = this.conflicts.size;

      console.log(`Resolved conflict: ${conflictId} using ${resolution}`);
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  }

  /**
   * Get real-time sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): SyncSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter(conflict => conflict.resolution === 'pending');
  }

  /**
   * Force sync all subscriptions
   */
  async forceSyncAll(): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;

      try {
        // Trigger a manual sync for this subscription
        const dataRef = ref(this.database, subscription.path);
        onValue(dataRef, (snapshot) => {
          const data = snapshot.val();
          const syncEvent: SyncEvent = {
            id: `force_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'update',
            entity: this.extractEntityType(subscription.path),
            entityId: this.extractEntityId(subscription.path),
            data,
            userId: 'system',
            timestamp: Date.now(),
            metadata: {
              source: 'system_update',
              priority: 'medium',
              tags: ['force_sync']
            }
          };

          subscription.callback(data, syncEvent);
          subscription.lastSync = Date.now();
        }, { onlyOnce: true });

        successCount++;
      } catch (error) {
        console.error(`Error force syncing ${subscription.path}:`, error);
        failedCount++;
      }
    }

    console.log(`Force sync completed: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Private helper methods
   */
  private extractEntityType(path: string): 'patient' | 'consultation' | 'order' | 'form' | 'message' | 'appointment' {
    const parts = path.split('/');
    const entityType = parts[0];
    
    switch (entityType) {
      case 'patients': return 'patient';
      case 'consultations': return 'consultation';
      case 'orders': return 'order';
      case 'forms': return 'form';
      case 'messages': return 'message';
      case 'appointments': return 'appointment';
      default: return 'patient';
    }
  }

  private extractEntityId(path: string): string {
    const parts = path.split('/');
    return parts[1] || 'unknown';
  }

  private passesFilters(data: any, filters: SyncFilter[]): boolean {
    if (!filters || filters.length === 0) return true;

    return filters.every(filter => {
      const fieldValue = this.getNestedValue(data, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not_equals':
          return fieldValue !== filter.value;
        case 'greater_than':
          return fieldValue > filter.value;
        case 'less_than':
          return fieldValue < filter.value;
        case 'contains':
          return String(fieldValue).includes(String(filter.value));
        default:
          return true;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async logSyncEvent(event: SyncEvent): Promise<void> {
    try {
      const eventsRef = ref(this.database, 'sync_events');
      const newEventRef = push(eventsRef);
      await set(newEventRef, event);
    } catch (error) {
      console.error('Error logging sync event:', error);
    }
  }

  private async notifyStatusChange(
    entityType: string,
    entityId: string,
    status: string,
    userId: string
  ): Promise<void> {
    try {
      const notificationRef = ref(this.database, `notifications/${entityType}_${entityId}`);
      await set(notificationRef, {
        type: 'status_change',
        entityType,
        entityId,
        status,
        userId,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }

  private addToSyncQueue(event: SyncEvent): void {
    this.syncQueue.push(event);
    this.status.pendingOperations = this.syncQueue.length;
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isConnected || this.syncQueue.length === 0) return;

    const queueCopy = [...this.syncQueue];
    this.syncQueue = [];

    for (const event of queueCopy) {
      try {
        // Retry the sync operation
        switch (event.entity) {
          case 'patient':
            await this.syncPatientData(event.entityId, event.data, event.userId);
            break;
          case 'consultation':
            if (event.type === 'status_change') {
              await this.syncConsultationStatus(event.entityId, event.data.status, event.userId, event.data.metadata);
            }
            break;
          case 'order':
            await this.syncOrderUpdate(event.entityId, event.data, event.userId);
            break;
          case 'form':
            await this.syncFormData(event.entityId, event.data.formData, event.data.progress, event.userId);
            break;
        }
      } catch (error) {
        console.error('Error processing queued sync event:', error);
        // Re-add to queue if still failing
        this.syncQueue.push(event);
      }
    }

    this.status.pendingOperations = this.syncQueue.length;
  }

  private mergeData(localData: any, remoteData: any): any {
    // Simplified merge strategy - in real implementation, use more sophisticated merging
    const merged = { ...localData };
    
    Object.keys(remoteData).forEach(key => {
      if (remoteData[key] !== null && remoteData[key] !== undefined) {
        // Use remote value if it's newer or if local doesn't have it
        if (!merged.hasOwnProperty(key) || 
            (remoteData.lastModified && merged.lastModified && 
             remoteData.lastModified > merged.lastModified)) {
          merged[key] = remoteData[key];
        }
      }
    });

    return merged;
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService();
export default realTimeSyncService;
