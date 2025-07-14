# Modular Patient Interface

This document outlines the modular patient interface approach implemented for Zappy Health, which allows patients to manage multiple health services through a unified dashboard.

## Overview

The modular patient interface provides a flexible architecture that:

1. Supports patients being enrolled in multiple health services simultaneously
2. Maintains service-specific content and functionality
3. Provides a consistent user experience across different health conditions
4. Scales easily as new services are added

## Database Structure

The modular approach is supported by the following database changes:

### Patient Service Enrollments Table

```sql
CREATE TABLE IF NOT EXISTS patient_service_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES patient_subscription(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, completed
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb, -- Service-specific settings
    UNIQUE(patient_id, service_id)
);
```

### Service Table Enhancements

```sql
ALTER TABLE services ADD COLUMN service_type VARCHAR(100);
ALTER TABLE services ADD COLUMN features JSONB DEFAULT '{}'::jsonb;
ALTER TABLE services ADD COLUMN resource_categories TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN product_categories TEXT[] DEFAULT '{}';
```

### Subscription Plan Enhancements

```sql
ALTER TABLE subscription_plans ADD COLUMN service_ids UUID[] DEFAULT '{}';
```

## Frontend Implementation

### Key Components

1. **Service Cards**: Display enrolled services with visual indicators for service type
2. **Service Tabs**: Allow switching between different enrolled services
3. **Service-Specific Content**: Dynamically load content based on the selected service
4. **Shared Components**: Reuse UI patterns across different services

### Visual Design Enhancements

The interface includes several visual enhancements inspired by Hims:

1. **High-Quality Imagery**:
   - Background images in service cards
   - Product photography for medications
   - Before/after visualization for treatment progress

2. **Visual Treatments**:
   - Gradient backgrounds with service-specific colors
   - Pattern overlays for visual interest
   - Consistent iconography for service types

3. **Interactive Elements**:
   - Video thumbnails with play indicators
   - Before/after slider for progress visualization
   - Horizontal scrolling for resources and products

4. **Mobile Optimizations**:
   - Responsive layouts that adapt to screen size
   - Touch-friendly scrolling with snap points
   - Simplified UI on smaller screens

## React Hooks

### usePatientEnrollments

This hook fetches all services a patient is enrolled in:

```javascript
export const usePatientEnrollments = (patientId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.lists({ patientId }),
    queryFn: async () => {
      if (!patientId) return [];
      
      // Fetch all enrollments for this patient with service details
      const { data, error } = await supabase
        .from('patient_service_enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          last_activity_at,
          settings,
          services:service_id (
            id,
            name,
            description,
            category,
            service_type,
            features,
            resource_categories,
            product_categories
          )
        `)
        .eq('patient_id', patientId)
        .order('enrolled_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching patient enrollments:', error);
        throw error;
      }
      
      return data.map(enrollment => ({
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        lastActivityAt: enrollment.last_activity_at,
        settings: enrollment.settings,
        service: enrollment.services
      }));
    },
    enabled: !!patientId,
    ...options,
  });
};
```

### usePatientServiceEnrollment

This hook fetches details for a specific service enrollment:

```javascript
export const usePatientServiceEnrollment = (patientId, serviceId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.details(patientId, serviceId),
    queryFn: async () => {
      if (!patientId || !serviceId) return null;
      
      // Fetch the specific enrollment with service details
      const { data, error } = await supabase
        .from('patient_service_enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          last_activity_at,
          settings,
          services:service_id (
            id,
            name,
            description,
            category,
            service_type,
            features,
            resource_categories,
            product_categories
          )
        `)
        .eq('patient_id', patientId)
        .eq('service_id', serviceId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No enrollment found
          return null;
        }
        console.error('Error fetching patient service enrollment:', error);
        throw error;
      }
      
      return {
        id: data.id,
        status: data.status,
        enrolledAt: data.enrolled_at,
        lastActivityAt: data.last_activity_at,
        settings: data.settings,
        service: data.services
      };
    },
    enabled: !!patientId && !!serviceId,
    ...options,
  });
};
```

## Integration with Existing Components

The modular interface integrates with existing components:

1. **MainLayout**: Uses the existing sidebar/bottom navigation
2. **PatientHomePage**: Enhanced to display the modular service interface
3. **Educational Resources**: Filtered based on the active service
4. **Product Recommendations**: Tailored to the active service

## Benefits

1. **Scalability**: Easily add new health services without major code changes
2. **Consistency**: Maintain a unified experience across different health conditions
3. **Personalization**: Tailor content and recommendations to each service
4. **Efficiency**: Reuse UI components across different services
5. **Engagement**: Provide a more visually appealing and interactive experience

## Next Steps

1. Implement the React components for the modular interface
2. Connect the interface to the database using the provided hooks
3. Add service-specific content for each health condition
4. Test the interface with users to gather feedback
5. Iterate on the design based on user feedback
