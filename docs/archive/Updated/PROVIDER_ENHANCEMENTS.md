# Provider Enhancements

This document outlines the enhancements made to the provider section of the admin interface, focusing on preparing for providers to become profiles with limited access compared to admins.

## Changes Implemented

### 1. Database Schema Updates

The provider table has been enhanced with the following new fields:

- **Professional Details**
  - `credentials`: Professional credentials (e.g., MD, NP, PA)
  - `license_number`: Professional license number
  - `biography`: Professional biography and background information
  - `profile_image_url`: URL to provider profile image

- **Availability Management**
  - `availability_status`: Current availability status (available, vacation, day_off)
  - `availability_start`: Start date of unavailability period
  - `availability_end`: End date of unavailability period

- **Role-Based Access Control**
  - `role`: Provider role (provider, admin)

### 2. Row-Level Security Policies

Security policies have been implemented to ensure proper access control:

- Admins have full access to all provider records
- Providers can view all provider records (for directory purposes)
- Providers can only update their own records

### 3. UI Enhancements

The provider management interface has been updated with:

- Tabbed interface for better organization of provider information
- Professional details section for credentials and biography
- Availability management with status indicators and date selection
- Improved state authorization selection with "Select All" and "Clear All" options

### 4. API Enhancements

New API hooks have been added:

- `useProvider`: Fetch a single provider by ID
- `useProvidersByRole`: Fetch providers filtered by role
- `useUpdateProviderAvailability`: Update provider availability status

## Future Considerations

As providers transition to becoming profiles with limited access, consider:

1. Creating a dedicated provider portal view that shows only relevant information
2. Implementing more granular permissions for different provider roles
3. Adding provider-specific dashboards showing assigned patients and upcoming sessions
4. Enhancing the availability calendar with more detailed scheduling options

## How to Apply the Migration

Run the following command to apply the database migration:

```bash
chmod +x apply-provider-migration.sh
./apply-provider-migration.sh
```

This will add the new columns to the providers table and set up the appropriate security policies.
