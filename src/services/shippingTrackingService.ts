/**
 * Shipping Tracking Service
 * 
 * This service handles real-time tracking of prescription deliveries and medical supplies.
 * Integrates with major shipping carriers (FedEx, UPS, USPS, DHL) and provides
 * automated notifications for delivery status updates.
 * Adapted from the old repository to work with Firebase.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// Shipping Carriers
export type ShippingCarrier = 'fedex' | 'ups' | 'usps' | 'dhl' | 'amazon' | 'other';

// Shipping Status
export type ShippingStatus = 
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_attempted'
  | 'exception'
  | 'returned'
  | 'cancelled';

// Tracking Event
export interface TrackingEvent {
  timestamp: string;
  status: ShippingStatus;
  location?: string;
  description: string;
  carrier?: ShippingCarrier;
}

// Delivery Address
export interface DeliveryAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

// Shipment Interface
export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: ShippingCarrier;
  patientId: string;
  orderId?: string;
  
  // Shipment Details
  status: ShippingStatus;
  estimatedDelivery?: string;
  actualDelivery?: string;
  
  // Addresses
  fromAddress: DeliveryAddress;
  toAddress: DeliveryAddress;
  
  // Package Information
  packageInfo: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    value?: number;
    description: string;
    isSignatureRequired?: boolean;
    isAdultSignatureRequired?: boolean;
  };
  
  // Tracking History
  trackingEvents: TrackingEvent[];
  
  // Notifications
  notificationsEnabled: boolean;
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastTracked?: Timestamp;
  
  // Special Handling
  isControlledSubstance?: boolean;
  requiresRefrigeration?: boolean;
  isFragile?: boolean;
}

// Carrier API Configuration
const CARRIER_CONFIG = {
  fedex: {
    apiUrl: 'https://apis.fedex.com/track/v1/trackingnumbers',
    authRequired: true,
    rateLimit: 1000, // requests per hour
  },
  ups: {
    apiUrl: 'https://onlinetools.ups.com/track/v1/details',
    authRequired: true,
    rateLimit: 1000,
  },
  usps: {
    apiUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
    authRequired: true,
    rateLimit: 5000,
  },
  dhl: {
    apiUrl: 'https://api-eu.dhl.com/track/shipments',
    authRequired: true,
    rateLimit: 250,
  }
};

export const shippingTrackingService = {
  /**
   * Create a new shipment tracking record
   */
  async createShipment(shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shipment> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const shipmentId = `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const shipment: Shipment = {
        ...shipmentData,
        id: shipmentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const shipmentRef = doc(db, 'shipments', shipmentId);
      await setDoc(shipmentRef, shipment);

      // Start tracking immediately
      await this.startTracking(shipmentId);

      return shipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  },

  /**
   * Get shipment by ID
   */
  async getShipment(shipmentId: string): Promise<Shipment | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const shipmentRef = doc(db, 'shipments', shipmentId);
      const shipmentDoc = await getDoc(shipmentRef);

      if (!shipmentDoc.exists()) {
        return null;
      }

      return shipmentDoc.data() as Shipment;
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
  },

  /**
   * Get shipments by tracking number
   */
  async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const q = query(
        collection(db, 'shipments'),
        where('trackingNumber', '==', trackingNumber),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as Shipment;
    } catch (error) {
      console.error('Error fetching shipment by tracking number:', error);
      throw error;
    }
  },

  /**
   * Get all shipments for a patient
   */
  async getPatientShipments(
    patientId: string,
    status?: ShippingStatus,
    limitCount: number = 50
  ): Promise<Shipment[]> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      let q = query(
        collection(db, 'shipments'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(
          collection(db, 'shipments'),
          where('patientId', '==', patientId),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Shipment);
    } catch (error) {
      console.error('Error fetching patient shipments:', error);
      throw error;
    }
  },

  /**
   * Update shipment tracking information
   */
  async updateShipmentTracking(
    shipmentId: string,
    trackingEvents: TrackingEvent[],
    status?: ShippingStatus,
    estimatedDelivery?: string,
    actualDelivery?: string
  ): Promise<Shipment> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const shipmentRef = doc(db, 'shipments', shipmentId);
      const updateData: Partial<Shipment> = {
        trackingEvents,
        lastTracked: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (status) {
        updateData.status = status;
      }

      if (estimatedDelivery) {
        updateData.estimatedDelivery = estimatedDelivery;
      }

      if (actualDelivery) {
        updateData.actualDelivery = actualDelivery;
      }

      await updateDoc(shipmentRef, updateData);

      // Get updated shipment
      const updatedDoc = await getDoc(shipmentRef);
      const updatedShipment = updatedDoc.data() as Shipment;

      // Send notifications if enabled
      if (updatedShipment.notificationsEnabled) {
        await this.sendTrackingNotification(updatedShipment);
      }

      return updatedShipment;
    } catch (error) {
      console.error('Error updating shipment tracking:', error);
      throw error;
    }
  },

  /**
   * Start tracking a shipment
   */
  async startTracking(shipmentId: string): Promise<void> {
    try {
      const shipment = await this.getShipment(shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Perform initial tracking
      await this.trackShipment(shipment);

      // Schedule periodic tracking updates
      // In a real implementation, this would use a job queue or cron job
      console.log(`Started tracking for shipment ${shipmentId} with tracking number ${shipment.trackingNumber}`);
    } catch (error) {
      console.error('Error starting tracking:', error);
      throw error;
    }
  },

  /**
   * Track a shipment with carrier API
   */
  async trackShipment(shipment: Shipment): Promise<TrackingEvent[]> {
    try {
      // In a real implementation, this would call the actual carrier APIs
      // For now, we'll simulate tracking data
      const mockTrackingEvents = await this.simulateCarrierTracking(shipment);

      // Update shipment with new tracking events
      await this.updateShipmentTracking(
        shipment.id,
        mockTrackingEvents,
        this.determineStatusFromEvents(mockTrackingEvents),
        this.extractEstimatedDelivery(mockTrackingEvents)
      );

      return mockTrackingEvents;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw error;
    }
  },

  /**
   * Simulate carrier tracking (replace with actual API calls)
   */
  async simulateCarrierTracking(shipment: Shipment): Promise<TrackingEvent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = new Date();
    const events: TrackingEvent[] = [
      {
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'label_created',
        location: 'Origin Facility',
        description: 'Shipping label created',
        carrier: shipment.carrier
      },
      {
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'picked_up',
        location: 'Origin Facility',
        description: 'Package picked up by carrier',
        carrier: shipment.carrier
      },
      {
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        location: 'Transit Hub',
        description: 'Package in transit',
        carrier: shipment.carrier
      }
    ];

    // Add delivery event if it's time
    if (Math.random() > 0.7) {
      events.push({
        timestamp: now.toISOString(),
        status: 'out_for_delivery',
        location: shipment.toAddress.city,
        description: 'Out for delivery',
        carrier: shipment.carrier
      });
    }

    return events;
  },

  /**
   * Determine shipment status from tracking events
   */
  determineStatusFromEvents(events: TrackingEvent[]): ShippingStatus {
    if (events.length === 0) {
      return 'label_created';
    }

    // Get the most recent event
    const latestEvent = events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return latestEvent.status;
  },

  /**
   * Extract estimated delivery from tracking events
   */
  extractEstimatedDelivery(events: TrackingEvent[]): string | undefined {
    // In a real implementation, this would parse delivery estimates from carrier responses
    // For simulation, return a date 1-3 days from now
    const daysToAdd = Math.floor(Math.random() * 3) + 1;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);
    return estimatedDate.toISOString();
  },

  /**
   * Send tracking notification
   */
  async sendTrackingNotification(shipment: Shipment): Promise<void> {
    try {
      const latestEvent = shipment.trackingEvents[shipment.trackingEvents.length - 1];
      if (!latestEvent) return;

      const notificationData = {
        patientId: shipment.patientId,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        description: latestEvent.description,
        location: latestEvent.location,
        estimatedDelivery: shipment.estimatedDelivery
      };

      // Send SMS notification
      if (shipment.notificationPreferences.sms) {
        console.log('Sending SMS notification:', notificationData);
        // TODO: Integrate with SMS service
      }

      // Send email notification
      if (shipment.notificationPreferences.email) {
        console.log('Sending email notification:', notificationData);
        // TODO: Integrate with email service
      }

      // Send push notification
      if (shipment.notificationPreferences.push) {
        console.log('Sending push notification:', notificationData);
        // TODO: Integrate with push notification service
      }
    } catch (error) {
      console.error('Error sending tracking notification:', error);
    }
  },

  /**
   * Get delivery confirmation details
   */
  async getDeliveryConfirmation(shipmentId: string): Promise<{
    isDelivered: boolean;
    deliveryDate?: string;
    deliveryTime?: string;
    signedBy?: string;
    deliveryLocation?: string;
    proofOfDelivery?: string;
  }> {
    try {
      const shipment = await this.getShipment(shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const deliveredEvent = shipment.trackingEvents.find(
        event => event.status === 'delivered'
      );

      if (!deliveredEvent) {
        return { isDelivered: false };
      }

      return {
        isDelivered: true,
        deliveryDate: deliveredEvent.timestamp.split('T')[0],
        deliveryTime: deliveredEvent.timestamp.split('T')[1],
        deliveryLocation: deliveredEvent.location,
        signedBy: 'Recipient', // Would come from carrier API
        proofOfDelivery: `POD_${shipment.trackingNumber}` // Would be actual proof URL
      };
    } catch (error) {
      console.error('Error getting delivery confirmation:', error);
      throw error;
    }
  },

  /**
   * Handle delivery exceptions
   */
  async handleDeliveryException(
    shipmentId: string,
    exceptionType: string,
    description: string,
    resolution?: string
  ): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const shipmentRef = doc(db, 'shipments', shipmentId);
      const exceptionEvent: TrackingEvent = {
        timestamp: new Date().toISOString(),
        status: 'exception',
        description: `${exceptionType}: ${description}`,
        location: 'Exception Processing'
      };

      await updateDoc(shipmentRef, {
        status: 'exception',
        trackingEvents: [...(await this.getShipment(shipmentId))!.trackingEvents, exceptionEvent],
        updatedAt: Timestamp.now()
      });

      // Send exception notification
      const shipment = await this.getShipment(shipmentId);
      if (shipment?.notificationsEnabled) {
        await this.sendTrackingNotification(shipment);
      }
    } catch (error) {
      console.error('Error handling delivery exception:', error);
      throw error;
    }
  },

  /**
   * Get shipping statistics
   */
  async getShippingStats(patientId?: string): Promise<{
    total: number;
    byStatus: Record<ShippingStatus, number>;
    byCarrier: Record<ShippingCarrier, number>;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      let q = query(collection(db, 'shipments'));
      
      if (patientId) {
        q = query(collection(db, 'shipments'), where('patientId', '==', patientId));
      }

      const querySnapshot = await getDocs(q);
      const shipments = querySnapshot.docs.map(doc => doc.data() as Shipment);

      const stats = {
        total: shipments.length,
        byStatus: {} as Record<ShippingStatus, number>,
        byCarrier: {} as Record<ShippingCarrier, number>,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0
      };

      let totalDeliveryTime = 0;
      let deliveredCount = 0;
      let onTimeDeliveries = 0;

      shipments.forEach(shipment => {
        // Count by status
        stats.byStatus[shipment.status] = (stats.byStatus[shipment.status] || 0) + 1;
        
        // Count by carrier
        stats.byCarrier[shipment.carrier] = (stats.byCarrier[shipment.carrier] || 0) + 1;
        
        // Calculate delivery metrics
        if (shipment.status === 'delivered' && shipment.actualDelivery) {
          deliveredCount++;
          const deliveryTime = new Date(shipment.actualDelivery).getTime() - shipment.createdAt.toMillis();
          totalDeliveryTime += deliveryTime;
          
          // Check if delivered on time
          if (shipment.estimatedDelivery) {
            const estimatedTime = new Date(shipment.estimatedDelivery).getTime();
            const actualTime = new Date(shipment.actualDelivery).getTime();
            if (actualTime <= estimatedTime) {
              onTimeDeliveries++;
            }
          }
        }
      });

      stats.averageDeliveryTime = deliveredCount > 0 ? totalDeliveryTime / deliveredCount / (1000 * 60 * 60 * 24) : 0; // in days
      stats.onTimeDeliveryRate = deliveredCount > 0 ? (onTimeDeliveries / deliveredCount) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting shipping stats:', error);
      throw error;
    }
  },

  /**
   * Validate tracking number format
   */
  validateTrackingNumber(trackingNumber: string, carrier: ShippingCarrier): boolean {
    const patterns = {
      fedex: /^(\d{12}|\d{14}|\d{20})$/,
      ups: /^1Z[0-9A-Z]{16}$/,
      usps: /^(\d{20}|\d{22}|[A-Z]{2}\d{9}US)$/,
      dhl: /^\d{10,11}$/,
      amazon: /^TBA\d{12}$/,
      other: /.+/ // Accept any format for other carriers
    };

    return patterns[carrier]?.test(trackingNumber) || false;
  }
};

export default shippingTrackingService;
