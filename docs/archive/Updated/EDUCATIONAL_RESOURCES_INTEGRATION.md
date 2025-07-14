# Educational Resources Integration

## Overview

This document outlines the integration of educational resources into the patient portal's modular interface. The integration enhances the patient experience by providing contextual educational content directly within each service module, making it easier for patients to access relevant information about their conditions, medications, and treatments.

## Implementation Details

### Components Created/Modified

1. **ServiceResourcesSection.jsx**
   - A new component that displays educational resources within a service module
   - Supports dynamic styling based on the service type's color scheme
   - Displays resource title, content type, reading time, and description
   - Links to the full resource detail page

2. **ModularServiceInterface.jsx**
   - Updated to include the ServiceResourcesSection component
   - Passes service-specific resources and styling to the section

3. **ModularPatientServicesPage.jsx**
   - Enhanced to fetch educational resources for each service type
   - Includes resources in the processed services data

4. **API Layer**
   - Added `getResourcesByServiceType` function to fetch resources by service type
   - Added `useResourcesByServiceType` hook for React components

### Data Flow

1. The `ModularPatientServicesPage` component fetches resources for each service type using the `useResourcesByServiceType` hook
2. Resources are added to the processed services data along with medications, action items, and recommendations
3. The `ModularServiceInterface` component receives the services data and passes the resources to the `ServiceResourcesSection` component
4. The `ServiceResourcesSection` component renders the resources with appropriate styling

### Service Type Mapping

Educational resources are mapped to service types based on categories:

- **Weight Management**: Resources in the "weight" category
- **Hair Loss**: Resources in the "hair" category
- **ED Treatment**: Resources in the "ed" category

## Benefits

1. **Contextual Information**: Patients can access relevant educational content directly within each service module
2. **Improved Patient Education**: Easy access to information about conditions, medications, and treatments
3. **Consistent User Experience**: Educational resources are presented with consistent styling and layout
4. **Reduced Navigation**: Patients don't need to navigate to a separate section to find relevant resources

## Future Enhancements

1. **Personalized Recommendations**: Enhance the resource recommendation algorithm to consider patient history and preferences
2. **Progress Tracking**: Track which resources a patient has viewed and provide progress indicators
3. **Interactive Content**: Add interactive elements like quizzes and assessments to educational resources
4. **Content Rating**: Allow patients to rate and provide feedback on educational resources
5. **Provider Recommendations**: Enable providers to recommend specific resources to patients

## Technical Considerations

1. **Performance**: Resources are fetched separately for each service type to avoid large data transfers
2. **Caching**: Resources are cached using React Query to minimize API calls
3. **Styling**: Resources inherit the color scheme of their parent service module for visual consistency
4. **Accessibility**: Resource cards include appropriate ARIA attributes and keyboard navigation

## Database Setup

The educational resources feature requires a database table to store the resources. The migration script is located at:

```
supabase/migrations/20240505000000_create_educational_resources.sql
```

### Applying the Migration

There are two ways to apply the migration:

#### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20240505000000_create_educational_resources.sql`
4. Paste into the SQL Editor and run the query

#### Option 2: Using the Command Line

If you have PostgreSQL client tools installed (`psql`), you can use the provided script:

```bash
./apply-educational-resources-migration.sh
```

This script will:
1. Read the database URL from the .env file
2. Apply the migration SQL to create the necessary tables
3. Insert sample educational resources for testing

> **Note:** If you encounter a "psql: command not found" error, you need to install the PostgreSQL client tools or use Option 1.

## Error Handling and Mock Data

The integration includes robust error handling to prevent application crashes if the educational resources database tables don't exist yet:

1. The `ModularPatientServicesPage` component captures errors from the resource hooks
2. Errors are logged to the console but don't prevent the rest of the application from functioning
3. The UI gracefully degrades by simply not showing educational resources when they're not available

Additionally, a mock data implementation has been added to provide sample educational resources when the database tables don't exist:

1. The `mockData.js` file contains sample educational resources for different categories
2. The API functions in `api.js` have been updated to use mock data when database queries fail
3. A console message "Using mock educational resources data. To use real data, apply the database migration." is displayed when mock data is used

This approach allows for a phased deployment where the UI components can be deployed before the database migration is applied, while still providing a complete user experience with sample data.

## Maintenance

When adding new service types or educational resource categories:

1. Update the `serviceTypeMapping` object in `getResourcesByServiceType` to include the new mapping
2. Ensure that resources have the appropriate category and content type tags
3. Test the integration by creating a new service of the appropriate type and verifying that relevant resources are displayed
4. If adding a completely new resource type, update the migration script and re-run it

## Related Files

- `src/components/patient/ServiceResourcesSection.jsx`
- `src/components/patient/ModularServiceInterface.jsx`
- `src/pages/patients/ModularPatientServicesPage.jsx`
- `src/apis/educationalResources/api.js`
- `src/apis/educationalResources/hooks.js`
