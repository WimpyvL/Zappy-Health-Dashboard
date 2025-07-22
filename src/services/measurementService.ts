/**
 * Measurement Service
 * 
 * This service handles reading and writing patient measurements for different service types.
 * Adapted from the old repository to work with Firebase instead of Supabase.
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

// Service measurement configurations
const SERVICE_MEASUREMENTS = {
  womens_health: {
    measurements: ['weight', 'energy_level', 'mood_score', 'cycle_length', 'pms_severity'],
    goals: ['target_weight', 'cycle_regularity', 'symptom_reduction'],
    metadata: {
      weight: { type: 'time_series', unit: 'lbs', min: 50, max: 500 },
      energy_level: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      mood_score: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      cycle_length: { type: 'time_series', unit: 'days', min: 20, max: 40 },
      pms_severity: { type: 'time_series', unit: 'scale', min: 1, max: 10 }
    }
  },
  mens_health: {
    measurements: ['weight', 'energy_level', 'workout_performance', 'sleep_quality'],
    goals: ['target_weight', 'energy_improvement', 'performance_goals'],
    metadata: {
      weight: { type: 'time_series', unit: 'lbs', min: 100, max: 400 },
      energy_level: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      workout_performance: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      sleep_quality: { type: 'time_series', unit: 'scale', min: 1, max: 10 }
    }
  },
  hair_loss: {
    measurements: ['hair_density', 'hair_thickness', 'shedding_count', 'scalp_health'],
    goals: ['hair_regrowth', 'shedding_reduction', 'thickness_improvement'],
    metadata: {
      hair_density: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      hair_thickness: { type: 'time_series', unit: 'scale', min: 1, max: 10 },
      shedding_count: { type: 'time_series', unit: 'count', min: 0, max: 1000 },
      scalp_health: { type: 'time_series', unit: 'scale', min: 1, max: 10 }
    },
    photoTracking: true
  },
  weight_management: {
    measurements: ['weight', 'body_fat', 'waist_circumference', 'exercise_frequency'],
    goals: ['target_weight', 'body_composition', 'fitness_goals'],
    metadata: {
      weight: { type: 'time_series', unit: 'lbs', min: 50, max: 500 },
      body_fat: { type: 'time_series', unit: 'percentage', min: 5, max: 50 },
      waist_circumference: { type: 'time_series', unit: 'inches', min: 20, max: 60 },
      exercise_frequency: { type: 'time_series', unit: 'days_per_week', min: 0, max: 7 }
    }
  }
} as const;

interface Measurement {
  date: string;
  value: number | string;
  notes?: string;
  photoUrl?: string;
}

interface MeasurementData {
  measurements?: Record<string, Measurement[]>;
  goals?: Record<string, number | string>;
  serviceType?: string;
  patientId: string;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export const measurementService = {
  /**
   * Check if a measurement type is valid for a service
   */
  isValidMeasurement(serviceType: string, measurementType: string): boolean {
    const serviceConfig = SERVICE_MEASUREMENTS[serviceType as keyof typeof SERVICE_MEASUREMENTS];
    return serviceConfig?.measurements.includes(measurementType) || false;
  },

  /**
   * Get all measurements for a patient's service enrollment
   */
  async getMeasurements(patientId: string, serviceType?: string): Promise<MeasurementData | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const measurementRef = doc(db, 'patient_measurements', patientId);
      const measurementDoc = await getDoc(measurementRef);
      
      if (!measurementDoc.exists()) {
        return null;
      }
      
      const data = measurementDoc.data() as MeasurementData;
      
      // Filter by service type if specified
      if (serviceType && data.serviceType !== serviceType) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching measurements:', error);
      throw error;
    }
  },

  /**
   * Add a new measurement
   */
  async addMeasurement(
    patientId: string, 
    measurementType: string, 
    value: number | string, 
    serviceType?: string,
    notes?: string,
    photoUrl?: string
  ): Promise<MeasurementData> {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      if (!measurementType) {
        throw new Error('Measurement type is required');
      }

      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      // Validate measurement type for service if provided
      if (serviceType && !this.isValidMeasurement(serviceType, measurementType)) {
        throw new Error(
          `Invalid measurement type "${measurementType}" for service type "${serviceType}"`
        );
      }

      const measurementRef = doc(db, 'patient_measurements', patientId);
      const existingDoc = await getDoc(measurementRef);
      
      let measurementData: MeasurementData;
      
      if (existingDoc.exists()) {
        measurementData = existingDoc.data() as MeasurementData;
      } else {
        measurementData = {
          measurements: {},
          goals: {},
          patientId,
          serviceType: serviceType || undefined,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
      }

      // Initialize measurements object if needed
      if (!measurementData.measurements) {
        measurementData.measurements = {};
      }

      // Create measurement object
      const measurement: Measurement = {
        date: new Date().toISOString(),
        value,
        ...(notes && { notes }),
        ...(photoUrl && { photoUrl })
      };

      // Get metadata for this measurement type
      const serviceConfig = serviceType ? SERVICE_MEASUREMENTS[serviceType as keyof typeof SERVICE_MEASUREMENTS] : null;
      const metadata = serviceConfig?.metadata?.[measurementType as keyof typeof serviceConfig.metadata];

      // Handle different measurement types based on metadata
      if (metadata && (metadata as any).type === 'single') {
        // Single value measurements (like height)
        measurementData.measurements[measurementType] = [measurement];
      } else {
        // Time series measurements (like weight)
        if (!measurementData.measurements[measurementType]) {
          measurementData.measurements[measurementType] = [];
        }
        measurementData.measurements[measurementType].push(measurement);
      }

      // Update timestamp
      measurementData.updatedAt = Timestamp.now();

      // Save to Firebase
      await setDoc(measurementRef, measurementData, { merge: true });

      return measurementData;
    } catch (error) {
      console.error('Error adding measurement:', error);
      throw error;
    }
  },

  /**
   * Set a goal for a patient
   */
  async setGoal(
    patientId: string, 
    goalType: string, 
    value: number | string,
    serviceType?: string
  ): Promise<MeasurementData> {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      if (!goalType) {
        throw new Error('Goal type is required');
      }

      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      // Validate goal type for service if provided
      if (serviceType) {
        const serviceConfig = SERVICE_MEASUREMENTS[serviceType as keyof typeof SERVICE_MEASUREMENTS];
        if (serviceConfig?.goals && !serviceConfig.goals.includes(goalType)) {
          throw new Error(
            `Invalid goal type "${goalType}" for service type "${serviceType}"`
          );
        }
      }

      const measurementRef = doc(db, 'patient_measurements', patientId);
      const existingDoc = await getDoc(measurementRef);
      
      let measurementData: MeasurementData;
      
      if (existingDoc.exists()) {
        measurementData = existingDoc.data() as MeasurementData;
      } else {
        measurementData = {
          measurements: {},
          goals: {},
          patientId,
          serviceType: serviceType || undefined,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
      }

      // Initialize goals object if needed
      if (!measurementData.goals) {
        measurementData.goals = {};
      }

      // Set the goal
      measurementData.goals[goalType] = value;
      measurementData.updatedAt = Timestamp.now();

      // Save to Firebase
      await setDoc(measurementRef, measurementData, { merge: true });

      return measurementData;
    } catch (error) {
      console.error('Error setting goal:', error);
      throw error;
    }
  },

  /**
   * Get the latest measurement of a specific type
   */
  async getLatestMeasurement(patientId: string, measurementType: string): Promise<Measurement | null> {
    try {
      const measurementData = await this.getMeasurements(patientId);

      if (!measurementData?.measurements || !measurementData.measurements[measurementType]) {
        return null;
      }

      const measurements = measurementData.measurements[measurementType];
      if (measurements.length === 0) {
        return null;
      }

      // Sort by date descending and return the most recent
      const sortedMeasurements = [...measurements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      return sortedMeasurements[0] || null;
    } catch (error) {
      console.error('Error getting latest measurement:', error);
      throw error;
    }
  },

  /**
   * Calculate progress towards a goal
   */
  async calculateProgress(
    patientId: string, 
    goalType: string, 
    measurementType: string
  ): Promise<{
    percentage: number;
    hasGoal: boolean;
    goalValue?: number | string;
    initialValue?: number | string;
    currentValue?: number | string;
  }> {
    try {
      const measurementData = await this.getMeasurements(patientId);

      if (!measurementData?.goals || !measurementData.goals[goalType]) {
        return { percentage: 0, hasGoal: false };
      }

      const goalValue = measurementData.goals[goalType];

      // Get measurements
      const measurements = measurementData.measurements?.[measurementType];
      if (!measurements || measurements.length === 0) {
        return { percentage: 0, hasGoal: true, goalValue };
      }

      // Sort by date
      const sortedMeasurements = [...measurements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const initialValue = sortedMeasurements[0]?.value;
      const currentValue = sortedMeasurements[sortedMeasurements.length - 1]?.value;

      // Calculate progress (example for weight loss)
      let percentage = 0;

      if (typeof goalValue === 'number' && typeof initialValue === 'number' && typeof currentValue === 'number') {
        // For weight loss goals
        if (measurementType === 'weight' && initialValue > goalValue) {
          const totalNeededLoss = initialValue - goalValue;
          const actualLoss = initialValue - currentValue;
          percentage = Math.min(100, Math.max(0, (actualLoss / totalNeededLoss) * 100));
        }
        // For improvement goals (ratings, etc.)
        else if (goalValue > initialValue) {
          const totalNeededGain = goalValue - initialValue;
          const actualGain = currentValue - initialValue;
          percentage = Math.min(100, Math.max(0, (actualGain / totalNeededGain) * 100));
        }
      }

      return {
        percentage,
        hasGoal: true,
        goalValue,
        initialValue,
        currentValue,
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      throw error;
    }
  },

  /**
   * Get measurement history for a specific type
   */
  async getMeasurementHistory(
    patientId: string, 
    measurementType: string, 
    limitCount: number = 50
  ): Promise<Measurement[]> {
    try {
      const measurementData = await this.getMeasurements(patientId);

      if (!measurementData?.measurements || !measurementData.measurements[measurementType]) {
        return [];
      }

      const measurements = measurementData.measurements[measurementType];
      
      // Sort by date descending and limit results
      return [...measurements]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting measurement history:', error);
      throw error;
    }
  },

  /**
   * Extract measurements from form submission data
   */
  extractMeasurementsFromForm(formData: Record<string, any>): {
    measurements: Array<{ type: string; value: any; notes?: string; photoUrl?: string }>;
    photos: Array<{ type: string; file: File }>;
  } {
    const measurements: Array<{ type: string; value: any; notes?: string; photoUrl?: string }> = [];
    const photos: Array<{ type: string; file: File }> = [];

    // Extract weight measurements
    if (formData.weight) {
      measurements.push({
        type: 'weight',
        value: parseFloat(formData.weight),
        notes: formData.weight_notes || undefined
      });
    }

    // Extract progress ratings
    Object.keys(formData).forEach(key => {
      if (key.includes('progress-rating') || key.includes('rating')) {
        measurements.push({
          type: key.replace('-', '_'),
          value: parseInt(formData[key]),
          notes: formData[`${key}_notes`] || undefined
        });
      }
    });

    // Extract progress photos
    Object.keys(formData).forEach(key => {
      if (key.includes('progress-photo') && formData[key] instanceof File) {
        photos.push({
          type: key.replace('-', '_'),
          file: formData[key]
        });
      }
    });

    return { measurements, photos };
  },

  /**
   * Process form submission and save measurements
   */
  async processFormSubmission(
    patientId: string, 
    formData: Record<string, any>, 
    serviceType?: string
  ): Promise<MeasurementData> {
    try {
      const { measurements, photos } = this.extractMeasurementsFromForm(formData);
      
      let result: MeasurementData | null = null;

      // Process each measurement
      for (const measurement of measurements) {
        result = await this.addMeasurement(
          patientId,
          measurement.type,
          measurement.value,
          serviceType,
          measurement.notes
        );
      }

      // TODO: Handle photo uploads (would need file storage service)
      // For now, we'll just log them
      if (photos.length > 0) {
        console.log('Photos to upload:', photos.map(p => ({ type: p.type, filename: p.file.name })));
      }

      // Return result or fetch current data
      if (result) {
        return result;
      }

      const existingData = await this.getMeasurements(patientId);
      if (existingData) {
        return existingData;
      }

      // Create new measurement data if none exists
      return {
        measurements: {},
        goals: {},
        patientId,
        serviceType: serviceType || undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    } catch (error) {
      console.error('Error processing form submission:', error);
      throw error;
    }
  }
};

export default measurementService;
